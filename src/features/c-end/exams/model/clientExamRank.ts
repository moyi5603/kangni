import { getExam } from '../../../exams/model/examStore';
import { EXAM_RESULT_USER_ID } from './clientExamResult';

export type ExamRankAvatar = 'me' | 'suit' | 'cat' | 'user';

export type ClientExamRankRow = {
  rank: number;
  userId: string;
  name: string;
  durationSeconds: number;
  score: number;
  isMe: boolean;
  avatar: ExamRankAvatar;
};

export type ClientExamRankBoard = {
  examId: number;
  rows: ClientExamRankRow[];
};

const MOCK_RANKS: Array<Omit<ClientExamRankRow, 'isMe'>> = [
  { rank: 1, userId: '18611927175', name: '李明', durationSeconds: 4, score: 100, avatar: 'suit' },
  { rank: 2, userId: EXAM_RESULT_USER_ID, name: '张悦', durationSeconds: 5, score: 100, avatar: 'me' },
  { rank: 3, userId: '17710203698', name: '王芳', durationSeconds: 8, score: 100, avatar: 'cat' },
  { rank: 4, userId: '18518218905', name: '陈伟', durationSeconds: 8, score: 100, avatar: 'user' },
];

export function formatExamRankClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function getClientExamRankBoard(examId: number): ClientExamRankBoard | undefined {
  if (!getExam(examId)) return undefined;
  const ranked = MOCK_RANKS.map((item) => ({ ...item, isMe: item.userId === EXAM_RESULT_USER_ID }));
  const self = ranked.find((item) => item.isMe);
  const others = ranked.filter((item) => !item.isMe).sort((left, right) => left.rank - right.rank);
  return { examId, rows: self ? [self, ...others] : others };
}
