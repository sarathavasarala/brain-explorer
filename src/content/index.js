// Single entry point for all content. To add content, edit or add files and list them here.
import cortex from './structures/cortex.js';
import deep from './structures/deep.js';
import hindbrain from './structures/hindbrain.js';
import groups from './groups.js';
import levels from './levels.js';
import anchors from './anchors.js';
import synapses from './synapses.js';
import diagrams from './diagrams/index.js';
import pathways from './pathways/index.js';
import glossary from './glossary/index.js';

const files = {
  'src/content/structures/cortex.js': cortex,
  'src/content/structures/deep.js': deep,
  'src/content/structures/hindbrain.js': hindbrain,
};
export const structures = Object.values(files).flat();
// Which file each structure lives in, so the UI can point at where to add missing text.
export const sourceOf = new Map(Object.entries(files).flatMap(([f, list]) => list.map((s) => [s.id, f])));
export { groups, levels, anchors, synapses, diagrams, pathways, glossary };

export const byId = new Map(structures.map((s) => [s.id, s]));
export const anchorById = new Map(anchors.map((a) => [a.id, a]));

// Returns a list of human-readable problems. Used by the app (console) and tools/validate.mjs.
export function validate() {
  const problems = [];
  const ids = new Set();
  const known = (id) => byId.has(id) || anchorById.has(id);
  const glossaryKeys = new Set(Object.keys(glossary).map((k) => k.toLowerCase()));
  const termOk = (t) => {
    const k = t.toLowerCase();
    return glossaryKeys.has(k) || glossaryKeys.has(k.replace(/s$/, '')) || glossaryKeys.has(k.replace(/es$/, ''));
  };
  const scanText = (where, text) => {
    if (typeof text !== 'string') return;
    for (const m of text.matchAll(/\[\[([^\]]+)\]\]/g)) {
      const term = m[1].split('|').pop().trim();
      if (!termOk(term)) problems.push(`${where}: glossary term "${term}" is not defined`);
    }
    for (const m of text.matchAll(/\{\{([^}]+)\}\}/g)) {
      const id = m[1].split('|')[0].trim();
      if (!byId.has(id)) problems.push(`${where}: link to unknown structure "${id}"`);
    }
  };
  const scanDeep = (where, v) => {
    if (typeof v === 'string') scanText(where, v);
    else if (Array.isArray(v)) v.forEach((x, i) => scanDeep(`${where}[${i}]`, x));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (k !== 'shape') scanDeep(`${where}.${k}`, x);
  };

  for (const s of structures) {
    const w = `structure "${s.id}"`;
    if (ids.has(s.id)) problems.push(`${w}: duplicate id`);
    ids.add(s.id);
    if (!s.name) problems.push(`${w}: missing name`);
    if (!groups.some((g) => g.id === s.group)) problems.push(`${w}: unknown group "${s.group}"`);
    if (s.parent && !byId.has(s.parent)) problems.push(`${w}: unknown parent "${s.parent}"`);
    if (!s.shape) problems.push(`${w}: missing shape`);
    for (const key of Object.keys(s.levels || {})) {
      if (!levels.some((l) => l.id === key)) problems.push(`${w}: unknown level "${key}"`);
    }
    for (const c of s.levels?.connects?.connections || []) {
      if (!byId.has(c.id)) problems.push(`${w}: connection to unknown structure "${c.id}"`);
      if (!['in', 'out', 'both'].includes(c.dir)) problems.push(`${w}: connection "${c.id}" has bad dir "${c.dir}"`);
    }
    const cells = s.levels?.cells;
    if (cells?.diagram && !diagrams[cells.diagram]) problems.push(`${w}: unknown diagram "${cells.diagram}"`);
    if (cells?.synapse && !synapses[cells.synapse]) problems.push(`${w}: unknown synapse "${cells.synapse}"`);
    scanDeep(w, s);
  }
  for (const [id, d] of Object.entries(diagrams)) {
    const nodes = new Set(d.nodes.map((n) => n.id));
    for (const l of d.links) {
      if (!nodes.has(l.from) || !nodes.has(l.to)) problems.push(`diagram "${id}": link ${l.from}→${l.to} uses an unknown node`);
    }
  }
  for (const p of pathways) {
    p.steps.forEach((st, i) => {
      const w = `pathway "${p.id}" step ${i + 1}`;
      for (const id of st.focus || []) if (!known(id)) problems.push(`${w}: unknown focus "${id}"`);
      for (const [a, b] of st.route || []) {
        if (!known(a)) problems.push(`${w}: unknown route start "${a}"`);
        if (!known(b)) problems.push(`${w}: unknown route end "${b}"`);
      }
      scanText(w, st.text);
    });
  }
  return problems;
}
