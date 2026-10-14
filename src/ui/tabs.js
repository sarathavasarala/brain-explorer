import { esc } from './format.js';

export function renderSegmentedTabs(tabs, activeId, { hrefPrefix = '', attr = 'data-tab', ariaLabel = 'Section tabs' } = {}) {
  if (!tabs?.length) return '';
  return `<nav class="segmented-tabs" role="tablist" aria-label="${esc(ariaLabel)}">
    ${tabs.map((t) => {
      const on = t.id === activeId;
      const href = t.href || (hrefPrefix ? `${hrefPrefix}/${t.id}` : `#/${t.id}`);
      return `
        <a class="segmented-tab ${on ? 'is-on' : ''}"
           role="tab"
           href="${href}"
           ${attr}="${esc(t.id)}"
           tabindex="${on ? '0' : '-1'}"
           aria-selected="${on ? 'true' : 'false'}"
           ${t.panelId ? `aria-controls="${esc(t.panelId)}"` : ''}>
          <span class="tab-label">${esc(t.label)}</span>
        </a>
      `;
    }).join('')}
  </nav>`;
}
