import {
  INCENTIVE_H5_BADGES,
  INCENTIVE_H5_MONTHS,
  INCENTIVE_H5_PEOPLE,
  INCENTIVE_H5_RECORDS,
  type IncentiveH5Badge,
  type IncentiveH5Honoree,
  type IncentiveH5Person,
  type IncentiveH5Scope,
} from './incentiveH5Data';

export type RankingPerson = {
  id: string;
  name: string;
  department: string;
  color: string;
  count: number;
  badge: string;
  latestReason: string;
  latestAt: string;
  rank: number;
};

export type BadgeRankRow = {
  badge: IncentiveH5Badge;
  totalCount: number;
  recipientCount: number;
};

const extraPeople: IncentiveH5Person[] = [
  { id: 'E007', name: '孙悦', department: '人力资源部', title: '员工关系专员', color: '#4F6FD8' },
  { id: 'E008', name: '高晨', department: '财务管理部', title: '财务分析师', color: '#A05CC5' },
  { id: 'E009', name: '许楠', department: '信息技术部', title: '系统工程师', color: '#159A8C' },
  { id: 'E010', name: '郑凯', department: '运营管理部', title: '运营专员', color: '#C06A3D' },
];

export const RANKING_PEOPLE = [...INCENTIVE_H5_PEOPLE, ...extraPeople];
export const INCENTIVE_BADGE_CATEGORIES = Array.from(new Set(INCENTIVE_H5_BADGES.map((item) => item.category)));
const peerBadges = INCENTIVE_H5_BADGES.filter((item) => item.scope === '同事认可');

function rankingWindow(period: string): number | null {
  if (period === '近一个月') return 1;
  if (period === '三个月') return 3;
  if (period === '半年') return 6;
  return null;
}

function periodMonths(period: string): number {
  return rankingWindow(period) ?? (period === '本年' ? 7 : period === '本季' ? 3 : 1);
}

