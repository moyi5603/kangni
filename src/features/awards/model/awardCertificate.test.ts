import { describe, expect, it } from 'vitest';
import { initialAwardCertificates } from './awardCertificate';

describe('award certificates seed', () => {
  it('has named templates for rank prizes', () => {
    expect(initialAwardCertificates.length).toBeGreaterThan(0);
    expect(initialAwardCertificates.some((item) => item.name.includes('优秀员工'))).toBe(true);
  });
});
