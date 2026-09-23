import { collectCategoryIds, type CategoryNode } from '../../../shared/category-tree/categoryTree';
import type { SignupField } from '../../activities/model/signupFields';

export type ContestStatus = '未开始' | '进行中' | '已结束';
export type ContestAccess = 'public' | 'tenant';
export type ContestPageKey = 'none' | 'home' | 'detail' | 'signup' | 'challenge';
export type ContestDrawMode = 'random' | 'picked';
export type ContestMapId = 'island' | 'city' | 'factory';

export const CONTEST_STATUS_OPTIONS: ContestStatus[] = ['未开始', '进行中', '已结束'];
export const CONTEST_ACCESS_OPTIONS: ContestAccess[] = ['tenant', 'public'];
export const CONTEST_PAGE_OPTIONS: ContestPageKey[] = ['none', 'home', 'detail', 'signup', 'challenge'];
export const CONTEST_MAPS: { id: ContestMapId; label: string; imageUrl: string }[] = [
  { id: 'island', label: '岛屿闯关', imageUrl: '/contest-maps/island.svg' },
  { id: 'city', label: '城市路线', imageUrl: '/contest-maps/city.svg' },
  { id: 'factory', label: '车间通道', imageUrl: '/contest-maps/factory.svg' },
];
export const CONTEST_MAP_IDS: ContestMapId[] = CONTEST_MAPS.map((item) => item.id);

export const contestMapOf = (id: ContestMapId) => CONTEST_MAPS.find((item) => item.id === id);

export const contestPageLabel = (key: ContestPageKey): string =>
  ({
    none: '不关联',
    home: '技能大赛首页',
    detail: '赛事详情',
    signup: '报名页',
    challenge: '闯关页',
  })[key];

export const contestAccessLabel = (access: ContestAccess): string =>
  access === 'public' ? '公开' : '仅租户成员';

export const contestMapLabel = (id: ContestMapId): string =>
  CONTEST_MAPS.find((item) => item.id === id)?.label ?? id;

export type RegionLevel = 'province' | 'city' | 'district';

export const REGION_LEVEL_LABEL: Record<RegionLevel, string> = {
  province: '省',
  city: '市',
  district: '区',
};

export type Region = {
  id: number;
  name: string;
  parentId: number | null;
  sort: number;
  enabled: boolean;
};

export type RegionTreeNode = Region & { children?: RegionTreeNode[] };

export type ContestStage = {
  id: string;
  name: string;
  startAt: string;
  endAt: string;
  drawMode: ContestDrawMode;
  categoryIds: number[];
  questionIds: number[];
  dailyGateCount: number;
  questionsPerGate: number;
  passCorrectCount: number;
  mapId: ContestMapId;
  learningPlanIds: number[];
};

export type ContestSignupField = SignupField | (Omit<SignupField, 'inputType'> & { inputType: 'region' });

export type Contest = {
  id: number;
  name: string;
  logoUrl: string;
  description: string;
  startAt: string;
  endAt: string;
  stages: ContestStage[];
  signupFields: ContestSignupField[];
  h5Page: ContestPageKey;
  pcPage: ContestPageKey;
  access: ContestAccess;
};

export type ContestDraft = Contest;

export type ContestSignup = {
  id: number;
  contestId: number;
  answers: Record<string, string>;
  regionId: number | null;
  eligibleStageIds: string[];
  createdAt: string;
};

export const DAILY_GATE_COUNT_MIN = 1;
export const DAILY_GATE_COUNT_MAX = 8;

export type ChallengeGateCell = {
  attempts: number;
  passed: boolean;
};

export type ChallengeDayLog = {
  id: number;
  contestId: number;
  stageId: string;
  signupId: number;
  date: string;
  gates: ChallengeGateCell[];
};

