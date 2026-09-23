import { createContext, useContext, type ReactNode } from 'react';

const EMPTY: never[] = [];

const CEndEmptyPreviewContext = createContext(false);

export function CEndEmptyPreviewProvider({
  empty,
  children,
}: {
  empty?: boolean;
  children: ReactNode;
}) {
  return <CEndEmptyPreviewContext.Provider value={Boolean(empty)}>{children}</CEndEmptyPreviewContext.Provider>;
}

export function useCEndEmptyPreview() {
  return useContext(CEndEmptyPreviewContext);
}

export function usePreviewList<T>(items: T[]): T[] {
  return useCEndEmptyPreview() ? (EMPTY as T[]) : items;
}
