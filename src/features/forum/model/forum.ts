export const FORUM_ORGANIZATIONS = [
  '全公司',
  '总经办',
  '人力行政中心',
  '人力资源部',
  '行政部',
  '经营管理中心',
  '营销管理中心',
  '运营管理中心',
  '产品研发中心',
  '市场产品部',
  '新零售部',
  '平台增长部',
] as const;

export const FORUM_MANAGER_OPTIONS = [
  { name: '管宁', department: '平台运营部' },
  { name: '李晴', department: '创新运营组' },
  { name: '赵宁', department: '信箱办公室' },
  { name: '王涛', department: '社区运营' },
  { name: '陈颖', department: '社区运营' },
  { name: '刘畅', department: '研发效能组' },
  { name: '孙悦', department: '客户体验部' },
  { name: '何安', department: '人力资源部' },
  { name: '高原', department: '产品委员会' },
  { name: '郑洁', department: '合规风控部' },
  { name: '张磊', department: '行政服务部' },
  { name: '宋妍', department: '总经理办公室' },
  { name: '蒋帆', department: '客户成功部' },
  { name: '余嘉', department: '人力资源部' },
  { name: '唐宇', department: '社区运营' },
  { name: '田一', department: '学习发展部' },
  { name: '韩梅', department: '社区运营' },
  { name: '杜平', department: '信息技术部' },
  { name: '林可', department: '组织发展部' },
  { name: '林知夏', department: '信箱办公室' },
  { name: '周明远', department: '经营管理中心' },
] as const;

export const FORUM_USER_OPTIONS = [
  ...FORUM_MANAGER_OPTIONS,
  { name: '周敏', department: '市场品牌部' },
  { name: '许诺', department: '采购管理部' },
  { name: '吴倩', department: '流程管理部' },
  { name: '方圆', department: '企业文化部' },
  { name: '罗兰', department: '学习发展部' },
  { name: '马骏', department: '销售运营部' },
  { name: '谢琳', department: '财务共享中心' },
  { name: '秦峰', department: '安全管理部' },
  { name: '彭越', department: '供应链中心' },
  { name: '苏晨', department: '数据平台部' },
] as const;

export type ForumOrgNode = {
  title: string;
  value: string;
  selectable?: boolean;
  disableCheckbox?: boolean;
  disabled?: boolean;
  children?: ForumOrgNode[];
};

const FORUM_ORG_BRANCHES: Array<{ title: string; children?: string[] }> = [
  { title: '总经办' },
  { title: '人力行政中心', children: ['人力资源部', '行政部'] },
  { title: '经营管理中心' },
  { title: '营销管理中心', children: ['市场产品部', '新零售部'] },
  { title: '运营管理中心', children: ['平台增长部'] },
  { title: '产品研发中心' },
];

function peopleByDepartment(): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  for (const person of FORUM_USER_OPTIONS) {
    const names = grouped.get(person.department) ?? [];
    if (!names.includes(person.name)) names.push(person.name);
    grouped.set(person.department, names);
  }
  return grouped;
}

function peopleLeaves(department: string, grouped: Map<string, string[]>): ForumOrgNode[] | undefined {
  const names = grouped.get(department);
  if (!names?.length) return undefined;
  return names.map((name) => ({ title: name, value: name }));
}

function orgBranch(title: string, childTitles: string[] | undefined, grouped: Map<string, string[]>, used: Set<string>): ForumOrgNode {
  used.add(title);
  const nested = (childTitles ?? []).map((child) => {
    used.add(child);
    return { title: child, value: child, children: peopleLeaves(child, grouped) };
  });
  const children = [...nested, ...(peopleLeaves(title, grouped) ?? [])];
  return { title, value: title, children: children.length ? children : undefined };
}

export const forumOrgTree: ForumOrgNode[] = (() => {
  const grouped = peopleByDepartment();
  const used = new Set<string>(['全公司']);
  const branches = FORUM_ORG_BRANCHES.map((item) => orgBranch(item.title, item.children, grouped, used));
  const extras = [...grouped.keys()]
    .filter((department) => !used.has(department))
    .sort((a, b) => a.localeCompare(b, 'zh'))
    .map((department) => ({ title: department, value: department, children: peopleLeaves(department, grouped) }));
  return [{ title: '全公司', value: '全公司', children: [...branches, ...extras] }];
})();

export function flattenForumOrgValues(nodes: ForumOrgNode[]): string[] {
  return nodes.flatMap((node) => [node.value, ...(node.children ? flattenForumOrgValues(node.children) : [])]);
}

const forumPersonNames = new Set(FORUM_USER_OPTIONS.map((item) => item.name));

export function isForumPersonName(value: string): boolean {
  return forumPersonNames.has(value);
}

export function onlyForumPeople(values: string[]): string[] {
  return values.filter((item) => isForumPersonName(item.trim()));
}

export const forumPeoplePickerTree: ForumOrgNode[] = (() => {
  const mark = (nodes: ForumOrgNode[]): ForumOrgNode[] =>
    nodes.map((node) => {
      const isPerson = isForumPersonName(node.value);
      return {
        ...node,
        selectable: isPerson,
        disableCheckbox: !isPerson,
        children: node.children ? mark(node.children) : undefined,
      };
    });
  return mark(forumOrgTree);
})();

export type ForumKind = 'forum' | 'mailbox';
export type BoardStatus = 'enabled' | 'disabled';
export type TopicAuditStatus = '直接发布' | '待审核' | '已通过' | '已驳回';
export type PinScope = '' | 'global' | 'board';
export type ShelfStatus = 'on' | 'off';

export const MAILBOX_RESPONSE_SLA_OPTIONS = ['24h', '48h', '一周', '不限时'] as const;
export type MailboxResponseSla = (typeof MAILBOX_RESPONSE_SLA_OPTIONS)[number];
export const FORUM_VISIBILITY_OPTIONS = ['全员', '按部门', '自定义人群', '导入人群'] as const;
export type ForumVisibility = (typeof FORUM_VISIBILITY_OPTIONS)[number];

export type MailboxChair = {
  entryName: string;
  name: string;
  purpose: string;
  receiveTypes: string[];
  replyPerson: string;
};

export type ForumBoard = {
  id: number;
  kind: ForumKind;
  name: string;
  description: string;
  rules: string;
  purpose?: string;
  organizations: string;
  visibility: ForumVisibility;
  departments?: string[];
  customPeople?: string[];
  importFileName?: string;
  importedPeople?: string[];
  manager: string;
  replier?: string;
  anonymous: boolean;
  status: BoardStatus;
  createdAt: string;
  chairs?: MailboxChair[];
  headerImage?: string;
  icon?: string;
  tags?: string[];
  responseSlaEnabled?: boolean;
  responseSla?: MailboxResponseSla;
};

export type ForumBoardDraft = {
  kind: ForumKind;
  name: string;
  description: string;
  rules: string;
  purpose?: string;
  organizations: string[];
  visibility: ForumVisibility;
  departments?: string[];
  customPeople?: string[];
  importFileName?: string;
  importedPeople?: string[];
  managers: string[];
  repliers?: string[];
  anonymous: boolean;
  chairs?: MailboxChair[];
  headerImage?: string;
  icon?: string;
  tags?: string[];
  responseSlaEnabled?: boolean;
  responseSla?: MailboxResponseSla;
};

