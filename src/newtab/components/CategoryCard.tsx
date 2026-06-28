import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { BookmarkNode } from '../types';
import type { Accent } from '../lib/accent';
import { accentVars } from '../lib/accent';
import { countAll } from '../lib/fuzzyMatch';
import { ChevronIcon, PlusIcon } from './Icons';
import { LinkGrid } from './LinkGrid';
import { CollapsibleFolder } from './CollapsibleFolder';
import { useDrag } from './DragProvider';
import type { BookmarkActions } from '../hooks/useBookmarkActions';

// Level-1 folder on the Bookmarks Bar → a category card with a colored left
// border. The accent is published as the inherited --accent custom property so
// links, nested dashed lines, and letter avatars all pick it up.
export function CategoryCard({
  category,
  accent,
  actions,
}: {
  category: BookmarkNode;
  accent: Accent;
  actions: BookmarkActions;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const drag = useDrag();

  if (countAll(category) === 0) return null;

  const children = category.children ?? [];
  const directLinks = children.filter((c) => c.url);
  const subFolders = children.filter((c) => !c.url && c.children).filter((f) => countAll(f) > 0);

  const headerClass =
    'card-header' + (drag.isFolderDropTarget(category.id) ? ' card-header--drop' : '');

  return (
    <div className="card" style={accentVars(accent) as CSSProperties}>
      <div
        className={headerClass}
        onClick={() => setCollapsed((c) => !c)}
        onContextMenu={(e) => actions.onFolderContextMenu(e, category)}
        {...drag.folderDropProps(category.id)}
      >
        <div className="card-header-left">
          <span className="card-dot" />
          <span className="card-title">{category.title}</span>
        </div>
        <div className="card-header-right">
          <button
            type="button"
            className="add-btn"
            title={`Add bookmark to ${category.title}`}
            aria-label={`Add bookmark to ${category.title}`}
            onClick={(e) => {
              e.stopPropagation();
              actions.addBookmark(category);
            }}
          >
            <PlusIcon />
          </button>
          <ChevronIcon collapsed={collapsed} />
        </div>
      </div>
      {!collapsed && (
        <div className="card-body">
          <LinkGrid
            bookmarks={directLinks}
            parent={category}
            onBookmarkContextMenu={actions.onBookmarkContextMenu}
          />
          {directLinks.length > 0 && subFolders.length > 0 && <div className="card-sep" />}
          {subFolders.map((sf) => (
            <CollapsibleFolder
              key={sf.id}
              folder={sf}
              depth={2}
              defaultOpen={true}
              actions={actions}
            />
          ))}
        </div>
      )}
    </div>
  );
}
