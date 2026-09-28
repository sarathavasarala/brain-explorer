import { structures, groups, chemicals, chemicalGroups, cells, cellGroups } from '../content/index.js';
import { esc } from './format.js';

// The Atlas sidebar: Parts, Chemicals, or Cells.
export function renderSidebar(el, { dict = 'parts', selected, query } = {}) {
  const q = (query || '').trim().toLowerCase();
  const match = (s) => !q || s.name.toLowerCase().includes(q) || (s.tagline || '').toLowerCase().includes(q);

  if (q) {
    const results = [];
    for (const s of structures) {
      if (match(s)) results.push({ kind: 'Part', href: `#/s/${s.id}`, id: s.id, name: s.name, tagline: s.tagline || '', color: s.color });
    }
    for (const c of chemicals) {
      if (match(c)) results.push({ kind: 'Chemical', href: `#/chem/${c.id}`, id: c.id, name: c.name, tagline: c.tagline || '', color: c.color });
    }
    for (const c of cells) {
      if (match(c)) results.push({ kind: 'Cell', href: `#/cell/${c.id}`, id: c.id, name: c.name, tagline: c.tagline || '', color: c.color });
    }
    results.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aStarts = aName.startsWith(q);
      const bStarts = bName.startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      const aIn = aName.includes(q);
      const bIn = bName.includes(q);
      if (aIn && !bIn) return -1;
      if (!aIn && bIn) return 1;
      return 0;
    });

    if (!results.length) {
      el.innerHTML = `<p class="empty">Nothing matches “${esc(query)}”.</p>`;
      return;
    }
    const rows = results.map((item) => `<li><a href="${item.href}" class="item ${selected === item.id ? 'is-on' : ''}" data-id="${item.id}" style="--c:${item.color}" title="${esc(item.tagline)}">
      <i class="dot"></i><span class="item-text">
        <span class="item-name-row"><span class="item-name">${esc(item.name)}</span><span class="badge badge-type badge-type-${item.kind.toLowerCase()}">${esc(item.kind)}</span></span>
        <span class="item-sub">${esc(item.tagline)}</span>
      </span>
    </a></li>`);
    el.innerHTML = `<section class="group"><h2 class="group-h">Search results<span>${results.length} found</span></h2><ul>${rows.join('')}</ul></section>`;
    return;
  }

  if (dict === 'chem') {
    const html = [];
    for (const g of chemicalGroups) {
      const inGroup = chemicals.filter((c) => c.group === g.id);
      const rows = [];
      for (const c of inGroup) {
        if (match(c)) {
          rows.push(`<li><a href="#/chem/${c.id}" class="item ${selected === c.id ? 'is-on' : ''}" data-id="${c.id}" style="--c:${c.color}" title="${esc(c.tagline || '')}">
            <i class="dot"></i><span class="item-text"><span class="item-name">${esc(c.name)}</span><span class="item-sub">${esc(c.tagline || '')}</span></span>
          </a></li>`);
        }
      }
      if (rows.length) {
        html.push(`<section class="group"><h2 class="group-h">${esc(g.label)}<span>${esc(g.blurb || '')}</span></h2><ul>${rows.join('')}</ul></section>`);
      }
    }
    el.innerHTML = html.join('') || (q ? `<p class="empty">Nothing matches “${esc(query)}”.</p>` : `<p class="empty">Coming soon. No chemicals listed yet.</p>`);
    return;
  }

  if (dict === 'cell') {
    const html = [];
    for (const g of cellGroups) {
      const inGroup = cells.filter((c) => c.group === g.id);
      const rows = [];
      for (const c of inGroup) {
        if (match(c)) {
          rows.push(`<li><a href="#/cell/${c.id}" class="item ${selected === c.id ? 'is-on' : ''}" data-id="${c.id}" style="--c:${c.color}" title="${esc(c.tagline || '')}">
            <i class="dot"></i><span class="item-text"><span class="item-name">${esc(c.name)}</span><span class="item-sub">${esc(c.tagline || '')}</span></span>
          </a></li>`);
        }
      }
      if (rows.length) {
        html.push(`<section class="group"><h2 class="group-h">${esc(g.label)}<span>${esc(g.blurb || '')}</span></h2><ul>${rows.join('')}</ul></section>`);
      }
    }
    el.innerHTML = html.join('') || (q ? `<p class="empty">Nothing matches “${esc(query)}”.</p>` : `<p class="empty">Coming soon. No cells listed yet.</p>`);
    return;
  }

  // Default: parts
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
