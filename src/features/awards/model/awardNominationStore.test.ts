import { describe, expect, it, beforeEach } from 'vitest';
import { __resetAwardStoreForTests, getAward } from './awardStore';
import {
  __resetAwardNominationStoreForTests,
  addAwardNomination,
  getAwardNominations,
  removeAwardNomination,
  reviewAwardNomination,
} from './awardNominationStore';

describe('awardNominationStore', () => {
  beforeEach(() => {
    __resetAwardStoreForTests();
    __resetAwardNominationStoreForTests();
  });

  it('lists nominations for one award', () => {
    expect(getAwardNominations(2).every((item) => item.awardId === 2)).toBe(true);
    expect(getAwardNominations(2).length).toBeGreaterThan(0);
  });

  it('approves pending nominations and refreshes pending count', () => {
    const pending = getAwardNominations(2).find((item) => item.reviewStatus === '待审核');
    expect(pending).toBeTruthy();
    expect(reviewAwardNomination(pending!.id, '已通过')).toBe(true);
    expect(getAwardNominations(2).find((item) => item.id === pending!.id)?.reviewStatus).toBe('已通过');
    expect(getAward(2)?.pendingNominationCount).toBe(
      getAwardNominations(2).filter((item) => item.reviewStatus === '待审核').length,
    );
  });

  it('rejects pending nomination with optional reason', () => {
    const pending = getAwardNominations(2).find((item) => item.reviewStatus === '待审核');
    expect(pending).toBeTruthy();
    expect(reviewAwardNomination(pending!.id, '已驳回', '材料不足')).toBe(true);
    const updated = getAwardNominations(2).find((item) => item.id === pending!.id);
    expect(updated?.reviewStatus).toBe('已驳回');
    expect(updated?.rejectReason).toBe('材料不足');
  });

  it('rejects adding a personal nomination with multiple people', () => {
    expect(
      addAwardNomination({
        awardId: 4,
        title: '双人提名',
        nominees: ['张悦', '李明'],
        reason: '理由',
        highlights: ['亮点'],
      }),
    ).toBe('个人评优请选择 1 人');
  });

  it('adds a valid nomination as already approved from admin', () => {
    const before = getAwardNominations(2).length;
    const pendingBefore = getAwardNominations(2).filter((item) => item.reviewStatus === '待审核').length;
    expect(
      addAwardNomination({
        awardId: 2,
        title: '新协同组',
        nominees: ['张悦'],
        reason: '理由',
        highlights: ['亮点'],
      }),
    ).toBeNull();
    expect(getAwardNominations(2).length).toBe(before + 1);
    expect(getAwardNominations(2)[0]?.title).toBe('新协同组');
    expect(getAwardNominations(2)[0]?.reviewStatus).toBe('已通过');
    expect(getAward(2)?.nominationCount).toBe(before + 1);
    expect(getAwardNominations(2).filter((item) => item.reviewStatus === '待审核').length).toBe(pendingBefore);
  });

  it('rejects more than 3 highlights', () => {
    expect(
      addAwardNomination({
        awardId: 2,
        title: '过多亮点',
        nominees: ['张悦'],
        reason: '理由',
        highlights: ['a', 'b', 'c', 'd'],
      }),
    ).toBe('核心亮点最多 3 条');
  });

  it('deletes a nomination', () => {
    const first = getAwardNominations(2)[0];
    expect(removeAwardNomination(first.id)).toBe(true);
    expect(getAwardNominations(2).some((item) => item.id === first.id)).toBe(false);
  });
});
