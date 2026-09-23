import { useEffect, useState } from 'react';
import {
  DEFAULT_INCENTIVE_SETTINGS,
  SYSTEM_GIVER,
  canDeleteCategory,
  canDeleteScope,
  type Badge,
  type BadgeCategory,
  type BadgeScope,
  type IncentiveSettings,
  type QuotaRow,
  type Recognition,
} from './incentive';

const initialScopes: BadgeScope[] = [
  { id: 'company', name: '公司表彰', sort: 1 },
  { id: 'peer', name: '同事认可', sort: 2 },
];

const initialCategories: BadgeCategory[] = [
  { id: 'c-peer-1', scopeId: 'peer', name: '团队协作', sort: 1 },
  { id: 'c-peer-2', scopeId: 'peer', name: '主动担当', sort: 2 },
  { id: 'c-company-1', scopeId: 'company', name: '卓越贡献', sort: 1 },
  { id: 'c-company-2', scopeId: 'company', name: '创新突破', sort: 2 },
];

function proofImage(title: string, fill: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400"><rect width="640" height="400" fill="${fill}"/><text x="40" y="220" font-size="36" font-family="PingFang SC, Microsoft YaHei, sans-serif" fill="#ffffff">${title}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function proofFile(body: string, mime: string) {
  return `data:${mime};charset=utf-8,${encodeURIComponent(body)}`;
}

function badgeIconUrl(fill: string, ring: string, mark: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" fill="${fill}" stroke="${ring}" stroke-width="6"/><text x="40" y="48" text-anchor="middle" font-size="24" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-weight="700" fill="${ring}">${mark}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const initialBadges: Badge[] = [
  {
    id: 'b1',
    scopeId: 'peer',
    categoryId: 'c-peer-2',
    name: '主动补位',
    points: 20,
    iconUrl: badgeIconUrl('#d6e4ff', '#2f54eb', '补'),
    definition: '在团队需要时主动承担额外工作',
    criteria: ['下班后留下处理故障', '临时顶岗完成交付'],
    examples: ['夜班顶岗完成交付', '跨班组支援生产'],
    exclusions: ['仅口头答应未行动', '本职工作范围内'],
    orgIds: ['康尼集团'],
    enabled: true,
    riskLabel: '低风险',
  },
  {
    id: 'b2',
    scopeId: 'peer',
    categoryId: 'c-peer-1',
    name: '跨部门协作',
    points: 15,
    iconUrl: badgeIconUrl('#efdbff', '#531dab', '协'),
    definition: '主动协调跨部门资源解决问题',
    criteria: ['主动联系相关部门', '推动问题闭环'],
    examples: ['协调供应链加急物料', '联合质量部排查缺陷'],
    exclusions: ['仅转发邮件', '常规会议沟通'],
    orgIds: ['康尼集团'],
    enabled: true,
    riskLabel: '低风险',
  },
  {
    id: 'b3',
    scopeId: 'peer',
    categoryId: 'c-peer-1',
    name: '客户至上',
    points: 25,
    iconUrl: badgeIconUrl('#ffd8bf', '#d4380d', '客'),
    definition: '以客户满意为导向超预期服务',
    criteria: ['主动响应客户需求', '获得客户书面感谢'],
    examples: ['驻场解决客户紧急问题', '优化交付方案获客户认可'],
    exclusions: ['常规售后响应', '职责范围内'],
    orgIds: ['康尼集团'],
    enabled: true,
    riskLabel: '低风险',
  },
  {
    id: 'b4',
    scopeId: 'peer',
    categoryId: 'c-peer-2',
    name: '持续改进',
    points: 30,
    iconUrl: badgeIconUrl('#d9f7be', '#389e0d', '改'),
    definition: '提出并落地可量化的改进措施',
    criteria: ['改进方案经评审通过', '产生可验证效益'],
    examples: ['优化工序缩短周期10%', '改进工装减少返工率'],
    exclusions: ['仅提出建议未落地', '日常工作优化'],
    orgIds: ['康尼集团'],
    enabled: true,
    riskLabel: '低风险',
  },
  {
    id: 'b5',
    scopeId: 'peer',
    categoryId: 'c-peer-1',
    name: '知识分享',
    points: 10,
    iconUrl: badgeIconUrl('#fff1b8', '#ad6800', '享'),
    definition: '主动分享专业经验帮助同事成长',
    criteria: ['组织或参与内部分享', '分享内容有实际价值'],
    examples: ['开展技术沙龙', '编写操作指南供团队使用'],
    exclusions: ['日常工作汇报', '被动回答问题'],
    orgIds: ['康尼集团'],
    enabled: true,
    riskLabel: '低风险',
  },
  {
    id: 'b6',
    scopeId: 'company',
    categoryId: 'c-company-1',
    name: '年度标杆',
    points: 500,
    iconUrl: badgeIconUrl('#ffe58f', '#d48806', '杆'),
    definition: '年度表现卓越、业绩突出的员工',
    criteria: ['年度绩效A及以上', '有重大贡献案例'],
    examples: ['主导重大项目成功交付', '年度销售额Top3'],
    exclusions: ['仅完成本职工作', '无具体案例'],
    orgIds: ['康尼集团'],
    enabled: true,
    riskLabel: '直接发放',
  },
  {
    id: 'b7',
    scopeId: 'company',
    categoryId: 'c-company-1',
    name: '安全生产标兵',
    points: 300,
    iconUrl: badgeIconUrl('#b5f5ec', '#08979c', '安'),
    definition: '在安全生产方面表现突出',
    criteria: ['全年零事故', '主动发现并消除安全隐患'],
    examples: ['发现并整改重大安全隐患', '推动安全培训覆盖率100%'],
    exclusions: ['仅遵守安全规定', '无主动行为'],
    orgIds: ['康尼集团'],
    enabled: true,
    riskLabel: '直接发放',
  },
  {
    id: 'b8',
    scopeId: 'company',
    categoryId: 'c-company-2',
    name: '创新之星',
    points: 400,
    iconUrl: badgeIconUrl('#bae0ff', '#0958d9', '创'),
    definition: '在技术创新或管理创新方面有突出贡献',
    criteria: ['创新成果经评审认定', '产生可量化效益'],
    examples: ['申请专利并落地应用', '创新管理模式提升效率20%'],
    exclusions: ['常规技术改进', '未产生实际效益'],
    orgIds: ['康尼集团'],
    enabled: true,
    riskLabel: '直接发放',
  },
];

