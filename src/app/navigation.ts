export const APPLICATION_CATEGORIES = ['通用', '员工与组织', '业务经营', '平台能力'] as const;

export type ApplicationCategory = (typeof APPLICATION_CATEGORIES)[number];

export type NavIcon =
  | 'apartment'
  | 'appstore'
  | 'barChart'
  | 'bell'
  | 'book'
  | 'calendar'
  | 'checkCircle'
  | 'checkSquare'
  | 'clock'
  | 'dashboard'
  | 'fileText'
  | 'gift'
  | 'heart'
  | 'layout'
  | 'read'
  | 'rocket'
  | 'shopping'
  | 'shoppingCart'
  | 'sync'
  | 'tags'
  | 'team'
  | 'trophy'
  | 'unorderedList'
  | 'user'
  | 'video';

export type ApplicationMeta = {
  key: string;
  label: string;
  category: ApplicationCategory;
  icon: NavIcon;
  defaultPage: string;
  hiddenFromSwitcher?: boolean;
};

export type MenuNode = {
  key: string;
  label: string;
  icon: NavIcon;
  children?: MenuNode[];
};

export const applications: ApplicationMeta[] = [
  { key: 'workbench', label: '工作台', category: '通用', icon: 'dashboard', defaultPage: 'dashboard' },
  { key: 'organization', label: '组织管理', category: '员工与组织', icon: 'team', defaultPage: 'employees' },
  { key: 'products', label: '商品管理', category: '业务经营', icon: 'tags', defaultPage: 'products' },
  { key: 'orders', label: '订单管理', category: '业务经营', icon: 'shoppingCart', defaultPage: 'orders-all' },
  { key: 'activities', label: '活动', category: '员工与组织', icon: 'calendar', defaultPage: 'activity-overview' },
  { key: 'experience', label: '员工体验', category: '员工与组织', icon: 'heart', defaultPage: 'experience-articles', hiddenFromSwitcher: true },
  { key: 'interest-groups', label: '兴趣圈', category: '员工与组织', icon: 'team', defaultPage: 'interest-group-overview' },
  { key: 'awards', label: '评优', category: '员工与组织', icon: 'trophy', defaultPage: 'award-overview', hiddenFromSwitcher: true },
  { key: 'voting', label: '投票-废弃', category: '员工与组织', icon: 'checkSquare', defaultPage: 'vote-list', hiddenFromSwitcher: true },
  { key: 'voting-v2', label: '投票', category: '员工与组织', icon: 'checkSquare', defaultPage: 'vote-v2-overview' },
  { key: 'training', label: '课程', category: '员工与组织', icon: 'book', defaultPage: 'training-overview' },
  { key: 'skills-contest', label: '技能大赛', category: '员工与组织', icon: 'trophy', defaultPage: 'contest-list' },
  { key: 'exam', label: '考试练习', category: '员工与组织', icon: 'fileText', defaultPage: 'exam-list' },
  { key: 'live', label: '直播', category: '员工与组织', icon: 'video', defaultPage: 'live-list' },
  { key: 'lottery', label: '抽奖', category: '员工与组织', icon: 'gift', defaultPage: 'lottery-list' },
  { key: 'checkin', label: '打卡', category: '员工与组织', icon: 'clock', defaultPage: 'checkin-list' },
  { key: 'learning-plan', label: '学习计划', category: '员工与组织', icon: 'read', defaultPage: 'learning-plan-list' },
  { key: 'care', label: '人文关怀', category: '员工与组织', icon: 'gift', defaultPage: 'care-plans', hiddenFromSwitcher: true },
  { key: 'operations', label: '业务运营', category: '平台能力', icon: 'appstore', defaultPage: 'application-list' },
];

