import { relatedPages } from '../features/activities/model/related';

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
  | 'read'
  | 'rocket'
  | 'shopping'
  | 'shoppingCart'
  | 'sync'
  | 'tags'
  | 'team'
  | 'trophy'
  | 'unorderedList'
  | 'user';

export type ApplicationMeta = {
  key: string;
  label: string;
  category: ApplicationCategory;
  icon: NavIcon;
  defaultPage: string;
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
  { key: 'experience', label: '员工体验', category: '员工与组织', icon: 'heart', defaultPage: 'experience-articles' },
  { key: 'training', label: '课程', category: '员工与组织', icon: 'book', defaultPage: 'training-courses' },
  { key: 'skills-contest', label: '技能大赛', category: '员工与组织', icon: 'trophy', defaultPage: 'contest-list' },
  { key: 'exam', label: '考试', category: '员工与组织', icon: 'fileText', defaultPage: 'exam-list' },
  { key: 'care', label: '人文关怀', category: '员工与组织', icon: 'gift', defaultPage: 'care-plans' },
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
    { key: 'activity-tags', icon: 'tags', label: '活动标签' },
    { key: 'activity-rules', icon: 'fileText', label: '规则设置' },
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
    {
      key: 'experience-groups',
      icon: 'team',
      label: '社群运营',
      children: [{ key: 'experience-interest-groups', icon: 'team', label: '兴趣小组' }],
    },
  ],
  training: [
    { key: 'training-courses', icon: 'book', label: '课程管理' },
    { key: 'training-courseware', icon: 'fileText', label: '课件管理' },
    { key: 'training-records', icon: 'checkCircle', label: '学习记录' },
    { key: 'training-rules', icon: 'fileText', label: '规则设置' },
  ],
  'skills-contest': [
    { key: 'contest-list', icon: 'trophy', label: '赛事管理' },
    { key: 'signup-list', icon: 'unorderedList', label: '报名' },
    { key: 'score-list', icon: 'checkCircle', label: '成绩' },
  ],
  exam: [
    { key: 'exam-overview', icon: 'dashboard', label: '概览' },
    { key: 'exam-list', icon: 'unorderedList', label: '考试管理' },
    { key: 'exam-rules', icon: 'fileText', label: '规则设置' },
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

export function getDirectApplications(max: number): ApplicationMeta[] {
  return applications.slice(0, max);
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

export type H5Page = 'my' | 'courses' | 'course-detail' | 'favorites';

export type CEndLocation =
  | { kind: 'admin' }
  | { kind: 'preview' }
  | { kind: 'c-end'; surface: CEndSurface; activityId?: number; courseId?: number; h5Page?: H5Page };

export function parseCEndHash(hash: string): CEndLocation {
  const path = hash.replace(/^#\/?/, '').trim();
  const [scope, surface, rawId, extra] = path.split('/');
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
  if (surface !== 'h5' && surface !== 'pc') return { kind: 'admin' };
  if (rawId == null || rawId === '') return { kind: 'c-end', surface };
  if (rawId === 'my') return { kind: 'c-end', surface, h5Page: 'my' };
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
  const courseToken = /^course-(\d+)$/.exec(rawId);
  if (courseToken) {
    return { kind: 'c-end', surface, h5Page: 'course-detail', courseId: Number(courseToken[1]) };
  }
  const activityId = Number(rawId);
  const parsed = Number.isFinite(activityId) ? activityId : -1;
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

export function toH5MySignupsHash(): string {
  return '#/c/h5/my';
}

export function goH5MySignups() {
  window.location.hash = toH5MySignupsHash();
}

export function toH5CourseListHash(): string {
  return '#/c/h5/courses';
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

export function parseLocationHash(hash: string): { application: string; page: string; recordId?: string } {
  const fallback = { application: 'workbench', page: 'dashboard' };
  const path = hash.replace(/^#\/?/, '').trim();
  if (!path) return fallback;
  const [applicationKey, pageKey, recordId] = path.split('/');
  const application = getApplication(applicationKey);
  if (!application) return fallback;
  const menus = applicationMenus[application.key] ?? [];
  const extraPages = [
    'activity-create',
    'activity-edit',
    'activity-detail',
    'course-create',
    'course-edit',
    'course-comments',
    'exam-create',
    'exam-edit',
    ...relatedPages,
  ];
  if (pageKey && (isLeafMenuKey(menus, pageKey) || extraPages.includes(pageKey))) {
    return { application: application.key, page: pageKey, recordId };
  }
  return { application: application.key, page: application.defaultPage };
}

export function toLocationHash(application: string, page: string, recordId?: string): string {
  return recordId ? `#/${application}/${page}/${recordId}` : `#/${application}/${page}`;
}

export function siderSelectedKey(page: string): string {
  if (
    page === 'activity-create' ||
    page === 'activity-edit' ||
    page === 'activity-detail' ||
    relatedPages.includes(page as (typeof relatedPages)[number])
  ) {
    return 'activity-list';
  }
  if (page === 'course-create' || page === 'course-edit' || page === 'course-comments') {
    return 'training-courses';
  }
  if (page === 'exam-create' || page === 'exam-edit') {
    return 'exam-list';
  }
  return page;
}
