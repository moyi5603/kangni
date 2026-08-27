import type { CSSProperties, MouseEvent, ReactNode } from 'react';

export const ICONS: Record<string, string> = {
  plus: 'M12 5v14M5 12h14',
  ticket: 'M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 2 2 0 0 0 0-4zM14 6v12',
  star: 'M12 3.5l2.6 5.6 6 .7-4.4 4.2 1.2 6L12 17.7 6.6 20l1.2-6L3.4 9.8l6-.7z',
  zap: 'M13 3 4 14h6l-1 7 9-11h-6z',
  heart: 'M12 20s-7-4.6-9.3-9.2C1.2 7.6 3 4.5 6.2 4.5c2 0 3.2 1.2 3.8 2.3.6-1.1 1.8-2.3 3.8-2.3 3.2 0 5 3.1 3.5 6.3C19 15.4 12 20 12 20z',
  calendar: 'M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19zM4 9.5h16M8 3.5v3M16 3.5v3',
  repeat: 'M4 9a5 5 0 0 1 5-5h8l-2.5-2.5M20 15a5 5 0 0 1-5 5H7l2.5 2.5M17 4l2.5 2.5L17 9M7 20l-2.5-2.5L7 15',
  series: 'M4 7h10M4 12h13M4 17h7M19 5v6m0 0 2.2-2.2M19 11l-2.2-2.2',
  pin: 'M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11zM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  chevR: 'M9 6l6 6-6 6',
  chevD: 'M6 9l6 6 6-6',
  chevU: 'M6 15l6-6 6 6',
  userPlus: 'M14 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-3A3.5 3.5 0 0 0 4 17.5V19M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM18 8v6M21 11h-6',
  check: 'M5 12.5l4.5 4.5L19 7',
  bookmark: 'M6 4h12v17l-6-4-6 4z',
  trending: 'M3 17l5-5 3.5 3.5L20 8M20 8h-4M20 8v4',
  users: 'M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM20 19v-1.5a3.5 3.5 0 0 0-2.6-3.4M15 4.1a3.5 3.5 0 0 1 0 6.8',
  dots: 'M5 12h.01M12 12h.01M19 12h.01',
  mic: 'M12 15a3.5 3.5 0 0 0 3.5-3.5V7a3.5 3.5 0 1 0-7 0v4.5A3.5 3.5 0 0 0 12 15zM5.5 11.5a6.5 6.5 0 0 0 13 0M12 18.5V21',
  back: 'M15 6l-6 6 6 6',
  x: 'M6 6l12 12M18 6 6 18',
  send: 'M4 12l16-8-6 16-2.2-6.6L4 12z',
  camera: 'M4 8h3l2-2.5h6L17 8h3v11H4zM12 17a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 12 17z',
  image: 'M4 5h16v14H4zM4 16l4.2-4.2 3 3 3.5-4.4L20 16',
  clock: 'M12 7v5.2l3.2 1.8M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20.5 20.5 16.2 16.2',
  list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  edit: 'M4 17.5V20h2.5L18 8.5 15.5 6 4 17.5zM13.6 7.9l2.5 2.5',
  user: 'M12 12a3.6 3.6 0 1 0 0-7.2A3.6 3.6 0 0 0 12 12zM5.5 19.2c.8-3 3.4-4.7 6.5-4.7s5.7 1.7 6.5 4.7',
};

const CARDS_LAYERS = [
  { d: 'M12 1.8 20.5 4.6 17.2 18.2 8.7 15.4Z', front: false },
  { d: 'M4.5 6.2A1.5 1.5 0 0 1 6 4.7h9.2A1.5 1.5 0 0 1 16.7 6.2v13.1A1.5 1.5 0 0 1 15.2 20.8H6A1.5 1.5 0 0 1 4.5 19.3z', front: true },
  { d: 'M10.8 10.8c1.4-1.7 3.9-1.4 3.9 1.35 0 2.1-2.15 3.75-3.9 5-1.75-1.25-3.9-2.9-3.9-5 0-2.75 2.5-3.05 3.9-1.35z', front: false },
];

