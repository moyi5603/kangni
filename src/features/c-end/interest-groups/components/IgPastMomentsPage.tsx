import { goH5Back, goPcInterestGroups } from '../../../../app/navigation';
import { H5ActivityShell } from '../../activities/h5/H5ActivityShell';
import { PcActivityShell } from '../../activities/pc/PcActivityShell';
import { IgProvider } from '../h5/IgContext';
import { IgPastMomentsCatalog } from '../h5/IgScreens';
import '../h5/groupHome.css';

export function H5IgPastMomentsPage() {
  return (
    <IgProvider surface="h5">
      <H5ActivityShell className="is-ig" title="往期精彩回顾" onBack={goH5Back}>
        <div className="c-ig-stack-pad">
          <IgPastMomentsCatalog />
        </div>
      </H5ActivityShell>
    </IgProvider>
  );
}

export function PcIgPastMomentsPage() {
  return (
    <IgProvider surface="pc">
      <PcActivityShell className="is-ig" title="往期精彩回顾">
        <div className="c-pc-ig-home">
          <button className="c-back-link" type="button" onClick={goPcInterestGroups}>
            ← 返回首页
          </button>
          <section className="c-past-sec">
            <IgPastMomentsCatalog />
          </section>
        </div>
      </PcActivityShell>
    </IgProvider>
  );
}
