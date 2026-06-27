import { useCallback } from 'react';
import { DEFAULT_SETTINGS, SETTINGS_KEY } from '../lib/settings';
import type { Settings } from '../lib/settings';
import { useChromeStorage } from './useChromeStorage';

// Reactive user settings. Reads/writes chrome.storage.sync and merges over
// defaults so partial or legacy stored objects stay valid. `update` takes a
// patch and persists the merged result.
export function useSettings(): {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  loaded: boolean;
} {
  const [stored, setStored, loaded] = useChromeStorage<Partial<Settings>>(
    'sync',
    SETTINGS_KEY,
    DEFAULT_SETTINGS,
  );

  const settings: Settings = { ...DEFAULT_SETTINGS, ...stored };

  const update = useCallback(
    (patch: Partial<Settings>) => {
      setStored((prev) => ({ ...DEFAULT_SETTINGS, ...prev, ...patch }));
    },
    [setStored],
  );

  return { settings, update, loaded };
}
