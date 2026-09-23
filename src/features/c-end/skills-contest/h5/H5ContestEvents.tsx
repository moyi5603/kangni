import {
  toH5CourseListHash,
  toH5ExamListHash,
  toH5LearningPlanListHash,
  toH5PracticeBankHash,
} from '../../../../app/navigation';
import { H5ContestShell } from './H5ContestShell';

function IconPlan() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="5" y="4" width="14" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 3.5v3M16 3.5v3M5 9h14" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 14.2 11 16l4-4.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21.5z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 5.5V21.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
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

function IconExam() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="6" y="3" width="12" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 8h6M9 12h6M9 16h3" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function H5ContestEvents() {
  return (
    <H5ContestShell header={null} tab="events" className="is-contest-hub">
      <section className="c-contest-hub" aria-label="线上竞赛菜单">
        <h2>线上竞赛</h2>
        <ul>
          <li>
            <a href={toH5LearningPlanListHash()}>
              <IconPlan />
              学习计划
            </a>
          </li>
          <li>
            <a href={toH5CourseListHash()}>
              <IconBook />
              课程库
            </a>
          </li>
          <li>
            <a href={toH5PracticeBankHash()}>
              <IconPencil />
              练习库
            </a>
          </li>
          <li>
            <a href={toH5ExamListHash()}>
              <IconExam />
              考试任务
            </a>
          </li>
        </ul>
      </section>
    </H5ContestShell>
  );
}
