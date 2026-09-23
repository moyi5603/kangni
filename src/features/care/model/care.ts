export const PERSONAL_TYPES = ['生日关怀', '周年庆关怀', '入党关怀'] as const;
export const FIXED_DATE_TYPES = ['节日关怀', '节气关怀', '其他'] as const;
/** 本期新建规则不开放；编辑已有规则时仍保留当前类型。 */
export const DEFERRED_CREATE_TYPES = ['节气关怀'] as const;
export const EVENT_TYPES = ['天气关怀', '工作强度关怀'] as const;
export const CARE_TYPES = [...PERSONAL_TYPES, ...FIXED_DATE_TYPES, ...EVENT_TYPES] as const;
export type CareType = (typeof CARE_TYPES)[number];
export type CareCategory = '个人关怀' | '固定日期关怀' | '事件关怀';

export const CARE_CATEGORIES: CareCategory[] = ['个人关怀', '固定日期关怀', '事件关怀'];

export const PUSH_OFFSETS = ['前一天', '当天'] as const;
export type PushOffset = (typeof PUSH_OFFSETS)[number];

export const RULE_STATUSES = ['执行中', '未开始', '已过期'] as const;
export type RuleStatus = (typeof RULE_STATUSES)[number];

export const RECORD_SOURCES = ['系统关怀', '用户关怀'] as const;
export type RecordSource = (typeof RECORD_SOURCES)[number];

export const WEATHER_SCENES = [
  '极端高温',
  '极端低温',
  '寒潮降温',
  '暴雨预警',
  '暴雪预警',
  '台风预警',
  '沙尘预警',
  '霾/重污染',
] as const;
export type WeatherScene = (typeof WEATHER_SCENES)[number];

export const WORK_SCENES = ['单日超时', '下班过晚', '每周超时', '连续加班'] as const;
export type WorkScene = (typeof WORK_SCENES)[number];

export const WARNING_LEVELS = ['蓝色预警', '黄色预警', '橙色预警', '红色预警'] as const;
export type WarningLevel = (typeof WARNING_LEVELS)[number];

export type FestivalDef = { value: string; date: string };

export const CN_FESTIVAL_DEFS: FestivalDef[] = [
  { value: '元旦', date: '1月1日' },
  { value: '春节', date: '农历正月初一' },
  { value: '元宵节', date: '农历正月十五' },
  { value: '妇女节', date: '3月8日' },
  { value: '清明节', date: '4月4日-4月6日' },
  { value: '劳动节', date: '5月1日' },
  { value: '端午节', date: '农历五月初五' },
  { value: '建党节', date: '7月1日' },
  { value: '建军节', date: '8月1日' },
  { value: '七夕节', date: '农历七月初七' },
  { value: '中元节', date: '农历七月十五' },
  { value: '教师节', date: '9月10日' },
  { value: '中秋节', date: '农历八月十五' },
  { value: '国庆节', date: '10月1日' },
  { value: '重阳节', date: '农历九月初九' },
];
export const WORLD_FESTIVAL_DEFS: FestivalDef[] = [
  { value: '情人节', date: '2月14日' },
  { value: '母亲节', date: '5月第二个星期日' },
  { value: '父亲节', date: '6月第三个星期日' },
  { value: '万圣节', date: '10月31日' },
  { value: '感恩节', date: '11月第四个星期四' },
  { value: '平安夜', date: '12月24日' },
  { value: '圣诞节', date: '12月25日' },
  { value: '跨年夜', date: '12月31日' },
];
export const CN_FESTIVALS = CN_FESTIVAL_DEFS.map((item) => item.value);
export const WORLD_FESTIVALS = WORLD_FESTIVAL_DEFS.map((item) => item.value);
export const SOLAR_TERM_DEFS: FestivalDef[] = [
  { value: '立春', date: '2月3日-2月5日' },
  { value: '雨水', date: '2月18日-2月20日' },
  { value: '惊蛰', date: '3月5日-3月7日' },
  { value: '春分', date: '3月20日-3月22日' },
  { value: '清明', date: '4月4日-4月6日' },
  { value: '谷雨', date: '4月19日-4月21日' },
  { value: '立夏', date: '5月5日-5月7日' },
  { value: '小满', date: '5月20日-5月22日' },
  { value: '芒种', date: '6月5日-6月7日' },
  { value: '夏至', date: '6月20日-6月22日' },
  { value: '小暑', date: '7月6日-7月8日' },
  { value: '大暑', date: '7月22日-7月24日' },
  { value: '立秋', date: '8月7日-8月9日' },
  { value: '处暑', date: '8月22日-8月24日' },
  { value: '白露', date: '9月7日-9月9日' },
  { value: '秋分', date: '9月22日-9月24日' },
  { value: '寒露', date: '10月7日-10月9日' },
  { value: '霜降', date: '10月22日-10月24日' },
  { value: '立冬', date: '11月6日-11月8日' },
  { value: '小雪', date: '11月21日-11月23日' },
  { value: '大雪', date: '12月6日-12月8日' },
  { value: '冬至', date: '12月21日-12月23日' },
  { value: '小寒', date: '1月5日-1月7日' },
  { value: '大寒', date: '1月19日-1月21日' },
];
export const SOLAR_TERMS = SOLAR_TERM_DEFS.map((item) => item.value);

