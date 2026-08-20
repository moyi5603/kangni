import type { CategoryNode } from '../../../shared/category-tree/categoryTree';

export const TRAINING_MOCK_VERSION = 8;

export const courseCategoryStatuses = ['启用', '禁用'] as const;
export type CourseCategoryStatus = (typeof courseCategoryStatuses)[number];

export type CourseCategoryRecord = {
  id: number;
  name: string;
  status: CourseCategoryStatus;
};

export const courseStatuses = ['草稿', '已发布', '已下架'] as const;
export type CourseStatus = (typeof courseStatuses)[number];

export const courseTypes = ['视频', '音频', 'PDF'] as const;
export type CourseType = (typeof courseTypes)[number];

export const learningModes = ['不限制', '按序学习'] as const;
export type LearningMode = (typeof learningModes)[number];

export type CourseCategoryNode = CategoryNode;

export type CourseCatalogItem = {
  coursewareId: number;
  creditHours: number;
  required: boolean;
};

export type CourseCommentConfig = {
  commentEnabled: boolean;
  commentAuditEnabled: boolean;
  likeEnabled: boolean;
  favoriteEnabled: boolean;
};

export function defaultCourseCommentConfig(): CourseCommentConfig {
  return {
    commentEnabled: true,
    commentAuditEnabled: false,
    likeEnabled: true,
    favoriteEnabled: true,
  };
}

export function normalizeCourseCommentConfig(
  config?: Partial<CourseCommentConfig> | null,
): CourseCommentConfig {
  const base = defaultCourseCommentConfig();
  if (!config) return base;
  return {
    commentEnabled: config.commentEnabled ?? base.commentEnabled,
    commentAuditEnabled: config.commentAuditEnabled ?? base.commentAuditEnabled,
    likeEnabled: config.likeEnabled ?? base.likeEnabled,
    favoriteEnabled: config.favoriteEnabled ?? base.favoriteEnabled,
  };
}

export type CourseRecord = {
  id: number;
  name: string;
  cover: string;
  type: CourseType;
  categoryId: number | null;
  tags: string;
  audience: string;
  learningMode: LearningMode;
  catalog: CourseCatalogItem[];
  introHtml: string;
  commentConfig: CourseCommentConfig;
  status: CourseStatus;
  creator: string;
  createdAt: string;
  updatedAt: string;
};

export function canDeleteCourse(record: CourseRecord): boolean {
  return record.status !== '已发布';
}

export const coursewareTypes = ['视频', '音频', 'PDF'] as const;
export type CoursewareType = (typeof coursewareTypes)[number];

export const coursewarePublishStatuses = ['草稿', '已发布'] as const;
export type CoursewarePublishStatus = (typeof coursewarePublishStatuses)[number];

export type CoursewareRecord = {
  id: number;
  name: string;
  cover: string;
  type: CoursewareType;
  categoryId: number | null;
  fileName: string;
  fileUrl: string;
  intro: string;
  estimatedDurationSeconds: number | null;
  publishStatus: CoursewarePublishStatus;
  creator: string;
  createdAt: string;
  updatedAt: string;
};

export function canDeleteCourseware(record: CoursewareRecord): boolean {
  return record.publishStatus === '草稿';
}

export type CoursewareCategoryNode = {
  id: number;
  name: string;
  children?: CoursewareCategoryNode[];
};

export const learningStatuses = ['未开始', '学习中', '已完成'] as const;
export type LearningStatus = (typeof learningStatuses)[number];

export type LearningRecord = {
  id: number;
  employee: string;
  department: string;
  course: string;
  progress: number;
  status: LearningStatus;
  lastLearnedAt: string;
};

export const initialCourseCategories: CourseCategoryRecord[] = [
  { id: 1, name: '入职培训', status: '启用' },
  { id: 2, name: '安全规范', status: '启用' },
  { id: 3, name: '技能提升', status: '启用' },
  { id: 4, name: '管理进阶', status: '禁用' },
];

