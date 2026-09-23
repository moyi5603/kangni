import { useEffect, useState } from 'react';
import {
  applyBatchEligibleStages,
  defaultChallengeFields,
  pruneEligibleStageIds,
  type ChallengeDayLog,
  type Contest,
  type ContestSignup,
  type ContestWrongItem,
} from './contest';
import { defaultContestSignupFields } from './contestSignupFields';

const PLACEHOLDER_LOGO =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect fill="#2A56DE" width="64" height="64"/><text x="32" y="38" text-anchor="middle" fill="#fff" font-size="22">赛</text></svg>',
  );

function seedStages(): Contest['stages'] {
  return [
    {
      id: 's1',
      name: '初赛',
      startAt: '2026-09-01 09:00',
      endAt: '2026-09-30 18:00',
      ...defaultChallengeFields(),
      dailyGateCount: 3,
      categoryIds: [101],
      mapId: 'island',
      learningPlanIds: [1],
    },
    {
      id: 's2',
      name: '复赛',
      startAt: '2026-09-30 18:00',
      endAt: '2026-10-31 18:00',
      ...defaultChallengeFields(),
      dailyGateCount: 2,
      categoryIds: [102],
      mapId: 'city',
    },
  ];
}

const initialContests: Contest[] = [
  {
    id: 1,
    name: '2026 技能公开赛',
    logoUrl: PLACEHOLDER_LOGO,
    description: '面向一线技能岗位的闯关赛，分初赛与复赛。',
    startAt: '2026-09-01 09:00',
    endAt: '2026-10-31 18:00',
    stages: seedStages(),
    signupFields: defaultContestSignupFields(),
    h5Page: 'home',
    pcPage: 'detail',
    access: 'tenant',
  },
  {
    id: 2,
    name: '秋季班组长挑战赛',
    logoUrl: PLACEHOLDER_LOGO,
    description: '',
    startAt: '2026-11-01 09:00',
    endAt: '2026-12-15 18:00',
    stages: [
      {
        id: 't1',
        name: '选拔赛',
        startAt: '2026-11-01 09:00',
        endAt: '2026-12-15 18:00',
        ...defaultChallengeFields(),
      },
    ],
    signupFields: defaultContestSignupFields(),
    h5Page: 'none',
    pcPage: 'none',
    access: 'public',
  },
];

const initialSignups: ContestSignup[] = [
  {
    id: 1,
    contestId: 1,
    answers: { 姓名: '王磊', 手机号: '13800001111' },
    regionId: 8,
    eligibleStageIds: ['s1'],
    createdAt: '2026-09-02 10:12',
  },
  {
    id: 2,
    contestId: 1,
    answers: { 姓名: '陈芳', 手机号: '13800002222' },
    regionId: 11,
    eligibleStageIds: ['s1', 's2'],
    createdAt: '2026-09-03 09:40',
  },
  {
    id: 3,
    contestId: 1,
    answers: { 姓名: '刘洋' },
    regionId: 9,
    eligibleStageIds: ['s1'],
    createdAt: '2026-09-04 14:05',
  },
  {
    id: 4,
    contestId: 2,
    answers: { 姓名: '赵敏', 手机号: '13900003333' },
    regionId: 7,
    eligibleStageIds: ['t1'],
    createdAt: '2026-08-20 11:00',
  },
  {
    id: 5,
    contestId: 2,
    answers: { 姓名: '周宁' },
    regionId: 10,
    eligibleStageIds: ['t1'],
    createdAt: '2026-08-21 16:22',
  },
  {
    id: 6,
    contestId: 2,
    answers: { 姓名: '孙悦', 手机号: '13700004444' },
    regionId: 11,
    eligibleStageIds: ['t1'],
    createdAt: '2026-08-22 08:18',
  },
];

