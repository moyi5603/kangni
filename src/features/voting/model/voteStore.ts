import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import type { VoteAnswer, VoteBallot, VoteCampaign, VoteComment, VoteOption, VoteQuestion, VoteResponse } from './voting';
import { resolveVoteStatus, wouldExceedSurveyQuota, isSingleChoiceQuestionType } from './voting';

export const VOTE_MOCK_VERSION = 8;

function stamp(days: number, time = '09:00:00'): string {
  const [hour, minute, second] = time.split(':').map(Number);
  return dayjs().add(days, 'day').hour(hour).minute(minute).second(second).format('YYYY-MM-DD HH:mm:ss');
}

function dayKeyFrom(value: string): string {
  return value.slice(0, 10);
}

function personOption(id: number, campaignId: number, sortOrder: number, name: string, dept: string, imageUrl = ''): VoteOption {
  return {
    id,
    campaignId,
    sortOrder,
    kind: '员工',
    label: '',
    imageUrl,
    employeeId: name,
    employeeName: name,
    employeeDept: dept,
    workTitle: '',
    workCover: '',
    workIntro: '',
  };
}

function workOption(id: number, campaignId: number, sortOrder: number, title: string, intro: string): VoteOption {
  return {
    id,
    campaignId,
    sortOrder,
    kind: '作品',
    label: '',
    imageUrl: '',
    employeeId: '',
    employeeName: '',
    employeeDept: '',
    workTitle: title,
    workCover: '/activities/share.jpg',
    workIntro: intro,
  };
}

function ballot(id: number, campaignId: number, optionId: number, voter: string, votedAt: string): VoteBallot {
  return { id, campaignId, optionId, voterId: voter, voterName: voter, votedAt, dayKey: dayKeyFrom(votedAt) };
}

const initialCampaigns: VoteCampaign[] = [
  {
    id: 1,
    name: '午餐口味征集',
    type: '普通投票',
    anonymous: false,
    startAt: stamp(3, '09:00:00'),
    endAt: stamp(10, '18:00:00'),
    intro: '收集本季度员工餐厅口味偏好。',
    quotaMode: '每天',
    quota: 1,
    allowComment: false,
    allowStackOnSameOption: false,
    visibility: '全员',
    departments: [],
    people: [],
    importFileName: '',
    importedPeople: [],
  },
  {
    id: 2,
    name: '部门团建目的地',
    type: '普通投票',
    anonymous: false,
    startAt: stamp(-2, '09:00:00'),
    endAt: stamp(5, '18:00:00'),
    intro: '研发中心团建地点投票。',
    quotaMode: '每天',
    quota: 2,
    allowComment: true,
    allowStackOnSameOption: false,
    visibility: '按部门',
    departments: ['研发中心'],
    people: [],
    importFileName: '',
    importedPeople: [],
  },
  {
    id: 3,
    name: '季度明星员工与作品',
    type: '评选投票',
    anonymous: true,
    startAt: stamp(-1, '09:00:00'),
    endAt: stamp(6, '18:00:00'),
    intro: '人与作品可混投。',
    quotaMode: '每天',
    quota: 3,
    allowComment: false,
    allowStackOnSameOption: false,
    visibility: '自定义人员',
    departments: [],
    people: ['张悦', '李明', '王芳', '黄码'],
    importFileName: '',
    importedPeople: [],
  },
  {
    id: 4,
    name: '年度优秀提案评选',
    type: '评选投票',
    anonymous: false,
    startAt: stamp(-20, '09:00:00'),
    endAt: stamp(-2, '18:00:00'),
    intro: '已结束的评选，含并列第一。',
    quotaMode: '每天',
    quota: 1,
    allowComment: false,
    allowStackOnSameOption: false,
    visibility: '全员',
    departments: [],
    people: [],
    importFileName: '',
    importedPeople: [],
  },
  {
    id: 5,
    name: '工装颜色连投测试',
    type: '普通投票',
    anonymous: false,
    startAt: stamp(-10, '09:00:00'),
    endAt: stamp(-1, '18:00:00'),
    intro: '工装颜色偏好问卷。',
    quotaMode: '每天',
    quota: 3,
    allowComment: false,
    allowStackOnSameOption: true,
    visibility: '按部门',
    departments: ['生产中心'],
    people: [],
    importFileName: '',
    importedPeople: [],
  },
  {
    id: 6,
    name: '创新项目投票',
    type: '普通投票',
    anonymous: false,
    startAt: stamp(-1, '09:00:00'),
    endAt: stamp(14, '18:00:00'),
    intro: '从十个创新项目中多选支持项，图文对照。',
    quotaMode: '每天',
    quota: 1,
    allowComment: false,
    allowStackOnSameOption: false,
    visibility: '全员',
    departments: [],
    people: [],
    importFileName: '',
    importedPeople: [],
  },
  {
    id: 7,
    name: '优秀员工投票',
    type: '普通投票',
    anonymous: false,
    startAt: stamp(-1, '11:00:00'),
    endAt: stamp(14, '18:00:00'),
    intro: '选出本季度表现突出的优秀员工，上图下文对照。',
    quotaMode: '每人',
    quota: 1,
    allowComment: false,
    allowStackOnSameOption: false,
    visibility: '全员',
    departments: [],
    people: [],
    importFileName: '',
    importedPeople: [],
  },
];

