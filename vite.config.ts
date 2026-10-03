import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';

// Development reads the WebP web pack first, then the preserved source pack for SVG UI; the build copies both to dist/art.
const artRoots = [resolve('art/web/v01'), resolve('art/production/v01')];
export default defineConfig({
  base: './',
  plugins: [react(), {
    name: 'local-art-pack',
    configureServer(server) {
      server.middlewares.use('/art', async (req, res, next) => {
        // Source JSON imports still belong to Vite's module pipeline.
        if (req.url?.startsWith('/production/v01/') || req.url?.startsWith('/ui-screens/')) { next(); return; }
        let path: string;
        try { path = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname); } catch { res.writeHead(404).end(); return; }
        for (const artRoot of artRoots) {
          const file = resolve(artRoot, '.' + path);
          if (!file.startsWith(artRoot + sep) || !(await stat(file).then(s => s.isFile(), () => false))) continue;
          const mime: Record<string,string> = { '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml', '.html':'text/html; charset=utf-8', '.json':'application/json; charset=utf-8' };
          res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
          createReadStream(file).pipe(res);
          return;
        }
        res.writeHead(404).end();
      });
    }
  }],
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  build: { target: ['es2022', 'chrome109', 'safari16.4'], rollupOptions: { input: { game:resolve('index.html'), screens:resolve('ui-preview.html') } } }
});
