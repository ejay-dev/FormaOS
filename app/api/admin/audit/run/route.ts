import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdminAccess } from '@/app/app/admin/access';
import { handleAdminError } from '@/app/api/admin/_helpers';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Scope = 'full' | 'security' | 'frontend' | 'backend' | 'database' | 'api' | 'config';

type CheckStatus = 'pass' | 'warn' | 'fail' | 'info';
type CheckSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type CheckCategory = 'security' | 'frontend' | 'backend' | 'database' | 'api' | 'config' | 'performance';

interface CheckResult {
  id: string;
  category: CheckCategory;
  name: string;
  status: CheckStatus;
  severity: CheckSeverity;
  message: string;
  details: string[];
  recommendation?: string;
  docsUrl?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROOT = process.cwd();
const IS_VERCEL = Boolean(process.env.VERCEL);

function fileExists(rel: string): boolean {
  try {
    return fs.existsSync(path.join(ROOT, rel));
  } catch {
    return false;
  }
}

function readFile(rel: string): string | null {
  try {
    return fs.readFileSync(path.join(ROOT, rel), 'utf-8');
  } catch {
    return null;
  }
}

function fileContains(rel: string, pattern: string | RegExp): boolean {
  const content = readFile(rel);
  if (!content) return false;
  return typeof pattern === 'string' ? content.includes(pattern) : pattern.test(content);
}

/** Recursively collect files matching a predicate. Gracefully returns [] if dir is absent. */
function walkDir(dir: string, match: (name: string) => boolean, maxDepth = 8): string[] {
  const root = path.join(ROOT, dir);
  if (!fs.existsSync(root)) return [];
  const results: string[] = [];
  function walk(d: string, depth: number) {
    if (depth > maxDepth) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        walk(full, depth + 1);
      } else if (entry.isFile() && match(entry.name)) {
        results.push(full);
      }
    }
  }
  walk(root, 0);
  return results;
}

/** Get all immediate subdirectories that are route-group or page directories. */
function getRouteDirectories(dir: string): string[] {
  const dirs: string[] = [];
  function walk(d: string, depth: number) {
    if (depth > 8) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    const hasPage = entries.some((e) => e.isFile() && e.name === 'page.tsx');
    if (hasPage) {
      dirs.push(d);
    }
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        walk(path.join(d, entry.name), depth + 1);
      }
    }
  }
  walk(path.join(ROOT, dir), 0);
  return dirs;
}

