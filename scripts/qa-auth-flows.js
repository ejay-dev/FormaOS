const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const accountsPath =
  process.env.QA_ACCOUNTS_FILE ||
  path.join(process.cwd(), 'test-results', 'qa-test-accounts.json');

if (!fs.existsSync(accountsPath)) {
  console.error(`QA accounts file not found at ${accountsPath}`);
  process.exit(1);
}

const accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));

const envs = [
  {
    name: 'local',
    siteBase: 'http://localhost:3000',
    appBase: 'http://localhost:3000',
  },
  {
    name: 'production',
    siteBase: 'https://formaos.com.au',
    appBase: 'https://app.formaos.com.au',
  },
];

const envFilter = process.env.QA_ENV
  ? new Set(process.env.QA_ENV.split(',').map((value) => value.trim()))
  : null;

const activeEnvs = envFilter
  ? envs.filter((env) => envFilter.has(env.name))
  : envs;

const ensureNewUserEmail = (envName) => {
  const email = `qa-new-${envName}-${Date.now()}@example.com`;
  accounts.newUsers = accounts.newUsers || [];
  accounts.newUsers.push(email);
  fs.writeFileSync(accountsPath, JSON.stringify(accounts, null, 2));
  return email;
};

const assertVisibleText = async (page, text) => {
  await page.locator(`text=${text}`).first().waitFor({ timeout: 15000 });
};

const demoLabels = ['Request Demo', 'Schedule Demo', 'Contact Sales'];
const trialLabels = [
  'Start Free Trial',
  'Start Free',
  'Get Started',
  'Get Started Free',
  'Start Your Free Trial',
];

const normalize = (value = '') => value.replace(/\/$/, '');

const assertDemoCtas = async (page, env, pageName) => {
  const marketingBase = normalize(env.siteBase);
  for (const label of demoLabels) {
    const link = page.getByRole('link', { name: new RegExp(label, 'i') }).first();
    if ((await link.count()) === 0) continue;
    const href = await link.getAttribute('href');
    if (!href) {
      throw new Error(`[${env.name}] ${pageName}: demo CTA "${label}" missing href`);
    }
    if (href.startsWith('http')) {
      if (!href.startsWith(`${marketingBase}/contact`)) {
        throw new Error(
          `[${env.name}] ${pageName}: demo CTA "${label}" points to ${href}, expected ${marketingBase}/contact`,
        );
      }
    } else if (href !== '/contact' && !href.startsWith('/contact?')) {
      throw new Error(
        `[${env.name}] ${pageName}: demo CTA "${label}" points to ${href}, expected /contact`,
      );
    }
  }
};

const assertTrialCtas = async (page, env, pageName) => {
  const allowedAppBases = [normalize(env.appBase)];
  if (env.name === 'local') {
    allowedAppBases.push('https://app.formaos.com.au');
  }

  let found = 0;
  for (const label of trialLabels) {
    const link = page.getByRole('link', { name: new RegExp(label, 'i') }).first();
    if ((await link.count()) === 0) continue;
    found += 1;
    const href = await link.getAttribute('href');
    if (!href) {
      throw new Error(`[${env.name}] ${pageName}: trial CTA "${label}" missing href`);
    }
    if (!allowedAppBases.some((base) => href.startsWith(base))) {
      throw new Error(
        `[${env.name}] ${pageName}: trial CTA "${label}" points to ${href}, expected ${allowedAppBases.join(
          ' or ',
        )}`,
      );
    }
  }

  if (!found) {
    throw new Error(`[${env.name}] ${pageName}: no trial CTA found`);
  }
};

const assertNoRelativeAuthLinks = async (page, env, pageName) => {
  const relativeAuthLinks = await page.locator('a[href^=\"/auth\"]').count();
  if (relativeAuthLinks > 0) {
    throw new Error(
      `[${env.name}] ${pageName}: found ${relativeAuthLinks} relative /auth links on marketing domain`,
    );
  }
};