export type ContestWrongItem = {
  id: number;
  contestId: number;
  signupId: number;
  stageId: string;
  questionKey: string;
  stem: string;
  options: string[];
  answer: string;
  picked: string;
  createdAt: string;
  missCount: number;
  practiced: boolean;
};

export type ChallengeFields = Pick<
  ContestStage,
  'drawMode' | 'categoryIds' | 'questionIds' | 'dailyGateCount' | 'questionsPerGate' | 'passCorrectCount' | 'mapId'
>;

export function formatChallengeGateCell(cell: ChallengeGateCell | undefined): string {
  if (!cell || cell.attempts === 0) return '—';
  return `闯 ${cell.attempts} 次 / ${cell.passed ? '通过' : '未通过'}`;
}

export function challengeLogColumnCount(
  stages: { id: string; dailyGateCount: number }[],
  stageId: string | 'all',
): number {
  const scoped = stageId === 'all' ? stages : stages.filter((item) => item.id === stageId);
  const n = Math.max(0, ...scoped.map((item) => item.dailyGateCount));
  return Math.min(DAILY_GATE_COUNT_MAX, n);
}

export function filterChallengeDayLogs(
  logs: ChallengeDayLog[],
  signups: ContestSignup[],
  query: { name: string; date: string; stageId: string | 'all' },
): ChallengeDayLog[] {
  const byId = new Map(signups.map((item) => [item.id, item]));
  return logs.filter((log) => {
    if (query.stageId !== 'all' && log.stageId !== query.stageId) return false;
    if (query.date && log.date !== query.date) return false;
    if (query.name) {
      const person = byId.get(log.signupId)?.answers['姓名'] ?? '';
      if (!person.includes(query.name)) return false;
    }
    return true;
  });
}

export function parseContestTime(value: string): number {
  return Date.parse(value.replace(' ', 'T') + '+08:00');
}

export function contestStatusOf(item: Pick<Contest, 'startAt' | 'endAt'>, now: number = Date.now()): ContestStatus {
  const start = parseContestTime(item.startAt);
  const end = parseContestTime(item.endAt);
  if (now < start) return '未开始';
  if (now > end) return '已结束';
  return '进行中';
}

export function defaultChallengeFields(): ChallengeFields {
  return {
    drawMode: 'random',
    categoryIds: [],
    questionIds: [],
    dailyGateCount: 1,
    questionsPerGate: 5,
    passCorrectCount: 3,
    mapId: 'island',
  };
}

