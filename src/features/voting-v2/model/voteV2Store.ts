import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { defaultVoteV2Campaign, defaultVoteV2Contestant, nextVoteV2OptionNo, canCastVoteV2, remainingVoteV2Quota, type VoteV2Campaign, type VoteV2Cast, type VoteV2Contestant, type VoteV2InviteCode } from './voteV2';

function stamp(days: number, time = '09:00:00'): string {
  const [hour, minute, second] = time.split(':').map(Number);
  return dayjs().add(days, 'day').hour(hour).minute(minute).second(second).format('YYYY-MM-DD HH:mm:ss');
}

const initialCampaigns: VoteV2Campaign[] = [
  defaultVoteV2Campaign({
    id: 1,
    name: '部门十佳员工评选',
    startAt: stamp(3, '09:00:00'),
    endAt: stamp(10, '18:00:00'),
    intro: '评选本季度各部门十佳员工。保存发布后可添加选项。',
    period: '每天',
    selectMode: '单选',
    quotaPerUser: 1,
    quotaPerContestant: 1,
    createdAt: stamp(-5, '10:00:00'),
    viewCount: 1280,
    groupingEnabled: true,
    groups: [
      { id: 1, name: '生产组' },
      { id: 2, name: '职能组' },
    ],
  }),
  defaultVoteV2Campaign({
    id: 2,
    name: '车间安全之星',
    startAt: stamp(-2, '09:00:00'),
    endAt: stamp(5, '18:00:00'),
    intro: '为安全生产月投票。',
    period: '总共',
    selectMode: '单选',
    quotaPerUser: 3,
    quotaPerContestant: 1,
    createdAt: stamp(-10, '11:00:00'),
    viewCount: 3560,
    signupEnabled: true,
    coverUrl: '/activities/share.jpg',
    themeColor: '#e54242',
    homeColumns: 2,
    pcHomeColumns: 3,
    pinned: true,
  }),
  defaultVoteV2Campaign({
    id: 3,
    name: '年度优秀作品展',
    startAt: stamp(-20, '09:00:00'),
    endAt: stamp(-3, '18:00:00'),
    intro: '<p>本届作品展已结束，结果仅供查阅。</p>',
    period: '每天',
    selectMode: '单选',
    quotaPerUser: 1,
    quotaPerContestant: 1,
    createdAt: stamp(-30, '09:30:00'),
    viewCount: 8920,
    coverUrl: '/activities/basketball.jpg',
    themeColor: '#31cab1',
    contestantNoun: '作品',
    voteButtonNoun: '点赞',
    voteUnit: '赞',
    homeColumns: 1,
  }),
  defaultVoteV2Campaign({
    id: 4,
    name: '食堂本周菜品',
    startAt: stamp(-1, '08:00:00'),
    endAt: stamp(6, '20:00:00'),
    intro: '<p>为下周菜单投票，每人每天 1 票。</p>',
    period: '每天',
    selectMode: '单选',
    quotaPerUser: 1,
    quotaPerContestant: 1,
    createdAt: stamp(-4, '14:00:00'),
    viewCount: 640,
    coverUrl: '/activities/open-day.jpg',
    themeColor: '#ff8939',
    homeColumns: 3,
    pcHomeColumns: 4,
    groupingEnabled: false,
  }),
  defaultVoteV2Campaign({
    id: 5,
    name: '班组擂台赛',
    startAt: stamp(-1, '09:00:00'),
    endAt: stamp(8, '18:00:00'),
    intro: '<p>各班组对决，默认进入第一组。</p>',
    period: '每天',
    selectMode: '单选',
    quotaPerUser: 2,
    quotaPerContestant: 1,
    createdAt: stamp(-6, '16:00:00'),
    viewCount: 2100,
    coverUrl: '/activities/webinar.jpg',
    themeColor: '#7b61ff',
    groupingEnabled: true,
    showAllGroups: false,
    groupColumns: 2,
    groups: [
      { id: 1, name: '甲班' },
      { id: 2, name: '乙班' },
    ],
    homeColumns: 2,
    visibility: '按部门',
    departments: ['生产中心'],
  }),
  defaultVoteV2Campaign({
    id: 6,
    name: '新员工风采（草稿）',
    startAt: stamp(12, '09:00:00'),
    endAt: stamp(20, '18:00:00'),
    intro: '',
    createdAt: stamp(-1, '09:00:00'),
    viewCount: 0,
    coverUrl: '',
    backgroundEnabled: true,
    backgroundUrl: '/activities/share.jpg',
    themeColor: '#ffb712',
  }),
  defaultVoteV2Campaign({
    id: 7,
    name: '静默结果页',
    startAt: stamp(-15, '09:00:00'),
    endAt: stamp(-1, '18:00:00'),
    intro: '<p>不展示介绍与投票按钮。</p>',
    createdAt: stamp(-18, '11:00:00'),
    viewCount: 4400,
    coverUrl: '/activities/checkup.jpg',
    themeColor: '#1dc47b',
    pageDisplay: {
      activityName: true,
      activityStats: false,
      totalVotes: false,
      countdown: false,
      voteTime: false,
      voteRules: false,
      intro: false,
      search: false,
      groups: false,
      contestantNo: true,
      contestantCover: true,
      contestantName: true,
      contestantSubtitle: false,
      contestantVotes: true,
      voteButton: false,
      detailButton: true,
    },
  }),
  defaultVoteV2Campaign({
    id: 8,
    name: '一线匠心人物',
    startAt: stamp(-1, '09:00:00'),
    endAt: stamp(7, '18:00:00'),
    intro: '<p>横向一列展示师傅故事，为带教标兵投票。</p>',
    period: '总共',
    selectMode: '单选',
    quotaPerUser: 1,
    quotaPerContestant: 1,
    createdAt: stamp(-3, '10:00:00'),
    viewCount: 980,
    coverUrl: '/activities/webinar.jpg',
    themeColor: '#1dc47b',
    homeColumns: 1,
    pcHomeColumns: 5,
    groupingEnabled: false,
    visibility: '全员',
  }),
];