export const FORUM_COMMENT_MAX = 200;
export const FORUM_COMMENT_IMAGE_MAX = 9;
export const forumAdminSelf = '陈产品';
export const forumClientSelf = '周敏';
export const forumCommentVestAccounts = ['论坛小助手', '官方客服'] as const;

export function forumCommentReplyAccountOptions() {
  return [
    { value: forumAdminSelf, label: `${forumAdminSelf}（个人账号）` },
    ...forumCommentVestAccounts.map((name) => ({ value: name, label: name })),
  ];
}

export function isForumCommentReplyAccount(name: string): boolean {
  return name === forumAdminSelf || (forumCommentVestAccounts as readonly string[]).includes(name);
}

export type ForumTopicReply = {
  id: number;
  author: string;
  authorAnonymous?: boolean;
  content: string;
  createdAt: string;
  replyTo?: string;
  pinned?: boolean;
  images?: string[];
  likedBy?: string[];
};

export type ForumTopicComment = {
  id: number;
  author: string;
  authorAnonymous?: boolean;
  content: string;
  createdAt: string;
  replies: ForumTopicReply[];
  pinned?: boolean;
  images?: string[];
  likedBy?: string[];
};

export type ForumChairmanReply = { content: string; time: string; author?: string };

export type ForumTopic = {
  id: number;
  title: string;
  content: string;
  boardName: string;
  author: string;
  authorAnonymous?: boolean;
  auditStatus: TopicAuditStatus;
  commentCount: number;
  likeCount: number;
  viewCount: number;
  favoriteCount: number;
  images: string[];
  comments: ForumTopicComment[];
  pinScope: PinScope;
  publishedAt: string;
  shelfStatus: ShelfStatus;
  chairName?: string;
  replyAssignees?: string;
  tags: string[];
  auditHistory?: { result: string; reviewer: string; time: string; reason: string }[];
  operationHistory?: { action: string; operator: string; time: string; detail: string }[];
  chairmanReply?: ForumChairmanReply;
  chairmanReplies?: ForumChairmanReply[];
};

export const forumTagStatuses = ['启用', '禁用'] as const;
export type ForumTagStatus = (typeof forumTagStatuses)[number];

export type ForumTagScope = 'forum' | 'mailbox';

export type ForumTagRecord = {
  id: number;
  name: string;
  order: number;
  status: ForumTagStatus;
  createdAt: string;
  scope: ForumTagScope;
};

export type ForumTagFormValues = {
  name: string;
  order?: number;
  scope?: ForumTagScope;
};

export const MUTE_REASON_MAX = 100;

export type MuteRecord = {
  id: number;
  user: string;
  department: string;
  reason: string;
  mutedAt: string;
  releasedAt?: string;
  operator: string;
  active: boolean;
};

export type MuteDraft = {
  user: string;
  department: string;
  reason: string;
};

export type BoardQuery = {
  kind: ForumKind;
  name?: string;
  status?: BoardStatus | 'all';
  visibility?: string;
  manager?: string;
  chair?: string;
  anonymous?: 'all' | 'true' | 'false';
  createdFrom?: string;
  createdTo?: string;
};

export type TopicQuery = {
  kind: ForumKind;
  keyword?: string;
  boardName?: string;
  author?: string;
  chairName?: string;
  management?: 'all' | '普通' | '置顶' | '已下架';
  createdFrom?: string;
  createdTo?: string;
};

const DEFAULT_RULES = '文明交流，遵守社区规范，禁止发布违法违规内容。';

export const initialMailboxChairs: MailboxChair[] = [
  {
    entryName: '员工体验建言',
    name: '林知夏',
    purpose: '关注员工体验、组织沟通与人才发展。',
    receiveTypes: ['员工体验', '人才发展', '企业文化'],
    replyPerson: '赵宁、宋妍',
  },
  {
    entryName: '经营发展建言',
    name: '周明远',
    purpose: '关注经营管理、跨部门协作与业务创新。',
    receiveTypes: ['战略发展', '工作流程', '业务创新'],
    replyPerson: '管宁、何安',
  },
];

export const initialBoards: ForumBoard[] = [
  {
    id: 1,
    kind: 'forum',
    name: '二手论坛',
    description:
      '员工闲置物品信息发布与交流。园区内可自提，交易前请当面验货、自行议价；禁止发布虚假信息、违禁品和广告引流。成交后请及时下架，保持论坛信息有效。',
    rules: DEFAULT_RULES,
    organizations: '全员',
    visibility: '全员',
    manager: '王涛、唐宇',
    anonymous: true,
    status: 'enabled',
    createdAt: '2026-08-11 10:32',
    headerImage: '/forum/secondhand.jpg',
    icon: '/forum/secondhand-icon.png',
    tags: ['闲置转让', '求购'],
  },
  {
    id: 2,
    kind: 'forum',
    name: '建议论坛',
    description: '收集员工对产品、服务与管理的改进建议',
    rules: DEFAULT_RULES,
    organizations: '全员',
    visibility: '全员',
    manager: '李晴',
    anonymous: true,
    status: 'enabled',
    createdAt: '2026-08-11 09:18',
    headerImage: '/forum/suggestion.jpg',
    icon: '/forum/suggestion-icon.png',
    tags: ['办公建议', '生活服务'],
  },
  {
    id: 3,
    kind: 'mailbox',
    name: '员工体验',
    description: '收集办公环境、福利与组织沟通相关建言。',
    rules: '',
    purpose: '关注员工体验、组织沟通与日常工作感受。',
    organizations: '全员',
    visibility: '全员',
    manager: '林知夏',
    replier: '赵宁、宋妍',
    anonymous: true,
    status: 'enabled',
    createdAt: '2026-08-10 17:45',
    icon: '/forum/mailbox-icon.png',
    tags: ['员工体验'],
    responseSlaEnabled: false,
  },
  {
    id: 4,
    kind: 'mailbox',
    name: '经营发展',
    description: '收集跨部门协作、流程优化与业务创新相关建言。',
    rules: '',
    purpose: '关注经营管理、跨部门协作与业务创新。',
    organizations: '全员',
    visibility: '全员',
    manager: '周明远',
    replier: '管宁、何安',
    anonymous: true,
    status: 'enabled',
    createdAt: '2026-08-10 17:40',
    icon: '/forum/mailbox-icon.png',
    tags: ['经营发展'],
    responseSlaEnabled: false,
  },
  {
    id: 5,
    kind: 'mailbox',
    name: '人才发展',
    description: '收集培养、竞聘与导师机制相关建言。',
    rules: '',
    purpose: '关注人才发展、内部竞聘与带教落地。',
    organizations: '全员',
    visibility: '全员',
    manager: '何安',
    replier: '李晴',
    anonymous: true,
    status: 'enabled',
    createdAt: '2026-08-10 17:30',
    icon: '/forum/mailbox-icon.png',
    tags: ['人才发展'],
    responseSlaEnabled: false,
  },
  {
    id: 6,
    kind: 'mailbox',
    name: '建言献策',
    description: '收集对公司经营、组织管理与员工体验的综合建言。',
    rules: '',
    organizations: '全员',
    visibility: '全员',
    manager: '赵宁',
    replier: '林知夏、周明远',
    anonymous: true,
    status: 'enabled',
    createdAt: '2026-08-10 17:20',
    icon: '/forum/mailbox-icon.png',
    tags: ['建言献策'],
    responseSlaEnabled: false,
  },
];

