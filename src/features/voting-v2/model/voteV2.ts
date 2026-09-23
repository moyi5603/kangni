import { orgDepartmentTree, personDepartment, type OrgTreeNode } from '../../activities/model/activity';
import * as XLSX from 'xlsx';

export const voteV2Periods = ['每天', '总共'] as const;
export type VoteV2Period = (typeof voteV2Periods)[number];

export const voteV2SelectModes = ['单选', '多选'] as const;
export type VoteV2SelectMode = (typeof voteV2SelectModes)[number];

export const voteV2Visibilities = ['全员', '按部门'] as const;
export type VoteV2Visibility = (typeof voteV2Visibilities)[number];

export const voteV2Statuses = ['未开始', '进行中', '已结束'] as const;
export type VoteV2Status = (typeof voteV2Statuses)[number];

export const voteV2CoverKinds = ['图片', '视频', '链接'] as const;
export type VoteV2CoverKind = (typeof voteV2CoverKinds)[number];

export const voteV2SignupLimits = ['不限', '一次'] as const;
export type VoteV2SignupLimit = (typeof voteV2SignupLimits)[number];

export const voteV2FieldDisplays = ['必填', '选填', '隐藏'] as const;
export type VoteV2FieldDisplay = (typeof voteV2FieldDisplays)[number];

export const voteV2SignupFieldTypes = ['单行文本', '数字', '图片', '视频'] as const;
export type VoteV2SignupFieldType = (typeof voteV2SignupFieldTypes)[number];

export const voteV2ShareModes = ['微信分享', '禁止分享', '自定义分享'] as const;
export type VoteV2ShareMode = (typeof voteV2ShareModes)[number];

export const voteV2InternalVerifies = ['邀请码', '导入名单'] as const;
export type VoteV2InternalVerify = (typeof voteV2InternalVerifies)[number];

export const voteV2ThemeColors = [
  { value: '#5282F0', label: '蓝色', solid: '#5282F0' },
  { value: '#31cab1', label: '青色', solid: '#31cab1' },
  { value: '#e54242', label: '红色', solid: '#e54242' },
  { value: '#ff8939', label: '橙色', solid: '#ff8939' },
  { value: '#ffb712', label: '黄色', solid: '#ffb712' },
  { value: '#1dc47b', label: '绿色', solid: '#1dc47b' },
  { value: '#7b61ff', label: '紫色', solid: '#7b61ff' },
  { value: '#ff6b9d', label: '粉色', solid: '#ff6b9d' },
] as const;

export function voteV2ThemeSolid(theme: string): string {
  const hit = voteV2ThemeColors.find((item) => item.value.toLowerCase() === theme.toLowerCase());
  if (hit) return hit.solid;
  if (theme.startsWith('#')) return theme;
  return '#5282F0';
}

export const voteV2FloatEffects = ['无', '花瓣', '气球', '雪花', '红包'] as const;
export type VoteV2FloatEffect = (typeof voteV2FloatEffects)[number];

export function voteV2IntroPlain(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
}

export const voteV2NameMax = 50;
export const voteV2IntroMax = 2000;
export const voteV2QuotaMin = 1;
export const voteV2QuotaMax = 50;

export type VoteV2SignupField = {
  key: string;
  label: string;
  type: VoteV2SignupFieldType;
  display: VoteV2FieldDisplay;
};

export type VoteV2Group = {
  id: number;
  name: string;
};

export type VoteV2Contestant = {
  id: number;
  campaignId: number;
  groupId?: number;
  optionNo: number;
  name: string;
  subtitle: string;
  imageUrl: string;
  videoUrl: string;
  audioUrl: string;
  description: string;
  phone: string;
  voteCount: number;
  locked: boolean;
};

export type VoteV2PlayerGroupKey = 'all' | 'none' | number;

export type VoteV2PlayerListQuery = {
  keyword: string;
  groupKey: VoteV2PlayerGroupKey;
  page: number;
  pageSize: number;
};

export type VoteV2PlayerCsvRow = {
  optionNo: number;
  name: string;
  subtitle: string;
  groupName: string;
  description: string;
};

export const VOTE_V2_PLAYER_IMPORT_HEADERS = ['序号', '选项标题', '选项副标题', '分组', '描述'] as const;

export const VOTE_V2_PLAYER_IMPORT_HINT = '仅支持 .xlsx、.xls';

function cellText(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}

function csvToTable(text: string): string[][] {
  return text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.split(',').map((cell) => cell.trim()))
    .filter((row) => row.some((cell) => cell));
}

