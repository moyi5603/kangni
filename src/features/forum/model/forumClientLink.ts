import { toH5ForumBoardHash, toH5ForumTopicHash } from '../../../app/navigation';

function forumClientUrl(hash: string, origin: string, pathname: string): string {
  const base = `${origin}${pathname.endsWith('/') ? pathname : `${pathname}/`}`;
  return new URL(hash, base).href;
}

export function forumBoardClientUrl(id: number, origin: string, pathname: string): string {
  return forumClientUrl(toH5ForumBoardHash(id), origin, pathname);
}

export function forumTopicClientUrl(id: number, origin: string, pathname: string): string {
  return forumClientUrl(toH5ForumTopicHash(id), origin, pathname);
}

export function currentForumBoardClientUrl(id: number): string {
  if (typeof window === 'undefined') return toH5ForumBoardHash(id);
  return forumBoardClientUrl(id, window.location.origin, window.location.pathname);
}

export function currentForumTopicClientUrl(id: number): string {
  if (typeof window === 'undefined') return toH5ForumTopicHash(id);
  return forumTopicClientUrl(id, window.location.origin, window.location.pathname);
}
