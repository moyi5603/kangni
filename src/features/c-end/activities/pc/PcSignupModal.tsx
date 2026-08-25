import type { SignupField } from '../../../activities/model/signupFields';
import { SignupForm } from '../components/SignupForm';

export function PcSignupModal({
  title,
  types,
  fields,
  onCancel,
  onConfirm,
}: {
  title: string;
  types: string[];
  fields: SignupField[];
  onCancel: () => void;
  onConfirm: (type: string, answers: Record<string, string>) => void;
}) {
  return (
    <div className="c-modal-backdrop" onClick={onCancel} role="presentation">
      <div
        className="c-modal c-signup-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pc-signup-heading"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="pc-signup-heading" className="c-signup-page-heading">
          填写报名信息
        </h2>
        <p className="c-signup-page-title">{title}</p>
        <SignupForm types={types} fields={fields} onCancel={onCancel} onConfirm={onConfirm} />
      </div>
    </div>
  );
}
