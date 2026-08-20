import type { ReactNode } from 'react';
import { goCEnd, goCEndPortal } from '../../../../app/navigation';

type PcActivityShellProps = {
  children: ReactNode;
  title?: string;
  className?: string;
  onPhone?: () => void;
};

export function PcActivityShell({
  children,
  title = '员工活动',
  className,
  onPhone = () => goCEnd('h5'),
}: PcActivityShellProps) {
  const shellClass = className ? `c-pc-shell ${className}` : 'c-pc-shell';
  return (
    <div className={shellClass}>
      <header className="c-pc-header">
        <button className="c-pc-brand" type="button" onClick={goCEndPortal} aria-label="返回 C 端预览">
          <span className="c-pc-mark" />
          <span className="c-pc-brand-name">康尼</span>
        </button>
        <h1 className="c-pc-header-title">{title}</h1>
        <button className="c-pc-phone" type="button" onClick={onPhone}>
          手机版
        </button>
      </header>
      <main className="c-pc-main">{children}</main>
    </div>
  );
}