const initialContestants: VoteV2Contestant[] = [
  defaultVoteV2Contestant({
    id: 1,
    campaignId: 2,
    optionNo: 1,
    name: '张工',
    subtitle: '连续三年零事故',
    imageUrl: '/activities/onboarding.jpg',
    description: '连续三年零事故。',
    voteCount: 128,
  }),
  defaultVoteV2Contestant({
    id: 2,
    campaignId: 2,
    optionNo: 2,
    name: '李班',
    subtitle: '班组日检全覆盖',
    imageUrl: '/activities/checkup.jpg',
    description: '班组日检全覆盖。',
    voteCount: 96,
  }),
  defaultVoteV2Contestant({
    id: 3,
    campaignId: 2,
    optionNo: 3,
    name: '王姐',
    subtitle: '隐患随手拍',
    imageUrl: '/activities/share.jpg',
    description: '隐患随手拍，整改不过夜。',
    voteCount: 84,
  }),
  defaultVoteV2Contestant({
    id: 4,
    campaignId: 2,
    optionNo: 4,
    name: '赵师傅',
    subtitle: '新员工带教',
    imageUrl: '/activities/webinar.jpg',
    description: '带教新员工过安全关。',
    voteCount: 71,
  }),
  defaultVoteV2Contestant({
    id: 5,
    campaignId: 1,
    optionNo: 1,
    groupId: 1,
    name: '陈晨',
    subtitle: '装配一线',
    imageUrl: '/activities/basketball.jpg',
    description: '装配一线标兵。',
    voteCount: 56,
  }),
  defaultVoteV2Contestant({
    id: 6,
    campaignId: 1,
    optionNo: 2,
    groupId: 1,
    name: '周宁',
    subtitle: '质量巡检',
    imageUrl: '/activities/checkup.jpg',
    description: '质量巡检零漏项。',
    voteCount: 48,
  }),
  defaultVoteV2Contestant({
    id: 7,
    campaignId: 1,
    optionNo: 3,
    groupId: 1,
    name: '吴磊',
    subtitle: '仓储配送',
    imageUrl: '/activities/open-day.jpg',
    description: '仓储配送准时达。',
    voteCount: 41,
  }),
  defaultVoteV2Contestant({
    id: 8,
    campaignId: 1,
    optionNo: 4,
    groupId: 2,
    name: '郑华',
    subtitle: '人事行政',
    imageUrl: '/activities/onboarding.jpg',
    description: '人事行政服务口碑。',
    voteCount: 39,
  }),
  defaultVoteV2Contestant({
    id: 9,
    campaignId: 1,
    optionNo: 5,
    groupId: 2,
    name: '孙悦',
    subtitle: '财务共享',
    imageUrl: '/activities/webinar.jpg',
    description: '财务共享效率高。',
    voteCount: 33,
  }),
  defaultVoteV2Contestant({
    id: 10,
    campaignId: 1,
    optionNo: 6,
    name: '林可',
    subtitle: '跨部门协作',
    imageUrl: '/activities/share.jpg',
    description: '未分组跨部门协作。',
    voteCount: 22,
  }),
  defaultVoteV2Contestant({
    id: 11,
    campaignId: 3,
    optionNo: 1,
    name: '夜跑纪实',
    subtitle: '滨江长曝光',
    imageUrl: '/activities/onboarding.jpg',
    description: '年度摄影组一等奖。',
    voteCount: 320,
  }),
  defaultVoteV2Contestant({
    id: 12,
    campaignId: 3,
    optionNo: 2,
    name: '车间速写',
    subtitle: '产线水彩',
    imageUrl: '/activities/basketball.jpg',
    description: '年度绘画组二等奖。',
    voteCount: 210,
  }),
  defaultVoteV2Contestant({
    id: 13,
    campaignId: 4,
    optionNo: 1,
    name: '红烧排骨',
    subtitle: '本周热门',
    imageUrl: '/activities/open-day.jpg',
    description: '甜咸适中。',
    voteCount: 88,
  }),
  defaultVoteV2Contestant({
    id: 14,
    campaignId: 4,
    optionNo: 2,
    name: '清炒时蔬',
    subtitle: '清淡',
    imageUrl: '/activities/checkup.jpg',
    description: '时令青菜。',
    voteCount: 54,
  }),
  defaultVoteV2Contestant({
    id: 15,
    campaignId: 4,
    optionNo: 3,
    name: '番茄牛腩',
    subtitle: '招牌',
    imageUrl: '/activities/share.jpg',
    description: '慢炖入味。',
    voteCount: 76,
  }),
  defaultVoteV2Contestant({
    id: 24,
    campaignId: 4,
    optionNo: 4,
    name: '黄焖鸡米饭',
    subtitle: '家常',
    imageUrl: '/activities/basketball.jpg',
    description: '酱香下饭。',
    voteCount: 61,
  }),
  defaultVoteV2Contestant({
    id: 25,
    campaignId: 4,
    optionNo: 5,
    name: '紫菜蛋花汤',
    subtitle: '例汤',
    imageUrl: '/activities/webinar.jpg',
    description: '清淡开胃。',
    voteCount: 39,
  }),
  defaultVoteV2Contestant({
    id: 26,
    campaignId: 4,
    optionNo: 6,
    name: '红油抄手',
    subtitle: '小吃',
    imageUrl: '/activities/onboarding.jpg',
    description: '微辣鲜香。',
    voteCount: 47,
  }),
  defaultVoteV2Contestant({
    id: 16,
    campaignId: 5,
    optionNo: 1,
    groupId: 1,
    name: '甲班·焊一',
    subtitle: '连续零事故',
    imageUrl: '/activities/webinar.jpg',
    description: '甲班代表。',
    voteCount: 40,
  }),
  defaultVoteV2Contestant({
    id: 17,
    campaignId: 5,
    optionNo: 2,
    groupId: 1,
    name: '甲班·装配',
    subtitle: '节拍稳定',
    imageUrl: '/activities/onboarding.jpg',
    description: '已锁定，不可再投。',
    voteCount: 28,
    locked: true,
  }),
  defaultVoteV2Contestant({
    id: 18,
    campaignId: 5,
    optionNo: 3,
    groupId: 2,
    name: '乙班·质检',
    subtitle: '一次交检',
    imageUrl: '/activities/checkup.jpg',
    description: '乙班代表。',
    voteCount: 36,
  }),
  defaultVoteV2Contestant({
    id: 19,
    campaignId: 7,
    optionNo: 1,
    name: '方案甲',
    imageUrl: '/activities/share.jpg',
    description: '仅展示票数。',
    voteCount: 190,
  }),
  defaultVoteV2Contestant({
    id: 20,
    campaignId: 7,
    optionNo: 2,
    name: '方案乙',
    imageUrl: '/activities/open-day.jpg',
    description: '仅展示票数。',
    voteCount: 165,
  }),
  defaultVoteV2Contestant({
    id: 21,
    campaignId: 8,
    optionNo: 1,
    name: '刘师傅',
    subtitle: '钳工带教 12 年',
    imageUrl: '/activities/onboarding.jpg',
    description: '把安全手法拆成口令，新员工一周上手。',
    voteCount: 62,
  }),
  defaultVoteV2Contestant({
    id: 22,
    campaignId: 8,
    optionNo: 2,
    name: '何姐',
    subtitle: '装配线导师',
    imageUrl: '/activities/checkup.jpg',
    description: '节拍不抢、质量不让，带出两届冠军班。',
    voteCount: 51,
  }),
  defaultVoteV2Contestant({
    id: 23,
    campaignId: 8,
    optionNo: 3,
    name: '马工',
    subtitle: '设备保全',
    imageUrl: '/activities/share.jpg',
    description: '夜间抢修不过夜，徒弟跟岗必过三关。',
    voteCount: 44,
  }),
  defaultVoteV2Contestant({
    id: 27,
    campaignId: 8,
    optionNo: 4,
    name: '孙师傅',
    subtitle: '模具钳工',
    imageUrl: '/activities/basketball.jpg',
    description: '模具修到微米级，徒弟对表过关。',
    voteCount: 38,
  }),
  defaultVoteV2Contestant({
    id: 28,
    campaignId: 8,
    optionNo: 5,
    name: '钱姐',
    subtitle: '物流班长',
    imageUrl: '/activities/open-day.jpg',
    description: '夜班配送不误点，新人也跟得上。',
    voteCount: 33,
  }),
  defaultVoteV2Contestant({
    id: 29,
    campaignId: 8,
    optionNo: 6,
    name: '周工',
    subtitle: '电气调试',
    imageUrl: '/activities/webinar.jpg',
    description: '新线点亮不过夜，带教先过安全关。',
    voteCount: 29,
  }),
];