const runEnvChecks = async (env) => {
  console.log(`\n🔍 QA flows on ${env.name}...`);
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  const marketingPages = [
    { name: 'home', path: '' },
    { name: 'pricing', path: '/pricing' },
    { name: 'product', path: '/product' },
  ];

  for (const pageInfo of marketingPages) {
    const targetUrl = `${env.siteBase}${pageInfo.path}`;
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    await assertNoRelativeAuthLinks(page, env, pageInfo.name);
    await assertTrialCtas(page, env, pageInfo.name);
    await assertDemoCtas(page, env, pageInfo.name);
  }

  const newUserEmail = ensureNewUserEmail(env.name);
  await page.goto(`${env.appBase}/auth/signup?plan=pro`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForSelector('#email', { state: 'visible', timeout: 20000 });
  await page.waitForSelector('#password', { state: 'visible', timeout: 20000 });
  await page.waitForSelector('#confirm-password', {
    state: 'visible',
    timeout: 20000,
  });
  await page.fill('#email', newUserEmail);
  await page.fill('#password', accounts.password);
  await page.fill('#confirm-password', accounts.password);
  const signupState = await page.evaluate(() => ({
    hasForm: Boolean(document.querySelector('form')),
    email: document.querySelector('#email')?.value,
    password: document.querySelector('#password')?.value,
    confirm: document.querySelector('#confirm-password')?.value,
  }));
  if (!signupState.hasForm) {
    throw new Error(`[${env.name}] signup form not found`);
  }
  if (!signupState.email || !signupState.password || !signupState.confirm) {
    await page.fill('#email', '');
    await page.type('#email', newUserEmail);
    await page.fill('#password', '');
    await page.type('#password', accounts.password);
    await page.fill('#confirm-password', '');
    await page.type('#confirm-password', accounts.password);
  }
  await page.click('button[type="submit"]', { force: true });
  await page.waitForTimeout(500);
  const errorBanner = page.locator('[class*="text-rose"]');
  try {
    await Promise.race([
      assertVisibleText(
        page,
        'Please check your email to confirm your account',
      ),
      page.waitForURL('**/auth/callback**', { timeout: 15000 }),
      page.waitForURL('**/app', { timeout: 15000 }),
      errorBanner.first().waitFor({ timeout: 15000 }),
    ]);
  } catch {
    const bodyText = await page.textContent('body');
    throw new Error(
      `[${env.name}] signup confirmation not detected. Page: ${page.url()} ` +
        `State: ${JSON.stringify(signupState)} ` +
        `Body: ${String(bodyText).slice(0, 280)} ` +
        `Console: ${consoleErrors.join(' | ').slice(0, 300)}`,
    );
  }

  if (await errorBanner.count()) {
    const text = await errorBanner.first().innerText();
    throw new Error(`[${env.name}] signup error: ${text}`);
  }

  const waitForLogin = async (label) => {
    const errorBanner = page.locator('[class*="text-rose"]');
    await Promise.race([
      page.waitForURL('**/app', { timeout: 20000 }),
      errorBanner.first().waitFor({ timeout: 20000 }),
    ]);
    if (await errorBanner.count()) {
      const text = await errorBanner.first().innerText();
      throw new Error(`[${env.name}] ${label} login error: ${text}`);
    }
  };

  await page.goto(`${env.appBase}/auth/signin`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForSelector('#email', { state: 'visible', timeout: 20000 });
  await page.waitForSelector('#password', { state: 'visible', timeout: 20000 });
  await page.fill('#email', accounts.users.existing.email);
  await page.fill('#password', accounts.password);
  const loginState = await page.evaluate(() => ({
    email: document.querySelector('#email')?.value,
    password: document.querySelector('#password')?.value,
  }));
  if (!loginState.email || !loginState.password) {
    await page.fill('#email', '');
    await page.type('#email', accounts.users.existing.email);
    await page.fill('#password', '');
    await page.type('#password', accounts.password);
  }
  const loginStateAfter = await page.evaluate(() => ({
    email: document.querySelector('#email')?.value,
    password: document.querySelector('#password')?.value,
  }));
  if (!loginStateAfter.email || !loginStateAfter.password) {
    throw new Error(
      `[${env.name}] existing login inputs missing: ${JSON.stringify(
        loginStateAfter,
      )}`,
    );
  }
  await page.click('button[type="submit"]');
  await waitForLogin('existing');

  const corePaths = [
    '/app',
    '/app/settings',
    '/app/team',
    '/app/billing',
  ];
  for (const pathSuffix of corePaths) {
    await page.goto(`${env.appBase}${pathSuffix}`, {
      waitUntil: 'domcontentloaded',
    });
    if (page.url().includes('/auth/signin')) {
      throw new Error(`[${env.name}] redirect to signin at ${pathSuffix}`);
    }
  }

  await page.goto(`${env.appBase}/auth/signout`, {
    waitUntil: 'domcontentloaded',
  });

  await page.goto(`${env.appBase}/auth/signin`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForSelector('#email', { state: 'visible', timeout: 20000 });
  await page.waitForSelector('#password', { state: 'visible', timeout: 20000 });
  await page.fill('#email', accounts.users.trial.email);
  await page.fill('#password', accounts.password);
  const trialLoginState = await page.evaluate(() => ({
    email: document.querySelector('#email')?.value,
    password: document.querySelector('#password')?.value,
  }));
  if (!trialLoginState.email || !trialLoginState.password) {
    await page.fill('#email', '');
    await page.type('#email', accounts.users.trial.email);
    await page.fill('#password', '');
    await page.type('#password', accounts.password);
  }
  const trialLoginStateAfter = await page.evaluate(() => ({
    email: document.querySelector('#email')?.value,
    password: document.querySelector('#password')?.value,
  }));
  if (!trialLoginStateAfter.email || !trialLoginStateAfter.password) {
    throw new Error(
      `[${env.name}] trial login inputs missing: ${JSON.stringify(
        trialLoginStateAfter,
      )}`,
    );
  }
  await page.click('button[type="submit"]');
  await waitForLogin('trial');
  await page.goto(`${env.appBase}/app/billing`, {
    waitUntil: 'domcontentloaded',
  });
  if (page.url().includes('/auth/signin')) {
    throw new Error(`[${env.name}] trial user redirected to signin`);
  }

  await page.goto(`${env.appBase}/auth/signout`, {
    waitUntil: 'domcontentloaded',
  });
  await context.clearCookies();

  const inviteToken = accounts.invitations.invitedUser.token;
  await page.goto(`${env.appBase}/accept-invite/${inviteToken}`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(1000);
  const hasEmail = (await page.locator('#email').count()) > 0;
  const hasWelcome = (await page.locator('text=Welcome to').count()) > 0;
  const hasMismatch = (await page.locator('text=Email Mismatch').count()) > 0;

  if (hasEmail) {
    await page.waitForSelector('#password', { state: 'visible', timeout: 20000 });
    await page.fill('#email', accounts.users.invited.email);
    await page.fill('#password', accounts.password);
    const invitedLoginState = await page.evaluate(() => ({
      email: document.querySelector('#email')?.value,
      password: document.querySelector('#password')?.value,
    }));
    if (!invitedLoginState.email || !invitedLoginState.password) {
      await page.fill('#email', '');
      await page.type('#email', accounts.users.invited.email);
      await page.fill('#password', '');
      await page.type('#password', accounts.password);
    }
    const invitedLoginStateAfter = await page.evaluate(() => ({
      email: document.querySelector('#email')?.value,
      password: document.querySelector('#password')?.value,
    }));
    if (!invitedLoginStateAfter.email || !invitedLoginStateAfter.password) {
      throw new Error(
        `[${env.name}] invited login inputs missing: ${JSON.stringify(
          invitedLoginStateAfter,
        )}`,
      );
    }
    await page.click('button[type="submit"]');
    await page.waitForURL(`**/accept-invite/${inviteToken}`, { timeout: 20000 });
  } else if (!hasWelcome && !hasMismatch) {
    const bodyText = await page.textContent('body');
    throw new Error(
      `[${env.name}] invited flow unexpected page: ${page.url()} ` +
        `Body: ${String(bodyText).slice(0, 280)}`,
    );
  }

  await assertVisibleText(page, 'Welcome to');
  await page.click('a[href=\"/app\"]');
  await page.waitForURL('**/app', { timeout: 20000 });

  await browser.close();
  console.log(`✅ ${env.name} QA flows completed`);
};

const run = async () => {
  const failures = [];
  for (const env of activeEnvs) {
    try {
      await runEnvChecks(env);
    } catch (error) {
      failures.push({ env: env.name, error: error.message });
      console.error(`❌ ${env.name} QA failed:`, error.message);
    }
  }

  if (failures.length) {
    console.error('❌ QA auth flow check failed:', failures);
    process.exit(1);
  }
};

run().catch((error) => {
  console.error('❌ QA auth flow check failed:', error.message);
  process.exit(1);
});