function defaultTopicTags(title: string, boardName: string): string[] {
  if (boardName === '二手论坛') return ['闲置转让'];
  if (boardName !== '建议论坛') return [];
  if (title.includes('食堂') || title.includes('班车') || title.includes('健身')) return ['生活服务'];
  return ['办公建议'];
}

export const initialForumTags: ForumTagRecord[] = [
  { id: 1, name: '闲置转让', order: 10, status: '启用', createdAt: '2026-08-01 09:00:00', scope: 'forum' },
  { id: 2, name: '求购', order: 20, status: '启用', createdAt: '2026-08-01 09:00:00', scope: 'forum' },
  { id: 3, name: '办公建议', order: 30, status: '启用', createdAt: '2026-08-01 09:00:00', scope: 'forum' },
  { id: 4, name: '生活服务', order: 40, status: '启用', createdAt: '2026-08-01 09:00:00', scope: 'forum' },
  { id: 5, name: '归档标签', order: 50, status: '禁用', createdAt: '2026-08-01 09:00:00', scope: 'forum' },
  { id: 6, name: '员工体验', order: 10, status: '启用', createdAt: '2026-08-01 09:10:00', scope: 'mailbox' },
  { id: 7, name: '经营发展', order: 20, status: '启用', createdAt: '2026-08-01 09:10:00', scope: 'mailbox' },
  { id: 8, name: '人才发展', order: 30, status: '启用', createdAt: '2026-08-01 09:10:00', scope: 'mailbox' },
  { id: 9, name: '建言献策', order: 40, status: '启用', createdAt: '2026-08-01 09:10:00', scope: 'mailbox' },
];

export const initialTopics: ForumTopic[] = [
  ['九成新人体工学椅转让，可自提', '椅子使用约一年，网布和扶手均完好，升降与后仰功能正常。因更换办公空间闲置，支持工作日下班后在园区北门自提，有需要可在评价区沟通。', '二手论坛', '王涛', '直接发布', 8, 'board', '2026-08-12 14:26'],
  ['建议优化会议室预约释放机制', '目前部分会议室长期被提前占用，但实际会议取消后没有及时释放。建议增加会前十五分钟确认机制，未确认的预约自动释放，并向预约人发送提醒。', '建议论坛', '陈某', '直接发布', 0, '', '2026-08-12 13:48'],
  ['关于跨部门项目职责边界不清的情况反馈', '近期参与跨部门项目时，多次出现任务负责人、交付标准和验收节点不明确的情况，导致相同工作重复开展。希望由项目发起部门统一明确职责清单，并在关键节点同步调整记录。此反馈涉及具体协作人员，建议仅由指定负责人查看并回复。', '经营发展', '匿名用户', '已通过', 3, '', '2026-08-12 12:36'],
  ['闲置27英寸显示器转让', '显示器为二十七英寸 2K 分辨率，接口包含 HDMI 和 DP，屏幕无亮点坏点，附带原装支架与电源线。价格可协商，园区内可现场测试。', '二手论坛', '唐宇', '直接发布', 12, '', '2026-08-12 11:15'],
  ['建议食堂增加低糖早餐选项', '现有早餐以面点和粥类为主，控糖同事选择较少。建议增加无糖酸奶、鸡蛋、粗粮和低糖豆浆组合，并在价签上标注主要营养信息。', '建议论坛', '周敏', '已通过', 16, 'global', '2026-08-12 10:42'],
  ['希望完善员工意见保密处理流程', '提交敏感意见后，员工最关心的是信息由谁查看、如何流转以及何时删除。建议在信箱页面明确可见人员范围、处理节点和保留期限，并在每次状态变化时向提交人说明。', '员工体验', '匿名用户', '直接发布', 0, '', '2026-08-12 09:58'],
  ['儿童绘本与益智玩具打包转让', '包含二十本儿童绘本、积木和拼图，适合三至六岁儿童。物品均已清洁消毒，部分书角有正常使用痕迹，优先打包转让。', '二手论坛', '许诺', '直接发布', 5, '', '2026-08-11 18:32'],
  ['建议增加晚班通勤班车', '近期项目集中交付，晚间九点后离开园区的同事增多。建议工作日试运行二十一点三十分班车，并根据预约人数动态调整线路和车型。', '建议论坛', '刘畅', '已通过', 24, 'global', '2026-08-11 17:46'],
  ['关于办公区域空调温度的反馈', '所在区域下午温度持续偏低，已经影响长时间办公。希望行政团队核查出风口和温控设置，同时提供临时调整方案，并说明后续巡检安排。', '员工体验', '匿名用户', '已驳回', 2, '', '2026-08-11 16:28'],
  ['闲置机械键盘与无线鼠标', '机械键盘为茶轴，键帽完整，无线鼠标支持蓝牙和接收器双模连接。两件均可正常使用，可单独转让，也可打包带走。', '二手论坛', '方圆', '直接发布', 7, '', '2026-08-11 15:06'],
  ['建议建立客户问题闭环看板', '客户问题目前分散在多个群聊和表格中，进度难以统一追踪。建议建立闭环看板，明确受理、分析、责任人、预计完成时间、客户回复和复盘结论。', '建议论坛', '蒋帆', '直接发布', 0, '', '2026-08-11 14:18'],
  ['希望关注新员工导师安排落实情况', '部分新员工入职后导师安排较晚，前两周缺少明确指导。建议核查各部门导师确认时间，并提供统一的带教任务清单和反馈入口。', '人才发展', '匿名用户', '已通过', 6, '', '2026-08-11 13:24'],
  ['九成新空气净化器转让', '适用面积约三十平方米，滤芯剩余寿命百分之七十，运行声音正常。附带说明书和备用初效滤网，园区内自提。', '二手论坛', '韩梅', '直接发布', 4, '', '2026-08-11 11:52'],
  ['建议优化报销单据补充流程', '报销被退回后，目前只能看到简短原因，容易反复补充。建议在退回时勾选缺失材料类型，并提供示例和重新提交入口。', '建议论坛', '吴倩', '已通过', 11, '', '2026-08-11 10:36'],
  ['关于部门加班安排沟通方式的反馈', '近期临时加班通知较多，部分安排在下班前才确认，个人计划难以调整。希望部门提前说明预计周期、任务优先级和补休方式，并保留异常情况反馈渠道。', '员工体验', '匿名用户', '直接发布', 0, '', '2026-08-11 09:44'],
  ['闲置折叠自行车转让', '二十寸折叠自行车，车架和刹车状态良好，轮胎近期更换。折叠后可放入汽车后备箱，适合短途通勤。', '二手论坛', '马骏', '直接发布', 9, '', '2026-08-10 18:20'],
  ['建议开放更多午间健身课程', '现有午间课程名额较少，经常开放后很快约满。建议增加拉伸、瑜伽和核心训练场次，并采用候补机制减少名额浪费。', '建议论坛', '林某', '已驳回', 5, '', '2026-08-10 17:08'],
  ['希望明确内部岗位竞聘信息发布规则', '不同部门发布内部岗位的渠道和时间不一致，员工容易错过。建议统一发布入口、报名周期、资格条件和结果反馈方式，确保信息透明。', '人才发展', '匿名用户', '已通过', 8, 'board', '2026-08-10 15:42'],
  ['闲置咖啡机及配套滤纸', '小型滴滤咖啡机，容量约六百毫升，功能正常，已完成清洁除垢。附赠未拆封滤纸一包，可在园区当面确认。', '二手论坛', '罗兰', '直接发布', 3, '', '2026-08-10 14:16'],
  ['建议为跨时区会议增加录制与纪要模板', '跨时区会议参与人员较多，口头结论容易遗漏。建议默认提供录制提醒、议题模板、决策记录和待办责任人字段，会后自动同步给参会人确认。', '建议论坛', '苏晨', '已通过', 14, '', '2026-08-10 11:30'],
  ['建议建立建言分发与闭环跟踪机制', '目前建言提交后难以判断由谁承接、何时回复以及如何闭环。建议统一分发规则、处理时限和结果回告，让提交人能看到进展。', '建言献策', '匿名用户', '直接发布', 0, '', '2026-08-12 15:10'],
].map((row, index) => {
  const rawAuthor = row[3] as string;
  const mailboxAnonByIndex: Record<number, string> = {
    2: '彭越',
    5: '谢琳',
    8: '秦峰',
    11: '田一',
    14: '杜平',
    17: '林可',
    20: '余嘉',
  };
  const forumAnonRealName: Record<string, string> = { 陈某: '谢琳', 林某: '秦峰' };
  const authorAnonymous = rawAuthor === '匿名用户' || rawAuthor in forumAnonRealName;
  const author = rawAuthor === '匿名用户' ? mailboxAnonByIndex[index]! : forumAnonRealName[rawAuthor] ?? rawAuthor;
  return {
  id: index + 1,
  title: row[0] as string,
  content: row[1] as string,
  boardName: row[2] as string,
  author,
  authorAnonymous,
  auditStatus: row[4] as TopicAuditStatus,
  commentCount: 0,
  likeCount: 3 + ((index * 7) % 40),
  viewCount: 80 + index * 23 + Number(row[5]) * 8,
  favoriteCount: 1 + ((index * 5) % 18),
  images:
    row[2] === '二手论坛'
      ? [
          '/activities/open-day.jpg',
          '/activities/share.jpg',
          '/activities/onboarding.jpg',
          '/activities/webinar.jpg',
          '/activities/checkup.jpg',
          '/activities/basketball.jpg',
          '/forum/secondhand.jpg',
        ].slice(0, index === 0 ? 7 : 1 + (index % 2))
      : [],
  comments: [] as ForumTopicComment[],
  pinScope: row[6] as PinScope,
  publishedAt: row[7] as string,
  shelfStatus: 'on' as const,
  tags: defaultTopicTags(row[0] as string, row[2] as string),
  chairName: row[2] === '员工体验' ? '林知夏' : row[2] === '经营发展' ? '周明远' : row[2] === '人才发展' ? '何安' : row[2] === '建言献策' ? '赵宁' : undefined,
};
});

