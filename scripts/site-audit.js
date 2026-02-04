/*
Simple site crawler to check public pages and links without Playwright.
Saves results to test-results/site-audit.json
Usage: BASE=http://localhost:3000 node scripts/site-audit.js
*/

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const { URL } = require('url');

const BASE = process.env.BASE || 'http://localhost:3000';
const START_PATH = '/';
const MAX_PAGES = 200;
const TIMEOUT_MS = 10000;

const visited = new Set();
const queue = [START_PATH];
const results = {};

function normalizeHref(href, base) {
  if (!href) return null;
  href = href.split('#')[0];
  href = href.trim();
  if (!href) return null;
  if (href.startsWith('mailto:') || href.startsWith('tel:')) return null;
  try {
    const url = new URL(href, base);
    // only same-origin
    if (url.origin !== new URL(BASE).origin) return null;
    return url.pathname + (url.search || '');
  } catch (e) {
    return null;
  }
}

async function fetchPath(path) {
  const url = new URL(path, BASE).toString();
  try {
    const resp = await axios.get(url, { timeout: TIMEOUT_MS, maxRedirects: 5 });
    return { status: resp.status, data: resp.data, url };
  } catch (err) {
    // include as much detail as possible for debugging
    const detail = {};
    if (err.response) {
      detail.status = err.response.status;
      detail.data = err.response.data || '';
    }
    if (err.request) {
      detail.requestInfo = 'request-made-no-response';
    }
    detail.message = err.message;
    detail.code = err.code;
    console.error('fetchPath error for', url, detail);
    return { status: 'ERROR', error: JSON.stringify(detail), url };
  }
}

(async () => {
  while (queue.length && visited.size < MAX_PAGES) {
    const path = queue.shift();
    if (visited.has(path)) continue;
    visited.add(path);
    console.log('Fetching', path);
    const pageResult = {
      path,
      errors: [],
      links: [],
      status: null,
      bodyLength: 0,
    };

    const resp = await fetchPath(path);
    pageResult.status = resp.status;

    if (resp.status !== 200) {
      pageResult.errors.push(`HTTP ${resp.status}`);
    }

    if (resp.data) {
      const body = String(resp.data);
      pageResult.bodyLength = body.length;
      const lower = body.toLowerCase();
      if (lower.includes('internal server error'))
        pageResult.errors.push('contains: internal server error');

      // Heuristic: Next dev/SSR can include a built-in not-found fragment in
      // the render tree while still returning the full marketing page HTML.
      // Only flag a page as 404/not-found when the body clearly looks like
      // a standalone not-found page (contains not-found markers AND lacks
      // common site markers such as brand or main hero CTA).
      const looksLikeNotFound =
        lower.includes('this page could not be found') ||
        /\b404\b/.test(lower) ||
        lower.includes('not found');

      const hasSiteMarkers =
        lower.includes('formaos') ||
        lower.includes('get started') ||
        lower.includes('start free') ||
        lower.includes('<main') ||
        lower.includes('get started free');

      if (looksLikeNotFound && !hasSiteMarkers) {
        pageResult.errors.push('contains: 404/not found');
      }

      try {
        const $ = cheerio.load(body);
        $('a[href]').each((_, el) => {
          const href = $(el).attr('href');
          const norm = normalizeHref(href, resp.url);
          pageResult.links.push({ raw: href, normalized: norm });
        });

        // also capture form actions
        $('form[action]').each((_, el) => {
          const href = $(el).attr('action');
          const norm = normalizeHref(href, resp.url);
          pageResult.links.push({ raw: href, normalized: norm, type: 'form' });
        });
      } catch (e) {
        pageResult.errors.push('html-parse-failed');
      }
    } else if (resp.error) {
      pageResult.errors.push(`fetch-error: ${resp.error}`);
    }

    results[path] = pageResult;

    // enqueue discovered internal links
    for (const l of pageResult.links) {
      if (
        l.normalized &&
        !visited.has(l.normalized) &&
        !queue.includes(l.normalized)
      ) {
        queue.push(l.normalized);
      }
    }
  }

  // post-process: validate each discovered normalized link directly
  const linkChecks = {};
  const allLinks = new Set();
  for (const p of Object.values(results)) {
    for (const l of p.links) if (l.normalized) allLinks.add(l.normalized);
  }

  console.log('Checking', allLinks.size, 'unique internal links');

  for (const link of allLinks) {
    const resp = await fetchPath(link);
    const rec = {
      path: link,
      status: resp.status,
      url: resp.url,
      ok: resp.status === 200,
    };
    if (resp.data) {
      const lower = String(resp.data).toLowerCase();
      rec.bodyLength = String(resp.data).length;
      if (lower.includes('internal server error'))
        rec.error = 'contains internal server error';

      const looksLikeNotFound =
        lower.includes('this page could not be found') ||
        /\b404\b/.test(lower) ||
        lower.includes('not found');
      const hasSiteMarkers =
        lower.includes('formaos') ||
        lower.includes('get started') ||
        lower.includes('start free') ||
        lower.includes('<main') ||
        lower.includes('get started free');

      if (looksLikeNotFound && !hasSiteMarkers) {
        rec.error =
          (rec.error ? rec.error + '; ' : '') + 'contains 404/not found';
      }
    }
    linkChecks[link] = rec;
  }

  const summary = {
    crawledPages: Object.keys(results).length,
    checkedLinks: Object.keys(linkChecks).length,
  };
  const output = { base: BASE, summary, pages: results, links: linkChecks };

  try {
    fs.mkdirSync('test-results', { recursive: true });
    fs.writeFileSync(
      'test-results/site-audit.json',
      JSON.stringify(output, null, 2),
    );
    console.log('Saved report to test-results/site-audit.json');
  } catch (e) {
    console.error('Failed to save report', e);
  }

  // print quick failures
  let failCount = 0;
  for (const [p, rec] of Object.entries(results)) {
    if (rec.errors && rec.errors.length) {
      console.log('PAGE ISSUE:', p, rec.errors);
      failCount++;
    }
  }

  for (const [l, rec] of Object.entries(linkChecks)) {
    if (!rec.ok || (rec.error && rec.error.length)) {
      console.log('LINK ISSUE:', l, 'status=', rec.status, rec.error || '');
      failCount++;
    }
  }

  console.log(
    'Audit complete. pages:',
    summary.crawledPages,
    'links checked:',
    summary.checkedLinks,
    'issues:',
    failCount,
  );
})();
