import { C, el, glowFilter, lin } from './svg.js';

const LIGAND_ORDER = ['full', 'partial', 'inverse', 'neutral', 'competitive', 'noncompetitive'];
const SWATCH = {
  full: C.excite,
  partial: '#ffb703',
  inverse: C.inhibit,
  neutral: '#9aa6d6',
  competitive: '#6be4ff',
  noncompetitive: '#ff9f68',
};

function helpers(svg) {
  const txt = (parent, attrs, str) => {
    const t = el('text', { 'font-family': 'var(--display)', ...attrs }, parent);
    t.textContent = str;
    return t;
  };
  return { txt };
}

function wrapLines(str, maxChars = 26) {
  const words = str.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if (cur && (cur + ' ' + w).length > maxChars) {
      lines.push(cur);
      cur = w;
    } else {
      cur = cur ? cur + ' ' + w : w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ---------------------------------------------------------------- dose-response

export function mountReceptorCurves(container, props = {}, ctx = {}) {
  const { world, setControls } = ctx;
  const width = 800;
  const height = 320;

  const svg = el('svg', {
    viewBox: `0 0 ${width} ${height}`,
    preserveAspectRatio: 'xMidYMid meet',
  }, container);
  const { txt } = helpers(svg);
  const glowUrl = glowFilter(svg);
  const glow = (n) => { if (glowUrl !== 'none') n.setAttribute('filter', glowUrl); return n; };

  // ------------------------------------------------ Left: Live Receptor Pocket Schematic (x: 18..294)
  const rx = 156;
  const mTop = 144;
  const mBot = 158;
  const schem = el('g', {}, svg);

  el('rect', {
    x: 18, y: 20, width: 276, height: 284, rx: 12,
    fill: 'rgba(190,200,255,0.03)', stroke: 'rgba(190,200,255,0.12)', 'stroke-width': 1,
  }, schem);
  txt(schem, { x: 32, y: 39, fill: C.muted, 'font-size': 9.5, 'letter-spacing': '0.06em' }, 'AT THE RECEPTOR ENTRANCE');
  const modePill = txt(schem, { x: 280, y: 39, 'text-anchor': 'end', fill: C.excite, 'font-size': 10, 'font-weight': 700 }, 'Full agonist');

  // Sending terminal rim at top of cleft
  el('path', {
    d: `M86 50 Q${rx} 68 226 50`,
    fill: 'none', stroke: 'rgba(205,213,255,0.35)', 'stroke-width': 1.2,
  }, schem);
  txt(schem, { x: rx, y: 55, 'text-anchor': 'middle', fill: 'rgba(233,235,245,0.35)', 'font-size': 8 }, 'synaptic cleft');

  // Postsynaptic membrane bilayer
  el('line', { x1: 32, y1: mTop, x2: 280, y2: mTop, stroke: C.cell, 'stroke-width': 1.1 }, schem);
  el('line', { x1: 32, y1: mBot, x2: 280, y2: mBot, stroke: C.cell, 'stroke-width': 1.1 }, schem);
  txt(schem, { x: 34, y: mTop - 7, fill: 'rgba(233,235,245,0.32)', 'font-size': 8, 'letter-spacing': '0.08em' }, 'OUT');
  txt(schem, { x: 34, y: mBot + 13, fill: 'rgba(233,235,245,0.32)', 'font-size': 8, 'letter-spacing': '0.08em' }, 'IN');

  // Receptor barrel & sliding gate leaves
  el('rect', { x: rx - 40, y: mTop - 26, width: 10, height: 68, rx: 4, fill: 'rgba(223,228,255,0.55)' }, schem);
  el('rect', { x: rx + 30, y: mTop - 26, width: 10, height: 68, rx: 4, fill: 'rgba(223,228,255,0.55)' }, schem);
  const pore = el('rect', { x: rx - 14, y: mTop - 28, width: 28, height: 72, rx: 5, fill: C.excite, opacity: 0.08 }, schem);
  const gateL = el('rect', { x: rx - 13, y: mTop - 28, width: 12, height: 72, rx: 4, fill: '#dfe4ff', opacity: 0.88 }, schem);
  const gateR = el('rect', { x: rx + 1, y: mTop - 28, width: 12, height: 72, rx: 4, fill: '#dfe4ff', opacity: 0.88 }, schem);

  // Cupped orthosteric pocket at the entrance
  const pocketCup = el('path', {
    d: `M${rx - 18} ${mTop - 34} L${rx - 12} ${mTop - 24} L${rx + 12} ${mTop - 24} L${rx + 18} ${mTop - 34}`,
    fill: 'none', stroke: C.excite, 'stroke-width': 2, 'stroke-linecap': 'round',
  }, schem);
  txt(schem, { x: rx - 24, y: mTop - 32, 'text-anchor': 'end', fill: 'rgba(233,235,245,0.45)', 'font-size': 8.5 }, 'pocket');

  // Docked molecule in the top pocket
  const dockedKey = el('circle', { cx: rx, cy: mTop - 31, r: 5.5, fill: C.excite, opacity: 0 }, schem);
  glow(dockedKey);

  // Competitive blocker cap in the top pocket + bounce ring when agonist is deflected
  const compCap = el('rect', {
    x: rx - 15, y: mTop - 36, width: 30, height: 10, rx: 4,
    fill: SWATCH.competitive, stroke: '#fff', 'stroke-width': 1, opacity: 0,
  }, schem);
  const bounceRing = el('circle', {
    cx: rx - 8, cy: mTop - 44, r: 6,
    fill: 'none', stroke: C.inhibit, 'stroke-width': 1.5, opacity: 0,
  }, schem);

  // Non-competitive side wedge & pore clamp bar
  const sideWedge = el('g', { opacity: 0 }, schem);
  el('polygon', {
    points: `${rx + 28},${mTop + 7} ${rx + 50},${mTop - 1} ${rx + 50},${mTop + 15}`,
    fill: SWATCH.noncompetitive, stroke: '#fff', 'stroke-width': 1,
  }, sideWedge);
  el('line', {
    x1: rx - 16, y1: mTop + 7, x2: rx + 28, y2: mTop + 7,
    stroke: SWATCH.noncompetitive, 'stroke-width': 2.4, 'stroke-dasharray': '3 2',
  }, sideWedge);
  txt(sideWedge, { x: rx + 54, y: mTop + 10, fill: SWATCH.noncompetitive, 'font-size': 8.5, 'font-weight': 700 }, 'side jam');

  //Inverse agonist clamp arrows pinching the gate shut
  const invClamp = el('g', { opacity: 0 }, schem);
  el('path', { d: `M${rx - 25} ${mTop + 7} h9 M${rx + 16} ${mTop + 7} h9`, stroke: C.inhibit, 'stroke-width': 2, 'stroke-linecap': 'round' }, invClamp);

  // Approaching molecules in the cleft
  const flyerA = el('circle', { cx: rx - 10, cy: 76, r: 4.5, fill: C.excite, opacity: 0 }, schem);
  const flyerB = el('circle', { cx: rx + 12, cy: 76, r: 4.5, fill: SWATCH.competitive, opacity: 0 }, schem);

  // Streaming ions inside the cell
  const ions = [];
  for (let i = 0; i < 6; i++) {
    ions.push(el('circle', { cx: rx - 7.5 + i * 3, cy: mBot + 30, r: 2.6, fill: C.excite, opacity: 0 }, schem));
  }

  // Bottom status inside the receptor schematic card
  const gateTitle = txt(schem, { x: rx, y: 262, 'text-anchor': 'middle', fill: C.ink, 'font-size': 10.5, 'font-weight': 700 }, '');
  const gateSub = txt(schem, { x: rx, y: 280, 'text-anchor': 'middle', fill: C.muted, 'font-size': 9.5 }, '');

  // ------------------------------------------------ Center: Dose-Response Plot (x: 352..602)
  const left = 352;
  const right = 602;
  const top = 42;
  const bottom = 198;

  const xToPx = lin(-3, 3, left, right);
  const yToPx = lin(-0.6, 1.2, bottom, top);

  const plot = el('g', {}, svg);
  el('line', { x1: left, y1: yToPx(0), x2: right, y2: yToPx(0), stroke: 'rgba(190,200,255,0.3)', 'stroke-width': 1 }, plot);
  el('line', { x1: left, y1: top, x2: left, y2: bottom, stroke: 'rgba(190,200,255,0.25)', 'stroke-width': 1 }, plot);

  const ticks = [
    { l: -3, s: '0.001' }, { l: -1, s: '0.1' }, { l: 1, s: '10' }, { l: 3, s: '1000' },
  ];
  for (const tk of ticks) {
    el('line', { x1: xToPx(tk.l), y1: bottom, x2: xToPx(tk.l), y2: bottom + 5, stroke: 'rgba(190,200,255,0.35)', 'stroke-width': 1 }, plot);
    txt(plot, { x: xToPx(tk.l), y: bottom + 17, 'text-anchor': 'middle', fill: C.muted, 'font-size': 9 }, tk.s);
  }
  txt(plot, { x: (left + right) / 2, y: bottom + 32, 'text-anchor': 'middle', fill: C.muted, 'font-size': 9.5 }, 'drug concentration (log scale)');
  for (const yv of [-0.5, 0.5, 1.0]) {
    el('line', { x1: left, y1: yToPx(yv), x2: right, y2: yToPx(yv), stroke: 'rgba(190,200,255,0.08)', 'stroke-width': 1 }, plot);
    txt(plot, { x: left - 8, y: yToPx(yv) + 3, 'text-anchor': 'end', fill: C.muted, 'font-size': 9 }, `${yv > 0 ? '+' : ''}${Math.round(yv * 100)}%`);
  }
  txt(plot, { x: left - 8, y: yToPx(0) + 3, 'text-anchor': 'end', fill: 'rgba(233,235,245,0.6)', 'font-size': 9 }, '0');

  const refCurve = el('path', { fill: 'none', stroke: 'rgba(233,235,245,0.35)', 'stroke-width': 1.6, 'stroke-dasharray': '5 5' }, plot);
  const actCurve = el('path', { fill: 'none', stroke: C.excite, 'stroke-width': 2.6, 'stroke-linecap': 'round' }, plot);
  glow(actCurve);
  const doseLine = el('line', { y1: top, y2: bottom, stroke: 'rgba(233,235,245,0.25)', 'stroke-width': 1, 'stroke-dasharray': '3 4' }, plot);
  const doseDot = el('circle', { r: 5, fill: '#fff', opacity: 0.9 }, plot);

  // Readout bars under the plot (x: 352..602)
  const readout = el('g', {}, svg);
  el('rect', { x: left, y: 256, width: 250, height: 8, rx: 4, fill: 'rgba(190,200,255,0.08)' }, readout);
  const occBar = el('rect', { x: left, y: 256, height: 8, rx: 4, fill: '#9aa6d6', opacity: 0.85, width: 0 }, readout);
  const occLbl = txt(readout, { x: left, y: 249, fill: C.muted, 'font-size': 10 }, 'occupancy');
  el('rect', { x: left, y: 286, width: 250, height: 8, rx: 4, fill: 'rgba(190,200,255,0.08)' }, readout);
  const respBar = el('rect', { x: left, y: 286, height: 8, rx: 4, fill: C.excite, opacity: 0.9, width: 0 }, readout);
  const respLbl = txt(readout, { x: left, y: 279, fill: C.muted, 'font-size': 10 }, 'cell response');

  // ------------------------------------------------ Right: Drug Selector & Note (x: 622..788)
  const legend = el('g', {}, svg);
  txt(legend, { x: 626, y: 39, fill: C.muted, 'font-size': 9.5, 'letter-spacing': '0.06em' }, 'CHOOSE A DRUG');
  const rowEls = [];
  LIGAND_ORDER.forEach((key, i) => {
    const y = 58 + i * 27;
    const g = el('g', { class: 'rec-ligand-row', tabindex: 0, role: 'button', 'aria-label': world.LIGANDS[key].label, style: 'cursor: pointer;' }, legend);
    const bg = el('rect', { x: 622, y: y - 12, width: 166, height: 24, rx: 7, fill: 'rgba(190,200,255,0.04)', stroke: 'rgba(190,200,255,0.12)', 'stroke-width': 1 }, g);
    el('circle', { cx: 635, cy: y, r: 4.5, fill: SWATCH[key] }, g);
    const label = txt(g, { x: 647, y: y + 4, fill: C.ink, 'font-size': 10.5 }, world.LIGANDS[key].label);
    rowEls.push({ key, bg, label });
    g.addEventListener('click', () => selectLigand(key));
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectLigand(key); } });
  });

  const noteGroup = el('g', {}, svg);

  const state = { ligand: props.ligand || 'full', logC: props.logC ?? 0, antagLog: props.antagLog ?? -0.5, occ: 0.5, resp: 0.5 };

  function setNote(str) {
    while (noteGroup.firstChild) noteGroup.removeChild(noteGroup.firstChild);
    const lines = wrapLines(str, 27);
    lines.forEach((ln, idx) => {
      txt(noteGroup, { x: 624, y: 236 + idx * 14, fill: 'rgba(233,235,245,0.62)', 'font-size': 9.5 }, ln);
    });
  }

  function curvesFor() {
    const conc = Math.pow(10, state.antagLog);
    if (state.ligand === 'competitive') {
      return { ref: world.ligandCurve('full'), act: world.shiftedAgonistCurve('full', { antagonistConc: conc, kb: 0.1 }) };
    }
    if (state.ligand === 'noncompetitive') {
      return { ref: world.ligandCurve('full'), act: world.blockedAgonistCurve('full', { antagonistConc: conc, ic50: 0.1 }) };
    }
    if (state.ligand === 'neutral') {
      return { ref: null, act: world.sampleCurve(() => 0) };
    }
    return { ref: null, act: world.ligandCurve(state.ligand) };
  }

  function effectAt(conc) {
    const c = Math.pow(10, conc);
    const antag = Math.pow(10, state.antagLog);
    if (state.ligand === 'competitive') {
      const ec = world.apparentEc50({ ec50: 1, antagonistConc: antag, kb: 0.1 });
      return world.effect({ conc: c, ec50: ec, efficacy: 1 });
    }
    if (state.ligand === 'noncompetitive') {
      const base = world.effect({ conc: c, ec50: 1, efficacy: 1 });
      return base * world.noncompetitiveFactor({ antagonistConc: antag, ic50: 0.1 });
    }
    const lig = world.LIGANDS[state.ligand];
    return world.effect({ conc: c, ec50: 1, efficacy: lig.efficacy });
  }

  function pathOf(arr) {
    return arr.map((pt, i) => `${i === 0 ? 'M' : 'L'}${xToPx(pt.logC).toFixed(1)} ${yToPx(pt.y).toFixed(1)}`).join(' ');
  }

  function rebuild() {
    const { ref, act } = curvesFor();
    refCurve.setAttribute('d', ref ? pathOf(ref) : '');
    refCurve.setAttribute('opacity', ref ? '1' : '0');
    actCurve.setAttribute('d', pathOf(act));
    actCurve.setAttribute('stroke', SWATCH[state.ligand]);
    modePill.textContent = world.LIGANDS[state.ligand].label;
    modePill.setAttribute('fill', SWATCH[state.ligand]);
    pocketCup.setAttribute('stroke', SWATCH[state.ligand]);
    for (const row of rowEls) {
      const on = row.key === state.ligand;
      row.bg.setAttribute('fill', on ? 'rgba(190,200,255,0.14)' : 'rgba(190,200,255,0.04)');
      row.bg.setAttribute('stroke', on ? 'rgba(190,200,255,0.4)' : 'rgba(190,200,255,0.12)');
      row.label.setAttribute('fill', on ? '#fff' : C.ink);
    }
  }

  function readouts() {
    const c = Math.pow(10, state.logC);
    const antag = Math.pow(10, state.antagLog);
    let occEc = 1;
    if (state.ligand === 'competitive') occEc = world.apparentEc50({ ec50: 1, antagonistConc: antag, kb: 0.1 });
    const occ = world.hill(c, occEc);
    const resp = effectAt(state.logC);
    state.occ = occ;
    state.resp = resp;

    doseLine.setAttribute('x1', xToPx(state.logC));
    doseLine.setAttribute('x2', xToPx(state.logC));
    doseDot.setAttribute('cx', xToPx(state.logC));
    doseDot.setAttribute('cy', yToPx(resp));

    occBar.setAttribute('width', (occ * 250).toFixed(1));
    const isBlockerCurve = state.ligand === 'competitive' || state.ligand === 'noncompetitive';
    occLbl.textContent = isBlockerCurve
      ? `Agonist bound: ${Math.round(occ * 100)}%`
      : `Pocket occupied: ${Math.round(occ * 100)}%`;
    const rPos = Math.abs(resp);
    respBar.setAttribute('width', (rPos * 250).toFixed(1));
    respBar.setAttribute('fill', resp < 0 ? C.inhibit : SWATCH[state.ligand]);
    const respPct = Math.round(resp * 100);
    respLbl.textContent = `Cell response: ${respPct > 0 ? '+' : ''}${respPct}%`;

    // Update schematic static elements & descriptions
    const openAmt = Math.max(-0.25, resp);
    const shiftPx = openAmt >= 0 ? openAmt * 10.5 : openAmt * 3;
    gateL.setAttribute('transform', `translate(${(-shiftPx).toFixed(2)},0)`);
    gateR.setAttribute('transform', `translate(${shiftPx.toFixed(2)},0)`);
    pore.setAttribute('fill', resp < 0 ? C.inhibit : SWATCH[state.ligand]);
    pore.setAttribute('opacity', (resp > 0 ? 0.08 + resp * 0.42 : 0.04).toFixed(2));

    if (state.ligand === 'neutral') {
      dockedKey.setAttribute('fill', SWATCH.neutral);
      dockedKey.setAttribute('opacity', occ.toFixed(2));
      compCap.setAttribute('opacity', '0');
      sideWedge.setAttribute('opacity', '0');
      invClamp.setAttribute('opacity', '0');
      gateTitle.textContent = 'Pocket occupied, gate stays at rest';
      gateSub.textContent = 'Blocks the seat without turning the switch.';
      setNote('Occupies the pocket but never switches the receptor on.');
    } else if (state.ligand === 'competitive') {
      const blockerShare = (antag / 0.1) / (1 + c + antag / 0.1);
      dockedKey.setAttribute('fill', C.excite);
      dockedKey.setAttribute('opacity', occ.toFixed(2));
      compCap.setAttribute('opacity', Math.min(1, blockerShare * 1.15).toFixed(2));
      sideWedge.setAttribute('opacity', '0');
      invClamp.setAttribute('opacity', '0');
      gateTitle.textContent = occ > 0.5 ? 'Agonist crowds out the blocker' : 'Blocker caps the entrance pocket';
      gateSub.textContent = occ > 0.5 ? 'Higher agonist dose wins back the seat.' : 'Raise probe dose to outcompete the cap.';
      setNote('Fights for the same entrance: extra agonist shifts the curve right.');
    } else if (state.ligand === 'noncompetitive') {
      const jam = 1 - world.noncompetitiveFactor({ antagonistConc: antag, ic50: 0.1 });
      dockedKey.setAttribute('fill', C.excite);
      dockedKey.setAttribute('opacity', occ.toFixed(2));
      compCap.setAttribute('opacity', '0');
      sideWedge.setAttribute('opacity', Math.max(0.25, jam).toFixed(2));
      invClamp.setAttribute('opacity', '0');
      gateTitle.textContent = 'Top pocket is free, side hinge jammed';
      gateSub.textContent = 'Even full agonist binding cannot open the pore.';
      setNote('Jams the channel from the side: the ceiling drops even at high dose.');
    } else if (state.ligand === 'partial') {
      dockedKey.setAttribute('fill', SWATCH.partial);
      dockedKey.setAttribute('opacity', occ.toFixed(2));
      compCap.setAttribute('opacity', '0');
      sideWedge.setAttribute('opacity', '0');
      invClamp.setAttribute('opacity', '0');
      gateTitle.textContent = 'Key fits, gate opens only partway';
      gateSub.textContent = 'Even at 100% occupancy, flow is capped at 42%.';
      setNote('Same fit in the pocket, weaker turn of the gate: a lower ceiling.');
    } else if (state.ligand === 'inverse') {
      dockedKey.setAttribute('fill', C.inhibit);
      dockedKey.setAttribute('opacity', occ.toFixed(2));
      compCap.setAttribute('opacity', '0');
      sideWedge.setAttribute('opacity', '0');
      invClamp.setAttribute('opacity', Math.min(1, Math.abs(resp) * 1.6).toFixed(2));
      gateTitle.textContent = 'Gate clamped shut below baseline';
      gateSub.textContent = 'Shuts off the receptor resting leak.';
      setNote('Pulls activity below baseline, the opposite of an agonist.');
    } else {
      dockedKey.setAttribute('fill', C.excite);
      dockedKey.setAttribute('opacity', occ.toFixed(2));
      compCap.setAttribute('opacity', '0');
      sideWedge.setAttribute('opacity', '0');
      invClamp.setAttribute('opacity', '0');
      gateTitle.textContent = 'Key docks and swings the gate wide';
      gateSub.textContent = 'More dose fills more pockets and drives full flow.';
      setNote('The classic full agonist: fits the pocket and turns the switch all the way on.');
    }
  }

  function selectLigand(key) {
    state.ligand = key;
    rebuild();
    readouts();
    syncAntagonist();
  }

  let concLabel;
  let antagWrap;
  let antagLabel;
  let antagSlider;
  function syncAntagonist() {
    if (!antagWrap) return;
    const show = state.ligand === 'competitive' || state.ligand === 'noncompetitive';
    antagWrap.style.display = show ? 'flex' : 'none';
    if (antagLabel) antagLabel.textContent = state.ligand === 'noncompetitive'
      ? `Blocker dose: ${Math.pow(10, state.antagLog).toFixed(3)}`
      : `Antagonist dose: ${Math.pow(10, state.antagLog).toFixed(3)}`;
  }

  if (setControls) {
    const ctrls = document.createElement('div');
    ctrls.className = 'dock-ctrl-group';
    ctrls.style.display = 'flex';
    ctrls.style.alignItems = 'center';
    ctrls.style.gap = '12px';
    ctrls.style.flexWrap = 'wrap';
    ctrls.style.justifyContent = 'flex-end';

    concLabel = document.createElement('span');
    concLabel.className = 'dock-label';
    concLabel.textContent = `Probe dose: ${Math.pow(10, state.logC).toFixed(3)}`;
    const concSlider = document.createElement('input');
    concSlider.type = 'range';
    concSlider.className = 'dock-range';
    concSlider.min = '-3';
    concSlider.max = '3';
    concSlider.step = '0.1';
    concSlider.value = String(state.logC);
    concSlider.addEventListener('input', (e) => {
      state.logC = parseFloat(e.target.value);
      concLabel.textContent = `Probe dose: ${Math.pow(10, state.logC).toFixed(3)}`;
      readouts();
    });

    antagWrap = document.createElement('div');
    antagWrap.style.display = 'none';
    antagWrap.style.alignItems = 'center';
    antagWrap.style.gap = '8px';
    antagLabel = document.createElement('span');
    antagLabel.className = 'dock-label';
    antagSlider = document.createElement('input');
    antagSlider.type = 'range';
    antagSlider.className = 'dock-range';
    antagSlider.min = '-3';
    antagSlider.max = '3';
    antagSlider.step = '0.1';
    antagSlider.value = String(state.antagLog);
    antagSlider.addEventListener('input', (e) => {
      state.antagLog = parseFloat(e.target.value);
      syncAntagonist();
      rebuild();
      readouts();
    });
    antagWrap.appendChild(antagLabel);
    antagWrap.appendChild(antagSlider);

    ctrls.appendChild(concLabel);
    ctrls.appendChild(concSlider);
    ctrls.appendChild(antagWrap);
    setControls(ctrls);
  }

  rebuild();
  readouts();
  syncAntagonist();

  return {
    render(t) {
      const W0 = world && world.WINDOW ? world.WINDOW[0] : 0;
      const tt = Math.max(0, t - W0);
      const p = (tt % 1.8) / 1.8;

      // Animate approaching cleft molecule(s)
      const flyColor = (state.ligand === 'competitive' || state.ligand === 'noncompetitive')
        ? C.excite
        : SWATCH[state.ligand];
      flyerA.setAttribute('fill', flyColor);

      if (state.ligand === 'competitive' && state.occ < 0.45) {
        // Agonist approaches and bounces off the competitive blocker cap
        const down = p < 0.55 ? p / 0.55 : 1 - (p - 0.55) / 0.45;
        const xOff = p < 0.55 ? -6 * (1 - down) : -18 * (1 - down);
        flyerA.setAttribute('cx', (rx + xOff).toFixed(1));
        flyerA.setAttribute('cy', (68 + down * 36).toFixed(1));
        flyerA.setAttribute('opacity', Math.sin(p * Math.PI).toFixed(2));
        const bPulse = p > 0.48 && p < 0.85 ? (p - 0.48) / 0.37 : 0;
        bounceRing.setAttribute('r', (4 + bPulse * 10).toFixed(1));
        bounceRing.setAttribute('opacity', (bPulse > 0 ? (1 - bPulse) * 0.85 : 0).toFixed(2));
      } else {
        bounceRing.setAttribute('opacity', '0');
        const approach = Math.min(1, p / 0.65);
        flyerA.setAttribute('cx', rx.toFixed(1));
        flyerA.setAttribute('cy', (66 + approach * 44).toFixed(1));
        flyerA.setAttribute('opacity', (Math.sin(p * Math.PI) * 0.85).toFixed(2));
      }

      if (state.ligand === 'competitive') {
        const p2 = ((tt + 0.9) % 1.8) / 1.8;
        flyerB.setAttribute('cx', (rx + 14 * (1 - p2)).toFixed(1));
        flyerB.setAttribute('cy', (66 + Math.min(1, p2 / 0.65) * 42).toFixed(1));
        flyerB.setAttribute('opacity', (Math.sin(p2 * Math.PI) * 0.7).toFixed(2));
      } else {
        flyerB.setAttribute('opacity', '0');
      }

      // Animate ions streaming through the pore proportional to positive cell response
      const flow = Math.max(0, state.resp);
      const speed = 0.8 + flow * 1.4;
      for (let i = 0; i < ions.length; i++) {
        if (flow <= 0.02) {
          ions[i].setAttribute('opacity', '0');
          continue;
        }
        const ph = ((tt * speed) + i * 0.16) % 1;
        ions[i].setAttribute('cy', (mBot + 22 + ph * 46).toFixed(1));
        ions[i].setAttribute('fill', state.ligand === 'partial' ? SWATCH.partial : C.excite);
        ions[i].setAttribute('opacity', ( Math.min(1, flow * 1.3) * Math.sin(ph * Math.PI) * 0.95).toFixed(2));
      }
    },
    destroy() {
      if (svg.parentElement) svg.parentElement.removeChild(svg);
    },
  };
}

