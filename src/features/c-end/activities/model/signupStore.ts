import { useMemo, useSyncExternalStore } from 'react';
import { isActivityClosed } from '../../../activities/model/activity';
import { getActivity } from '../../../activities/model/activityStore';
import { evaluateCheckIn, type CheckInResult } from '../../../activities/model/activityCheckIn';
import {
  listClientSignupSessions,
  needsSessionPick,
  parseSessionIds,
  stringifySessionIds,
} from '../../../activities/model/activitySchedule';
import {
  getRelatedList,
  patchRelated,
  subscribeRelated,
  type SignupRecord,
} from '../../../activities/model/related';

export const DEMO_SIGNUP_USER = {
  name: '陈产品',
  phone: '13800001111',
  department: '华东大区',
  position: '产品经理',
} as const;

export type ClientSignupStatus = '待审核' | '已通过' | '已驳回';

export type ClientSignup = {
  activityId: number;
  name: string;
  phone: string;
  type: string;
  status: ClientSignupStatus;
  createdAt: string;
};

const CLIENT_STATUSES: readonly ClientSignupStatus[] = ['待审核', '已通过', '已驳回'];

export const DEMO_CLIENT_SIGNUPS: readonly ClientSignup[] = [
  {
    activityId: 2,
    name: DEMO_SIGNUP_USER.name,
    phone: DEMO_SIGNUP_USER.phone,
    type: '个人报名',
    status: '已通过',
    createdAt: '2026-08-18 16:00:00',
  },
  {
    activityId: 6,
    name: DEMO_SIGNUP_USER.name,
    phone: DEMO_SIGNUP_USER.phone,
    type: '个人报名',
    status: '已通过',
    createdAt: '2026-08-17 16:00:00',
  },
  {
    activityId: 9,
    name: DEMO_SIGNUP_USER.name,
    phone: DEMO_SIGNUP_USER.phone,
    type: '个人报名',
    status: '已通过',
    createdAt: '2026-08-16 16:00:00',
  },
  {
    activityId: 1,
    name: DEMO_SIGNUP_USER.name,
    phone: DEMO_SIGNUP_USER.phone,
    type: '个人报名',
    status: '已通过',
    createdAt: '2026-04-12 10:00:00',
  },
  {
    activityId: 26,
    name: DEMO_SIGNUP_USER.name,
    phone: DEMO_SIGNUP_USER.phone,
    type: '个人报名',
    status: '已通过',
    createdAt: '2026-08-20 16:00:00',
  },
  {
    activityId: 27,
    name: DEMO_SIGNUP_USER.name,
    phone: DEMO_SIGNUP_USER.phone,
    type: '个人报名',
    status: '已通过',
    createdAt: '2026-08-21 10:00:00',
  },
  {
    activityId: 10,
    name: DEMO_SIGNUP_USER.name,
    phone: DEMO_SIGNUP_USER.phone,
    type: '个人报名',
    status: '已通过',
    createdAt: '2026-08-21 11:00:00',
  },
  {
    activityId: 12,
    name: DEMO_SIGNUP_USER.name,
    phone: DEMO_SIGNUP_USER.phone,
    type: '个人报名',
    status: '已驳回',
    createdAt: '2026-04-12 10:00:00',
  },
];

const DEMO_RELATED_IDS: Record<number, number> = { 2: 4, 6: 15, 9: 16, 1: 14, 12: 17, 26: 18, 27: 19, 10: 20 };

function isClientStatus(status: SignupRecord['status']): status is ClientSignupStatus {
  return (CLIENT_STATUSES as readonly string[]).includes(status);
}

function toClientSignup(record: SignupRecord): ClientSignup {
  return {
    activityId: record.activityId,
    name: record.name,
    phone: record.phone,
    type: record.signupType,
    status: record.status as ClientSignupStatus,
    createdAt: record.createdAt,
  };
}

function visibleRows(phone: string): SignupRecord[] {
  return getRelatedList('signups').filter(
    (item) =>
      (item.accountPhone ?? item.phone) === phone && isClientStatus(item.status),
  );
}