export function parseVoteV2PlayerImportRows(
  table: Array<Array<unknown>>,
  allowedGroupNames: string[],
): { ok: VoteV2PlayerCsvRow[]; errors: string[] } {
  const errors: string[] = [];
  const ok: VoteV2PlayerCsvRow[] = [];
  if (!table.length) {
    return { ok, errors: ['缺少表头'] };
  }
  const header = (table[0] ?? []).slice(0, VOTE_V2_PLAYER_IMPORT_HEADERS.length).map(cellText);
  const expected = [...VOTE_V2_PLAYER_IMPORT_HEADERS];
  if (expected.some((label, index) => header[index] !== label)) {
    return { ok, errors: [`表头须为：${expected.join('、')}`] };
  }
  const allowed = new Set(allowedGroupNames.map((name) => name.trim()).filter(Boolean));
  for (let index = 1; index < table.length; index += 1) {
    const row = table[index] ?? [];
    const lineNo = index + 1;
    const [noRaw, name, subtitle, groupName, description] = [0, 1, 2, 3, 4].map((col) => cellText(row[col]));
    if (![noRaw, name, subtitle, groupName, description].some(Boolean)) continue;
    const optionNo = Number(noRaw);
    if (!noRaw || !Number.isFinite(optionNo) || !Number.isInteger(optionNo) || optionNo <= 0) {
      errors.push(`第 ${lineNo} 行缺少序号`);
      continue;
    }
    if (!name) {
      errors.push(`第 ${lineNo} 行缺少选项标题`);
      continue;
    }
    if (groupName && !allowed.has(groupName)) {
      errors.push(`第 ${lineNo} 行分组「${groupName}」不在当前投票的分组选项中`);
      continue;
    }
    ok.push({
      optionNo,
      name,
      subtitle,
      groupName,
      description,
    });
  }
  return { ok, errors };
}

export function parseVoteV2PlayerCsv(text: string, allowedGroupNames: string[] = []): { ok: VoteV2PlayerCsvRow[]; errors: string[] } {
  return parseVoteV2PlayerImportRows(csvToTable(text), allowedGroupNames);
}

export function parseVoteV2PlayerWorkbook(
  data: ArrayBuffer,
  allowedGroupNames: string[],
): { ok: VoteV2PlayerCsvRow[]; errors: string[] } {
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { ok: [], errors: ['Excel 中没有工作表'] };
  const table = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, defval: '' });
  return parseVoteV2PlayerImportRows(table, allowedGroupNames);
}

export function downloadVoteV2PlayerImportTemplate() {
  const sheet = XLSX.utils.aoa_to_sheet([[...VOTE_V2_PLAYER_IMPORT_HEADERS]]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, '选项');
  XLSX.writeFile(workbook, '投票选项导入模板.xlsx');
}

export function defaultVoteV2Contestant(
  input: Pick<VoteV2Contestant, 'id' | 'campaignId' | 'name'> & Partial<VoteV2Contestant>,
): VoteV2Contestant {
  return {
    optionNo: 1,
    subtitle: '',
    imageUrl: '',
    videoUrl: '',
    audioUrl: '',
    description: '',
    phone: '',
    voteCount: 0,
    locked: false,
    ...input,
  };
}

export function voteV2ManageTitle(): string {
  return '选项管理';
}

export function nextVoteV2OptionNo(rows: Pick<VoteV2Contestant, 'optionNo'>[]): number {
  return rows.reduce((max, item) => Math.max(max, item.optionNo), 0) + 1;
}

export function filterVoteV2Players(
  rows: VoteV2Contestant[],
  query: Pick<VoteV2PlayerListQuery, 'keyword' | 'groupKey'>,
): VoteV2Contestant[] {
  const needle = query.keyword.trim().toLowerCase();
  return rows.filter((item) => {
    if (needle) {
      const no = String(item.optionNo);
      const hit =
        item.name.toLowerCase().includes(needle) ||
        item.subtitle.toLowerCase().includes(needle) ||
        no.includes(needle) ||
        String(item.id) === needle;
      if (!hit) return false;
    }
    if (query.groupKey === 'none' && item.groupId != null) return false;
    if (typeof query.groupKey === 'number' && item.groupId !== query.groupKey) return false;
    return true;
  });
}

export function voteV2NameFromImageFile(filename: string): string | undefined {
  const base = filename.replace(/^.*[/\\]/, '').replace(/\.[^.]+$/, '').trim();
  return base || undefined;
}

export function encodeVoteV2PlayerTab(query: VoteV2PlayerListQuery): string {
  const params = new URLSearchParams();
  params.set('q', query.keyword);
  params.set('g', String(query.groupKey));
  params.set('p', String(query.page));
  params.set('ps', String(query.pageSize));
  return params.toString();
}

export function decodeVoteV2PlayerTab(tab?: string): VoteV2PlayerListQuery {
  const params = new URLSearchParams(tab ?? '');
  const g = params.get('g') || 'all';
  const groupKey: VoteV2PlayerGroupKey =
    g === 'none' || g === 'all' ? g : Number.isFinite(Number(g)) ? Number(g) : 'all';
  const page = Math.max(1, Number(params.get('p')) || 1);
  const pageSize = Math.max(1, Number(params.get('ps')) || 10);
  return { keyword: params.get('q') ?? '', groupKey, page, pageSize };
}

