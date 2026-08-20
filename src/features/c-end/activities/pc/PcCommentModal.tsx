import { ActivityCommentForm } from '../components/ActivityCommentForm';

export function PcCommentModal({
  title = '写评论',
  onCancel,
  onSubmit,
}: {
  title?: string;
  onCancel: () => void;
  onSubmit: (content: string) => void;
}) {
  return (
    <div className="c-modal-backdrop" onClick={onCancel} role="presentation">
      <div
        className="c-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <ActivityCommentForm title={title} onCancel={onCancel} onSubmit={onSubmit} />
      </div>
    </div>
  );
}
