import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { requireAdminAccess } from '@/app/app/admin/access';
import { handleAdminError } from '@/app/api/admin/_helpers';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

type Scope = 'full' | 'frontend' | 'backend' | 'security' | 'dependencies' | 'types';

interface CheckResult {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  details?: string;
}

function runCommand(command: string): { stdout: string; exitCode: number } {
  try {
    const stdout = execSync(command, {
      timeout: 120000,
      encoding: 'utf-8',
      cwd: process.cwd(),
    });
    return { stdout, exitCode: 0 };
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string; status?: number };
    return {
      stdout: execError.stdout || execError.stderr || String(error),
      exitCode: execError.status ?? 1,
    };
  }
}

function runTypesCheck(): CheckResult {
  const { stdout, exitCode } = runCommand('npx tsc --noEmit');

  if (exitCode === 0) {
    return { name: 'types', status: 'pass', message: 'TypeScript compilation passed with no errors' };
  }

  const errorLines = stdout.split('\n').filter((line) => line.includes('error TS'));
  const errorCount = errorLines.length;

  return {
    name: 'types',
    status: 'fail',
    message: `TypeScript compilation found ${errorCount} error${errorCount !== 1 ? 's' : ''}`,
    details: stdout.slice(0, 2000),
  };
}

function runEslintCheck(name: string, paths: string): CheckResult {
  const { stdout, exitCode } = runCommand(`npx eslint ${paths} --max-warnings 9999`);

  if (exitCode === 0) {
    return { name, status: 'pass', message: `ESLint ${name} check passed with no issues` };
  }

  const errorMatch = stdout.match(/(\d+)\s+error/);
  const warningMatch = stdout.match(/(\d+)\s+warning/);
  const errors = errorMatch ? parseInt(errorMatch[1], 10) : 0;
  const warnings = warningMatch ? parseInt(warningMatch[1], 10) : 0;

  const status = errors > 0 ? 'fail' : 'warn';

  return {
    name,
    status,
    message: `ESLint ${name}: ${errors} error${errors !== 1 ? 's' : ''}, ${warnings} warning${warnings !== 1 ? 's' : ''}`,
    details: stdout.slice(0, 2000),
  };
}

function runSecurityCheck(): CheckResult {
  const { stdout } = runCommand('npm audit --json');

  try {
    const audit = JSON.parse(stdout);
    const vulnerabilities = audit.metadata?.vulnerabilities || {};
    const critical = vulnerabilities.critical || 0;
    const high = vulnerabilities.high || 0;
    const moderate = vulnerabilities.moderate || 0;
    const low = vulnerabilities.low || 0;
    const total = critical + high + moderate + low;

    if (total === 0) {
      return { name: 'security', status: 'pass', message: 'No vulnerabilities found' };
    }

    const status = critical > 0 || high > 0 ? 'fail' : 'warn';

    return {
      name: 'security',
      status,
      message: `Found ${total} vulnerabilit${total !== 1 ? 'ies' : 'y'}: ${critical} critical, ${high} high, ${moderate} moderate, ${low} low`,
      details: stdout.slice(0, 2000),
    };
  } catch {
    return {
      name: 'security',
      status: 'warn',
      message: 'Could not parse npm audit output',
      details: stdout.slice(0, 2000),
    };
  }
}

function runDependenciesCheck(): CheckResult {
  const { stdout } = runCommand('npm audit --json');

  try {
    const audit = JSON.parse(stdout);
    const vulnerabilities = audit.metadata?.vulnerabilities || {};
    const critical = vulnerabilities.critical || 0;
    const high = vulnerabilities.high || 0;
    const moderate = vulnerabilities.moderate || 0;
    const low = vulnerabilities.low || 0;
    const total = critical + high + moderate + low;

    const { stdout: outdatedOutput } = runCommand('npm outdated --json');
    let outdatedCount = 0;
    try {
      const outdated = JSON.parse(outdatedOutput || '{}');
      outdatedCount = Object.keys(outdated).length;
    } catch {
      // outdated parse failed, continue with vulnerability info only
    }

    if (total === 0 && outdatedCount === 0) {
      return { name: 'dependencies', status: 'pass', message: 'No vulnerabilities or outdated packages found' };
    }

    const status = critical > 0 || high > 0 ? 'fail' : 'warn';
    const parts: string[] = [];
    if (total > 0) {
      parts.push(`${total} vulnerabilit${total !== 1 ? 'ies' : 'y'} (${critical} critical, ${high} high, ${moderate} moderate, ${low} low)`);
    }
    if (outdatedCount > 0) {
      parts.push(`${outdatedCount} outdated package${outdatedCount !== 1 ? 's' : ''}`);
    }

    return {
      name: 'dependencies',
      status,
      message: parts.join('; '),
      details: stdout.slice(0, 2000),
    };
  } catch {
    return {
      name: 'dependencies',
      status: 'warn',
      message: 'Could not parse dependency audit output',
      details: stdout.slice(0, 2000),
    };
  }
}

function getChecksForScope(scope: Scope): CheckResult[] {
  const checks: CheckResult[] = [];

  switch (scope) {
    case 'types':
      checks.push(runTypesCheck());
      break;
    case 'frontend':
      checks.push(runEslintCheck('frontend', '"app/**" "components/**"'));
      break;
    case 'backend':
      checks.push(runEslintCheck('backend', '"lib/**" "app/api/**"'));
      break;
    case 'security':
      checks.push(runSecurityCheck());
      break;
    case 'dependencies':
      checks.push(runDependenciesCheck());
      break;
    case 'full':
      checks.push(runTypesCheck());
      checks.push(runEslintCheck('frontend', '"app/**" "components/**"'));
      checks.push(runEslintCheck('backend', '"lib/**" "app/api/**"'));
      checks.push(runSecurityCheck());
      checks.push(runDependenciesCheck());
      break;
  }

  return checks;
}

export async function POST(request: Request) {
  try {
    await requireAdminAccess({ permission: 'audit:view' });

    const body = await request.json();
    const scope: Scope = body.scope || 'full';

    const validScopes: Scope[] = ['full', 'frontend', 'backend', 'security', 'dependencies', 'types'];
    if (!validScopes.includes(scope)) {
      return NextResponse.json(
        { error: `Invalid scope. Must be one of: ${validScopes.join(', ')}` },
        { status: 400 },
      );
    }

    const checks = getChecksForScope(scope);

    const summary = {
      pass: checks.filter((c) => c.status === 'pass').length,
      warn: checks.filter((c) => c.status === 'warn').length,
      fail: checks.filter((c) => c.status === 'fail').length,
    };

    return NextResponse.json({
      scope,
      timestamp: new Date().toISOString(),
      checks,
      summary,
    });
  } catch (error) {
    return handleAdminError(error, '/api/admin/audit/run');
  }
}