export const voteV2PreviewSampleCount = 8;
export const voteV2ContestantNounPresets = ['选手', '作品'] as const;
export const voteV2ButtonNounPresets = ['投票', '点赞', '加油'] as const;
export const voteV2VoteUnitPresets = ['票', '赞'] as const;
export const voteV2ContestantNounMax = 4;
export const voteV2GroupNameMax = 20;
export const voteV2ButtonNounMax = 2;
export const voteV2VoteUnitMax = 1;
export const voteV2HomeColumnOptions = [1, 2, 3] as const;
export const voteV2PcHomeColumnOptions = [3, 4, 5] as const;

export const voteV2PageDisplayItems = [
  { key: 'activityName', label: '活动名称' },
  { key: 'activityStats', label: '活动数据' },
  { key: 'totalVotes', label: '总票数' },
  { key: 'countdown', label: '活动倒计时' },
  { key: 'voteTime', label: '投票时间' },
  { key: 'voteRules', label: '投票规则' },
  { key: 'intro', label: '活动介绍' },
  { key: 'search', label: '选项搜索' },
  { key: 'groups', label: '选项分组' },
  { key: 'contestantNo', label: '选项编号' },
  { key: 'contestantCover', label: '选项封面' },
  { key: 'contestantName', label: '选项名称' },
  { key: 'contestantSubtitle', label: '选项副标题' },
  { key: 'contestantVotes', label: '选项票数' },
  { key: 'voteButton', label: '投票按钮' },
  { key: 'detailButton', label: '详情按钮' },
] as const;

export type VoteV2PageDisplayKey = (typeof voteV2PageDisplayItems)[number]['key'];
export type VoteV2PageDisplay = Record<VoteV2PageDisplayKey, boolean>;

export function defaultVoteV2PageDisplay(): VoteV2PageDisplay {
  return Object.fromEntries(voteV2PageDisplayItems.map((item) => [item.key, true])) as VoteV2PageDisplay;
}

export function mergeVoteV2PageDisplay(input?: Partial<VoteV2PageDisplay>): VoteV2PageDisplay {
  return { ...defaultVoteV2PageDisplay(), ...input };
}

export function voteV2PageDisplayKeys(display: VoteV2PageDisplay): VoteV2PageDisplayKey[] {
  return voteV2PageDisplayItems.map((item) => item.key).filter((key) => display[key]);
}

export function voteV2PageDisplayFromKeys(keys: readonly string[]): VoteV2PageDisplay {
  const selected = new Set(keys);
  return Object.fromEntries(voteV2PageDisplayItems.map((item) => [item.key, selected.has(item.key)])) as VoteV2PageDisplay;
}

export function clampVoteV2HomeColumns(value: number): 1 | 2 | 3 {
  const columns = Number(value);
  if (columns === 1 || columns === 3) return columns;
  return 2;
}

export function clampVoteV2PcHomeColumns(value: number): 3 | 4 | 5 {
  const columns = Number(value);
  if (columns === 4 || columns === 5) return columns;
  return 3;
}

export function resolveVoteV2HomeColumns(
  campaign: { homeColumns: number; pcHomeColumns: number },
  surface: 'h5' | 'pc',
): number {
  return surface === 'pc'
    ? clampVoteV2PcHomeColumns(campaign.pcHomeColumns)
    : clampVoteV2HomeColumns(campaign.homeColumns);
}

export function clampVoteV2GroupColumns(value: number): 1 | 2 | 3 | 4 {
  if (value === 1 || value === 2 || value === 4) return value;
  return 3;
}

export function voteV2SampleNo(id: number): string {
  return String(id).padStart(2, '0');
}

export function countVoteV2GroupOptions(contestants: Pick<VoteV2Contestant, 'groupId'>[], groupId?: number): number {
  if (groupId == null) return 0;
  return contestants.filter((item) => item.groupId === groupId).length;
}

export function formatVoteV2GroupOptionCount(count: number): string {
  return `${count} 个选项`;
}

export function sumVoteV2ContestantVotes(rows: Pick<VoteV2Contestant, 'voteCount'>[]): number {
  return rows.reduce((sum, item) => sum + item.voteCount, 0);
}

export type VoteV2Standing = {
  id: number;
  rank: number;
  voteCount: number;
  gapToPrev: number;
};

export const voteV2DetailTabs = [
  { key: 'detail', label: '详情' },
  { key: 'results', label: '投票结果' },
  { key: 'records', label: '投票记录' },
] as const;

export type VoteV2DetailTab = (typeof voteV2DetailTabs)[number]['key'];

export function isVoteV2DetailTab(value: string | undefined): value is VoteV2DetailTab {
  return !!value && voteV2DetailTabs.some((item) => item.key === value);
}

export type VoteV2ResultRow = {
  id: number;
  optionNo: number;
  name: string;
  subtitle: string;
  imageUrl: string;
  voteCount: number;
  rank: number;
  percent: number | null;
};

export function tallyVoteV2Results(rows: VoteV2Contestant[]): VoteV2ResultRow[] {
  const total = sumVoteV2ContestantVotes(rows);
  const sorted = [...rows].sort((a, b) => b.voteCount - a.voteCount || a.optionNo - b.optionNo);
  let lastCount = -1;
  let lastRank = 0;
  return sorted.map((item, index) => {
    const rank = item.voteCount === lastCount ? lastRank : index + 1;
    lastCount = item.voteCount;
    lastRank = rank;
    return {
      id: item.id,
      optionNo: item.optionNo,
      name: item.name,
      subtitle: item.subtitle,
      imageUrl: item.imageUrl,
      voteCount: item.voteCount,
      rank,
      percent: total === 0 ? null : Math.round((item.voteCount / total) * 100),
    };
  });
}

