import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { resolve, dirname, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../art/production/v01');
const types = { '.html':'text/html; charset=utf-8', '.png':'image/png', '.svg':'image/svg+xml', '.json':'application/json; charset=utf-8', '.md':'text/plain; charset=utf-8' };
const server = createServer((req,res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const target = resolve(root, '.' + (path === '/' ? '/gallery.html' : path));
    if (!target.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    if (!statSync(target).isFile()) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type':types[extname(target)] || 'application/octet-stream', 'X-Content-Type-Options':'nosniff' });
    createReadStream(target).pipe(res);
  } catch { res.writeHead(404).end('Not found'); }
});
server.listen(4178, '127.0.0.1', () => console.log('Art gallery: http://127.0.0.1:4178'));
