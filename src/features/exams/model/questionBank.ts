export type QuestionBankScope = 'exam' | 'practice';

export const questionBankMeta: Record<
  QuestionBankScope,
  {
    listPage: string;
    createPage: string;
    editPage: string;
    detailPage: string;
    listTitle: string;
    listSubtitle: string;
    breadcrumbSection: string;
    breadcrumbList: string;
    formSubtitle: string;
    itemName: string;
  }
> = {
  exam: {
    listPage: 'exam-questions',
    createPage: 'question-create',
    editPage: 'question-edit',
    detailPage: 'question-detail',
    listTitle: '试题库',
    listSubtitle: '维护试题分类、题型与难度，支持批量启用、禁用与设置分类。',
    breadcrumbSection: '考试',
    breadcrumbList: '试题库',
    formSubtitle: '配置试题分类、题型、题干、选项与正确答案后保存。',
    itemName: '试题',
  },
  practice: {
    listPage: 'practice-questions',
    createPage: 'practice-question-create',
    editPage: 'practice-question-edit',
    detailPage: 'practice-question-detail',
    listTitle: '习题库',
    listSubtitle: '维护练习习题分类、题型与难度，支持批量启用、禁用与设置分类。',
    breadcrumbSection: '练习',
    breadcrumbList: '习题库',
    formSubtitle: '配置习题分类、题型、题干、选项与正确答案后保存。',
    itemName: '习题',
  },
};
