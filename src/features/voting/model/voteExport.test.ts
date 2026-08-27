import { beforeEach, describe, expect, it } from 'vitest';
import { getVoteAnswers, getVoteBallots, getVoteOptions, getVoteQuestions, getVoteResponses, __resetVoteStoreForTests } from './voteStore';
import { buildContestVoteExportCsv, buildVoteResultExportCsv } from './voteExport';
import type { VoteAnswer, VoteQuestion, VoteResponse } from './voting';

beforeEach(() => {
  __resetVoteStoreForTests();
});

describe('buildVoteResultExportCsv', () => {
  it('puts 姓名 部门 投票时间 then question stems across columns', () => {
    const csv = buildVoteResultExportCsv({
      questions: getVoteQuestions(2),
      responses: getVoteResponses(2),
      answers: getVoteAnswers(2),
    });
    const [header, first] = csv.split('\n');
    expect(header).toBe(
      '姓名,部门,投票时间,团建目的地,还想补充的目的地？,对本次团建方案的满意度,更喜欢哪张活动海报？',
    );
    expect(first).toContain('张悦');
    expect(first).toContain('前端组');
    expect(first).toContain('临安');
    expect(first).toContain('想去山里露营');
    expect(first).toContain(',5,');
    expect(first).toContain('海报 A（春季团建主视觉）');
    expect(csv).toContain('李明');
    expect(csv).toContain('安吉竹海');
    expect(csv).toContain('海报 B（开放日宣传）');
  });

  it('joins multi-choice labels and quotes commas in filled text', () => {
    const questions: VoteQuestion[] = [
      {
        id: 1,
        campaignId: 1,
        sortOrder: 0,
        type: '多选',
        stem: '想去哪',
        choices: [
          { id: 1, sortOrder: 0, label: '临安', imageUrl: '' },
          { id: 2, sortOrder: 1, label: '安吉', imageUrl: '' },
        ],
        minScore: 1,
        maxScore: 5,
      },
      {
        id: 2,
        campaignId: 1,
        sortOrder: 1,
        type: '问答题',
        stem: '备注',
        choices: [],
        minScore: 1,
        maxScore: 5,
      },
    ];
    const responses: VoteResponse[] = [
      { id: 1, campaignId: 1, voterId: '张悦', voterName: '张悦', submittedAt: '2026-08-26 10:00:00', dayKey: '2026-08-26' },
    ];
    const answers: VoteAnswer[] = [
      { id: 1, responseId: 1, questionId: 1, choiceIds: [1, 2], text: '', score: null },
      { id: 2, responseId: 1, questionId: 2, choiceIds: [], text: '近一点,方便停车', score: null },
    ];
    const csv = buildVoteResultExportCsv({ questions, responses, answers });
    expect(csv).toContain('临安、安吉');
    expect(csv).toContain('"近一点,方便停车"');
  });
});

describe('buildContestVoteExportCsv', () => {
  it('exports name dept time and option title', () => {
    const csv = buildContestVoteExportCsv({
      options: getVoteOptions(4),
      ballots: getVoteBallots(4),
    });
    expect(csv.split('\n')[0]).toBe('姓名,部门,投票时间,选项');
    expect(csv).toContain('张悦');
    expect(csv).toContain('前端组');
  });
});
