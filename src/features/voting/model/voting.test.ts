import { describe, expect, it } from 'vitest';
import {
  canDeleteVote,
  canEditVoteField,
  canMutateVoteOption,
  displayVoterName,
  tallyQuestionChoices,
  tallyVoteResults,
  averageQuestionScore,
  voteScoreAbsMax,
  voteScoreDefaultMax,
  voteScoreRangeError,
  voteQuestionTypes,
  isChoiceQuestionType,
  isImageQuestionType,
  isPersonQuestionType,
  isSingleChoiceQuestionType,
  isVisualChoiceQuestionType,
  parseVoteCrowdCsv,
  votePersonChoiceTitle,
  voteChoiceAvatarName,
  voteVisualSubtitleMax,
  voteVisualTitleMax,
  voteVisibilities,
  voteQuotaModes,
  voteQuotaFieldLabel,
  voteQuotaRuleText,
  validateVoteTimeOrder,
  resolveVoteStatus,
  wouldExceedDailyQuota,
  wouldExceedSurveyQuota,
  type VoteAnswer,
  type VoteBallot,
  type VoteCampaign,
  type VoteOption,
  type VoteQuestion,
  type VoteResponse,
} from './voting';

const campaign: VoteCampaign = {
  id: 1,
  name: '测试投票',
  type: '普通投票',
  anonymous: false,
  startAt: '2026-08-20 09:00:00',
  endAt: '2026-08-30 18:00:00',
  intro: '',
  quotaMode: '每天',
  quota: 2,
  allowComment: false,
  allowStackOnSameOption: false,
  visibility: '全员',
  departments: [],
  people: [],
  importFileName: '',
  importedPeople: [],
};

const options: VoteOption[] = [
  {
    id: 1,
    campaignId: 1,
    sortOrder: 0,
    kind: '文字',
    label: 'A',
    imageUrl: '',
    employeeId: '',
    employeeName: '',
    employeeDept: '',
    workTitle: '',
    workCover: '',
    workIntro: '',
  },
  {
    id: 2,
    campaignId: 1,
    sortOrder: 1,
    kind: '文字',
    label: 'B',
    imageUrl: '',
    employeeId: '',
    employeeName: '',
    employeeDept: '',
    workTitle: '',
    workCover: '',
    workIntro: '',
  },
  {
    id: 3,
    campaignId: 1,
    sortOrder: 2,
    kind: '文字',
    label: 'C',
    imageUrl: '',
    employeeId: '',
    employeeName: '',
    employeeDept: '',
    workTitle: '',
    workCover: '',
    workIntro: '',
  },
];

describe('resolveVoteStatus', () => {
  it('maps now against the window', () => {
    expect(resolveVoteStatus(campaign, '2026-08-19 23:59:59')).toBe('未开始');
    expect(resolveVoteStatus(campaign, '2026-08-20 09:00:00')).toBe('进行中');
    expect(resolveVoteStatus(campaign, '2026-08-30 18:00:00')).toBe('进行中');
    expect(resolveVoteStatus(campaign, '2026-08-30 18:00:01')).toBe('已结束');
  });
});

describe('validateVoteTimeOrder', () => {
  it('requires start before end', () => {
    expect(validateVoteTimeOrder(campaign.startAt, campaign.endAt)).toBe(true);
    expect(validateVoteTimeOrder(campaign.endAt, campaign.startAt)).toBe(false);
    expect(validateVoteTimeOrder(campaign.startAt, campaign.startAt)).toBe(false);
  });
});

describe('edit rights', () => {
  it('allows delete only before start', () => {
    expect(canDeleteVote('未开始')).toBe(true);
    expect(canDeleteVote('进行中')).toBe(false);
    expect(canDeleteVote('已结束')).toBe(false);
  });

  it('locks type/name/start after the campaign begins', () => {
    expect(canEditVoteField('未开始', 'type')).toBe(true);
    expect(canEditVoteField('进行中', 'type')).toBe(false);
    expect(canEditVoteField('进行中', 'name')).toBe(false);
    expect(canEditVoteField('进行中', 'startAt')).toBe(false);
    expect(canEditVoteField('进行中', 'endAt')).toBe(true);
    expect(canEditVoteField('进行中', 'quota')).toBe(true);
    expect(canEditVoteField('进行中', 'quotaMode')).toBe(true);
    expect(canEditVoteField('进行中', 'allowComment')).toBe(true);
    expect(canEditVoteField('已结束', 'endAt')).toBe(false);
  });

  it('blocks identity edits on options that already have ballots', () => {
    expect(canMutateVoteOption('进行中', false, 'delete')).toBe(true);
    expect(canMutateVoteOption('进行中', true, 'delete')).toBe(false);
    expect(canMutateVoteOption('进行中', true, 'changeIdentity')).toBe(false);
    expect(canMutateVoteOption('进行中', true, 'changeCopy')).toBe(true);
    expect(canMutateVoteOption('进行中', false, 'add')).toBe(true);
    expect(canMutateVoteOption('已结束', false, 'add')).toBe(false);
  });
});

