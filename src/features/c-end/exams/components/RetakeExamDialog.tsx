export const RETAKE_EXAM_HINT =
  '重新考试不会影响已考数据，系统会保留最高分作为最终成绩，确定重新考试吗？';

export function RetakeExamDialog({
  takeHref,
  onCancel,
}: {
  takeHref: string;
  onCancel: () => void;
}) {
  return (
    <div className="c-modal-backdrop c-exam-retake-backdrop" onClick={onCancel} role="presentation">
      <div
        className="c-modal c-exam-retake-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="温馨提示"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="c-exam-retake-title">温馨提示</p>
        <p className="c-exam-retake-copy">{RETAKE_EXAM_HINT}</p>
        <div className="c-exam-retake-actions">
          <button className="c-btn c-btn-ghost" type="button" onClick={onCancel}>
            取消
          </button>
          <a className="c-btn c-btn-primary" href={takeHref}>
            确定
          </a>
        </div>
      </div>
    </div>
  );
}
