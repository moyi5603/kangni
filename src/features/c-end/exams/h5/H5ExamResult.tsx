import { goH5ExamPrep, toH5ExamRecordsHash, toH5ExamReviewHash } from '../../../../app/navigation';
import { H5ActivityShell } from '../../activities/h5/H5ActivityShell';
import { formatExamDuration, getClientExamResult } from '../model/clientExamResult';

function ResultBook() {
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

export function H5ExamResult({ id }: { id: number }) {
  const result = getClientExamResult(id);

  if (!result) {
    return (
      <H5ActivityShell className="is-exam is-result" title="考试结果" onBack={() => goH5ExamPrep(id)}>
        <p className="c-h5-exam-empty">暂无考试结果</p>
      </H5ActivityShell>
    );
  }

  const rows = [
    { label: '得分', value: `${result.score}分`, tone: 'is-score' },
    { label: '总分', value: `${result.totalScore}分` },
    { label: '及格分', value: `${result.passScore}分` },
    { label: '答题时长', value: formatExamDuration(result.durationSeconds) },
    { label: '正确率', value: `${result.accuracy}%` },
    { label: '答对题数', value: `${result.correctCount}道` },
    { label: '当前排名', value: `${result.rank}名` },
  ];

  return (
    <H5ActivityShell
      className="is-exam is-result"
      title="考试结果"
      onBack={() => goH5ExamPrep(id)}
      footer={
        <div className="c-h5-exam-result-bar">
          <a className="c-h5-exam-start" href={toH5ExamRecordsHash(id)}>
            考试记录
          </a>
        </div>
      }
    >
      <div className="c-h5-exam-result">
        <section className="c-h5-exam-result-hero">
          <ResultBook />
          <p className="c-h5-exam-result-score">
            {result.score}
            <small>分</small>
          </p>
          <p className={`c-h5-exam-result-status${result.passed ? '' : ' is-fail'}`}>
            <span>{result.passed ? '已通过' : '未通过'}</span>
          </p>
          <p className="c-h5-exam-result-uid">{result.userId}</p>
        </section>
        <section className="c-h5-exam-result-sheet">
          <ul>
            {rows.map((row) => (
              <li key={row.label} className={row.tone}>
                <span>{row.label}</span>
                <i />
                <em>{row.value}</em>
              </li>
            ))}
          </ul>
          <a className="c-h5-exam-result-review" href={toH5ExamReviewHash(id)}>
            回顾答题
          </a>
        </section>
      </div>
    </H5ActivityShell>
  );
}
