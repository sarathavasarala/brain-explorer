import { NS, C, el, glowFilter, lin } from './svg.js';

let clipCounter = 0;

export default {
  type: 'action-potential',

  mount(container, props = {}, ctx = {}) {
    const { world, clock, setControls } = ctx;

    const W0 = world?.WINDOW ? world.WINDOW[0] : -1.0;
    const W1 = world?.WINDOW ? world.WINDOW[1] : 6.0;

    const width = 800;
    const height = 320;

    const svg = el('svg', {
      viewBox: `0 0 ${width} ${height}`,
      preserveAspectRatio: 'xMidYMid meet',
    }, container);

    const glowUrl = glowFilter(svg);
    const glow = (node) => {
      if (glowUrl !== 'none') node.setAttribute('filter', glowUrl);
      return node;
    };

    const txt = (parent, attrs, str) => {
      const t = el('text', { 'font-family': 'var(--display)', ...attrs }, parent);
      t.textContent = str;
      return t;
    };

    // ------------------------------------------------ state variables
    let stimulusAmp = props.stimulus ?? (props.subthreshold ? 6.0 : 25.0);
    let lidocaineDose = props.lidocaine ?? 0;
    let isMyelinated = props.myelinated !== undefined ? Boolean(props.myelinated) : true;
    let unsubClock = null;

    // Simulation cache
    let simPoints = null;

    function runSimulation() {
      const lidocaineFrac = world?.lidocaineBlockFraction
        ? world.lidocaineBlockFraction(lidocaineDose)
        : (lidocaineDose / 100);
      simPoints = world?.simulateAP
        ? world.simulateAP({
            I: stimulusAmp,
            duration: 0.5,
            lidocaine: lidocaineFrac,
            dt: 0.005,
            tStart: W0,
            tEnd: W1,
          })
        : [];
    }

    runSimulation();

    // ------------------------------------------------ SVG layout groups
    const defs = el('defs', {}, svg);

    // Gradients for channels and membrane
    const gradNa = el('linearGradient', { id: `grad-na-${clipCounter}`, x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#2ed9aa', 'stop-opacity': '0.85' }, gradNa);
    el('stop', { offset: '100%', 'stop-color': '#118a6a', 'stop-opacity': '0.95' }, gradNa);

    const gradK = el('linearGradient', { id: `grad-k-${clipCounter}`, x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#b98cff', 'stop-opacity': '0.85' }, gradK);
    el('stop', { offset: '100%', 'stop-color': '#7844c8', 'stop-opacity': '0.95' }, gradK);

    // Left Column: Membrane & Ion Channels (x: 12 to 360, y: 10 to 210)
    const membraneGroup = el('g', { class: 'ap-membrane-view' }, svg);

    // Right Column: Voltage Trace V(t) & Conductances (x: 375 to 788, y: 10 to 210)
    const traceGroup = el('g', { class: 'ap-trace-view' }, svg);

    // Bottom Area: Axon Conduction Track (x: 12 to 788, y: 220 to 312)
    const axonGroup = el('g', { class: 'ap-axon-view' }, svg);

    // ------------------------------------------------ Left: Membrane & Channels
    // Background panels
    el('rect', { x: 14, y: 14, width: 346, height: 198, rx: 6, fill: 'rgba(15,18,32,0.65)', stroke: 'rgba(190,200,255,0.12)', 'stroke-width': 1 }, membraneGroup);

    txt(membraneGroup, { x: 26, y: 30, fill: C.ink, 'font-size': 10.5, 'font-weight': 700, 'letter-spacing': '0.06em' }, 'LIPID BILAYER & VOLTAGE GATES');
    const stateBadge = txt(membraneGroup, { x: 348, y: 30, 'text-anchor': 'end', fill: C.excite, 'font-size': 10, 'font-weight': 600 }, 'Resting (-70 mV)');

    // Extracellular fluid (top) & Intracellular fluid (bottom)
    txt(membraneGroup, { x: 26, y: 46, fill: C.muted, 'font-size': 8.5 }, 'OUTSIDE: high Na+ (145 mM), low K+ (4 mM)');
    txt(membraneGroup, { x: 26, y: 188, fill: C.muted, 'font-size': 8.5 }, 'INSIDE: high K+ (140 mM), low Na+ (12 mM)');

    // Lipid bilayer sheets (y: 62 to 110)
    const bilayerY1 = 62;
    const bilayerY2 = 106;

    // Phospholipid head dots across the membrane (omitting channel gaps)
    const lipidsGroup = el('g', { class: 'phospholipids' }, membraneGroup);
    for (let x = 24; x <= 348; x += 9) {
      // Gaps for Na+ channel (x: 72..138), K+ channel (x: 182..248), Pump (x: 290..334)
      if ((x >= 70 && x <= 136) || (x >= 180 && x <= 246) || (x >= 288 && x <= 334)) continue;
      // Top monolayer
      el('circle', { cx: x, cy: bilayerY1, r: 3.2, fill: '#455078', opacity: '0.85' }, lipidsGroup);
      el('line', { x1: x, y1: bilayerY1 + 3, x2: x, y2: bilayerY1 + 14, stroke: 'rgba(120,135,180,0.4)', 'stroke-width': 1.2 }, lipidsGroup);
      // Bottom monolayer
      el('circle', { cx: x, cy: bilayerY2, r: 3.2, fill: '#455078', opacity: '0.85' }, lipidsGroup);
      el('line', { x1: x, y1: bilayerY2 - 3, x2: x, y2: bilayerY2 - 14, stroke: 'rgba(120,135,180,0.4)', 'stroke-width': 1.2 }, lipidsGroup);
    }

    // --- CHANNEL 1: Voltage-Gated Na+ Channel (NaV) at x = 104
    const naCenter = 104;
    const naPoreRadius = 14;
    const naGroup = el('g', { class: 'channel-na' }, membraneGroup);

    // Left and right protein walls
    el('path', {
      d: `M ${naCenter - 32} ${bilayerY1 - 8} Q ${naCenter - 14} ${bilayerY1} ${naCenter - naPoreRadius} 84 Q ${naCenter - 14} ${bilayerY2} ${naCenter - 32} ${bilayerY2 + 8} Z`,
      fill: `url(#grad-na-${clipCounter})`,
      stroke: '#2ed9aa',
      'stroke-width': 1.2,
    }, naGroup);
    el('path', {
      d: `M ${naCenter + 32} ${bilayerY1 - 8} Q ${naCenter + 14} ${bilayerY1} ${naCenter + naPoreRadius} 84 Q ${naCenter + 14} ${bilayerY2} ${naCenter + 32} ${bilayerY2 + 8} Z`,
      fill: `url(#grad-na-${clipCounter})`,
      stroke: '#2ed9aa',
      'stroke-width': 1.2,
    }, naGroup);

    txt(naGroup, { x: naCenter, y: bilayerY1 - 12, 'text-anchor': 'middle', fill: '#2ed9aa', 'font-size': 9.5, 'font-weight': 700 }, 'NaV Gate');

    // Na+ Activation gate leaves (m-gate): meet in the middle when m = 0, slide back when m = 1
    const naGateL = el('line', { x1: naCenter - 14, y1: 76, x2: naCenter, y2: 76, stroke: '#50ffd2', 'stroke-width': 3, 'stroke-linecap': 'round' }, naGroup);
    const naGateR = el('line', { x1: naCenter + 14, y1: 76, x2: naCenter, y2: 76, stroke: '#50ffd2', 'stroke-width': 3, 'stroke-linecap': 'round' }, naGroup);

    // Na+ Inactivation ball-and-chain (h-gate)
    const ballChain = el('g', { class: 'h-gate-ball-chain' }, naGroup);
    const chainPath = el('path', { fill: 'none', stroke: '#ffaa40', 'stroke-width': 1.8, 'stroke-dasharray': '2 2' }, ballChain);
    const inactBall = el('circle', { cx: naCenter, cy: 135, r: 6.5, fill: '#ff6b7d', stroke: '#ffbb77', 'stroke-width': 1.4 }, ballChain);
    glow(inactBall);
    const ballLabel = txt(ballChain, { x: naCenter, y: 148, 'text-anchor': 'middle', fill: '#ffaa40', 'font-size': 7.5, 'font-weight': 600 }, 'h ball');

    // Lidocaine plug badge inside Na+ channel
    const lidoBadge = el('g', { class: 'lidocaine-plug', opacity: 0 }, naGroup);
    el('rect', { x: naCenter - 12, y: 80, width: 24, height: 12, rx: 3, fill: '#ff4d6d', stroke: '#ffccd5', 'stroke-width': 1 }, lidoBadge);
    txt(lidoBadge, { x: naCenter, y: 89, 'text-anchor': 'middle', fill: '#ffffff', 'font-size': 7.5, 'font-weight': 800 }, 'LIDO');

    // Flowing Na+ ions
    const naIonGroup = el('g', { class: 'na-ions' }, naGroup);
    const naIonDots = [];
    for (let i = 0; i < 4; i++) {
      const dot = el('circle', { cx: naCenter, cy: 55 + i * 18, r: 2.8, fill: '#7df0c0', opacity: 0 }, naIonGroup);
      glow(dot);
      naIonDots.push(dot);
    }

    // --- CHANNEL 2: Voltage-Gated K+ Channel (KV) at x = 214
    const kCenter = 214;
    const kPoreRadius = 14;
    const kGroup = el('g', { class: 'channel-k' }, membraneGroup);

    // Protein walls
    el('path', {
      d: `M ${kCenter - 32} ${bilayerY1 - 8} Q ${kCenter - 14} ${bilayerY1} ${kCenter - kPoreRadius} 84 Q ${kCenter - 14} ${bilayerY2} ${kCenter - 32} ${bilayerY2 + 8} Z`,
      fill: `url(#grad-k-${clipCounter})`,
      stroke: '#b98cff',
      'stroke-width': 1.2,
    }, kGroup);
    el('path', {
      d: `M ${kCenter + 32} ${bilayerY1 - 8} Q ${kCenter + 14} ${bilayerY1} ${kCenter + kPoreRadius} 84 Q ${kCenter + 14} ${bilayerY2} ${kCenter + 32} ${bilayerY2 + 8} Z`,
      fill: `url(#grad-k-${clipCounter})`,
      stroke: '#b98cff',
      'stroke-width': 1.2,
    }, kGroup);

    txt(kGroup, { x: kCenter, y: bilayerY1 - 12, 'text-anchor': 'middle', fill: '#b98cff', 'font-size': 9.5, 'font-weight': 700 }, 'KV Gate');

    // K+ Activation gate leaves (n-gate) at cytoplasmic mouth
    const kGateL = el('line', { x1: kCenter - 14, y1: 96, x2: kCenter, y2: 96, stroke: '#d4b5ff', 'stroke-width': 3, 'stroke-linecap': 'round' }, kGroup);
    const kGateR = el('line', { x1: kCenter + 14, y1: 96, x2: kCenter, y2: 96, stroke: '#d4b5ff', 'stroke-width': 3, 'stroke-linecap': 'round' }, kGroup);

    // Flowing K+ ions (efflux upward)
    const kIonGroup = el('g', { class: 'k-ions' }, kGroup);
    const kIonDots = [];
    for (let i = 0; i < 4; i++) {
      const dot = el('circle', { cx: kCenter, cy: 105 - i * 18, r: 2.8, fill: '#d4b5ff', opacity: 0 }, kIonGroup);
      glow(dot);
      kIonDots.push(dot);
    }

    // --- ELEMENT 3: Na+/K+ Pump (ATPase) at x = 312
    const pumpCenter = 312;
    const pumpGroup = el('g', { class: 'nak-pump' }, membraneGroup);
    el('rect', { x: pumpCenter - 18, y: bilayerY1 - 4, width: 36, height: 46, rx: 5, fill: 'rgba(90,105,150,0.5)', stroke: '#90a0d0', 'stroke-width': 1 }, pumpGroup);
    txt(pumpGroup, { x: pumpCenter, y: bilayerY1 - 10, 'text-anchor': 'middle', fill: '#a0b0e0', 'font-size': 8, 'font-weight': 600 }, 'Na+/K+ Pump');
    txt(pumpGroup, { x: pumpCenter, y: 76, 'text-anchor': 'middle', fill: '#7df0c0', 'font-size': 7.5, 'font-weight': 700 }, '3 Na+ OUT');
    txt(pumpGroup, { x: pumpCenter, y: 88, 'text-anchor': 'middle', fill: '#b98cff', 'font-size': 7.5, 'font-weight': 700 }, '2 K+ IN');
    txt(pumpGroup, { x: pumpCenter, y: 100, 'text-anchor': 'middle', fill: '#ffcf6b', 'font-size': 7 }, '1 ATP');

    // ------------------------------------------------ Right: Live Trace V(t)
    el('rect', { x: 374, y: 14, width: 412, height: 198, rx: 6, fill: 'rgba(15,18,32,0.65)', stroke: 'rgba(190,200,255,0.12)', 'stroke-width': 1 }, traceGroup);

    txt(traceGroup, { x: 388, y: 30, fill: C.ink, 'font-size': 10.5, 'font-weight': 700, 'letter-spacing': '0.06em' }, 'MEMBRANE POTENTIAL V(t)');

    const plotLeft = 432;
    const plotRight = 770;
    const plotTop = 38;
    const plotBottom = 160;

    const xToPx = lin(W0, W1, plotLeft, plotRight);
    const yToPx = lin(-90, 45, plotBottom, plotTop);

    // Reference horizontal dashed lines
    // +30 mV Peak
    el('line', { x1: plotLeft, y1: yToPx(30), x2: plotRight, y2: yToPx(30), stroke: 'rgba(255,107,125,0.3)', 'stroke-width': 1, 'stroke-dasharray': '3 3' }, traceGroup);
    txt(traceGroup, { x: plotLeft - 6, y: yToPx(30) + 3, 'text-anchor': 'end', fill: '#ff8a98', 'font-size': 8.5 }, '+30 mV (Peak)');

    // 0 mV
    el('line', { x1: plotLeft, y1: yToPx(0), x2: plotRight, y2: yToPx(0), stroke: 'rgba(233,235,245,0.15)', 'stroke-width': 1 }, traceGroup);
    txt(traceGroup, { x: plotLeft - 6, y: yToPx(0) + 3, 'text-anchor': 'end', fill: C.muted, 'font-size': 8.5 }, '0 mV');

    // -55 mV Threshold
    el('line', { x1: plotLeft, y1: yToPx(-55), x2: plotRight, y2: yToPx(-55), stroke: 'rgba(255,207,107,0.5)', 'stroke-width': 1.2, 'stroke-dasharray': '4 3' }, traceGroup);
    txt(traceGroup, { x: plotLeft - 6, y: yToPx(-55) + 3, 'text-anchor': 'end', fill: C.excite, 'font-size': 8.5, 'font-weight': 600 }, '-55 mV (Threshold)');

    // -70 mV Resting
    el('line', { x1: plotLeft, y1: yToPx(-70), x2: plotRight, y2: yToPx(-70), stroke: 'rgba(125,240,192,0.4)', 'stroke-width': 1.2, 'stroke-dasharray': '3 3' }, traceGroup);
    txt(traceGroup, { x: plotLeft - 6, y: yToPx(-70) + 3, 'text-anchor': 'end', fill: '#7df0c0', 'font-size': 8.5 }, '-70 mV (Rest)');

    // Stimulus duration band at t = 0 to 0.5 ms
    const stimX1 = xToPx(0);
    const stimX2 = xToPx(0.5);
    el('rect', {
      x: stimX1,
      y: plotTop,
      width: Math.max(2, stimX2 - stimX1),
      height: plotBottom - plotTop,
      fill: 'rgba(255,207,107,0.08)',
      stroke: 'rgba(255,207,107,0.25)',
      'stroke-width': 0.8,
    }, traceGroup);
    txt(traceGroup, { x: (stimX1 + stimX2) / 2, y: plotTop - 4, 'text-anchor': 'middle', fill: C.excite, 'font-size': 7.5 }, 'STIM');

    // Axes
    el('line', { x1: plotLeft, y1: plotBottom, x2: plotRight, y2: plotBottom, stroke: 'rgba(190,200,255,0.25)', 'stroke-width': 1 }, traceGroup);
    el('line', { x1: plotLeft, y1: plotTop, x2: plotLeft, y2: plotBottom, stroke: 'rgba(190,200,255,0.25)', 'stroke-width': 1 }, traceGroup);

    // X-axis time ticks
    for (let tTick = 0; tTick <= 6; tTick += 1) {
      const tx = xToPx(tTick);
      el('line', { x1: tx, y1: plotBottom, x2: tx, y2: plotBottom + 4, stroke: 'rgba(190,200,255,0.3)', 'stroke-width': 1 }, traceGroup);
      txt(traceGroup, { x: tx, y: plotBottom + 13, 'text-anchor': 'middle', fill: C.muted, 'font-size': 8 }, `${tTick} ms`);
    }

    // Clip path for trace reveal
    const clipId = `ap-trace-clip-${++clipCounter}`;
    const traceClip = el('clipPath', { id: clipId }, defs);
    const clipRect = el('rect', { x: plotLeft - 2, y: 0, width: 0, height: height }, traceClip);

    // Static ghost curve (faint full AP trajectory)
    const ghostPath = el('path', { fill: 'none', stroke: 'rgba(190,200,255,0.14)', 'stroke-width': 1.5 }, traceGroup);

    // Dynamic revealed trace
    const activePath = el('path', {
      fill: 'none',
      stroke: '#50ffd2',
      'stroke-width': 2.4,
      'stroke-linecap': 'round',
      'clip-path': `url(#${clipId})`,
    }, traceGroup);
    glow(activePath);

    // Playhead vertical line & cursor dot
    const playhead = el('line', { x1: plotLeft, y1: plotTop - 4, x2: plotLeft, y2: plotBottom, stroke: 'rgba(233,235,245,0.35)', 'stroke-width': 1 }, traceGroup);
    const cursorDot = el('circle', { cx: plotLeft, cy: yToPx(-70), r: 4.5, fill: '#ffffff', stroke: '#50ffd2', 'stroke-width': 2 }, traceGroup);
    glow(cursorDot);

    // Conductance indicators bar (y: 182 to 204)
    const condBarGroup = el('g', { class: 'conductance-bars' }, traceGroup);
    txt(condBarGroup, { x: plotLeft, y: 194, fill: C.muted, 'font-size': 8.5 }, 'CONDUCTANCE:');

    // Na conductance label & pill
    const gNaPill = el('rect', { x: plotLeft + 80, y: 185, width: 44, height: 11, rx: 2, fill: 'rgba(46,217,170,0.18)', stroke: '#2ed9aa', 'stroke-width': 0.8 }, condBarGroup);
    const gNaText = txt(condBarGroup, { x: plotLeft + 102, y: 194, 'text-anchor': 'middle', fill: '#2ed9aa', 'font-size': 8, 'font-weight': 600 }, 'gNa: 0.0');

    // K conductance label & pill
    const gKPill = el('rect', { x: plotLeft + 134, y: 185, width: 44, height: 11, rx: 2, fill: 'rgba(185,140,255,0.18)', stroke: '#b98cff', 'stroke-width': 0.8 }, condBarGroup);
    const gKText = txt(condBarGroup, { x: plotLeft + 156, y: 194, 'text-anchor': 'middle', fill: '#b98cff', 'font-size': 8, 'font-weight': 600 }, 'gK: 0.4');

    const vReadout = txt(condBarGroup, { x: plotRight, y: 194, 'text-anchor': 'end', fill: C.ink, 'font-size': 9.5, 'font-weight': 700 }, '-70.0 mV');

    // ------------------------------------------------ Bottom: Axon Conduction Track
    el('rect', { x: 14, y: 222, width: 772, height: 86, rx: 6, fill: 'rgba(15,18,32,0.65)', stroke: 'rgba(190,200,255,0.12)', 'stroke-width': 1 }, axonGroup);

    txt(axonGroup, { x: 26, y: 238, fill: C.ink, 'font-size': 10, 'font-weight': 700, 'letter-spacing': '0.06em' }, 'AXON CONDUCTION:');
    const axonModeLabel = txt(axonGroup, { x: 146, y: 238, fill: C.muted, 'font-size': 9 }, '');
    const axonSpeedBadge = txt(axonGroup, { x: 772, y: 238, 'text-anchor': 'end', fill: C.excite, 'font-size': 9.5, 'font-weight': 600 }, '');

    // Axon cylinder tube (y: 252 to 284, height: 32)
    const axonTube = el('rect', { x: 40, y: 254, width: 720, height: 30, rx: 4, fill: '#14182b', stroke: 'rgba(190,200,255,0.22)', 'stroke-width': 1 }, axonGroup);

    // Myelin sheaths container (for myelinated mode)
    const myelinGroup = el('g', { class: 'myelin-sheaths' }, axonGroup);
    // Unmyelinated wave container (for unmyelinated mode)
    const waveGroup = el('g', { class: 'continuous-wave', opacity: 0 }, axonGroup);

    // 5 Nodes of Ranvier across the axon at x = 50, 220, 390, 560, 730
    const nodeXCoords = [52, 222, 392, 562, 732];
    const nodeDots = [];
    const nodeRings = [];
    const sheathRects = [];

    // Create 4 myelin sheaths spanning between nodes
    for (let i = 0; i < nodeXCoords.length - 1; i++) {
      const shX1 = nodeXCoords[i] + 9;
      const shX2 = nodeXCoords[i + 1] - 9;
      const sheath = el('rect', {
        x: shX1,
        y: 249,
        width: shX2 - shX1,
        height: 40,
        rx: 6,
        fill: 'rgba(56,120,255,0.28)',
        stroke: '#4da6ff',
        'stroke-width': 1.4,
      }, myelinGroup);
      sheathRects.push(sheath);

      txt(myelinGroup, { x: (shX1 + shX2) / 2, y: 273, 'text-anchor': 'middle', fill: '#99ccff', 'font-size': 8.5, 'font-weight': 600 }, 'Myelin Sheath');
    }

    // Node dots and sparks
    for (let i = 0; i < nodeXCoords.length; i++) {
      const nx = nodeXCoords[i];
      // Node gap marker
      el('rect', { x: nx - 6, y: 253, width: 12, height: 32, rx: 2, fill: 'rgba(255,207,107,0.15)', stroke: 'rgba(255,207,107,0.4)', 'stroke-width': 1 }, myelinGroup);
      const ring = el('circle', { cx: nx, cy: 269, r: 10, fill: 'none', stroke: '#50ffd2', 'stroke-width': 2, opacity: 0 }, myelinGroup);
      glow(ring);
      const dot = el('circle', { cx: nx, cy: 269, r: 4, fill: '#ffcf6b', opacity: 0.6 }, myelinGroup);
      glow(dot);
      txt(myelinGroup, { x: nx, y: 298, 'text-anchor': 'middle', fill: C.muted, 'font-size': 7.5 }, `Node ${i + 1}`);
      nodeDots.push(dot);
      nodeRings.push(ring);
    }

    // Saltatory leap arc
    const leapArc = el('path', { fill: 'none', stroke: '#50ffd2', 'stroke-width': 2.4, opacity: 0 }, myelinGroup);
    glow(leapArc);

    // Continuous wave graphic (for unmyelinated mode)
    const waveRect = el('rect', { x: 40, y: 254, width: 40, height: 30, rx: 4, fill: 'rgba(255,107,125,0.45)', stroke: '#ff6b7d', 'stroke-width': 1.5 }, waveGroup);
    glow(waveRect);
    const waveFrontLine = el('line', { x1: 40, y1: 250, x2: 40, y2: 288, stroke: '#ffffff', 'stroke-width': 2 }, waveGroup);
    glow(waveFrontLine);
    txt(waveGroup, { x: 40, y: 298, 'text-anchor': 'middle', fill: '#ff8a98', 'font-size': 8, 'font-weight': 600 }, 'Wavefront');

    // ------------------------------------------------ Path rebuilding
    function rebuildTrace() {
      if (!simPoints || simPoints.length === 0) return;

      let d = '';
      for (let i = 0; i < simPoints.length; i++) {
        const pt = simPoints[i];
        const x = xToPx(pt.t).toFixed(1);
        const y = yToPx(pt.V).toFixed(1);
        d += `${i === 0 ? 'M' : 'L'} ${x} ${y} `;
      }
      ghostPath.setAttribute('d', d.trim());
      activePath.setAttribute('d', d.trim());
    }

    rebuildTrace();

    // ------------------------------------------------ Header / Dock Controls
    let stimSlider = null;
    let stimLabel = null;
    let lidoSlider = null;
    let lidoLabel = null;
    let myelinBtn = null;
    let playBtn = null;

    if (setControls) {
      const ctrls = document.createElement('div');
      ctrls.className = 'dock-ctrl-group';
      ctrls.style.display = 'flex';
      ctrls.style.flexWrap = 'wrap';
      ctrls.style.alignItems = 'center';
      ctrls.style.gap = '10px';

      // Stimulus slider
      stimLabel = document.createElement('span');
      stimLabel.className = 'dock-label';
      stimLabel.textContent = `Stimulus: ${stimulusAmp.toFixed(0)} µA`;

      stimSlider = document.createElement('input');
      stimSlider.type = 'range';
      stimSlider.className = 'dock-range';
      stimSlider.min = '0';
      stimSlider.max = '40';
      stimSlider.step = '1';
      stimSlider.value = String(stimulusAmp);
      stimSlider.title = 'Injected current amplitude across neuronal membrane';
      stimSlider.addEventListener('input', (e) => {
        stimulusAmp = parseFloat(e.target.value);
        stimLabel.textContent = `Stimulus: ${stimulusAmp.toFixed(0)} µA`;
        runSimulation();
        rebuildTrace();
        if (clock) clock.seek(W0);
      });

      // Lidocaine slider
      lidoLabel = document.createElement('span');
      lidoLabel.className = 'dock-label';
      lidoLabel.textContent = `Lidocaine: ${lidocaineDose}%`;

      lidoSlider = document.createElement('input');
      lidoSlider.type = 'range';
      lidoSlider.className = 'dock-range';
      lidoSlider.min = '0';
      lidoSlider.max = '100';
      lidoSlider.step = '5';
      lidoSlider.value = String(lidocaineDose);
      lidoSlider.title = 'Concentration of local anesthetic blocking Na+ channels';
      lidoSlider.addEventListener('input', (e) => {
        lidocaineDose = parseInt(e.target.value, 10);
        lidoLabel.textContent = `Lidocaine: ${lidocaineDose}%`;
        runSimulation();
        rebuildTrace();
        if (clock) clock.seek(W0);
      });

      // Myelin toggle
      myelinBtn = document.createElement('button');
      myelinBtn.type = 'button';
      myelinBtn.className = 'dock-btn';
      myelinBtn.setAttribute('aria-pressed', isMyelinated ? 'true' : 'false');
      myelinBtn.textContent = isMyelinated ? 'Axon: Myelinated' : 'Axon: Unmyelinated';
      myelinBtn.addEventListener('click', () => {
        isMyelinated = !isMyelinated;
        myelinBtn.setAttribute('aria-pressed', isMyelinated ? 'true' : 'false');
        myelinBtn.textContent = isMyelinated ? 'Axon: Myelinated' : 'Axon: Unmyelinated';
      });

      // Trigger / Spark button
      const sparkBtn = document.createElement('button');
      sparkBtn.type = 'button';
      sparkBtn.className = 'dock-btn';
      sparkBtn.textContent = 'Spark';
      sparkBtn.title = 'Trigger stimulus from t = 0';
      sparkBtn.addEventListener('click', () => {
        if (clock) {
          clock.seek(W0);
          clock.play();
        }
      });

      // Play / Pause button
      playBtn = document.createElement('button');
      playBtn.type = 'button';
      playBtn.className = 'dock-btn';
      playBtn.textContent = clock && clock.playing ? 'Pause' : 'Play';
      playBtn.setAttribute('aria-pressed', clock && clock.playing ? 'true' : 'false');
      playBtn.addEventListener('click', () => {
        if (!clock) return;
        if (clock.playing) clock.pause(); else clock.play();
      });

      if (clock) {
        unsubClock = clock.subscribe((_t, clk) => {
          playBtn.textContent = clk.playing ? 'Pause' : 'Play';
          playBtn.setAttribute('aria-pressed', clk.playing ? 'true' : 'false');
        });
      }

      ctrls.appendChild(stimLabel);
      ctrls.appendChild(stimSlider);
      ctrls.appendChild(lidoLabel);
      ctrls.appendChild(lidoSlider);
      ctrls.appendChild(myelinBtn);
      ctrls.appendChild(sparkBtn);
      ctrls.appendChild(playBtn);
      setControls(ctrls);
    }

    // ------------------------------------------------ Main Render Loop
    return {
      render(t) {
        if (!simPoints || simPoints.length === 0) return;

        const clampedT = Math.max(W0, Math.min(W1, t));
        const st = world?.stateAt ? world.stateAt(clampedT, simPoints) : simPoints[0];

        // 1. Reveal live trace
        const curX = xToPx(clampedT);
        const curY = yToPx(st.V);
        clipRect.setAttribute('width', Math.max(0, curX - plotLeft + 2).toFixed(1));
        playhead.setAttribute('x1', curX.toFixed(1));
        playhead.setAttribute('x2', curX.toFixed(1));
        cursorDot.setAttribute('cx', curX.toFixed(1));
        cursorDot.setAttribute('cy', curY.toFixed(1));

        // Update readouts
        vReadout.textContent = `${st.V >= 0 ? '+' : ''}${st.V.toFixed(1)} mV`;
        gNaText.textContent = `gNa: ${(st.gNa).toFixed(1)}`;
        gKText.textContent = `gK: ${(st.gK).toFixed(1)}`;

        // State badge color & text
        let stateStr = 'Resting (-70 mV)';
        let badgeColor = '#7df0c0';

        if (st.block >= 0.6 && clampedT >= 0.0) {
          stateStr = 'Blocked by Lidocaine';
          badgeColor = '#ff6b7d';
        } else if (st.V > 25.0) {
          stateStr = 'Peak (+35 mV): Na+ Inactivated';
          badgeColor = '#ff6b7d';
        } else if (st.V > -55.0 && clampedT < 2.0) {
          stateStr = 'Rising: Na+ Gate Avalanche';
          badgeColor = '#50ffd2';
        } else if (st.V < -72.0 && clampedT > 2.0) {
          stateStr = 'Hyperpolarized: K+ Undershoot';
          badgeColor = '#b98cff';
        } else if (st.V > -70.0 && clampedT > 1.8) {
          stateStr = 'Falling: K+ Repolarization';
          badgeColor = '#b98cff';
        } else if (stimulusAmp < 12.0 && clampedT >= 0.0 && clampedT <= 1.0) {
          stateStr = 'Subthreshold (No Spike)';
          badgeColor = '#ffcf6b';
        }
        stateBadge.textContent = stateStr;
        stateBadge.setAttribute('fill', badgeColor);

        // 2. Animate Na+ Activation Gate (m^3)
        // m ranges 0.05 to 1.0. When m = 0, leaves touch at center (gap = 0).
        // When m = 1, leaves pull back by 10 px.
        const mOpenFrac = Math.pow(st.m, 3);
        const mGap = mOpenFrac * 10;
        naGateL.setAttribute('x2', (naCenter - mGap).toFixed(1));
        naGateR.setAttribute('x2', (naCenter + mGap).toFixed(1));

        // 3. Animate Na+ Inactivation Ball-and-Chain (h)
        // h ranges ~0.6 at rest, drops toward 0.0 at peak (inactivated), returns to 0.6.
        // When h is small (< 0.15), the ball plugs the inner mouth (y = 106).
        // When h is open (> 0.5), the ball hangs at y = 136.
        const inactFrac = 1.0 - Math.min(1.0, Math.max(0.0, st.h / 0.6));
        const ballY = 136 - inactFrac * 30; // 136 down to 106
        const ballX = naCenter + Math.sin(clampedT * 4.0) * (1.0 - inactFrac) * 3;
        inactBall.setAttribute('cx', ballX.toFixed(1));
        inactBall.setAttribute('cy', ballY.toFixed(1));
        ballLabel.setAttribute('y', (ballY + 13).toFixed(1));

        // Chain path between anchor (naCenter - 14, 104) and ball (ballX, ballY)
        const anchorX = naCenter - 14;
        const anchorY = 104;
        const ctrlX = (anchorX + ballX) / 2 - 8 * (1 - inactFrac);
        const ctrlY = (anchorY + ballY) / 2 + 10 * (1 - inactFrac);
        chainPath.setAttribute('d', `M ${anchorX} ${anchorY} Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${ballX.toFixed(1)} ${ballY.toFixed(1)}`);

        // Lidocaine plug display
        if (lidocaineDose > 0) {
          lidoBadge.setAttribute('opacity', Math.min(1.0, lidocaineDose / 40).toFixed(2));
        } else {
          lidoBadge.setAttribute('opacity', '0');
        }

        // Streaming Na+ ions (smooth, non-strobing drift)
        const naConducting = st.m3h > 0.04 && st.block < 0.6;
        for (let i = 0; i < naIonDots.length; i++) {
          if (naConducting) {
            const ionProg = ((clampedT * 0.9 + i * 0.25) % 1.0);
            const ionY = 48 + ionProg * 68;
            naIonDots[i].setAttribute('cy', ionY.toFixed(1));
            naIonDots[i].setAttribute('opacity', '0.9');
          } else {
            naIonDots[i].setAttribute('opacity', '0');
          }
        }

        // 4. Animate K+ Delayed-Rectifier Gate (n^4)
        // n ranges 0.32 to 0.75. When n^4 is high, gate leaves open.
        const nOpenFrac = Math.pow(st.n, 4);
        const nGap = Math.min(1.0, nOpenFrac / 0.35) * 10;
        kGateL.setAttribute('x2', (kCenter - nGap).toFixed(1));
        kGateR.setAttribute('x2', (kCenter + nGap).toFixed(1));

        // Streaming K+ ions (moving upward with calm drift)
        const kConducting = st.n4 > 0.08;
        for (let i = 0; i < kIonDots.length; i++) {
          if (kConducting) {
            const ionProg = ((clampedT * 0.8 + i * 0.25) % 1.0);
            const ionY = 112 - ionProg * 66;
            kIonDots[i].setAttribute('cy', ionY.toFixed(1));
            kIonDots[i].setAttribute('opacity', '0.9');
          } else {
            kIonDots[i].setAttribute('opacity', '0');
          }
        }

        // 5. Axon Conduction Animation (Bottom Track)
        if (isMyelinated) {
          myelinGroup.setAttribute('opacity', '1');
          waveGroup.setAttribute('opacity', '0');
          axonModeLabel.textContent = 'Myelinated (diameter 10 µm): Saltatory jumping across Nodes of Ranvier';
          axonSpeedBadge.textContent = 'Speed: ~60 m/s (Saltatory)';
          axonSpeedBadge.setAttribute('fill', '#50ffd2');

          // Action potential leaps between nodes 0..4
          // Node 0 fires at t ~ 1.2 ms, Node 1 at 1.4, Node 2 at 1.6, Node 3 at 1.8, Node 4 at 2.0
          const spikeFired = st.V > 0;
          for (let i = 0; i < nodeXCoords.length; i++) {
            const nodeArrivalT = 1.0 + i * 0.25;
            const timeSinceNode = clampedT - nodeArrivalT;
            const isFiring = spikeFired && timeSinceNode >= 0 && timeSinceNode < 0.45;

            if (isFiring) {
              const fade = Math.max(0, 1.0 - timeSinceNode / 0.45);
              nodeDots[i].setAttribute('fill', '#ffffff');
              nodeDots[i].setAttribute('r', '5.0');
              nodeDots[i].setAttribute('opacity', '0.95');
              nodeRings[i].setAttribute('opacity', (fade * 0.45).toFixed(2));
              nodeRings[i].setAttribute('r', '11');
            } else {
              nodeDots[i].setAttribute('fill', '#ffcf6b');
              nodeDots[i].setAttribute('r', '4');
              nodeDots[i].setAttribute('opacity', '0.45');
              nodeRings[i].setAttribute('opacity', '0');
            }
          }

          // Draw jumping spark arc between currently active nodes
          const activeIndex = Math.floor((clampedT - 1.0) / 0.25);
          if (spikeFired && activeIndex >= 0 && activeIndex < nodeXCoords.length - 1) {
            const xA = nodeXCoords[activeIndex];
            const xB = nodeXCoords[activeIndex + 1];
            const frac = Math.max(0, Math.min(1, (clampedT - 1.0 - activeIndex * 0.25) / 0.25));
            const xCur = xA + frac * (xB - xA);
            const peakY = 236;
            leapArc.setAttribute('d', `M ${xA} 269 Q ${(xA + xB) / 2} ${peakY} ${xCur.toFixed(1)} 269`);
            leapArc.setAttribute('opacity', '0.9');
          } else {
            leapArc.setAttribute('opacity', '0');
          }
        } else {
          // Unmyelinated mode: smooth continuous wave
          myelinGroup.setAttribute('opacity', '0');
          waveGroup.setAttribute('opacity', '1');
          axonModeLabel.textContent = 'Unmyelinated (diameter 1 µm): Continuous uniform wave propagation';
          axonSpeedBadge.textContent = 'Speed: ~1.5 m/s (Continuous)';
          axonSpeedBadge.setAttribute('fill', '#ff8a98');

          // Wavefront advances continuously from x = 40 to 760 over t = 1.0 to 5.5 ms
          const spikeFired = st.V > -20;
          if (spikeFired && clampedT >= 1.0) {
            const prog = Math.min(1.0, (clampedT - 1.0) / 4.0);
            const waveX = 40 + prog * 680;
            waveRect.setAttribute('x', Math.max(40, waveX - 35).toFixed(1));
            waveFrontLine.setAttribute('x1', waveX.toFixed(1));
            waveFrontLine.setAttribute('x2', waveX.toFixed(1));
            waveGroup.setAttribute('opacity', '1');
          } else {
            waveGroup.setAttribute('opacity', '0.2');
          }
        }
      },

      destroy() {
        if (unsubClock) unsubClock();
        if (svg.parentElement) svg.parentElement.removeChild(svg);
      },
    };
  },
};
