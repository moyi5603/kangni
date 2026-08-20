import { useState } from 'react';
import { DEMO_SIGNUP_USER } from '../model/signupStore';

type SignupFormProps = {
  types: string[];
  onCancel: () => void;
  onConfirm: (type: string) => void;
};

export function SignupForm({ types, onCancel, onConfirm }: SignupFormProps) {
  const [type, setType] = useState(types[0] ?? '');
  const canSubmit = types.length > 0 && Boolean(type);

  return (
    <form
      className="c-signup-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) return;
        onConfirm(type);
      }}
    >
      <p className="c-signup-legend">确认报名</p>
      <p className="c-signup-hint">
        {DEMO_SIGNUP_USER.name} · {DEMO_SIGNUP_USER.phone}
      </p>
      {types.length === 0 ? (
        <p className="c-signup-hint">暂不可报名</p>
      ) : (
        <div className="c-signup-options" role="radiogroup" aria-label="报名类型">
          {types.map((item) => {
            const checked = item === type;
            return (
              <label key={item} className={`c-signup-option${checked ? ' is-checked' : ''}`}>
                <input
                  type="radio"
                  name="signup-type"
                  value={item}
                  checked={checked}
                  onChange={() => setType(item)}
                />
                {item}
              </label>
            );
          })}
        </div>
      )}
      <div className="c-signup-actions">
        <button className="c-btn c-btn-primary" type="submit" disabled={!canSubmit}>
          确认报名
        </button>
        <button className="c-btn c-btn-ghost" type="button" onClick={onCancel}>
          取消
        </button>
      </div>
    </form>
  );
}