export const applicationMenus: Record<string, MenuNode[]> = {
  workbench: [
    {
      key: 'workbench-overview',
      icon: 'dashboard',
      label: '概览',
      children: [
        { key: 'dashboard', icon: 'dashboard', label: '数据看板' },
        { key: 'my-tasks', icon: 'checkSquare', label: '我的待办' },
      ],
    },
    { key: 'h5-decoration', icon: 'layout', label: 'H5装修' },
    { key: 'pc-decoration', icon: 'appstore', label: 'PC装修' },
  ],
  organization: [
    {
      key: 'organization-members',
      icon: 'team',
      label: '成员管理',
      children: [
        { key: 'employees', icon: 'user', label: '员工管理' },
        { key: 'departments', icon: 'apartment', label: '部门管理' },
      ],
    },
    { key: 'organization-files', icon: 'fileText', label: '组织档案' },
  ],
  products: [
    {
      key: 'product-center',
      icon: 'shopping',
      label: '商品中心',
      children: [
        { key: 'products', icon: 'shopping', label: '商品信息' },
        { key: 'categories', icon: 'appstore', label: '品类维护' },
        { key: 'specifications', icon: 'tags', label: '规格维护' },
      ],
    },
  ],
  orders: [
    {
      key: 'order-center',
      icon: 'shoppingCart',
      label: '订单中心',
      children: [
        { key: 'orders-all', icon: 'unorderedList', label: '全部订单' },
        { key: 'orders-unpaid', icon: 'clock', label: '待付款' },
        { key: 'orders-paid', icon: 'checkCircle', label: '已支付' },
        { key: 'orders-shipped', icon: 'rocket', label: '已发货' },
        { key: 'orders-completed', icon: 'checkSquare', label: '已完成' },
        { key: 'orders-refunding', icon: 'sync', label: '退款中' },
      ],
    },
  ],
  activities: [
    { key: 'activity-overview', icon: 'dashboard', label: '概览' },
    { key: 'activity-list', icon: 'unorderedList', label: '活动管理' },
    { key: 'activity-categories', icon: 'appstore', label: '分类管理' },
    { key: 'activity-rules', icon: 'fileText', label: '规则设置（仅演示）' },
    { key: 'activity-layout', icon: 'layout', label: '活动装修（仅演示）' },
  ],
  experience: [
    {
      key: 'experience-content',
      icon: 'read',
      label: '内容运营',
      children: [{ key: 'experience-articles', icon: 'fileText', label: '文章管理' }],
    },
    {
      key: 'experience-activities',
      icon: 'calendar',
      label: '活动运营',
      children: [{ key: 'experience-activity-list', icon: 'calendar', label: '活动管理' }],
    },
  ],
  'interest-groups': [
    { key: 'interest-group-overview', icon: 'dashboard', label: '概览' },
    { key: 'interest-group-list', icon: 'team', label: '兴趣圈管理' },
    { key: 'interest-group-activities', icon: 'calendar', label: '活动管理' },
    { key: 'interest-group-categories', icon: 'appstore', label: '分类管理' },
    { key: 'interest-group-rules', icon: 'fileText', label: '规则设置' },
    { key: 'interest-group-layout', icon: 'layout', label: '兴趣圈装修（仅演示）' },
  ],
  awards: [
    { key: 'award-overview', icon: 'dashboard', label: '概览' },
    { key: 'award-list', icon: 'trophy', label: '评优管理' },
    { key: 'award-certificates', icon: 'gift', label: '评优证书' },
  ],
  voting: [
    { key: 'vote-list', icon: 'checkSquare', label: '投票管理' },
  ],
  'voting-v2': [
    { key: 'vote-v2-overview', icon: 'dashboard', label: '概览' },
    { key: 'vote-v2-list', icon: 'checkSquare', label: '投票管理' },
    { key: 'vote-v2-layout', icon: 'layout', label: '投票装修（仅演示）' },
  ],
  training: [
    { key: 'training-overview', icon: 'dashboard', label: '概览' },
    { key: 'training-courses', icon: 'book', label: '课程管理' },
    { key: 'training-courseware', icon: 'fileText', label: '课件管理' },
    { key: 'training-rules', icon: 'fileText', label: '规则设置' },
  ],
  'skills-contest': [
    { key: 'contest-list', icon: 'trophy', label: '赛事管理' },
    { key: 'signup-list', icon: 'unorderedList', label: '报名' },
    { key: 'score-list', icon: 'checkCircle', label: '成绩' },
    { key: 'contest-checkin', icon: 'clock', label: '打卡' },
  ],
  exam: [
    { key: 'exam-overview', icon: 'dashboard', label: '概览' },
    {
      key: 'exam-group',
      icon: 'fileText',
      label: '考试',
      children: [
        { key: 'exam-list', icon: 'unorderedList', label: '考试管理' },
        { key: 'exam-questions', icon: 'fileText', label: '试题库' },
        { key: 'exam-papers', icon: 'fileText', label: '试卷管理' },
        { key: 'exam-certificates', icon: 'trophy', label: '证书管理' },
      ],
    },
    {
      key: 'practice-group',
      icon: 'checkSquare',
      label: '练习',
      children: [{ key: 'practice-questions', icon: 'unorderedList', label: '习题库' }],
    },
  ],
  live: [
    { key: 'live-list', icon: 'video', label: '直播管理' },
  ],
  lottery: [
    { key: 'lottery-list', icon: 'gift', label: '抽奖管理' },
  ],
  checkin: [
    { key: 'checkin-list', icon: 'clock', label: '打卡管理' },
  ],
  'learning-plan': [
    { key: 'learning-plan-list', icon: 'unorderedList', label: '计划管理' },
  ],
  care: [
    {
      key: 'care-operation',
      icon: 'heart',
      label: '关怀运营',
      children: [
        { key: 'care-plans', icon: 'calendar', label: '关怀计划' },
        { key: 'care-records', icon: 'checkCircle', label: '关怀记录' },
      ],
    },
    {
      key: 'care-content',
      icon: 'gift',
      label: '内容配置',
      children: [
        { key: 'care-templates', icon: 'fileText', label: '关怀模板' },
        { key: 'care-types', icon: 'tags', label: '关怀类型' },
      ],
    },
  ],
  operations: [
    {
      key: 'operation-apps',
      icon: 'appstore',
      label: '应用运营',
      children: [
        { key: 'application-list', icon: 'appstore', label: '应用列表' },
        { key: 'operation-analysis', icon: 'barChart', label: '运营分析' },
      ],
    },
  ],
};

