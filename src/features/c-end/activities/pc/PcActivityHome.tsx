import { useMemo, useState } from 'react';
import { useActivities } from '../../../activities/model/activityStore';
import { goCEnd } from '../../../../app/navigation';
import { useActivityDecoration } from '../../../activities/model/activityDecorationStore';
import { decoActivityCardFields } from '../../../../shared/decoration/decoCardFields';
import { ActivitySearchBar, ActivitySearchResults } from '../components/ActivitySearchBar';
import { ActivityHomePreviewBlocks, ActivityStyleList } from '../components/ActivityHomeLayout';
import {
  CLIENT_TABS,
  filterActivitiesByTitle,
  filterByTab,
  useLiveSocial,
  type ClientTabId,
} from '../model/clientActivity';
import { useUserSignups } from '../model/signupStore';
import { usePreviewList } from '../../portal/emptyPreview';
import { PcActivityShell } from './PcActivityShell';

const CATALOG_ID = 'pc-activity-catalog';

export function PcActivityHome({
  initialQuery = '',
  variant = 'preview',
}: {
  initialQuery?: string;
  variant?: 'preview' | 'all' | 'search';
} = {}) {
  useLiveSocial();
  const activities = usePreviewList(useActivities());
  const layout = useActivityDecoration('pc');
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
  const list = filtered;
  const emptyCopy = variant === 'all' && query.trim() ? '未找到相关活动' : '暂无相关活动';
  const title = preview ? layout.pageTitle : searching ? '搜索' : '全部活动';
  const activityBlock = layout.blocks.find((item) => item.type === 'activity');
  const activityStyle = activityBlock?.listStyle ?? 'large-image';
  const activityCols = activityBlock?.columnCount;
  const activityFields = decoActivityCardFields(activityBlock);

  if (searching) {
    return (
      <PcActivityShell title="搜索">
        <button className="c-back-link" type="button" onClick={() => goCEnd('pc')}>
          ← 返回首页
        </button>
        <ActivitySearchBar value={query} onChange={setQuery} />
        <ActivitySearchResults query={query} activities={filterByTab(activities, 'all')} surface="pc" />
      </PcActivityShell>
    );
  }

  return (
    <PcActivityShell title={title}>
      {preview ? null : (
        <button className="c-back-link" type="button" onClick={() => goCEnd('pc')}>
          ← 返回首页
        </button>
      )}
      {preview ? (
        <ActivityHomePreviewBlocks
          layout={layout}
          surface="pc"
          activities={activities}
          signedIds={signedIds}
          tab={tab}
          onTab={setTab}
          searchClassName="c-pc-catalog-search"
        />
      ) : (
        <section id={CATALOG_ID} className="c-pc-section c-catalog">
          <div className="c-catalog-bar">
            <input
              className="c-pc-catalog-search"
              type="search"
              value={query}
              placeholder="搜索活动名称"
              aria-label="搜索活动名称"
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="c-catalog-title-row">
              <h2 className="c-catalog-title">活动</h2>
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
            </div>
          </div>
          {list.length === 0 ? (
            <p className="c-empty">{emptyCopy}</p>
          ) : (
            <ActivityStyleList
              activities={list}
              style={activityStyle}
              surface="pc"
              signedIds={signedIds}
              columnCount={activityCols}
              fields={activityFields}
            />
          )}
        </section>
      )}
    </PcActivityShell>
  );
}
