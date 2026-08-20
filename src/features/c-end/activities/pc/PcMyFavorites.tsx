import { useMemo } from 'react';
import { useActivities } from '../../../activities/model/activityStore';
import { goCEnd } from '../../../../app/navigation';
import { ActivityMeta } from '../components/ActivityMeta';
import { IconChevronRight, IconStar } from '../components/Icons';
import { SignupStatusRow } from '../components/SignupStatusRow';
import { favoriteViews } from '../model/clientActivity';
import { useFavoriteActivityIds } from '../model/engagementStore';
import { PcActivityShell } from './PcActivityShell';

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

export function PcMyFavorites() {
  const activities = useActivities();
  const ids = useFavoriteActivityIds();
  const views = useMemo(() => favoriteViews(ids, activities), [ids, activities]);
  const goHome = () => goCEnd('pc');

  return (
    <PcActivityShell>
      <button className="c-back-link" type="button" onClick={goHome}>
        ← 返回列表
      </button>
      {ids.length === 0 ? (
        <div className="c-pc-signup-empty">
          <IconStar />
          <h2>还没有收藏活动</h2>
          <p>去发现活动里看看有什么值得收藏</p>
          <button className="c-btn c-btn-primary" type="button" onClick={goHome}>
            去看看活动
          </button>
        </div>
      ) : (
        <ul className="c-pc-preview-list" aria-label="我的收藏">
          {views.map((item) => (
            <li key={item.activityId}>
              {item.activity ? (
                <button
                  className="c-pc-fav-card c-card-btn"
                  type="button"
                  onClick={() => goCEnd('pc', item.activity!.id)}
                >
                  <FavThumb coverUrl={item.activity.coverUrl} />
                  <div className="c-pc-signup-card-body">
                    <h3 className="c-pc-signup-title">{item.activity.title}</h3>
                    <SignupStatusRow activityStatus={item.activity.activityStatus} />
                    <ActivityMeta activity={item.activity} compact />
                  </div>
                  <IconChevronRight />
                </button>
              ) : (
                <article className="c-pc-fav-card is-invalid">
                  <div className="c-pc-signup-card-body">
                    <h3 className="c-pc-signup-title">活动已失效</h3>
                  </div>
                </article>
              )}
            </li>
          ))}
        </ul>
      )}
    </PcActivityShell>
  );
}
