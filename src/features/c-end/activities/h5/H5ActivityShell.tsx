import type { ReactNode } from 'react';
import { IconBack } from '../components/Icons';

type H5ActivityShellSharedProps = {
  children: ReactNode;
  footer?: ReactNode;
  overlay?: ReactNode;
  detail?: boolean;
  className?: string;
};

type H5ActivityShellProps = H5ActivityShellSharedProps &
  (
    | {
        title: string;
        onBack?: () => void;
        header?: never;
      }
    | {
        header: ReactNode;
        title?: never;
        onBack?: never;
      }
  );

export function H5ActivityShell(props: H5ActivityShellProps) {
  const { children, footer, overlay, detail, className } = props;
  const shellClass = className ? `c-h5-shell ${className}` : 'c-h5-shell';

  return (
    <div className={shellClass}>
      <div className="c-h5-frame">
        {'title' in props ? (
          <header className="c-h5-top">
            {props.onBack ? (
              <button className="c-icon-btn" type="button" aria-label="返回" onClick={props.onBack}>
                <IconBack />
              </button>
            ) : (
              <span className="c-icon-btn" aria-hidden />
            )}
            <h1 className="c-h5-title">{props.title}</h1>
            <span className="c-icon-btn" aria-hidden />
          </header>
        ) : (
          props.header
        )}
        <main className={`c-h5-main${detail ? ' is-detail' : ''}`}>{children}</main>
        {overlay}
        {footer}
      </div>
    </div>
  );
}
