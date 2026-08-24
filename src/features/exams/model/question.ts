import type { CategoryNode } from '../../../shared/category-tree/categoryTree';

export const QUESTION_MOCK_VERSION = 5;

export const questionTypes = ['单选', '多选', '判断', '填空', '问答题'] as const;
export type QuestionType = (typeof questionTypes)[number];

export const questionDifficulties = ['初级', '中级', '高级', '资深'] as const;
export type QuestionDifficulty = (typeof questionDifficulties)[number];

export const questionStatuses = ['启用', '禁用'] as const;
export type QuestionStatus = (typeof questionStatuses)[number];

export type QuestionCategoryNode = CategoryNode;

export type QuestionRecord = {
  id: number;
  categoryId: number | null;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  stem: string;
  status: QuestionStatus;
  creator: string;
  createdAt: string;
  updatedAt: string;
  options?: string[];
  answer?: string;
  blankAnswers?: string[];
  blankAnswerOrderSensitive?: boolean;
  keywords?: string[];
  keywordMinHits?: number;
  analysis?: string;
};

export function optionLabel(index: number): string {
  return String.fromCharCode(65 + index);
}

export function stripRichText(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
}

export function isRichTextEmpty(html: string | undefined): boolean {
  return !stripRichText(html ?? '');
}

export function defaultQuestionOptions(count = 4): string[] {
  return Array.from({ length: count }, () => '');
}

