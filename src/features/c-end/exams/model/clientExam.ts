import { collectCategoryIds, findCategoryNode, type CategoryNode } from '../../../../shared/category-tree/categoryTree';
import { calculateExamTotalScore, type ExamRecord, type ExamStatus } from '../../../exams/model/exam';
import { getExam, getExamCategoryTree, getExams } from '../../../exams/model/examStore';
import { getClientExamResult } from './clientExamResult';
import { getClientExamPaper } from './clientExamSession';

export type ClientExamResult = 'passed' | null;

export type ClientExam = {
  id: number;
  title: string;
  categoryId: number | null;
  totalScore: number | null;
  durationMinutes: number;
  startAt: string;
  endAt: string;
  examStatus: ExamStatus;
  result: ClientExamResult;
};

export const EXAM_PREP_RULE_TEXT =
  '本次考试开启了防切屏设置，切屏超过3次将会自动交卷(中途接打电话也属于切屏)';

export type ClientExamPrep = {
  id: number;
  title: string;
  totalScore: number;
  passScore: number;
  questionCount: number;
  durationMinutes: number;
  examTimes: number;
  remainingTimes: number;
  startAt: string;
  ruleText: string;
  descriptionHtml?: string;
};

export function hasExamDescriptionHtml(html: string | undefined): boolean {
  return (html ?? '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0;
}

export function canStartClientExam(remainingTimes: number): boolean {
  return remainingTimes > 0;
}

export type ExamStartCta = {
  enabled: boolean;
  label: string;
};

export function parseExamDateTime(value: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return Number.NaN;
  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6]),
  ).getTime();
}

export function getExamStartCta(
  prep: { startAt: string; remainingTimes: number },
  now = Date.now(),
): ExamStartCta {
  const startAt = parseExamDateTime(prep.startAt);
  if (Number.isFinite(startAt) && now < startAt) {
    return { enabled: false, label: '考试未开始' };
  }
  if (prep.remainingTimes <= 0) {
    return { enabled: false, label: '次数已用完' };
  }
  return { enabled: true, label: '开始考试' };
}

export type ClientExamQuery = {
  keyword: string;
  categoryId: number | null;
  hideEnded: boolean;
};

export type ExamCategoryPill = {
  id: number;
  name: string;
};

export type ExamSubTab = {
  id: number | 'all';
  name: string;
};

export type ExamFilterPath = {
  l1Id: number | null;
  l2Id: number | 'all';
  l3Id: number | 'all';
};

const PUBLISHED_DISPLAY_ORDER = [5, 6, 7, 8, 1, 2];

function resolveTotalScore(record: ExamRecord): number | null {
  if (typeof record.totalScore === 'number') return record.totalScore;
  if (record.questionRules?.length) return calculateExamTotalScore(record.questionRules);
  return null;
}

function toClientExam(record: ExamRecord): ClientExam {
  return {
    id: record.id,
    title: record.name,
    categoryId: record.categoryId,
    totalScore: resolveTotalScore(record),
    durationMinutes: record.durationMinutes,
    startAt: record.startAt,
    endAt: record.endAt,
    examStatus: record.examStatus,
    result: getClientExamResult(record.id)?.passed ? 'passed' : null,
  };
}

export function getClientExamPrep(examId: number): ClientExamPrep | undefined {
  const exam = getExam(examId);
  if (!exam || exam.publishStatus !== '已发布') return undefined;
  const examTimes = exam.examTimes ?? 5;
  return {
    id: exam.id,
    title: exam.name,
    totalScore: resolveTotalScore(exam) ?? 0,
    passScore: exam.passScore,
    questionCount: getClientExamPaper(examId)?.total ?? 0,
    durationMinutes: exam.durationMinutes,
    examTimes,
    remainingTimes: examTimes,
    startAt: exam.startAt,
    ruleText: EXAM_PREP_RULE_TEXT,
    descriptionHtml: exam.descriptionHtml,
  };
}

export function listPublishedClientExams(): ClientExam[] {
  return getExams()
    .filter((item) => item.publishStatus === '已发布')
    .map(toClientExam)
    .sort((left, right) => {
      const leftRank = PUBLISHED_DISPLAY_ORDER.indexOf(left.id);
      const rightRank = PUBLISHED_DISPLAY_ORDER.indexOf(right.id);
      return (leftRank === -1 ? 99 : leftRank) - (rightRank === -1 ? 99 : rightRank);
    });
}

export function flattenExamCategories(tree: CategoryNode[] = getExamCategoryTree()): ExamCategoryPill[] {
  const pills: ExamCategoryPill[] = [];
  const walk = (nodes: CategoryNode[]) => {
    for (const node of nodes) {
      pills.push({ id: node.id, name: node.name });
      if (node.children?.length) walk(node.children);
    }
  };
  walk(tree);
  return pills;
}

export function examL1Pills(tree: CategoryNode[] = getExamCategoryTree()): ExamCategoryPill[] {
  return tree.map((node) => ({ id: node.id, name: node.name }));
}

export function examChildPills(parentId: number, tree: CategoryNode[] = getExamCategoryTree()): ExamCategoryPill[] {
  return (findCategoryNode(tree, parentId)?.children ?? []).map((node) => ({ id: node.id, name: node.name }));
}

export function maxExamCategoryDepth(tree: CategoryNode[] = getExamCategoryTree(), depth = 1): number {
  return tree.reduce((max, node) => {
    if (!node.children?.length) return Math.max(max, depth);
    return Math.max(max, maxExamCategoryDepth(node.children, depth + 1));
  }, depth);
}

export function resolveExamFilterId(path: ExamFilterPath): number | null {
  if (path.l3Id !== 'all') return path.l3Id;
  if (path.l2Id !== 'all') return path.l2Id;
  return path.l1Id;
}

function tabsOf(tree: CategoryNode[], id: number | null | 'all'): ExamSubTab[] {
  if (id == null || id === 'all') return [];
  const children = findCategoryNode(tree, id)?.children ?? [];
  if (children.length === 0) return [];
  return [{ id: 'all', name: '全部' }, ...children.map((child) => ({ id: child.id, name: child.name }))];
}

export function examL2Tabs(l1Id: number | null, tree: CategoryNode[] = getExamCategoryTree()): ExamSubTab[] {
  return tabsOf(tree, l1Id);
}

export function examL3Options(l2Id: number | 'all', tree: CategoryNode[] = getExamCategoryTree()): ExamSubTab[] {
  return tabsOf(tree, l2Id);
}

export function pathAfterSelectingExamL1(l1Id: number | null): ExamFilterPath {
  return { l1Id, l2Id: 'all', l3Id: 'all' };
}

export function formatExamCardTime(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}:\d{2}:\d{2})$/.exec(value.trim());
  if (!match) return value;
  return `${match[2]}-${match[3]} ${match[4]}`;
}

export function formatExamCardRange(startAt: string, endAt: string): string {
  return `${formatExamCardTime(startAt)} ~ ${formatExamCardTime(endAt)}`;
}

export function filterClientExams(list: ClientExam[], query: ClientExamQuery): ClientExam[] {
  const keyword = query.keyword.trim();
  const node = query.categoryId == null ? undefined : findCategoryNode(getExamCategoryTree(), query.categoryId);
  const allowedIds = node ? new Set(collectCategoryIds([node])) : null;

  return list.filter((item) => {
    if (query.hideEnded && item.examStatus === '已结束') return false;
    if (keyword && !item.title.includes(keyword)) return false;
    if (allowedIds && (item.categoryId == null || !allowedIds.has(item.categoryId))) return false;
    return true;
  });
}
