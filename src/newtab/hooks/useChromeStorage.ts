import { useCallback, useEffect, useRef, useState } from 'react';
import { readStorage, subscribeStorage, writeStorage } from '../lib/storage';
import type { StorageArea } from '../lib/storage';

// Reactive binding to a single chrome.storage key. Returns the current value, a
// setter that persists and broadcasts the change, and a `loaded` flag (false
// until the initial async read resolves). Stays in sync across tabs/devices via
// the storage change event.
export function useChromeStorage<T>(
  area: StorageArea,
  key: string,
  defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(defaultValue);
  const [loaded, setLoaded] = useState(false);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    let active = true;
    readStorage(area, key, defaultValue).then((stored) => {
      if (active) {
        setValue(stored);
        setLoaded(true);
      }
    });
    const unsubscribe = subscribeStorage(area, key, (next) => {
      if (active) setValue((next as T) ?? defaultValue);
    });
    return () => {
      active = false;
      unsubscribe();
    };
    // defaultValue is intentionally read once; callers pass a stable literal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area, key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved =
        typeof next === 'function' ? (next as (prev: T) => T)(valueRef.current) : next;
      setValue(resolved);
      void writeStorage(area, key, resolved);
    },
    [area, key],
  );

  return [value, update, loaded];
}