initialTopics[0]!.operationHistory = [{ action: '置顶', operator: '管宁', time: '2026-08-12 14:40', detail: '仅在所属论坛顶部展示。' }];
initialTopics[2]!.auditHistory = [{ result: '已通过', reviewer: '管宁', time: '2026-08-12 13:02', reason: '内容完整，已转交相关负责人处理。' }];
initialTopics[2]!.chairmanReplies = [
  {
    content: '已收到您的留言。相关负责人将核查跨部门项目的职责分工，并推动明确负责人、交付标准和验收节点。',
    time: '2026-08-12 16:20',
    author: '周明远',
  },
  {
    content: '职责清单草案已发给相关负责人，本周内将同步进展。',
    time: '2026-08-13 09:10',
    author: '周明远',
  },
];
initialTopics[2]!.chairmanReply = initialTopics[2]!.chairmanReplies[1];
initialTopics[3]!.replyAssignees = '周敏';
initialTopics[4]!.replyAssignees = '李晴、何安';
initialTopics[4]!.auditHistory = [{ result: '已通过', reviewer: '管宁', time: '2026-08-12 11:00', reason: '建议清晰，已通过审核。' }];
initialTopics[4]!.operationHistory = [{ action: '置顶', operator: '管宁', time: '2026-08-12 11:08', detail: '在论坛首页顶部展示。' }];
initialTopics[7]!.operationHistory = [{ action: '置顶', operator: '管宁', time: '2026-08-11 18:16', detail: '在论坛首页顶部展示。' }];
initialTopics[8]!.auditHistory = [{ result: '已驳回', reviewer: '管宁', time: '2026-08-11 16:42', reason: '请补充具体楼层、区域和受影响时段。' }];
initialTopics[11]!.chairmanReplies = [
  {
    content: '已安排人力行政中心跟进导师配置情况，并将统一带教任务清单和反馈入口。',
    time: '2026-08-11 17:35',
    author: '何安',
  },
];
initialTopics[11]!.chairmanReply = initialTopics[11]!.chairmanReplies[0];
initialTopics[17]!.operationHistory = [{ action: '置顶', operator: '管宁', time: '2026-08-10 16:12', detail: '仅在所属论坛顶部展示。' }];

initialTopics.push({
  id: Math.max(...initialTopics.map((item) => item.id)) + 1,
  title: '关于跨部门重点项目协同机制的建议',
  content: '建议为重点项目建立统一里程碑和固定协同机制，减少信息差与重复沟通。',
  boardName: '经营发展',
  author: '周敏',
  authorAnonymous: false,
  auditStatus: '已通过',
  commentCount: 0,
  likeCount: 0,
  viewCount: 12,
  favoriteCount: 0,
  images: ['/activities/open-day.jpg'],
  comments: [],
  pinScope: '',
  publishedAt: '2026-08-18 14:30:00',
  shelfStatus: 'on',
  tags: ['战略发展'],
  chairName: '李明远',
});

initialTopics.push({
  id: Math.max(...initialTopics.map((item) => item.id)) + 1,
  title: '建议尽快建立跨部门重点项目统一里程碑、固定协同例会以及问题升级通道，避免信息差扩大并影响后续交付',
  content: '该建议希望把跨部门项目的节点、例会和升级路径一次说清，减少重复沟通和口径不一致，让负责人能按同一套机制推进并及时回告进展。',
  boardName: '员工体验',
  author: '周敏',
  authorAnonymous: false,
  auditStatus: '已通过',
  commentCount: 0,
  likeCount: 0,
  viewCount: 18,
  favoriteCount: 0,
  images: ['/activities/share.jpg', '/activities/webinar.jpg', '/activities/checkup.jpg'],
  comments: [],
  pinScope: '',
  publishedAt: '2026-08-19 09:20:00',
  shelfStatus: 'on',
  tags: ['员工体验'],
  chairName: '周岚',
  chairmanReplies: [
    {
      content: '已收到建议，将按统一里程碑和例会机制推进，后续进展会同步给提交人。',
      time: '2026-08-19 16:40:00',
      author: '周岚',
    },
    {
      content: '跨部门例会已排进本周节奏，会把固定议程和问题升级通道一并带上。',
      time: '2026-08-21 10:15:00',
      author: '周岚',
    },
    {
      content: '升级通道已对齐项目组，后续卡点按约定路径上报，进展会继续回告。',
      time: '2026-08-22 14:05:00',
      author: '周岚',
    },
  ],
});
initialTopics.at(-1)!.chairmanReply = initialTopics.at(-1)!.chairmanReplies!.at(-1);