const GRADS = [
  ['oklch(0.78 0.15 45)', 'oklch(0.7 0.18 18)'],
  ['oklch(0.82 0.14 80)', 'oklch(0.72 0.16 40)'],
  ['oklch(0.78 0.13 150)', 'oklch(0.72 0.15 195)'],
  ['oklch(0.76 0.15 330)', 'oklch(0.7 0.17 0)'],
  ['oklch(0.8 0.13 250)', 'oklch(0.72 0.16 300)'],
  ['oklch(0.82 0.14 95)', 'oklch(0.74 0.16 135)'],
] as const;

export const AVATAR_HUES = [36, 66, 155, 330, 265, 22, 230, 110];
export const NAMES = ['林浅', '陈航', '苏曼', '江野', '周棠', '许墨', '沈星', '何夕', '顾乔', '叶蓁'];
export const ME = '林浅';

export const CATS = {
  sport: { label: '运动健身', icon: 'zap', color: 'var(--c-sport)' },
  learning: { label: '学习充电', icon: 'bookmark', color: 'var(--c-reading)' },
  career: { label: '职场成长', icon: 'trending', color: 'var(--c-photo)' },
  team: { label: '团队拓展', icon: 'users', color: 'var(--c-outdoor)' },
  volunteer: { label: '公益志愿', icon: 'heart', color: 'var(--c-food)' },
  game: { label: '桌游电竞', icon: 'cards', color: 'var(--c-game)' },
  movie: { label: '电影音乐', icon: 'ticket', color: 'var(--c-music)' },
  other: { label: '其他', icon: 'dots', color: 'var(--c-other)' },
} as const;

export type CatKey = keyof typeof CATS;
export type ActType = 'once' | 'recurring' | 'series';
export type ActTab = 'rec' | 'latest' | 'hot';
export type ActStatus = 'upcoming' | 'ended' | 'cancelled';
export type JoinMode = 'free' | 'approve';

export type ActSession = {
  id: string;
  date: string;
  time: string;
  cap: number;
  signed: number;
  joinedByMe: boolean;
};

export type Group = {
  id: string;
  name: string;
  cat: CatKey;
  lead: string;
  members: number;
  acts: number;
  joined: boolean;
  pending?: boolean;
  join: JoinMode;
  intro: string;
  tags: string[];
  area: string;
  hot?: boolean;
  auditStatus?: '待审核' | '已通过' | '已驳回' | '无需审核';
  createdByMe?: boolean;
};

export type Act = {
  id: string;
  gid: string;
  title: string;
  cat: CatKey;
  type: ActType;
  when: string;
  dateKey: number;
  daysBadge?: string;
  loc: string;
  host: string;
  signed: number;
  cap: number;
  likes: number;
  liked?: boolean;
  joinedByMe: boolean;
  createdByMe?: boolean;
  recReason?: string;
  status: ActStatus;
  desc: string;
  tags: string[];
  sessions?: ActSession[];
  signupStatus?: '待审核' | '已通过' | '已驳回';
};

export type Moment = {
  id: string;
  aid: string;
  gid: string;
  author: string;
  text: string;
  imgs: string[];
  likes: number;
  liked?: boolean;
  time: string;
};

export type IgScreenName =
  | 'aichat'
  | 'myActivities'
  | 'myGroups'
  | 'allActs'
  | 'allGroups'
  | 'createGroup'
  | 'createAct'
  | 'activity'
  | 'group'
  | 'moments'
  | 'post';

export type IgRoute = {
  name: IgScreenName;
  params: {
    aid?: string;
    gid?: string;
    pickEnroll?: boolean;
    pickEnrollIntent?: 'cancel' | 'adjust';
  };
};

function sessions(actId: string, dates: string[], time: string, cap: number, firstSigned: number, joinedFirst: boolean): ActSession[] {
  return dates.slice(0, 5).map((date, i) => ({
    id: `${actId}-s${i + 1}`,
    date,
    time,
    cap,
    signed: Math.max(0, Math.round(firstSigned * Math.pow(0.55, i))),
    joinedByMe: i === 0 && joinedFirst,
  }));
}

