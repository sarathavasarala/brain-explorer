import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate, structures, pathways, chemicals, cells } from '../src/content/index.js';
import { generateCatalog, generateAiContract } from './build-catalog.mjs';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), '..');
const catalogPath = path.join(rootDir, 'src/content/catalog.json');
const expectedCatalog = JSON.stringify(generateCatalog(), null, 2) + '\n';

let currentCatalog = '';
try {
  currentCatalog = fs.readFileSync(catalogPath, 'utf8');
} catch {
  console.error('catalog.json is missing: run npm run catalog');
  process.exit(1);
}

if (currentCatalog !== expectedCatalog) {
  console.error('catalog.json is out of date: run npm run catalog');
  process.exit(1);
}

const contractPath = path.join(rootDir, 'src/content/ai-contract.json');
const expectedContract = JSON.stringify(generateAiContract(), null, 2) + '\n';

let currentContract = '';
try {
  currentContract = fs.readFileSync(contractPath, 'utf8');
} catch {
  console.error('ai-contract.json is missing: run npm run catalog');
  process.exit(1);
}

if (currentContract !== expectedContract) {
  console.error('ai-contract.json is out of date: run npm run catalog');
  process.exit(1);
}

const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const swSource = fs.readFileSync(path.join(rootDir, 'sw.js'), 'utf8');
const cacheMatch = swSource.match(/const CACHE_NAME = 'brain-explorer-v(\d+)'/);
if (!cacheMatch) {
  console.error('sw.js: CACHE_NAME must be brain-explorer-v<number>');
  process.exit(1);
}
const cacheVersion = cacheMatch[1];
const indexVersions = [...indexHtml.matchAll(/\b(?:href|src)="[^"]+\?v=(\d+)"/g)].map((m) => m[1]);
const swVersions = [...swSource.matchAll(/\?v=(\d+)/g)].map((m) => m[1]);
const mismatched = [...indexVersions, ...swVersions].filter((v) => v !== cacheVersion);
if (mismatched.length) {
  console.error(`Asset versions do not match sw.js CACHE_NAME v${cacheVersion}: ${mismatched.join(', ')}`);
  process.exit(1);
}

const problems = validate();
const levelKeys = ['overview', 'connects', 'cells'];
const missing = [];
for (const s of structures) {
  const gaps = [];
  if (!s.analogy) gaps.push('analogy');
  for (const k of levelKeys) if (!s.levels?.[k]?.text) gaps.push(k);
  if (!s.tryIt) gaps.push('tryIt');
  if (!s.breaks?.text) gaps.push('breaks');
  if (gaps.length) missing.push(`  ${s.id}: ${gaps.join(', ')}`);
}
for (const p of pathways) {
  const n = p.steps.filter((st) => !st.text).length;
  if (!p.summary) missing.push(`  pathway ${p.id}: summary`);
  if (n) missing.push(`  pathway ${p.id}: ${n} step(s) without text`);
}
for (const c of chemicals) {
  const gaps = [];
  if (!c.tagline) gaps.push('tagline');
  if (!c.analogy) gaps.push('analogy');
  if (!c.overview?.text) gaps.push('overview');
  if (!c.breaks?.text) gaps.push('breaks');
  if (!c.life?.made) gaps.push('life');
  if (gaps.length) missing.push(`  chemical ${c.id}: ${gaps.join(', ')}`);
}
for (const c of cells) {
  const gaps = [];
  if (!c.tagline) gaps.push('tagline');
  if (!c.analogy) gaps.push('analogy');
  if (!c.shape?.text) gaps.push('shape');
  if (!c.fires?.text) gaps.push('fires');
  if (!c.chem?.text) gaps.push('chem');
  if (!c.breaks?.text) gaps.push('breaks');
  if (gaps.length) missing.push(`  cell ${c.id}: ${gaps.join(', ')}`);
}

if (missing.length) console.log(`Unwritten text (${missing.length}):\n${missing.join('\n')}\n`);
if (problems.length) {
  console.error(`Problems (${problems.length}):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(`OK: ${structures.length} structures, ${chemicals.length} chemicals, ${cells.length} cells, ${pathways.length} pathways, no broken references.`);
