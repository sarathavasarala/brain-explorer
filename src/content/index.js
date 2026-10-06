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
import pathwayGroups from './pathways/groups.js';
import glossary from './glossary/index.js';
import askPresets from './ask-presets.js';
import chemicals from './chemicals/index.js';
import chemicalGroups from './chemicals/groups.js';
import { getChemTabs } from './chem-tabs.js';
import cells from './cells/index.js';
import cellGroups from './cells/groups.js';
import { getCellTabs } from './cell-tabs.js';
import { checkScript, sanitizeScript, ROLES, VIEWS } from './script.js';
import { STATE_KINDS, STATE_METADATA, roleForState } from './states.js';
import sources from './sources.js';
import pathwayEvidence from './pathways/evidence.js';

const files = {
  'src/content/structures/cortex.js': cortex,
  'src/content/structures/deep.js': deep,
  'src/content/structures/hindbrain.js': hindbrain,
};
export const structures = Object.values(files).flat();
// Which file each structure lives in, so the UI can point at where to add missing text.
export const sourceOf = new Map(Object.entries(files).flatMap(([f, list]) => list.map((s) => [s.id, f])));
export { groups, levels, anchors, synapses, diagrams, pathways, pathwayGroups, glossary, askPresets, chemicals, chemicalGroups, getChemTabs, cells, cellGroups, getCellTabs, checkScript, sanitizeScript, ROLES, VIEWS, STATE_KINDS, STATE_METADATA, roleForState, sources, pathwayEvidence };

export const byId = new Map(structures.map((s) => [s.id, s]));
export const anchorById = new Map(anchors.map((a) => [a.id, a]));
export const chemById = new Map(chemicals.map((c) => [c.id, c]));
export const cellById = new Map(cells.map((c) => [c.id, c]));