export const GROUPS: Group[] = [
  { id: 'g1', name: '城市夜跑团', cat: 'sport', lead: '江野', members: 128, acts: 24, join: 'free', joined: true, tags: ['每周三场', '零基础友好', '配速分组'], area: '总部 · 滨江园区', intro: '下班后甩开屏幕,用脚步丈量城市。我们按配速分组,从 6′30″ 到 5′00″ 都有搭子,跑完一起撸串复盘。', hot: true },
  { id: 'g2', name: '周末徒步野行', cat: 'sport', lead: '苏曼', members: 96, acts: 18, join: 'free', joined: true, tags: ['周末出行', '装备互助', 'AA 拼车'], area: '近郊 · 多线路', intro: '逃离工位,走进山野。每月 2-3 条线路,从溪谷轻徒步到登顶看日出,领队持证、全程保障。' },
  { id: 'g3', name: '深夜读书会', cat: 'learning', lead: '周棠', members: 64, acts: 31, join: 'free', joined: false, tags: ['双周一次', '主题共读', '不打卡不焦虑'], area: '总部 · 三楼书吧', intro: '一本书、一杯茶、一群不催进度的人。每期共读一本,线下围读 + 自由发言,读得慢也没关系。' },
  { id: 'g4', name: '周五观影会', cat: 'movie', lead: '许墨', members: 73, acts: 17, join: 'free', joined: false, tags: ['每周放映', '影乐分享', '偶尔开麦'], area: '总部 · 多功能厅', intro: '下班留下来,一起看场电影、聊聊配乐。从经典老片到话题新作,也有同事的现场弹唱开放麦。' },
  { id: 'g5', name: '桌游电竞局', cat: 'game', lead: '沈星', members: 142, acts: 40, join: 'free', joined: true, tags: ['每周开局', '新手教学', '五黑常驻'], area: '总部 · 休闲区', intro: '剧本杀、阿瓦隆、狼人杀、五黑上分,午休和下班后随时开局,菜也没关系,快乐第一。', hot: true },
  { id: 'g6', name: '职场成长营', cat: 'career', lead: '何夕', members: 58, acts: 16, join: 'free', joined: false, tags: ['双周一次', '经验分享', '简历互助'], area: '总部 · 学习室', intro: '把同事的经验变成你的捷径。每期一个主题:汇报表达、向上沟通、项目复盘,老带新少走弯路。' },
  { id: 'g7', name: '暖心公益志愿队', cat: 'volunteer', lead: '顾乔', members: 110, acts: 29, join: 'free', joined: false, tags: ['月度活动', '工会支持', '人人可参与'], area: '城市 · 各公益点', intro: '用业余时间做点暖心的事。社区助老、山区捐书、公益义卖,工会提供保障,报名即可参与。' },
  { id: 'g8', name: '羽毛球俱乐部', cat: 'sport', lead: '叶蓁', members: 87, acts: 35, join: 'free', joined: false, tags: ['每周二四', '场地已包', '拍可借'], area: '总部 · 体育馆', intro: '已包下体育馆 4 片场地,周二周四晚常态开打。从娱乐双打到水平局,都能找到对手。' },
  { id: 'g9', name: '视觉设计交流组', cat: 'other', lead: '许墨', members: 45, acts: 12, join: 'free', joined: false, tags: ['UI/UX', '设计分享', '作品互评'], area: '总部 · 设计开放区', intro: 'UI、品牌、插画爱好者的圈子。双周设计分享、作品互评，设计部同事常驻交流。' },
];

