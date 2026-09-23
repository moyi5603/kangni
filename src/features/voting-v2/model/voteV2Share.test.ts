import { describe, expect, it } from 'vitest';
import { voteV2ShareQrFileName, voteV2ShareUrl } from './voteV2Share';

describe('voteV2ShareUrl', () => {
  it('builds a C-end H5 vote-v2 detail link from origin and path', () => {
    expect(voteV2ShareUrl(2, 'https://corp.example', '/')).toBe('https://corp.example/#/c/h5/vote-v2-2');
    expect(voteV2ShareUrl(7, 'https://corp.example', '/admin/')).toBe('https://corp.example/admin/#/c/h5/vote-v2-7');
  });
});

describe('voteV2ShareQrFileName', () => {
  it('uses the campaign name in the download file name', () => {
    expect(voteV2ShareQrFileName('部门十佳员工评选')).toBe('部门十佳员工评选-二维码.png');
    expect(voteV2ShareQrFileName('a/b:c')).toBe('abc-二维码.png');
  });
});
