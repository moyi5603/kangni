import {
  courseCommentStatusLabel,
  formatCourseCommentDisplayTime,
  listVisibleComments,
} from '../../../training/model/courseCommentStore';
import { getCourseLikeCount } from '../../../training/model/courseEngagementStore';
import {
  findCategoryNode,
  type CategoryNode,
} from '../../../../shared/category-tree/categoryTree';
import {
  getCourse,
  getCourseCategoryTree,
  getCourses,
  getCoursewareById,
} from '../../../training/model/trainingStore';
import type { CourseRecord } from '../../../training/model/training';

export type ClientCourseCover = 'talk' | 'product' | 'account' | 'generic';

export type CourseCategoryNode = CategoryNode;

export type ClientCourse = {
  id: number;
  title: string;
  categoryId: number;
  tag: string;
  views: number;
  duration: string;
  cover: ClientCourseCover;
};

export type ClientCourseQuery = {
  keyword: string;
  categoryId: number | null;
};

export type SubTab = {
  id: number | 'all';
  name: string;
};

const COVER_TOKENS: ClientCourseCover[] = ['talk', 'product', 'account', 'generic'];

function firstTag(tags: string): string | undefined {
  const value = tags
    .split(/[,，]/)
    .map((item) => item.trim())
    .find(Boolean);
  return value;
}

function formatDurationSeconds(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function sumCatalogDuration(record: CourseRecord): string {
  const total = record.catalog.reduce((sum, item) => {
    const courseware = getCoursewareById(item.coursewareId);
    return sum + (courseware?.estimatedDurationSeconds ?? 0);
  }, 0);
  return total > 0 ? formatDurationSeconds(total) : '00:00';
}

function resolveCategoryName(categoryId: number | null): string | undefined {
  if (categoryId == null) return undefined;
  return findCategoryNode(getCourseCategoryTree(), categoryId)?.name;
}

function stripIntroParagraphs(introHtml: string): string[] {
  if (!introHtml.trim()) return [];
  const withBreaks = introHtml
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ');
  return withBreaks
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function findCategory(nodes: CourseCategoryNode[], id: number): CourseCategoryNode | undefined {
  return findCategoryNode(nodes, id);
}

export function collectCategoryIds(node: CourseCategoryNode): number[] {
  return [node.id, ...(node.children ?? []).flatMap(collectCategoryIds)];
}

export function maxCategoryDepth(nodes: CourseCategoryNode[], depth = 1): number {
  return nodes.reduce((max, node) => {
    if (!node.children?.length) return Math.max(max, depth);
    return Math.max(max, maxCategoryDepth(node.children, depth + 1));
  }, depth);
}

export function filterClientCourses(
  list: ClientCourse[],
  tree: CourseCategoryNode[],
  query: ClientCourseQuery,
): ClientCourse[] {
  const keyword = query.keyword.trim();
  if (query.categoryId != null) {
    const allowed = findCategory(tree, query.categoryId);
    if (!allowed) return [];
    const ids = new Set(collectCategoryIds(allowed));
    return list.filter((item) => {
      if (keyword && !item.title.includes(keyword)) return false;
      return ids.has(item.categoryId);
    });
  }
  return list.filter((item) => !keyword || item.title.includes(keyword));
}

export type CourseFilterPath = {
  l1Id: number | null;
  l2Id: number | 'all';
  l3Id: number | 'all';
};

function tabsOf(tree: CourseCategoryNode[], id: number | null | 'all'): SubTab[] {
  if (id == null || id === 'all') return [];
  const node = findCategory(tree, id);
  const children = node?.children ?? [];
  if (children.length === 0) return [];
  return [{ id: 'all', name: '全部' }, ...children.map((child) => ({ id: child.id, name: child.name }))];
}

export function l2Tabs(tree: CourseCategoryNode[], l1Id: number | null): SubTab[] {
  return tabsOf(tree, l1Id);
}

export function l3Options(tree: CourseCategoryNode[], l2Id: number | 'all'): SubTab[] {
  return tabsOf(tree, l2Id);
}

export function resolveFilterId(path: CourseFilterPath): number | null {
  if (path.l1Id == null) return null;
  if (path.l3Id !== 'all') return path.l3Id;
  if (path.l2Id !== 'all') return path.l2Id;
  return path.l1Id;
}

export function pathAfterSelectingL1(l1Id: number | null): CourseFilterPath {
  return { l1Id, l2Id: 'all', l3Id: 'all' };
}

export type CourseLesson = {
  id: number;
  title: string;
  duration: string;
  learned: number;
  cover: ClientCourseCover;
};

export type CourseComment = {
  id: number;
  author: string;
  text: string;
  time: string;
  statusLabel: string | null;
};

export type CourseLearning = {
  courseId: number;
  intro: string[];
  progress: number;
  lessons: CourseLesson[];
  comments: CourseComment[];
};

export function toClientCourse(record: CourseRecord, categoryName?: string): ClientCourse {
  const tag = firstTag(record.tags) ?? categoryName ?? record.type;
  const likes = getCourseLikeCount(record.id);
  const views = likes > 0 ? likes : 20 + (record.id * 7) % 40;
  return {
    id: record.id,
    title: record.name,
    categoryId: record.categoryId ?? 0,
    tag,
    views,
    duration: sumCatalogDuration(record),
    cover: COVER_TOKENS[record.id % COVER_TOKENS.length],
  };
}

export function listPublishedClientCourses(): ClientCourse[] {
  return getCourses()
    .filter((item) => item.status === '已发布')
    .map((item) => toClientCourse(item, resolveCategoryName(item.categoryId)));
}

export function getClientCourseCategoryTree(): CourseCategoryNode[] {
  return getCourseCategoryTree();
}

export function getClientCourse(id: number): ClientCourse | undefined {
  const record = getCourse(id);
  if (!record || record.status !== '已发布') return undefined;
  return toClientCourse(record, resolveCategoryName(record.categoryId));
}

export function getCourseLearning(id: number): CourseLearning | undefined {
  const record = getCourse(id);
  if (!record || record.status !== '已发布') return undefined;
  const client = toClientCourse(record, resolveCategoryName(record.categoryId));
  const intro = stripIntroParagraphs(record.introHtml);
  const lessons = record.catalog
    .map((item, index) => {
      const courseware = getCoursewareById(item.coursewareId);
      if (!courseware) return null;
      const seconds = courseware.estimatedDurationSeconds ?? 0;
      return {
        id: courseware.id,
        title: `${index + 1}.${courseware.name}`,
        duration: seconds > 0 ? formatDurationSeconds(seconds) : client.duration,
        learned: 0,
        cover: COVER_TOKENS[courseware.id % COVER_TOKENS.length],
      };
    })
    .filter((item): item is CourseLesson => item != null);
  const comments = listVisibleComments(id).map((item) => ({
    id: item.id,
    author: item.author,
    text: item.text,
    time: formatCourseCommentDisplayTime(item.createdAt),
    statusLabel: courseCommentStatusLabel(item.status),
  }));
  return {
    courseId: id,
    intro: intro.length > 0 ? intro : [`围绕「${record.name}」展开的学习内容。`],
    progress: 0,
    lessons:
      lessons.length > 0
        ? lessons
        : [
            {
              id: id * 10 + 1,
              title: `1.${record.name}`,
              duration: client.duration.replace(/^0+/, '') || client.duration,
              learned: 0,
              cover: client.cover,
            },
          ],
    comments,
  };
}
