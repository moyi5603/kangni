import { useState } from 'react';
import { goH5Back } from '../../../../app/navigation';
import { getContest, markContestWrongPracticed, removeContestWrongItem, useContestWrongItems } from '../../../skills-contest/model/contestStore';
import { filterWrongBook, mySignup, wrongBookStats, type WrongBookMode } from '../model/clientContest';
import { H5ContestShell } from './H5ContestShell';

type Screen = 'hub' | 'view' | WrongBookMode;

function IconHourglass() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconHard() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="5" y="4" width="14" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 8h8M8 12h6" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17" cy="17" r="4" fill="#fff" stroke="#2f6fe0" strokeWidth="1.6" />
      <path d="M15.6 15.6 18.4 18.4M18.4 15.6 15.6 18.4" stroke="#2f6fe0" strokeWidth="1.4" />
    </svg>
  );
}

function IconPencil() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M4 20h4.2L19 9.2 14.8 5 4 15.8z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13.2 6.6 17.4 10.8" stroke="#2f6fe0" strokeWidth="1.6" />
    </svg>
  );
}

function IconFilter() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M4 6h16M7 12h10M10 18h4" fill="none" stroke="#2f6fe0" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function H5ContestWrongBook() {
  const mine = useContestWrongItems().filter((item) => mySignup(item.contestId)?.id === item.signupId);
  const stats = wrongBookStats(mine);
  const [screen, setScreen] = useState<Screen>('hub');
  const [cursor, setCursor] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const quizPool = screen === 'remain' || screen === 'hard' || screen === 'all' ? filterWrongBook(mine, screen) : [];
  const current = quizPool[cursor];

  const start = (mode: WrongBookMode) => {
    setScreen(mode);
    setCursor(0);
    setPicked(null);
  };

  if (screen !== 'hub' && screen !== 'view' && current) {
    const last = cursor >= quizPool.length - 1;
    return (
      <H5ContestShell className="is-wrongbook" title="练习错题" onBack={() => setScreen('hub')}>
        <div className="c-contest-quiz">
          <p className="c-contest-quiz-progress">
            {cursor + 1} / {quizPool.length}
          </p>
          <h2>{current.stem}</h2>
          <ul>
            {current.options.map((option) => (
              <li key={option}>
                <button type="button" className={picked === option ? 'is-on' : undefined} onClick={() => setPicked(option)}>
                  {option}
                </button>
              </li>
            ))}
          </ul>
          <button
            className="c-contest-cta"
            type="button"
            disabled={!picked}
            onClick={() => {
              if (picked === current.answer) markContestWrongPracticed(current.id);
              if (last) {
                setScreen('hub');
                setCursor(0);
                setPicked(null);
                return;
              }
              setCursor((value) => value + 1);
              setPicked(null);
            }}
          >
            {last ? '完成练习' : '下一题'}
          </button>
        </div>
      </H5ContestShell>
    );
  }

  if (screen === 'view') {
    return (
      <H5ContestShell className="is-wrongbook" title="查看所有错题" onBack={() => setScreen('hub')}>
        {mine.length === 0 ? (
          <p className="c-empty">暂无数据</p>
        ) : (
          <ul className="c-contest-wrong-list">
            {mine.map((item) => (
              <li key={item.id} className="c-contest-wrong-card">
                <p className="c-contest-wrong-meta">{getContest(item.contestId)?.name ?? '赛事'}</p>
                <h2>{item.stem}</h2>
                <p className="c-contest-wrong-picked">您的答案 {item.picked}</p>
                <p className="c-contest-wrong-answer">正确答案 {item.answer}</p>
                <button type="button" className="c-contest-wrong-remove" onClick={() => removeContestWrongItem(item.id)}>
                  移出错题本
                </button>
              </li>
            ))}
          </ul>
        )}
      </H5ContestShell>
    );
  }

  if (screen !== 'hub') {
    return (
      <H5ContestShell className="is-wrongbook" title="练习错题" onBack={() => setScreen('hub')}>
        <p className="c-empty">暂无数据</p>
      </H5ContestShell>
    );
  }

  return (
    <H5ContestShell className="is-wrongbook" title="错题本" onBack={goH5Back}>
      <div className="c-wrong-hub">
        <section className="c-wrong-stats" aria-label="错题统计">
          <span>
            <b>{stats.total}</b>
            累计
          </span>
          <span>
            <b>{stats.practiced}</b>
            已练习
          </span>
          <span>
            <b>{stats.remain}</b>
            剩余
          </span>
        </section>
        <ul className="c-wrong-actions">
          <li>
            <button type="button" onClick={() => start('remain')}>
              <strong>练习剩余错题</strong>
              <IconHourglass />
            </button>
          </li>
          <li>
            <button type="button" onClick={() => start('hard')}>
              <span>
                <strong>练习易错题</strong>
                <small>答错两次以上</small>
              </span>
              <IconHard />
            </button>
          </li>
          <li>
            <button type="button" onClick={() => start('all')}>
              <strong>练习所有错题</strong>
              <IconPencil />
            </button>
          </li>
          <li>
            <button type="button" onClick={() => setScreen('view')}>
              <strong>查看所有错题</strong>
              <IconFilter />
            </button>
          </li>
        </ul>
      </div>
    </H5ContestShell>
  );
}
