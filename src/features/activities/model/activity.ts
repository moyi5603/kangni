import {
  addSignupField,
  defaultSignupFields,
  setSignupFieldCompanion,
  setSignupFieldGroups,
  type SignupField,
} from './signupFields';
import type { ApprovalNode } from './rules';

const basketballImg = '/activities/basketball.jpg';
const checkupImg = '/activities/checkup.jpg';
const onboardingImg = '/activities/onboarding.jpg';
const openDayImg = '/activities/open-day.jpg';
const shareImg = '/activities/share.jpg';
const webinarImg = '/activities/webinar.jpg';

export const ACTIVITY_MOCK_VERSION = 21;
export type { SignupField } from './signupFields';
export const activityTypes = ['公司活动', '疗休养活动', '体检活动', '项目活动'] as const;
export const visibilityOptions = ['全员', '按部门', '自定义人群', '导入人群'] as const;

export type OrgTreeNode = {
  title: string;
  value: string;
  selectable?: boolean;
  disabled?: boolean;
  children?: OrgTreeNode[];
};

function flattenOrgValues(nodes: readonly OrgTreeNode[]): string[] {
  return nodes.flatMap((node) => [node.value, ...(node.children ? flattenOrgValues(node.children) : [])]);
}

export const orgDepartmentTree: OrgTreeNode[] = [
  {
    title: '研发中心',
    value: '研发中心',
    children: [
      { title: '前端组', value: '前端组' },
      { title: '后端组', value: '后端组' },
      { title: '测试组', value: '测试组' },
    ],
  },
  {
    title: '生产中心',
    value: '生产中心',
    children: [
      { title: '总装车间', value: '总装车间' },
      { title: '质检部', value: '质检部' },
    ],
  },
  {
    title: '营销中心',
    value: '营销中心',
    children: [
      { title: '华东大区', value: '华东大区' },
      { title: '华南大区', value: '华南大区' },
    ],
  },
  {
    title: '职能中心',
    value: '职能中心',
    children: [
      { title: '人力资源', value: '人力资源' },
      { title: '财务', value: '财务' },
    ],
  },
];

const peopleByLeafDepartment: Record<string, string[]> = {
  前端组: ['张悦', '李明', '孙新'],
  后端组: ['王芳', '黄码'],
  测试组: ['苏然', '郑测'],
  总装车间: ['周工', '马装'],
  质检部: ['吴检'],
  华东大区: ['陈产品'],
  华南大区: ['林销', '刘销'],
  人力资源: ['赵人事'],
  财务: ['钱会'],
};

const peoplePhones: Record<string, string> = {
  张悦: '13800001001',
  李明: '13800001002',
  王芳: '13800001003',
  苏然: '13800001004',
  周工: '13800001005',
  吴检: '13800001006',
  陈产品: '13800001111',
  林销: '13800001008',
  赵人事: '13800001009',
  钱会: '13800001010',
  孙新: '13800001011',
  黄码: '13800001012',
  郑测: '13800001013',
  马装: '13800001014',
  刘销: '13800001015',
};

export type OrgPerson = {
  name: string;
  department: string;
  phone: string;
};

export const orgPeople: OrgPerson[] = Object.entries(peopleByLeafDepartment).flatMap(([department, names]) =>
  names.map((name) => ({ name, department, phone: peoplePhones[name] ?? '13800000000' })),
);

export const orgPeopleByName: Record<string, OrgPerson> = Object.fromEntries(orgPeople.map((person) => [person.name, person]));

export function personDepartment(name: string): string | undefined {
  return orgPeopleByName[name]?.department;
}

function attachMembers(nodes: OrgTreeNode[]): OrgTreeNode[] {
  return nodes.map((node) => {
    if (node.children?.length) return { ...node, children: attachMembers(node.children) };
    return {
      ...node,
      children: (peopleByLeafDepartment[node.value] ?? []).map((name) => ({ title: name, value: name })),
    };
  });
}

export const orgPeopleTree = attachMembers(orgDepartmentTree);
export const departmentOptions = flattenOrgValues(orgDepartmentTree);
const departmentValueSet = new Set(departmentOptions);
export const peopleOptions = flattenOrgValues(orgPeopleTree).filter((value) => !departmentValueSet.has(value));