export type VoteV2RecordRow = {
  key: string;
  at: string;
  userId: string;
  department: string;
  optionName: string;
  contestantIds: number[];
};

export function listVoteV2CastRecords(
  casts: VoteV2Cast[],
  contestants: VoteV2Contestant[],
  campaignId: number,
): VoteV2RecordRow[] {
  const byOption = new Map(contestants.map((item) => [item.id, item]));
  const grouped = new Map<string, VoteV2Cast[]>();
  casts
    .filter((item) => item.campaignId === campaignId)
    .forEach((item) => {
      const key = `${item.userId}\0${item.at}`;
      const list = grouped.get(key) ?? [];
      list.push(item);
      grouped.set(key, list);
    });
  return [...grouped.values()]
    .map((items) => {
      const first = items[0];
      const picked = items
        .map((item) => byOption.get(item.contestantId))
        .filter((item): item is VoteV2Contestant => Boolean(item))
        .sort((left, right) => left.optionNo - right.optionNo || left.id - right.id);
      const names = picked.map((item) => item.name);
      return {
        key: `${first.at}-${first.userId}`,
        at: first.at,
        userId: first.userId,
        department: personDepartment(first.userId) ?? '—',
        optionName: names.length ? names.join('、') : '—',
        contestantIds: picked.map((item) => item.id),
      };
    })
    .sort((a, b) => b.at.localeCompare(a.at) || a.userId.localeCompare(b.userId));
}

export function voteV2DetailEmptyHint(status: VoteV2Status, hasRows: boolean): string | undefined {
  if (hasRows) return undefined;
  return status === '未开始' ? '尚未开始，暂无投票' : '暂无投票';
}

export function voteV2ContestantStanding(
  rows: Array<Pick<VoteV2Contestant, 'id' | 'voteCount' | 'optionNo'>>,
  contestantId: number,
): VoteV2Standing | undefined {
  const ranked = [...rows].sort((a, b) => b.voteCount - a.voteCount || a.optionNo - b.optionNo);
  const index = ranked.findIndex((item) => item.id === contestantId);
  if (index < 0) return undefined;
  const row = ranked[index];
  return {
    id: row.id,
    rank: index + 1,
    voteCount: row.voteCount,
    gapToPrev: index === 0 ? 0 : ranked[index - 1].voteCount - row.voteCount,
  };
}

export function formatVoteV2RankLabel(rank: number): string {
  return `第${rank}名`;
}

export function formatVoteV2CurrentVotes(count: number, voteUnit: string): string {
  return `当前${count}${voteUnit}`;
}

export function formatVoteV2GapToPrev(gap: number, voteUnit: string): string {
  return `差${gap}${voteUnit}`;
}

export function filterVoteV2PreviewSamples(rows: VoteV2Contestant[], query: string): VoteV2Contestant[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((item) => {
    const no = voteV2SampleNo(item.optionNo);
    return (
      item.name.toLowerCase().includes(needle) ||
      item.subtitle.toLowerCase().includes(needle) ||
      no.includes(needle) ||
      String(item.optionNo) === needle ||
      String(item.id) === needle
    );
  });
}

export function voteV2PreviewSamples(): VoteV2Contestant[] {
  return Array.from({ length: voteV2PreviewSampleCount }, (_, index) =>
    defaultVoteV2Contestant({
      id: index + 1,
      campaignId: 0,
      optionNo: index + 1,
      name: `示例${index + 1}`,
      subtitle: '副标题',
      voteCount: voteV2PreviewSampleCount - index,
    }),
  );
}

export type VoteV2InviteCode = {
  id: number;
  campaignId: number;
  code: string;
  used: boolean;
};

export type VoteV2Campaign = {
  id: number;
  name: string;
  startAt: string;
  endAt: string;
  intro: string;
  period: VoteV2Period;
  selectMode: VoteV2SelectMode;
  quotaPerUser: number;
  quotaPerContestant: number;
  minSelect: number;
  maxSelect: number;
  ruleHint: string;
  createdAt: string;
  creator: string;
  viewCount: number;
  coverKind: VoteV2CoverKind;
  coverUrl: string;
  backgroundEnabled: boolean;
  backgroundUrl: string;
  themeColor: string;
  floatEffect: VoteV2FloatEffect;
  musicName: string;
  bottomCustom1Name: string;
  bottomCustom1Url: string;
  bottomCustom2Name: string;
  bottomCustom2Url: string;
  contestantNoun: string;
  voteButtonNoun: string;
  voteUnit: string;
  homeColumns: number;
  pcHomeColumns: number;
  pageDisplay: VoteV2PageDisplay;
  signupEnabled: boolean;
  signupLimit: VoteV2SignupLimit;
  signupNeedReview: boolean;
  signupSyncVoteTime: boolean;
  signupStartAt: string;
  signupEndAt: string;
  signupFields: VoteV2SignupField[];
  groupingEnabled: boolean;
  groups: VoteV2Group[];
  groupColumns: number;
  showAllGroups: boolean;
  captchaEnabled: boolean;
  wechatBlacklistEnabled: boolean;
  smartAntiCheatEnabled: boolean;
  regionLimit: string;
  shareMode: VoteV2ShareMode;
  shareTitle: string;
  shareContent: string;
  shareImageUrl: string;
  followToVoteEnabled: boolean;
  adEnabled: boolean;
  popupEnabled: boolean;
  popupImageUrl: string;
  copyrightEnabled: boolean;
  copyrightText: string;
  copyrightUrl: string;
  internalVoteEnabled: boolean;
  internalVerify: VoteV2InternalVerify;
  visibility: VoteV2Visibility;
  departments: string[];
  pinned: boolean;
};

