export const AWARD_MOCK_VERSION = 1;

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
    nominationCount: 18,
    pendingNominationCount: 4,
    visibility: '按部门',
    visibilityDepartments: ['研发中心'],
    nominatorMode: '指定部门',
    nominatorDepartments: ['研发中心'],
    nomineeScope: '所属部门内',
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
    nominationCount: 21,
    pendingNominationCount: 0,
  }),
];
