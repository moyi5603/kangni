import { getExam } from '../../../exams/model/examStore';
import type { QuestionType } from '../../../exams/model/question';

export type ClientExamQuestion = {
  id: number;
  index: number;
  displayNo: number;
  stem: string;
  type: QuestionType;
  typeLabel: string;
  score: number;
  options: string[];
  answer?: string;
};

export type ClientExamPaper = {
  examId: number;
  total: number;
  remainingSeconds: number;
  startIndex: number;
  questions: ClientExamQuestion[];
};

const TYPE_LABEL: Record<QuestionType, string> = {
  单选: '单选题',
  多选: '多选题',
  判断: '判断题',
  填空: '填空题',
  问答题: '问答题',
};

type StemSeed = { type: QuestionType; stem: string; score: number; options: string[]; answer?: string };

const STEMS: StemSeed[] = [
  { type: '单选', stem: '下列哪项属于项目管理的核心约束？', score: 2, options: ['范围', '天气', '工位', '工装'] },
  { type: '多选', stem: '敏捷开发常见的会议包括哪些？', score: 2, options: ['站会', '评审', '年会', '回顾'] },
  {
    type: '判断',
    stem: 'Nginx可以作为反向代理服务器和负载均衡器。',
    score: 1,
    options: ['正确', '错误'],
  },
  { type: '判断', stem: 'HTTP 是无状态协议。', score: 1, options: ['正确', '错误'] },
  { type: '单选', stem: 'REST 接口通常使用哪种数据格式？', score: 1, options: ['JSON', 'BMP', 'WAV', 'ISO'] },
  { type: '填空', stem: 'TCP 三次握手的第二步是___。', score: 2, options: [], answer: 'SYN+ACK' },
  { type: '判断', stem: '单元测试应当尽量避免依赖真实外部服务。', score: 1, options: ['正确', '错误'] },
  { type: '多选', stem: '以下哪些属于前端性能优化手段？', score: 2, options: ['懒加载', '压缩资源', '无限递归', '缓存'] },
  { type: '单选', stem: 'Git 中用于创建分支的命令是？', score: 1, options: ['git branch', 'git push --force', 'git stash', 'git blame'] },
  {
    type: '问答题',
    stem: '简述一次完整的需求评审需要覆盖哪些要点。',
    score: 3,
    options: [],
    answer: '覆盖需求背景与目标、范围边界、验收标准、依赖与风险、排期资源和待决问题。',
  },
];

const ESSAY_STEMS: StemSeed[] = [
  {
    type: '问答题',
    stem: '请简述你在项目中遇到的最大挑战及解决思路。',
    score: 5,
    options: [],
    answer: '最大挑战通常是范围蔓延与资源冲突。先把问题写成可验证事实，再拉干系人做变更评审，用优先级砍掉低价值需求，并同步 comms 与里程碑。',
  },
  {
    type: '问答题',
    stem: '如何制定一份可执行的项目计划？请写出关键步骤。',
    score: 5,
    options: [],
    answer: '明确目标与验收标准，拆WBS，估算工期与依赖，排资源与关键路径，设里程碑与风险预案，再按周滚动更新进度。',
  },
  {
    type: '问答题',
    stem: '项目范围蔓延时，项目经理应如何识别并控制？',
    score: 4,
    options: [],
    answer: '对照基线识别未批准变更，走变更控制：评估影响、记录决策、更新范围/进度/成本基线，并告知干系人。拒绝口头加需求。',
  },
];

function toQuestions(examId: number, stems: StemSeed[], startIndex: number): ClientExamPaper['questions'] {
  return stems.map((item, index) => ({
    id: examId * 100 + index + 1,
    index: index + 1,
    displayNo: startIndex === 2 && index === 2 ? 25 : index + 1,
    stem: item.stem,
    type: item.type,
    typeLabel: TYPE_LABEL[item.type],
    score: item.score,
    options: item.options,
    answer: item.answer,
  }));
}

export function formatExamTimer(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function getClientExamPaper(examId: number): ClientExamPaper | undefined {
  const exam = getExam(examId);
  if (!exam || exam.publishStatus !== '已发布') return undefined;
  const remainingSeconds = Math.max(0, exam.durationMinutes * 60 - 15);
  const essayPaper = exam.name === '项目管理考试';
  const stems = essayPaper ? ESSAY_STEMS : STEMS;
  const startIndex = essayPaper ? 0 : 2;
  return {
    examId,
    total: stems.length,
    remainingSeconds,
    startIndex,
    questions: toQuestions(examId, stems, startIndex),
  };
}
