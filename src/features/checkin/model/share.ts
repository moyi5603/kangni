export type ShareCardRule = 'daily' | 'weekly';

export const SHARE_IMAGE_WIDTH = 1000;
export const SHARE_IMAGE_HEIGHT = 1470;
export const SHARE_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

const DAY_MS = 24 * 60 * 60 * 1000;

export type ShareSlotPlan = {
  startDay: string;
  endDay: string;
  count: number;
  unit: '天' | '周';
};

function dayStart(value: string): number | null {
  const day = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const ms = Date.parse(`${day}T00:00:00+08:00`);
  return Number.isNaN(ms) ? null : ms;
}

export function shareSlotPlan(startAt: string, endAt: string, rule: ShareCardRule): ShareSlotPlan | null {
  const start = dayStart(startAt);
  const end = dayStart(endAt);
  if (start === null || end === null || end < start) return null;
  const days = Math.floor((end - start) / DAY_MS) + 1;
  return {
    startDay: startAt.slice(0, 10),
    endDay: endAt.slice(0, 10),
    count: rule === 'daily' ? days : Math.ceil(days / 7),
    unit: rule === 'daily' ? '天' : '周',
  };
}

export function shareSlotLabel(rule: ShareCardRule, index: number): string {
  return `第${index + 1}${rule === 'daily' ? '天' : '周'}`;
}

export function visibleShareImages(images: string[], count: number): string[] {
  return Array.from({ length: Math.max(0, count) }, (_, index) => images[index] ?? '');
}

export function swapShareImages(images: string[], from: number, to: number): string[] {
  if (from === to || from < 0 || to < 0 || from >= images.length || to >= images.length) return images;
  const next = [...images];
  const current = next[from] ?? '';
  next[from] = next[to] ?? '';
  next[to] = current;
  return next;
}

export function shareImageFileError(file: {
  type: string;
  name: string;
  size: number;
  width?: number;
  height?: number;
}): string | null {
  const type = file.type.toLowerCase();
  const allowed = type === 'image/jpeg' || type === 'image/png' || /\.(jpe?g|png)$/i.test(file.name);
  if (!allowed) return '仅支持 JPG、PNG';
  if (file.size >= SHARE_IMAGE_MAX_BYTES) return '单张图片需小于 2MB';
  if (file.width !== undefined || file.height !== undefined) {
    if (file.width !== SHARE_IMAGE_WIDTH || file.height !== SHARE_IMAGE_HEIGHT) return '图片尺寸需为 1000×1470 像素';
  }
  return null;
}

export function validateCultureShare(input: {
  ownerApp: 'culture' | 'skills-contest';
  startAt: string;
  endAt: string;
  shareEnabled: boolean;
  cardRule: ShareCardRule;
  images: string[];
}): string | null {
  if (input.ownerApp !== 'culture' || !input.shareEnabled) return null;
  const plan = shareSlotPlan(input.startAt, input.endAt, input.cardRule);
  if (!plan) return '请先选择起止时间';
  const filled = input.images.slice(0, plan.count).filter(Boolean).length;
  if (filled < plan.count) return '请配齐分享图片';
  return null;
}
