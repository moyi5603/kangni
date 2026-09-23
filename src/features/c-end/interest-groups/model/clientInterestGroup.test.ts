import { afterEach, describe, expect, it } from 'vitest';
import {
  getInterestGroupActivities,
  getInterestGroupMembers,
  getInterestGroupMoments,
  joinInterestGroupAsEmployee,
  toggleInterestGroupActivityPin,
  toggleInterestGroupPin,
  unpublishInterestGroupActivities,
  upsertInterestGroup,
  __resetInterestGroupStoreForTest,
} from '../../../interest-groups/model/interestGroupStore';
import { ME, isCEndGroupDiscoverable } from '../h5/igShared';
import {
  buildIgCatalog,
  listIgHomeHighlightMoments,
  isPublishedIgActivity,
  toClientActId,
  toClientGroupId,
} from './clientInterestGroup';

describe('C-end interest group catalog from admin store', () => {
  afterEach(() => {
    __resetInterestGroupStoreForTest();
  });

  it('maps published admin groups and activities, hiding unaudited ones from discovery', () => {
    const catalog = buildIgCatalog(ME);
    expect(catalog.groups.filter(isCEndGroupDiscoverable).map((g) => g.name)).toEqual([
      '城市夜跑团',
      '周末徒步野行',
      '深夜读书会',
      '桌游电竞局',
      '午间拉伸站',
      '周末胶片社',
    ]);
    expect(catalog.groups.filter((g) => g.createdByMe).map((g) => g.name).sort()).toEqual(
      ['午休飞盘局', '午间拉伸站', '周末胶片社'].sort(),
    );
    expect(catalog.groups.filter((g) => g.joined && !g.createdByMe).map((g) => g.name).sort()).toEqual(
      ['深夜读书会', '桌游电竞局'].sort(),
    );
    expect(catalog.groups.find((g) => g.name === '午休飞盘局')?.joined).toBe(true);
    expect(catalog.groups.find((g) => g.name === '午休飞盘局')?.createdByMe).toBe(true);
    expect(catalog.groups.find((g) => g.id === toClientGroupId(1))?.lead).toBe('张悦');
    expect(catalog.groups.find((g) => g.id === toClientGroupId(1))?.joined).toBe(false);
    expect(catalog.groups.find((g) => g.id === toClientGroupId(1))?.createdByMe).toBe(false);
    expect(catalog.groups.find((g) => g.id === toClientGroupId(1))).toMatchObject({ pinned: true, sortIndex: 0 });
    expect(catalog.acts.find((a) => a.id === toClientActId(201))).toMatchObject({ pinned: true, sortIndex: 0 });
    expect(catalog.acts.find((a) => a.id === toClientActId(101))?.pinned).toBe(false);

    expect(catalog.acts.filter((a) => a.createdByMe).map((a) => a.title).sort()).toEqual(
      ['午间拉伸十分钟', '午间拉伸跟练三期', '周末胶片冲洗局'].sort(),
    );
    expect(catalog.acts.filter((a) => a.joinedByMe && !a.createdByMe).map((a) => a.title).sort()).toEqual(
      ['初夏城市漫步', '周末连营徒步'].sort(),
    );
    expect(catalog.acts.map((a) => a.title).sort()).toEqual(
      [
        '初夏城市漫步',
        '午间拉伸十分钟',
        '午间拉伸跟练三期',
        '周五开黑体验局',
        '夏季共读三期',
        '周末连营徒步',
        '周末胶片冲洗局',
        '滨江 8K 夜跑 · 江风配速团',
      ].sort(),
    );
    expect(catalog.acts.some((a) => a.title === '周一晚共读 · 固定围读局')).toBe(false);
    expect(catalog.acts.find((a) => a.id === toClientActId(101))?.gid).toBe(toClientGroupId(1));
    expect(catalog.acts.find((a) => a.id === toClientActId(101))?.createdByMe).toBe(false);
    expect(catalog.acts.find((a) => a.id === toClientActId(201))?.sessions?.length).toBe(2);
    expect(catalog.acts.find((a) => a.id === toClientActId(201))?.daysBadge).toBe('共 3 天');
    expect(catalog.acts.some((a) => a.signupStatus === '待审核')).toBe(false);

    expect(catalog.moments.map((m) => m.text).sort()).toEqual(
      [
        '初夏漫步打卡，夕阳刚好。',
        '夜跑收工，江风把汗吹干。',
        '连营第二天，溪边煮面最香。',
        '书吧灯还亮着，围读散场合影。',
        '五黑翻盘，这把要回看十遍。',
        '配速组第一次破五，全员击掌。',
      ].sort(),
    );
    expect(catalog.comments.some((c) => c.aid === toClientActId(101) && c.text.includes('配速'))).toBe(true);
    expect(catalog.comments.some((c) => c.aid === toClientActId(301))).toBe(false);
    expect(listIgHomeHighlightMoments(getInterestGroupMoments()).map((item) => item.content)).toEqual([
      '配速组第一次破五，全员击掌。',
      '夜跑收工，江风把汗吹干。',
      '书吧灯还亮着，围读散场合影。',
    ]);
  });

  it('treats only published activities as client-visible', () => {
    const published = getInterestGroupActivities().filter(isPublishedIgActivity);
    expect(published.map((item) => item.id).sort()).toEqual([101, 102, 201, 501, 601, 602, 603, 604]);
  });

  it('shows an admin rename on the C-end catalog', () => {
    const group = buildIgCatalog(ME).groups.find((item) => item.id === toClientGroupId(1));
    expect(group?.name).toBe('城市夜跑团');
    upsertInterestGroup(
      {
        name: '城市夜跑团改名',
        categoryKey: 'sport',
        leadEmployeeIds: ['张悦'],
        joinMode: 'free',
        intro: '下班后甩开屏幕，用脚步丈量城市。我们按配速分组，从 6′30″ 到 5′00″ 都有搭子。',
        coverUrl: '/activities/basketball.jpg',
      },
      1,
    );
    expect(buildIgCatalog(ME).groups.find((g) => g.id === toClientGroupId(1))?.name).toBe('城市夜跑团改名');
  });

  it('mirrors admin pin toggles onto the C-end catalog', () => {
    toggleInterestGroupPin(3);
    toggleInterestGroupActivityPin(101);
    const catalog = buildIgCatalog(ME);
    expect(catalog.groups.find((item) => item.id === toClientGroupId(3))).toMatchObject({ pinned: true });
    expect(catalog.acts.find((item) => item.id === toClientActId(101))).toMatchObject({ pinned: true });
  });

  it('drops an unpublished activity from the C-end catalog', () => {
    unpublishInterestGroupActivities([101]);
    expect(buildIgCatalog(ME).acts.some((item) => item.id === toClientActId(101))).toBe(false);
  });

  it('writes C-end join and signup into the admin store', () => {
    expect(joinInterestGroupAsEmployee(1, ME)).toBe('joined');
    expect(getInterestGroupMembers().some((item) => item.groupId === 1 && item.name === ME && item.status === '已通过')).toBe(true);
    expect(buildIgCatalog(ME).groups.find((g) => g.id === toClientGroupId(1))?.joined).toBe(true);
    expect(joinInterestGroupAsEmployee(2, ME)).toBe('joined');
    expect(buildIgCatalog(ME).groups.find((g) => g.id === toClientGroupId(2))?.joined).toBe(true);
  });
});