export function getApplication(key: string): ApplicationMeta | undefined {
  return applications.find((item) => item.key === key);
}

export function visibleApplications(): ApplicationMeta[] {
  return applications.filter((item) => !item.hiddenFromSwitcher);
}

export function getDirectApplications(max: number): ApplicationMeta[] {
  return visibleApplications().slice(0, max);
}

export function isLeafMenuKey(nodes: MenuNode[], key: string): boolean {
  return nodes.some((node) => {
    if (node.children?.length) {
      return isLeafMenuKey(node.children, key);
    }
    return node.key === key;
  });
}

export function findMenuTrail(nodes: MenuNode[], key: string): MenuNode[] {
  for (const node of nodes) {
    if (node.key === key) {
      return [node];
    }
    if (node.children?.length) {
      const nested = findMenuTrail(node.children, key);
      if (nested.length) {
        return [node, ...nested];
      }
    }
  }
  return [];
}

export function getOpenKeys(nodes: MenuNode[]): string[] {
  return nodes.filter((node) => node.children?.length).map((node) => node.key);
}

export function findApplicationByPage(page: string): ApplicationMeta | undefined {
  return applications.find((item) => isLeafMenuKey(applicationMenus[item.key] ?? [], page));
}

export type CEndSurface = 'h5' | 'pc';

export type H5Page =
  | 'my'
  | 'courses'
  | 'course-detail'
  | 'favorites'
  | 'signup'
  | 'checkin'
  | 'ig-checkin'
  | 'exams'
  | 'exam-prep'
  | 'exam-taking'
  | 'exam-result'
  | 'exam-review'
  | 'exam-records'
  | 'exam-rank'
  | 'honor'
  | 'honor-admin'
  | 'interest-groups'
  | 'ig-past-moments'
  | 'votes'
  | 'votes-v2'
  | 'vote-v2-home'
  | 'vote-v2-option'
  | 'vote-v2-records'
  | 'vote-records'
  | 'vote-record'
  | 'vote-detail'
  | 'vote-taking'
  | 'vote-results'
  | 'activity-list'
  | 'activity-search'
  | 'past-moments';

export type CEndLocation =
  | { kind: 'admin' }
  | { kind: 'preview' }
  | {
      kind: 'c-end';
      surface: CEndSurface;
      activityId?: number;
      courseId?: number;
      examId?: number;
      voteId?: number;
      voteV2Id?: number;
      voteV2OptionId?: number;
      voteResponseId?: number;
      h5Page?: H5Page;
    };

function examFlowPage(extra?: string): H5Page {
  if (extra === 'take') return 'exam-taking';
  if (extra === 'result') return 'exam-result';
  if (extra === 'review') return 'exam-review';
  if (extra === 'records') return 'exam-records';
  if (extra === 'rank') return 'exam-rank';
  return 'exam-prep';
}