export const ACTS: Act[] = [
  {
    id: 'a26', gid: 'g2', title: '周末连营徒步 · 周二入营周四撤营', cat: 'sport', type: 'recurring',
    when: '6/2 18:00 → 6/4 16:00', dateKey: 602, daysBadge: '共 3 天', loc: '近郊 · 云栖谷营地', host: '苏曼',
    signed: 18, cap: 24, likes: 21, joinedByMe: false, recReason: '跨 3 天连营 · 周期规则示例', status: 'upcoming',
    desc: '连续三天入营徒步：周二傍晚入营、周三全天线路、周四下午撤营。领队持证，营地有热水和简易补给。',
    tags: ['连营', '周期', '新手友好'],
    sessions: sessions('a26', ['06月02日', '06月09日', '06月16日', '06月23日', '06月30日'], '18:00 - 次日 16:00', 24, 18, false),
  },
  {
    id: 'a19', gid: 'g5', title: '通宵桌游马拉松 · 周五不眠局', cat: 'game', type: 'recurring',
    when: '6/6 22:00 → 6/7 02:00', dateKey: 606, daysBadge: '共 2 天', loc: '总部 · 休闲区', host: '沈星',
    signed: 11, cap: 16, likes: 34, joinedByMe: true, recReason: '跨天通宵局 · 场次展示示例', status: 'upcoming',
    desc: '周五下班留下来，阿瓦隆 / 剧本杀 / 狼人杀轮转。零食饮料自带，零点后有宵夜拼单。',
    tags: ['通宵', '桌游', '跨天'],
    sessions: sessions('a19', ['06月06日', '06月13日', '06月20日', '06月27日', '07月04日'], '22:00 - 02:00', 16, 11, true),
  },
  {
    id: 'a1', gid: 'g1', title: '滨江 8K 夜跑 · 江风配速团', cat: 'sport', type: 'recurring',
    when: '6/5 · 19:30 - 21:00', dateKey: 605, loc: '滨江园区南门集合', host: '江野',
    signed: 27, cap: 40, likes: 86, liked: true, joinedByMe: true, recReason: '因为你常参加「城市夜跑团」', status: 'upcoming',
    desc: '沿滨江绿道往返 8 公里，分 6′30″ / 6′00″ / 5′30″ 三组。零基础友好，有陪跑员。穿跑鞋即可，建议带水杯。',
    tags: ['夜跑', '配速分组', '零基础'],
    sessions: sessions('a1', ['06月05日', '06月12日', '06月19日', '06月26日', '07月03日'], '19:30 - 21:00', 40, 27, true),
  },
  {
    id: 'a5', gid: 'g8', title: '周四羽毛球娱乐局 · 水平不限', cat: 'sport', type: 'recurring',
    when: '6/5 · 18:30 - 20:30', dateKey: 605, loc: '体育馆 1-4 号场', host: '叶蓁',
    signed: 30, cap: 32, likes: 52, liked: true, joinedByMe: false, recReason: '同部门 6 位同学已报名', status: 'upcoming',
    desc: '已包 4 片场地，娱乐局与水平局分区。新手有人带，无拍可现场借。',
    tags: ['羽毛球', '场地已包'],
    sessions: sessions('a5', ['06月05日', '06月12日', '06月19日', '06月26日', '07月03日'], '18:30 - 20:30', 32, 30, false),
  },
  {
    id: 'a6', gid: 'g7', title: '社区助老 · 周末陪伴行动', cat: 'volunteer', type: 'recurring',
    when: '6/6 · 14:00 - 16:30', dateKey: 606, loc: '滨江社区养老服务中心', host: '顾乔',
    signed: 9, cap: 12, likes: 38, joinedByMe: false, status: 'upcoming',
    desc: '陪老人聊天、读报、做手工。工会提供交通补贴，报名即可参与。',
    tags: ['公益', '周末'],
    sessions: sessions('a6', ['06月06日', '06月13日', '06月20日'], '14:00 - 16:30', 12, 9, false),
  },
  {
    id: 'a16', gid: 'g4', title: '初夏滨江摄影 Walk · 试点场', cat: 'movie', type: 'once',
    when: '6/18 · 17:30 - 19:00', dateKey: 618, loc: '滨江步道 · 南门集合', host: '许墨',
    signed: 0, cap: 15, likes: 0, joinedByMe: false, status: 'upcoming',
    desc: '初夏傍晚的滨江，光线软、风也刚好。零基础友好，手机、微单都行。',
    tags: ['摄影', '试点场'],
  },
  {
    id: 'a8', gid: 'g2', title: '云栖谷溪行 · 看日出系列 ①', cat: 'sport', type: 'series',
    when: '5/25 · 04:00 - 11:00', dateKey: 525, loc: '近郊 · 云栖谷', host: '苏曼',
    signed: 24, cap: 24, likes: 252, joinedByMe: true, status: 'ended',
    desc: '凌晨四点出发看云海日出。全程 9 公里，领队押队。',
    tags: ['日出', '系列'],
  },
  {
    id: 'a7', gid: 'g1', title: '滨江 8K 夜跑', cat: 'sport', type: 'once',
    when: '5/29 · 19:30 - 21:00', dateKey: 529, loc: '滨江园区南门集合', host: '江野',
    signed: 38, cap: 40, likes: 120, joinedByMe: true, status: 'ended',
    desc: '滨江夜跑，38 人历史新高。',
    tags: ['夜跑'],
  },
  {
    id: 'a9', gid: 'g5', title: '五黑上分之夜', cat: 'game', type: 'once',
    when: '5/28 · 20:00 - 23:00', dateKey: 528, loc: '总部 · 休闲区', host: '沈星',
    signed: 18, cap: 20, likes: 60, joinedByMe: false, status: 'ended',
    desc: '五黑排位，菜鸡互啄也开心。',
    tags: ['电竞'],
  },
];