/** 课程 / 课件左侧分类树共用同一套结构（独立 store，互不影响） */
const sharedCategoryTreeSeed: CategoryNode[] = [
  {
    id: 10,
    name: '科技分类0001',
  },
  {
    id: 20,
    name: '【一级】验收测试分类',
    children: [
      {
        id: 21,
        name: '【二级】python',
        children: [
          { id: 211, name: '精通' },
          { id: 212, name: '入门' },
        ],
      },
      {
        id: 22,
        name: '【二级】Java',
        children: [
          { id: 221, name: '精通' },
          { id: 222, name: '入门' },
        ],
      },
      {
        id: 23,
        name: '【二级】PHP',
        children: [{ id: 231, name: '入门' }],
      },
    ],
  },
  {
    id: 30,
    name: '办公技能',
    children: [
      { id: 31, name: 'PPT 高级教程' },
      { id: 32, name: '初级会计培训' },
      { id: 33, name: '自动分类' },
      { id: 34, name: '课件分类0708' },
      { id: 35, name: '111' },
    ],
  },
];

function cloneCategoryTree(nodes: CategoryNode[]): CategoryNode[] {
  return nodes.map((node) => ({
    id: node.id,
    name: node.name,
    children: node.children?.length ? cloneCategoryTree(node.children) : undefined,
  }));
}

export const initialCourseCategoryTree: CourseCategoryNode[] = cloneCategoryTree(sharedCategoryTreeSeed);

