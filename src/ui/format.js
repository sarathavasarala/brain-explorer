// Tiny markup for content text:
//   **bold**                 bold
//   [[term]] / [[term|shown]] glossary term with hover definition
//   {{id}} / {{id|shown}}    link to another structure
import { glossary, resolveRef } from '../content/index.js';

const lookup = new Map(Object.entries(glossary).map(([k, v]) => [k.toLowerCase(), { term: k, def: v }]));

export function findTerm(t) {
  const k = t.toLowerCase().trim();
  return lookup.get(k) || lookup.get(k.replace(/s$/, '')) || lookup.get(k.replace(/es$/, ''));
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
    const ref = resolveRef(id.trim());
    if (!ref) return shown || id;
    return `<a class="xref xref-${ref.kind}" href="${ref.href}" style="--c:${ref.color}">${shown || ref.name}</a>`;
  });
  return out;
}

export function paragraphs(text = '') {
  return text.split(/\n\s*\n/).map((p) => `<p>${fmt(p)}</p>`).join('');
}

export { esc };
