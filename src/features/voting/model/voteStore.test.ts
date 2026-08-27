import { beforeEach, describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import { canDeleteVote, resolveVoteStatus, type VoteCampaign, type VoteQuestion } from './voting';
import {
  __resetVoteStoreForTests,
  addVoteComment,
  deleteVoteComment,
  getVote,
  getVoteBallots,
  getVoteComments,
  getVoteQuestions,
  getVoteResponses,
  getVotes,
  removeVote,
  removeVoteComments,
  submitVoteResponse,
  toggleVoteCommentLike,
  upsertVote,
} from './voteStore';

beforeEach(() => {
  __resetVoteStoreForTests();
});

const blankQuestion = (campaignId: number, id: number): VoteQuestion => ({
  id,
  campaignId,
  sortOrder: 0,
  type: '单选',
  stem: '题目',
  choices: [
    { id: 1, sortOrder: 0, label: '甲', imageUrl: '' },
    { id: 2, sortOrder: 1, label: '乙', imageUrl: '' },
  ],
  minScore: 1,
  maxScore: 5,
});

describe('voteStore', () => {
  it('seeds seven campaigns covering types, anonymity and visibilities', () => {
    const rows = getVotes();
    expect(rows).toHaveLength(7);
    expect(rows.map((item) => item.name)).toEqual([
      '午餐口味征集',
      '部门团建目的地',
      '季度明星员工与作品',
      '年度优秀提案评选',
      '工装颜色连投测试',
      '创新项目投票',
      '优秀员工投票',
    ]);
    expect(new Set(rows.map((item) => item.visibility)).size).toBe(3);
    expect(rows.some((item) => item.anonymous)).toBe(true);
    expect(rows.some((item) => item.type === '评选投票')).toBe(true);
  });

  it('seeds an innovation project vote with 10 left-image multi choices', () => {
    const campaign = getVotes().find((item) => item.name === '创新项目投票');
    expect(campaign?.type).toBe('普通投票');
    const questions = getVoteQuestions(campaign!.id);
    expect(questions).toHaveLength(1);
    expect(questions[0].type).toBe('图片多选');
    expect(questions[0].imageLayout).toBe('左图右文');
    expect(questions[0].choices).toHaveLength(10);
    expect(questions[0].choices[0].label).toHaveLength(20);
    expect(questions[0].choices[0].subtitle).toHaveLength(50);
    expect(questions[0].choices.every((item) => item.imageUrl && item.label)).toBe(true);
  });

  it('seeds an outstanding-employee vote with 10 stacked people', () => {
    const campaign = getVotes().find((item) => item.name === '优秀员工投票');
    expect(campaign?.type).toBe('普通投票');
    const questions = getVoteQuestions(campaign!.id);
    expect(questions).toHaveLength(1);
    expect(questions[0].type).toBe('人员单选');
    expect(questions[0].imageLayout).toBe('上图下文');
    expect(questions[0].choices).toHaveLength(10);
    expect(questions[0].choices.map((item) => item.label)).toEqual([
      '张悦·前端组',
      '李明·前端组',
      '王芳·后端组',
      '黄码·后端组',
      '苏然·测试组',
      '周工·总装车间',
      '陈产品·华东大区',
      '林销·华南大区',
      '赵人事·人力资源',
      '钱会·财务',
    ]);
    expect(questions[0].choices[0].subtitle).toHaveLength(50);
    expect(questions[0].choices.slice(1).every((item) => item.subtitle === '' && item.employeeId)).toBe(true);
  });

  it('upserts and cascade-deletes options and ballots', () => {
    const now = '2099-01-01 00:00:00';
    const record: VoteCampaign = {
      id: 99,
      name: '可删草稿',
      type: '普通投票',
      anonymous: false,
      startAt: '2099-02-01 09:00:00',
      endAt: '2099-03-01 18:00:00',
      intro: '',
      quotaMode: '每天',
      quota: 1,
      allowComment: false,
      allowStackOnSameOption: false,
      visibility: '全员',
      departments: [],
      people: [],
      importFileName: '',
      importedPeople: [],
    };
    upsertVote(record, [], [blankQuestion(99, 1)]);
    expect(getVote(99)?.name).toBe('可删草稿');
    expect(getVoteQuestions(99)).toHaveLength(1);
    expect(canDeleteVote(resolveVoteStatus(record, now))).toBe(true);
    expect(removeVote(99)).toBe(true);
    expect(getVote(99)).toBeUndefined();
    expect(getVoteQuestions(99)).toHaveLength(0);
    expect(getVoteResponses(99)).toHaveLength(0);
    expect(getVoteBallots(99)).toHaveLength(0);
  });

  it('refuses to delete in-progress or ended campaigns', () => {
    const live = getVotes().find((item) => item.name === '部门团建目的地');
    const ended = getVotes().find((item) => item.name === '年度优秀提案评选');
    expect(live).toBeTruthy();
    expect(ended).toBeTruthy();
    expect(removeVote(live!.id)).toBe(false);
    expect(removeVote(ended!.id)).toBe(false);
    expect(getVote(live!.id)).toBeTruthy();
  });

  it('appends a survey response and refuses quota overflow', () => {
    const today = dayjs().format('YYYY-MM-DD');
    const answers = [
      { questionId: 2, choiceIds: [3], text: '', score: null },
      { questionId: 3, choiceIds: [], text: '西湖', score: null },
      { questionId: 4, choiceIds: [], text: '', score: 5 },
      { questionId: 5, choiceIds: [8], text: '', score: null },
    ];
    const first = submitVoteResponse({
      campaignId: 2,
      voterId: '张悦',
      voterName: '张悦',
      answers,
      now: `${today} 14:00:00`,
    });
    expect(first).toEqual({ ok: true, responseId: expect.any(Number) });
    if (!first.ok) throw new Error('expected ok');
    expect(getVoteResponses(2).some((item) => item.id === first.responseId)).toBe(true);
    const second = submitVoteResponse({
      campaignId: 2,
      voterId: '张悦',
      voterName: '张悦',
      answers,
      now: `${today} 15:00:00`,
    });
    expect(second.ok).toBe(true);
    const third = submitVoteResponse({
      campaignId: 2,
      voterId: '张悦',
      voterName: '张悦',
      answers,
      now: `${today} 16:00:00`,
    });
    expect(third).toEqual({ ok: false, reason: 'quota' });
    expect(submitVoteResponse({ campaignId: 1, voterId: '张悦', voterName: '张悦', answers: [], now: '2026-08-26 14:00:00' }).ok).toBe(
      false,
    );
    expect(submitVoteResponse({ campaignId: 3, voterId: '张悦', voterName: '张悦', answers: [], now: '2026-08-26 14:00:00' })).toEqual({
      ok: false,
      reason: 'not-survey',
    });
    expect(submitVoteResponse({ campaignId: 999, voterId: '张悦', voterName: '张悦', answers: [], now: '2026-08-26 14:00:00' })).toEqual({
      ok: false,
      reason: 'missing',
    });
  });

  it('accepts multiple people on 人员多选 and rejects extra picks on 人员单选', () => {
    const record: VoteCampaign = {
      id: 88,
      name: '人员题',
      type: '普通投票',
      anonymous: false,
      startAt: '2020-01-01 09:00:00',
      endAt: '2099-01-01 18:00:00',
      intro: '',
      quotaMode: '每天',
      quota: 3,
      allowComment: false,
      allowStackOnSameOption: false,
      visibility: '全员',
      departments: [],
      people: [],
      importFileName: '',
      importedPeople: [],
    };
    const multi: VoteQuestion = {
      id: 80,
      campaignId: 88,
      sortOrder: 0,
      type: '人员多选',
      stem: '支持谁',
      imageLayout: '左图右文',
      choices: [
        { id: 801, sortOrder: 0, label: '张悦', subtitle: '前端组', imageUrl: '', employeeId: '张悦' },
        { id: 802, sortOrder: 1, label: '李明', subtitle: '前端组', imageUrl: '', employeeId: '李明' },
      ],
      minScore: 1,
      maxScore: 5,
    };
    upsertVote(record, [], [multi]);
    const ok = submitVoteResponse({
      campaignId: 88,
      voterId: '王芳',
      voterName: '王芳',
      answers: [{ questionId: 80, choiceIds: [801, 802], text: '', score: null }],
      now: '2026-08-26 14:00:00',
    });
    expect(ok.ok).toBe(true);
    upsertVote(record, [], [{ ...multi, type: '人员单选' }]);
    expect(
      submitVoteResponse({
        campaignId: 88,
        voterId: '黄码',
        voterName: '黄码',
        answers: [{ questionId: 80, choiceIds: [801, 802], text: '', score: null }],
        now: '2026-08-26 14:00:00',
      }),
    ).toEqual({ ok: false, reason: 'invalid' });
  });
});

describe('vote comments', () => {
  it('threads replies, likes and own-delete like activity comments', () => {
    const added = addVoteComment({
      campaignId: 2,
      authorId: '张悦',
      authorName: '张悦',
      text: '  临安近一点  ',
      parentId: 1,
    });
    expect(added).toEqual({ ok: true });
    const reply = getVoteComments(2).find((item) => item.text === '临安近一点');
    expect(reply?.parentId).toBe(1);
    expect(toggleVoteCommentLike(1, '张悦')).toBe('ok');
    expect(getVoteComments(2).find((item) => item.id === 1)?.likedBy).toContain('张悦');
    expect(deleteVoteComment(1, '张悦')).toBe('forbidden');
    expect(deleteVoteComment(reply!.id, '张悦')).toBe('ok');
    expect(getVoteComments(2).some((item) => item.id === reply!.id)).toBe(false);
  });

  it('rejects blank or disabled comments', () => {
    expect(addVoteComment({ campaignId: 2, authorId: '张悦', authorName: '张悦', text: '  ' })).toEqual({ ok: false, reason: 'empty' });
    expect(addVoteComment({ campaignId: 1, authorId: '张悦', authorName: '张悦', text: '不行' })).toEqual({
      ok: false,
      reason: 'disabled',
    });
  });

  it('lets admin delete a comment and its replies', () => {
    expect(getVoteComments(2).map((item) => item.id)).toEqual([1, 2, 3]);
    removeVoteComments([1]);
    expect(getVoteComments(2).map((item) => item.id)).toEqual([3]);
  });
});
