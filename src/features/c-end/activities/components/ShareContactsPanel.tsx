import { useMemo, useState } from 'react';
import { EmployeeAvatar } from './EmployeeAvatar';
import { filterShareContacts, listShareContacts } from '../model/activityShare';
import { DEMO_SIGNUP_USER } from '../model/signupStore';

export function ShareContactsPanel({
  open,
  surface = 'h5',
  query = '',
  onClose,
  onConfirm,
}: {
  open?: boolean;
  surface?: 'h5' | 'pc';
  query?: string;
  onClose?: () => void;
  onConfirm?: (count: number) => void;
}) {
  const [keyword, setKeyword] = useState(query);
  const [selected, setSelected] = useState<string[]>([]);
  const people = useMemo(() => listShareContacts(DEMO_SIGNUP_USER.phone), []);
  const visible = filterShareContacts(people, keyword);

  if (!open) return null;

  const toggle = (phone: string) => {
    setSelected((current) =>
      current.includes(phone) ? current.filter((item) => item !== phone) : [...current, phone],
    );
  };

  return (
    <div
      className={surface === 'pc' ? 'c-modal-backdrop' : 'c-sheet-backdrop'}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={surface === 'pc' ? 'c-modal c-share-panel' : 'c-sheet c-share-panel'}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-contacts-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="c-signup-people-panel-head">
          <h2 id="share-contacts-title">选择联系人</h2>
          <button className="c-btn c-btn-ghost" type="button" onClick={onClose}>
            关闭
          </button>
        </div>
        <input
          className="c-signup-people-search"
          type="search"
          value={keyword}
          placeholder="搜索姓名或部门"
          aria-label="搜索姓名或部门"
          onChange={(event) => setKeyword(event.target.value)}
        />
        <ul className="c-share-contact-list">
          {visible.map((person) => {
            const checked = selected.includes(person.phone);
            return (
              <li key={person.phone}>
                <button
                  className={`c-share-contact${checked ? ' is-on' : ''}`}
                  type="button"
                  aria-pressed={checked}
                  onClick={() => toggle(person.phone)}
                >
                  <EmployeeAvatar name={person.name} />
                  <span className="c-signup-person-copy">
                    <span className="c-signup-person-name">{person.name}</span>
                    <span className="c-signup-person-dept">{person.department}</span>
                  </span>
                  <span className="c-share-check" aria-hidden>
                    {checked ? '✓' : ''}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <button
          className="c-cta"
          type="button"
          disabled={selected.length === 0}
          onClick={() => onConfirm?.(selected.length)}
        >
          确定{selected.length > 0 ? `（${selected.length}）` : ''}
        </button>
      </div>
    </div>
  );
}
