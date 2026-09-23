import dayjs from 'dayjs';
import { defaultOverviewDateRange, type OverviewDateValue } from '../../activities/components/OverviewDateRange';
import { categoryOf, displayRuleStatus, type CareRecord, type CareRule, type CareTemplate } from './care';

export type CareOverviewCount = { label: string; value: number };

export type CareOverviewStats = {
  ruleCount: number;
  runningRuleCount: number;
  recordCount: number;
  templateCount: number;
  categoryCounts: CareOverviewCount[];
  sourceCounts: CareOverviewCount[];
};

export type CareLatestRecordRow = {
  id: string;
  ruleName: string;
  source: string;
  name: string;
  department: string;
  pushTime: string;
  status: string;
};

function inDayRange(value: string, from: dayjs.Dayjs, to: dayjs.Dayjs) {
  const day = dayjs(value);
  return !day.isBefore(from, 'day') && !day.isAfter(to, 'day');
}

export function careRecordInDateRange(
  record: Pick<CareRecord, 'pushTime'>,
  from: dayjs.Dayjs,
  to: dayjs.Dayjs,
): boolean {
  return inDayRange(record.pushTime, from, to);
}

export function defaultCareOverviewDateRange(now = dayjs()): OverviewDateValue {
  const [, to] = defaultOverviewDateRange(now);
  const seedFrom = dayjs('2026-08-01').startOf('day');
  const from = seedFrom.isAfter(to, 'day') ? to.startOf('day') : seedFrom;
  return [from, to];
}

export function computeCareOverviewStats(
  rules: CareRule[],
  records: CareRecord[],
  templates: CareTemplate[],
): CareOverviewStats {
  const categories = ['个人关怀', '固定日期关怀', '事件关怀'] as const;
  return {
    ruleCount: rules.length,
    runningRuleCount: rules.filter((item) => displayRuleStatus(item) === '执行中').length,
    recordCount: records.length,
    templateCount: templates.length,
    categoryCounts: categories.map((label) => ({
      label,
      value: rules.filter((item) => categoryOf(item.type) === label).length,
    })),
    sourceCounts: [
      { label: '系统关怀', value: records.filter((item) => item.source === '系统关怀').length },
      { label: '用户关怀', value: records.filter((item) => item.source === '用户关怀').length },
    ],
  };
}

export function buildCareLatestRows(records: CareRecord[], limit = 8): CareLatestRecordRow[] {
  return [...records]
    .sort((left, right) => right.pushTime.localeCompare(left.pushTime))
    .slice(0, limit)
    .map((item) => ({
      id: item.id,
      ruleName: item.ruleName,
      source: item.source,
      name: item.name,
      department: item.department,
      pushTime: item.pushTime,
      status: item.status,
    }));
}

export function careCategorySegments(counts: CareOverviewCount[]) {
  const colors: Record<string, string> = {
    个人关怀: '#1677ff',
    固定日期关怀: '#722ed1',
    事件关怀: '#fa8c16',
  };
  return counts.map((item) => ({ ...item, color: colors[item.label] ?? '#8c8c8c' }));
}

export function careSourceSegments(counts: CareOverviewCount[]) {
  const colors: Record<string, string> = { 系统关怀: '#52c41a', 用户关怀: '#1677ff' };
  return counts.map((item) => ({ ...item, color: colors[item.label] ?? '#8c8c8c' }));
}
