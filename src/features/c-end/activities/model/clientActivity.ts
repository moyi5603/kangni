import { useSyncExternalStore } from 'react';
import type { Activity, ActivityType } from '../../../activities/model/activity';
import { getRelatedList, subscribeRelated } from '../../../activities/model/related';
import type { ClientSignup } from './signupStore';
import { commentCount } from './activityComments';
import { getFavoritedBy, getLikedBy, useEngagement } from './engagementStore';

export function useLiveSocial() {
  useEngagement();
  useSyncExternalStore(subscribeRelated, () => getRelatedList('comments'), () => getRelatedList('comments'));
}

export const FEATURED_LIMIT = 8;
export const HOME_SIGNUP_PREVIEW_LIMIT = 2;
export const HOME_FAVORITE_PREVIEW_LIMIT = 2;

export const CLIENT_TABS = [
  { id: 'all', label: '全部' },
  { id: '公司活动', label: '公司活动' },
  { id: '体检活动', label: '体检活动' },
  { id: '疗休养活动', label: '疗休养活动' },
  { id: '项目活动', label: '项目活动' },
] as const;

export type ClientTabId = (typeof CLIENT_TABS)[number]['id'];

export type ClientActivity = Activity & {
  summary: string;
  likes: number;
  stars: number;
  comments: number;
};

export function toClientActivity(activity: Activity): ClientActivity {
  return {
    ...activity,
    summary: activitySummary(activity.detailHtml),
    likes: getLikedBy(activity.id).length,
    stars: getFavoritedBy(activity.id).length,
    comments: commentCount(activity.id),
  };
}

export function parseActivityDate(value: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(value);
  if (!match) return Number.NaN;
  const [, year, month, day, hour, minute] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
}

export function activitySummary(html: string): string {
  const text = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  if (text.length <= 36) return text;
  return `${text.slice(0, 36)}…`;
}

export function sortClientActivities(list: Activity[]): Activity[] {
  return list.slice().sort((left, right) => {
    const pin = Number(right.pinned) - Number(left.pinned);
    if (pin !== 0) return pin;
    const rightPublished = parseActivityDate(right.publishedAt);
    const leftPublished = parseActivityDate(left.publishedAt);
    const rightTime = Number.isFinite(rightPublished) ? rightPublished : Number.NEGATIVE_INFINITY;
    const leftTime = Number.isFinite(leftPublished) ? leftPublished : Number.NEGATIVE_INFINITY;
    return rightTime - leftTime;
  });
}

export function publishedActivities(list: Activity[]): Activity[] {
  return sortClientActivities(list.filter((item) => item.publishStatus === '已发布'));
}

export function clientVisibleActivities(list: Activity[]): Activity[] {
  return publishedActivities(list);
}

export function isSignupOpen(activity: Activity, now = Date.now()): boolean {
  if (activity.publishStatus !== '已发布' || activity.activityStatus === '已结束') return false;
  const start = parseActivityDate(activity.signupStartAt);
  const end = parseActivityDate(activity.signupEndAt);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  return now >= start && now <= end;
}

export function featuredActivities(list: Activity[], now = Date.now()): Activity[] {
  return clientVisibleActivities(list).filter((item) => isSignupOpen(item, now));
}

export function filterByTab(list: Activity[], tab: ClientTabId): Activity[] {
  const visible = clientVisibleActivities(list);
  if (tab === 'all') return visible;
  return visible.filter((item) => item.type === (tab as ActivityType));
}

export function tabCounts(list: Activity[]): Record<ClientTabId, number> {
  const visible = clientVisibleActivities(list);
  const counts: Record<ClientTabId, number> = {
    all: visible.length,
    公司活动: 0,
    体检活动: 0,
    疗休养活动: 0,
    项目活动: 0,
  };
  visible.forEach((item) => {
    counts[item.type] += 1;
  });
  return counts;
}

export function catalogActivities(list: Activity[], tab: ClientTabId, now = Date.now()): Activity[] {
  return filterByTab(list, tab).slice().sort((left, right) => {
    return Number(isSignupOpen(right, now)) - Number(isSignupOpen(left, now));
  });
}

export function formatShortActivityDate(activity: Activity): string {
  const start = activity.startAt.slice(5, 10).replace('-', '/');
  const end = activity.endAt.slice(5, 10).replace('-', '/');
  return start === end ? start : `${start} - ${end}`;
}

export function getPublishedActivity(list: Activity[], id: number): Activity | undefined {
  return publishedActivities(list).find((item) => item.id === id);
}

export function signupTypes(activity: Activity): string[] {
  const types: string[] = [];
  const seen = new Set<string>();
  activity.signupSettings.forEach((item) => {
    const type = item.type.trim();
    if (!type || seen.has(type)) return;
    seen.add(type);
    types.push(type);
  });
  return types;
}