let campaigns = [...initialCampaigns];
let contestants = [...initialContestants];
let inviteCodes: VoteV2InviteCode[] = [];
const initialCasts: VoteV2Cast[] = [
  { campaignId: 2, contestantId: 1, userId: '李明', at: stamp(-1, '09:12:00') },
  { campaignId: 2, contestantId: 2, userId: '李明', at: stamp(-1, '09:12:00') },
  { campaignId: 2, contestantId: 3, userId: '李明', at: stamp(-1, '09:12:00') },
  { campaignId: 2, contestantId: 1, userId: '王芳', at: stamp(-1, '10:05:00') },
  { campaignId: 2, contestantId: 4, userId: '王芳', at: stamp(-1, '10:05:00') },
  { campaignId: 2, contestantId: 2, userId: '苏然', at: stamp(-1, '11:20:00') },
  { campaignId: 2, contestantId: 3, userId: '苏然', at: stamp(-1, '11:20:00') },
  { campaignId: 2, contestantId: 1, userId: '孙新', at: stamp(0, '08:40:00') },
  { campaignId: 2, contestantId: 2, userId: '孙新', at: stamp(0, '08:40:00') },
  { campaignId: 2, contestantId: 4, userId: '孙新', at: stamp(0, '08:40:00') },
  { campaignId: 2, contestantId: 3, userId: '黄码', at: stamp(0, '09:15:00') },
  { campaignId: 3, contestantId: 11, userId: '张悦', at: stamp(-10, '12:00:00') },
  { campaignId: 3, contestantId: 12, userId: '李明', at: stamp(-12, '14:22:00') },
  { campaignId: 3, contestantId: 11, userId: '王芳', at: stamp(-11, '09:08:00') },
  { campaignId: 3, contestantId: 11, userId: '何研', at: stamp(-8, '16:33:00') },
  { campaignId: 3, contestantId: 12, userId: '林浅', at: stamp(-7, '11:11:00') },
  { campaignId: 3, contestantId: 11, userId: '赵人事', at: stamp(-6, '10:02:00') },
  { campaignId: 4, contestantId: 13, userId: '李明', at: stamp(-1, '12:01:00') },
  { campaignId: 4, contestantId: 15, userId: '李明', at: stamp(0, '08:20:00') },
  { campaignId: 4, contestantId: 14, userId: '王芳', at: stamp(0, '08:45:00') },
  { campaignId: 4, contestantId: 13, userId: '丁码', at: stamp(0, '09:10:00') },
  { campaignId: 5, contestantId: 16, userId: '周工', at: stamp(0, '09:30:00') },
  { campaignId: 5, contestantId: 18, userId: '周工', at: stamp(0, '09:30:00') },
  { campaignId: 5, contestantId: 16, userId: '马装', at: stamp(0, '10:00:00') },
  { campaignId: 5, contestantId: 17, userId: '韩装', at: stamp(0, '10:18:00') },
  { campaignId: 5, contestantId: 18, userId: '韩装', at: stamp(0, '10:18:00') },
  { campaignId: 5, contestantId: 18, userId: '吴检', at: stamp(0, '11:05:00') },
  { campaignId: 7, contestantId: 19, userId: '陈产品', at: stamp(-10, '15:00:00') },
  { campaignId: 7, contestantId: 20, userId: '林销', at: stamp(-9, '16:40:00') },
  { campaignId: 8, contestantId: 21, userId: '张悦', at: stamp(0, '09:20:00') },
  { campaignId: 8, contestantId: 22, userId: '李明', at: stamp(0, '10:05:00') },
];

