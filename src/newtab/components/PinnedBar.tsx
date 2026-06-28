import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { BookmarkNode } from '../types';
import { PINNED_ACCENT, accentVars } from '../lib/accent';
import { ChevronIcon } from './Icons';
import { LinkGrid } from './LinkGrid';
import { useDrag } from './DragProvider';
import type { BookmarkActions } from '../hooks/useBookmarkActions';

// Loose links sitting directly on the Bookmarks Bar → a full-width pinned strip
// at the top, above the category cards.
export function PinnedBar({
  parent,
  bookmarks,
  actions,
}: {
  parent: BookmarkNode;
  bookmarks: BookmarkNode[];
  actions: BookmarkActions;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const drag = useDrag();

  if (bookmarks.length === 0) return null;

  const headerClass =
    'card-header' + (drag.isFolderDropTarget(parent.id) ? ' card-header--drop' : '');

  return (
    <div className="card card--pinned" style={accentVars(PINNED_ACCENT) as CSSProperties}>
      <div
        className={headerClass}
        onClick={() => setCollapsed((c) => !c)}
        {...drag.folderDropProps(parent.id)}
      >
        <div className="card-header-left">
          <span className="card-title card-title--pinned">Bookmarks Bar</span>
        </div>
        <div className="card-header-right">
          <ChevronIcon collapsed={collapsed} />
        </div>
      </div>
      {!collapsed && (
        <div className="card-body card-body--pinned">
          <LinkGrid
            bookmarks={bookmarks}
            parent={parent}
            onBookmarkContextMenu={actions.onBookmarkContextMenu}
          />
        </div>
      )}
    </div>
  );
}
