import { describe, expect, it } from 'vitest';
import {
  applyPickedMedia,
  canSubmitMoment,
  formatMomentCommentLine,
  inferMomentType,
  isPlayableMomentVideo,
  momentCoverUrl,
  momentImageGridMod,
  MOMENT_REJECT_REASON_MAX,
  submitBlockReason,
  validateComposer,
  validateRejectReason,
} from './moment';

describe('moment submit rules', () => {
  it('allows submit only when signup is approved and activity has ended', () => {
    expect(canSubmitMoment('已结束', true)).toBe(true);
    expect(canSubmitMoment('已结束', false)).toBe(false);
    expect(canSubmitMoment('进行中', true)).toBe(false);
    expect(canSubmitMoment('未开始', true)).toBe(false);
  });

  it('explains why submit is blocked', () => {
    expect(submitBlockReason('未开始', true)).toBe('活动未开始，暂不能发布瞬间');
    expect(submitBlockReason('进行中', true)).toBe('活动结束后才能发布瞬间');
    expect(submitBlockReason('已结束', false)).toBe('报名通过后才能发布瞬间');
    expect(submitBlockReason('已结束', true)).toBeUndefined();
  });
});

describe('inferMomentType', () => {
  it('infers from media without mixing', () => {
    expect(inferMomentType(['a'], undefined)).toBe('图文类型');
    expect(inferMomentType([], 'v')).toBe('视频');
    expect(inferMomentType([], undefined)).toBeUndefined();
    expect(inferMomentType(['a'], 'v')).toBeUndefined();
  });
});

describe('applyPickedMedia', () => {
  it('replaces images with the first video', () => {
    expect(
      applyPickedMedia(
        { imageUrls: ['old'], videoUrl: undefined },
        [
          { mime: 'image/png', dataUrl: 'img' },
          { mime: 'video/mp4', dataUrl: 'vid' },
        ],
      ),
    ).toEqual({ imageUrls: [], videoUrl: 'vid' });
  });

  it('clears video and appends images up to 9', () => {
    const current = { imageUrls: ['1', '2'], videoUrl: 'old-vid' };
    const picked = Array.from({ length: 10 }, (_, index) => ({
      mime: 'image/jpeg',
      dataUrl: `n${index}`,
    }));
    const next = applyPickedMedia(current, picked);
    expect(next.videoUrl).toBeUndefined();
    expect(next.imageUrls).toEqual(['1', '2', 'n0', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6']);
  });
});

describe('validateComposer media rules', () => {
  const base = { type: '图文类型' as const, content: '', imageUrls: [] as string[], videoUrl: undefined as string | undefined };

  it('requires media and allows empty text', () => {
    expect(validateComposer(base)).toBe('请上传图片或视频');
    expect(validateComposer({ ...base, content: '只有字' })).toBe('请上传图片或视频');
    expect(validateComposer({ ...base, imageUrls: ['a'] })).toBeUndefined();
    expect(validateComposer({ ...base, type: '视频', videoUrl: 'v' })).toBeUndefined();
    expect(validateComposer({ ...base, imageUrls: ['a'], videoUrl: 'v' })).toBe('图片和视频不能同时发');
  });

  it('still caps content length', () => {
    expect(validateComposer({ ...base, content: '字'.repeat(201), imageUrls: ['a'] })).toBe('内容不能超过 200 字');
  });
});

describe('formatMomentCommentLine', () => {
  it('formats WeChat-style comments and replies', () => {
    expect(formatMomentCommentLine('李明', '同款照片')).toBe('李明：同款照片');
    expect(formatMomentCommentLine('张悦', '确实', '李明')).toBe('张悦回复李明：确实');
  });
});

describe('momentCoverUrl', () => {
  it('uses the first image, else the video url as cover', () => {
    expect(
      momentCoverUrl({
        id: 1,
        activityId: 1,
        author: 'a',
        content: '',
        type: '图文类型',
        imageUrls: ['/first.jpg', '/second.jpg'],
        status: '已通过',
        createdAt: '',
        updatedAt: '',
        likedBy: [],
        comments: [],
      }),
    ).toBe('/first.jpg');
    expect(
      momentCoverUrl({
        id: 2,
        activityId: 1,
        author: 'a',
        content: '',
        type: '视频',
        imageUrls: [],
        videoUrl: '/poster.jpg',
        status: '已通过',
        createdAt: '',
        updatedAt: '',
        likedBy: [],
        comments: [],
      }),
    ).toBe('/poster.jpg');
    expect(
      momentCoverUrl({
        id: 3,
        activityId: 1,
        author: 'a',
        content: '',
        type: '图文类型',
        imageUrls: [],
        status: '已通过',
        createdAt: '',
        updatedAt: '',
        likedBy: [],
        comments: [],
      }),
    ).toBeUndefined();
  });
});

describe('isPlayableMomentVideo', () => {
  it('accepts video data URLs and file extensions, not image posters', () => {
    expect(isPlayableMomentVideo('data:video/mp4;base64,aaa')).toBe(true);
    expect(isPlayableMomentVideo('/clip.mp4')).toBe(true);
    expect(isPlayableMomentVideo('/activities/open-day.jpg')).toBe(false);
    expect(isPlayableMomentVideo(undefined)).toBe(false);
  });
});

describe('momentImageGridMod', () => {
  it('uses a 2-by-2 track for four images and keeps 3-col for other counts', () => {
    expect(momentImageGridMod(1)).toBe('is-1');
    expect(momentImageGridMod(2)).toBe('is-2');
    expect(momentImageGridMod(3)).toBe('is-3');
    expect(momentImageGridMod(4)).toBe('is-4');
    expect(momentImageGridMod(5)).toBe('is-3');
    expect(momentImageGridMod(9)).toBe('is-3');
  });
});

describe('validateRejectReason', () => {
  it('allows empty reason (optional)', () => {
    expect(validateRejectReason('')).toBeUndefined();
    expect(validateRejectReason('   ')).toBeUndefined();
  });

  it('caps length when provided', () => {
    expect(validateRejectReason('ok')).toBeUndefined();
    expect(validateRejectReason('字'.repeat(MOMENT_REJECT_REASON_MAX + 1))).toBe(
      `驳回原因不能超过 ${MOMENT_REJECT_REASON_MAX} 字`,
    );
  });
});
