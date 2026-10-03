// Shared ladder (zoom / section tabs) component.
import { esc } from './format.js';
import { icon } from './icons.js';

export function renderLadder(items, activeId, { hrefPrefix = null, attr = 'data-level' } = {}) {
  return `<div class="ladder" role="tablist" aria-label="Sections" style="--steps:${items.length}">
    ${items.map((item) => {
      const on = item.id === activeId;
      const content = `
        ${item.icon ? `<span class="rung-icon">${icon(item.icon, 18)}</span>` : ''}
        <span class="rung-label">${esc(item.label)}</span>
        ${item.scale ? `<span class="rung-scale">${esc(item.scale)}</span>` : ''}`;

      if (hrefPrefix) {
        return `<a class="rung ${on ? 'is-on' : ''}" role="tab" aria-selected="${on}" href="${hrefPrefix}/${item.id}" ${attr}="${item.id}">
          ${content}
        </a>`;
      }
      return `<button class="rung ${on ? 'is-on' : ''}" role="tab" aria-selected="${on}" ${attr}="${item.id}">
        ${content}
      </button>`;
    }).join('')}
  </div>`;
}
