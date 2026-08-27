export const voteTypes = ['普通投票', '评选投票'] as const;
export type VoteType = (typeof voteTypes)[number];

export const voteStatuses = ['未开始', '进行中', '已结束'] as const;
export type VoteStatus = (typeof voteStatuses)[number];

export const voteVisibilities = ['全员', '按部门', '自定义人员', '导入人群'] as const;
export type VoteVisibility = (typeof voteVisibilities)[number];

export const voteQuotaModes = ['每人', '每天'] as const;
export type VoteQuotaMode = (typeof voteQuotaModes)[number];

export const voteOptionKinds = ['文字', '员工', '作品'] as const;
export type VoteOptionKind = (typeof voteOptionKinds)[number];

export const voteQuestionTypes = ['单选', '多选', '图片单选', '图片多选', '人员单选', '人员多选', '问答题', '打分题'] as const;
export type VoteQuestionType = (typeof voteQuestionTypes)[number];

export const voteImageLayouts = ['上图下文', '左图右文'] as const;
export const voteVisualTitleMax = 20;
export const voteVisualSubtitleMax = 50;
export type VoteImageLayout = (typeof voteImageLayouts)[number];

export const voteScoreAbsMin = 0;
export const voteScoreAbsMax = 10;
export const voteScoreDefaultMin = 1;
export const voteScoreDefaultMax = 10;

export function voteScoreRangeError(
  minScore: number | null | undefined,
  maxScore: number | null | undefined,
): string | undefined {
  if (minScore == null || maxScore == null || minScore >= maxScore) return '打分题最低分须小于最高分';
  if (minScore < voteScoreAbsMin || maxScore > voteScoreAbsMax) return '打分范围须在 0～10';
  return undefined;
}

export type VoteChoice = {
  id: number;
  sortOrder: number;
  label: string;
  subtitle?: string;
  imageUrl: string;
  employeeId?: string;
};

export type VoteQuestion = {
  id: number;
  campaignId: number;
  sortOrder: number;
  type: VoteQuestionType;
  stem: string;
  choices: VoteChoice[];
  minScore: number;
  maxScore: number;
  imageLayout?: VoteImageLayout;
};

export type VoteResponse = {
  id: number;
  campaignId: number;
  voterId: string;
  voterName: string;
  submittedAt: string;
  dayKey: string;
};

export type VoteAnswer = {
  id: number;
  responseId: number;
  questionId: number;
  choiceIds: number[];
  text: string;
  score: number | null;
};

export type VoteChoiceTallyRow = {
  choice: VoteChoice;
  voteCount: number;
  rank: number;
  percent: number | null;
};

export type VoteEditField =
  | 'type'
  | 'name'
  | 'startAt'
  | 'endAt'
  | 'intro'
  | 'quota'
  | 'quotaMode'
  | 'allowComment'
  | 'allowStackOnSameOption'
  | 'anonymous'
  | 'visibility'
  | 'options'
  | 'questions';

export type VoteOptionAction = 'add' | 'delete' | 'changeIdentity' | 'changeCopy';

export type VoteCampaign = {
  id: number;
  name: string;
  type: VoteType;
  anonymous: boolean;
  startAt: string;
  endAt: string;
  intro: string;
  quotaMode: VoteQuotaMode;
  quota: number;
  allowComment: boolean;
  allowStackOnSameOption: boolean;
  visibility: VoteVisibility;
  departments: string[];
  people: string[];
  importFileName: string;
  importedPeople: string[];
};

export type VoteOption = {
  id: number;
  campaignId: number;
  sortOrder: number;
  kind: VoteOptionKind;
  label: string;
  imageUrl: string;
  employeeId: string;
  employeeName: string;
  employeeDept: string;
  workTitle: string;
  workCover: string;
  workIntro: string;
};

export type VoteBallot = {
  id: number;
  campaignId: number;
  optionId: number;
  voterId: string;
  voterName: string;
  votedAt: string;
  dayKey: string;
};

export type VoteTallyRow = {
  option: VoteOption;
  voteCount: number;
  rank: number;
  percent: number | null;
};

export function parseVoteTime(value: string): number {
  return new Date(value.replace(/-/g, '/')).getTime();
}

export function validateVoteTimeOrder(startAt: string, endAt: string): boolean {
  return parseVoteTime(startAt) < parseVoteTime(endAt);
}

export function resolveVoteStatus(record: Pick<VoteCampaign, 'startAt' | 'endAt'>, now: string): VoteStatus {
  const t = parseVoteTime(now);
  if (t < parseVoteTime(record.startAt)) return '未开始';
  if (t <= parseVoteTime(record.endAt)) return '进行中';
  return '已结束';
}