const initialChallengeLogs: ChallengeDayLog[] = [
  {
    id: 1,
    contestId: 1,
    stageId: 's1',
    signupId: 1,
    date: '2026-09-03',
    gates: [
      { attempts: 1, passed: true },
      { attempts: 2, passed: false },
      { attempts: 0, passed: false },
    ],
  },
  {
    id: 2,
    contestId: 1,
    stageId: 's1',
    signupId: 1,
    date: '2026-09-04',
    gates: [
      { attempts: 1, passed: true },
      { attempts: 1, passed: true },
      { attempts: 1, passed: true },
    ],
  },
  {
    id: 3,
    contestId: 1,
    stageId: 's1',
    signupId: 2,
    date: '2026-09-03',
    gates: [
      { attempts: 3, passed: true },
      { attempts: 0, passed: false },
      { attempts: 0, passed: false },
    ],
  },
];

const initialWrongItems: ContestWrongItem[] = [
  {
    id: 1,
    contestId: 1,
    signupId: 1,
    stageId: 's1',
    questionKey: 'q1',
    stem: '一线技能作业前，首先要确认什么？',
    options: ['工装是否好看', '安全措施是否到位', '是否能提前下班', '工具颜色'],
    answer: '安全措施是否到位',
    picked: '工装是否好看',
    createdAt: '2026-09-04 10:00',
    missCount: 1,
    practiced: false,
  },
  {
    id: 2,
    contestId: 1,
    signupId: 1,
    stageId: 's1',
    questionKey: 'q2',
    stem: '发现设备异常时应立即？',
    options: ['继续赶工', '停机并上报', '自行拆机', '忽略小故障'],
    answer: '停机并上报',
    picked: '继续赶工',
    createdAt: '2026-09-04 10:02',
    missCount: 2,
    practiced: false,
  },
];

let contests = initialContests.map((item) => ({ ...item, stages: item.stages.map((stage) => ({ ...stage, learningPlanIds: [...(stage.learningPlanIds ?? [])] })) }));
let signups = initialSignups.map((item) => ({ ...item, eligibleStageIds: [...item.eligibleStageIds], answers: { ...item.answers } }));
let challengeLogs = initialChallengeLogs.map((item) => ({ ...item, gates: item.gates.map((gate) => ({ ...gate })) }));
let wrongItems = initialWrongItems.map((item) => ({ ...item, options: [...item.options] }));
const listeners = new Set<() => void>();

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

export function __resetContestStoreForTests() {
  contests = initialContests.map((item) => ({ ...item, stages: item.stages.map((stage) => ({ ...stage, categoryIds: [...stage.categoryIds], questionIds: [...stage.questionIds], learningPlanIds: [...(stage.learningPlanIds ?? [])] })) }));
  signups = initialSignups.map((item) => ({ ...item, eligibleStageIds: [...item.eligibleStageIds], answers: { ...item.answers } }));
  challengeLogs = initialChallengeLogs.map((item) => ({ ...item, gates: item.gates.map((gate) => ({ ...gate })) }));
  wrongItems = initialWrongItems.map((item) => ({ ...item, options: [...item.options] }));
  emit();
}

export function useContests() {
  useStoreTick();
  return contests;
}

export function useContestSignups(contestId: number) {
  useStoreTick();
  return signups.filter((item) => item.contestId === contestId);
}

export function getContests() {
  return contests;
}

export function getContest(id: number) {
  return contests.find((item) => item.id === id);
}

export function getContestSignups(contestId: number) {
  return signups.filter((item) => item.contestId === contestId);
}

export function getChallengeDayLogs(contestId: number) {
  return challengeLogs.filter((item) => item.contestId === contestId);
}

export function useChallengeDayLogs(contestId: number) {
  useStoreTick();
  return getChallengeDayLogs(contestId);
}

export function getAllSignups() {
  return signups;
}

export function nextContestId() {
  return Math.max(0, ...contests.map((item) => item.id)) + 1;
}

export function saveContest(contest: Contest): Contest {
  const current = contests.find((item) => item.id === contest.id);
  const remainingIds = contest.stages.map((stage) => stage.id);
  contests = current
    ? contests.map((item) => (item.id === contest.id ? contest : item))
    : [contest, ...contests];
  signups = signups.map((row) =>
    row.contestId === contest.id ? { ...row, eligibleStageIds: pruneEligibleStageIds(row.eligibleStageIds, remainingIds) } : row,
  );
  emit();
  return contest;
}

