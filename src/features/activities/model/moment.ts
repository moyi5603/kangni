import type { ActivityStatus } from './activity';

export const momentTypes = ['图文类型', '视频'] as const;
export const momentStatuses = ['待审核', '已通过', '已驳回'] as const;

export type MomentType = (typeof momentTypes)[number];
export type MomentStatus = (typeof momentStatuses)[number];

export const MOMENT_CONTENT_MAX = 200;
export const MOMENT_IMAGE_MAX = 9;
export const MOMENT_REJECT_REASON_MAX = 200;

export type MomentReply = {
  id: number;
  author: string;
  content: string;
  createdAt: string;
  replyTo?: string;
};

export type MomentComment = {
  id: number;
  author: string;
  content: string;
  createdAt: string;
  replies: MomentReply[];
};

export type MomentRecord = {
  id: number;
  activityId: number;
  author: string;
  content: string;
  type: MomentType;
  imageUrls: string[];
  videoUrl?: string;
  status: MomentStatus;
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
  likedBy: string[];
  comments: MomentComment[];
};

export type MomentDraft = {
  type: MomentType;
  content: string;
  imageUrls: string[];
  videoUrl?: string;
};

export type PickedMediaFile = { mime: string; dataUrl: string };

export function isPlayableMomentVideo(url?: string): boolean {
  if (!url) return false;
  return url.startsWith('data:video') || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
}

export function inferMomentType(imageUrls: string[], videoUrl?: string): MomentType | undefined {
  const hasImages = imageUrls.length > 0;
  const hasVideo = Boolean(videoUrl);
  if (hasImages && hasVideo) return undefined;
  if (hasVideo) return '视频';
  if (hasImages) return '图文类型';
  return undefined;
}

export function applyPickedMedia(
  current: { imageUrls: string[]; videoUrl?: string },
  picked: PickedMediaFile[],
): { imageUrls: string[]; videoUrl?: string } {
  const video = picked.find((item) => item.mime.startsWith('video/'));
  if (video) return { imageUrls: [], videoUrl: video.dataUrl };
  const incoming = picked.filter((item) => item.mime.startsWith('image/')).map((item) => item.dataUrl);
  return {
    imageUrls: [...current.imageUrls, ...incoming].slice(0, MOMENT_IMAGE_MAX),
    videoUrl: undefined,
  };
}

export function momentImageGridMod(count: number): string {
  if (count === 4) return 'is-4';
  if (count >= 5) return 'is-3';
  return `is-${Math.min(Math.max(count, 1), 3)}`;
}

export function canSubmitMoment(activityStatus: ActivityStatus, approvedSignup: boolean): boolean {
  return approvedSignup && activityStatus === '已结束';
}

export function submitBlockReason(activityStatus: ActivityStatus, approvedSignup: boolean): string | undefined {
  if (activityStatus !== '已结束') {
    return activityStatus === '未开始' ? '活动未开始，暂不能发布瞬间' : '活动结束后才能发布瞬间';
  }
  if (!approvedSignup) return '报名通过后才能发布瞬间';
  return undefined;
}

export function nextStatusOnSubmit(auditEnabled: boolean): MomentStatus {
  return auditEnabled ? '待审核' : '已通过';
}

export function isPending(status: MomentStatus): boolean {
  return status === '待审核';
}

export function visibleOnClient(moment: MomentRecord, viewer: string): boolean {
  return moment.status === '已通过' || moment.author === viewer;
}

export function commentCount(moment: MomentRecord): number {
  return moment.comments.reduce((sum, item) => sum + 1 + item.replies.length, 0);
}

export function formatMomentCommentLine(author: string, content: string, replyTo?: string): string {
  return replyTo ? `${author}回复${replyTo}：${content}` : `${author}：${content}`;
}

export function excerpt(content: string, max = 20): string {
  const text = content.trim() || '未填写内容';
  return text.length <= max ? text : `${text.slice(0, max)}…`;
}

export function validateComposer(draft: MomentDraft): string | undefined {
  const content = draft.content.trim();
  if (content.length > MOMENT_CONTENT_MAX) return `内容不能超过 ${MOMENT_CONTENT_MAX} 字`;
  const hasImages = draft.imageUrls.length > 0;
  const hasVideo = Boolean(draft.videoUrl);
  if (hasImages && hasVideo) return '图片和视频不能同时发';
  if (!hasImages && !hasVideo) return '请上传图片或视频';
  if (draft.imageUrls.length > MOMENT_IMAGE_MAX) return `图片不能超过 ${MOMENT_IMAGE_MAX} 张`;
  return undefined;
}

export function validateRejectReason(reason: string): string | undefined {
  const text = reason.trim();
  if (!text) return '请填写驳回原因';
  if (text.length > MOMENT_REJECT_REASON_MAX) return `驳回原因不能超过 ${MOMENT_REJECT_REASON_MAX} 字`;
  return undefined;
}
