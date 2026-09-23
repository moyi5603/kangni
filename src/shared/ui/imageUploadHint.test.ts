import { describe, expect, it } from 'vitest';
import { COVER_IMAGE_UPLOAD_HINT, IMAGE_UPLOAD_ACCEPT, PORTRAIT_IMAGE_UPLOAD_HINT, SQUARE_IMAGE_UPLOAD_HINT, VOTE_OPTION_IMAGE_UPLOAD_HINT, imageUploadHint } from './imageUploadHint';

describe('imageUploadHint', () => {
  it('uses 16:9 for cover and general images', () => {
    expect(imageUploadHint()).toBe('支持 bmp/png/jpeg/jpg/gif，建议比例16:9，不超过 5MB');
    expect(COVER_IMAGE_UPLOAD_HINT).toBe('支持 bmp/png/jpeg/jpg/gif，建议比例16:9，不超过 5MB');
  });

  it('uses 4:3 for vote option images', () => {
    expect(imageUploadHint('4:3')).toBe('支持 bmp/png/jpeg/jpg/gif，建议比例4:3，不超过 5MB');
    expect(VOTE_OPTION_IMAGE_UPLOAD_HINT).toBe('支持 bmp/png/jpeg/jpg/gif，建议比例4:3，不超过 5MB');
  });

  it('uses 1:1 for square images', () => {
    expect(imageUploadHint('1:1')).toBe('支持 bmp/png/jpeg/jpg/gif，建议比例1:1，不超过 5MB');
    expect(PORTRAIT_IMAGE_UPLOAD_HINT).toBe('支持 bmp/png/jpeg/jpg/gif，建议比例3:4，不超过 5MB');
    expect(imageUploadHint('3:4')).toBe('支持 bmp/png/jpeg/jpg/gif，建议比例3:4，不超过 5MB');
  });

  it('restricts file picker to bmp/png/jpeg/jpg/gif', () => {
    expect(IMAGE_UPLOAD_ACCEPT).toBe('.bmp,.png,.jpeg,.jpg,.gif');
  });
});
