import { SignupForm } from '../components/SignupForm';

type PcSignupModalProps = {
  types: string[];
  onCancel: () => void;
  onConfirm: (type: string) => void;
};

export function PcSignupModal({ types, onCancel, onConfirm }: PcSignupModalProps) {
  return (
    <div className="c-modal-backdrop" onClick={onCancel} role="presentation">
      <div
        className="c-modal"
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
