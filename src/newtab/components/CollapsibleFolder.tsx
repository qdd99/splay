import { useState } from 'react';
import type { BookmarkNode } from '../types';
import { countAll } from '../lib/fuzzyMatch';
import { ChevronIcon, FolderIcon, PlusIcon } from './Icons';
import { LinkGrid } from './LinkGrid';
import { useDrag } from './DragProvider';
import type { BookmarkActions } from '../hooks/useBookmarkActions';

// Unified collapsible folder used at every nesting level (2, 3, 4, …). All
// levels look identical; nesting is conveyed only by the dashed indent line.
export function CollapsibleFolder({
  folder,
  depth,
  defaultOpen,
  actions,
}: {
  folder: BookmarkNode;
  depth: number;
  defaultOpen: boolean;
  actions: BookmarkActions;
}) {
  const [collapsed, setCollapsed] = useState(!defaultOpen);
  const drag = useDrag();

  // Hide folders with no bookmarks anywhere beneath them.
  if (countAll(folder) === 0) return null;

  const children = folder.children ?? [];
  const directLinks = children.filter((c) => c.url);
  const subFolders = children.filter((c) => !c.url && c.children).filter((f) => countAll(f) > 0);

  const headerClass =
    'folder-header' + (drag.isFolderDropTarget(folder.id) ? ' folder-header--drop' : '');

  return (
    <div className="folder">
      <div
        className={headerClass}
        onClick={() => setCollapsed((c) => !c)}
        onContextMenu={(e) => actions.onFolderContextMenu(e, folder)}
        {...drag.folderDropProps(folder.id)}
      >
        <ChevronIcon collapsed={collapsed} size={12} />
        <span className="folder-glyph">
          <FolderIcon size={12} />
        </span>
        <span className="folder-title">{folder.title}</span>
        <button
          type="button"
          className="add-btn add-btn--folder"
          title={`Add bookmark to ${folder.title}`}
          aria-label={`Add bookmark to ${folder.title}`}
          onClick={(e) => {
            e.stopPropagation();
            actions.addBookmark(folder);
          }}
        >
          <PlusIcon />
        </button>
      </div>
      {!collapsed && (
        <div className="folder-body">
          <LinkGrid
            bookmarks={directLinks}
            parent={folder}
            onBookmarkContextMenu={actions.onBookmarkContextMenu}
          />
          {subFolders.map((sf) => (
            <CollapsibleFolder
              key={sf.id}
              folder={sf}
              depth={depth + 1}
              defaultOpen={depth < 2}
              actions={actions}
            />
          ))}
        </div>
      )}
    </div>
  );
}
