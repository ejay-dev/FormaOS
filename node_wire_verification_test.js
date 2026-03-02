#!/usr/bin/env node

/**
 * FORMAOS Node & Wire System Verification Test
 * Performs concrete local verification of route wiring and optional DB checks.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const APP_DIR = path.join(__dirname, 'app');
const MIDDLEWARE_PATH = path.join(__dirname, 'middleware.ts');
const ENV_PATH = path.join(__dirname, '.env.local');

function readEnvFile() {
  if (!fs.existsSync(ENV_PATH)) return {};
  const envContent = fs.readFileSync(ENV_PATH, 'utf8');
  const envVars = {};

  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (!match) return;

    const key = match[1].trim();
    let value = match[2].trim();
    const commentIndex = value.indexOf(' #');
    if (commentIndex !== -1) {
      value = value.slice(0, commentIndex).trim();
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    envVars[key] = value;
  });

  return envVars;
}

function isPlaceholder(value) {
  if (!value) return true;
  const normalized = String(value).toLowerCase();
  return (
    normalized.includes('your-project') ||
    normalized.includes('placeholder') ||
    normalized.includes('changeme') ||
    normalized.includes('example.com') ||
    normalized.startsWith('<')
  );
}

function isValidSupabaseConfig(url, key) {
  if (!url || !key) return false;
  if (isPlaceholder(url) || isPlaceholder(key)) return false;

  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
}

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, out);
    } else {
      out.push(fullPath);
    }
  }

  return out;
}

function isRouteFile(filePath) {
  const base = path.basename(filePath);
  return /^page\.(ts|tsx|js|jsx)$/.test(base) || /^route\.(ts|tsx|js|jsx)$/.test(base);
}

function segmentRegex(segment) {
  if (segment.startsWith('@')) {
    return null;
  }

  if (segment.startsWith('(') && segment.endsWith(')')) {
    return null;
  }

  if (/^\[\[\.\.\..+\]\]$/.test(segment)) {
    return '(?:/.+)?';
  }

  if (/^\[\.\.\..+\]$/.test(segment)) {
    return '/.+';
  }

  if (/^\[.+\]$/.test(segment)) {
    return '/[^/]+';
  }

  return `/${segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`;
}

function routePatternFromFile(filePath) {
  const rel = toPosix(path.relative(APP_DIR, filePath));
  const dir = path.dirname(rel);
  const segments = dir === '.' ? [] : dir.split('/');

  let pattern = '^';
  for (const segment of segments) {
    const part = segmentRegex(segment);
    if (part === null) continue;
    pattern += part;
  }

  if (pattern === '^') {
    pattern += '/';
  }

  pattern += '/?$';

  const kind = path.basename(filePath).startsWith('route.') ? 'route' : 'page';

  return {
    filePath,
    kind,
    regex: new RegExp(pattern),
  };
}

const routePatterns = walkFiles(APP_DIR)
  .filter(isRouteFile)
  .map(routePatternFromFile);

function routeExists(urlPath, kind = 'any') {
  const normalized = urlPath.replace(/\/+$/, '') || '/';

  return routePatterns.some((route) => {
    if (kind !== 'any' && route.kind !== kind) return false;
    return route.regex.test(normalized);
  });
}

function assertRoute(urlPath, label, kind = 'any') {
  if (!routeExists(urlPath, kind)) {
    throw new Error(`${label} missing: ${urlPath}`);
  }
  console.log(`   ✅ ${label}: ${urlPath}`);
}

function assertMiddlewareMatcher(paths) {
  if (!fs.existsSync(MIDDLEWARE_PATH)) {
    throw new Error('middleware.ts missing');
  }

  const content = fs.readFileSync(MIDDLEWARE_PATH, 'utf8');
  for (const matcher of paths) {
    if (!content.includes(`'${matcher}'`) && !content.includes(`\"${matcher}\"`)) {
      throw new Error(`middleware matcher missing: ${matcher}`);
    }
    console.log(`   ✅ Middleware matcher: ${matcher}`);
  }
}

async function test1_PublicWebsiteNodes() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 1: Public Website Node Connectivity');
  console.log('='.repeat(70));

  const nodes = ['/', '/product', '/industries', '/security', '/pricing', '/contact', '/faq', '/blog', '/docs'];

  console.log('\n🔗 Testing public website node connectivity...');
  for (const node of nodes) {
    assertRoute(node, 'Public route', 'page');
  }

  console.log('\n✅ TEST 1 PASSED: Public website routes verified on disk');
}

async function test2_AuthenticationWires() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 2: Authentication Flow Wire Integrity');
  console.log('='.repeat(70));

  const authRoutes = [
    '/auth/signin',
    '/auth/signup',
    '/auth/callback',
    '/auth/forgot-password',
    '/auth/reset-password',
  ];

  console.log('\n🔗 Testing authentication route wires...');
  for (const route of authRoutes) {
    const kind = route === '/auth/callback' ? 'any' : 'page';
    assertRoute(route, 'Auth route', kind);
  }

  console.log('\n🛡️  Testing middleware guard wiring...');
  assertMiddlewareMatcher(['/app/:path*', '/admin/:path*', '/auth/:path*']);

  console.log('\n✅ TEST 2 PASSED: Authentication routes and middleware matchers verified');
}

async function test3_AppDashboardNodes() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 3: App/Dashboard Node Access');
  console.log('='.repeat(70));

  const appNodes = ['/app', '/app/dashboard', '/app/workflows', '/app/audit', '/app/billing', '/app/settings'];

  console.log('\n🔗 Testing app/dashboard route wiring...');
  for (const node of appNodes) {
    assertRoute(node, 'App route', 'page');
  }

  console.log('\n✅ TEST 3 PASSED: App/dashboard routes verified on disk');
}

async function test4_AdminConsoleWires() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 4: Admin Console Wire Verification');
  console.log('='.repeat(70));

  const adminNodes = [
    '/admin',
    '/admin/dashboard',
    '/admin/users',
    '/admin/organizations',
    '/admin/billing',
    '/admin/security',
    '/admin/system',
    '/admin/features',
    '/admin/trials',
  ];

  console.log('\n🔗 Testing admin route wiring...');
  for (const node of adminNodes) {
    assertRoute(node, 'Admin route', 'page');
  }

  console.log('\n✅ TEST 4 PASSED: Admin console routes verified on disk');
}

async function test5_APIEndpointConnectivity() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 5: API Endpoint Connectivity');
  console.log('='.repeat(70));

  const apiEndpoints = [
    '/api/v1/tasks',
    '/api/v1/evidence',
    '/api/v1/compliance',
    '/api/v1/audit-logs',
    '/api/admin/features',
    '/api/admin/trials',
    '/api/admin/overview',
  ];

  console.log('\n🔗 Testing API endpoint route wiring...');
  for (const endpoint of apiEndpoints) {
    assertRoute(endpoint, 'API endpoint', 'route');
  }

  console.log('\n✅ TEST 5 PASSED: API endpoint route files verified on disk');
}

async function test6_DatabaseRelationships(envVars) {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 6: Database Relationship Integrity');
  console.log('='.repeat(70));

  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

  if (!isValidSupabaseConfig(supabaseUrl, serviceRoleKey)) {
    console.log('\n⚠️  Skipping DB test: missing/placeholder Supabase credentials in .env.local');
    return 'skipped';
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const tables = ['organizations', 'org_members', 'org_subscriptions', 'org_entitlements', 'plans'];

  console.log('\n🗄️  Testing database table accessibility...');
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      throw new Error(`Table ${table} query failed: ${error.message}`);
    }
    console.log(`   ✅ Table accessible: ${table}`);
  }

  console.log('\n✅ TEST 6 PASSED: Database relationships base checks verified');
  return 'passed';
}

async function test7_UserJourneyFlows() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 7: User Journey Flow Verification');
  console.log('='.repeat(70));

  const checkpoints = [
    '/',
    '/auth/signup',
    '/onboarding',
    '/app',
    '/pricing',
    '/admin',
    '/api/billing/webhook',
  ];

  console.log('\n🚶 Testing route checkpoints for core journeys...');
  for (const checkpoint of checkpoints) {
    const kind = checkpoint.startsWith('/api/') ? 'route' : 'page';
    assertRoute(checkpoint, 'Journey checkpoint', kind);
  }

  console.log('\n🔄 Verifying middleware loop guard code path exists...');
  const content = fs.readFileSync(MIDDLEWARE_PATH, 'utf8');
  if (!content.includes('loop guard triggered')) {
    throw new Error('Middleware loop guard log marker missing');
  }
  console.log('   ✅ Middleware loop guard marker found');

  console.log('\n✅ TEST 7 PASSED: Journey checkpoints and loop guard wiring verified');
}

async function runAllTests() {
  console.log('\n');
  console.log('╔' + '═'.repeat(68) + '╗');
  console.log('║' + ' '.repeat(15) + 'FORMAOS Node & Wire Verification' + ' '.repeat(15) + '║');
  console.log('║' + ' '.repeat(68) + '║');
  console.log('║ Concrete route + middleware + optional DB wiring verification' + ' '.repeat(8) + '║');
  console.log('╚' + '═'.repeat(68) + '╝\n');

  const envVars = readEnvFile();
  const tests = [
    ['test1', test1_PublicWebsiteNodes],
    ['test2', test2_AuthenticationWires],
    ['test3', test3_AppDashboardNodes],
    ['test4', test4_AdminConsoleWires],
    ['test5', test5_APIEndpointConnectivity],
    ['test6', () => test6_DatabaseRelationships(envVars)],
    ['test7', test7_UserJourneyFlows],
  ];

  const results = {};

  for (const [id, testFn] of tests) {
    try {
      const status = await testFn();
      results[id] = status === 'skipped' ? 'skipped' : 'passed';
    } catch (error) {
      console.error(`\n❌ ${id.toUpperCase()} FAILED: ${error.message}`);
      results[id] = 'failed';
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('NODE & WIRE VERIFICATION SUMMARY');
  console.log('='.repeat(70));

  const ordered = [
    ['Test 1 - Public Website Nodes', 'test1'],
    ['Test 2 - Authentication Wires', 'test2'],
    ['Test 3 - App/Dashboard Nodes', 'test3'],
    ['Test 4 - Admin Console Wires', 'test4'],
    ['Test 5 - API Endpoints', 'test5'],
    ['Test 6 - Database Relationships', 'test6'],
    ['Test 7 - User Journey Flows', 'test7'],
  ];

  ordered.forEach(([label, id]) => {
    const status = (results[id] || 'failed').toUpperCase();
    console.log(`${label.padEnd(36)} ${status}`);
  });

  const passed = Object.values(results).filter((s) => s === 'passed').length;
  const failed = Object.values(results).filter((s) => s === 'failed').length;
  const skipped = Object.values(results).filter((s) => s === 'skipped').length;

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${skipped} skipped`);

  if (failed > 0) {
    console.log('\n❌ Node/wire verification failed. Review failing checks above.\n');
    process.exit(1);
  }

  console.log('\n✅ Node/wire verification completed successfully.\n');
  process.exit(0);
}

runAllTests();