export const FESTIVAL_GROUPS = [
  { label: '中国节日', options: CN_FESTIVAL_DEFS },
  { label: '全球主流节日', options: WORLD_FESTIVAL_DEFS },
];

export const SCENE_OPTIONS = [
  { label: '个人关怀', options: PERSONAL_TYPES.map((value) => ({ label: value, value })) },
  { label: '固定日期关怀', options: FIXED_DATE_TYPES.map((value) => ({ label: value, value })) },
  { label: '事件关怀', options: EVENT_TYPES.map((value) => ({ label: value, value })) },
];

function mockImage(mark: string, fill: string, width: number, height: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" rx="12" fill="${fill}"/><text x="${width / 2}" y="${height / 2}" text-anchor="middle" dominant-baseline="middle" font-size="${Math.round(Math.min(width, height) * 0.28)}" font-family="PingFang SC, Microsoft YaHei, sans-serif" fill="#fff">${mark}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function poster(mark: string, fill: string) {
  return mockImage(mark, fill, 360, 640);
}

function banner(mark: string, fill: string) {
  return mockImage(mark, fill, 1068, 455);
}

export const CARE_POSTERS = {
  birthday: poster('生', '#fa8c16'),
  festival: poster('节', '#2A56DE'),
  solar: poster('气', '#13c2c2'),
  party: poster('党', '#cf1322'),
  cycle: poster('年', '#722ed1'),
  heat: poster('凉', '#08979c'),
};

export const CARE_BANNERS = {
  birthday: banner('生', '#fa8c16'),
  festival: banner('节', '#2A56DE'),
  solar: banner('气', '#13c2c2'),
  party: banner('党', '#cf1322'),
  cycle: banner('年', '#722ed1'),
  heat: banner('凉', '#08979c'),
};

export function categoryOf(type: CareType): CareCategory {
  if ((PERSONAL_TYPES as readonly string[]).includes(type)) return '个人关怀';
  if ((FIXED_DATE_TYPES as readonly string[]).includes(type)) return '固定日期关怀';
  return '事件关怀';
}

export function isPersonalType(type: CareType) {
  return categoryOf(type) === '个人关怀';
}

export type CareEmployee = {
  id: string;
  name: string;
  department: string;
  solarBirthday: string;
  lunarBirthday: string;
  reminder: '按阳历' | '按阴历';
  hireDate: string;
  partyJoinDate: string;
};

export type CareRule = {
  id: string;
  name: string;
  type: CareType;
  pushTime: string;
  pushOffset: PushOffset;
  status: Exclude<RuleStatus, '已过期'>;
  scope: '部门' | '员工';
  scopeValues: string[];
  templateKeys: string[];
  points: number;
  validity: '永久生效' | '一次性';
  coworkerEnabled: boolean;
  coworkerScope: '所在末级部门' | '根目录一级部门';
  coworkerOffset: string;
  coworkerTime: string;
  occasion?: string[];
  fixedDate?: string;
  anniversaryYear?: number;
  weatherScenes?: WeatherScene[];
  highTemperatureThreshold?: number;
  lowTemperatureThreshold?: number;
  coldWaveDropThreshold?: number;
  coldWaveMinTemperature?: number;
  rainWarningLevels?: WarningLevel[];
  snowWarningLevels?: WarningLevel[];
  typhoonWarningLevels?: WarningLevel[];
  sandstormWarningLevels?: WarningLevel[];
  hazeAqiThreshold?: number;
  workIntensityScenes?: WorkScene[];
  dailyWorkHoursThreshold?: number;
  lateOffDutyTime?: string;
  weeklyWorkHoursThreshold?: number;
  weeklyNotifyManager?: boolean;
  consecutiveOvertimeDays?: number;
  consecutiveNotifyManager?: boolean;
};

export type CareTemplate = {
  id: string;
  name: string;
  type: CareType;
  coverImage: string;
  employeeCover: string;
  employeeTitle: string;
  employeeSummary: string;
  blessing: string;
  signature: string;
  colleagueTitle: string;
  colleagueSummary: string;
  colleagueCover: string;
  blessingOffsetX?: number;
  blessingOffsetY?: number;
};

export type CareRecord = {
  id: string;
  source: RecordSource;
  ruleName: string;
  type: CareType;
  points: number;
  pushTime: string;
  sender: string;
  name: string;
  department: string;
  content: string;
  status: '已发送';
};

export type CareEmoji = {
  id: string;
  name: string;
  defaultCopy: string;
  image: string;
  fileName: string;
  status: '启用' | '停用';
  sort: number;
  updatedAt: string;
};

export function orderedEmojis(list: CareEmoji[]) {
  return [...list].sort((a, b) => a.sort - b.sort);
}

export function movedEmojis(list: CareEmoji[], id: string, direction: 'up' | 'down') {
  const ordered = orderedEmojis(list);
  const index = ordered.findIndex((item) => item.id === id);
  const target = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= ordered.length) return list;
  const current = ordered[index];
  const neighbor = ordered[target];
  return list.map((item) => {
    if (item.id === current.id) return { ...item, sort: neighbor.sort };
    if (item.id === neighbor.id) return { ...item, sort: current.sort };
    return item;
  });
}

