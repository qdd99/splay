import { useCallback } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useOverlay } from '../components/ContextMenu';
import type { MenuEntry } from '../components/ContextMenu';
import type { BookmarkNode } from '../types';
import {
  createBookmark,
  openInNewTab,
  openInNewWindow,
  removeBookmark,
  removeFolder,
  updateBookmark,
} from '../lib/bookmarks';
import {
  CopyIcon,
  EditIcon,
  ExternalLinkIcon,
  PlusIcon,
  TrashIcon,
  WindowIcon,
} from '../components/Icons';

export interface BookmarkActions {
  onBookmarkContextMenu: (e: ReactMouseEvent, node: BookmarkNode) => void;
  onFolderContextMenu: (e: ReactMouseEvent, node: BookmarkNode) => void;
  addBookmark: (folder: BookmarkNode) => void;
}

// Builds right-click menus for bookmarks and folders, wiring each entry to the
// chrome.bookmarks mutation wrappers and the shared dialog overlay.
export function useBookmarkActions(): BookmarkActions {
  const { openMenu, confirm, formDialog } = useOverlay();

  // Shared by the folder context menu and the "+" header button.
  const addBookmark = useCallback(
    (folder: BookmarkNode) => {
      void (async () => {
        const result = await formDialog({
          title: `Add bookmark to “${folder.title}”`,
          fields: [
            { name: 'title', label: 'Name', placeholder: 'My bookmark' },
            { name: 'url', label: 'URL', placeholder: 'https://example.com', type: 'url' },
          ],
          submitLabel: 'Add',
        });
        if (result && (result.title || result.url)) {
          await createBookmark(folder.id, result.title || result.url, result.url || undefined);
        }
      })();
    },
    [formDialog],
  );

  const onBookmarkContextMenu = useCallback(
    (e: ReactMouseEvent, node: BookmarkNode) => {
      const url = node.url ?? '';
      const items: MenuEntry[] = [
        { label: 'Open in new tab', icon: <ExternalLinkIcon />, onSelect: () => openInNewTab(url) },
        { label: 'Open in new window', icon: <WindowIcon />, onSelect: () => openInNewWindow(url) },
        'separator',
        {
          label: 'Copy URL',
          icon: <CopyIcon />,
          onSelect: () => {
            navigator.clipboard?.writeText(url).catch(() => {});
          },
        },
        {
          label: 'Edit',
          icon: <EditIcon />,
          onSelect: () => {
            void (async () => {
              const result = await formDialog({
                title: 'Edit bookmark',
                fields: [
                  { name: 'title', label: 'Name', value: node.title },
                  { name: 'url', label: 'URL', value: node.url, type: 'url' },
                ],
                submitLabel: 'Save',
              });
              if (result) {
                await updateBookmark(node.id, { title: result.title, url: result.url });
              }
            })();
          },
        },
        'separator',
        {
          label: 'Delete',
          icon: <TrashIcon />,
          danger: true,
          onSelect: () => {
            void (async () => {
              const ok = await confirm({
                title: 'Delete bookmark',
                message: `Delete “${node.title || node.url}”? This cannot be undone.`,
                confirmLabel: 'Delete',
                danger: true,
              });
              if (ok) await removeBookmark(node.id);
            })();
          },
        },
      ];
      openMenu(e, items);
    },
    [openMenu, confirm, formDialog],
  );

  const onFolderContextMenu = useCallback(
    (e: ReactMouseEvent, node: BookmarkNode) => {
      const items: MenuEntry[] = [
        {
          label: 'Add bookmark here',
          icon: <PlusIcon />,
          onSelect: () => addBookmark(node),
        },
        {
          label: 'Rename folder',
          icon: <EditIcon />,
          onSelect: () => {
            void (async () => {
              const result = await formDialog({
                title: 'Rename folder',
                fields: [{ name: 'title', label: 'Name', value: node.title }],
                submitLabel: 'Rename',
              });
              if (result && result.title) {
                await updateBookmark(node.id, { title: result.title });
              }
            })();
          },
        },
        'separator',
        {
          label: 'Delete folder',
          icon: <TrashIcon />,
          danger: true,
          onSelect: () => {
            void (async () => {
              const ok = await confirm({
                title: 'Delete folder',
                message: `Delete “${node.title}” and everything inside it? This cannot be undone.`,
                confirmLabel: 'Delete',
                danger: true,
              });
              if (ok) await removeFolder(node.id);
            })();
          },
        },
      ];
      openMenu(e, items);
    },
    [openMenu, confirm, formDialog, addBookmark],
  );

  return { onBookmarkContextMenu, onFolderContextMenu, addBookmark };
}
