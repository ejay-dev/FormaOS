// Find top files with uncovered branches from coverage-final.json
const c = require('./coverage/coverage-final.json');
const results = [];
for (const [file, data] of Object.entries(c)) {
  const bh = data.b;
  let total = 0,
    covered = 0;
  for (const locs of Object.values(bh)) {
    for (const count of locs) {
      total++;
      if (count > 0) covered++;
    }
  }
  const uncovered = total - covered;
  if (uncovered > 0) {
    results.push({
      file: file.replace(/.*FormaOS\//, ''),
      total,
      covered,
      uncovered,
      pct: total > 0 ? ((100 * covered) / total).toFixed(1) : '100.0',
    });
  }
}
results.sort((a, b) => b.uncovered - a.uncovered);
console.log('Top 50 files by uncovered branches:');
for (const r of results.slice(0, 50)) {
  console.log(
    `${r.uncovered} uncovered (${r.covered}/${r.total} = ${r.pct}%) — ${r.file}`,
  );
}
console.log(
  '\nTotal uncovered:',
  results.reduce((s, r) => s + r.uncovered, 0),
);