export const initialCourses: CourseRecord[] = [
  {
    id: 1,
    name: '快速提升自己的沟通能力',
    cover: '',
    type: '视频',
    categoryId: 20,
    tags: '通用',
    audience: '全体员工',
    learningMode: '不限制',
    catalog: [
      { coursewareId: 2, creditHours: 1, required: true },
      { coursewareId: 3, creditHours: 1, required: true },
      { coursewareId: 5, creditHours: 1, required: false },
    ],
    introHtml:
      '<p>很多职场沟通问题，其实是沟通方式不对，而非能力不足。汇报讲不清、跨部门协作卡住、情绪一上来话就乱，根子往往在表达方式。</p>' +
      '<p>本课面向汇报、跨部门协作、情绪管理等真实场景，用结构化逻辑把重点讲明白，让对方听得懂、愿意配合。</p>' +
      '<p>学完后，你能更从容地完成沟通、对齐协作、处理冲突，让职场表达更有影响力。</p>',
    commentConfig: {
      commentEnabled: true,
      commentAuditEnabled: false,
      likeEnabled: true,
      favoriteEnabled: true,
    },
    status: '已发布',
    creator: '李鸿',
    createdAt: '2026-07-30 18:15:15',
    updatedAt: '2026-07-30 18:15:15',
  },
  {
    id: 2,
    name: '快速上手销售技巧',
    cover: '',
    type: '视频',
    categoryId: 10,
    tags: '销售',
    audience: '销售经理、大客户经理',
    learningMode: '不限制',
    catalog: [
      { coursewareId: 2, creditHours: 1, required: true },
      { coursewareId: 3, creditHours: 1, required: true },
      { coursewareId: 5, creditHours: 1, required: false },
    ],
    introHtml: '<p>本课程面向销售岗位，帮助快速掌握销售技巧与客户沟通方法。</p>',
    commentConfig: {
      commentEnabled: true,
      commentAuditEnabled: false,
      likeEnabled: true,
      favoriteEnabled: true,
    },
    status: '已发布',
    creator: '李鸿',
    createdAt: '2026-07-28 10:20:08',
    updatedAt: '2026-07-29 09:12:40',
  },
  {
    id: 3,
    name: '新员工入职指引',
    cover: '',
    type: '视频',
    categoryId: 30,
    tags: '通用',
    audience: '全体员工',
    learningMode: '不限制',
    catalog: [],
    introHtml: '',
    commentConfig: {
      commentEnabled: true,
      commentAuditEnabled: false,
      likeEnabled: true,
      favoriteEnabled: true,
    },
    status: '已发布',
    creator: '张敏',
    createdAt: '2026-08-18 10:20:00',
    updatedAt: '2026-08-18 10:20:00',
  },
  {
    id: 4,
    name: '车间安全操作规范',
    cover: '',
    type: 'PDF',
    categoryId: 31,
    tags: '通用',
    audience: '全体员工',
    learningMode: '不限制',
    catalog: [],
    introHtml: '',
    commentConfig: {
      commentEnabled: true,
      commentAuditEnabled: false,
      likeEnabled: true,
      favoriteEnabled: true,
    },
    status: '已发布',
    creator: '李强',
    createdAt: '2026-08-17 16:45:00',
    updatedAt: '2026-08-17 16:45:00',
  },
  {
    id: 5,
    name: 'Excel 数据分析基础',
    cover: '',
    type: '视频',
    categoryId: 21,
    tags: '通用',
    audience: '全体员工',
    learningMode: '不限制',
    catalog: [],
    introHtml: '',
    commentConfig: {
      commentEnabled: true,
      commentAuditEnabled: false,
      likeEnabled: true,
      favoriteEnabled: true,
    },
    status: '草稿',
    creator: '王倩',
    createdAt: '2026-08-16 09:30:00',
    updatedAt: '2026-08-16 09:30:00',
  },
  {
    id: 6,
    name: '班组长管理实务',
    cover: '',
    type: '音频',
    categoryId: 22,
    tags: '通用',
    audience: '全体员工',
    learningMode: '不限制',
    catalog: [],
    introHtml: '',
    commentConfig: {
      commentEnabled: true,
      commentAuditEnabled: false,
      likeEnabled: true,
      favoriteEnabled: true,
    },
    status: '已下架',
    creator: '-',
    createdAt: '2026-08-15 14:10:00',
    updatedAt: '2026-08-15 14:10:00',
  },
  {
    id: 7,
    name: '初级会计培训',
    cover: '',
    type: '视频',
    categoryId: 32,
    tags: '通用',
    audience: '全体员工',
    learningMode: '不限制',
    catalog: [],
    introHtml: '',
    commentConfig: {
      commentEnabled: true,
      commentAuditEnabled: false,
      likeEnabled: true,
      favoriteEnabled: true,
    },
    status: '已发布',
    creator: '陈琳',
    createdAt: '2026-07-20 11:08:22',
    updatedAt: '2026-07-22 08:40:11',
  },
  {
    id: 8,
    name: '产品需求分析实战',
    cover: '',
    type: '视频',
    categoryId: 10,
    tags: '通用',
    audience: '全体员工',
    learningMode: '不限制',
    catalog: [],
    introHtml: '',
    commentConfig: {
      commentEnabled: true,
      commentAuditEnabled: false,
      likeEnabled: true,
      favoriteEnabled: true,
    },
    status: '已发布',
    creator: '李鸿',
    createdAt: '2026-07-18 15:33:09',
    updatedAt: '2026-07-18 15:33:09',
  },
  {
    id: 9,
    name: '采购合同要点',
    cover: '',
    type: 'PDF',
    categoryId: 34,
    tags: '通用',
    audience: '全体员工',
    learningMode: '不限制',
    catalog: [],
    introHtml: '',
    commentConfig: {
      commentEnabled: true,
      commentAuditEnabled: false,
      likeEnabled: true,
      favoriteEnabled: true,
    },
    status: '草稿',
    creator: '赵宁',
    createdAt: '2026-07-12 09:05:40',
    updatedAt: '2026-07-12 09:05:40',
  },
  {
    id: 10,
    name: '财务报表解读',
    cover: '',
    type: '音频',
    categoryId: 35,
    tags: '通用',
    audience: '全体员工',
    learningMode: '不限制',
    catalog: [],
    introHtml: '',
    commentConfig: {
      commentEnabled: true,
      commentAuditEnabled: false,
      likeEnabled: true,
      favoriteEnabled: true,
    },
    status: '已下架',
    creator: '孙悦',
    createdAt: '2026-07-08 19:55:05',
    updatedAt: '2026-07-10 08:12:00',
  },
];

export const initialCoursewareCategories: CoursewareCategoryNode[] = cloneCategoryTree(sharedCategoryTreeSeed);

