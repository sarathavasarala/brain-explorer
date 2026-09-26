// Renders circuit diagrams and synapses (from content/diagrams and content/synapses) as SVG.
import { esc } from './format.js';

export const LINK_COLORS = { excite: '#ffcf6b', inhibit: '#ff6b7d', modulate: '#b98cff' };
const W = 400, H = 262;
const X = (x) => 22 + x * 3.56;
const Y = (y) => 18 + y * 2.1;
const CELL = '#cdd5ff';

const RADIUS = { pyramidal: 10, stellate: 7, granule: 5, purkinje: 9, interneuron: 6, modulator: 8, neuron: 7, region: 0, input: 4, output: 4 };

function glyph(n) {
  const x = X(n.x), y = Y(n.y);
  const s = `stroke="${CELL}" stroke-width="1.3" fill="none"`;
  switch (n.kind) {
    case 'pyramidal':
      return `<g ${s}>
        <path d="M${x} ${y - 9} L${x + 8} ${y + 6} L${x - 8} ${y + 6} Z" fill="rgba(205,213,255,.14)"/>
        <path d="M${x} ${y - 9} V${y - 34} M${x} ${y - 24} l-9 -9 M${x} ${y - 28} l8 -8 M${x} ${y - 34} l-4 -6 M${x} ${y - 34} l5 -5"/>
        <path d="M${x - 7} ${y + 5} l-9 7 M${x + 7} ${y + 5} l9 7 M${x} ${y + 6} v10"/>
      </g>`;
    case 'stellate':
      return `<g ${s}><circle cx="${x}" cy="${y}" r="5.5" fill="rgba(205,213,255,.14)"/>
        ${[0, 60, 120, 180, 240, 300].map((a) => { const r = (a * Math.PI) / 180; return `<path d="M${x + Math.cos(r) * 6} ${y + Math.sin(r) * 6} l${Math.cos(r + 0.3) * 9} ${Math.sin(r + 0.3) * 9}"/>`; }).join('')}</g>`;
    case 'granule':
      return `<g ${s}><circle cx="${x}" cy="${y}" r="4" fill="rgba(205,213,255,.18)"/>
        <path d="M${x - 4} ${y + 2} l-6 4 M${x + 4} ${y + 2} l6 4 M${x} ${y - 4} v-7 M${x - 3} ${y + 4} l-2 6"/></g>`;
    case 'purkinje': {
      const branches = [];
      for (let i = -3; i <= 3; i++) {
        const bx = x + i * 7;
        branches.push(`M${x} ${y - 10} Q${x + i * 2} ${y - 20} ${bx} ${y - 30} l${i * 1.5 - 3} -9 M${bx} ${y - 30} l${i * 1.5 + 3} -10`);
      }
      return `<g ${s}><path d="M${x} ${y - 8} C${x + 9} ${y - 6} ${x + 9} ${y + 8} ${x} ${y + 8} C${x - 9} ${y + 8} ${x - 9} ${y - 6} ${x} ${y - 8}Z" fill="rgba(205,213,255,.14)"/>
        <path d="${branches.join(' ')}" stroke-width="1"/><path d="M${x} ${y + 8} v14"/></g>`;
    }
    case 'interneuron':
      return `<g stroke="${LINK_COLORS.inhibit}" stroke-width="1.3" fill="none"><circle cx="${x}" cy="${y}" r="6" fill="rgba(255,107,125,.16)"/>
        <path d="M${x - 6} ${y} h-7 M${x + 6} ${y} h7 M${x} ${y - 6} v-6 M${x} ${y + 6} v6"/></g>`;
    case 'modulator':
      return `<g stroke="${LINK_COLORS.modulate}" stroke-width="1.3" fill="none">
        <circle cx="${x}" cy="${y}" r="7" fill="rgba(185,140,255,.2)"/>
        <circle cx="${x}" cy="${y}" r="12" stroke-dasharray="2 3" opacity=".7"><animate attributeName="r" values="10;17;10" dur="3s" repeatCount="indefinite"/><animate attributeName="opacity" values=".8;0;.8" dur="3s" repeatCount="indefinite"/></circle></g>`;
    case 'region': {
      const w = Math.max(60, n.label.length * 6.2 + 20);
      return `<rect x="${x - w / 2}" y="${y - 12}" width="${w}" height="24" rx="12" fill="rgba(205,213,255,.07)" stroke="rgba(205,213,255,.35)"/>
        <text x="${x}" y="${y + 4}" text-anchor="middle" class="dg-region">${esc(n.label)}</text>`;
    }
    case 'input':
    case 'output':
      return `<circle cx="${x}" cy="${y}" r="3.5" fill="${n.kind === 'input' ? CELL : 'none'}" stroke="${CELL}" stroke-width="1.2"/>`;
    default:
      return `<g ${s}><circle cx="${x}" cy="${y}" r="6.5" fill="rgba(205,213,255,.14)"/>
        <path d="M${x - 6} ${y - 3} l-8 -6 M${x + 6} ${y - 3} l8 -6 M${x} ${y + 6.5} v10"/></g>`;
  }
}

