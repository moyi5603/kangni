import type { CategoryNode } from '../../../shared/category-tree/categoryTree';

export const EXAM_MOCK_VERSION = 2;

export const examPublishStatuses = ['未发布', '已发布'] as const;
export type ExamPublishStatus = (typeof examPublishStatuses)[number];

export const examStatuses = ['未开始', '进行中', '已结束'] as const;
export type ExamStatus = (typeof examStatuses)[number];

export const examDifficulties = ['简单', '中等', '困难'] as const;
export type ExamDifficulty = (typeof examDifficulties)[number];

export const examCertificates = [
  { id: 1, name: '内部培训结业证书' },
  { id: 2, name: '岗位技能认证证书' },
  { id: 3, name: '合规培训证书' },
] as const;

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

/** 多级分类树，结构对齐课程管理左树（可演示虚线缩进与展开） */
export const initialExamCategoryTree: ExamCategoryNode[] = [
  { id: 10, name: '入职测评' },
  {
    id: 20,
    name: '专业技能',
    children: [
      {
        id: 21,
        name: 'Java',
        children: [
          { id: 211, name: '初级' },
          { id: 212, name: '进阶' },
        ],
      },
      {
        id: 22,
        name: 'PHP',
        children: [{ id: 221, name: '入门' }],
      },
    ],
  },
  {
    id: 30,
    name: '合规与安全',
    children: [
      { id: 31, name: '信息安全' },
      { id: 32, name: '合规考试' },
    ],
  },
  { id: 40, name: '专项演练' },
];

export const initialExams: ExamRecord[] = [
  {
    id: 1,
    name: '20260808',
    categoryId: 40,
    startAt: '2026-08-08 00:00:00',
    endAt: '2026-08-31 00:00:00',
    durationMinutes: 100,
    passScore: 60,
    points: 0,
    publishStatus: '已发布',
    examStatus: '进行中',
    creator: '产品管理员',
    createdAt: '2026-08-08 10:00:00',
    updatedAt: '2026-08-08 10:00:00',
  },
  {
    id: 2,
    name: '测试考试',
    categoryId: 32,
    startAt: '2026-07-08 00:00:00',
    endAt: '2026-07-31 00:00:00',
    durationMinutes: 2,
    passScore: 1,
    points: 0,
    publishStatus: '已发布',
    examStatus: '已结束',
    creator: '产品管理员',
    createdAt: '2026-07-08 10:00:00',
    updatedAt: '2026-07-08 10:00:00',
  },
  {
    id: 3,
    name: '入职测评',
    categoryId: 211,
    startAt: '2026-07-01 09:00:00',
    endAt: '2026-12-31 18:00:00',
    durationMinutes: 90,
    passScore: 60,
    points: 10,
    publishStatus: '未发布',
    examStatus: '未开始',
    creator: '产品管理员',
    createdAt: '2026-07-01 09:00:00',
    updatedAt: '2026-07-01 09:00:00',
  },
  {
    id: 4,
    name: '考生请注意，禁止不带手机',
    categoryId: null,
    startAt: '2026-06-01 00:00:00',
    endAt: '2026-06-30 23:59:59',
    durationMinutes: 30,
    passScore: 80,
    points: 5,
    publishStatus: '未发布',
    examStatus: '未开始',
    creator: '产品管理员',
    createdAt: '2026-06-01 10:00:00',
    updatedAt: '2026-06-01 10:00:00',
  },
];