// ---------------------------------------------------------------- modulation

export function mountReceptorModulation(container, props = {}, ctx = {}) {
  const { world, setControls } = ctx;
  const width = 800;
  const height = 300;

  const svg = el('svg', {
    viewBox: `0 0 ${width} ${height}`,
    preserveAspectRatio: 'xMidYMid meet',
  }, container);
  const { txt } = helpers(svg);
  const glowUrl = glowFilter(svg);
  const glow = (n) => { if (glowUrl !== 'none') n.setAttribute('filter', glowUrl); return n; };

  const cx = 220;
  const mTop = 150;
  const mBot = 164;

  const receptor = el('g', {}, svg);
  el('rect', { x: cx - 70, y: 96, width: 8, height: 66, rx: 4, fill: '#dfe4ff', opacity: 0.7 }, receptor);
  const modPore = el('rect', { x: cx - 14, y: 90, width: 28, height: 72, rx: 4, fill: C.calcium, opacity: 0.1 }, receptor);
  const modGateL = el('rect', { x: cx - 13, y: 90, width: 12, height: 72, rx: 4, fill: '#dfe4ff', opacity: 0.85 }, receptor);
  const modGateR = el('rect', { x: cx + 1, y: 90, width: 12, height: 72, rx: 4, fill: '#dfe4ff', opacity: 0.85 }, receptor);
  el('rect', { x: cx + 62, y: 96, width: 8, height: 66, rx: 4, fill: '#dfe4ff', opacity: 0.7 }, receptor);
  el('line', { x1: cx - 90, y1: mTop, x2: cx + 90, y2: mTop, stroke: C.cell, 'stroke-width': 1.1 }, svg);
  el('line', { x1: cx - 90, y1: mBot, x2: cx + 90, y2: mBot, stroke: C.cell, 'stroke-width': 1.1 }, svg);

  txt(svg, { x: cx, y: 56, 'text-anchor': 'middle', fill: C.muted, 'font-size': 10 }, 'orthosteric site (GABA)');
  txt(svg, { x: cx + 112, y: 136, 'text-anchor': 'middle', fill: '#6be4ff', 'font-size': 10 }, 'allosteric site');
  el('path', { d: `M${cx + 96} 126 q-14 -4 -22 -12`, fill: 'none', stroke: 'rgba(107,228,255,0.5)', 'stroke-width': 1 }, svg);

  const gabaDot = el('circle', { cx, cy: 66, r: 5.5, fill: C.calcium, opacity: 0 }, svg);
  glow(gabaDot);
  const modDot = el('circle', { cx: cx + 104, cy: 96, r: 5, fill: '#6be4ff', opacity: 0 }, svg);
  glow(modDot);

  const ions = [];
  for (let i = 0; i < 6; i++) ions.push(el('circle', { cx: cx - 5 + i * 2, cy: 172, r: 2.6, fill: C.calcium, opacity: 0 }, svg));

  const curveG = el('g', {}, svg);
  const cl = 430;
  const cr = 740;
  const ct = 56;
  const cb = 192;
  const cX = lin(-3, 3, cl, cr);
  const cY = lin(0, 1.95, cb, ct);
  el('line', { x1: cl, y1: cb, x2: cr, y2: cb, stroke: 'rgba(190,200,255,0.25)', 'stroke-width': 1 }, curveG);
  el('line', { x1: cl, y1: ct, x2: cl, y2: cb, stroke: 'rgba(190,200,255,0.25)', 'stroke-width': 1 }, curveG);
  el('line', { x1: cl, y1: cY(1), x2: cr, y2: cY(1), stroke: 'rgba(190,200,255,0.08)', 'stroke-width': 1 }, curveG);
  txt(curveG, { x: (cl + cr) / 2, y: cb + 22, 'text-anchor': 'middle', fill: C.muted, 'font-size': 10 }, 'GABA concentration');
  txt(curveG, { x: cl - 8, y: ct + 4, 'text-anchor': 'end', fill: C.muted, 'font-size': 9.5 }, 'boosted');
  txt(curveG, { x: cl - 8, y: cY(1) + 3, 'text-anchor': 'end', fill: C.muted, 'font-size': 9.5 }, 'normal');
  txt(curveG, { x: cl - 8, y: cb + 3, 'text-anchor': 'end', fill: C.muted, 'font-size': 9.5 }, 'rest');
  const baseCurve = el('path', { fill: 'none', stroke: 'rgba(233,235,245,0.35)', 'stroke-width': 1.6, 'stroke-dasharray': '5 5' }, curveG);
  const modCurve = el('path', { fill: 'none', stroke: C.calcium, 'stroke-width': 2.6, 'stroke-linecap': 'round' }, curveG);
  glow(modCurve);

  const verdict = txt(svg, { x: 430, y: 252, fill: 'rgba(233,235,245,0.7)', 'font-size': 11 }, '');
  txt(svg, { x: 430, y: 272, fill: 'rgba(233,235,245,0.5)', 'font-size': 10 }, 'A modulator alone does nothing: it needs the real messenger present.');

  const state = { mode: 'pam', dose: 0.6 };

  function modulatorValue() {
    if (state.mode === 'pam') return state.dose;
    if (state.mode === 'nam') return -state.dose;
    return 0;
  }

  function rebuild() {
    const mod = modulatorValue();
    const base = world.sampleCurve((c) => world.effect({ conc: c, ec50: 1, efficacy: 1 }));
    const modded = state.mode === 'alone'
      ? world.sampleCurve(() => 0)
      : world.modulatedCurve('full', { ec50: 1, modulator: mod });
    baseCurve.setAttribute('d', base.map((p, i) => `${i === 0 ? 'M' : 'L'}${cX(p.logC).toFixed(1)} ${cY(p.y).toFixed(1)}`).join(' '));
    modCurve.setAttribute('d', modded.map((p, i) => `${i === 0 ? 'M' : 'L'}${cX(p.logC).toFixed(1)} ${cY(p.y).toFixed(1)}`).join(' '));
    modCurve.setAttribute('stroke', state.mode === 'nam' ? C.inhibit : state.mode === 'alone' ? '#6be4ff' : C.calcium);

    if (state.mode === 'alone') {
      verdict.textContent = 'Enhancer alone: no messenger, no effect.';
      verdict.setAttribute('fill', 'rgba(233,235,245,0.7)');
    } else if (state.mode === 'nam') {
      verdict.textContent = 'Negative modulator: GABA still works, just more weakly.';
      verdict.setAttribute('fill', C.inhibit);
    } else {
      verdict.textContent = 'Positive modulator: same GABA, a larger calming current.';
      verdict.setAttribute('fill', C.calcium);
    }
  }

  if (setControls) {
    const ctrls = document.createElement('div');
    ctrls.className = 'dock-ctrl-group';
    ctrls.style.display = 'flex';
    ctrls.style.alignItems = 'center';
    ctrls.style.gap = '8px';
    ctrls.style.flexWrap = 'wrap';
    ctrls.style.justifyContent = 'flex-end';

    const modes = [
      { key: 'pam', label: '+ Enhancer (PAM)' },
      { key: 'nam', label: '+ Dampener (NAM)' },
      { key: 'alone', label: 'Modulator alone' },
    ];
    let doseLabel = null;
    let doseSlider = null;
    const btns = [];
    const setMode = (key) => {
      state.mode = key;
      for (const b of btns) b.setAttribute('aria-pressed', b.dataset.key === key ? 'true' : 'false');
      if (doseLabel) doseLabel.style.display = key === 'alone' ? 'none' : 'inline';
      if (doseSlider) doseSlider.style.display = key === 'alone' ? 'none' : 'inline';
      rebuild();
    };
    for (const m of modes) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'dock-btn';
      b.dataset.key = m.key;
      b.textContent = m.label;
      b.setAttribute('aria-pressed', m.key === state.mode ? 'true' : 'false');
      b.addEventListener('click', () => setMode(m.key));
      btns.push(b);
      ctrls.appendChild(b);
    }

    doseLabel = document.createElement('span');
    doseLabel.className = 'dock-label';
    doseLabel.textContent = `Modulator dose: ${state.dose.toFixed(2)}`;
    doseSlider = document.createElement('input');
    doseSlider.type = 'range';
    doseSlider.className = 'dock-range';
    doseSlider.min = '0';
    doseSlider.max = '1';
    doseSlider.step = '0.05';
    doseSlider.value = String(state.dose);
    doseSlider.addEventListener('input', (e) => {
      state.dose = parseFloat(e.target.value);
      doseLabel.textContent = `Modulator dose: ${state.dose.toFixed(2)}`;
      rebuild();
    });
    doseLabel.style.display = state.mode === 'alone' ? 'none' : 'inline';
    doseSlider.style.display = state.mode === 'alone' ? 'none' : 'inline';

    ctrls.appendChild(doseLabel);
    ctrls.appendChild(doseSlider);
    setControls(ctrls);
  }

  rebuild();

  return {
    render(t) {
      const W0 = world && world.WINDOW ? world.WINDOW[0] : 0;
      const tt = t - W0;
      const active = state.mode === 'alone' ? 0 : 1;

      const gp = (tt % 2.2) / 2.2;
      const gv = Math.max(0, Math.min(1, gp / 0.3));
      gabaDot.setAttribute('cy', (66 + gv * 22).toFixed(1));
      gabaDot.setAttribute('opacity', (active * (gp < 0.8 ? gv : Math.max(0, 1 - (gp - 0.8) / 0.2))).toFixed(2));

      const mp = ((tt + 0.6) % 2.2) / 2.2;
      const mv = Math.max(0, Math.min(1, mp / 0.3));
      modDot.setAttribute('cx', (cx + 104 - mv * 32).toFixed(1));
      modDot.setAttribute('cy', (96 + mv * 14).toFixed(1));
      modDot.setAttribute('opacity', ((mp < 0.85 ? mv : Math.max(0, 1 - (mp - 0.85) / 0.15)) * (state.mode !== 'alone' && state.dose === 0 ? 0 : 1)).toFixed(2));
      modDot.setAttribute('fill', modulatorValue() < 0 ? C.inhibit : '#6be4ff');

      const flow = active * (state.mode === 'nam' ? Math.max(0.15, 0.55 - 0.35 * state.dose) : (0.55 + 0.45 * state.dose));
      const openPx = flow * 11 * (gp > 0.15 && gp < 0.85 ? 1 : 0.25);
      modGateL.setAttribute('transform', `translate(${(-openPx).toFixed(2)},0)`);
      modGateR.setAttribute('transform', `translate(${openPx.toFixed(2)},0)`);
      modPore.setAttribute('opacity', (0.06 + (openPx / 11) * 0.42).toFixed(2));
      for (let i = 0; i < ions.length; i++) {
        const ph = ((tt * 1.4) + i * 0.14) % 1;
        ions[i].setAttribute('cy', (172 + ph * 46).toFixed(1));
        ions[i].setAttribute('opacity', (flow * Math.sin(ph * Math.PI) * 0.9).toFixed(2));
      }
    },
    destroy() {
      if (svg.parentElement) svg.parentElement.removeChild(svg);
    },
  };
}
