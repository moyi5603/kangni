export function voteV2ShareUrl(id: number, origin: string, pathname: string): string {
  const hash = `#/c/h5/vote-v2-${id}`;
  const base = `${origin}${pathname.endsWith('/') ? pathname : `${pathname}/`}`;
  return new URL(hash, base).href;
}

export function currentVoteV2ShareUrl(id: number): string {
  if (typeof window === 'undefined') return `#/c/h5/vote-v2-${id}`;
  return voteV2ShareUrl(id, window.location.origin, window.location.pathname);
}

export function voteV2ShareQrFileName(name: string): string {
  const safe = name.replace(/[\\/:*?"<>|]+/g, '').trim() || '投票';
  return `${safe}-二维码.png`;
}
