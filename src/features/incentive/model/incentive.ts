import * as XLSX from 'xlsx';

export type BadgeScope = {
  id: string;
  name: string;
  sort: number;
};

export type BadgeCategory = {
  id: string;
  scopeId: string;
  name: string;
  sort: number;
};

export type BadgeOrgNode = {
  title: string;
  value: string;
  children?: BadgeOrgNode[];
};

export const BADGE_ORG_TREE: BadgeOrgNode[] = [
  {
    title: '康尼集团',
    value: '康尼集团',
    children: [
      {
        title: '轨道交通事业部',
        value: '轨道交通事业部',
        children: [
          { title: '技术部', value: '轨道交通事业部-技术部' },
          { title: '项目部', value: '轨道交通事业部-项目部' },
        ],
      },
      {
        title: '汽车事业部',
        value: '汽车事业部',
        children: [
          { title: '研发部', value: '汽车事业部-研发部' },
          { title: '销售部', value: '汽车事业部-销售部' },
        ],
      },
      {
        title: '生产中心',
        value: '生产中心',
        children: [
          { title: '一车间', value: '生产中心-一车间' },
          { title: '质检部', value: '生产中心-质检部' },
        ],
      },
      {
        title: '供应链管理部',
        value: '供应链管理部',
        children: [{ title: '采购部', value: '供应链管理部-采购部' }],
      },
      {
        title: '人力资源部',
        value: '人力资源部',
        children: [{ title: '组织发展部', value: '人力资源部-组织发展部' }],
      },
    ],
  },
];

export const DEFAULT_BADGE_ORG_IDS = ['康尼集团'];

export function findBadgeOrgNode(value: string, nodes: BadgeOrgNode[] = BADGE_ORG_TREE): BadgeOrgNode | undefined {
  for (const node of nodes) {
    if (node.value === value) return node;
    const nested = node.children ? findBadgeOrgNode(value, node.children) : undefined;
    if (nested) return nested;
  }
  return undefined;
}

export type QuotaTargetNode = BadgeOrgNode & {
  kind?: 'org' | 'person';
  department?: string;
  children?: QuotaTargetNode[];
};

function peopleByOrgTitle() {
  const map = new Map<string, QuotaTargetNode[]>();
  for (const org of INCENTIVE_PEOPLE_TREE) {
    map.set(
      org.title,
      org.children.map((person) => ({
        title: person.title,
        value: person.value,
        kind: 'person' as const,
        department: org.title,
      })),
    );
  }
  return map;
}

function withQuotaPeople(nodes: BadgeOrgNode[], peopleMap: Map<string, QuotaTargetNode[]>): QuotaTargetNode[] {
  return nodes.map((node) => {
    const children = [
      ...(node.children ? withQuotaPeople(node.children, peopleMap) : []),
      ...(peopleMap.get(node.value) ?? []),
    ];
    return {
      ...node,
      kind: 'org' as const,
      children: children.length ? children : undefined,
    };
  });
}

export type Badge = {
  id: string;
  scopeId: string;
  categoryId: string;
  name: string;
  points: number;
  iconUrl: string;
  orgIds: string[];
  enabled: boolean;
  definition: string;
  criteria: string[];
  examples: string[];
  exclusions: string[];
  riskLabel: '直接发放' | '低风险';
};

export type RecognitionStatus = '已发放' | '待审核' | '已驳回' | '已撤回';
export type RecognitionType = '同事认可' | '公司表彰';

export function recognitionReasonLabel(type: RecognitionType) {
  return type === '公司表彰' ? '表彰理由' : '认可理由';
}

export const SYSTEM_GIVER = '系统';

export type IncentiveOverviewStats = {
  pendingCount: number;
  issuedCount: number;
  totalPoints: number;
  riskCount: number;
  enabledBadgeCount: number;
  statusCounts: Record<RecognitionStatus, number>;
  badgeCounts: Record<string, number>;
};

export function computeIncentiveOverviewStats(input: {
  recognitions: Recognition[];
  badges: Badge[];
  rules: IncentiveSettings['rules'];
}): IncentiveOverviewStats {
  const statusCounts: Record<RecognitionStatus, number> = {
    已发放: 0,
    待审核: 0,
    已驳回: 0,
    已撤回: 0,
  };
  const badgeCounts: Record<string, number> = {};
  let totalPoints = 0;
  let riskCount = 0;
  for (const rec of input.recognitions) {
    statusCounts[rec.status] += 1;
    if (recognitionHasRiskHit(rec, input.rules)) riskCount += 1;
    if (rec.status === '已发放') {
      totalPoints += rec.points;
      badgeCounts[rec.badgeName] = (badgeCounts[rec.badgeName] ?? 0) + 1;
    }
  }
  return {
    pendingCount: statusCounts.待审核,
    issuedCount: statusCounts.已发放,
    totalPoints,
    riskCount,
    enabledBadgeCount: input.badges.filter((badge) => badge.enabled).length,
    statusCounts,
    badgeCounts,
  };
}

