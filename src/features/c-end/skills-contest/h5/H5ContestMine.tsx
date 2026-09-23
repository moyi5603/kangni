import {
  toCEndPortalHash,
  toH5ContestDetailHash,
  toH5ContestDocsHash,
  toH5ContestEventsHash,
  toH5ContestWrongHash,
  toH5CourseListHash,
  toH5CourseNotesHash,
  toH5FavoritesHash,
  toH5HonorHash,
} from '../../../../app/navigation';
import { useChallengeDayLogs, useContestSignups, useContests } from '../../../skills-contest/model/contestStore';
import { contestRankBoard, DEMO_CONTEST_USER } from '../model/clientContest';
import { H5ContestShell } from './H5ContestShell';

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 8v4.2L15 15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7.2 13.4 11h3.6l-2.9 2.2 1.1 3.6L12 14.8 8.8 16.8 9.9 13.2 7 11h3.6z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function IconNote() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="6" y="4" width="12" height="16" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 9h6M9 13h6M9 17h3" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconWrong() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="4.5" y="4.5" width="6.2" height="6.2" rx="1" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13.3" y="4.5" width="6.2" height="6.2" rx="1" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="4.5" y="13.3" width="6.2" height="6.2" rx="1" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14.2 14.2 20 20M20 14.2 14.2 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconCert() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="6" y="4" width="12" height="14" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 8h6M9 11h6M10 18v3l2-1.2L14 21v-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function IconArchive() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="4" y="6" width="16" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="9" cy="12" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13 10.5h5M13 13.5h4" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconMedal() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden>
      <path d="M5 1.5h6l-1.4 4H6.4z" fill="#ffd56a" />
      <circle cx="8" cy="10" r="4" fill="#ffd56a" stroke="#f0b429" strokeWidth="1" />
    </svg>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Avatar() {
  return (
    <span className="c-mine-avatar" aria-hidden>
      <svg viewBox="0 0 72 72">
        <circle cx="36" cy="36" r="36" fill="#eceff5" />
        <circle cx="36" cy="28" r="12" fill="#c5ccd6" />
        <path d="M14 62c3-14 14-20 22-20s19 6 22 20" fill="#c5ccd6" />
      </svg>
    </span>
  );
}

export function H5ContestMine() {
  const contests = useContests();
  useContestSignups(contests[0]?.id ?? 0);
  useChallengeDayLogs(contests[0]?.id ?? 0);
  const featured = contests[0];
  const me = featured ? contestRankBoard(featured.id).find((row) => row.isMe) : undefined;
  const archiveHref = featured ? toH5ContestDetailHash(featured.id) : toH5ContestEventsHash();

  return (
    <H5ContestShell header={null} tab="mine" className="is-contest-mine">
      <div className="c-mine-page">
        <section className="c-mine-hero">
          <div className="c-mine-user">
            <Avatar />
            <div>
              <h2>{DEMO_CONTEST_USER.name}</h2>
              {featured ? (
                <p>
                  <IconMedal />
                  {featured.name}
                </p>
              ) : null}
            </div>
          </div>
          <ul className="c-mine-stats" aria-label="学习数据">
            <li>
              <b>{me?.credits ?? 0}</b>
              <span>学分</span>
            </li>
            <li>
              <b>0h</b>
              <span>学习时长</span>
            </li>
            <li>
              <b>{me?.points ?? 0}</b>
              <span>积分</span>
            </li>
          </ul>
        </section>

        <div className="c-mine-sheet">
          <section className="c-mine-card">
            <h3>我的学习</h3>
            <ul>
              <li>
                <a href={toH5CourseListHash()}>
                  <IconClock />
                  学习记录
                </a>
              </li>
              <li>
                <a href={toH5FavoritesHash()}>
                  <IconStar />
                  收藏
                </a>
              </li>
              <li>
                <a href={toH5CourseNotesHash()}>
                  <IconNote />
                  笔记
                </a>
              </li>
              <li>
                <a href={toH5ContestWrongHash()}>
                  <IconWrong />
                  错题本
                </a>
              </li>
            </ul>
          </section>

          <section className="c-mine-card">
            <h3>学习成就</h3>
            <ul>
              <li>
                <a href={toH5HonorHash()}>
                  <IconCert />
                  证书
                </a>
              </li>
              <li>
                <a href={archiveHref}>
                  <IconArchive />
                  档案
                </a>
              </li>
            </ul>
          </section>

          <a className="c-mine-row" href={toH5ContestDocsHash()}>
            建议反馈
            <Chevron />
          </a>
          <a className="c-mine-row" href={toCEndPortalHash()}>
            设置
            <Chevron />
          </a>
        </div>
      </div>
    </H5ContestShell>
  );
}
