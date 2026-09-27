import { structures, groups } from '../content/index.js';
import { esc } from './format.js';

// The Parts list. Pathways and Ask have their own screens.
export function renderSidebar(el, { selected, query }) {
  const q = (query || '').trim().toLowerCase();
  const match = (s) => !q || s.name.toLowerCase().includes(q) || (s.tagline || '').toLowerCase().includes(q);

  const html = [];
  for (const g of groups) {
    const inGroup = structures.filter((s) => s.group === g.id);
    const roots = inGroup.filter((s) => !s.parent || !inGroup.some((p) => p.id === s.parent));
    const rows = [];
    const add = (s, depth) => {
      const kids = inGroup.filter((c) => c.parent === s.id);
      const show = match(s) || kids.some(match);
      if (show) {
        rows.push(`<li><a href="#/s/${s.id}" class="item depth-${depth} ${selected === s.id ? 'is-on' : ''}" data-id="${s.id}" style="--c:${s.color}" title="${esc(s.tagline || '')}">
          <i class="dot"></i><span class="item-text"><span class="item-name">${esc(s.name)}</span><span class="item-sub">${esc(s.tagline || '')}</span></span>
        </a></li>`);
      }
      kids.forEach((k) => add(k, depth + 1));
    };
    roots.forEach((s) => add(s, 0));
    if (rows.length) {
      html.push(`<section class="group"><h2 class="group-h">${esc(g.label)}<span>${esc(g.blurb || '')}</span></h2><ul>${rows.join('')}</ul></section>`);
    }
  }
  el.innerHTML = html.join('') || `<p class="empty">Nothing matches “${esc(query)}”.</p>`;
}
