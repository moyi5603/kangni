import { beforeEach, describe, expect, it } from 'vitest';
import {
  __resetCertificateStoreForTests,
  getCertificate,
  getCertificateOptions,
  removeCertificate,
  upsertCertificate,
} from './certificateStore';

describe('certificateStore', () => {
  beforeEach(() => {
    __resetCertificateStoreForTests();
  });

  it('lists certificate options for exam form', () => {
    expect(getCertificateOptions()).toHaveLength(3);
    expect(getCertificateOptions()[0]?.name).toContain('数据合规');
  });

  it('upserts and removes certificates', () => {
    upsertCertificate({
      id: 99,
      name: '测试证书',
      coverTheme: 'gold',
      numberRule: 'TEST-{年份}-{流水号}',
      issuer: '考试练习',
      description: '说明',
      watermarkText: '样张',
      validityType: '长期有效',
      issuedCount: 0,
      creator: '测试',
      createdAt: '2026-08-20 10:00:00',
      updatedAt: '2026-08-20 10:00:00',
    });
    expect(getCertificate(99)?.watermarkText).toBe('样张');
    expect(removeCertificate(99)).toBe(true);
    expect(getCertificate(99)).toBeUndefined();
  });
});
