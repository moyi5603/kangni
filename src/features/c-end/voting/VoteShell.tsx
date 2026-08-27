import type { ReactNode } from 'react';
import type { CEndSurface } from '../../../app/navigation';
import { H5ActivityShell } from '../activities/h5/H5ActivityShell';
import { PcActivityShell } from '../activities/pc/PcActivityShell';

export function VoteShell({
  surface = 'h5',
  title,
  onBack,
  actions,
  header,
  children,
  footer,
  detail,
  className,
}: {
  surface?: CEndSurface;
  title?: string;
  onBack?: () => void;
  actions?: ReactNode;
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  detail?: boolean;
  className?: string;
}) {
  const shellClass = ['is-vote', detail ? 'is-detail' : null, className]
    .filter(Boolean)
    .join(' ')
    .split(/\s+/)
    .filter((item, index, all) => all.indexOf(item) === index)
    .join(' ');
  if (surface === 'pc') {
    return (
      <PcActivityShell className={shellClass} title={title ?? '投票'}>
        {onBack || actions ? (
          <div className="c-pc-vote-nav">
            {onBack ? (
              <button className="c-back-link" type="button" onClick={onBack}>
                ← 返回
              </button>
            ) : (
              <span />
            )}
            {actions}
          </div>
        ) : null}
        {children}
        {footer}
      </PcActivityShell>
    );
  }
  if (header) {
    return (
      <H5ActivityShell className={shellClass} header={header} detail={detail} footer={footer}>
        {children}
      </H5ActivityShell>
    );
  }
  return (
    <H5ActivityShell className={shellClass} title={title ?? '投票'} onBack={onBack} detail={detail} footer={footer}>
      {children}
    </H5ActivityShell>
  );
}
