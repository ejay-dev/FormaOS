#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const MARKETING_DIR = path.join(ROOT, 'app', '(marketing)');

const BUDGETS = {
  immersiveSubheadline: 160,
  compactDescription: 170,
  ctaLabel: 24,
};

const WEAK_PHRASES = [
  'everything you need to know',
  'our team is here to help',
  'failure is not an option',
  'not just',
  'designed to be reviewable',
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
      continue;
    }
    if (entry.isFile() && full.endsWith('.tsx')) {
      files.push(full);
    }
  }
  return files;
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

function clean(raw) {
  return raw.replace(/\s+/g, ' ').trim();
}

function parseLiteralAttr(block, attrName) {
  const doubleQuoted = block.match(
    new RegExp(attrName + '\\s*=\\s*"([^"]+)"', 'm'),
  );
  if (doubleQuoted?.[1]) return clean(doubleQuoted[1]);

  const singleQuoted = block.match(
    new RegExp(attrName + "\\s*=\\s*\\{'([^']+)'\\}", 'm'),
  );
  if (singleQuoted?.[1]) return clean(singleQuoted[1]);

  const templateQuoted = block.match(
    new RegExp(attrName + '\\s*=\\s*\\{\\`([^\\`]*)\\`\\}', 'm'),
  );
  if (templateQuoted?.[1]) return clean(templateQuoted[1]);

  return null;
}

function parseBlocks(source, componentName) {
  const blockRegex = new RegExp(`<${componentName}[\\s\\S]*?\\/\\>`, 'g');
  const blocks = [];
  let match = blockRegex.exec(source);
  while (match) {
    blocks.push({
      block: match[0],
      start: match.index,
    });
    match = blockRegex.exec(source);
  }
  return blocks;
}

function addWeakPhraseIssues(base, value, field) {
  const issues = [];
  if (!value) return issues;
  const normalized = value.toLowerCase();
  for (const phrase of WEAK_PHRASES) {
    if (!normalized.includes(phrase)) continue;
    issues.push({
      ...base,
      severity: 'info',
      field,
      message: `Contains weak enterprise phrase "${phrase}".`,
    });
  }
  return issues;
}

function auditFile(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  const relFile = path.relative(ROOT, filePath);

  const subheadlineRegex =
    /subheadline\s*=\s*(?:"([^"]+)"|\{'([^']+)'\}|\{`([^`]+)`\})/g;
  let subheadlineMatch = subheadlineRegex.exec(source);
  while (subheadlineMatch) {
    const subheadline = clean(
      subheadlineMatch[1] ?? subheadlineMatch[2] ?? subheadlineMatch[3] ?? '',
    );
    const base = {
      file: relFile,
      line: lineOf(source, subheadlineMatch.index),
    };
    if (subheadline && subheadline.length > BUDGETS.immersiveSubheadline) {
      issues.push({
        ...base,
        severity: 'warn',
        field: 'subheadline',
        length: subheadline.length,
        message: `Subheadline exceeds ${BUDGETS.immersiveSubheadline} characters.`,
      });
    }
    issues.push(...addWeakPhraseIssues(base, subheadline, 'subheadline'));
    subheadlineMatch = subheadlineRegex.exec(source);
  }

  const ctaRegex =
    /(primaryCta|secondaryCta)\s*=\s*\{\{[\s\S]*?label\s*:\s*['"]([^'"]+)['"][\s\S]*?\}\}/g;
  let ctaMatch = ctaRegex.exec(source);
  while (ctaMatch) {
    const ctaKey = ctaMatch[1];
    const label = clean(ctaMatch[2] ?? '');
    const field = ctaKey === 'primaryCta' ? 'primaryCtaLabel' : 'secondaryCtaLabel';
    if (label.length > BUDGETS.ctaLabel) {
      issues.push({
        file: relFile,
        line: lineOf(source, ctaMatch.index),
        severity: 'warn',
        field,
        length: label.length,
        message: `${ctaKey} label exceeds ${BUDGETS.ctaLabel} characters.`,
      });
    }
    ctaMatch = ctaRegex.exec(source);
  }

  for (const item of parseBlocks(source, 'CompactHero')) {
    const description = parseLiteralAttr(item.block, 'description');
    const base = {
      file: relFile,
      line: lineOf(source, item.start),
    };

    if (description && description.length > BUDGETS.compactDescription) {
      issues.push({
        ...base,
        severity: 'warn',
        field: 'description',
        length: description.length,
        message: `CompactHero description exceeds ${BUDGETS.compactDescription} characters.`,
      });
    }
    issues.push(...addWeakPhraseIssues(base, description, 'description'));
  }

  return issues;
}

function run() {
  const strict = process.argv.includes('--strict');
  const files = walk(MARKETING_DIR);
  const issues = files.flatMap((file) => auditFile(file));
  const warnCount = issues.filter((i) => i.severity === 'warn').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  console.log('Marketing Enterprise Copy Audit');
  console.log(`Scanned files: ${files.length}`);
  console.log(`Warn: ${warnCount} | Info: ${infoCount}`);

  if (issues.length > 0) {
    console.log('\nFindings:');
    for (const issue of issues) {
      const lengthPart = issue.length ? ` (len=${issue.length})` : '';
      console.log(
        `- [${issue.severity}] ${issue.file}:${issue.line} ${issue.field}${lengthPart} - ${issue.message}`,
      );
    }
  } else {
    console.log('\nNo issues detected.');
  }

  if (strict && warnCount > 0) {
    process.exitCode = 1;
  }
}

run();