export type RiskHit = {
  rule: 'duplicate' | 'frequency' | 'mutual';
  message: string;
  relatedIds?: string[];
};

export const RISK_HIT_LABELS: Record<RiskHit['rule'], string> = {
  duplicate: '认可原因重复',
  frequency: '频率异常',
  mutual: '双方互认频繁',
};

export type RecognitionAttachment = {
  name: string;
  url: string;
  kind: 'image' | 'file';
};

const IMAGE_ATTACHMENT = /\.(png|jpe?g|gif|webp|bmp|svg)$/i;

export function recognitionAttachmentKind(name: string): RecognitionAttachment['kind'] {
  return IMAGE_ATTACHMENT.test(name) ? 'image' : 'file';
}

export type Recognition = {
  id: string;
  type: RecognitionType;
  giver: string;
  receiver: string;
  department: string;
  badgeId: string;
  badgeName: string;
  points: number;
  description: string;
  status: RecognitionStatus;
  time: string;
  withdrawnAt?: string;
  reviewComment?: string;
  riskHits: RiskHit[];
  attachments?: RecognitionAttachment[];
};

export type QuotaRow = {
  key: string;
  name: string;
  employees: number;
  budget: number;
  used: number;
  objectType: '组织' | '个人';
  employeeId?: string;
  department?: string;
};

export type IncentiveSettings = {
  minimumReasonLength: number;
  reasonPlaceholder: string;
  personalReviewEnabled: boolean;
  reviewerIds: string[];
  rules: {
    duplicate: boolean;
    frequency: boolean;
    mutual: boolean;
    duplicateSimilarity: number;
    frequencyCount: number;
    mutualCount: number;
  };
};

export const DEMO_CURRENT_USER = '陈佳';

export const INCENTIVE_PEOPLE_TREE = [
  {
    title: '轨道交通事业部',
    value: 'org-轨道交通事业部',
    selectable: false,
    children: [
      { title: '林晓云 · 项目经理', value: '林晓云' },
      { title: '陈佳 · 工艺工程师', value: '陈佳' },
      { title: '赵强 · 质量主管', value: '赵强' },
    ],
  },
  {
    title: '生产中心',
    value: 'org-生产中心',
    selectable: false,
    children: [
      { title: '张敏 · 班组长', value: '张敏' },
      { title: '王磊 · 设备工程师', value: '王磊' },
      { title: '刘洋 · 安全员', value: '刘洋' },
    ],
  },
  {
    title: '供应链管理部',
    value: 'org-供应链管理部',
    selectable: false,
    children: [
      { title: '周婷 · 采购专员', value: '周婷' },
      { title: '吴刚 · 物流主管', value: '吴刚' },
    ],
  },
];

export const QUOTA_TARGET_TREE: QuotaTargetNode[] = withQuotaPeople(BADGE_ORG_TREE, peopleByOrgTitle());

export function findQuotaTargetNode(value: string, nodes: QuotaTargetNode[] = QUOTA_TARGET_TREE): QuotaTargetNode | undefined {
  for (const node of nodes) {
    if (node.value === value) return node;
    const nested = node.children ? findQuotaTargetNode(value, node.children) : undefined;
    if (nested) return nested;
  }
  return undefined;
}

export const DEFAULT_INCENTIVE_SETTINGS: IncentiveSettings = {
  minimumReasonLength: 10,
  reasonPlaceholder: '建议按「发生场景—具体行为—产生结果」填写',
  personalReviewEnabled: true,
  reviewerIds: [DEMO_CURRENT_USER],
  rules: {
    duplicate: true,
    frequency: true,
    mutual: true,
    duplicateSimilarity: 85,
    frequencyCount: 3,
    mutualCount: 3,
  },
};

export function canReviewPeerRecords(settings: IncentiveSettings, userId: string): boolean {
  return settings.personalReviewEnabled && settings.reviewerIds.includes(userId);
}

export function canOperatePendingReview(displayed: RecognitionStatus, canReview: boolean): boolean {
  return displayed === '待审核' && canReview;
}

export const BADGE_SECTIONS = [
  { key: 'definition' as const, title: '【行为定义】' },
  { key: 'criteria' as const, title: '【积分认定标准】' },
  { key: 'examples' as const, title: '【典型场景说明】' },
  { key: 'exclusions' as const, title: '【不计分情形】' },
];

export const DEFAULT_BADGE_DESCRIPTION = BADGE_SECTIONS.map((section) => section.title).join('\n\n');

type ParsedBadgeDescription = {
  definition: string;
  criteria: string[];
  examples: string[];
  exclusions: string[];
};

function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseListSection(content: string): string[] {
  return splitLines(content).map((line) => line.replace(/^[-•]\s*/, '').trim()).filter(Boolean);
}