export type VoteV2EditField =
  | 'name'
  | 'startAt'
  | 'endAt'
  | 'intro'
  | 'period'
  | 'selectMode'
  | 'quotaPerUser'
  | 'quotaPerContestant'
  | 'minSelect'
  | 'maxSelect'
  | 'ruleHint'
  | 'visibility';

export const defaultVoteV2SignupFields: VoteV2SignupField[] = [
  { key: 'name', label: '选手姓名', type: '单行文本', display: '必填' },
  { key: 'image', label: '选手图片', type: '图片', display: '必填' },
  { key: 'video', label: '选手视频', type: '视频', display: '选填' },
  { key: 'audio', label: '选手音频', type: '单行文本', display: '隐藏' },
  { key: 'desc', label: '选手描述', type: '单行文本', display: '选填' },
  { key: 'phone', label: '手机号', type: '数字', display: '选填' },
];

export function defaultVoteV2Campaign(
  input: Pick<VoteV2Campaign, 'id' | 'name' | 'startAt' | 'endAt' | 'createdAt'> & Partial<VoteV2Campaign>,
): VoteV2Campaign {
  const campaign = {
    intro: '',
    period: '每天' as const,
    selectMode: '单选' as const,
    quotaPerUser: 1,
    quotaPerContestant: 1,
    minSelect: 1,
    maxSelect: 1,
    ruleHint: '',
    viewCount: 0,
    creator: '陈产品',
    coverKind: '图片' as const,
    coverUrl: '',
    backgroundEnabled: false,
    backgroundUrl: '',
    themeColor: '#5282F0',
    floatEffect: '无' as const,
    musicName: '',
    bottomCustom1Name: '',
    bottomCustom1Url: '',
    bottomCustom2Name: '',
    bottomCustom2Url: '',
    contestantNoun: '选手',
    voteButtonNoun: '投票',
    voteUnit: '票',
    signupEnabled: false,
    signupLimit: '一次' as const,
    signupNeedReview: true,
    signupSyncVoteTime: true,
    signupStartAt: input.startAt,
    signupEndAt: input.endAt,
    signupFields: defaultVoteV2SignupFields.map((item) => ({ ...item })),
    groupingEnabled: false,
    groups: [],
    showAllGroups: true,
    captchaEnabled: true,
    wechatBlacklistEnabled: true,
    smartAntiCheatEnabled: true,
    regionLimit: '不限地区',
    shareMode: '微信分享' as const,
    shareTitle: input.name,
    shareContent: `我正在参加${input.name}，快来支持我吧`,
    shareImageUrl: '',
    followToVoteEnabled: false,
    adEnabled: false,
    popupEnabled: false,
    popupImageUrl: '',
    copyrightEnabled: false,
    copyrightText: '我也要创建活动',
    copyrightUrl: '',
    internalVoteEnabled: false,
    internalVerify: '邀请码' as const,
    visibility: '全员' as const,
    departments: [] as string[],
    pinned: false,
    ...input,
    homeColumns: clampVoteV2HomeColumns(input.homeColumns ?? 2),
    pcHomeColumns: clampVoteV2PcHomeColumns(input.pcHomeColumns ?? 3),
    groupColumns: clampVoteV2GroupColumns(input.groupColumns ?? 3),
    pageDisplay: mergeVoteV2PageDisplay(input.pageDisplay),
  };
  const minSelect = input.minSelect ?? 1;
  const maxSelect = input.maxSelect ?? (campaign.selectMode === '多选' ? campaign.quotaPerUser : 1);
  return {
    ...campaign,
    minSelect,
    maxSelect,
    ruleHint:
      campaign.ruleHint ||
      defaultVoteV2RuleHint({
        period: campaign.period,
        selectMode: campaign.selectMode,
        quotaPerUser: campaign.quotaPerUser,
        minSelect,
        maxSelect,
        contestantNoun: campaign.contestantNoun,
      }),
  };
}

export function sortVoteV2CampaignsByPin<T extends { pinned: boolean }>(rows: T[]): T[] {
  return [...rows].sort((left, right) => Number(right.pinned) - Number(left.pinned));
}