let casts: VoteV2Cast[] = [...initialCasts];
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

export function __resetVoteV2StoreForTests() {
  campaigns = initialCampaigns.map((item) => ({
    ...item,
    groups: item.groups.map((group) => ({ ...group })),
    signupFields: item.signupFields.map((field) => ({ ...field })),
  }));
  contestants = initialContestants.map((item) => ({ ...item }));
  inviteCodes = [];
  casts = [...initialCasts];
  emit();
}

export function useVoteV2Campaigns() {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((n) => n + 1)), []);
  return campaigns;
}

export function useVoteV2Contestants(campaignId?: number) {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((n) => n + 1)), []);
  if (!campaignId) return [];
  return contestants.filter((item) => item.campaignId === campaignId);
}

export function useAllVoteV2Contestants() {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((n) => n + 1)), []);
  return contestants;
}

export function useVoteV2InviteCodes(campaignId?: number) {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((n) => n + 1)), []);
  if (!campaignId) return [];
  return inviteCodes.filter((item) => item.campaignId === campaignId);
}

export function getVoteV2Campaigns() {
  return campaigns;
}

export function getVoteV2(id: number) {
  return campaigns.find((item) => item.id === id);
}

export function incrementVoteV2ViewCount(id: number) {
  const campaign = campaigns.find((item) => item.id === id);
  if (!campaign) return undefined;
  const next = { ...campaign, viewCount: campaign.viewCount + 1 };
  campaigns = campaigns.map((item) => (item.id === id ? next : item));
  emit();
  return next;
}

