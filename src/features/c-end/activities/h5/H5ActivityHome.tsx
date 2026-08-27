import { useMemo, useState } from 'react';
import { useActivities } from '../../../activities/model/activityStore';
import { useAllMoments } from '../../../activities/model/momentStore';
import { goCEnd, goCEndActivityList, goCEndPastMoments, goCEndPortal } from '../../../../app/navigation';
import {
  CLIENT_TABS,
  filterActivitiesByTitle,
  filterByTab,
  HOME_ACTIVITY_PREVIEW_LIMIT,
  pastHighlightMoments,
  useLiveSocial,
  type ClientTabId,
} from '../model/clientActivity';
import { useUserSignups } from '../model/signupStore';
import { H5ActivityListCard, MomentPastCard } from './H5ActivityCards';
import { H5ActivityShell } from './H5ActivityShell';

const CATALOG_ID = 'h5-activity-catalog';

export function H5ActivityHome({
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
  const list = preview ? filtered.slice(0, HOME_ACTIVITY_PREVIEW_LIMIT) : filtered;
  const past = preview ? pastHighlightMoments(moments, activities) : [];
  const emptyCopy = query.trim() ? '未找到相关活动' : '暂无相关活动';

  return (
    <H5ActivityShell
      title={preview ? '员工活动' : '全部活动'}
      onBack={preview ? goCEndPortal : () => goCEnd('h5')}
      overlay={
        <nav className="c-h5-detail-fab is-home" aria-label="页面导航">
          <button type="button" onClick={goCEndPortal}>
            回主页
          </button>
        </nav>
      }
    >
      <section id={CATALOG_ID} className="c-h5-section c-h5-catalog">
        <input
          className="c-h5-catalog-search"
          type="search"
          value={query}
          placeholder="搜索活动名称"
          aria-label="搜索活动名称"
          onChange={(event) => setQuery(event.target.value)}
        />
        <h2 className="c-catalog-title">活动</h2>
        <div className="c-catalog-toolbar">
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
          {preview ? (
            <div className="c-catalog-more">
              <button type="button" onClick={() => goCEndActivityList('h5')}>
                查看全部
              </button>
            </div>
          ) : null}
        </div>
        {list.length === 0 ? (
          <p className="c-empty">{emptyCopy}</p>
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
      {past.length > 0 ? (
        <section className="c-past-sec" aria-labelledby="h5-past-title">
          <div className="c-past-head">
            <h2 id="h5-past-title" className="c-past-title">
              往期精彩回顾
            </h2>
            <div className="c-catalog-more">
              <button type="button" onClick={() => goCEndPastMoments('h5')}>
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
    </H5ActivityShell>
  );
}
