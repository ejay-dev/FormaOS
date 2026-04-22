import fs from 'fs/promises';
import path from 'path';
import postcss from 'postcss';

const ROOT = process.cwd();
const TARGET_DIRS = ['app', 'components', 'mobile'];
const STYLE_EXTENSIONS = new Set(['.css', '.scss']);
const failures = [];

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next') {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }

    if (STYLE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

for (const relativeDir of TARGET_DIRS) {
  const absoluteDir = path.join(ROOT, relativeDir);
  const files = await walk(absoluteDir);

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    try {
      postcss.parse(content, { from: file });
    } catch (error) {
      failures.push(
        `${path.relative(ROOT, file)}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error('Style syntax check failed:\n');
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Style syntax check passed.');
