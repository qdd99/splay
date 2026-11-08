// Fields chrome.bookmarks added in Chrome 134 that @types/chrome 0.0.287 predates.
declare namespace chrome.bookmarks {
  interface BookmarkTreeNode {
    /** Which permanent folder this is. Only set on the top-level permanent folders. */
    folderType?: 'bookmarks-bar' | 'other' | 'mobile' | 'managed';
    /** True if the node lives in the signed-in account's storage (synced). */
    syncing?: boolean;
  }
}
