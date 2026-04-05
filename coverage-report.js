const c = require('./coverage/coverage-summary.json');
const dirs = {};
for (const [file, data] of Object.entries(c)) {
  if (file === 'total') continue;
  const parts = file.replace(process.cwd() + '/', '').split('/');
  let dir;
  if (parts[0] === 'lib') dir = parts.length > 2 ? 'lib/' + parts[1] : 'lib';
  else if (parts[0] === 'app')
    dir = parts.slice(0, Math.min(3, parts.length - 1)).join('/');
  else if (parts[0] === 'components') dir = 'components';
  else dir = parts[0];
  if (!dirs[dir]) dirs[dir] = { total: 0, covered: 0 };
  dirs[dir].total += data.statements.total;
  dirs[dir].covered += data.statements.covered;
}
const sorted = Object.entries(dirs)
  .map(([d, v]) => ({
    dir: d,
    total: v.total,
    covered: v.covered,
    uncovered: v.total - v.covered,
    pct: v.total ? Math.round((v.covered / v.total) * 100) : 0,
  }))
  .sort((a, b) => b.uncovered - a.uncovered);
sorted
  .slice(0, 30)
  .forEach((s) =>
    console.log(
      String(s.uncovered).padStart(5),
      (s.pct + '%').padStart(5),
      String(s.total).padStart(5),
      s.dir,
    ),
  );
