// Checks every content file for broken references. Run: node tools/validate.mjs
import { validate, structures, pathways } from '../src/content/index.js';

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

if (missing.length) console.log(`Unwritten text (${missing.length}):\n${missing.join('\n')}\n`);
if (problems.length) {
  console.error(`Problems (${problems.length}):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(`OK: ${structures.length} structures, ${pathways.length} pathways, no broken references.`);
