import type { MouseEvent as ReactMouseEvent } from 'react';
import type { BookmarkNode } from '../types';
import { BookmarkLink } from './BookmarkLink';
import { useDrag } from './DragProvider';

// Renders a folder's direct links in a responsive grid, in their natural order.
// (Searching is handled separately by the ranked results view.) Each link is a
// drag source and reorder drop target.
export function LinkGrid({
  bookmarks,
  parent,
  onBookmarkContextMenu,
}: {
  bookmarks: BookmarkNode[];
  parent: BookmarkNode;
  onBookmarkContextMenu: (e: ReactMouseEvent, node: BookmarkNode) => void;
}) {
  const drag = useDrag();
  if (!bookmarks.length) return null;

  const siblings = parent.children ?? [];

  return (
    <div className="link-grid">
      {bookmarks.map((node) => {
        const realIndex = siblings.indexOf(node);
        const dragProps =
          realIndex >= 0 ? drag.linkDragProps(node.id, parent.id, realIndex) : undefined;
        return (
          <BookmarkLink
            key={node.id}
            node={node}
            onContextMenu={onBookmarkContextMenu}
            dragProps={dragProps}
            dropIndicator={drag.linkDropIndicator(node.id)}
          />
        );
      })}
    </div>
  );
}
