import dayjs from 'dayjs';
import type { InterestGroup } from '../../../interest-groups/model/interestGroup';
import type { InterestGroupActivity } from '../../../interest-groups/model/interestGroupActivity';
import { formatInterestGroupActivityTime } from '../../../interest-groups/model/interestGroupActivity';
import type { InterestGroupComment } from '../../../interest-groups/model/interestGroupComment';
import type { InterestGroupMember } from '../../../interest-groups/model/interestGroupMember';
import type { InterestGroupMoment } from '../../../interest-groups/model/interestGroupMoment';
import type { InterestGroupSignup } from '../../../interest-groups/model/interestGroupSignup';
import { occupiesInterestGroupSignupSlot } from '../../../interest-groups/model/interestGroupSignup';
import { formatCEndDateTimeInText } from '../../formatDateTime';
import {
  getInterestGroupActivities,
  getInterestGroupComments,
  getInterestGroupMembers,
  getInterestGroupMoments,
  getInterestGroups,
  getInterestGroupSignups,
  viewerHasLikedInterestGroupActivity,
} from '../../../interest-groups/model/interestGroupStore';
import { momentCoverUrl, visibleOnClient, type MomentRecord } from '../../../activities/model/moment';
import { CATS, type Act, type ActSession, type CatKey, type Group, type Moment } from '../h5/igShared';

export type IgActComment = {
  id: string;
  aid: string;
  author: string;
  text: string;
  likes: number;
  liked: boolean;
  time: string;
};

export type IgSignupPerson = {
  id: string;
  activityId: string;
  sessionId?: string;
  name: string;
  department: string;
  status: InterestGroupSignup['status'];
};

export type IgGroupMember = {
  gid: string;
  name: string;
  department: string;
  role: InterestGroupMember['role'];
  status: InterestGroupMember['status'];
};

export type IgCatalog = {
  groups: Group[];
  acts: Act[];
  moments: Moment[];
  comments: IgActComment[];
  signups: IgSignupPerson[];
  groupMembers: IgGroupMember[];
};

export function toClientGroupId(id: number): string {
  return String(id);
}

export function toClientActId(id: number): string {
  return String(id);
}

export function parseClientId(id: string): number {
  return Number(id);
}

export function isPublishedIgActivity(activity: InterestGroupActivity): boolean {
  return (
    activity.publishStatus === '已发布' &&
    (activity.auditStatus === '已通过' || activity.auditStatus === '无需审核')
  );
}

function memberMatches(member: InterestGroupMember, viewer: string): boolean {
  return member.employeeId === viewer || member.name === viewer;
}

function isClientVisibleGroup(group: InterestGroup, viewer: string, members: InterestGroupMember[]): boolean {
  if (group.auditStatus === '已驳回') return false;
  if (group.auditStatus === '待审核') {
    return group.leadName === viewer || members.some((item) => item.groupId === group.id && memberMatches(item, viewer));
  }
  return true;
}

function isClientVisibleActivity(activity: InterestGroupActivity, viewer: string): boolean {
  if (isPublishedIgActivity(activity)) return true;
  return activity.hostName === viewer && activity.auditStatus !== '已驳回';
}

function asCat(key: string): CatKey {
  return key in CATS ? (key as CatKey) : 'other';
}

