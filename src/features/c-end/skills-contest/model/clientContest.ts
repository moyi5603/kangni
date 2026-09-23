import { collectCategoryIds } from '../../../../shared/category-tree/categoryTree';
import { getQuestionStore } from '../../../exams/model/questionStore';
import {
  contestStatusOf,
  parseContestTime,
  regionPath,
  type ChallengeDayLog,
  type Contest,
  type ContestSignup,
  type ContestStage,
} from '../../../skills-contest/model/contest';
import { getChallengeDayLogs, getContestSignups } from '../../../skills-contest/model/contestStore';
import { getRegions } from '../../../skills-contest/model/regionStore';
import type { QuestionRecord } from '../../../exams/model/question';

export const DEMO_CONTEST_USER = {
  name: '王磊',
  phone: '13800001111',
};

export type ContestQuizQuestion = {
  id: string;
  stem: string;
  options: string[];
  answer: string;
};

export function east8Date(now: number = Date.now()): string {
  return new Date(now + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

export function formatContestRange(startAt: string, endAt: string): string {
  return `${startAt.slice(0, 16)} – ${endAt.slice(0, 16)}`;
}

export function remainHms(ms: number) {
  const safe = Math.max(0, ms);
  return {
    days: Math.floor(safe / 86400000),
    hours: Math.floor((safe % 86400000) / 3600000),
    minutes: Math.floor((safe % 3600000) / 60000),
    seconds: Math.floor((safe % 60000) / 1000),
  };
}

export function formatOpenExamAt(startAt: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/.exec(startAt);
  if (!match) return startAt;
  return `${match[2]}月${match[3]}日 ${match[4]}:${match[5]} 开考`;
}

export function nextContestCountdown(
  contest: { stages: Array<Pick<ContestStage, 'name' | 'startAt' | 'endAt'>> },
  now: number = Date.now(),
): { kicker: string; targetAt: string; targetMs: number } | null {
  const upcoming = contest.stages.find((stage) => parseContestTime(stage.startAt) > now);
  if (upcoming) {
    return { kicker: `距${upcoming.name}开始`, targetAt: upcoming.startAt, targetMs: parseContestTime(upcoming.startAt) };
  }
  const running = contest.stages.find((stage) => contestStatusOf(stage, now) === '进行中');
  if (running) {
    return { kicker: `距${running.name}结束`, targetAt: running.endAt, targetMs: parseContestTime(running.endAt) };
  }
  return null;
}

export function currentStage(contest: Contest, now: number = Date.now()): ContestStage | undefined {
  return contest.stages.find((stage) => contestStatusOf(stage, now) === '进行中') ?? contest.stages[0];
}

export function mySignup(contestId: number, signups: ContestSignup[] = getContestSignups(contestId)): ContestSignup | undefined {
  return signups.find(
    (row) => row.answers.姓名 === DEMO_CONTEST_USER.name || row.answers.手机号 === DEMO_CONTEST_USER.phone,
  );
}

export function canEnterChallenge(contest: Contest, signup: ContestSignup | undefined, now: number = Date.now()): boolean {
  if (!signup) return false;
  if (contestStatusOf(contest, now) !== '进行中') return false;
  const stage = currentStage(contest, now);
  return Boolean(stage && signup.eligibleStageIds.includes(stage.id));
}

export function regionLabel(regionId: number | null): string {
  if (regionId == null) return '—';
  const path = regionPath(getRegions(), regionId);
  return path.length ? path.map((item) => item.name).join(' / ') : '—';
}

export function passedGateCount(logs: ChallengeDayLog[]): number {
  return logs.reduce((sum, row) => sum + row.gates.filter((gate) => gate.passed).length, 0);
}

export function rankScores(passed: number): { points: number; credits: number } {
  return { points: passed * 50, credits: passed * 20 };
}

export type ContestRankRow = {
  signupId: number;
  name: string;
  region: string;
  passed: number;
  points: number;
  credits: number;
  rank: number;
  isMe: boolean;
};

export function contestRankBoard(contestId: number): ContestRankRow[] {
  const signups = getContestSignups(contestId);
  const logs = getChallengeDayLogs(contestId);
  const rows = signups
    .map((row) => {
      const passed = passedGateCount(logs.filter((item) => item.signupId === row.id));
      const score = rankScores(passed);
      return {
        signupId: row.id,
        name: row.answers.姓名 || '选手',
        region: regionLabel(row.regionId),
        passed,
        points: score.points,
        credits: score.credits,
        isMe: row.answers.姓名 === DEMO_CONTEST_USER.name,
      };
    })
    .sort((a, b) => b.points - a.points || b.credits - a.credits || b.passed - a.passed || a.signupId - b.signupId);
  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
}

export function todayGateLog(
  contestId: number,
  stageId: string,
  signupId: number,
  date: string = east8Date(),
): ChallengeDayLog | undefined {
  return getChallengeDayLogs(contestId).find(
    (item) => item.stageId === stageId && item.signupId === signupId && item.date === date,
  );
}

export function contestGateState(
  index: number,
  gates: { passed?: boolean }[] | undefined,
  count: number,
): 'passed' | 'here' | 'locked' {
  const current = Array.from({ length: count }).findIndex((_, i) => !gates?.[i]?.passed);
  const here = current < 0 ? Math.max(0, count - 1) : current;
  if (gates?.[index]?.passed) return 'passed';
  if (index === here) return 'here';
  return 'locked';
}

export function contestTrailSpot(index: number, count: number): { x: number; y: number } {
  const t = count <= 1 ? 0 : index / (count - 1);
  return {
    x: index % 2 === 0 ? 26 : 70,
    y: 84 - t * 66,
  };
}

export type WrongBookMode = 'remain' | 'hard' | 'all';

export function wrongBookStats(items: { practiced?: boolean }[]) {
  const total = items.length;
  const practiced = items.filter((item) => item.practiced).length;
  return { total, practiced, remain: total - practiced };
}

export function filterWrongBook<T extends { missCount?: number; practiced?: boolean }>(
  items: T[],
  mode: WrongBookMode,
): T[] {
  if (mode === 'remain') return items.filter((item) => !item.practiced);
  if (mode === 'hard') return items.filter((item) => (item.missCount ?? 1) >= 2);
  return items;
}

function fallbackQuestions(count: number): ContestQuizQuestion[] {
  const bank: ContestQuizQuestion[] = [
    { id: 'q1', stem: '一线技能作业前，首先要确认什么？', options: ['工装是否好看', '安全措施是否到位', '是否能提前下班', '工具颜色'], answer: '安全措施是否到位' },
    { id: 'q2', stem: '发现设备异常时应立即？', options: ['继续赶工', '停机并上报', '自行拆机', '忽略小故障'], answer: '停机并上报' },
    { id: 'q3', stem: '交接班最关键的信息是？', options: ['午餐口味', '未完成隐患', '同事八卦', '加班餐'], answer: '未完成隐患' },
    { id: 'q4', stem: '标准作业指导书的作用是？', options: ['装饰墙面', '统一操作步骤', '替代培训', '减少沟通'], answer: '统一操作步骤' },
    { id: 'q5', stem: '质量问题闭环要做到？', options: ['发现即结束', '原因对策验证', '只拍照', '只罚款'], answer: '原因对策验证' },
  ];
  return Array.from({ length: count }, (_, index) => bank[index % bank.length]!);
}

function toQuiz(question: QuestionRecord): ContestQuizQuestion | undefined {
  const options = question.options?.filter(Boolean) ?? [];
  if (question.type === '判断') {
    return {
      id: `p-${question.id}`,
      stem: question.stem,
      options: ['正确', '错误'],
      answer: question.answer === '错误' ? '错误' : '正确',
    };
  }
  if (!options.length || !question.answer) return undefined;
  return { id: `p-${question.id}`, stem: question.stem, options, answer: question.answer };
}

export function buildGatePaper(stage: ContestStage): ContestQuizQuestion[] {
  const count = Math.max(1, stage.questionsPerGate);
  const store = getQuestionStore('practice');
  const tree = store.getCategoryTree();
  const enabled = store.listQuestions().filter((item) => item.status === '启用');
  const categorySet = new Set(collectCategoryIds(tree).filter((id) => stage.categoryIds.includes(id)));
  const picked =
    stage.drawMode === 'picked'
      ? enabled.filter((item) => stage.questionIds.includes(item.id))
      : enabled.filter((item) => item.categoryId != null && (categorySet.has(item.categoryId) || stage.categoryIds.includes(item.categoryId)));
  const quiz = picked.map(toQuiz).filter((item): item is ContestQuizQuestion => Boolean(item));
  if (quiz.length >= count) return quiz.slice(0, count);
  return [...quiz, ...fallbackQuestions(count - quiz.length)].slice(0, count);
}

export function summarizeGate(
  paper: ContestQuizQuestion[],
  answers: Record<string, string>,
  passCorrectCount: number,
  durationSeconds: number,
): {
  passed: boolean;
  correctCount: number;
  total: number;
  passCorrectCount: number;
  accuracy: number;
  score: number;
  durationSeconds: number;
} {
  const total = paper.length;
  const correctCount = paper.filter((item) => answers[item.id] === item.answer).length;
  const passed = correctCount >= passCorrectCount;
  const accuracy = total ? Math.round((correctCount / total) * 100) : 0;
  return {
    passed,
    correctCount,
    total,
    passCorrectCount,
    accuracy,
    score: accuracy,
    durationSeconds: Math.max(1, Math.round(durationSeconds)),
  };
}

export function gradeGate(paper: ContestQuizQuestion[], answers: Record<string, string>, passCorrectCount: number): boolean {
  return summarizeGate(paper, answers, passCorrectCount, 1).passed;
}

export type ContestWrongDraft = ContestQuizQuestion & { picked: string };

export function collectWrongAnswers(paper: ContestQuizQuestion[], answers: Record<string, string>): ContestWrongDraft[] {
  return paper
    .filter((item) => answers[item.id] && answers[item.id] !== item.answer)
    .map((item) => ({ ...item, picked: answers[item.id]! }));
}
