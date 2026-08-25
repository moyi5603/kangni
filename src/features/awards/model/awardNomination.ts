import type { AwardType } from './award';
import { orgPeopleByName } from '../../activities/model/activity';

export const AWARD_NOMINATION_MOCK_VERSION = 1;

export const nominationReviewStatuses = ['待审核', '已通过', '已驳回'] as const;
export type NominationReviewStatus = (typeof nominationReviewStatuses)[number];

export const nominationSortFields = ['createdAt', 'voteCount'] as const;
export type NominationSortField = (typeof nominationSortFields)[number];

export type NominationSortOrder = 'ascend' | 'descend';

export type AwardNominationRecord = {
  id: number;
  awardId: number;
  title: string;
  nominees: string[];
  reason: string;
  highlights: string;
  voteCount: number;
  reviewStatus: NominationReviewStatus;
  nominator: string;
  createdAt: string;
};

export function validateNominees(type: AwardType, nominees: string[]): string | null {
  const names = nominees.map((item) => item.trim()).filter(Boolean);
  if (type === '个人') {
    return names.length === 1 ? null : '个人评优请选择 1 人';
  }
  return names.length ? null : '请选择提名名单';
}

export function canReviewNomination(record: Pick<AwardNominationRecord, 'reviewStatus'>): boolean {
  return record.reviewStatus === '待审核';
}

export function sortNominations(
  rows: AwardNominationRecord[],
  field: NominationSortField,
  order: NominationSortOrder,
): AwardNominationRecord[] {
  const sign = order === 'ascend' ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (field === 'voteCount') return (a.voteCount - b.voteCount) * sign;
    return a.createdAt.localeCompare(b.createdAt) * sign;
  });
}

export function nominationCounts(rows: Pick<AwardNominationRecord, 'reviewStatus'>[]): {
  total: number;
  pending: number;
} {
  return {
    total: rows.length,
    pending: rows.filter((item) => item.reviewStatus === '待审核').length,
  };
}

export type AwardNominationQuery = {
  title?: string;
  nominator?: string;
  nominee?: string;
  reviewStatus?: NominationReviewStatus;
};

export function formatNominatorInfo(name: string): string {
  const person = orgPeopleByName[name];
  if (!person) return name;
  return `${person.name}（${person.department} · ${person.phone}）`;
}

export function filterNominations(
  rows: AwardNominationRecord[],
  query: AwardNominationQuery,
): AwardNominationRecord[] {
  const title = query.title?.trim();
  const nominator = query.nominator?.trim();
  const nominee = query.nominee?.trim();
  return rows.filter((item) => {
    if (title && !item.title.includes(title)) return false;
    if (nominator) {
      const haystack = `${item.nominator}${formatNominatorInfo(item.nominator)}`;
      if (!haystack.includes(nominator)) return false;
    }
    if (nominee && !item.nominees.some((name) => name.includes(nominee))) return false;
    if (query.reviewStatus && item.reviewStatus !== query.reviewStatus) return false;
    return true;
  });
}

function seed(
  id: number,
  awardId: number,
  title: string,
  nominees: string[],
  extra: Partial<AwardNominationRecord> = {},
): AwardNominationRecord {
  return {
    id,
    awardId,
    title,
    nominees,
    reason: extra.reason ?? '推荐理由示例。',
    highlights: extra.highlights ?? '核心亮点示例。',
    voteCount: extra.voteCount ?? 0,
    reviewStatus: extra.reviewStatus ?? '待审核',
    nominator: extra.nominator ?? '产品管理员',
    createdAt: extra.createdAt ?? '2026-08-10 10:00:00',
  };
}

export const initialAwardNominations: AwardNominationRecord[] = [
  seed(1, 2, '研发协同突击队', ['张悦', '李明'], {
    reason: '跨组协作稳定，按期交付评优模块。',
    highlights: '两周内完成列表与表单联调。',
    voteCount: 16,
    reviewStatus: '已通过',
    nominator: '王芳',
    createdAt: '2026-08-08 09:20:00',
  }),
  seed(2, 2, '质量护航小组', ['陈产品'], {
    reason: '缺陷闭环快，评审意见落地及时。',
    highlights: '上线前拦截关键回归问题。',
    voteCount: 9,
    reviewStatus: '待审核',
    nominator: '张悦',
    createdAt: '2026-08-11 14:00:00',
  }),
  seed(3, 2, '体验优化小队', ['张悦', '陈产品'], {
    reason: '持续打磨后台交互密度。',
    highlights: '统一操作列与筛选区。',
    voteCount: 4,
    reviewStatus: '待审核',
    nominator: '李明',
    createdAt: '2026-08-12 11:30:00',
  }),
  seed(4, 3, '门禁攻坚项目组', ['李明', '张悦'], {
    reason: '重点项目节点可控。',
    highlights: '按期完成联调与灰度。',
    voteCount: 21,
    reviewStatus: '已通过',
    nominator: '陈产品',
    createdAt: '2026-07-20 10:00:00',
  }),
  seed(5, 3, '数据治理专项', ['陈产品'], {
    reason: '指标口径统一，报表可复用。',
    highlights: '沉淀评优统计口径。',
    voteCount: 7,
    reviewStatus: '待审核',
    nominator: '苏然',
    createdAt: '2026-07-28 16:40:00',
  }),
  seed(6, 4, '张悦年度贡献', ['张悦'], {
    reason: '个人业绩与协作口碑兼备。',
    highlights: '独立推进评优证书能力。',
    voteCount: 38,
    reviewStatus: '已通过',
    nominator: '陈产品',
    createdAt: '2026-01-08 09:00:00',
  }),
  seed(7, 5, '创新孵化项目', ['李明', '陈产品'], {
    reason: '方案可落地，试点效果明确。',
    highlights: '形成可复制的评选流程。',
    voteCount: 11,
    reviewStatus: '已通过',
    nominator: '张悦',
    createdAt: '2026-01-12 13:10:00',
  }),
];
