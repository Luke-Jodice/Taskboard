import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CODE_DIR = path.join(os.homedir(), 'Code');
const IGNORE = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt',
  '__pycache__', '.DS_Store', 'coverage', '.cache', '.turbo',
  'out', '.svelte-kit', 'vendor',
]);

export interface FileResult {
  path: string;
  display: string;
  type: 'file' | 'directory';
}

let cache: FileResult[] = [];
let cacheTime = 0;
const CACHE_TTL = 30_000;

function walk(dir: string, depth: number, maxDepth: number): FileResult[] {
  if (depth > maxDepth) return [];
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const results: FileResult[] = [];
  for (const entry of entries) {
    if (IGNORE.has(entry.name) || entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    const rel = path.relative(CODE_DIR, fullPath);
    const display = rel.split(path.sep).join(' › ');
    const type = entry.isDirectory() ? 'directory' : 'file';
    results.push({ path: fullPath, display, type });
    if (entry.isDirectory()) {
      results.push(...walk(fullPath, depth + 1, maxDepth));
    }
  }
  return results;
}

function getIndex(): FileResult[] {
  if (Date.now() - cacheTime < CACHE_TTL) return cache;
  cache = fs.existsSync(CODE_DIR) ? walk(CODE_DIR, 0, 5) : [];
  cacheTime = Date.now();
  return cache;
}

const router = Router();

router.get('/search', (req, res) => {
  const q = ((req.query.q as string) || '').toLowerCase().trim();
  if (q.length < 2) {
    res.json([]);
    return;
  }

  const terms = q.split(/\s+/);
  const index = getIndex();

  const results = index
    .filter(e => terms.every(t => e.display.toLowerCase().includes(t) || e.path.toLowerCase().includes(t)))
    .slice(0, 25);

  res.json(results);
});

// Invalidate cache so a refresh picks up new files immediately
router.post('/refresh', (_req, res) => {
  cacheTime = 0;
  res.json({ ok: true });
});

export default router;
