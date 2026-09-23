import { beforeEach, describe, expect, it } from 'vitest';
import {
  addQuota,
  applyQuotaBudgetsByName,
  applyQuotaBudgetsByKeys,
  updateQuota,
  deleteBadge,
  deleteCategory,
  deleteScope,
  getBadges,
  getCategories,
  getQuotas,
  getRecognitions,
  getScopes,
  issueCommendation,
  saveBadge,
  saveCategory,
  saveScope,
  withdrawRecognition,
  approveRecognition,
  rejectRecognition,
  __resetIncentiveStoreForTests,
} from './incentiveStore';

describe('incentiveStore', () => {
  beforeEach(() => {
    __resetIncentiveStoreForTests();
  });

  it('seeds peer and company badges and recognitions', () => {
    expect(getBadges().length).toBeGreaterThan(3);
    expect(getRecognitions().some((r) => r.type === '同事认可')).toBe(true);
    expect(getRecognitions().some((r) => r.type === '公司表彰')).toBe(true);
  });

  it('keeps history when a badge is deleted', () => {
    const badge = getBadges()[0];
    const before = getRecognitions().filter((r) => r.badgeId === badge.id).length;
    deleteBadge(badge.id);
    expect(getBadges().find((b) => b.id === badge.id)).toBeUndefined();
    expect(getRecognitions().filter((r) => r.badgeId === badge.id).length).toBe(before);
  });

  it('approves pending recognition to 已发放', () => {
    const pending = getRecognitions().find((r) => r.status === '待审核');
    expect(pending).toBeTruthy();
    expect(approveRecognition(pending!.id)).toBe(true);
    expect(getRecognitions().find((r) => r.id === pending!.id)?.status).toBe('已发放');
  });

  it('rejects pending recognition to 已驳回 with comment', () => {
    const pending = getRecognitions().find((r) => r.status === '待审核');
    expect(pending).toBeTruthy();
    expect(rejectRecognition(pending!.id, '')).toBe(false);
    expect(rejectRecognition(pending!.id, '事实不足')).toBe(true);
    const updated = getRecognitions().find((r) => r.id === pending!.id);
    expect(updated?.status).toBe('已驳回');
    expect(updated?.reviewComment).toBe('事实不足');
  });

  it('withdraws an issued record', () => {
    const issued = getRecognitions().find((r) => r.status === '已发放');
    expect(issued).toBeTruthy();
    withdrawRecognition(issued!.id);
    expect(getRecognitions().find((r) => r.id === issued!.id)?.status).toBe('已撤回');
  });

  it('issues one recognition per selected employee', () => {
    const companyBadge = getBadges().find((b) => b.riskLabel === '直接发放');
    expect(companyBadge).toBeTruthy();
    const ids = issueCommendation({
      employeeNames: ['林晓云', '陈佳'],
      badgeId: companyBadge!.id,
      reason: '发生场景—具体行为—产生结果足够长了',
    });
    expect(ids).toHaveLength(2);
    const created = getRecognitions().filter((r) => ids.includes(r.id));
    expect(created.every((r) => r.status === '已发放')).toBe(true);
    expect(created.every((r) => r.giver === '系统')).toBe(true);
    const withProof = issueCommendation({
      employeeNames: ['赵强'],
      badgeId: companyBadge!.id,
      reason: '发生场景—具体行为—产生结果足够长了',
      attachments: [
        { name: '现场.png', url: 'data:image/png,abc', kind: 'image' },
        { name: '名单.xlsx', url: 'data:application/vnd.ms-excel,abc', kind: 'file' },
      ],
    });
    expect(getRecognitions().find((item) => item.id === withProof[0])?.attachments).toEqual([
      { name: '现场.png', url: 'data:image/png,abc', kind: 'image' },
      { name: '名单.xlsx', url: 'data:application/vnd.ms-excel,abc', kind: 'file' },
    ]);
  });

  it('rejects duplicate quota for the same target', () => {
    const row = getQuotas()[0];
    expect(addQuota({ ...row, key: 'dup', name: row.name })).toEqual({ ok: false, reason: 'duplicate' });
  });

  it('updates quota budget by key', () => {
    const row = getQuotas()[0];
    expect(updateQuota(row.key, { budget: 999 })).toBe(true);
    expect(getQuotas().find((item) => item.key === row.key)?.budget).toBe(999);
  });

  it('applies batch budgets by object name', () => {
    const result = applyQuotaBudgetsByName([
      { name: '轨道交通事业部', budget: 210 },
      { name: '没有这个对象', budget: 1 },
    ]);
    expect(result.updated).toBe(1);
    expect(result.missing).toEqual(['没有这个对象']);
    expect(getQuotas().find((item) => item.name === '轨道交通事业部')?.budget).toBe(210);
  });

  it('applies the same budget to selected quota keys', () => {
    const [first, second] = getQuotas();
    const result = applyQuotaBudgetsByKeys([first.key, second.key, 'missing-key'], 88);
    expect(result.updated).toBe(2);
    expect(getQuotas().find((item) => item.key === first.key)?.budget).toBe(88);
    expect(getQuotas().find((item) => item.key === second.key)?.budget).toBe(88);
  });

  it('saveBadge upserts by id', () => {
    const first = getBadges()[0];
    saveBadge({ ...first, name: '改名勋章' });
    expect(getBadges().find((b) => b.id === first.id)?.name).toBe('改名勋章');
  });

  it('saves unused scopes and categories and blocks deletes that still have badges', () => {
    saveScope({ id: 'custom', name: '自定义归属', sort: 9 });
    expect(getScopes().some((item) => item.id === 'custom')).toBe(true);
    expect(deleteScope('peer')).toBe(false);
    expect(deleteScope('custom')).toBe(true);
    expect(getScopes().some((item) => item.id === 'custom')).toBe(false);

    saveCategory({ id: 'c-new', scopeId: 'company', name: '新分类', sort: 9 });
    expect(getCategories().some((item) => item.id === 'c-new')).toBe(true);
    expect(deleteCategory('c-peer-2')).toBe(false);
    expect(deleteCategory('c-new')).toBe(true);
  });
});