const initialOptions: VoteOption[] = [
  personOption(6, 3, 0, '张悦', '前端组', '/activities/share.jpg'),
  personOption(7, 3, 1, '王芳', '后端组'),
  workOption(8, 3, 2, '门系统轻量化方案', '降本案例'),
  personOption(9, 4, 0, '李明', '前端组'),
  workOption(10, 4, 1, '产线目视化看板', '效率提升'),
  workOption(11, 4, 2, '客服知识库改版', '满意度'),
];

const initialQuestions: VoteQuestion[] = [
  {
    id: 1,
    campaignId: 1,
    sortOrder: 0,
    type: '单选',
    stem: '本季度更想吃哪类？',
    choices: [
      { id: 1, sortOrder: 0, label: '川菜', imageUrl: '' },
      { id: 2, sortOrder: 1, label: '粤菜', imageUrl: '' },
    ],
    minScore: 1,
    maxScore: 5,
  },
  {
    id: 2,
    campaignId: 2,
    sortOrder: 0,
    type: '单选',
    stem: '团建目的地',
    choices: [
      { id: 3, sortOrder: 0, label: '临安', imageUrl: '' },
      { id: 4, sortOrder: 1, label: '安吉', imageUrl: '' },
      { id: 5, sortOrder: 2, label: '莫干山', imageUrl: '' },
    ],
    minScore: 1,
    maxScore: 5,
  },
  {
    id: 3,
    campaignId: 2,
    sortOrder: 1,
    type: '问答题',
    stem: '还想补充的目的地？',
    choices: [],
    minScore: 1,
    maxScore: 5,
  },
  {
    id: 4,
    campaignId: 2,
    sortOrder: 2,
    type: '打分题',
    stem: '对本次团建方案的满意度',
    choices: [],
    minScore: 1,
    maxScore: 5,
  },
  {
    id: 5,
    campaignId: 2,
    sortOrder: 3,
    type: '图片单选',
    stem: '更喜欢哪张活动海报？',
    imageLayout: '上图下文',
    choices: [
      { id: 8, sortOrder: 0, label: '海报 A', subtitle: '春季团建主视觉', imageUrl: '/activities/share.jpg' },
      { id: 9, sortOrder: 1, label: '海报 B', subtitle: '开放日宣传', imageUrl: '/activities/open-day.jpg' },
    ],
    minScore: 1,
    maxScore: 5,
  },
  {
    id: 6,
    campaignId: 5,
    sortOrder: 0,
    type: '单选',
    stem: '工装颜色',
    choices: [
      { id: 6, sortOrder: 0, label: '深蓝', imageUrl: '' },
      { id: 7, sortOrder: 1, label: '卡其', imageUrl: '' },
    ],
    minScore: 1,
    maxScore: 5,
  },
  {
    id: 7,
    campaignId: 6,
    sortOrder: 0,
    type: '图片多选',
    stem: '请选择你支持的创新项目（可多选）',
    imageLayout: '左图右文',
    choices: [
      { id: 10, sortOrder: 0, label: '门系统轻量化铝合金骨架减重方案车间试点已', subtitle: '铝合金骨架减重百分之十二，并同步优化密封与工艺，覆盖两条产线试点车间已全面落地实施并已完成阶段验收。', imageUrl: '/activities/share.jpg' },
      { id: 11, sortOrder: 1, label: '产线目视化看板', subtitle: '异常 3 分钟内上墙', imageUrl: '/activities/open-day.jpg' },
      { id: 12, sortOrder: 2, label: '客服知识库改版', subtitle: '一次检索命中率提升', imageUrl: '/activities/webinar.jpg' },
      { id: 13, sortOrder: 3, label: '智能门锁远程运维', subtitle: '故障远程诊断与派单', imageUrl: '/activities/checkup.jpg' },
      { id: 14, sortOrder: 4, label: '车间能耗监测平台', subtitle: '峰谷用电可视化', imageUrl: '/activities/onboarding.jpg' },
      { id: 15, sortOrder: 5, label: '员工通勤拼车小程序', subtitle: '同路线自动撮合', imageUrl: '/activities/basketball.jpg' },
      { id: 16, sortOrder: 6, label: '备件库存预测模型', subtitle: '降低呆滞库存', imageUrl: '/activities/share.jpg' },
      { id: 17, sortOrder: 7, label: '客户交付进度可视化', subtitle: '订单节点实时同步', imageUrl: '/activities/open-day.jpg' },
      { id: 18, sortOrder: 8, label: '绿色包装减量方案', subtitle: '纸塑替代发泡', imageUrl: '/activities/webinar.jpg' },
      { id: 19, sortOrder: 9, label: '新员工导师匹配系统', subtitle: '按技能标签配对', imageUrl: '/activities/onboarding.jpg' },
    ],
    minScore: 1,
    maxScore: 5,
  },
  {
    id: 8,
    campaignId: 7,
    sortOrder: 0,
    type: '人员单选',
    stem: '请选出本季度优秀员工',
    imageLayout: '上图下文',
    choices: [
      { id: 20, sortOrder: 0, label: '张悦·前端组', subtitle: '本季度主导门户迭代与跨组协同，需求按时上线，沉淀可复用组件并带动新人成长，已连续两季获评组内标杆奖。', imageUrl: '', employeeId: '张悦' },
      { id: 21, sortOrder: 1, label: '李明·前端组', subtitle: '', imageUrl: '', employeeId: '李明' },
      { id: 22, sortOrder: 2, label: '王芳·后端组', subtitle: '', imageUrl: '', employeeId: '王芳' },
      { id: 23, sortOrder: 3, label: '黄码·后端组', subtitle: '', imageUrl: '', employeeId: '黄码' },
      { id: 24, sortOrder: 4, label: '苏然·测试组', subtitle: '', imageUrl: '', employeeId: '苏然' },
      { id: 25, sortOrder: 5, label: '周工·总装车间', subtitle: '', imageUrl: '', employeeId: '周工' },
      { id: 26, sortOrder: 6, label: '陈产品·华东大区', subtitle: '', imageUrl: '', employeeId: '陈产品' },
      { id: 27, sortOrder: 7, label: '林销·华南大区', subtitle: '', imageUrl: '', employeeId: '林销' },
      { id: 28, sortOrder: 8, label: '赵人事·人力资源', subtitle: '', imageUrl: '', employeeId: '赵人事' },
      { id: 29, sortOrder: 9, label: '钱会·财务', subtitle: '', imageUrl: '', employeeId: '钱会' },
    ],
    minScore: 1,
    maxScore: 5,
  },
];

