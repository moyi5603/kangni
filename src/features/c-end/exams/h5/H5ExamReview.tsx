import { useState } from 'react';
import { goH5ExamResult, toH5ExamResultHash } from '../../../../app/navigation';
import { H5ActivityShell } from '../../activities/h5/H5ActivityShell';
import { getClientExamReview, type ClientExamReviewQuestion } from '../model/clientExamResult';

function ReviewBook() {
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

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 12.2 10.2 16.5 18 7.8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCross() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7l10 10M17 7 7 17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function ReviewQuestionCard({ question }: { question: ClientExamReviewQuestion }) {
  const mine = question.myAnswerLetter || question.myAnswerText || '-';
  const official = question.correctAnswerLetter || question.correctAnswerText || '-';

  return (
    <article className="c-h5-exam-review-q">
      <header className="c-h5-exam-review-q-head">
        <p>
          第 {question.index} 题
          <span className="c-h5-exam-review-tag is-type">{question.typeLabel}</span>
          <span className={`c-h5-exam-review-tag${question.correct ? ' is-ok' : ' is-bad'}`}>
            {question.correct ? '答对' : '答错'}
          </span>
        </p>
        <em>
          {question.score}/{question.maxScore}分
        </em>
      </header>
      <h3>{question.stem}</h3>
      {question.options.length > 0 ? (
        <ul className="c-h5-exam-review-opts">
          {question.options.map((option) => (
            <li key={option.letter} className={`is-${option.state}`}>
              <span>{option.letter}</span>
              <p>
                {option.letter}. {option.text}
              </p>
              {option.state === 'right' ? <IconCheck /> : null}
              {option.state === 'wrong' ? <IconCross /> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="c-h5-exam-review-blank">{question.myAnswerText}</p>
      )}
      <div className="c-h5-exam-review-keys">
        <p className="c-h5-exam-review-key is-mine">您的答案 {mine}</p>
        <p className="c-h5-exam-review-key is-ok">正确答案 {official}</p>
      </div>
    </article>
  );
}

export function H5ExamReview({ id }: { id: number }) {
  const review = getClientExamReview(id);
  const [wrongOnly, setWrongOnly] = useState(false);

  if (!review) {
    return (
      <H5ActivityShell className="is-exam is-review" title="考试回顾" onBack={() => goH5ExamResult(id)}>
        <p className="c-h5-exam-empty">暂无答题记录</p>
      </H5ActivityShell>
    );
  }

  const list = wrongOnly ? review.questions.filter((item) => !item.correct) : review.questions;

  return (
    <H5ActivityShell
      className="is-exam is-review"
      title="考试回顾"
      onBack={() => goH5ExamResult(id)}
      footer={
        <div className="c-h5-exam-result-bar">
          <a className="c-h5-exam-start" href={toH5ExamResultHash(id)}>
            返回结果页
          </a>
        </div>
      }
    >
      <div className="c-h5-exam-review">
        <section className="c-h5-exam-review-hero">
          <ReviewBook />
          <p className="c-h5-exam-result-score">
            {review.score}
            <small>分</small>
          </p>
          <div className="c-h5-exam-review-stats">
            <p>
              <strong>{review.questionCount}</strong>
              <span>总题数</span>
            </p>
            <p className="is-ok">
              <strong>{review.correctCount}</strong>
              <span>答对</span>
            </p>
            <p className="is-bad">
              <strong>{review.wrongCount}</strong>
              <span>答错</span>
            </p>
          </div>
          <div className="c-h5-exam-review-filter">
            <span>只看错题</span>
            <button
              className={`c-h5-exam-switch${wrongOnly ? ' is-on' : ''}`}
              type="button"
              role="switch"
              aria-checked={wrongOnly}
              onClick={() => setWrongOnly((value) => !value)}
            >
              <span className="c-h5-exam-switch-knob" />
            </button>
          </div>
        </section>
        {list.map((question) => (
          <ReviewQuestionCard key={question.id} question={question} />
        ))}
      </div>
    </H5ActivityShell>
  );
}
