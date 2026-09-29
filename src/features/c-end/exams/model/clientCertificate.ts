import { getCertificate } from '../../../exams/model/certificateStore';
import { getExams } from '../../../exams/model/examStore';
import { getClientExamRecordBoard, getClientExamResult } from './clientExamResult';
import { parseExamDateTime } from './clientExam';

export type ClientCertificateCard = {
  examId: number;
  title: string;
  issuedOn: string;
  validity: string;
  score: number;
};

export type MyCertificateBoard = {
  earned: ClientCertificateCard[];
  pendingCount: number;
};

function examStillOpen(endAt: string, now: number) {
  const end = parseExamDateTime(endAt);
  return !Number.isFinite(end) || now <= end;
}

function certificateTitle(name: string) {
  return name.endsWith('证书') ? name : `${name}证书`;
}

export function listMyCertificates(now = Date.now()): MyCertificateBoard {
  const earned: ClientCertificateCard[] = [];
  let pendingCount = 0;

  for (const exam of getExams()) {
    if (exam.publishStatus !== '已发布' || exam.certificateId == null) continue;
    const result = getClientExamResult(exam.id);
    if (result?.passed) {
      const records = getClientExamRecordBoard(exam.id)?.records ?? [];
      const best = records.reduce<(typeof records)[number] | undefined>(
        (top, item) => (!top || item.score > top.score ? item : top),
        undefined,
      );
      earned.push({
        examId: exam.id,
        title: certificateTitle(exam.name),
        issuedOn: (best?.submittedAt ?? '').slice(0, 10),
        validity: getCertificate(exam.certificateId)?.validityType ?? '长期有效',
        score: best?.score ?? result.score,
      });
      continue;
    }
    if (examStillOpen(exam.endAt, now)) pendingCount += 1;
  }

  earned.sort((left, right) => right.issuedOn.localeCompare(left.issuedOn));
  return { earned, pendingCount };
}