export function parseCEndHash(hash: string): CEndLocation {
  const path = hash.replace(/^#\/?/, '').trim().split('?')[0] ?? '';
  const [scope, surface, rawId, extra, tail] = path.split('/');
  if (scope !== 'c') return { kind: 'admin' };
  if (!surface) return { kind: 'preview' };
  if (surface === 'course') {
    if (rawId) {
      const courseId = Number(rawId);
      if (Number.isFinite(courseId)) {
        return { kind: 'c-end', surface: 'pc', h5Page: 'course-detail', courseId };
      }
    }
    return { kind: 'c-end', surface: 'pc', h5Page: 'courses' };
  }
  if (surface === 'exam') {
    if (rawId) {
      const examId = Number(rawId);
      if (Number.isFinite(examId)) {
        return {
          kind: 'c-end',
          surface: 'pc',
          h5Page: examFlowPage(extra),
          examId,
        };
      }
    }
    return { kind: 'c-end', surface: 'pc', h5Page: 'exams' };
  }
  if (surface !== 'h5' && surface !== 'pc') return { kind: 'admin' };
  if (rawId == null || rawId === '') return { kind: 'c-end', surface };
  if (rawId === 'my') return { kind: 'c-end', surface, h5Page: 'my' };
  if (rawId === 'search') return { kind: 'c-end', surface, h5Page: 'activity-search' };
  if (rawId === 'list') return { kind: 'c-end', surface, h5Page: 'activity-list' };
  if (rawId === 'moments') return { kind: 'c-end', surface, h5Page: 'past-moments' };
  if (rawId === 'courses' || rawId === 'courses-mall') {
    if (extra) {
      const courseId = Number(extra);
      if (Number.isFinite(courseId)) {
        return { kind: 'c-end', surface, h5Page: 'course-detail', courseId };
      }
    }
    return { kind: 'c-end', surface, h5Page: 'courses' };
  }
  if (rawId === 'favorites') return { kind: 'c-end', surface, h5Page: 'favorites' };
  if (rawId === 'honor-admin') return { kind: 'c-end', surface, h5Page: 'honor-admin' };
  if (rawId === 'honor') return { kind: 'c-end', surface, h5Page: 'honor' };
  if (rawId === 'interest-groups') {
    if (extra === 'moments') return { kind: 'c-end', surface, h5Page: 'ig-past-moments' };
    return { kind: 'c-end', surface, h5Page: 'interest-groups' };
  }
  const igActToken = /^ig-act-(\d+)$/.exec(rawId);
  if (igActToken && extra === 'checkin') {
    return { kind: 'c-end', surface, activityId: Number(igActToken[1]), h5Page: 'ig-checkin' };
  }
  if (rawId === 'exams') {
    if (extra) {
      const examId = Number(extra);
      if (Number.isFinite(examId)) {
        return { kind: 'c-end', surface, h5Page: 'exam-prep', examId };
      }
    }
    return { kind: 'c-end', surface, h5Page: 'exams' };
  }
  if (rawId === 'votes-v2') {
    if (extra === 'mine') return { kind: 'c-end', surface, h5Page: 'vote-v2-records' };
    return { kind: 'c-end', surface, h5Page: 'votes-v2' };
  }
  if (rawId === 'votes') {
    if (extra === 'mine') {
      if (tail) {
        const voteResponseId = Number(tail);
        return Number.isFinite(voteResponseId)
          ? { kind: 'c-end', surface, h5Page: 'vote-record', voteResponseId }
          : { kind: 'c-end', surface, h5Page: 'vote-record' };
      }
      return { kind: 'c-end', surface, h5Page: 'vote-records' };
    }
    return { kind: 'c-end', surface, h5Page: 'votes' };
  }
  const voteV2Token = /^vote-v2-(\d+)$/.exec(rawId);
  if (voteV2Token) {
    const optionToken = extra ? /^option-(\d+)$/.exec(extra) : null;
    return {
      kind: 'c-end',
      surface,
      h5Page: optionToken ? 'vote-v2-option' : 'vote-v2-home',
      voteV2Id: Number(voteV2Token[1]),
      voteV2OptionId: optionToken ? Number(optionToken[1]) : undefined,
    };
  }
  const voteToken = /^vote-(\d+)$/.exec(rawId);
  if (voteToken) {
    return {
      kind: 'c-end',
      surface,
      h5Page: extra === 'take' ? 'vote-taking' : extra === 'results' ? 'vote-results' : 'vote-detail',
      voteId: Number(voteToken[1]),
    };
  }
  const examToken = /^exam-(\d+)$/.exec(rawId);
  if (examToken) {
    return {
      kind: 'c-end',
      surface,
      h5Page: examFlowPage(extra),
      examId: Number(examToken[1]),
    };
  }
  const courseToken = /^course-(\d+)$/.exec(rawId);
  if (courseToken) {
    return { kind: 'c-end', surface, h5Page: 'course-detail', courseId: Number(courseToken[1]) };
  }
  const activityId = Number(rawId);
  const parsed = Number.isFinite(activityId) ? activityId : -1;
  if (extra === 'signup') return { kind: 'c-end', surface, activityId: parsed, h5Page: 'signup' };
  if (extra === 'checkin') return { kind: 'c-end', surface, activityId: parsed, h5Page: 'checkin' };
  return { kind: 'c-end', surface, activityId: parsed };
}

export function toCEndPortalHash(): string {
  return '#/c';
}

export function goCEndPortal() {
  window.location.hash = toCEndPortalHash();
}

export function toCEndHash(surface: CEndSurface, activityId?: number): string {
  return activityId == null ? `#/c/${surface}` : `#/c/${surface}/${activityId}`;
}

export function goCEnd(surface: CEndSurface, activityId?: number) {
  window.location.hash = toCEndHash(surface, activityId);
}

export function toCEndSignupHash(surface: CEndSurface, activityId: number): string {
  return `#/c/${surface}/${activityId}/signup`;
}

export function goCEndSignup(surface: CEndSurface, activityId: number) {
  window.location.hash = toCEndSignupHash(surface, activityId);
}

export function toH5MySignupsHash(): string {
  return '#/c/h5/my';
}

export function toH5ActivityListHash(): string {
  return '#/c/h5/list';
}

export function toH5ActivitySearchHash(): string {
  return '#/c/h5/search';
}

export function toPcActivityListHash(): string {
  return '#/c/pc/list';
}

export function toPcActivitySearchHash(): string {
  return '#/c/pc/search';
}

export function goCEndActivityList(surface: CEndSurface) {
  window.location.hash = surface === 'h5' ? toH5ActivityListHash() : toPcActivityListHash();
}

export function goCEndActivitySearch(surface: CEndSurface) {
  window.location.hash = surface === 'h5' ? toH5ActivitySearchHash() : toPcActivitySearchHash();
}

export function toH5PastMomentsHash(): string {
  return '#/c/h5/moments';
}

export function toPcPastMomentsHash(): string {
  return '#/c/pc/moments';
}

export function goCEndPastMoments(surface: CEndSurface) {
  window.location.hash = surface === 'h5' ? toH5PastMomentsHash() : toPcPastMomentsHash();
}

export function goH5MySignups() {
  window.location.hash = toH5MySignupsHash();
}

export function toH5CourseListHash(): string {
  return '#/c/h5/courses';
}

export function toH5ExamListHash(): string {
  return '#/c/h5/exams';
}

export function toVoteListHash(surface: CEndSurface): string {
  return `#/c/${surface}/votes`;
}

export function toH5VoteListHash(): string {
  return toVoteListHash('h5');
}

export function toVoteV2ListHash(surface: CEndSurface): string {
  return `#/c/${surface}/votes-v2`;
}

export function toH5VoteV2ListHash(): string {
  return toVoteV2ListHash('h5');
}

export function toPcVoteV2ListHash(): string {
  return toVoteV2ListHash('pc');
}

export function toVoteV2RecordsHash(surface: CEndSurface): string {
  return `#/c/${surface}/votes-v2/mine`;
}

export function toH5VoteV2RecordsHash(): string {
  return toVoteV2RecordsHash('h5');
}

export function toPcVoteV2RecordsHash(): string {
  return toVoteV2RecordsHash('pc');
}

export function toVoteV2HomeHash(surface: CEndSurface, id: number): string {
  return `#/c/${surface}/vote-v2-${id}`;
}

export function toH5VoteV2HomeHash(id: number): string {
  return toVoteV2HomeHash('h5', id);
}

export function toPcVoteV2HomeHash(id: number): string {
  return toVoteV2HomeHash('pc', id);
}

export function toVoteV2OptionHash(surface: CEndSurface, campaignId: number, optionId: number): string {
  return `#/c/${surface}/vote-v2-${campaignId}/option-${optionId}`;
}

export function toH5VoteV2OptionHash(campaignId: number, optionId: number): string {
  return toVoteV2OptionHash('h5', campaignId, optionId);
}

export function toPcVoteV2OptionHash(campaignId: number, optionId: number): string {
  return toVoteV2OptionHash('pc', campaignId, optionId);
}

export function toPcVoteListHash(): string {
  return toVoteListHash('pc');
}

export function goVoteList(surface: CEndSurface) {
  window.location.hash = toVoteListHash(surface);
}

export function goH5VoteList() {
  goVoteList('h5');
}

export function toVoteRecordsHash(surface: CEndSurface): string {
  return `#/c/${surface}/votes/mine`;
}

export function toH5VoteRecordsHash(): string {
  return toVoteRecordsHash('h5');
}

export function toPcVoteRecordsHash(): string {
  return toVoteRecordsHash('pc');
}

export function goVoteRecords(surface: CEndSurface) {
  window.location.hash = toVoteRecordsHash(surface);
}

export function goH5VoteRecords() {
  goVoteRecords('h5');
}

export function toH5VoteRecordHash(id: number): string {
  return `#/c/h5/votes/mine/${id}`;
}

export function toVoteDetailHash(surface: CEndSurface, id: number): string {
  return `#/c/${surface}/vote-${id}`;
}

export function toH5VoteDetailHash(id: number): string {
  return toVoteDetailHash('h5', id);
}

export function toPcVoteDetailHash(id: number): string {
  return toVoteDetailHash('pc', id);
}

export function goVoteDetail(surface: CEndSurface, id: number) {
  window.location.hash = toVoteDetailHash(surface, id);
}

export function goH5VoteDetail(id: number) {
  goVoteDetail('h5', id);
}

export function toVoteTakingHash(surface: CEndSurface, id: number): string {
  return `#/c/${surface}/vote-${id}/take`;
}

export function toH5VoteTakingHash(id: number): string {
  return toVoteTakingHash('h5', id);
}

export function toPcVoteTakingHash(id: number): string {
  return toVoteTakingHash('pc', id);
}

export function toVoteResultsHash(surface: CEndSurface, id: number): string {
  return `#/c/${surface}/vote-${id}/results`;
}

export function toH5VoteResultsHash(id: number): string {
  return toVoteResultsHash('h5', id);
}

export function toPcVoteResultsHash(id: number): string {
  return toVoteResultsHash('pc', id);
}

export function goVoteResults(surface: CEndSurface, id: number) {
  window.location.hash = toVoteResultsHash(surface, id);
}

export function goH5VoteResults(id: number) {
  goVoteResults('h5', id);
}

export function toH5InterestGroupsHash(): string {
  return '#/c/h5/interest-groups';
}

export function goH5InterestGroups() {
  window.location.hash = toH5InterestGroupsHash();
}

export function toPcInterestGroupsHash(): string {
  return '#/c/pc/interest-groups';
}

export function goPcInterestGroups() {
  window.location.hash = toPcInterestGroupsHash();
}

export function toH5IgPastMomentsHash(): string {
  return '#/c/h5/interest-groups/moments';
}

export function toPcIgPastMomentsHash(): string {
  return '#/c/pc/interest-groups/moments';
}

export function goCEndIgPastMoments(surface: CEndSurface) {
  window.location.hash = surface === 'h5' ? toH5IgPastMomentsHash() : toPcIgPastMomentsHash();
}

export function toH5HonorHash(): string {
  return '#/c/h5/honor';
}

export function goH5Honor() {
  window.location.hash = toH5HonorHash();
}

export function toH5HonorAdminHash(): string {
  return '#/c/h5/honor-admin';
}

export function goH5ExamList() {
  window.location.hash = toH5ExamListHash();
}

export function toH5ExamPrepHash(id: number): string {
  return `#/c/h5/exam-${id}`;
}

export function goH5ExamPrep(id: number) {
  window.location.hash = toH5ExamPrepHash(id);
}

export function toH5ExamTakingHash(id: number): string {
  return `#/c/h5/exam-${id}/take`;
}

export function goH5ExamTaking(id: number) {
  window.location.hash = toH5ExamTakingHash(id);
}

export function toH5ExamResultHash(id: number): string {
  return `#/c/h5/exam-${id}/result`;
}

export function goH5ExamResult(id: number) {
  window.location.hash = toH5ExamResultHash(id);
}

export function toH5ExamReviewHash(id: number): string {
  return `#/c/h5/exam-${id}/review`;
}

export function goH5ExamReview(id: number) {
  window.location.hash = toH5ExamReviewHash(id);
}

export function toH5ExamRecordsHash(id: number): string {
  return `#/c/h5/exam-${id}/records`;
}

export function goH5ExamRecords(id: number) {
  window.location.hash = toH5ExamRecordsHash(id);
}

export function toH5ExamRankHash(id: number): string {
  return `#/c/h5/exam-${id}/rank`;
}

export function goH5ExamRank(id: number) {
  window.location.hash = toH5ExamRankHash(id);
}

export function goH5CourseList() {
  window.location.hash = toH5CourseListHash();
}

export function toH5CourseDetailHash(id: number): string {
  return `#/c/h5/course-${id}`;
}

export function goH5CourseDetail(id: number) {
  window.location.hash = toH5CourseDetailHash(id);
}

export function toPcCourseListHash(): string {
  return '#/c/course';
}

export function goPcCourseList() {
  window.location.hash = toPcCourseListHash();
}

export function toPcCourseDetailHash(id: number): string {
  return `#/c/course/${id}`;
}

export function goPcCourseDetail(id: number) {
  window.location.hash = toPcCourseDetailHash(id);
}

export function toPcExamListHash(): string {
  return '#/c/exam';
}

export function goPcExamList() {
  window.location.hash = toPcExamListHash();
}

export function toPcExamPrepHash(id: number): string {
  return `#/c/exam/${id}`;
}

export function goPcExamPrep(id: number) {
  window.location.hash = toPcExamPrepHash(id);
}

export function toPcExamTakingHash(id: number): string {
  return `#/c/exam/${id}/take`;
}

export function goPcExamTaking(id: number) {
  window.location.hash = toPcExamTakingHash(id);
}

export function toPcExamResultHash(id: number): string {
  return `#/c/exam/${id}/result`;
}

export function goPcExamResult(id: number) {
  window.location.hash = toPcExamResultHash(id);
}

export function toPcExamReviewHash(id: number): string {
  return `#/c/exam/${id}/review`;
}

export function goPcExamReview(id: number) {
  window.location.hash = toPcExamReviewHash(id);
}

export function toPcExamRecordsHash(id: number): string {
  return `#/c/exam/${id}/records`;
}

export function goPcExamRecords(id: number) {
  window.location.hash = toPcExamRecordsHash(id);
}

export function toPcExamRankHash(id: number): string {
  return `#/c/exam/${id}/rank`;
}

export function goPcExamRank(id: number) {
  window.location.hash = toPcExamRankHash(id);
}

export function toPcMySignupsHash(): string {
  return '#/c/pc/my';
}

export function goPcMySignups() {
  window.location.hash = toPcMySignupsHash();
}

export function toH5FavoritesHash(): string {
  return '#/c/h5/favorites';
}

export function goH5Favorites() {
  window.location.hash = toH5FavoritesHash();
}

export function toPcFavoritesHash(): string {
  return '#/c/pc/favorites';
}

export function goPcFavorites() {
  window.location.hash = toPcFavoritesHash();
}

export function goAdminWorkbench() {
  window.location.hash = '#/workbench/dashboard';
}

export function parseLocationHash(hash: string): {
  application: string;
  page: string;
  recordId?: string;
  tab?: string;
  ownerApp?: 'culture' | 'skills-contest';
} {
  const fallback = { application: 'workbench', page: 'dashboard' };
  const path = hash.replace(/^#\/?/, '').trim();
  if (!path) return fallback;
  const [pathname, queryString] = path.split('?');
  const [applicationKey, pageKey, recordId, tab] = pathname.split('/');
  const appQuery = new URLSearchParams(queryString ?? '').get('app');
  const ownerApp = appQuery === 'culture' || appQuery === 'skills-contest' ? appQuery : undefined;
  const application = getApplication(applicationKey);
  if (!application) return fallback;
  const menus = applicationMenus[application.key] ?? [];
  const extraPages = [
    'activity-create',
    'activity-edit',
    'activity-detail',
    'course-create',
    'course-edit',
    'course-detail',
    'exam-create',
    'exam-edit',
    'exam-detail',
    'question-create',
    'question-edit',
    'question-detail',
    'practice-question-create',
    'practice-question-edit',
    'practice-question-detail',
    'paper-create',
    'paper-edit',
    'paper-detail',
    'interest-group-detail',
    'interest-group-activity-create',
    'interest-group-activity-edit',
    'interest-group-activity-detail',
    'award-create',
    'award-edit',
    'award-detail',
    'vote-create',
    'vote-edit',
    'vote-detail',
    'vote-v2-create',
    'vote-v2-edit',
    'vote-v2-detail',
    'vote-v2-players',
    'activity-layout-mobile',
    'activity-layout-pc',
    'interest-group-layout-mobile',
    'interest-group-layout-pc',
    'vote-v2-layout-mobile',
    'vote-v2-layout-pc',
    'live-create',
    'live-edit',
    'live-detail',
    'lottery-create',
    'lottery-edit',
    'lottery-detail',
    'checkin-create',
    'checkin-edit',
    'checkin-detail',
    'learning-plan-create',
    'learning-plan-edit',
    'learning-plan-preview',
  ];
  if (pageKey && (isLeafMenuKey(menus, pageKey) || extraPages.includes(pageKey))) {
    return {
      application: application.key,
      page: pageKey,
      recordId,
      ...(tab ? { tab } : {}),
      ...(ownerApp ? { ownerApp } : {}),
    };
  }
  const legacyRelatedTabs: Record<string, string> = {
    'activity-signups': 'signups',
    'activity-comments': 'comments',
    'activity-moments': 'moments',
    'activity-prizes': 'prizes',
  };
  if (application.key === 'activities' && pageKey && pageKey in legacyRelatedTabs && recordId) {
    return { application: 'activities', page: 'activity-detail', recordId, tab: legacyRelatedTabs[pageKey] };
  }
  if (application.key === 'training' && pageKey === 'course-comments' && recordId) {
    return { application: 'training', page: 'course-detail', recordId, tab: 'comments', ...(ownerApp ? { ownerApp } : {}) };
  }
  return { application: application.key, page: application.defaultPage, ...(ownerApp ? { ownerApp } : {}) };
}

export function toLocationHash(
  application: string,
  page: string,
  recordId?: string,
  tab?: string,
  ownerApp?: string,
): string {
  const hash =
    recordId && tab
      ? `#/${application}/${page}/${recordId}/${tab}`
      : recordId
        ? `#/${application}/${page}/${recordId}`
        : `#/${application}/${page}`;
  if (application === 'checkin' && page === 'checkin-list' && (ownerApp === 'culture' || ownerApp === 'skills-contest')) {
    return `${hash}?app=${ownerApp}`;
  }
  return hash;
}

export function siderSelectedKey(page: string): string {
  if (page === 'activity-create' || page === 'activity-edit' || page === 'activity-detail') {
    return 'activity-list';
  }
  if (page === 'course-create' || page === 'course-edit' || page === 'course-detail' || page === 'course-comments') {
    return 'training-courses';
  }
  if (page === 'exam-create' || page === 'exam-edit' || page === 'exam-detail') {
    return 'exam-list';
  }
  if (page === 'question-create' || page === 'question-edit' || page === 'question-detail') {
    return 'exam-questions';
  }
  if (page === 'practice-question-create' || page === 'practice-question-edit' || page === 'practice-question-detail') {
    return 'practice-questions';
  }
  if (page === 'paper-create' || page === 'paper-edit' || page === 'paper-detail') {
    return 'exam-papers';
  }
  if (page === 'interest-group-detail') {
    return 'interest-group-list';
  }
  if (
    page === 'interest-group-activity-create' ||
    page === 'interest-group-activity-edit' ||
    page === 'interest-group-activity-detail'
  ) {
    return 'interest-group-activities';
  }
  if (page === 'award-create' || page === 'award-edit' || page === 'award-detail') {
    return 'award-list';
  }
  if (page === 'vote-create' || page === 'vote-edit' || page === 'vote-detail') {
    return 'vote-list';
  }
  if (page === 'vote-v2-create' || page === 'vote-v2-edit' || page === 'vote-v2-detail' || page === 'vote-v2-players') {
    return 'vote-v2-list';
  }
  if (page === 'activity-layout-mobile' || page === 'activity-layout-pc') {
    return 'activity-layout';
  }
  if (page === 'interest-group-layout-mobile' || page === 'interest-group-layout-pc') {
    return 'interest-group-layout';
  }
  if (page === 'vote-v2-layout-mobile' || page === 'vote-v2-layout-pc') {
    return 'vote-v2-layout';
  }
  if (page === 'live-create' || page === 'live-edit' || page === 'live-detail') {
    return 'live-list';
  }
  if (page === 'lottery-create' || page === 'lottery-edit' || page === 'lottery-detail') {
    return 'lottery-list';
  }
  if (page === 'checkin-create' || page === 'checkin-edit' || page === 'checkin-detail') {
    return 'checkin-list';
  }
  if (page === 'learning-plan-create' || page === 'learning-plan-edit' || page === 'learning-plan-preview') {
    return 'learning-plan-list';
  }
  return page;
}
