import { useState } from 'react';
import {
  digitsOnly,
  findGroupSignupField,
  needsSignupForm,
  parseCompanionPeople,
  prefillSignupAnswers,
  stringifyCompanionPeople,
  validateSignupAnswers,
  withoutGroupSignupField,
  type CompanionCollectField,
  type CompanionPerson,
  type SignupField,
} from '../../../activities/model/signupFields';
import { formatCEndDateTimeInText } from '../../formatDateTime';
import { DEMO_SIGNUP_USER } from '../model/signupStore';
import { sessionOccupiedCount } from '../model/clientActivity';
import { useRelated } from '../../../activities/model/related';
import {
  CLIENT_SIGNUP_SESSION_LIMIT,
  formatSessionLabel,
  isSessionSignupOpen,
  listClientSignupSessions,
  needsSessionPick,
  parseSessionIds,
  stringifySessionIds,
  validateSessionPick,
  filterOpenSessionPicks,
  visibleSignupSessions,
  type ActivityScheduleType,
  type ActivitySession,
} from '../../../activities/model/activitySchedule';

type SignupFormProps = {
  types: string[];
  fields: SignupField[];
  scheduleType?: ActivityScheduleType;
  sessions?: ActivitySession[];
  terminatedAt?: string;
  signupStartAt?: string;
  signupEndAt?: string;
  signupHoursBefore?: number;
  now?: number;
  initialAnswers?: Record<string, string>;
  mode?: 'create' | 'adjust';
  sessionsExpanded?: boolean;
  activityId?: number;
  quotaLimit?: number;
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

export function SignupSessionMore({
  total,
  expanded,
  onToggle,
}: {
  total: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (total <= CLIENT_SIGNUP_SESSION_LIMIT) return null;
  return (
    <button className="c-signup-session-more" type="button" onClick={onToggle}>
      {expanded ? '收起场次' : '展开全部场次'}
    </button>
  );
}

export function SignupForm({
  types,
  fields,
  scheduleType,
  sessions = [],
  terminatedAt,
  signupStartAt,
  signupEndAt,
  signupHoursBefore,
  now = Date.now(),
  initialAnswers,
  mode = 'create',
  sessionsExpanded = false,
  activityId,
  quotaLimit,
  onCancel,
  onConfirm,
}: SignupFormProps) {
  useRelated('signups', activityId ?? 0);
  const groupField = findGroupSignupField(fields);
  const profileFields = withoutGroupSignupField(fields);
  const groupOptions = (groupField?.groups ?? []).map((item) => item.name.trim()).filter(Boolean);
  const showGroups = Boolean(groupField && groupOptions.length);
  const collectFields = needsSignupForm(profileFields);
  const [type, setType] = useState(types[0] ?? '');
  const [answers, setAnswers] = useState(() => ({
    ...prefillSignupAnswers(collectFields ? fields : [], demoProfile()),
    ...initialAnswers,
  }));
  const [error, setError] = useState<string>();
  const [sessionListOpen, setSessionListOpen] = useState(sessionsExpanded);
  const needSessionPick = needsSessionPick(scheduleType) && sessions.length > 0;
  const pickableSessions = needSessionPick
    ? listClientSignupSessions(sessions, now, Number.POSITIVE_INFINITY, terminatedAt)
    : [];
  const shownSessions = visibleSignupSessions(pickableSessions, sessionListOpen);
  const canSubmit = types.length > 0 && Boolean(type) && (!needSessionPick || pickableSessions.length > 0);

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
        const payload = {
          ...(collectFields ? answers : prefillSignupAnswers(profileFields, demoProfile())),
          ...(showGroups && groupField ? { [groupField.key]: answers[groupField.key] ?? '' } : {}),
          ...(needSessionPick && pickableSessions.length ? { 场次: answers['场次'] ?? '' } : {}),
        };
        if (needSessionPick && pickableSessions.length) {
          const window =
            signupStartAt && signupEndAt
              ? { signupStartAt, signupEndAt, signupHoursBefore, now }
              : undefined;
          const picked = filterOpenSessionPicks(parseSessionIds(payload['场次']), pickableSessions, window);
          payload['场次'] = stringifySessionIds(picked);
          if (!(mode === 'adjust' && picked.length === 0)) {
            const invalidSession = validateSessionPick(scheduleType, pickableSessions, picked, window);
            if (invalidSession) {
              setError(invalidSession);
              return;
            }
          }
        }
        if (collectFields || showGroups) {
          const invalid = validateSignupAnswers(fields, payload);
          if (invalid) {
            setError(invalid);
            return;
          }
        }
        onConfirm(type, payload);
      }}
    >
      <p className="c-signup-legend">{mode === 'adjust' ? '立即报名' : '确认报名'}</p>
      {needSessionPick ? (
        <section className="c-signup-card" aria-labelledby="signup-card-sessions">
          <h3 id="signup-card-sessions" className="c-signup-card-title">
            参加场次 *
          </h3>
          {pickableSessions.length === 0 ? (
            <p className="c-signup-hint">暂无可以报名的场次</p>
          ) : (
            <div className="c-signup-options" role="group" aria-label="参加场次">
              {shownSessions.map((session) => {
                const index = sessions.findIndex((item) => item.id === session.id);
                const picked = parseSessionIds(answers['场次']);
                const checked = picked.includes(session.id);
                const closed =
                  Boolean(signupStartAt && signupEndAt) &&
                  !isSessionSignupOpen(
                    session,
                    { signupStartAt: signupStartAt!, signupEndAt: signupEndAt!, signupHoursBefore },
                    now,
                  );
                const remain =
                  activityId != null && quotaLimit !== undefined
                    ? Math.max(0, quotaLimit - sessionOccupiedCount(activityId, session.id))
                    : undefined;
                const remainLabel =
                  remain === undefined ? undefined : remain <= 0 ? '已满' : `余${remain}位`;
                return (
                  <label key={session.id} className={`c-signup-option is-session${checked ? ' is-checked' : ''}${closed ? ' is-disabled' : ''}`}>
                    <input
                      type="checkbox"
                      name="场次"
                      value={session.id}
                      checked={checked}
                      disabled={closed}
                      onChange={() => {
                        if (closed) return;
                        setAnswer('场次', toggleCheckbox(answers['场次'] ?? '', session.id));
                      }}
                    />
                    <span className="c-signup-session-copy">
                      <span>
                        {formatCEndDateTimeInText(formatSessionLabel(session, index < 0 ? 0 : index))}
                        {closed ? '（已截止）' : ''}
                      </span>
                      {remainLabel ? (
                        <span className={`c-signup-session-remain${remain === 0 ? ' is-full' : ''}`}>{remainLabel}</span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
              <SignupSessionMore
                total={pickableSessions.length}
                expanded={sessionListOpen}
                onToggle={() => setSessionListOpen((open) => !open)}
              />
            </div>
          )}
        </section>
      ) : null}
      {showGroups && groupField ? (
        <section className="c-signup-card" aria-labelledby="signup-card-groups">
          <h3 id="signup-card-groups" className="c-signup-card-title">
            报名分组 *
          </h3>
          <div className="c-signup-options" role="group" aria-label="报名分组">
            {groupOptions.map((option) => {
              const picked = (answers[groupField.key] ?? '')
                .split('、')
                .map((item) => item.trim())
                .filter(Boolean);
              const checked = picked.includes(option);
              const groupMeta = groupField.groups?.find((item) => item.name.trim() === option);
              return (
                <label key={option} className={`c-signup-option${checked ? ' is-checked' : ''}`}>
                  <input
                    type="checkbox"
                    name={groupField.key}
                    value={option}
                    checked={checked}
                    onChange={() => setAnswer(groupField.key, toggleCheckbox(answers[groupField.key] ?? '', option))}
                  />
                  {option}
                  {groupMeta ? <span className="c-signup-option-meta">（上限 {groupMeta.limit} 人）</span> : null}
                </label>
              );
            })}
          </div>
        </section>
      ) : null}
      <section className="c-signup-card" aria-labelledby="signup-card-profile">
        <h3 id="signup-card-profile" className="c-signup-card-title">
          报名信息
        </h3>
        {collectFields ? (
          <div className="c-signup-fields">
            {profileFields.map((field) => {
            const value = answers[field.key] ?? '';
            const label = `${field.label}${field.required ? ' *' : ''}`;

            if (field.inputType === 'radio') {
              const options = (field.options ?? []).filter((option) => option.trim());
              return (
                <fieldset key={field.key} className="c-signup-field">
                  <legend>{label}</legend>
                  <div className="c-signup-options" role="radiogroup" aria-label={field.label}>
                    {options.map((option) => {
                      const checked = value === option;
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
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              );
            }

            if (field.inputType === 'checkbox') {
              const options = (field.options ?? []).filter((option) => option.trim());
              const picked = value.split('、').map((item) => item.trim()).filter(Boolean);
              return (
                <fieldset key={field.key} className="c-signup-field">
                  <legend>{label}</legend>
                  <div className="c-signup-options" role="group" aria-label={field.label}>
                    {options.map((option) => {
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
      </section>
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
