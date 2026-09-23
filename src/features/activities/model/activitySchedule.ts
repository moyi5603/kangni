import dayjs from 'dayjs';

export const activityScheduleTypes = ['once', 'recurring', 'series'] as const;
export type ActivityScheduleType = (typeof activityScheduleTypes)[number];

export const activityScheduleTypeLabels: Record<ActivityScheduleType, string> = {
  once: '单次活动',
  recurring: '周期活动',
  series: '系列活动',
};

export const WEEKDAYS = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 7, label: '周日' },
] as const;

export type ActivitySession = {
  id: string;
  startAt: string;
  endAt: string;
  checkInToken?: string;
};

export type RepeatRule = {
  weekday: number;
  timeStart: string;
  timeEnd: string;
};

export type RecurringSessionInput = {
  rules: RepeatRule[];
  windowStart: string;
  windowEnd: string;
};

export type ActivityScheduleView = {
  scheduleType: ActivityScheduleType;
  startAt: string;
  endAt: string;
  repeatRules?: RepeatRule[];
  repeatWeekday?: number;
  timeStart?: string;
  timeEnd?: string;
  sessions: ActivitySession[];
};

export type ActivityScheduleDraft = {
  scheduleType: ActivityScheduleType;
  windowStart?: string;
  windowEnd?: string;
  repeatRules?: RepeatRule[];
  repeatWeekday?: number;
  timeStart?: string;
  timeEnd?: string;
  sessions: ActivitySession[];
};

function isoWeekday(value: string): number {
  const day = dayjs(value).day();
  return day === 0 ? 7 : day;
}

export function weekdayLabel(value: number): string {
  return WEEKDAYS.find((item) => item.value === value)?.label ?? `周${value}`;
}

export function coerceRepeatRules(input: {
  repeatRules?: RepeatRule[];
  repeatWeekday?: number;
  timeStart?: string;
  timeEnd?: string;
}): RepeatRule[] {
  if (input.repeatRules?.length) {
    return [...input.repeatRules].sort((left, right) => left.weekday - right.weekday);
  }
  if (input.repeatWeekday != null && input.timeStart && input.timeEnd) {
    return [{ weekday: input.repeatWeekday, timeStart: input.timeStart, timeEnd: input.timeEnd }];
  }
  return [];
}

export function repeatWeekdayValues(rules: Array<{ weekday: number | string }>): number[] {
  return rules.map((item) => Number(item.weekday)).filter((value) => value >= 1 && value <= 7);
}

export function applyRepeatWeekdaySelection<T extends { weekday: number | string }>(
  current: T[],
  checked: Array<number | string>,
): Array<T | { weekday: number }> {
  const selected = [...new Set(checked.map(Number).filter((value) => value >= 1 && value <= 7))].sort((left, right) => left - right);
  return selected.map((weekday) => current.find((item) => Number(item.weekday) === weekday) ?? { weekday });
}

export function formatRecurringWeekdays(rules: RepeatRule[]): string {
  const labels = coerceRepeatRules({ repeatRules: rules }).map((rule) => weekdayLabel(rule.weekday));
  if (!labels.length) return '';
  return `每${labels.join('、')}`;
}

export function sessionFullyWithinWindow(
  session: Pick<ActivitySession, 'startAt' | 'endAt'>,
  windowStart: string,
  windowEnd: string,
): boolean {
  return Boolean(windowStart && windowEnd) && session.startAt >= windowStart && session.endAt <= windowEnd;
}

export function createSessionId(startAt: string, index: number): string {
  return `s-${index}-${startAt.replace(/[^\d]/g, '')}`;
}

export function generateRecurringSessions(input: RecurringSessionInput): ActivitySession[] {
  const rules = coerceRepeatRules({ repeatRules: input.rules }).filter(
    (rule) => rule.timeStart && rule.timeEnd && rule.timeEnd > rule.timeStart,
  );
  const start = dayjs(input.windowStart);
  const end = dayjs(input.windowEnd);
  if (!start.isValid() || !end.isValid() || end.isBefore(start) || !rules.length) return [];
  const byWeekday = new Map(rules.map((rule) => [rule.weekday, rule]));
  const sessions: ActivitySession[] = [];
  let cursor = start.startOf('day');
  const lastDay = end.startOf('day');
  let index = 0;
  while (!cursor.isAfter(lastDay)) {
    const date = cursor.format('YYYY-MM-DD');
    const rule = byWeekday.get(isoWeekday(date));
    if (rule) {
      const startAt = `${date} ${rule.timeStart}`;
      const candidate = { id: createSessionId(startAt, index), startAt, endAt: `${date} ${rule.timeEnd}` };
      if (sessionFullyWithinWindow(candidate, input.windowStart, input.windowEnd)) {
        sessions.push(candidate);
        index += 1;
      }
    }
    cursor = cursor.add(1, 'day');
  }
  return sessions;
}

export function syncSessionBounds(sessions: ActivitySession[]): { startAt: string; endAt: string } {
  const starts = sessions.map((item) => item.startAt).sort();
  const ends = sessions.map((item) => item.endAt).sort();
  return { startAt: starts[0] ?? '', endAt: ends[ends.length - 1] ?? '' };
}

