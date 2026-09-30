// Scene script schema, validation and sanitization.
// Defines allowed roles, views, validation rules and model output sanitizer.
import { byId, anchorById, chemById, glossary, resolveRef } from './index.js';

export const ROLES = [
  'more_active',
  'less_active',
  'typical',
  'involved',
  'cut_off',
  'losing_cells',
];

export const VIEWS = [
  'left',
  'left-front',
  'left-back',
  'medial',
  'back',
  'below',
  'body',
];

const glossaryKeys = new Set(Object.keys(glossary).map((k) => k.toLowerCase()));

function isTermOk(t) {
  if (!t) return false;
  const k = t.toLowerCase().trim();
  return glossaryKeys.has(k) || glossaryKeys.has(k.replace(/s$/, '')) || glossaryKeys.has(k.replace(/es$/, ''));
}

function isKnownId(id) {
  return byId.has(id) || anchorById.has(id);
}

// Checks a scene script for problems. Returns an array of human-readable problem strings.
export function checkScript(script, { prefix = 'script' } = {}) {
  const problems = [];
  if (!script || typeof script !== 'object') {
    problems.push(`${prefix}: script must be an object`);
    return problems;
  }

  const title = script.title || script.name;
  if (!title) {
    problems.push(`${prefix}: missing title`);
  } else if (typeof title === 'string' && title.includes('—')) {
    problems.push(`${prefix}: title contains em dash`);
  }

  if (typeof script.summary === 'string' && script.summary.includes('—')) {
    problems.push(`${prefix}: summary contains em dash`);
  }

  if (!Array.isArray(script.steps) || script.steps.length === 0) {
    problems.push(`${prefix}: steps must be a non-empty array`);
    return problems;
  }

  const scanText = (where, text) => {
    if (typeof text !== 'string') return;
    if (text.includes('—')) problems.push(`${where}: text contains em dash`);
    for (const m of text.matchAll(/\[\[([^\]]+)\]\]/g)) {
      const term = m[1].split('|')[0].trim();
      if (!isTermOk(term)) problems.push(`${where}: glossary term "${term}" is not defined`);
    }
    for (const m of text.matchAll(/\{\{([^}]+)\}\}/g)) {
      const ref = m[1].split('|')[0].trim();
      if (!resolveRef(ref) && !isKnownId(ref)) problems.push(`${where}: link to unknown reference "${ref}"`);
    }
  };

  script.steps.forEach((st, i) => {
    const w = `${prefix} step ${i + 1}`;
    if (!st || typeof st !== 'object') {
      problems.push(`${w}: step must be an object`);
      return;
    }

    if (!st.title) problems.push(`${w}: missing title`);
    else if (typeof st.title === 'string' && st.title.includes('—')) problems.push(`${w}: title contains em dash`);

    if (st.text == null || st.text === '') problems.push(`${w}: missing text`);
    else scanText(w, st.text);

    for (const id of st.focus || []) {
      if (!isKnownId(id)) problems.push(`${w}: unknown focus "${id}"`);
    }

    for (const p of st.parts || []) {
      if (!p || typeof p !== 'object') {
        problems.push(`${w}: part must be an object`);
        continue;
      }
      if (!isKnownId(p.id)) problems.push(`${w}: unknown part "${p.id}"`);
      if (!ROLES.includes(p.role)) problems.push(`${w}: unknown role "${p.role}"`);
    }

    for (const r of st.route || []) {
      const a = Array.isArray(r) ? r[0] : r?.from;
      const b = Array.isArray(r) ? r[1] : r?.to;
      if (!isKnownId(a)) problems.push(`${w}: unknown route start "${a}"`);
      if (!isKnownId(b)) problems.push(`${w}: unknown route end "${b}"`);
    }

    if (st.view && !VIEWS.includes(st.view)) {
      problems.push(`${w}: unknown view "${st.view}"`);
    }

    if (st.chemical && !chemById.has(st.chemical)) {
      problems.push(`${w}: unknown chemical "${st.chemical}"`);
    }
  });

  return problems;
}

