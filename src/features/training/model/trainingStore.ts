import { useEffect, useState } from 'react';
import {
  TRAINING_MOCK_VERSION,
  canDeleteCourse,
  normalizeCourseCommentConfig,
  initialCourseCategories,
  initialCourseCategoryTree,
  initialCourses,
  initialCourseware,
  initialCoursewareCategories,
  initialLearningRecords,
  type CourseCategoryNode,
  type CourseCategoryRecord,
  type CourseCommentConfig,
  type CourseRecord,
  type CourseStatus,
  type CoursewareRecord,
  type CoursewareCategoryNode,
  type CoursewarePublishStatus,
  type LearningRecord,
} from './training';
import {
  collectCategoryIds,
  canAddCategoryChild,
  findCategoryNode,
  findCategorySiblingContext,
  insertCategory,
  isSiblingNameTaken,
  removeCategoryFromTree,
  renameCategoryInTree,
  updateCategoryChildren,
} from '../../../shared/category-tree/categoryTree';

let mockVersion = TRAINING_MOCK_VERSION;
let courseCategories = [...initialCourseCategories];
let courseCategoryTree: CourseCategoryNode[] = [...initialCourseCategoryTree];
let courses = [...initialCourses];
let courseware = [...initialCourseware];
let coursewareCategories: CoursewareCategoryNode[] = [...initialCoursewareCategories];
let learningRecords = [...initialLearningRecords];
const listeners = new Set<() => void>();

const COMMENT_CONFIG_STORAGE_KEY = 'kangni.training.courseCommentConfigs.v1';

function loadPersistedCommentConfigs(): Record<string, CourseCommentConfig> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(COMMENT_CONFIG_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Partial<CourseCommentConfig>>;
    const next: Record<string, CourseCommentConfig> = {};
    for (const [id, value] of Object.entries(parsed)) {
      next[id] = normalizeCourseCommentConfig(value);
    }
    return next;
  } catch {
    return {};
  }
}

let persistedCommentConfigs: Record<string, CourseCommentConfig> = loadPersistedCommentConfigs();

function savePersistedCommentConfigs() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(COMMENT_CONFIG_STORAGE_KEY, JSON.stringify(persistedCommentConfigs));
  } catch {
    // ignore quota / private mode
  }
}

function applyPersistedCommentConfigs() {
  if (!Object.keys(persistedCommentConfigs).length) return;
  courses = courses.map((course) => {
    const saved = persistedCommentConfigs[String(course.id)];
    return saved ? { ...course, commentConfig: saved } : course;
  });
}

applyPersistedCommentConfigs();

function emit() {
  listeners.forEach((listener) => listener());
}

function syncMockData() {
  if (mockVersion === TRAINING_MOCK_VERSION) return;
  courseCategories = [...initialCourseCategories];
  courseCategoryTree = [...initialCourseCategoryTree];
  courses = [...initialCourses];
  courseware = [...initialCourseware];
  coursewareCategories = [...initialCoursewareCategories];
  learningRecords = [...initialLearningRecords];
  mockVersion = TRAINING_MOCK_VERSION;
  applyPersistedCommentConfigs();
  emit();
}

if (import.meta.hot) {
  import.meta.hot.accept('./training', (mod) => {
    if (!mod) return;
    courseCategories = [...mod.initialCourseCategories];
    courseCategoryTree = [...mod.initialCourseCategoryTree];
    courses = [...mod.initialCourses];
    courseware = [...mod.initialCourseware];
    coursewareCategories = [...mod.initialCoursewareCategories];
    learningRecords = [...mod.initialLearningRecords];
    mockVersion = mod.TRAINING_MOCK_VERSION;
    applyPersistedCommentConfigs();
    emit();
  });
}

