// chrome.storage wrapper with a localStorage fallback for `vite dev`. Settings
// live in `sync` (roams across the user's devices); the accent-color map lives
// in `local` (device-specific, can be larger).

export type StorageArea = 'local' | 'sync';

function devKey(area: StorageArea, key: string): string {
  return `splay:${area}:${key}`;
}

export async function readStorage<T>(area: StorageArea, key: string, fallback: T): Promise<T> {
  if (typeof chrome !== 'undefined' && chrome.storage?.[area]) {
    const result = await chrome.storage[area].get(key);
    return (result[key] as T) ?? fallback;
  }
  try {
    const raw = localStorage.getItem(devKey(area, key));
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export async function writeStorage<T>(area: StorageArea, key: string, value: T): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage?.[area]) {
    await chrome.storage[area].set({ [key]: value });
    return;
  }
  try {
    localStorage.setItem(devKey(area, key), JSON.stringify(value));
    // Notify same-tab listeners (the native 'storage' event only fires in other tabs).
    window.dispatchEvent(
      new CustomEvent('splay-storage', { detail: { area, key, value } }),
    );
  } catch {
    // ignore quota / serialization errors in dev
  }
}

// Subscribe to changes for one key. Returns an unsubscribe function.
export function subscribeStorage(
  area: StorageArea,
  key: string,
  callback: (value: unknown) => void,
): () => void {
  if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
    const handler = (
      changes: { [name: string]: chrome.storage.StorageChange },
      areaName: string,
    ) => {
      if (areaName === area && key in changes) callback(changes[key].newValue);
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }

  const onCustom = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail?.area === area && detail?.key === key) callback(detail.value);
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key === devKey(area, key)) {
      callback(e.newValue === null ? undefined : JSON.parse(e.newValue));
    }
  };
  window.addEventListener('splay-storage', onCustom);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener('splay-storage', onCustom);
    window.removeEventListener('storage', onStorage);
  };
}
