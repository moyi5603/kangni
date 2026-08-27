import { useMemo } from 'react';
import { useActivities } from '../../../activities/model/activityStore';
import { useAllMoments } from '../../../activities/model/momentStore';
import { goCEnd, goCEndPortal } from '../../../../app/navigation';
import { listPastHighlightMoments } from '../model/clientActivity';
import { H5ActivityShell } from '../h5/H5ActivityShell';
import { PcActivityShell } from '../pc/PcActivityShell';
import { MomentCard } from './MomentFeed';

function PastMomentsList({ surface }: { surface: 'h5' | 'pc' }) {
  const activities = useActivities();
  const moments = useAllMoments();
  const titles = useMemo(() => new Map(activities.map((item) => [item.id, item.title])), [activities]);
  const list = listPastHighlightMoments(moments, activities);

  if (list.length === 0) return <p className="c-empty">暂无精彩瞬间</p>;

  return (
    <section className="c-moment-feed" aria-label="往期精彩回顾">
      {list.map((moment) => (
        <MomentCard key={moment.id} moment={moment} surface={surface} activityTitle={titles.get(moment.activityId)} />
      ))}
    </section>
  );
}

export function H5PastMomentsPage() {
  return (
    <H5ActivityShell
      title="往期精彩回顾"
      onBack={() => goCEnd('h5')}
      overlay={
        <nav className="c-h5-detail-fab is-home" aria-label="页面导航">
          <button type="button" onClick={goCEndPortal}>
            回主页
          </button>
        </nav>
      }
    >
      <PastMomentsList surface="h5" />
    </H5ActivityShell>
  );
}

export function PcPastMomentsPage() {
  return (
    <PcActivityShell title="往期精彩回顾">
      <button className="c-back-link" type="button" onClick={() => goCEnd('pc')}>
        ← 返回首页
      </button>
      <PastMomentsList surface="pc" />
    </PcActivityShell>
  );
}
