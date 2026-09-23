import { useEffect, useState } from 'react';
import type { LotteryChanceLedger } from './lotteryChance';
import { grantDailyLoginChance, grantInitialChance, remainingLotteryChance } from './lotteryChance';
import {
  initialLotteryDraws,
  initialLotteryWins,
  initialLotteries,
  lotteryStatusOf,
  rollLotteryPrize,
  type LotteryDraw,
  type LotteryRecord,
  type LotteryWin,
} from './lottery';

let lotteries = [...initialLotteries];
let wins = [...initialLotteryWins];
let draws = [...initialLotteryDraws];
let chanceLedger: LotteryChanceLedger[] = [];
const listeners = new Set<() => void>();

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

export function __resetLotteryStoreForTests() {
  lotteries = [...initialLotteries];
  wins = [...initialLotteryWins];
  draws = [...initialLotteryDraws];
  chanceLedger = [];
  emit();
}

export function getLotteryChanceLedger() {
  return chanceLedger;
}

export function setLotteryChanceLedger(next: LotteryChanceLedger[]) {
  chanceLedger = next;
  emit();
}

export function getLotteries() {
  return lotteries;
}

export function useLotteries() {
  useStoreTick();
  return lotteries;
}

export function getLottery(id: number) {
  return lotteries.find((item) => item.id === id);
}

export function nextLotteryId(): number {
  return Math.max(0, ...lotteries.map((item) => item.id)) + 1;
}

export function saveLottery(record: LotteryRecord): LotteryRecord {
  const current = lotteries.find((item) => item.id === record.id);
  lotteries = current ? lotteries.map((item) => (item.id === record.id ? record : item)) : [record, ...lotteries];
  emit();
  return record;
}

export function setLotteryEnabled(id: number, enabled: boolean): boolean {
  const current = lotteries.find((item) => item.id === id);
  if (!current) return false;
  lotteries = lotteries.map((item) => (item.id === id ? { ...item, enabled } : item));
  emit();
  return true;
}

export function removeLottery(id: number): boolean {
  const exists = lotteries.some((item) => item.id === id);
  if (!exists) return false;
  lotteries = lotteries.filter((item) => item.id !== id);
  wins = wins.filter((item) => item.lotteryId !== id);
  draws = draws.filter((item) => item.lotteryId !== id);
  emit();
  return true;
}

export function getLotteryWins(lotteryId: number) {
  return wins.filter((item) => item.lotteryId === lotteryId);
}

export function useLotteryWins(lotteryId: number) {
  useStoreTick();
  return getLotteryWins(lotteryId);
}

export function getLotteryDraws(lotteryId: number) {
  return draws.filter((item) => item.lotteryId === lotteryId);
}

export function useLotteryDraws(lotteryId: number) {
  useStoreTick();
  return getLotteryDraws(lotteryId);
}

const H5_LOTTERY_USER = { userId: '13800001111', user: '王磊', department: '生产中心 · 一车间' };

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function shanghaiStamp(ms = Date.now()) {
  const shifted = new Date(ms + 8 * 60 * 60 * 1000);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())} ${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`;
}

function shanghaiDay(ms = Date.now()) {
  return shanghaiStamp(ms).slice(0, 10);
}

export function ensureLotteryChances(lottery: LotteryRecord, now = Date.now()) {
  const at = shanghaiStamp(now);
  const day = shanghaiDay(now);
  let ledger = getLotteryChanceLedger();
  ledger = grantInitialChance({ lottery, userId: H5_LOTTERY_USER.userId, ledger, at }).ledger;
  ledger = grantDailyLoginChance({ lottery, userId: H5_LOTTERY_USER.userId, day, ledger }).ledger;
  setLotteryChanceLedger(ledger);
  return ledger;
}

export function previewLotteryChance(lottery: LotteryRecord, now = Date.now()) {
  const at = shanghaiStamp(now);
  const day = shanghaiDay(now);
  let ledger = getLotteryChanceLedger();
  ledger = grantInitialChance({ lottery, userId: H5_LOTTERY_USER.userId, ledger, at }).ledger;
  ledger = grantDailyLoginChance({ lottery, userId: H5_LOTTERY_USER.userId, day, ledger }).ledger;
  return remainingLotteryChance({
    lottery,
    userId: H5_LOTTERY_USER.userId,
    userName: H5_LOTTERY_USER.user,
    ledger,
    draws: getLotteryDraws(lottery.id),
    day,
  });
}

export function playLottery(
  lotteryId: number,
  rng: () => number = Math.random,
  now = Date.now(),
): { ok: true; result: '中奖' | '未中奖'; prizeName: string } | { ok: false; reason: string } {
  const lottery = getLottery(lotteryId);
  if (!lottery) return { ok: false, reason: '抽奖不存在' };
  if (lotteryStatusOf(lottery, now) !== '进行中') return { ok: false, reason: '当前不可抽奖' };
  const ledger = ensureLotteryChances(lottery, now);
  const day = shanghaiDay(now);
  const left = remainingLotteryChance({
    lottery,
    userId: H5_LOTTERY_USER.userId,
    userName: H5_LOTTERY_USER.user,
    ledger,
    draws: getLotteryDraws(lottery.id),
    day,
  });
  if (left < 1) return { ok: false, reason: '次数已用完' };
  const winsOfUser = getLotteryWins(lottery.id).filter((item) => item.user === H5_LOTTERY_USER.user).length;
  const prize = winsOfUser >= lottery.maxWins ? undefined : rollLotteryPrize(lottery.prizes, rng);
  const at = shanghaiStamp(now);
  const result: '中奖' | '未中奖' = prize ? '中奖' : '未中奖';
  const prizeName = prize?.name ?? '';
  if (prize) {
    lotteries = lotteries.map((item) =>
      item.id === lottery.id
        ? {
            ...item,
            participants: item.participants + 1,
            prizes: item.prizes.map((row) => (row.id === prize.id ? { ...row, drawn: row.drawn + 1 } : row)),
          }
        : item,
    );
    wins = [
      {
        id: Math.max(0, ...wins.map((item) => item.id)) + 1,
        lotteryId: lottery.id,
        user: H5_LOTTERY_USER.user,
        department: H5_LOTTERY_USER.department,
        prizeName,
        at,
      },
      ...wins,
    ];
  } else {
    lotteries = lotteries.map((item) => (item.id === lottery.id ? { ...item, participants: item.participants + 1 } : item));
  }
  draws = [
    {
      id: Math.max(0, ...draws.map((item) => item.id)) + 1,
      lotteryId: lottery.id,
      user: H5_LOTTERY_USER.user,
      result,
      prizeName,
      usedToday: getLotteryDraws(lottery.id).filter((item) => item.user === H5_LOTTERY_USER.user && item.at.slice(0, 10) === day).length + 1,
      at,
    },
    ...draws,
  ];
  emit();
  return { ok: true, result, prizeName: prizeName || lottery.missText };
}
