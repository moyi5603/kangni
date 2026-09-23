import { describe, expect, it } from 'vitest';
import type { CategoryNode } from '../../../shared/category-tree/categoryTree';
import {
  appendStagePlanIds,
  applyBatchEligibleStages,
  canDeleteRegion,
  contestAccessLabel,
  contestPageLabel,
  contestMapLabel,
  CONTEST_MAPS,
  contestStatusOf,
  defaultChallengeFields,
  defaultEligibleStageIds,
  enabledRegions,
  filterRegionForest,
  isRegionNameTaken,
  regionDisplayName,
  regionLevelOf,
  regionMatchesFilter,
  regionTree,
  pruneEligibleStageIds,
  publishedPlansForPicker,
  removeStagePlanId,
  validateChallengeStage,
  validateContestDraft,
  challengeLogColumnCount,
  filterChallengeDayLogs,
  formatChallengeGateCell,
  type ChallengeDayLog,
  type ContestDraft,
  type ContestSignup,
  type Region,
} from './contest';
import { defaultContestSignupFields, removeContestSignupField } from './contestSignupFields';

const tree: CategoryNode[] = [
  { id: 101, name: '每日一练' },
  { id: 102, name: '专项突破' },
];

function draft(patch?: Partial<ContestDraft>): ContestDraft {
  return {
    id: 1,
    name: '技能公开赛',
    logoUrl: 'logo.png',
    description: '',
    startAt: '2026-09-01 09:00',
    endAt: '2026-10-31 18:00',
    stages: [
      {
        id: 's1',
        name: '初赛',
        startAt: '2026-09-01 09:00',
        endAt: '2026-09-30 18:00',
        ...defaultChallengeFields(),
      },
    ],
    signupFields: defaultContestSignupFields(),
    h5Page: 'none',
    pcPage: 'none',
    access: 'tenant',
    ...patch,
  };
}

describe('contestStatusOf', () => {
  it('derives status from hold time', () => {
    const item = draft();
    expect(contestStatusOf(item, Date.parse('2026-08-01T00:00:00+08:00'))).toBe('未开始');
    expect(contestStatusOf(item, Date.parse('2026-09-10T12:00:00+08:00'))).toBe('进行中');
    expect(contestStatusOf(item, Date.parse('2026-11-01T00:00:00+08:00'))).toBe('已结束');
  });
});

describe('validateContestDraft', () => {
  it('rejects duplicate names', () => {
    expect(validateContestDraft(draft({ name: '已有大赛' }), ['已有大赛'])).toEqual('大赛名称不能重复');
  });

  it('rejects stages outside hold time', () => {
    const item = draft({
      stages: [
        {
          id: 's1',
          name: '初赛',
          startAt: '2026-08-01 09:00',
          endAt: '2026-09-30 18:00',
          ...defaultChallengeFields(),
        },
      ],
    });
    expect(validateContestDraft(item, [])).toEqual('阶段时间须落在举办时间内');
  });

  it('allows adjacent stages and rejects overlap', () => {
    const adjacent = draft({
      stages: [
        {
          id: 's1',
          name: '初赛',
          startAt: '2026-09-01 09:00',
          endAt: '2026-09-30 18:00',
          ...defaultChallengeFields(),
        },
        {
          id: 's2',
          name: '复赛',
          startAt: '2026-09-30 18:00',
          endAt: '2026-10-31 18:00',
          ...defaultChallengeFields(),
        },
      ],
    });
    expect(validateContestDraft(adjacent, [])).toBeUndefined();

    const overlap = draft({
      stages: [
        {
          id: 's1',
          name: '初赛',
          startAt: '2026-09-01 09:00',
          endAt: '2026-10-10 18:00',
          ...defaultChallengeFields(),
        },
        {
          id: 's2',
          name: '复赛',
          startAt: '2026-10-01 09:00',
          endAt: '2026-10-31 18:00',
          ...defaultChallengeFields(),
        },
      ],
    });
    expect(validateContestDraft(overlap, [])).toEqual('阶段时间不可重叠');
  });
});