export const HINTS = ['职场成长的活动有什么', '适合新人的小组', '本月最热门的小组'] as const;

export const SHORTCUTS = [
  { key: 'createGroup', label: '创建小组', icon: 'plus' },
  { key: 'createAct', label: '创建活动', icon: 'plus' },
  { key: 'myActivities', label: '我的活动', icon: 'ticket' },
  { key: 'myGroups', label: '我的小组', icon: 'star' },
] as const;

export const ACT_TABS: { key: ActTab; label: string }[] = [
  { key: 'rec', label: '推荐' },
  { key: 'latest', label: '最新' },
  { key: 'hot', label: '热门' },
];

export const TYPE_META: Record<ActType, { label: string; icon: string }> = {
  once: { label: '单次', icon: 'calendar' },
  recurring: { label: '周期性', icon: 'repeat' },
  series: { label: '系列', icon: 'series' },
};

export function hashStr(s = '') {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function groupMemberState(group?: Group | null) {
  if (!group) return 'member' as const;
  if (group.joined) return 'member' as const;
  if (group.pending) return 'pending' as const;
  return 'none' as const;
}

export function enrollInfo(act: Act, group?: Group) {
  const gs = groupMemberState(group);
  if (gs === 'pending') return { label: '立即报名', variant: 'primary' as const, icon: 'ticket', disabled: true };
  if (gs === 'none') return { label: '报名+入组', variant: 'primary' as const, icon: 'userPlus', disabled: false };
  if (act.joinedByMe) {
    if (act.type === 'recurring' || act.type === 'series') return { label: '调整场次', variant: 'soft' as const, icon: 'ticket', disabled: false };
    return { label: '取消报名', variant: 'ghost' as const, icon: 'x', disabled: false };
  }
  return { label: act.type === 'recurring' ? '选场次报名' : '报名', variant: 'primary' as const, icon: 'ticket', disabled: false };
}

export function pickActs(tab: ActTab, acts: Act[]) {
  const live = acts.filter((a) => a.status !== 'ended' && a.status !== 'cancelled');
  if (tab === 'rec') {
    return [...live].sort((a, b) => Number(Boolean(b.recReason)) - Number(Boolean(a.recReason)) || b.likes - a.likes).slice(0, 3);
  }
  if (tab === 'latest') return [...live].sort((a, b) => a.dateKey - b.dateKey).slice(0, 3);
  return [...live].sort((a, b) => b.likes - a.likes || b.signed - a.signed).slice(0, 3);
}

export function filterActs(acts: Act[], groups: Group[], q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return acts;
  return acts.filter((a) => {
    const g = groups.find((x) => x.id === a.gid);
    return [a.title, g?.name, ...(a.tags || [])].filter(Boolean).join(' ').toLowerCase().includes(s);
  });
}

export function isCEndGroupDiscoverable(group: Group): boolean {
  return group.auditStatus !== '待审核' && group.auditStatus !== '已驳回';
}

export function filterGroups(groups: Group[], q: string) {
  const visible = groups.filter(isCEndGroupDiscoverable);
  const s = q.trim().toLowerCase();
  if (!s) return visible;
  return visible.filter((g) => {
    const cat = CATS[g.cat].label;
    return [g.name, g.intro, g.lead, g.area, cat, ...g.tags].join(' ').toLowerCase().includes(s);
  });
}

export function momentEligibleActs(acts: Act[], gid?: string) {
  return acts.filter((a) => a.status === 'ended' && a.joinedByMe && (!gid || a.gid === gid));
}

export function IgIcon({ name, size = 22, stroke = 2, fill = false, style }: { name: string; size?: number; stroke?: number; fill?: boolean; style?: CSSProperties }) {
  if (name === 'cards') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block', ...style }} aria-hidden>
        {CARDS_LAYERS.map((layer) => (
          <path key={layer.d} d={layer.d} fill={layer.front ? 'var(--surface)' : 'none'} />
        ))}
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block', ...style }} aria-hidden>
      <path d={ICONS[name] || ''} />
    </svg>
  );
}