export function canDeleteVote(status: VoteStatus): boolean {
  return status === '未开始';
}

const ongoingEditable: ReadonlySet<VoteEditField> = new Set([
  'endAt',
  'intro',
  'quota',
  'quotaMode',
  'allowComment',
  'allowStackOnSameOption',
  'anonymous',
  'visibility',
  'options',
  'questions',
]);

export function canEditVoteField(status: VoteStatus, field: VoteEditField): boolean {
  if (status === '未开始') return true;
  if (status === '已结束') return false;
  return ongoingEditable.has(field);
}

export function canMutateVoteOption(status: VoteStatus, hasBallots: boolean, action: VoteOptionAction): boolean {
  if (status === '已结束') return false;
  if (status === '未开始') return true;
  if (action === 'add') return true;
  if (action === 'changeCopy') return true;
  return !hasBallots;
}

export function voteOptionTitle(option: VoteOption): string {
  if (option.kind === '员工') return option.employeeName;
  if (option.kind === '作品') return option.workTitle;
  return option.label;
}

export function tallyVoteResults(options: VoteOption[], ballots: VoteBallot[]): VoteTallyRow[] {
  const counts = new Map<number, number>();
  ballots.forEach((ballot) => {
    counts.set(ballot.optionId, (counts.get(ballot.optionId) ?? 0) + 1);
  });
  const total = ballots.length;
  const sorted = [...options].sort((left, right) => {
    const diff = (counts.get(right.id) ?? 0) - (counts.get(left.id) ?? 0);
    return diff || left.id - right.id;
  });
  let lastCount = -1;
  let lastRank = 0;
  return sorted.map((option, index) => {
    const voteCount = counts.get(option.id) ?? 0;
    const rank = voteCount === lastCount ? lastRank : index + 1;
    lastCount = voteCount;
    lastRank = rank;
    return {
      option,
      voteCount,
      rank,
      percent: total === 0 ? null : Math.round((voteCount / total) * 100),
    };
  });
}

export function displayVoterName(anonymous: boolean, voterName: string): string {
  return anonymous ? '匿名' : voterName;
}

export function voteQuotaFieldLabel(mode: VoteQuotaMode): string {
  return mode === '每人' ? '每人能投' : '每人每天能投';
}

export function voteQuotaRuleText(campaign: Pick<VoteCampaign, 'quotaMode' | 'quota'>): string {
  return `${voteQuotaFieldLabel(campaign.quotaMode)} ${campaign.quota} 次，整卷提交，每次计入汇总`;
}

export function voteQuotaUsed(
  campaign: Pick<VoteCampaign, 'quotaMode'>,
  items: readonly { voterId: string; dayKey: string }[],
  voterId: string,
  dayKey: string,
): number {
  const mine = items.filter((item) => item.voterId === voterId);
  return campaign.quotaMode === '每天' ? mine.filter((item) => item.dayKey === dayKey).length : mine.length;
}

export function remainingVoteQuota(campaign: Pick<VoteCampaign, 'quota'>, used: number): number {
  return Math.max(0, campaign.quota - used);
}

export function voteQuotaProgressText(campaign: Pick<VoteCampaign, 'quotaMode' | 'quota'>, used: number): string {
  return `${campaign.quotaMode === '每天' ? '今日已投' : '已投'} ${used} / 可投 ${campaign.quota}`;
}

export function voteQuotaExhaustedText(mode: VoteQuotaMode): string {
  return mode === '每天' ? '今日次数已用完' : '次数已用完';
}

export function voteQuotaRemainingStatLabel(mode: VoteQuotaMode): string {
  return mode === '每天' ? '今日剩余' : '剩余';
}

export function voteQuotaRecordIndexLabel(mode: VoteQuotaMode, index: number, quota: number): string {
  return mode === '每天' ? `当天第 ${index} / ${quota} 次` : `第 ${index} / ${quota} 次`;
}

export type VoteComment = {
  id: number;
  campaignId: number;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
  likedBy: string[];
  parentId?: number;
};

export function wouldExceedDailyQuota(
  campaign: Pick<VoteCampaign, 'id' | 'quota' | 'quotaMode' | 'allowStackOnSameOption'>,
  ballots: VoteBallot[],
  voterId: string,
  optionId: number,
  dayKey: string,
): boolean {
  const mine = ballots.filter((item) => item.campaignId === campaign.id && item.voterId === voterId);
  const scoped = campaign.quotaMode === '每天' ? mine.filter((item) => item.dayKey === dayKey) : mine;
  if (scoped.length >= campaign.quota) return true;
  if (!campaign.allowStackOnSameOption && scoped.some((item) => item.optionId === optionId)) return true;
  return false;
}

