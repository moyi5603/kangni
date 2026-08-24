import type { CategoryNode } from '../../../shared/category-tree/categoryTree';

export const EXAM_MOCK_VERSION = 6;

export const examPublishStatuses = ['未发布', '已发布'] as const;
export type ExamPublishStatus = (typeof examPublishStatuses)[number];

export const examStatuses = ['未开始', '进行中', '已结束'] as const;
export type ExamStatus = (typeof examStatuses)[number];

export const examDifficulties = ['简单', '中等', '困难'] as const;
export type ExamDifficulty = (typeof examDifficulties)[number];

export type ExamQuestionRule = {
  id: number;
  difficulty: ExamDifficulty;
  questionCount: number;
  scorePerQuestion: number;
};

export type ExamCategoryNode = CategoryNode;

export type ExamRecord = {
  id: number;
  name: string;
  categoryId: number | null;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  passScore: number;
  points: number;
  publishStatus: ExamPublishStatus;
  examStatus: ExamStatus;
  creator: string;
  createdAt: string;
  updatedAt: string;
  certificateId?: number | null;
  paperId?: number | null;
  questionRules?: ExamQuestionRule[];
  totalScore?: number;
  examTimes?: number | null;
  tags?: string;
  audience?: string;
  descriptionHtml?: string;
};

export function calculateExamTotalScore(rules: Pick<ExamQuestionRule, 'questionCount' | 'scorePerQuestion'>[]): number {
  return rules.reduce((total, rule) => total + (rule.questionCount || 0) * (rule.scorePerQuestion || 0), 0);
}

export function canDeleteExam(record: ExamRecord): boolean {
  return record.publishStatus === '未发布';
}

export function listExamsUsingPaper(exams: Pick<ExamRecord, 'paperId'>[], paperId: number) {
  return exams.filter((item) => item.paperId === paperId);
}

/** 三级分类树。H5 默认只露一级胶囊，点开后再下钻二/三级。 */
export const initialExamCategoryTree: ExamCategoryNode[] = [
  {
    id: 10,
    name: '【一级】验收测试考试',
    children: [
      {
        id: 101,
        name: '【二级】验收场景',
        children: [
          { id: 1011, name: '【三级】入门' },
          { id: 1012, name: '【三级】进阶' },
        ],
      },
    ],
  },
  {
    id: 20,
    name: 'java 考试',
    children: [
      {
        id: 21,
        name: '【二级】核心语法',
        children: [
          { id: 211, name: '【三级】初级' },
          { id: 212, name: '【三级】进阶' },
        ],
      },
      {
        id: 22,
        name: '【二级】框架',
        children: [{ id: 221, name: '【三级】Spring' }],
      },
    ],
  },
  {
    id: 30,
    name: '项目管理',
    children: [
      {
        id: 31,
        name: '【二级】认证',
        children: [
          { id: 311, name: '【三级】PMP' },
          { id: 312, name: '【三级】软考' },
        ],
      },
    ],
  },
  {
    id: 40,
    name: 'python 考试',
    children: [
      {
        id: 41,
        name: '【二级】基础',
        children: [{ id: 411, name: '【三级】入门' }],
      },
    ],
  },
];