function label(n) {
  if (n.kind === 'region') return '';
  const x = X(n.x), y = Y(n.y);
  const below = n.kind === 'pyramidal' || n.kind === 'purkinje' ? 30 : 20;
  return `<text x="${x}" y="${y + below}" text-anchor="middle" class="dg-label">${esc(n.label)}</text>`;
}

function edgePoint(n, toward) {
  const x = X(n.x), y = Y(n.y);
  const dx = toward[0] - x, dy = toward[1] - y, len = Math.hypot(dx, dy) || 1;
  if (n.kind === 'region') {
    const w = Math.max(60, n.label.length * 6.2 + 20) / 2, h = 12;
    const t = Math.min(w / Math.abs(dx || 1e-6), h / Math.abs(dy || 1e-6));
    return [x + dx * Math.min(t, 1) * 1.04, y + dy * Math.min(t, 1) * 1.04];
  }
  const r = (RADIUS[n.kind] || 6) + 3;
  return [x + (dx / len) * r, y + (dy / len) * r];
}

export function renderCircuit(d, uid = 'c') {
  if (!d) return '';
  const nodes = new Map(d.nodes.map((n) => [n.id, n]));
  const parts = [];

  parts.push(`<defs>${Object.entries(LINK_COLORS).map(([k, c]) => {
    const shape = k === 'excite' ? '<path d="M0 0 L8 4 L0 8 Z"/>' : k === 'inhibit' ? '<rect x="3" y="-1" width="2.4" height="10"/>' : '<circle cx="4" cy="4" r="3.2"/>';
    return `<marker id="${uid}-${k}" viewBox="0 -1 8 10" refX="6" refY="4" markerWidth="7" markerHeight="7" orient="auto" fill="${c}">${shape}</marker>`;
  }).join('')}</defs>`);

  for (const b of d.bands || []) {
    parts.push(`<line x1="8" x2="${W - 8}" y1="${Y(b.y) - 6}" y2="${Y(b.y) - 6}" class="dg-band"/><text x="${W - 8}" y="${Y(b.y) + 4}" text-anchor="end" class="dg-bandlabel">${esc(b.label)}</text>`);
  }
  if (d.divider) {
    parts.push(`<line x1="${X(d.divider.x)}" x2="${X(d.divider.x)}" y1="10" y2="${H - 10}" class="dg-band"/><text x="${X(d.divider.x)}" y="${H - 2}" text-anchor="middle" class="dg-bandlabel">${esc(d.divider.label || '')}</text>`);
  }

  d.links.forEach((l, i) => {
    const a = nodes.get(l.from), b = nodes.get(l.to);
    if (!a || !b) return;
    const ac = [X(a.x), Y(a.y)], bc = [X(b.x), Y(b.y)];
    const p0 = edgePoint(a, bc), p1 = edgePoint(b, ac);
    const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
    const bend = l.bend ?? 0.14;
    const cx = mx - dy * bend, cy = my + dx * bend;
    const path = `M${p0[0].toFixed(1)} ${p0[1].toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`;
    const c = LINK_COLORS[l.type] || LINK_COLORS.excite;
    const len = Math.hypot(dx, dy);
    const dur = Math.max(0.9, len / 110).toFixed(2);
    parts.push(`<path d="${path}" stroke="${c}" stroke-width="1.4" fill="none" opacity=".75" marker-end="url(#${uid}-${l.type})" ${l.type === 'modulate' ? 'stroke-dasharray="3 3"' : ''}/>`);
    parts.push(`<circle r="2.6" fill="${c}" class="dg-spike"><animateMotion dur="${dur}s" begin="${(i * 0.37).toFixed(2)}s" repeatCount="indefinite" path="${path}" keyPoints="0;1" keyTimes="0;1" calcMode="linear"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.1;.85;1" dur="${dur}s" begin="${(i * 0.37).toFixed(2)}s" repeatCount="indefinite"/></circle>`);
    if (l.label) {
      const lx = 0.25 * p0[0] + 0.5 * cx + 0.25 * p1[0], ly = 0.25 * p0[1] + 0.5 * cy + 0.25 * p1[1];
      parts.push(`<text x="${lx.toFixed(1)}" y="${(ly - 5).toFixed(1)}" text-anchor="middle" class="dg-linklabel" fill="${c}">${esc(l.label)}</text>`);
    }
  });

  for (const n of d.nodes) parts.push(glyph(n), label(n));

  return `<svg class="diagram" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(d.title || 'Circuit diagram')}">${parts.join('')}</svg>`;
}