function toPeoplePickerTree(nodes: OrgTreeNode[]): OrgTreeNode[] {
  return nodes.map((node) => ({
    ...node,
    selectable: !departmentValueSet.has(node.value),
    children: node.children ? toPeoplePickerTree(node.children) : undefined,
  }));
}

export const orgPeoplePickerTree = toPeoplePickerTree(orgPeopleTree);

export function withDisabledPeople(nodes: OrgTreeNode[], disabledNames: ReadonlySet<string>): OrgTreeNode[] {
  return nodes.map((node) => {
    const isPerson = !departmentValueSet.has(node.value);
    return {
      ...node,
      disabled: isPerson && disabledNames.has(node.value),
      children: node.children ? withDisabledPeople(node.children, disabledNames) : undefined,
    };
  });
}

export function activitySignupTypes(activity: Pick<Activity, 'signupSettings'>): string[] {
  const types: string[] = [];
  const seen = new Set<string>();
  activity.signupSettings.forEach((item) => {
    const type = item.type.trim();
    if (!type || seen.has(type)) return;
    seen.add(type);
    types.push(type);
  });
  return types;
}
export const auditStatuses = ['待提交', '待审核', '已通过', '已驳回', '无需审核'] as const;
export const publishStatuses = ['未发布', '已发布'] as const;
export const activityStatuses = ['未开始', '进行中', '已结束'] as const;
/** 列表/详情展示用：未发布优先，已发布则显示活动进度 */
export const lifecycleStatuses = ['未发布', '未开始', '进行中', '已结束'] as const;

export type ActivityType = (typeof activityTypes)[number];
export type Visibility = (typeof visibilityOptions)[number];
export type AuditStatus = (typeof auditStatuses)[number];
export type PublishStatus = (typeof publishStatuses)[number];
export type ActivityStatus = (typeof activityStatuses)[number];
export type LifecycleStatus = (typeof lifecycleStatuses)[number];

export type SignupSetting = {
  type: string;
  limit?: number;
  needAudit: boolean;
  minSeniorityYears?: number;
};

export function isRecreationActivity(type: ActivityType): boolean {
  return type === '疗休养活动';
}

export type Activity = {
  id: number;
  coverUrl: string;
  title: string;
  type: ActivityType;
  category: string;
  tags: string[];
  startAt: string;
  endAt: string;
  location: string;
  organizer: string;
  phone: string;
  detailHtml: string;
  visibility: Visibility;
  departments: string[];
  customPeople: string[];
  visibilityMinSeniorityYears?: number;
  importFileName: string;
  importedPeople: string[];
  notifyOnPublish: boolean;
  signupStartAt: string;
  signupEndAt: string;
  signupSettings: SignupSetting[];
  signupFields: SignupField[];
  itinerary: string;
  extraFeeRule: string;
  signupPoints: number;
  firstCommentPoints: number;
  ratingPoints: number;
  firstMomentPoints: number;
  signupPointsEnabled: boolean;
  firstCommentPointsEnabled: boolean;
  ratingPointsEnabled: boolean;
  firstMomentPointsEnabled: boolean;
  /** 是否开启精彩瞬间审核 */
  momentAuditEnabled: boolean;
  /** 是否开启报名审批流（从属于是否审核报名） */
  activityApprovalEnabled: boolean;
  signupApprovalNodes: ApprovalNode[];
  auditStatus: AuditStatus;
  publishStatus: PublishStatus;
  activityStatus: ActivityStatus;
  pinned: boolean;
  createdAt: string;
  publishedAt: string;
};

const defaults: Pick<
  Activity,
  | 'coverUrl'
  | 'tags'
  | 'location'
  | 'organizer'
  | 'phone'
  | 'detailHtml'
  | 'visibility'
  | 'departments'
  | 'customPeople'
  | 'importFileName'
  | 'importedPeople'
  | 'notifyOnPublish'
  | 'signupStartAt'
  | 'signupEndAt'
  | 'signupSettings'
  | 'signupFields'
  | 'itinerary'
  | 'extraFeeRule'
  | 'signupPoints'
  | 'firstCommentPoints'
  | 'ratingPoints'
  | 'firstMomentPoints'
  | 'signupPointsEnabled'
  | 'firstCommentPointsEnabled'
  | 'ratingPointsEnabled'
  | 'firstMomentPointsEnabled'
  | 'momentAuditEnabled'
  | 'activityApprovalEnabled'
  | 'signupApprovalNodes'
  | 'pinned'
