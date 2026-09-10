export type AssignMode = 'once' | 'rolling';
export type ProgressMode = 'accumulate' | 'daily';
export type DailyContent = 'fixed' | 'redraw';
export type QuizScope = 'cohort' | 'personal';
export type MapSkinId = 'island' | 'city' | 'minimal';
export type TaskType = 'course' | 'exam' | 'lecture' | 'quiz';
export type QuizMode = 'manual' | 'random';
export type PlanStatus = 'draft' | 'published';

export const MAP_SKINS: { id: MapSkinId; label: string }[] = [
  { id: 'island', label: '竖版岛屿' },
  { id: 'city', label: '城市路线' },
  { id: 'minimal', label: '简约节点' },
];

export type PlanTask = {
  id: string;
  type: TaskType;
  required: boolean;
  title: string;
  refId?: string;
  quizMode?: QuizMode;
  questionIds?: number[];
  bankId?: string;
  randomCount?: number;
};

export type PlanStage = {
  id: string;
  name: string;
  tasks: PlanTask[];
};

export type LearningPlan = {
  id: number;
  name: string;
  assignMode: AssignMode;
  progressMode: ProgressMode;
  dailyContent?: DailyContent;
  quizScope: QuizScope;
  quizPassRate: number;
  mapSkinId: MapSkinId;
  overtimeAllowed: boolean;
  taskSync: boolean;
  progressSync: boolean;
  status: PlanStatus;
  startAt: string;
  endAt: string;
  stages: PlanStage[];
};

export type QuizSeedInput = {
  planId: number;
  taskId: string;
  attemptNo: number;
  userId: string;
  naturalDate: string;
  progressMode: ProgressMode;
  dailyContent?: DailyContent;
  quizScope: QuizScope;
};

export function shanghaiDayKey(ms: number): string {
  const shifted = new Date(ms + 8 * 60 * 60 * 1000);
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}`;
}

export function quizSeedKey(input: QuizSeedInput): string {
  const parts = [String(input.planId), input.taskId];
  if (input.progressMode === 'daily' && input.dailyContent === 'redraw') {
    parts.push(input.naturalDate);
  }
  parts.push(String(input.attemptNo));
  if (input.quizScope === 'personal') parts.push(input.userId);
  return parts.join('|');
}

function mulberry32(str: string): () => number {
  let h = 1779033703;
  for (let i = 0; i < str.length; i += 1) h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
  let a = h >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickRandomIds(pool: number[], count: number, seed: string): number[] {
  if (pool.length < count) throw new Error('题目不足，联系管理员');
  const rng = mulberry32(seed);
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count).sort((a, b) => a - b);
}

export type LearnerProgress = {
  courseDone: Record<string, boolean>;
  lectureDone: Record<string, boolean>;
  examPassed: Record<string, boolean>;
  quizPassedDays: Record<string, string[]>;
};

export function isTaskPassed(
  task: PlanTask,
  progress: LearnerProgress,
  progressMode: ProgressMode,
  day: string,
): boolean {
  if (task.type === 'course') return Boolean(progress.courseDone[task.id]);
  if (task.type === 'lecture') return Boolean(progress.lectureDone[task.id]);
  if (task.type === 'exam') return Boolean(progress.examPassed[task.id]);
  const days = progress.quizPassedDays[task.id] ?? [];
  if (progressMode === 'accumulate') return days.length > 0;
  return days.includes(day);
}

export function stageRequiredPassed(
  stage: PlanStage,
  progress: LearnerProgress,
  progressMode: ProgressMode,
  day: string,
): boolean {
  return stage.tasks.filter((t) => t.required).every((t) => isTaskPassed(t, progress, progressMode, day));
}

/** 当前可进入的关卡下标；全部通关则返回 stages.length */
export function currentStageIndex(
  stages: PlanStage[],
  progress: LearnerProgress,
  progressMode: ProgressMode,
  day: string,
): number {
  const idx = stages.findIndex((stage) => !stageRequiredPassed(stage, progress, progressMode, day));
  return idx === -1 ? stages.length : idx;
}

export function canEnterStage(stageIndex: number, current: number): boolean {
  return stageIndex <= current;
}
