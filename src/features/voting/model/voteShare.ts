import { toH5VoteDetailHash } from '../../../app/navigation';

export function voteShareUrl(id: number, origin: string, pathname: string): string {
  const base = `${origin}${pathname.endsWith('/') ? pathname : `${pathname}/`}`;
  return new URL(toH5VoteDetailHash(id), base).href;
}

export function currentVoteShareUrl(id: number): string {
  if (typeof window === 'undefined') return toH5VoteDetailHash(id);
  return voteShareUrl(id, window.location.origin, window.location.pathname);
}

export function voteShareQrFileName(name: string): string {
  const safe = name.replace(/[\\/:*?"<>|]+/g, '').trim() || '投票';
  return `${safe}-二维码.png`;
}

export function downloadQrFromRoot(root: HTMLElement | null, fileName: string): boolean {
  const canvas = root?.querySelector('canvas');
  if (!canvas) return false;
  const href = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = fileName;
  link.href = href;
  link.click();
  return true;
}
