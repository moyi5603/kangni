import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

type ToastApi = { show: (message: string) => void };

const ToastContext = createContext<ToastApi>({ show: () => undefined });

export function useCEndToast(): ToastApi {
  return useContext(ToastContext);
}

export function CEndToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string>();
  const timer = useRef<number>(0);
  const api = useMemo<ToastApi>(
    () => ({
      show: (next) => {
        window.clearTimeout(timer.current);
        setMessage(next);
        timer.current = window.setTimeout(() => setMessage(undefined), 2000);
      },
    }),
    [],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {message ? (
        <div className="c-toast" role="status">
          {message}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}
