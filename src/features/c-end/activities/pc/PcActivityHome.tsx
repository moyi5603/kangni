import { useMemo, useState } from 'react';
import { useActivities } from '../../../activities/model/activityStore';
import { goCEnd, goPcFavorites, goPcMySignups } from '../../../../app/navigation';
import { ActivityMeta } from '../components/ActivityMeta';
import { IconChevronRight } from '../components/Icons';
import { SignupStatusRow } from '../components/SignupStatusRow';
import { SocialRow } from '../components/SocialRow';
import { StatusPill } from '../components/StatusPill';
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
  signupCta,
  toClientActivity,
  useLiveSocial,
  type ClientSignupView,
  type ClientTabId,
  type HomeMinePane,
} from '../model/clientActivity';
import { useFavoriteActivityIds } from '../model/engagementStore';
import { useUserSignups } from '../model/signupStore';
import { PcActivityShell } from './PcActivityShell';

const CATALOG_ID = 'pc-activity-catalog';

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
      className="c-pc-signup-card c-card-btn is-preview"
      type="button"
      onClick={() => goCEnd('pc', activity.id)}
    >
      <SignupThumb coverUrl={activity.coverUrl} />
      <div className="c-pc-signup-card-body">
        <h3 className="c-pc-signup-title">{activity.title}</h3>
        <SignupStatusRow activityStatus={activity.activityStatus} auditStatus={signup.status} />
        <ActivityMeta activity={activity} compact />
      </div>
      <IconChevronRight />
    </button>
  );
}

export function PcActivityHome({
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
    <PcActivityShell>
      {mode !== 'hidden' ? (
        <section className="c-pc-section c-pc-mine">
          <div className="c-pc-section-head">
            {mode === 'tabs' ? (
              <div className="c-tabs c-pc-mine-tabs" role="tablist" aria-label="我的活动与收藏">
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
                className="c-pc-section-more"
                type="button"
                onClick={pane === 'favorites' ? goPcFavorites : goPcMySignups}
              >
                查看全部
              </button>
            ) : null}
          </div>
          {pane === 'signups' ? (
            preview.length === 0 ? (
              <p className="c-empty">暂无待参加活动</p>
            ) : (
              <ul className="c-pc-preview-list" aria-label="待参加活动">
                {preview.map((item) => (
                  <li key={`${item.signup.activityId}-${item.signup.createdAt}`}>
                    <HomeSignupPreviewCard item={item} />
                  </li>
                ))}
              </ul>
            )
          ) : (
            <ul className="c-pc-preview-list" aria-label="收藏的活动">
              {favoritePreview.map((item) =>
                item.activity ? (
                  <li key={item.activityId}>
                    <button
                      className="c-pc-fav-card c-card-btn is-preview"
                      type="button"
                      onClick={() => goCEnd('pc', item.activity!.id)}
                    >
                      <SignupThumb coverUrl={item.activity.coverUrl} />
                      <div className="c-pc-signup-card-body">
                        <h3 className="c-pc-signup-title">{item.activity.title}</h3>
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

      <section id={CATALOG_ID} className="c-pc-section c-catalog">
        <div className="c-pc-section-head">
          <h2 className="c-section-title">发现活动</h2>
        </div>
        <div className="c-catalog-bar">
          <div className="c-tabs" role="tablist" aria-label="活动类型">
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
                      <span className="c-cover-type">{activity.type}</span>
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
