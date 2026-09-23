import dayjs from 'dayjs';

import type { ActivitySession } from './activitySchedule';
import { sessionsHeldAfterTerminate } from './activitySchedule';

export const sessionOverviewStatuses = ['未开始', '进行中', '已结束', '已取消'] as const;
export type SessionOverviewStatus = (typeof sessionOverviewStatuses)[number];

export type SessionOverviewInputSession = {
  id: string;
  startAt: string;
  endAt: string;
};

export type SessionOverviewSignup = {
  status: string;
  sessionIds: string[];
};

export type SessionOverviewRow = {
  id: string;
  label: string;
  startAt: string;
  endAt: string;
  status: SessionOverviewStatus;
  signedCount: number;
  pendingCount: number;
  quota: number | null;
};

function normalizeQuota(value: number | null | undefined): number | null {
  return value != null && value > 0 ? value : null;
}

export function occupiesSignupQuota(status: string): boolean {
  return status === '待审核' || status === '已通过';
}

export function igStatusToOverview(
  status: 'upcoming' | 'ongoing' | 'ended' | 'cancelled',
): SessionOverviewStatus {
  if (status === 'upcoming') return '未开始';
  if (status === 'ongoing') return '进行中';
  if (status === 'ended') return '已结束';
  return '已取消';
}

export function deriveClockSessionStatus(
  session: Pick<ActivitySession, 'startAt' | 'endAt'>,
  now: number,
  terminatedAt?: string,
): SessionOverviewStatus {
  if (terminatedAt) {
    const kept = sessionsHeldAfterTerminate([session], terminatedAt);
    if (!kept.length) return '已取消';
  }
  const clock = dayjs(now);
  if (clock.isBefore(dayjs(session.startAt))) return '未开始';
  // Align isSessionEnded: endAt <= now → 已结束
  if (!dayjs(session.endAt).isAfter(clock)) return '已结束';
  return '进行中';
}

export function buildSessionOverview(input: {
  sessions: SessionOverviewInputSession[];
  signups: SessionOverviewSignup[];
  quota: number | null;
  quotaOf?: (session: SessionOverviewInputSession, index: number) => number | null;
  statusOf: (session: SessionOverviewInputSession, index: number) => SessionOverviewStatus;
}): SessionOverviewRow[] {
  return input.sessions.map((session, index) => {
    const related = input.signups.filter((item) => item.sessionIds.includes(session.id));
    const occupying = related.filter((item) => occupiesSignupQuota(item.status));
    const rawQuota = input.quotaOf ? input.quotaOf(session, index) : input.quota;
    return {
      id: session.id,
      label: `第 ${index + 1} 场`,
      startAt: session.startAt,
      endAt: session.endAt,
      status: input.statusOf(session, index),
      signedCount: occupying.length,
      pendingCount: occupying.filter((item) => item.status === '待审核').length,
      quota: normalizeQuota(rawQuota),
    };
  });
}

export function filterBySessionId<T>(
  rows: T[],
  sessionId: string,
  sessionIdsOf: (row: T) => string[],
): T[] {
  if (!sessionId) return rows;
  return rows.filter((row) => sessionIdsOf(row).includes(sessionId));
}

export type SessionSelectOption = {
  value: string;
  label: string;
  indexLabel?: string;
  timeLabel?: string;
};

export function sessionSelectOptions(sessions: SessionOverviewInputSession[]): SessionSelectOption[] {
  return [
    { value: '', label: '全部场次' },
    ...sessions.map((session, index) => ({
      value: session.id,
      label: `第 ${index + 1} 场 ${session.startAt} ~ ${session.endAt}`,
      indexLabel: `第 ${index + 1} 场`,
      timeLabel: `${session.startAt} ~ ${session.endAt}`,
    })),
  ];
}

export function formatQuota(quota: number | null): string {
  return quota == null ? '—' : String(quota);
}
