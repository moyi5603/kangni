import { useMemo, useState } from 'react';
import { useActivities } from '../../../activities/model/activityStore';
import { goH5Back } from '../../../../app/navigation';
import { useActivityDecoration } from '../../../activities/model/activityDecorationStore';
import { decoActivityCardFields } from '../../../../shared/decoration/decoCardFields';
import { ActivitySearchBar, ActivitySearchResults } from '../components/ActivitySearchBar';
import { ActivityHomePreviewBlocks, ActivityStyleList } from '../components/ActivityHomeLayout';
import {
  CLIENT_TABS,
  filterActivitiesByTitle,
  filterByTab,
  HOME_ACTIVITY_PREVIEW_LIMIT,
  useLiveSocial,
  type ClientTabId,
} from '../model/clientActivity';
import { useUserSignups } from '../model/signupStore';
import { usePreviewList } from '../../portal/emptyPreview';
import { H5ActivityShell } from './H5ActivityShell';

const CATALOG_ID = 'h5-activity-catalog';

export function H5ActivityHome({
  initialQuery = '',
  variant = 'preview',
}: {
  initialQuery?: string;
  variant?: 'preview' | 'all' | 'search';
} = {}) {
  useLiveSocial();
  const activities = usePreviewList(useActivities());
  const layout = useActivityDecoration('mobile');
  const signups = useUserSignups();
  const [tab, setTab] = useState<ClientTabId>('all');
  const [query, setQuery] = useState(initialQuery);
  const signedIds = useMemo(
    () => new Set(signups.map((signup) => signup.activityId)),
    [signups],
  );
  const searching = variant === 'search';
  const filtered = useMemo(
    () => filterActivitiesByTitle(filterByTab(activities, searching ? 'all' : tab), searching || variant === 'all' ? query : ''),
    [activities, tab, query, searching, variant],
  );
  const preview = variant === 'preview';
  const list = preview ? filtered.slice(0, HOME_ACTIVITY_PREVIEW_LIMIT) : filtered;
  const emptyCopy = variant === 'all' && query.trim() ? '未找到相关活动' : '暂无相关活动';
  const title = preview ? layout.pageTitle : searching ? '搜索' : '全部活动';
  const activityBlock = layout.blocks.find((item) => item.type === 'activity');
  const activityStyle = activityBlock?.listStyle ?? 'large-image';
  const activityFields = decoActivityCardFields(activityBlock);

  if (searching) {
    return (
      <H5ActivityShell
        title="搜索"
        onBack={goH5Back}
        headerExtra={<ActivitySearchBar value={query} onChange={setQuery} />}
      >
        <ActivitySearchResults query={query} activities={filterByTab(activities, 'all')} surface="h5" />
      </H5ActivityShell>
    );
  }

  return (
    <H5ActivityShell
      title={title}
      onBack={goH5Back}
    >
      {preview ? (
        <ActivityHomePreviewBlocks
          layout={layout}
          surface="h5"
          activities={activities}
          signedIds={signedIds}
          tab={tab}
          onTab={setTab}
          searchClassName="c-h5-catalog-search"
        />
      ) : (
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
          </div>
          {list.length === 0 ? (
            <p className="c-empty">{emptyCopy}</p>
          ) : (
            <ActivityStyleList
              activities={list}
              style={activityStyle}
              surface="h5"
              signedIds={signedIds}
              fields={activityFields}
            />
          )}
        </section>
      )}
    </H5ActivityShell>
  );
}