export function parseBadgeDescription(text: string): ParsedBadgeDescription {
  const result: ParsedBadgeDescription = {
    definition: '',
    criteria: [],
    examples: [],
    exclusions: [],
  };

  for (let i = 0; i < BADGE_SECTIONS.length; i += 1) {
    const { key, title } = BADGE_SECTIONS[i];
    const start = text.indexOf(title);
    if (start === -1) continue;

    const contentStart = start + title.length;
    const nextTitle = BADGE_SECTIONS[i + 1]?.title;
    const end = nextTitle ? text.indexOf(nextTitle, contentStart) : text.length;
    const content = text.slice(contentStart, end === -1 ? text.length : end).trim();

    if (key === 'definition') {
      result.definition = content;
    } else {
      result[key] = parseListSection(content);
    }
  }

  return result;
}

export function validateBadgeDescription(text: string): { ok: boolean; message?: string } {
  const parsed = parseBadgeDescription(text);

  if (!parsed.definition.trim()) {
    return { ok: false, message: '缺少【行为定义】' };
  }
  if (parsed.criteria.length === 0) {
    return { ok: false, message: '缺少【积分认定标准】' };
  }
  if (parsed.examples.length === 0) {
    return { ok: false, message: '缺少【典型场景说明】' };
  }
  if (parsed.exclusions.length === 0) {
    return { ok: false, message: '缺少【不计分情形】' };
  }

  return { ok: true };
}

export function displayRecognitionStatus(
  record: Recognition,
  personalReviewEnabled: boolean,
): RecognitionStatus {
  if (record.type === '同事认可' && record.status === '待审核' && !personalReviewEnabled) {
    return '已发放';
  }
  return record.status;
}

export function recognitionHasRiskHit(record: Recognition, rules: IncentiveSettings['rules']): boolean {
  return record.riskHits.some((hit) => rules[hit.rule]);
}

export type RecognitionRiskFlag = '全部' | '异常' | '正常';

export function recognitionMatchesRiskFlag(
  record: Recognition,
  rules: IncentiveSettings['rules'],
  flag: RecognitionRiskFlag,
): boolean {
  if (flag === '全部') return true;
  const hit = recognitionHasRiskHit(record, rules);
  return flag === '异常' ? hit : !hit;
}

export function canDeleteScope(scopeId: string, badges: Badge[]): boolean {
  return !badges.some((badge) => badge.scopeId === scopeId);
}

export function canDeleteCategory(categoryId: string, badges: Badge[]): boolean {
  return !badges.some((badge) => badge.categoryId === categoryId);
}

export function quotaMonthlyTotal(employees: number, budget: number): number {
  return employees * budget;
}

export const QUOTA_BATCH_HEADERS = ['对象', '单人月度积分额度'] as const;
export const QUOTA_BATCH_TEMPLATE_NAME = '额度批量调整模板.xlsx';
export const QUOTA_BATCH_IMPORT_HINT = '请按模板填写对象、单人月度积分额度。仅更新已存在对象。支持 .xlsx、.xls';

export type QuotaBatchRow = { name: string; budget: number };

function cellText(value: unknown): string {
  return String(value ?? '').trim();
}

export function parseQuotaBatchRows(table: unknown[][]): { ok: QuotaBatchRow[]; errors: string[] } {
  const errors: string[] = [];
  const ok: QuotaBatchRow[] = [];
  if (!table.length) return { ok, errors: ['没有可导入的行'] };

  const start = cellText(table[0]?.[0]) === QUOTA_BATCH_HEADERS[0] ? 1 : 0;
  for (let index = start; index < table.length; index += 1) {
    const row = table[index] ?? [];
    const name = cellText(row[0]);
    if (!name) continue;
    const budget = Number(row[1]);
    if (!Number.isFinite(budget) || budget < 0 || !Number.isInteger(budget)) {
      errors.push(`第 ${index + 1} 行「${name}」额度须为 ≥0 的整数`);
      continue;
    }
    ok.push({ name, budget });
  }
  if (!ok.length && !errors.length) errors.push('没有可导入的行');
  return { ok, errors };
}

export function parseQuotaBatchWorkbook(data: ArrayBuffer): { ok: QuotaBatchRow[]; errors: string[] } {
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { ok: [], errors: ['Excel 中没有工作表'] };
  const table = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, defval: '' });
  return parseQuotaBatchRows(table);
}

export function downloadQuotaBatchTemplate() {
  const sheet = XLSX.utils.aoa_to_sheet([[...QUOTA_BATCH_HEADERS]]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, '额度');
  XLSX.writeFile(workbook, QUOTA_BATCH_TEMPLATE_NAME);
}

export function validateCommendationReason(
  text: string,
  min: number,
): { ok: boolean; message?: string } {
  const ok = text.trim().length >= min;
  return ok ? { ok: true } : { ok: false, message: `至少 ${min} 字` };
}