const t2 = stamp(-1, '10:15:00');
const t2b = stamp(-1, '11:20:00');
const t3 = stamp(0, '09:30:00');
const t4 = stamp(-5, '14:00:00');
const t5 = stamp(-3, '16:10:00');

const initialBallots: VoteBallot[] = [
  ballot(4, 3, 6, '李明', t3),
  ballot(5, 3, 8, '王芳', t3),
  ballot(6, 4, 9, '张悦', t4),
  ballot(7, 4, 10, '李明', t4),
  ballot(8, 4, 9, '王芳', t4),
  ballot(9, 4, 10, '黄码', t4),
];

const initialResponses: VoteResponse[] = [
  { id: 1, campaignId: 2, voterId: '张悦', voterName: '张悦', submittedAt: t2, dayKey: dayKeyFrom(t2) },
  { id: 2, campaignId: 2, voterId: '李明', voterName: '李明', submittedAt: t2b, dayKey: dayKeyFrom(t2b) },
  { id: 3, campaignId: 5, voterId: '苏然', voterName: '苏然', submittedAt: t5, dayKey: dayKeyFrom(t5) },
  { id: 4, campaignId: 5, voterId: '苏然', voterName: '苏然', submittedAt: stamp(-3, '16:20:00'), dayKey: dayKeyFrom(stamp(-3, '16:20:00')) },
  { id: 5, campaignId: 5, voterId: '苏然', voterName: '苏然', submittedAt: stamp(-3, '16:30:00'), dayKey: dayKeyFrom(stamp(-3, '16:30:00')) },
];

