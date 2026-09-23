import { StandaloneAdminApp } from '../StandaloneAdminApp';
import { IncentiveDashboardPage } from '../../features/incentive/pages/IncentiveDashboardPage';
import { IncentiveBadgeListPage } from '../../features/incentive/pages/IncentiveBadgeListPage';
import { IncentiveBadgeFormPage } from '../../features/incentive/pages/IncentiveBadgeFormPage';
import { IncentiveRecordListPage } from '../../features/incentive/pages/IncentiveRecordListPage';
import { IncentiveSettingsPage } from '../../features/incentive/pages/IncentiveSettingsPage';
import { PlaceholderPage } from '../../features/shell/pages/PlaceholderPage';

export function IncentiveStandaloneApp() {
  return (
    <StandaloneAdminApp
      applicationKey="incentive"
      renderPage={(page, recordId, goToPage) => {
        if (page === 'incentive-dashboard') return <IncentiveDashboardPage onNavigate={goToPage} />;
        if (page === 'incentive-badges') return <IncentiveBadgeListPage onNavigate={goToPage} />;
        if (page === 'incentive-badge-create' || page === 'incentive-badge-edit') {
          return (
            <IncentiveBadgeFormPage
              key={`${page}-${recordId ?? 'new'}`}
              mode={page === 'incentive-badge-edit' ? 'edit' : 'create'}
              recordId={recordId}
              onBack={() => goToPage('incentive-badges')}
              onSaved={() => goToPage('incentive-badges')}
            />
          );
        }
        if (page === 'incentive-records') return <IncentiveRecordListPage />;
        if (page === 'incentive-settings') return <IncentiveSettingsPage />;
        return (
          <PlaceholderPage
            breadcrumbItems={[{ title: '即时激励' }]}
            title="即时激励"
            applicationLabel="即时激励"
          />
        );
      }}
    />
  );
}