export const CLIENT_SIGNUP_SESSION_LIMIT = 5;

export function sessionsHeldAfterTerminate<T extends { startAt: string }>(
  sessions: T[],
  terminatedAt: string,
): T[] {
  const cutoff = dayjs(terminatedAt);
  return sessions.filter((session) => !dayjs(session.startAt).isAfter(cutoff));
}

export function isSessionEnded(session: ActivitySession, now = Date.now()): boolean {
  return !dayjs(session.endAt).isAfter(dayjs(now));
}

export function listClientSignupSessions(
  sessions: ActivitySession[],
  now = Date.now(),
  limit = CLIENT_SIGNUP_SESSION_LIMIT,
  terminatedAt?: string,
): ActivitySession[] {
  const visible = terminatedAt ? sessionsHeldAfterTerminate(sessions, terminatedAt) : sessions;
  return [...visible]
    .filter((session) => !isSessionEnded(session, now))
    .sort((left, right) => left.startAt.localeCompare(right.startAt))
    .slice(0, limit);
}

export function visibleSignupSessions<T>(sessions: readonly T[], expanded: boolean): T[] {
  if (expanded || sessions.length <= CLIENT_SIGNUP_SESSION_LIMIT) return [...sessions];
  return sessions.slice(0, CLIENT_SIGNUP_SESSION_LIMIT);
}

export function needsSessionPick(scheduleType: ActivityScheduleType | undefined): boolean {
  return scheduleType === 'recurring' || scheduleType === 'series';
}

export function shouldShowRecentSessions(
  scheduleType: ActivityScheduleType | undefined,
  sessions: ActivitySession[],
  now = Date.now(),
  terminatedAt?: string,
): boolean {
  return needsSessionPick(scheduleType) && listClientSignupSessions(sessions, now, undefined, terminatedAt).length > 1;
}

export function signupQuotaLabel(scheduleType: ActivityScheduleType | undefined): string {
  return needsSessionPick(scheduleType) ? '每场人数上限' : '报名总人数';
}

export function signupQuotaPlaceholder(scheduleType: ActivityScheduleType | undefined): string | undefined {
  return needsSessionPick(scheduleType) ? '各场独立限制，不跨场共用' : undefined;
}

export const SIGNUP_HOURS_PLACEHOLDER = '0 为开场即停';

export function clientQuotaLabel(scheduleType: ActivityScheduleType | undefined): string {
  return needsSessionPick(scheduleType) ? '每场名额' : '总名额';
}

export function formatActivityScheduleTime(activity: ActivityScheduleView): string {
  const window = `${activity.startAt} ~ ${activity.endAt}`;
  if (activity.scheduleType === 'recurring' || activity.scheduleType === 'series') {
    return `${window} · 共 ${activity.sessions.length} 场`;
  }
  return window;
}

export function formatSessionChipDate(startAt: string): string {
  const parsed = dayjs(startAt);
  if (!parsed.isValid()) return startAt;
  return `${parsed.month() + 1}/${parsed.date()}`;
}

export function formatSessionChipTime(startAt: string, endAt: string): string {
  const start = dayjs(startAt);
  const end = dayjs(endAt);
  if (!start.isValid() || !end.isValid()) return `${startAt} ~ ${endAt}`;
  return `${start.format('HH:mm')}-${end.format('HH:mm')}`;
}

export function formatSessionLabel(session: ActivitySession, index: number): string {
  return `第 ${index + 1} 场 ${session.startAt} ~ ${session.endAt}`;
}

export function formatSessionIndexLabel(index: number): string {
  return `第 ${index + 1} 场`;
}

export function formatSessionTimeRange(session: Pick<ActivitySession, 'startAt' | 'endAt'>): string {
  return `${session.startAt} ~ ${session.endAt}`;
}

export function parseSessionIds(raw: string | undefined): string[] {
  return (raw ?? '').split('、').map((item) => item.trim()).filter(Boolean);
}

export function stringifySessionIds(ids: string[]): string {
  return ids.join('、');
}

function mapPickedSessions(
  sessions: ActivitySession[],
  raw: string | undefined,
  format: (session: ActivitySession, index: number) => string,
): string {
  const ids = parseSessionIds(raw);
  if (!ids.length) return '';
  return ids
    .map((id) => {
      const index = sessions.findIndex((session) => session.id === id);
      return index < 0 ? id : format(sessions[index], index);
    })
    .join('；');
}

export function formatPickedSessionsLabel(sessions: ActivitySession[], raw?: string): string {
  return mapPickedSessions(sessions, raw, formatSessionLabel);
}

export function formatPickedSessionIndexLabel(sessions: ActivitySession[], raw?: string): string {
  return mapPickedSessions(sessions, raw, (_session, index) => formatSessionIndexLabel(index));
}

export function formatPickedSessionTimeLabel(sessions: ActivitySession[], raw?: string): string {
  return mapPickedSessions(sessions, raw, (session) => formatSessionTimeRange(session));
}

