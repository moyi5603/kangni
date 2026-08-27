import type { AwardType } from './award';
import { orgPeopleByName, peopleOptions } from '../../activities/model/activity';

export const AWARD_NOMINATION_MOCK_VERSION = 2;

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
  highlights: string[];
  voteCount: number;
  reviewStatus: NominationReviewStatus;
  nominator: string;
  createdAt: string;
  rejectReason?: string;
};

export function validateNominees(type: AwardType, nominees: string[]): string | null {
  const names = nominees.map((item) => item.trim()).filter(Boolean);
  if (type === '个人') {
    return names.length === 1 ? null : '个人评优请选择 1 人';
  }
  return names.length ? null : '请选择提名名单';
}

export const MAX_NOMINATION_HIGHLIGHTS = 3;

export function normalizeHighlights(values: string[]): string[] {
  return values.map((item) => item.trim()).filter(Boolean);
}

export function validateHighlights(values: string[]): string | null {
  const filled = normalizeHighlights(values);
  if (!filled.length) return '至少填写 1 条核心亮点';
  if (filled.length > MAX_NOMINATION_HIGHLIGHTS) return '核心亮点最多 3 条';
  return null;
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
  return `${person.name}（${person.department}）`;
}

export function formatNomineeSummary(nominees: string[], preview = 2): string {
  const names = nominees.map((item) => item.trim()).filter(Boolean);
  if (!names.length) return '—';
  if (names.length <= preview) return names.join('、');
  return `${names.slice(0, preview).join('、')} 等${names.length}人`;
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

function csvCell(value: string | number): string {
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function buildAwardNominationExportCsv(rows: AwardNominationRecord[]): string {
  const header = ['提名标题', '提名人', '提名名单', '推荐理由', '核心亮点', '票数', '审核状态', '提名时间'];
  const lines = rows.map((item) =>
    [
      csvCell(item.title),
      csvCell(formatNominatorInfo(item.nominator)),
      csvCell(item.nominees.join('、')),
      csvCell(item.reason),
      csvCell(item.highlights.join('；')),
      csvCell(item.voteCount),
      csvCell(item.reviewStatus),
      csvCell(item.createdAt),
    ].join(','),
  );
  return [header.join(','), ...lines].join('\n');
}

export function downloadAwardNominationExport(awardName: string, rows: AwardNominationRecord[]) {
  const safeTitle = awardName.replace(/[\\/:*?"<>|]/g, '_').slice(0, 40);
  const blob = new Blob([`\uFEFF${buildAwardNominationExportCsv(rows)}\n`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeTitle}-提名.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
    highlights: extra.highlights ?? ['核心亮点示例。'],
    voteCount: extra.voteCount ?? 0,
    reviewStatus: extra.reviewStatus ?? '待审核',
    nominator: extra.nominator ?? '产品管理员',
    createdAt: extra.createdAt ?? '2026-08-10 10:00:00',
  };
}

export const initialAwardNominations: AwardNominationRecord[] = [
  seed(1, 2, '研发协同突击队', ['张悦', '李明'], {
    reason: '跨组协作稳定，按期交付评优模块。',
    highlights: ['两周内完成列表与表单联调。', '跨组协作稳定。'],
    voteCount: 16,
    reviewStatus: '已通过',
    nominator: '王芳',
    createdAt: '2026-08-08 09:20:00',
  }),
  seed(2, 2, '质量护航小组', ['陈产品'], {
    reason: '缺陷闭环快，评审意见落地及时。',
    highlights: ['上线前拦截关键回归问题。'],
    voteCount: 9,
    reviewStatus: '待审核',
    nominator: '张悦',
    createdAt: '2026-08-11 14:00:00',
  }),
  seed(3, 2, '体验优化小队', ['张悦', '陈产品'], {
    reason: '持续打磨后台交互密度。',
    highlights: ['统一操作列与筛选区。'],
    voteCount: 4,
    reviewStatus: '待审核',
    nominator: '李明',
    createdAt: '2026-08-12 11:30:00',
  }),
  seed(4, 3, '门禁攻坚项目组', ['李明', '张悦'], {
    reason: '重点项目节点可控。',
    highlights: ['按期完成联调与灰度。'],
    voteCount: 21,
    reviewStatus: '已通过',
    nominator: '陈产品',
    createdAt: '2026-07-20 10:00:00',
  }),
  seed(5, 3, '数据治理专项', ['陈产品'], {
    reason: '指标口径统一，报表可复用。',
    highlights: ['沉淀评优统计口径。'],
    voteCount: 7,
    reviewStatus: '待审核',
    nominator: '苏然',
    createdAt: '2026-07-28 16:40:00',
  }),
  seed(6, 4, '张悦年度贡献', ['张悦'], {
    reason: '个人业绩与协作口碑兼备。',
    highlights: ['独立推进评优证书能力。'],
    voteCount: 38,
    reviewStatus: '已通过',
    nominator: '陈产品',
    createdAt: '2026-01-08 09:00:00',
  }),
  seed(9, 4, '李明年度贡献', ['李明'], {
    reason: '项目交付稳定，带教新同事。',
    highlights: ['关键节点零延期。'],
    voteCount: 22,
    reviewStatus: '已通过',
    nominator: '王芳',
    createdAt: '2026-01-09 10:00:00',
  }),
  seed(10, 4, '王芳年度贡献', ['王芳'], {
    reason: '跨部门协同高效。',
    highlights: ['推动评优规则落地。'],
    voteCount: 15,
    reviewStatus: '已通过',
    nominator: '张悦',
    createdAt: '2026-01-10 11:00:00',
  }),
  seed(11, 4, '跨部门协作标杆组', peopleOptions.slice(0, 20), {
    reason: '覆盖多中心协同，名单可核验。',
    highlights: ['跨部门协作', '名单规模可核验'],
    voteCount: 40,
    reviewStatus: '已通过',
    nominator: '陈产品',
    createdAt: '2026-01-07 08:30:00',
  }),
  seed(7, 5, '创新孵化项目', ['李明', '陈产品'], {
    reason: '方案可落地，试点效果明确。',
    highlights: ['形成可复制的评选流程。'],
    voteCount: 11,
    reviewStatus: '已通过',
    nominator: '张悦',
    createdAt: '2026-01-12 13:10:00',
  }),
  seed(12, 5, '智能质检联合组', peopleOptions.slice(0, 20), {
    reason: '跨产线试点，覆盖质检与工艺。',
    highlights: ['跨产线协作', '名单规模可核验'],
    voteCount: 8,
    reviewStatus: '已通过',
    nominator: '李明',
    createdAt: '2026-01-13 09:00:00',
  }),
  seed(13, 5, '低代码工单试点', ['张悦', '李明'], {
    reason: '一线提单时效明显缩短，已在两个车间复用。',
    highlights: ['工单闭环缩短 40%', '车间可独立配置流程'],
    voteCount: 19,
    reviewStatus: '已通过',
    nominator: '王芳',
    createdAt: '2026-01-08 10:20:00',
  }),
  seed(14, 5, '供应链可视化看板', ['王芳', '苏然'], {
    reason: '缺料预警可前置到班组，采购与计划同屏协同。',
    highlights: ['缺料预警提前 2 天', '计划与采购同屏'],
    voteCount: 14,
    reviewStatus: '已通过',
    nominator: '陈产品',
    createdAt: '2026-01-09 15:40:00',
  }),
  seed(15, 5, '设备预测性维护', peopleOptions.slice(4, 9), {
    reason: '关键设备故障停机下降，维保排程可按风险排序。',
    highlights: ['停机时长下降', '维保按风险排序'],
    voteCount: 10,
    reviewStatus: '已通过',
    nominator: '张悦',
    createdAt: '2026-01-10 09:15:00',
  }),
  seed(16, 5, '能耗优化专项', ['陈产品'], {
    reason: '空压与照明分时段策略已试运行，待财务复核节能量。',
    highlights: ['分时段策略上线'],
    voteCount: 6,
    reviewStatus: '待审核',
    nominator: '苏然',
    createdAt: '2026-01-14 11:00:00',
  }),
  seed(17, 5, '客户共创工作坊', peopleOptions.slice(9, 13), {
    reason: '把现场痛点收成可立项课题，已输出 3 份方案草案。',
    highlights: ['课题可立项', '输出方案草案'],
    voteCount: 5,
    reviewStatus: '已通过',
    nominator: '李明',
    createdAt: '2026-01-11 16:30:00',
  }),
  seed(18, 5, '旧系统迁移评估', ['李明'], {
    reason: '评估范围与停机窗口争议较大，暂不进入本轮评选。',
    highlights: ['完成现状盘点'],
    voteCount: 3,
    reviewStatus: '已驳回',
    nominator: '王芳',
    createdAt: '2026-01-06 14:00:00',
  }),
  seed(19, 5, '安全合规扫描平台', ['张悦', '陈产品', '王芳'], {
    reason: '漏洞闭环可追踪，但覆盖范围仍需安全组确认。',
    highlights: ['漏洞可追踪闭环'],
    voteCount: 2,
    reviewStatus: '待审核',
    nominator: '苏然',
    createdAt: '2026-01-15 09:50:00',
  }),
  seed(8, 2, '跨中心协同大名单', peopleOptions.slice(0, 20), {
    reason: '覆盖研发、生产、营销与职能，用于核验长名单展示。',
    highlights: ['跨中心协作', '名单规模可核验'],
    voteCount: 5,
    reviewStatus: '待审核',
    nominator: '陈产品',
    createdAt: '2026-08-13 09:00:00',
  }),
];
