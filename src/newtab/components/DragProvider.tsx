import { createContext, useCallback, useContext, useState } from 'react';
import type { DragEvent as ReactDragEvent, HTMLAttributes, ReactNode } from 'react';
import { computeMoveIndex } from '../lib/bookmarksApi';
import { moveBookmark } from '../lib/bookmarks';

// Drag-and-drop for bookmark links: reorder within a folder, or move across
// folders. Only leaf bookmarks are draggable. Links accept drops (reorder
// before/after); folder/section headers accept drops (move into).

interface Dragging {
  id: string;
  parentId: string;
  index: number; // real index within parent's children
}

type DropTarget =
  | { kind: 'link'; id: string; parentId: string; index: number; position: 'before' | 'after' }
  | { kind: 'folder'; id: string };

interface DragApi {
  dragging: boolean;
  linkDragProps: (
    id: string,
    parentId: string,
    index: number,
  ) => HTMLAttributes<HTMLElement> & { draggable: boolean };
  folderDropProps: (folderId: string) => HTMLAttributes<HTMLElement>;
  linkDropIndicator: (id: string) => 'before' | 'after' | null;
  isFolderDropTarget: (folderId: string) => boolean;
}

const DragContext = createContext<DragApi | null>(null);

export function useDrag(): DragApi {
  const ctx = useContext(DragContext);
  if (!ctx) throw new Error('useDrag must be used within <DragProvider>');
  return ctx;
}

export function DragProvider({ children }: { children: ReactNode }) {
  const [dragging, setDragging] = useState<Dragging | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  const reset = useCallback(() => {
    setDragging(null);
    setDropTarget(null);
  }, []);

  const performDrop = useCallback(
    (from: Dragging, target: DropTarget) => {
      if (target.kind === 'link') {
        if (target.id === from.id) return;
        const desiredIndex = target.position === 'before' ? target.index : target.index + 1;
        const sameParent = from.parentId === target.parentId;
        const index = computeMoveIndex(sameParent, from.index, desiredIndex);
        void moveBookmark(from.id, { parentId: target.parentId, index });
      } else {
        // Move into a folder: append at the end.
        if (target.id === from.parentId) return;
        void moveBookmark(from.id, { parentId: target.id });
      }
    },
    [],
  );

  const linkDragProps = useCallback(
    (id: string, parentId: string, index: number) => ({
      draggable: true,
      onDragStart: (e: ReactDragEvent) => {
        e.stopPropagation();
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id);
        setDragging({ id, parentId, index });
      },
      onDragEnd: () => reset(),
      onDragOver: (e: ReactDragEvent) => {
        if (!dragging || dragging.id === id) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        const rect = e.currentTarget.getBoundingClientRect();
        const position = e.clientX < rect.left + rect.width / 2 ? 'before' : 'after';
        setDropTarget((prev) =>
          prev && prev.kind === 'link' && prev.id === id && prev.position === position
            ? prev
            : { kind: 'link', id, parentId, index, position },
        );
      },
      onDrop: (e: ReactDragEvent) => {
        if (!dragging) return;
        e.preventDefault();
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        const position = e.clientX < rect.left + rect.width / 2 ? 'before' : 'after';
        performDrop(dragging, { kind: 'link', id, parentId, index, position });
        reset();
      },
    }),
    [dragging, performDrop, reset],
  );

  const folderDropProps = useCallback(
    (folderId: string) => ({
      onDragOver: (e: ReactDragEvent) => {
        if (!dragging) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDropTarget((prev) =>
          prev && prev.kind === 'folder' && prev.id === folderId
            ? prev
            : { kind: 'folder', id: folderId },
        );
      },
      onDrop: (e: ReactDragEvent) => {
        if (!dragging) return;
        e.preventDefault();
        e.stopPropagation();
        performDrop(dragging, { kind: 'folder', id: folderId });
        reset();
      },
    }),
    [dragging, performDrop, reset],
  );

  const linkDropIndicator = useCallback(
    (id: string): 'before' | 'after' | null =>
      dropTarget?.kind === 'link' && dropTarget.id === id ? dropTarget.position : null,
    [dropTarget],
  );

  const isFolderDropTarget = useCallback(
    (folderId: string): boolean => dropTarget?.kind === 'folder' && dropTarget.id === folderId,
    [dropTarget],
  );

  return (
    <DragContext.Provider
      value={{
        dragging: dragging !== null,
        linkDragProps,
        folderDropProps,
        linkDropIndicator,
        isFolderDropTarget,
      }}
    >
      {children}
    </DragContext.Provider>
  );
}
