import { IgProvider } from '../h5/IgContext';
import { InterestGroupHome } from '../h5/H5InterestGroupHome';
import '../h5/groupHome.css';

export function PcInterestGroupHome() {
  return (
    <IgProvider>
      <InterestGroupHome surface="pc" />
    </IgProvider>
  );
}
