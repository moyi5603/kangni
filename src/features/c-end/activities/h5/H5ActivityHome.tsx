import { useMemo, useState } from 'react';
import { useActivities } from '../../../activities/model/activityStore';
import { goCEnd, goCEndPortal } from '../../../../app/navigation';
import {
  CLIENT_TABS,
  filterByTab,
  useLiveSocial,
  type ClientTabId,
} from '../model/clientActivity';
import { useUserSignups } from '../model/signupStore';
import { H5ActivityListCard } from './H5ActivityCards';
import { H5ActivityShell } from './H5ActivityShell';

const CATALOG_ID = 'h5-activity-catalog';

export function H5ActivityHome() {
  useLiveSocial();
  const activities = useActivities();
  const signups = useUserSignups();
  const [tab, setTab] = useState<ClientTabId>('all');
  const signedIds = useMemo(
    () => new Set(signups.map((signup) => signup.activityId)),
    [signups],
  );
  const list = useMemo(() => filterByTab(activities, tab), [activities, tab]);

  return (
    <H5ActivityShell
      title="员工活动"
      onBack={goCEndPortal}
      overlay={
        <nav className="c-h5-detail-fab is-home" aria-label="页面导航">
          <button type="button" onClick={goCEndPortal}>
            回主页
          </button>
        </nav>
      }
    >
      <section id={CATALOG_ID} className="c-h5-section c-h5-catalog">
        <div className="c-tabs" role="group" aria-label="活动分类">
          {CLIENT_TABS.map((item) => {
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
        {list.length === 0 ? (
          <p className="c-empty">暂无相关活动</p>
        ) : (
          <ul className="c-h5-list" aria-label="活动列表">
            {list.map((activity) => (
              <li key={activity.id}>
                <H5ActivityListCard
                  activity={activity}
                  signedUp={signedIds.has(activity.id)}
                  onOpen={() => goCEnd('h5', activity.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </H5ActivityShell>
  );
}
