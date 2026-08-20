import { SignupForm } from '../components/SignupForm';

type H5SignupSheetProps = {
  types: string[];
  onCancel: () => void;
  onConfirm: (type: string) => void;
};

export function H5SignupSheet({ types, onCancel, onConfirm }: H5SignupSheetProps) {
  return (
    <div className="c-sheet-backdrop" onClick={onCancel} role="presentation">
      <div
        className="c-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="报名"
        onClick={(event) => event.stopPropagation()}
      >
        <SignupForm types={types} onCancel={onCancel} onConfirm={onConfirm} />
      </div>
    </div>
  );
}
