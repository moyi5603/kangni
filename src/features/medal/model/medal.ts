export const MEDAL_APPS = ['通用', '活动', '课发展', '评优活动', '文化打卡', '即时激励'] as const;
export type MedalApp = (typeof MEDAL_APPS)[number];
export type MedalStatus = '有效' | '失效';
export const MEDAL_INCENTIVE_TYPES = ['公司表彰', '同事认可'] as const;
export type MedalIncentiveType = (typeof MEDAL_INCENTIVE_TYPES)[number];

export function incentiveScopeId(type: MedalIncentiveType): 'company' | 'peer' {
  return type === '公司表彰' ? 'company' : 'peer';
}

export type MedalRecord = {
  id: string;
  name: string;
  imageUrl: string;
  app: MedalApp;
  description: string;
  status: MedalStatus;
  creator: string;
  createdAt: string;
  incentiveType?: MedalIncentiveType;
  categoryId?: string;
};

export type MedalDraft = {
  name: string;
  imageUrl: string;
  app: MedalApp | '';
  description: string;
  incentiveType?: MedalIncentiveType | '';
  categoryId?: string;
};

export type MedalQuery = {
  name: string;
  app: MedalApp | 'all';
  status: MedalStatus | 'all';
  from: string;
  to: string;
};

function badgeUri(fill: string, ring: string, mark: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" fill="${fill}" stroke="${ring}" stroke-width="6"/><text x="40" y="48" text-anchor="middle" font-size="24" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-weight="700" fill="${ring}">${mark}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function row(
  id: string,
  name: string,
  mark: string,
  fill: string,
  ring: string,
  app: MedalApp,
  description: string,
  creator: string,
  createdAt: string,
  status: MedalStatus = '有效',
  extra?: Pick<MedalRecord, 'incentiveType' | 'categoryId'>,
): MedalRecord {
  return { id, name, imageUrl: badgeUri(fill, ring, mark), app, description, status, creator, createdAt, ...extra };
}

export const MEDAL_CREATOR = '北玛三十度';

