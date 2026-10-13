export const NS = 'http://www.w3.org/2000/svg';

export const C = {
  ink: '#e9ebf5',
  muted: 'rgba(233,235,245,.55)',
  faint: 'rgba(190,200,255,.10)',
  cell: '#cdd5ff',
  dopamine: '#b98cff',
  excite: '#ffcf6b',
  inhibit: '#ff6b7d',
  calcium: '#7df0c0',
  vta: '#ffb703',
  nac: '#2ed9aa',
};

export function el(tag, attrs = {}, parent = null) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) {
    if (attrs[k] != null) n.setAttribute(k, attrs[k]);
  }
  if (parent) parent.appendChild(n);
  return n;
}

let glowCounter = 0;
export function glowFilter(svg) {
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return 'none';
  const id = `glow-${++glowCounter}`;
  let defs = svg.querySelector('defs');
  if (!defs) {
    defs = el('defs', {}, null);
    svg.insertBefore(defs, svg.firstChild);
  }
  const filter = el('filter', { id }, defs);
  el('feGaussianBlur', { stdDeviation: '2.2', result: 'b' }, filter);
  const merge = el('feMerge', {}, filter);
  el('feMergeNode', { in: 'b' }, merge);
  el('feMergeNode', { in: 'SourceGraphic' }, merge);
  return `url(#${id})`;
}

export const lin = (d0, d1, r0, r1) => (v) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
