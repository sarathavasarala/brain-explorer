import { pathways, pathwayGroups, byId } from '../content/index.js';
import { routeStrip } from './explainer.js';
import { fmt, esc } from './format.js';

const firstColor = (p) => byId.get(p.steps[0]?.focus?.[0])?.color || '#c77dff';

export function renderLibraryShell(activeFilter = 'all') {
  const tourCount = pathways.filter((p) => p.category !== 'labs').length;
  const labCount = pathways.filter((p) => p.category === 'labs').length;
  const totalCount = pathways.length;

  return `<div class="lib">
    <header class="lib-head">
      <div>
        <h1 class="lib-title">Pathways &amp; Labs</h1>
        <p class="lib-sub">Step-by-step 3D journeys through the brain, paired with interactive cellular simulations.</p>
      </div>
      <div class="lib-filters" role="tablist" aria-label="Filter journeys and experiments">
        <button type="button" class="lib-filter-btn${activeFilter === 'all' ? ' is-active' : ''}" data-filter="all" role="tab" aria-selected="${activeFilter === 'all'}">
          All <span class="lib-filter-count">${totalCount}</span>
        </button>
        <button type="button" class="lib-filter-btn${activeFilter === 'tours' ? ' is-active' : ''}" data-filter="tours" role="tab" aria-selected="${activeFilter === 'tours'}">
          Guided Tours <span class="lib-filter-count">${tourCount}</span>
        </button>
        <button type="button" class="lib-filter-btn${activeFilter === 'labs' ? ' is-active' : ''}" data-filter="labs" role="tab" aria-selected="${activeFilter === 'labs'}">
          Interactive Labs <span class="lib-filter-count">${labCount}</span>
        </button>
      </div>
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
      <ul class="lib-list">${list.map((p) => {
        const isLab = p.category === 'labs';
        return `
        <li>
          <a class="lib-item${isLab ? ' is-lab' : ''}" href="#/p/${p.id}" style="--c:${firstColor(p)}">
            ${isLab ? `
              <div class="lib-lab-top">
                <span class="lib-lab-pill">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  Interactive simulation
                </span>
              </div>
            ` : routeStrip(p)}
            <span class="lib-name">${esc(p.name)}</span>
            <span class="lib-tag">${fmt(p.tagline || '')}</span>
            <span class="lib-meta">
              <span class="lib-badge ${isLab ? 'is-lab' : 'is-tour'}">${isLab ? 'Lab' : '3D Tour'}</span>
              <span>${p.steps.length} steps</span>
            </span>
          </a>
        </li>`;
      }).join('')}
      </ul>
    </section>`;
  }).join('');
}
