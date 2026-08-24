import { useState } from 'react';
import {
  digitsOnly,
  needsSignupForm,
  parseCompanionPeople,
  prefillSignupAnswers,
  stringifyCompanionPeople,
  validateSignupAnswers,
  type CompanionCollectField,
  type CompanionPerson,
  type SignupField,
} from '../../../activities/model/signupFields';
import { DEMO_SIGNUP_USER } from '../model/signupStore';

type SignupFormProps = {
  types: string[];
  fields: SignupField[];
  onCancel: () => void;
  onConfirm: (type: string, answers: Record<string, string>) => void;
};

function demoProfile() {
  return {
    姓名: DEMO_SIGNUP_USER.name,
    手机号: DEMO_SIGNUP_USER.phone,
    部门: DEMO_SIGNUP_USER.department,
    岗位: DEMO_SIGNUP_USER.position,
  };
}

function toggleCheckbox(current: string, option: string): string {
  const picked = current.split('、').map((item) => item.trim()).filter(Boolean);
  const next = picked.includes(option) ? picked.filter((item) => item !== option) : [...picked, option];
  return next.join('、');
}

function emptyCompanionPerson(collect: CompanionCollectField[]): CompanionPerson {
  const person: CompanionPerson = {};
  for (const key of collect) person[key] = '';
  return person;
}

export function SignupForm({ types, fields, onCancel, onConfirm }: SignupFormProps) {
  const collectFields = needsSignupForm(fields);
  const [type, setType] = useState(types[0] ?? '');
  const [answers, setAnswers] = useState(() => prefillSignupAnswers(collectFields ? fields : [], demoProfile()));
  const [error, setError] = useState<string>();
  const canSubmit = types.length > 0 && Boolean(type);

  const setAnswer = (key: string, value: string) => {
    setAnswers((current) => ({ ...current, [key]: value }));
  };

  const setCompanionPeople = (key: string, people: CompanionPerson[]) => {
    setAnswer(key, stringifyCompanionPeople(people));
  };

  return (
    <form
      className="c-signup-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) return;
        const payload = collectFields ? answers : prefillSignupAnswers(fields, demoProfile());
        if (collectFields) {
          const invalid = validateSignupAnswers(fields, payload);
          if (invalid) {
            setError(invalid);
            return;
          }
        }
        onConfirm(type, payload);
      }}
    >
      <p className="c-signup-legend">确认报名</p>
      {collectFields ? (
        <div className="c-signup-fields">
          {fields.map((field) => {
            const value = answers[field.key] ?? '';
            const label = `${field.label}${field.required ? ' *' : ''}`;

            if (field.inputType === 'radio' || field.inputType === 'group') {
              const options =
                field.inputType === 'group'
                  ? (field.groups ?? []).map((item) => item.name.trim()).filter(Boolean)
                  : (field.options ?? []).filter((option) => option.trim());
              return (
                <fieldset key={field.key} className="c-signup-field">
                  <legend>{label}</legend>
                  <div className="c-signup-options" role="radiogroup" aria-label={field.label}>
                    {options.map((option) => {
                      const checked = value === option;
                      const groupMeta = field.inputType === 'group' ? field.groups?.find((item) => item.name.trim() === option) : undefined;
                      return (
                        <label key={option} className={`c-signup-option${checked ? ' is-checked' : ''}`}>
                          <input
                            type="radio"
                            name={field.key}
                            value={option}
                            checked={checked}
                            onChange={() => setAnswer(field.key, option)}
                          />
                          {option}
                          {groupMeta ? <span className="c-signup-option-meta">（上限 {groupMeta.limit} 人）</span> : null}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              );
            }

            if (field.inputType === 'checkbox') {
              const picked = value.split('、').map((item) => item.trim()).filter(Boolean);
              return (
                <fieldset key={field.key} className="c-signup-field">
                  <legend>{label}</legend>
                  <div className="c-signup-options" role="group" aria-label={field.label}>
                    {(field.options ?? []).filter((option) => option.trim()).map((option) => {
                      const checked = picked.includes(option);
                      return (
                        <label key={option} className={`c-signup-option${checked ? ' is-checked' : ''}`}>
                          <input
                            type="checkbox"
                            name={field.key}
                            value={option}
                            checked={checked}
                            onChange={() => setAnswer(field.key, toggleCheckbox(answers[field.key] ?? '', option))}
                          />
                          {option}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              );
            }

            if (field.inputType === 'companion') {
              const collect = field.companionFields ?? [];
              const max = field.companionMax ?? 1;
              const people = parseCompanionPeople(answers[field.key] ?? '[]');
              return (
                <fieldset key={field.key} className="c-signup-field">
                  <legend>{label}</legend>
                  <label className="c-signup-companion-count">
                    同行人数
                    <select
                      className="c-signup-input"
                      value={people.length}
                      onChange={(event) => {
                        const count = Number(event.target.value);
                        const next = Array.from({ length: count }, (_, index) => people[index] ?? emptyCompanionPerson(collect));
                        setCompanionPeople(field.key, next);
                      }}
                    >
                      {Array.from({ length: max + 1 }, (_, index) => (
                        <option key={index} value={index}>
                          {index}
                        </option>
                      ))}
                    </select>
                  </label>
                  {people.map((person, personIndex) => (
                    <div key={personIndex} className="c-signup-companion-card">
                      <p className="c-signup-companion-title">同行人 {personIndex + 1}</p>
                      {collect.map((collectField) => {
                        const digit = collectField === '手机号' || collectField === '身份证号';
                        return (
                          <label key={collectField} className="c-signup-field">
                            {collectField} *
                            <input
                              className="c-signup-input"
                              type="text"
                              inputMode={digit ? 'numeric' : 'text'}
                              value={person[collectField] ?? ''}
                              maxLength={collectField === '手机号' ? 11 : collectField === '身份证号' ? 18 : 20}
                              onChange={(event) => {
                                const nextValue = digit ? digitsOnly(event.target.value) : event.target.value;
                                const nextPeople = people.map((item, i) =>
                                  i === personIndex ? { ...item, [collectField]: nextValue } : item,
                                );
                                setCompanionPeople(field.key, nextPeople);
                              }}
                            />
                          </label>
                        );
                      })}
                    </div>
                  ))}
                </fieldset>
              );
            }

            return (
              <label key={field.key} className="c-signup-field">
                {label}
                <input
                  className="c-signup-input"
                  type="text"
                  name={field.key}
                  value={value}
                  maxLength={field.maxLength}
                  inputMode={field.digitOnly ? 'numeric' : 'text'}
                  onChange={(event) => {
                    const next = field.digitOnly ? digitsOnly(event.target.value) : event.target.value;
                    setAnswer(field.key, next);
                  }}
                />
              </label>
            );
          })}
        </div>
      ) : (
        <p className="c-signup-hint">
          {DEMO_SIGNUP_USER.name} · {DEMO_SIGNUP_USER.phone}
        </p>
      )}
      {types.length === 0 ? (
        <p className="c-signup-hint">暂不可报名</p>
      ) : types.length > 1 ? (
        <div className="c-signup-options" role="radiogroup" aria-label="报名类型">
          {types.map((item) => {
            const checked = item === type;
            return (
              <label key={item} className={`c-signup-option${checked ? ' is-checked' : ''}`}>
                <input type="radio" name="signup-type" value={item} checked={checked} onChange={() => setType(item)} />
                {item}
              </label>
            );
          })}
        </div>
      ) : null}
      {error ? <p className="c-signup-error">{error}</p> : null}
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
