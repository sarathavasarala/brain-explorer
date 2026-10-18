import { NS, C, el, glowFilter, lin } from './svg.js';
import {
  CONSTANTS,
  DEFAULT_SYNAPSES,
  WINDOW,
  simulateIntegration,
  shuntingAttenuation,
} from '../worlds/integration.js';

let clipCounter = 0;

export default {
  type: 'integration',

  mount(container, props = {}, ctx = {}) {
    const { world, clock, setControls } = ctx;
    const W0 = world && world.WINDOW ? world.WINDOW[0] : WINDOW[0];
    const W1 = world && world.WINDOW ? world.WINDOW[1] : WINDOW[1];

    const width = 800;
    const height = 310;

    const svg = el('svg', {
      viewBox: `0 0 ${width} ${height}`,
      preserveAspectRatio: 'xMidYMid meet',
      role: 'img',
      'aria-label': 'Synaptic Integration Laboratory: neuron morphology and axon hillock oscilloscope',
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

    // ------------------------------------------------ State Setup
    const mode = props.mode || 'sandbox';
    let pulseCount = props.pulses || (mode === 'temporal' ? 3 : 1);
    let pulseFreq = props.freq || (mode === 'temporal' ? 'high' : 'low'); // 'low' (25 Hz) | 'high' (100 Hz)
    let vetoLocation = props.veto || (mode === 'shunting-soma' ? 'soma' : mode === 'shunting-distal' ? 'distal' : 'none'); // 'none' | 'distal' | 'soma'

    // Active synapses
    let activeIds = new Set();
    if (props.active && Array.isArray(props.active)) {
      props.active.forEach((id) => activeIds.add(id));
    } else if (mode === 'single-epsp') {
      activeIds.add('e2');
    } else if (mode === 'cable-decay') {
      activeIds.add('e1');
    } else if (mode === 'temporal') {
      activeIds.add('e1');
    } else if (mode === 'spatial') {
      activeIds.add('e1');
      activeIds.add('e2');
      activeIds.add('e3');
    } else if (mode === 'shunting-soma') {
      activeIds.add('e1');
      activeIds.add('e2');
      activeIds.add('e3');
      activeIds.add('i_soma');
    } else if (mode === 'shunting-distal') {
      activeIds.add('e1');
      activeIds.add('e2');
      activeIds.add('e3');
      activeIds.add('i_distal');
    } else {
      // Default sandbox
      activeIds.add('e1');
      activeIds.add('e2');
      activeIds.add('e3');
    }

    // ------------------------------------------------ Graph Bounds
    const gLeft = 470;
    const gRight = 770;
    const gTop = 52;
    const gBottom = 265;

    const vMin = -78;
    const vMax = 38;

    const xToPx = lin(W0, W1, gLeft, gRight);
    const yToPx = lin(vMin, vMax, gBottom, gTop);

    // Defs & Clip path
    const clipId = `integ-clip-${++clipCounter}`;
    const defs = el('defs', {}, svg);
    const clip = el('clipPath', { id: clipId }, defs);
    const clipRect = el('rect', { x: gLeft, y: gTop - 6, width: gRight - gLeft, height: gBottom - gTop + 12 }, clip);

    // Structural layers
    const layerNeuron = el('g', { id: 'layer-neuron' }, svg);
    const layerRipples = el('g', { id: 'layer-ripples' }, svg);
    const layerPins = el('g', { id: 'layer-pins' }, svg);
    const layerGraph = el('g', { id: 'layer-graph' }, svg);
    const layerTraces = el('g', { 'clip-path': `url(#${clipId})` }, layerGraph);
    const layerOverlay = el('g', { id: 'layer-overlay' }, svg);

    // ------------------------------------------------ Neuron Morphology (Left Pane)
    // Morphology coordinates centered around (195, 175)
    // Apical trunk & tuft
    const apicalColor = 'rgba(205, 213, 255, 0.45)';
    const basalColor = 'rgba(205, 213, 255, 0.40)';

    // Distal tuft branches
    el('path', {
      d: 'M 195 90 Q 180 55 135 25 M 195 90 Q 195 50 195 18 M 195 90 Q 215 55 260 28',
      fill: 'none',
      stroke: apicalColor,
      'stroke-width': 2.2,
      'stroke-linecap': 'round',
    }, layerNeuron);

    // Apical trunk
    el('path', {
      d: 'M 195 158 L 195 90',
      fill: 'none',
      stroke: 'rgba(205, 213, 255, 0.70)',
      'stroke-width': 4.2,
      'stroke-linecap': 'round',
    }, layerNeuron);

    // Oblique apical side branches
    el('path', {
      d: 'M 195 125 Q 165 118 135 105 M 195 115 Q 225 108 255 98',
      fill: 'none',
      stroke: apicalColor,
      'stroke-width': 2.0,
      'stroke-linecap': 'round',
    }, layerNeuron);

    // Basal dendrites
    el('path', {
      d: 'M 175 208 Q 135 224 85 240 M 135 224 Q 115 245 95 268 M 215 208 Q 255 224 305 240 M 255 224 Q 275 245 295 268',
      fill: 'none',
      stroke: basalColor,
      'stroke-width': 2.5,
      'stroke-linecap': 'round',
    }, layerNeuron);

    // Pyramidal Soma Body
    const somaEl = el('path', {
      d: 'M 172 208 Q 185 218 195 216 Q 205 218 218 208 L 200 158 Q 195 154 190 158 Z',
      fill: 'rgba(205, 213, 255, 0.16)',
      stroke: '#cdd5ff',
      'stroke-width': 2.0,
    }, layerNeuron);

    // Axon Hillock (Trigger Zone / AIS)
    // Tapering funnel at the base of the soma
    const aisCone = el('path', {
      d: 'M 190 216 L 195 242 L 200 216 Z',
      fill: 'rgba(255, 207, 107, 0.28)',
      stroke: '#ffcf6b',
      'stroke-width': 1.6,
    }, layerNeuron);
    glow(aisCone);

    // AIS sodium channel clustering indicator hashes
    for (let y = 222; y <= 238; y += 4) {
      el('line', {
        x1: 191,
        y1: y,
        x2: 199,
        y2: y,
        stroke: 'rgba(255, 207, 107, 0.6)',
        'stroke-width': 1.2,
      }, layerNeuron);
    }

    // Myelinated Axon below AIS
    el('line', {
      x1: 195,
      y1: 242,
      x2: 195,
      y2: 298,
      stroke: 'rgba(205, 213, 255, 0.5)',
      'stroke-width': 1.8,
    }, layerNeuron);

    // Myelin sheaths
    el('rect', { x: 191, y: 249, width: 8, height: 18, rx: 3, fill: 'rgba(190, 200, 255, 0.22)', stroke: 'rgba(190, 200, 255, 0.65)', 'stroke-width': 1 }, layerNeuron);
    el('rect', { x: 191, y: 274, width: 8, height: 18, rx: 3, fill: 'rgba(190, 200, 255, 0.22)', stroke: 'rgba(190, 200, 255, 0.65)', 'stroke-width': 1 }, layerNeuron);

    // Morphology labels
    txt(layerNeuron, { x: 195, y: 12, 'text-anchor': 'middle', fill: 'rgba(233,235,245,0.45)', 'font-size': 9.5, 'letter-spacing': '0.06em' }, 'APICAL TUFT');
    txt(layerNeuron, { x: 70, y: 248, 'text-anchor': 'end', fill: 'rgba(233,235,245,0.45)', 'font-size': 9.5, 'letter-spacing': '0.06em' }, 'BASAL DENDRITES');
    txt(layerNeuron, { x: 195, y: 188, 'text-anchor': 'middle', fill: 'rgba(205,213,255,0.85)', 'font-size': 10, 'font-weight': 600 }, 'SOMA');

    // Axon hillock pointer and label
    el('line', { x1: 204, y1: 232, x2: 246, y2: 232, stroke: 'rgba(255, 207, 107, 0.5)', 'stroke-width': 1, 'stroke-dasharray': '2 2' }, layerNeuron);
    txt(layerNeuron, { x: 250, y: 235, fill: '#ffcf6b', 'font-size': 10, 'font-weight': 700, 'letter-spacing': '0.05em' }, 'AXON HILLOCK (AIS)');
    txt(layerNeuron, { x: 250, y: 246, fill: 'rgba(233,235,245,0.5)', 'font-size': 8.5 }, 'decision trigger zone');

    // ------------------------------------------------ Graph Setup (Right Pane)
    // Divider line between morphology and graph
    el('line', { x1: 442, y1: 25, x2: 442, y2: 285, stroke: 'rgba(190,200,255,0.12)', 'stroke-width': 1 }, svg);

    // Graph Title & Readouts
    txt(layerGraph, { x: gLeft, y: 26, fill: C.ink, 'font-size': 12, 'font-weight': 700, 'letter-spacing': '0.04em' }, 'AXON HILLOCK POTENTIAL (AIS)');
    const readoutText = txt(layerGraph, { x: gRight, y: 26, 'text-anchor': 'end', fill: '#ffcf6b', 'font-size': 11, 'font-weight': 600 }, '-70.0 mV');
    const decisionBadge = txt(layerGraph, { x: gRight, y: 42, 'text-anchor': 'end', fill: 'rgba(233,235,245,0.6)', 'font-size': 10 }, 'Decision: Subthreshold');

    // Background grid & axes
    el('rect', { x: gLeft, y: gTop, width: gRight - gLeft, height: gBottom - gTop, fill: 'rgba(10,12,20,0.4)', stroke: 'rgba(190,200,255,0.15)', 'stroke-width': 1 }, layerGraph);

    // Resting potential line (-70 mV)
    const yRest = yToPx(CONSTANTS.V_REST);
    el('line', { x1: gLeft, y1: yRest, x2: gRight, y2: yRest, stroke: 'rgba(190,200,255,0.3)', 'stroke-width': 1 }, layerGraph);
    txt(layerGraph, { x: gLeft - 8, y: yRest + 3, 'text-anchor': 'end', fill: C.muted, 'font-size': 9.5 }, '-70 mV (Rest)');

    // Spike threshold line (-55 mV)
    const yThresh = yToPx(CONSTANTS.V_THRESH);
    el('line', {
      x1: gLeft,
      y1: yThresh,
      x2: gRight,
      y2: yThresh,
      stroke: '#ff6b7d',
      'stroke-width': 1.2,
      'stroke-dasharray': '4 3',
    }, layerGraph);
    txt(layerGraph, { x: gLeft - 8, y: yThresh + 3, 'text-anchor': 'end', fill: '#ff6b7d', 'font-size': 9.5, 'font-weight': 600 }, '-55 mV (Threshold)');

    // Action potential peak line (+30 mV)
    const yPeak = yToPx(CONSTANTS.V_PEAK);
    el('line', { x1: gLeft, y1: yPeak, x2: gRight, y2: yPeak, stroke: 'rgba(125,240,192,0.25)', 'stroke-width': 1, 'stroke-dasharray': '2 3' }, layerGraph);
    txt(layerGraph, { x: gLeft - 8, y: yPeak + 3, 'text-anchor': 'end', fill: 'rgba(125,240,192,0.6)', 'font-size': 9.5 }, '+30 mV (Peak)');

    // Time Axis label
    txt(layerGraph, { x: (gLeft + gRight) / 2, y: gBottom + 20, 'text-anchor': 'middle', fill: C.muted, 'font-size': 10 }, 'time (seconds)');

    // Traces
    const localE1Path = el('path', { fill: 'none', stroke: '#ffcf6b', 'stroke-width': 1.6, 'stroke-dasharray': '3 3', opacity: 0 }, layerTraces);
    const localE1Label = txt(layerGraph, { x: gLeft + 8, y: gTop + 14, fill: '#ffcf6b', 'font-size': 9, 'font-weight': 600, opacity: 0 }, 'Local spine E1');
    const voltagePath = el('path', { fill: 'none', stroke: '#ffcf6b', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, layerTraces);
    glow(voltagePath);

    // Playhead line and cursor dot
    const playhead = el('line', { x1: gLeft, y1: gTop - 4, x2: gLeft, y2: gBottom, stroke: 'rgba(233,235,245,0.35)', 'stroke-width': 1 }, layerOverlay);
    const cursorDot = el('circle', { r: 4.5, fill: '#ffcf6b', opacity: 0 }, layerOverlay);
    glow(cursorDot);

    // Flash ring at Axon Hillock when action potential triggers
    const aisFlash = el('circle', { cx: 195, cy: 230, r: 12, fill: 'none', stroke: '#7df0c0', 'stroke-width': 2.5, opacity: 0 }, layerOverlay);
    glow(aisFlash);

    // ------------------------------------------------ Moving Ripple Geometries
    // Ripple dots along each branch
    const rippleDots = [
      { id: 'e1', branch: 'apical', el: el('circle', { r: 4, fill: '#ffcf6b', opacity: 0 }, layerRipples) },
      { id: 'e2', branch: 'apical', el: el('circle', { r: 4, fill: '#ffcf6b', opacity: 0 }, layerRipples) },
      { id: 'e3', branch: 'basal', el: el('circle', { r: 4, fill: '#ffcf6b', opacity: 0 }, layerRipples) },
      { id: 'i_distal', branch: 'apical', el: el('circle', { r: 4, fill: '#ff6b7d', opacity: 0 }, layerRipples) },
      { id: 'i_soma', branch: 'soma', el: el('circle', { r: 5, fill: '#ff6b7d', opacity: 0 }, layerRipples) },
    ];
    rippleDots.forEach((rd) => glow(rd.el));

    // Branch path interpolators for traveling ripples
    // Returns { x, y } along the branch toward the soma (s from 0 = synapse to 1 = soma/AIS)
    function getRipplePos(synId, progress) {
      const p = Math.max(0, Math.min(1, progress));
      if (synId === 'e1') {
        // Distal tuft (195, 38) -> (195, 90) -> soma (195, 216)
        if (p < 0.35) {
          const f = p / 0.35;
          return { x: 195, y: 38 + f * (90 - 38) };
        }
        const f = (p - 0.35) / 0.65;
        return { x: 195, y: 90 + f * (216 - 90) };
      }
      if (synId === 'e2') {
        // Mid-apical trunk (195, 115) -> soma (195, 216)
        return { x: 195, y: 115 + p * (216 - 115) };
      }
      if (synId === 'e3') {
        // Basal left (135, 224) -> soma (175, 210) -> AIS (195, 218)
        if (p < 0.7) {
          const f = p / 0.7;
          return { x: 135 + f * (175 - 135), y: 224 + f * (210 - 224) };
        }
        const f = (p - 0.7) / 0.3;
        return { x: 175 + f * (195 - 175), y: 210 + f * (218 - 210) };
      }
      if (synId === 'i_distal') {
        // Distal tip (235, 45) -> (195, 90)
        return { x: 235 + p * (195 - 235), y: 45 + p * (90 - 45) };
      }
      if (synId === 'i_soma') {
        // Perisomatic clamp right at hillock (212, 228) -> (195, 228)
        return { x: 212 + p * (195 - 212), y: 228 };
      }
      return { x: 195, y: 216 };
    }

    // ------------------------------------------------ Synapse Pin Elements
    let vetoBtn = null;
    const getVetoLabel = () => {
      if (activeIds.has('i_soma')) return 'Inhibition: Soma/AIS (Veto ON)';
      if (activeIds.has('i_distal')) return 'Inhibition: Distal Tip (Branch only)';
      return 'Inhibition: None';
    };

    const pinElements = new Map();

    DEFAULT_SYNAPSES.forEach((syn) => {
      const g = el('g', {
        id: `pin-${syn.id}`,
        cursor: 'pointer',
        role: 'button',
        tabindex: '0',
        'aria-label': `${syn.label}: click to toggle`,
      }, layerPins);

      const aura = el('circle', {
        cx: syn.pos.x,
        cy: syn.pos.y,
        r: 10,
        fill: 'none',
        stroke: syn.color,
        'stroke-width': 1.2,
        opacity: 0.4,
      }, g);

      const dot = el('circle', {
        cx: syn.pos.x,
        cy: syn.pos.y,
        r: 5.5,
        fill: syn.color,
      }, g);
      glow(dot);

      // Pin badge text (e.g. E1, E2, E3, I1, I2)
      const badgeText = syn.id.startsWith('e')
        ? syn.id.toUpperCase()
        : syn.id === 'i_distal' ? 'I-TIP' : 'I-AIS';
      const labelOffset = syn.pos.x > 195 ? 12 : -12;
      const textAnchor = syn.pos.x > 195 ? 'start' : 'end';

      const tag = txt(g, {
        x: syn.pos.x + labelOffset,
        y: syn.pos.y + 4,
        'text-anchor': textAnchor,
        fill: syn.color,
        'font-size': 9.5,
        'font-weight': 700,
        'letter-spacing': '0.04em',
      }, badgeText);

      // Click handler to toggle synapse
      const toggle = () => {
        if (activeIds.has(syn.id)) {
          activeIds.delete(syn.id);
        } else {
          activeIds.add(syn.id);
        }
        if (vetoBtn) {
          vetoBtn.textContent = getVetoLabel();
          vetoBtn.setAttribute('aria-pressed', activeIds.has('i_soma') ? 'true' : 'false');
        }
        rebuild();
        if (clock) clock.seek(W0);
      };

      g.addEventListener('click', toggle);
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });

      pinElements.set(syn.id, { g, aura, dot, tag, syn });
    });

    // ------------------------------------------------ Simulation & Rebuild
    let simData = null;

    function buildPulseSchedule() {
      // Build pulse times depending on pulseCount and frequency
      const interval = pulseFreq === 'high' ? 0.02 : 0.22; // 50 Hz vs 4.5 Hz
      const e1Pulses = [];
      const e2Pulses = [];
      const e3Pulses = [];

      for (let i = 0; i < pulseCount; i++) {
        e1Pulses.push(0.12 + i * interval);
        e2Pulses.push(0.13 + i * interval);
        e3Pulses.push(0.14 + i * interval);
      }

      return {
        e1: e1Pulses,
        e2: e2Pulses,
        e3: e3Pulses,
        i_distal: [0.10],
        i_soma: [0.10],
      };
    }

    function rebuild() {
      const pulseTimes = buildPulseSchedule();

      // Update pin visual states
      pinElements.forEach(({ aura, dot, tag, syn }, id) => {
        const isActive = activeIds.has(id);
        if (isActive) {
          dot.setAttribute('fill', syn.color);
          dot.setAttribute('opacity', '1');
          aura.setAttribute('stroke', syn.color);
          aura.setAttribute('stroke-dasharray', 'none');
          aura.setAttribute('opacity', '0.6');
          tag.setAttribute('opacity', '1');
        } else {
          dot.setAttribute('fill', 'rgba(233,235,245,0.2)');
          dot.setAttribute('opacity', '0.4');
          aura.setAttribute('stroke', 'rgba(233,235,245,0.25)');
          aura.setAttribute('stroke-dasharray', '2 2');
          aura.setAttribute('opacity', '0.3');
          tag.setAttribute('opacity', '0.4');
        }
      });

      // Run world simulation
      simData = simulateIntegration({
        synapses: DEFAULT_SYNAPSES,
        activeIds: Array.from(activeIds),
        pulseTimes,
        vetoLocation: 'custom',
        tMin: W0,
        tMax: W1,
        dt: 0.004,
      });

      // Construct SVG path for voltage trace
      const pts = simData.times;
      const vH = simData.vHillock;
      let dStr = '';
      for (let i = 0; i < pts.length; i++) {
        const x = xToPx(pts[i]).toFixed(1);
        const y = yToPx(vH[i]).toFixed(1);
        dStr += `${i === 0 ? 'M' : 'L'}${x} ${y} `;
      }
      voltagePath.setAttribute('d', dStr.trim());

      // If in cable-decay mode and e1 is active, draw local spine E1 trace
      if (mode === 'cable-decay' && activeIds.has('e1') && simData.vDendriteE1) {
        const vD = simData.vDendriteE1;
        let dE1 = '';
        for (let i = 0; i < pts.length; i++) {
          const x = xToPx(pts[i]).toFixed(1);
          const y = yToPx(vD[i]).toFixed(1);
          dE1 += `${i === 0 ? 'M' : 'L'}${x} ${y} `;
        }
        localE1Path.setAttribute('d', dE1.trim());
        localE1Path.setAttribute('opacity', '0.75');
        localE1Label.setAttribute('opacity', '0.9');
      } else {
        localE1Path.setAttribute('opacity', '0');
        localE1Label.setAttribute('opacity', '0');
      }

      // Update trace color depending on outcome
      if (simData.reachedThreshold) {
        voltagePath.setAttribute('stroke', '#7df0c0'); // cyan/green for spike
      } else if (activeIds.has('i_soma') && activeIds.size > 1) {
        voltagePath.setAttribute('stroke', '#ff6b7d'); // rose/red for vetoed
      } else {
        voltagePath.setAttribute('stroke', '#ffcf6b'); // gold/amber for subthreshold
      }

      // Update static decision readout
      if (simData.reachedThreshold) {
        decisionBadge.textContent = 'Decision: ACTION POTENTIAL TRIGGERED';
        decisionBadge.setAttribute('fill', '#7df0c0');
      } else if (simData.vetoActive) {
        decisionBadge.textContent = 'Decision: VETOED BY SHUNTING INHIBITION';
        decisionBadge.setAttribute('fill', '#ff6b7d');
      } else {
        const activeCount = Array.from(activeIds).filter((id) => id.startsWith('e')).length;
        decisionBadge.textContent = activeCount === 0
          ? 'Decision: Silent (No active inputs)'
          : `Decision: Subthreshold (${activeCount} input${activeCount > 1 ? 's' : ''} summate)`;
        decisionBadge.setAttribute('fill', 'rgba(233,235,245,0.65)');
      }
    }

    // ------------------------------------------------ Dock Controls Setup
    let unsubClock = null;

    if (setControls) {
      const ctrls = document.createElement('div');
      ctrls.className = 'dock-ctrl-group';
      ctrls.style.display = 'flex';
      ctrls.style.alignItems = 'center';
      ctrls.style.gap = '10px';
      ctrls.style.flexWrap = 'wrap';

      // 1. Input Frequency toggle button
      const freqBtn = document.createElement('button');
      freqBtn.type = 'button';
      freqBtn.className = 'dock-btn';
      freqBtn.textContent = pulseFreq === 'high' ? 'Frequency: 100 Hz (Burst)' : 'Frequency: 25 Hz (Spaced)';
      freqBtn.setAttribute('aria-pressed', pulseFreq === 'high' ? 'true' : 'false');
      freqBtn.addEventListener('click', () => {
        pulseFreq = pulseFreq === 'high' ? 'low' : 'high';
        freqBtn.textContent = pulseFreq === 'high' ? 'Frequency: 100 Hz (Burst)' : 'Frequency: 25 Hz (Spaced)';
        freqBtn.setAttribute('aria-pressed', pulseFreq === 'high' ? 'true' : 'false');
        rebuild();
        if (clock) clock.seek(W0);
      });
      ctrls.appendChild(freqBtn);

      // 2. Pulse count toggle (1 to 4 pulses)
      const pulseBtn = document.createElement('button');
      pulseBtn.type = 'button';
      pulseBtn.className = 'dock-btn';
      pulseBtn.textContent = `Pulses: ${pulseCount}`;
      pulseBtn.addEventListener('click', () => {
        pulseCount = (pulseCount % 4) + 1;
        pulseBtn.textContent = `Pulses: ${pulseCount}`;
        rebuild();
        if (clock) clock.seek(W0);
      });
      ctrls.appendChild(pulseBtn);

      // 3. Inhibitory Veto cycle toggle
      vetoBtn = document.createElement('button');
      vetoBtn.type = 'button';
      vetoBtn.className = 'dock-btn';
      vetoBtn.textContent = getVetoLabel();
      vetoBtn.setAttribute('aria-pressed', activeIds.has('i_soma') ? 'true' : 'false');
      vetoBtn.addEventListener('click', () => {
        if (activeIds.has('i_soma')) {
          activeIds.delete('i_soma');
          activeIds.add('i_distal');
          vetoLocation = 'distal';
        } else if (activeIds.has('i_distal')) {
          activeIds.delete('i_distal');
          activeIds.delete('i_soma');
          vetoLocation = 'none';
        } else {
          activeIds.add('i_soma');
          activeIds.delete('i_distal');
          vetoLocation = 'soma';
        }
        vetoBtn.textContent = getVetoLabel();
        vetoBtn.setAttribute('aria-pressed', activeIds.has('i_soma') ? 'true' : 'false');
        rebuild();
        if (clock) clock.seek(W0);
      });
      ctrls.appendChild(vetoBtn);

      // 4. Play / Pause button
      const playBtn = document.createElement('button');
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
      ctrls.appendChild(playBtn);

      // 5. Reset button
      const resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.className = 'dock-btn';
      resetBtn.textContent = 'Rewind';
      resetBtn.addEventListener('click', () => {
        if (clock) clock.seek(W0);
      });
      ctrls.appendChild(resetBtn);

      setControls(ctrls);
    }

    // Initial build
    rebuild();

    // ------------------------------------------------ Render Loop
    return {
      render(t) {
        if (!simData) return;

        // Update playhead on oscilloscope
        const prog = Math.max(0, Math.min(1, (t - W0) / (W1 - W0)));
        clipRect.setAttribute('width', ((gRight - gLeft) * prog).toFixed(1));

        const curX = xToPx(t);
        playhead.setAttribute('x1', curX.toFixed(1));
        playhead.setAttribute('x2', curX.toFixed(1));

        // Sample current hillock voltage
        const times = simData.times;
        const vH = simData.vHillock;
        let curV = CONSTANTS.V_REST;

        // Binary search or linear index lookup
        if (t <= times[0]) {
          curV = vH[0];
        } else if (t >= times[times.length - 1]) {
          curV = vH[vH.length - 1];
        } else {
          const idx = Math.floor(((t - W0) / (W1 - W0)) * (times.length - 1));
          curV = vH[Math.max(0, Math.min(vH.length - 1, idx))];
        }

        const curY = yToPx(curV);
        cursorDot.setAttribute('cx', curX.toFixed(1));
        cursorDot.setAttribute('cy', curY.toFixed(1));
        cursorDot.setAttribute('opacity', t >= W0 && prog < 1 ? '0.95' : '0.35');
        cursorDot.setAttribute('fill', curV > CONSTANTS.V_THRESH ? '#7df0c0' : '#ffcf6b');

        // Update dynamic voltage readout
        readoutText.textContent = `${curV > 0 ? '+' : ''}${curV.toFixed(1)} mV`;
        readoutText.setAttribute('fill', curV > CONSTANTS.V_THRESH ? '#7df0c0' : '#ffcf6b');

        // Soma excitation glow: pulses slightly with depolarization
        const somaDepol = Math.max(0, curV - CONSTANTS.V_REST);
        const somaAlpha = Math.min(0.65, 0.16 + (somaDepol / 40.0) * 0.45);
        somaEl.setAttribute('fill', `rgba(205, 213, 255, ${somaAlpha.toFixed(2)})`);

        // Smooth AIS trigger glow with depolarization above threshold
        const spikeProgress = Math.max(0, Math.min(1, (curV - CONSTANTS.V_THRESH) / 30.0));
        if (spikeProgress > 0) {
          aisFlash.setAttribute('opacity', (spikeProgress * 0.8).toFixed(2));
          aisFlash.setAttribute('r', (9 + spikeProgress * 5).toFixed(1));
        } else {
          aisFlash.setAttribute('opacity', '0');
        }

        // Animate traveling ripple wave packets along dendrites (calm glide)
        const pulseTimes = buildPulseSchedule();

        rippleDots.forEach(({ id, el: dotEl }) => {
          if (!activeIds.has(id)) {
            dotEl.setAttribute('opacity', '0');
            return;
          }

          const onsets = pulseTimes[id] || [0.12];
          // Find the most recently triggered pulse relative to time t
          let latestOnset = -1;
          for (const t0 of onsets) {
            if (t >= t0 && (t - t0) < 0.65) {
              latestOnset = t0;
            }
          }

          if (latestOnset >= 0) {
            const dt = t - latestOnset;
            // Travel duration to soma ~0.55s
            const travelDuration = 0.55;
            const progress = dt / travelDuration;

            if (progress <= 1.0) {
              const pos = getRipplePos(id, progress);
              dotEl.setAttribute('cx', pos.x.toFixed(1));
              dotEl.setAttribute('cy', pos.y.toFixed(1));

              // Fade and shrink as it travels (cable attenuation)
              const fade = Math.max(0, 1.0 - progress * 0.45);
              dotEl.setAttribute('opacity', fade.toFixed(2));
              dotEl.setAttribute('r', (4.5 - progress * 1.2).toFixed(1));
            } else {
              dotEl.setAttribute('opacity', '0');
            }
          } else {
            dotEl.setAttribute('opacity', '0');
          }
        });
      },

      destroy() {
        if (unsubClock) unsubClock();
        if (svg.parentElement) svg.parentElement.removeChild(svg);
      },
    };
  },
};