export function useVoteV2(id: number) {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((n) => n + 1)), []);
  return campaigns.find((item) => item.id === id);
}

export function nextVoteV2Id() {
  return campaigns.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

export function upsertVoteV2(record: VoteV2Campaign) {
  const next = defaultVoteV2Campaign(record);
  const index = campaigns.findIndex((item) => item.id === record.id);
  if (index === -1) {
    campaigns = [...campaigns, next];
  } else {
    campaigns = campaigns.map((item) => (item.id === record.id ? next : item));
  }
  emit();
  return next;
}

export function removeVoteV2(id: number) {
  campaigns = campaigns.filter((item) => item.id !== id);
  contestants = contestants.filter((item) => item.campaignId !== id);
  inviteCodes = inviteCodes.filter((item) => item.campaignId !== id);
  emit();
}

export function getVoteV2Contestants(campaignId: number) {
  return contestants.filter((item) => item.campaignId === campaignId);
}

export function getAllVoteV2Contestants() {
  return contestants;
}

export function nextVoteV2ContestantId() {
  return contestants.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

export function upsertVoteV2Contestant(record: Pick<VoteV2Contestant, 'id' | 'campaignId' | 'name'> & Partial<VoteV2Contestant>) {
  const next = defaultVoteV2Contestant(record);
  const index = contestants.findIndex((item) => item.id === next.id);
  if (index === -1) contestants = [...contestants, next];
  else contestants = contestants.map((item) => (item.id === next.id ? next : item));
  emit();
  return next;
}

export function patchVoteV2Contestants(ids: number[], patch: Partial<VoteV2Contestant>) {
  const set = new Set(ids);
  contestants = contestants.map((item) => {
    if (!set.has(item.id)) return item;
    const merged = { ...item, ...patch };
    if ('groupId' in patch && patch.groupId == null) delete merged.groupId;
    return defaultVoteV2Contestant(merged);
  });
  emit();
}

export function removeVoteV2Contestants(ids: number[]) {
  const set = new Set(ids);
  contestants = contestants.filter((item) => !set.has(item.id));
  emit();
}

export function importVoteV2Contestants(campaignId: number, rows: Array<Pick<VoteV2Contestant, 'name'> & Partial<VoteV2Contestant>>) {
  let nextId = nextVoteV2ContestantId();
  let nextNo = nextVoteV2OptionNo(contestants.filter((item) => item.campaignId === campaignId));
  const imported = rows.map((row) => {
    const optionNo = row.optionNo && row.optionNo > 0 ? row.optionNo : nextNo;
    if (!row.optionNo || row.optionNo <= 0) nextNo += 1;
    else nextNo = Math.max(nextNo, optionNo + 1);
    const record = defaultVoteV2Contestant({
      ...row,
      id: nextId,
      campaignId,
      name: row.name,
      optionNo,
    });
    nextId += 1;
    return record;
  });
  contestants = [...contestants, ...imported];
  emit();
  return imported;
}

export function getVoteV2Casts() {
  return casts;
}

export function useVoteV2Casts() {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((n) => n + 1)), []);
  return casts;
}