export function peerRecipients(period: string, badgeName: string): RankingPerson[] {
  const n = periodMonths(period);
  const offset = Math.max(
    0,
    peerBadges.findIndex((item) => item.name === badgeName),
  );
  const order = [
    RANKING_PEOPLE[1],
    RANKING_PEOPLE[0],
    RANKING_PEOPLE[2],
    RANKING_PEOPLE[4],
    RANKING_PEOPLE[5],
    RANKING_PEOPLE[3],
    ...RANKING_PEOPLE.slice(6),
  ];
  return order
    .map((person, index) => {
      const badge = badgeName === '全部勋章' ? peerBadges[(index + offset) % peerBadges.length].name : badgeName;
      const latest = INCENTIVE_H5_RECORDS.filter(
        (item) =>
          item.type === '同事认可' && item.status === '已发放' && item.receiver === person.name && item.badge === badge,
      ).sort((a, b) => b.time.localeCompare(a.time))[0];
      return {
        id: person.id,
        name: person.name,
        department: person.department,
        color: person.color,
        count: Math.max(1, (8 - index - (badgeName === '全部勋章' ? 0 : offset % 2)) * n),
        badge,
        latestReason:
          latest?.description ??
          `在近期工作中主动践行“${badge}”，推动相关任务顺利完成并形成明确结果。`,
        latestAt: latest?.time ?? `2026-08-${String(Math.max(1, 26 - index)).padStart(2, '0')} 09:30`,
        rank: index + 1,
      };
    })
    .sort((a, b) => b.count - a.count)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

function monthHonorees(period: string, monthValue: string, badgeName: string) {
  const [year, month] = monthValue.split('-').map(Number);
  const quarter = Math.floor((month - 1) / 3);
  const window = rankingWindow(period);
  const months = window
    ? INCENTIVE_H5_MONTHS.slice(0, window)
    : period === '本年'
      ? INCENTIVE_H5_MONTHS.filter((item) => Number(item.value.slice(0, 4)) === year)
      : period === '本季'
        ? INCENTIVE_H5_MONTHS.filter((item) => {
            const [itemYear, itemMonth] = item.value.split('-').map(Number);
            return itemYear === year && Math.floor((itemMonth - 1) / 3) === quarter;
          })
        : [INCENTIVE_H5_MONTHS.find((item) => item.value === monthValue) ?? INCENTIVE_H5_MONTHS[0]];
  return months.flatMap((item) =>
    item.honorees.map((honoree, index) => ({
      ...honoree,
      id: `${item.value}-${honoree.name}-${index}`,
      month: item.label,
    })),
  ).filter((item) => badgeName === '全部勋章' || item.badge === badgeName);
}

export function companyRecipients(period: string, monthValue: string, badgeName: string): RankingPerson[] {
  const map = new Map<string, RankingPerson>();
  monthHonorees(period, monthValue, badgeName).forEach((item) => {
    const person = RANKING_PEOPLE.find((row) => row.name === item.name);
    const prev = map.get(item.name);
    map.set(item.name, {
      id: person?.id ?? item.name,
      name: item.name,
      department: item.department,
      color: person?.color ?? item.color,
      count: (prev?.count ?? 0) + 1,
      badge: item.badge,
      latestReason: prev?.latestReason ?? item.reason,
      latestAt: prev?.latestAt ?? `${item.month.replace(' 年 ', '-').replace(' 月', '')}-01 09:00`,
      rank: 0,
    });
  });
  return Array.from(map.values())
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'))
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

export function hotBadges(period: string, scope: IncentiveH5Scope): BadgeRankRow[] {
  const badges = INCENTIVE_H5_BADGES.filter((item) => item.scope === scope);
  if (scope === '公司表彰') {
    return badges
      .map((badge) => {
        const people = companyRecipients(period, INCENTIVE_H5_MONTHS[0].value, badge.name);
        return {
          badge,
          totalCount: people.reduce((sum, item) => sum + item.count, 0),
          recipientCount: people.length,
        };
      })
      .sort((a, b) => b.recipientCount - a.recipientCount || a.badge.id.localeCompare(b.badge.id));
  }
  const n = periodMonths(period);
  return badges
    .map((badge, index) => {
      const totalCount = Math.max(12, Math.round((96 - index * 4.1) * n));
      return {
        badge,
        totalCount,
        recipientCount: Math.max(6, Math.round(totalCount * (0.52 + (index % 3) * 0.04))),
      };
    })
    .sort((a, b) => b.recipientCount - a.recipientCount || a.badge.id.localeCompare(b.badge.id));
}

export function badgesByType(period: string, type: string): BadgeRankRow[] {
  if (type === '全部类型') {
    return [...hotBadges(period, '同事认可'), ...hotBadges(period, '公司表彰')].sort(
      (a, b) => b.recipientCount - a.recipientCount || a.badge.id.localeCompare(b.badge.id),
    );
  }
  return hotBadges(period, type as IncentiveH5Scope);
}

export function recipientsFor(scope: IncentiveH5Scope, period: string, monthValue: string, badgeName: string) {
  return scope === '公司表彰'
    ? companyRecipients(period, monthValue, badgeName)
    : peerRecipients(period, badgeName);
}

export function companyHonoree(
  period: string,
  monthValue: string,
  badgeName: string,
  name: string,
): (IncentiveH5Honoree & { id: string; month: string }) | undefined {
  const groups = INCENTIVE_H5_BADGES.filter((item) => item.scope === '公司表彰').map((badge) => {
    const seen = new Set<string>();
    return {
      badge,
      honorees: monthHonorees(period, monthValue, badge.name).filter((item) =>
        seen.has(item.name) ? false : (seen.add(item.name), true),
      ),
    };
  });
  return groups.find((item) => item.badge.name === badgeName)?.honorees.find((item) => item.name === name);
}

export type PersonTarget = {
  id: string;
  name: string;
  department: string;
  highlightedBadgeName?: string;
  highlightedReason?: string;
  highlightedAt?: string;
};

export type HonorRecord = {
  id: string;
  badge: IncentiveH5Badge;
  reason: string;
  source: string;
  time: string;
  displayTime: string;
  points: number;
  type: IncentiveH5Scope;
};

export function personHonorRecords(target: PersonTarget): HonorRecord[] {
  const fromFeed = INCENTIVE_H5_RECORDS.filter((item) => item.status === '已发放' && item.receiver === target.name)
    .flatMap((item) => {
      const badge = INCENTIVE_H5_BADGES.find((row) => row.name === item.badge);
      if (!badge) return [];
      return [
        {
          id: item.id,
          badge,
          reason: item.description,
          source: item.type === '公司表彰' ? '【公司表彰】' : `${item.giver}认可`,
          time: item.time,
          displayTime: item.time,
          points: item.points,
          type: item.type,
        },
      ];
    });
  const seen = new Set(fromFeed.map((item) => `${item.badge.name}-${item.time.slice(0, 7)}`));
  const fromMonths = INCENTIVE_H5_MONTHS.flatMap((month) =>
    month.honorees.flatMap((honoree, index) => {
      if (honoree.name !== target.name || seen.has(`${honoree.badge}-${month.value}`)) return [];
      const badge = INCENTIVE_H5_BADGES.find((row) => row.name === honoree.badge);
      if (!badge) return [];
      return [
        {
          id: `${month.value}-${honoree.name}-${index}`,
          badge,
          reason: honoree.reason,
          source: '【公司表彰】',
          time: `${month.value}-01 09:00`,
          displayTime: month.label,
          points: honoree.points,
          type: '公司表彰' as const,
        },
      ];
    }),
  );
  const records = [...fromFeed, ...fromMonths];
  if (target.highlightedBadgeName && !records.some((item) => item.badge.name === target.highlightedBadgeName)) {
    const badge = INCENTIVE_H5_BADGES.find((item) => item.name === target.highlightedBadgeName);
    if (badge) {
      records.push({
        id: `ranking-${target.id}-${badge.id}`,
        badge,
        reason: target.highlightedReason ?? badge.description,
        source: '同事认可',
        time: target.highlightedAt ?? '2026-08-01 09:00',
        displayTime: target.highlightedAt ?? '2026-08-01 09:00',
        points: badge.points,
        type: '同事认可',
      });
    }
  }
  return records.sort((a, b) => b.time.localeCompare(a.time));
}

export type CompanyStory = IncentiveH5Honoree & { id: string; month: string };

export function companyStoryById(id: string): CompanyStory | undefined {
  return INCENTIVE_H5_MONTHS.flatMap((item) =>
    item.honorees.map((honoree, index) => ({
      ...honoree,
      id: `${item.value}-${honoree.name}-${index}`,
      month: item.label,
    })),
  ).find((item) => item.id === id);
}

export function personTargetById(id: string): PersonTarget | undefined {
  const person = RANKING_PEOPLE.find((item) => item.id === id);
  if (!person) return;
  return { id: person.id, name: person.name, department: person.department };
}