export function newStageId(): string {
  return `st-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyStage(name = '初赛'): ContestStage {
  return {
    id: newStageId(),
    name,
    startAt: '',
    endAt: '',
    ...defaultChallengeFields(),
    learningPlanIds: [],
  };
}

export function appendStagePlanIds(existing: number[], added: number[]): number[] {
  const seen = new Set(existing);
  const next = [...existing];
  for (const id of added) {
    if (seen.has(id)) continue;
    seen.add(id);
    next.push(id);
  }
  return next;
}

export function removeStagePlanId(existing: number[], planId: number): number[] {
  return existing.filter((id) => id !== planId);
}

export function publishedPlansForPicker<T extends { id: number; status: string }>(plans: T[], already: number[]): T[] {
  const skip = new Set(already);
  return plans.filter((item) => item.status === 'published' && !skip.has(item.id));
}

export function stagePlanIdsOf(stage: Pick<ContestStage, 'learningPlanIds'>): number[] {
  return stage.learningPlanIds ?? [];
}

export function validateContestDraft(item: ContestDraft, takenNames: string[]): string | undefined {
  const name = item.name.trim();
  if (!name) return '请输入大赛名称';
  if (name.length > 50) return '大赛名称不超过 50 字';
  if (takenNames.includes(name)) return '大赛名称不能重复';
  if (!item.logoUrl.trim()) return '请上传大赛 Logo';
  if (item.description.length > 500) return '描述不超过 500 字';
  if (!item.startAt || !item.endAt) return '请选择举办时间';
  if (parseContestTime(item.endAt) < parseContestTime(item.startAt)) return '结束时间不能早于开始时间';
  if (!item.stages.length) return '请至少添加一个阶段';
  const names = new Set<string>();
  const contestStart = parseContestTime(item.startAt);
  const contestEnd = parseContestTime(item.endAt);
  for (const stage of item.stages) {
    const stageName = stage.name.trim();
    if (!stageName) return '请填写阶段名称';
    if (stageName.length > 20) return '阶段名称不超过 20 字';
    if (names.has(stageName)) return '同一赛事内阶段名称不能重复';
    names.add(stageName);
    if (!stage.startAt || !stage.endAt) return '请填写阶段时间';
    const start = parseContestTime(stage.startAt);
    const end = parseContestTime(stage.endAt);
    if (end < start) return '阶段结束时间不能早于开始时间';
    if (start < contestStart || end > contestEnd) return '阶段时间须落在举办时间内';
  }
  for (let i = 0; i < item.stages.length; i += 1) {
    for (let j = i + 1; j < item.stages.length; j += 1) {
      const a = item.stages[i];
      const b = item.stages[j];
      const aStart = parseContestTime(a.startAt);
      const aEnd = parseContestTime(a.endAt);
      const bStart = parseContestTime(b.startAt);
      const bEnd = parseContestTime(b.endAt);
      if (aStart < bEnd && bStart < aEnd) return '阶段时间不可重叠';
    }
  }
  return undefined;
}

export function validateChallengeStage(
  stage: ChallengeFields,
  tree: CategoryNode[],
  _enabledQuestionIds: number[],
): string | undefined {
  if (!CONTEST_MAP_IDS.includes(stage.mapId)) return '请选择闯关地图';
  if (!stage.categoryIds.length) return '请选择习题分类';
  const known = new Set(collectCategoryIds(tree));
  if (stage.categoryIds.some((id) => !known.has(id))) return '习题分类已失效，请重新选择';
  if (
    !Number.isInteger(stage.dailyGateCount) ||
    stage.dailyGateCount < DAILY_GATE_COUNT_MIN ||
    stage.dailyGateCount > DAILY_GATE_COUNT_MAX
  ) {
    return `每日关卡数量须为 ${DAILY_GATE_COUNT_MIN}–${DAILY_GATE_COUNT_MAX}`;
  }
  if (!Number.isInteger(stage.questionsPerGate) || stage.questionsPerGate < 1 || stage.questionsPerGate > 50) {
    return '每关题数须为 1–50';
  }
  if (
    !Number.isInteger(stage.passCorrectCount) ||
    stage.passCorrectCount < 1 ||
    stage.passCorrectCount > stage.questionsPerGate
  ) {
    return '答对题数不能大于每关题数';
  }
  if (stage.drawMode === 'picked' && stage.questionIds.length < stage.questionsPerGate) {
    return '指定题目数量不能少于每关题数';
  }
  return undefined;
}

export function validateAllChallenges(stages: ContestStage[], tree: CategoryNode[], enabledQuestionIds: number[]): string | undefined {
  for (const [index, stage] of stages.entries()) {
    const error = validateChallengeStage(stage, tree, enabledQuestionIds);
    if (error) return `阶段${index + 1}：${error}`;
  }
  return undefined;
}

export function defaultEligibleStageIds(stages: { id: string }[]): string[] {
  return stages[0] ? [stages[0].id] : [];
}

export function pruneEligibleStageIds(eligibleStageIds: string[], remainingIds: string[]): string[] {
  const keep = new Set(remainingIds);
  return eligibleStageIds.filter((id) => keep.has(id));
}

export function applyBatchEligibleStages(
  rows: ContestSignup[],
  selectedIds: number[],
  nextStageIds: string[],
): ContestSignup[] {
  const selected = new Set(selectedIds);
  return rows.map((row) => (selected.has(row.id) ? { ...row, eligibleStageIds: [...nextStageIds] } : row));
}

export function enabledRegions(regions: Region[]): Region[] {
  return [...regions].filter((item) => item.enabled).sort((a, b) => a.sort - b.sort || a.id - b.id);
}

export function regionParent(regions: Region[], id: number): Region | undefined {
  const node = regions.find((item) => item.id === id);
  if (!node?.parentId) return undefined;
  return regions.find((item) => item.id === node.parentId);
}

export function regionLevelOf(regions: Region[], id: number): RegionLevel {
  const parent = regionParent(regions, id);
  if (!parent) return 'province';
  if (!parent.parentId) return 'city';
  return 'district';
}

export function regionPath(regions: Region[], id: number): Region[] {
  const chain: Region[] = [];
  let current = regions.find((item) => item.id === id);
  const guard = new Set<number>();
  while (current && !guard.has(current.id)) {
    guard.add(current.id);
    chain.unshift(current);
    current = current.parentId ? regions.find((item) => item.id === current?.parentId) : undefined;
  }
  return chain;
}

export function regionChildren(regions: Region[], parentId: number | null): Region[] {
  return regions
    .filter((item) => item.parentId === parentId)
    .sort((a, b) => a.sort - b.sort || a.id - b.id);
}

export function regionHasChildren(regions: Region[], id: number): boolean {
  return regions.some((item) => item.parentId === id);
}

export function regionTree(regions: Region[], parentId: number | null = null): RegionTreeNode[] {
  return regionChildren(regions, parentId).map((item) => {
    const children = regionTree(regions, item.id);
    return children.length ? { ...item, children } : { ...item };
  });
}

export function regionSubtreeIds(regions: Region[], id: number): number[] {
  const ids = [id];
  for (const child of regionChildren(regions, id)) {
    ids.push(...regionSubtreeIds(regions, child.id));
  }
  return ids;
}

export function regionMatchesFilter(regions: Region[], signupRegionId: number | null, filterId: number): boolean {
  if (signupRegionId == null) return false;
  return regionSubtreeIds(regions, filterId).includes(signupRegionId);
}

export function isRegionNameTaken(regions: Region[], name: string, parentId: number | null, excludeId?: number): boolean {
  const trimmed = name.trim();
  return regions.some((item) => item.parentId === parentId && item.name === trimmed && item.id !== excludeId);
}

export function canDeleteRegion(
  regionId: number,
  signups: { regionId: number | null }[],
  regions: Region[] = [],
): boolean {
  if (regionHasChildren(regions, regionId)) return false;
  return !signups.some((item) => item.regionId === regionId);
}

export function parentOptionsForLevel(regions: Region[], level: RegionLevel): Region[] {
  if (level === 'province') return [];
  const want: RegionLevel = level === 'city' ? 'province' : 'city';
  return regions.filter((item) => regionLevelOf(regions, item.id) === want).sort((a, b) => a.sort - b.sort || a.id - b.id);
}

export function filterRegionForest(regions: Region[], match: (item: Region) => boolean): Region[] {
  const keep = new Set<number>();
  for (const item of regions) {
    if (!match(item)) continue;
    for (const node of regionPath(regions, item.id)) keep.add(node.id);
  }
  return regions.filter((item) => keep.has(item.id));
}

export function stageOrdinalLabel(index: number): string {
  const names = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  return `阶段${names[index] ?? String(index + 1)}`;
}

export function formatContestTimeRange(startAt: string, endAt: string): string {
  return `${startAt} ~ ${endAt}`;
}

export function regionDisplayName(regions: Region[], regionId: number | null): string {
  if (regionId == null) return '—';
  const path = regionPath(regions, regionId);
  if (path.length === 0) return '—';
  const label = path.map((item) => item.name).join(' / ');
  const leaf = path[path.length - 1];
  return leaf.enabled ? label : `${label}（已停用）`;
}