const initialRecognitions: Recognition[] = [
  {
    id: 'RK20260826001',
    type: '同事认可',
    giver: '陈佳',
    receiver: '林晓云',
    department: '轨道交通事业部',
    badgeId: 'b1',
    badgeName: '主动补位',
    points: 20,
    description: '夜班顶岗完成紧急交付任务',
    status: '待审核',
    time: '2026-08-26 09:00',
    riskHits: [],
  },
  {
    id: 'RK20260826002',
    type: '同事认可',
    giver: '王磊',
    receiver: '张敏',
    department: '生产中心 · 一车间',
    badgeId: 'b2',
    badgeName: '跨部门协作',
    points: 15,
    description: '协调供应链加急物料保障产线不停工',
    status: '已发放',
    time: '2026-08-25 14:30',
    riskHits: [],
  },
  {
    id: 'RK20260826003',
    type: '公司表彰',
    giver: '系统',
    receiver: '赵强',
    department: '轨道交通事业部',
    badgeId: 'b6',
    badgeName: '年度标杆',
    points: 500,
    description: '主导城轨信号系统项目成功交付，获客户书面感谢',
    status: '已发放',
    time: '2026-08-24 10:00',
    riskHits: [],
    attachments: [
      { name: '客户感谢信.png', url: proofImage('客户感谢信', '#1677ff'), kind: 'image' },
      {
        name: '交付确认函.pdf',
        url: proofFile('城轨信号系统项目交付确认函', 'application/pdf'),
        kind: 'file',
      },
    ],
  },
  {
    id: 'RK20260826004',
    type: '同事认可',
    giver: '林晓云',
    receiver: '陈佳',
    department: '轨道交通事业部',
    badgeId: 'b1',
    badgeName: '主动补位',
    points: 20,
    description: '周末加班完成客户紧急需求变更',
    status: '已发放',
    time: '2026-08-23 16:45',
    attachments: [{ name: '现场照片.jpg', url: proofImage('现场照片', '#52c41a'), kind: 'image' }],
    riskHits: [
      { rule: 'duplicate', message: '本次描述与历史提报内容高度相似，建议核对是否为同一事实。', relatedIds: ['RK20260826002'] },
      { rule: 'mutual', message: '近30天双方互认已达3次' },
    ],
  },
  {
    id: 'RK20260826005',
    type: '公司表彰',
    giver: '系统',
    receiver: '刘洋',
    department: '生产中心',
    badgeId: 'b7',
    badgeName: '安全生产标兵',
    points: 300,
    description: '发现并整改重大安全隐患，全年零事故',
    status: '已发放',
    time: '2026-08-22 11:20',
    riskHits: [],
    attachments: [
      {
        name: '隐患整改清单.xlsx',
        url: proofFile('隐患,整改措施,完成时间', 'application/vnd.ms-excel'),
        kind: 'file',
      },
    ],
  },
  {
    id: 'RK20260826006',
    type: '同事认可',
    giver: '张敏',
    receiver: '王磊',
    department: '生产中心 · 一车间',
    badgeId: 'b4',
    badgeName: '持续改进',
    points: 30,
    description: '优化工序缩短生产周期10%',
    status: '待审核',
    time: '2026-08-21 08:50',
    riskHits: [{ rule: 'frequency', message: '近期向同一对象发起认可次数较多，请关注事实是否独立。' }],
  },
  {
    id: 'RK20260826007',
    type: '同事认可',
    giver: '周婷',
    receiver: '吴刚',
    department: '供应链管理部',
    badgeId: 'b3',
    badgeName: '客户至上',
    points: 25,
    description: '描述不够具体',
    status: '已驳回',
    time: '2026-08-20 15:00',
    reviewComment: '事实描述不够具体，请补充发生场景与结果',
    riskHits: [],
  },
];