export function castVoteV2(campaignId: number, contestantId: number, userId: string, now: string) {
  return castVoteV2Many(campaignId, [contestantId], userId, now);
}

export function castVoteV2Many(campaignId: number, contestantIds: number[], userId: string, now: string) {
  const campaign = getVoteV2(campaignId);
  if (!campaign) return { ok: false as const, reason: '选项不存在' };
  const unique = [...new Set(contestantIds)];
  if (unique.length !== 1) {
    return { ok: false as const, reason: '请选择1项' };
  }
  let nextCasts = casts;
  let nextContestants = contestants;
  for (const contestantId of unique) {
    const contestant = nextContestants.find((item) => item.id === contestantId && item.campaignId === campaignId);
    if (!contestant) return { ok: false as const, reason: '选项不存在' };
    const reason = canCastVoteV2(campaign, contestant, nextCasts, userId, now);
    if (reason) return { ok: false as const, reason };
    nextContestants = nextContestants.map((item) =>
      item.id === contestantId ? { ...item, voteCount: item.voteCount + 1 } : item,
    );
    nextCasts = [...nextCasts, { campaignId, contestantId, userId, at: now }];
  }
  contestants = nextContestants;
  casts = nextCasts;
  emit();
  return { ok: true as const, remaining: remainingVoteV2Quota(campaign, casts, userId, now) };
}

export function removeVoteV2Contestant(id: number) {
  contestants = contestants.filter((item) => item.id !== id);
  emit();
}

export function getVoteV2InviteCodes(campaignId: number) {
  return inviteCodes.filter((item) => item.campaignId === campaignId);
}

export function generateVoteV2InviteCodes(campaignId: number, count: number) {
  const next: VoteV2InviteCode[] = [];
  const start = inviteCodes.reduce((max, item) => Math.max(max, item.id), 0);
  for (let i = 1; i <= count; i += 1) {
    next.push({
      id: start + i,
      campaignId,
      code: `INV${campaignId}${String(start + i).padStart(4, '0')}`,
      used: false,
    });
  }
  inviteCodes = [...inviteCodes, ...next];
  emit();
  return next;
}

export function clearVoteV2InviteCodes(campaignId: number) {
  inviteCodes = inviteCodes.filter((item) => item.campaignId !== campaignId);
  emit();
}