export function deleteVoteBlockReason(status: VoteStatus): string | null {
  if (status === '进行中') return '进行中的投票不能删除';
  if (status === '已结束') return '已结束的投票不能删除';
  return null;
}

export function parseVoteCrowdCsv(text: string): { names: string[]; error?: string } {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return { names: [], error: '文件为空' };
  const header = lines[0].split(',').map((cell) => cell.trim());
  const nameIndex = header.indexOf('姓名');
  if (nameIndex < 0) return { names: [], error: '缺少姓名列' };
  const names: string[] = [];
  const seen = new Set<string>();
  lines.slice(1).forEach((line) => {
    const name = (line.split(',')[nameIndex] ?? '').trim();
    if (!name || seen.has(name)) return;
    seen.add(name);
    names.push(name);
  });
  return { names };
}

export function isChoiceQuestionType(type: VoteQuestionType): boolean {
  return type === '单选' || type === '多选' || type === '图片单选' || type === '图片多选' || type === '人员单选' || type === '人员多选';
}

export function isImageQuestionType(type: VoteQuestionType): boolean {
  return type === '图片单选' || type === '图片多选';
}

export function isPersonQuestionType(type: VoteQuestionType): boolean {
  return type === '人员单选' || type === '人员多选';
}

export function isVisualChoiceQuestionType(type: VoteQuestionType): boolean {
  return isImageQuestionType(type) || isPersonQuestionType(type);
}

export function isSingleChoiceQuestionType(type: VoteQuestionType): boolean {
  return type === '单选' || type === '图片单选' || type === '人员单选';
}

export function voteChoiceLimit(type: VoteQuestionType): number {
  return isPersonQuestionType(type) ? 20 : 10;
}

export function resolveVoteImageLayout(value: string | undefined): VoteImageLayout {
  return value === '左图右文' ? '左图右文' : '上图下文';
}

export function voteChoiceTitle(choice: VoteChoice): string {
  return choice.label.trim() || '未命名选项';
}

export function votePersonChoiceTitle(name: string, department = ''): string {
  const person = name.trim();
  const dept = department.trim();
  if (person && dept) return `${person}·${dept}`;
  return person || dept;
}

export function voteChoiceAvatarName(choice: Pick<VoteChoice, 'label' | 'employeeId'>): string {
  return (choice.employeeId ?? '').trim() || choice.label.trim();
}

export function tallyQuestionChoices(question: VoteQuestion, answers: VoteAnswer[]): VoteChoiceTallyRow[] {
  const related = answers.filter((item) => item.questionId === question.id);
  const counts = new Map<number, number>();
  related.forEach((answer) => {
    answer.choiceIds.forEach((choiceId) => {
      counts.set(choiceId, (counts.get(choiceId) ?? 0) + 1);
    });
  });
  const total = [...counts.values()].reduce((sum, value) => sum + value, 0);
  const sorted = [...question.choices].sort((left, right) => {
    const diff = (counts.get(right.id) ?? 0) - (counts.get(left.id) ?? 0);
    return diff || left.id - right.id;
  });
  let lastCount = -1;
  let lastRank = 0;
  return sorted.map((choice, index) => {
    const voteCount = counts.get(choice.id) ?? 0;
    const rank = voteCount === lastCount ? lastRank : index + 1;
    lastCount = voteCount;
    lastRank = rank;
    return {
      choice,
      voteCount,
      rank,
      percent: total === 0 ? null : Math.round((voteCount / total) * 100),
    };
  });
}

export function averageQuestionScore(question: VoteQuestion, answers: VoteAnswer[]): number | null {
  const scores = answers.filter((item) => item.questionId === question.id && item.score != null).map((item) => item.score as number);
  if (!scores.length) return null;
  return Math.round((scores.reduce((sum, value) => sum + value, 0) / scores.length) * 10) / 10;
}

export function scoreDistribution(question: VoteQuestion, answers: VoteAnswer[]): { score: number; count: number }[] {
  const related = answers.filter((item) => item.questionId === question.id && item.score != null);
  const rows: { score: number; count: number }[] = [];
  for (let score = question.minScore; score <= question.maxScore; score += 1) {
    rows.push({ score, count: related.filter((item) => item.score === score).length });
  }
  return rows;
}

export function wouldExceedSurveyQuota(
  campaign: Pick<VoteCampaign, 'id' | 'quota' | 'quotaMode'>,
  responses: VoteResponse[],
  voterId: string,
  dayKey: string,
): boolean {
  const mine = responses.filter((item) => item.campaignId === campaign.id && item.voterId === voterId);
  return voteQuotaUsed(campaign, mine, voterId, dayKey) >= campaign.quota;
}

