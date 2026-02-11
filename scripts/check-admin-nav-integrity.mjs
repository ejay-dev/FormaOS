#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ADMIN_DIR = path.join(ROOT, 'app', 'admin');
const NAV_FILE = path.join(ROOT, 'app', 'admin', 'components', 'admin-shell.tsx');

function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

function pageFileToRoute(filePath) {
  const rel = path.relative(ADMIN_DIR, filePath).replace(/\\/g, '/');
  if (!rel.endsWith('/page.tsx')) return null;

  const segments = rel.replace(/\/page\.tsx$/, '').split('/');
  if (segments.length === 1 && segments[0] === '') {
    return '/admin';
  }

  const normalized = segments
    .map((segment) => {
      if (!segment) return null;
      if (segment.startsWith('(') && segment.endsWith(')')) return null;
      if (segment.startsWith('[') && segment.endsWith(']')) return ':param';
      return segment;
    })
    .filter(Boolean)
    .join('/');

  return `/admin/${normalized}`.replace(/\/+/g, '/');
}

function routeToRegex(route) {
  const pattern = route
    .split('/')
    .map((segment) => {
      if (!segment) return '';
      if (segment === ':param') return '[^/]+';
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');
  return new RegExp(`^${pattern}$`);
}

function main() {
  if (!fs.existsSync(NAV_FILE)) {
    console.error('[admin-nav-check] NAV file missing:', NAV_FILE);
    process.exit(1);
  }

  const routeFiles = walk(ADMIN_DIR).filter((file) => file.endsWith('/page.tsx'));
  const routes = routeFiles
    .map(pageFileToRoute)
    .filter(Boolean)
    .sort();

  const navContent = fs.readFileSync(NAV_FILE, 'utf8');
  const navRouteMatches = [...navContent.matchAll(/href:\s*['\"]([^'\"]+)['\"]/g)];
  const navRoutes = [...new Set(navRouteMatches.map((match) => match[1]).filter((href) => href.startsWith('/admin')))].sort();

  const routeRegex = new Map(routes.map((route) => [route, routeToRegex(route)]));
  const missing = [];

  for (const navRoute of navRoutes) {
    const exists = routes.includes(navRoute) || Array.from(routeRegex.values()).some((regex) => regex.test(navRoute));
    if (!exists) {
      missing.push(navRoute);
    }
  }

  if (missing.length > 0) {
    console.error(`[admin-nav-check] Missing route targets for ${missing.length} sidebar item(s):`);
    for (const route of missing) {
      console.error(`- ${route}`);
    }
    process.exit(1);
  }

  console.log(`[admin-nav-check] OK: ${navRoutes.length} sidebar routes validated against ${routes.length} admin routes`);
}

main();
