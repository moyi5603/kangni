export const examAttemptResults = ['及格', '不及格'] as const;
export type ExamAttemptResult = (typeof examAttemptResults)[number];

export type ExamAttemptRecord = {
  id: number;
  examId: number;
  name: string;
  mobile: string;
  department: string;
  result: ExamAttemptResult;
  score: number;
  correctCount: number;
  wrongCount: number;
  points: number;
  startedAt: string;
  endedAt: string;
};

export type ExamAttemptQuery = {
  examId?: number;
  name?: string;
  mobile?: string;
  department?: string;
  startedFrom?: string;
  startedTo?: string;
};

export type ExamRankingQuery = {
  name?: string;
  mobile?: string;
  department?: string;
};

export type ExamRankingRow = {
  key: string;
  rank: number;
  name: string;
  mobile: string;
  department: string;
  score: number;
  attemptCount: number;
  durationSeconds: number;
  durationText: string;
};

function includesText(value: string, keyword?: string) {
  const token = keyword?.trim();
  if (!token) return true;
  return value.includes(token);
}

export function durationSecondsOf(startedAt: string, endedAt: string): number {
  const start = new Date(startedAt.replace(/-/g, '/')).getTime();
  const end = new Date(endedAt.replace(/-/g, '/')).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0;
  return Math.round((end - start) / 1000);
}

export function formatExamDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${hours}时${String(minutes).padStart(2, '0')}分${String(seconds).padStart(2, '0')}秒`;
}

export function computeExamDetailStats(records: ExamAttemptRecord[]) {
  if (!records.length) {
    return {
      examineeCount: 0,
      attemptCount: 0,
      passedExamineeCount: 0,
      passRate: null as number | null,
      averageScore: null as number | null,
      highestScore: null as number | null,
    };
  }

  const byMobile = new Map<string, ExamAttemptRecord[]>();
  for (const item of records) {
    const current = byMobile.get(item.mobile) ?? [];
    current.push(item);
    byMobile.set(item.mobile, current);
  }

  const examineeCount = byMobile.size;
  const passedExamineeCount = [...byMobile.values()].filter((attempts) =>
    attempts.some((item) => item.result === '及格'),
  ).length;
  const totalScore = records.reduce((sum, item) => sum + item.score, 0);

  return {
    examineeCount,
    attemptCount: records.length,
    passedExamineeCount,
    passRate: Math.round((passedExamineeCount / examineeCount) * 100),
    averageScore: Math.round((totalScore / records.length) * 10) / 10,
    highestScore: Math.max(...records.map((item) => item.score)),
  };
}

export function filterExamAttempts(records: ExamAttemptRecord[], query: ExamAttemptQuery): ExamAttemptRecord[] {
  return records.filter((item) => {
    if (query.examId != null && item.examId !== query.examId) return false;
    if (!includesText(item.name, query.name)) return false;
    if (!includesText(item.mobile, query.mobile)) return false;
    if (!includesText(item.department, query.department)) return false;
    if (query.startedFrom && item.startedAt < query.startedFrom) return false;
    if (query.startedTo && item.startedAt > query.startedTo) return false;
    return true;
  });
}

export function buildExamRanking(records: ExamAttemptRecord[]): ExamRankingRow[] {
  const groups = new Map<string, ExamAttemptRecord[]>();
  for (const item of records) {
    const current = groups.get(item.mobile) ?? [];
    current.push(item);
    groups.set(item.mobile, current);
  }

  const rows = [...groups.values()].map((attempts) => {
    const latest = attempts[attempts.length - 1];
    const durationSeconds = attempts.reduce((sum, item) => sum + durationSecondsOf(item.startedAt, item.endedAt), 0);
    return {
      key: latest.mobile,
      rank: 0,
      name: latest.name,
      mobile: latest.mobile,
      department: latest.department,
      score: Math.max(...attempts.map((item) => item.score)),
      attemptCount: attempts.length,
      durationSeconds,
      durationText: formatExamDuration(durationSeconds),
    };
  });

  rows.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    if (left.durationSeconds !== right.durationSeconds) return left.durationSeconds - right.durationSeconds;
    return left.name.localeCompare(right.name, 'zh-CN');
  });

  return rows.map((item, index) => ({ ...item, rank: index + 1 }));
}

export function filterExamRankings(rows: ExamRankingRow[], query: ExamRankingQuery): ExamRankingRow[] {
  return rows.filter((item) => {
    if (!includesText(item.name, query.name)) return false;
    if (!includesText(item.mobile, query.mobile)) return false;
    if (!includesText(item.department, query.department)) return false;
    return true;
  });
}

function csvCell(value: string | number): string {
  const cell = String(value).replace(/\r?\n/g, ' ');
  if (/[",]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`;
  return cell;
}

