/**
 * dump.js — Project Content Dumper
 * Walks the project folder and writes every file's content
 * into _PROJECT_DUMP.txt at the project root.
 *
 * SKIPS ONLY:
 *   - node_modules/
 *   - .git/
 *   - package-lock.json
 *   - _PROJECT_DUMP.txt  (its own output)
 *   - dump.js            (this script itself)
 *   - dump.bat           (the launcher)
 *
 * Run via:
 *   node dump.js
 *   npm run dump
 *   dump.bat  (double-click)
 */

const fs   = require('fs');
const path = require('path');

// ── SKIP ONLY THESE ──────────────────────────────────────────────────────────

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.angular'
]);

const SKIP_FILES = new Set([
  'package-lock.json',
  '_PROJECT_DUMP.txt',
  'dump.js',
  'dump.bat'
]);

// These file types exist in the dump (so Claude knows about them)
// but their content is NOT read — just the path is noted
const BINARY_EXTS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico',
  'ttf', 'woff', 'woff2', 'eot', 'otf',
  'pdf', 'docx', 'xlsx', 'zip', 'rar', '7z', 'tar', 'gz',
  'exe', 'dll', 'so', 'dylib', 'class', 'jar', 'war',
  'mp3', 'mp4', 'wav', 'avi', 'mov',
  'pack'
]);

function isBinary(filename) {
  const dot = filename.lastIndexOf('.');
  if (dot < 0) return false;
  return BINARY_EXTS.has(filename.slice(dot + 1).toLowerCase());
}

// ── HELPERS ──────────────────────────────────────────────────────────────────

function shouldSkipDir(name) {
  return SKIP_DIRS.has(name);
}

function shouldSkipFile(name) {
  return SKIP_FILES.has(name);
}

// ── WALK ─────────────────────────────────────────────────────────────────────

function walk(dir, root, collected) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch (e) { return; }

  const dirs  = entries.filter(e => e.isDirectory()).sort((a,b) => a.name.localeCompare(b.name));
  const files = entries.filter(e => e.isFile()).sort((a,b) => a.name.localeCompare(b.name));

  for (const d of dirs) {
    if (!shouldSkipDir(d.name)) {
      walk(path.join(dir, d.name), root, collected);
    }
  }

  for (const f of files) {
    if (!shouldSkipFile(f.name)) {
      const abs      = path.join(dir, f.name);
      const relative = path.relative(root, abs).replace(/\\/g, '/');
      collected.push({ abs, relative });
    }
  }
}

// ── MAIN ─────────────────────────────────────────────────────────────────────

function run() {
  const root    = __dirname;
  const outFile = path.join(root, '_PROJECT_DUMP.txt');
  const project = path.basename(root);

  console.log('\n  Project Dumper');
  console.log('  ──────────────────────────────');
  console.log('  Project : ' + project);
  console.log('  Root    : ' + root);
  console.log('');

  const collected = [];
  walk(root, root, collected);

  console.log('  Found ' + collected.length + ' files. Reading...\n');

  const lines = [];

  // ── HEADER ──
  lines.push('PROJECT: ' + project);
  lines.push('PATH   : ' + root);
  lines.push('FILES  : ' + collected.length);
  lines.push('');
  lines.push('HOW TO USE:');
  lines.push('  Copy everything in this file and paste it into Claude.');
  lines.push('  Then ask your question — Claude will understand the full project.');
  lines.push('');
  lines.push('='.repeat(70));
  lines.push('');

  // ── STRUCTURE TREE ──
  lines.push('PROJECT STRUCTURE');
  lines.push('-'.repeat(50));
  for (const f of collected) {
    lines.push('  ' + f.relative);
  }
  lines.push('');
  lines.push('='.repeat(70));
  lines.push('');

  // ── FILE CONTENTS ──
  for (let i = 0; i < collected.length; i++) {
    const { abs, relative } = collected[i];

    process.stdout.write('  [' + (i + 1) + '/' + collected.length + '] ' + relative + '\n');

    lines.push('');
    lines.push('=== ' + relative + ' ===');

    if (isBinary(relative)) {
      lines.push('[binary file — content skipped]');
    } else {
      try {
        const content = fs.readFileSync(abs, 'utf8');
        lines.push(content);
      } catch (e) {
        lines.push('[could not read file: ' + e.message + ']');
      }
    }

    lines.push('');
  }

  // ── FOOTER ──
  lines.push('='.repeat(70));
  lines.push('END OF PROJECT DUMP');
  lines.push('='.repeat(70));

  const result = lines.join('\n');
  fs.writeFileSync(outFile, result, 'utf8');

  const kb = (Buffer.byteLength(result, 'utf8') / 1024).toFixed(1);

  console.log('');
  console.log('  Done!');
  console.log('  Saved to : _PROJECT_DUMP.txt  (project root)');
  console.log('  Size     : ' + kb + ' KB  /  ' + result.length + ' characters');
  console.log('');
  console.log('  NEXT STEPS:');
  console.log('  1. Open _PROJECT_DUMP.txt in VS Code');
  console.log('  2. Ctrl+A  ->  Select all');
  console.log('  3. Ctrl+C  ->  Copy');
  console.log('  4. Paste into Claude with your question');
  console.log('');
}

run();