function htmlToText(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function sessionDays(startAt: string, endAt: string): number {
  const start = dayjs(startAt);
  const end = dayjs(endAt);
  if (!start.isValid() || !end.isValid()) return 1;
  return Math.max(1, end.startOf('day').diff(start.startOf('day'), 'day') + 1);
}

function formatChipDate(startAt: string): string {
  const start = dayjs(startAt);
  return start.isValid() ? start.format('MM月DD日') : startAt;
}

function formatChipTime(startAt: string, endAt: string): string {
  const start = dayjs(startAt);
  const end = dayjs(endAt);
  if (!start.isValid() || !end.isValid()) return `${startAt} - ${endAt}`;
  if (start.isSame(end, 'day')) return `${start.format('HH:mm')} - ${end.format('HH:mm')}`;
  return `${start.format('HH:mm')} - 次日 ${end.format('HH:mm')}`;
}

function toClientSessions(
  activity: InterestGroupActivity,
  viewerSignups: InterestGroupSignup[],
): ActSession[] | undefined {
  if (!activity.sessions?.length) return undefined;
  return activity.sessions.map((session) => ({
    id: session.id,
    date: formatChipDate(session.startAt),
    time: formatChipTime(session.startAt, session.endAt),
    cap: session.capacity,
    signed: session.signedCount,
    joinedByMe: viewerSignups.some(
      (item) => item.sessionId === session.id && occupiesInterestGroupSignupSlot(item.status),
    ),
  }));
}

function recReason(
  activity: InterestGroupActivity,
  group: InterestGroup | undefined,
  joinedGroup: boolean,
  viewer: string,
): string | undefined {
  if (joinedGroup && group && group.leadName !== viewer && group.leadEmployeeId !== viewer) {
    return `因为你常参加「${group.name}」`;
  }
  const first = activity.sessions?.[0];
  if (first) {
    const days = sessionDays(first.startAt, first.endAt);
    if (days > 1) return `跨 ${days} 天连营`;
  }
  return undefined;
}

export function toClientGroup(
  group: InterestGroup,
  members: InterestGroupMember[],
  activities: InterestGroupActivity[],
  viewer: string,
): Group {
  const mine = members.find((item) => item.groupId === group.id && memberMatches(item, viewer));
  const publishedCount = activities.filter((item) => item.groupId === group.id && isPublishedIgActivity(item)).length;
  return {
    id: toClientGroupId(group.id),
    name: group.name,
    cat: asCat(group.categoryKey),
    lead: group.leadName,
    members: group.memberCount,
    acts: publishedCount || group.activityCount,
    joined: mine?.status === '已通过',
    pending: mine?.status === '待审核',
    join: group.joinMode,
    intro: group.intro,
    tags: group.tags,
    area: group.area,
    hot: group.memberCount >= 100,
    auditStatus: group.auditStatus,
    createdByMe: group.leadEmployeeId === viewer || group.leadName === viewer,
  };
}

export function toClientAct(
  activity: InterestGroupActivity,
  group: InterestGroup | undefined,
  signups: InterestGroupSignup[],
  viewer: string,
  joinedGroup: boolean,
): Act {
  const mine = signups.filter((item) => item.activityId === activity.id && item.name === viewer);
  const occupying = mine.filter((item) => occupiesInterestGroupSignupSlot(item.status));
  const sessions = toClientSessions(activity, occupying);
  const first = activity.sessions?.[0];
  const days = first ? sessionDays(first.startAt, first.endAt) : 1;
  const start = activity.startAt || first?.startAt || activity.signupStartAt;
  return {
    id: toClientActId(activity.id),
    gid: activity.groupId != null ? toClientGroupId(activity.groupId) : '',
    title: activity.title,
    cat: asCat(activity.categoryKey),
    type: activity.type === 'series' || activity.type === 'recurring' ? activity.type : 'once',
    when: formatCEndDateTimeInText(formatInterestGroupActivityTime(activity)),
    dateKey: Number(dayjs(start).format('MMDD')) || 0,
    daysBadge: days > 1 ? `共 ${days} 天` : undefined,
    loc: activity.location,
    host: activity.hostName,
    signed: activity.signedCount,
    cap: activity.capacity,
    likes: activity.likeCount,
    liked: viewerHasLikedInterestGroupActivity(activity.id, viewer),
    joinedByMe: occupying.length > 0,
    createdByMe: activity.hostName === viewer,
    recReason: recReason(activity, group, joinedGroup, viewer),
    status: activity.status === 'cancelled' || activity.status === 'ended' ? activity.status : 'upcoming',
    desc: htmlToText(activity.detailHtml),
    tags: group?.tags.slice(0, 3) ?? [],
    sessions,
    signupStatus: occupying[0]?.status === '已驳回' ? '已驳回' : occupying[0]?.status ? '已通过' : undefined,
  };
}

export function toMomentRecord(moment: InterestGroupMoment): MomentRecord {
  return { ...moment, activityId: moment.activityId ?? 0 };
}

export function listIgHomeHighlightMoments(moments: InterestGroupMoment[], limit = 3): InterestGroupMoment[] {
  return moments
    .filter((item) => item.status === '已通过' && Boolean(momentCoverUrl(item)))
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || right.id - left.id)
    .slice(0, limit);
}

