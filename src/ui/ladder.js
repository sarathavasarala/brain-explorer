// Shared ladder (zoom / section tabs) component.
import { esc } from './format.js';
import { icon } from './icons.js';

export function renderLadder(items, activeId, { hrefPrefix = null, attr = 'data-level', interactive = true } = {}) {
  if (!interactive) {
    return `<div class="ladder is-static" aria-label="Zoom levels" style="--steps:${items.length}">
      ${items.map((item) => {
        const on = item.id === activeId;
        const content = `
          ${item.icon ? `<span class="rung-icon">${icon(item.icon, 18)}</span>` : ''}
          <span class="rung-label">${esc(item.label)}</span>
          ${item.scale ? `<span class="rung-scale">${esc(item.scale)}</span>` : ''}`;
        return `<div class="rung is-static ${on ? 'is-on' : ''}">
          ${content}
        </div>`;
      }).join('')}
    </div>`;
  }

  return `<div class="ladder" role="tablist" aria-label="Sections" style="--steps:${items.length}">
    ${items.map((item) => {
      const on = item.id === activeId;
      const content = `
        ${item.icon ? `<span class="rung-icon">${icon(item.icon, 18)}</span>` : ''}
        <span class="rung-label">${esc(item.label)}</span>
        ${item.scale ? `<span class="rung-scale">${esc(item.scale)}</span>` : ''}`;

      const href = item.href || (hrefPrefix ? `${hrefPrefix}/${item.id}` : null);
      if (href) {
        return `<a class="rung ${on ? 'is-on' : ''}" role="tab" aria-selected="${on}" href="${href}" ${attr}="${item.id}">
          ${content}
        </a>`;
      }
      return `<button class="rung ${on ? 'is-on' : ''}" role="tab" aria-selected="${on}" ${attr}="${item.id}">
        ${content}
      </button>`;
    }).join('')}
  </div>`;
}
