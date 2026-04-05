const d = require('./coverage/coverage-summary.json');
let cs = 0,
  cc = 0,
  ls = 0,
  lc = 0,
  as = 0,
  ac = 0;
for (const [f, v] of Object.entries(d)) {
  if (f === 'total') continue;
  const s = v.statements;
  if (f.includes('/components/')) {
    cs += s.total;
    cc += s.covered;
  } else if (f.includes('/lib/')) {
    ls += s.total;
    lc += s.covered;
  } else if (f.includes('/app/api/')) {
    as += s.total;
    ac += s.covered;
  }
}
console.log('Components:', cc + '/' + cs, Math.round((cc / cs) * 100) + '%');
console.log('Lib:', lc + '/' + ls, Math.round((lc / ls) * 100) + '%');
console.log('API:', ac + '/' + as, Math.round((ac / (as || 1)) * 100) + '%');
const nc = 40195 - cs;
console.log('Without comp, 40% needs:', Math.round(nc * 0.4), 'of', nc);
console.log('Non-comp covered:', 6235 - cc);