export type CareDisplaySettings = {
  hideExecutives: boolean;
  hiddenExecutiveNames: string[];
  birthdayLeaderboardVisible: boolean;
  anniversaryLeaderboardVisible: boolean;
  partyLeaderboardVisible: boolean;
};

export const initialEmployees: CareEmployee[] = [
  { id: '1', name: '陈晨', department: '总经办', solarBirthday: '1988-04-17', lunarBirthday: '三月初二', reminder: '按阳历', hireDate: '2019-07-01', partyJoinDate: '2012-06-15' },
  { id: '2', name: '林晓', department: '产品研发中心', solarBirthday: '1992-08-24', lunarBirthday: '七月廿七', reminder: '按阴历', hireDate: '2021-03-18', partyJoinDate: '' },
  { id: '3', name: '王悦', department: '人力行政中心', solarBirthday: '1995-11-06', lunarBirthday: '九月十五', reminder: '按阳历', hireDate: '2022-06-07', partyJoinDate: '2020-12-08' },
  { id: '4', name: '周雨', department: '运营管理中心', solarBirthday: '1990-02-16', lunarBirthday: '正月初二', reminder: '按阳历', hireDate: '2020-11-30', partyJoinDate: '2015-07-01' },
  { id: '5', name: '李明', department: '市场产品部', solarBirthday: '1987-07-19', lunarBirthday: '六月初五', reminder: '按阴历', hireDate: '2018-08-01', partyJoinDate: '2010-11-20' },
  { id: '6', name: '赵宁', department: '营销管理中心', solarBirthday: '1993-12-10', lunarBirthday: '十月廿八', reminder: '按阳历', hireDate: '2021-06-10', partyJoinDate: '' },
  { id: '7', name: '孙可', department: '新零售部', solarBirthday: '', lunarBirthday: '', reminder: '按阳历', hireDate: '2023-02-13', partyJoinDate: '' },
  { id: '8', name: '徐然', department: '平台增长部', solarBirthday: '1996-03-26', lunarBirthday: '二月初八', reminder: '按阳历', hireDate: '', partyJoinDate: '2023-06-30' },
  { id: '9', name: '何嘉', department: '经营管理中心', solarBirthday: '', lunarBirthday: '', reminder: '按阳历', hireDate: '', partyJoinDate: '' },
  { id: '10', name: '刘洋', department: '产品研发中心', solarBirthday: '1994-09-12', lunarBirthday: '八月初八', reminder: '按阴历', hireDate: '2020-04-15', partyJoinDate: '2019-05-04' },
  { id: '11', name: '唐宁', department: '运营管理中心', solarBirthday: '1991-01-08', lunarBirthday: '冬月廿四', reminder: '按阳历', hireDate: '2017-08-24', partyJoinDate: '2013-09-18' },
  { id: '12', name: '许清', department: '人力行政中心', solarBirthday: '1989-05-21', lunarBirthday: '四月十七', reminder: '按阴历', hireDate: '2024-05-06', partyJoinDate: '' },
];

const ruleBase = {
  scope: '部门' as const,
  scopeValues: ['all'],
  coworkerScope: '根目录一级部门' as const,
  coworkerOffset: '提前1天',
  coworkerTime: '10:00',
  validity: '永久生效' as const,
  pushOffset: '当天' as const,
};

export const initialRules: CareRule[] = [
  { id: 'r1', name: '生日关怀', type: '生日关怀', pushTime: '09:00:00', status: '执行中', templateKeys: ['t1'], points: 100, coworkerEnabled: true, ...ruleBase },
  { id: 'r2', name: '周年庆关怀', type: '周年庆关怀', pushTime: '10:00:00', status: '执行中', templateKeys: ['t3'], points: 200, anniversaryYear: 1, coworkerEnabled: true, coworkerScope: '所在末级部门', coworkerOffset: '提前2天', coworkerTime: '10:00', scope: '部门', scopeValues: ['all'], validity: '永久生效', pushOffset: '当天' },
  { id: 'r3', name: '入党关怀', type: '入党关怀', pushTime: '09:30:00', status: '执行中', templateKeys: ['t4'], points: 100, coworkerEnabled: false, ...ruleBase },
  { id: 'r4', name: '中秋节关怀', type: '节日关怀', occasion: ['中秋节'], pushTime: '09:30:00', status: '执行中', scope: '员工', scopeValues: ['1', '2', '3'], templateKeys: ['t5', 't8'], points: 50, validity: '永久生效', coworkerEnabled: false, coworkerScope: '根目录一级部门', coworkerOffset: '提前1天', coworkerTime: '10:00', pushOffset: '当天' },
  { id: 'r5', name: '夏季送清凉', type: '其他', occasion: ['防暑降温'], fixedDate: '07-15', pushTime: '10:00:00', status: '执行中', templateKeys: ['t7'], points: 0, coworkerEnabled: false, ...ruleBase },
  {
    id: 'r6',
    name: '极端天气关怀',
    type: '天气关怀',
    pushTime: '每日 06:00、15:00、21:00',
    status: '执行中',
    templateKeys: ['t9'],
    points: 0,
    coworkerEnabled: false,
    weatherScenes: ['暴雨预警'],
    highTemperatureThreshold: 37,
    lowTemperatureThreshold: 0,
    coldWaveDropThreshold: 8,
    coldWaveMinTemperature: 4,
    rainWarningLevels: ['黄色预警', '橙色预警', '红色预警'],
    snowWarningLevels: ['黄色预警', '橙色预警', '红色预警'],
    typhoonWarningLevels: ['蓝色预警', '黄色预警', '橙色预警', '红色预警'],
    sandstormWarningLevels: ['黄色预警', '橙色预警', '红色预警'],
    hazeAqiThreshold: 200,
    ...ruleBase,
    coworkerScope: '根目录一级部门',
    coworkerOffset: '',
    coworkerTime: '',
  },
  {
    id: 'r7',
    name: '加班暖心关怀',
    type: '工作强度关怀',
    pushTime: 'T+1 考勤更新后',
    status: '执行中',
    templateKeys: ['t10'],
    points: 20,
    coworkerEnabled: false,
    workIntensityScenes: ['单日超时'],
    dailyWorkHoursThreshold: 12,
    lateOffDutyTime: '23:00',
    weeklyWorkHoursThreshold: 60,
    weeklyNotifyManager: false,
    consecutiveOvertimeDays: 3,
    consecutiveNotifyManager: false,
    ...ruleBase,
    coworkerOffset: '',
    coworkerTime: '',
  },
];