describe('stage learning plan ids', () => {
  it('appends unique ids in order and removes one', () => {
    expect(appendStagePlanIds([1], [2, 1, 3])).toEqual([1, 2, 3]);
    expect(removeStagePlanId([1, 2, 3], 2)).toEqual([1, 3]);
  });

  it('picker lists published plans not already bound', () => {
    const plans = [
      { id: 1, status: 'published' as const, name: 'A' },
      { id: 2, status: 'draft' as const, name: 'B' },
      { id: 3, status: 'published' as const, name: 'C' },
    ];
    expect(publishedPlansForPicker(plans, [1]).map((item) => item.id)).toEqual([3]);
  });
});

describe('validateChallengeStage', () => {
  it('requires categories and pass count within questions per gate', () => {
    const base = { ...defaultChallengeFields(), categoryIds: [] as number[], questionsPerGate: 5, passCorrectCount: 6 };
    expect(validateChallengeStage(base, tree, [])).toEqual('请选择习题分类');
    expect(validateChallengeStage({ ...base, categoryIds: [101], passCorrectCount: 6 }, tree, [])).toEqual(
      '答对题数不能大于每关题数',
    );
    expect(validateChallengeStage({ ...base, categoryIds: [999], passCorrectCount: 3 }, tree, [])).toEqual(
      '习题分类已失效，请重新选择',
    );
  });

  it('requires enough picked questions', () => {
    const stage = {
      ...defaultChallengeFields(),
      drawMode: 'picked' as const,
      categoryIds: [101],
      questionIds: [1, 2],
      questionsPerGate: 5,
      passCorrectCount: 3,
    };
    expect(validateChallengeStage(stage, tree, [])).toEqual('指定题目数量不能少于每关题数');
  });

  it('rejects daily gate count above 8', () => {
    const stage = { ...defaultChallengeFields(), categoryIds: [101], dailyGateCount: 9 };
    expect(validateChallengeStage(stage, tree, [])).toEqual('每日关卡数量须为 1–8');
  });

  it('requires one of three challenge maps', () => {
    expect(contestMapLabel('island')).toBe('岛屿闯关');
    expect(contestMapLabel('city')).toBe('城市路线');
    expect(contestMapLabel('factory')).toBe('车间通道');
    expect(CONTEST_MAPS.map((item) => item.imageUrl)).toEqual([
      '/contest-maps/island.svg',
      '/contest-maps/city.svg',
      '/contest-maps/factory.svg',
    ]);
    const stage = { ...defaultChallengeFields(), categoryIds: [101], mapId: 'nope' as 'island' };
    expect(validateChallengeStage(stage, tree, [])).toEqual('请选择闯关地图');
  });
});

describe('challenge day logs', () => {
  const logs: ChallengeDayLog[] = [
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
      signupId: 2,
      date: '2026-09-03',
      gates: [{ attempts: 3, passed: true }, { attempts: 0, passed: false }, { attempts: 0, passed: false }],
    },
  ];
  const signups: ContestSignup[] = [
    { id: 1, contestId: 1, answers: { 姓名: '王磊' }, regionId: 1, eligibleStageIds: ['s1'], createdAt: '' },
    { id: 2, contestId: 1, answers: { 姓名: '陈芳' }, regionId: 1, eligibleStageIds: ['s1'], createdAt: '' },
  ];
  const stages = [
    { id: 's1', dailyGateCount: 3 },
    { id: 's2', dailyGateCount: 2 },
  ];

  it('formats cells and column count', () => {
    expect(formatChallengeGateCell({ attempts: 0, passed: false })).toBe('—');
    expect(formatChallengeGateCell({ attempts: 2, passed: false })).toBe('闯 2 次 / 未通过');
    expect(formatChallengeGateCell({ attempts: 1, passed: true })).toBe('闯 1 次 / 通过');
    expect(formatChallengeGateCell(undefined)).toBe('—');
    expect(challengeLogColumnCount(stages, 'all')).toBe(3);
    expect(challengeLogColumnCount(stages, 's2')).toBe(2);
  });

  it('filters by name date and stage', () => {
    expect(filterChallengeDayLogs(logs, signups, { name: '王磊', date: '', stageId: 'all' }).map((item) => item.id)).toEqual([1]);
    expect(filterChallengeDayLogs(logs, signups, { name: '', date: '2026-09-03', stageId: 's1' }).map((item) => item.id)).toEqual([
      1, 2,
    ]);
  });
});

