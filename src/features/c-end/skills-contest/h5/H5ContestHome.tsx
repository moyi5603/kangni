import {
  toH5ContestChallengeHash,
  toH5ContestRankHash,
  toH5CourseDetailHash,
  toH5CourseListHash,
  toH5LotteryPlayHash,
  toH5PracticeBankHash,
} from '../../../../app/navigation';
import { listPublishedClientCourses } from '../../courses/model/clientCourse';
import { featuredWheelLotteryId } from '../../../lottery/model/lottery';
import { useLotteries } from '../../../lottery/model/lotteryStore';
import { useContests } from '../../../skills-contest/model/contestStore';
import { usePreviewList, useCEndEmptyPreview } from '../../portal/emptyPreview';
import { H5ContestShell } from './H5ContestShell';
import { ContestCheckinEntry, ContestCountdownCard, ContestHomeBanner, ContestLiveCard } from './ContestHomeWidgets';

function IconBook() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21.5z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 5.5V21.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconMap() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="4" y="5" width="16" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 9h.01M12 13h.01M16 10h.01" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function IconPencil() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M4 20h4.2L19 9.2 14.8 5 4 15.8z" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconGift() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="4" y="11" width="16" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 11h18M12 11v10M12 11c-3-5-6-5-6-2.5S9 11 12 11c3-5 6-5 6-2.5S15 11 12 11Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconGem() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M7 6h10l4 6-9 9-9-9z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 12h18M10 6 8 12l4 9 4-9-2-6" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconTrophy() {
  return (
    <svg viewBox="0 0 160 110" aria-hidden>
      <ellipse cx="80" cy="98" rx="36" ry="7" fill="#7ec8ff" opacity="0.45" />
      <path d="M54 86h52l-6 12H60z" fill="#d7ecff" />
      <path d="M48 22h64s4 38-32 54S48 22 48 22Z" fill="#b9e4ff" />
      <path d="M48 22h64s-6 36-32 50S48 22 48 22Z" fill="#e8f7ff" />
      <path d="M44 26c-16 2-22 22-10 34 10-16 10-26 10-34Z" fill="none" stroke="#cfefff" strokeWidth="6" />
      <path d="M116 26c16 2 22 22 10 34-10-16-10-26-10-34Z" fill="none" stroke="#cfefff" strokeWidth="6" />
    </svg>
  );
}

export function H5ContestHome() {
  const contests = usePreviewList(useContests());
  const lotteries = useLotteries();
  const featured = contests[0];
  const courses = useCEndEmptyPreview() ? [] : listPublishedClientCourses().slice(0, 2);
  const challengeHref = featured ? toH5ContestChallengeHash(featured.id) : '#';
  const rankHref = featured ? toH5ContestRankHash(featured.id) : '#';
  const wheelId = featuredWheelLotteryId(lotteries);
  const lotteryHref = wheelId != null ? toH5LotteryPlayHash(wheelId) : '#';

  return (
    <H5ContestShell brand tab="home">
      <div className="c-contest-home">
        {featured ? (
          <>
            <ContestHomeBanner contest={featured} rankHref={rankHref} />
            <ContestCheckinEntry />
          </>
        ) : (
          <p className="c-empty">暂无赛事</p>
        )}

        <ul className="c-contest-entries" aria-label="快捷入口">
          <li>
            <a href={toH5CourseListHash()}>
              <span>
                <IconBook />
              </span>
              课程中心
            </a>
          </li>
          <li>
            <a href={challengeHref}>
              <span>
                <IconMap />
              </span>
              闯关地图
            </a>
          </li>
          <li>
            <a href={toH5PracticeBankHash()}>
              <span>
                <IconPencil />
              </span>
              练习宝典
            </a>
          </li>
          <li>
            <a href={rankHref}>
              <span>
                <IconGem />
              </span>
              积分排行
            </a>
          </li>
          <li>
            <a href={lotteryHref}>
              <span>
                <IconGift />
              </span>
              抽奖
            </a>
          </li>
        </ul>

        {featured ? (
          <>
            <ContestCountdownCard contest={featured} />
            <ContestLiveCard />
          </>
        ) : null}

        <section className="c-contest-block">
          <h3>积分排行</h3>
          <a className="c-contest-rank-promo" href={rankHref} aria-label="积分排行">
            <IconTrophy />
          </a>
        </section>

        <section className="c-contest-block c-contest-course-block">
          <div className="c-contest-block-head">
            <h3>课程</h3>
            <a href={toH5CourseListHash()}>
              更多
              <i aria-hidden>›</i>
            </a>
          </div>
          <ul className="c-contest-course-grid">
            {courses.length === 0 ? (
              <li>
                <p className="c-empty">暂无课程</p>
              </li>
            ) : (
              courses.map((course) => (
              <li key={course.id}>
                <a className="c-contest-course-card" href={toH5CourseDetailHash(course.id)}>
                  <span className={`c-contest-course-cover is-${course.cover}`}>
                    <b>{course.title}</b>
                  </span>
                  <strong>{course.title}</strong>
                  <small>
                    <em>{course.views}次浏览</em>
                    <em>{(4.5 + (course.id % 5) / 10).toFixed(1)}分</em>
                  </small>
                </a>
              </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </H5ContestShell>
  );
}