export const initialTemplates: CareTemplate[] = [
  { id: 't1', name: '生日暖心祝福', type: '生日关怀', coverImage: CARE_POSTERS.birthday, employeeCover: CARE_BANNERS.birthday, employeeTitle: '生日快乐，愿美好如期而至', employeeSummary: '一张贺卡，一份专属于你的生日祝福。', blessing: '【员工姓名】，愿新的一岁，心中有光，脚下有路，所有美好都如约而至。', signature: '', colleagueTitle: '一起为寿星送上祝福', colleagueSummary: '写下你的祝福，让快乐加倍。', colleagueCover: CARE_BANNERS.birthday },
  { id: 't3', name: '成长同行', type: '周年庆关怀', coverImage: CARE_POSTERS.cycle, employeeCover: CARE_BANNERS.cycle, employeeTitle: '感谢同行，共赴新程', employeeSummary: '记录每一段携手成长的珍贵时光。', blessing: '【员工姓名】，感谢你的投入与坚持，愿我们继续并肩前行。', signature: '人力资源部', colleagueTitle: '一起见证成长', colleagueSummary: '邀请同事送上一份温暖祝福。', colleagueCover: CARE_BANNERS.cycle },
  { id: 't4', name: '初心如磐', type: '入党关怀', coverImage: CARE_POSTERS.party, employeeCover: CARE_BANNERS.party, employeeTitle: '初心如磐，使命在肩', employeeSummary: '铭记入党初心，凝聚奋进力量。', blessing: '【员工姓名】，愿你始终坚定理想信念，在新的征程中勇毅前行。', signature: '党群工作部', colleagueTitle: '致敬初心', colleagueSummary: '共同送上一份庄重而温暖的祝福。', colleagueCover: CARE_BANNERS.party },
  { id: 't5', name: '月满中秋', type: '节日关怀', coverImage: CARE_POSTERS.festival, employeeCover: CARE_BANNERS.festival, employeeTitle: '月满人团圆', employeeSummary: '云程发轫，万里可期，中秋快乐。', blessing: '【员工姓名】，愿人间至味是团圆，愿你所愿皆圆满。', signature: '员工关怀团队', colleagueTitle: '', colleagueSummary: '', colleagueCover: '' },
  { id: 't8', name: '节日暖心问候', type: '节日关怀', coverImage: CARE_POSTERS.festival, employeeCover: CARE_BANNERS.festival, employeeTitle: '佳节如意，喜乐常伴', employeeSummary: '在特别的日子里，为你送上一份温暖问候。', blessing: '【员工姓名】，愿每一个值得纪念的日子，都有美好与温暖相伴。', signature: '员工关怀团队', colleagueTitle: '', colleagueSummary: '', colleagueCover: '' },
  { id: 't6', name: '冬至安康', type: '节气关怀', coverImage: CARE_POSTERS.solar, employeeCover: CARE_BANNERS.solar, employeeTitle: '冬至如年，温暖相伴', employeeSummary: '顺问冬安，愿美好如约而至。', blessing: '【员工姓名】，愿这个冬日有暖意相随，平安喜乐常伴。', signature: '员工关怀团队', colleagueTitle: '', colleagueSummary: '', colleagueCover: '' },
  { id: 't7', name: '清凉一夏', type: '其他', coverImage: CARE_POSTERS.heat, employeeCover: CARE_BANNERS.heat, employeeTitle: '夏日送清凉，关怀沁人心', employeeSummary: '高温时节，请注意防暑降温。', blessing: '【员工姓名】，愿一份清凉伴你安心工作、健康度夏。', signature: '行政服务部', colleagueTitle: '', colleagueSummary: '', colleagueCover: '' },
  { id: 't9', name: '天气暖心提醒', type: '天气关怀', coverImage: CARE_POSTERS.heat, employeeCover: CARE_BANNERS.heat, employeeTitle: '天气有变化，关怀不缺席', employeeSummary: '极端天气来临，请及时做好防护。', blessing: '【员工姓名】，请合理安排出行与工作，注意安全，照顾好自己。', signature: '员工关怀团队', colleagueTitle: '', colleagueSummary: '', colleagueCover: '' },
  { id: 't10', name: '辛苦了暖心关怀', type: '工作强度关怀', coverImage: CARE_POSTERS.cycle, employeeCover: CARE_BANNERS.cycle, employeeTitle: '认真工作的你，辛苦了', employeeSummary: '感谢每一份投入，也请记得适时休息。', blessing: '【员工姓名】，愿忙碌之后有好梦相伴，保持节奏，照顾好自己。', signature: '员工关怀团队', colleagueTitle: '', colleagueSummary: '', colleagueCover: '' },
];