export function resolveVoteV2Status(campaign: Pick<VoteV2Campaign, 'startAt' | 'endAt'>, now: string): VoteV2Status {
  if (now < campaign.startAt) return '未开始';
  if (now > campaign.endAt) return '已结束';
  return '进行中';
}

export type VoteV2Cast = {
  campaignId: number;
  contestantId: number;
  userId: string;
  at: string;
};

export function voteV2PeriodBucket(period: VoteV2Period, at: string): string {
  return period === '每天' ? at.slice(0, 10) : 'all';
}

function collectVisibleDepartments(
  nodes: readonly OrgTreeNode[],
  selected: readonly string[],
  ancestorHit: boolean,
  out: Set<string>,
) {
  nodes.forEach((node) => {
    const hit = ancestorHit || selected.includes(node.value);
    if (hit) out.add(node.value);
    if (node.children?.length) collectVisibleDepartments(node.children, selected, hit, out);
  });
}

export function canSeeVoteV2(
  campaign: Pick<VoteV2Campaign, 'visibility' | 'departments'>,
  userId: string,
): boolean {
  if (campaign.visibility !== '按部门') return true;
  const department = personDepartment(userId);
  if (!department) return false;
  const visible = new Set<string>();
  collectVisibleDepartments(orgDepartmentTree, campaign.departments, false, visible);
  return visible.has(department);
}

export function canCastVoteV2(
  campaign: Pick<
    VoteV2Campaign,
    'id' | 'period' | 'quotaPerUser' | 'quotaPerContestant' | 'startAt' | 'endAt' | 'visibility' | 'departments'
  >,
  contestant: Pick<VoteV2Contestant, 'id' | 'locked'>,
  casts: VoteV2Cast[],
  userId: string,
  now: string,
): string | undefined {
  if (resolveVoteV2Status(campaign, now) !== '进行中') return '活动未在投票期';
  if (contestant.locked) return '该选项已锁定';
  if (!canSeeVoteV2(campaign, userId)) return '不在参与范围内';
  const bucket = voteV2PeriodBucket(campaign.period, now);
  const mine = casts.filter(
    (item) =>
      item.campaignId === campaign.id &&
      item.userId === userId &&
      voteV2PeriodBucket(campaign.period, item.at) === bucket,
  );
  if (mine.length >= campaign.quotaPerUser) return '已达投票上限';
  if (mine.filter((item) => item.contestantId === contestant.id).length >= campaign.quotaPerContestant) {
    return '该选项已达可投次数';
  }
  return undefined;
}

export function remainingVoteV2Quota(
  campaign: Pick<VoteV2Campaign, 'id' | 'period' | 'quotaPerUser'>,
  casts: VoteV2Cast[],
  userId: string,
  now: string,
): number {
  const bucket = voteV2PeriodBucket(campaign.period, now);
  const used = casts.filter(
    (item) =>
      item.campaignId === campaign.id &&
      item.userId === userId &&
      voteV2PeriodBucket(campaign.period, item.at) === bucket,
  ).length;
  return Math.max(0, campaign.quotaPerUser - used);
}

export const voteV2LiveChangeKinds = ['配额', '单多选', '样式', '分组'] as const;
export type VoteV2LiveChangeKind = (typeof voteV2LiveChangeKinds)[number];

function sameVoteV2Groups(left: VoteV2Campaign['groups'], right: VoteV2Campaign['groups']): boolean {
  const key = (items: VoteV2Campaign['groups']) =>
    JSON.stringify(items.map((item) => `${item.id}:${item.name}`));
  return key(left) === key(right);
}

function sameVoteV2Style(left: VoteV2Campaign, right: VoteV2Campaign): boolean {
  return (
    left.themeColor === right.themeColor &&
    left.coverKind === right.coverKind &&
    left.coverUrl === right.coverUrl &&
    left.backgroundEnabled === right.backgroundEnabled &&
    left.backgroundUrl === right.backgroundUrl &&
    left.contestantNoun === right.contestantNoun &&
    left.voteButtonNoun === right.voteButtonNoun &&
    left.voteUnit === right.voteUnit &&
    left.homeColumns === right.homeColumns &&
    left.pcHomeColumns === right.pcHomeColumns &&
    JSON.stringify(mergeVoteV2PageDisplay(left.pageDisplay)) === JSON.stringify(mergeVoteV2PageDisplay(right.pageDisplay))
  );
}

export function detectVoteV2LiveChanges(before: VoteV2Campaign, after: VoteV2Campaign): VoteV2LiveChangeKind[] {
  const kinds: VoteV2LiveChangeKind[] = [];
  if (
    before.period !== after.period ||
    before.quotaPerUser !== after.quotaPerUser ||
    before.quotaPerContestant !== after.quotaPerContestant ||
    before.minSelect !== after.minSelect ||
    before.maxSelect !== after.maxSelect
  ) {
    kinds.push('配额');
  }
  if (before.selectMode !== after.selectMode) kinds.push('单多选');
  if (!sameVoteV2Style(before, after)) kinds.push('样式');
  if (
    before.groupingEnabled !== after.groupingEnabled ||
    before.showAllGroups !== after.showAllGroups ||
    !sameVoteV2Groups(before.groups, after.groups)
  ) {
    kinds.push('分组');
  }
  return kinds;
}

