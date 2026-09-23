import { useMemo, useState } from 'react';
import { useActivities } from '../../../activities/model/activityStore';
import { goCEnd } from '../../../../app/navigation';
import { ActivityMeta } from '../components/ActivityMeta';
import { HomeQuotaBlock } from '../components/HomeQuotaBlock';
import { IconTicket } from '../components/Icons';
import { SignupStatusRow } from '../components/SignupStatusRow';
import { ActivityCoverOverlay, ActivitySideCopy } from '../components/StatusPill';
import {
  PC_MY_SIGNUPS_LIST_STYLE,
  SIGNUP_TABS,
  clientVisibleActivities,
  filterSignupsByTitle,
  groupClientSignups,
  signupCta,
  signupsForTab,
  type ClientSignupView,
  type SignupTabId,
} from '../model/clientActivity';
import { useUserSignups } from '../model/signupStore';
import { PcActivityShell } from './PcActivityShell';

function SignupDetails({ item }: { item: ClientSignupView }) {
  return <p className="c-pc-signup-type">报名类型：{item.signup.type}</p>;
}

function SignupCard({ item }: { item: ClientSignupView }) {
  const { activity } = item;

  if (!activity) {
    return (
      <article className="c-pc-signup-card is-invalid">
        <div className="c-pc-signup-card-body">
          <h3 className="c-pc-signup-title">活动已失效</h3>
          <SignupStatusRow auditStatus={item.signup.status} />
          <SignupDetails item={item} />
        </div>
      </article>
    );
  }

  const cta = signupCta(activity, true);
  return (
    <button
      className={`c-pc-card c-card-btn is-${PC_MY_SIGNUPS_LIST_STYLE}`}
      type="button"
      aria-label={`活动 ${activity.title}`}
      onClick={() => goCEnd('pc', activity.id)}
    >
      <div className="c-cover is-side is-contain">
        {activity.coverUrl ? <img src={activity.coverUrl} alt="" /> : null}
        <ActivityCoverOverlay activity={activity} variant="home" layout={PC_MY_SIGNUPS_LIST_STYLE} />
      </div>
      <div className="c-pc-card-body">
        <ActivitySideCopy activity={activity} />
        <ActivityMeta activity={activity} compact hidePlace />
        <HomeQuotaBlock
          activity={activity}
          ctaLabel={cta.label}
          ctaEnabled={cta.enabled}
          signedUp
          compact
        />
      </div>
    </button>
  );
}

export function PcSignupGroup({
  title,
  items,
}: {
  title: (typeof SIGNUP_TABS)[number]['label'];
  items: ClientSignupView[];
}) {
  if (items.length === 0) return null;

  return (
    <ul className={`c-pc-grid is-${PC_MY_SIGNUPS_LIST_STYLE}`} aria-label={`${title}报名`}>
      {items.map((item) => (
        <li key={`${item.signup.activityId}-${item.signup.createdAt}`}>
          <SignupCard item={item} />
        </li>
      ))}
    </ul>
  );
}

export function PcMySignups({
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
  const goHome = () => goCEnd('pc');
  const items = filterSignupsByTitle(signupsForTab(groups, tab), query);
  const activeTab = SIGNUP_TABS.find((item) => item.id === tab) ?? SIGNUP_TABS[0];
  const emptyCopy = query.trim() ? '未找到相关活动' : activeTab.empty;

  return (
    <PcActivityShell title="我的活动">
      <button className="c-back-link" type="button" onClick={goHome}>
        ← 返回列表
      </button>
      {signups.length === 0 ? (
        <div className="c-pc-signup-empty">
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
            className="c-pc-signup-search"
            type="search"
            value={query}
            placeholder="搜索活动名称"
            aria-label="搜索活动名称"
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="c-tabs c-pc-signup-tabs" role="group" aria-label="报名分组">
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
            <PcSignupGroup title={activeTab.label} items={items} />
          )}
        </>
      )}
    </PcActivityShell>
  );
}
