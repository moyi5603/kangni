export const PROFILE_STORAGE_KEY = 'whgzt-me-profile';
export const PROFILE_NAV_STORAGE_KEY = 'kn-pc-profile-nav';

export const POLITICS = ['群众', '共青团员', '中共党员', '中共预备党员', '民主党派', '无党派人士'] as const;

export type EmployeeProfile = {
  name: string;
  nickname: string;
  dept: string;
  empId: string;
  org: string;
  badge: string;
  intro: string;
  politics: string;
  hometown: string;
  skills: string[];
  hobbies: string[];
  photos: string[];
  avatar: string;
  points: number;
  medals: number;
  checkinDays: number;
  unionOrg: string;
  unionRole: string;
  unionJoinedAt: string;
  partyOrg: string;
  partyRole: string;
};

export const DEFAULT_PROFILE: EmployeeProfile = {
  name: '庄珊珊',
  nickname: '珊珊',
  dept: '产品设计部',
  empId: 'WH20240018',
  org: '珊珊企业',
  badge: '初出江湖',
  intro: '关注体验细节，喜欢把复杂流程收成一条清楚的路径。',
  politics: '群众',
  hometown: '江苏南京',
  skills: ['交互设计', '用户研究'],
  hobbies: ['摄影', '徒步'],
  photos: [],
  avatar: '',
  points: 7,
  medals: 0,
  checkinDays: 0,
  unionOrg: '珊珊企业工会',
  unionRole: '会员',
  unionJoinedAt: '2024-03-10',
  partyOrg: '党总支部',
  partyRole: '委员',
};

export type ListItem = { title: string; meta: string; status: string; tone: string; href?: string };
export type InteractionItem = {
  tag: string;
  tagType: 'act' | 'news' | 'mag' | 'care';
  title: string;
  time: string;
  img?: string;
  ago?: string;
  text?: string;
};

export const PROFILE_TABS = [
  { id: 'home', label: '个人主页', clickable: true },
  { id: 'interactions', label: '我的互动', clickable: true },
  { id: 'activities', label: '我的活动', clickable: true },
  { id: 'posts', label: '我的帖子', clickable: true },
  { id: 'medals', label: '我的勋章', clickable: true },
  { id: 'care', label: '我的关怀', clickable: true },
  { id: 'circles', label: '我的兴趣圈', clickable: true },
  { id: 'votes', label: '我的投票', clickable: true },
  { id: 'help', label: '我的帮扶', clickable: false },
] as const;

export const PROFILE_TAB_LIMIT = PROFILE_TABS.length;

export const SITE_NAV = [
  { label: '首页', href: '#/c/pc' },
  { label: '工会新闻', href: '#' },
  { label: '公司活动', href: '#/c/pc' },
  { label: '劳模成果', href: '#' },
  { label: '知识百科', href: '#' },
  { label: '微刊人物', href: '#' },
  { label: '调研问卷', href: '#' },
  { label: '心声建议', href: '#' },
  { label: '人文关怀', href: '#' },
] as const;

export const USER_MENU = [
  { label: '个人主页', href: '#/c/pc/profile' },
  { label: '我的互动', href: '#/c/pc/profile/interactions' },
  { label: '我的活动', href: '#/c/pc/profile/activities' },
  { label: '我的帖子', href: '#/c/pc/profile/posts' },
  { label: '我的勋章', href: '#/c/pc/profile/medals' },
  { label: '我的关怀', href: '#/c/pc/profile/care' },
  { label: '我的兴趣圈', href: '#/c/pc/profile/circles' },
  { label: '我的投票', href: '#/c/pc/profile/votes' },
  { label: '我的帮扶' },
  { label: '我的党组织' },
  { label: '工会组织' },
  { label: '我的积分' },
  { label: '我的勋章墙', href: '#/c/pc/incentive/profile' },
] as const;

export const IX_TABS = [
  { id: 'likes', label: '点赞' },
  { id: 'favorites', label: '收藏' },
  { id: 'comments', label: '评论' },
] as const;

const img = (name: string) => `/activities/${name}`;

