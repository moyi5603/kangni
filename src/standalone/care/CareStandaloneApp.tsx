import { StandaloneAdminApp } from '../StandaloneAdminApp';
import { CareOverviewPage } from '../../features/care/pages/CareOverviewPage';
import { CareRuleListPage } from '../../features/care/pages/CareRuleListPage';
import { CareRuleFormPage } from '../../features/care/pages/CareRuleFormPage';
import { CareRecordListPage } from '../../features/care/pages/CareRecordListPage';
import { CareTemplateListPage } from '../../features/care/pages/CareTemplateListPage';
import { CareTemplateFormPage } from '../../features/care/pages/CareTemplateFormPage';
import { CareTemplateDetailPage } from '../../features/care/pages/CareTemplateDetailPage';
import { CareSettingsPage } from '../../features/care/pages/CareSettingsPage';
import { PlaceholderPage } from '../../features/shell/pages/PlaceholderPage';

export function CareStandaloneApp() {
  return (
    <StandaloneAdminApp
      applicationKey="care"
      renderPage={(page, recordId, goToPage) => {
        if (page === 'care-overview') return <CareOverviewPage onNavigate={goToPage} />;
        if (page === 'care-rules') return <CareRuleListPage onNavigate={goToPage} />;
        if (page === 'care-rule-create' || page === 'care-rule-edit') {
          return (
            <CareRuleFormPage
              key={`${page}-${recordId ?? 'new'}`}
              mode={page === 'care-rule-edit' ? 'edit' : 'create'}
              recordId={recordId}
              onBack={() => goToPage('care-rules')}
              onSaved={() => goToPage('care-rules')}
            />
          );
        }
        if (page === 'care-records') return <CareRecordListPage />;
        if (page === 'care-templates') return <CareTemplateListPage onNavigate={goToPage} />;
        if (page === 'care-template-create' || page === 'care-template-edit') {
          return (
            <CareTemplateFormPage
              key={`${page}-${recordId ?? 'new'}`}
              mode={page === 'care-template-edit' ? 'edit' : 'create'}
              recordId={recordId}
              onBack={() => goToPage('care-templates')}
              onSaved={() => goToPage('care-templates')}
            />
          );
        }
        if (page === 'care-template-detail') {
          return (
            <CareTemplateDetailPage
              recordId={recordId}
              onBack={() => goToPage('care-templates')}
              onEdit={(id) => goToPage('care-template-edit', id)}
            />
          );
        }
        if (page === 'care-settings') return <CareSettingsPage />;
        return (
          <PlaceholderPage
            breadcrumbItems={[{ title: '员工关怀' }]}
            title="员工关怀"
            applicationLabel="员工关怀"
          />
        );
      }}
    />
  );
}