export function signupLimit(activity: Activity): number | undefined {
  const limits = activity.signupSettings
    .map((item) => item.limit)
    .filter((limit): limit is number => typeof limit === 'number' && Number.isFinite(limit));
  if (limits.length === 0) return undefined;
  return limits.reduce((total, limit) => total + limit, 0);
}

export type ClientSignupView = {
  signup: ClientSignup;
  activity?: Activity;
};

export const SIGNUP_TABS = [
  { id: 'pending', label: '待审核', empty: '暂无待审核活动' },
  { id: 'waiting', label: '待参加', empty: '暂无待参加活动' },
  { id: 'ongoing', label: '进行中', empty: '暂无进行中活动' },
  { id: 'ended', label: '已结束', empty: '暂无已结束活动' },
  { id: 'rejected', label: '已驳回', empty: '暂无已驳回活动' },
] as const;

export type SignupTabId = (typeof SIGNUP_TABS)[number]['id'];

export function groupClientSignups(
  signups: ClientSignup[],
  activities: Activity[],
): {
  pending: ClientSignupView[];
  waiting: ClientSignupView[];
  ongoing: ClientSignupView[];
  upcoming: ClientSignupView[];
  ended: ClientSignupView[];
  rejected: ClientSignupView[];
} {
  const activitiesById = new Map(activities.map((activity) => [activity.id, activity]));
  const grouped = signups
    .map((signup): ClientSignupView => ({
      signup,
      activity: activitiesById.get(signup.activityId),
    }))
    .sort((left, right) => right.signup.createdAt.localeCompare(left.signup.createdAt));

  const pending = grouped.filter(({ signup }) => signup.status === '待审核');
  const rejected = grouped.filter(({ signup }) => signup.status === '已驳回');
  const waiting = grouped.filter(
    ({ activity, signup }) => signup.status === '已通过' && activity?.activityStatus === '未开始',
  );
  const ongoing = grouped.filter(
    ({ activity, signup }) => signup.status === '已通过' && activity?.activityStatus === '进行中',
  );
  const upcoming = grouped.filter(
    ({ activity }) => activity && activity.activityStatus !== '已结束',
  );
  const ended = grouped.filter(
    ({ activity, signup }) =>
      signup.status === '已通过' && (!activity || activity.activityStatus === '已结束'),
  );

  return { pending, waiting, ongoing, upcoming, ended, rejected };
}

export function signupsForTab(
  groups: ReturnType<typeof groupClientSignups>,
  tab: SignupTabId,
): ClientSignupView[] {
  return groups[tab];
}

export function filterSignupsByTitle(items: ClientSignupView[], query: string): ClientSignupView[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return items;
  return items.filter((item) => {
    const title = (item.activity?.title ?? '活动已失效').toLowerCase();
    return title.includes(needle);
  });
}

export type SignupCta = { label: string; enabled: boolean };

export function signupCta(activity: Activity, signedUp: boolean, now = Date.now()): SignupCta {
  if (activity.activityStatus === '已结束') return { label: '报名已结束', enabled: false };
  if (signedUp) return { label: '已报名', enabled: false };
  const start = parseActivityDate(activity.signupStartAt);
  const end = parseActivityDate(activity.signupEndAt);
  if (Number.isFinite(start) && now < start) return { label: '报名未开始', enabled: false };
  if (Number.isFinite(end) && now > end) return { label: '报名已截止', enabled: false };
  return { label: '立即报名', enabled: true };
}

export type FavoriteView = {
  activityId: number;
  activity?: Activity;
};

export function favoriteViews(ids: number[], activities: Activity[]): FavoriteView[] {
  const published = new Map(clientVisibleActivities(activities).map((activity) => [activity.id, activity]));
  return ids.map((activityId) => ({ activityId, activity: published.get(activityId) }));
}

export function previewFavorites(ids: number[], activities: Activity[]): FavoriteView[] {
  return favoriteViews(ids, activities)
    .filter((item) => item.activity)
    .slice(0, HOME_FAVORITE_PREVIEW_LIMIT);
}

export const HOME_MINE_TABS = [
  { id: 'signups', label: '我的活动' },
  { id: 'favorites', label: '我的收藏' },
] as const;

export type HomeMinePane = (typeof HOME_MINE_TABS)[number]['id'];
export type HomeMineMode = 'hidden' | 'signups' | 'favorites' | 'tabs';

export function hasHomeSignupsPane(signups: readonly unknown[]): boolean {
  return signups.length > 0;
}

export function hasHomeFavoritesPane(preview: readonly FavoriteView[]): boolean {
  return preview.some((item) => item.activity);
}

export function homeMineMode(hasSignups: boolean, hasFavorites: boolean): HomeMineMode {
  if (hasSignups && hasFavorites) return 'tabs';
  if (hasSignups) return 'signups';
  if (hasFavorites) return 'favorites';
  return 'hidden';
}
