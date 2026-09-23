import { CareTemplateFormPage } from './CareTemplateFormPage';

export function CareTemplateDetailPage({
  recordId,
  onBack,
  onEdit,
}: {
  recordId?: string;
  onBack: () => void;
  onEdit: (id: string) => void;
}) {
  return <CareTemplateFormPage mode="view" recordId={recordId} onBack={onBack} onEdit={onEdit} />;
}
