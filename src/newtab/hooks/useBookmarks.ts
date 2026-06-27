import { useEffect, useState } from 'react';
import type { BookmarkNode } from '../types';
import { getBookmarksApi } from '../lib/bookmarksApi';

// Loads the bookmark tree and keeps it in sync in real time. Any change
// (create / remove / edit / move / reorder) re-reads the full tree, so edits
// made elsewhere appear instantly. Backed by chrome.bookmarks in the extension
// and by an in-memory mock store during `vite dev`.
export function useBookmarks(): BookmarkNode | null {
  const [root, setRoot] = useState<BookmarkNode | null>(null);

  useEffect(() => {
    const api = getBookmarksApi();
    const reload = () => {
      api.getTree().then(([tree]) => setRoot(tree));
    };
    reload();
    return api.subscribe(reload);
  }, []);

  return root;
}
