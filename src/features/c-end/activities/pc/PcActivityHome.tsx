import { useMemo, useState } from 'react';
import { useActivities } from '../../../activities/model/activityStore';
import { goCEnd } from '../../../../app/navigation';
import { ActivityMeta } from '../components/ActivityMeta';
import { SocialRow } from '../components/SocialRow';
import { StatusPill } from '../components/StatusPill';
import {
  CLIENT_TABS,
  filterByTab,
  signupCta,
  toClientActivity,
  useLiveSocial,
  type ClientTabId,
} from '../model/clientActivity';
import { useUserSignups } from '../model/signupStore';
import { PcActivityShell } from './PcActivityShell';

const CATALOG_ID = 'pc-activity-catalog';

export function PcActivityHome() {
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
    <PcActivityShell>
      <section id={CATALOG_ID} className="c-pc-section c-catalog">
        <div className="c-catalog-bar">
          <div className="c-tabs" role="tablist" aria-label="活动分类">
            {CLIENT_TABS.map((item) => {
              const active = item.id === tab;
              return (
                <button
                  key={item.id}
                  className={`c-tab${active ? ' is-active' : ''}`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(item.id)}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
        {list.length === 0 ? (
          <p className="c-empty">暂无相关活动</p>
        ) : (
          <ul className="c-pc-grid" aria-label="活动列表">
            {list.map((activity) => {
              const cta = signupCta(activity, signedIds.has(activity.id));
              return (
                <li key={activity.id}>
                  <button
                    className="c-pc-card c-card-btn"
                    type="button"
                    aria-label={`活动 ${activity.title}`}
                    onClick={() => goCEnd('pc', activity.id)}
                  >
                    <div className="c-cover">
                      {activity.coverUrl ? <img src={activity.coverUrl} alt="" /> : null}
                      <span className="c-cover-type">{activity.category}</span>
                    </div>
                    <div className="c-pc-card-body">
                      <div className="c-title-row">
                        <div className="c-card-title">{activity.title}</div>
                        {activity.pinned ? <span className="c-pin">置顶</span> : null}
                      </div>
                      <ActivityMeta activity={activity} compact />
                      <SocialRow activity={toClientActivity(activity)} />
                      <div className="c-pc-card-foot">
                        <StatusPill status={activity.activityStatus} />
                        <span className={`c-card-action${cta.enabled ? '' : ' is-disabled'}${signedIds.has(activity.id) ? ' is-signed' : ''}`}>
                          {cta.label}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </PcActivityShell>
  );
}
