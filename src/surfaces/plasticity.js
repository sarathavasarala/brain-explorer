import { C, el, glowFilter, lin } from './svg.js';
import * as plasticityWorld from '../worlds/plasticity.js';

let clipCounter = 0;

export function mountPlasticity(container, props = {}, ctx = {}) {
  const { world = plasticityWorld, clock, scene, setControls } = ctx;

  const width = 840;
  const height = 390;

  const svg = el('svg', {
    viewBox: `0 0 ${width} ${height}`,
    preserveAspectRatio: 'xMidYMid meet',
    class: 'plasticity-surface',
  }, container);

  const glowUrl = glowFilter(svg);
  const glow = (n) => {
    if (glowUrl !== 'none') n.setAttribute('filter', glowUrl);
    return n;
  };

  const txt = (parent, attrs, str) => {
    const t = el('text', { 'font-family': 'var(--display)', ...attrs }, parent);
    t.textContent = str;
    return t;
  };

  // State variables
  let activeProtocol = props.protocol || 'baseline';
  let manualVoltage = -65;
  let useManualVoltage = false;
  let currentWeight = 1.0;
  let baseWeight = 1.0;
  let persistentWeight = 1.0;
  let isPlaying = clock ? clock.playing : true;

  if (props.step === 'coincidence') {
    useManualVoltage = true;
    manualVoltage = -15;
  } else if (props.step === 'structural') {
    baseWeight = 1.0;
    currentWeight = 1.0;
    persistentWeight = 1.0;
  } else if (props.step === 'interactive') {
    baseWeight = 1.0;
    currentWeight = 1.8;
    persistentWeight = 1.8;
  }

  // Run simulation for current protocol
  let simData = world.protocolSimulation({
    protocol: activeProtocol,
    initialWeight: currentWeight,
  });

  // ------------------------------------------------ Layout Coordinates
  // Left side: The Synapse & Spine (x: 20..520)
  const synLeft = 20;
  const synRight = 515;
  const synMidX = (synLeft + synRight) / 2; // ~267
  const preY = 32;
  const cleftY = 94;
  const postMembraneY = 146;

  // Right side: Scope & Meters (x: 535..825)
  const rightLeft = 535;
  const rightRight = 825;
  const scopeTop = 22;
  const scopeBottom = 175;
  const mgPlotTop = 208;
  const mgPlotBottom = 368;

  // Defs & clip paths
  const defs = el('defs', {}, svg);
  const clipId = `plast-clip-${++clipCounter}`;
  const clip = el('clipPath', { id: clipId }, defs);
  el('rect', { x: rightLeft, y: scopeTop, width: rightRight - rightLeft, height: scopeBottom - scopeTop }, clip);

  // Gradient for spine interior
  const spineGradId = `spine-grad-${clipCounter}`;
  const spineGrad = el('radialGradient', {
    id: spineGradId,
    cx: '50%',
    cy: '30%',
    r: '70%',
  }, defs);
  el('stop', { offset: '0%', 'stop-color': 'rgba(125, 240, 192, 0.16)' }, spineGrad);
  el('stop', { offset: '100%', 'stop-color': 'rgba(185, 140, 255, 0.04)' }, spineGrad);

  // Background groups
  const synGroup = el('g', { class: 'synapse-anatomy' }, svg);
  const postGroup = el('g', { class: 'postsynaptic-spine' }, synGroup);
  const cleftGroup = el('g', { class: 'synaptic-cleft' }, synGroup);
  const preGroup = el('g', { class: 'presynaptic-terminal' }, synGroup);
  const rightGroup = el('g', { class: 'meters-column' }, svg);

  // =========================================================================
  // 1. LEFT SIDE: PRESYNAPTIC AXON BOUTON
  // =========================================================================
  // Axon bouton border
  el('rect', {
    x: synLeft + 15,
    y: preY - 14,
    width: synRight - synLeft - 30,
    height: 48,
    rx: '14',
    fill: 'rgba(255, 207, 107, 0.04)',
    stroke: 'rgba(255, 207, 107, 0.4)',
    'stroke-width': '1.2',
  }, preGroup);

  txt(preGroup, {
    x: synLeft + 28,
    y: preY + 4,
    fill: C.excite,
    'font-size': '10',
    'font-weight': '700',
    'letter-spacing': '0.04em',
  }, 'PRESYNAPTIC TERMINAL');

  txt(preGroup, {
    x: synLeft + 28,
    y: preY + 18,
    fill: 'rgba(233,235,245,0.45)',
    'font-size': '8.5',
  }, 'Glutamate-filled synaptic vesicles');

  // Vesicles in terminal
  const vesicleCoords = [
    { x: synMidX - 110, y: preY + 12 },
    { x: synMidX - 70, y: preY + 4 },
    { x: synMidX - 35, y: preY + 16 },
    { x: synMidX + 10, y: preY + 6 },
    { x: synMidX + 50, y: preY + 14 },
    { x: synMidX + 90, y: preY + 5 },
    { x: synMidX + 130, y: preY + 12 },
  ];
  for (const vc of vesicleCoords) {
    el('circle', {
      cx: vc.x,
      cy: vc.y,
      r: '6.5',
      fill: 'rgba(255, 207, 107, 0.18)',
      stroke: C.excite,
      'stroke-width': '1.1',
    }, preGroup);
    // Glutamate payload dots inside vesicle
    el('circle', { cx: vc.x - 2, cy: vc.y - 1, r: '1.2', fill: C.excite }, preGroup);
    el('circle', { cx: vc.x + 2, cy: vc.y - 1, r: '1.2', fill: C.excite }, preGroup);
    el('circle', { cx: vc.x, cy: vc.y + 2, r: '1.2', fill: C.excite }, preGroup);
  }

  // =========================================================================
  // 2. SYNAPTIC CLEFT (x: synLeft..synRight, y: cleftY)
  // =========================================================================
  txt(cleftGroup, {
    x: synLeft + 16,
    y: cleftY + 6,
    fill: C.muted,
    'font-size': '9',
    'font-weight': '600',
    'letter-spacing': '0.04em',
  }, 'SYNAPTIC CLEFT (20 nm)');

  const cleftStatus = txt(cleftGroup, {
    x: synRight - 16,
    y: cleftY + 6,
    'text-anchor': 'end',
    fill: C.excite,
    'font-size': '9',
    'font-weight': '600',
  }, 'Glutamate: baseline');

  // Glutamate particles drifting in cleft
  const gluParticlesGroup = el('g', { class: 'glu-cloud' }, cleftGroup);
  const gluParticleNodes = [];
  for (let i = 0; i < 28; i++) {
    const dot = el('circle', {
      cx: synMidX - 160 + (i * 320) / 28 + (i % 3) * 4,
      cy: cleftY + 4 + (i % 4) * 6,
      r: '2',
      fill: C.excite,
      opacity: '0.1',
    }, gluParticlesGroup);
    gluParticleNodes.push(dot);
  }

  // =========================================================================
  // 3. DENDRITIC SPINE & POSTSYNAPTIC DENSITY
  // =========================================================================
  // Spine head outline & interior: drawn with dynamic path
  const spinePath = el('path', {
    fill: `url(#${spineGradId})`,
    stroke: 'rgba(125, 240, 192, 0.45)',
    'stroke-width': '1.5',
    'stroke-linecap': 'round',
  }, postGroup);

  // Postsynaptic Density (PSD-95 scaffold band)
  const psdBar = el('rect', {
    x: synMidX - 160,
    y: postMembraneY + 12,
    width: 320,
    height: 7,
    rx: '3.5',
    fill: 'rgba(185, 140, 255, 0.4)',
    stroke: 'rgba(185, 140, 255, 0.7)',
    'stroke-width': '0.8',
  }, postGroup);

  txt(postGroup, {
    x: synLeft + 16,
    y: postMembraneY + 8,
    fill: C.muted,
    'font-size': '9',
    'font-weight': '600',
    'letter-spacing': '0.04em',
  }, 'POSTSYNAPTIC DENSITY (PSD)');

  // ------------------------------------------------ Receptor Channels
  // Left & Right AMPA channels; Center NMDA channel
  // AMPA Channel 1 (Left)
  const ampa1X = synMidX - 95;
  const ampa1 = el('g', { class: 'ampa-channel-1' }, postGroup);
  el('rect', { x: ampa1X - 14, y: postMembraneY - 10, width: 28, height: 22, rx: '4', fill: 'rgba(255, 207, 107, 0.25)', stroke: C.excite, 'stroke-width': '1.3' }, ampa1);
  el('line', { x1: ampa1X, y1: postMembraneY - 10, x2: ampa1X, y2: postMembraneY + 12, stroke: '#06070b', 'stroke-width': '3' }, ampa1);
  txt(ampa1, { x: ampa1X, y: postMembraneY + 28, 'text-anchor': 'middle', fill: C.excite, 'font-size': '8.5', 'font-weight': '700' }, 'AMPA');
  const naStream1 = el('path', {
    d: `M${ampa1X} ${cleftY + 12} L${ampa1X} ${postMembraneY + 36}`,
    stroke: C.excite,
    'stroke-width': '2.2',
    'stroke-linecap': 'round',
    'stroke-dasharray': '3 3',
    opacity: '0.4',
  }, ampa1);
  glow(naStream1);

  // AMPA Channel 2 (Right of center)
  const ampa2X = synMidX + 95;
  const ampa2 = el('g', { class: 'ampa-channel-2' }, postGroup);
  el('rect', { x: ampa2X - 14, y: postMembraneY - 10, width: 28, height: 22, rx: '4', fill: 'rgba(255, 207, 107, 0.25)', stroke: C.excite, 'stroke-width': '1.3' }, ampa2);
  el('line', { x1: ampa2X, y1: postMembraneY - 10, x2: ampa2X, y2: postMembraneY + 12, stroke: '#06070b', 'stroke-width': '3' }, ampa2);
  txt(ampa2, { x: ampa2X, y: postMembraneY + 28, 'text-anchor': 'middle', fill: C.excite, 'font-size': '8.5', 'font-weight': '700' }, 'AMPA');
  const naStream2 = el('path', {
    d: `M${ampa2X} ${cleftY + 12} L${ampa2X} ${postMembraneY + 36}`,
    stroke: C.excite,
    'stroke-width': '2.2',
    'stroke-linecap': 'round',
    'stroke-dasharray': '3 3',
    opacity: '0.4',
  }, ampa2);
  glow(naStream2);

  // Plasticity AMPA Slot 3 (Inserted during LTP, removed during LTD)
  const ampa3X = synMidX - 145;
  const ampa3 = el('g', { class: 'ampa-channel-inserted', opacity: '0.2' }, postGroup);
  el('rect', { x: ampa3X - 12, y: postMembraneY - 8, width: 24, height: 20, rx: '4', fill: 'rgba(255, 207, 107, 0.25)', stroke: C.excite, 'stroke-width': '1.2' }, ampa3);
  txt(ampa3, { x: ampa3X, y: postMembraneY + 26, 'text-anchor': 'middle', fill: C.excite, 'font-size': '7.5', 'font-weight': '600' }, '+AMPA');

  // Plasticity AMPA Slot 4 (Inserted during LTP, removed during LTD)
  const ampa4X = synMidX + 145;
  const ampa4 = el('g', { class: 'ampa-channel-inserted-2', opacity: '0.2' }, postGroup);
  el('rect', { x: ampa4X - 12, y: postMembraneY - 8, width: 24, height: 20, rx: '4', fill: 'rgba(255, 207, 107, 0.25)', stroke: C.excite, 'stroke-width': '1.2' }, ampa4);
  txt(ampa4, { x: ampa4X, y: postMembraneY + 26, 'text-anchor': 'middle', fill: C.excite, 'font-size': '7.5', 'font-weight': '600' }, '+AMPA');

  // ------------------------------------------------ NMDA Channel (Center)
  const nmdaX = synMidX;
  const nmdaGroup = el('g', { class: 'nmda-channel' }, postGroup);
  // Outer channel barrel
  el('rect', {
    x: nmdaX - 22,
    y: postMembraneY - 12,
    width: 44,
    height: 26,
    rx: '5',
    fill: 'rgba(68, 215, 182, 0.2)',
    stroke: '#44d7b6',
    'stroke-width': '1.5',
  }, nmdaGroup);

  // Central pore opening
  el('rect', {
    x: nmdaX - 8,
    y: postMembraneY - 12,
    width: 16,
    height: 26,
    fill: '#06070b',
  }, nmdaGroup);

  txt(nmdaGroup, {
    x: nmdaX,
    y: postMembraneY + 28,
    'text-anchor': 'middle',
    fill: '#44d7b6',
    'font-size': '9',
    'font-weight': '700',
  }, 'NMDA');

  // Calcium stream flowing through NMDA when open and unblocked
  const caStream = el('path', {
    d: `M${nmdaX} ${cleftY + 14} L${nmdaX} ${postMembraneY + 68}`,
    stroke: C.calcium,
    'stroke-width': '3.2',
    'stroke-linecap': 'round',
    'stroke-dasharray': '4 3',
    opacity: '0',
  }, nmdaGroup);
  glow(caStream);

  // Visible Magnesium Plug (Mg2+) sitting in the pore or popped out!
  const mgPlug = el('g', { class: 'mg-plug' }, nmdaGroup);
  const mgCircle = el('circle', {
    cx: nmdaX,
    cy: postMembraneY, // rests at postMembraneY when blocked, pops up to cleftY + 12 when unblocked
    r: '7.5',
    fill: '#c084fc',
    stroke: '#ffffff',
    'stroke-width': '1.2',
  }, mgPlug);
  glow(mgCircle);
  const mgLabel = txt(mgPlug, {
    x: nmdaX,
    y: postMembraneY + 3,
    'text-anchor': 'middle',
    fill: '#06070b',
    'font-size': '7.5',
    'font-weight': '800',
  }, 'Mg²⁺');

  // Status banner under NMDA pore
  const mgStatusText = txt(nmdaGroup, {
    x: nmdaX,
    y: postMembraneY + 44,
    'text-anchor': 'middle',
    fill: '#c084fc',
    'font-size': '8.5',
    'font-weight': '600',
  }, 'Mg²⁺ plug corks pore at -65 mV');

  // ------------------------------------------------ Spine Interior: Enzymes & Endosomes
  // Intracellular Reserve Endosome (holding spare AMPA receptors or internalizing them)
  const endosomeX = synMidX - 110;
  const endosomeY = postMembraneY + 130;
  const endosomeGroup = el('g', { class: 'endosome-pool' }, postGroup);
  el('circle', {
    cx: endosomeX,
    cy: endosomeY,
    r: '22',
    fill: 'rgba(185, 140, 255, 0.12)',
    stroke: 'rgba(185, 140, 255, 0.5)',
    'stroke-width': '1',
    'stroke-dasharray': '3 2',
  }, endosomeGroup);
  txt(endosomeGroup, {
    x: endosomeX,
    y: endosomeY - 4,
    'text-anchor': 'middle',
    fill: C.dopamine,
    'font-size': '7.5',
    'font-weight': '600',
  }, 'Endosome');
  txt(endosomeGroup, {
    x: endosomeX,
    y: endosomeY + 7,
    'text-anchor': 'middle',
    fill: 'rgba(233,235,245,0.5)',
    'font-size': '7',
  }, 'AMPA reserve');

  // Mini AMPA icons inside endosome
  el('rect', { x: endosomeX - 12, y: endosomeY + 10, width: 8, height: 5, rx: '1', fill: C.excite }, endosomeGroup);
  el('rect', { x: endosomeX + 4, y: endosomeY + 10, width: 8, height: 5, rx: '1', fill: C.excite }, endosomeGroup);

  // CaMKII enzyme indicator box (x: synMidX - 25..synMidX + 130, y: postMembraneY + 85)
  const camkiiBox = el('g', { class: 'enzyme-camkii' }, postGroup);
  const camkiiRect = el('rect', {
    x: synMidX + 10,
    y: postMembraneY + 80,
    width: 140,
    height: 34,
    rx: '6',
    fill: 'rgba(255, 207, 107, 0.08)',
    stroke: 'rgba(255, 207, 107, 0.3)',
    'stroke-width': '1',
  }, camkiiBox);
  txt(camkiiBox, {
    x: synMidX + 18,
    y: postMembraneY + 95,
    fill: C.excite,
    'font-size': '8.5',
    'font-weight': '700',
  }, 'CaMKII Kinase (LTP)');
  const camkiiStatus = txt(camkiiBox, {
    x: synMidX + 18,
    y: postMembraneY + 107,
    fill: 'rgba(233,235,245,0.55)',
    'font-size': '8',
  }, 'Inactive (needs Ca²⁺ > 1.2 µM)');

  // Calcineurin phosphatase indicator box
  const caNBox = el('g', { class: 'enzyme-calcineurin' }, postGroup);
  const caNRect = el('rect', {
    x: synMidX + 10,
    y: postMembraneY + 122,
    width: 140,
    height: 34,
    rx: '6',
    fill: 'rgba(255, 107, 125, 0.08)',
    stroke: 'rgba(255, 107, 125, 0.3)',
    'stroke-width': '1',
  }, caNBox);
  txt(caNBox, {
    x: synMidX + 18,
    y: postMembraneY + 137,
    fill: C.inhibit,
    'font-size': '8.5',
    'font-weight': '700',
  }, 'Calcineurin / PP2B (LTD)');
  const caNStatus = txt(caNBox, {
    x: synMidX + 18,
    y: postMembraneY + 149,
    fill: 'rgba(233,235,245,0.55)',
    'font-size': '8',
  }, 'Inactive (0.3 - 0.8 µM Ca²⁺)');

  // Spine Volume & Calcium Readout at bottom of spine
  const spineVolBadge = txt(postGroup, {
    x: synMidX,
    y: postMembraneY + 185,
    'text-anchor': 'middle',
    fill: C.calcium,
    'font-size': '9',
    'font-weight': '600',
  }, 'Spine head volume: 100% (baseline)');

  const spineCaBadge = txt(postGroup, {
    x: synMidX,
    y: postMembraneY + 200,
    'text-anchor': 'middle',
    fill: 'rgba(233,235,245,0.6)',
    'font-size': '8.5',
  }, '[Ca²⁺]i: 0.08 µM (resting)');

  // =========================================================================
  // 4. RIGHT SIDE: METERS & OSCILLOSCOPE TRACES
  // =========================================================================

  // ------------------------------------------------ Top: EPSP Oscilloscope
  el('rect', {
    x: rightLeft,
    y: scopeTop,
    width: rightRight - rightLeft,
    height: scopeBottom - scopeTop,
    rx: '8',
    fill: '#080a11',
    stroke: 'rgba(190,200,255,0.2)',
    'stroke-width': '1',
  }, rightGroup);

  txt(rightGroup, {
    x: rightLeft + 12,
    y: scopeTop + 16,
    fill: C.ink,
    'font-size': '10',
    'font-weight': '700',
  }, 'POSTSYNAPTIC POTENTIAL (EPSP)');

  txt(rightGroup, {
    x: rightRight - 12,
    y: scopeTop + 16,
    'text-anchor': 'end',
    fill: C.muted,
    'font-size': '8.5',
  }, 'Before vs After Plasticity');

  // Oscilloscope grid lines
  const gridYMid = (scopeTop + 24 + scopeBottom - 18) / 2;
  el('line', { x1: rightLeft + 10, y1: scopeBottom - 18, x2: rightRight - 10, y2: scopeBottom - 18, stroke: 'rgba(190,200,255,0.12)', 'stroke-width': '1' }, rightGroup);
  el('line', { x1: rightLeft + 10, y1: gridYMid, x2: rightRight - 10, y2: gridYMid, stroke: 'rgba(190,200,255,0.08)', 'stroke-dasharray': '3 3' }, rightGroup);
  el('line', { x1: rightLeft + 10, y1: scopeTop + 28, x2: rightRight - 10, y2: scopeTop + 28, stroke: 'rgba(190,200,255,0.08)', 'stroke-dasharray': '3 3' }, rightGroup);

  txt(rightGroup, { x: rightLeft + 12, y: scopeBottom - 22, fill: C.muted, 'font-size': '8' }, '-65 mV (rest)');
  txt(rightGroup, { x: rightLeft + 12, y: gridYMid - 4, fill: C.muted, 'font-size': '8' }, '-50 mV');
  txt(rightGroup, { x: rightLeft + 12, y: scopeTop + 36, fill: C.muted, 'font-size': '8' }, '-35 mV (potentiated)');

  // Baseline "Before" Trace (Dashed silver)
  const beforeTrace = el('path', {
    fill: 'none',
    stroke: 'rgba(233,235,245,0.35)',
    'stroke-width': '1.5',
    'stroke-dasharray': '3 3',
  }, rightGroup);

  // Current "After" Trace (Solid, glowing gold/mint)
  const afterTrace = el('path', {
    fill: 'none',
    stroke: C.excite,
    'stroke-width': '2.4',
    'stroke-linecap': 'round',
  }, rightGroup);
  glow(afterTrace);

  // Status badges under EPSP scope
  const epspAmpBadge = txt(rightGroup, {
    x: rightLeft + 12,
    y: scopeBottom - 4,
    fill: C.excite,
    'font-size': '9',
    'font-weight': '700',
  }, 'EPSP Peak: +15.0 mV');

  const weightBadge = txt(rightGroup, {
    x: rightRight - 12,
    y: scopeBottom - 4,
    'text-anchor': 'end',
    fill: C.calcium,
    'font-size': '9',
    'font-weight': '700',
  }, 'Strength: 100% (W = 1.00x)');

  // ------------------------------------------------ Bottom: Magnesium Block & Coincidence Curve
  el('rect', {
    x: rightLeft,
    y: mgPlotTop,
    width: rightRight - rightLeft,
    height: mgPlotBottom - mgPlotTop,
    rx: '8',
    fill: '#080a11',
    stroke: 'rgba(190,200,255,0.2)',
    'stroke-width': '1',
  }, rightGroup);

  txt(rightGroup, {
    x: rightLeft + 12,
    y: mgPlotTop + 16,
    fill: C.ink,
    'font-size': '10',
    'font-weight': '700',
  }, 'MG²⁺ VOLTAGE UNBLOCK: B(V)');

  txt(rightGroup, {
    x: rightRight - 12,
    y: mgPlotTop + 16,
    'text-anchor': 'end',
    fill: '#c084fc',
    'font-size': '8.5',
  }, '1.2 mM [Mg²⁺]o');

  // Curve axes
  const plotX0 = rightLeft + 36;
  const plotX1 = rightRight - 20;
  const plotY0 = mgPlotBottom - 24;
  const plotY1 = mgPlotTop + 32;

  el('line', { x1: plotX0, y1: plotY0, x2: plotX1, y2: plotY0, stroke: 'rgba(190,200,255,0.25)', 'stroke-width': '1' }, rightGroup);
  el('line', { x1: plotX0, y1: plotY0, x2: plotX0, y2: plotY1, stroke: 'rgba(190,200,255,0.25)', 'stroke-width': '1' }, rightGroup);

  txt(rightGroup, { x: plotX0 - 6, y: plotY0 + 3, 'text-anchor': 'end', fill: C.muted, 'font-size': '8' }, '0%');
  txt(rightGroup, { x: plotX0 - 6, y: (plotY0 + plotY1) / 2 + 3, 'text-anchor': 'end', fill: C.muted, 'font-size': '8' }, '50%');
  txt(rightGroup, { x: plotX0 - 6, y: plotY1 + 3, 'text-anchor': 'end', fill: C.muted, 'font-size': '8' }, '100%');

  txt(rightGroup, { x: plotX0, y: plotY0 + 13, 'text-anchor': 'middle', fill: C.muted, 'font-size': '7.5' }, '-80');
  txt(rightGroup, { x: (plotX0 + plotX1) / 2, y: plotY0 + 13, 'text-anchor': 'middle', fill: C.muted, 'font-size': '7.5' }, '-30 mV');
  txt(rightGroup, { x: plotX1, y: plotY0 + 13, 'text-anchor': 'end', fill: C.muted, 'font-size': '7.5' }, '+20');

  // Pre-render the B(V) curve
  const mgCurvePoints = world.mgBlockCurve({ vMin: -80, vMax: 20, steps: 80 });
  const vxToPx = lin(-80, 20, plotX0, plotX1);
  const byToPx = lin(0, 1.0, plotY0, plotY1);

  let dCurve = '';
  for (let i = 0; i < mgCurvePoints.length; i++) {
    const pt = mgCurvePoints[i];
    const x = vxToPx(pt.v).toFixed(1);
    const y = byToPx(pt.unblocked).toFixed(1);
    dCurve += `${i === 0 ? 'M' : 'L'}${x} ${y} `;
  }
  el('path', {
    d: dCurve.trim(),
    fill: 'none',
    stroke: '#c084fc',
    'stroke-width': '2',
    'stroke-linecap': 'round',
  }, rightGroup);

  // Operating dot on B(V) curve
  const mgDot = el('circle', {
    cx: vxToPx(-65),
    cy: byToPx(world.mgBlock(-65)),
    r: '5',
    fill: '#c084fc',
    stroke: '#ffffff',
    'stroke-width': '1.2',
  }, rightGroup);
  glow(mgDot);

  // Coincidence Status readout line
  const coincidenceBanner = txt(rightGroup, {
    x: (rightLeft + rightRight) / 2,
    y: mgPlotBottom - 8,
    'text-anchor': 'middle',
    fill: C.calcium,
    'font-size': '8.5',
    'font-weight': '600',
  }, 'Coincidence: Glutamate + Depolarization needed');

  // =========================================================================
  // HELPER REBUILD FUNCTION FOR DISPLAY
  // =========================================================================
  function updateSpineShape(volMultiplier) {
    // Dynamic mushroom spine geometry based on volume
    // Head expands horizontally and vertically
    const headWidth = Math.max(120, Math.min(220, 160 * Math.pow(volMultiplier, 0.45)));
    const headHeight = Math.max(90, Math.min(160, 120 * Math.pow(volMultiplier, 0.4)));
    const neckWidth = Math.max(34, Math.min(54, 42 * Math.pow(volMultiplier, 0.25)));

    const leftX = synMidX - headWidth;
    const rightX = synMidX + headWidth;
    const bottomY = postMembraneY + headHeight + 10;
    const neckLeft = synMidX - neckWidth;
    const neckRight = synMidX + neckWidth;

    const pathData = `
      M ${synMidX - 180} ${postMembraneY}
      Q ${leftX} ${postMembraneY} ${leftX} ${postMembraneY + headHeight * 0.45}
      C ${leftX} ${bottomY} ${neckLeft - 20} ${bottomY} ${neckLeft} ${bottomY + 50}
      L ${neckRight} ${bottomY + 50}
      C ${neckRight + 20} ${bottomY} ${rightX} ${bottomY} ${rightX} ${postMembraneY + headHeight * 0.45}
      Q ${rightX} ${postMembraneY} ${synMidX + 180} ${postMembraneY}
    `.trim();

    spinePath.setAttribute('d', pathData);
  }

  function updateEpspDisplay(w) {
    // Render Before (W=1.0) and After traces
    const beforePts = world.epspWaveform({ weight: 1.0, duration: 0.045 });
    const afterPts = world.epspWaveform({ weight: w, duration: 0.045 });

    const txToPx = lin(0, 0.045, rightLeft + 30, rightRight - 20);
    const vyToPx = lin(-65, -30, scopeBottom - 18, scopeTop + 32);

    let dB = '';
    for (let i = 0; i < beforePts.length; i++) {
      const p = beforePts[i];
      dB += `${i === 0 ? 'M' : 'L'}${txToPx(p.t).toFixed(1)} ${vyToPx(p.v).toFixed(1)} `;
    }
    beforeTrace.setAttribute('d', dB.trim());

    let dA = '';
    for (let i = 0; i < afterPts.length; i++) {
      const p = afterPts[i];
      dA += `${i === 0 ? 'M' : 'L'}${txToPx(p.t).toFixed(1)} ${vyToPx(p.v).toFixed(1)} `;
    }
    afterTrace.setAttribute('d', dA.trim());

    const peakDelta = (15.0 * w).toFixed(1);
    epspAmpBadge.textContent = `EPSP Peak: +${peakDelta} mV`;
    weightBadge.textContent = `Strength: ${Math.round(w * 100)}% (W = ${w.toFixed(2)}x)`;

    if (w > 1.2) {
      afterTrace.setAttribute('stroke', C.calcium);
      epspAmpBadge.setAttribute('fill', C.calcium);
    } else if (w < 0.8) {
      afterTrace.setAttribute('stroke', C.inhibit);
      epspAmpBadge.setAttribute('fill', C.inhibit);
    } else {
      afterTrace.setAttribute('stroke', C.excite);
      epspAmpBadge.setAttribute('fill', C.excite);
    }
  }

  function applyProtocol(protoKey) {
    activeProtocol = protoKey;
    simData = world.protocolSimulation({
      protocol: activeProtocol,
      initialWeight: currentWeight,
    });
    if (clock) clock.seek(world.WINDOW[0]);
  }

  // Initial draw
  let lastRenderedWeight = currentWeight;
  let lastRenderedVol = 1.0;
  updateSpineShape(lastRenderedVol);
  updateEpspDisplay(lastRenderedWeight);

  // =========================================================================
  // 5. INTERACTIVE CONTROLS DOCK
  // =========================================================================
  let unsubClock = null;

  if (setControls) {
    const ctrls = document.createElement('div');
    ctrls.className = 'dock-ctrl-group';
    ctrls.style.display = 'flex';
    ctrls.style.flexWrap = 'wrap';
    ctrls.style.alignItems = 'center';
    ctrls.style.gap = '8px';

    // Protocol switcher buttons
    const btnBaseline = document.createElement('button');
    btnBaseline.type = 'button';
    btnBaseline.className = 'dock-btn';
    btnBaseline.setAttribute('aria-pressed', activeProtocol === 'baseline' ? 'true' : 'false');
    btnBaseline.textContent = '1 Hz Test Pulse';

    const btnLtp = document.createElement('button');
    btnLtp.type = 'button';
    btnLtp.className = 'dock-btn';
    btnLtp.setAttribute('aria-pressed', activeProtocol === 'ltp' ? 'true' : 'false');
    btnLtp.textContent = '100 Hz Tetanus (LTP)';

    const btnLtd = document.createElement('button');
    btnLtd.type = 'button';
    btnLtd.className = 'dock-btn';
    btnLtd.setAttribute('aria-pressed', activeProtocol === 'ltd' ? 'true' : 'false');
    btnLtd.textContent = '1 Hz Low-Freq (LTD)';

    function setBtnStates(active) {
      btnBaseline.setAttribute('aria-pressed', active === 'baseline' ? 'true' : 'false');
      btnLtp.setAttribute('aria-pressed', active === 'ltp' ? 'true' : 'false');
      btnLtd.setAttribute('aria-pressed', active === 'ltd' ? 'true' : 'false');
    }

    btnBaseline.addEventListener('click', () => {
      useManualVoltage = false;
      setBtnStates('baseline');
      currentWeight = persistentWeight;
      applyProtocol('baseline');
    });

    btnLtp.addEventListener('click', () => {
      useManualVoltage = false;
      setBtnStates('ltp');
      currentWeight = 1.0;
      baseWeight = 1.0;
      applyProtocol('ltp');
      if (scene) scene.firePulse('entorhinal-cortex', 'hippocampus', { color: '#ffcf6b' });
    });

    btnLtd.addEventListener('click', () => {
      useManualVoltage = false;
      setBtnStates('ltd');
      currentWeight = 1.0;
      baseWeight = 1.0;
      applyProtocol('ltd');
    });

    // Reset button
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'dock-btn';
    resetBtn.textContent = 'Reset Synapse';
    resetBtn.addEventListener('click', () => {
      currentWeight = 1.0;
      baseWeight = 1.0;
      persistentWeight = 1.0;
      useManualVoltage = false;
      setBtnStates('baseline');
      applyProtocol('baseline');
      updateEpspDisplay(1.0);
      updateSpineShape(1.0);
      lastRenderedWeight = 1.0;
      lastRenderedVol = 1.0;
    });

    // Play / Pause button
    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'dock-btn';
    playBtn.textContent = isPlaying ? 'Pause' : 'Play';
    playBtn.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
    playBtn.addEventListener('click', () => {
      if (!clock) return;
      if (clock.playing) clock.pause();
      else clock.play();
    });

    if (clock) {
      unsubClock = clock.subscribe((_t, clk) => {
        isPlaying = clk.playing;
        playBtn.textContent = clk.playing ? 'Pause' : 'Play';
        playBtn.setAttribute('aria-pressed', clk.playing ? 'true' : 'false');
      });
    }

    // Voltage Slider: Drag to unblock Mg2+ directly!
    const vGroup = document.createElement('div');
    vGroup.style.display = 'flex';
    vGroup.style.alignItems = 'center';
    vGroup.style.gap = '6px';
    vGroup.style.marginLeft = '8px';

    const vLabel = document.createElement('span');
    vLabel.className = 'dock-label';
    vLabel.style.fontSize = '11px';
    vLabel.textContent = `Clamp V: ${manualVoltage > 0 ? '+' : ''}${manualVoltage.toFixed(0)} mV`;

    const vSlider = document.createElement('input');
    vSlider.type = 'range';
    vSlider.className = 'dock-range';
    vSlider.min = '-80';
    vSlider.max = '10';
    vSlider.step = '1';
    vSlider.value = String(manualVoltage);
    vSlider.style.width = '90px';

    vSlider.addEventListener('input', (e) => {
      useManualVoltage = true;
      manualVoltage = parseFloat(e.target.value);
      vLabel.textContent = `Clamp V: ${manualVoltage > 0 ? '+' : ''}${manualVoltage.toFixed(0)} mV`;
    });

    vGroup.appendChild(vLabel);
    vGroup.appendChild(vSlider);

    ctrls.appendChild(btnBaseline);
    ctrls.appendChild(btnLtp);
    ctrls.appendChild(btnLtd);
    ctrls.appendChild(resetBtn);
    ctrls.appendChild(playBtn);
    ctrls.appendChild(vGroup);

    setControls(ctrls);
  }

  // =========================================================================
  // 6. RENDER TICK (CALLED PER FRAME VIA STAGE CLOCK)
  // =========================================================================
  return {
    render(t) {
      if (!simData || !simData.times) return;

      // Map time t into the simulation data array
      const times = simData.times;
      const tClamped = Math.max(times[0], Math.min(times[times.length - 1], t));
      let idx = 0;
      for (let i = 0; i < times.length - 1; i++) {
        if (tClamped >= times[i] && tClamped <= times[i + 1]) {
          idx = i;
          break;
        }
      }

      // Sample simulation state
      let v = simData.vTrace[idx];
      if (useManualVoltage) v = manualVoltage;
      const glu = simData.gluTrace[idx];
      const ca = simData.caTrace[idx];
      const camkii = simData.camkiiTrace[idx];
      const calcineurin = simData.calcineurinTrace[idx];
      const w = simData.weightTrace[idx];
      const vol = simData.spineVolTrace[idx];
      if (activeProtocol !== 'baseline') {
        currentWeight = w;
        persistentWeight = simData.weightTrace[simData.weightTrace.length - 1];
      }

      // 1. Update Glutamate Cloud in Cleft
      const gluOpacity = Math.max(0.08, Math.min(0.95, glu * 0.95));
      cleftStatus.textContent = glu > 0.4 ? 'Glutamate: BURST' : glu > 0.1 ? 'Glutamate: active' : 'Glutamate: basal';
      cleftStatus.setAttribute('fill', glu > 0.2 ? C.excite : C.muted);
      for (let i = 0; i < gluParticleNodes.length; i++) {
        const dot = gluParticleNodes[i];
        const jitter = Math.sin(t * 1.5 + i) * 1.5;
        dot.setAttribute('opacity', gluOpacity.toFixed(2));
        dot.setAttribute('cy', (cleftY + 4 + (i % 4) * 6 + jitter).toFixed(1));
      }

      // 2. AMPA Sodium Currents
      const ampaFlowOpacity = (glu * (w / 1.0)).toFixed(2);
      naStream1.setAttribute('opacity', ampaFlowOpacity);
      naStream2.setAttribute('opacity', ampaFlowOpacity);

      // Inserted / internalized AMPA slots
      if (w > 1.2) {
        ampa3.setAttribute('opacity', '0.9');
        ampa4.setAttribute('opacity', '0.9');
      } else if (w < 0.75) {
        ampa3.setAttribute('opacity', '0.05');
        ampa4.setAttribute('opacity', '0.05');
      } else {
        ampa3.setAttribute('opacity', '0.2');
        ampa4.setAttribute('opacity', '0.2');
      }

      // 3. Magnesium Block & Unblocking
      const unblocked = world.mgBlock(v);
      const blocked = 1 - unblocked;

      // Physical position of Mg2+ plug:
      // When blocked: cy sits at postMembraneY (in the channel pore)
      // When unblocked: pops UP into the synaptic cleft (y: cleftY + 12)
      const mgY = postMembraneY - (unblocked * 32);
      mgPlug.setAttribute('transform', `translate(0, ${(-unblocked * 32).toFixed(1)})`);

      if (unblocked > 0.5) {
        mgCircle.setAttribute('fill', '#f43f5e'); // warm alert: expelled!
        mgStatusText.textContent = `Mg²⁺ expelled! (${Math.round(unblocked * 100)}% unblocked at ${v > 0 ? '+' : ''}${v.toFixed(0)} mV)`;
        mgStatusText.setAttribute('fill', C.calcium);
      } else {
        mgCircle.setAttribute('fill', '#c084fc');
        mgStatusText.textContent = `Mg²⁺ plug blocks pore (${Math.round(blocked * 100)}% blocked at ${v.toFixed(0)} mV)`;
        mgStatusText.setAttribute('fill', '#c084fc');
      }

      // 4. Calcium Stream through NMDA
      // Only flows if glutamate is present AND magnesium is unblocked!
      const caFlow = Math.max(0, Math.min(1.0, glu * unblocked * 1.5));
      caStream.setAttribute('opacity', caFlow.toFixed(2));

      // 5. Operating point on B(V) curve
      mgDot.setAttribute('cx', vxToPx(v).toFixed(1));
      mgDot.setAttribute('cy', byToPx(unblocked).toFixed(1));

      // 6. Coincidence Banner
      if (glu > 0.3 && unblocked > 0.45) {
        coincidenceBanner.textContent = 'COINCIDENCE DETECTED! Massive Ca²⁺ influx';
        coincidenceBanner.setAttribute('fill', C.calcium);
      } else if (glu > 0.3) {
        coincidenceBanner.textContent = 'Glutamate bound, but Mg²⁺ still blocks the pore';
        coincidenceBanner.setAttribute('fill', '#c084fc');
      } else if (unblocked > 0.45) {
        coincidenceBanner.textContent = 'Depolarized (Mg²⁺ out), but no glutamate bound';
        coincidenceBanner.setAttribute('fill', C.excite);
      } else {
        coincidenceBanner.textContent = 'Resting: glutamate basal, Mg²⁺ cork in place';
        coincidenceBanner.setAttribute('fill', C.muted);
      }

      // 7. Enzyme status badges
      if (camkii > 0.35) {
        camkiiRect.setAttribute('stroke', C.excite);
        camkiiRect.setAttribute('fill', 'rgba(255, 207, 107, 0.22)');
        camkiiStatus.textContent = 'ACTIVE: Phosphorylates & slots AMPA';
        camkiiStatus.setAttribute('fill', C.excite);
      } else {
        camkiiRect.setAttribute('stroke', 'rgba(255, 207, 107, 0.3)');
        camkiiRect.setAttribute('fill', 'rgba(255, 207, 107, 0.08)');
        camkiiStatus.textContent = 'Inactive (needs Ca²⁺ > 1.2 µM)';
        camkiiStatus.setAttribute('fill', 'rgba(233,235,245,0.55)');
      }

      if (calcineurin > 0.45 && camkii < 0.25) {
        caNRect.setAttribute('stroke', C.inhibit);
        caNRect.setAttribute('fill', 'rgba(255, 107, 125, 0.22)');
        caNStatus.textContent = 'ACTIVE: Endocytoses AMPA receptors';
        caNStatus.setAttribute('fill', C.inhibit);
      } else {
        caNRect.setAttribute('stroke', 'rgba(255, 107, 125, 0.3)');
        caNRect.setAttribute('fill', 'rgba(255, 107, 125, 0.08)');
        caNStatus.textContent = 'Inactive (0.3 - 0.8 µM Ca²⁺)';
        caNStatus.setAttribute('fill', 'rgba(233,235,245,0.55)');
      }

      // 8. Spine Volume & Badges
      if (Math.abs(vol - lastRenderedVol) > 0.002) {
        updateSpineShape(vol);
        lastRenderedVol = vol;
      }
      spineVolBadge.textContent = `Spine head volume: ${Math.round(vol * 100)}% (${vol > 1.15 ? 'expanded' : vol < 0.85 ? 'shrunken' : 'baseline'})`;
      spineCaBadge.textContent = `[Ca²⁺]i: ${ca.toFixed(2)} µM | PSD AMPA: ${ampaCount}`;

      // 9. EPSP Scope update
      if (Math.abs(w - lastRenderedWeight) > 0.002) {
        updateEpspDisplay(w);
        lastRenderedWeight = w;
      }
    },

    destroy() {
      if (unsubClock) unsubClock();
      if (svg.parentElement) svg.parentElement.removeChild(svg);
    },
  };
}

export default {
  type: 'plasticity',
  mount: mountPlasticity,
};