export function parseBatchAnswers(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatBlankAnswers(answers: string[] | undefined): string {
  return (answers ?? []).filter(Boolean).join('、');
}

function normalizeMatchText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function countKeywordHits(answer: string, keywords: string[]): number {
  const text = normalizeMatchText(answer);
  return keywords.filter((keyword) => {
    const token = normalizeMatchText(keyword);
    return token.length > 0 && text.includes(token);
  }).length;
}

export function scoreEssayByKeywords(
  answer: string,
  keywords: string[],
  minHits: number,
  totalScore: number,
): number {
  const required = Math.max(1, minHits);
  const hits = countKeywordHits(answer, keywords);
  return hits >= required ? totalScore : 0;
}

export const initialQuestionCategoryTree: QuestionCategoryNode[] = [
  { id: 1, name: '企业价值观' },
  { id: 2, name: '地理常识' },
  { id: 3, name: 'AI应用' },
  { id: 4, name: '项目管理' },
];

const seed = (
  id: number,
  categoryId: number,
  type: QuestionType,
  difficulty: QuestionDifficulty,
  stem: string,
  creator: string,
  extra: Partial<
    Pick<
      QuestionRecord,
      | 'status'
      | 'options'
      | 'answer'
      | 'blankAnswers'
      | 'blankAnswerOrderSensitive'
      | 'keywords'
      | 'keywordMinHits'
      | 'analysis'
    >
  > = {},
): QuestionRecord => ({
  id,
  categoryId,
  type,
  difficulty,
  stem,
  status: extra.status ?? '启用',
  creator,
  createdAt: '2026-08-01 10:00:00',
  updatedAt: '2026-08-01 10:00:00',
  ...extra,
});

export const initialQuestions: QuestionRecord[] = [
  seed(1, 4, '填空', '中级', '项目经理的主要工作是___', 'bwadmin1', {
    blankAnswers: ['管理项目范围、进度、成本和质量'],
    blankAnswerOrderSensitive: false,
    analysis: '项目经理需要在范围、进度、成本与质量之间做统筹，而不是只盯单一目标。',
  }),
  seed(2, 2, '判断', '初级', '长江是亚洲的第一大河', 'bwadmin1', {
    answer: '正确',
    analysis: '按长度与流量，长江是亚洲第一大河，也是世界最长河流之一。',
  }),
  seed(3, 2, '单选', '初级', '康有为是哪个历史时期著名的维新派人物?', 'bwadmin1', {
    options: ['戊戌变法时期', '辛亥革命时期', '新文化运动时期', '抗日战争时期'],
    answer: 'A',
    analysis: '康有为是戊戌变法的主要倡导者，属于清末维新派。',
  }),
  seed(4, 2, '多选', '初级', '地球自转一周的时间是?', 'ymytest', {
    options: ['约 23 小时 56 分', '一个恒星日', '365 天', '一个月'],
    answer: 'A,B',
    analysis: '地球自转一周对应一个恒星日，时长约 23 小时 56 分；365 天是公转周期。',
  }),
  seed(5, 1, '判断', '初级', '诚信是企业文化建设的核心价值观之一', 'bwadmin1', {
    answer: '正确',
    analysis: '诚信是多数企业价值观的基础要求，直接影响客户信任与内部协作。',
  }),
  seed(6, 1, '单选', '中级', '以下哪项最能体现团队协作精神？', 'bwadmin1', {
    options: ['遇到问题只向上级汇报', '主动分担同事任务并同步进展', '独自加班不沟通', '回避跨部门协作'],
    answer: 'B',
    analysis: '协作强调信息同步与互相补位，而不是单打独斗或只向上传递问题。',
  }),
  seed(7, 3, '填空', '高级', 'Transformer 架构中的自注意力机制用于___序列依赖', 'ymytest', {
    blankAnswers: ['捕捉', '建模'],
    blankAnswerOrderSensitive: false,
    analysis: '自注意力用于捕捉或建模序列中不同位置之间的依赖关系。',
  }),
  seed(8, 3, '多选', '中级', '以下哪些属于大语言模型的典型应用场景？', 'ymytest', {
    options: ['文本生成', '代码辅助', '精确天气预报建模', '知识问答'],
    answer: 'A,B,D',
    analysis: '大语言模型擅长语言生成、代码辅助与问答；数值天气预报通常由专用气象模型完成。',
  }),
  seed(9, 4, '单选', '中级', '敏捷开发中 Sprint 的推荐周期通常是？', 'bwadmin1', {
    options: ['1 至 4 周', '3 个月', '1 天', '半年'],
    answer: 'A',
    analysis: 'Scrum 通常将 Sprint 控制在 1 至 4 周，便于快速检视与调整。',
  }),
  seed(10, 4, '判断', '高级', '关键路径上的任务延误一定会导致项目整体延期', 'bwadmin1', {
    answer: '正确',
    analysis: '关键路径没有浮动时间，其上任务延误会直接拉长项目总工期。',
  }),
  seed(11, 2, '填空', '初级', '中国最长的河流是___', 'ymytest', {
    blankAnswers: ['长江'],
    blankAnswerOrderSensitive: false,
    analysis: '长江是中国最长河流，黄河次之。',
  }),
  seed(12, 3, '判断', '初级', 'Prompt Engineering 是 AI 应用开发的重要技能', 'bwadmin1', {
    answer: '正确',
    analysis: '提示词设计直接影响模型输出质量，是落地大模型应用的基本技能。',
  }),
  seed(13, 1, '多选', '中级', '以下哪些行为符合企业价值观要求？', 'bwadmin1', {
    options: ['如实上报质量问题', '收受合作方礼品', '保护客户信息', '推诿责任'],
    answer: 'A,C',
    analysis: '如实反馈问题与保护客户信息符合诚信与合规要求；收礼和推诿则相反。',
  }),
  seed(14, 4, '多选', '高级', '项目风险管理包括哪些主要环节？', 'ymytest', {
    status: '禁用',
    options: ['风险识别', '风险评估', '风险应对', '忽略低概率风险'],
    answer: 'A,B,C',
    analysis: '风险管理通常覆盖识别、评估与应对；低概率高影响风险仍需纳入管理。',
  }),
  seed(15, 2, '单选', '中级', '赤道穿过的大洲不包括？', 'ymytest', {
    options: ['欧洲', '非洲', '南美洲', '亚洲'],
    answer: 'A',
    analysis: '赤道穿过非洲、亚洲、大洋洲和南美洲等，不穿过欧洲。',
  }),
  seed(16, 4, '问答题', '高级', '请说明项目启动阶段需要明确的关键要素', 'bwadmin1', {
    answer:
      '启动阶段应明确项目目标、范围边界、关键干系人、里程碑与主要资源约束，并就成功标准达成一致，避免后续范围蔓延。',
    keywords: ['目标', '范围', '干系人'],
    keywordMinHits: 2,
    analysis: '启动阶段把目标、范围和干系人对齐，后续计划与执行才有共同基准。',
  }),
];

export const initialPracticeQuestionCategoryTree: QuestionCategoryNode[] = [
  { id: 101, name: '每日一练' },
  { id: 102, name: '专项突破' },
  { id: 103, name: '错题巩固' },
];

export const initialPracticeQuestions: QuestionRecord[] = [
  seed(101, 101, '单选', '初级', '以下哪项属于有效的时间管理方法？', 'trainer1', {
    options: ['番茄工作法', '同时处理全部任务', '不设优先级', '用会议占满日程'],
    answer: 'A',
    analysis: '番茄工作法通过分段专注提升效率；同时处理全部任务通常会降低质量。',
  }),
  seed(102, 101, '判断', '初级', '复盘可以帮助巩固练习效果', 'trainer1', {
    answer: '正确',
    analysis: '复盘把对错原因说清楚，有助于把练习结果沉淀成可复用经验。',
  }),
  seed(103, 102, '多选', '中级', '以下哪些属于有效的沟通技巧？', 'trainer2', {
    options: ['先听后说', '频繁打断对方', '确认理解后再回应', '进行人身评价'],
    answer: 'A,C',
    analysis: '有效沟通先理解再表达，并用确认减少误解；打断和人身评价会破坏对话。',
  }),
  seed(104, 102, '填空', '中级', 'PDCA 循环中的 D 代表___', 'trainer2', {
    blankAnswers: ['Do', '执行'],
    blankAnswerOrderSensitive: false,
    analysis: 'PDCA 中的 D 表示 Do / 执行，即按计划落地行动。',
  }),
  seed(105, 103, '问答题', '高级', '请简述你在项目中遇到的最大挑战及解决思路', 'trainer1', {
    answer: '先说明具体挑战与影响，再交代原因分析、采取的措施以及可验证结果，体现闭环思考。',
    keywords: ['挑战', '原因', '措施'],
    keywordMinHits: 2,
    analysis: '问答题按挑战、原因、措施组织，便于按关键词自动判分。',
  }),
];
