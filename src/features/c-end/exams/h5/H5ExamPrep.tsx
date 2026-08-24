import { goH5ExamList, toH5ExamTakingHash } from '../../../../app/navigation';
import { H5ActivityShell } from '../../activities/h5/H5ActivityShell';
import { getClientExamPrep, getExamStartCta, hasExamDescriptionHtml } from '../model/clientExam';
import { getClientExamResult } from '../model/clientExamResult';
import { H5ExamResult } from './H5ExamResult';

function IconScore() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 4.5h8.2L19 8.2V19a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 19V6a1.5 1.5 0 0 1 1-1.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M15 4.7V8h3.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <text x="12" y="16.2" textAnchor="middle" fill="currentColor" fontSize="6.2" fontWeight="700">
        100
      </text>
    </svg>
  );
}

function IconPass() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="4.5" width="12" height="15" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 8.2h7M8.5 11.4h7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 16.2 10.7 17.7 14.6 14.2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCount() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="4.5" width="12" height="15" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 9h6M9 12.4h6M9 15.8h3.6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15.6 16.6 17.8 14.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconTimer() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="13" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10 4.6h4M12 4.6v2.1M12 13v-2.6M12 13l2.3 1.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const STATS = [
  { key: 'score', label: '总分', tone: 'is-score', icon: <IconScore />, value: (prep: { totalScore: number }) => `${prep.totalScore}分` },
  { key: 'pass', label: '及格分', tone: 'is-pass', icon: <IconPass />, value: (prep: { passScore: number }) => `${prep.passScore}分` },
  { key: 'count', label: '总题数', tone: 'is-count', icon: <IconCount />, value: (prep: { questionCount: number }) => `${prep.questionCount}题` },
  { key: 'time', label: '考试时长', tone: 'is-time', icon: <IconTimer />, value: (prep: { durationMinutes: number }) => `${prep.durationMinutes}分钟` },
] as const;

export function H5ExamPrep({ id }: { id: number }) {
  if (getClientExamResult(id)) {
    return <H5ExamResult id={id} />;
  }

  const prep = getClientExamPrep(id);
  const startCta = prep ? getExamStartCta(prep) : null;

  if (!prep) {
    return (
      <H5ActivityShell className="is-exam is-prep" title="考试准备" onBack={goH5ExamList}>
        <p className="c-h5-exam-empty">考试不存在或未发布</p>
      </H5ActivityShell>
    );
  }

  return (
    <H5ActivityShell
      className="is-exam is-prep"
      title="考试准备"
      onBack={goH5ExamList}
      footer={
        <div className="c-h5-exam-prep-bar">
          {startCta?.enabled ? (
            <a className="c-h5-exam-start" href={toH5ExamTakingHash(prep.id)}>
              {startCta.label}
            </a>
          ) : (
            <button className="c-h5-exam-start" type="button" disabled>
              {startCta?.label}
            </button>
          )}
        </div>
      }
    >
      <div className="c-h5-exam-prep">
        <h2 className="c-h5-exam-prep-name">{prep.title}</h2>
        <ul className="c-h5-exam-prep-grid">
          {STATS.map((item) => (
            <li key={item.key} className="c-h5-exam-prep-stat">
              <span className={`c-h5-exam-prep-ico ${item.tone}`}>{item.icon}</span>
              <span className="c-h5-exam-prep-meta">
                <small>{item.label}</small>
                <strong>{item.value(prep)}</strong>
              </span>
            </li>
          ))}
        </ul>
        <h3 className="c-h5-exam-prep-label">考试次数</h3>
        <div className="c-h5-exam-prep-card">
          <p className="c-h5-exam-prep-times">
            总考试次数 <em>{prep.examTimes}次</em>，当前剩余 <em>{prep.remainingTimes}次</em>
          </p>
        </div>
        {hasExamDescriptionHtml(prep.descriptionHtml) ? (
          <>
            <h3 className="c-h5-exam-prep-label">考试说明</h3>
            <div className="c-h5-exam-prep-card">
              <div className="c-html c-h5-exam-prep-rule" dangerouslySetInnerHTML={{ __html: prep.descriptionHtml ?? '' }} />
            </div>
          </>
        ) : null}
        <h3 className="c-h5-exam-prep-label">考试规则</h3>
        <div className="c-h5-exam-prep-card">
          <p className="c-h5-exam-prep-rule">{prep.ruleText}</p>
        </div>
      </div>
    </H5ActivityShell>
  );
}
