export function ActivityDeleteConfirm({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="c-signup-form">
      <p className="c-signup-legend">删除评论</p>
      <p>删除后将同时删除其下回复，且无法恢复。</p>
      <div className="c-signup-actions">
        <button className="c-btn c-btn-primary" type="button" onClick={onConfirm}>
          确认删除
        </button>
        <button className="c-btn c-btn-ghost" type="button" onClick={onCancel}>
          取消
        </button>
      </div>
    </div>
  );
}