export function Sparkles({ size = 18, color = '#fff', style }: { size?: number; color?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0, ...style }} aria-hidden>
      <path d="M12 2.5l1.7 5L19 9l-5.3 1.5L12 16l-1.7-5.5L5 9l5.3-1.5z" fill={color} />
      <path d="M18.5 14l.8 2.4L22 17l-2.7.7-.8 2.4-.8-2.4L15 17l2.7-.6z" fill={color} opacity="0.7" />
      <path d="M5 15l.6 1.8L7.5 17.5l-1.9.6L5 20l-.6-1.9L2.5 17.5l1.9-.7z" fill={color} opacity="0.55" />
    </svg>
  );
}

export function Photo({ seed, icon, dim }: { seed: string; icon: string; dim?: boolean }) {
  const g = GRADS[hashStr(seed) % GRADS.length];
  const ang = (hashStr(`${seed}a`) % 90) + 100;
  return (
    <div className="c-ig-photo" style={{ background: `linear-gradient(${ang}deg, ${g[0]}, ${g[1]})` }}>
      <div className="c-ig-photo-stripes" />
      {dim ? <div className="c-ig-photo-dim" /> : null}
      <div className="c-ig-photo-mark">
        <IgIcon name={icon} size={26} stroke={2} />
      </div>
    </div>
  );
}

export function MonoAvatar({ name, size }: { name: string; size: number }) {
  const hue = AVATAR_HUES[hashStr(name) % AVATAR_HUES.length];
  const ch = (name.match(/[\u4e00-\u9fa5A-Za-z]/g) || [name]).slice(-1)[0] || '?';
  return (
    <span
      className="c-ig-avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(140deg, oklch(0.8 0.12 ${hue}), oklch(0.68 0.16 ${hue}))`,
      }}
    >
      {ch}
    </span>
  );
}

export function AvatarStack({ names, n, size, extra }: { names: string[]; n: number; size: number; extra?: number }) {
  const show = names.slice(0, n);
  return (
    <div className="c-ig-avatars">
      {show.map((nm, i) => (
        <span key={nm} style={{ marginLeft: i ? -9 : 0, zIndex: n - i }}>
          <MonoAvatar name={nm} size={size} />
        </span>
      ))}
      {extra && extra > 0 ? (
        <span className="c-ig-extra" style={{ width: size, height: size, fontSize: size * 0.34 }}>
          +{extra}
        </span>
      ) : null}
    </div>
  );
}