export function countVoteV2BlockedVoters(
  campaign: Pick<VoteV2Campaign, 'id' | 'period' | 'quotaPerUser'>,
  casts: VoteV2Cast[],
  now: string,
): number {
  const users = [...new Set(casts.filter((item) => item.campaignId === campaign.id).map((item) => item.userId))];
  return users.filter((userId) => remainingVoteV2Quota(campaign, casts, userId, now) === 0).length;
}

export function voteV2LiveSaveImpact(input: {
  status: VoteV2Status;
  before: VoteV2Campaign;
  after: VoteV2Campaign;
  casts: VoteV2Cast[];
  now: string;
}): { title: string; lines: string[] } | undefined {
  if (input.status !== '进行中') return undefined;
  const kinds = detectVoteV2LiveChanges(input.before, input.after);
  const mine = input.casts.filter((item) => item.campaignId === input.before.id);
  if (!kinds.length || !mine.length) return undefined;
  const lines = [
    `本次修改：${kinds.join('、')}。`,
    `已产生 ${mine.length} 条投票：不重算票数，后续继续累加。`,
  ];
  if (kinds.includes('配额') || kinds.includes('单多选')) {
    const blocked = countVoteV2BlockedVoters(input.after, mine, input.now);
    lines.push(`${blocked} 人按新规则已达或超额，不能继续投；其余人按新规则可继续投。`);
  }
  if (kinds.includes('样式')) lines.push('样式仅影响展示与文案，不改历史票数。');
  if (kinds.includes('分组')) lines.push('分组仅影响选项归类与展示，不改历史票数。');
  return { title: `确认保存「${input.after.name}」的进行中修改？`, lines };
}

export function formatVoteV2CastSuccessHint(remaining: number, voteUnit: string): string {
  return `今日还可投${remaining}${voteUnit}`;
}

export type VoteV2CastAttempt = { ok: true; remaining: number } | { ok: false; reason: string };

export function voteV2CastUiFeedback(
  result: VoteV2CastAttempt,
  voteUnit: string,
): { dialogHint?: string; toast?: string } {
  if (result.ok) return { dialogHint: formatVoteV2CastSuccessHint(result.remaining, voteUnit) };
  return { toast: result.reason };
}

export type VoteV2MyRecord = {
  campaign: VoteV2Campaign;
  lastAt: string;
  used: number;
};

export function listVoteV2MyRecords(
  campaigns: VoteV2Campaign[],
  casts: VoteV2Cast[],
  userId: string,
): VoteV2MyRecord[] {
  const byCampaign = new Map<number, { lastAt: string; used: number }>();
  for (const item of casts) {
    if (item.userId !== userId) continue;
    const prev = byCampaign.get(item.campaignId);
    if (!prev) {
      byCampaign.set(item.campaignId, { lastAt: item.at, used: 1 });
      continue;
    }
    byCampaign.set(item.campaignId, {
      lastAt: item.at > prev.lastAt ? item.at : prev.lastAt,
      used: prev.used + 1,
    });
  }
  return [...byCampaign.entries()]
    .flatMap(([campaignId, meta]) => {
      const campaign = campaigns.find((row) => row.id === campaignId);
      return campaign ? [{ campaign, lastAt: meta.lastAt, used: meta.used }] : [];
    })
    .sort((left, right) => right.lastAt.localeCompare(left.lastAt));
}

export function voteV2ActionButtonLabel(
  selectMode: VoteV2SelectMode,
  voteButtonNoun: string,
  selected = false,
): string {
  if (selectMode !== '多选') return voteButtonNoun;
  return selected ? '取消' : '选择';
}

export function formatVoteV2MultiSelectSummary(count: number, voteUnit: string): string {
  return `已选${count}${voteUnit}`;
}

export function formatVoteV2MultiSelectHint(
  minSelect: number,
  maxSelect: number,
  voteUnit: string,
  voteButtonNoun: string,
): string {
  return `请选择${minSelect}-${maxSelect}${voteUnit}进行${voteButtonNoun}`;
}

export function canConfirmVoteV2Selection(count: number, minSelect: number, maxSelect: number): boolean {
  return count >= minSelect && count <= maxSelect;
}

export function toggleVoteV2Selection(
  selectedIds: number[],
  contestantId: number,
  maxSelect: number,
): { ids: number[]; blocked?: 'max' } {
  if (selectedIds.includes(contestantId)) {
    return { ids: selectedIds.filter((id) => id !== contestantId) };
  }
  if (selectedIds.length >= maxSelect) {
    return { ids: selectedIds, blocked: 'max' };
  }
  return { ids: [...selectedIds, contestantId] };
}

