import { describe, expect, it } from 'vitest';
import { getVote, getVoteQuestions, getVoteResponses, getVotes } from '../../../voting/model/voteStore';
import { resolveVoteStatus, type VoteQuestion } from '../../../voting/model/voting';
import {
  DEMO_VOTE_USER,
  canSeeOrdinaryVote,
  listCardCta,
  listVisibleOrdinaryVotes,
  remainingQuota,
  resolveVoteDetailGate,
  validateVoteDraft,
} from './clientVote';

function nowStamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

describe('clientVote visibility', () => {
  it('lets 张悦 see all-staff and 研发中心 ordinary votes, not 评选 or 生产中心', () => {
    const byId = Object.fromEntries(getVotes().map((item) => [item.id, item]));
    expect(canSeeOrdinaryVote(byId[1], DEMO_VOTE_USER)).toBe(true);
    expect(canSeeOrdinaryVote(byId[2], DEMO_VOTE_USER)).toBe(true);
    expect(canSeeOrdinaryVote(byId[3], DEMO_VOTE_USER)).toBe(false);
    expect(canSeeOrdinaryVote(byId[4], DEMO_VOTE_USER)).toBe(false);
    expect(canSeeOrdinaryVote(byId[5], DEMO_VOTE_USER)).toBe(false);
  });

  it('lets imported-crowd members see 导入人群 votes', () => {
    const campaign = {
      ...getVote(1)!,
      visibility: '导入人群' as const,
      importedPeople: ['张悦', '王芳'],
      importFileName: '投票人群.csv',
    };
    expect(canSeeOrdinaryVote(campaign, DEMO_VOTE_USER)).toBe(true);
    expect(canSeeOrdinaryVote(campaign, { ...DEMO_VOTE_USER, id: '李明', name: '李明' })).toBe(false);
  });
});

describe('clientVote list', () => {
  it('defaults ongoing tab to 部门团建目的地', () => {
    const now = nowStamp();
    const rows = listVisibleOrdinaryVotes('进行中', now);
    expect(rows.map((item) => item.name)).toEqual(['优秀员工投票', '创新项目投票', '部门团建目的地']);
    expect(resolveVoteStatus(rows[0], now)).toBe('进行中');
  });

  it('counts remaining quota from today only', () => {
    const campaign = getVote(2);
    expect(campaign).toBeTruthy();
    const remaining = remainingQuota(campaign!, DEMO_VOTE_USER.id, nowStamp().slice(0, 10), getVoteResponses(2));
    expect(remaining).toBe(2);
    expect(listCardCta('进行中', remaining, campaign!.quota, campaign!.quotaMode)).toBe('去投票');
    expect(listCardCta('未开始', 1, 1)).toBe('未开始');
    expect(listCardCta('已结束', 0, 1)).toBe('查看票数');
    expect(listCardCta('进行中', 1, 2, '每天')).toBe('今日还可投 1 次');
    expect(listCardCta('进行中', 1, 2, '每人')).toBe('还可投 1 次');
    expect(listCardCta('进行中', 0, 2)).toBe('查看票数');
  });
});

describe('clientVote detail helpers', () => {
  it('gates missing, forbidden, form and result', () => {
    const now = nowStamp();
    expect(resolveVoteDetailGate(undefined, DEMO_VOTE_USER, now, 0)).toBe('missing');
    expect(resolveVoteDetailGate(getVote(3), DEMO_VOTE_USER, now, 0)).toBe('missing');
    expect(resolveVoteDetailGate(getVote(5), DEMO_VOTE_USER, now, 0)).toBe('forbidden');
    expect(resolveVoteDetailGate(getVote(1), DEMO_VOTE_USER, now, 0)).toBe('form');
    expect(resolveVoteDetailGate(getVote(2), DEMO_VOTE_USER, now, 0)).toBe('form');
    expect(resolveVoteDetailGate(getVote(2), DEMO_VOTE_USER, now, 1)).toBe('result');
  });

  it('validates a complete draft and incomplete questions', () => {
    const questions = getVoteQuestions(2);
    expect(validateVoteDraft(questions, {})).toBe('请完成全部题目');
    expect(
      validateVoteDraft(questions, {
        2: { choiceIds: [3], text: '', score: null },
        3: { choiceIds: [], text: '西湖', score: null },
        4: { choiceIds: [], text: '', score: 5 },
        5: { choiceIds: [8], text: '', score: null },
      }),
    ).toBeNull();
    expect(
      validateVoteDraft(questions, {
        2: { choiceIds: [3], text: '', score: null },
        3: { choiceIds: [], text: 'x'.repeat(501), score: null },
        4: { choiceIds: [], text: '', score: 5 },
        5: { choiceIds: [8], text: '', score: null },
      }),
    ).toBe('补充说明不能超过 500 字');
  });

  it('requires one person for 人员单选 and at least one for 人员多选', () => {
    const personSingle: VoteQuestion = {
      id: 21,
      campaignId: 1,
      sortOrder: 0,
      type: '人员单选',
      stem: '最佳搭档',
      choices: [
        { id: 1, sortOrder: 0, label: '张悦', subtitle: '前端组', imageUrl: '', employeeId: '张悦' },
        { id: 2, sortOrder: 1, label: '李明', subtitle: '前端组', imageUrl: '', employeeId: '李明' },
      ],
      minScore: 1,
      maxScore: 5,
    };
    const personMulti = { ...personSingle, id: 22, type: '人员多选' as const };
    expect(validateVoteDraft([personSingle], { 21: { choiceIds: [1, 2], text: '', score: null } })).toBe('请完成全部题目');
    expect(validateVoteDraft([personSingle], { 21: { choiceIds: [1], text: '', score: null } })).toBeNull();
    expect(validateVoteDraft([personMulti], { 22: { choiceIds: [], text: '', score: null } })).toBe('请完成全部题目');
    expect(validateVoteDraft([personMulti], { 22: { choiceIds: [1, 2], text: '', score: null } })).toBeNull();
  });
});
