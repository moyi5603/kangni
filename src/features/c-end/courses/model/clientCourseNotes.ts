import { useEffect, useState } from 'react';
import { getClientCourse } from './clientCourse';

export type CourseNoteSeed = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  courseId: number;
};

export type CourseNote = CourseNoteSeed & {
  courseName: string;
};

const INITIAL_NOTES: CourseNoteSeed[] = [
  {
    id: 1,
    title: '结构化表达三步',
    content: '结论先行，再补背景和依据。汇报时先说要对方做什么，再展开原因，避免从过程讲起。',
    createdAt: '2026-09-12 21:18',
    courseId: 1,
  },
  {
    id: 2,
    title: '跨部门对齐清单',
    content: '开会前先写目标、边界、截止时间。对齐后再分任务，减少会后扯皮。',
    createdAt: '2026-09-08 10:05',
    courseId: 1,
  },
  {
    id: 3,
    title: '开场破冰话术',
    content: '先问客户当前最急的一件事，再落到产品和案例，别一上来念稿。',
    createdAt: '2026-08-22 16:40',
    courseId: 2,
  },
];

let notes = cloneNotes(INITIAL_NOTES);
const listeners = new Set<() => void>();

function cloneNotes(rows: CourseNoteSeed[]): CourseNoteSeed[] {
  return rows.map((item) => ({ ...item }));
}

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function useStoreTick() {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((n) => n + 1)), []);
}

function toCourseNote(item: CourseNoteSeed): CourseNote {
  return {
    ...item,
    courseName: getClientCourse(item.courseId)?.title ?? '关联课程',
  };
}

const NOTE_TAGS = new Set(['b', 'strong', 'i', 'em', 'u', 's', 'strike', 'del', 'br', 'p', 'div', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'img']);

function escapeText(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(value: string) {
  return escapeText(value).replace(/"/g, '&quot;');
}

function isSafeImageSrc(src: string) {
  return /^data:image\/[a-z0-9.+-]+;base64,/i.test(src) || /^https?:\/\//i.test(src);
}

export function sanitizeNoteHtml(html: string): string {
  const source = html
    .trim()
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');
  if (!source) return '';
  if (!/<[a-z!/]/i.test(source)) return escapeText(source);
  return source.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (full, rawTag: string, attrs: string) => {
    const tag = rawTag.toLowerCase();
    if (!NOTE_TAGS.has(tag)) return '';
    if (full.startsWith('</')) return tag === 'br' || tag === 'img' ? '' : `</${tag}>`;
    if (tag === 'br') return '<br>';
    if (tag === 'img') {
      const matched = /src\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrs);
      const src = matched?.[1] ?? matched?.[2] ?? '';
      if (!isSafeImageSrc(src)) return '';
      return `<img src="${escapeAttr(src)}" alt="">`;
    }
    return `<${tag}>`;
  });
}

export function notePlainText(content: string): string {
  return sanitizeNoteHtml(content)
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h2|h3|li|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function noteContentIsEmpty(content: string): boolean {
  const html = sanitizeNoteHtml(content);
  return !/<img\b/i.test(html) && notePlainText(html).length === 0;
}

function formatNoteCreatedAt(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function listCourseNotes(): CourseNote[] {
  return notes
    .map(toCourseNote)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : b.id - a.id));
}

export function listCourseNotesByCourse(courseId: number): CourseNote[] {
  return listCourseNotes().filter((item) => item.courseId === courseId);
}

export function getCourseNote(id: number): CourseNote | undefined {
  const seed = notes.find((item) => item.id === id);
  return seed ? toCourseNote(seed) : undefined;
}

export function updateCourseNote(id: number, patch: { title: string; content: string }): boolean {
  const title = patch.title.trim();
  const content = sanitizeNoteHtml(patch.content);
  if (!title || noteContentIsEmpty(content)) return false;
  const index = notes.findIndex((item) => item.id === id);
  if (index < 0) return false;
  notes[index] = { ...notes[index], title, content };
  emit();
  return true;
}

export function createCourseNote(input: { courseId: number; title: string; content: string }): CourseNote | null {
  const title = input.title.trim();
  const content = sanitizeNoteHtml(input.content);
  if (!title || noteContentIsEmpty(content) || !getClientCourse(input.courseId)) return null;
  const id = notes.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const seed: CourseNoteSeed = {
    id,
    title,
    content,
    createdAt: formatNoteCreatedAt(),
    courseId: input.courseId,
  };
  notes = [seed, ...notes];
  emit();
  return toCourseNote(seed);
}

export function deleteCourseNote(id: number): boolean {
  const next = notes.filter((item) => item.id !== id);
  if (next.length === notes.length) return false;
  notes = next;
  emit();
  return true;
}

export function useCourseNotes(): CourseNote[] {
  useStoreTick();
  return listCourseNotes();
}

export function useCourseNote(id: number): CourseNote | undefined {
  useStoreTick();
  return getCourseNote(id);
}

export function __resetCourseNotesForTests() {
  notes = cloneNotes(INITIAL_NOTES);
  emit();
}
