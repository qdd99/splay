import { useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { BookmarkNode } from './types';
import { useBookmarks } from './hooks/useBookmarks';
import { useSearchHotkeys } from './hooks/useSearchHotkeys';
import { useBookmarkActions } from './hooks/useBookmarkActions';
import { useArrowNavigation } from './hooks/useArrowNavigation';
import { useColumnCount } from './hooks/useColumnCount';
import { useSettings } from './hooks/useSettings';
import { useAccentMap } from './hooks/useAccentMap';
import { densityScale, linkGridTemplate } from './lib/settings';
import { countAll } from './lib/fuzzyMatch';
import { distributeGreedy, estimateCardWeight } from './lib/layout';
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

  const totalBookmarks = useMemo(
    () => topLevel.reduce((sum, c) => sum + countAll(c), 0),
    [topLevel],
  );

  const showOther = settings.showOther && countAll(otherBookmarks) > 0;
  const showMobile = settings.showMobile && countAll(mobileBookmarks) > 0;

  const numColumns = useColumnCount(settings.columns);

  // Build the card list in order, then greedily place each card into the column
  // with the most empty space (least accumulated weight). Weights are estimated
  // from content, not rendered height, so collapsing/expanding a card never
  // changes the distribution — cards stay in their columns.
  const cardItems: { node: BookmarkNode; el: ReactNode }[] = categories
    .filter((c) => countAll(c) > 0)
    .map((category) => ({
      node: category,
      el: (
        <CategoryCard
          key={category.id}
          category={category}
          accent={accentFor(category.id)}
          actions={actions}
        />
      ),
    }));
  if (showOther) {
    cardItems.push({
      node: otherBookmarks,
      el: (
        <TopLevelSection key="__other" section={otherBookmarks} label="Other Bookmarks" actions={actions} />
      ),
    });
  }
  if (showMobile) {
    cardItems.push({
      node: mobileBookmarks,
      el: (
        <TopLevelSection key="__mobile" section={mobileBookmarks} label="Mobile Bookmarks" actions={actions} />
      ),
    });
  }
  const weights = cardItems.map((item) => estimateCardWeight(item.node, settings.cardColumns));
  const masonry: ReactNode[][] = distributeGreedy(weights, numColumns).map((indices) =>
    indices.map((i) => cardItems[i].el),
  );

  const rootStyle = {
    ['--scale']: densityScale(settings.density),
    ['--link-grid-cols']: linkGridTemplate(settings.cardColumns),
  } as CSSProperties;

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
            count={root ? totalBookmarks : undefined}
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

          <main className="container columns">
            {masonry.map((col, i) => (
              <div className="col" key={i}>
                {col}
              </div>
            ))}
          </main>
        </>
      )}

      <footer className="footer">
        Real-time sync · Your data never leaves the browser
      </footer>
    </div>
  );
}
