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

export function listCourseNotes(): CourseNote[] {
  return notes
    .map(toCourseNote)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : b.id - a.id));
}

export function getCourseNote(id: number): CourseNote | undefined {
  const seed = notes.find((item) => item.id === id);
  return seed ? toCourseNote(seed) : undefined;
}

export function updateCourseNote(id: number, patch: { title: string; content: string }): boolean {
  const title = patch.title.trim();
  const content = patch.content.trim();
  if (!title || !content) return false;
  const index = notes.findIndex((item) => item.id === id);
  if (index < 0) return false;
  notes[index] = { ...notes[index], title, content };
  emit();
  return true;
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