export const initialRecords: CareRecord[] = [
  { id: 'c1', source: '系统关怀', ruleName: '生日关怀', type: '生日关怀', points: 100, pushTime: '2026-08-26 09:00:00', sender: '系统', name: '陈晨', department: '总经办', content: '生日快乐，愿新的一岁美好如期而至。', status: '已发送' },
  { id: 'c2', source: '系统关怀', ruleName: '生日关怀', type: '生日关怀', points: 100, pushTime: '2026-08-25 09:00:00', sender: '系统', name: '林晓', department: '产品研发中心', content: '生日快乐，愿新的一岁心中有光、脚下有路。', status: '已发送' },
  { id: 'c3', source: '系统关怀', ruleName: '周年庆关怀', type: '周年庆关怀', points: 200, pushTime: '2026-08-22 10:00:00', sender: '系统', name: '王悦', department: '人力行政中心', content: '感谢一路同行，愿我们继续并肩前行。', status: '已发送' },
  { id: 'c4', source: '系统关怀', ruleName: '中秋节关怀', type: '节日关怀', points: 50, pushTime: '2025-09-17 09:30:00', sender: '系统', name: '周雨', department: '运营管理中心', content: '月满人团圆，愿你所愿皆圆满。', status: '已发送' },
  { id: 'c5', source: '系统关怀', ruleName: '入党关怀', type: '入党关怀', points: 100, pushTime: '2026-08-10 09:00:00', sender: '系统', name: '李明', department: '市场产品部', content: '初心如磐，愿你在新的征程中勇毅前行。', status: '已发送' },
  { id: 'c6', source: '系统关怀', ruleName: '夏季送清凉', type: '其他', points: 0, pushTime: '2026-07-15 10:00:00', sender: '系统', name: '赵宁', department: '营销管理中心', content: '高温时节，请注意防暑降温、安心度夏。', status: '已发送' },
  { id: 'c7', source: '系统关怀', ruleName: '极端天气关怀', type: '天气关怀', points: 0, pushTime: '2026-08-28 06:00:00', sender: '系统', name: '刘洋', department: '产品研发中心', content: '暴雨预警，请合理安排出行并注意安全。', status: '已发送' },
  { id: 'c8', source: '系统关怀', ruleName: '加班暖心关怀', type: '工作强度关怀', points: 20, pushTime: '2026-08-28 09:15:00', sender: '系统', name: '周雨', department: '运营管理中心', content: '认真工作的你辛苦了，也请记得适时休息。', status: '已发送' },
  { id: 'u1', source: '用户关怀', ruleName: '生日祝福', type: '生日关怀', points: 0, pushTime: '2026-08-28 10:26:00', sender: '陈一凡', name: '周可心', department: '人力资源部', content: '生日快乐！愿新的一岁每天都有好心情。', status: '已发送' },
  { id: 'u2', source: '用户关怀', ruleName: '周年祝福', type: '周年庆关怀', points: 0, pushTime: '2026-08-27 18:42:00', sender: '周可心', name: '王悦', department: '人力行政中心', content: '谢谢你一直以来的认真与付出，继续闪闪发光！', status: '已发送' },
  { id: 'u3', source: '用户关怀', ruleName: '入党纪念祝福', type: '入党关怀', points: 0, pushTime: '2026-08-24 11:18:00', sender: '李明', name: '陈晨', department: '总经办', content: '致敬初心，愿你坚定前行、一路有光。', status: '已发送' },
];

export type ColleagueBlessing = {
  id: string;
  recordId: string;
  sender: string;
  department: string;
  content: string;
  pushTime: string;
};

export const initialColleagueBlessings: ColleagueBlessing[] = [
  { id: 'b1', recordId: 'c1', sender: '林晓', department: '产品研发中心', content: '陈晨生日快乐，新的一岁继续闪闪发光。', pushTime: '2026-08-26 09:20:00' },
  { id: 'b2', recordId: 'c1', sender: '王悦', department: '人力行政中心', content: '祝你生日快乐，天天都有好心情。', pushTime: '2026-08-26 11:05:00' },
  { id: 'b3', recordId: 'c3', sender: '周可心', department: '人力行政中心', content: '谢谢你一直以来的认真与付出，继续闪闪发光！', pushTime: '2026-08-22 18:42:00' },
  { id: 'b4', recordId: 'c5', sender: '赵宁', department: '营销管理中心', content: '致敬初心，愿你坚定前行、一路有光。', pushTime: '2026-08-10 10:12:00' },
];