export const initialMutes: MuteRecord[] = [
  {
    id: 1,
    user: '唐宇',
    department: '社区运营',
    reason: '发布违规广告信息',
    mutedAt: '2026-08-18 09:30',
    operator: '郑洁',
    active: true,
  },
  {
    id: 2,
    user: '马骏',
    department: '销售运营部',
    reason: '人身攻击其他同事',
    mutedAt: '2026-08-01 14:20',
    releasedAt: '2026-08-08 10:00',
    operator: '管宁',
    active: false,
  },
];

export function isMailboxBoard(board: Pick<ForumBoard, 'kind'>): boolean {
  return board.kind === 'mailbox';
}

export function privacyText(board: Pick<ForumBoard, 'kind'>): '公开' | '私密' {
  return isMailboxBoard(board) ? '私密' : '公开';
}

export function forumVisibilityDisplay(
  record: Pick<ForumBoardDraft, 'visibility' | 'departments' | 'customPeople' | 'importFileName' | 'importedPeople'>,
): string {
  const visibility = record.visibility ?? '全员';
  if (visibility === '按部门') return (record.departments ?? []).join('、') || '按部门';
  if (visibility === '自定义人群') return `自定义人群：共${(record.customPeople ?? []).length}人`;
  if (visibility === '导入人群') {
    const file = record.importFileName?.trim();
    const count = record.importedPeople?.length ?? 0;
    if (!file) return '导入人群';
    return count ? `导入人群：${file}（${count} 人）` : `导入人群：${file}`;
  }
  return '全员';
}

export function organizationText(
  board: Pick<ForumBoard, 'organizations' | 'visibility' | 'departments' | 'customPeople' | 'importFileName' | 'importedPeople'>,
): string {
  return board.visibility ? forumVisibilityDisplay(board) : board.organizations || '全员';
}

export function topicAuthorAdminText(topic: Pick<ForumTopic, 'author' | 'authorAnonymous'>): string {
  return topic.authorAnonymous ? `匿名（${topic.author}）` : topic.author;
}

export function anonymousText(anonymous: boolean): string {
  return anonymous ? '支持' : '不支持';
}

export function boardStatusText(status: BoardStatus): string {
  return status === 'enabled' ? '已启用' : '已停用';
}

export function canToggleBoardStatus(_board: ForumBoard): boolean {
  return true;
}

export function duplicateBoardName(boards: ForumBoard[], name: string, excludeId?: number): boolean {
  return boards.some((item) => item.name === name && item.id !== excludeId);
}

export function duplicateMailboxManager(boards: ForumBoard[], manager: string, excludeId?: number): boolean {
  const name = manager.trim();
  if (!name) return false;
  return boards.some((item) => isMailboxBoard(item) && item.id !== excludeId && item.manager === name);
}

const OCCUPIED_MAILBOX_MANAGER_SUFFIX = '（已负责其他信箱）';

export function occupiedMailboxManagerNames(boards: ForumBoard[], excludeId?: number): Set<string> {
  return new Set(
    boards
      .filter((item) => isMailboxBoard(item) && item.id !== excludeId)
      .map((item) => item.manager.trim())
      .filter(Boolean),
  );
}

export function withOccupiedMailboxManagers(nodes: ForumOrgNode[], occupied: ReadonlySet<string>): ForumOrgNode[] {
  return nodes.map((node) => {
    const taken = isForumPersonName(node.value) && occupied.has(node.value);
    const baseTitle = String(node.title).replace(OCCUPIED_MAILBOX_MANAGER_SUFFIX, '');
    return {
      ...node,
      disabled: taken,
      title: taken ? `${baseTitle}${OCCUPIED_MAILBOX_MANAGER_SUFFIX}` : baseTitle,
      children: node.children ? withOccupiedMailboxManagers(node.children, occupied) : undefined,
    };
  });
}

export function validateBoardDraft(
  draft: ForumBoardDraft,
): Partial<
  Record<
    'name' | 'description' | 'rules' | 'purpose' | 'organizations' | 'managers' | 'responseSla' | 'departments' | 'customPeople' | 'importFileName',
    string
  >
> {
  const noun = draft.kind === 'mailbox' ? '信箱' : '论坛';
  const errors: Partial<
    Record<
      'name' | 'description' | 'rules' | 'purpose' | 'organizations' | 'managers' | 'responseSla' | 'departments' | 'customPeople' | 'importFileName',
      string
    >
  > = {};
  if (!draft.name.trim()) errors.name = draft.kind === 'mailbox' ? '请输入名称' : `请输入${noun}名称`;
  if (!draft.description.trim()) errors.description = `请输入${noun}简介`;
  const visibility = draft.visibility ?? '全员';
  if (visibility === '按部门' && !(draft.departments ?? []).length) errors.departments = '请选择部门';
  if (visibility === '自定义人群' && !(draft.customPeople ?? []).length) errors.customPeople = '请选择人员';
  if (visibility === '导入人群' && !draft.importFileName?.trim()) errors.importFileName = '请导入人群文件';
  if (draft.kind === 'forum' && !draft.managers.length) errors.managers = '请选择管理员';
  if (draft.kind === 'mailbox' && !draft.managers.some((item) => item.trim())) errors.managers = '请选择负责人';
  if (draft.kind === 'mailbox' && draft.responseSlaEnabled && !draft.responseSla) errors.responseSla = '请选择响应时效';
  return errors;
}

export function filterBoards(boards: ForumBoard[], query: BoardQuery): ForumBoard[] {
  return boards.filter((item) => {
    if (item.kind !== query.kind) return false;
    if (query.name && !item.name.includes(query.name)) return false;
    if (query.status && query.status !== 'all' && item.status !== query.status) return false;
    if (query.visibility && !organizationText(item).includes(query.visibility)) return false;
    if (query.manager && !item.manager.includes(query.manager)) return false;
    if (query.chair && !item.manager.includes(query.chair)) return false;
    if (query.anonymous === 'true' && !item.anonymous) return false;
    if (query.anonymous === 'false' && item.anonymous) return false;
    const day = item.createdAt.slice(0, 10);
    if (query.createdFrom && day < query.createdFrom) return false;
    if (query.createdTo && day > query.createdTo) return false;
    return true;
  });
}

/** 只在同类型板块内交换相邻顺序，另一类型的相对位置不变。 */
export function moveBoardAmongKind(boards: ForumBoard[], id: number, dir: -1 | 1): ForumBoard[] | null {
  const current = boards.find((item) => item.id === id);
  if (!current) return null;
  const kindIndexes = boards.reduce<number[]>((indexes, item, index) => {
    if (item.kind === current.kind) indexes.push(index);
    return indexes;
  }, []);
  const position = kindIndexes.findIndex((index) => boards[index]?.id === id);
  const nextPosition = position + dir;
  if (position < 0 || nextPosition < 0 || nextPosition >= kindIndexes.length) return null;
  const from = kindIndexes[position]!;
  const to = kindIndexes[nextPosition]!;
  const next = [...boards];
  const moved = next[from]!;
  next[from] = next[to]!;
  next[to] = moved;
  return next;
}

