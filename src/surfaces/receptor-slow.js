import { C, el, glowFilter, lin } from './svg.js';

const clamp01 = (v) => Math.max(0, Math.min(1, v));

function helpers(svg) {
  const txt = (parent, attrs, str) => {
    const t = el('text', { 'font-family': 'var(--display)', ...attrs }, parent);
    t.textContent = str;
    return t;
  };
  return { txt };
}

let slowClipCounter = 0;

function playControls(ctrls, clock) {
  const playBtn = document.createElement('button');
  playBtn.type = 'button';
  playBtn.className = 'dock-btn';
  playBtn.textContent = clock && clock.playing ? 'Pause' : 'Play';
  playBtn.setAttribute('aria-pressed', clock && clock.playing ? 'true' : 'false');
  playBtn.addEventListener('click', () => { if (!clock) return; if (clock.playing) clock.pause(); else clock.play(); });
  let unsub = null;
  if (clock) {
    unsub = clock.subscribe((_t, clk) => {
      playBtn.textContent = clk.playing ? 'Pause' : 'Play';
      playBtn.setAttribute('aria-pressed', clk.playing ? 'true' : 'false');
    });
  }
  ctrls.appendChild(playBtn);
  return unsub;
}

function doseControl(ctrls, world, state, rebuild, initLabel) {
  const lbl = document.createElement('span');
  lbl.className = 'dock-label';
  lbl.textContent = `${initLabel}: ${state.ligand.toFixed(1)}`;
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.className = 'dock-range';
  slider.min = '0.2';
  slider.max = '3';
  slider.step = '0.1';
  slider.value = String(state.ligand);
  slider.addEventListener('input', (e) => {
    state.ligand = parseFloat(e.target.value);
    lbl.textContent = `${initLabel}: ${state.ligand.toFixed(1)}`;
    rebuild();
  });
  ctrls.appendChild(lbl);
  ctrls.appendChild(slider);
}

// ---------------------------------------------------------------- enzyme-linked

