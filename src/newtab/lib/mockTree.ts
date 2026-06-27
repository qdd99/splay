import type { BookmarkNode } from '../types';

// Mock bookmark tree used only when the chrome.bookmarks API is unavailable
// (i.e. `vite dev` in a normal browser tab). At runtime inside the extension,
// useBookmarks replaces this with chrome.bookmarks.getTree(). It mirrors the
// real tree shape: root → [Bookmarks Bar, Other Bookmarks, Mobile Bookmarks].

let nextId = 100;
const id = () => String(nextId++);

const leaf = (title: string, url: string): BookmarkNode => ({ id: id(), title, url });
const folder = (title: string, children: BookmarkNode[]): BookmarkNode => ({
  id: id(),
  title,
  children,
});

export const MOCK_TREE: BookmarkNode = {
  id: '0',
  title: '',
  children: [
    {
      id: '1',
      title: 'Bookmarks Bar',
      children: [
        // Loose links → rendered in the Pinned Bar
        leaf('Google', 'https://www.google.com'),
        leaf('Gmail', 'https://mail.google.com'),
        leaf('Google Drive', 'https://drive.google.com'),
        leaf('YouTube', 'https://www.youtube.com'),
        leaf('GitHub', 'https://github.com'),
        leaf('Claude', 'https://claude.ai'),
        leaf('ChatGPT', 'https://chat.openai.com'),
        leaf('Twitter / X', 'https://x.com'),
        leaf('Notion', 'https://www.notion.so'),
        leaf('Reddit', 'https://www.reddit.com'),
        // Folders → rendered as category cards
        folder('Dev Tools', [
          leaf('Stack Overflow', 'https://stackoverflow.com'),
          leaf('MDN Web Docs', 'https://developer.mozilla.org'),
          leaf('Can I Use', 'https://caniuse.com'),
          leaf('CodePen', 'https://codepen.io'),
          leaf('Regex101', 'https://regex101.com'),
          folder('Frontend Frameworks', [
            leaf('React', 'https://react.dev'),
            leaf('Vue.js', 'https://vuejs.org'),
            leaf('Svelte', 'https://svelte.dev'),
            leaf('Next.js', 'https://nextjs.org'),
            leaf('Astro', 'https://astro.build'),
            folder('UI Libraries', [
              leaf('shadcn/ui', 'https://ui.shadcn.com'),
              leaf('Radix UI', 'https://www.radix-ui.com'),
              leaf('Ant Design', 'https://ant.design'),
              folder('Chart Libraries', [
                leaf('Recharts', 'https://recharts.org'),
                leaf('D3.js', 'https://d3js.org'),
                leaf('ECharts', 'https://echarts.apache.org'),
              ]),
            ]),
          ]),
          folder('Backend & Runtime', [
            leaf('Node.js', 'https://nodejs.org'),
            leaf('Deno', 'https://deno.land'),
            leaf('Bun', 'https://bun.sh'),
            folder('Python', [
              leaf('Django', 'https://www.djangoproject.com'),
              leaf('FastAPI', 'https://fastapi.tiangolo.com'),
              leaf('Flask', 'https://flask.palletsprojects.com'),
            ]),
            folder('Rust', [
              leaf('Rust', 'https://www.rust-lang.org'),
              leaf('crates.io', 'https://crates.io'),
              leaf('Tokio', 'https://tokio.rs'),
            ]),
          ]),
          folder('CSS & Styling', [
            leaf('Tailwind CSS', 'https://tailwindcss.com'),
            leaf('UnoCSS', 'https://unocss.dev'),
            leaf('Open Props', 'https://open-props.style'),
          ]),
        ]),
        folder('AI & Machine Learning', [
          leaf('Hugging Face', 'https://huggingface.co'),
          leaf('Perplexity', 'https://www.perplexity.ai'),
          leaf('Kaggle', 'https://www.kaggle.com'),
          folder('Developer Tools', [
            leaf('Replicate', 'https://replicate.com'),
            leaf('Ollama', 'https://ollama.com'),
            leaf('LangChain', 'https://langchain.com'),
            leaf('Cursor', 'https://cursor.com'),
          ]),
          folder('Academic & Papers', [
            leaf('arXiv', 'https://arxiv.org'),
            leaf('Papers With Code', 'https://paperswithcode.com'),
            leaf('Google Scholar', 'https://scholar.google.com'),
          ]),
        ]),
        folder('Design', [
          leaf('Figma', 'https://www.figma.com'),
          leaf('Dribbble', 'https://dribbble.com'),
          leaf('Behance', 'https://www.behance.net'),
          leaf('Mobbin', 'https://mobbin.com'),
          folder('Stock & Assets', [
            leaf('Unsplash', 'https://unsplash.com'),
            leaf('Pexels', 'https://www.pexels.com'),
            leaf('Lucide Icons', 'https://lucide.dev'),
          ]),
          folder('Color & Fonts', [
            leaf('Coolors', 'https://coolors.co'),
            leaf('Google Fonts', 'https://fonts.google.com'),
          ]),
        ]),
        folder('News', [
          leaf('Hacker News', 'https://news.ycombinator.com'),
          leaf('TechCrunch', 'https://techcrunch.com'),
          leaf('The Verge', 'https://www.theverge.com'),
          leaf('Reuters', 'https://www.reuters.com'),
        ]),
        folder('Productivity', [
          leaf('Obsidian', 'https://obsidian.md'),
          leaf('Linear', 'https://linear.app'),
          leaf('Excalidraw', 'https://excalidraw.com'),
          leaf('Raindrop.io', 'https://raindrop.io'),
          leaf('1Password', 'https://1password.com'),
          leaf('Raycast', 'https://www.raycast.com'),
        ]),
        folder('Cloud & Deploy', [
          folder('Cloud Providers', [
            leaf('AWS', 'https://aws.amazon.com/console'),
            leaf('Google Cloud', 'https://console.cloud.google.com'),
          ]),
          folder('Platforms & PaaS', [
            leaf('Vercel', 'https://vercel.com'),
            leaf('Netlify', 'https://www.netlify.com'),
            leaf('Railway', 'https://railway.app'),
            leaf('Fly.io', 'https://fly.io'),
            leaf('Cloudflare', 'https://dash.cloudflare.com'),
          ]),
          folder('Databases', [
            leaf('PlanetScale', 'https://planetscale.com'),
            leaf('Neon', 'https://neon.tech'),
            leaf('Supabase', 'https://supabase.com'),
          ]),
          folder('Monitoring', [
            leaf('Sentry', 'https://sentry.io'),
            leaf('Datadog', 'https://www.datadoghq.com'),
            leaf('Grafana', 'https://grafana.com'),
          ]),
        ]),
        folder('Media & Entertainment', [
          leaf('Spotify', 'https://open.spotify.com'),
          leaf('Netflix', 'https://www.netflix.com'),
          leaf('IMDb', 'https://www.imdb.com'),
          leaf('Twitch', 'https://www.twitch.tv'),
        ]),
      ],
    },
    {
      id: '2',
      title: 'Other Bookmarks',
      children: [
        leaf('Wikipedia', 'https://www.wikipedia.org'),
        leaf('Internet Archive', 'https://archive.org'),
        folder('Read Later', [
          leaf('How DNS Works', 'https://howdns.works'),
          leaf('Putting the You in CPU', 'https://cpu.land'),
          leaf('Build Your Own X', 'https://github.com/codecrafters-io/build-your-own-x'),
        ]),
        folder('Old Favorites', [
          leaf('W3Schools', 'https://www.w3schools.com'),
          leaf('DevDocs', 'https://devdocs.io'),
        ]),
      ],
    },
    {
      id: '3',
      title: 'Mobile Bookmarks',
      children: [
        leaf('Wikipedia Mobile', 'https://m.wikipedia.org'),
        leaf('Maps', 'https://maps.google.com'),
        leaf('Translate', 'https://translate.google.com'),
      ],
    },
  ],
};
