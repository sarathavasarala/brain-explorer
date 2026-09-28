// Tiny markup for content text:
//   **bold**                 bold
//   [[term]] / [[term|shown]] glossary term with hover definition
//   {{id}} / {{id|shown}}    link to another structure
import { glossary, resolveRef } from '../content/index.js';

const lookup = new Map(Object.entries(glossary).map(([k, v]) => [k.toLowerCase(), { term: k, def: v }]));

export function findTerm(t) {
  if (!t) return undefined;
  const k = t.toLowerCase().trim();
  const unhyphen = k.replace(/-/g, ' ');
  return lookup.get(k)
    || lookup.get(unhyphen)
    || lookup.get(k.replace(/s$/, ''))
    || lookup.get(unhyphen.replace(/s$/, ''))
    || lookup.get(k.replace(/es$/, ''))
    || lookup.get(unhyphen.replace(/es$/, ''));
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function fmt(text = '') {
  let out = esc(text);
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\[\[([^\]]+)\]\]/g, (_, inner) => {
    const [term, shown = term] = inner.split('|');
    const g = findTerm(term);
    if (!g) return shown;
    const slug = term.toLowerCase().trim().replace(/\s+/g, '-');
    const chem = resolveRef('chem:' + slug);
    if (chem) {
      return `<a class="term xref xref-chem" data-term="${esc(g.term)}" href="${chem.href}" style="--c:${chem.color}">${shown}</a>`;
    }
    return `<span class="term" tabindex="0" data-term="${esc(g.term)}">${shown}</span>`;
  });
  out = out.replace(/\{\{([^}]+)\}\}/g, (_, inner) => {
    const [id, shown] = inner.split('|');
    const rawId = id.trim();
    const ref = resolveRef(rawId);
    if (!ref) return shown || id;
    const g = findTerm(ref.name) || findTerm(ref.id) || findTerm(rawId);
    const termAttr = g ? ` class="term xref xref-${ref.kind}" data-term="${esc(g.term)}"` : ` class="xref xref-${ref.kind}"`;
    return `<a${termAttr} href="${ref.href}" style="--c:${ref.color}">${shown || ref.name}</a>`;
  });
  return out;
}

export function paragraphs(text = '') {
  return text.split(/\n\s*\n/).map((p) => `<p>${fmt(p)}</p>`).join('');
}

export { esc };
