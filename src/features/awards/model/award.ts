export const AWARD_MOCK_VERSION = 4;

export const awardTypes = ['个人', '团队', '项目'] as const;
export type AwardType = (typeof awardTypes)[number];

export const awardStatuses = ['征集中', '投票中', '已结束'] as const;
export type AwardStatus = (typeof awardStatuses)[number];

export const awardPublishStatuses = ['未发布', '已发布'] as const;
export type AwardPublishStatus = (typeof awardPublishStatuses)[number];

export const resultPublicityLabels = ['未公示', '已公示'] as const;
export type ResultPublicityLabel = (typeof resultPublicityLabels)[number];

export const visibilityModes = ['全员', '按部门', '自定义人员', '导入人群'] as const;
export type VisibilityMode = (typeof visibilityModes)[number];

export const nominatorModes = ['全员', '指定部门', '指定人员', '导入人群'] as const;
export type NominatorMode = (typeof nominatorModes)[number];

export const nomineeScopes = ['全员', '所属部门内', '指定部门范围', '导入人群'] as const;
export type NomineeScope = (typeof nomineeScopes)[number];

export const voteSortRules = ['按时间', '按票数'] as const;
export type VoteSortRule = (typeof voteSortRules)[number];

export function nominationSortFieldOf(rule: VoteSortRule): 'createdAt' | 'voteCount' {
  return rule === '按时间' ? 'createdAt' : 'voteCount';
}

export type AwardResultRow = {
  rank: number;
  rankTitle: string;
  nominationId: number;
  nominationTitle: string;
  nominees: string[];
  voteCount: number;
  nominator: string;
};

export type AwardRankPrize = {
  rank: number;
  title: string;
  enablePoints: boolean;
  enableMedal: boolean;
  enableCertificate: boolean;
  points?: number;
  medalId?: string;
  certificateId?: number;
};

export type AwardRewardGrant = {
  name: string;
  rank: number;
  rankTitle: string;
  nominationTitle: string;
  points: number;
  medalId?: string;
  certificateId?: number;
};

export type AwardRecord = {
  id: number;
  name: string;
  type: AwardType;
  nominateEndAt: string;
  voteEndAt: string;
  intro: string;
  criteria: string[];
  winnerCount: number;
  ranks: AwardRankPrize[];
  visibility: VisibilityMode;
  visibilityDepartments: string[];
  visibilityPeople: string[];
  visibilityImportFileName: string;
  nominatorMode: NominatorMode;
  nominatorDepartments: string[];
  nominatorPeople: string[];
  nominatorImportFileName: string;
  nomineeScope: NomineeScope;
  nomineeDepartments: string[];
  nomineeImportFileName: string;
  publishStatus: AwardPublishStatus;
  autoPublishOnEnd: boolean;
  commentsEnabled: boolean;
  commentsNeedAudit: boolean;
  voteSortRule: VoteSortRule;
  coverUrl: string;
  pinned: boolean;
  results: AwardResultRow[];
  rewardsGranted: boolean;
  rewardGrants: AwardRewardGrant[];
  resultPublic: boolean;
  publicityLocked: boolean;
  nominationCount: number;
  pendingNominationCount: number;
  creator: string;
  createdAt: string;
  updatedAt: string;
};

export function parseAwardTime(value: string): number {
  return new Date(value.replace(/-/g, '/')).getTime();
}

export function validateAwardTimeOrder(nominateEndAt: string, voteEndAt: string): boolean {
  return parseAwardTime(nominateEndAt) < parseAwardTime(voteEndAt);
}

export function resolveAwardStatus(record: Pick<AwardRecord, 'nominateEndAt' | 'voteEndAt'>, now: string): AwardStatus {
  const t = parseAwardTime(now);
  const nominate = parseAwardTime(record.nominateEndAt);
  const vote = parseAwardTime(record.voteEndAt);
  if (t <= nominate) return '征集中';
  if (t <= vote) return '投票中';
  return '已结束';
}

export function isResultPublic(record: Pick<AwardRecord, 'autoPublishOnEnd' | 'resultPublic' | 'publicityLocked'>, status: AwardStatus): boolean {
  if (status !== '已结束') return false;
  if (record.publicityLocked) return record.resultPublic;
  return record.autoPublishOnEnd || record.resultPublic;
}

export function resolveResultPublicityLabel(
  record: Pick<AwardRecord, 'nominateEndAt' | 'voteEndAt' | 'autoPublishOnEnd' | 'resultPublic' | 'publicityLocked'>,
  now: string,
): '-' | ResultPublicityLabel {
  const status = resolveAwardStatus(record, now);
  if (status !== '已结束') return '-';
  return isResultPublic(record, status) ? '已公示' : '未公示';
}

