import { useMemo, useSyncExternalStore } from 'react';
import { getActivity } from '../../../activities/model/activityStore';
import {
  getRelatedList,
  patchRelated,
  subscribeRelated,
  type SignupRecord,
} from '../../../activities/model/related';

export const DEMO_SIGNUP_USER = { name: '陈产品', phone: '13800001111' } as const;

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
    status: '待审核',
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
    activityId: 12,
    name: DEMO_SIGNUP_USER.name,
    phone: DEMO_SIGNUP_USER.phone,
    type: '个人报名',
    status: '已驳回',
    createdAt: '2026-04-12 10:00:00',
  },
];

const DEMO_RELATED_IDS: Record<number, number> = { 2: 4, 6: 15, 9: 16, 1: 14, 12: 17 };

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
    (item) => item.phone === phone && isClientStatus(item.status),
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
  const setting = activity?.signupSettings.find((item) => item.type.trim() === type);
  if (!setting) return '已通过';
  return setting.needAudit ? '待审核' : '已通过';
}

export function hasSignedUp(activityId: number, phone = DEMO_SIGNUP_USER.phone): boolean {
  return visibleRows(phone).some((item) => item.activityId === activityId);
}

export function getUserSignups(phone: string = DEMO_SIGNUP_USER.phone): ClientSignup[] {
  return visibleRows(phone).map(toClientSignup);
}

export function submitSignup(activityId: number, type: string): 'ok' | 'duplicate' | 'no-type' {
  const trimmed = type.trim();
  if (!trimmed) return 'no-type';
  if (hasSignedUp(activityId)) return 'duplicate';
  patchRelated('signups', (list) => [
    {
      id: nextSignupId(list),
      activityId,
      name: DEMO_SIGNUP_USER.name,
      phone: DEMO_SIGNUP_USER.phone,
      signupType: trimmed,
      department: '职能中心',
      status: signupStatusFor(activityId, trimmed),
      createdAt: formatSignupTime(),
    },
    ...list,
  ]);
  return 'ok';
}

export function loadDemoSignups() {
  patchRelated('signups', (list) => {
    const others = list.filter((item) => item.phone !== DEMO_SIGNUP_USER.phone);
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
  patchRelated('signups', (list) => list.filter((item) => item.phone !== DEMO_SIGNUP_USER.phone));
}

function getSignupSnapshot(): SignupRecord[] {
  return getRelatedList('signups');
}

export function useHasSignedUp(activityId: number): boolean {
  const snapshot = useSyncExternalStore(subscribeRelated, getSignupSnapshot, getSignupSnapshot);
  return snapshot.some(
    (item) =>
      item.activityId === activityId &&
      item.phone === DEMO_SIGNUP_USER.phone &&
      isClientStatus(item.status),
  );
}

export function useUserSignups(phone: string = DEMO_SIGNUP_USER.phone): ClientSignup[] {
  const snapshot = useSyncExternalStore(subscribeRelated, getSignupSnapshot, getSignupSnapshot);
  return useMemo(
    () =>
      snapshot
        .filter((item) => item.phone === phone && isClientStatus(item.status))
        .map(toClientSignup),
    [snapshot, phone],
  );
}
