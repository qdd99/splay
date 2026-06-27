# Contributing to Splay

Thanks for your interest in improving Splay.

## Development setup

```bash
npm install
npm run dev      # Vite dev server with mock bookmark data
```

`npm run dev` runs the UI in a normal browser tab using mock data, since the
`chrome.bookmarks` API is only available inside the extension. Use it for fast
UI iteration.

## Testing in Chrome

```bash
npm run build
```

This type-checks, regenerates the icons, and writes a loadable extension to
`dist/`. Then:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `dist/` folder
4. Open a new tab

After code changes, run `npm run build` again and click the reload icon on the
extension card.

## Project layout

- `src/newtab/` — the new tab directory UI (React)
  - `components/` — presentational components
  - `hooks/` — `useBookmarks` (real-time sync), search hotkeys, context actions
  - `lib/` — fuzzy match, favicon, accent colors, bookmark mutations
  - `styles/` — design tokens (`tokens.css`) and component styles (`app.css`)
- `src/options/` — the options/about page
- `src/background/` — minimal MV3 service worker
- `scripts/gen-icons.mjs` — dependency-free icon generator
- `manifest.json` — Manifest V3 definition

## Guidelines

- Keep the directory **dense**. Splay is a web directory, not a dashboard.
- All folder levels share one collapsible component — don't differentiate them.
- No network requests beyond Chrome's local favicon cache.
- Run `npm run typecheck` before opening a PR.
