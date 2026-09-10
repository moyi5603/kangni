import { useEffect, useState } from 'react';
import {
  canDeleteCheckinTheme,
  initialGrants,
  initialLogs,
  initialThemes,
  submitCheckinResult,
  type CheckinTheme,
} from './checkin';

let themes = [...initialThemes];
let logs = [...initialLogs];
let grants = [...initialGrants];
const listeners = new Set<() => void>();

let countLotteryLinks: (themeId: number) => number = () => 0;

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function useStoreTick() {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((n) => n + 1)), []);
}

export function setLotteryLinkCounter(fn: (themeId: number) => number) {
  countLotteryLinks = fn;
}

export function __resetCheckinStoreForTests() {
  themes = [...initialThemes];
  logs = [...initialLogs];
  grants = [...initialGrants];
  countLotteryLinks = () => 0;
  emit();
}

export function useCheckinThemes() {
  useStoreTick();
  return themes;
}

export function useCheckinLogs(themeId: number) {
  useStoreTick();
  return logs.filter((item) => item.themeId === themeId);
}

export function useCheckinGrants(themeId: number) {
  useStoreTick();
  return grants.filter((item) => item.themeId === themeId);
}

export function getTheme(id: number) {
  return themes.find((item) => item.id === id);
}

export function nextThemeId(): number {
  return Math.max(0, ...themes.map((item) => item.id)) + 1;
}

export function saveTheme(theme: CheckinTheme): CheckinTheme {
  const current = themes.find((item) => item.id === theme.id);
  themes = current ? themes.map((item) => (item.id === theme.id ? theme : item)) : [theme, ...themes];
  emit();
  return theme;
}

export function removeTheme(id: number): { ok: true } | { ok: false; reason: string } {
  const theme = getTheme(id);
  if (!theme) return { ok: false, reason: '主题不存在' };

  const logCount = logs.filter((item) => item.themeId === id).length;
  const grantCount = grants.filter((item) => item.themeId === id).length;
  const lotteryLinkCount = countLotteryLinks(id);

  if (lotteryLinkCount > 0) {
    return { ok: false, reason: '已被抽奖关联，无法删除' };
  }
  if (!canDeleteCheckinTheme({ logCount, grantCount, lotteryLinkCount })) {
    return { ok: false, reason: '存在打卡或获奖记录，无法删除' };
  }

  themes = themes.filter((item) => item.id !== id);
  emit();
  return { ok: true };
}

export function distinctCheckinUsers(themeId: number): number {
  return new Set(logs.filter((item) => item.themeId === themeId).map((item) => item.userId)).size;
}

export function submitUserCheckin(input: {
  themeId: number;
  userId: string;
  user?: string;
  department?: string;
  account?: string;
  at: string;
}) {
  const theme = getTheme(input.themeId);
  if (!theme) return { ok: false as const, reason: '主题不存在' };

  const result = submitCheckinResult({
    theme,
    logs,
    grants,
    userId: input.userId,
    user: input.user,
    department: input.department,
    account: input.account,
    at: input.at,
    nextLogId: Math.max(0, ...logs.map((item) => item.id)) + 1,
    nextGrantId: Math.max(0, ...grants.map((item) => item.id)) + 1,
  });

  if (!result.ok) return result;

  logs = [...logs, result.log];
  grants = [...grants, ...result.grants];
  emit();
  return result;
}