export function removeContest(id: number) {
  contests = contests.filter((item) => item.id !== id);
  signups = signups.filter((item) => item.contestId !== id);
  challengeLogs = challengeLogs.filter((item) => item.contestId !== id);
  wrongItems = wrongItems.filter((item) => item.contestId !== id);
  emit();
}

export function setSignupStages(contestId: number, selectedIds: number[], nextStageIds: string[]): ContestSignup[] {
  signups = applyBatchEligibleStages(
    signups.map((row) => (row.contestId === contestId ? row : row)),
    selectedIds,
    nextStageIds,
  );
  emit();
  return getContestSignups(contestId);
}

export function addContestSignup(input: {
  contestId: number;
  answers: Record<string, string>;
  regionId: number | null;
}): ContestSignup {
  const contest = getContest(input.contestId);
  const created: ContestSignup = {
    id: Math.max(0, ...signups.map((item) => item.id)) + 1,
    contestId: input.contestId,
    answers: { ...input.answers },
    regionId: input.regionId,
    eligibleStageIds: contest?.stages[0] ? [contest.stages[0].id] : [],
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
  };
  signups = [created, ...signups];
  emit();
  return created;
}

export function recordGateAttempt(input: {
  contestId: number;
  stageId: string;
  signupId: number;
  gateIndex: number;
  passed: boolean;
  date: string;
}): ChallengeDayLog {
  const contest = getContest(input.contestId);
  const stage = contest?.stages.find((item) => item.id === input.stageId);
  const gateCount = stage?.dailyGateCount ?? 1;
  const existing = challengeLogs.find(
    (item) =>
      item.contestId === input.contestId &&
      item.stageId === input.stageId &&
      item.signupId === input.signupId &&
      item.date === input.date,
  );
  const baseGates =
    existing?.gates ?? Array.from({ length: gateCount }, () => ({ attempts: 0, passed: false }));
  while (baseGates.length < gateCount) baseGates.push({ attempts: 0, passed: false });
  const nextGates = baseGates.map((gate, index) =>
    index === input.gateIndex
      ? { attempts: gate.attempts + 1, passed: gate.passed || input.passed }
      : { ...gate },
  );
  const next: ChallengeDayLog = existing
    ? { ...existing, gates: nextGates }
    : {
        id: Math.max(0, ...challengeLogs.map((item) => item.id)) + 1,
        contestId: input.contestId,
        stageId: input.stageId,
        signupId: input.signupId,
        date: input.date,
        gates: nextGates,
      };
  challengeLogs = existing
    ? challengeLogs.map((item) => (item.id === existing.id ? next : item))
    : [...challengeLogs, next];
  emit();
  return next;
}

export function getContestWrongItems() {
  return wrongItems;
}

export function useContestWrongItems() {
  useStoreTick();
  return wrongItems;
}

export function addContestWrongItems(input: {
  contestId: number;
  signupId: number;
  stageId: string;
  items: { id: string; stem: string; options: string[]; answer: string; picked: string }[];
}): ContestWrongItem[] {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
  for (const item of input.items) {
    const existing = wrongItems.find((row) => row.signupId === input.signupId && row.questionKey === item.id);
    const next: ContestWrongItem = {
      id: existing?.id ?? Math.max(0, ...wrongItems.map((row) => row.id)) + 1,
      contestId: input.contestId,
      signupId: input.signupId,
      stageId: input.stageId,
      questionKey: item.id,
      stem: item.stem,
      options: [...item.options],
      answer: item.answer,
      picked: item.picked,
      createdAt: existing?.createdAt ?? now,
      missCount: (existing?.missCount ?? 0) + 1,
      practiced: false,
    };
    wrongItems = existing ? wrongItems.map((row) => (row.id === existing.id ? next : row)) : [...wrongItems, next];
  }
  emit();
  return wrongItems.filter((row) => row.signupId === input.signupId);
}

export function markContestWrongPracticed(id: number) {
  wrongItems = wrongItems.map((item) => (item.id === id ? { ...item, practiced: true } : item));
  emit();
}

export function removeContestWrongItem(id: number) {
  wrongItems = wrongItems.filter((item) => item.id !== id);
  emit();
}