export function colleagueBlessingsFor(recordId: string, blessings: ColleagueBlessing[] = initialColleagueBlessings) {
  return blessings.filter((item) => item.recordId === recordId).sort((left, right) => right.pushTime.localeCompare(left.pushTime));
}

export const initialEmojis: CareEmoji[] = [
  { id: 'e1', name: '暖心', defaultCopy: '愿你每一天都被温柔与美好包围。', image: CARE_POSTERS.birthday, fileName: '暖心.png', status: '启用', sort: 10, updatedAt: '2026-08-26 15:30' },
  { id: 'e2', name: '礼盒', defaultCopy: '一份小小心意，送给闪闪发光的你。', image: CARE_POSTERS.festival, fileName: '礼盒.png', status: '启用', sort: 20, updatedAt: '2026-08-26 15:28' },
  { id: 'e3', name: '闪耀', defaultCopy: '你的认真和努力值得被看见，继续闪闪发光！', image: CARE_POSTERS.solar, fileName: '闪耀.png', status: '启用', sort: 30, updatedAt: '2026-08-26 15:26' },
  { id: 'e4', name: '庆祝', defaultCopy: '为这个值得纪念的时刻喝彩，期待下一次并肩出发！', image: CARE_POSTERS.party, fileName: '庆祝.png', status: '启用', sort: 40, updatedAt: '2026-08-26 15:24' },
  { id: 'e5', name: '加油', defaultCopy: '为你的坚持点赞，相信接下来会越来越好！', image: CARE_POSTERS.cycle, fileName: '加油.png', status: '启用', sort: 50, updatedAt: '2026-08-26 15:22' },
  { id: 'e6', name: '鲜花', defaultCopy: '送你一束花，愿今天有好心情，事事都如意。', image: CARE_POSTERS.heat, fileName: '鲜花.png', status: '启用', sort: 60, updatedAt: '2026-08-26 15:20' },
];

export const initialDisplaySettings: CareDisplaySettings = {
  hideExecutives: false,
  hiddenExecutiveNames: [],
  birthdayLeaderboardVisible: true,
  anniversaryLeaderboardVisible: true,
  partyLeaderboardVisible: true,
};

export function birthdayComplete(employee: CareEmployee) {
  return Boolean(employee.solarBirthday);
}

export function hireComplete(employee: CareEmployee) {
  return Boolean(employee.hireDate);
}

export function partyComplete(employee: CareEmployee) {
  return Boolean(employee.partyJoinDate);
}

