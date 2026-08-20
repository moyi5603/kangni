import { useMemo, useState } from 'react';
import { useActivities } from '../../../activities/model/activityStore';
import { goCEnd, goCEndPortal, goH5Favorites, goH5MySignups } from '../../../../app/navigation';
import { ActivityMeta } from '../components/ActivityMeta';
import { IconChevronRight } from '../components/Icons';
import { SignupStatusRow } from '../components/SignupStatusRow';
import {
  CLIENT_TABS,
  HOME_MINE_TABS,
  HOME_SIGNUP_PREVIEW_LIMIT,
  clientVisibleActivities,
  filterByTab,
  groupClientSignups,
  hasHomeFavoritesPane,
  hasHomeSignupsPane,
  homeMineMode,
  previewFavorites,
  useLiveSocial,
  type ClientSignupView,
  type ClientTabId,
  type HomeMinePane,
} from '../model/clientActivity';
import { useFavoriteActivityIds } from '../model/engagementStore';
import { useUserSignups } from '../model/signupStore';
import { H5ActivityListCard } from './H5ActivityCards';
import { H5ActivityShell } from './H5ActivityShell';

const CATALOG_ID = 'h5-activity-catalog';

function SignupThumb({ coverUrl }: { coverUrl: string }) {
  return (
    <span className="c-signup-thumb" aria-hidden>
      <span className="c-cover-fallback" />
      {coverUrl ? (
        <img
          src={coverUrl}
          alt=""
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      ) : null}
    </span>
  );
}

function HomeSignupPreviewCard({ item }: { item: ClientSignupView }) {
  const { activity, signup } = item;
  if (!activity) return null;

  return (
    <button
      className="c-h5-signup-card c-h5-card-button is-preview"
      type="button"
      onClick={() => goCEnd('h5', activity.id)}
    >
      <SignupThumb coverUrl={activity.coverUrl} />
      <div className="c-h5-signup-card-body">
        <h3 className="c-h5-signup-title">{activity.title}</h3>
        <SignupStatusRow activityStatus={activity.activityStatus} auditStatus={signup.status} />
        <ActivityMeta activity={activity} compact />
      </div>
      <IconChevronRight />
    </button>
  );
}

export function H5ActivityHome({
  initialMineTab = 'signups',
}: {
  initialMineTab?: HomeMinePane;
} = {}) {
  useLiveSocial();
  const activities = useActivities();
  const signups = useUserSignups();
  const favoriteIds = useFavoriteActivityIds();
  const [tab, setTab] = useState<ClientTabId>('all');
  const [mineTab, setMineTab] = useState<HomeMinePane>(initialMineTab);
  const signedIds = useMemo(
    () => new Set(signups.map((signup) => signup.activityId)),
    [signups],
  );
  const list = useMemo(() => filterByTab(activities, tab), [activities, tab]);
  const groups = useMemo(
    () => groupClientSignups(signups, clientVisibleActivities(activities)),
    [activities, signups],
  );
  const preview = groups.upcoming.slice(0, HOME_SIGNUP_PREVIEW_LIMIT);
  const favoritePreview = useMemo(
    () => previewFavorites(favoriteIds, activities),
    [favoriteIds, activities],
  );
  const mode = homeMineMode(
    hasHomeSignupsPane(signups),
    hasHomeFavoritesPane(favoritePreview),
  );
  const pane: HomeMinePane =
    mode === 'favorites' || (mode === 'tabs' && mineTab === 'favorites')
      ? 'favorites'
      : 'signups';
  const showViewAll =
    pane === 'favorites'
      ? true
      : groups.upcoming.length > HOME_SIGNUP_PREVIEW_LIMIT || groups.ended.length > 0;

  return (
    <H5ActivityShell title="员工活动" onBack={goCEndPortal}>
      {mode !== 'hidden' ? (
        <section className="c-h5-section c-h5-mine">
          <div className="c-h5-section-head">
            {mode === 'tabs' ? (
              <div className="c-tabs c-h5-mine-tabs" role="tablist" aria-label="我的活动与收藏">
                {HOME_MINE_TABS.map((item) => {
                  const active = item.id === pane;
                  return (
                    <button
                      key={item.id}
                      className={`c-tab${active ? ' is-active' : ''}`}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setMineTab(item.id)}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <h2 className="c-section-title">{mode === 'favorites' ? '我的收藏' : '我的活动'}</h2>
            )}
            {showViewAll ? (
              <button
                className="c-h5-section-more"
                type="button"
                onClick={pane === 'favorites' ? goH5Favorites : goH5MySignups}
              >
                查看全部
              </button>
            ) : null}
          </div>
          {pane === 'signups' ? (
            preview.length === 0 ? (
              <p className="c-empty">暂无待参加活动</p>
            ) : (
              <ul className="c-h5-list" aria-label="待参加活动">
                {preview.map((item) =>
                  item.activity ? (
                    <li key={`${item.signup.activityId}-${item.signup.createdAt}`}>
                      <HomeSignupPreviewCard item={item} />
                    </li>
                  ) : null,
                )}
              </ul>
            )
          ) : (
            <ul className="c-h5-list" aria-label="收藏的活动">
              {favoritePreview.map((item) =>
                item.activity ? (
                  <li key={item.activityId}>
                    <button
                      className="c-h5-fav-card c-h5-card-button is-preview"
                      type="button"
                      onClick={() => goCEnd('h5', item.activity!.id)}
                    >
                      <SignupThumb coverUrl={item.activity.coverUrl} />
                      <div className="c-h5-signup-card-body">
                        <h3 className="c-h5-signup-title">{item.activity.title}</h3>
                        <SignupStatusRow activityStatus={item.activity.activityStatus} />
                        <ActivityMeta activity={item.activity} compact />
                      </div>
                      <IconChevronRight />
                    </button>
                  </li>
                ) : null,
              )}
            </ul>
          )}
        </section>
      ) : null}

      <section id={CATALOG_ID} className="c-h5-section c-h5-catalog">
        <div className="c-h5-section-head">
          <h2 className="c-section-title">发现活动</h2>
        </div>
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