export function mountReceptorEnzyme(container, props = {}, ctx = {}) {
  const { world, clock, setControls } = ctx;
  const W0 = world && world.WINDOW ? world.WINDOW[0] : 0;
  const W1 = world && world.WINDOW ? world.WINDOW[1] : 3;

  const svg = el('svg', { viewBox: '0 0 800 320', preserveAspectRatio: 'xMidYMid meet' }, container);
  const { txt } = helpers(svg);
  const glowUrl = glowFilter(svg);
  const glow = (n) => { if (glowUrl !== 'none') n.setAttribute('filter', glowUrl); return n; };

  txt(svg, { x: 24, y: 26, fill: C.ink, 'font-size': 13, 'font-weight': 700 }, 'Enzyme-linked receptor: a lock that carries its own tool');
  txt(svg, { x: 24, y: 44, fill: C.muted, 'font-size': 10.5 }, 'Minutes, not milliseconds. Binding pairs two receptors so their enzymes can tag proteins.');

  const mY = 150;
  el('line', { x1: 24, y1: mY, x2: 336, y2: mY, stroke: C.cell, 'stroke-width': 1.2 }, svg);
  txt(svg, { x: 24, y: mY - 8, fill: 'rgba(233,235,245,0.35)', 'font-size': 9, 'letter-spacing': '0.08em' }, 'OUTSIDE');
  txt(svg, { x: 24, y: mY + 16, fill: 'rgba(233,235,245,0.35)', 'font-size': 9, 'letter-spacing': '0.08em' }, 'INSIDE');

  const monoL = el('g', {}, svg);
  const monoR = el('g', {}, svg);
  el('rect', { x: -9, y: mY - 32, width: 18, height: 74, rx: 7, fill: 'rgba(223,228,255,0.85)', opacity: 0.9 }, monoL);
  el('rect', { x: -9, y: mY + 42, width: 18, height: 18, rx: 6, fill: C.calcium, opacity: 0.8 }, monoL);
  el('rect', { x: -9, y: mY - 32, width: 18, height: 74, rx: 7, fill: 'rgba(223,228,255,0.85)', opacity: 0.9 }, monoR);
  el('rect', { x: -9, y: mY + 42, width: 18, height: 18, rx: 6, fill: C.calcium, opacity: 0.8 }, monoR);
  monoL.setAttribute('transform', 'translate(140,0)');
  monoR.setAttribute('transform', 'translate(220,0)');

  const ligL = el('circle', { cx: 140, cy: 62, r: 5.5, fill: C.calcium, opacity: 0 }, svg); glow(ligL);
  const ligR = el('circle', { cx: 220, cy: 62, r: 5.5, fill: C.calcium, opacity: 0 }, svg); glow(ligR);

  const phosphates = [];
  for (let i = 0; i < 4; i++) {
    const pg = el('g', { opacity: 0 }, svg);
    el('circle', { cx: 174 + i * 5 - 8, cy: mY + 74, r: 3.4, fill: 'rgba(190,200,255,0.1)', stroke: C.calcium, 'stroke-width': 1.2 }, pg);
    txt(pg, { x: 174 + i * 5 - 8, y: mY + 76.4, 'text-anchor': 'middle', fill: C.calcium, 'font-size': 5, 'font-weight': 700 }, 'P');
    phosphates.push(pg);
  }

  const relays = [];
  for (let i = 0; i < 9; i++) relays.push(el('circle', { cx: 180, cy: mY + 96, r: 2.4, fill: C.calcium, opacity: 0 }, svg));

  // response chart
  const bx = 388;
  const bw = 380;
  const bt = 96;
  const bb = 232;
  el('line', { x1: bx, y1: bb, x2: bx + bw, y2: bb, stroke: 'rgba(190,200,255,0.25)', 'stroke-width': 1 }, svg);
  el('line', { x1: bx, y1: bt, x2: bx, y2: bb, stroke: 'rgba(190,200,255,0.25)', 'stroke-width': 1 }, svg);
  txt(svg, { x: bx, y: bt - 8, fill: C.muted, 'font-size': 10 }, 'response inside the cell');
  txt(svg, { x: bx + bw, y: bb + 22, 'text-anchor': 'end', fill: C.muted, 'font-size': 10 }, 'minutes after the ligand arrives');
  const clipId = `rec-enz-clip-${++slowClipCounter}`;
  const defs = svg.querySelector('defs') || el('defs', {}, svg);
  const clip = el('clipPath', { id: clipId }, defs);
  const clipRect = el('rect', { x: bx, y: 0, width: 0, height: 320 }, clip);
  const curve = el('path', { fill: 'none', stroke: C.calcium, 'stroke-width': 2.6, 'stroke-linecap': 'round', 'clip-path': `url(#${clipId})` }, svg);
  glow(curve);
  const playhead = el('line', { y1: bt - 4, y2: bb, stroke: 'rgba(233,235,245,0.3)', 'stroke-width': 1 }, svg);

  const stageDefs = [
    { label: 'ligand binds', at: 0.06, x: bx + 14 },
    { label: 'receptors pair', at: 0.2, x: bx + 98 },
    { label: 'enzymes tag', at: 0.42, x: bx + 190 },
    { label: 'relay & response', at: 0.72, x: bx + 278 },
  ];
  const stageEls = stageDefs.map((s) => ({
    at: s.at,
    dot: el('circle', { cx: s.x - 6, cy: 272, r: 3.4, fill: C.calcium, opacity: 0.18 }, svg),
    label: txt(svg, { x: s.x, y: 276, fill: 'rgba(233,235,245,0.4)', 'font-size': 9.5 }, s.label),
  }));

  const state = { ligand: props.ligand ?? 1.5 };
  const xToPx = lin(0, 10, bx, bx + bw);
  const yToPx = lin(0, 1, bb, bt);

  function rebuild() {
    const steps = 120;
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const minutes = (i / steps) * 10;
      const y = world.enzymePhosphorylation(minutes, { ligand: state.ligand, delay: 1.5, tau: 1.6, stages: 2 });
      d += `${i === 0 ? 'M' : 'L'}${xToPx(minutes).toFixed(1)} ${yToPx(y).toFixed(1)} `;
    }
    curve.setAttribute('d', d.trim());
  }

  let unsubClock = null;
  if (setControls) {
    const ctrls = document.createElement('div');
    ctrls.className = 'dock-ctrl-group';
    ctrls.style.display = 'flex';
    ctrls.style.alignItems = 'center';
    ctrls.style.gap = '10px';
    ctrls.style.flexWrap = 'wrap';
    ctrls.style.justifyContent = 'flex-end';
    doseControl(ctrls, world, state, rebuild, 'Ligand dose');
    unsubClock = playControls(ctrls, clock);
    setControls(ctrls);
  }

  rebuild();

  return {
    render(t) {
      const p = clamp01((t - W0) / (W1 - W0));
      const minutes = p * 10;
      clipRect.setAttribute('width', (bw * p).toFixed(1));
      const x = xToPx(minutes);
      playhead.setAttribute('x1', x.toFixed(1));
      playhead.setAttribute('x2', x.toFixed(1));

      const bind = clamp01(minutes / 1.2);
      const dimer = clamp01((minutes - 1.2) / 1.4);
      const phosph = clamp01((minutes - 2.6) / 2.0);
      const relay = clamp01((minutes - 4.6) / 2.4);

      monoL.setAttribute('transform', `translate(${(140 + dimer * 9).toFixed(1)},0)`);
      monoR.setAttribute('transform', `translate(${(220 - dimer * 9).toFixed(1)},0)`);
      ligL.setAttribute('cy', (62 + bind * 54).toFixed(1));
      ligR.setAttribute('cy', (62 + bind * 54).toFixed(1));
      ligL.setAttribute('opacity', bind.toFixed(2));
      ligR.setAttribute('opacity', bind.toFixed(2));

      for (let i = 0; i < phosphates.length; i++) {
        phosphates[i].setAttribute('opacity', (phosph * (i < 3 ? 0.95 : 0.5)).toFixed(2));
      }
      for (let i = 0; i < relays.length; i++) {
        const ph = clamp01(relay * 1.4 - i * 0.08);
        relays[i].setAttribute('cx', (180 + Math.sin(ph * Math.PI) * (14 + (i % 4) * 12)).toFixed(1));
        relays[i].setAttribute('cy', (mY + 92 + ph * 34 + (i % 3) * 6).toFixed(1));
        relays[i].setAttribute('opacity', (relay * Math.sin(ph * Math.PI) * 0.85).toFixed(2));
      }

      for (const s of stageEls) {
        const on = clamp01((p - s.at) / 0.08);
        s.dot.setAttribute('opacity', (0.18 + on * 0.82).toFixed(2));
        s.label.setAttribute('fill', on > 0.5 ? C.ink : 'rgba(233,235,245,0.4)');
      }
    },
    destroy() {
      if (unsubClock) unsubClock();
      if (svg.parentElement) svg.parentElement.removeChild(svg);
    },
  };
}