export function todayIso(now = new Date()) {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function displayRuleStatus(rule: CareRule, today = todayIso()): RuleStatus {
  if (rule.type === '其他' && rule.validity === '一次性' && /^\d{4}-\d{2}-\d{2}$/.test(rule.fixedDate ?? '') && (rule.fixedDate ?? '') < today) {
    return '已过期';
  }
  return rule.status;
}

export function occasionLabel(rule: CareRule) {
  if (rule.type === '天气关怀') return rule.weatherScenes?.join('、') || '—';
  if (rule.type === '工作强度关怀') return rule.workIntensityScenes?.join('、') || '—';
  if (rule.type === '周年庆关怀') return rule.anniversaryYear ? `${rule.anniversaryYear}周年` : '—';
  if (rule.occasion?.length) return rule.occasion.join('、');
  return '—';
}

export function dateLabel(rule: CareRule) {
  return rule.fixedDate?.trim() ? rule.fixedDate : '—';
}

export function pushTimeLabel(rule: CareRule) {
  if (categoryOf(rule.type) === '事件关怀') return rule.pushTime;
  return `${rule.pushOffset || '当天'} ${rule.pushTime}`;
}

export type EmployeeQuery = { name: string; info: 'all' | 'incompleteBirthday' | 'incompleteHire' };

export function filterEmployees(rows: CareEmployee[], query: EmployeeQuery) {
  return rows.filter((row) => {
    if (query.name.trim() && !row.name.includes(query.name.trim())) return false;
    if (query.info === 'incompleteBirthday' && birthdayComplete(row)) return false;
    if (query.info === 'incompleteHire' && hireComplete(row)) return false;
    return true;
  });
}

export type RuleQuery = { name: string; status: RuleStatus | 'all'; category: CareCategory };

export const DEFAULT_TYPE_BY_CATEGORY: Record<CareCategory, CareType> = {
  个人关怀: '生日关怀',
  固定日期关怀: '节日关怀',
  事件关怀: '天气关怀',
};

export function isCareCategory(value: string | undefined): value is CareCategory {
  return Boolean(value && (CARE_CATEGORIES as string[]).includes(value));
}

export function isCareType(value: string | undefined): value is CareType {
  return Boolean(value && (CARE_TYPES as readonly string[]).includes(value));
}

export function filterRules(rows: CareRule[], query: RuleQuery, today = todayIso()) {
  return rows.filter((row) => {
    if (categoryOf(row.type) !== query.category) return false;
    if (query.name.trim() && !row.name.includes(query.name.trim())) return false;
    if (query.status !== 'all' && displayRuleStatus(row, today) !== query.status) return false;
    return true;
  });
}

export type RecordQuery = {
  source: RecordSource | 'all';
  ruleName: string;
  name: string;
  sender: string;
  department: string;
  points: string;
  pushDate: string;
  status: '已发送' | 'all';
};

export function filterRecords(rows: CareRecord[], query: RecordQuery) {
  return rows.filter((row) => {
    if (query.source !== 'all' && row.source !== query.source) return false;
    if (query.ruleName.trim() && !row.ruleName.includes(query.ruleName.trim())) return false;
    if (query.name.trim() && !row.name.includes(query.name.trim())) return false;
    if (query.sender.trim() && !row.sender.includes(query.sender.trim())) return false;
    if (query.department && row.department !== query.department) return false;
    if (query.points.trim() && String(row.points) !== query.points.trim()) return false;
    if (query.pushDate && !row.pushTime.startsWith(query.pushDate)) return false;
    if (query.status !== 'all' && row.status !== query.status) return false;
    return true;
  });
}

export function usedAnniversaryYears(rules: CareRule[], exceptId?: string) {
  return new Set(
    rules.filter((row) => row.type === '周年庆关怀' && row.id !== exceptId && row.anniversaryYear).map((row) => row.anniversaryYear as number),
  );
}

export function usedOccasions(rules: CareRule[], type: CareType, exceptId?: string) {
  return new Set(
    rules.filter((row) => row.type === type && row.id !== exceptId).flatMap((row) => row.occasion ?? []),
  );
}

export function festivalRadioOptions(rules: CareRule[], exceptId?: string) {
  const used = usedOccasions(rules, '节日关怀', exceptId);
  return FESTIVAL_GROUPS.map((group) => ({
    label: group.label,
    options: group.options.map((item) => ({
      value: item.value,
      label: used.has(item.value) ? `${item.value}（已配置）` : item.value,
      hint: item.date,
      disabled: used.has(item.value),
    })),
  }));
}

export function solarTermRadioOptions(rules: CareRule[], exceptId?: string) {
  const used = usedOccasions(rules, '节气关怀', exceptId);
  return SOLAR_TERM_DEFS.map((item) => ({
    value: item.value,
    label: used.has(item.value) ? `${item.value}（已配置）` : item.value,
    hint: item.date,
    disabled: used.has(item.value),
  }));
}

export function usedUniqueScenes(rules: CareRule[], exceptId?: string) {
  return new Set(
    rules.filter((row) => (row.type === '生日关怀' || row.type === '入党关怀') && row.id !== exceptId).map((row) => row.type),
  );
}

export function isDeferredCreateType(type: string | undefined): type is (typeof DEFERRED_CREATE_TYPES)[number] {
  return Boolean(type && (DEFERRED_CREATE_TYPES as readonly string[]).includes(type));
}

export function sceneSelectOptions(rules: CareRule[], exceptId?: string, options?: { hideDeferred?: boolean }) {
  const used = usedUniqueScenes(rules, exceptId);
  return SCENE_OPTIONS.map((group) => ({
    ...group,
    options: group.options
      .filter((item) => !(options?.hideDeferred && isDeferredCreateType(item.value)))
      .map((item) => {
        const taken = used.has(item.value as CareType);
        return {
          ...item,
          label: taken ? `${item.value}（已配置）` : item.label,
          disabled: taken,
        };
      }),
  })).filter((group) => group.options.length > 0);
}

export function defaultCreateType(category: CareCategory, rules: CareRule[]): CareType {
  const used = usedUniqueScenes(rules);
  if (category === '个人关怀') {
    if (!used.has('生日关怀')) return '生日关怀';
    return '周年庆关怀';
  }
  return DEFAULT_TYPE_BY_CATEGORY[category];
}

export function templateInUse(rules: CareRule[], templateId: string) {
  return rules.find((row) => row.templateKeys.includes(templateId));
}

export function validateRuleDraft(
  draft: Pick<CareRule, 'name' | 'type' | 'templateKeys' | 'anniversaryYear' | 'occasion' | 'validity' | 'fixedDate' | 'weatherScenes' | 'workIntensityScenes'>,
  rules: CareRule[],
  exceptId?: string,
): string | null {
  if (!draft.name.trim()) return '请输入关怀主题';
  if (draft.templateKeys.length < 1) return '请至少选择一个关怀模板';
  if ((draft.type === '生日关怀' || draft.type === '入党关怀') && usedUniqueScenes(rules, exceptId).has(draft.type)) {
    return `${draft.type}仅允许创建一个`;
  }
  if (draft.type === '周年庆关怀') {
    if (!draft.anniversaryYear) return '请选择周年数';
    if (usedAnniversaryYears(rules, exceptId).has(draft.anniversaryYear)) return '已配置的周年数不可重复选择';
  }
  if (draft.type === '节日关怀') {
    if (!draft.occasion || draft.occasion.length !== 1) return '请选择一个具体节日';
  }
  if (draft.type === '节气关怀') {
    if (!draft.occasion || draft.occasion.length !== 1) return '请选择一个具体节气';
  }
  if ((draft.type === '节日关怀' || draft.type === '节气关怀') && draft.occasion) {
    const used = usedOccasions(rules, draft.type, exceptId);
    const dup = draft.occasion.find((item) => used.has(item));
    if (dup) return `已配置的${draft.type === '节日关怀' ? '节日' : '节气'}不可重复选择`;
  }
  if (draft.type === '其他') {
    if (draft.validity === '一次性' && !draft.fixedDate) return '请选择固定日期';
    if (draft.validity !== '一次性' && !/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(draft.fixedDate ?? '')) {
      return '请按 MM-DD 格式填写';
    }
  }
  if (draft.type === '天气关怀') {
    if (!draft.weatherScenes || draft.weatherScenes.length !== 1) return '请选择一个天气场景';
  }
  if (draft.type === '工作强度关怀' && (!draft.workIntensityScenes || draft.workIntensityScenes.length !== 1)) {
    return '请选择一个触发条件';
  }
  return null;
}

export function emptyRuleDraft(type: CareType = '节日关怀'): CareRule {
  return {
    id: '',
    name: type,
    type,
    pushTime: type === '天气关怀' ? '每日 06:00、15:00、21:00' : type === '工作强度关怀' ? 'T+1 考勤更新后' : '09:00:00',
    pushOffset: '当天',
    status: '执行中',
    scope: '部门',
    scopeValues: ['all'],
    templateKeys: [],
    points: 0,
    validity: '永久生效',
    coworkerEnabled: false,
    coworkerScope: '根目录一级部门',
    coworkerOffset: '提前1天',
    coworkerTime: '10:00',
    occasion: [],
    fixedDate: '',
    anniversaryYear: type === '周年庆关怀' ? undefined : undefined,
    weatherScenes: [],
    highTemperatureThreshold: 37,
    lowTemperatureThreshold: 0,
    coldWaveDropThreshold: 8,
    coldWaveMinTemperature: 4,
    rainWarningLevels: ['黄色预警', '橙色预警', '红色预警'],
    snowWarningLevels: ['黄色预警', '橙色预警', '红色预警'],
    typhoonWarningLevels: ['蓝色预警', '黄色预警', '橙色预警', '红色预警'],
    sandstormWarningLevels: ['黄色预警', '橙色预警', '红色预警'],
    hazeAqiThreshold: 200,
    workIntensityScenes: [],
    dailyWorkHoursThreshold: 12,
    lateOffDutyTime: '23:00',
    weeklyWorkHoursThreshold: 60,
    weeklyNotifyManager: false,
    consecutiveOvertimeDays: 3,
    consecutiveNotifyManager: false,
  };
}

export const EMPLOYEE_NAME_TOKEN = '【员工姓名】';

export function cardVariablesForType(_type: CareType) {
  return [{ token: EMPLOYEE_NAME_TOKEN, label: '员工姓名' }];
}

export function insertCardVariable(text: string, start: number, end: number, token: string) {
  const from = Math.max(0, Math.min(start, text.length));
  const to = Math.max(from, Math.min(end, text.length));
  return { text: `${text.slice(0, from)}${token}${text.slice(to)}`, cursor: from + token.length };
}

export function cardBlessingPlain(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|h[1-6]|li)>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function highlightCardVariableHtml(html: string) {
  return html.split(EMPLOYEE_NAME_TOKEN).join(`<span class="care-card-var">${EMPLOYEE_NAME_TOKEN}</span>`);
}

export function emptyTemplateDraft(type: CareType = '生日关怀'): CareTemplate {
  return {
    id: '',
    name: '',
    type,
    coverImage: CARE_POSTERS.birthday,
    employeeCover: CARE_BANNERS.birthday,
    employeeTitle: '',
    employeeSummary: '',
    blessing: '',
    signature: '',
    colleagueTitle: '',
    colleagueSummary: '',
    colleagueCover: '',
    blessingOffsetX: 50,
    blessingOffsetY: 72,
  };
}

export function recordsToCsv(rows: CareRecord[], blessings: ColleagueBlessing[] = initialColleagueBlessings) {
  const header = '关怀主题,发送人,接收人,部门,关怀内容,关怀积分,同事祝福,发送时间,发送状态';
  const body = rows
    .map((row) =>
      [row.ruleName, row.sender, row.name, row.department, row.content, row.points, colleagueBlessingsFor(row.id, blessings).length, row.pushTime, row.status].join(','),
    )
    .join('\n');
  return `${header}\n${body}`;
}

export function completionStats(employees: CareEmployee[]) {
  const total = employees.length;
  const birthday = employees.filter(birthdayComplete).length;
  const hire = employees.filter(hireComplete).length;
  const party = employees.filter(partyComplete).length;
  return {
    birthday: { completed: birthday, missing: total - birthday, total, percent: Math.round((birthday / total) * 100) },
    hire: { completed: hire, missing: total - hire, total, percent: Math.round((hire / total) * 100) },
    party: { completed: party, missing: total - party, total, percent: Math.round((party / total) * 100) },
  };
}