export const initialCourseware: CoursewareRecord[] = [
  {
    id: 1,
    name: '员工育餐课件',
    cover: '',
    type: '视频',
    categoryId: null,
    fileName: '',
    fileUrl: '',
    intro: '',
    estimatedDurationSeconds: null,
    publishStatus: '草稿',
    creator: '-',
    createdAt: '2026-07-13 17:49:13',
    updatedAt: '2026-07-13 17:49:13',
  },
  {
    id: 2,
    name: '课件20260708',
    cover: '',
    type: '视频',
    categoryId: 22,
    fileName: '',
    fileUrl: '',
    intro: '',
    estimatedDurationSeconds: 321,
    publishStatus: '已发布',
    creator: '-',
    createdAt: '2026-07-13 15:00:28',
    updatedAt: '2026-07-13 15:00:28',
  },
  {
    id: 3,
    name: 'PPT高级排版技巧',
    cover: '',
    type: '视频',
    categoryId: 21,
    fileName: '',
    fileUrl: '',
    intro: '',
    estimatedDurationSeconds: 77,
    publishStatus: '已发布',
    creator: '-',
    createdAt: '2026-07-13 14:42:55',
    updatedAt: '2026-07-13 14:42:55',
  },
  {
    id: 4,
    name: '测试21',
    cover: '',
    type: 'PDF',
    categoryId: 21,
    fileName: '',
    fileUrl: '',
    intro: '',
    estimatedDurationSeconds: null,
    publishStatus: '草稿',
    creator: '-',
    createdAt: '2026-07-10 20:49:10',
    updatedAt: '2026-07-10 20:49:10',
  },
  {
    id: 5,
    name: 'PPT动画特效制作',
    cover: '',
    type: '视频',
    categoryId: 34,
    fileName: '',
    fileUrl: '',
    intro: '',
    estimatedDurationSeconds: 55,
    publishStatus: '已发布',
    creator: '-',
    createdAt: '2026-07-10 20:15:15',
    updatedAt: '2026-07-10 20:15:15',
  },
  {
    id: 6,
    name: 'dd',
    cover: '',
    type: '视频',
    categoryId: 10,
    fileName: '',
    fileUrl: '',
    intro: '',
    estimatedDurationSeconds: null,
    publishStatus: '草稿',
    creator: '-',
    createdAt: '2026-07-09 00:42:28',
    updatedAt: '2026-07-09 00:42:28',
  },
  {
    id: 7,
    name: '产品迭代PDF',
    cover: '',
    type: 'PDF',
    categoryId: 30,
    fileName: '',
    fileUrl: '',
    intro: '',
    estimatedDurationSeconds: null,
    publishStatus: '已发布',
    creator: '-',
    createdAt: '2026-07-08 19:55:05',
    updatedAt: '2026-07-08 19:55:05',
  },
  {
    id: 8,
    name: '产品迭代',
    cover: '',
    type: '视频',
    categoryId: 30,
    fileName: '',
    fileUrl: '',
    intro: '',
    estimatedDurationSeconds: null,
    publishStatus: '已发布',
    creator: '-',
    createdAt: '2026-07-08 19:39:10',
    updatedAt: '2026-07-08 19:39:10',
  },
  {
    id: 9,
    name: '课件20260708',
    cover: '',
    type: '视频',
    categoryId: 34,
    fileName: '',
    fileUrl: '',
    intro: '',
    estimatedDurationSeconds: null,
    publishStatus: '已发布',
    creator: '-',
    createdAt: '2026-07-08 15:56:23',
    updatedAt: '2026-07-08 15:56:23',
  },
];

export const initialLearningRecords: LearningRecord[] = [
  { id: 1, employee: '张三', department: '制造一部', course: '新员工入职指引', progress: 100, status: '已完成', lastLearnedAt: '2026-08-18 18:20' },
  { id: 2, employee: '李四', department: '制造二部', course: '车间安全操作规范', progress: 65, status: '学习中', lastLearnedAt: '2026-08-19 09:15' },
  { id: 3, employee: '王五', department: '质量部', course: 'Excel 数据分析基础', progress: 0, status: '未开始', lastLearnedAt: '2026-08-17 11:00' },
  { id: 4, employee: '赵六', department: '人力资源部', course: '班组长管理实务', progress: 40, status: '学习中', lastLearnedAt: '2026-08-19 08:40' },
];
