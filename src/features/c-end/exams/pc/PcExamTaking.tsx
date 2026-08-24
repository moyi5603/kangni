import { useMemo, useRef, useState } from 'react';
import { goPcExamPrep, goPcExamResult } from '../../../../app/navigation';
import { useCEndToast } from '../../activities/components/CEndToast';
import { PcActivityShell } from '../../activities/pc/PcActivityShell';
import { submitClientExam } from '../model/clientExamResult';
import { getClientExamPrep } from '../model/clientExam';
import { formatExamTimer, getClientExamPaper } from '../model/clientExamSession';

export function PcExamTaking({
  id,
  initialIndex,
  initialAnswers,
}: {
  id: number;
  initialIndex?: number;
  initialAnswers?: Record<number, string>;
}) {
  const toast = useCEndToast();
  const paper = useMemo(() => getClientExamPaper(id), [id]);
  const prep = useMemo(() => getClientExamPrep(id), [id]);
  const [current, setCurrent] = useState(initialIndex ?? paper?.startIndex ?? 0);
  const [answers, setAnswers] = useState<Record<number, string>>(initialAnswers ?? {});
  const startedAt = useRef(Date.now());
  const question = paper?.questions[current];

  if (!paper || !question) {
    return (
      <PcActivityShell className="is-exam is-taking" title="考试中" onPhone={() => goPcExamPrep(id)}>
        <p className="c-empty">考试不存在或未发布</p>
      </PcActivityShell>
    );
  }

  const selected = answers[question.id];
  const last = current >= paper.total - 1;
  const answeredCount = paper.questions.filter((item) => Boolean(answers[item.id])).length;

  const submitPaper = () => {
    const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
    const submitted = submitClientExam({ examId: id, answers, durationSeconds });
    if (!submitted.ok) {
      toast.show(submitted.message);
      return;
    }
    goPcExamResult(id);
  };

  return (
    <PcActivityShell className="is-exam is-taking" title="考试中" onPhone={() => goPcExamPrep(id)}>
      <div className="c-pc-detail">
        <article>
          <section className="c-detail-info-card c-pc-exam-paper" aria-label="当前题目">
            <header className="c-pc-exam-paper-head">
              <p>
                第 <strong>{question.index}</strong> / {paper.total} 题
              </p>
              <span className="c-pin">{question.typeLabel}</span>
            </header>
            <p className="c-pc-exam-stem">
              {question.displayNo}. {question.stem}
              <span className="c-pc-exam-stem-score">（{question.score}分）</span>
            </p>
            {question.options.length > 0 ? (
              <div className="c-pc-exam-options" role="group" aria-label="选项">
                {question.options.map((option) => (
                  <button
                    key={option}
                    className={`c-pc-exam-option${selected === option ? ' is-on' : ''}`}
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
                className="c-pc-exam-blank"
                rows={8}
                placeholder="请输入答案"
                value={selected ?? ''}
                onChange={(event) =>
                  setAnswers((currentAnswers) => ({ ...currentAnswers, [question.id]: event.target.value }))
                }
              />
            )}
            <footer className="c-pc-exam-taking-bar">
              <button
                className="c-btn c-btn-ghost"
                type="button"
                disabled={current === 0}
                onClick={() => setCurrent((value) => Math.max(0, value - 1))}
              >
                上一题
              </button>
              <button
                className="c-btn c-btn-primary"
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
            </footer>
          </section>
        </article>
        <aside className="c-pc-side">
          <h2 className="c-detail-name">{prep?.title ?? '考试中'}</h2>
          <p className="c-pc-exam-side-timer">
            剩余时间 <time>{formatExamTimer(paper.remainingSeconds)}</time>
          </p>
          <p className="c-pc-exam-side-progress">
            已答 {answeredCount}/{paper.total}
          </p>
          <section className="c-pc-exam-syllabus" aria-label="答题卡">
            <h3>答题卡</h3>
            <ul className="c-pc-exam-sheet">
              {paper.questions.map((item, index) => {
                const active = index === current;
                const answered = Boolean(answers[item.id]);
                return (
                  <li key={item.id}>
                    <button
                      className={`c-pc-exam-sheet-item${active ? ' is-active' : ''}${answered ? ' is-done' : ''}`}
                      type="button"
                      aria-current={active ? 'true' : undefined}
                      aria-label={`第 ${item.index} 题 ${item.typeLabel}`}
                      onClick={() => setCurrent(index)}
                    >
                      {item.index}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </div>
    </PcActivityShell>
  );
}
