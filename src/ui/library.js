import { pathways, pathwayGroups, byId } from '../content/index.js';
import { routeStrip } from './explainer.js';
import { fmt, esc } from './format.js';

const firstColor = (p) => byId.get(p.steps[0]?.focus?.[0])?.color || '#c77dff';

export function renderLibraryShell() {
  return `<div class="lib">
    <header class="lib-head">
      <div>
        <h1 class="lib-title">Pathways</h1>
        <p class="lib-sub">Short stories that light up the brain one step at a time, as something happens.</p>
      </div>
      <label class="search">
        <span class="lib-search-icon"></span>
        <input id="lib-search" type="search" placeholder="Search pathways" autocomplete="off" />
      </label>
    </header>
    <div id="lib-body"></div>
  </div>`;
}

export function renderLibraryBody(query = '') {
  const q = query.trim().toLowerCase();
  const match = (p) => !q || p.name.toLowerCase().includes(q) || (p.tagline || '').toLowerCase().includes(q);
  const html = pathwayGroups.map((g) => {
    const list = pathways.filter((p) => p.category === g.id && match(p));
    if (!list.length) return '';
    return `<section class="lib-section">
      <div>
        <h2 class="lib-section-h">${esc(g.label)}</h2>
        <p class="lib-section-blurb">${esc(g.blurb)}</p>
      </div>
      <ul class="lib-list">${list.map((p) => `
        <li>
          <a class="lib-item" href="#/p/${p.id}" style="--c:${firstColor(p)}">
            ${routeStrip(p)}
            <span class="lib-name">${esc(p.name)}</span>
            <span class="lib-tag">${fmt(p.tagline || '')}</span>
            <span class="lib-meta">${p.steps.length} steps</span>
          </a>
        </li>`).join('')}
      </ul>
    </section>`;
  }).join('');
  return html || `<p class="lib-empty">No pathway matches “${esc(query)}”.</p>`;
}
