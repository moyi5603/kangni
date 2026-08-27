import {
  goAdminWorkbench,
  toCEndHash,
  toH5CourseListHash,
  toH5ExamListHash,
  toH5InterestGroupsHash,
  toH5VoteListHash,
  toPcVoteListHash,
  toPcCourseListHash,
  toPcExamListHash,
} from '../../../app/navigation';
import './styles.css';

const entries = [
  { title: '活动 PC', hint: '员工活动 · 宽屏门户', href: toCEndHash('pc') },
  { title: '活动 H5', hint: '员工活动 · 手机', href: toCEndHash('h5') },
  { title: '课程 PC', hint: '课程列表 · 宽屏门户', href: toPcCourseListHash() },
  { title: '课程 H5', hint: '课程列表 · 手机', href: toH5CourseListHash() },
  { title: '考试 PC', hint: '考试列表 · 宽屏门户', href: toPcExamListHash() },
  { title: '考试 H5', hint: '考试列表 · 手机', href: toH5ExamListHash() },
  { title: '投票 PC', hint: '普通投票 · 宽屏门户', href: toPcVoteListHash() },
  { title: '投票 H5', hint: '普通投票 · 手机', href: toH5VoteListHash() },
  { title: '兴趣小组 H5', hint: '兴趣小组 · 手机', href: toH5InterestGroupsHash() },
] as const;

export function CEndPortal() {
  return (
    <div className="c-portal">
      <header className="c-portal-header">
        <div className="c-portal-brand">
          <span className="c-portal-mark" aria-hidden="true" />
          <span className="c-portal-name">康尼</span>
        </div>
        <button className="c-portal-back" type="button" onClick={goAdminWorkbench}>
          返回后台
        </button>
      </header>
      <main className="c-portal-main">
        <h1 className="c-portal-title">C 端预览</h1>
        <p className="c-portal-lead">选择要打开的员工端页面。</p>
        <ul className="c-portal-grid">
          {entries.map((entry) => (
            <li key={entry.href}>
              <a className="c-portal-card" href={entry.href}>
                <span className="c-portal-card-title">{entry.title}</span>
                <span className="c-portal-card-hint">{entry.hint}</span>
              </a>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
