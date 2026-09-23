import { H5ActivityShell } from '../../activities/h5/H5ActivityShell';
import { formatExamDuration } from '../../exams/model/clientExamResult';

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

export function ContestGateResult({
  gateIndex,
  passed,
  durationSeconds,
  correctCount,
  accuracy,
  userId,
  onBack,
}: {
  gateIndex: number;
  passed: boolean;
  durationSeconds: number;
  correctCount: number;
  accuracy: number;
  userId: string;
  onBack: () => void;
}) {
  const rows = [
    { label: '正确率', value: `${accuracy}%` },
    { label: '答题时长', value: formatExamDuration(durationSeconds) },
    { label: '当前关卡', value: `第${gateIndex + 1}关` },
  ];

  return (
    <H5ActivityShell
      className="is-exam is-result"
      title="闯关结果"
      onBack={onBack}
      footer={
        <div className="c-h5-exam-result-bar">
          <button className="c-h5-exam-start" type="button" onClick={onBack}>
            返回地图
          </button>
        </div>
      }
    >
      <div className="c-h5-exam-result">
        <section className="c-h5-exam-result-hero">
          <ResultBook />
          <p className="c-h5-exam-result-score c-gate-result-hits">
            <em>答对</em>
            {correctCount}
            <small>题过关</small>
          </p>
          <p className={`c-h5-exam-result-status${passed ? '' : ' is-fail'}`}>
            <span>{passed ? '已通过' : '未通过'}</span>
          </p>
          <p className="c-h5-exam-result-uid">{userId}</p>
        </section>
        <section className="c-h5-exam-result-sheet">
          <ul>
            {rows.map((row) => (
              <li key={row.label}>
                <span>{row.label}</span>
                <i />
                <em>{row.value}</em>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </H5ActivityShell>
  );
}