export function findBoardByName(boards: ForumBoard[], name: string): ForumBoard | undefined {
  return boards.find((item) => item.name === name);
}

export function filterTopics(topics: ForumTopic[], boards: ForumBoard[], query: TopicQuery): ForumTopic[] {
  return topics
    .filter((item) => {
    const board = findBoardByName(boards, item.boardName);
    const mailbox = board ? isMailboxBoard(board) : item.boardName.includes('信箱') || ['员工体验', '经营发展', '人才发展', '建言献策'].includes(item.boardName);
    if (query.kind === 'mailbox' ? !mailbox : mailbox) return false;
    if (query.keyword && !`${item.title}${item.content}`.includes(query.keyword)) return false;
    if (query.boardName && item.boardName !== query.boardName) return false;
    if (query.author && !item.author.includes(query.author) && !topicAuthorAdminText(item).includes(query.author)) return false;
    if (query.chairName && !(item.chairName ?? '').includes(query.chairName)) return false;
    if (query.management && query.management !== 'all' && !topicManagementLabels(item).includes(query.management)) return false;
    const day = item.publishedAt.slice(0, 10);
    if (query.createdFrom && day < query.createdFrom) return false;
    if (query.createdTo && day > query.createdTo) return false;
    return true;
  })
    .sort((left, right) => {
      const pin = Number(Boolean(right.pinScope)) - Number(Boolean(left.pinScope));
      if (pin) return pin;
      return right.publishedAt.localeCompare(left.publishedAt);
    });
}

export function isTopicPinned(topic: Pick<ForumTopic, 'pinScope'>): boolean {
  return topic.pinScope === 'global' || topic.pinScope === 'board';
}

export function topicManagementLabels(topic: Pick<ForumTopic, 'pinScope' | 'shelfStatus'>): string[] {
  if (topic.shelfStatus === 'off') return ['已下架'];
  if (isTopicPinned(topic)) return ['置顶'];
  return ['普通'];
}

export function topicManagementText(topic: Pick<ForumTopic, 'pinScope' | 'shelfStatus'>): string {
  return topicManagementLabels(topic).join('、');
}

export function parseTopicAssignees(value?: string): string[] {
  return (value ?? '')
    .split('、')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function topicAssigneeText(value?: string): string {
  const names = parseTopicAssignees(value);
  return names.length ? names.join('、') : '未指派';
}

const FORUM_ACCOUNT_DEPARTMENTS: Record<string, string> = {
  陈产品: '华东大区',
  论坛小助手: '平台运营部',
  官方客服: '平台运营部',
  林知夏: '信箱办公室',
  周明远: '经营管理中心',
};

export function forumPersonDepartment(name: string): string {
  const fromRoster = FORUM_USER_OPTIONS.find((item) => item.name === name)?.department;
  if (fromRoster) return fromRoster;
  return FORUM_ACCOUNT_DEPARTMENTS[name] ?? '';
}

export function forumPersonDepartmentText(name?: string): string {
  return forumPersonDepartment(name?.trim() ?? '') || '—';
}

export function topicAssigneeDepartmentText(value?: string): string {
  const names = parseTopicAssignees(value);
  return names.length ? names.map((item) => forumPersonDepartmentText(item)).join('、') : '—';
}

export function isTopicReplyAssignee(topic: Pick<ForumTopic, 'replyAssignees'>, name: string): boolean {
  return parseTopicAssignees(topic.replyAssignees).includes(name);
}

export function shouldPinAssigneeMainComment(
  topic: Pick<ForumTopic, 'replyAssignees' | 'comments'>,
  operator: string,
): boolean {
  if (!isTopicReplyAssignee(topic, operator)) return false;
  return !topic.comments.some((comment) => comment.author === operator);
}

export function topicAssigneeHasReplied(topic: Pick<ForumTopic, 'replyAssignees' | 'comments'>): boolean {
  const assignees = new Set(parseTopicAssignees(topic.replyAssignees));
  if (!assignees.size) return false;
  return topic.comments.some(
    (comment) => assignees.has(comment.author) || comment.replies.some((reply) => assignees.has(reply.author)),
  );
}

export function muteStatusLabel(row: MuteRecord): '生效中' | '已解除' {
  return row.active ? '生效中' : '已解除';
}

export function topicCommentCount(comments: ForumTopicComment[]): number {
  return comments.reduce((sum, item) => sum + 1 + item.replies.length, 0);
}

export function validateForumComment(content: string, images: string[] = []): string | null {
  const text = content.trim();
  const pics = images.filter(Boolean);
  if (!text && !pics.length) return '请输入回复内容';
  if (text.length > FORUM_COMMENT_MAX) return `回复内容不超过 ${FORUM_COMMENT_MAX} 个字`;
  return null;
}

export function topicChairmanReplies(topic: Pick<ForumTopic, 'chairmanReply' | 'chairmanReplies'>): ForumChairmanReply[] {
  if (topic.chairmanReplies?.length) return topic.chairmanReplies;
  return topic.chairmanReply ? [topic.chairmanReply] : [];
}

export function topicActualReplierText(topic: Pick<ForumTopic, 'chairmanReply' | 'chairmanReplies'>): string {
  const names = [...new Set(topicChairmanReplies(topic).map((item) => item.author?.trim()).filter(Boolean))];
  return names.length ? names.join('、') : '—';
}

export function withChairmanReply(topic: ForumTopic, content: string, operator: string, createdAt: string): ForumTopic | { error: string } {
  const error = validateForumComment(content);
  if (error) return { error };
  const reply: ForumChairmanReply = { content: content.trim(), time: createdAt, author: operator };
  const chairmanReplies = [...topicChairmanReplies(topic), reply];
  return { ...topic, chairmanReplies, chairmanReply: reply };
}

export function cloneForumTopics(source: ForumTopic[]): ForumTopic[] {
  return source.map((item) => ({
    ...item,
    tags: [...item.tags],
    images: [...item.images],
    comments: item.comments.map((comment) => ({
      ...comment,
      images: comment.images ? [...comment.images] : undefined,
      likedBy: comment.likedBy ? [...comment.likedBy] : undefined,
      replies: comment.replies.map((reply) => ({
        ...reply,
        images: reply.images ? [...reply.images] : undefined,
        likedBy: reply.likedBy ? [...reply.likedBy] : undefined,
      })),
    })),
    auditHistory: item.auditHistory?.map((row) => ({ ...row })),
    operationHistory: item.operationHistory?.map((row) => ({ ...row })),
    chairmanReply: item.chairmanReply ? { ...item.chairmanReply } : undefined,
    chairmanReplies: item.chairmanReplies?.map((row) => ({ ...row })),
  }));
}

function nextCommentId(comments: ForumTopicComment[]): number {
  const ids = comments.flatMap((item) => [item.id, ...item.replies.map((reply) => reply.id)]);
  return Math.max(0, ...ids) + 1;
}

export function withTopicComment(
  topic: ForumTopic,
  content: string,
  operator: string,
  createdAt: string,
  images: string[] = [],
  anonymous = false,
): ForumTopic | { error: string } {
  const pics = images.filter(Boolean).slice(0, FORUM_COMMENT_IMAGE_MAX);
  const error = validateForumComment(content, pics);
  if (error) return { error };
  const comments = [
    ...topic.comments,
    {
      id: nextCommentId(topic.comments),
      author: operator,
      authorAnonymous: anonymous || undefined,
      content: content.trim(),
      createdAt,
      replies: [],
      images: pics,
      likedBy: [],
      pinned: shouldPinAssigneeMainComment(topic, operator),
    },
  ];
  return { ...topic, comments, commentCount: topicCommentCount(comments) };
}

export function withTopicCommentPin(topic: ForumTopic, commentId: number, pinned: boolean): ForumTopic | { error: string } {
  if (!topic.comments.some((item) => item.id === commentId)) return { error: '评论不存在' };
  return {
    ...topic,
    comments: topic.comments.map((item) => (item.id === commentId ? { ...item, pinned } : item)),
  };
}

export function sortPinnedComments(comments: ForumTopicComment[]): ForumTopicComment[] {
  return [...comments].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));
}