export function buildExamAttemptExportCsv(records: ExamAttemptRecord[]): string {
  const header = [
    '序号',
    '姓名',
    '手机号',
    '部门',
    '考试结果',
    '获得分数',
    '答对题数',
    '答错题数',
    '获得积分',
    '答题开始时间',
    '答题结束时间',
  ];
  const lines = records.map((item, index) =>
    [
      index + 1,
      item.name,
      item.mobile,
      item.department,
      item.result,
      item.score,
      item.correctCount,
      item.wrongCount,
      item.points,
      item.startedAt,
      item.endedAt,
    ].map(csvCell).join(','),
  );
  return [header.join(','), ...lines].join('\n');
}

export function buildExamRankingExportCsv(rows: ExamRankingRow[]): string {
  const header = ['排名', '姓名', '手机号', '部门', '考试成绩', '考试次数', '累计考试用时'];
  const lines = rows.map((item) =>
    [item.rank, item.name, item.mobile, item.department, item.score, item.attemptCount, item.durationText]
      .map(csvCell)
      .join(','),
  );
  return [header.join(','), ...lines].join('\n');
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([`\uFEFF${csv}\n`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadExamAttemptExport(examName: string, records: ExamAttemptRecord[]) {
  const safeTitle = examName.replace(/[\\/:*?"<>|]/g, '_').slice(0, 40);
  downloadCsv(`${safeTitle}-考试记录.csv`, buildExamAttemptExportCsv(records));
}

export function downloadExamRankingExport(examName: string, rows: ExamRankingRow[]) {
  const safeTitle = examName.replace(/[\\/:*?"<>|]/g, '_').slice(0, 40);
  downloadCsv(`${safeTitle}-考试排行.csv`, buildExamRankingExportCsv(rows));
}

function attempt(
  id: number,
  examId: number,
  name: string,
  mobile: string,
  department: string,
  result: ExamAttemptResult,
  score: number,
  correctCount: number,
  wrongCount: number,
  points: number,
  startedAt: string,
  endedAt: string,
): ExamAttemptRecord {
  return { id, examId, name, mobile, department, result, score, correctCount, wrongCount, points, startedAt, endedAt };
}

export const initialExamAttempts: ExamAttemptRecord[] = [
  attempt(1, 5, '张伟', '13800001111', '产品部', '不及格', 8, 4, 6, 0, '2026-08-10 09:00:00', '2026-08-10 09:08:00'),
  attempt(2, 5, '张伟', '13800001111', '产品部', '及格', 16, 8, 2, 15, '2026-08-12 14:00:00', '2026-08-12 14:09:30'),
  attempt(3, 5, '李娜', '13900002222', '研发部', '及格', 15, 7, 3, 15, '2026-08-11 10:00:00', '2026-08-11 10:06:00'),
  attempt(4, 5, '王强', '13700003333', '研发部', '不及格', 6, 3, 7, 0, '2026-08-13 09:30:00', '2026-08-13 09:39:00'),
  attempt(5, 5, '赵敏', '13600004444', '人力资源部', '及格', 14, 7, 3, 15, '2026-08-10 15:00:00', '2026-08-10 15:08:20'),
  attempt(6, 5, '赵敏', '13600004444', '人力资源部', '及格', 18, 9, 1, 15, '2026-08-14 16:00:00', '2026-08-14 16:07:10'),
  attempt(7, 1, '陈晨', '13500005555', '研发部', '及格', 82, 16, 4, 20, '2026-08-09 09:00:00', '2026-08-09 10:20:00'),
  attempt(8, 1, '周洋', '13400006666', '产品部', '不及格', 48, 9, 11, 0, '2026-08-09 13:00:00', '2026-08-09 14:15:00'),
  attempt(9, 6, '吴芳', '13300007777', 'PMO', '及格', 88, 18, 2, 30, '2026-08-05 09:00:00', '2026-08-05 09:09:00'),
  attempt(10, 7, '孙悦', '13200008888', '产品部', '及格', 8, 8, 2, 10, '2026-08-15 09:00:00', '2026-08-15 10:20:00'),
  attempt(11, 7, '孙悦', '13200008888', '产品部', '不及格', 4, 4, 6, 0, '2026-08-12 09:00:00', '2026-08-12 10:30:00'),
  attempt(12, 8, '郑浩', '13100009999', '人力资源部', '及格', 72, 14, 6, 12, '2026-07-20 09:00:00', '2026-07-20 10:10:00'),
];
