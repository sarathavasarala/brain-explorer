import { pathways, pathwayGroups, byId } from '../content/index.js';
import { routeStrip } from './explainer.js';
import { fmt, esc } from './format.js';

const firstColor = (p) => byId.get(p.steps[0]?.focus?.[0])?.color || '#c77dff';

export function renderLibraryShell(activeFilter = 'all') {
  return `<div class="lib">
    <header class="lib-head">
      <div>
        <h1 class="lib-title">Pathways &amp; Labs</h1>
        <p class="lib-sub">Short stories that light up the brain one step at a time, paired with interactive cellular experiments.</p>
      </div>
      <nav class="modes" role="tablist" aria-label="Filter pathways and labs">
        <button type="button" class="${activeFilter === 'all' ? 'is-on' : ''}" data-filter="all">All</button>
        <button type="button" class="${activeFilter === 'tours' ? 'is-on' : ''}" data-filter="tours">Tours</button>
        <button type="button" class="${activeFilter === 'labs' ? 'is-on' : ''}" data-filter="labs">Labs</button>
      </nav>
    </header>
    <div id="lib-body">${renderLibraryBody(activeFilter)}</div>
  </div>`;
}

export function renderLibraryBody(filter = 'all') {
  const visibleGroups = pathwayGroups.filter((g) => {
    if (filter === 'tours') return g.id !== 'labs';
    if (filter === 'labs') return g.id === 'labs';
    return true;
  });

  return visibleGroups.map((g) => {
    const list = pathways.filter((p) => p.category === g.id);
    if (!list.length) return '';
    const isLabGroup = g.id === 'labs';
    return `<section class="lib-section${isLabGroup ? ' is-labs' : ''}">
      <div>
        <h2 class="lib-section-h">${esc(g.label)}</h2>
        <p class="lib-section-blurb">${esc(g.blurb)}</p>
      </div>
      <ul class="lib-list">${list.map((p) => `
        <li>
          <a class="lib-item${p.category === 'labs' ? ' is-lab' : ''}" href="#/p/${p.id}" style="--c:${firstColor(p)}">
            ${routeStrip(p)}
            <span class="lib-name">${esc(p.name)}</span>
            <span class="lib-tag">${fmt(p.tagline || '')}</span>
            <span class="lib-meta">${p.steps.length} steps</span>
          </a>
        </li>`).join('')}
      </ul>
    </section>`;
  }).join('');
}
