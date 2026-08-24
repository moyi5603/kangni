export function SignupCancelConfirm({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="c-signup-form">
      <p className="c-signup-legend">取消报名</p>
      <p>取消后将释放名额，报名截止前可以再次报名。</p>
      <div className="c-signup-actions">
        <button className="c-btn c-btn-primary" type="button" onClick={onConfirm}>
          确认取消
        </button>
        <button className="c-btn c-btn-ghost" type="button" onClick={onCancel}>
          再想想
        </button>
      </div>
    </div>
  );
}

/** 取消报名二次确认：H5 / PC 均用居中弹窗 */
export function CancelSignupDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="c-modal-backdrop c-cancel-dialog-backdrop" onClick={onCancel} role="presentation">
      <div
        className="c-modal c-cancel-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="取消报名"
        onClick={(event) => event.stopPropagation()}
      >
        <SignupCancelConfirm onCancel={onCancel} onConfirm={onConfirm} />
      </div>
    </div>
  );
}