export function canDeleteAward(
  record: Pick<AwardRecord, 'nominateEndAt' | 'voteEndAt' | 'publishStatus'>,
  now: string,
): boolean {
  return resolveAwardStatus(record, now) === '征集中' && record.publishStatus === '未发布';
}

export function canPublishAward(record: Pick<AwardRecord, 'publishStatus'>): boolean {
  return record.publishStatus === '未发布';
}

export function canUnpublishAward(record: Pick<AwardRecord, 'publishStatus'>): boolean {
  return record.publishStatus === '已发布';
}

export function canToggleResultPublic(record: Pick<AwardRecord, 'nominateEndAt' | 'voteEndAt'>, now: string): boolean {
  return resolveAwardStatus(record, now) === '已结束';
}

export function canEnterAwardResult(
  record: Pick<
    AwardRecord,
    'nominateEndAt' | 'voteEndAt' | 'autoPublishOnEnd' | 'resultPublic' | 'publicityLocked' | 'rewardsGranted'
  >,
  now: string,
): boolean {
  return (
    !record.rewardsGranted &&
    resolveAwardStatus(record, now) === '已结束' &&
    resolveResultPublicityLabel(record, now) === '未公示'
  );
}

export function canGrantAwardRewards(record: Pick<AwardRecord, 'nominateEndAt' | 'voteEndAt' | 'rewardsGranted'>, now: string): boolean {
  return resolveAwardStatus(record, now) === '已结束' && !record.rewardsGranted;
}

export function grantAwardRewardsBlockReason(
  record: Pick<AwardRecord, 'nominateEndAt' | 'voteEndAt' | 'rewardsGranted'>,
  now: string,
  resultRows: AwardResultRow[],
): string | null {
  if (record.rewardsGranted) return '奖励已发放，结果不可修改';
  if (resolveAwardStatus(record, now) !== '已结束') return '结束后才可发放奖励';
  if (!resultRows.length) return '请先录入评优结果';
  return null;
}

export function buildAwardRewardGrants(award: Pick<AwardRecord, 'ranks'>, results: AwardResultRow[]): AwardRewardGrant[] {
  return results.flatMap((row) => {
    const prize = award.ranks.find((item) => item.rank === row.rank);
    return row.nominees.map((name) => ({
      name,
      rank: row.rank,
      rankTitle: row.rankTitle,
      nominationTitle: row.nominationTitle,
      points: prize?.enablePoints ? prize.points ?? 0 : 0,
      medalId: prize?.enableMedal ? prize.medalId : undefined,
      certificateId: prize?.enableCertificate ? prize.certificateId : undefined,
    }));
  });
}

export function hasEnteredAwardResults(record: Pick<AwardRecord, 'results'>): boolean {
  return record.results.length > 0;
}

export function resultPublicityBlockReason(
  record: Pick<AwardRecord, 'nominateEndAt' | 'voteEndAt' | 'results'>,
  now: string,
  nextPublic: boolean,
): string | null {
  if (!canToggleResultPublic(record, now)) return '结束后才可公示结果';
  if (nextPublic && !hasEnteredAwardResults(record)) return '请先录入评优结果';
  return null;
}

export function sortAwardsByPin<T extends { pinned: boolean }>(rows: T[]): T[] {
  return [...rows].sort((left, right) => Number(right.pinned) - Number(left.pinned));
}

type NominationForResult = {
  id: number;
  title: string;
  nominees: string[];
  voteCount: number;
  reviewStatus: string;
  nominator: string;
};

export function buildAutoAwardResults(
  award: Pick<AwardRecord, 'ranks' | 'winnerCount'>,
  nominations: NominationForResult[],
): AwardResultRow[] {
  const passed = nominations
    .filter((item) => item.reviewStatus === '已通过')
    .sort((left, right) => right.voteCount - left.voteCount || left.id - right.id);
  return award.ranks.slice(0, award.winnerCount).flatMap((rank, index) => {
    const nomination = passed[index];
    if (!nomination) return [];
    return [
      {
        rank: rank.rank,
        rankTitle: rank.title,
        nominationId: nomination.id,
        nominationTitle: nomination.title,
        nominees: nomination.nominees,
        voteCount: nomination.voteCount,
        nominator: nomination.nominator,
      },
    ];
  });
}

export function resolveAwardResults(
  award: Pick<
    AwardRecord,
    'ranks' | 'winnerCount' | 'results' | 'autoPublishOnEnd' | 'resultPublic' | 'publicityLocked' | 'nominateEndAt' | 'voteEndAt'
  >,
  nominations: NominationForResult[],
  now: string,
): AwardResultRow[] {
  if (award.results.length) return award.results;
  const status = resolveAwardStatus(award, now);
  if (status === '已结束' && isResultPublic(award, status)) {
    return buildAutoAwardResults(award, nominations);
  }
  return [];
}

