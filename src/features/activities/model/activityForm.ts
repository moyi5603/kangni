import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

export const ACTIVITY_DATETIME_FORMAT = 'YYYY-MM-DD HH:mm';

export type DateTimeRange = [Dayjs, Dayjs];
export type DateTimeRangeValue = [Dayjs | null, Dayjs | null] | null | undefined;

export function toDateTimeRange(startAt: string, endAt: string): DateTimeRange {
  return [dayjs(startAt), dayjs(endAt)];
}

export function formatDateTimeRange(range: DateTimeRange): { startAt: string; endAt: string } {
  return {
    startAt: range[0].format(ACTIVITY_DATETIME_FORMAT),
    endAt: range[1].format(ACTIVITY_DATETIME_FORMAT),
  };
}

export async function validateDateTimeRange(
  range: DateTimeRangeValue,
  messages: { required: string; order: string },
): Promise<void> {
  if (!range?.[0] || !range[1]) {
    throw new Error(messages.required);
  }
  if (range[1].isBefore(range[0])) {
    throw new Error(messages.order);
  }
}
