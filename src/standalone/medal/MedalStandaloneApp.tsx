import { StandaloneAdminApp } from '../StandaloneAdminApp';
import { MedalListPage } from '../../features/medal/pages/MedalListPage';

export function MedalStandaloneApp() {
  return (
    <StandaloneAdminApp
      applicationKey="medal"
      renderPage={(page, recordId, goToPage) => (
        <MedalListPage page={page} recordId={recordId} onNavigate={goToPage} />
      )}
    />
  );
}