function seed(
  id: number,
  name: string,
  type: AwardType,
  nominateEndAt: string,
  voteEndAt: string,
  extra: Partial<AwardRecord>,
): AwardRecord {
  return {
    id,
    name,
    type,
    nominateEndAt,
    voteEndAt,
    intro: extra.intro ?? `${name}活动简介。`,
    criteria: extra.criteria ?? ['业绩贡献', '协作口碑'],
    winnerCount: extra.winnerCount ?? 3,
    ranks: extra.ranks ?? [
      { rank: 1, title: '一等奖', enablePoints: true, enableMedal: true, enableCertificate: true, points: 500, medalId: 'star', certificateId: 1 },
      { rank: 2, title: '二等奖', enablePoints: true, enableMedal: true, enableCertificate: false, points: 300, medalId: 'collab' },
      { rank: 3, title: '三等奖', enablePoints: true, enableMedal: false, enableCertificate: false, points: 100 },
    ],
    visibility: extra.visibility ?? '全员',
    visibilityDepartments: extra.visibilityDepartments ?? [],
    visibilityPeople: extra.visibilityPeople ?? [],
    visibilityImportFileName: extra.visibilityImportFileName ?? '',
    nominatorMode: extra.nominatorMode ?? '全员',
    nominatorDepartments: extra.nominatorDepartments ?? [],
    nominatorPeople: extra.nominatorPeople ?? [],
    nominatorImportFileName: extra.nominatorImportFileName ?? '',
    nomineeScope: extra.nomineeScope ?? '全员',
    nomineeDepartments: extra.nomineeDepartments ?? [],
    nomineeImportFileName: extra.nomineeImportFileName ?? '',
    publishStatus: extra.publishStatus ?? '未发布',
    autoPublishOnEnd: extra.autoPublishOnEnd ?? false,
    commentsEnabled: extra.commentsEnabled ?? true,
    commentsNeedAudit: extra.commentsNeedAudit ?? false,
    voteSortRule: extra.voteSortRule ?? '按票数',
    coverUrl: extra.coverUrl ?? '/activities/share.jpg',
    pinned: extra.pinned ?? false,
    results: extra.results ?? [],
    rewardsGranted: extra.rewardsGranted ?? false,
    rewardGrants: extra.rewardGrants ?? [],
    resultPublic: extra.resultPublic ?? false,
    publicityLocked: extra.publicityLocked ?? false,
    nominationCount: extra.nominationCount ?? 0,
    pendingNominationCount: extra.pendingNominationCount ?? 0,
    creator: extra.creator ?? '产品管理员',
    createdAt: extra.createdAt ?? '2026-07-01 10:00:00',
    updatedAt: extra.updatedAt ?? '2026-07-01 10:00:00',
  };
}

export const initialAwards: AwardRecord[] = [
  seed(1, '2026 年度优秀员工', '个人', '2026-09-15 23:59:59', '2026-09-30 23:59:59', {
    publishStatus: '未发布',
    nominationCount: 0,
    pendingNominationCount: 0,
  }),
  seed(2, 'Q3 团队协同奖', '团队', '2026-09-10 23:59:59', '2026-09-25 23:59:59', {
    publishStatus: '已发布',
    pinned: true,
    coverUrl: '/activities/webinar.jpg',
    nominationCount: 18,
    pendingNominationCount: 4,
    visibility: '按部门',
    visibilityDepartments: ['研发中心'],
    nominatorMode: '指定部门',
    nominatorDepartments: ['研发中心'],
    nomineeScope: '所属部门内',
    commentsNeedAudit: true,
  }),
  seed(3, '重点项目攻坚评优', '项目', '2026-08-01 23:59:59', '2026-09-20 23:59:59', {
    publishStatus: '已发布',
    nominationCount: 42,
    pendingNominationCount: 7,
    nomineeScope: '指定部门范围',
    nomineeDepartments: ['研发中心', '生产中心'],
  }),
  seed(4, '2025 年度优秀员工', '个人', '2026-01-20 23:59:59', '2026-02-10 23:59:59', {
    publishStatus: '已发布',
    autoPublishOnEnd: true,
    nominationCount: 86,
    pendingNominationCount: 0,
  }),
  seed(5, '上半年创新项目奖', '项目', '2026-01-31 23:59:59', '2026-02-15 23:59:59', {
    publishStatus: '已发布',
    autoPublishOnEnd: false,
    resultPublic: false,
    publicityLocked: true,
    nominationCount: 9,
    pendingNominationCount: 2,
  }),
];