export const PROFILE_DEMO = {
  activities: [
    { title: '秋季职工运动会', meta: '2026-09-12 · 东区操场', status: '已报名', tone: '' },
    { title: '摄影协会沿河外拍', meta: '周六 9:00 · 南门', status: '已参加', tone: 'done' },
  ] satisfies ListItem[],
  likes: [
    { tag: '活动', tagType: 'act', title: '中秋员工晚会', time: '2026-09-16 18:20', img: img('open-day.jpg') },
    { tag: '公司活动', tagType: 'act', title: '大胃王比赛', time: '2026-09-03 11:57', img: img('checkup.jpg') },
    { tag: '活动', tagType: 'act', title: '周四篮球夜', time: '2026-09-12 19:04', img: img('basketball.jpg') },
    { tag: '工会新闻', tagType: 'news', title: '三季度劳模申报通道已开启', time: '2026-09-02 09:12', img: img('webinar.jpg') },
    { tag: '企业内刊', tagType: 'mag', title: '工人日报社评 | 数字时代班组怎么把经验留下来', time: '2026-09-03 11:57', img: img('share.jpg') },
    { tag: '活动', tagType: 'act', title: '秋季职工运动会开始报名', time: '2026-08-28 16:40', img: img('onboarding.jpg') },
  ] satisfies InteractionItem[],
  favorites: [
    { tag: '活动', tagType: 'act', title: '中秋员工晚会', time: '2026-09-15 10:08', img: img('open-day.jpg') },
    { tag: '工会新闻', tagType: 'news', title: '三季度劳模申报通道已开启', time: '2026-09-02 09:12', img: img('webinar.jpg') },
    { tag: '活动', tagType: 'act', title: '周四篮球夜', time: '2026-09-11 21:16', img: img('basketball.jpg') },
    { tag: '企业内刊', tagType: 'mag', title: '把夹具行程改短 8 毫米', time: '2026-08-28 16:40', img: img('share.jpg') },
    { tag: '公司活动', tagType: 'act', title: '大胃王比赛', time: '2026-08-20 14:33', img: img('checkup.jpg') },
  ] satisfies InteractionItem[],
  comments: [
    {
      tag: '活动',
      tagType: 'act',
      title: '中秋员工晚会',
      time: '2026-09-16 18:22',
      ago: '几秒前',
      text: '晚会报名截止前提个醒，班组还差两个名额。',
      img: img('open-day.jpg'),
    },
    {
      tag: '公司活动',
      tagType: 'act',
      title: '大胃王比赛',
      time: '2026-09-03 11:57',
      ago: '几秒前',
      text: '评论一下',
      img: img('checkup.jpg'),
    },
    {
      tag: '活动',
      tagType: 'act',
      title: '周四篮球夜',
      time: '2026-09-12 20:11',
      ago: '昨天',
      text: '这周球馆空调修好了，人会多一些。',
      img: img('basketball.jpg'),
    },
    {
      tag: '工会新闻',
      tagType: 'news',
      title: '中秋慰问礼包本周起可预约',
      time: '2026-09-03 10:20',
      ago: '2分钟前',
      text: '评论一下挺好的',
      img: img('webinar.jpg'),
    },
    {
      tag: '企业内刊',
      tagType: 'mag',
      title: '把夹具行程改短 8 毫米',
      time: '2026-08-29 09:40',
      ago: '上周',
      text: '这条改动一线能直接套，省了换型时间。',
      img: img('share.jpg'),
    },
  ] satisfies InteractionItem[],
  votes: [
    { title: '食堂服务评价还差你一票', meta: '截止 09-30 · 得 20 积分', status: '待填写', tone: 'warn' },
    { title: '三季度员工满意度调研', meta: '截止 09-15 · 得 50 积分', status: '已提交', tone: 'done' },
  ] satisfies ListItem[],
  circles: [
    { title: '摄影协会', meta: '32 人 · 本周六沿河外拍', status: '已加入', tone: '' },
    { title: '羽毛球兴趣小组', meta: '18 人 · 周三下班东区活动室', status: '已加入', tone: 'done' },
  ] satisfies ListItem[],
  help: [
    { title: '困难帮扶申报', meta: '材料清单与时限已更新', status: '可申请', tone: '' },
  ] satisfies ListItem[],
};

export function tenureDays(iso: string): number {
  const start = new Date(`${iso || '2024-03-10'}T00:00:00`);
  return Math.max(1, Math.floor((Date.now() - start.getTime()) / 86400000));
}

export function cloneProfile(src: EmployeeProfile): EmployeeProfile {
  return {
    ...src,
    skills: [...src.skills],
    hobbies: [...src.hobbies],
    photos: [...src.photos],
  };
}

export function loadProfile(): EmployeeProfile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return cloneProfile(DEFAULT_PROFILE);
    const parsed = JSON.parse(raw) as Partial<EmployeeProfile>;
    return { ...cloneProfile(DEFAULT_PROFILE), ...parsed, skills: parsed.skills ?? DEFAULT_PROFILE.skills, hobbies: parsed.hobbies ?? DEFAULT_PROFILE.hobbies, photos: parsed.photos ?? [] };
  } catch {
    return cloneProfile(DEFAULT_PROFILE);
  }
}

export function saveProfile(profile: EmployeeProfile) {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}
