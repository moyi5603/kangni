import {
  defaultCheckInSettings,
  evaluateCheckIn,
  pageHashHref,
  type CheckInActivity,
  type CheckInResult,
  type CheckInSignup,
  type PageLocation,
} from '../../activities/model/activityCheckIn';
import { isInterestGroupLead, type InterestGroup } from './interestGroup';
import type { InterestGroupActivity } from './interestGroupActivity';
import type { InterestGroupSignup } from './interestGroupSignup';

export function shouldShowIgCheckInQr(
  activity: Pick<InterestGroupActivity, 'hostName' | 'checkInEnabled'>,
  group: Pick<InterestGroup, 'leadEmployeeIds' | 'leadName'> | undefined,
  viewer: string,
): boolean {
  if (!activity.checkInEnabled) return false;
  const name = viewer.trim();
  if (activity.hostName.trim() === name) return true;
  return Boolean(group && isInterestGroupLead(group, name));
}

export function toInterestGroupCheckInActivity(activity: InterestGroupActivity): CheckInActivity & {
  id: number;
  title: string;
} {
  return {
    id: activity.id,
    title: activity.title,
    scheduleType: activity.type,
    startAt: activity.startAt ?? '',
    endAt: activity.endAt ?? '',
    sessions: activity.sessions.map((session) => ({
      id: session.id,
      startAt: session.startAt,
      endAt: session.endAt,
      checkInToken: session.checkInToken,
    })),
    ...defaultCheckInSettings(),
    checkInEnabled: activity.checkInEnabled,
    checkInOpenMode: activity.checkInOpenMode,
    checkInOpenMinutesBefore: activity.checkInOpenMinutesBefore,
    checkInValidAfterStart: activity.checkInValidAfterStart,
    checkInValidAfterStartUnit: activity.checkInValidAfterStartUnit,
    checkInDynamicQr: activity.checkInDynamicQr,
    checkInToken: activity.checkInToken,
    terminatedAt: activity.terminatedAt,
  };
}

export function toInterestGroupCheckInSignup(signup: InterestGroupSignup): CheckInSignup {
  return {
    status: signup.status,
    answers: signup.sessionId ? { 场次: signup.sessionId } : {},
    checkIns: signup.checkIns,
  };
}

export function evaluateInterestGroupCheckIn(
  activity: InterestGroupActivity,
  sessionId: string,
  token: string,
  signup: InterestGroupSignup | undefined,
  now = Date.now(),
): CheckInResult {
  return evaluateCheckIn({
    activity: toInterestGroupCheckInActivity(activity),
    sessionId,
    token,
    signup: signup ? toInterestGroupCheckInSignup(signup) : undefined,
    now,
  });
}

export function toIgH5CheckInHash(activityId: number, sessionId: string, token: string): string {
  const query = new URLSearchParams({ s: sessionId, t: token });
  return `#/c/h5/ig-act-${activityId}/checkin?${query.toString()}`;
}

export function currentIgCheckInUrl(
  activityId: number,
  sessionId: string,
  token: string,
  loc: PageLocation | null | undefined = typeof window === 'undefined' ? undefined : window.location,
): string {
  return pageHashHref(toIgH5CheckInHash(activityId, sessionId, token), loc);
}
