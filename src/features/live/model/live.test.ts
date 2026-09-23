import { beforeEach, describe, expect, it } from 'vitest';
import { liveLinks, liveStatusOf, liveVisibilityText, initialLives } from './live';
import { __resetLiveStoreForTests, getLive, getLiveComments, getLiveViewers, nextLiveId, removeLive, saveLive } from './liveStore';

describe('live model', () => {
  it('derives status from time range and replay flag', () => {
    const base = { startAt: '2026-09-10 10:00', endAt: '2026-09-10 11:00', hasReplay: false };
    const before = Date.parse('2026-09-10T09:00');
    const during = Date.parse('2026-09-10T10:30');
    const after = Date.parse('2026-09-10T12:00');
    expect(liveStatusOf(base, before)).toBe('预告');
    expect(liveStatusOf(base, during)).toBe('直播中');
    expect(liveStatusOf(base, after)).toBe('已结束');
    expect(liveStatusOf({ ...base, hasReplay: true }, after)).toBe('回放');
  });

  it('builds lecturer and student links from live id', () => {
    expect(liveLinks(7)).toEqual({
      lecturer: 'https://live.kangni.cn/lecturer/LV0007',
      student: 'https://live.kangni.cn/watch/LV0007',
    });
  });

  it('formats visibility text for 全员/按部门/导入/未开启', () => {
    const record = { ...initialLives[0] };
    expect(liveVisibilityText({ ...record, visibilityEnabled: false })).toBe('不限制');
    expect(liveVisibilityText({ ...record, visibilityEnabled: true, visibilityScope: '全员' })).toBe('全员');
    expect(
      liveVisibilityText({ ...record, visibilityEnabled: true, visibilityScope: '按部门', visibilityDepartments: ['研发中心'] }),
    ).toBe('按部门（研发中心）');
    expect(
      liveVisibilityText({ ...record, visibilityEnabled: true, visibilityScope: '导入', visibilityFileName: '名单.xlsx' }),
    ).toBe('导入名单（名单.xlsx）');
  });
});

describe('live store', () => {
  beforeEach(() => {
    __resetLiveStoreForTests();
  });

  it('creates, updates and removes lives with related data', () => {
    const id = nextLiveId();
    saveLive({ ...initialLives[0], id, title: '新直播' });
    expect(getLive(id)?.title).toBe('新直播');
    saveLive({ ...initialLives[0], id, title: '改名' });
    expect(getLive(id)?.title).toBe('改名');
    expect(removeLive(id)).toBe(true);
    expect(getLive(id)).toBeUndefined();
  });

  it('scopes comments and viewers by live id', () => {
    const comments = getLiveComments(1);
    expect(comments.length).toBe(3);
    expect(comments.every((item) => item.liveId === 1)).toBe(true);
    expect(getLiveViewers(3).map((item) => item.name)).toEqual(['周洁', '陈晨']);
  });
});
