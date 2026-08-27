import { afterEach, describe, expect, it } from 'vitest';
import {
  __resetAwardCommentStoreForTests,
  approveAwardComment,
  deleteAwardComment,
  listAwardComments,
  rejectAwardComment,
} from './awardCommentStore';

describe('awardCommentStore', () => {
  afterEach(() => {
    __resetAwardCommentStoreForTests();
  });

  it('seeds comments for Q3 team award', () => {
    const rows = listAwardComments(2);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((item) => item.status === '已通过')).toBe(true);
    expect(rows.some((item) => item.status === '待审核')).toBe(true);
  });

  it('approves and rejects comments', () => {
    const pending = listAwardComments(2).find((item) => item.status === '待审核')!;
    expect(rejectAwardComment(pending.id, '与评优无关')).toBe(true);
    expect(listAwardComments(2).find((item) => item.id === pending.id)).toMatchObject({
      status: '已驳回',
      rejectReason: '与评优无关',
    });
    expect(approveAwardComment(pending.id)).toBe(true);
    expect(listAwardComments(2).find((item) => item.id === pending.id)?.status).toBe('已通过');
  });

  it('deletes comments', () => {
    const id = listAwardComments(2)[0].id;
    expect(deleteAwardComment(id)).toBe(true);
    expect(listAwardComments(2).some((item) => item.id === id)).toBe(false);
  });
});