describe('tallyVoteResults', () => {
  it('uses competition ranking and integer percents', () => {
    const ballots: VoteBallot[] = [
      { id: 1, campaignId: 1, optionId: 1, voterId: '张悦', voterName: '张悦', votedAt: '2026-08-21 10:00:00', dayKey: '2026-08-21' },
      { id: 2, campaignId: 1, optionId: 2, voterId: '李明', voterName: '李明', votedAt: '2026-08-21 10:01:00', dayKey: '2026-08-21' },
      { id: 3, campaignId: 1, optionId: 1, voterId: '王芳', voterName: '王芳', votedAt: '2026-08-21 10:02:00', dayKey: '2026-08-21' },
      { id: 4, campaignId: 1, optionId: 2, voterId: '黄码', voterName: '黄码', votedAt: '2026-08-21 10:03:00', dayKey: '2026-08-21' },
    ];
    const rows = tallyVoteResults(options, ballots);
    expect(rows.map((row) => ({ id: row.option.id, rank: row.rank, voteCount: row.voteCount, percent: row.percent }))).toEqual([
      { id: 1, rank: 1, voteCount: 2, percent: 50 },
      { id: 2, rank: 1, voteCount: 2, percent: 50 },
      { id: 3, rank: 3, voteCount: 0, percent: 0 },
    ]);
  });

  it('returns empty percent when there are no ballots', () => {
    const rows = tallyVoteResults(options, []);
    expect(rows.every((row) => row.percent === null && row.voteCount === 0 && row.rank === 1)).toBe(true);
  });
});

describe('displayVoterName', () => {
  it('masks the real name when anonymous', () => {
    expect(displayVoterName(true, '张悦')).toBe('匿名');
    expect(displayVoterName(false, '张悦')).toBe('张悦');
  });
});

describe('wouldExceedDailyQuota', () => {
  it('blocks a third vote and same-option stack when stacking is off', () => {
    const ballots: VoteBallot[] = [
      { id: 1, campaignId: 1, optionId: 1, voterId: '张悦', voterName: '张悦', votedAt: '2026-08-21 10:00:00', dayKey: '2026-08-21' },
      { id: 2, campaignId: 1, optionId: 2, voterId: '张悦', voterName: '张悦', votedAt: '2026-08-21 11:00:00', dayKey: '2026-08-21' },
    ];
    expect(wouldExceedDailyQuota(campaign, ballots, '张悦', 3, '2026-08-21')).toBe(true);
    expect(wouldExceedDailyQuota({ ...campaign, quota: 3 }, ballots, '张悦', 1, '2026-08-21')).toBe(true);
    expect(wouldExceedDailyQuota({ ...campaign, quota: 3 }, ballots, '张悦', 3, '2026-08-21')).toBe(false);
    expect(wouldExceedDailyQuota({ ...campaign, quota: 3, allowStackOnSameOption: true }, ballots, '张悦', 1, '2026-08-21')).toBe(false);
  });
});

const choiceQuestion: VoteQuestion = {
  id: 10,
  campaignId: 1,
  sortOrder: 0,
  type: '多选',
  stem: '想去哪',
  choices: [
    { id: 1, sortOrder: 0, label: '临安', imageUrl: '' },
    { id: 2, sortOrder: 1, label: '安吉', imageUrl: '' },
    { id: 3, sortOrder: 2, label: '莫干山', imageUrl: '' },
  ],
  minScore: 1,
  maxScore: 5,
};

const scoreQuestion: VoteQuestion = {
  id: 11,
  campaignId: 1,
  sortOrder: 1,
  type: '打分题',
  stem: '满意度',
  choices: [],
  minScore: 1,
  maxScore: 5,
};

describe('tallyQuestionChoices', () => {
  it('counts each selected choice and uses hit-count percents', () => {
    const answers: VoteAnswer[] = [
      { id: 1, responseId: 1, questionId: 10, choiceIds: [1, 2], text: '', score: null },
      { id: 2, responseId: 2, questionId: 10, choiceIds: [1], text: '', score: null },
    ];
    const rows = tallyQuestionChoices(choiceQuestion, answers);
    expect(rows.map((row) => ({ id: row.choice.id, voteCount: row.voteCount, rank: row.rank, percent: row.percent }))).toEqual([
      { id: 1, voteCount: 2, rank: 1, percent: 67 },
      { id: 2, voteCount: 1, rank: 2, percent: 33 },
      { id: 3, voteCount: 0, rank: 3, percent: 0 },
    ]);
  });
});

