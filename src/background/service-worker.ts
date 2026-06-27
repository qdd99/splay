// Splay service worker (Manifest V3).
//
// Splay needs no background logic today — the new tab page reads bookmarks
// directly via chrome.bookmarks and re-renders on the bookmark events. This
// worker is kept minimal and reserved for future use (e.g. omnibox, commands,
// or native context-menu entries).

chrome.runtime.onInstalled.addListener(() => {
  // Reserved for first-run setup.
});

export {};