// Sanitizes a script for runtime execution (e.g. from model responses).
// Produces a safe copy: drops unknown ids, bad roles/views, cleans em dashes,
// fixes broken links/terms, drops empty steps, and caps steps at 8.
export function sanitizeScript(script) {
  if (!script || typeof script !== 'object') {
    return { title: 'Untitled', summary: '', steps: [] };
  }

  const fixDashes = (s) => (typeof s === 'string' ? s.replace(/—/g, ', ') : s);

  const cleanText = (text) => {
    if (typeof text !== 'string') return '';
    let out = fixDashes(text);
    // Replace {{unknown-id|shown}} or {{unknown-id}} with plain text
    out = out.replace(/\{\{([^}]+)\}\}/g, (match, inner) => {
      const parts = inner.split('|');
      const ref = parts[0].trim();
      const shown = parts[1] ? parts[1].trim() : ref;
      if (!resolveRef(ref) && !isKnownId(ref)) {
        return shown;
      }
      return match;
    });
    // Replace [[unknown term|shown]] with plain shown (or term) when term is not in glossary
    out = out.replace(/\[\[([^\]]+)\]\]/g, (match, inner) => {
      const parts = inner.split('|');
      const term = parts[0].trim();
      const shown = parts[1] ? parts[1].trim() : term;
      if (!isTermOk(term)) {
        return shown;
      }
      return match;
    });
    return out;
  };

  const rawSteps = Array.isArray(script.steps) ? script.steps.slice(0, 8) : [];
  const cleanSteps = [];

  for (const raw of rawSteps) {
    if (!raw || typeof raw !== 'object') continue;

    const focus = (raw.focus || []).filter((id) => typeof id === 'string' && isKnownId(id));

    const parts = (raw.parts || [])
      .filter((p) => p && typeof p === 'object' && isKnownId(p.id) && ROLES.includes(p.role))
      .map((p) => ({ id: p.id, role: p.role }));

    const route = [];
    for (const r of raw.route || []) {
      if (Array.isArray(r)) {
        const [a, b, opts] = r;
        if (isKnownId(a) && isKnownId(b)) {
          route.push(opts ? [a, b, opts] : [a, b]);
        }
      } else if (r && typeof r === 'object') {
        if (isKnownId(r.from) && isKnownId(r.to)) {
          route.push([r.from, r.to]);
        }
      }
    }

    const hasBodyAnchor =
      focus.some((id) => anchorById.get(id)?.body) ||
      parts.some((p) => anchorById.get(p.id)?.body) ||
      route.some(([a, b]) => anchorById.get(a)?.body || anchorById.get(b)?.body);

    const chemical = (raw.chemical && chemById.has(raw.chemical)) ? raw.chemical : undefined;
    let view = (raw.view && VIEWS.includes(raw.view)) ? raw.view : undefined;
    let slice = typeof raw.slice === 'boolean' ? raw.slice : undefined;
    let body = typeof raw.body === 'boolean' ? raw.body : undefined;

    if (hasBodyAnchor && !body) {
      body = true;
      if (!view) view = 'body';
    }

    if (body) {
      slice = false;
    }

    // Drop step if there is nothing visual to show in 3D
    const hasVisual = focus.length > 0 || parts.length > 0 || route.length > 0 || Boolean(chemical);
    if (!hasVisual) continue;

    const step = {
      title: fixDashes(raw.title || 'Step'),
      text: cleanText(raw.text || ''),
    };
    if (focus.length) step.focus = focus;
    if (parts.length) step.parts = parts;
    if (route.length) step.route = route;
    if (view) step.view = view;
    if (slice !== undefined) step.slice = slice;
    if (chemical) step.chemical = chemical;
    if (body !== undefined) step.body = body;

    cleanSteps.push(step);
  }

  const result = {
    title: fixDashes(script.title || script.name || 'Brain Explorer'),
    summary: fixDashes(script.summary || ''),
    steps: cleanSteps,
  };

  if (script.status) result.status = script.status;
  if (Array.isArray(script.followups)) {
    result.followups = script.followups.map((f) => fixDashes(String(f))).slice(0, 3);
  }

  return result;
}
