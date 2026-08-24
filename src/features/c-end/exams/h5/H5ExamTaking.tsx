import { useMemo, useRef, useState } from 'react';
import { goH5ExamPrep, goH5ExamResult } from '../../../../app/navigation';
import { useCEndToast } from '../../activities/components/CEndToast';
import { H5ActivityShell } from '../../activities/h5/H5ActivityShell';
import { submitClientExam } from '../model/clientExamResult';
import { formatExamTimer, getClientExamPaper } from '../model/clientExamSession';

function IconClock() {
  return (
    <svg className="c-h5-exam-ico" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 8v4.4l2.6 1.6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function IconFlag() {
  return (
    <svg className="c-h5-exam-ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 4v16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M6 5h10l-2.2 3.6L16 12.2H6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function IconNote() {
  return (
    <svg className="c-h5-exam-ico is-note" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="4" width="12" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 8h6M8 11.5h6M8 15h4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function H5ExamTaking({ id, initialIndex }: { id: number; initialIndex?: number }) {
  const toast = useCEndToast();
  const paper = useMemo(() => getClientExamPaper(id), [id]);
  const [current, setCurrent] = useState(initialIndex ?? paper?.startIndex ?? 0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const startedAt = useRef(Date.now());
  const question = paper?.questions[current];

  if (!paper || !question) {
    return (
      <H5ActivityShell className="is-exam is-taking" title="考试过程" onBack={() => goH5ExamPrep(id)}>
        <p className="c-h5-exam-empty">考试不存在或未发布</p>
      </H5ActivityShell>
    );
  }

  const selected = answers[question.id];
  const progress = ((current + 1) / paper.total) * 100;
  const last = current >= paper.total - 1;

  const submitPaper = () => {
    const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
    const submitted = submitClientExam({ examId: id, answers, durationSeconds });
    if (!submitted.ok) {
      toast.show(submitted.message);
      return;
    }
    goH5ExamResult(id);
  };

  return (
    <H5ActivityShell
      className="is-exam is-taking"
      title="考试过程"
      onBack={() => goH5ExamPrep(id)}
      footer={
        <div className="c-h5-exam-taking-bar">
          <button
            className="c-h5-exam-nav is-ghost"
            type="button"
            disabled={current === 0}
            onClick={() => setCurrent((value) => Math.max(0, value - 1))}
          >
            上一题
          </button>
          <button
            className="c-h5-exam-nav is-solid"
            type="button"
            onClick={() => {
              if (last) {
                submitPaper();
                return;
              }
              setCurrent((value) => Math.min(paper.total - 1, value + 1));
            }}
          >
            {last ? '立即交卷' : '下一题'}
          </button>
        </div>
      }
    >
      <div className="c-h5-exam-taking">
        <section className="c-h5-exam-paper">
          <div className="c-h5-exam-paper-head">
            <p className="c-h5-exam-progress-label">
              出题<strong>{question.index}</strong>
              <span>/{paper.total}</span>
            </p>
            <p className="c-h5-exam-timer">
              <IconClock />
              <time>{formatExamTimer(paper.remainingSeconds)}</time>
            </p>
            <div className="c-h5-exam-tools">
              <button className="c-h5-exam-tool" type="button" aria-label="标记题目">
                <IconFlag />
              </button>
              <button className="c-h5-exam-tool is-note" type="button" aria-label="答题卡">
                <IconNote />
              </button>
            </div>
          </div>
          <div className="c-h5-exam-track" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>
          <p className="c-h5-exam-stem">
            {question.typeLabel}
            {question.displayNo}: {question.stem}
            <b>({question.typeLabel})</b>
            <i>({question.score}分)</i>
          </p>
          {question.options.length > 0 ? (
            <div className="c-h5-exam-options" role="group" aria-label="选项">
              {question.options.map((option) => (
                <button
                  key={option}
                  className={`c-h5-exam-option${selected === option ? ' is-on' : ''}`}
                  type="button"
                  aria-pressed={selected === option}
                  onClick={() => setAnswers((currentAnswers) => ({ ...currentAnswers, [question.id]: option }))}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <textarea
              className="c-h5-exam-blank"
              rows={4}
              placeholder="请输入答案"
              value={selected ?? ''}
              onChange={(event) =>
                setAnswers((currentAnswers) => ({ ...currentAnswers, [question.id]: event.target.value }))
              }
            />
          )}
        </section>
      </div>
    </H5ActivityShell>
  );
}
