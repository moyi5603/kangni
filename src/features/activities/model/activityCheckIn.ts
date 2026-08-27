import dayjs from 'dayjs';
import { needsSessionPick, parseSessionIds, type ActivityScheduleType, type ActivitySession } from './activitySchedule';

export const CHECK_IN_ONCE_SESSION_ID = 'once';
export const CHECK_IN_DYNAMIC_MS = 5 * 60 * 1000;

export const checkInOpenModes = ['before_start', 'after_start'] as const;
export type CheckInOpenMode = (typeof checkInOpenModes)[number];

export const checkInValidUnits = ['day', 'hour'] as const;
export type CheckInValidUnit = (typeof checkInValidUnits)[number];

export type CheckInSettings = {
  checkInEnabled: boolean;
  checkInOpenMode: CheckInOpenMode;
  checkInOpenMinutesBefore: number;
  checkInValidAfterStart: number;
  checkInValidAfterStartUnit: CheckInValidUnit;
  checkInDynamicQr: boolean;
};

export type CheckInActivity = CheckInSettings & {
  scheduleType?: ActivityScheduleType;
  startAt: string;
  endAt: string;
  sessions: ActivitySession[];
  checkInToken?: string;
};

export type CheckInSignup = {
  status: string;
  answers?: Record<string, string>;
  checkIns?: Record<string, string>;
};

export type CheckInFailReason =
  | 'disabled'
  | 'no_session'
  | 'bad_token'
  | 'too_early'
  | 'expired'
  | 'no_signup'
  | 'not_approved'
  | 'wrong_session';

export type CheckInResult = { ok: true; already: boolean } | { ok: false; reason: CheckInFailReason };

export function defaultCheckInSettings(): CheckInSettings {
  return {
    checkInEnabled: false,
    checkInOpenMode: 'before_start',
    checkInOpenMinutesBefore: 30,
    checkInValidAfterStart: 3,
    checkInValidAfterStartUnit: 'day',
    checkInDynamicQr: false,
  };
}

export function checkInTokenForSession(session: Pick<ActivitySession, 'id' | 'checkInToken'>): string {
  return session.checkInToken?.trim() || `ck-${session.id}`;
}

export function ensureSessionCheckInTokens(
  sessions: ActivitySession[],
  previous: ActivitySession[] = [],
): ActivitySession[] {
  const previousById = new Map(previous.map((item) => [item.id, item]));
  return sessions.map((session) => ({
    ...session,
    checkInToken: checkInTokenForSession(previousById.get(session.id) ?? session),
  }));
}

export function listCheckInSessions(activity: CheckInActivity): ActivitySession[] {
  if (needsSessionPick(activity.scheduleType) && activity.sessions.length > 0) {
    return ensureSessionCheckInTokens(activity.sessions);
  }
  return [
    {
      id: CHECK_IN_ONCE_SESSION_ID,
      startAt: activity.startAt,
      endAt: activity.endAt,
      checkInToken: activity.checkInToken?.trim() || checkInTokenForSession({ id: CHECK_IN_ONCE_SESSION_ID }),
    },
  ];
}

export function dynamicBucket(now = Date.now()): number {
  return Math.floor(now / CHECK_IN_DYNAMIC_MS);
}

export function dynamicCheckInToken(staticToken: string, now = Date.now()): string {
  return `${staticToken}.${dynamicBucket(now)}`;
}

export function qrCheckInToken(session: ActivitySession, activity: CheckInActivity, now = Date.now()): string {
  const staticToken = checkInTokenForSession(session);
  return activity.checkInDynamicQr ? dynamicCheckInToken(staticToken, now) : staticToken;
}

function tokenMatches(session: ActivitySession, activity: CheckInActivity, token: string, now: number): boolean {
  const staticToken = checkInTokenForSession(session);
  if (!activity.checkInDynamicQr) return token === staticToken;
  return token === dynamicCheckInToken(staticToken, now);
}