const initialAnswers: VoteAnswer[] = [
  { id: 1, responseId: 1, questionId: 2, choiceIds: [3], text: '', score: null },
  { id: 2, responseId: 1, questionId: 3, choiceIds: [], text: '想去山里露营', score: null },
  { id: 3, responseId: 1, questionId: 4, choiceIds: [], text: '', score: 5 },
  { id: 4, responseId: 1, questionId: 5, choiceIds: [8], text: '', score: null },
  { id: 5, responseId: 2, questionId: 2, choiceIds: [3], text: '', score: null },
  { id: 6, responseId: 2, questionId: 3, choiceIds: [], text: '安吉竹海', score: null },
  { id: 7, responseId: 2, questionId: 4, choiceIds: [], text: '', score: 4 },
  { id: 8, responseId: 2, questionId: 5, choiceIds: [9], text: '', score: null },
  { id: 9, responseId: 3, questionId: 6, choiceIds: [6], text: '', score: null },
  { id: 10, responseId: 4, questionId: 6, choiceIds: [6], text: '', score: null },
  { id: 11, responseId: 5, questionId: 6, choiceIds: [6], text: '', score: null },
];

const initialComments: VoteComment[] = [
  { id: 1, campaignId: 2, authorId: '李明', authorName: '李明', text: '希望能早点定下来。', createdAt: t2b, likedBy: [] },
  { id: 2, campaignId: 2, authorId: '张悦', authorName: '张悦', text: '临安近一点。', createdAt: stamp(-1, '11:40:00'), parentId: 1, likedBy: [] },
  { id: 3, campaignId: 2, authorId: '王芳', authorName: '王芳', text: '安吉竹海也方便。', createdAt: stamp(-1, '12:10:00'), likedBy: [] },
];

let mockVersion = VOTE_MOCK_VERSION;
let campaigns = [...initialCampaigns];
let options = [...initialOptions];
let questions = [...initialQuestions];
let ballots = [...initialBallots];
let responses = [...initialResponses];
let answers = [...initialAnswers];
let comments = [...initialComments];
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

export function __resetVoteStoreForTests() {
  mockVersion = VOTE_MOCK_VERSION;
  campaigns = [...initialCampaigns];
  options = [...initialOptions];
  questions = [...initialQuestions];
  ballots = [...initialBallots];
  responses = [...initialResponses];
  answers = [...initialAnswers];
  comments = [...initialComments];
  emit();
}

export function useVotes() {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((n) => n + 1)), []);
  return campaigns;
}

export function getVotes() {
  return campaigns;
}

export function getVote(id: number) {
  return campaigns.find((item) => item.id === id);
}

export function getVoteOptions(campaignId: number) {
  return options.filter((item) => item.campaignId === campaignId).sort((left, right) => left.sortOrder - right.sortOrder);
}