export function renderSynapse(syn) {
  if (!syn) return '';
  const c = syn.color;
  const vesicles = [[178, 38], [200, 30], [222, 40], [188, 58], [212, 60], [236, 56], [164, 56]];
  const molecules = [];
  for (let i = 0; i < 14; i++) {
    const x0 = 180 + (i % 7) * 7 - 4, x1 = 130 + (i * 37) % 140;
    const dur = 1.8 + (i % 5) * 0.25, begin = (i * 0.21).toFixed(2);
    molecules.push(`<circle r="2.4" fill="${c}"><animate attributeName="cx" values="${x0};${x1}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/><animate attributeName="cy" values="84;121" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.8;1" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></circle>`);
  }
  const receptors = syn.receptors.map((r, i) => {
    const n = syn.receptors.length;
    const x = 200 + (i - (n - 1) / 2) * 92;
    return `<g><path d="M${x - 11} 121 v-8 h6 v5 h10 v-5 h6 v8" stroke="${c}" stroke-width="1.4" fill="none"/>
      <text x="${x}" y="146" text-anchor="middle" class="dg-label">${esc(r)}</text></g>`;
  }).join('');
  const effect = { excite: 'Excites the next cell', inhibit: 'Quiets the next cell', modulate: 'Tunes the next cell' }[syn.effect];
  return `<svg class="diagram synapse" viewBox="0 0 400 190" role="img" aria-label="${esc(syn.name)} synapse">
    <path d="M140 0 V50 C140 74 162 84 200 84 C238 84 260 74 260 50 V0" fill="rgba(205,213,255,.06)" stroke="${CELL}" stroke-width="1.3"/>
    ${vesicles.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="7" fill="none" stroke="${c}" stroke-width="1.2" opacity=".85"><animate attributeName="r" values="7;7.8;7" dur="${2 + i * 0.2}s" repeatCount="indefinite"/></circle><circle cx="${x}" cy="${y}" r="2" fill="${c}" opacity=".7"/>`).join('')}
    ${molecules.join('')}
    <path d="M70 122 C140 118 260 118 330 122" stroke="${CELL}" stroke-width="1.3" fill="none"/>
    <path d="M70 128 C140 124 260 124 330 128 V190 H70 Z" fill="rgba(205,213,255,.05)"/>
    ${receptors}
    <text x="276" y="22" class="dg-label" text-anchor="start">Sending cell</text>
    <text x="276" y="108" class="dg-label dim" text-anchor="start">gap ≈ 20 nm</text>
    <text x="200" y="176" text-anchor="middle" class="dg-label">Receiving cell · ${effect}</text>
  </svg>`;
}
