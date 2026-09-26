import { structures, groups, pathways } from '../content/index.js';
import { esc } from './format.js';
import { icon } from './icons.js';

export function renderSidebar(el, { tab, selected, query }) {
  const q = (query || '').trim().toLowerCase();
  const match = (s) => !q || s.name.toLowerCase().includes(q) || (s.tagline || '').toLowerCase().includes(q);

  if (tab === 'pathways') {
    const list = pathways.filter((p) => !q || p.name.toLowerCase().includes(q));
    el.innerHTML = list.length
      ? `<ul class="plist">${list.map((p) => `
        <li><a href="#/p/${p.id}" class="pitem ${selected === p.id ? 'is-on' : ''}">
          <span class="pitem-icon">${icon('pathway', 16)}</span>
          <span class="pitem-text"><span class="pitem-name">${esc(p.name)}</span><span class="pitem-sub">${esc(p.tagline || '')} · ${p.steps.length} steps</span></span>
        </a></li>`).join('')}</ul>`
      : `<p class="empty">No pathway matches “${esc(query)}”.</p>`;
    return;
  }

  const html = [];
  for (const g of groups) {
    const inGroup = structures.filter((s) => s.group === g.id);
    const roots = inGroup.filter((s) => !s.parent || !inGroup.some((p) => p.id === s.parent));
    const rows = [];
    const add = (s, depth) => {
      const kids = inGroup.filter((c) => c.parent === s.id);
      const show = match(s) || kids.some(match);
      if (show) {
        rows.push(`<li><a href="#/s/${s.id}" class="item depth-${depth} ${selected === s.id ? 'is-on' : ''}" data-id="${s.id}" style="--c:${s.color}">
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
