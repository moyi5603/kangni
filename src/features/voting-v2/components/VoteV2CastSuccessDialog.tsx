export function VoteV2CastSuccessDialog({
  hint,
  themeColor,
  onClose,
}: {
  hint: string;
  themeColor?: string;
  onClose: () => void;
}) {
  return (
    <div className="c-modal-backdrop c-cancel-dialog-backdrop" onClick={onClose} role="presentation">
      <div
        className="c-modal c-cancel-dialog c-vote-v2-success"
        role="dialog"
        aria-modal="true"
        aria-label="投票成功"
        onClick={(event) => event.stopPropagation()}
      >
        <h3>投票成功</h3>
        <p>{hint}</p>
        <button type="button" className="c-cta" style={themeColor ? { background: themeColor } : undefined} onClick={onClose}>
          确定
        </button>
      </div>
    </div>
  );
}