export const initialMedals: MedalRecord[] = [
  row('m1', '明星员工', '星', '#ffe58f', '#d48806', '评优活动', '全年综合表现优异的标杆员工', '李巧', '2026-08-31 15:03:58'),
  row('m2', '服务标兵', '服', '#ffd8bf', '#d4380d', '评优活动', '服务岗位表现优异，口碑突出', '李巧', '2026-08-31 15:03:02'),
  row('m3', '价值观典范', '值', '#ffccc7', '#cf1322', '评优活动', '自觉践行企业核心价值观', '李巧', '2026-08-31 15:02:18'),
  row('m4', '匠心品质', '匠', '#ffe7ba', '#d46b08', '评优活动', '深耕岗位、精益求精的品质典范', '李巧', '2026-08-31 15:02:04'),
  row('m5', '成长之星', '长', '#d9f7be', '#389e0d', '评优活动', '面向新人的成长激励勋章', '李巧', '2026-08-31 14:52:37'),
  row('m6', '卓越贡献', '卓', '#bae0ff', '#0958d9', '评优活动', '为公司发展作出重大贡献', '李巧', '2026-08-31 14:52:03'),
  row('m7', '成长启航', '航', '#d6e4ff', '#2f54eb', '课发展', '迈出系统学习的第一步', '李巧', '2026-08-04 14:40:08'),
  row('m8', '协作共赢', '协', '#efdbff', '#531dab', '文化打卡', '跨部门协作的表彰勋章', '庄珊珊', '2026-07-27 14:21:38'),
  row('m9', '创新进取', '创', '#b5f5ec', '#08979c', '文化打卡', '提出并落地创新提案', '庄珊珊', '2026-07-27 14:20:31'),
  row('m10', '客户至上', '客', '#fff1b8', '#ad6800', '文化打卡', '客户满意度持续领先', '庄珊珊', '2026-07-27 14:15:11'),
  row('m11', '活动参与勋章', '参', '#ffe58f', '#d48806', '活动', '完成活动报名与签到', '李巧', '2026-08-16 11:20:00'),
  row('m12', '结业纪念勋章', '业', '#d6e4ff', '#1d39c4', '活动', '完成系列活动结业', '李巧', '2026-08-16 11:18:00'),
  row('m13', '满勤打卡', '勤', '#ffd6e7', '#c41d7f', '文化打卡', '连续打卡满勤', '庄珊珊', '2026-07-20 09:00:00'),
  row('m14', '学习之星', '学', '#d3adf7', '#531dab', '课发展', '完成指定课程学习', '李巧', '2026-08-04 10:00:00'),
  row('m15', '安全之星', '安', '#fff1b8', '#ad6800', '通用', '安全意识与行为标杆', MEDAL_CREATOR, '2026-06-01 09:00:00'),
  row('m16', '质量标兵', '质', '#eaff8f', '#7cb305', '通用', '质量改进突出贡献', MEDAL_CREATOR, '2026-06-02 09:00:00'),
  row('m17', '组织先锋', '组', '#b5f5ec', '#08979c', '通用', '组织建设先锋', MEDAL_CREATOR, '2026-06-03 09:00:00'),
  row('m18', '志愿者勋章', '志', '#d9f7be', '#389e0d', '活动', '活动志愿服务', '李巧', '2026-05-12 18:00:00', '失效'),
  row('m19', '卓越贡献', '卓', '#bae0ff', '#0958d9', '即时激励', '公司表彰用勋章', '北玛三十度', '2026-09-15 10:00:00', '有效', {
    incentiveType: '公司表彰',
    categoryId: 'c-company-1',
  }),
  row('m20', '主动补位', '补', '#d6e4ff', '#2f54eb', '即时激励', '同事认可用勋章', '北玛三十度', '2026-09-15 09:00:00', '有效', {
    incentiveType: '同事认可',
    categoryId: 'c-peer-2',
  }),
];

export function sortMedalsByCreatedAtDesc(rows: MedalRecord[]): MedalRecord[] {
  return [...rows].sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}

export function filterMedals(rows: MedalRecord[], query: MedalQuery): MedalRecord[] {
  const keyword = query.name.trim();
  return rows.filter((item) => {
    if (keyword && !item.name.includes(keyword)) return false;
    if (query.app !== 'all' && item.app !== query.app) return false;
    if (query.status !== 'all' && item.status !== query.status) return false;
    const day = item.createdAt.slice(0, 10);
    if (query.from && day < query.from) return false;
    if (query.to && day > query.to) return false;
    return true;
  });
}

export function validateMedalDraft(
  draft: MedalDraft,
  categories: { id: string; scopeId: string }[] = [],
): Partial<Record<'name' | 'imageUrl' | 'app' | 'description' | 'incentiveType' | 'categoryId', string>> {
  const errors: Partial<Record<'name' | 'imageUrl' | 'app' | 'description' | 'incentiveType' | 'categoryId', string>> = {};
  if (!draft.imageUrl.trim()) errors.imageUrl = '请上传勋章图片';
  const name = draft.name.trim();
  if (!name) errors.name = '请输入勋章名称';
  else if (name.length > 30) errors.name = '名称不超过 30 字';
  if (!draft.app) errors.app = '请选择所属应用';
  if (draft.description.length > 100) errors.description = '描述不超过 100 字';
  if (draft.app === '即时激励') {
    if (!draft.incentiveType) errors.incentiveType = '请选择类型';
    if (!draft.categoryId) errors.categoryId = '请选择分类';
    else if (draft.incentiveType) {
      const category = categories.find((item) => item.id === draft.categoryId);
      if (!category || category.scopeId !== incentiveScopeId(draft.incentiveType)) {
        errors.categoryId = '请选择分类';
      }
    }
  }
  return errors;
}
