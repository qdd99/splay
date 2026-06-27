import { useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { BookmarkNode } from './types';
import { useBookmarks } from './hooks/useBookmarks';
import { useSearchHotkeys } from './hooks/useSearchHotkeys';
import { useBookmarkActions } from './hooks/useBookmarkActions';
import { useArrowNavigation } from './hooks/useArrowNavigation';
import { useSettings } from './hooks/useSettings';
import { useAccentMap } from './hooks/useAccentMap';
import { densityScale } from './lib/settings';
import { countAll } from './lib/fuzzyMatch';
import { searchBookmarks } from './lib/search';
import { SearchBar } from './components/SearchBar';
import { SearchResults } from './components/SearchResults';
import { PinnedBar } from './components/PinnedBar';
import { CategoryCard } from './components/CategoryCard';
import { TopLevelSection } from './components/TopLevelSection';
import { GearIcon } from './components/Icons';

const EMPTY: BookmarkNode = { id: '', title: '', children: [] };

function openOptions() {
  if (typeof chrome !== 'undefined' && chrome.runtime?.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open('/options.html', '_blank');
  }
}

export function App() {
  const root = useBookmarks();
  const { settings } = useSettings();
  const [query, setQuery] = useState('');
  const searchQuery = query.toLowerCase().trim();
  const searchRef = useRef<HTMLInputElement>(null);
  const actions = useBookmarkActions();

  useSearchHotkeys(searchRef, () => setQuery(''));
  useArrowNavigation();

  const topLevel = root?.children ?? [];
  const bookmarksBar = topLevel.find((c) => c.id === '1') ?? EMPTY;
  const otherBookmarks = topLevel.find((c) => c.id === '2') ?? EMPTY;
  const mobileBookmarks = topLevel.find((c) => c.id === '3') ?? EMPTY;

  const barChildren = bookmarksBar.children ?? [];
  const pinnedLinks = barChildren.filter((c) => c.url);
  const categories = barChildren.filter((c) => !c.url && c.children);

  const categoryIds = useMemo(() => categories.map((c) => c.id), [categories]);
  const accentFor = useAccentMap(categoryIds);

  const results = useMemo(
    () => (root && searchQuery ? searchBookmarks(root, searchQuery) : []),
    [root, searchQuery],
  );

  const showOther = settings.showOther && countAll(otherBookmarks) > 0;
  const showMobile = settings.showMobile && countAll(mobileBookmarks) > 0;
  const hasBottom = showOther || showMobile;

  const rootStyle = { ['--scale']: densityScale(settings.density) } as CSSProperties;
  const columnStyle: CSSProperties | undefined =
    settings.columns > 0 ? { columnCount: settings.columns } : undefined;

  return (
    <div className="splay" style={rootStyle}>
      <header className="header">
        <div className="header-inner">
          <div className="header-side" />
          <SearchBar
            query={query}
            onChange={setQuery}
            onClear={() => setQuery('')}
            inputRef={searchRef}
          />
          <div className="header-side header-side--right">
            <button
              type="button"
              className="icon-btn"
              title="Settings"
              aria-label="Settings"
              onClick={openOptions}
            >
              <GearIcon />
            </button>
          </div>
        </div>
      </header>

      {!root ? (
        <div className="loading">Loading your bookmarks…</div>
      ) : searchQuery ? (
        results.length > 0 ? (
          <SearchResults results={results} onBookmarkContextMenu={actions.onBookmarkContextMenu} />
        ) : (
          <div className="empty-state">No bookmarks match “{query}”</div>
        )
      ) : (
        <>
          {settings.showPinned && (
            <div className="container pinned-wrap">
              <PinnedBar parent={bookmarksBar} bookmarks={pinnedLinks} actions={actions} />
            </div>
          )}

          <main className="container columns" style={columnStyle}>
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                accent={accentFor(category.id)}
                actions={actions}
              />
            ))}
          </main>

          {hasBottom && (
            <div className="container">
              <div className="divider" />
              <div className="bottom-sections">
                {showOther && (
                  <TopLevelSection section={otherBookmarks} label="Other Bookmarks" actions={actions} />
                )}
                {showMobile && (
                  <TopLevelSection
                    section={mobileBookmarks}
                    label="Mobile Bookmarks"
                    actions={actions}
                  />
                )}
              </div>
            </div>
          )}
        </>
      )}

      <footer className="footer">
        Chrome bookmarks · Real-time sync · Your data never leaves the browser
      </footer>
    </div>
  );
}
