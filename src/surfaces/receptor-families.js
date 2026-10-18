import { C, el, glowFilter } from './svg.js';

const FAMILIES = [
  {
    key: 'ionotropic',
    color: C.excite,
    title: 'Ionotropic',
    sub: 'Ligand-gated channel',
    speed: 'under 1 ms',
    caption: 'The receptor is the pore. The ligand opens it directly.',
  },
  {
    key: 'metabotropic',
    color: C.dopamine,
    title: 'Metabotropic',
    sub: 'G-protein coupled',
    speed: 'about 1 s',
    caption: 'No pore of its own. It recruits a G-protein that amplifies the signal.',
  },
  {
    key: 'enzyme',
    color: C.calcium,
    title: 'Enzyme-linked',
    sub: 'Receptor kinase',
    speed: 'minutes',
    caption: 'Binding pairs two receptors, whose own enzymes tag proteins.',
  },
  {
    key: 'nuclear',
    color: '#6be4ff',
    title: 'Nuclear',
    sub: 'Gene switch',
    speed: 'hours',
    caption: 'The ligand slips inside and rewrites which genes are read.',
  },
];

function wrap(str, maxChars) {
  const words = str.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if (line && (line + ' ' + w).length > maxChars) {
      lines.push(line);
      line = w;
    } else {
      line = line ? line + ' ' + w : w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function mountReceptorFamilies(container, props = {}, ctx = {}) {
  const { setControls } = ctx;
  const W0 = ctx.world && ctx.world.WINDOW ? ctx.world.WINDOW[0] : 0;

  const width = 800;
  const height = 316;

  const svg = el('svg', {
    viewBox: `0 0 ${width} ${height}`,
    preserveAspectRatio: 'xMidYMid meet',
  }, container);

  const glowUrl = glowFilter(svg);
  const glow = (node) => { if (glowUrl !== 'none') node.setAttribute('filter', glowUrl); return node; };

  const txt = (parent, attrs, str) => {
    const t = el('text', { 'font-family': 'var(--display)', ...attrs }, parent);
    t.textContent = str;
    return t;
  };

  const PAD = 12;
  const mY = 150;
  const cxOf = (i) => 106 + i * 196;

  const roots = [];
  const updates = [];

  let focusKey = props.focus || 'all';

  for (let i = 0; i < FAMILIES.length; i++) {
    const fam = FAMILIES[i];
    const cx = cxOf(i);
    const x0 = cx - 88;
    const x1 = cx + 88;

    const g = el('g', { class: `rec-fam rec-fam-${fam.key}` }, svg);
    roots.push(g);

    el('rect', {
      x: x0, y: 22, width: 176, height: 288, rx: 14,
      fill: 'rgba(190,200,255,0.03)', stroke: 'rgba(190,200,255,0.12)', 'stroke-width': 1,
    }, g);

    txt(g, { x: x0 + PAD, y: 41, fill: C.ink, 'font-size': 12.5, 'font-weight': 700 }, fam.title);
    txt(g, { x: x1 - PAD, y: 41, 'text-anchor': 'end', fill: fam.color, 'font-size': 11, 'font-weight': 700 }, fam.speed);
    txt(g, { x: x0 + PAD, y: 57, fill: C.muted, 'font-size': 10 }, fam.sub);

    const capLines = wrap(fam.caption, 28);
    capLines.forEach((ln, li) => {
      txt(g, { x: x0 + PAD, y: 268 + li * 12, fill: 'rgba(233,235,245,0.55)', 'font-size': 10 }, ln);
    });

    if (fam.key === 'nuclear') {
      updates.push(buildNuclear(g, cx, x0 + PAD, x1 - PAD, txt));
      continue;
    }

    el('line', { x1: x0 + 10, y1: mY, x2: x1 - 10, y2: mY, stroke: C.cell, 'stroke-width': 1.1 }, g);
    txt(g, { x: x0 + PAD, y: mY - 8, fill: 'rgba(233,235,245,0.32)', 'font-size': 8, 'letter-spacing': '0.08em' }, 'OUT');
    txt(g, { x: x0 + PAD, y: mY + 16, fill: 'rgba(233,235,245,0.32)', 'font-size': 8, 'letter-spacing': '0.08em' }, 'IN');

    if (fam.key === 'ionotropic') updates.push(buildIonotropic(g, cx, x1 - PAD, mY, fam.color, glow, txt));
    if (fam.key === 'metabotropic') updates.push(buildMetabotropic(g, cx, x1 - PAD, mY, fam.color, glow, txt));
    if (fam.key === 'enzyme') updates.push(buildEnzyme(g, cx, x1 - PAD, mY, fam.color, glow, txt));
  }

  function applyFocus() {
    for (let i = 0; i < roots.length; i++) {
      const on = focusKey === 'all' || FAMILIES[i].key === focusKey;
      roots[i].setAttribute('opacity', on ? '1' : '0.28');
    }
  }

  if (setControls) {
    const ctrls = document.createElement('div');
    ctrls.className = 'dock-ctrl-group';
    ctrls.style.display = 'flex';
    ctrls.style.alignItems = 'center';
    ctrls.style.gap = '8px';

    const all = document.createElement('button');
    all.type = 'button';
    all.className = 'dock-btn';
    all.textContent = 'All four';
    all.setAttribute('aria-pressed', focusKey === 'all' ? 'true' : 'false');

    const buttons = [all];
    const setFocus = (key) => {
      focusKey = key;
      for (const b of buttons) b.setAttribute('aria-pressed', b.dataset.key === key ? 'true' : 'false');
      applyFocus();
    };
    all.dataset.key = 'all';
    all.addEventListener('click', () => setFocus('all'));
    ctrls.appendChild(all);

    for (const fam of FAMILIES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'dock-btn';
      b.textContent = fam.title;
      b.dataset.key = fam.key;
      b.setAttribute('aria-pressed', focusKey === fam.key ? 'true' : 'false');
      b.addEventListener('click', () => setFocus(fam.key));
      buttons.push(b);
      ctrls.appendChild(b);
    }

    setControls(ctrls);
  }

  applyFocus();

  return {
    render(t) {
      const tt = t - W0;
      for (const u of updates) u(tt);
    },
    destroy() {
      if (svg.parentElement) svg.parentElement.removeChild(svg);
    },
  };
}

// ---------------------------------------------------------------- panels

function buildIonotropic(g, cx, xRight, mY, color, glow, txt) {
  const ligand = el('circle', { cx, cy: 84, r: 5.5, fill: color, opacity: 0 }, g);
  glow(ligand);

  el('rect', { x: cx - 30, y: mY - 34, width: 9, height: 68, rx: 4, fill: 'rgba(223,228,255,0.55)' }, g);
  el('rect', { x: cx + 21, y: mY - 34, width: 9, height: 68, rx: 4, fill: 'rgba(223,228,255,0.55)' }, g);
  const pore = el('rect', { x: cx - 9, y: mY - 38, width: 18, height: 72, rx: 4, fill: color, opacity: 0.06 }, g);
  const gateL = el('rect', { x: cx - 9, y: mY - 38, width: 9, height: 72, rx: 4, fill: '#dfe4ff', opacity: 0.85 }, g);
  const gateR = el('rect', { x: cx, y: mY - 38, width: 9, height: 72, rx: 4, fill: '#dfe4ff', opacity: 0.85 }, g);

  const nubL = el('circle', { cx: cx - 4, cy: mY - 46, r: 3, fill: color, opacity: 0.5 }, g);
  const nubR = el('circle', { cx: cx + 4, cy: mY - 46, r: 3, fill: color, opacity: 0.5 }, g);

  txt(g, { x: cx + 40, y: mY + 24, 'text-anchor': 'start', fill: 'rgba(233,235,245,0.5)', 'font-size': 8.5 }, 'pore');

  const ions = [];
  for (let i = 0; i < 5; i++) {
    ions.push(el('circle', { cx: cx - 6 + i * 3, cy: mY + 30, r: 2.6, fill: color, opacity: 0 }, g));
  }

  return (tt) => {
    const p = (tt % 2.4) / 2.4;
    let open = 0;
    let lg = 0;
    if (p < 0.34) { lg = p / 0.34; }
    else if (p < 0.78) { lg = 1; open = 1; }
    else { open = 1 - (p - 0.78) / 0.22; lg = 1; }

    ligand.setAttribute('cy', (84 + lg * 32).toFixed(1));
    ligand.setAttribute('opacity', (p < 0.8 ? 1 : Math.max(0, 1 - (p - 0.8) / 0.2)).toFixed(2));
    nubL.setAttribute('opacity', (0.5 + open * 0.5).toFixed(2));
    nubR.setAttribute('opacity', (0.5 + open * 0.5).toFixed(2));

    gateL.setAttribute('transform', `translate(${(-9 * open).toFixed(2)},0)`);
    gateR.setAttribute('transform', `translate(${(9 * open).toFixed(2)},0)`);
    pore.setAttribute('opacity', (0.06 + open * 0.4).toFixed(2));

    for (let i = 0; i < ions.length; i++) {
      const ph = ((tt * 1.6) + i * 0.14) % 1;
      ions[i].setAttribute('cy', (mY + 28 + ph * 44).toFixed(1));
      ions[i].setAttribute('opacity', (open * Math.sin(ph * Math.PI) * 0.95).toFixed(2));
    }
  };
}

function buildMetabotropic(g, cx, xRight, mY, color, glow, txt) {
  el('path', {
    d: `M${cx - 40} ${mY - 34} v48 h13 v-48 h13 v48 h13 v-48 h13 v48 h13 v-48 h13 v48`,
    fill: 'none', stroke: '#dfe4ff', 'stroke-width': 2.4, 'stroke-linejoin': 'round', opacity: 0.9,
  }, g);
  const pocket = el('circle', { cx: cx - 9, cy: mY - 40, r: 3.4, fill: color, opacity: 0.5 }, g);
  const ligand = el('circle', { cx, cy: 84, r: 5.5, fill: color, opacity: 0 }, g);
  glow(ligand);

  const gProt = el('g', {}, g);
  const ga = el('circle', { cx: cx - 10, cy: mY + 44, r: 5, fill: color, opacity: 0.9 }, gProt);
  glow(ga);
  el('circle', { cx: cx + 2, cy: mY + 47, r: 4, fill: '#dfe4ff', opacity: 0.7 }, gProt);
  el('circle', { cx, cy: mY + 38, r: 3.5, fill: '#dfe4ff', opacity: 0.55 }, gProt);
  txt(g, { x: cx - 20, y: mY + 36, 'text-anchor': 'middle', fill: 'rgba(233,235,245,0.45)', 'font-size': 8 }, 'G');

  el('rect', { x: cx + 34, y: mY + 36, width: 24, height: 18, rx: 5, fill: 'rgba(190,200,255,0.08)', stroke: C.cell, 'stroke-width': 1 }, g);
  txt(g, { x: cx + 46, y: mY + 66, 'text-anchor': 'middle', fill: 'rgba(233,235,245,0.6)', 'font-size': 8 }, 'enzyme');

  txt(g, { x: xRight, y: mY - 32, 'text-anchor': 'end', fill: 'rgba(233,235,245,0.5)', 'font-size': 8.5 }, 'Second');
  txt(g, { x: xRight, y: mY - 22, 'text-anchor': 'end', fill: 'rgba(233,235,245,0.5)', 'font-size': 8.5 }, 'messengers');

  const msgs = [];
  for (let i = 0; i < 12; i++) msgs.push(el('circle', { cx: cx + 34, cy: mY + 44, r: 2, fill: color, opacity: 0 }, g));

  return (tt) => {
    const p = (tt % 3.0) / 3.0;
    let bind = 0;
    if (p < 0.3) bind = p / 0.3;
    else bind = 1;
    ligand.setAttribute('cy', (84 + bind * 28).toFixed(1));
    ligand.setAttribute('opacity', bind.toFixed(2));
    pocket.setAttribute('opacity', (0.5 + bind * 0.5).toFixed(2));

    const active = Math.max(0, Math.min(1, (p - 0.34) / 0.2)) * (p < 0.9 ? 1 : Math.max(0, 1 - (p - 0.9) / 0.1));
    ga.setAttribute('transform', `translate(${(active * 26).toFixed(2)},${(active * 2).toFixed(2)})`);

    for (let i = 0; i < msgs.length; i++) {
      const ph = ((tt * 1.1) + i * 0.1) % 1;
      const spread = Math.sin(ph * Math.PI);
      msgs[i].setAttribute('cx', (cx + 38 + spread * (8 + (i % 4) * 9)).toFixed(1));
      msgs[i].setAttribute('cy', (mY + 44 - spread * (6 + Math.floor(i / 4) * 11) + (i % 2) * 8).toFixed(1));
      msgs[i].setAttribute('opacity', (active * spread * 0.9).toFixed(2));
    }
  };
}

function buildEnzyme(g, cx, xRight, mY, color, glow, txt) {
  const left = el('g', {}, g);
  const right = el('g', {}, g);
  el('rect', { x: cx - 34, y: mY - 34, width: 18, height: 64, rx: 6, fill: 'rgba(223,228,255,0.85)', opacity: 0.85 }, left);
  el('rect', { x: cx - 34, y: mY + 30, width: 18, height: 16, rx: 5, fill: color, opacity: 0.75 }, left);
  el('rect', { x: cx + 16, y: mY - 34, width: 18, height: 64, rx: 6, fill: 'rgba(223,228,255,0.85)', opacity: 0.85 }, right);
  el('rect', { x: cx + 16, y: mY + 30, width: 18, height: 16, rx: 5, fill: color, opacity: 0.75 }, right);
  const ligL = el('circle', { cx: cx - 25, cy: 82, r: 5, fill: color, opacity: 0 }, g);
  const ligR = el('circle', { cx: cx + 25, cy: 82, r: 5, fill: color, opacity: 0 }, g);
  glow(ligL); glow(ligR);

  txt(g, { x: xRight, y: mY - 30, 'text-anchor': 'end', fill: 'rgba(233,235,245,0.5)', 'font-size': 8.5 }, 'kinase');

  const phosphates = [];
  for (let i = 0; i < 3; i++) {
    const pg = el('g', { opacity: 0 }, g);
    el('circle', { cx: cx - 8 + i * 8, cy: mY + 56, r: 3.6, fill: 'rgba(190,200,255,0.1)', stroke: color, 'stroke-width': 1.2 }, pg);
    txt(pg, { x: cx - 8 + i * 8, y: mY + 58.5, 'text-anchor': 'middle', fill: color, 'font-size': 5.5, 'font-weight': 700 }, 'P');
    phosphates.push(pg);
  }
  const out = [];
  for (let i = 0; i < 6; i++) out.push(el('circle', { cx, cy: mY + 74, r: 2, fill: color, opacity: 0 }, g));

  return (tt) => {
    const p = (tt % 3.4) / 3.4;
    const binder = Math.min(1, p / 0.3);
    const dimer = Math.max(0, Math.min(1, (p - 0.3) / 0.2));
    ligL.setAttribute('cy', (82 + binder * 32).toFixed(1));
    ligR.setAttribute('cy', (82 + binder * 32).toFixed(1));
    ligL.setAttribute('opacity', binder.toFixed(2));
    ligR.setAttribute('opacity', binder.toFixed(2));
    left.setAttribute('transform', `translate(${(dimer * 6).toFixed(2)},0)`);
    right.setAttribute('transform', `translate(${(-dimer * 6).toFixed(2)},0)`);

    const phosph = Math.max(0, Math.min(1, (p - 0.55) / 0.2)) * (p < 0.92 ? 1 : Math.max(0, 1 - (p - 0.92) / 0.08));
    for (let i = 0; i < phosphates.length; i++) {
      phosphates[i].setAttribute('opacity', (phosph * 0.9).toFixed(2));
    }
    for (let i = 0; i < out.length; i++) {
      const ph = ((tt * 1.2) + i * 0.16) % 1;
      out[i].setAttribute('cx', (cx + Math.sin(ph * Math.PI) * (10 + i * 7)).toFixed(1));
      out[i].setAttribute('cy', (mY + 76 + ph * 18).toFixed(1));
      out[i].setAttribute('opacity', (phosph * Math.sin(ph * Math.PI) * 0.8).toFixed(2));
    }
  };
}

function buildNuclear(g, cx, xLeft, xRight, txt) {
  const mY = 150;
  el('line', { x1: xLeft - 12, y1: mY, x2: xRight + 12, y2: mY, stroke: C.cell, 'stroke-width': 1.1 }, g);
  txt(g, { x: xLeft, y: mY - 8, fill: 'rgba(233,235,245,0.32)', 'font-size': 8, 'letter-spacing': '0.08em' }, 'OUT');
  txt(g, { x: xLeft, y: mY + 16, fill: 'rgba(233,235,245,0.32)', 'font-size': 8, 'letter-spacing': '0.08em' }, 'IN');

  const nY = mY + 52;
  const nR = 40;
  const nucleus = el('circle', { cx, cy: nY, r: nR, fill: 'rgba(190,200,255,0.05)', stroke: 'rgba(190,200,255,0.22)', 'stroke-width': 1.2 }, g);
  el('line', { x1: cx - 26, y1: nY, x2: cx + 26, y2: nY, stroke: 'rgba(233,235,245,0.5)', 'stroke-width': 1.4 }, g);
  for (let i = -2; i <= 2; i++) {
    el('line', { x1: cx + i * 11, y1: nY - 6, x2: cx + i * 11, y2: nY + 6, stroke: 'rgba(233,235,245,0.32)', 'stroke-width': 1 }, g);
  }
  txt(g, { x: cx, y: nY + nR + 16, 'text-anchor': 'middle', fill: 'rgba(233,235,245,0.4)', 'font-size': 8.5 }, 'nucleus');

  const complex = el('g', {}, g);
  el('ellipse', { cx: 0, cy: 0, rx: 12, ry: 8, fill: 'rgba(107,228,255,0.16)', stroke: '#6be4ff', 'stroke-width': 1.3 }, complex);
  const bound = el('circle', { cx: 0, cy: -12, r: 4, fill: '#6be4ff', opacity: 0 }, complex);
  const ligand = el('circle', { cx: cx - 34, cy: 82, r: 5, fill: '#6be4ff', opacity: 0 }, g);

  const mrnaPath = el('path', {
    d: `M${cx + 26} ${nY + 6} q22 -12 44 2`, fill: 'none', stroke: '#6be4ff', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0,
  }, g);
  const mrnaLabel = txt(g, { x: xRight, y: nY + 14, 'text-anchor': 'end', fill: 'rgba(233,235,245,0.5)', 'font-size': 8.5 }, 'mRNA');
  mrnaLabel.setAttribute('opacity', '0');

  return (tt) => {
    const p = (tt % 4.0) / 4.0;
    let approach = 0;
    if (p < 0.18) approach = p / 0.18;
    else approach = 1;
    const travel = Math.max(0, Math.min(1, (p - 0.22) / 0.4));

    ligand.setAttribute('cy', (82 + approach * 82).toFixed(1));
    ligand.setAttribute('opacity', (p < 0.18 ? approach : Math.max(0, 1 - (p - 0.18) / 0.06)).toFixed(2));
    const boundOn = Math.max(0, Math.min(1, (p - 0.16) / 0.06)) * (p < 0.94 ? 1 : Math.max(0, 1 - (p - 0.94) / 0.06));
    bound.setAttribute('opacity', boundOn.toFixed(2));

    const px = cx - 34 + travel * 34;
    const py = nY - 26 + travel * 26;
    complex.setAttribute('transform', `translate(${px.toFixed(2)},${py.toFixed(2)})`);

    const glowOn = Math.max(0, Math.min(1, (p - 0.62) / 0.18)) * (p < 0.94 ? 1 : Math.max(0, 1 - (p - 0.94) / 0.06));
    mrnaPath.setAttribute('opacity', (glowOn * 0.9).toFixed(2));
    mrnaLabel.setAttribute('opacity', (glowOn * 0.9).toFixed(2));
    nucleus.setAttribute('stroke', glowOn > 0.3 ? 'rgba(107,228,255,0.5)' : 'rgba(190,200,255,0.22)');
  };
}
