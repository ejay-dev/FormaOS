const c = require('./coverage/coverage-final.json');
let totalBranches = 0,
  coveredBranches = 0;
for (const [file, data] of Object.entries(c)) {
  const bh = data.b;
  for (const [id, locs] of Object.entries(bh)) {
    for (const count of locs) {
      totalBranches++;
      if (count > 0) coveredBranches++;
    }
  }
}
console.log(
  'Branches:',
  coveredBranches +
    '/' +
    totalBranches +
    ' = ' +
    ((100 * coveredBranches) / totalBranches).toFixed(2) +
    '%',
);

// Show per-file coverage for our test targets
const files = [
  'theme-utils.ts',
  'device-tier.ts',
  'coverage-calculator.ts',
  'support-sla.ts',
  'value-calculator.ts',
  'usage-analyzer.ts',
  'email-log-compat.ts',
  'entitlement-drift-detector.ts',
  'governance.ts',
  'widget-data.ts',
  'csrf.ts',
  'url-validator.ts',
  'sanitize-html.ts',
  'rate-limit-log.ts',
  'digest.ts',
  'metrics-service.ts',
];
console.log('\nPer-file coverage for tested files:');
for (const f of files) {
  const keys = Object.keys(c).filter((k) => k.endsWith('/' + f));
  for (const key of keys) {
    const bh = c[key].b;
    let total = 0,
      covered = 0;
    for (const [id, locs] of Object.entries(bh)) {
      for (const count of locs) {
        total++;
        if (count > 0) covered++;
      }
    }
    console.log(
      key.replace(/.*FormaOS\//, '') +
        ': ' +
        covered +
        '/' +
        total +
        ' (' +
        (total > 0 ? ((100 * covered) / total).toFixed(1) : '100') +
        '%)',
    );
  }
}
