import { describe, expect, it } from 'vitest';
import { voteShareQrFileName, voteShareUrl } from './voteShare';

describe('voteShareUrl', () => {
  it('builds a C-end H5 vote detail link from origin and path', () => {
    expect(voteShareUrl(2, 'https://corp.example', '/')).toBe('https://corp.example/#/c/h5/vote-2');
    expect(voteShareUrl(7, 'https://corp.example', '/admin/')).toBe('https://corp.example/admin/#/c/h5/vote-7');
  });
});

describe('voteShareQrFileName', () => {
  it('uses the campaign name in the download file name', () => {
    expect(voteShareQrFileName('午餐口味征集')).toBe('午餐口味征集-二维码.png');
    expect(voteShareQrFileName('a/b:c')).toBe('abc-二维码.png');
  });
});
