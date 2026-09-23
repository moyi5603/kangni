import type { ReactNode } from 'react';

export function VoteStatusTabs({
  tabs,
  value,
  onChange,
  recordsHref,
  ariaLabel,
}: {
  tabs: readonly string[];
  value: string;
  onChange: (tab: string) => void;
  recordsHref: string;
  ariaLabel: string;
}): ReactNode {
  return (
    <div className="c-catalog-toolbar">
      <div className="c-tabs" role="group" aria-label={ariaLabel}>
        {tabs.map((item) => (
          <button
            key={item}
            className={`c-tab${item === value ? ' is-active' : ''}`}
            type="button"
            aria-pressed={item === value}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <a className="c-vote-records" href={recordsHref}>
        我的记录
      </a>
    </div>
  );
}
