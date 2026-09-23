import type { ReactNode } from 'react';
import { H5ActivityShell } from '../../activities/h5/H5ActivityShell';
import {
  toH5ContestDocsHash,
  toH5ContestEventsHash,
  toH5ContestHomeHash,
  toH5ContestMineHash,
} from '../../../../app/navigation';

export type ContestTab = 'home' | 'events' | 'docs' | 'mine';

function IconHome({ on }: { on?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"
        fill={on ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCal({ on }: { on?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect
        x="4"
        y="5"
        width="16"
        height="15"
        rx="2"
        fill={on ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M8 3.5v4M16 3.5v4M4 10h16" fill="none" stroke={on ? '#fff' : 'currentColor'} strokeWidth="1.6" />
    </svg>
  );
}

function IconDocs() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M7 4h7l4 4v12H7z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14 4v4h4M9 12h6M9 16h4" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconUser({ on }: { on?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="8" r="3.2" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 19c1.4-3.2 3.8-4.8 7-4.8s5.6 1.6 7 4.8" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 16.5 20 20.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.4 2H4.6L6 16Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 19a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function ContestBrandHeader() {
  return (
    <header className="c-contest-brand">
      <span className="c-contest-logo" aria-label="工会">
        <svg viewBox="0 0 48 48" aria-hidden>
          <circle cx="24" cy="24" r="22" fill="#c8161d" />
          <circle cx="24" cy="24" r="16" fill="none" stroke="#f0b429" strokeWidth="2.4" />
          <text x="24" y="31" textAnchor="middle" fill="#f0b429" fontSize="18" fontWeight="800" fontFamily="serif">
            工
          </text>
        </svg>
      </span>
      <span className="c-contest-brand-actions">
        <a className="c-contest-icon-link" href={toH5ContestEventsHash()} aria-label="搜索">
          <IconSearch />
        </a>
        <a className="c-contest-icon-link" href={toH5ContestMineHash()} aria-label="消息">
          <IconBell />
        </a>
      </span>
    </header>
  );
}

export function ContestTabBar({ active }: { active: ContestTab }) {
  return (
    <nav className="c-contest-tabbar" aria-label="技能大赛导航">
      <a className={active === 'home' ? 'is-on' : undefined} href={toH5ContestHomeHash()}>
        <IconHome on={active === 'home'} />
        首页
      </a>
      <a className={active === 'events' ? 'is-on' : undefined} href={toH5ContestEventsHash()}>
        <IconCal on={active === 'events'} />
        线上竞赛
      </a>
      <a className={active === 'docs' ? 'is-on' : undefined} href={toH5ContestDocsHash()}>
        <IconDocs />
        竞赛文档
      </a>
      <a className={active === 'mine' ? 'is-on' : undefined} href={toH5ContestMineHash()}>
        <IconUser on={active === 'mine'} />
        我的竞赛
      </a>
    </nav>
  );
}

export function H5ContestShell({
  title,
  onBack,
  children,
  footer,
  tab,
  brand,
  className,
  actions,
  header,
}: {
  title?: string;
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
  tab?: ContestTab;
  brand?: boolean;
  className?: string;
  actions?: ReactNode;
  header?: ReactNode | null;
}) {
  const bar = footer ?? (tab ? <ContestTabBar active={tab} /> : undefined);
  const extra = className ? ` ${className}` : '';
  if (brand) {
    return (
      <H5ActivityShell className={`is-contest is-contest-home${extra}`} header={<ContestBrandHeader />} footer={bar}>
        {children}
      </H5ActivityShell>
    );
  }
  if (header !== undefined) {
    return (
      <H5ActivityShell className={`is-contest${extra}`} header={header} footer={bar}>
        {children}
      </H5ActivityShell>
    );
  }
  return (
    <H5ActivityShell
      className={`is-contest${extra}`}
      title={title ?? '技能大赛'}
      onBack={onBack}
      actions={actions}
      footer={bar}
    >
      {children}
    </H5ActivityShell>
  );
}
