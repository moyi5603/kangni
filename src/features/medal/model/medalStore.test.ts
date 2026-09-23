import { beforeEach, describe, expect, it } from 'vitest';
import { __resetMedalStoreForTests, createMedal, getMedal, listMedals, removeMedal, setMedalStatus, updateMedal } from './medalStore';

describe('medalStore', () => {
  beforeEach(() => {
    __resetMedalStoreForTests();
  });

  it('creates at the front, updates, toggles status and deletes', () => {
    const created = createMedal({
      name: '测试勋章',
      imageUrl: 'data:image/svg+xml,x',
      app: '通用',
      description: 'd',
    });
    expect(listMedals()[0].id).toBe(created.id);
    expect(created.status).toBe('有效');
    expect(created.creator).toBe('北玛三十度');
    const incentive = createMedal({
      name: '激励勋章',
      imageUrl: 'data:image/svg+xml,x',
      app: '即时激励',
      description: '',
      incentiveType: '同事认可',
      categoryId: 'c-peer-1',
    });
    expect(incentive.incentiveType).toBe('同事认可');
    expect(incentive.categoryId).toBe('c-peer-1');
    updateMedal(incentive.id, { app: '通用' });
    expect(getMedal(incentive.id)?.incentiveType).toBeUndefined();
    updateMedal(created.id, { name: '测试勋章改' });
    expect(getMedal(created.id)?.name).toBe('测试勋章改');
    expect(setMedalStatus(created.id, '失效')).toBe(true);
    expect(getMedal(created.id)?.status).toBe('失效');
    expect(removeMedal(created.id)).toBe(true);
    expect(getMedal(created.id)).toBeUndefined();
  });
});
