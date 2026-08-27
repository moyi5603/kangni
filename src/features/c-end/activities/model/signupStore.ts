import { useMemo, useSyncExternalStore } from 'react';
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
  department: '职能中心',
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

export function getUserSignups(phone: string = DEMO_SIGNUP_USER.phone): ClientSignup[] {
  return visibleRows(phone).map(toClientSignup);
}

export function getUserSignupRecord(activityId: number, phone = DEMO_SIGNUP_USER.phone): SignupRecord | undefined {
  return getRelatedList('signups').find(
    (item) =>
      item.activityId === activityId &&
      (item.accountPhone ?? item.phone) === phone &&
      isClientStatus(item.status),
  );
}

export function getUserSignupAnswers(activityId: number, phone = DEMO_SIGNUP_USER.phone): Record<string, string> {
  return { ...(getUserSignupRecord(activityId, phone)?.answers ?? {}) };
}

export function updateSignup(
  activityId: number,
  type: string,
  answers: Record<string, string> = {},
  now = Date.now(),
): 'ok' | 'missing' | 'no-type' | 'cancelled' {
  const trimmed = type.trim();
  if (!trimmed) return 'no-type';
  const current = getUserSignupRecord(activityId);
  if (!current) return 'missing';
  const activity = getActivity(activityId);
  const extras: Record<string, string> = { ...(current.answers ?? {}) };
  for (const [key, value] of Object.entries(answers)) {
    if (key === '姓名' || key === '手机号' || key === '部门') continue;
    if (value.trim()) extras[key] = value.trim();
    else delete extras[key];
  }
  if (activity && needsSessionPick(activity.scheduleType)) {
    const pickable = new Set(listClientSignupSessions(activity.sessions ?? [], now).map((item) => item.id));
    const kept = parseSessionIds(current.answers?.['场次']).filter((id) => !pickable.has(id));
    const next = stringifySessionIds([...kept, ...parseSessionIds(answers['场次'])]);
    if (!next) return cancelSignup(activityId, now) === 'ok' ? 'cancelled' : 'missing';
    extras['场次'] = next;
  }
  patchRelated('signups', (list) =>
    list.map((item) =>
      item.id === current.id
        ? {
            ...item,
            signupType: trimmed,
            name: answers['姓名']?.trim() || item.name,
            phone: answers['手机号']?.trim() || item.phone,
            department: answers['部门']?.trim() || item.department,
            answers: Object.keys(extras).length ? extras : undefined,
          }
        : item,
    ),
  );
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
  patchRelated('signups', (list) => [
    {
      id: nextSignupId(list),
      activityId,
      name: answers['姓名']?.trim() || DEMO_SIGNUP_USER.name,
      phone: answers['手机号']?.trim() || DEMO_SIGNUP_USER.phone,
      signupType: trimmed,
      department: answers['部门']?.trim() || DEMO_SIGNUP_USER.department,
      status: signupStatusFor(activityId, trimmed),
      createdAt: formatSignupTime(),
      accountPhone: DEMO_SIGNUP_USER.phone,
      answers: Object.keys(extras).length ? extras : undefined,
    },
    ...list,
  ]);
  return 'ok';
}

export function cancelSignup(activityId: number, now = Date.now()): 'ok' | 'missing' | 'closed' {
  if (!hasSignedUp(activityId)) return 'missing';
  const activity = getActivity(activityId);
  if (!activity) return 'missing';
  if (activity.activityStatus === '已结束') return 'closed';
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

export function applyActivityCheckIn(
  activityId: number,
  sessionId: string,
  token: string,
  now = Date.now(),
  phone = DEMO_SIGNUP_USER.phone,
): CheckInResult {
  const activity = getActivity(activityId);
  if (!activity) return { ok: false, reason: 'disabled' };
  const signup = getRelatedList('signups').find(
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
      department: '职能中心',
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
