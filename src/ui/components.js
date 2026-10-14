import { byId, anchorById } from '../content/index.js';
import { fmt, esc } from './format.js';
import { icon } from './icons.js';

export function renderBullets(list) {
  if (!list?.length) return '';
  return `<ul class="bullets">${list.map((b) => `<li>${fmt(b)}</li>`).join('')}</ul>`;
}

export function renderPartChips(ids = [], { chipClass = 'chip' } = {}) {
  if (!ids?.length) return '';
  return `<span class="chips">${ids.map((id) => {
    const s = byId.get(id) || anchorById.get(id);
    if (!s) return `<span class="${chipClass}">${esc(id)}</span>`;
    const isStructure = byId.has(id);
    const color = s.color || '#fff';
    if (isStructure) {
      return `<a class="${chipClass}" href="#/s/${s.id}" style="--c:${color}"><i class="dot"></i>${esc(s.name)}</a>`;
    }
    return `<span class="${chipClass}" style="--c:${color}"><i class="dot"></i>${esc(s.name)}</span>`;
  }).join('')}</span>`;
}

export function renderPager(prev, next, activeTab = '', hashPrefix = '') {
  const prevHref = prev ? (hashPrefix ? `${hashPrefix}/${prev.id}${activeTab ? '/' + activeTab : ''}` : '') : '';
  const nextHref = next ? (hashPrefix ? `${hashPrefix}/${next.id}${activeTab ? '/' + activeTab : ''}` : '') : '';
  return `<footer class="pager">
    ${prev ? `<a href="${prevHref}" class="pg">${icon('prev', 16)}<span>${esc(prev.name)}</span></a>` : '<span></span>'}
    ${next ? `<a href="${nextHref}" class="pg pg-next"><span>${esc(next.name)}</span>${icon('next', 16)}</a>` : '<span></span>'}
  </footer>`;
}

export function renderUpNextCard(up, routeStripFn) {
  if (!up) return '';
  const accent = up.steps?.[0]?.focus?.[0];
  const color = byId.get(accent)?.color || '#c77dff';
  return `<a class="upnext" href="#/p/${up.id}" style="--c:${color}; margin-top: 18px;">
    <span class="upnext-lead"><span>Up next</span>${icon('next', 16)}</span>
    <span class="upnext-name">${esc(up.name)}</span>
    <span class="upnext-tag">${fmt(up.tagline || '')}</span>
    ${routeStripFn ? routeStripFn(up) : ''}
  </a>`;
}
