import { useState } from 'react';
import { goPcExamResult, toPcExamResultHash } from '../../../../app/navigation';
import { PcActivityShell } from '../../activities/pc/PcActivityShell';
import { getClientExamReview, type ClientExamReviewQuestion } from '../model/clientExamResult';

function ReviewQuestionCard({ question }: { question: ClientExamReviewQuestion }) {
  const mine = question.myAnswerLetter || question.myAnswerText || '-';
  const official = question.correctAnswerLetter || question.correctAnswerText || '-';

  return (
    <section className="c-detail-info-card c-pc-exam-review-q">
      <header className="c-pc-exam-review-q-head">
        <p>
          第 {question.index} 题
          <span className="c-pin">{question.typeLabel}</span>
          <span className={`c-pin${question.correct ? ' is-pass' : ' is-fail'}`}>
            {question.correct ? '答对' : '答错'}
          </span>
        </p>
        <em>{question.score}/{question.maxScore}分</em>
      </header>
      <h3 className="c-pc-exam-review-stem">{question.stem}</h3>
      {question.options.length > 0 ? (
        <ul className="c-pc-exam-review-opts">
          {question.options.map((option) => (
            <li key={option.letter} className={`is-${option.state}`}>
              <span>{option.letter}</span>
              <p>{option.letter}. {option.text}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="c-pc-exam-review-blank">{question.myAnswerText}</p>
      )}
      <div className="c-meta c-detail-facts">
        <div>您的答案：{mine}</div>
        <div>正确答案：{official}</div>
      </div>
    </section>
  );
}

export function PcExamReview({ id }: { id: number }) {
  const review = getClientExamReview(id);
  const [wrongOnly, setWrongOnly] = useState(false);

  if (!review) {
    return (
      <PcActivityShell className="is-exam is-review" title="考试回顾" onPhone={() => goPcExamResult(id)}>
        <p className="c-empty">暂无答题记录</p>
      </PcActivityShell>
    );
  }

  const list = wrongOnly ? review.questions.filter((item) => !item.correct) : review.questions;

  return (
    <PcActivityShell className="is-exam is-review" title="考试回顾" onPhone={() => goPcExamResult(id)}>
      <button className="c-back-link" type="button" onClick={() => goPcExamResult(id)}>
        ← 返回结果
      </button>
      <div className="c-pc-detail">
        <article className="c-pc-exam-review-list">
          {list.length === 0 ? (
            <p className="c-empty">暂无错题</p>
          ) : (
            list.map((question) => <ReviewQuestionCard key={question.id} question={question} />)
          )}
        </article>
        <aside className="c-pc-side">
          <p className="c-pc-exam-side-score">
            {review.score}
            <small>分</small>
          </p>
          <div className="c-meta c-detail-facts">
            <div>总题数：{review.questionCount}</div>
            <div>答对：{review.correctCount}</div>
            <div>答错：{review.wrongCount}</div>
          </div>
          <label className="c-pc-exam-filter is-side">
            <input
              type="checkbox"
              checked={wrongOnly}
              onChange={(event) => setWrongOnly(event.target.checked)}
            />
            <span>只看错题</span>
          </label>
          <a className="c-cta is-exam-start" href={toPcExamResultHash(id)}>
            返回结果页
          </a>
        </aside>
      </div>
    </PcActivityShell>
  );
}
