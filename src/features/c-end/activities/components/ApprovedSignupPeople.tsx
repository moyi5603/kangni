import { useState } from 'react';
import type { Activity } from '../../../activities/model/activity';
import {
  formatSessionChipDate,
  listClientSignupSessions,
  shouldShowRecentSessions,
} from '../../../activities/model/activitySchedule';
import { useRelated } from '../../../activities/model/related';
import {
  approvedSignupPeople,
  filterApprovedSignupPeople,
  SIGNUP_PEOPLE_PREVIEW_LIMIT,
  type ApprovedSignupPerson,
} from '../model/clientActivity';
import { EmployeeAvatar } from './EmployeeAvatar';

function PeopleList({ people }: { people: ApprovedSignupPerson[] }) {
  if (people.length === 0) {
    return <p className="c-empty">没有匹配的报名人员</p>;
  }
  return (
    <ul className="c-signup-people-list is-cols-4">
      {people.map((person) => (
        <li key={person.id} className="c-signup-person">
          <EmployeeAvatar name={person.name} />
          <div className="c-signup-person-copy">
            <span className="c-signup-person-name">{person.name}</span>
            <span className="c-signup-person-dept">{person.department}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ApprovedSignupPeople({
  activityId,
  activity,
  surface = 'h5',
  open: initialOpen = false,
  query = '',
  peopleTab,
  now = Date.now(),
}: {
  activityId: number;
  activity?: Activity;
  surface?: 'h5' | 'pc';
  open?: boolean;
  query?: string;
  peopleTab?: string;
  now?: number;
}) {
  useRelated('signups', activityId);
  const people = approvedSignupPeople(activityId);
  const sessionTabs =
    activity && shouldShowRecentSessions(activity.scheduleType, activity.sessions ?? [], now)
      ? listClientSignupSessions(activity.sessions ?? [], now)
      : [];
  const [open, setOpen] = useState(initialOpen);
  const [keyword, setKeyword] = useState(query);
  const [tab, setTab] = useState(peopleTab ?? sessionTabs[0]?.id ?? 'all');
  const preview = people.slice(0, SIGNUP_PEOPLE_PREVIEW_LIMIT);
  const leftover = people.length - preview.length;
  const activeTab =
    sessionTabs.length === 0
      ? 'all'
      : sessionTabs.some((session) => session.id === tab)
        ? tab
        : sessionTabs[0]!.id;
  const tabPeople = activeTab === 'all' ? people : approvedSignupPeople(activityId, activeTab);
  const visible = filterApprovedSignupPeople(tabPeople, keyword);
  const showSearch = people.length > SIGNUP_PEOPLE_PREVIEW_LIMIT;

  return (
    <section className="c-signup-people" aria-labelledby="signup-people-heading">
      {people.length === 0 ? (
        <p id="signup-people-heading" className="c-signup-people-empty">
          已报名人员 · 暂无已通过报名
        </p>
      ) : (
        <button
          className="c-signup-people-trigger"
          type="button"
          onClick={() => setOpen(true)}
        >
          <span className="c-signup-people-stack" aria-hidden>
            {preview.map((person) => (
              <EmployeeAvatar key={person.id} name={person.name} />
            ))}
            {leftover > 0 ? <span className="c-signup-people-more-count">+{leftover}</span> : null}
          </span>
          <span id="signup-people-heading" className="c-signup-people-label">
            已报名人员（{people.length}）
          </span>
          <span className="c-signup-people-more">查看名单</span>
        </button>
      )}
      {open && people.length > 0 ? (
        <div
          className={surface === 'pc' ? 'c-modal-backdrop' : 'c-sheet-backdrop'}
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className={surface === 'pc' ? 'c-modal c-signup-people-panel' : 'c-sheet c-signup-people-panel'}
            role="dialog"
            aria-modal="true"
            aria-labelledby="signup-people-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="c-signup-people-panel-head">
              <h2 id="signup-people-dialog-title">已报名人员（{visible.length}）</h2>
              <button className="c-btn c-btn-ghost" type="button" onClick={() => setOpen(false)}>
                关闭
              </button>
            </div>
            {sessionTabs.length > 0 ? (
              <div className="c-tabs c-signup-people-tabs" role="tablist" aria-label="按场次查看">
                {sessionTabs.map((session) => (
                  <button
                    key={session.id}
                    className={`c-tab${activeTab === session.id ? ' is-active' : ''}`}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === session.id}
                    onClick={() => setTab(session.id)}
                  >
                    {formatSessionChipDate(session.startAt)}
                  </button>
                ))}
              </div>
            ) : null}
            {showSearch ? (
              <input
                className="c-signup-people-search"
                type="search"
                value={keyword}
                placeholder="搜索姓名或部门"
                aria-label="搜索姓名或部门"
                onChange={(event) => setKeyword(event.target.value)}
              />
            ) : null}
            <div className="c-signup-people-body">
              <PeopleList people={visible} />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
