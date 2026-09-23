import { useEffect, useState } from 'react';
import { toH5DailyCheckinHash, toH5ExamListHash, toH5ContestEventsHash } from '../../../../app/navigation';
import {
  calendarDayKey,
  checkinStatusOf,
  nextStreak,
  shanghaiYmd,
  uniqueUserDays,
} from '../../../checkin/model/checkin';
import { useCheckinLogs, useCheckinThemes } from '../../../checkin/model/checkinStore';
import { formatContestRange, formatOpenExamAt, nextContestCountdown, remainHms } from '../model/clientContest';
import type { Contest } from '../../../skills-contest/model/contest';

const LIVE = {
  title: '初赛冲刺 · 专家答疑直播',
  tutor: '周屿远导师',
  viewers: 836,
};

const CHECKIN_USER = { userId: 'u2' };

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function streakAsOf(days: string[], today: string) {
  if (days.includes(today)) return nextStreak(days.filter((item) => item !== today), today);
  const yesterday = shanghaiYmd(Date.parse(`${today}T00:00:00+08:00`) - 24 * 60 * 60 * 1000);
  if (days.includes(yesterday)) return nextStreak(days.filter((item) => item !== yesterday), yesterday);
  return 0;
}

export function ContestHomeBanner({ contest, rankHref }: { contest: Contest; rankHref: string }) {
  const [index, setIndex] = useState(0);
  const slides = [
    {
      kicker: '数智赋能班组 · 慧创焕新质',
      title: contest.name,
      sub: '线上初赛和复赛学分规则',
      meta: formatContestRange(contest.startAt, contest.endAt),
      href: rankHref,
    },
    {
      kicker: '技能加油站',
      title: '一线班组冲刺专题',
      sub: '课程、闯关、考试一站直达',
      meta: '每日更新练习题',
      href: toH5ExamListHash(),
    },
  ];
  const current = slides[index] ?? slides[0]!;

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((cur) => (cur + 1) % 2), 5000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="c-contest-banner-wrap" aria-label="顶部运营位">
      <a className={`c-contest-banner is-slide-${index}`} href={current.href}>
        <p className="c-contest-banner-kicker">{current.kicker}</p>
        <h2>{current.title}</h2>
        <p className="c-contest-banner-sub">{current.sub}</p>
        <small>{current.meta}</small>
      </a>
      <span className="c-contest-banner-dots" aria-hidden>
        {slides.map((slide, slideIndex) => (
          <i key={slide.title} className={slideIndex === index ? 'is-on' : undefined} />
        ))}
      </span>
    </section>
  );
}

export function ContestCountdownCard({ contest }: { contest: Contest }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const next = nextContestCountdown(contest, now);
  if (!next) return null;
  const remain = remainHms(next.targetMs - now);

  return (
    <a className="c-contest-count" href={toH5ExamListHash()}>
      <div>
        <p className="c-contest-count-kicker">{next.kicker}</p>
        <p className="c-contest-count-clock">
          <strong>{pad(remain.days)}</strong>
          <span>天</span>
          <b>
            {pad(remain.hours)}:{pad(remain.minutes)}:{pad(remain.seconds)}
          </b>
        </p>
        <small>{formatOpenExamAt(next.targetAt)}</small>
      </div>
      <span className="c-contest-count-cta">查看考试</span>
    </a>
  );
}

export function ContestLiveCard() {
  return (
    <a className="c-contest-live" href={toH5ContestEventsHash()}>
      <span className="c-contest-live-badge">LIVE</span>
      <span className="c-contest-live-body">
        <small>正在直播</small>
        <strong>{LIVE.title}</strong>
        <em>
          {LIVE.tutor} · {LIVE.viewers} 人正在观看
        </em>
      </span>
      <span className="c-contest-live-go">进入直播</span>
    </a>
  );
}

export function ContestCheckinEntry() {
  const themes = useCheckinThemes();
  const theme =
    themes.find((item) => item.ownerApp === 'skills-contest' && checkinStatusOf(item) === '进行中') ??
    themes.find((item) => item.ownerApp === 'skills-contest');
  const logs = useCheckinLogs(theme?.id ?? 0);
  const today = shanghaiYmd();
  const days = theme ? uniqueUserDays(logs, theme.id, CHECKIN_USER.userId) : [];
  const streak = streakAsOf(days, today);
  const todayDone = logs.some((item) => item.userId === CHECKIN_USER.userId && calendarDayKey(item.checkedAt) === today);

  return (
    <a className="c-contest-checkin" href={toH5DailyCheckinHash()}>
      <span className={`c-contest-checkin-mark${todayDone ? ' is-on' : ''}`} aria-hidden>
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M7.5 12.5 10.5 15.5 16.5 8.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      <span>
        <strong>今日签到领积分</strong>
        <small>{streak > 0 ? `已连续签到 ${streak} 天` : '今天还没签到'}</small>
      </span>
      <em>去签到</em>
    </a>
  );
}