> = {
  coverUrl: '',
  tags: ['自愿参加'],
  location: '总部一号楼多功能厅',
  organizer: '陈产品',
  phone: '13800001111',
  detailHtml: '<p>活动详情待补充。</p>',
  visibility: '全员',
  departments: [],
  customPeople: [],
  importFileName: '',
  importedPeople: [],
  notifyOnPublish: false,
  signupStartAt: '2026-08-01 09:00',
  signupEndAt: '2026-08-31 18:00',
  signupSettings: [{ type: '个人报名', limit: 50, needAudit: true }],
  signupFields: defaultSignupFields(),
  itinerary: '',
  extraFeeRule: '',
  signupPoints: 1,
  firstCommentPoints: 10,
  ratingPoints: 10,
  firstMomentPoints: 10,
  signupPointsEnabled: true,
  firstCommentPointsEnabled: true,
  ratingPointsEnabled: true,
  firstMomentPointsEnabled: true,
  momentAuditEnabled: false,
  activityApprovalEnabled: false,
  signupApprovalNodes: [],
  pinned: false,
};

function fieldsWith(...keys: string[]): SignupField[] {
  return keys.reduce((fields, key) => addSignupField(fields, key), defaultSignupFields());
}

function groupSignupFields(
  groups: Array<{ name: string; limit: number }>,
  extraKeys: string[] = [],
): SignupField[] {
  let fields = addSignupField(defaultSignupFields(), '分组选择');
  fields = setSignupFieldGroups(fields, '分组选择', groups);
  return extraKeys.reduce((current, key) => addSignupField(current, key), fields);
}

function companionSignupFields(max: number, collect: Array<'姓名' | '手机号' | '身份证号'>, extraKeys: string[] = []): SignupField[] {
  let fields = addSignupField(defaultSignupFields(), '同行人');
  fields = setSignupFieldCompanion(fields, '同行人', max, collect);
  return extraKeys.reduce((current, key) => addSignupField(current, key), fields);
}

function detailBlock(image: string, alt: string, intro: string, items: string[], note: string): string {
  const list = items.map((item) => `<li>${item}</li>`).join('');
  return `<h2>活动介绍</h2><p>${intro}</p><p><img src="${image}" alt="${alt}" width="960" height="540"></p><h2>日程与须知</h2><ul>${list}</ul><blockquote>${note}</blockquote>`;
}

const openSignup = { signupStartAt: '2026-08-01 09:00', signupEndAt: '2026-09-30 18:00' };
const closedSignup = { signupStartAt: '2026-06-01 09:00', signupEndAt: '2026-07-15 18:00' };
const futureSignup = { signupStartAt: '2026-09-05 09:00', signupEndAt: '2026-09-30 18:00' };

function recreationExtras(): Pick<Activity, 'itinerary' | 'extraFeeRule' | 'signupSettings' | 'signupFields'> {
  return {
    itinerary: '<p>集合后统一乘车前往，入住与行程以行前通知为准。返程当天中午前办理退房。</p>',
    extraFeeRule: '<p>员工活动费用由公司承担。带家属的住宿、门票与餐费需自理，现场不支持退费。</p>',
    signupSettings: [{ type: '个人报名', limit: 40, needAudit: true, minSeniorityYears: 1 }],
    signupFields: companionSignupFields(2, ['姓名', '手机号', '身份证号'], ['身份证号']),
  };
}

function publishedClient(activity: Partial<Activity> & Pick<Activity, 'id' | 'title' | 'type'>): Activity {
  return {
    ...defaults,
    category: '文化',
    startAt: '2026-08-25 09:00',
    endAt: '2026-08-25 17:00',
    coverUrl: openDayImg,
    auditStatus: '已通过',
    activityApprovalEnabled: true,
    publishStatus: '已发布',
    activityStatus: '未开始',
    createdAt: '2026-08-10 10:00:00',
    publishedAt: '2026-08-12 09:00:00',
    ...openSignup,
    ...activity,
  };
}

