import { useMemo, useState } from 'react';
import { useActivities } from '../../../activities/model/activityStore';
import { useAllMoments } from '../../../activities/model/momentStore';
import { goCEnd, goCEndActivityList, goCEndPastMoments } from '../../../../app/navigation';
import { MomentPastCard } from '../h5/H5ActivityCards';
import { ActivityMeta } from '../components/ActivityMeta';
import { HomeQuotaBlock } from '../components/HomeQuotaBlock';
import { ActivityCoverOverlay } from '../components/StatusPill';
import {
  CLIENT_TABS,
  filterActivitiesByTitle,
  filterByTab,
  pastHighlightMoments,
  PC_ACTIVITY_PREVIEW_LIMIT,
  PC_PAST_HIGHLIGHT_LIMIT,
  signupCta,
  useLiveSocial,
  type ClientTabId,
} from '../model/clientActivity';
import { useUserSignups } from '../model/signupStore';
import { PcActivityShell } from './PcActivityShell';

const CATALOG_ID = 'pc-activity-catalog';

export function PcActivityHome({
  initialQuery = '',
  variant = 'preview',
}: {
  initialQuery?: string;
  variant?: 'preview' | 'all';
} = {}) {
  useLiveSocial();
  const activities = useActivities();
  const moments = useAllMoments();
  const signups = useUserSignups();
  const [tab, setTab] = useState<ClientTabId>('all');
  const [query, setQuery] = useState(initialQuery);
  const signedIds = useMemo(
    () => new Set(signups.map((signup) => signup.activityId)),
    [signups],
  );
  const filtered = useMemo(
    () => filterActivitiesByTitle(filterByTab(activities, tab), query),
    [activities, tab, query],
  );
  const preview = variant === 'preview';
  const list = preview ? filtered.slice(0, PC_ACTIVITY_PREVIEW_LIMIT) : filtered;
  const past = preview ? pastHighlightMoments(moments, activities, PC_PAST_HIGHLIGHT_LIMIT) : [];
  const emptyCopy = query.trim() ? '未找到相关活动' : '暂无相关活动';

  return (
    <PcActivityShell title={preview ? '员工活动' : '全部活动'}>
      {preview ? null : (
        <button className="c-back-link" type="button" onClick={() => goCEnd('pc')}>
          ← 返回首页
        </button>
      )}
      <section id={CATALOG_ID} className="c-pc-section c-catalog">
        <div className="c-catalog-bar">
          <div className="c-catalog-title-row">
            <h2 className="c-catalog-title">活动</h2>
            <input
              className="c-pc-catalog-search"
              type="search"
              value={query}
              placeholder="搜索活动名称"
              aria-label="搜索活动名称"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="c-catalog-toolbar">
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
            {preview ? (
              <div className="c-catalog-more">
                <button type="button" onClick={() => goCEndActivityList('pc')}>
                  查看全部
                </button>
              </div>
            ) : null}
          </div>
        </div>
        {list.length === 0 ? (
          <p className="c-empty">{emptyCopy}</p>
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
                      <ActivityCoverOverlay activity={activity} variant="home" />
                    </div>
                    <div className="c-pc-card-body">
                      <ActivityMeta activity={activity} compact />
                      <HomeQuotaBlock
                        activity={activity}
                        ctaLabel={cta.label}
                        ctaEnabled={cta.enabled}
                        signedUp={signedIds.has(activity.id)}
                      />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      {past.length > 0 ? (
        <section className="c-past-sec" aria-labelledby="pc-past-title">
          <div className="c-past-head">
            <h2 id="pc-past-title" className="c-past-title">
              往期精彩回顾
            </h2>
            <div className="c-catalog-more">
              <button type="button" onClick={() => goCEndPastMoments('pc')}>
                查看全部
              </button>
            </div>
          </div>
          <ul className="c-past-rail" aria-label="往期精彩回顾">
            {past.map((moment) => (
              <li key={moment.id}>
                <MomentPastCard moment={moment} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </PcActivityShell>
  );
}
