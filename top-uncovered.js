const data = require('./coverage/coverage-summary.json');
const files = Object.entries(data)
  .filter(([k]) => k !== 'total' && k.indexOf('components/') === -1)
  .map(([k, v]) => ({
    file: k.replace('/Users/ejaz/FormaOS/', ''),
    uncov: v.statements.total - v.statements.covered,
    total: v.statements.total,
    pct: v.statements.pct,
  }))
  .filter((f) => f.uncov > 50)
  .sort((a, b) => b.uncov - a.uncov)
  .slice(0, 40);
files.forEach((f) =>
  console.log(
    String(f.uncov).padStart(5) +
      ' ' +
      String(f.pct + '%').padStart(6) +
      ' ' +
      f.file,
  ),
);
