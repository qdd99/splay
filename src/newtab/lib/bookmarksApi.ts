import type { BookmarkNode } from '../types';
import { MOCK_TREE } from './mockTree';

// A single abstraction over bookmark reads, mutations, and change events. In the
// extension it delegates to chrome.bookmarks; during `vite dev` it runs against
// an in-memory mock store so every feature (add / edit / delete / drag-drop)
// behaves identically without the extension loaded.

export interface MoveDestination {
  parentId?: string;
  index?: number;
}

export interface BookmarksApi {
  getTree(): Promise<BookmarkNode[]>;
  create(parentId: string, title: string, url?: string): Promise<void>;
  update(id: string, changes: { title?: string; url?: string }): Promise<void>;
  remove(id: string): Promise<void>;
  removeTree(id: string): Promise<void>;
  move(id: string, destination: MoveDestination): Promise<void>;
  /** Subscribe to any change. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
}

// ─── Chrome-backed implementation ────────────────────────────────────────────

function createChromeApi(api: typeof chrome.bookmarks): BookmarksApi {
  return {
    getTree: () => api.getTree(),
    create: async (parentId, title, url) => {
      await api.create({ parentId, title, url });
    },
    update: async (id, changes) => {
      await api.update(id, changes);
    },
    remove: async (id) => {
      await api.remove(id);
    },
    removeTree: async (id) => {
      await api.removeTree(id);
    },
    move: async (id, destination) => {
      await api.move(id, destination);
    },
    subscribe: (listener) => {
      api.onCreated.addListener(listener);
      api.onRemoved.addListener(listener);
      api.onChanged.addListener(listener);
      api.onMoved.addListener(listener);
      api.onChildrenReordered?.addListener(listener);
      api.onImportEnded?.addListener(listener);
      return () => {
        api.onCreated.removeListener(listener);
        api.onRemoved.removeListener(listener);
        api.onChanged.removeListener(listener);
        api.onMoved.removeListener(listener);
        api.onChildrenReordered?.removeListener(listener);
        api.onImportEnded?.removeListener(listener);
      };
    },
  };
}

// ─── In-memory mock implementation (dev only) ────────────────────────────────

function createMockApi(): BookmarksApi {
  const root: BookmarkNode = structuredClone(MOCK_TREE);
  const listeners = new Set<() => void>();
  let counter = 100000;

  const notify = () => listeners.forEach((l) => l());

  function findParentOf(
    id: string,
    node: BookmarkNode = root,
  ): { parent: BookmarkNode; index: number } | null {
    const children = node.children;
    if (!children) return null;
    const index = children.findIndex((c) => c.id === id);
    if (index !== -1) return { parent: node, index };
    for (const child of children) {
      const found = findParentOf(id, child);
      if (found) return found;
    }
    return null;
  }

  function findNode(id: string, node: BookmarkNode = root): BookmarkNode | null {
    if (node.id === id) return node;
    for (const child of node.children ?? []) {
      const found = findNode(id, child);
      if (found) return found;
    }
    return null;
  }

  return {
    getTree: async () => [structuredClone(root)],
    create: async (parentId, title, url) => {
      const parent = findNode(parentId);
      if (!parent) return;
      parent.children ??= [];
      const node: BookmarkNode = { id: String(counter++), title };
      if (url) node.url = url;
      else node.children = [];
      parent.children.push(node);
      notify();
    },
    update: async (id, changes) => {
      const node = findNode(id);
      if (!node) return;
      if (changes.title !== undefined) node.title = changes.title;
      if (changes.url !== undefined) node.url = changes.url;
      notify();
    },
    remove: async (id) => {
      const loc = findParentOf(id);
      if (!loc) return;
      loc.parent.children!.splice(loc.index, 1);
      notify();
    },
    removeTree: async (id) => {
      const loc = findParentOf(id);
      if (!loc) return;
      loc.parent.children!.splice(loc.index, 1);
      notify();
    },
    move: async (id, destination) => {
      const loc = findParentOf(id);
      if (!loc) return;
      const destParent = destination.parentId ? findNode(destination.parentId) : loc.parent;
      if (!destParent) return;
      destParent.children ??= [];
      // Mirror chrome.bookmarks.move: `index` is the target position within the
      // destination's *current* children, counting the node being moved. When
      // moving within the same parent to a higher index, decrement to account
      // for the node's own removal — exactly what Chromium's BookmarkModel does.
      let index = destination.index ?? destParent.children.length;
      if (destParent === loc.parent && index > loc.index) index -= 1;
      const [node] = loc.parent.children!.splice(loc.index, 1);
      destParent.children.splice(Math.max(0, Math.min(index, destParent.children.length)), 0, node);
      notify();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

// ─── Singleton accessor ──────────────────────────────────────────────────────

let instance: BookmarksApi | null = null;

export function getBookmarksApi(): BookmarksApi {
  if (instance) return instance;
  const chromeApi = typeof chrome !== 'undefined' ? chrome.bookmarks : undefined;
  instance = chromeApi ? createChromeApi(chromeApi) : createMockApi();
  return instance;
}