export function checkInWindow(session: ActivitySession, activity: CheckInActivity): { openAt: dayjs.Dayjs; closeAt: dayjs.Dayjs } {
  const start = dayjs(session.startAt);
  const openAt =
    activity.checkInOpenMode === 'after_start'
      ? start
      : start.subtract(Math.max(0, activity.checkInOpenMinutesBefore), 'minute');
  const amount = Math.max(0, activity.checkInValidAfterStart);
  const closeAt = start.add(amount, activity.checkInValidAfterStartUnit);
  return { openAt, closeAt };
}

export function evaluateCheckIn(input: {
  activity: CheckInActivity;
  sessionId: string;
  token: string;
  signup?: CheckInSignup;
  now?: number;
}): CheckInResult {
  if (!input.activity.checkInEnabled) return { ok: false, reason: 'disabled' };
  const now = input.now ?? Date.now();
  const session = listCheckInSessions(input.activity).find((item) => item.id === input.sessionId);
  if (!session) return { ok: false, reason: 'no_session' };
  if (!tokenMatches(session, input.activity, input.token, now)) return { ok: false, reason: 'bad_token' };
  const { openAt, closeAt } = checkInWindow(session, input.activity);
  const current = dayjs(now);
  if (current.isBefore(openAt)) return { ok: false, reason: 'too_early' };
  if (current.isAfter(closeAt)) return { ok: false, reason: 'expired' };
  if (!input.signup) return { ok: false, reason: 'no_signup' };
  if (input.signup.status !== '已通过') return { ok: false, reason: 'not_approved' };
  if (needsSessionPick(input.activity.scheduleType)) {
    const picked = parseSessionIds(input.signup.answers?.['场次']);
    if (!picked.includes(input.sessionId)) return { ok: false, reason: 'wrong_session' };
  }
  if (input.signup.checkIns?.[input.sessionId]) return { ok: true, already: true };
  return { ok: true, already: false };
}

export const checkInFailCopy: Record<CheckInFailReason, string> = {
  disabled: '该活动未开启扫码签到',
  no_session: '场次不存在',
  bad_token: '二维码无效或已刷新',
  too_early: '还未到签到时间',
  expired: '签到已截止',
  no_signup: '请先报名该活动',
  not_approved: '报名通过后才能签到',
  wrong_session: '未报名该场次',
};

export function toH5CheckInHash(activityId: number, sessionId: string, token: string): string {
  const query = new URLSearchParams({ s: sessionId, t: token });
  return `#/c/h5/${activityId}/checkin?${query.toString()}`;
}

export function currentCheckInUrl(activityId: number, sessionId: string, token: string): string {
  const hash = toH5CheckInHash(activityId, sessionId, token);
  if (typeof window === 'undefined') return hash;
  const pathname = window.location.pathname.endsWith('/') ? window.location.pathname : `${window.location.pathname}/`;
  return new URL(hash, `${window.location.origin}${pathname}`).href;
}

export function parseCheckInQuery(hash: string): { sessionId: string; token: string } {
  const query = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
  const params = new URLSearchParams(query);
  return { sessionId: params.get('s') ?? '', token: params.get('t') ?? '' };
}

export function formatCheckInRuleSummary(settings: CheckInSettings): string {
  if (!settings.checkInEnabled) return '未开启';
  const open =
    settings.checkInOpenMode === 'after_start'
      ? '活动开始后可扫'
      : `活动开始前 ${settings.checkInOpenMinutesBefore} 分钟可扫`;
  const unit = settings.checkInValidAfterStartUnit === 'hour' ? '小时' : '天';
  const qr = settings.checkInDynamicQr ? '；动态二维码每 5 分钟刷新' : '；静态二维码';
  return `${open}；开始后 ${settings.checkInValidAfterStart} ${unit}内有效${qr}`;
}

export function formatSignupCheckIns(checkIns: Record<string, string> | undefined, sessions: ActivitySession[]): string {
  if (!checkIns || !Object.keys(checkIns).length) return '未签到';
  return Object.entries(checkIns)
    .map(([sessionId, at]) => {
      const index = sessions.findIndex((item) => item.id === sessionId);
      const label = sessionId === CHECK_IN_ONCE_SESSION_ID || index < 0 ? at : `第 ${index + 1} 场 ${at}`;
      return label;
    })
    .join('；');
}
