import { goH5Back, goCEnd } from '../../../../app/navigation';
import { useActivities } from '../../../activities/model/activityStore';
import { useActivityDecoration } from '../../../activities/model/activityDecorationStore';
import { H5ActivityShell } from '../h5/H5ActivityShell';
import { listPastHighlightActivities } from '../model/clientActivity';
import { PcActivityShell } from '../pc/PcActivityShell';
import { decoPastAllListStyle } from '../../../../shared/decoration/decoTypes';
import { decoActivityCardFields } from '../../../../shared/decoration/decoCardFields';
import { PastHighlightList, type HomeSurface } from './ActivityHomeLayout';

function PastActivitiesList({ surface }: { surface: HomeSurface }) {
  const activities = useActivities();
  const layout = useActivityDecoration(surface === 'pc' ? 'pc' : 'mobile');
  const moments = layout.blocks.find((item) => item.type === 'moments');
  const homeStyle = moments?.listStyle ?? 'scroll';
  const style = decoPastAllListStyle(homeStyle);
  const list = listPastHighlightActivities(activities);

  return (
    <section className="c-past-sec">
      <PastHighlightList
        activities={list}
        style={style}
        surface={surface}
        columnCount={homeStyle === 'scroll' ? 2 : moments?.columnCount}
        fields={decoActivityCardFields(moments)}
      />
    </section>
  );
}

export function H5PastMomentsPage() {
  return (
    <H5ActivityShell
      title="往期精彩回顾"
      onBack={goH5Back}
    >
      <PastActivitiesList surface="h5" />
    </H5ActivityShell>
  );
}

export function PcPastMomentsPage() {
  return (
    <PcActivityShell title="往期精彩回顾">
      <button className="c-back-link" type="button" onClick={() => goCEnd('pc')}>
        ← 返回首页
      </button>
      <PastActivitiesList surface="pc" />
    </PcActivityShell>
  );
}
