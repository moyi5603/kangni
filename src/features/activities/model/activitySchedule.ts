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

export type RecurringSessionInput = {
  repeatWeekday: number;
  timeStart: string;
  timeEnd: string;
  cycleStart: string;
  cycleEnd: string;
};

export type ActivityScheduleView = {
  scheduleType: ActivityScheduleType;
  startAt: string;
  endAt: string;
  repeatWeekday?: number;
  timeStart?: string;
  timeEnd?: string;
  cycleStart?: string;
  cycleEnd?: string;
  sessions: ActivitySession[];
};

export type ActivityScheduleDraft = {
  scheduleType: ActivityScheduleType;
  repeatWeekday?: number;
  timeStart?: string;
  timeEnd?: string;
  cycleStart?: string;
  cycleEnd?: string;
  sessions: ActivitySession[];
};

function isoWeekday(value: string): number {
  const day = dayjs(value).day();
  return day === 0 ? 7 : day;
}

export function weekdayLabel(value: number): string {
  return WEEKDAYS.find((item) => item.value === value)?.label ?? `周${value}`;
}

export function createSessionId(startAt: string, index: number): string {
  return `s-${index}-${startAt.replace(/[^\d]/g, '')}`;
}

export function generateRecurringSessions(input: RecurringSessionInput): ActivitySession[] {
  const start = dayjs(input.cycleStart).startOf('day');
  const end = dayjs(input.cycleEnd).startOf('day');
  if (!start.isValid() || !end.isValid() || end.isBefore(start)) return [];
  const sessions: ActivitySession[] = [];
  let cursor = start;
  let index = 0;
  while (!cursor.isAfter(end)) {
    if (isoWeekday(cursor.format('YYYY-MM-DD')) === input.repeatWeekday) {
      const date = cursor.format('YYYY-MM-DD');
      const startAt = `${date} ${input.timeStart}`;
      sessions.push({
        id: createSessionId(startAt, index),
        startAt,
        endAt: `${date} ${input.timeEnd}`,
      });
      index += 1;
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

export function isSessionEnded(session: ActivitySession, now = Date.now()): boolean {
  return !dayjs(session.endAt).isAfter(dayjs(now));
}

export function listClientSignupSessions(
  sessions: ActivitySession[],
  now = Date.now(),
  limit = CLIENT_SIGNUP_SESSION_LIMIT,
): ActivitySession[] {
  return [...sessions]
    .filter((session) => !isSessionEnded(session, now))
    .sort((left, right) => left.startAt.localeCompare(right.startAt))
    .slice(0, limit);
}

export function needsSessionPick(scheduleType: ActivityScheduleType | undefined): boolean {
  return scheduleType === 'recurring' || scheduleType === 'series';
}

export function shouldShowRecentSessions(
  scheduleType: ActivityScheduleType | undefined,
  sessions: ActivitySession[],
  now = Date.now(),
): boolean {
  return needsSessionPick(scheduleType) && listClientSignupSessions(sessions, now).length > 1;
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
  if (activity.scheduleType === 'recurring') {
    const count = activity.sessions.length;
    const day = weekdayLabel(activity.repeatWeekday ?? 0);
    const clock = `${activity.timeStart ?? ''}-${activity.timeEnd ?? ''}`;
    const span = `${activity.cycleStart ?? ''}～${activity.cycleEnd ?? ''}`;
    return `每${day} ${clock}（${span}，共 ${count} 场）`;
  }
  if (activity.scheduleType === 'series') {
    const first = activity.sessions[0];
    const count = activity.sessions.length;
    if (!first) return `共 ${count} 场`;
    return `首场 ${first.startAt} ~ ${first.endAt} · 共 ${count} 场`;
  }
  return `${activity.startAt} ~ ${activity.endAt}`;
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

export function parseSessionIds(raw: string | undefined): string[] {
  return (raw ?? '').split('、').map((item) => item.trim()).filter(Boolean);
}

export function stringifySessionIds(ids: string[]): string {
  return ids.join('、');
}

export function formatPickedSessionsLabel(sessions: ActivitySession[], raw?: string): string {
  const ids = parseSessionIds(raw);
  if (!ids.length) return '';
  return ids
    .map((id) => {
      const index = sessions.findIndex((session) => session.id === id);
      return index < 0 ? id : formatSessionLabel(sessions[index], index);
    })
    .join('；');
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

export function hasOpenSessionSignup(
  sessions: ActivitySession[],
  window: Pick<SessionSignupWindow, 'signupStartAt' | 'signupEndAt' | 'signupHoursBefore'>,
  now = Date.now(),
): boolean {
  return sessions.some((session) => isSessionSignupOpen(session, window, now));
}

export function validateActivitySchedule(draft: ActivityScheduleDraft): string | undefined {
  if (draft.scheduleType === 'recurring') {
    if (draft.repeatWeekday == null) return '请选择重复的周几';
    if (!draft.timeStart || !draft.timeEnd) return '请填写每日时段';
    if (!draft.cycleStart || !draft.cycleEnd) return '请选择周期起止日期';
    const sessions =
      draft.sessions.length > 0
        ? draft.sessions
        : generateRecurringSessions({
            repeatWeekday: draft.repeatWeekday,
            timeStart: draft.timeStart,
            timeEnd: draft.timeEnd,
            cycleStart: draft.cycleStart,
            cycleEnd: draft.cycleEnd,
          });
    if (!sessions.length) return '该周期内没有可生成的场次';
    return undefined;
  }
  if (draft.scheduleType === 'series') {
    if (draft.sessions.length < 2) return '系列活动至少需要 2 场';
    for (const session of draft.sessions) {
      if (!session.startAt || !session.endAt) return '请完善每一场的时间';
      if (session.endAt < session.startAt) return '场次结束时间不得早于开始时间';
    }
    return undefined;
  }
  return undefined;
}

export function resolveScheduleSessions(draft: ActivityScheduleDraft): ActivitySession[] {
  if (draft.scheduleType === 'recurring' && draft.repeatWeekday != null && draft.timeStart && draft.timeEnd && draft.cycleStart && draft.cycleEnd) {
    return generateRecurringSessions({
      repeatWeekday: draft.repeatWeekday,
      timeStart: draft.timeStart,
      timeEnd: draft.timeEnd,
      cycleStart: draft.cycleStart,
      cycleEnd: draft.cycleEnd,
    });
  }
  return draft.sessions;
}