export function visibleIgMoments(moments: InterestGroupMoment[], viewer: string): InterestGroupMoment[] {
  return moments.filter((item) => visibleOnClient(toMomentRecord(item), viewer));
}

export function toClientMoment(moment: InterestGroupMoment, viewer: string): Moment | null {
  if (moment.status === '已驳回') return null;
  if (moment.status !== '已通过' && moment.author !== viewer) return null;
  return {
    id: String(moment.id),
    aid: moment.activityId != null ? toClientActId(moment.activityId) : '',
    gid: toClientGroupId(moment.groupId),
    author: moment.author,
    text: moment.content,
    imgs: moment.imageUrls.length ? moment.imageUrls : moment.videoUrl ? [moment.videoUrl] : [],
    likes: moment.likedBy.length,
    liked: moment.likedBy.includes(viewer),
    time: formatCEndDateTimeInText(moment.createdAt),
  };
}

export function buildIgCatalog(
  viewer: string,
  snapshot?: {
    groups?: InterestGroup[];
    activities?: InterestGroupActivity[];
    members?: InterestGroupMember[];
    moments?: InterestGroupMoment[];
    comments?: InterestGroupComment[];
    signups?: InterestGroupSignup[];
  },
): IgCatalog {
  const groups = snapshot?.groups ?? getInterestGroups();
  const activities = snapshot?.activities ?? getInterestGroupActivities();
  const members = snapshot?.members ?? getInterestGroupMembers();
  const moments = snapshot?.moments ?? getInterestGroupMoments();
  const comments = snapshot?.comments ?? getInterestGroupComments();
  const signups = snapshot?.signups ?? getInterestGroupSignups();

  const clientGroups = groups
    .filter((group) => isClientVisibleGroup(group, viewer, members))
    .map((group) => toClientGroup(group, members, activities, viewer));

  const visibleActs = activities.filter((activity) => isClientVisibleActivity(activity, viewer));
  const visibleActIds = new Set(visibleActs.map((item) => item.id));
  const clientActs = visibleActs.map((activity) => {
    const group = groups.find((item) => item.id === activity.groupId);
    const joinedGroup = members.some(
      (item) => item.groupId === activity.groupId && memberMatches(item, viewer) && item.status === '已通过',
    );
    return toClientAct(activity, group, signups, viewer, joinedGroup);
  });

  const clientMoments = moments.map((item) => toClientMoment(item, viewer)).filter((item): item is Moment => Boolean(item));

  const clientComments: IgActComment[] = comments
    .filter((item) => item.parentId == null && visibleActIds.has(item.activityId))
    .map((item) => ({
      id: String(item.id),
      aid: toClientActId(item.activityId),
      author: item.author,
      text: item.content,
      likes: item.likedBy.length,
      liked: item.likedBy.includes(viewer),
      time: formatCEndDateTimeInText(item.createdAt),
    }));

  const clientSignups: IgSignupPerson[] = signups
    .filter((item) => occupiesInterestGroupSignupSlot(item.status) && visibleActIds.has(item.activityId))
    .map((item) => ({
      id: String(item.id),
      activityId: toClientActId(item.activityId),
      sessionId: item.sessionId,
      name: item.name,
      department: item.department,
      status: item.status,
    }));

  const groupMembers: IgGroupMember[] = members.map((item) => ({
    gid: toClientGroupId(item.groupId),
    name: item.name,
    department: item.department,
    role: item.role,
    status: item.status,
  }));

  return {
    groups: clientGroups,
    acts: clientActs,
    moments: clientMoments,
    comments: clientComments,
    signups: clientSignups,
    groupMembers,
  };
}