function useTrainingList<T>(read: () => T[]) {
  const [list, setList] = useState<T[]>(() => read());
  useEffect(() => {
    syncMockData();
    setList(read());
    const onChange = () => setList(read());
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);
  return list;
}

export function useCourseCategories() {
  return useTrainingList(() => courseCategories);
}

export function useCourses() {
  return useTrainingList(() => courses);
}

export function getCourse(id: number): CourseRecord | undefined {
  syncMockData();
  return courses.find((item) => item.id === id);
}

export function getCourses(): CourseRecord[] {
  syncMockData();
  return [...courses];
}

export function getCourseCategoryTree(): CourseCategoryNode[] {
  syncMockData();
  return courseCategoryTree;
}

export function getCoursewareById(id: number): CoursewareRecord | undefined {
  syncMockData();
  return courseware.find((item) => item.id === id);
}

export function useCourseCategoryTree() {
  return useTrainingList(() => courseCategoryTree);
}

export function useCourseware() {
  return useTrainingList(() => courseware);
}

export function useCoursewareCategories() {
  return useTrainingList(() => coursewareCategories);
}

export function setCoursewarePublishStatus(ids: number[], status: CoursewarePublishStatus) {
  const idSet = new Set(ids);
  courseware = courseware.map((item) => (idSet.has(item.id) ? { ...item, publishStatus: status } : item));
  emit();
}

export function setCoursewareCategory(ids: number[], categoryId: number | null) {
  const idSet = new Set(ids);
  courseware = courseware.map((item) => (idSet.has(item.id) ? { ...item, categoryId } : item));
  emit();
}

export function getCoursewareCategoryUsage(categoryId: number): {
  coursewareCount: number;
  canDelete: boolean;
} {
  const node = findCategoryNode(coursewareCategories, categoryId);
  if (!node) {
    return { coursewareCount: 0, canDelete: false };
  }
  const idSet = new Set(collectCategoryIds([node]));
  const coursewareCount = courseware.filter(
    (item) => item.categoryId != null && idSet.has(item.categoryId),
  ).length;
  return {
    coursewareCount,
    canDelete: coursewareCount === 0,
  };
}

export function getCoursewareCategoryParentId(id: number): number | null {
  return findCategorySiblingContext(coursewareCategories, id)?.parentId ?? null;
}

export function getCoursewareCategorySiblingIndex(id: number): { index: number; total: number } | null {
  const ctx = findCategorySiblingContext(coursewareCategories, id);
  if (!ctx) return null;
  return { index: ctx.index, total: ctx.siblings.length };
}

export function isCoursewareCategoryNameTaken(name: string, parentId: number | null, excludeId?: number): boolean {
  return isSiblingNameTaken(coursewareCategories, name, parentId, excludeId);
}

export function addCoursewareCategory(name: string, parentId: number | null = null): CoursewareCategoryNode | null {
  if (!canAddCategoryChild(coursewareCategories, parentId)) return null;
  const node: CoursewareCategoryNode = { id: Date.now(), name };
  if (parentId == null) {
    coursewareCategories = [...coursewareCategories, node];
  } else {
    coursewareCategories = insertCategory(coursewareCategories, parentId, node);
  }
  emit();
  return node;
}

export function renameCoursewareCategory(id: number, name: string): boolean {
  if (!findCategoryNode(coursewareCategories, id)) return false;
  coursewareCategories = renameCategoryInTree(coursewareCategories, id, name);
  emit();
  return true;
}

export function moveCoursewareCategory(id: number, direction: 'up' | 'down'): boolean {
  const ctx = findCategorySiblingContext(coursewareCategories, id);
  if (!ctx) return false;
  const targetIndex = direction === 'up' ? ctx.index - 1 : ctx.index + 1;
  if (targetIndex < 0 || targetIndex >= ctx.siblings.length) return false;

  const reorder = (list: CoursewareCategoryNode[]) => {
    const next = [...list];
    [next[ctx.index], next[targetIndex]] = [next[targetIndex], next[ctx.index]];
    return next;
  };

  if (ctx.parentId == null) {
    coursewareCategories = reorder(coursewareCategories);
  } else {
    coursewareCategories = updateCategoryChildren(coursewareCategories, ctx.parentId, reorder);
  }
  emit();
  return true;
}

export function removeCoursewareCategory(id: number): boolean {
  if (!findCategoryNode(coursewareCategories, id)) return false;
  if (!getCoursewareCategoryUsage(id).canDelete) return false;
  coursewareCategories = removeCategoryFromTree(coursewareCategories, id);
  emit();
  return true;
}

export function useLearningRecords() {
  return useTrainingList(() => learningRecords);
}

export function upsertCourseCategory(category: CourseCategoryRecord) {
  const current = courseCategories.find((item) => item.id === category.id);
  courseCategories = current
    ? courseCategories.map((item) => (item.id === category.id ? category : item))
    : [category, ...courseCategories];
  emit();
}

export function removeCourseCategory(id: number) {
  courseCategories = courseCategories.filter((item) => item.id !== id);
  emit();
}

export function setCourseCategoryStatus(ids: number[], status: CourseCategoryRecord['status']) {
  const idSet = new Set(ids);
  courseCategories = courseCategories.map((item) => (idSet.has(item.id) ? { ...item, status } : item));
  emit();
}

export function upsertCourse(course: CourseRecord) {
  const current = courses.find((item) => item.id === course.id);
  courses = current ? courses.map((item) => (item.id === course.id ? course : item)) : [course, ...courses];
  emit();
}

export function getCourseCommentConfig(courseId: number): CourseCommentConfig {
  return normalizeCourseCommentConfig(getCourse(courseId)?.commentConfig);
}

export function updateCourseCommentConfig(courseId: number, commentConfig: CourseCommentConfig): boolean {
  const current = getCourse(courseId);
  if (!current) return false;
  const normalized = normalizeCourseCommentConfig(commentConfig);
  upsertCourse({ ...current, commentConfig: normalized });
  persistedCommentConfigs = { ...persistedCommentConfigs, [String(courseId)]: normalized };
  savePersistedCommentConfigs();
  return true;
}

/** Rebuild courses from mock seed while keeping persisted comment configs (HMR / version sync). */
export function rebuildCoursesFromMockKeepingCommentConfigs() {
  courses = [...initialCourses];
  applyPersistedCommentConfigs();
  emit();
}

export function useCourseCommentConfig(courseId: number): CourseCommentConfig {
  const [, setTick] = useState(0);
  useEffect(() => {
    syncMockData();
    const onChange = () => setTick((value) => value + 1);
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);
  return getCourseCommentConfig(courseId);
}

export function removeCourse(id: number): boolean {
  const target = courses.find((item) => item.id === id);
  if (!target || !canDeleteCourse(target)) return false;
  courses = courses.filter((item) => item.id !== id);
  emit();
  return true;
}

export function setCourseStatus(ids: number[], status: CourseStatus) {
  const idSet = new Set(ids);
  courses = courses.map((item) => (idSet.has(item.id) ? { ...item, status } : item));
  emit();
}

export function setCourseCategory(ids: number[], categoryId: number | null) {
  const idSet = new Set(ids);
  courses = courses.map((item) => (idSet.has(item.id) ? { ...item, categoryId } : item));
  emit();
}

export function getCourseCategoryUsage(categoryId: number): {
  courseCount: number;
  canDelete: boolean;
} {
  const node = findCategoryNode(courseCategoryTree, categoryId);
  if (!node) {
    return { courseCount: 0, canDelete: false };
  }
  const idSet = new Set(collectCategoryIds([node]));
  const courseCount = courses.filter((item) => item.categoryId != null && idSet.has(item.categoryId)).length;
  return {
    courseCount,
    canDelete: courseCount === 0,
  };
}

export function getCourseCategoryParentId(id: number): number | null {
  return findCategorySiblingContext(courseCategoryTree, id)?.parentId ?? null;
}

export function getCourseCategorySiblingIndex(id: number): { index: number; total: number } | null {
  const ctx = findCategorySiblingContext(courseCategoryTree, id);
  if (!ctx) return null;
  return { index: ctx.index, total: ctx.siblings.length };
}

export function isCourseCategoryNameTaken(name: string, parentId: number | null, excludeId?: number): boolean {
  return isSiblingNameTaken(courseCategoryTree, name, parentId, excludeId);
}

export function addCourseCategoryNode(name: string, parentId: number | null = null): CourseCategoryNode | null {
  if (!canAddCategoryChild(courseCategoryTree, parentId)) return null;
  const node: CourseCategoryNode = { id: Date.now(), name };
  if (parentId == null) {
    courseCategoryTree = [...courseCategoryTree, node];
  } else {
    courseCategoryTree = insertCategory(courseCategoryTree, parentId, node);
  }
  emit();
  return node;
}

export function renameCourseCategory(id: number, name: string): boolean {
  if (!findCategoryNode(courseCategoryTree, id)) return false;
  courseCategoryTree = renameCategoryInTree(courseCategoryTree, id, name);
  emit();
  return true;
}

export function moveCourseCategory(id: number, direction: 'up' | 'down'): boolean {
  const ctx = findCategorySiblingContext(courseCategoryTree, id);
  if (!ctx) return false;
  const targetIndex = direction === 'up' ? ctx.index - 1 : ctx.index + 1;
  if (targetIndex < 0 || targetIndex >= ctx.siblings.length) return false;

  const reorder = (list: CourseCategoryNode[]) => {
    const next = [...list];
    [next[ctx.index], next[targetIndex]] = [next[targetIndex], next[ctx.index]];
    return next;
  };

  if (ctx.parentId == null) {
    courseCategoryTree = reorder(courseCategoryTree);
  } else {
    courseCategoryTree = updateCategoryChildren(courseCategoryTree, ctx.parentId, reorder);
  }
  emit();
  return true;
}

export function removeCourseCategoryNode(id: number): boolean {
  if (!findCategoryNode(courseCategoryTree, id)) return false;
  if (!getCourseCategoryUsage(id).canDelete) return false;
  courseCategoryTree = removeCategoryFromTree(courseCategoryTree, id);
  emit();
  return true;
}

export function upsertCourseware(record: CoursewareRecord) {
  const current = courseware.find((item) => item.id === record.id);
  courseware = current ? courseware.map((item) => (item.id === record.id ? record : item)) : [record, ...courseware];
  emit();
}

export function removeCourseware(id: number): boolean {
  const target = courseware.find((item) => item.id === id);
  if (!target || target.publishStatus !== '草稿') return false;
  courseware = courseware.filter((item) => item.id !== id);
  emit();
  return true;
}

export function setCoursewareStatus(ids: number[], status: CoursewarePublishStatus) {
  const idSet = new Set(ids);
  courseware = courseware.map((item) => (idSet.has(item.id) ? { ...item, publishStatus: status } : item));
  emit();
}
