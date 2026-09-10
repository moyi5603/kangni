import { useEffect, useState } from 'react';
import {
  initialLotteryDraws,
  initialLotteryWins,
  initialLotteries,
  type LotteryDraw,
  type LotteryRecord,
  type LotteryWin,
} from './lottery';

let lotteries = [...initialLotteries];
let wins = [...initialLotteryWins];
let draws = [...initialLotteryDraws];
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
