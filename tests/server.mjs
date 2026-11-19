#!/usr/bin/env node
// Static server with Vercel semantics for tests: cleanUrls, trailingSlash:false,
// 404.html, the exact headers from vercel.json (so CSP is enforced in tests), and
// brotli/gzip for text types as Vercel's edge applies automatically.
import http from 'node:http';
import http2 from 'node:http2';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.resolve(root, process.argv[2] || 'dist');
const port = Number(process.argv[3] || 4400);
// --h2: HTTP/2 over TLS (self-signed), as Vercel serves production. Used by Lighthouse.
const h2 = process.argv.includes('--h2');
const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json', '.jpg': 'image/jpeg' };
const toRe = (src) => new RegExp('^' + src.replace(/\(\.\*\)/g, '(.*)') + '$');
const headerRules = vercel.headers.map((h) => ({ re: toRe(h.source), headers: h.headers }));

function resolve(urlPath) {
  const p = decodeURIComponent(urlPath.split('?')[0]);
  if (p !== '/' && p.endsWith('/')) return { redirect: p.slice(0, -1) };
  const candidates = p === '/' ? ['index.html'] : [p.slice(1), `${p.slice(1)}.html`];
  for (const c of candidates) {
    const f = path.join(dir, c);
    if (f.startsWith(dir) && fs.existsSync(f) && fs.statSync(f).isFile()) return { file: f };
  }
  if (p.endsWith('.html') && fs.existsSync(path.join(dir, p.slice(1)))) return { redirect: p.slice(0, -5) };
  return { file: path.join(dir, '404.html'), status: 404 };
}

function handler(req, res) {
    const r = resolve(req.url);
    if (r.redirect) {
      res.writeHead(308, { Location: r.redirect });
      return res.end();
    }
    const headers = {};
    for (const rule of headerRules) if (rule.re.test(req.url.split('?')[0])) for (const h of rule.headers) headers[h.key] = h.value;
    let body;
    try {
      body = fs.readFileSync(r.file);
    } catch {
      res.writeHead(404);
      return res.end('not found');
    }
    const type = TYPES[path.extname(r.file)] || 'application/octet-stream';
    headers['Content-Type'] = type;
    const ae = String(req.headers['accept-encoding'] || '');
    if (/text|javascript|svg|json|xml|manifest/.test(type) && body.length > 512) {
      if (/\bbr\b/.test(ae)) {
        body = zlib.brotliCompressSync(body, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 } });
        headers['Content-Encoding'] = 'br';
      } else if (/\bgzip\b/.test(ae)) {
        body = zlib.gzipSync(body, { level: 9 });
        headers['Content-Encoding'] = 'gzip';
      }
      headers['Vary'] = 'Accept-Encoding';
    }
    res.writeHead(r.status || 200, headers);
    res.end(body);
}

if (h2) {
  // the throwaway certificate lives on the workspace filesystem, like test builds
  fs.mkdirSync(path.join(root, '.test-builds'), { recursive: true });
  const tmp = fs.mkdtempSync(path.join(root, '.test-builds', 'tls-'));
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '2', '-subj', '/CN=127.0.0.1', '-addext', 'subjectAltName=IP:127.0.0.1', '-keyout', path.join(tmp, 'k.pem'), '-out', path.join(tmp, 'c.pem')], { stdio: 'ignore' });
  const key = fs.readFileSync(path.join(tmp, 'k.pem'));
  const cert = fs.readFileSync(path.join(tmp, 'c.pem'));
  fs.rmSync(tmp, { recursive: true, force: true }); // read into memory: nothing left behind
  http2
    .createSecureServer({ key, cert, allowHTTP1: true }, handler)
    .listen(port, '127.0.0.1', () => console.log(`serving ${path.relative(root, dir)} on https://127.0.0.1:${port} (h2)`));
} else {
  http.createServer(handler).listen(port, '127.0.0.1', () => console.log(`serving ${path.relative(root, dir)} on http://127.0.0.1:${port}`));
}