export function validateSessionPick(
  scheduleType: ActivityScheduleType | undefined,
  sessions: ActivitySession[],
  picked: string[],
  window?: SessionSignupWindow,
): string | undefined {
  if (!needsSessionPick(scheduleType)) return undefined;
  if (!picked.length) return '请选择要参加的场次';
  const allowed = new Set(sessions.map((item) => item.id));
  if (picked.some((id) => !allowed.has(id))) return '请选择有效的场次';
  if (window) {
    const now = window.now ?? Date.now();
    const closed = picked.some((id) => {
      const session = sessions.find((item) => item.id === id);
      return !session || !isSessionSignupOpen(session, window, now);
    });
    if (closed) return '请选择仍可报名的场次';
  }
  return undefined;
}

export type SessionSignupWindow = {
  signupStartAt: string;
  signupEndAt: string;
  signupHoursBefore?: number;
  now?: number;
};

export function sessionSignupEndAt(startAt: string, hoursBefore = 0): string {
  return dayjs(startAt).subtract(hoursBefore, 'hour').format('YYYY-MM-DD HH:mm');
}

export function syncSignupEndAt(sessions: ActivitySession[], hoursBefore = 0): string {
  const ends = sessions.map((item) => sessionSignupEndAt(item.startAt, hoursBefore)).sort();
  return ends[ends.length - 1] ?? '';
}

export function formatScheduleSignupTime(input: {
  scheduleType: ActivityScheduleType;
  signupStartAt: string;
  signupEndAt: string;
  signupHoursBefore?: number;
}): string {
  if (!needsSessionPick(input.scheduleType)) {
    return `${input.signupStartAt} ~ ${input.signupEndAt}`;
  }
  const hours = input.signupHoursBefore ?? 0;
  if (hours === 0) return `${input.signupStartAt} 起，每场开场时截止`;
  return `${input.signupStartAt} 起，每场开始前 ${hours} 小时截止`;
}

export function isSessionSignupOpen(
  session: ActivitySession,
  window: Pick<SessionSignupWindow, 'signupStartAt' | 'signupEndAt' | 'signupHoursBefore'>,
  now = Date.now(),
): boolean {
  const current = dayjs(now);
  const start = dayjs(window.signupStartAt);
  const activityEnd = dayjs(window.signupEndAt);
  const sessionEnd = dayjs(sessionSignupEndAt(session.startAt, window.signupHoursBefore ?? 0));
  return !current.isBefore(start) && !current.isAfter(activityEnd) && !current.isAfter(sessionEnd);
}

export function filterOpenSessionPicks(
  picked: string[],
  sessions: ActivitySession[],
  window?: SessionSignupWindow,
): string[] {
  return picked.filter((id) => {
    const session = sessions.find((item) => item.id === id);
    if (!session) return false;
    if (!window) return true;
    return isSessionSignupOpen(session, window, window.now ?? Date.now());
  });
}

export function hasOpenSessionSignup(
  sessions: ActivitySession[],
  window: Pick<SessionSignupWindow, 'signupStartAt' | 'signupEndAt' | 'signupHoursBefore'>,
  now = Date.now(),
): boolean {
  return sessions.some((session) => isSessionSignupOpen(session, window, now));
}

export function validateActivitySchedule(draft: ActivityScheduleDraft): string | undefined {
  if (draft.scheduleType === 'once') return undefined;
  if (!draft.windowStart || !draft.windowEnd) return '请选择活动时间';
  if (draft.windowEnd < draft.windowStart) return '结束时间不得早于开始时间';
  if (draft.scheduleType === 'recurring') {
    const rules = coerceRepeatRules(draft);
    if (!rules.length) return '请选择重复的周几';
    for (const rule of rules) {
      const label = weekdayLabel(rule.weekday);
      if (!rule.timeStart || !rule.timeEnd) return `请填写${label}时段`;
      if (rule.timeEnd <= rule.timeStart) return `${label}结束时间不得早于开始时间`;
    }
    const sessions = generateRecurringSessions({
      rules,
      windowStart: draft.windowStart,
      windowEnd: draft.windowEnd,
    });
    if (!sessions.length) return '该活动时间内没有可生成的场次';
    return undefined;
  }
  if (draft.scheduleType === 'series') {
    if (draft.sessions.length < 2) return '系列活动至少需要 2 场';
    for (const [index, session] of draft.sessions.entries()) {
      if (!session.startAt || !session.endAt) return '请完善每一场的时间';
      if (session.endAt < session.startAt) return '场次结束时间不得早于开始时间';
      if (!sessionFullyWithinWindow(session, draft.windowStart, draft.windowEnd)) {
        return `第 ${index + 1} 场必须完全落在活动时间内`;
      }
    }
    return undefined;
  }
  return undefined;
}

export function resolveScheduleSessions(draft: ActivityScheduleDraft): ActivitySession[] {
  if (draft.scheduleType === 'recurring') {
    const rules = coerceRepeatRules(draft);
    if (rules.length && draft.windowStart && draft.windowEnd) {
      return generateRecurringSessions({
        rules,
        windowStart: draft.windowStart,
        windowEnd: draft.windowEnd,
      });
    }
  }
  return draft.sessions;
}
