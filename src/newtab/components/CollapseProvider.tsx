import { createContext, useCallback, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useChromeStorage } from '../hooks/useChromeStorage';

// Persists the expand/collapse state of cards and nested folders across new
// tabs. Keyed by Chrome's stable bookmark folder id. Only folders the user has
// explicitly toggled are stored; everything else falls back to its natural
// default (top-level cards open, deep folders collapsed), so newly added
// folders behave sensibly and the stored map stays small. Lives in
// chrome.storage.local — device-specific UI state, synced across open tabs.

type CollapseMap = Record<string, boolean>;

const COLLAPSE_KEY = 'collapsed';

interface CollapseApi {
  isCollapsed: (id: string, defaultCollapsed: boolean) => boolean;
  toggle: (id: string, defaultCollapsed: boolean) => void;
}

const CollapseContext = createContext<CollapseApi | null>(null);

export function useCollapse(): CollapseApi {
  const ctx = useContext(CollapseContext);
  if (!ctx) throw new Error('useCollapse must be used within <CollapseProvider>');
  return ctx;
}

export function CollapseProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useChromeStorage<CollapseMap>('local', COLLAPSE_KEY, {});

  const isCollapsed = useCallback(
    (id: string, defaultCollapsed: boolean) => (id in map ? map[id] : defaultCollapsed),
    [map],
  );

  const toggle = useCallback(
    (id: string, defaultCollapsed: boolean) => {
      setMap((prev) => {
        const current = id in prev ? prev[id] : defaultCollapsed;
        return { ...prev, [id]: !current };
      });
    },
    [setMap],
  );

  const api = useMemo<CollapseApi>(() => ({ isCollapsed, toggle }), [isCollapsed, toggle]);

  return <CollapseContext.Provider value={api}>{children}</CollapseContext.Provider>;
}