export const initialActivities: Activity[] = [
  {
    ...defaults,
    id: 1,
    title: '春季员工开放日',
    type: '公司活动',
    category: '文化',
    tags: ['全员', '自愿参加'],
    startAt: '2026-04-12 09:00',
    endAt: '2026-04-12 17:00',
    coverUrl: openDayImg,
    detailHtml: detailBlock(
      openDayImg,
      '春季员工开放日现场',
      '开放日面向员工及家属，展示研发、生产和办公空间，并安排互动体验与午餐交流。请提前报名并携带工牌入场。',
      ['09:00 签到与开场介绍', '10:00 产线与展厅参观', '13:30 部门互动体验', '16:00 交流茶歇'],
      '请穿着舒适鞋履，参观产线时听从现场指引。',
    ),
    auditStatus: '已通过',
    publishStatus: '已发布',
    activityStatus: '已结束',
    createdAt: '2026-03-20 10:12:00',
    publishedAt: '2026-03-22 09:00:00',
    signupSettings: [{ type: '个人报名', limit: 80, needAudit: false }],
    signupFields: companionSignupFields(3, ['姓名', '手机号'], ['性别', '年龄']),
  },
  {
    ...defaults,
    id: 2,
    title: '新员工入职训练营',
    type: '项目活动',
    category: '培训',
    startAt: '2026-08-18 09:30',
    endAt: '2026-08-20 17:30',
    location: '培训中心 3 楼',
    visibility: '自定义人群',
    customPeople: ['张悦', '李明', '王芳'],
    visibilityMinSeniorityYears: 1,
    coverUrl: onboardingImg,
    detailHtml: detailBlock(
      onboardingImg,
      '新员工入职训练营课堂',
      '三天集中培训覆盖公司文化、产品认知、安全规范和岗位带教。结业后由导师安排跟岗。',
      ['第一天：文化与组织介绍', '第二天：产品与安全必修', '第三天：岗位演练与结业'],
      '请携带笔记本，培训期间关闭手机铃声。',
    ),
    auditStatus: '已通过',
    publishStatus: '已发布',
    activityStatus: '进行中',
    pinned: true,
    createdAt: '2026-07-28 14:05:00',
    publishedAt: '2026-08-01 11:20:00',
    signupSettings: [{ type: '个人报名', limit: 60, needAudit: true }],
    signupFields: groupSignupFields(
      [
        { name: '技术组', limit: 36 },
        { name: '业务组', limit: 24 },
      ],
      ['部门', '岗位'],
    ),
  },
  {
    ...defaults,
    id: 3,
    title: '线上公益讲座',
    type: '公司活动',
    category: '公益',
    startAt: '2026-09-06 19:00',
    endAt: '2026-09-06 21:00',
    location: '线上会议室',
    coverUrl: webinarImg,
    detailHtml: detailBlock(
      webinarImg,
      '线上公益讲座屏幕',
      '邀请公益机构分享社区服务实践，讲解志愿者报名方式和注意事项。讲座在线进行，会后提供回放。',
      ['19:00 开场与嘉宾介绍', '19:20 主题分享', '20:20 问答交流'],
      '请提前测试音频设备，提问请使用会议举手功能。',
    ),
    auditStatus: '待审核',
    publishStatus: '未发布',
    activityStatus: '未开始',
    createdAt: '2026-08-10 16:40:00',
    publishedAt: '',
  },
  {
    ...defaults,
    id: 4,
    title: '部门篮球联赛',
    type: '疗休养活动',
    category: '体育',
    startAt: '2026-09-12 13:00',
    endAt: '2026-09-13 18:00',
    visibility: '按部门',
    departments: ['研发中心', '生产中心'],
    coverUrl: basketballImg,
    itinerary: '<p>12 日下午小组赛与半决赛；13 日下午决赛、颁奖和合影。集合地点为总部球馆南门。</p>',
    extraFeeRule: '<p>员工参赛免费。带家属观赛需另缴餐费和纪念品费用，现场不支持退费。</p>',
    signupSettings: [{ type: '个人报名', limit: 50, needAudit: true, minSeniorityYears: 1 }],
    signupFields: groupSignupFields(
      [
        { name: '研发中心队', limit: 25 },
        { name: '生产中心队', limit: 25 },
      ],
      ['工号'],
    ),
    detailHtml: detailBlock(
      basketballImg,
      '部门篮球联赛赛场',
      '研发中心与生产中心组队参赛，采用小组循环后淘汰。现场提供急救与饮水保障。',
      ['12 日下午小组赛', '13 日下午半决赛与决赛', '赛后颁奖与合影'],
      '参赛请穿着运动鞋，观赛请在看台区域，勿进入场地。',
    ),
    auditStatus: '已通过',
    publishStatus: '未发布',
    activityStatus: '未开始',
    createdAt: '2026-08-08 09:18:00',
    publishedAt: '',
  },
  {
    ...defaults,
    id: 5,
    title: '产品知识分享会',
    type: '项目活动',
    category: '培训',
    startAt: '2026-07-02 14:00',
    endAt: '2026-07-02 16:00',
    coverUrl: shareImg,
    detailHtml: detailBlock(
      shareImg,
      '产品知识分享会现场',
      '围绕本季度重点产品讲解卖点、常见问题和演示话术，适合销售与售前同事参加。',
      ['14:00 产品版本说明', '14:40 场景演示', '15:20 问答与资料发放'],
      '分享提纲需会前补充完整后再提交审核。',
    ),
    auditStatus: '已驳回',
    publishStatus: '未发布',
    activityStatus: '已结束',
    createdAt: '2026-06-18 11:02:00',
    publishedAt: '',
  },
  {
    ...defaults,
    id: 6,
    title: '年度体检安排',
    type: '体检活动',
    category: '公益',
    startAt: '2026-10-18 08:30',
    endAt: '2026-10-18 12:00',
    coverUrl: checkupImg,
    detailHtml: detailBlock(
      checkupImg,
      '年度体检指引',
      '公司统一组织年度体检，含基础检查与可选加项。请空腹到场，并携带身份证与工牌。',
      ['08:30 签到抽血', '09:30 内科与影像检查', '11:30 领取结果说明'],
      '如有特殊病史请提前告知医护人员，孕妇请选择对应套餐。',
    ),
    auditStatus: '无需审核',
    publishStatus: '已发布',
    activityStatus: '未开始',
    createdAt: '2026-08-15 08:50:00',
    publishedAt: '2026-08-16 10:00:00',
    signupSettings: [{ type: '个人报名', limit: 200, needAudit: false }],
    signupFields: fieldsWith('身份证号', '年龄', '部门'),
  },
  {
    ...defaults,
    id: 7,
    title: '骨干人才交流会',
    type: '项目活动',
    category: '培训',
    tags: ['限额', '需审核'],
    startAt: '2026-09-22 14:00',
    endAt: '2026-09-22 17:00',
    location: '总部二号楼会议室',
    organizer: '张悦',
    visibility: '自定义人群',
    customPeople: mockPeople(30, '骨干'),
    visibilityMinSeniorityYears: 3,
    coverUrl: shareImg,
    detailHtml: detailBlock(
      shareImg,
      '骨干人才交流会现场',
      '面向司龄满三年的骨干员工，分享项目经验与晋升路径，控制参与规模便于深度交流。',
      ['14:00 开场与议题介绍', '14:40 分组研讨', '16:20 汇总与答疑'],
      '请提前阅读议题材料，现场关闭手机铃声。',
    ),
    auditStatus: '待提交',
    publishStatus: '未发布',
    activityStatus: '未开始',
    createdAt: '2026-08-18 09:20:00',
    publishedAt: '',
    signupSettings: [{ type: '个人报名', limit: 30, needAudit: true, minSeniorityYears: 3 }],
    signupFields: fieldsWith('工号', '岗位'),
  },
  {
    ...defaults,
    id: 8,
    title: '安全专项培训',
    type: '公司活动',
    category: '培训',
    tags: ['全员'],
    startAt: '2026-10-08 09:00',
    endAt: '2026-10-08 12:00',
    location: '培训中心 1 楼',
    organizer: '陈产品',
    visibility: '导入人群',
    importFileName: '安全专项培训可见人群.csv',
    importedPeople: mockPeople(50, '学员'),
    coverUrl: webinarImg,
    detailHtml: detailBlock(
      webinarImg,
      '安全专项培训课堂',
      '按导入名单组织安全生产专项培训，覆盖一线和相关岗位人员。请凭通知入场。',
      ['09:00 签到与开场', '09:20 安全法规与案例', '11:00 考核说明'],
      '请携带工牌，迟到超过 15 分钟视为缺勤。',
    ),
    auditStatus: '待提交',
    publishStatus: '未发布',
    activityStatus: '未开始',
    createdAt: '2026-08-18 10:05:00',
    publishedAt: '',
  },
  publishedClient({
    id: 9,
    title: '中秋员工晚会',
    type: '公司活动',
    category: '文化',
    startAt: '2026-09-12 18:00',
    endAt: '2026-09-12 21:00',
    coverUrl: openDayImg,
    publishedAt: '2026-08-12 09:30:00',
    signupSettings: [{ type: '个人报名', limit: 120, needAudit: false }],
    signupFields: companionSignupFields(2, ['姓名', '手机号'], ['性别']),
    detailHtml: detailBlock(openDayImg, '中秋员工晚会', '中秋节员工晚会含节目汇演、抽奖和家书环节，欢迎携家属观演。', ['18:00 签到入场', '18:30 节目演出', '20:30 抽奖与合影'], '请提前在线上领取电子门票。'),
  }),
  publishedClient({
    id: 10,
    title: '公益植树日',
    type: '公司活动',
    category: '公益',
    startAt: '2026-09-03 08:30',
    endAt: '2026-09-03 16:00',
    location: '城郊生态园',
    coverUrl: webinarImg,
    publishedAt: '2026-08-11 14:00:00',
    detailHtml: detailBlock(webinarImg, '公益植树日', '走进城郊生态园参与植树和环保宣讲，完成当日公益时数登记。', ['08:30 集合出发', '10:00 植树', '14:00 环保课堂'], '请穿着便于行走的鞋服，现场发放工具。'),
  }),
  publishedClient({
    id: 11,
    title: '司庆展览周',
    type: '公司活动',
    category: '文化',
    startAt: '2026-07-08 09:00',
    endAt: '2026-07-12 17:00',
    coverUrl: openDayImg,
    activityStatus: '已结束',
    ...closedSignup,
    publishedAt: '2026-06-20 10:00:00',
    detailHtml: detailBlock(openDayImg, '司庆展览周', '回顾公司发展历程，展出产品、荣誉与员工故事，已于司庆期间完成。', ['开展仪式', '展厅参观', '闭展整理'], '展览已结束，资料可在内网回看。'),
  }),
  publishedClient({
    id: 12,
    title: '秋季消防演练',
    type: '公司活动',
    category: '培训',
    startAt: '2026-09-18 14:00',
    endAt: '2026-09-18 16:00',
    coverUrl: webinarImg,
    ...futureSignup,
    publishedAt: '2026-08-08 09:00:00',
    detailHtml: detailBlock(webinarImg, '秋季消防演练', '全员参与疏散与灭火器实操，报名将于九月初开放。', ['14:00 集合点名', '14:20 疏散演练', '15:20 实操考核'], '请按楼层管理员指引行动，勿乘坐电梯。'),
  }),
  publishedClient({
    id: 13,
    title: '数字化转型工作坊',
    type: '项目活动',
    category: '培训',
    startAt: '2026-08-26 09:00',
    endAt: '2026-08-26 17:00',
    location: '培训中心 2 楼',
    coverUrl: shareImg,
    publishedAt: '2026-08-13 11:00:00',
    detailHtml: detailBlock(shareImg, '数字化转型工作坊', '围绕业务流程数字化拆解痛点，输出可落地的改进清单。', ['09:00 现状共创', '13:30 方案工作坊', '16:30 汇报'], '请携带笔记本，提前阅读背景材料。'),
  }),
  publishedClient({
    id: 14,
    title: '质量改进项目启动',
    type: '项目活动',
    category: '培训',
    startAt: '2026-07-10 09:00',
    endAt: '2026-07-10 12:00',
    coverUrl: onboardingImg,
    activityStatus: '已结束',
    ...closedSignup,
    publishedAt: '2026-06-28 09:00:00',
    detailHtml: detailBlock(onboardingImg, '质量改进项目启动', '启动跨部门质量改进项目，明确目标和里程碑，活动已结束。', ['目标对齐', '小组认领', '排期确认'], '后续进展请关注项目周报。'),
  }),
  publishedClient({
    id: 15,
    title: '客户成功项目复盘',
    type: '项目活动',
    category: '培训',
    startAt: '2026-09-16 14:00',
    endAt: '2026-09-16 17:00',
    coverUrl: shareImg,
    ...futureSignup,
    publishedAt: '2026-08-09 16:00:00',
    detailHtml: detailBlock(shareImg, '客户成功项目复盘', '复盘重点客户交付过程，沉淀可复用方法。报名九月开放。', ['案例拆解', '问题归因', '行动项确认'], '请提前准备本团队案例一页纸。'),
  }),
  publishedClient({
    id: 16,
    title: '供应链协同攻关',
    type: '项目活动',
    category: '培训',
    startAt: '2026-07-22 09:00',
    endAt: '2026-07-24 17:00',
    coverUrl: onboardingImg,
    activityStatus: '已结束',
    ...closedSignup,
    publishedAt: '2026-07-01 10:00:00',
    detailHtml: detailBlock(onboardingImg, '供应链协同攻关', '生产、采购与计划三方联合攻关交付瓶颈，项目集训已完成。', ['问题诊断', '方案共创', '试点安排'], '成果已同步至供应链月报。'),
  }),
  publishedClient({
    id: 17,
    title: '入职体检专场',
    type: '体检活动',
    category: '公益',
    startAt: '2026-08-28 08:00',
    endAt: '2026-08-28 11:30',
    location: '合作医院体检中心',
    coverUrl: checkupImg,
    publishedAt: '2026-08-14 08:30:00',
    detailHtml: detailBlock(checkupImg, '入职体检专场', '为近期入职员工安排集中体检，含基础套餐，请空腹到场。', ['08:00 签到抽血', '09:00 内科检查', '11:00 结果说明'], '请携带身份证与入职通知。'),
  }),
  publishedClient({
    id: 18,
    title: '职业健康复查',
    type: '体检活动',
    category: '公益',
    startAt: '2026-07-06 08:30',
    endAt: '2026-07-06 12:00',
    coverUrl: checkupImg,
    activityStatus: '已结束',
    ...closedSignup,
    publishedAt: '2026-06-18 09:00:00',
    detailHtml: detailBlock(checkupImg, '职业健康复查', '针对岗前筛查异常人员组织复查，本场次已完成。', ['复查登记', '专项检查', '结果解读'], '如需补检请联系 EHS。'),
  }),
  publishedClient({
    id: 19,
    title: '女工专项体检',
    type: '体检活动',
    category: '公益',
    startAt: '2026-09-20 08:00',
    endAt: '2026-09-20 12:00',
    coverUrl: checkupImg,
    ...futureSignup,
    publishedAt: '2026-08-07 11:20:00',
    detailHtml: detailBlock(checkupImg, '女工专项体检', '面向女职工的专项体检套餐，报名将于九月初开放。', ['08:00 签到', '08:30 专项检查', '11:30 健康咨询'], '请按短信预约时段到场，避免集中排队。'),
  }),
  publishedClient({
    id: 20,
    title: '高管体检预约',
    type: '体检活动',
    category: '公益',
    startAt: '2026-07-18 08:00',
    endAt: '2026-07-18 12:00',
    coverUrl: checkupImg,
    activityStatus: '已结束',
    ...closedSignup,
    publishedAt: '2026-06-25 15:00:00',
    detailHtml: detailBlock(checkupImg, '高管体检预约', '高管年度体检绿色通道已结束，报告通过邮件发送。', ['预约确认', '到院检查', '报告解读'], '如未收到报告请联系行政。'),
  }),
  publishedClient({
    id: 21,
    title: '黄山两日游',
    type: '疗休养活动',
    category: '文化',
    startAt: '2026-09-19 07:00',
    endAt: '2026-09-20 20:00',
    location: '黄山风景区',
    coverUrl: basketballImg,
    publishedAt: '2026-08-15 09:00:00',
    ...recreationExtras(),
    detailHtml: detailBlock(basketballImg, '黄山两日游', '司龄达标员工可报名黄山两日疗休养，含交通、住宿与门票。', ['19 日出发登高', '20 日景区游览返程'], '请根据自身健康状况评估行程强度。'),
  }),
  publishedClient({
    id: 22,
    title: '海边团建疗休养',
    type: '疗休养活动',
    category: '文化',
    startAt: '2026-09-26 08:00',
    endAt: '2026-09-27 19:00',
    location: '象山海岸',
    coverUrl: basketballImg,
    publishedAt: '2026-08-14 13:40:00',
    ...recreationExtras(),
    detailHtml: detailBlock(basketballImg, '海边团建疗休养', '海边两日疗休养，含团建游戏与自由活动时段。', ['26 日出发入住', '27 日团建与返程'], '水性不佳请勿独自下水，听从现场安排。'),
  }),
  publishedClient({
    id: 23,
    title: '温泉康养营',
    type: '疗休养活动',
    category: '文化',
    startAt: '2026-07-04 08:00',
    endAt: '2026-07-05 18:00',
    location: '南京汤山',
    coverUrl: basketballImg,
    activityStatus: '已结束',
    ...closedSignup,
    ...recreationExtras(),
    publishedAt: '2026-06-15 10:00:00',
    detailHtml: detailBlock(basketballImg, '温泉康养营', '汤山温泉康养营已结束，感谢参与同事的反馈。', ['出发入住', '康养课程', '返程'], '照片已同步至活动相册。'),
  }),
  publishedClient({
    id: 24,
    title: '秋季登山活动',
    type: '疗休养活动',
    category: '体育',
    startAt: '2026-09-27 07:30',
    endAt: '2026-09-27 16:00',
    location: '紫金山登山道',
    coverUrl: basketballImg,
    ...futureSignup,
    ...recreationExtras(),
    publishedAt: '2026-08-06 09:40:00',
    detailHtml: detailBlock(basketballImg, '秋季登山活动', '秋季登山轻量疗休养，报名九月初开放。', ['07:30 山脚集合', '08:00 分批次出发', '15:00 下山'], '请量力而行，随身携带饮水。'),
  }),
  publishedClient({
    id: 25,
    title: '家庭日郊游',
    type: '疗休养活动',
    category: '文化',
    startAt: '2026-07-19 09:00',
    endAt: '2026-07-19 16:00',
    location: '植物园',
    coverUrl: openDayImg,
    activityStatus: '已结束',
    ...closedSignup,
    ...recreationExtras(),
    publishedAt: '2026-07-02 11:00:00',
    detailHtml: detailBlock(openDayImg, '家庭日郊游', '员工家庭日郊游已举办完成，适合带家属回顾活动照片。', ['上午亲子游戏', '中午野餐', '下午自由参观'], '相册将保留至年底。'),
  }),
];

