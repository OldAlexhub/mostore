#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const API_BASE = (process.env.REACT_APP_API_BASE && process.env.REACT_APP_API_BASE.trim()) || 'http://localhost:3000/api';
const OUT_PATH = path.join(__dirname, '..', 'public', 'sitemap.xml');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

(async () => {
  try {
    console.log('[sitemap] API base:', API_BASE);
    // attempt to fetch up to 10000 products via paged products endpoint
    const url = `${API_BASE.replace(/\/$/, '')}/products?page=1&limit=10000`;
    const res = await fetchJson(url);
    const products = Array.isArray(res.products) ? res.products : (Array.isArray(res) ? res : (res.products || []));

    const host = (process.env.REACT_APP_SITE_ORIGIN && process.env.REACT_APP_SITE_ORIGIN.trim()) || 'http://localhost:3000';
    const urls = new Set(['/', '/products']);
    (products || []).forEach(p => {
      if (!p) return;
      const id = p._id || p.id || p.Number || p.number;
      if (!id) return;
      urls.add(`/product/${encodeURIComponent(String(id))}`);
    });

    const now = new Date().toISOString();
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...urls].map(u => `  <url>\n    <loc>${host.replace(/\/$/, '')}${u}</loc>\n    <lastmod>${now}</lastmod>\n  </url>`).join('\n')}\n</urlset>`;

    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, xml, 'utf8');
    console.log('[sitemap] Wrote', OUT_PATH);
    process.exit(0);
  } catch (err) {
    console.error('[sitemap] Failed to generate sitemap:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