export const FORUM_MAIN_COMMENT_PAGE_SIZE = 10;

export function pageMainComments(comments: ForumTopicComment[], visibleCount: number): ForumTopicComment[] {
  return sortPinnedComments(comments).slice(0, Math.max(0, visibleCount));
}

export function withTopicReply(
  topic: ForumTopic,
  commentId: number,
  content: string,
  operator: string,
  replyTo: string,
  createdAt: string,
  images: string[] = [],
  anonymous = false,
): ForumTopic | { error: string } {
  const pics = images.filter(Boolean).slice(0, FORUM_COMMENT_IMAGE_MAX);
  const error = validateForumComment(content, pics);
  if (error) return { error };
  if (!topic.comments.some((item) => item.id === commentId)) return { error: '评论不存在' };
  const comments = topic.comments.map((item) =>
    item.id === commentId
      ? {
          ...item,
          replies: [
            ...item.replies,
            {
              id: nextCommentId(topic.comments),
              author: operator,
              authorAnonymous: anonymous || undefined,
              content: content.trim(),
              createdAt,
              replyTo,
              images: pics,
              likedBy: [],
            },
          ],
        }
      : item,
  );
  return { ...topic, comments, commentCount: topicCommentCount(comments) };
}

export function withoutTopicComment(topic: ForumTopic, commentId: number, operator: string): ForumTopic | { error: string } {
  const comment = topic.comments.find((item) => item.id === commentId);
  if (!comment) return { error: '评论不存在' };
  if (comment.author !== operator) return { error: '只能删除自己的评论' };
  const comments = topic.comments.filter((item) => item.id !== commentId);
  return { ...topic, comments, commentCount: topicCommentCount(comments) };
}

export function withoutTopicReply(
  topic: ForumTopic,
  commentId: number,
  replyId: number,
  operator: string,
): ForumTopic | { error: string } {
  const comment = topic.comments.find((item) => item.id === commentId);
  const reply = comment?.replies.find((item) => item.id === replyId);
  if (!comment || !reply) return { error: '回复不存在' };
  if (reply.author !== operator) return { error: '只能删除自己的回复' };
  const comments = topic.comments.map((item) =>
    item.id === commentId ? { ...item, replies: item.replies.filter((row) => row.id !== replyId) } : item,
  );
  return { ...topic, comments, commentCount: topicCommentCount(comments) };
}

function toggleLikedBy(names: string[] | undefined, operator: string) {
  const current = names ?? [];
  return current.includes(operator) ? current.filter((item) => item !== operator) : [...current, operator];
}

export function withTopicCommentLike(topic: ForumTopic, commentId: number, operator: string): ForumTopic | { error: string } {
  if (!topic.comments.some((item) => item.id === commentId)) return { error: '评论不存在' };
  return {
    ...topic,
    comments: topic.comments.map((item) =>
      item.id === commentId ? { ...item, likedBy: toggleLikedBy(item.likedBy, operator) } : item,
    ),
  };
}

export function withTopicReplyLike(
  topic: ForumTopic,
  commentId: number,
  replyId: number,
  operator: string,
): ForumTopic | { error: string } {
  const comment = topic.comments.find((item) => item.id === commentId);
  if (!comment?.replies.some((item) => item.id === replyId)) return { error: '回复不存在' };
  return {
    ...topic,
    comments: topic.comments.map((item) =>
      item.id === commentId
        ? {
            ...item,
            replies: item.replies.map((reply) =>
              reply.id === replyId ? { ...reply, likedBy: toggleLikedBy(reply.likedBy, operator) } : reply,
            ),
          }
        : item,
    ),
  };
}

initialTopics[0]!.comments = [
  {
    id: 1,
    author: '周敏',
    content: '还在吗？工作日晚上七点后可以去北门看一下吗？',
    createdAt: '2026-08-12 15:02',
    images: ['/activities/open-day.jpg', '/activities/share.jpg'],
    replies: [
      { id: 2, author: '王涛', content: '在的，今晚七点半方便。', createdAt: '2026-08-12 15:18', replyTo: '周敏', images: ['/activities/onboarding.jpg'] },
      { id: 3, author: '管宁', content: '请双方注意交易安全，尽量在园区内当面确认。', createdAt: '2026-08-12 16:05', replyTo: '周敏' },
    ],
  },
  {
    id: 4,
    author: '唐宇',
    content: '椅子承重怎么样，长时间坐会不会往下掉？',
    createdAt: '2026-08-12 16:40',
    images: ['/activities/checkup.jpg'],
    replies: [],
  },
  ...Array.from({ length: 8 }, (_, i) => ({
    id: 5 + i,
    author: ['李晴', '何安', '许诺', '刘畅', '方圆', '蒋帆', '韩梅', '吴倩'][i]!,
    content: `补充主评论 ${i + 3}`,
    createdAt: `2026-08-12 ${16 + Math.floor((i + 4) / 6)}:${String((i * 7) % 60).padStart(2, '0')}`,
    replies: [] as { id: number; author: string; content: string; createdAt: string; replyTo?: string }[],
  })),
  {
    id: 13,
    author: '加载更多探测甲',
    content: '第十一条主评论，默认不展示',
    createdAt: '2026-08-12 18:10',
    replies: [],
  },
  {
    id: 14,
    author: '加载更多探测乙',
    content: '第十二条主评论，默认不展示',
    createdAt: '2026-08-12 18:20',
    replies: [],
  },
];
initialTopics[0]!.commentCount = topicCommentCount(initialTopics[0]!.comments);
initialTopics[3]!.comments = [
  {
    id: 1,
    author: '方圆',
    authorAnonymous: true,
    content: '显示器还有包装盒吗？想看看成色。',
    createdAt: '2026-08-12 12:08',
    images: ['/activities/webinar.jpg'],
    replies: [
      {
        id: 2,
        author: '唐宇',
        authorAnonymous: true,
        content: '没有原盒，可以当面看机器。',
        createdAt: '2026-08-12 12:22',
        replyTo: '方圆',
        images: ['/activities/basketball.jpg'],
      },
    ],
  },
];
initialTopics[3]!.commentCount = topicCommentCount(initialTopics[3]!.comments);
initialTopics[3]!.authorAnonymous = true;
initialTopics[4]!.comments = [
  {
    id: 1,
    author: '何安',
    content: '后勤已同步食堂，下周先试一周低糖组合。',
    createdAt: '2026-08-12 11:30',
    replies: [{ id: 2, author: '周敏', content: '谢谢，希望价签上能标糖分。', createdAt: '2026-08-12 11:46', replyTo: '何安' }],
  },
];
initialTopics[4]!.commentCount = topicCommentCount(initialTopics[4]!.comments);

