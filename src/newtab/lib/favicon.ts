// Resolve a favicon URL using Chrome's built-in favicon cache, exposed to the
// extension via the "favicon" permission as `/_favicon/`. No network request
// leaves the browser — Chrome serves icons it already has. Returns null when the
// extension API is unavailable (e.g. `vite dev`), letting callers fall back to a
// letter avatar.
export function faviconURL(pageUrl: string, size = 32): string | null {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
      const url = new URL(chrome.runtime.getURL('/_favicon/'));
      url.searchParams.set('pageUrl', pageUrl);
      url.searchParams.set('size', String(size));
      return url.toString();
    }
  } catch {
    // fall through to null
  }
  return null;
}
