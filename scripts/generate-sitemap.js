#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// Prefer explicit env var; also allow SITEMAP_API_URL for CI platforms
const API_BASE = (process.env.REACT_APP_API_BASE && process.env.REACT_APP_API_BASE.trim()) || (process.env.SITEMAP_API_URL && process.env.SITEMAP_API_URL.trim()) || 'http://localhost:3000/api';
const OUT_PATH = path.join(__dirname, '..', 'public', 'sitemap.xml');
const REQUEST_TIMEOUT = 7000; // ms

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(REQUEST_TIMEOUT, () => {
      req.destroy(new Error('timeout'));
    });
  });
}

function writeSitemapUrls(host, urls) {
  const now = new Date().toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...urls].map(u => `  <url>\n    <loc>${host.replace(/\/$/, '')}${u}</loc>\n    <lastmod>${now}</lastmod>\n  </url>`).join('\n')}\n</urlset>`;
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, xml, 'utf8');
  console.log('[sitemap] Wrote', OUT_PATH);
}

(async () => {
  try {
    console.log('[sitemap] API base:', API_BASE);
    // attempt to fetch up to 10000 products via paged products endpoint
    const url = `${API_BASE.replace(/\/$/, '')}/products?page=1&limit=10000`;
    const res = await fetchJson(url);
    const products = Array.isArray(res.products) ? res.products : (Array.isArray(res) ? res : (res.products || []));

    const host = (process.env.REACT_APP_SITE_ORIGIN && process.env.REACT_APP_SITE_ORIGIN.trim()) || (process.env.SITE_ORIGIN && process.env.SITE_ORIGIN.trim()) || 'http://localhost:3000';
    const urls = new Set(['/', '/products']);
    (products || []).forEach(p => {
      if (!p) return;
      const id = p._id || p.id || p.Number || p.number;
      if (!id) return;
      urls.add(`/product/${encodeURIComponent(String(id))}`);
    });

    writeSitemapUrls(host, urls);
    process.exit(0);
  } catch (err) {
    console.error('[sitemap] Failed to generate sitemap:', err && err.message ? err.message : err);
    // fallback: write a minimal sitemap with static routes to avoid build failures on CI
    try {
      const host = (process.env.REACT_APP_SITE_ORIGIN && process.env.REACT_APP_SITE_ORIGIN.trim()) || (process.env.SITE_ORIGIN && process.env.SITE_ORIGIN.trim()) || 'http://localhost:3000';
      const urls = new Set(['/', '/products']);
      writeSitemapUrls(host, urls);
      console.warn('[sitemap] Wrote minimal sitemap as fallback.');
      process.exit(0);
    } catch (e) {
      console.error('[sitemap] Failed to write fallback sitemap:', e && e.message ? e.message : e);
      process.exit(0);
    }
  }
})();
