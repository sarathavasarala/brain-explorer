// Checks every content file for broken references. Run: node tools/validate.mjs
import { validate, structures, pathways, chemicals, cells } from '../src/content/index.js';

const problems = validate();
const levelKeys = ['where', 'does', 'connects', 'cells'];
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
  if (!c.shape?.text) gaps.push('shape');
  if (gaps.length) missing.push(`  cell ${c.id}: ${gaps.join(', ')}`);
}

if (missing.length) console.log(`Unwritten text (${missing.length}):\n${missing.join('\n')}\n`);
if (problems.length) {
  console.error(`Problems (${problems.length}):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(`OK: ${structures.length} structures, ${chemicals.length} chemicals, ${cells.length} cells, ${pathways.length} pathways, no broken references.`);
