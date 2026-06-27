// A node in the Chrome bookmark tree. We alias the official Chrome type so the
// mock data used during `vite dev` stays structurally identical to what
// `chrome.bookmarks.getTree()` returns at runtime.
export type BookmarkNode = chrome.bookmarks.BookmarkTreeNode;