function formatSignupTime(now = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function nextSignupId(list: SignupRecord[]): number {
  return Math.max(0, ...list.map((item) => item.id)) + 1;
}

function signupStatusFor(activityId: number, type: string): ClientSignupStatus {
  const activity = getActivity(activityId);
  if (!activity) return '已通过';
  const setting =
    activity.signupSettings.find((item) => item.type.trim() === type.trim()) ?? activity.signupSettings[0];
  return setting?.needAudit ? '待审核' : '已通过';
}

export function hasSignedUp(activityId: number, phone = DEMO_SIGNUP_USER.phone): boolean {
  return visibleRows(phone).some((item) => item.activityId === activityId);
}

function collapseVisibleRows(rows: SignupRecord[]): SignupRecord[] {
  const rank: Record<ClientSignupStatus, number> = { 待审核: 0, 已驳回: 1, 已通过: 2 };
  const byActivity = new Map<number, SignupRecord>();
  rows.forEach((item) => {
    if (!isClientStatus(item.status)) return;
    const prev = byActivity.get(item.activityId);
    if (!prev) {
      byActivity.set(item.activityId, item);
      return;
    }
    const prevRank = rank[prev.status as ClientSignupStatus] ?? 9;
    const nextRank = rank[item.status];
    if (nextRank < prevRank || (nextRank === prevRank && item.createdAt > prev.createdAt)) {
      byActivity.set(item.activityId, item);
    }
  });
  return [...byActivity.values()];
}

export function getUserSignups(phone: string = DEMO_SIGNUP_USER.phone): ClientSignup[] {
  return collapseVisibleRows(visibleRows(phone)).map(toClientSignup);
}

export function getUserSignupRecords(activityId: number, phone = DEMO_SIGNUP_USER.phone): SignupRecord[] {
  return getRelatedList('signups').filter(
    (item) =>
      item.activityId === activityId &&
      (item.accountPhone ?? item.phone) === phone &&
      isClientStatus(item.status),
  );
}

export function getUserSignupRecord(activityId: number, phone = DEMO_SIGNUP_USER.phone): SignupRecord | undefined {
  return getUserSignupRecords(activityId, phone)[0];
}

export function getUserSignupAnswers(activityId: number, phone = DEMO_SIGNUP_USER.phone): Record<string, string> {
  const rows = getUserSignupRecords(activityId, phone);
  if (!rows.length) return {};
  const merged: Record<string, string> = { ...(rows[0].answers ?? {}) };
  const sessionIds = rows.flatMap((item) => parseSessionIds(item.answers?.['场次']));
  if (sessionIds.length) merged['场次'] = stringifySessionIds([...new Set(sessionIds)]);
  return merged;
}

export function updateSignup(
  activityId: number,
  type: string,
  answers: Record<string, string> = {},
  now = Date.now(),
): 'ok' | 'missing' | 'no-type' | 'cancelled' {
  const trimmed = type.trim();
  if (!trimmed) return 'no-type';
  const rows = getUserSignupRecords(activityId);
  if (!rows.length) return 'missing';
  const activity = getActivity(activityId);
  const extras: Record<string, string> = { ...(rows[0].answers ?? {}) };
  for (const [key, value] of Object.entries(answers)) {
    if (key === '姓名' || key === '手机号' || key === '部门') continue;
    if (value.trim()) extras[key] = value.trim();
    else delete extras[key];
  }
  let nextSessionIds: string[] | undefined;
  if (activity && needsSessionPick(activity.scheduleType)) {
    const pickable = new Set(
      listClientSignupSessions(activity.sessions ?? [], now, Number.POSITIVE_INFINITY, activity.terminatedAt).map((item) => item.id),
    );
    const currentIds = rows.flatMap((item) => parseSessionIds(item.answers?.['场次']));
    const kept = currentIds.filter((id) => !pickable.has(id));
    nextSessionIds = [...new Set([...kept, ...parseSessionIds(answers['场次'])])];
    if (!nextSessionIds.length) {
      const result = cancelSignup(activityId, now);
      if (result === 'ok') return 'cancelled';
      return 'missing';
    }
    delete extras['场次'];
  }
  const profile = {
    signupType: trimmed,
    name: answers['姓名']?.trim() || rows[0].name,
    phone: answers['手机号']?.trim() || rows[0].phone,
    department: answers['部门']?.trim() || rows[0].department,
  };
  patchRelated('signups', (list) => {
    const mineIds = new Set(rows.map((item) => item.id));
    const others = list.filter((item) => !mineIds.has(item.id));
    const bySession = new Map(rows.map((item) => [parseSessionIds(item.answers?.['场次'])[0] ?? '', item]));
    let nextId = nextSignupId(list);
    const built: SignupRecord[] = [];
    const sessionIds = nextSessionIds ?? [parseSessionIds(rows[0].answers?.['场次'])[0] ?? ''];
    sessionIds.forEach((sessionId) => {
      const existing = sessionId ? bySession.get(sessionId) : rows[0];
      const rowAnswers = sessionId ? { ...extras, 场次: sessionId } : Object.keys(extras).length ? extras : undefined;
      if (existing) {
        built.push({ ...existing, ...profile, answers: rowAnswers });
        mineIds.delete(existing.id);
        return;
      }
      const reuse = rows.find((item) => mineIds.has(item.id));
      if (reuse) {
        mineIds.delete(reuse.id);
        built.push({ ...reuse, ...profile, answers: rowAnswers });
        return;
      }
      built.push({
        id: nextId,
        activityId,
        name: profile.name,
        phone: profile.phone,
        signupType: profile.signupType,
        department: profile.department,
        status: rows[0].status,
        createdAt: formatSignupTime(new Date(now)),
        accountPhone: rows[0].accountPhone ?? DEMO_SIGNUP_USER.phone,
        answers: rowAnswers,
      });
      nextId += 1;
    });
    return [...built, ...others];
  });
  return 'ok';
}

export function saveClientSignup(
  activityId: number,
  type: string,
  answers: Record<string, string> = {},
  now = Date.now(),
): 'ok' | 'duplicate' | 'no-type' | 'missing' | 'cancelled' {
  if (hasSignedUp(activityId)) return updateSignup(activityId, type, answers, now);
  return submitSignup(activityId, type, answers);
}

export function submitSignup(
  activityId: number,
  type: string,
  answers: Record<string, string> = {},
): 'ok' | 'duplicate' | 'no-type' {
  const trimmed = type.trim();
  if (!trimmed) return 'no-type';
  if (hasSignedUp(activityId)) return 'duplicate';
  const extras: Record<string, string> = {};
  for (const [key, value] of Object.entries(answers)) {
    if (key === '姓名' || key === '手机号' || key === '部门') continue;
    if (value.trim()) extras[key] = value.trim();
  }
  const sessionIds = parseSessionIds(extras['场次']);
  const baseExtras = { ...extras };
  delete baseExtras['场次'];
  const sessionKeys = sessionIds.length ? sessionIds : [''];
  patchRelated('signups', (list) => {
    let nextId = nextSignupId(list);
    const created = sessionKeys.map((sessionId) => {
      const rowAnswers = sessionId ? { ...baseExtras, 场次: sessionId } : Object.keys(baseExtras).length ? baseExtras : undefined;
      const row: SignupRecord = {
        id: nextId,
        activityId,
        name: answers['姓名']?.trim() || DEMO_SIGNUP_USER.name,
        phone: answers['手机号']?.trim() || DEMO_SIGNUP_USER.phone,
        signupType: trimmed,
        department: answers['部门']?.trim() || DEMO_SIGNUP_USER.department,
        status: signupStatusFor(activityId, trimmed),
        createdAt: formatSignupTime(),
        accountPhone: DEMO_SIGNUP_USER.phone,
        answers: rowAnswers,
      };
      nextId += 1;
      return row;
    });
    return [...created, ...list];
  });
  return 'ok';
}

export function cancelSignup(activityId: number, now = Date.now()): 'ok' | 'missing' | 'closed' {
  if (!hasSignedUp(activityId)) return 'missing';
  const activity = getActivity(activityId);
  if (!activity) return 'missing';
  if (isActivityClosed(activity)) return 'closed';
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(activity.signupEndAt);
  if (!match) return 'closed';
  const [, year, month, day, hour, minute] = match;
  const end = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
  if (now > end) return 'closed';
  patchRelated('signups', (list) =>
    list.map((item) =>
      item.activityId === activityId &&
      (item.accountPhone ?? item.phone) === DEMO_SIGNUP_USER.phone &&
      isClientStatus(item.status)
        ? { ...item, status: '已取消' }
        : item,
    ),
  );
  return 'ok';
}

export function cancelSignupToast(result: 'ok' | 'missing' | 'closed'): string {
  if (result === 'ok') return '已取消报名';
  if (result === 'closed') return '报名已截止，无法取消';
  return '取消失败';
}

export function applyActivityCheckIn(
  activityId: number,
  sessionId: string,
  token: string,
  now = Date.now(),
  phone = DEMO_SIGNUP_USER.phone,
): CheckInResult {
  const activity = getActivity(activityId);
  if (!activity) return { ok: false, reason: 'disabled' };
  const signup =
    getRelatedList('signups').find(
      (item) =>
        item.activityId === activityId &&
        (item.accountPhone ?? item.phone) === phone &&
        parseSessionIds(item.answers?.['场次']).includes(sessionId),
    ) ??
    getRelatedList('signups').find(
      (item) => item.activityId === activityId && (item.accountPhone ?? item.phone) === phone,
    );
  const result = evaluateCheckIn({ activity, sessionId, token, signup, now });
  if (!result.ok || result.already || !signup) return result;
  const at = formatSignupTime(new Date(now));
  patchRelated('signups', (list) =>
    list.map((item) =>
      item.id === signup.id ? { ...item, checkIns: { ...item.checkIns, [sessionId]: at } } : item,
    ),
  );
  return result;
}

export function loadDemoSignups() {
  patchRelated('signups', (list) => {
    const others = list.filter(
      (item) => item.phone !== DEMO_SIGNUP_USER.phone && item.accountPhone !== DEMO_SIGNUP_USER.phone,
    );
    const demo = DEMO_CLIENT_SIGNUPS.map((item) => ({
      id: DEMO_RELATED_IDS[item.activityId],
      activityId: item.activityId,
      name: item.name,
      phone: item.phone,
      signupType: item.type,
      department: '华东大区',
      status: item.status,
      createdAt: item.createdAt,
    }));
    return [...demo, ...others];
  });
}

export function resetClientSignups() {
  patchRelated('signups', (list) =>
    list.filter((item) => item.phone !== DEMO_SIGNUP_USER.phone && item.accountPhone !== DEMO_SIGNUP_USER.phone),
  );
}

function getSignupSnapshot(): SignupRecord[] {
  return getRelatedList('signups');
}

export function useHasSignedUp(activityId: number): boolean {
  const snapshot = useSyncExternalStore(subscribeRelated, getSignupSnapshot, getSignupSnapshot);
  return snapshot.some(
    (item) =>
      item.activityId === activityId &&
      (item.accountPhone ?? item.phone) === DEMO_SIGNUP_USER.phone &&
      isClientStatus(item.status),
  );
}

export function useUserSignups(phone: string = DEMO_SIGNUP_USER.phone): ClientSignup[] {
  const snapshot = useSyncExternalStore(subscribeRelated, getSignupSnapshot, getSignupSnapshot);
  return useMemo(
    () =>
      snapshot
        .filter((item) => (item.accountPhone ?? item.phone) === phone && isClientStatus(item.status))
        .map(toClientSignup),
    [snapshot, phone],
  );
}