export const initialExams: ExamRecord[] = [
  {
    id: 1,
    name: '20260808',
    categoryId: 211,
    paperId: 3,
    certificateId: 3,
    startAt: '2026-08-08 00:00:00',
    endAt: '2026-08-31 00:00:00',
    durationMinutes: 100,
    passScore: 60,
    points: 20,
    examTimes: 2,
    publishStatus: '已发布',
    examStatus: '进行中',
    totalScore: 100,
    tags: 'Java,核心语法,月考',
    audience: 'Java 初级开发',
    descriptionHtml: '<p>本场为 Java 核心语法月考，请在规定时间内独立完成，禁止查阅外部资料。</p>',
    creator: '产品管理员',
    createdAt: '2026-08-08 10:00:00',
    updatedAt: '2026-08-08 10:00:00',
  },
  {
    id: 2,
    name: '测试考试',
    categoryId: 411,
    paperId: 3,
    certificateId: null,
    startAt: '2026-07-08 00:00:00',
    endAt: '2026-07-31 00:00:00',
    durationMinutes: 2,
    passScore: 1,
    points: 0,
    examTimes: 1,
    publishStatus: '已发布',
    examStatus: '已结束',
    totalScore: 10,
    tags: '联调,验收',
    audience: '测试与验收人员',
    descriptionHtml: '<p>用于联调验收的短时测试考试，成绩仅作流程验证，不计入正式档案。</p>',
    creator: '产品管理员',
    createdAt: '2026-07-08 10:00:00',
    updatedAt: '2026-07-08 10:00:00',
  },
  {
    id: 3,
    name: '入职测评',
    categoryId: 221,
    paperId: 3,
    certificateId: 1,
    startAt: '2026-07-01 09:00:00',
    endAt: '2026-12-31 18:00:00',
    durationMinutes: 90,
    passScore: 60,
    points: 10,
    examTimes: 1,
    publishStatus: '未发布',
    examStatus: '未开始',
    totalScore: 100,
    tags: '入职,Spring,必修',
    audience: '应届生与社招新人',
    descriptionHtml: '<p>入职测评覆盖框架基础与企业规范，通过后可领取内部认证证书。当前尚未发布。</p>',
    creator: '产品管理员',
    createdAt: '2026-07-01 09:00:00',
    updatedAt: '2026-07-01 09:00:00',
  },
  {
    id: 4,
    name: '考生请注意，禁止不带手机',
    categoryId: 101,
    paperId: 3,
    certificateId: null,
    startAt: '2026-06-01 00:00:00',
    endAt: '2026-06-30 23:59:59',
    durationMinutes: 30,
    passScore: 80,
    points: 5,
    examTimes: 1,
    publishStatus: '未发布',
    examStatus: '未开始',
    totalScore: 80,
    tags: '考场规则,纪律',
    audience: '全体考生',
    descriptionHtml: '<p>开考前请阅读考场纪律。本场要求随身携带手机用于身份核验，未带手机不得入场。</p>',
    creator: '产品管理员',
    createdAt: '2026-06-01 10:00:00',
    updatedAt: '2026-06-01 10:00:00',
  },
  {
    id: 5,
    name: '项目管理考试',
    categoryId: 311,
    paperId: 2,
    certificateId: 2,
    startAt: '2026-08-01 00:00:00',
    endAt: '2026-08-29 23:59:59',
    durationMinutes: 10,
    passScore: 10,
    points: 15,
    examTimes: 2,
    publishStatus: '已发布',
    examStatus: '进行中',
    creator: '产品管理员',
    createdAt: '2026-08-01 10:00:00',
    updatedAt: '2026-08-01 10:00:00',
    totalScore: 18,
    tags: 'PMP,项目管理,认证',
    audience: '项目经理、PMO',
    descriptionHtml: '<p>覆盖范围、进度、风险与协作，关联「Java 初级能力卷」。通过后可获得高级产品能力内部认证。</p>',
  },
  {
    id: 6,
    name: '项目管理认证',
    categoryId: 312,
    paperId: 3,
    certificateId: 2,
    startAt: '2026-08-01 00:00:00',
    endAt: '2026-09-30 23:59:59',
    durationMinutes: 10,
    passScore: 60,
    points: 30,
    examTimes: 1,
    publishStatus: '已发布',
    examStatus: '进行中',
    creator: '产品管理员',
    createdAt: '2026-08-01 10:00:00',
    updatedAt: '2026-08-01 10:00:00',
    totalScore: 100,
    tags: '软考,认证,项目管理',
    audience: '准备软考的项目管理人员',
    descriptionHtml: '<p>软考方向认证考试。成绩达到及格分即视为通过，可用于内部职级评审参考。</p>',
  },
  {
    id: 7,
    name: '需求分析与PRD撰写能力考核',
    categoryId: 1011,
    paperId: 3,
    certificateId: 2,
    startAt: '2026-07-11 00:00:00',
    endAt: '2026-08-27 23:59:59',
    durationMinutes: 100,
    passScore: 6,
    points: 10,
    examTimes: 5,
    publishStatus: '已发布',
    examStatus: '进行中',
    creator: '产品管理员',
    createdAt: '2026-07-11 10:00:00',
    updatedAt: '2026-07-11 10:00:00',
    totalScore: 10,
    tags: '产品,PRD,需求分析',
    audience: '产品经理、需求分析师',
    descriptionHtml:
      '<p>考核需求拆解与 PRD 结构。本次考试开启防切屏，切屏超过 3 次将自动交卷（中途接打电话也属于切屏）。</p>',
  },
  {
    id: 8,
    name: '绩效薪酬体系设计考核',
    categoryId: 1012,
    paperId: 3,
    certificateId: 1,
    startAt: '2026-07-01 00:00:00',
    endAt: '2026-08-31 23:59:59',
    durationMinutes: 90,
    passScore: 60,
    points: 12,
    examTimes: 2,
    publishStatus: '已发布',
    examStatus: '进行中',
    creator: '产品管理员',
    createdAt: '2026-07-01 10:00:00',
    updatedAt: '2026-07-01 10:00:00',
    totalScore: 80,
    tags: '绩效,薪酬,HR',
    audience: '人力资源、组织发展',
    descriptionHtml: '<p>围绕绩效指标、薪酬带宽与落地沟通进行考核，请结合业务场景作答。</p>',
  },
];