// "thalamus" -> part, "chem:dopamine" -> chemical, "cell:purkinje" -> cell
export function resolveRef(ref) {
  const [a, b] = ref.includes(':') ? ref.split(':') : ['part', ref];
  const id = (b || '').trim();
  if (a === 'part' && byId.has(id)) { const s = byId.get(id); return { kind: 'part', id, name: s.name, color: s.color, href: `#/s/${id}` }; }
  if (a === 'chem' && chemById.has(id)) { const c = chemById.get(id); return { kind: 'chem', id, name: c.name, color: c.color, href: `#/chem/${id}` }; }
  if (a === 'cell' && cellById.has(id)) { const c = cellById.get(id); return { kind: 'cell', id, name: c.name, color: c.color, href: `#/cell/${id}` }; }
  return null;
}

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
      const ref = m[1].split('|')[0].trim();
      if (!resolveRef(ref)) problems.push(`${where}: link to unknown reference "${ref}"`);
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
    if (s.breaks?.states) {
      if (!Array.isArray(s.breaks.states)) {
        problems.push(`${w}: breaks.states must be an array`);
      } else {
        const seenKinds = new Set();
        s.breaks.states.forEach((st, sIdx) => {
          const sw = `${w} breaks.states[${sIdx}]`;
          if (!STATE_KINDS.includes(st.kind)) problems.push(`${sw}: unknown kind "${st.kind}"`);
          if (seenKinds.has(st.kind)) problems.push(`${sw}: duplicate state kind "${st.kind}"`);
          seenKinds.add(st.kind);
          if (!st.text || typeof st.text !== 'string') problems.push(`${sw}: missing text`);
          if (st.teaser !== undefined) {
            if (!st.teaser || typeof st.teaser !== 'string') problems.push(`${sw}: teaser must be a non-empty string`);
            else if (st.teaser.includes('—')) problems.push(`${sw}: teaser contains em dash`);
          }
          if (!Array.isArray(st.signs) || !st.signs.length) problems.push(`${sw}: signs must be a non-empty array of strings`);
          if (st.case) {
            if (!st.case.name || typeof st.case.name !== 'string') problems.push(`${sw}: case.name must be a string`);
            if (!st.case.text || typeof st.case.text !== 'string') problems.push(`${sw}: case.text must be a string`);
          }
          if (st.ripple) {
            if (!Array.isArray(st.ripple)) {
              problems.push(`${sw}: ripple must be an array`);
            } else {
              st.ripple.forEach((rip, rIdx) => {
                const rw = `${sw} ripple[${rIdx}]`;
                if (!known(rip.id)) problems.push(`${rw}: unknown structure/anchor "${rip.id}"`);
                if (!ROLES.includes(rip.role)) problems.push(`${rw}: unknown role "${rip.role}"`);
              });
            }
          }
          if (st.look && !ROLES.includes(st.look)) problems.push(`${sw}: unknown look role "${st.look}"`);
        });
      }
    }
    scanDeep(w, s);
  }
  for (const [id, d] of Object.entries(diagrams)) {
    const nodes = new Set(d.nodes.map((n) => n.id));
    for (const l of d.links) {
      if (!nodes.has(l.from) || !nodes.has(l.to)) problems.push(`diagram "${id}": link ${l.from}→${l.to} uses an unknown node`);
    }
  }
  for (const p of pathways) {
    if (!pathwayGroups.some((g) => g.id === p.category)) problems.push(`pathway "${p.id}": unknown category "${p.category}"`);
    problems.push(...checkScript(p, { prefix: `pathway "${p.id}"` }));
  }
  for (const a of askPresets) {
    for (const part of a.result?.parts || []) {
      if (!byId.has(part.id)) problems.push(`ask preset "${a.query}": unknown part "${part.id}"`);
    }
  }

  const chemIds = new Set();
  const drugActs = new Set(['precursor', 'release', 'reuptake-block', 'enzyme-block', 'receptor-block', 'receptor-mimic', 'boost-receptor', 'release-block']);
  const receptorEffects = new Set(['excite', 'inhibit', 'modulate']);
  const clearedBys = new Set(['reuptake', 'enzyme', 'astrocyte', 'blood']);

  for (const c of chemicals) {
    const w = `chemical "${c.id}"`;
    if (chemIds.has(c.id)) problems.push(`${w}: duplicate id`);
    chemIds.add(c.id);
    if (!c.name) problems.push(`${w}: missing name`);
    if (!chemicalGroups.some((g) => g.id === c.group)) problems.push(`${w}: unknown group "${c.group}"`);
    if (c.synapse) {
      if (!synapses[c.synapse]) problems.push(`${w}: unknown synapse "${c.synapse}"`);
      else if (synapses[c.synapse].color !== c.color) problems.push(`${w}: color "${c.color}" does not match synapse color "${synapses[c.synapse].color}"`);
    }
    if (c.pathwayId && !pathways.some((p) => p.id === c.pathwayId)) {
      problems.push(`${w}: unknown pathwayId "${c.pathwayId}"`);
    }
    for (const id of c.madeIn || []) {
      if (!known(id)) problems.push(`${w}: unknown madeIn structure "${id}"`);
    }
    for (const t of c.tracts || []) {
      const tw = `${w} tract "${t.id}"`;
      if (!known(t.from)) problems.push(`${tw}: unknown from structure "${t.from}"`);
      for (const toId of t.to || []) {
        if (!known(toId)) problems.push(`${tw}: unknown to structure "${toId}"`);
      }
    }
    for (const a of c.axis || []) {
      const aw = `${w} axis step`;
      if (!known(a.from)) problems.push(`${aw}: unknown from structure "${a.from}"`);
      if (!known(a.to)) problems.push(`${aw}: unknown to structure "${a.to}"`);
    }
    for (const fb of c.feedback || []) {
      const fbw = `${w} feedback`;
      if (!known(fb.from)) problems.push(`${fbw}: unknown from structure "${fb.from}"`);
      for (const toId of fb.to || []) {
        if (!known(toId)) problems.push(`${fbw}: unknown to structure "${toId}"`);
      }
    }
    for (const [sId, d] of Object.entries(c.density || {})) {
      if (!known(sId)) problems.push(`${w}: unknown density structure "${sId}"`);
      if (typeof d !== 'number' || d < 0 || d > 1) problems.push(`${w}: density for "${sId}" must be between 0 and 1, got ${d}`);
    }
    for (const r of c.receptors || []) {
      const rw = `${w} receptor "${r.id}"`;
      if (!receptorEffects.has(r.effect)) problems.push(`${rw}: unknown effect "${r.effect}"`);
      for (const whereId of r.where || []) {
        if (!known(whereId)) problems.push(`${rw}: unknown where structure "${whereId}"`);
      }
    }
    if (c.life?.clearedBy && !clearedBys.has(c.life.clearedBy)) {
      problems.push(`${w}: unknown clearedBy "${c.life.clearedBy}"`);
    }
    for (const d of c.drugs || []) {
      const dw = `${w} drug "${d.id}"`;
      if (!drugActs.has(d.acts)) problems.push(`${dw}: unknown acts "${d.acts}"`);
    }
    scanDeep(w, c);
  }

  const cellIds = new Set();
  const morphStyles = new Set([
    'pyramidal', 'stellate', 'purkinje', 'granule', 'basket',
    'chandelier', 'msn', 'dopamine', 'motor', 'relay',
    'astrocyte', 'oligodendrocyte', 'microglia',
  ]);

  for (const c of cells) {
    const w = `cell "${c.id}"`;
    if (cellIds.has(c.id)) problems.push(`${w}: duplicate id`);
    cellIds.add(c.id);
    if (!c.name) problems.push(`${w}: missing name`);
    if (!cellGroups.some((g) => g.id === c.group)) problems.push(`${w}: unknown group "${c.group}"`);
    if (c.transmitter !== null && c.transmitter !== undefined && !chemicals.some((ch) => ch.id === c.transmitter)) {
      problems.push(`${w}: unknown transmitter "${c.transmitter}"`);
    }
    for (const whereId of c.where || []) {
      if (!known(whereId)) problems.push(`${w}: unknown where structure "${whereId}"`);
    }
    if (!c.morph?.style || !morphStyles.has(c.morph.style)) {
      problems.push(`${w}: unknown morph style "${c.morph?.style}"`);
    }
    for (const mod of c.chem?.modulatedBy || []) {
      if (!chemicals.some((ch) => ch.id === mod)) problems.push(`${w}: unknown modulatedBy chemical "${mod}"`);
    }
    if (c.diagram && !diagrams[c.diagram]) {
      problems.push(`${w}: unknown diagram "${c.diagram}"`);
    }
    scanDeep(w, c);
  }

  return problems;
}