describe('voteScoreRangeError', () => {
  it('allows 1 to 10 and rejects above 10', () => {
    expect(voteScoreDefaultMax).toBe(10);
    expect(voteScoreAbsMax).toBe(10);
    expect(voteScoreRangeError(1, 10)).toBeUndefined();
    expect(voteScoreRangeError(0, 10)).toBeUndefined();
    expect(voteScoreRangeError(1, 11)).toBe('打分范围须在 0～10');
    expect(voteScoreRangeError(1, 5)).toBeUndefined();
    expect(voteScoreRangeError(5, 5)).toBe('打分题最低分须小于最高分');
  });
});

describe('averageQuestionScore', () => {
  it('averages scores to one decimal', () => {
    const answers: VoteAnswer[] = [
      { id: 1, responseId: 1, questionId: 11, choiceIds: [], text: '', score: 5 },
      { id: 2, responseId: 2, questionId: 11, choiceIds: [], text: '', score: 4 },
      { id: 3, responseId: 3, questionId: 11, choiceIds: [], text: '', score: 4 },
    ];
    expect(averageQuestionScore(scoreQuestion, answers)).toBe(4.3);
  });
});

describe('parseVoteCrowdCsv', () => {
  it('reads unique 姓名 cells from a crowd template', () => {
    const csv = '工号,姓名,部门\nE1001,张悦,前端组\nE1002,李明,前端组\nE1001,张悦,前端组\n';
    expect(parseVoteCrowdCsv(csv)).toEqual({ names: ['张悦', '李明'] });
    expect(parseVoteCrowdCsv('').error).toBe('文件为空');
    expect(parseVoteCrowdCsv('工号,部门\nE1001,前端组').error).toBe('缺少姓名列');
  });
});

describe('visual choice copy limits', () => {
  it('caps image and person titles at 20 and subtitles at 50', () => {
    expect(voteVisualTitleMax).toBe(20);
    expect(voteVisualSubtitleMax).toBe(50);
  });
});

describe('person choice title', () => {
  it('puts name and department on the main title', () => {
    expect(votePersonChoiceTitle('张悦', '前端组')).toBe('张悦·前端组');
    expect(votePersonChoiceTitle('钱会', '财务')).toBe('钱会·财务');
    expect(votePersonChoiceTitle('张悦', '')).toBe('张悦');
    expect(voteChoiceAvatarName({ label: '张悦·前端组', employeeId: '张悦' })).toBe('张悦');
  });
});

describe('person question types', () => {
  it('adds 人员单选 and 人员多选 as visual choice types', () => {
    expect(voteQuestionTypes).toEqual(['单选', '多选', '图片单选', '图片多选', '人员单选', '人员多选', '问答题', '打分题']);
    expect(isPersonQuestionType('人员单选')).toBe(true);
    expect(isPersonQuestionType('人员多选')).toBe(true);
    expect(isChoiceQuestionType('人员单选')).toBe(true);
    expect(isChoiceQuestionType('人员多选')).toBe(true);
    expect(isVisualChoiceQuestionType('人员单选')).toBe(true);
    expect(isVisualChoiceQuestionType('图片多选')).toBe(true);
    expect(isImageQuestionType('人员单选')).toBe(false);
    expect(isSingleChoiceQuestionType('人员单选')).toBe(true);
    expect(isSingleChoiceQuestionType('人员多选')).toBe(false);
  });
});

describe('wouldExceedSurveyQuota', () => {
  it('counts whole-form submits per day when mode is 每天', () => {
    const responses: VoteResponse[] = [
      { id: 1, campaignId: 1, voterId: '张悦', voterName: '张悦', submittedAt: '2026-08-21 10:00:00', dayKey: '2026-08-21' },
      { id: 2, campaignId: 1, voterId: '张悦', voterName: '张悦', submittedAt: '2026-08-21 11:00:00', dayKey: '2026-08-21' },
    ];
    expect(wouldExceedSurveyQuota(campaign, responses, '张悦', '2026-08-21')).toBe(true);
    expect(wouldExceedSurveyQuota({ ...campaign, quota: 3 }, responses, '张悦', '2026-08-21')).toBe(false);
    expect(wouldExceedSurveyQuota({ ...campaign, quotaMode: '每人', quota: 2 }, responses, '张悦', '2026-08-22')).toBe(true);
    expect(wouldExceedSurveyQuota({ ...campaign, quotaMode: '每人', quota: 3 }, responses, '张悦', '2026-08-22')).toBe(false);
  });
});

describe('vote quota modes', () => {
  it('treats per-person and per-day limits as exclusive labels', () => {
    expect(voteQuotaModes).toEqual(['每人', '每天']);
    expect(voteQuotaFieldLabel('每人')).toBe('每人能投');
    expect(voteQuotaFieldLabel('每天')).toBe('每人每天能投');
    expect(voteQuotaRuleText({ quotaMode: '每天', quota: 2 })).toBe('每人每天能投 2 次，整卷提交，每次计入汇总');
    expect(voteQuotaRuleText({ quotaMode: '每人', quota: 1 })).toBe('每人能投 1 次，整卷提交，每次计入汇总');
  });
});
