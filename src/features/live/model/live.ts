export type LiveStatus = '预告' | '直播中' | '已结束' | '回放';

export type LiveVisibilityScope = '全员' | '按部门' | '导入';

export type LiveRecord = {
  id: number;
  title: string;
  coverUrl: string;
  host: string;
  hostPhone: string;
  startAt: string;
  endAt: string;
  description: string;
  visibilityEnabled: boolean;
  visibilityScope: LiveVisibilityScope;
  visibilityDepartments: string[];
  visibilityFileName: string;
  viewers: number;
  hasReplay: boolean;
};

export type LiveComment = {
  id: number;
  liveId: number;
  user: string;
  content: string;
  at: string;
};

export type LiveViewer = {
  id: number;
  liveId: number;
  name: string;
  department: string;
  minutes: number;
  joinAt: string;
};

export const LIVE_STATUS_OPTIONS: LiveStatus[] = ['预告', '直播中', '已结束', '回放'];

export const LIVE_VISIBILITY_SCOPES: LiveVisibilityScope[] = ['全员', '按部门', '导入'];

export const LIVE_PHONE_PATTERN = /^1\d{10}$/;

export function parseLiveTime(value: string): number {
  return Date.parse(value.replace(' ', 'T'));
}

export function liveStatusOf(record: Pick<LiveRecord, 'startAt' | 'endAt' | 'hasReplay'>, now: number = Date.now()): LiveStatus {
  const start = parseLiveTime(record.startAt);
  const end = parseLiveTime(record.endAt);
  if (Number.isFinite(start) && now < start) return '预告';
  if (Number.isFinite(end) && now > end) return record.hasReplay ? '回放' : '已结束';
  return '直播中';
}

export type LiveLinks = { lecturer: string; student: string };

export function liveLinks(id: number): LiveLinks {
  const code = `LV${String(id).padStart(4, '0')}`;
  return {
    lecturer: `https://live.kangni.cn/lecturer/${code}`,
    student: `https://live.kangni.cn/watch/${code}`,
  };
}

export function liveVisibilityText(record: LiveRecord): string {
  if (!record.visibilityEnabled) return '不限制';
  if (record.visibilityScope === '按部门') return `按部门（${record.visibilityDepartments.join('、') || '未选择'}）`;
  if (record.visibilityScope === '导入') return `导入名单（${record.visibilityFileName || '未上传'}）`;
  return '全员';
}

export const initialLives: LiveRecord[] = [
  {
    id: 1,
    title: '季度全员大会直播',
    coverUrl: '',
    host: '王芳',
    hostPhone: '13800000001',
    startAt: '2026-09-09 14:00',
    endAt: '2026-09-09 23:59',
    description: '季度经营复盘与下季度目标宣贯，全员参加。',
    visibilityEnabled: true,
    visibilityScope: '全员',
    visibilityDepartments: [],
    visibilityFileName: '',
    viewers: 1862,
    hasReplay: false,
  },
  {
    id: 2,
    title: '新员工入职培训专场',
    coverUrl: '',
    host: '林浅',
    hostPhone: '13800000002',
    startAt: '2026-09-12 10:00',
    endAt: '2026-09-12 11:30',
    description: '企业文化、制度流程与办公系统入门。',
    visibilityEnabled: true,
    visibilityScope: '按部门',
    visibilityDepartments: ['研发中心', '生产中心'],
    visibilityFileName: '',
    viewers: 0,
    hasReplay: false,
  },
  {
    id: 3,
    title: '智能制造产线云参观',
    coverUrl: '',
    host: '陈产品',
    hostPhone: '13800000003',
    startAt: '2026-09-05 15:00',
    endAt: '2026-09-05 16:00',
    description: '走进智能工厂，了解产线数字化改造。',
    visibilityEnabled: false,
    visibilityScope: '全员',
    visibilityDepartments: [],
    visibilityFileName: '',
    viewers: 764,
    hasReplay: true,
  },
  {
    id: 4,
    title: '安全月专题讲座：高空作业规范',
    coverUrl: '',
    host: '吴检',
    hostPhone: '13800000004',
    startAt: '2026-08-28 09:30',
    endAt: '2026-08-28 11:00',
    description: '高空作业审批流程与防护要点。',
    visibilityEnabled: true,
    visibilityScope: '导入',
    visibilityDepartments: [],
    visibilityFileName: '高空作业人员名单.xlsx',
    viewers: 1105,
    hasReplay: false,
  },
  {
    id: 5,
    title: '研发中心技术分享：前端性能优化',
    coverUrl: '',
    host: '黄码',
    hostPhone: '13800000005',
    startAt: '2026-09-18 19:00',
    endAt: '2026-09-18 20:30',
    description: '首屏加载、长列表与包体积优化实践。',
    visibilityEnabled: true,
    visibilityScope: '按部门',
    visibilityDepartments: ['研发中心'],
    visibilityFileName: '',
    viewers: 0,
    hasReplay: false,
  },
];

export const initialLiveComments: LiveComment[] = [
  { id: 1, liveId: 1, user: '李工', content: '信号很稳定，给会务组点赞', at: '2026-09-09 14:12' },
  { id: 2, liveId: 1, user: '张敏', content: '请问回放什么时候可以看？', at: '2026-09-09 14:35' },
  { id: 3, liveId: 1, user: '赵磊', content: 'PPT 能分享一份吗', at: '2026-09-09 15:02' },
  { id: 4, liveId: 3, user: '周洁', content: '产线机械臂太震撼了', at: '2026-09-05 15:20' },
  { id: 5, liveId: 3, user: '陈晨', content: '建议多办几期云参观', at: '2026-09-05 15:41' },
];

export const initialLiveViewers: LiveViewer[] = [
  { id: 1, liveId: 1, name: '李工', department: '研发中心 · 前端组', minutes: 58, joinAt: '2026-09-09 14:02' },
  { id: 2, liveId: 1, name: '张敏', department: '生产中心 · 一车间', minutes: 47, joinAt: '2026-09-09 14:05' },
  { id: 3, liveId: 1, name: '赵磊', department: '研发中心 · 测试组', minutes: 39, joinAt: '2026-09-09 14:21' },
  { id: 4, liveId: 3, name: '周洁', department: '品牌文化部', minutes: 60, joinAt: '2026-09-05 15:00' },
  { id: 5, liveId: 3, name: '陈晨', department: '生产中心 · 二车间', minutes: 52, joinAt: '2026-09-05 15:03' },
];
