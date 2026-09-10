import { lotteryStatusOf, type LotteryRecord } from './lottery';

export type LotteryChanceSource = 'initial' | 'daily-login' | 'checkin';

export type LotteryChanceLedger = {
  id: number;
  lotteryId: number;
  userId: string;
  source: LotteryChanceSource;
  amount: number;
  at: string;
};

function nextLedgerId(ledger: LotteryChanceLedger[]): number {
  return Math.max(0, ...ledger.map((item) => item.id)) + 1;
}

function calendarDay(value: string): string {
  return value.slice(0, 10);
}

function loginAt(day: string): string {
  return day.includes(' ') ? day : `${day} 00:00`;
}

export function creditCheckinChance(input: {
  themeId: number;
  userId: string;
  amount: number;
  at: string;
  lotteries: LotteryRecord[];
  ledger: LotteryChanceLedger[];
  now: number;
}): { creditedLotteryIds: number[]; ledger: LotteryChanceLedger[] } {
  let ledger = [...input.ledger];
  const creditedLotteryIds: number[] = [];
  for (const item of input.lotteries) {
    if (!item.gainCheckinEnabled) continue;
    if (!item.gainCheckinThemeIds.includes(input.themeId)) continue;
    if (lotteryStatusOf(item, input.now) !== '进行中') continue;
    ledger = [
      ...ledger,
      {
        id: nextLedgerId(ledger),
        lotteryId: item.id,
        userId: input.userId,
        source: 'checkin',
        amount: input.amount,
        at: input.at,
      },
    ];
    creditedLotteryIds.push(item.id);
  }
  return { creditedLotteryIds, ledger };
}

export function grantDailyLoginChance(input: {
  lottery: LotteryRecord;
  userId: string;
  day: string;
  ledger: LotteryChanceLedger[];
  amount?: number;
}): { ledger: LotteryChanceLedger[] } {
  if (!input.lottery.gainDailyLoginEnabled) return { ledger: input.ledger };
  const day = calendarDay(input.day);
  const already = input.ledger.some(
    (item) =>
      item.source === 'daily-login' &&
      item.lotteryId === input.lottery.id &&
      item.userId === input.userId &&
      calendarDay(item.at) === day,
  );
  if (already) return { ledger: input.ledger };
  return {
    ledger: [
      ...input.ledger,
      {
        id: nextLedgerId(input.ledger),
        lotteryId: input.lottery.id,
        userId: input.userId,
        source: 'daily-login',
        amount: input.amount ?? input.lottery.gainDailyLoginCount,
        at: loginAt(input.day),
      },
    ],
  };
}
