import { useState } from 'react';
import { goH5ExamResult, toH5ExamRankHash, toH5ExamResultHash, toH5ExamTakingHash } from '../../../../app/navigation';
import { H5ActivityShell } from '../../activities/h5/H5ActivityShell';
import { RetakeExamDialog } from '../components/RetakeExamDialog';
import { getClientExamRecordBoard } from '../model/clientExamResult';
import { formatCEndDateTime } from '../../formatDateTime';

function RecordsBook() {
  return (
    <div className="c-h5-exam-result-art" aria-hidden="true">
      <span className="c-h5-exam-result-pedestal" />
      <svg className="c-h5-exam-result-book" viewBox="0 0 120 88">
        <ellipse cx="60" cy="78" rx="34" ry="6" fill="#ffb26b" />
        <path d="M18 28c18-10 36-10 42 2 6-12 24-12 42-2v38c-18-8-36-8-42 4-6-12-24-12-42 4V28Z" fill="#ff9a3d" />
        <path d="M60 30c6-12 24-12 42-2v38c-18-8-36-8-42 4V30Z" fill="#ff7a14" />
        <path d="M28 22h18l4 8H32l-4-8Z" fill="#ff4d4f" />
        <text x="34" y="29" fill="#fff" fontSize="8" fontWeight="700">
          课
        </text>
        <path d="M78 18 96 42l4-2-16-26-6 6Z" fill="#ffd56a" />
        <path d="M74 22h8v28h-8z" fill="#f5c24a" />
      </svg>
    </div>
  );
}

export function H5ExamRecords({ id }: { id: number }) {
  const [askRetake, setAskRetake] = useState(false);
  const board = getClientExamRecordBoard(id);

  if (!board) {
    return (
      <H5ActivityShell className="is-exam is-records" title="考试记录" onBack={() => goH5ExamResult(id)}>
        <p className="c-h5-exam-empty">暂无考试记录</p>
      </H5ActivityShell>
    );
  }

  return (
    <H5ActivityShell
      className="is-exam is-records"
      title="考试记录"
      onBack={() => goH5ExamResult(id)}
      footer={
        <div className="c-h5-exam-result-bar">
          <button className="c-h5-exam-start" type="button" onClick={() => setAskRetake(true)}>
            重新考试
          </button>
        </div>
      }
    >
      <div className="c-h5-exam-records">
        <section className="c-h5-exam-records-hero">
          <RecordsBook />
          <p className="c-h5-exam-result-score">
            {board.bestScore}
            <small>分</small>
          </p>
          <a className="c-h5-exam-records-rank" href={toH5ExamRankHash(id)}>
            查看排名 <span aria-hidden="true">&gt;</span>
          </a>
          <p className="c-h5-exam-records-hint">{board.hint}</p>
        </section>
        <h2 className="c-h5-exam-records-label">{board.listHint}</h2>
        {board.records.length === 0 ? (
          <p className="c-h5-exam-empty">暂无考试记录</p>
        ) : (
          <ul className="c-h5-exam-records-list">
            {board.records.map((item) => (
              <li key={item.id}>
                <a href={toH5ExamResultHash(id)}>
                  <span>
                    <strong>{item.title}</strong>
                    <em>{formatCEndDateTime(item.submittedAt)}</em>
                  </span>
                  <b>
                    {item.score}分
                    <i aria-hidden="true">&gt;</i>
                  </b>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
      {askRetake ? (
        <RetakeExamDialog takeHref={toH5ExamTakingHash(id)} onCancel={() => setAskRetake(false)} />
      ) : null}
    </H5ActivityShell>
  );
}
