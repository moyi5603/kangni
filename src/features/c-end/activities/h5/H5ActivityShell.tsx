import type { ReactNode } from 'react';
import { IconBack } from '../components/Icons';

type H5ActivityShellSharedProps = {
  children: ReactNode;
  footer?: ReactNode;
  overlay?: ReactNode;
  detail?: boolean;
  className?: string;
  headerExtra?: ReactNode;
};

type H5ActivityShellProps = H5ActivityShellSharedProps &
  (
    | {
        title: string;
        onBack?: () => void;
        actions?: ReactNode;
        header?: never;
      }
    | {
        header: ReactNode;
        title?: never;
        onBack?: never;
        actions?: never;
      }
  );

export function H5ActivityShell(props: H5ActivityShellProps) {
  const { children, footer, overlay, detail, className, headerExtra } = props;
  const shellClass = className ? `c-h5-shell ${className}` : 'c-h5-shell';
  const top =
    'title' in props ? (
      <header className="c-h5-top">
        {props.onBack ? (
          <button className="c-icon-btn" type="button" aria-label="返回" onClick={props.onBack}>
            <IconBack />
          </button>
        ) : (
          <span className="c-icon-btn" aria-hidden />
        )}
        <h1 className="c-h5-title">{props.title}</h1>
        {props.actions ?? <span className="c-icon-btn" aria-hidden />}
      </header>
    ) : (
      props.header
    );

  return (
    <div className={shellClass}>
      <div className="c-h5-frame">
        {headerExtra ? (
          <div className="c-h5-search-sticky">
            {top}
            {headerExtra}
          </div>
        ) : (
          top
        )}
        <main className={`c-h5-main${detail ? ' is-detail' : ''}`}>{children}</main>
        {overlay}
        {footer}
      </div>
    </div>
  );
}