const initialQuotas: QuotaRow[] = [
  {
    key: 'q-rail',
    name: '轨道交通事业部',
    employees: 120,
    budget: 200,
    used: 8600,
    objectType: '组织',
    department: '轨道交通事业部',
  },
  {
    key: 'q-prod',
    name: '生产中心',
    employees: 85,
    budget: 150,
    used: 4200,
    objectType: '组织',
    department: '生产中心',
  },
  {
    key: 'q-scm',
    name: '供应链管理部',
    employees: 45,
    budget: 180,
    used: 3100,
    objectType: '组织',
    department: '供应链管理部',
  },
  {
    key: 'q-hr',
    name: '人力资源部',
    employees: 30,
    budget: 120,
    used: 1800,
    objectType: '组织',
    department: '人力资源部',
  },
  {
    key: 'q-personal',
    name: '林晓云',
    employees: 1,
    budget: 500,
    used: 320,
    objectType: '个人',
    employeeId: 'E001',
    department: '轨道交通事业部',
  },
];

let scopes = [...initialScopes];
let categories = [...initialCategories];
let badges = [...initialBadges];
let recognitions = [...initialRecognitions];
let quotas = [...initialQuotas];
let settings: IncentiveSettings = {
  ...DEFAULT_INCENTIVE_SETTINGS,
  rules: { ...DEFAULT_INCENTIVE_SETTINGS.rules },
  reviewerIds: [...DEFAULT_INCENTIVE_SETTINGS.reviewerIds],
};
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

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function shanghaiStamp(ms = Date.now()) {
  const shifted = new Date(ms + 8 * 60 * 60 * 1000);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())} ${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`;
}

export function __resetIncentiveStoreForTests() {
  scopes = [...initialScopes];
  categories = [...initialCategories];
  badges = [...initialBadges];
  recognitions = [...initialRecognitions];
  quotas = [...initialQuotas];
  settings = {
    ...DEFAULT_INCENTIVE_SETTINGS,
    rules: { ...DEFAULT_INCENTIVE_SETTINGS.rules },
    reviewerIds: [...DEFAULT_INCENTIVE_SETTINGS.reviewerIds],
  };
  emit();
}

export function getScopes() {
  return scopes;
}

export function useScopes() {
  useStoreTick();
  return scopes;
}

export function getCategories() {
  return categories;
}

export function useCategories() {
  useStoreTick();
  return categories;
}

export function getBadges() {
  return badges;
}

export function useBadges() {
  useStoreTick();
  return badges;
}

export function saveScope(record: BadgeScope): BadgeScope {
  const current = scopes.find((item) => item.id === record.id);
  scopes = current ? scopes.map((item) => (item.id === record.id ? record : item)) : [...scopes, record];
  emit();
  return record;
}

export function deleteScope(id: string): boolean {
  if (scopes.length <= 1) return false;
  if (!canDeleteScope(id, badges)) return false;
  scopes = scopes.filter((item) => item.id !== id);
  categories = categories.filter((item) => item.scopeId !== id);
  emit();
  return true;
}

export function saveCategory(record: BadgeCategory): BadgeCategory {
  const current = categories.find((item) => item.id === record.id);
  categories = current
    ? categories.map((item) => (item.id === record.id ? record : item))
    : [...categories, record];
  emit();
  return record;
}

export function deleteCategory(id: string): boolean {
  if (!canDeleteCategory(id, badges)) return false;
  categories = categories.filter((item) => item.id !== id);
  emit();
  return true;
}

export function getRecognitions() {
  return recognitions;
}

export function useRecognitions() {
  useStoreTick();
  return recognitions;
}

export function getQuotas() {
  return quotas;
}

export function useQuotas() {
  useStoreTick();
  return quotas;
}

export function getIncentiveSettings() {
  return settings;
}

export function setIncentiveSettings(next: IncentiveSettings) {
  settings = { ...next, rules: { ...next.rules }, reviewerIds: [...next.reviewerIds] };
  emit();
}

export function useIncentiveSettings() {
  useStoreTick();
  return settings;
}

export function saveBadge(record: Badge): Badge {
  const current = badges.find((item) => item.id === record.id);
  badges = current ? badges.map((item) => (item.id === record.id ? record : item)) : [record, ...badges];
  emit();
  return record;
}

export function deleteBadge(id: string): boolean {
  const exists = badges.some((item) => item.id === id);
  if (!exists) return false;
  badges = badges.filter((item) => item.id !== id);
  emit();
  return true;
}

export function withdrawRecognition(id: string): boolean {
  const current = recognitions.find((item) => item.id === id);
  if (!current) return false;
  const at = shanghaiStamp();
  recognitions = recognitions.map((item) =>
    item.id === id ? { ...item, status: '已撤回' as const, withdrawnAt: at } : item,
  );
  emit();
  return true;
}

export function approveRecognition(id: string): boolean {
  const current = recognitions.find((item) => item.id === id);
  if (!current || current.status !== '待审核') return false;
  recognitions = recognitions.map((item) => (item.id === id ? { ...item, status: '已发放' as const } : item));
  emit();
  return true;
}

export function rejectRecognition(id: string, comment: string): boolean {
  const current = recognitions.find((item) => item.id === id);
  if (!current || current.status !== '待审核') return false;
  const reviewComment = comment.trim();
  if (!reviewComment) return false;
  recognitions = recognitions.map((item) =>
    item.id === id ? { ...item, status: '已驳回' as const, reviewComment } : item,
  );
  emit();
  return true;
}

export function issueCommendation(input: {
  employeeNames: string[];
  badgeId: string;
  reason: string;
  attachments?: Recognition['attachments'];
}): string[] {
  const badge = badges.find((item) => item.id === input.badgeId);
  if (!badge) return [];
  const now = Date.now();
  const ids: string[] = [];
  const newRecords: Recognition[] = input.employeeNames.map((name, index) => {
    const id = `RK${now}${index}`;
    ids.push(id);
    return {
      id,
      type: '公司表彰' as const,
      giver: SYSTEM_GIVER,
      receiver: name,
      department: '轨道交通事业部',
      badgeId: badge.id,
      badgeName: badge.name,
      points: badge.points,
      description: input.reason,
      status: '已发放' as const,
      time: shanghaiStamp(now + index),
      riskHits: [],
      attachments: input.attachments ?? [],
    };
  });
  recognitions = [...newRecords, ...recognitions];
  emit();
  return ids;
}

export function addQuota(row: QuotaRow): { ok: true } | { ok: false; reason: string } {
  if (quotas.some((item) => item.name === row.name)) {
    return { ok: false, reason: 'duplicate' };
  }
  quotas = [...quotas, row];
  emit();
  return { ok: true };
}

export function updateQuota(key: string, patch: Partial<QuotaRow>): boolean {
  const current = quotas.find((item) => item.key === key);
  if (!current) return false;
  quotas = quotas.map((item) => (item.key === key ? { ...item, ...patch, key } : item));
  emit();
  return true;
}

export function applyQuotaBudgetsByKeys(keys: string[], budget: number): { updated: number } {
  const keySet = new Set(keys);
  let updated = 0;
  quotas = quotas.map((row) => {
    if (!keySet.has(row.key)) return row;
    updated += 1;
    return { ...row, budget };
  });
  if (updated) emit();
  return { updated };
}

export function applyQuotaBudgetsByName(items: Array<{ name: string; budget: number }>): {
  updated: number;
  missing: string[];
} {
  const missing: string[] = [];
  let updated = 0;
  let next = quotas;
  for (const item of items) {
    if (!next.some((row) => row.name === item.name)) {
      missing.push(item.name);
      continue;
    }
    next = next.map((row) => (row.name === item.name ? { ...row, budget: item.budget } : row));
    updated += 1;
  }
  quotas = next;
  if (updated) emit();
  return { updated, missing };
}