// ---------------------------------------------------------------- nuclear

export function mountReceptorNuclear(container, props = {}, ctx = {}) {
  const { world, clock, setControls } = ctx;
  const W0 = world && world.WINDOW ? world.WINDOW[0] : 0;
  const W1 = world && world.WINDOW ? world.WINDOW[1] : 3;

  const svg = el('svg', { viewBox: '0 0 800 320', preserveAspectRatio: 'xMidYMid meet' }, container);
  const { txt } = helpers(svg);
  const glowUrl = glowFilter(svg);
  const glow = (n) => { if (glowUrl !== 'none') n.setAttribute('filter', glowUrl); return n; };

  txt(svg, { x: 24, y: 26, fill: C.ink, 'font-size': 13, 'font-weight': 700 }, 'Nuclear receptor: the key rewrites the instructions');
  txt(svg, { x: 24, y: 44, fill: C.muted, 'font-size': 10.5 }, 'Hours, not seconds. A fat-soluble ligand slips inside and switches genes on or off.');

  const mY = 92;
  el('line', { x1: 24, y1: mY, x2: 336, y2: mY, stroke: C.cell, 'stroke-width': 1.2 }, svg);
  txt(svg, { x: 24, y: mY - 8, fill: 'rgba(233,235,245,0.35)', 'font-size': 9, 'letter-spacing': '0.08em' }, 'OUTSIDE');
  txt(svg, { x: 24, y: mY + 16, fill: 'rgba(233,235,245,0.35)', 'font-size': 9, 'letter-spacing': '0.08em' }, 'INSIDE THE CELL');

  const nucleus = el('circle', { cx: 186, cy: 244, r: 58, fill: 'rgba(190,200,255,0.05)', stroke: 'rgba(190,200,255,0.22)', 'stroke-width': 1.2 }, svg);
  el('line', { x1: 148, y1: 244, x2: 224, y2: 244, stroke: 'rgba(233,235,245,0.5)', 'stroke-width': 1.4 }, svg);
  for (let i = -3; i <= 3; i++) {
    el('line', { x1: 186 + i * 11, y1: 238, x2: 186 + i * 11, y2: 250, stroke: 'rgba(233,235,245,0.32)', 'stroke-width': 1 }, svg);
  }
  txt(svg, { x: 186, y: 300, 'text-anchor': 'middle', fill: 'rgba(233,235,245,0.4)', 'font-size': 8.5 }, 'nucleus (the DNA)');

  const complex = el('g', {}, svg);
  el('ellipse', { cx: 0, cy: 0, rx: 13, ry: 9, fill: 'rgba(107,228,255,0.16)', stroke: '#6be4ff', 'stroke-width': 1.3 }, complex);
  const bound = el('circle', { cx: 0, cy: -6, r: 4.4, fill: '#6be4ff', opacity: 0 }, complex);
  glow(bound);
  const ligand = el('circle', { cx: 132, cy: 52, r: 5.5, fill: '#6be4ff', opacity: 0 }, svg);
  glow(ligand);

  const mrna = el('path', { d: 'M226 250 q20 -10 40 2 t40 0', fill: 'none', stroke: C.excite, 'stroke-width': 2.2, 'stroke-linecap': 'round', opacity: 0 }, svg);
  glow(mrna);
  const mrnaLabel = txt(svg, { x: 300, y: 244, fill: 'rgba(233,235,245,0.5)', 'font-size': 8.5 }, 'mRNA');
  mrnaLabel.setAttribute('opacity', '0');

  const proteins = [];
  for (let i = 0; i < 7; i++) {
    const pg = el('g', { opacity: 0 }, svg);
    el('rect', { x: -5, y: -5, width: 10, height: 10, rx: 3, fill: C.dopamine, opacity: 0.9 }, pg);
    proteins.push(pg);
  }
  txt(svg, { x: 300, y: 288, 'text-anchor': 'middle', fill: 'rgba(233,235,245,0.45)', 'font-size': 8.5 }, 'new protein');

  // chart: mRNA and protein over hours
  const bx = 388;
  const bw = 380;
  const bt = 96;
  const bb = 232;
  el('line', { x1: bx, y1: bb, x2: bx + bw, y2: bb, stroke: 'rgba(190,200,255,0.25)', 'stroke-width': 1 }, svg);
  el('line', { x1: bx, y1: bt, x2: bx, y2: bb, stroke: 'rgba(190,200,255,0.25)', 'stroke-width': 1 }, svg);
  txt(svg, { x: bx, y: bt - 8, fill: C.muted, 'font-size': 10 }, 'gene activity');
  txt(svg, { x: bx + bw, y: bb + 22, 'text-anchor': 'end', fill: C.muted, 'font-size': 10 }, 'hours after the ligand arrives');
  txt(svg, { x: bx + 6, y: bt + 12, fill: C.excite, 'font-size': 10, 'font-weight': 700 }, 'mRNA');
  txt(svg, { x: bx + 60, y: bt + 12, fill: C.dopamine, 'font-size': 10, 'font-weight': 700 }, 'protein');

  const clipId = `rec-nuc-clip-${++slowClipCounter}`;
  const defs = svg.querySelector('defs') || el('defs', {}, svg);
  const clip = el('clipPath', { id: clipId }, defs);
  const clipRect = el('rect', { x: bx, y: 0, width: 0, height: 320 }, clip);
  const tracesG = el('g', { 'clip-path': `url(#${clipId})` }, svg);
  const mRNAPath = el('path', { fill: 'none', stroke: C.excite, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, tracesG);
  glow(mRNAPath);
  const protPath = el('path', { fill: 'none', stroke: C.dopamine, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, tracesG);
  const playhead = el('line', { y1: bt - 4, y2: bb, stroke: 'rgba(233,235,245,0.3)', 'stroke-width': 1 }, svg);

  const state = { ligand: props.ligand ?? 1.5 };
  const xToPx = lin(0, 6, bx, bx + bw);
  const yToPx = lin(0, 0.85, bb, bt);

  function rebuild() {
    const steps = 120;
    let dm = '';
    let dp = '';
    for (let i = 0; i <= steps; i++) {
      const hours = (i / steps) * 6;
      dm += `${i === 0 ? 'M' : 'L'}${xToPx(hours).toFixed(1)} ${yToPx(world.nuclearMrna(hours, { ligand: state.ligand })).toFixed(1)} `;
      dp += `${i === 0 ? 'M' : 'L'}${xToPx(hours).toFixed(1)} ${yToPx(world.nuclearProtein(hours, { ligand: state.ligand })).toFixed(1)} `;
    }
    mRNAPath.setAttribute('d', dm.trim());
    protPath.setAttribute('d', dp.trim());
  }

  let unsubClock = null;
  if (setControls) {
    const ctrls = document.createElement('div');
    ctrls.className = 'dock-ctrl-group';
    ctrls.style.display = 'flex';
    ctrls.style.alignItems = 'center';
    ctrls.style.gap = '10px';
    ctrls.style.flexWrap = 'wrap';
    ctrls.style.justifyContent = 'flex-end';
    doseControl(ctrls, world, state, rebuild, 'Ligand dose');
    unsubClock = playControls(ctrls, clock);
    setControls(ctrls);
  }

  rebuild();

  return {
    render(t) {
      const p = clamp01((t - W0) / (W1 - W0));
      const hours = p * 6;
      clipRect.setAttribute('width', (bw * p).toFixed(1));
      const x = xToPx(hours);
      playhead.setAttribute('x1', x.toFixed(1));
      playhead.setAttribute('x2', x.toFixed(1));

      const enter = clamp01(hours / 0.35);
      const docked = clamp01((hours - 0.32) / 0.12);
      const travel = clamp01((hours - 0.4) / 0.9);
      const bindDna = clamp01((hours - 1.3) / 0.6);
      const transcribe = clamp01((hours - 1.8) / 1.2);
      const translate = clamp01((hours - 2.8) / 1.6);

      ligand.setAttribute('cy', (52 + enter * 82).toFixed(1));
      ligand.setAttribute('opacity', (enter * (1 - docked)).toFixed(2));
      bound.setAttribute('opacity', docked.toFixed(2));

      const cx = 132 + travel * 54;
      const cy = 140 + travel * 104;
      complex.setAttribute('transform', `translate(${cx.toFixed(1)},${cy.toFixed(1)})`);

      const on = Math.max(bindDna, transcribe) * (hours < 3.5 ? 1 : Math.max(0, 1 - (hours - 3.5) / 1.5));
      mrna.setAttribute('opacity', (transcribe * 0.95).toFixed(2));
      mrnaLabel.setAttribute('opacity', (transcribe * 0.95).toFixed(2));
      nucleus.setAttribute('stroke', on > 0.3 ? 'rgba(107,228,255,0.5)' : 'rgba(190,200,255,0.22)');

      for (let i = 0; i < proteins.length; i++) {
        const ph = clamp01(translate * 1.5 - i * 0.09);
        proteins[i].setAttribute('opacity', (translate * Math.sin(ph * Math.PI) * 0.95).toFixed(2));
        proteins[i].setAttribute('transform', `translate(${(248 + (i % 4) * 26).toFixed(1)},${(276 - Math.floor(i / 4) * 22 + Math.sin(ph * Math.PI) * -6).toFixed(1)})`);
      }
    },
    destroy() {
      if (unsubClock) unsubClock();
      if (svg.parentElement) svg.parentElement.removeChild(svg);
    },
  };
}
