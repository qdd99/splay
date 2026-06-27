import { useEffect } from 'react';
import type { RefObject } from 'react';

// Escape clears and blurs the search input while it is focused.
//
// There is intentionally no ⌘K "focus search" shortcut: a freshly opened new tab
// keeps keyboard focus on the address bar, and Chrome prevents new-tab override
// pages from stealing it, so a page-level shortcut can't fire until the user has
// already clicked into the page — at which point the search box is right there.
export function useSearchHotkeys(
  inputRef: RefObject<HTMLInputElement>,
  clear: () => void,
): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        clear();
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [inputRef, clear]);
}