function countFileMatches(files: string[], pattern: string | RegExp): number {
  let count = 0;
  for (const f of files) {
    try {
      const content = fs.readFileSync(f, 'utf-8');
      if (typeof pattern === 'string' ? content.includes(pattern) : pattern.test(content)) {
        count++;
      }
    } catch {
      // skip unreadable
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// Check Runners
// ---------------------------------------------------------------------------

// ---- SECURITY ----

function checkCSPHeaders(): CheckResult {
  const content = readFile('next.config.ts') ?? readFile('next.config.js') ?? '';
  const hasCSP = /content-security-policy/i.test(content) || /contentSecurityPolicy/i.test(content);
  const hasScriptSrc = /script-src/i.test(content);
  const hasStyleSrc = /style-src/i.test(content);

  const details: string[] = [];
  if (!hasCSP) details.push('No CSP header configuration found in next.config');
  if (!hasScriptSrc) details.push('Missing script-src directive');
  if (!hasStyleSrc) details.push('Missing style-src directive');

  return {
    id: 'sec-csp',
    category: 'security',
    name: 'CSP Headers',
    status: hasCSP && hasScriptSrc ? 'pass' : hasCSP ? 'warn' : 'fail',
    severity: 'high',
    message: hasCSP
      ? `CSP configured${!hasScriptSrc || !hasStyleSrc ? ' but missing some directives' : ''}`
      : 'No Content-Security-Policy headers configured',
    details,
    recommendation: 'Add CSP headers in next.config.ts async headers() to mitigate XSS attacks.',
    docsUrl: 'https://nextjs.org/docs/app/api-reference/next-config-js/headers',
  };
}

function checkEnvVars(): CheckResult {
  // Critical: app won't function without these
  const critical = ['SUPABASE_SERVICE_ROLE_KEY'];
  // Operational: specific features degrade without these, but app runs fine
  const operational = ['CRON_SECRET', 'STRIPE_WEBHOOK_SECRET'];

  const missingCritical = critical.filter((v) => !process.env[v]);
  const missingOperational = operational.filter((v) => !process.env[v]);
  const details = [
    ...missingCritical.map((v) => `Critical — missing: ${v}`),
    ...missingOperational.map((v) => `Optional — missing: ${v}`),
  ];

  const status: CheckStatus =
    missingCritical.length > 0 ? 'fail' : missingOperational.length > 0 ? 'warn' : 'pass';
  const severity: CheckSeverity = missingCritical.length > 0 ? 'critical' : 'low';

  return {
    id: 'sec-env',
    category: 'security',
    name: 'Environment Variables',
    status,
    severity,
    message:
      missingCritical.length > 0
        ? `${missingCritical.length} critical env var(s) missing`
        : missingOperational.length > 0
          ? `Core vars set; ${missingOperational.length} optional var(s) missing`
          : 'All environment variables are set',
    details,
    recommendation:
      missingCritical.length > 0
        ? 'Set SUPABASE_SERVICE_ROLE_KEY — the app cannot function without it.'
        : missingOperational.length > 0
          ? 'Set CRON_SECRET and STRIPE_WEBHOOK_SECRET for full feature coverage.'
          : undefined,
  };
}

function checkAuthMiddleware(): CheckResult {
  // Next.js 16 uses proxy.ts instead of middleware.ts
  const hasProxy = fileExists('proxy.ts');
  const hasMiddleware = fileExists('middleware.ts') || fileExists('middleware.js');
  const exists = hasProxy || hasMiddleware;

  const file = hasProxy ? 'proxy.ts' : hasMiddleware ? (fileExists('middleware.ts') ? 'middleware.ts' : 'middleware.js') : null;
  const hasSessionValidation = file ? fileContains(file, /session|getSession|supabase|auth/i) : false;

  const label = hasProxy ? 'proxy.ts (Next.js 16)' : 'middleware.ts';

  return {
    id: 'sec-auth-middleware',
    category: 'security',
    name: 'Auth Middleware / Proxy',
    status: exists && hasSessionValidation ? 'pass' : exists ? 'warn' : 'fail',
    severity: 'critical',
    message: exists
      ? hasSessionValidation
        ? `Auth ${label} with session validation detected`
        : `${label} exists but no session validation pattern found`
      : 'No middleware.ts or proxy.ts found — routes may be unprotected',
    details: exists ? [] : ['Neither middleware.ts nor proxy.ts found in project root'],
    recommendation: 'Add proxy.ts (Next.js 16) or middleware.ts to protect authenticated routes.',
  };
}

function checkRateLimiting(): CheckResult {
  const exists = fileExists('lib/security/rate-limiter.ts');
  const hasExports = exists && fileContains('lib/security/rate-limiter.ts', /export/);

  return {
    id: 'sec-rate-limit',
    category: 'security',
    name: 'Rate Limiting',
    status: exists && hasExports ? 'pass' : exists ? 'warn' : 'fail',
    severity: 'high',
    message: exists
      ? 'Rate limiter module found'
      : 'No rate limiting module found at lib/security/rate-limiter.ts',
    details: exists ? [] : ['lib/security/rate-limiter.ts does not exist'],
    recommendation: 'Implement rate limiting to protect against brute-force and DDoS attacks.',
  };
}

function checkCSRF(): CheckResult {
  const exists = fileExists('lib/security/csrf.ts');
  return {
    id: 'sec-csrf',
    category: 'security',
    name: 'CSRF Protection',
    status: exists ? 'pass' : 'warn',
    severity: 'medium',
    message: exists ? 'CSRF protection module found' : 'No CSRF module at lib/security/csrf.ts',
    details: exists ? [] : ['lib/security/csrf.ts does not exist'],
    recommendation: 'Add CSRF token validation for state-changing requests.',
  };
}

function checkSentryPII(): CheckResult {
  const scrubExists = fileExists('lib/sentry/scrub-pii.ts');
  const clientConfig = readFile('sentry.client.config.ts') ?? '';
  const serverConfig = readFile('sentry.server.config.ts') ?? '';
  const edgeConfig = readFile('sentry.edge.config.ts') ?? '';
  const importsIt =
    clientConfig.includes('scrub-pii') ||
    serverConfig.includes('scrub-pii') ||
    edgeConfig.includes('scrub-pii');

  const details: string[] = [];
  if (!scrubExists) details.push('lib/sentry/scrub-pii.ts not found');
  if (scrubExists && !importsIt) details.push('Sentry configs do not import scrub-pii module');

  return {
    id: 'sec-sentry-pii',
    category: 'security',
    name: 'Sentry PII Filter',
    status: scrubExists && importsIt ? 'pass' : scrubExists ? 'warn' : 'fail',
    severity: 'medium',
    message: scrubExists && importsIt
      ? 'PII scrubbing configured in Sentry'
      : scrubExists
        ? 'PII scrub module exists but is not imported in Sentry configs'
        : 'No PII scrubbing module found for Sentry',
    details,
    recommendation: 'Add a beforeSend hook that strips PII from Sentry events.',
  };
}

function checkURLValidator(): CheckResult {
  const exists = fileExists('lib/security/url-validator.ts');
  return {
    id: 'sec-url-validator',
    category: 'security',
    name: 'URL Validator',
    status: exists ? 'pass' : 'warn',
    severity: 'medium',
    message: exists ? 'URL validator module found' : 'No URL validator at lib/security/url-validator.ts',
    details: exists ? [] : ['lib/security/url-validator.ts does not exist'],
    recommendation: 'Add URL validation to prevent open redirect and SSRF attacks.',
  };
}

function checkMFA(): CheckResult {
  const hasMFAModule = fileExists('lib/security/mfa-enforcement.ts');
  const hasSecurityModule = fileExists('lib/security.ts');
  const hasMFAPatterns =
    (hasSecurityModule && fileContains('lib/security.ts', /mfa|MFA|multi.?factor|totp|TOTP/i)) ||
    (hasMFAModule && fileContains('lib/security/mfa-enforcement.ts', /mfa|MFA|enforce|factor/i));

  return {
    id: 'sec-mfa',
    category: 'security',
    name: 'MFA Support',
    status: hasMFAPatterns ? 'pass' : hasSecurityModule || hasMFAModule ? 'warn' : 'fail',
    severity: 'high',
    message: hasMFAPatterns
      ? 'MFA enforcement module detected'
      : hasSecurityModule || hasMFAModule
        ? 'Security module exists but no MFA patterns found'
        : 'No security/MFA module found',
    details: [],
    recommendation: hasMFAPatterns ? undefined : 'Implement MFA enforcement for admin and sensitive operations.',
  };
}

// ---- FRONTEND ----

function checkErrorBoundaries(): CheckResult {
  // Only check authenticated routes (app/app, app/admin) — marketing pages don't need error boundaries
  const appDirs = getRouteDirectories('app/app');
  const adminDirs = getRouteDirectories('app/admin');
  const routeDirs = [...appDirs, ...adminDirs];

  const withError = routeDirs.filter((d) => {
    try {
      return fs.existsSync(path.join(d, 'error.tsx'));
    } catch {
      return false;
    }
  });

  // Also count parent error.tsx files that cover child routes
  const parentErrorDirs = routeDirs.filter((d) => {
    let parent = path.dirname(d);
    while (parent.length >= path.join(ROOT, 'app').length) {
      try {
        if (fs.existsSync(path.join(parent, 'error.tsx'))) return true;
      } catch { /* skip */ }
      parent = path.dirname(parent);
    }
    return false;
  });
  const covered = new Set([...withError, ...parentErrorDirs]);
  const coverage = routeDirs.length > 0 ? Math.round((covered.size / routeDirs.length) * 100) : 0;

  const missingDirs = routeDirs
    .filter((d) => !covered.has(d))
    .map((d) => path.relative(ROOT, d))
    .slice(0, 8);

  return {
    id: 'fe-error-boundaries',
    category: 'frontend',
    name: 'Error Boundaries',
    status: coverage >= 60 ? 'pass' : coverage >= 30 ? 'warn' : 'fail',
    severity: 'medium',
    message: `${covered.size}/${routeDirs.length} app routes covered by error.tsx (${coverage}%)`,
    details: missingDirs.length > 0
      ? [`Missing error.tsx coverage in: ${missingDirs.join(', ')}${routeDirs.length - covered.size > 8 ? ` and ${routeDirs.length - covered.size - 8} more` : ''}`]
      : [],
    recommendation: 'Add error.tsx to key route directories for graceful error handling.',
    docsUrl: 'https://nextjs.org/docs/app/building-your-application/routing/error-handling',
  };
}

function checkLoadingStates(): CheckResult {
  // Data-heavy routes that should have loading states
  const dataHeavyPaths = [
    'app/app', 'app/admin', 'app/app/policies', 'app/app/registers',
    'app/app/team', 'app/app/settings', 'app/app/workflows',
    'app/app/compliance', 'app/app/incidents', 'app/app/billing',
  ];
  const withLoading: string[] = [];
  const withoutLoading: string[] = [];

  for (const rel of dataHeavyPaths) {
    const full = path.join(ROOT, rel);
    try {
      if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
        if (fs.existsSync(path.join(full, 'loading.tsx'))) {
          withLoading.push(rel);
        } else {
          withoutLoading.push(rel);
        }
      }
    } catch {
      // skip
    }
  }

  return {
    id: 'fe-loading-states',
    category: 'frontend',
    name: 'Loading States',
    status: withoutLoading.length === 0 ? 'pass' : withoutLoading.length <= 3 ? 'warn' : 'fail',
    severity: 'low',
    message: `${withLoading.length}/${withLoading.length + withoutLoading.length} data-heavy routes have loading.tsx`,
    details: withoutLoading.length > 0
      ? [`Missing loading.tsx: ${withoutLoading.join(', ')}`]
      : [],
    recommendation: 'Add loading.tsx for a better perceived performance in data-heavy routes.',
  };
}

function checkNotFoundPages(): CheckResult {
  const paths = ['app/app', 'app/admin'];
  const details: string[] = [];
  let found = 0;
  for (const p of paths) {
    if (fileExists(`${p}/not-found.tsx`)) {
      found++;
    } else {
      details.push(`Missing: ${p}/not-found.tsx`);
    }
  }

  return {
    id: 'fe-not-found',
    category: 'frontend',
    name: 'Not Found Pages',
    status: found === paths.length ? 'pass' : found > 0 ? 'warn' : 'info',
    severity: 'low',
    message: `${found}/${paths.length} main route groups have not-found.tsx`,
    details,
    recommendation: 'Add not-found.tsx to improve UX for 404 scenarios.',
  };
}

function checkFormValidation(): CheckResult {
  const componentFiles = walkDir('components', (n) => n.endsWith('.tsx') || n.endsWith('.ts'));
  const appFiles = walkDir('app', (n) => n.endsWith('.tsx') || n.endsWith('.ts'));
  const allFiles = [...componentFiles, ...appFiles];
  const zodCount = countFileMatches(allFiles, /z\.object|z\.string|z\.number|z\.enum/);

  return {
    id: 'fe-form-validation',
    category: 'frontend',
    name: 'Form Validation',
    status: zodCount >= 10 ? 'pass' : zodCount >= 3 ? 'warn' : 'fail',
    severity: 'medium',
    message: `Found Zod validation schemas in ${zodCount} file(s)`,
    details: [],
    recommendation: 'Use Zod schemas for all form inputs to ensure type-safe validation.',
  };
}

function checkAccessibility(): CheckResult {
  const componentFiles = walkDir('components', (n) => n.endsWith('.tsx'));
  const ariaCount = countFileMatches(componentFiles, /aria-label|aria-describedby|aria-labelledby/);
  const roleCount = countFileMatches(componentFiles, /role="/);

  return {
    id: 'fe-a11y',
    category: 'frontend',
    name: 'Accessibility',
    status: ariaCount >= 10 ? 'pass' : ariaCount >= 3 ? 'warn' : 'info',
    severity: 'medium',
    message: `${ariaCount} component(s) use aria attributes, ${roleCount} use role attributes`,
    details: [],
    recommendation: 'Add aria-label and role attributes to interactive components.',
  };
}

function checkImageOptimization(): CheckResult {
  const files = walkDir('components', (n) => n.endsWith('.tsx'));
  const appFiles = walkDir('app', (n) => n.endsWith('.tsx'));
  const allFiles = [...files, ...appFiles];
  const rawImgCount = countFileMatches(allFiles, /<img\s/);
  const nextImageCount = countFileMatches(allFiles, /from ['"]next\/image['"]/);

  return {
    id: 'fe-images',
    category: 'frontend',
    name: 'Image Optimization',
    status: rawImgCount === 0 ? 'pass' : rawImgCount <= 3 ? 'warn' : 'fail',
    severity: 'low',
    message: rawImgCount === 0
      ? `All images appear to use Next.js Image (${nextImageCount} files import it)`
      : `Found raw <img> tags in ${rawImgCount} file(s); ${nextImageCount} file(s) use next/image`,
    details: rawImgCount > 0
      ? ['Replace <img> with next/image for automatic optimization, lazy loading, and WebP.']
      : [],
    recommendation: 'Use next/image instead of raw <img> tags.',
    docsUrl: 'https://nextjs.org/docs/app/building-your-application/optimizing/images',
  };
}

// ---- BACKEND ----

function checkAPIAuthCoverage(): CheckResult {
  const routeFiles = walkDir('app/api', (n) => n === 'route.ts');
  const publicRoutes = ['/api/health', '/api/auth/', '/api/feedback', '/api/onboarding/'];
  const authPatterns = /requireAdminAccess|authenticateV1Request|CRON_SECRET|requireAuth|getSession|supabase\.auth|createSupabaseServerClient|createSupabaseAdminClient|handleAdminError/;

  let protected_ = 0;
  let unprotected = 0;
  const unprotectedPaths: string[] = [];

  for (const f of routeFiles) {
    const rel = path.relative(ROOT, f);
    const isPublic = publicRoutes.some((p) => rel.includes(p.replace(/\//g, path.sep)));
    if (isPublic) {
      protected_++;
      continue;
    }
    try {
      const content = fs.readFileSync(f, 'utf-8');
      if (authPatterns.test(content)) {
        protected_++;
      } else {
        unprotected++;
        unprotectedPaths.push(rel);
      }
    } catch {
      unprotected++;
      unprotectedPaths.push(rel);
    }
  }

  const total = protected_ + unprotected;
  const coverage = total > 0 ? Math.round((protected_ / total) * 100) : 100;

  return {
    id: 'be-api-auth',
    category: 'backend',
    name: 'API Auth Coverage',
    status: coverage >= 95 ? 'pass' : coverage >= 80 ? 'warn' : 'fail',
    severity: 'critical',
    message: `${protected_}/${total} API routes have auth checks (${coverage}%)`,
    details: unprotectedPaths.slice(0, 10).map((p) => `Unprotected: ${p}`),
    recommendation: 'Add authentication checks to all non-public API routes.',
  };
}

function checkErrorHandling(): CheckResult {
  const routeFiles = walkDir('app/api', (n) => n === 'route.ts');
  // Match try/catch, handleAdminError (centralized handler), or NextResponse.json error patterns
  const withErrorHandling = countFileMatches(routeFiles, /try\s*\{|handleAdminError|catch\s*\(|\.catch\(/);
  const total = routeFiles.length;
  const coverage = total > 0 ? Math.round((withErrorHandling / total) * 100) : 100;

  return {
    id: 'be-error-handling',
    category: 'backend',
    name: 'Error Handling',
    status: coverage >= 80 ? 'pass' : coverage >= 60 ? 'warn' : 'fail',
    severity: 'high',
    message: `${withErrorHandling}/${total} API routes have error handling (${coverage}%)`,
    details: [],
    recommendation: 'Wrap all API route handlers in try/catch with proper error responses.',
  };
}

function checkInputValidation(): CheckResult {
  const routeFiles = walkDir('app/api', (n) => n === 'route.ts');
  // Only check routes that handle POST/PUT/PATCH
  const postRoutes = routeFiles.filter((f) => {
    try {
      const content = fs.readFileSync(f, 'utf-8');
      return /export\s+async\s+function\s+(POST|PUT|PATCH)/.test(content);
    } catch {
      return false;
    }
  });
  const withValidation = countFileMatches(postRoutes, /z\.object|z\.string|typeof\s+\w+\s*[!=]==|\.parse\(|validation|validate/i);
  const total = postRoutes.length;
  const coverage = total > 0 ? Math.round((withValidation / total) * 100) : 100;

  return {
    id: 'be-input-validation',
    category: 'backend',
    name: 'Input Validation',
    status: coverage >= 80 ? 'pass' : coverage >= 50 ? 'warn' : 'fail',
    severity: 'high',
    message: `${withValidation}/${total} POST/PUT/PATCH routes have input validation (${coverage}%)`,
    details: [],
    recommendation: 'Validate all incoming request bodies with Zod or similar.',
  };
}

function checkLogging(): CheckResult {
  const routeFiles = walkDir('app/api', (n) => n === 'route.ts');
  const withLogging = countFileMatches(routeFiles, /routeLog|pino|logger|console\.(log|warn|error)/);
  const total = routeFiles.length;

  return {
    id: 'be-logging',
    category: 'backend',
    name: 'Structured Logging',
    status: withLogging >= total * 0.5 ? 'pass' : withLogging >= total * 0.2 ? 'warn' : 'info',
    severity: 'low',
    message: `${withLogging}/${total} API routes import a logger`,
    details: [],
    recommendation: 'Use routeLog/pino for structured logging in all API routes.',
  };
}

// ---- DATABASE ----

async function checkDBConnection(): Promise<CheckResult> {
  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from('organizations').select('id').limit(1);
    if (error) throw error;
    return {
      id: 'db-connection',
      category: 'database',
      name: 'Connection Health',
      status: 'pass',
      severity: 'critical',
      message: 'Database connection is healthy',
      details: [],
    };
  } catch (e) {
    return {
      id: 'db-connection',
      category: 'database',
      name: 'Connection Health',
      status: 'fail',
      severity: 'critical',
      message: `Database connection failed: ${e instanceof Error ? e.message : String(e)}`,
      details: [],
      recommendation: 'Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correct.',
    };
  }
}

async function checkRLSPolicies(): Promise<CheckResult> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.rpc('exec_sql', {
      query: `SELECT count(*)::int as total, count(*) FILTER (WHERE rowsecurity) ::int as rls_enabled FROM pg_tables WHERE schemaname = 'public'`,
    });

    if (error) {
      // Fallback: the rpc may not exist. Just report info.
      return {
        id: 'db-rls',
        category: 'database',
        name: 'RLS Policies',
        status: 'info',
        severity: 'high',
        message: 'Could not query RLS status — exec_sql RPC not available',
        details: [error.message],
        recommendation: 'Create an exec_sql RPC or check RLS manually via Supabase dashboard.',
      };
    }

    const total = data?.[0]?.total ?? 0;
    const enabled = data?.[0]?.rls_enabled ?? 0;
    const coverage = total > 0 ? Math.round((enabled / total) * 100) : 0;

    return {
      id: 'db-rls',
      category: 'database',
      name: 'RLS Policies',
      status: coverage >= 90 ? 'pass' : coverage >= 60 ? 'warn' : 'fail',
      severity: 'high',
      message: `${enabled}/${total} public tables have RLS enabled (${coverage}%)`,
      details: [],
      recommendation: 'Enable RLS on all public tables to enforce row-level access control.',
    };
  } catch {
    return {
      id: 'db-rls',
      category: 'database',
      name: 'RLS Policies',
      status: 'info',
      severity: 'high',
      message: 'Could not query RLS status',
      details: [],
    };
  }
}

function checkMigrations(): CheckResult {
  const migrationsDir = path.join(ROOT, 'supabase', 'migrations');
  let count = 0;
  try {
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
    count = files.length;
  } catch {
    // directory may not exist
  }

  return {
    id: 'db-migrations',
    category: 'database',
    name: 'Migration Count',
    status: count > 0 ? 'pass' : 'warn',
    severity: 'low',
    message: count > 0 ? `${count} SQL migration file(s) found` : 'No migrations directory found',
    details: [],
    recommendation: count === 0 ? 'Set up supabase/migrations/ for version-controlled schema changes.' : undefined,
  };
}

function checkMaybeSingleUsage(): CheckResult {
  const libFiles = walkDir('lib', (n) => n.endsWith('.ts') || n.endsWith('.tsx'));
  const singleCount = countFileMatches(libFiles, /\.single\(\)/);
  const maybeSingleCount = countFileMatches(libFiles, /\.maybeSingle\(\)/);

  return {
    id: 'db-maybe-single',
    category: 'database',
    name: 'MaybeSingle Usage',
    status: singleCount === 0 ? 'pass' : singleCount <= 3 ? 'warn' : 'fail',
    severity: 'medium',
    message: singleCount === 0
      ? `All queries use .maybeSingle() (${maybeSingleCount} file(s))`
      : `${singleCount} file(s) still use .single(); ${maybeSingleCount} use .maybeSingle()`,
    details: singleCount > 0
      ? ['.single() throws when no row is found; prefer .maybeSingle() for safer queries.']
      : [],
    recommendation: singleCount > 0 ? 'Replace .single() with .maybeSingle() to avoid 406 errors on missing rows.' : undefined,
  };
}

// ---- API ----

function checkRouteCount(): CheckResult {
  const routeFiles = walkDir('app/api', (n) => n === 'route.ts');
  return {
    id: 'api-route-count',
    category: 'api',
    name: 'Route Count',
    status: 'info',
    severity: 'info',
    message: `${routeFiles.length} API route file(s) found under app/api/`,
    details: [],
  };
}

function checkOpenAPISpec(): CheckResult {
  const exists = fileExists('openapi.json');
  let pathCount = 0;
  if (exists) {
    try {
      const spec = JSON.parse(readFile('openapi.json') ?? '{}');
      pathCount = Object.keys(spec.paths ?? {}).length;
    } catch {
      // malformed JSON
    }
  }

  return {
    id: 'api-openapi',
    category: 'api',
    name: 'OpenAPI Spec',
    status: exists && pathCount > 0 ? 'pass' : exists ? 'warn' : 'fail',
    severity: 'medium',
    message: exists
      ? `openapi.json exists with ${pathCount} path(s) defined`
      : 'No openapi.json found',
    details: [],
    recommendation: exists ? undefined : 'Add an OpenAPI spec for API documentation and client generation.',
  };
}

function checkRateLimitCoverage(): CheckResult {
  const routeFiles = walkDir('app/api', (n) => n === 'route.ts');
  const withRateLimit = countFileMatches(routeFiles, /rate.?limit|rateLimit|rateLimiter/i);
  const total = routeFiles.length;
  const coverage = total > 0 ? Math.round((withRateLimit / total) * 100) : 0;

  return {
    id: 'api-rate-limit-coverage',
    category: 'api',
    name: 'Rate Limiting Coverage',
    status: coverage >= 30 ? 'pass' : coverage >= 10 ? 'warn' : 'info',
    severity: 'medium',
    message: `${withRateLimit}/${total} API routes reference rate limiting (${coverage}%)`,
    details: [],
    recommendation: 'Apply rate limiting to public-facing and auth endpoints.',
  };
}

function checkCORSConfig(): CheckResult {
  const exists = fileExists('lib/api/cors.ts');
  return {
    id: 'api-cors',
    category: 'api',
    name: 'CORS Configuration',
    status: exists ? 'pass' : 'warn',
    severity: 'medium',
    message: exists ? 'CORS configuration module found' : 'No CORS module at lib/api/cors.ts',
    details: exists ? [] : ['lib/api/cors.ts does not exist'],
    recommendation: exists ? undefined : 'Add a CORS configuration module for API route protection.',
  };
}

// ---- CONFIG ----

function checkTypeScriptStrict(): CheckResult {
  const content = readFile('tsconfig.json');
  if (!content) {
    return {
      id: 'cfg-ts-strict',
      category: 'config',
      name: 'TypeScript Strict',
      status: 'fail',
      severity: 'medium',
      message: 'tsconfig.json not found',
      details: [],
    };
  }
  const hasStrict = /"strict"\s*:\s*true/.test(content);
  const hasNoUnchecked = /"noUncheckedIndexedAccess"\s*:\s*true/.test(content);

  return {
    id: 'cfg-ts-strict',
    category: 'config',
    name: 'TypeScript Strict',
    status: hasStrict ? 'pass' : 'fail',
    severity: 'medium',
    message: hasStrict
      ? `Strict mode enabled${hasNoUnchecked ? ' with noUncheckedIndexedAccess' : ''}`
      : 'TypeScript strict mode is not enabled',
    details: hasStrict ? [] : ['Set "strict": true in tsconfig.json'],
    recommendation: hasStrict ? undefined : 'Enable strict mode for better type safety.',
  };
}

function checkESLintConfig(): CheckResult {
  const exists = fileExists('eslint.config.mjs') || fileExists('eslint.config.js') || fileExists('.eslintrc.js') || fileExists('.eslintrc.json');
  return {
    id: 'cfg-eslint',
    category: 'config',
    name: 'ESLint Config',
    status: exists ? 'pass' : 'warn',
    severity: 'low',
    message: exists ? 'ESLint configuration found' : 'No ESLint configuration found',
    details: [],
  };
}

function checkEnvExample(): CheckResult {
  const exists = fileExists('.env.example');
  let hasComments = false;
  if (exists) {
    const content = readFile('.env.example') ?? '';
    hasComments = content.includes('#');
  }

  return {
    id: 'cfg-env-example',
    category: 'config',
    name: 'Environment Documentation',
    status: exists && hasComments ? 'pass' : exists ? 'warn' : 'fail',
    severity: 'low',
    message: exists
      ? hasComments ? '.env.example exists with documentation comments' : '.env.example exists but lacks comments'
      : '.env.example not found',
    details: exists ? [] : ['Add .env.example so new developers know which vars to set'],
    recommendation: exists ? undefined : 'Create .env.example with all required environment variables documented.',
  };
}

function checkCIPipeline(): CheckResult {
  const workflowDir = path.join(ROOT, '.github', 'workflows');
  let ymlCount = 0;
  try {
    const files = fs.readdirSync(workflowDir).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'));
    ymlCount = files.length;
  } catch {
    // directory may not exist
  }

  return {
    id: 'cfg-ci',
    category: 'config',
    name: 'CI Pipeline',
    status: ymlCount > 0 ? 'pass' : 'fail',
    severity: 'medium',
    message: ymlCount > 0 ? `${ymlCount} GitHub Actions workflow(s) found` : 'No CI workflows found',
    details: [],
    recommendation: ymlCount === 0 ? 'Add GitHub Actions workflows for CI/CD.' : undefined,
  };
}

function checkSentryConfig(): CheckResult {
  const configs = ['sentry.client.config.ts', 'sentry.server.config.ts', 'sentry.edge.config.ts'];
  const found = configs.filter((c) => fileExists(c));
  const missing = configs.filter((c) => !fileExists(c));

  return {
    id: 'cfg-sentry',
    category: 'config',
    name: 'Sentry Configuration',
    status: found.length === configs.length ? 'pass' : found.length > 0 ? 'warn' : 'fail',
    severity: 'medium',
    message: `${found.length}/${configs.length} Sentry config files present`,
    details: missing.map((m) => `Missing: ${m}`),
    recommendation: missing.length > 0 ? 'Add all three Sentry config files for full error tracking.' : undefined,
  };
}

function checkPackageVulnerabilities(): CheckResult {
  const content = readFile('package.json');
  if (!content) {
    return {
      id: 'cfg-pkg-vulns',
      category: 'config',
      name: 'Package Vulnerabilities',
      status: 'warn',
      severity: 'medium',
      message: 'Could not read package.json',
      details: [],
    };
  }

  const problematicPackages = [
    { name: 'speakeasy', reason: 'Unmaintained, use otpauth instead' },
    { name: 'request', reason: 'Deprecated, use fetch or got' },
    { name: 'moment', reason: 'Maintenance mode, prefer date-fns or dayjs' },
    { name: 'node-uuid', reason: 'Renamed to uuid' },
    { name: 'crypto-js', reason: 'Prefer built-in Node.js crypto module' },
  ];

  try {
    const pkg = JSON.parse(content);
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    const found = problematicPackages.filter((p) => allDeps[p.name]);
    const details = found.map((p) => `${p.name}: ${p.reason}`);

    return {
      id: 'cfg-pkg-vulns',
      category: 'config',
      name: 'Package Vulnerabilities',
      status: found.length === 0 ? 'pass' : 'warn',
      severity: 'medium',
      message: found.length === 0
        ? 'No known problematic packages detected'
        : `${found.length} problematic package(s) found`,
      details,
      recommendation: found.length > 0 ? 'Replace deprecated/unmaintained packages with modern alternatives.' : undefined,
    };
  } catch {
    return {
      id: 'cfg-pkg-vulns',
      category: 'config',
      name: 'Package Vulnerabilities',
      status: 'warn',
      severity: 'medium',
      message: 'Could not parse package.json',
      details: [],
    };
  }
}

// ---------------------------------------------------------------------------
// Scope → Check Mapping
// ---------------------------------------------------------------------------

function getSecurityChecks(): CheckResult[] {
  return [
    checkCSPHeaders(),
    checkEnvVars(),
    checkAuthMiddleware(),
    checkRateLimiting(),
    checkCSRF(),
    checkSentryPII(),
    checkURLValidator(),
    checkMFA(),
  ];
}

function getFrontendChecks(): CheckResult[] {
  return [
    checkErrorBoundaries(),
    checkLoadingStates(),
    checkNotFoundPages(),
    checkFormValidation(),
    checkAccessibility(),
    checkImageOptimization(),
  ];
}

function getBackendChecks(): CheckResult[] {
  return [
    checkAPIAuthCoverage(),
    checkErrorHandling(),
    checkInputValidation(),
    checkLogging(),
  ];
}

async function getDatabaseChecks(): Promise<CheckResult[]> {
  const [conn, rls] = await Promise.all([checkDBConnection(), checkRLSPolicies()]);
  return [conn, rls, checkMigrations(), checkMaybeSingleUsage()];
}

function getAPIChecks(): CheckResult[] {
  return [
    checkRouteCount(),
    checkOpenAPISpec(),
    checkRateLimitCoverage(),
    checkCORSConfig(),
  ];
}

function getConfigChecks(): CheckResult[] {
  return [
    checkTypeScriptStrict(),
    checkESLintConfig(),
    checkEnvExample(),
    checkCIPipeline(),
    checkSentryConfig(),
    checkPackageVulnerabilities(),
  ];
}

// ---------------------------------------------------------------------------
// Score & Grade
// ---------------------------------------------------------------------------

function calculateScore(checks: CheckResult[]): number {
  let score = 100;
  for (const check of checks) {
    if (check.status === 'pass' || check.status === 'info') continue;
    if (check.status === 'fail') {
      switch (check.severity) {
        case 'critical': score -= 12; break;
        case 'high': score -= 8; break;
        case 'medium': score -= 4; break;
        case 'low': score -= 2; break;
        default: break;
      }
    } else if (check.status === 'warn') {
      switch (check.severity) {
        case 'critical': score -= 5; break;
        case 'high': score -= 3; break;
        case 'medium': score -= 2; break;
        case 'low': score -= 1; break;
        default: break;
      }
    }
  }
  return Math.max(0, score);
}

function getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function buildSummary(checks: CheckResult[]) {
  const byCategory: Record<string, { pass: number; warn: number; fail: number; info: number }> = {};

  for (const c of checks) {
    if (!byCategory[c.category]) {
      byCategory[c.category] = { pass: 0, warn: 0, fail: 0, info: 0 };
    }
    byCategory[c.category][c.status]++;
  }

  return {
    total: checks.length,
    pass: checks.filter((c) => c.status === 'pass').length,
    warn: checks.filter((c) => c.status === 'warn').length,
    fail: checks.filter((c) => c.status === 'fail').length,
    info: checks.filter((c) => c.status === 'info').length,
    byCategory,
  };
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    await requireAdminAccess({ permission: 'audit:view' });

    const body = await request.json();
    const scope: Scope = body.scope || 'full';

    const validScopes: Scope[] = ['full', 'security', 'frontend', 'backend', 'database', 'api', 'config'];
    if (!validScopes.includes(scope)) {
      return NextResponse.json(
        { error: `Invalid scope. Must be one of: ${validScopes.join(', ')}` },
        { status: 400 },
      );
    }

    const start = Date.now();
    let checks: CheckResult[] = [];

    switch (scope) {
      case 'security':
        checks = getSecurityChecks();
        break;
      case 'frontend':
        checks = getFrontendChecks();
        break;
      case 'backend':
        checks = getBackendChecks();
        break;
      case 'database':
        checks = await getDatabaseChecks();
        break;
      case 'api':
        checks = getAPIChecks();
        break;
      case 'config':
        checks = getConfigChecks();
        break;
      case 'full': {
        const dbChecks = await getDatabaseChecks();
        checks = [
          ...getSecurityChecks(),
          ...getFrontendChecks(),
          ...getBackendChecks(),
          ...dbChecks,
          ...getAPIChecks(),
          ...getConfigChecks(),
        ];
        break;
      }
    }

    const duration = Date.now() - start;
    const score = calculateScore(checks);
    const grade = getGrade(score);
    const summary = buildSummary(checks);

    return NextResponse.json({
      scope,
      timestamp: new Date().toISOString(),
      duration,
      score,
      grade,
      checks,
      summary,
    });
  } catch (error) {
    return handleAdminError(error, '/api/admin/audit/run');
  }
}