export function formatVoteV2RuleSummary(campaign: Pick<VoteV2Campaign, 'period' | 'selectMode' | 'quotaPerUser' | 'quotaPerContestant'>): string {
  return `${campaign.period} · ${campaign.selectMode} · 每人 ${campaign.quotaPerUser} 票 · 同一选手 ${campaign.quotaPerContestant} 票`;
}

export function formatVoteV2StatVoteLabel(voteUnit: string): string {
  return `总${voteUnit}数`;
}

export function defaultVoteV2RuleHint(input: {
  period: VoteV2Period;
  selectMode: VoteV2SelectMode;
  quotaPerUser: number;
  minSelect: number;
  maxSelect: number;
  contestantNoun: string;
}): string {
  if (input.selectMode === '单选') {
    return input.period === '每天'
      ? `每人每天可投${input.quotaPerUser}票`
      : `每人可投${input.quotaPerUser}票`;
  }
  return input.period === '每天'
    ? `每人每天可投${input.quotaPerUser}次，最少选择${input.minSelect}个选项，最多选择${input.maxSelect}个选项后提交投票`
    : `每人可投${input.quotaPerUser}次，最少选择${input.minSelect}个选项，最多选择${input.maxSelect}个选项后提交投票`;
}

export function formatVoteV2CEndRuleText(
  campaign: Pick<VoteV2Campaign, 'period' | 'selectMode' | 'quotaPerUser' | 'minSelect' | 'maxSelect' | 'ruleHint'>,
  contestantNoun: string,
): string {
  const hint = campaign.ruleHint?.trim();
  if (hint) return hint;
  return defaultVoteV2RuleHint({
    period: campaign.period,
    selectMode: campaign.selectMode,
    quotaPerUser: campaign.quotaPerUser,
    minSelect: campaign.minSelect,
    maxSelect: campaign.maxSelect,
    contestantNoun,
  });
}

export type VoteV2CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function voteV2StampMs(value: string): number {
  return new Date(value.replace(' ', 'T')).getTime();
}

export function voteV2CountdownTargetAt(startAt: string, endAt: string, nowAt: string): string {
  return nowAt < startAt ? startAt : endAt;
}

export function voteV2CountdownParts(targetAt: string, nowAt: string): VoteV2CountdownParts {
  const ms = Math.max(0, voteV2StampMs(targetAt) - voteV2StampMs(nowAt));
  const total = Math.floor(ms / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export function validateVoteV2TimeOrder(startAt: string, endAt: string): boolean {
  return startAt < endAt;
}

export function validateVoteV2SignupTime(signupEndAt: string, voteEndAt: string, signupEnabled: boolean): string | undefined {
  if (!signupEnabled) return undefined;
  if (signupEndAt > voteEndAt) return '报名结束时间不能大于活动结束时间';
  return undefined;
}

export function validateVoteV2Quotas(quotaPerUser: number, quotaPerContestant: number): string | undefined {
  if (
    !Number.isInteger(quotaPerUser) ||
    !Number.isInteger(quotaPerContestant) ||
    quotaPerUser < voteV2QuotaMin ||
    quotaPerUser > voteV2QuotaMax ||
    quotaPerContestant < voteV2QuotaMin ||
    quotaPerContestant > voteV2QuotaMax
  ) {
    return `每人票数须为 ${voteV2QuotaMin}～${voteV2QuotaMax}`;
  }
  if (quotaPerContestant > quotaPerUser) return '同一选项可投次数不能大于每人可投票数';
  return undefined;
}

export function validateVoteV2SelectRange(minSelect: number, maxSelect: number): string | undefined {
  if (
    !Number.isInteger(minSelect) ||
    !Number.isInteger(maxSelect) ||
    minSelect < voteV2QuotaMin ||
    maxSelect < voteV2QuotaMin ||
    minSelect > voteV2QuotaMax ||
    maxSelect > voteV2QuotaMax
  ) {
    return `选择数量须为 ${voteV2QuotaMin}～${voteV2QuotaMax}`;
  }
  if (minSelect > maxSelect) return '最少选择不能大于最多选择';
  return undefined;
}

export function deleteVoteV2BlockReason(status: VoteV2Status): string | null {
  if (status === '进行中') return '进行中的活动不能删除';
  if (status === '已结束') return '已结束的活动不能删除';
  return null;
}

export function canDeleteVoteV2(status: VoteV2Status): boolean {
  return deleteVoteV2BlockReason(status) == null;
}

export function canEditVoteV2Field(status: VoteV2Status, field: VoteV2EditField): boolean {
  if (status === '已结束') return false;
  if (status === '未开始') return true;
  return (
    field === 'intro' ||
    field === 'period' ||
    field === 'selectMode' ||
    field === 'quotaPerUser' ||
    field === 'quotaPerContestant' ||
    field === 'minSelect' ||
    field === 'maxSelect' ||
    field === 'ruleHint'
  );
}

export function canAddVoteV2Contestant(persisted: boolean): boolean {
  return persisted;
}

export function resolveVoteV2GroupId(groups: VoteV2Group[], name: string): number | undefined {
  const trimmed = name.trim();
  if (!trimmed) return undefined;
  return groups.find((item) => item.name === trimmed)?.id;
}
