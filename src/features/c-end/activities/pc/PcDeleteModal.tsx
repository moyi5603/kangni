import { ActivityDeleteConfirm } from '../components/ActivityDeleteConfirm';

export function PcDeleteModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="c-modal-backdrop" onClick={onCancel} role="presentation">
      <div
        className="c-modal"
        role="dialog"
        aria-modal="true"
        aria-label="删除评论"
        onClick={(event) => event.stopPropagation()}
      >
        <ActivityDeleteConfirm onCancel={onCancel} onConfirm={onConfirm} />
      </div>
    </div>
  );
}
