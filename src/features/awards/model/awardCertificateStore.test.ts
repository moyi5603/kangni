import { describe, expect, it, beforeEach } from 'vitest';
import { __resetAwardCertificateStoreForTests, getAwardCertificate, removeAwardCertificate, upsertAwardCertificate } from './awardCertificateStore';

describe('awardCertificateStore', () => {
  beforeEach(() => {
    __resetAwardCertificateStoreForTests();
  });

  it('creates and deletes templates', () => {
    upsertAwardCertificate({
      id: 99,
      name: '临时证书',
      description: '临时说明',
      fileName: 'tmp.png',
      imageUrl: 'data:image/png;base64,abc',
      creator: '产品管理员',
      createdAt: '2026-08-24 10:00:00',
      updatedAt: '2026-08-24 10:00:00',
    });
    expect(getAwardCertificate(99)?.name).toBe('临时证书');
    expect(removeAwardCertificate(99)).toBe(true);
    expect(getAwardCertificate(99)).toBeUndefined();
  });
});
