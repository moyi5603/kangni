import { useMemo, useState } from 'react';
import { useActivities } from '../../../activities/model/activityStore';
import { goH5Back, goCEnd } from '../../../../app/navigation';
import { IconTicket } from '../components/Icons';
import { SignupStatusRow } from '../components/SignupStatusRow';
import {
  H5_MY_SIGNUPS_LIST_STYLE,
  SIGNUP_TABS,
  clientVisibleActivities,
  filterSignupsByTitle,
  groupClientSignups,
  signupsForTab,
  type ClientSignupView,
  type SignupTabId,
} from '../model/clientActivity';
import { useUserSignups } from '../model/signupStore';
import { H5ActivityListCard } from './H5ActivityCards';
import { H5ActivityShell } from './H5ActivityShell';

function SignupDetails({ item }: { item: ClientSignupView }) {
  return <p className="c-h5-signup-type">报名类型：{item.signup.type}</p>;
}

function SignupCard({ item }: { item: ClientSignupView }) {
  const { activity } = item;

  if (!activity) {
    return (
      <article className="c-h5-signup-card is-invalid">
        <div className="c-h5-signup-card-body">
          <h3 className="c-h5-signup-title">活动已失效</h3>
          <SignupStatusRow auditStatus={item.signup.status} />
          <SignupDetails item={item} />
        </div>
      </article>
    );
  }

  return (
    <H5ActivityListCard
      activity={activity}
      signedUp
      layout={H5_MY_SIGNUPS_LIST_STYLE}
      onOpen={() => goCEnd('h5', activity.id)}
    />
  );
}

export function SignupGroup({
  title,
  items,
}: {
  title: (typeof SIGNUP_TABS)[number]['label'];
  items: ClientSignupView[];
}) {
  if (items.length === 0) return null;

  return (
    <ul className={`c-h5-list is-${H5_MY_SIGNUPS_LIST_STYLE}`} aria-label={`${title}报名`}>
      {items.map((item) => (
        <li key={`${item.signup.activityId}-${item.signup.createdAt}`}>
          <SignupCard item={item} />
        </li>
      ))}
    </ul>
  );
}

export function H5MySignups({
  initialTab = 'waiting',
  initialQuery = '',
}: {
  initialTab?: SignupTabId;
  initialQuery?: string;
} = {}) {
  const activities = useActivities();
  const signups = useUserSignups();
  const [tab, setTab] = useState<SignupTabId>(initialTab);
  const [query, setQuery] = useState(initialQuery);
  const groups = useMemo(
    () => groupClientSignups(signups, clientVisibleActivities(activities)),
    [activities, signups],
  );
  const goHome = () => goCEnd('h5');
  const items = filterSignupsByTitle(signupsForTab(groups, tab), query);
  const activeTab = SIGNUP_TABS.find((item) => item.id === tab) ?? SIGNUP_TABS[0];
  const emptyCopy = query.trim() ? '未找到相关活动' : activeTab.empty;

  return (
    <H5ActivityShell title="我的活动" onBack={goH5Back}>
      {signups.length === 0 ? (
        <div className="c-h5-signup-empty">
          <IconTicket />
          <h2>还没有报名活动</h2>
          <p>去看看最近有哪些活动值得参加</p>
          <button className="c-btn c-btn-primary" type="button" onClick={goHome}>
            去看看活动
          </button>
        </div>
      ) : (
        <>
          <input
            className="c-h5-signup-search"
            type="search"
            value={query}
            placeholder="搜索活动名称"
            aria-label="搜索活动名称"
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="c-tabs c-h5-signup-tabs" role="group" aria-label="报名分组">
            {SIGNUP_TABS.map((item) => {
              const active = item.id === tab;
              return (
                <button
                  key={item.id}
                  className={`c-tab${active ? ' is-active' : ''}`}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTab(item.id)}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          {items.length === 0 ? (
            <p className="c-empty">{emptyCopy}</p>
          ) : (
            <SignupGroup title={activeTab.label} items={items} />
          )}
        </>
      )}
    </H5ActivityShell>
  );
}
