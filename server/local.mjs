import http from 'node:http';
import { createServer } from 'vite';
const port = Number(process.env.PORT || 5188);
const vite = await createServer({ server: { middlewareMode: true, hmr: { port: port + 100 } }, appType: 'spa' });
let api;
try { api = (await import('./api.mjs')).localApi; } catch (e) { if (e.code !== 'ERR_MODULE_NOT_FOUND') throw e; }
http.createServer(async (req, res) => {
  if (req.url.startsWith('/api/') || req.url === '/healthz') {
    if (api) return api(req, res);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(req.url === '/api/config' ? { mode: 'demo' } : { error: 'The office is warming up.' }));
    return;
  }
  vite.middlewares(req, res);
}).listen(port, '127.0.0.1', () => console.log(`Agent Office: http://127.0.0.1:${port}`));
