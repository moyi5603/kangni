import { ActivityDeleteConfirm } from '../components/ActivityDeleteConfirm';

export function H5DeleteSheet({
  title = '删除评论',
  description,
  onCancel,
  onConfirm,
}: {
  title?: string;
  description?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="c-sheet-backdrop" onClick={onCancel} role="presentation">
      <div
        className="c-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <ActivityDeleteConfirm title={title} description={description} onCancel={onCancel} onConfirm={onConfirm} />
      </div>
    </div>
  );
}
