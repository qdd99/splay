import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = import.meta.dirname;

// Copy the Manifest V3 manifest into dist/ after the bundle is written.
// Icons live in public/icons and are copied automatically by Vite.
function copyManifest() {
  return {
    name: 'splay-copy-manifest',
    closeBundle() {
      copyFileSync(resolve(root, 'manifest.json'), resolve(root, 'dist/manifest.json'));
    },
  };
}

export default defineConfig({
  plugins: [react(), copyManifest()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    rollupOptions: {
      input: {
        newtab: resolve(root, 'newtab.html'),
        options: resolve(root, 'options.html'),
        background: resolve(root, 'src/background/service-worker.ts'),
      },
      output: {
        // The MV3 service worker must land at a stable, unhashed path.
        entryFileNames: (chunk) =>
          chunk.name === 'background' ? 'service-worker.js' : 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