describe('signup stage eligibility', () => {
  it('defaults to first stage and batch replace does not append', () => {
    expect(defaultEligibleStageIds([{ id: 's1' }, { id: 's2' }])).toEqual(['s1']);
    const rows: ContestSignup[] = [
      { id: 1, contestId: 1, answers: {}, regionId: 1, eligibleStageIds: ['s1'], createdAt: '2026-09-01 10:00' },
      { id: 2, contestId: 1, answers: {}, regionId: 1, eligibleStageIds: ['s1', 's2'], createdAt: '2026-09-01 11:00' },
    ];
    expect(applyBatchEligibleStages(rows, [1, 2], ['s2']).map((item) => item.eligibleStageIds)).toEqual([['s2'], ['s2']]);
  });

  it('drops missing stage ids after a stage is removed', () => {
    expect(pruneEligibleStageIds(['s1', 'gone'], ['s1'])).toEqual(['s1']);
  });
});

describe('regions', () => {
  const regions: Region[] = [
    { id: 1, name: '江苏省', parentId: null, sort: 1, enabled: true },
    { id: 2, name: '广东省', parentId: null, sort: 2, enabled: false },
    { id: 3, name: '南京市', parentId: 1, sort: 1, enabled: true },
    { id: 4, name: '鼓楼区', parentId: 3, sort: 1, enabled: true },
  ];

  it('lists enabled regions in sort order and blocks used deletes', () => {
    expect(enabledRegions(regions).map((item) => item.name)).toEqual(['江苏省', '南京市', '鼓楼区']);
    expect(isRegionNameTaken(regions, '江苏省', null)).toBe(true);
    expect(isRegionNameTaken(regions, '鼓楼区', 3)).toBe(true);
    expect(isRegionNameTaken(regions, '鼓楼区', 1)).toBe(false);
    expect(canDeleteRegion(1, [], regions)).toBe(false);
    expect(canDeleteRegion(4, [{ regionId: 4 }], regions)).toBe(false);
    expect(canDeleteRegion(2, [{ regionId: 4 }], regions)).toBe(true);
  });

  it('builds province/city/district path and tree', () => {
    expect(regionLevelOf(regions, 1)).toBe('province');
    expect(regionLevelOf(regions, 3)).toBe('city');
    expect(regionLevelOf(regions, 4)).toBe('district');
    expect(regionDisplayName(regions, 4)).toBe('江苏省 / 南京市 / 鼓楼区');
    expect(regionTree(regions).map((item) => item.name)).toEqual(['江苏省', '广东省']);
    expect(regionMatchesFilter(regions, 4, 1)).toBe(true);
    expect(regionMatchesFilter(regions, 4, 2)).toBe(false);
    expect(filterRegionForest(regions, (item) => item.name === '鼓楼区').map((item) => item.name)).toEqual([
      '江苏省',
      '南京市',
      '鼓楼区',
    ]);
  });
});

describe('contestSignupFields', () => {
  it('keeps 所属区域 fixed', () => {
    const fields = defaultContestSignupFields();
    expect(fields.some((item) => item.key === '所属区域' && item.fixed)).toBe(true);
    expect(removeContestSignupField(fields, '所属区域').some((item) => item.key === '所属区域')).toBe(true);
  });
});

describe('labels', () => {
  it('maps page and access enums', () => {
    expect(contestPageLabel('home')).toBe('技能大赛首页');
    expect(contestAccessLabel('tenant')).toBe('仅租户成员');
  });
});
