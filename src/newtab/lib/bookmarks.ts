import { getBookmarksApi } from './bookmarksApi';
import type { MoveDestination } from './bookmarksApi';

// Thin, intention-revealing wrappers over the bookmark API. Mutations fire a
// change event that useBookmarks listens to — there is no need to update local
// state by hand.

export async function updateBookmark(
  id: string,
  changes: { title?: string; url?: string },
): Promise<void> {
  await getBookmarksApi().update(id, changes);
}

export async function createBookmark(
  parentId: string,
  title: string,
  url?: string,
): Promise<void> {
  await getBookmarksApi().create(parentId, title, url);
}

// Remove a single bookmark (leaf).
export async function removeBookmark(id: string): Promise<void> {
  await getBookmarksApi().remove(id);
}

// Remove a folder and everything inside it.
export async function removeFolder(id: string): Promise<void> {
  await getBookmarksApi().removeTree(id);
}

export async function moveBookmark(id: string, destination: MoveDestination): Promise<void> {
  await getBookmarksApi().move(id, destination);
}

// Open a URL in a new tab / new window, preferring the extension APIs (which
// require no extra permission to *create*) and falling back to window.open.
export function openInNewTab(url: string): void {
  if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
    chrome.tabs.create({ url });
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export function openInNewWindow(url: string): void {
  if (typeof chrome !== 'undefined' && chrome.windows?.create) {
    chrome.windows.create({ url });
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