for (const topic of initialTopics) {
  if (topic.pinScope === 'global' || topic.pinScope === 'board') {
    topic.author = forumClientSelf;
    topic.authorAnonymous = false;
  }
}

export function validateMuteDraft(draft: MuteDraft): string | null {
  if (!draft.user.trim()) return '请选择禁言成员';
  const reason = draft.reason.trim();
  if (!reason) return '请输入禁言原因';
  if (reason.length > MUTE_REASON_MAX) return `禁言原因不超过 ${MUTE_REASON_MAX} 个字`;
  return null;
}

export function nowText(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function boardFromDraft(draft: ForumBoardDraft, id: number, createdAt: string, status: BoardStatus = 'enabled'): ForumBoard {
  const visibility = draft.visibility ?? '全员';
  return {
    id,
    kind: draft.kind,
    name: draft.name.trim(),
    description: draft.description.trim(),
    rules: draft.kind === 'mailbox' ? '' : draft.rules.trim(),
    purpose: draft.kind === 'mailbox' ? draft.purpose?.trim() || '' : undefined,
    visibility,
    departments: visibility === '按部门' ? [...(draft.departments ?? [])] : [],
    customPeople: visibility === '自定义人群' ? [...(draft.customPeople ?? [])] : [],
    importFileName: visibility === '导入人群' ? draft.importFileName?.trim() || '' : '',
    importedPeople: visibility === '导入人群' ? [...(draft.importedPeople ?? [])] : [],
    organizations: forumVisibilityDisplay({ ...draft, visibility }),
    manager: draft.kind === 'mailbox' ? (draft.managers.map((item) => item.trim()).find(Boolean) ?? '') : draft.managers.join('、'),
    replier: draft.kind === 'mailbox' ? (draft.repliers ?? []).map((item) => item.trim()).filter(Boolean).join('、') : undefined,
    anonymous: draft.anonymous,
    status,
    createdAt,
    chairs: undefined,
    headerImage: draft.kind === 'forum' ? draft.headerImage?.trim() || '' : undefined,
    icon: draft.icon?.trim() || '',
    tags: [...(draft.tags ?? [])].map((item) => item.trim()).filter(Boolean),
    responseSlaEnabled: draft.kind === 'mailbox' ? Boolean(draft.responseSlaEnabled) : undefined,
    responseSla: draft.kind === 'mailbox' && draft.responseSlaEnabled ? draft.responseSla : undefined,
  };
}

export function draftFromBoard(board: ForumBoard): ForumBoardDraft {
  const visibility = board.visibility ?? '全员';
  return {
    kind: board.kind,
    name: board.name,
    description: board.description,
    rules: board.rules,
    purpose: board.purpose,
    visibility,
    departments: board.departments ? [...board.departments] : [],
    customPeople: board.customPeople ? [...board.customPeople] : [],
    importFileName: board.importFileName ?? '',
    importedPeople: board.importedPeople ? [...board.importedPeople] : [],
    organizations: board.organizations.split('、').filter(Boolean),
    managers: board.manager.split('、').filter(Boolean),
    repliers: board.kind === 'mailbox' ? (board.replier ?? '').split('、').filter(Boolean) : undefined,
    anonymous: board.anonymous,
    chairs: board.chairs?.map((item) => ({ ...item, receiveTypes: [...item.receiveTypes] })),
    headerImage: board.headerImage,
    icon: board.icon,
    tags: board.tags ? [...board.tags] : [],
    responseSlaEnabled: board.kind === 'mailbox' ? Boolean(board.responseSlaEnabled) : undefined,
    responseSla: board.responseSla,
  };
}

export function mailboxResponseSlaText(board: ForumBoard): string {
  if (board.kind !== 'mailbox' || !board.responseSlaEnabled) return '未开启';
  return board.responseSla ?? '未开启';
}

export function isFeedbackBoard(board: ForumBoard | undefined): boolean {
  return board?.name === '建议论坛' || board?.kind === 'mailbox';
}

export function defaultChair(): MailboxChair {
  return {
    entryName: '',
    name: '',
    purpose: '',
    receiveTypes: [],
    replyPerson: '',
  };
}

export type ForumTagQuery = {
  name: string;
  status?: ForumTagStatus;
};

export function compareForumTags(a: ForumTagRecord, b: ForumTagRecord): number {
  if (a.order !== b.order) return a.order - b.order;
  return b.createdAt.localeCompare(a.createdAt);
}

export function tagsByScope(tags: ForumTagRecord[], scope: ForumTagScope): ForumTagRecord[] {
  return tags.filter((item) => item.scope === scope);
}

export function enabledForumTagNames(tags: ForumTagRecord[], scope: ForumTagScope = 'forum'): string[] {
  return tagsByScope(tags, scope).filter((item) => item.status === '启用').sort(compareForumTags).map((item) => item.name);
}

export function validateForumTagName(name: string, tags: ForumTagRecord[], currentId?: number): string | null {
  const label = name.trim();
  if (!label) return '请输入标签名称';
  if (label.length > 20) return '标签名称不超过 20 个字';
  if (tags.some((item) => item.name === label && item.id !== currentId)) return '标签名称已存在';
  return null;
}

export function nextForumTagOrder(tags: ForumTagRecord[]): number {
  if (!tags.length) return 10;
  return Math.max(...tags.map((item) => item.order)) + 10;
}

export function countForumTagUsage(name: string, topics: Array<{ tags?: string[] }>): number {
  return topics.filter((item) => (item.tags ?? []).includes(name)).length;
}

export function countBoardTagUsage(name: string, boards: Array<{ tags?: string[] }>): number {
  return boards.filter((item) => (item.tags ?? []).includes(name)).length;
}

export function filterForumTags(tags: ForumTagRecord[], query: ForumTagQuery): ForumTagRecord[] {
  return tags.filter((item) => {
    if (query.name && !item.name.includes(query.name.trim())) return false;
    if (query.status && item.status !== query.status) return false;
    return true;
  });
}

export function renameTopicTags(topics: ForumTopic[], from: string, to: string): ForumTopic[] {
  return topics.map((item) => ({
    ...item,
    tags: (item.tags ?? []).map((tag) => (tag === from ? to : tag)),
  }));
}

export function removeTopicTag(topics: ForumTopic[], name: string): ForumTopic[] {
  return topics.map((item) => ({
    ...item,
    tags: (item.tags ?? []).filter((tag) => tag !== name),
  }));
}