function mockPeople(count: number, prefix: string): string[] {
  return Array.from({ length: count }, (_, index) => `${prefix}${String(index + 1).padStart(2, '0')}`);
}

export function formatCustomCrowdVisibility(people: string[], years?: number): string {
  const countText = `自定义人群：共${people.length}人`;
  return years == null ? countText : `${countText}；司龄>=${years}年`;
}

export function formatActivityTime(activity: Activity): string {
  return `${activity.startAt} ~ ${activity.endAt}`;
}

export function getActivityLifecycleStatus(
  activity: Pick<Activity, 'publishStatus' | 'activityStatus'>,
): LifecycleStatus {
  return activity.publishStatus === '已发布' ? activity.activityStatus : '未发布';
}

export const lifecycleStatusColor: Record<LifecycleStatus, string> = {
  未发布: 'default',
  未开始: 'default',
  进行中: 'processing',
  已结束: 'default',
};

export function formatPublishedAt(value: string): string {
  return value || '—';
}

export function canPublishActivity(activity: Pick<Activity, 'auditStatus'>): boolean {
  return activity.auditStatus === '已通过' || activity.auditStatus === '无需审核';
}

export function canSubmitApproval(activity: Pick<Activity, 'auditStatus' | 'activityApprovalEnabled'>): boolean {
  if (!activity.activityApprovalEnabled) return false;
  return activity.auditStatus === '待提交' || activity.auditStatus === '已驳回';
}

export function canReviewActivity(activity: Pick<Activity, 'auditStatus' | 'activityApprovalEnabled'>): boolean {
  if (!activity.activityApprovalEnabled) return false;
  return activity.auditStatus === '待审核';
}

export function canGrantPrize(activity: Pick<Activity, 'publishStatus' | 'activityStatus'>): boolean {
  return activity.publishStatus === '已发布' && activity.activityStatus === '已结束';
}

export function grantPrizeBlockReason(activity: Pick<Activity, 'publishStatus' | 'activityStatus'>): string | undefined {
  if (canGrantPrize(activity)) return undefined;
  if (activity.publishStatus !== '已发布' && activity.activityStatus !== '已结束') {
    return '仅已结束且已发布的活动可以发放奖励';
  }
  if (activity.publishStatus !== '已发布') return '未发布活动不能发放奖励';
  return '活动未结束，不能发放奖励';
}

export const activityReviewer = '苏然';

export function emptySignupSetting(): SignupSetting {
  return { type: '', needAudit: true };
}
