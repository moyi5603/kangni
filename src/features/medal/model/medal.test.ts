import { describe, expect, it } from 'vitest';
import {
  MEDAL_APPS,
  filterMedals,
  initialMedals,
  sortMedalsByCreatedAtDesc,
  validateMedalDraft,
} from './medal';

describe('medal domain', () => {
  it('seeds at least 18 medals including screenshot names and apps', () => {
    expect(initialMedals.length).toBeGreaterThanOrEqual(18);
    const names = initialMedals.map((item) => item.name);
    expect(names).toEqual(expect.arrayContaining(['明星员工', '服务标兵', '价值观典范', '匠心品质', '成长之星', '卓越贡献', '成长启航', '协作共赢', '创新进取']));
    expect(MEDAL_APPS).toEqual(['通用', '活动', '课发展', '评优活动', '文化打卡', '即时激励']);
    expect(initialMedals.some((item) => item.app === '评优活动')).toBe(true);
    expect(initialMedals.some((item) => item.app === '文化打卡')).toBe(true);
    expect(initialMedals.some((item) => item.app === '即时激励' && item.incentiveType === '公司表彰')).toBe(true);
    expect(initialMedals.every((item) => item.status === '有效' || item.status === '失效')).toBe(true);
  });

  it('filters by name contains, app, status and createdAt day range', () => {
    const rows = sortMedalsByCreatedAtDesc(initialMedals);

    const byName = filterMedals(rows, { name: '明星', app: 'all', status: 'all', from: '', to: '' });
    expect(byName.length).toBeGreaterThanOrEqual(1);
    expect(byName.every((item) => item.name.includes('明星'))).toBe(true);

    const byApp = filterMedals(rows, { name: '', app: '文化打卡', status: 'all', from: '', to: '' });
    expect(byApp.length).toBeGreaterThanOrEqual(1);
    expect(byApp.every((item) => item.app === '文化打卡')).toBe(true);

    const disabled = filterMedals(rows, { name: '', app: 'all', status: '失效', from: '', to: '' });
    expect(disabled.length).toBeGreaterThanOrEqual(1);
    expect(disabled.every((item) => item.status === '失效')).toBe(true);

    const ranged = filterMedals(rows, { name: '', app: 'all', status: 'all', from: '2026-08-31', to: '2026-08-31' });
    expect(ranged.length).toBe(6);
    expect(ranged.every((item) => item.createdAt.startsWith('2026-08-31'))).toBe(true);
  });

  it('validates create draft', () => {
    expect(validateMedalDraft({ name: '', imageUrl: '', app: '', description: '' })).toEqual({
      imageUrl: '请上传勋章图片',
      name: '请输入勋章名称',
      app: '请选择所属应用',
    });
    expect(validateMedalDraft({ name: '', imageUrl: '', app: '通用', description: '' })).toEqual({
      imageUrl: '请上传勋章图片',
      name: '请输入勋章名称',
    });
    expect(validateMedalDraft({ name: 'a'.repeat(31), imageUrl: 'x', app: '通用', description: 'd'.repeat(101) })).toEqual({
      name: '名称不超过 30 字',
      description: '描述不超过 100 字',
    });
    expect(validateMedalDraft({ name: '服务标兵', imageUrl: 'data:image/svg+xml,x', app: '活动', description: 'ok' })).toEqual({});
    expect(
      validateMedalDraft({
        name: '卓越贡献',
        imageUrl: 'x',
        app: '即时激励',
        description: '',
      }),
    ).toEqual({
      incentiveType: '请选择类型',
      categoryId: '请选择分类',
    });
    expect(
      validateMedalDraft(
        {
          name: '卓越贡献',
          imageUrl: 'x',
          app: '即时激励',
          description: '',
          incentiveType: '公司表彰',
          categoryId: 'c-peer-1',
        },
        [
          { id: 'c-peer-1', scopeId: 'peer' },
          { id: 'c-company-1', scopeId: 'company' },
        ],
      ),
    ).toEqual({
      categoryId: '请选择分类',
    });
    expect(
      validateMedalDraft(
        {
          name: '卓越贡献',
          imageUrl: 'x',
          app: '即时激励',
          description: '',
          incentiveType: '公司表彰',
          categoryId: 'c-company-1',
        },
        [{ id: 'c-company-1', scopeId: 'company' }],
      ),
    ).toEqual({});
  });

  it('sorts newest createdAt first', () => {
    const sorted = sortMedalsByCreatedAtDesc([
      { ...initialMedals[0], id: 'a', createdAt: '2026-01-01 00:00:00' },
      { ...initialMedals[0], id: 'b', createdAt: '2026-08-31 15:03:58' },
    ]);
    expect(sorted.map((item) => item.id)).toEqual(['b', 'a']);
  });
});
