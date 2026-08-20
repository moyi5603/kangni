import { useMemo } from 'react';
import { useActivities } from '../../../activities/model/activityStore';
import { goCEnd } from '../../../../app/navigation';
import { ActivityMeta } from '../components/ActivityMeta';
import { IconChevronRight, IconStar } from '../components/Icons';
import { SignupStatusRow } from '../components/SignupStatusRow';
import { favoriteViews } from '../model/clientActivity';
import { useFavoriteActivityIds } from '../model/engagementStore';
import { H5ActivityShell } from './H5ActivityShell';

function FavThumb({ coverUrl }: { coverUrl: string }) {
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

export function H5MyFavorites() {
  const activities = useActivities();
  const ids = useFavoriteActivityIds();
  const views = useMemo(() => favoriteViews(ids, activities), [ids, activities]);
  const goHome = () => goCEnd('h5');

  return (
    <H5ActivityShell title="我的收藏" onBack={goHome}>
      {ids.length === 0 ? (
        <div className="c-h5-signup-empty">
          <IconStar />
          <h2>还没有收藏活动</h2>
          <p>去发现活动里看看有什么值得收藏</p>
          <button className="c-btn c-btn-primary" type="button" onClick={goHome}>
            去看看活动
          </button>
        </div>
      ) : (
        <ul className="c-h5-list" aria-label="我的收藏">
          {views.map((item) => (
            <li key={item.activityId}>
              {item.activity ? (
                <button
                  className="c-h5-fav-card c-h5-card-button"
                  type="button"
                  onClick={() => goCEnd('h5', item.activity!.id)}
                >
                  <FavThumb coverUrl={item.activity.coverUrl} />
                  <div className="c-h5-signup-card-body">
                    <h3 className="c-h5-signup-title">{item.activity.title}</h3>
                    <SignupStatusRow activityStatus={item.activity.activityStatus} />
                    <ActivityMeta activity={item.activity} compact />
                  </div>
                  <IconChevronRight />
                </button>
              ) : (
                <article className="c-h5-fav-card is-invalid">
                  <div className="c-h5-signup-card-body">
                    <h3 className="c-h5-signup-title">活动已失效</h3>
                  </div>
                </article>
              )}
            </li>
          ))}
        </ul>
      )}
    </H5ActivityShell>
  );
}
