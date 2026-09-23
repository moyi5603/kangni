import { beforeEach, describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import { defaultVoteV2Campaign, defaultVoteV2Contestant, resolveVoteV2Status } from './voteV2';
import {
  __resetVoteV2StoreForTests,
  generateVoteV2InviteCodes,
  getVoteV2,
  getVoteV2Campaigns,
  getVoteV2Contestants,
  incrementVoteV2ViewCount,
  importVoteV2Contestants,
  nextVoteV2Id,
  patchVoteV2Contestants,
  removeVoteV2,
  removeVoteV2Contestants,
  upsertVoteV2,
  upsertVoteV2Contestant,
  getVoteV2Casts,
  castVoteV2,
  castVoteV2Many,
} from './voteV2Store';

beforeEach(() => {
  __resetVoteV2StoreForTests();
});

describe('voteV2Store', () => {
  it('seeds campaigns across status and display configs', () => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const rows = getVoteV2Campaigns();
    const byName = Object.fromEntries(rows.map((item) => [item.name, item]));
    expect(rows.map((item) => item.name)).toEqual([
      '部门十佳员工评选',
      '车间安全之星',
      '年度优秀作品展',
      '食堂本周菜品',
      '班组擂台赛',
      '新员工风采（草稿）',
      '静默结果页',
      '一线匠心人物',
    ]);
    expect(resolveVoteV2Status(byName['部门十佳员工评选'], now)).toBe('未开始');
    expect(resolveVoteV2Status(byName['车间安全之星'], now)).toBe('进行中');
    expect(resolveVoteV2Status(byName['年度优秀作品展'], now)).toBe('已结束');
    expect(resolveVoteV2Status(byName['食堂本周菜品'], now)).toBe('进行中');
    expect(resolveVoteV2Status(byName['班组擂台赛'], now)).toBe('进行中');
    expect(resolveVoteV2Status(byName['新员工风采（草稿）'], now)).toBe('未开始');
    expect(resolveVoteV2Status(byName['静默结果页'], now)).toBe('已结束');
    expect(resolveVoteV2Status(byName['一线匠心人物'], now)).toBe('进行中');
    expect(byName['部门十佳员工评选']).toMatchObject({ groupingEnabled: true, period: '每天', selectMode: '单选' });
    expect(byName['车间安全之星']).toMatchObject({
      groupingEnabled: false,
      period: '总共',
      selectMode: '单选',
      themeColor: '#e54242',
      signupEnabled: true,
      pinned: true,
      homeColumns: 2,
      pcHomeColumns: 3,
    });
    expect(byName['年度优秀作品展']).toMatchObject({
      contestantNoun: '作品',
      voteButtonNoun: '点赞',
      voteUnit: '赞',
      homeColumns: 1,
      themeColor: '#31cab1',
    });
    expect(byName['食堂本周菜品']).toMatchObject({ homeColumns: 3, pcHomeColumns: 4, themeColor: '#ff8939', groupingEnabled: false });
    expect(byName['班组擂台赛']).toMatchObject({
      groupingEnabled: true,
      showAllGroups: false,
      groupColumns: 2,
      themeColor: '#7b61ff',
      visibility: '按部门',
      departments: ['生产中心'],
    });
    expect(byName['新员工风采（草稿）']).toMatchObject({
      backgroundEnabled: true,
      coverUrl: '',
    });
    expect(getVoteV2Contestants(byName['新员工风采（草稿）'].id)).toEqual([]);
    expect(byName['静默结果页'].pageDisplay).toMatchObject({
      search: false,
      intro: false,
      voteButton: false,
      activityStats: false,
    });
    expect(getVoteV2Contestants(5).some((item) => item.locked)).toBe(true);
    expect(byName['一线匠心人物']).toMatchObject({
      homeColumns: 1,
      pcHomeColumns: 5,
      groupingEnabled: false,
      visibility: '全员',
      themeColor: '#1dc47b',
    });
    expect(getVoteV2Contestants(byName['食堂本周菜品'].id).map((item) => item.name)).toEqual([
      '红烧排骨',
      '清炒时蔬',
      '番茄牛腩',
      '黄焖鸡米饭',
      '紫菜蛋花汤',
      '红油抄手',
    ]);
    expect(getVoteV2Contestants(byName['一线匠心人物'].id).map((item) => item.name)).toEqual([
      '刘师傅',
      '何姐',
      '马工',
      '孙师傅',
      '钱姐',
      '周工',
    ]);
  });

  it('creates, updates and removes campaigns', () => {
    const id = nextVoteV2Id();
    upsertVoteV2(
      defaultVoteV2Campaign({
        id,
        name: '新建活动',
        startAt: '2026-10-01 09:00:00',
        endAt: '2026-10-08 18:00:00',
        intro: '简介',
        period: '总共',
        selectMode: '单选',
        quotaPerUser: 5,
        quotaPerContestant: 2,
        createdAt: '2026-08-27 12:00:00',
      }),
    );
    expect(getVoteV2(id)?.name).toBe('新建活动');
    upsertVoteV2({ ...getVoteV2(id)!, name: '改名活动' });
    expect(getVoteV2(id)?.name).toBe('改名活动');
    removeVoteV2(id);
    expect(getVoteV2(id)).toBeUndefined();
    expect(getVoteV2Campaigns()).toHaveLength(8);
  });

  it('keeps contestants and invite codes on a campaign', () => {
    expect(getVoteV2Contestants(1).map((item) => item.name)).toEqual(['陈晨', '周宁', '吴磊', '郑华', '孙悦', '林可']);
    expect(getVoteV2Contestants(2).map((item) => item.name)).toEqual(['张工', '李班', '王姐', '赵师傅']);
    upsertVoteV2Contestant({
      id: 99,
      campaignId: 1,
      name: '王新',
      imageUrl: '',
      videoUrl: '',
      audioUrl: '',
      description: '',
      phone: '',
      voteCount: 0,
    });
    expect(getVoteV2Contestants(1)).toHaveLength(7);
    expect(getVoteV2Contestants(1).at(-1)?.locked).toBe(false);
    const codes = generateVoteV2InviteCodes(1, 2);
    expect(codes).toHaveLength(2);
    expect(codes[0].code.startsWith('INV1')).toBe(true);
  });

  it('batches patch, delete and import contestants', () => {
    expect(getVoteV2Contestants(2).every((item) => item.locked === false)).toBe(true);
    patchVoteV2Contestants([1, 2], { locked: true, voteCount: 7 });
    expect(getVoteV2Contestants(2).map((item) => item.voteCount)).toEqual([7, 7, 84, 71]);
    expect(getVoteV2Contestants(2).filter((item) => item.locked).map((item) => item.name)).toEqual(['张工', '李班']);
    importVoteV2Contestants(2, [
      defaultVoteV2Contestant({ id: 0, campaignId: 2, name: '赵新', groupId: 1 }),
    ]);
    expect(getVoteV2Contestants(2).map((item) => item.name)).toEqual(['张工', '李班', '王姐', '赵师傅', '赵新']);
    removeVoteV2Contestants([1, 2]);
    expect(getVoteV2Contestants(2).map((item) => item.name)).toEqual(['王姐', '赵师傅', '赵新']);
  });

  it('increments campaign viewCount when C-end opens the vote', () => {
    expect(getVoteV2(2)?.viewCount).toBe(3560);
    expect(incrementVoteV2ViewCount(2)?.viewCount).toBe(3561);
    expect(getVoteV2(2)?.viewCount).toBe(3561);
    expect(incrementVoteV2ViewCount(2)?.viewCount).toBe(3562);
    expect(incrementVoteV2ViewCount(9999)).toBeUndefined();
  });

  it('does not recount casts or option votes when live rules are saved', () => {
    const beforeVotes = getVoteV2Contestants(2).map((item) => item.voteCount);
    const beforeCasts = getVoteV2Casts().filter((item) => item.campaignId === 2);
    const campaign = getVoteV2(2)!;
    upsertVoteV2({
      ...campaign,
      quotaPerUser: 1,
      selectMode: '单选',
      groupingEnabled: true,
      groups: [{ id: 1, name: '安全组' }],
      themeColor: '#31cab1',
    });
    expect(getVoteV2Contestants(2).map((item) => item.voteCount)).toEqual(beforeVotes);
    expect(getVoteV2Casts().filter((item) => item.campaignId === 2)).toEqual(beforeCasts);
    expect(getVoteV2(2)).toMatchObject({ quotaPerUser: 1, selectMode: '单选', themeColor: '#31cab1' });
  });

  it('casts a vote onto a live option', () => {
    const campaign = getVoteV2(2)!;
    const before = getVoteV2Contestants(2).find((item) => item.id === 1)?.voteCount;
    expect(castVoteV2(2, 1, '张悦', campaign.startAt)).toEqual({ ok: true, remaining: 2 });
    expect(getVoteV2Contestants(2).find((item) => item.id === 1)?.voteCount).toBe((before ?? 0) + 1);
    expect(castVoteV2(2, 1, '张悦', campaign.startAt).ok).toBe(false);
  });

  it('rejects casting more than one option at a time', () => {
    const campaign = getVoteV2(2)!;
    expect(castVoteV2Many(2, [], '李宁', campaign.startAt).ok).toBe(false);
    expect(castVoteV2Many(2, [1, 2], '李宁', campaign.startAt).ok).toBe(false);
    expect(castVoteV2Many(2, [1], '李宁', campaign.startAt)).toEqual({ ok: true, remaining: 2 });
  });
});