export function SectionHead({ title, sub, action, accent, onAction }: { title: string; sub?: string; action: string; accent: string; onAction: () => void }) {
  return (
    <div className="c-ig-sec-head">
      <div className="c-ig-sec-copy">
        <h2 className="c-ig-sec-title" style={{ '--c-ig-accent': accent } as CSSProperties}>
          {title}
        </h2>
        {sub ? <p className="c-ig-sec-sub">{sub}</p> : null}
      </div>
      <button className="c-ig-more" type="button" onClick={onAction}>
        {action}
        <IgIcon name="chevR" size={15} />
      </button>
    </div>
  );
}

export function Empty({ text, actionLabel, onAction }: { text: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="c-ig-empty">
      <div className="c-ig-empty-ico">
        <IgIcon name="image" size={26} />
      </div>
      <div>{text}</div>
      {actionLabel && onAction ? (
        <button className="c-ig-btn is-soft" type="button" onClick={onAction} style={{ marginTop: 16 }}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

type ActivityCardProps = {
  act: Act;
  group?: Group;
  rec?: boolean;
  peopleNames?: string[];
  onOpen: () => void;
  onEnroll: (e: MouseEvent<HTMLButtonElement>) => void;
  onLike?: (e: MouseEvent<HTMLButtonElement>) => void;
};

export function ActivityCard({ act, group, rec, peopleNames, onOpen, onEnroll, onLike }: ActivityCardProps) {
  const cat = CATS[act.cat];
  const type = TYPE_META[act.type];
  const enroll = enrollInfo(act, group);
  const left = act.cap - act.signed;
  const pct = Math.min(100, Math.round((act.signed / act.cap) * 100));
  const avatars = (peopleNames?.length ? peopleNames : NAMES).slice(0, 6);
  return (
    <article className="c-ig-act" onClick={onOpen} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }}>
      <div className="c-ig-cover">
        <Photo seed={act.id + act.cat} icon={cat.icon} dim />
        <div className="c-ig-cover-top">
          <span className="c-ig-cat" style={{ background: cat.color }}>
            <IgIcon name={cat.icon} size={13} stroke={2.4} />
            {cat.label}
          </span>
        </div>
        <div className="c-ig-cover-type">
          <span className="c-ig-type">
            <IgIcon name={type.icon} size={12.5} stroke={2.2} />
            {type.label}
          </span>
        </div>
        <button className="c-ig-like" type="button" onClick={(e) => { e.stopPropagation(); onLike?.(e); }}>
          <IgIcon name="heart" size={15} fill={Boolean(act.liked)} />
          {act.likes}
        </button>
        <div className="c-ig-cover-shade">
          {rec && act.recReason ? (
            <div className="c-ig-rec">
              <Sparkles size={12} />
              <span>{act.recReason}</span>
            </div>
          ) : group ? (
            <div className="c-ig-gname">{group.name}</div>
          ) : null}
          <div className={`c-ig-act-title has-like`}>{act.title}</div>
        </div>
      </div>
      <div className="c-ig-body">
        <div className="c-ig-meta">
          <div className="c-ig-meta-row">
            <span className="c-ig-meta-ico">
              <IgIcon name="calendar" size={15} stroke={2} />
            </span>
            <span>
              {act.when}
              {act.daysBadge ? <span className="c-ig-days">{act.daysBadge}</span> : null}
            </span>
          </div>
          <div className="c-ig-meta-row">
            <span className="c-ig-meta-ico">
              <IgIcon name="pin" size={15} stroke={2} />
            </span>
            <span>{act.loc}</span>
          </div>
        </div>
        <div className="c-ig-quota">
          <div style={{ flex: 1 }}>
            <div className="c-ig-quota-row">
              <span>已报名 {act.signed}/{act.cap}</span>
              <span className={left <= 0 ? 'is-full' : undefined}>{left <= 0 ? '已满员' : `余 ${left} 位`}</span>
            </div>
            <div className="c-ig-bar" aria-hidden>
              <span style={{ width: `${pct}%`, background: cat.color }} />
            </div>
          </div>
        </div>
        <div className="c-ig-foot">
          <AvatarStack names={avatars} n={4} size={26} extra={Math.max(0, act.signed - 4)} />
          <button
            className={`c-ig-btn is-${enroll.variant}`}
            type="button"
            disabled={enroll.disabled}
            onClick={(e) => { e.stopPropagation(); onEnroll(e); }}
          >
            <IgIcon name={enroll.icon} size={16} stroke={2.4} />
            {enroll.label}
          </button>
        </div>
      </div>
    </article>
  );
}

type GroupCardProps = {
  group: Group;
  wide?: boolean;
  onOpen: () => void;
  onJoin: (e: MouseEvent<HTMLButtonElement>) => void;
};

export function GroupCard({ group, wide, onOpen, onJoin }: GroupCardProps) {
  const cat = CATS[group.cat];
  const gs = groupMemberState(group);
  return (
    <article className={`c-ig-group${wide ? ' is-wide' : ''}`} onClick={onOpen} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }}>
      <div className="c-ig-group-cover">
        <Photo seed={group.id + group.cat} icon={cat.icon} dim />
        <span className="c-ig-cat" style={{ background: cat.color }}>
          <IgIcon name={cat.icon} size={13} stroke={2.4} />
          {cat.label}
        </span>
      </div>
      <div className="c-ig-group-body">
        <div className="c-ig-group-name">{group.name}</div>
        <p className="c-ig-group-desc">{group.intro}</p>
        <div className="c-ig-group-foot">
          <div className="c-ig-group-people">
            <AvatarStack names={NAMES.slice(2, 8)} n={3} size={24} />
            <span className="c-ig-gcount">{group.members} 人</span>
          </div>
          {gs === 'member' ? (
            <button className="c-ig-btn is-ghost" type="button" disabled>
              <IgIcon name="check" size={16} stroke={2.4} />
              已加入
            </button>
          ) : gs === 'pending' ? (
            <button className="c-ig-btn is-ghost" type="button" disabled>
              <IgIcon name="clock" size={16} stroke={2.4} />
              审核中
            </button>
          ) : (
            <button className="c-ig-btn is-soft" type="button" onClick={(e) => { e.stopPropagation(); onJoin(e); }}>
              <IgIcon name="plus" size={16} stroke={2.4} />
              加入
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function ActivityRow({ act, onOpen }: { act: Act; onOpen: () => void }) {
  const cat = CATS[act.cat];
  const type = TYPE_META[act.type];
  return (
    <button className="c-ig-row" type="button" onClick={onOpen}>
      <div className="c-ig-row-cover">
        <Photo seed={act.id + act.cat} icon={cat.icon} />
      </div>
      <div className="c-ig-row-body">
        <div className="c-ig-row-title">{act.title}</div>
        <div className="c-ig-row-sub">
          {act.when}
          {act.daysBadge ? ` · ${act.daysBadge}` : ''}
        </div>
        <div className="c-ig-row-tags">
          <span className="c-ig-cat is-sm" style={{ background: cat.color }}>
            <IgIcon name={cat.icon} size={11} stroke={2.4} />
            {cat.label}
          </span>
          <span className="c-ig-type is-sm">
            <IgIcon name={type.icon} size={11} stroke={2.2} />
            {type.label}
          </span>
        </div>
      </div>
      <IgIcon name="chevR" size={18} style={{ color: 'var(--ink-3)' }} />
    </button>
  );
}

export function Btn({
  children, variant = 'primary', size = 'md', full, icon, disabled, onClick, style,
}: {
  children: ReactNode;
  variant?: 'primary' | 'soft' | 'ghost' | 'ai';
  size?: 'sm' | 'md' | 'lg';
  full?: boolean;
  icon?: string;
  disabled?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  return (
    <button
      className={`c-ig-btn is-${variant} is-${size}${full ? ' is-full' : ''}`}
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{ opacity: disabled ? 0.55 : 1, ...style }}
    >
      {icon ? <IgIcon name={icon} size={size === 'sm' ? 14 : 16} stroke={2.4} /> : null}
      {children}
    </button>
  );
}
