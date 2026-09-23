export type ImageUploadRatio = '16:9' | '4:3' | '1:1' | '3:4';

export const IMAGE_UPLOAD_ACCEPT = '.bmp,.png,.jpeg,.jpg,.gif';

export const IMAGE_UPLOAD_MAX_MB = 5;

export function imageUploadHint(ratio: ImageUploadRatio = '16:9'): string {
  return `支持 bmp/png/jpeg/jpg/gif，建议比例${ratio}，不超过 ${IMAGE_UPLOAD_MAX_MB}MB`;
}

export const COVER_IMAGE_UPLOAD_HINT = imageUploadHint('16:9');

export const VOTE_OPTION_IMAGE_UPLOAD_HINT = imageUploadHint('4:3');

export const SQUARE_IMAGE_UPLOAD_HINT = imageUploadHint('1:1');

export const PORTRAIT_IMAGE_UPLOAD_HINT = imageUploadHint('3:4');
