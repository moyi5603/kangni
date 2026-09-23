import { describe, expect, it } from 'vitest';
import { defaultVoteV2Contestant, listVoteV2CastRecords } from './voteV2';
import { buildVoteV2RecordExportCsv } from './voteV2Export';

const contestants = [
  defaultVoteV2Contestant({ id: 1, campaignId: 2, name: '张工', optionNo: 1 }),
  defaultVoteV2Contestant({ id: 2, campaignId: 2, name: '李班', optionNo: 2 }),
  defaultVoteV2Contestant({ id: 3, campaignId: 2, name: '王姐', optionNo: 3 }),
];

describe('buildVoteV2RecordExportCsv', () => {
  it('exports name dept time and one content column for single select', () => {
    const rows = listVoteV2CastRecords(
      [{ campaignId: 1, contestantId: 1, userId: '张悦', at: '2026-09-01 12:00:00' }],
      contestants,
      1,
    );
    const csv = buildVoteV2RecordExportCsv({ selectMode: '单选', contestants, rows });
    expect(csv.split('\n')[0]).toBe('姓名,部门,投票时间,投票内容');
    expect(csv).toContain('张悦,前端组,2026-09-01 12:00:00,张工');
  });

  it('puts each option in its own column for multi select', () => {
    const rows = listVoteV2CastRecords(
      [
        { campaignId: 2, contestantId: 1, userId: '李明', at: '2026-09-01 09:12:00' },
        { campaignId: 2, contestantId: 3, userId: '李明', at: '2026-09-01 09:12:00' },
      ],
      contestants,
      2,
    );
    const csv = buildVoteV2RecordExportCsv({ selectMode: '多选', contestants, rows });
    expect(csv.split('\n')[0]).toBe('姓名,部门,投票时间,01 张工,02 李班,03 王姐');
    expect(csv.split('\n')[1]).toBe('李明,前端组,2026-09-01 09:12:00,张工,,王姐');
  });
});