export function getVoteQuestions(campaignId: number) {
  return questions.filter((item) => item.campaignId === campaignId).sort((left, right) => left.sortOrder - right.sortOrder);
}

export function getVoteBallots(campaignId: number) {
  return ballots.filter((item) => item.campaignId === campaignId);
}

export function getVoteResponses(campaignId: number) {
  return responses.filter((item) => item.campaignId === campaignId);
}

export function getVoteResponse(id: number) {
  return responses.find((item) => item.id === id);
}

export function getVoteResponseAnswers(responseId: number) {
  return answers.filter((item) => item.responseId === responseId);
}

export function getVoteAnswers(campaignId: number) {
  const ids = new Set(getVoteResponses(campaignId).map((item) => item.id));
  return answers.filter((item) => ids.has(item.responseId));
}

export function getVoteComments(campaignId: number) {
  return comments.filter((item) => item.campaignId === campaignId).sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export function addVoteComment(input: {
  campaignId: number;
  authorId: string;
  authorName: string;
  text: string;
  parentId?: number;
  now?: string;
}): { ok: true } | { ok: false; reason: 'missing' | 'disabled' | 'empty' } {
  const campaign = getVote(input.campaignId);
  if (!campaign) return { ok: false, reason: 'missing' };
  if (!campaign.allowComment) return { ok: false, reason: 'disabled' };
  const text = input.text.trim();
  if (!text) return { ok: false, reason: 'empty' };
  if (input.parentId != null) {
    const parent = comments.find((item) => item.id === input.parentId);
    if (!parent || parent.campaignId !== input.campaignId) return { ok: false, reason: 'missing' };
  }
  const id = Math.max(0, ...comments.map((item) => item.id)) + 1;
  comments = [
    {
      id,
      campaignId: input.campaignId,
      authorId: input.authorId,
      authorName: input.authorName,
      text,
      createdAt: input.now ?? dayjs().format('YYYY-MM-DD HH:mm:ss'),
      likedBy: [],
      ...(input.parentId != null ? { parentId: input.parentId } : {}),
    },
    ...comments,
  ];
  emit();
  return { ok: true };
}

export function deleteVoteComment(id: number, authorId: string): 'ok' | 'forbidden' | 'missing' {
  const target = comments.find((item) => item.id === id);
  if (!target) return 'missing';
  if (target.authorId !== authorId) return 'forbidden';
  removeVoteCommentIds([id]);
  return 'ok';
}

export function removeVoteComments(ids: number[]) {
  removeVoteCommentIds(ids);
}

function removeVoteCommentIds(ids: number[]) {
  const drop = new Set<number>(ids);
  let added = true;
  while (added) {
    added = false;
    comments.forEach((item) => {
      if (item.parentId != null && drop.has(item.parentId) && !drop.has(item.id)) {
        drop.add(item.id);
        added = true;
      }
    });
  }
  comments = comments.filter((item) => !drop.has(item.id));
  emit();
}

export function toggleVoteCommentLike(id: number, authorId: string): 'ok' | 'missing' {
  const target = comments.find((item) => item.id === id);
  if (!target) return 'missing';
  comments = comments.map((item) => {
    if (item.id !== id) return item;
    const liked = item.likedBy.includes(authorId);
    return { ...item, likedBy: liked ? item.likedBy.filter((who) => who !== authorId) : [...item.likedBy, authorId] };
  });
  emit();
  return 'ok';
}

export function nextVoteId() {
  return Math.max(0, ...campaigns.map((item) => item.id)) + 1;
}

export function nextOptionId() {
  return Math.max(0, ...options.map((item) => item.id)) + 1;
}

export function nextQuestionId() {
  return Math.max(0, ...questions.map((item) => item.id)) + 1;
}

export function nextChoiceId() {
  const ids = questions.flatMap((item) => item.choices.map((choice) => choice.id));
  return Math.max(0, ...ids) + 1;
}

export function upsertVote(record: VoteCampaign, nextOptions: VoteOption[] = [], nextQuestions: VoteQuestion[] = []) {
  const current = campaigns.find((item) => item.id === record.id);
  campaigns = current ? campaigns.map((item) => (item.id === record.id ? record : item)) : [record, ...campaigns];
  options = [...options.filter((item) => item.campaignId !== record.id), ...nextOptions];
  questions = [...questions.filter((item) => item.campaignId !== record.id), ...nextQuestions];
  emit();
}

export function removeVote(id: number): boolean {
  const current = campaigns.find((item) => item.id === id);
  if (!current) return false;
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  if (resolveVoteStatus(current, now) !== '未开始') return false;
  const responseIds = new Set(responses.filter((item) => item.campaignId === id).map((item) => item.id));
  campaigns = campaigns.filter((item) => item.id !== id);
  options = options.filter((item) => item.campaignId !== id);
  questions = questions.filter((item) => item.campaignId !== id);
  ballots = ballots.filter((item) => item.campaignId !== id);
  responses = responses.filter((item) => item.campaignId !== id);
  answers = answers.filter((item) => !responseIds.has(item.responseId));
  comments = comments.filter((item) => item.campaignId !== id);
  emit();
  return true;
}

export type SubmitVoteAnswerInput = {
  questionId: number;
  choiceIds: number[];
  text: string;
  score: number | null;
};

function nextResponseId() {
  return Math.max(0, ...responses.map((item) => item.id)) + 1;
}

function nextAnswerId() {
  return Math.max(0, ...answers.map((item) => item.id)) + 1;
}

function answersMatchQuestions(questions: VoteQuestion[], nextAnswers: SubmitVoteAnswerInput[]): boolean {
  if (nextAnswers.length !== questions.length) return false;
  const byId = new Map(nextAnswers.map((item) => [item.questionId, item]));
  return questions.every((question) => {
    const answer = byId.get(question.id);
    if (!answer) return false;
    if (question.type === '问答题') return answer.text.trim().length > 0 && answer.text.length <= 500;
    if (question.type === '打分题') {
      return answer.score != null && answer.score >= question.minScore && answer.score <= question.maxScore;
    }
    const allowed = new Set(question.choices.map((choice) => choice.id));
    if (answer.choiceIds.some((choiceId) => !allowed.has(choiceId))) return false;
    if (isSingleChoiceQuestionType(question.type)) return answer.choiceIds.length === 1;
    return answer.choiceIds.length >= 1;
  });
}

export function submitVoteResponse(input: {
  campaignId: number;
  voterId: string;
  voterName: string;
  answers: SubmitVoteAnswerInput[];
  now?: string;
}): { ok: true; responseId: number } | { ok: false; reason: 'missing' | 'not-survey' | 'not-open' | 'quota' | 'invalid' } {
  const campaign = getVote(input.campaignId);
  if (!campaign) return { ok: false, reason: 'missing' };
  if (campaign.type !== '普通投票') return { ok: false, reason: 'not-survey' };
  const now = input.now ?? dayjs().format('YYYY-MM-DD HH:mm:ss');
  if (resolveVoteStatus(campaign, now) !== '进行中') return { ok: false, reason: 'not-open' };
  const dayKey = dayKeyFrom(now);
  if (wouldExceedSurveyQuota(campaign, getVoteResponses(campaign.id), input.voterId, dayKey)) {
    return { ok: false, reason: 'quota' };
  }
  const questions = getVoteQuestions(campaign.id);
  if (!answersMatchQuestions(questions, input.answers)) return { ok: false, reason: 'invalid' };
  const responseId = nextResponseId();
  let answerId = nextAnswerId();
  responses = [
    ...responses,
    {
      id: responseId,
      campaignId: campaign.id,
      voterId: input.voterId,
      voterName: input.voterName,
      submittedAt: now,
      dayKey,
    },
  ];
  answers = [
    ...answers,
    ...input.answers.map((item) => ({
      id: answerId++,
      responseId,
      questionId: item.questionId,
      choiceIds: item.choiceIds,
      text: item.text,
      score: item.score,
    })),
  ];
  emit();
  return { ok: true, responseId };
}
