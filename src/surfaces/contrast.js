// Sensory Contrast & Receptive Fields Laboratory Surface.
// Interactive SVG surface demonstrating:
// 1. Difference of Gaussians (DoG) center-surround receptive fields and diffuse light cancellation.
// 2. 1D lateral inhibition array model and Mach band edge sharpening.
// 3. Weber's two-point discrimination caliper test and receptive field tiling.

import { NS, C, el, glowFilter, lin } from './svg.js';
import * as contrastWorld from '../worlds/contrast.js';

let clipCounter = 0;

export default {
  type: 'contrast',

  mount(container, props = {}, ctx = {}) {
    const world = ctx.world || contrastWorld;
    const { clock, setControls } = ctx;

    const width = 800;
    const height = 310;

    const svg = el('svg', {
      viewBox: `0 0 ${width} ${height}`,
      preserveAspectRatio: 'xMidYMid meet',
      role: 'img',
      'aria-label': 'Sensory Contrast and Receptive Fields Laboratory',
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

    // -------------------------------------------------------------------------
    // State Setup
    // -------------------------------------------------------------------------
    // Modes: 'spot' (center-surround), 'edge' (mach bands), 'two-point' (calipers)
    let activeMode = 'spot';
    if (props.mode === 'edge' || props.mode === 'mach-bands' || props.mode === 'lateral-inhibition') {
      activeMode = 'edge';
    } else if (props.mode === 'two-point' || props.mode === 'caliper' || props.mode === 'acuity') {
      activeMode = 'two-point';
    } else if (props.mode === 'diffuse' || props.mode === 'cancellation') {
      activeMode = 'spot';
    }

    let isPlaying = true;
    let lastClockT = clock ? clock.t : 0;

    // Spot mode state
    const spotState = {
      x: 0.0, // RF-relative coordinates (-4 to +4)
      y: 0.0,
      radius: props.mode === 'diffuse' || props.mode === 'cancellation' ? 3.6 : (props.spotRadius || 0.9),
      intensity: 1.0,
      rfSigmaC: 1.0,
      rfSigmaS: 2.8,
      baselineHz: 15,
      currentHz: 15,
      state: 'baseline',
    };

    // Edge / Mach band state
    const edgeState = {
      stepFrac: 0.5, // 0 to 1 position along the 1D array
      rampWidth: props.rampWidth ?? 4,
      inhibitionStrength: 0.18,
      inhibitionRadius: 2.2,
      low: 28,
      high: 88,
      selectedUnit: 16,
    };

    // Two-point state
    const twoPointState = {
      regionId: 'fingertip',
      separationMm: props.mode === 'two-point' ? 4.5 : 3.0,
    };

    // Rolling spike raster for spot mode oscilloscope
    const spikeHistory = []; // Array of { t, phase }
    let lastSpikeGenT = 0;

    // -------------------------------------------------------------------------
    // Left & Right Container Panels
    // -------------------------------------------------------------------------
    const leftPanel = el('g', { class: 'contrast-panel-left' }, svg);
    const rightPanel = el('g', { class: 'contrast-panel-right' }, svg);

    // Left panel card background (x: 14, y: 14, width: 372, height: 282)
    el('rect', {
      x: 14, y: 14, width: 372, height: 282, rx: 10,
      fill: 'rgba(190, 200, 255, 0.02)',
      stroke: 'rgba(190, 200, 255, 0.10)',
      'stroke-width': 1,
    }, leftPanel);

    // Right panel card background (x: 398, y: 14, width: 388, height: 282)
    el('rect', {
      x: 398, y: 14, width: 388, height: 282, rx: 10,
      fill: 'rgba(190, 200, 255, 0.02)',
      stroke: 'rgba(190, 200, 255, 0.10)',
      'stroke-width': 1,
    }, rightPanel);

    // Panel Header Titles
    const leftTitle = txt(leftPanel, {
      x: 28, y: 34, fill: C.muted, 'font-size': 9.5, 'letter-spacing': '0.08em', 'font-weight': 600,
    }, 'SENSORY SURFACE');

    const rightTitle = txt(rightPanel, {
      x: 412, y: 34, fill: C.muted, 'font-size': 9.5, 'letter-spacing': '0.08em', 'font-weight': 600,
    }, 'NEURAL FIRING & READOUT');

    // -------------------------------------------------------------------------
    // MODE 1: SPOT & CENTER-SURROUND RECEPTIVE FIELD
    // -------------------------------------------------------------------------
    const spotGroup = el('g', { class: 'mode-group-spot' }, svg);

    // Interactive Sensory Pad (x: 26, y: 48, width: 348, height: 212)
    const padX = 26;
    const padY = 48;
    const padW = 348;
    const padH = 212;
    const rfCenterPx = { x: padX + padW / 2, y: padY + padH / 2 };
    const pxScale = 30; // 30 pixels per RF sigma

    const padRect = el('rect', {
      x: padX, y: padY, width: padW, height: padH, rx: 8,
      fill: '#080a12',
      stroke: 'rgba(190, 200, 255, 0.14)',
      'stroke-width': 1,
      style: 'cursor: crosshair;',
    }, spotGroup);

    // Subtle grid pattern on sensory pad
    const padGrid = el('g', { opacity: 0.15 }, spotGroup);
    for (let gx = padX + 24; gx < padX + padW; gx += 24) {
      el('line', { x1: gx, y1: padY, x2: gx, y2: padY + padH, stroke: C.cell, 'stroke-width': 0.5 }, padGrid);
    }
    for (let gy = padY + 24; gy < padY + padH; gy += 24) {
      el('line', { x1: padX, y1: gy, x2: padX + padW, y2: gy, stroke: C.cell, 'stroke-width': 0.5 }, padGrid);
    }

    // Receptive Field concentric zones
    const rfSurroundCircle = el('circle', {
      cx: rfCenterPx.x, cy: rfCenterPx.y,
      r: spotState.rfSigmaS * pxScale,
      fill: 'rgba(255, 107, 125, 0.08)',
      stroke: C.inhibit,
      'stroke-width': 1.5,
      'stroke-dasharray': '4 3',
    }, spotGroup);

    const rfCenterCircle = el('circle', {
      cx: rfCenterPx.x, cy: rfCenterPx.y,
      r: spotState.rfSigmaC * pxScale,
      fill: 'rgba(255, 207, 107, 0.14)',
      stroke: C.excite,
      'stroke-width': 1.8,
    }, spotGroup);

    // Plus and Minus annotation symbols inside RF
    const rfCenterPlus = txt(spotGroup, {
      x: rfCenterPx.x, y: rfCenterPx.y + 4.5,
      fill: C.excite, 'font-size': 14, 'font-weight': 700, 'text-anchor': 'middle',
    }, '+');

    const rfSurroundMinusTop = txt(spotGroup, {
      x: rfCenterPx.x, y: rfCenterPx.y - spotState.rfSigmaC * pxScale - 16,
      fill: C.inhibit, 'font-size': 14, 'font-weight': 700, 'text-anchor': 'middle',
    }, '−');

    const rfSurroundMinusBottom = txt(spotGroup, {
      x: rfCenterPx.x, y: rfCenterPx.y + spotState.rfSigmaC * pxScale + 24,
      fill: C.inhibit, 'font-size': 14, 'font-weight': 700, 'text-anchor': 'middle',
    }, '−');

    // Movable Light Spot stimulus
    const lightSpot = el('circle', {
      cx: rfCenterPx.x, cy: rfCenterPx.y,
      r: spotState.radius * pxScale,
      fill: 'rgba(255, 240, 180, 0.28)',
      stroke: '#fff4cc',
      'stroke-width': 2,
    }, spotGroup);
    glow(lightSpot);

    const spotCenterDot = el('circle', {
      cx: rfCenterPx.x, cy: rfCenterPx.y,
      r: 3,
      fill: '#ffffff',
    }, spotGroup);

    // Status bar at bottom of pad
    const spotStatusPill = el('rect', {
      x: padX + 8, y: padY + padH - 24, width: padW - 16, height: 18, rx: 4,
      fill: 'rgba(10, 14, 26, 0.85)',
      stroke: 'rgba(190, 200, 255, 0.12)',
      'stroke-width': 0.8,
    }, spotGroup);

    const spotStatusText = txt(spotGroup, {
      x: padX + padW / 2, y: padY + padH - 11.5,
      fill: C.excite, 'font-size': 9, 'font-weight': 600, 'text-anchor': 'middle',
    }, 'Center illuminated: intense firing');

    // -------------------------------------------------------------------------
    // Spot Mode Right Panel: Gauge & Oscilloscope
    // -------------------------------------------------------------------------
    // Firing Rate Readout Box (x: 412, y: 50, width: 360, height: 92)
    el('rect', {
      x: 412, y: 48, width: 360, height: 90, rx: 8,
      fill: 'rgba(12, 16, 28, 0.7)',
      stroke: 'rgba(190, 200, 255, 0.12)',
      'stroke-width': 1,
    }, spotGroup);

    txt(spotGroup, {
      x: 424, y: 66, fill: C.muted, 'font-size': 9, 'letter-spacing': '0.06em',
    }, 'GANGLION CELL FIRING RATE');

    const rateHzValue = txt(spotGroup, {
      x: 424, y: 104, fill: C.excite, 'font-size': 32, 'font-weight': 700,
    }, '85 Hz');

    const rateStateBadge = txt(spotGroup, {
      x: 550, y: 88, fill: C.excite, 'font-size': 11, 'font-weight': 600,
    }, 'INTENSE BURST');

    const rateStateSub = txt(spotGroup, {
      x: 550, y: 104, fill: C.muted, 'font-size': 9.5,
    }, 'Light fills center without surround drag');

    // Horizontal Rate Meter Bar
    const meterBg = el('rect', {
      x: 424, y: 118, width: 336, height: 10, rx: 5,
      fill: 'rgba(190, 200, 255, 0.08)',
      stroke: 'rgba(190, 200, 255, 0.14)',
      'stroke-width': 0.8,
    }, spotGroup);

    const meterFill = el('rect', {
      x: 424, y: 118, width: 180, height: 10, rx: 5,
      fill: C.excite,
    }, spotGroup);

    // Baseline marker tick at 15 Hz
    const baseTickX = 424 + (15 / contrastWorld.MAX_HZ) * 336;
    el('line', {
      x1: baseTickX, y1: 114, x2: baseTickX, y2: 132,
      stroke: '#9aa6d6', 'stroke-width': 1.8,
    }, spotGroup);

    txt(spotGroup, {
      x: baseTickX, y: 140, fill: '#9aa6d6', 'font-size': 7.5, 'text-anchor': 'middle',
    }, 'REST 15 Hz');

    // Oscilloscope Box (x: 412, y: 154, width: 360, height: 128)
    const oscX = 412;
    const oscY = 152;
    const oscW = 360;
    const oscH = 130;

    el('rect', {
      x: oscX, y: oscY, width: oscW, height: oscH, rx: 8,
      fill: '#06080e',
      stroke: 'rgba(190, 200, 255, 0.14)',
      'stroke-width': 1,
    }, spotGroup);

    // Oscilloscope grid lines
    for (let gy = oscY + 26; gy < oscY + oscH; gy += 26) {
      el('line', {
        x1: oscX, y1: gy, x2: oscX + oscW, y2: gy,
        stroke: 'rgba(190, 200, 255, 0.06)', 'stroke-width': 0.5,
      }, spotGroup);
    }
    for (let gx = oscX + 45; gx < oscX + oscW; gx += 45) {
      el('line', {
        x1: gx, y1: oscY, x2: gx, y2: oscY + oscH,
        stroke: 'rgba(190, 200, 255, 0.06)', 'stroke-width': 0.5,
      }, spotGroup);
    }

    txt(spotGroup, {
      x: oscX + 12, y: oscY + 16, fill: C.muted, 'font-size': 8.5, 'letter-spacing': '0.06em',
    }, 'LIVE ACTION POTENTIAL SPIKE TRAIN');

    // Oscilloscope waveform polyline
    const oscPath = el('path', {
      fill: 'none',
      stroke: C.excite,
      'stroke-width': 1.5,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    }, spotGroup);

    // -------------------------------------------------------------------------
    // MODE 2: EDGE & MACH BANDS (LATERAL INHIBITION ARRAY)
    // -------------------------------------------------------------------------
    const edgeGroup = el('g', { class: 'mode-group-edge', opacity: 0 }, svg);

    // Left subpanel: Physical Stimulus Gradient & Receptor Array
    txt(edgeGroup, {
      x: 28, y: 52, fill: C.muted, 'font-size': 9, 'letter-spacing': '0.06em',
    }, 'PHYSICAL LUMINANCE & PHOTORECEPTORS');

    // Gradient bar representation
    const gradX = 26;
    const gradY = 60;
    const gradW = 348;
    const gradH = 28;

    // Defs for linear gradient
    const gradId = `mach-grad-${++clipCounter}`;
    let defs = svg.querySelector('defs');
    if (!defs) {
      defs = el('defs', {}, null);
      svg.insertBefore(defs, svg.firstChild);
    }
    const lGrad = el('linearGradient', { id: gradId, x1: '0%', y1: '0%', x2: '100%', y2: '0%' }, defs);
    const stopDark = el('stop', { offset: '40%', 'stop-color': '#2a3147' }, lGrad);
    const stopBright = el('stop', { offset: '60%', 'stop-color': '#eef2ff' }, lGrad);

    const gradBar = el('rect', {
      x: gradX, y: gradY, width: gradW, height: gradH, rx: 6,
      fill: `url(#${gradId})`,
      stroke: 'rgba(190, 200, 255, 0.2)',
      'stroke-width': 1,
    }, edgeGroup);

    // Edge position line that user can drag
    const edgeMarker = el('line', {
      x1: gradX + gradW * edgeState.stepFrac, y1: gradY - 4,
      x2: gradX + gradW * edgeState.stepFrac, y2: gradY + gradH + 4,
      stroke: '#ffcf6b', 'stroke-width': 2, 'stroke-dasharray': '2 2',
    }, edgeGroup);

    // Receptor array dots (24 sensory receptors)
    const receptorUnitsGroup = el('g', {}, edgeGroup);
    const receptorCount = 24;
    const receptorEls = [];
    const receptorSpacing = gradW / receptorCount;

    for (let i = 0; i < receptorCount; i++) {
      const rx = gradX + (i + 0.5) * receptorSpacing;
      const ry = 120;

      // Receptor body
      const rDot = el('circle', {
        cx: rx, cy: ry, r: 4.5,
        fill: C.cell,
        stroke: '#080a12',
        'stroke-width': 1,
      }, receptorUnitsGroup);

      // Connecting axon fiber down to horizontal cell plexus
      el('line', {
        x1: rx, y1: ry + 5, x2: rx, y2: 154,
        stroke: 'rgba(205, 213, 255, 0.3)', 'stroke-width': 1,
      }, receptorUnitsGroup);

      receptorEls.push(rDot);
    }

    txt(edgeGroup, {
      x: 28, y: 114, fill: C.muted, 'font-size': 8.5,
    }, 'Photoreceptor layer');

    // Horizontal cells & lateral inhibition arches
    txt(edgeGroup, {
      x: 28, y: 168, fill: C.inhibit, 'font-size': 8.5,
    }, 'Horizontal cells (GABA lateral inhibition)');

    const lateralArches = el('g', { opacity: 0.7 }, edgeGroup);
    for (let i = 0; i < receptorCount - 1; i++) {
      const x1 = gradX + (i + 0.5) * receptorSpacing;
      const x2 = gradX + (i + 1.5) * receptorSpacing;
      el('path', {
        d: `M${x1} 154 Q${(x1 + x2) / 2} 172 ${x2} 154`,
        fill: 'none', stroke: C.inhibit, 'stroke-width': 1, 'stroke-dasharray': '2 2',
      }, lateralArches);
    }

    // Explanation card on left
    const edgeExplainer = el('rect', {
      x: 26, y: 184, width: gradW, height: 96, rx: 8,
      fill: 'rgba(12, 16, 28, 0.85)',
      stroke: 'rgba(190, 200, 255, 0.12)',
      'stroke-width': 1,
    }, edgeGroup);

    const edgeExpTitle = txt(edgeGroup, {
      x: 38, y: 204, fill: C.excite, 'font-size': 10, 'font-weight': 700,
    }, 'Why the bright border overshoots');

    const edgeExpLine1 = txt(edgeGroup, {
      x: 38, y: 224, fill: C.ink, 'font-size': 9,
    }, 'Receptors on the bright edge neighbor dark cells that fire very little.');

    const edgeExpLine2 = txt(edgeGroup, {
      x: 38, y: 240, fill: C.ink, 'font-size': 9,
    }, 'Because dark neighbors send little lateral inhibition, the edge cell');

    const edgeExpLine3 = txt(edgeGroup, {
      x: 38, y: 256, fill: C.excite, 'font-size': 9, 'font-weight': 600,
    }, 'escapes suppression and fires MORE than cells deep in the light!');

    // Right subpanel: Mach Bands Dual Graph (Physical vs Perceived)
    txt(edgeGroup, {
      x: 412, y: 52, fill: C.muted, 'font-size': 9, 'letter-spacing': '0.06em',
    }, 'STIMULUS VS NEURAL FIRING PROFILE');

    const plotX = 412;
    const plotY = 62;
    const plotW = 360;
    const plotH = 160;

    // Graph background
    el('rect', {
      x: plotX, y: plotY, width: plotW, height: plotH, rx: 8,
      fill: '#06080e',
      stroke: 'rgba(190, 200, 255, 0.12)',
      'stroke-width': 1,
    }, edgeGroup);

    // Plot grid lines
    for (let gy = plotY + 32; gy < plotY + plotH; gy += 32) {
      el('line', {
        x1: plotX, y1: gy, x2: plotX + plotW, y2: gy,
        stroke: 'rgba(190, 200, 255, 0.06)', 'stroke-width': 0.5,
      }, edgeGroup);
    }

    // Physical stimulus line (dashed cyan)
    const physLine = el('path', {
      fill: 'none', stroke: '#6be4ff', 'stroke-width': 1.8, 'stroke-dasharray': '4 3',
    }, edgeGroup);

    // Perceived neural response line (solid gold)
    const neuralLine = el('path', {
      fill: 'none', stroke: C.excite, 'stroke-width': 2.4,
    }, edgeGroup);
    glow(neuralLine);

    // Annotations on graph
    const brightPeakMarker = el('circle', {
      cx: plotX + 180, cy: plotY + 40, r: 4, fill: C.excite,
    }, edgeGroup);

    const brightPeakLabel = txt(edgeGroup, {
      x: plotX + 180, y: plotY + 30, fill: C.excite, 'font-size': 8.5, 'font-weight': 700, 'text-anchor': 'middle',
    }, 'BRIGHT MACH BAND');

    const darkTroughMarker = el('circle', {
      cx: plotX + 120, cy: plotY + 130, r: 4, fill: C.inhibit,
    }, edgeGroup);

    const darkTroughLabel = txt(edgeGroup, {
      x: plotX + 120, y: plotY + 148, fill: C.inhibit, 'font-size': 8.5, 'font-weight': 700, 'text-anchor': 'middle',
    }, 'DARK MACH BAND');

    // Graph Legend in header area above the plot (y = 52)
    el('line', {
      x1: plotX + 175, y1: 49, x2: plotX + 193, y2: 49,
      stroke: '#6be4ff', 'stroke-width': 1.8, 'stroke-dasharray': '3 2',
    }, edgeGroup);
    txt(edgeGroup, {
      x: plotX + 197, y: 52, fill: '#6be4ff', 'font-size': 8,
    }, 'Physical light');

    el('line', {
      x1: plotX + 260, y1: 49, x2: plotX + 278, y2: 49,
      stroke: C.excite, 'stroke-width': 2,
    }, edgeGroup);
    txt(edgeGroup, {
      x: plotX + 282, y: 52, fill: C.excite, 'font-size': 8,
    }, 'Perceived firing');

    // Bottom Summary Card in edge mode
    const edgeSummaryCard = el('rect', {
      x: plotX, y: plotY + plotH + 8, width: plotW, height: 48, rx: 6,
      fill: 'rgba(12, 16, 28, 0.7)',
      stroke: 'rgba(190, 200, 255, 0.1)',
      'stroke-width': 0.8,
    }, edgeGroup);

    const edgeStatsText = txt(edgeGroup, {
      x: plotX + 14, y: plotY + plotH + 28, fill: C.ink, 'font-size': 10, 'font-weight': 600,
    }, 'Border contrast amplified: step difference sharpened by 280%');

    const edgeStatsSub = txt(edgeGroup, {
      x: plotX + 14, y: plotY + plotH + 44, fill: C.muted, 'font-size': 8.5,
    }, 'Lateral inhibition exaggerates changes in luminance to detect edges faster');

    // -------------------------------------------------------------------------
    // MODE 3: TWO-POINT DISCRIMINATION (WEBER'S CALIPER TEST)
    // -------------------------------------------------------------------------
    const twoPointGroup = el('g', { class: 'mode-group-two-point', opacity: 0 }, svg);

    // Left subpanel: Skin Surface & Caliper Compass
    txt(twoPointGroup, {
      x: 28, y: 52, fill: C.muted, 'font-size': 9, 'letter-spacing': '0.06em',
    }, 'SKIN SURFACE & RECEPTIVE FIELD DENSITY');

    const skinPadX = 26;
    const skinPadY = 62;
    const skinPadW = 348;
    const skinPadH = 138;

    el('rect', {
      x: skinPadX, y: skinPadY, width: skinPadW, height: skinPadH, rx: 8,
      fill: '#080b14',
      stroke: 'rgba(190, 200, 255, 0.12)',
      'stroke-width': 1,
    }, twoPointGroup);

    // Tiled receptive field circles on skin
    const skinRfTiling = el('g', { class: 'skin-rf-tiling' }, twoPointGroup);

    // Caliper instrument legs & tips
    const caliperGroup = el('g', {}, twoPointGroup);
    const caliperLeg1 = el('line', {
      stroke: '#dfe4ff', 'stroke-width': 2.5, 'stroke-linecap': 'round',
    }, caliperGroup);
    const caliperLeg2 = el('line', {
      stroke: '#dfe4ff', 'stroke-width': 2.5, 'stroke-linecap': 'round',
    }, caliperGroup);
    const caliperHinge = el('circle', {
      cx: skinPadX + skinPadW / 2, cy: skinPadY + 16, r: 4, fill: '#ffcf6b', stroke: '#fff', 'stroke-width': 1,
    }, caliperGroup);

    const caliperTip1 = el('circle', {
      r: 4.5, fill: '#ffcf6b', stroke: '#fff', 'stroke-width': 1.2,
    }, caliperGroup);
    const caliperTip2 = el('circle', {
      r: 4.5, fill: '#ffcf6b', stroke: '#fff', 'stroke-width': 1.2,
    }, caliperGroup);
    glow(caliperTip1);
    glow(caliperTip2);

    // Caliper distance label
    const caliperDistLabel = txt(twoPointGroup, {
      x: skinPadX + skinPadW / 2, y: skinPadY + skinPadH - 10,
      fill: C.excite, 'font-size': 9.5, 'font-weight': 700, 'text-anchor': 'middle',
    }, 'Separation: 4.0 mm');

    // Body Region Info Card below skin pad
    const regionInfoCard = el('rect', {
      x: skinPadX, y: skinPadY + skinPadH + 10, width: skinPadW, height: 70, rx: 6,
      fill: 'rgba(12, 16, 28, 0.8)',
      stroke: 'rgba(190, 200, 255, 0.1)',
      'stroke-width': 0.8,
    }, twoPointGroup);

    const regionTitle = txt(twoPointGroup, {
      x: skinPadX + 14, y: skinPadY + skinPadH + 28, fill: C.excite, 'font-size': 11, 'font-weight': 700,
    }, 'Fingertip');

    const regionDensityTxt = txt(twoPointGroup, {
      x: skinPadX + 14, y: skinPadY + skinPadH + 46, fill: C.ink, 'font-size': 9,
    }, 'Receptor density: ~240 units / cm² (RF diameter ~2.0 mm)');

    const regionDescTxt = txt(twoPointGroup, {
      x: skinPadX + 14, y: skinPadY + skinPadH + 62, fill: C.muted, 'font-size': 8.5,
    }, 'Tiny receptive fields let you distinguish Braille dots and fine textures.');

    // Right subpanel: Population Neural Excitation Profile
    txt(twoPointGroup, {
      x: 412, y: 52, fill: C.muted, 'font-size': 9, 'letter-spacing': '0.06em',
    }, 'CORTICAL POPULATION PROFILE');

    const resPlotX = 412;
    const resPlotY = 62;
    const resPlotW = 360;
    const resPlotH = 138;

    el('rect', {
      x: resPlotX, y: resPlotY, width: resPlotW, height: resPlotH, rx: 8,
      fill: '#06080e',
      stroke: 'rgba(190, 200, 255, 0.12)',
      'stroke-width': 1,
    }, twoPointGroup);

    // Profile curve path
    const resCurvePath = el('path', {
      fill: 'none', stroke: C.excite, 'stroke-width': 2.4,
    }, twoPointGroup);
    glow(resCurvePath);

    // Valley threshold line
    const threshLine = el('line', {
      stroke: 'rgba(255, 107, 125, 0.6)', 'stroke-width': 1.2, 'stroke-dasharray': '3 3',
    }, twoPointGroup);

    const threshText = txt(twoPointGroup, {
      fill: C.inhibit, 'font-size': 8,
    }, '11% dip threshold');

    // Large Resolution Decision Badge (Bottom Right)
    const decisionCard = el('rect', {
      x: resPlotX, y: resPlotY + resPlotH + 10, width: resPlotW, height: 70, rx: 8,
      fill: 'rgba(12, 16, 28, 0.9)',
      stroke: 'rgba(190, 200, 255, 0.12)',
      'stroke-width': 1,
    }, twoPointGroup);

    const decisionBadge = txt(twoPointGroup, {
      x: resPlotX + resPlotW / 2, y: resPlotY + resPlotH + 34,
      fill: '#7df0c0', 'font-size': 13, 'font-weight': 700, 'text-anchor': 'middle',
    }, 'TWO DISTINCT POINTS RESOLVED');

    const decisionSub = txt(twoPointGroup, {
      x: resPlotX + resPlotW / 2, y: resPlotY + resPlotH + 54,
      fill: C.muted, 'font-size': 9, 'text-anchor': 'middle',
    }, 'Deep valley in neural firing allows primary somatosensory cortex to separate points');

    // -------------------------------------------------------------------------
    // Logic & Update Functions
    // -------------------------------------------------------------------------

    function switchMode(newMode) {
      activeMode = newMode;
      spotGroup.setAttribute('opacity', activeMode === 'spot' ? '1' : '0');
      spotGroup.setAttribute('style', activeMode === 'spot' ? 'pointer-events: all;' : 'pointer-events: none;');

      edgeGroup.setAttribute('opacity', activeMode === 'edge' ? '1' : '0');
      edgeGroup.setAttribute('style', activeMode === 'edge' ? 'pointer-events: all;' : 'pointer-events: none;');

      twoPointGroup.setAttribute('opacity', activeMode === 'two-point' ? '1' : '0');
      twoPointGroup.setAttribute('style', activeMode === 'two-point' ? 'pointer-events: all;' : 'pointer-events: none;');

      if (activeMode === 'spot') {
        leftTitle.textContent = 'SENSORY SURFACE: RETINAL GANGLION RECEPTIVE FIELD';
        rightTitle.textContent = 'NEURAL FIRING RATE & ACTION POTENTIALS';
        updateSpotSimulation();
      } else if (activeMode === 'edge') {
        leftTitle.textContent = 'LATERAL INHIBITION: 1D PHOTORECEPTOR ARRAY';
        rightTitle.textContent = 'MACH BANDS: EDGE CONTRAST SHARPENING';
        updateEdgeSimulation();
      } else if (activeMode === 'two-point') {
        leftTitle.textContent = 'TACTILE SURFACE: WEBER TWO-POINT CALIPER';
        rightTitle.textContent = 'SOMATOSENSORY CORTEX RESOLUTION';
        updateTwoPointSimulation();
      }
    }

    // 1. Spot Mode Updates
    function updateSpotSimulation() {
      const resp = world.spotResponseAt({
        spotX: spotState.x,
        spotY: spotState.y,
        spotRadius: spotState.radius,
        spotIntensity: spotState.intensity,
        rfX: 0,
        rfY: 0,
        Ac: 1.0,
        As: 0.111,
        sigmaC: spotState.rfSigmaC,
        sigmaS: spotState.rfSigmaS,
        baselineHz: spotState.baselineHz,
        gainHz: 11.0,
      });

      spotState.currentHz = resp.hz;
      spotState.state = resp.state;

      // Update spot SVG element position & radius
      const spotPxX = rfCenterPx.x + spotState.x * pxScale;
      const spotPxY = rfCenterPx.y + spotState.y * pxScale;
      lightSpot.setAttribute('cx', spotPxX.toFixed(1));
      lightSpot.setAttribute('cy', spotPxY.toFixed(1));
      lightSpot.setAttribute('r', (spotState.radius * pxScale).toFixed(1));
      spotCenterDot.setAttribute('cx', spotPxX.toFixed(1));
      spotCenterDot.setAttribute('cy', spotPxY.toFixed(1));

      // Update right panel readouts
      rateHzValue.textContent = `${Math.round(resp.hz)} Hz`;
      const meterW = Math.max(4, Math.min(336, (resp.hz / contrastWorld.MAX_HZ) * 336));
      meterFill.setAttribute('width', meterW.toFixed(1));

      if (resp.state === 'excited') {
        rateHzValue.setAttribute('fill', C.excite);
        meterFill.setAttribute('fill', C.excite);
        rateStateBadge.textContent = 'INTENSE EXCITATION';
        rateStateBadge.setAttribute('fill', C.excite);
        rateStateSub.textContent = 'Center (+) depolarizes cell above baseline';
        spotStatusText.textContent = `Center illuminated: firing rate surges to ${Math.round(resp.hz)} Hz`;
        spotStatusText.setAttribute('fill', C.excite);
      } else if (resp.state === 'suppressed') {
        rateHzValue.setAttribute('fill', C.inhibit);
        meterFill.setAttribute('fill', C.inhibit);
        rateStateBadge.textContent = 'SURROUND SUPPRESSION';
        rateStateBadge.setAttribute('fill', C.inhibit);
        rateStateSub.textContent = 'Surround (−) hyperpolarizes cell below baseline';
        spotStatusText.textContent = `Surround illuminated: firing silenced to ${Math.round(resp.hz)} Hz`;
        spotStatusText.setAttribute('fill', C.inhibit);
      } else if (resp.state === 'cancelled') {
        rateHzValue.setAttribute('fill', '#9aa6d6');
        meterFill.setAttribute('fill', '#9aa6d6');
        rateStateBadge.textContent = 'DIFFUSE CANCELLATION';
        rateStateBadge.setAttribute('fill', '#9aa6d6');
        rateStateSub.textContent = 'Surround (−) cancels center (+), returning to rest';
        spotStatusText.textContent = `Diffuse uniform light: center and surround cancel (~${Math.round(resp.hz)} Hz)`;
        spotStatusText.setAttribute('fill', '#9aa6d6');
      } else {
        rateHzValue.setAttribute('fill', C.ink);
        meterFill.setAttribute('fill', '#9aa6d6');
        rateStateBadge.textContent = 'SPONTANEOUS BASELINE';
        rateStateBadge.setAttribute('fill', C.muted);
        rateStateSub.textContent = 'Resting spontaneous hum of ganglion neuron';
        spotStatusText.textContent = `Spot outside receptive field: steady ${Math.round(resp.hz)} Hz resting baseline`;
        spotStatusText.setAttribute('fill', C.muted);
      }
    }

    // 2. Edge Mode Updates
    function updateEdgeSimulation() {
      const stepIdx = Math.round(edgeState.stepFrac * 32);
      const sim = world.machBandSimulation({
        length: 32,
        low: edgeState.low,
        high: edgeState.high,
        stepAt: stepIdx,
        rampWidth: edgeState.rampWidth,
        radius: edgeState.inhibitionRadius,
        strength: edgeState.inhibitionStrength,
      });

      // Update edge marker line position on left pad
      const markerX = gradX + gradW * edgeState.stepFrac;
      edgeMarker.setAttribute('x1', markerX.toFixed(1));
      edgeMarker.setAttribute('x2', markerX.toFixed(1));

      // Update linear gradient stops
      const leftFrac = Math.max(0, edgeState.stepFrac - 0.08) * 100;
      const rightFrac = Math.min(100, (edgeState.stepFrac + 0.08) * 100);
      stopDark.setAttribute('offset', `${leftFrac.toFixed(1)}%`);
      stopBright.setAttribute('offset', `${rightFrac.toFixed(1)}%`);

      // Update receptor dots color based on local physical luminance
      for (let i = 0; i < receptorCount; i++) {
        const uFrac = (i + 0.5) / receptorCount;
        const lum = uFrac < edgeState.stepFrac ? edgeState.low : edgeState.high;
        const norm = (lum - 20) / 80;
        const col = Math.round(150 + norm * 105);
        receptorEls[i].setAttribute('fill', `rgb(${col}, ${col}, 255)`);
      }

      // Build graph paths for physical vs perceived
      let physD = '';
      let neuralD = '';

      for (let i = 0; i < sim.length; i++) {
        const px = plotX + (i / (sim.length - 1)) * plotW;

        // Map physical (20..100) to py with raised floor
        const pyPhys = plotY + plotH - 26 - ((sim.stimulus[i] - 15) / 85) * (plotH - 44);
        physD += `${i === 0 ? 'M' : 'L'}${px.toFixed(1)} ${pyPhys.toFixed(1)} `;

        // Map neural response (0..60) to py with raised floor
        const pyNeural = plotY + plotH - 26 - (sim.response[i] / 55) * (plotH - 44);
        neuralD += `${i === 0 ? 'M' : 'L'}${px.toFixed(1)} ${pyNeural.toFixed(1)} `;
      }

      physLine.setAttribute('d', physD);
      neuralLine.setAttribute('d', neuralD);

      // Position Mach band peak & trough callout markers
      if (sim.maxIdx >= 0) {
        const peakX = plotX + (sim.maxIdx / (sim.length - 1)) * plotW;
        const peakY = plotY + plotH - 26 - (sim.maxVal / 55) * (plotH - 44);
        brightPeakMarker.setAttribute('cx', peakX.toFixed(1));
        brightPeakMarker.setAttribute('cy', peakY.toFixed(1));
        brightPeakLabel.setAttribute('x', peakX.toFixed(1));
        brightPeakLabel.setAttribute('y', (peakY - 8).toFixed(1));
      }

      if (sim.minIdx >= 0) {
        const troughX = plotX + (sim.minIdx / (sim.length - 1)) * plotW;
        const troughY = plotY + plotH - 26 - (sim.minVal / 55) * (plotH - 44);
        darkTroughMarker.setAttribute('cx', troughX.toFixed(1));
        darkTroughMarker.setAttribute('cy', troughY.toFixed(1));
        darkTroughLabel.setAttribute('x', troughX.toFixed(1));
        darkTroughLabel.setAttribute('y', Math.min(plotY + plotH - 8, troughY + 14).toFixed(1));
      }

      // Update statistics
      edgeStatsText.textContent = `Border contrast enhanced: ${sim.ratio}x edge firing ratio (Undershoot: -${sim.darkUndershoot}, Overshoot: +${sim.brightOvershoot})`;
    }

    // 3. Two-Point Mode Updates
    function updateTwoPointSimulation() {
      const reg = world.BODY_REGIONS[twoPointState.regionId] || world.BODY_REGIONS.fingertip;
      const sim = world.twoPointSimulation(twoPointState.separationMm, {
        rfMm: reg.rfMm,
        inhibitionStrength: 0.28,
        samplePoints: 51,
        spanMm: 60,
      });

      // Update region card details
      regionTitle.textContent = reg.name;
      regionDensityTxt.textContent = `Receptor density: ${reg.densityLabel} (Threshold: ${reg.thresholdMm} mm)`;
      regionDescTxt.textContent = reg.desc;

      // Draw Caliper instrument on skin pad
      const midPadX = skinPadX + skinPadW / 2;
      const midPadY = skinPadY + 16;
      const skinSurfaceY = skinPadY + skinPadH - 28;

      // Scale: 60 mm spans skinPadW - 40 px
      const pxPerMm = (skinPadW - 50) / 60;
      const halfSepPx = (twoPointState.separationMm / 2) * pxPerMm;

      const tip1X = midPadX - halfSepPx;
      const tip2X = midPadX + halfSepPx;

      caliperHinge.setAttribute('cx', midPadX.toFixed(1));
      caliperHinge.setAttribute('cy', midPadY.toFixed(1));

      caliperLeg1.setAttribute('x1', midPadX.toFixed(1));
      caliperLeg1.setAttribute('y1', midPadY.toFixed(1));
      caliperLeg1.setAttribute('x2', tip1X.toFixed(1));
      caliperLeg1.setAttribute('y2', skinSurfaceY.toFixed(1));

      caliperLeg2.setAttribute('x1', midPadX.toFixed(1));
      caliperLeg2.setAttribute('y1', midPadY.toFixed(1));
      caliperLeg2.setAttribute('x2', tip2X.toFixed(1));
      caliperLeg2.setAttribute('y2', skinSurfaceY.toFixed(1));

      caliperTip1.setAttribute('cx', tip1X.toFixed(1));
      caliperTip1.setAttribute('cy', skinSurfaceY.toFixed(1));
      caliperTip2.setAttribute('cx', tip2X.toFixed(1));
      caliperTip2.setAttribute('cy', skinSurfaceY.toFixed(1));

      caliperDistLabel.textContent = `Caliper tip distance: ${twoPointState.separationMm.toFixed(1)} mm`;

      // Draw skin receptive field tiling circles
      skinRfTiling.innerHTML = '';
      const rfDiameterPx = reg.rfMm * pxPerMm;
      const rfCount = Math.floor((skinPadW - 20) / Math.max(12, rfDiameterPx));

      for (let i = 0; i < rfCount; i++) {
        const cx = skinPadX + 18 + i * Math.max(12, rfDiameterPx);
        const cy = skinSurfaceY;
        el('circle', {
          cx: cx.toFixed(1), cy: cy.toFixed(1), r: (rfDiameterPx / 2).toFixed(1),
          fill: 'rgba(205, 213, 255, 0.05)',
          stroke: 'rgba(205, 213, 255, 0.25)',
          'stroke-width': 1,
        }, skinRfTiling);
      }

      // Draw cortical population response curve
      let resD = '';
      const pts = sim.positions;
      const act = sim.sharpened;
      const maxPlotVal = Math.max(0.5, sim.peakActivity * 1.15);

      for (let i = 0; i < pts.length; i++) {
        const px = resPlotX + (i / (pts.length - 1)) * resPlotW;
        const py = resPlotY + resPlotH - (act[i] / maxPlotVal) * (resPlotH - 24) - 12;
        resD += `${i === 0 ? 'M' : 'L'}${px.toFixed(1)} ${py.toFixed(1)} `;
      }
      resCurvePath.setAttribute('d', resD);

      // Position valley threshold line and text inside plot
      if (sim.peakActivity >= 0.05) {
        const threshVal = sim.peakActivity * (1 - 0.11);
        const threshY = resPlotY + resPlotH - (threshVal / maxPlotVal) * (resPlotH - 24) - 12;
        threshLine.setAttribute('x1', String(resPlotX + 8));
        threshLine.setAttribute('y1', threshY.toFixed(1));
        threshLine.setAttribute('x2', String(resPlotX + resPlotW - 8));
        threshLine.setAttribute('y2', threshY.toFixed(1));
        threshLine.setAttribute('opacity', '0.85');

        threshText.setAttribute('x', String(resPlotX + resPlotW - 12));
        threshText.setAttribute('y', (threshY - 4).toFixed(1));
        threshText.setAttribute('text-anchor', 'end');
        threshText.setAttribute('opacity', '0.9');
      } else {
        threshLine.setAttribute('opacity', '0');
        threshText.setAttribute('opacity', '0');
      }

      // Update Decision Badge
      if (sim.isResolved) {
        decisionBadge.textContent = 'TWO DISTINCT POINTS RESOLVED';
        decisionBadge.setAttribute('fill', '#7df0c0');
        decisionCard.setAttribute('stroke', 'rgba(125, 240, 192, 0.35)');
        decisionSub.textContent = `Valley dip: ${Math.round(sim.valleyDepth * 100)}% (Threshold: 11%). Brain perceives two separate touches!`;
      } else {
        decisionBadge.textContent = 'MERGED: PERCEIVED AS ONE TOUCH';
        decisionBadge.setAttribute('fill', '#ffcf6b');
        decisionCard.setAttribute('stroke', 'rgba(255, 207, 107, 0.35)');
        decisionSub.textContent = `Valley dip: ${Math.round(sim.valleyDepth * 100)}% (Too shallow). Receptive fields merge into a single sensation.`;
      }
    }

    // -------------------------------------------------------------------------
    // Interactive Pointer / Drag Handlers
    // -------------------------------------------------------------------------
    let isDraggingSpot = false;
    let isDraggingEdge = false;

    function handlePointerDown(e) {
      const rect = svg.getBoundingClientRect();
      const ptX = ((e.clientX - rect.left) / rect.width) * width;
      const ptY = ((e.clientY - rect.top) / rect.height) * height;

      if (activeMode === 'spot') {
        if (ptX >= padX && ptX <= padX + padW && ptY >= padY && ptY <= padY + padH) {
          isDraggingSpot = true;
          spotState.x = (ptX - rfCenterPx.x) / pxScale;
          spotState.y = (ptY - rfCenterPx.y) / pxScale;
          updateSpotSimulation();
        }
      } else if (activeMode === 'edge') {
        if (ptX >= gradX && ptX <= gradX + gradW && ptY >= gradY - 10 && ptY <= gradY + gradH + 20) {
          isDraggingEdge = true;
          edgeState.stepFrac = Math.max(0.1, Math.min(0.9, (ptX - gradX) / gradW));
          updateEdgeSimulation();
        }
      }
    }

    function handlePointerMove(e) {
      if (!isDraggingSpot && !isDraggingEdge) return;
      const rect = svg.getBoundingClientRect();
      const ptX = ((e.clientX - rect.left) / rect.width) * width;
      const ptY = ((e.clientY - rect.top) / rect.height) * height;

      if (isDraggingSpot) {
        spotState.x = Math.max(-5, Math.min(5, (ptX - rfCenterPx.x) / pxScale));
        spotState.y = Math.max(-3.5, Math.min(3.5, (ptY - rfCenterPx.y) / pxScale));
        updateSpotSimulation();
      } else if (isDraggingEdge) {
        edgeState.stepFrac = Math.max(0.1, Math.min(0.9, (ptX - gradX) / gradW));
        updateEdgeSimulation();
      }
    }

    function handlePointerUp() {
      isDraggingSpot = false;
      isDraggingEdge = false;
    }

    svg.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // -------------------------------------------------------------------------
    // Dock Controls Wiring via ctx.setControls
    // -------------------------------------------------------------------------
    let sizeSlider = null;
    let sizeLabel = null;
    let calSlider = null;
    let calLabel = null;
    let playBtn = null;

    if (setControls) {
      const ctrls = document.createElement('div');
      ctrls.className = 'dock-ctrl-group';
      ctrls.style.display = 'flex';
      ctrls.style.alignItems = 'center';
      ctrls.style.gap = '10px';
      ctrls.style.flexWrap = 'wrap';

      // Mode Switcher Buttons
      const modeBtnGroup = document.createElement('div');
      modeBtnGroup.style.display = 'flex';
      modeBtnGroup.style.gap = '4px';

      const spotBtn = document.createElement('button');
      spotBtn.type = 'button';
      spotBtn.className = 'dock-btn';
      spotBtn.textContent = 'Center-Surround';
      spotBtn.setAttribute('aria-pressed', activeMode === 'spot' ? 'true' : 'false');

      const edgeBtn = document.createElement('button');
      edgeBtn.type = 'button';
      edgeBtn.className = 'dock-btn';
      edgeBtn.textContent = 'Mach Bands';
      edgeBtn.setAttribute('aria-pressed', activeMode === 'edge' ? 'true' : 'false');

      const twoPointBtn = document.createElement('button');
      twoPointBtn.type = 'button';
      twoPointBtn.className = 'dock-btn';
      twoPointBtn.textContent = 'Two-Point Caliper';
      twoPointBtn.setAttribute('aria-pressed', activeMode === 'two-point' ? 'true' : 'false');

      function syncModeButtons() {
        spotBtn.setAttribute('aria-pressed', activeMode === 'spot' ? 'true' : 'false');
        edgeBtn.setAttribute('aria-pressed', activeMode === 'edge' ? 'true' : 'false');
        twoPointBtn.setAttribute('aria-pressed', activeMode === 'two-point' ? 'true' : 'false');

        if (spotWrap) spotWrap.style.display = activeMode === 'spot' ? 'flex' : 'none';
        if (edgeWrap) edgeWrap.style.display = activeMode === 'edge' ? 'flex' : 'none';
        if (twoPointWrap) twoPointWrap.style.display = activeMode === 'two-point' ? 'flex' : 'none';
      }

      spotBtn.addEventListener('click', () => { switchMode('spot'); syncModeButtons(); });
      edgeBtn.addEventListener('click', () => { switchMode('edge'); syncModeButtons(); });
      twoPointBtn.addEventListener('click', () => { switchMode('two-point'); syncModeButtons(); });

      modeBtnGroup.appendChild(spotBtn);
      modeBtnGroup.appendChild(edgeBtn);
      modeBtnGroup.appendChild(twoPointBtn);
      ctrls.appendChild(modeBtnGroup);

      // Spot mode controls (spot size slider + presets)
      const spotWrap = document.createElement('div');
      spotWrap.style.display = activeMode === 'spot' ? 'flex' : 'none';
      spotWrap.style.alignItems = 'center';
      spotWrap.style.gap = '8px';

      sizeLabel = document.createElement('span');
      sizeLabel.className = 'dock-label';
      sizeLabel.textContent = `Spot radius: ${spotState.radius.toFixed(1)} σ`;

      sizeSlider = document.createElement('input');
      sizeSlider.type = 'range';
      sizeSlider.className = 'dock-range';
      sizeSlider.min = '0.3';
      sizeSlider.max = '4.5';
      sizeSlider.step = '0.1';
      sizeSlider.value = String(spotState.radius);
      sizeSlider.addEventListener('input', (e) => {
        spotState.radius = parseFloat(e.target.value);
        sizeLabel.textContent = `Spot radius: ${spotState.radius.toFixed(1)} σ`;
        updateSpotSimulation();
      });

      const diffuseBtn = document.createElement('button');
      diffuseBtn.type = 'button';
      diffuseBtn.className = 'dock-btn';
      diffuseBtn.textContent = 'Diffuse Light';
      diffuseBtn.addEventListener('click', () => {
        spotState.x = 0;
        spotState.y = 0;
        spotState.radius = 3.8;
        sizeSlider.value = '3.8';
        sizeLabel.textContent = 'Spot radius: 3.8 σ (Diffuse)';
        updateSpotSimulation();
      });

      const centerBtn = document.createElement('button');
      centerBtn.type = 'button';
      centerBtn.className = 'dock-btn';
      centerBtn.textContent = 'Center Spot';
      centerBtn.addEventListener('click', () => {
        spotState.x = 0;
        spotState.y = 0;
        spotState.radius = 0.9;
        sizeSlider.value = '0.9';
        sizeLabel.textContent = 'Spot radius: 0.9 σ (Center)';
        updateSpotSimulation();
      });

      spotWrap.appendChild(sizeLabel);
      spotWrap.appendChild(sizeSlider);
      spotWrap.appendChild(centerBtn);
      spotWrap.appendChild(diffuseBtn);
      ctrls.appendChild(spotWrap);

      // Edge mode controls (inhibition strength slider)
      const edgeWrap = document.createElement('div');
      edgeWrap.style.display = activeMode === 'edge' ? 'flex' : 'none';
      edgeWrap.style.alignItems = 'center';
      edgeWrap.style.gap = '8px';

      const inhLabel = document.createElement('span');
      inhLabel.className = 'dock-label';
      inhLabel.textContent = `Inhibition: ${(edgeState.inhibitionStrength * 100).toFixed(0)}%`;

      const inhSlider = document.createElement('input');
      inhSlider.type = 'range';
      inhSlider.className = 'dock-range';
      inhSlider.min = '0.0';
      inhSlider.max = '0.35';
      inhSlider.step = '0.02';
      inhSlider.value = String(edgeState.inhibitionStrength);
      inhSlider.addEventListener('input', (e) => {
        edgeState.inhibitionStrength = parseFloat(e.target.value);
        inhLabel.textContent = `Inhibition: ${(edgeState.inhibitionStrength * 100).toFixed(0)}%`;
        updateEdgeSimulation();
      });

      const stepBtn = document.createElement('button');
      stepBtn.type = 'button';
      stepBtn.className = 'dock-btn';
      stepBtn.textContent = 'Sharp Edge';
      stepBtn.addEventListener('click', () => {
        edgeState.rampWidth = 1;
        updateEdgeSimulation();
      });

      const rampBtn = document.createElement('button');
      rampBtn.type = 'button';
      rampBtn.className = 'dock-btn';
      rampBtn.textContent = 'Smooth Ramp';
      rampBtn.addEventListener('click', () => {
        edgeState.rampWidth = 6;
        updateEdgeSimulation();
      });

      edgeWrap.appendChild(inhLabel);
      edgeWrap.appendChild(inhSlider);
      edgeWrap.appendChild(stepBtn);
      edgeWrap.appendChild(rampBtn);
      ctrls.appendChild(edgeWrap);

      // Two-point mode controls (region preset + distance slider)
      const twoPointWrap = document.createElement('div');
      twoPointWrap.style.display = activeMode === 'two-point' ? 'flex' : 'none';
      twoPointWrap.style.alignItems = 'center';
      twoPointWrap.style.gap = '8px';

      calLabel = document.createElement('span');
      calLabel.className = 'dock-label';
      calLabel.textContent = `Caliper: ${twoPointState.separationMm.toFixed(1)} mm`;

      calSlider = document.createElement('input');
      calSlider.type = 'range';
      calSlider.className = 'dock-range';
      calSlider.min = '1.0';
      calSlider.max = '55.0';
      calSlider.step = '0.5';
      calSlider.value = String(twoPointState.separationMm);
      calSlider.addEventListener('input', (e) => {
        twoPointState.separationMm = parseFloat(e.target.value);
        calLabel.textContent = `Caliper: ${twoPointState.separationMm.toFixed(1)} mm`;
        updateTwoPointSimulation();
      });

      const regionSelect = document.createElement('select');
      regionSelect.className = 'dock-btn';
      regionSelect.style.padding = '4px 8px';
      regionSelect.innerHTML = `
        <option value="fingertip">Fingertip (2.5 mm threshold)</option>
        <option value="palm">Palm (10.0 mm threshold)</option>
        <option value="forearm">Forearm (35.0 mm threshold)</option>
        <option value="back">Back (50.0 mm threshold)</option>
      `;
      regionSelect.value = twoPointState.regionId;
      regionSelect.addEventListener('change', (e) => {
        twoPointState.regionId = e.target.value;
        const reg = world.BODY_REGIONS[twoPointState.regionId];
        twoPointState.separationMm = reg.thresholdMm * 1.2;
        calSlider.value = String(twoPointState.separationMm);
        calLabel.textContent = `Caliper: ${twoPointState.separationMm.toFixed(1)} mm`;
        updateTwoPointSimulation();
      });

      twoPointWrap.appendChild(calLabel);
      twoPointWrap.appendChild(calSlider);
      twoPointWrap.appendChild(regionSelect);
      ctrls.appendChild(twoPointWrap);

      // Play / Pause button
      playBtn = document.createElement('button');
      playBtn.type = 'button';
      playBtn.className = 'dock-btn';
      playBtn.textContent = isPlaying ? 'Pause' : 'Play';
      playBtn.addEventListener('click', () => {
        isPlaying = !isPlaying;
        playBtn.textContent = isPlaying ? 'Pause' : 'Play';
      });
      ctrls.appendChild(playBtn);

      setControls(ctrls);
    }

    // Initial simulation sync
    switchMode(activeMode);

    // -------------------------------------------------------------------------
    // Render Loop (Oscilloscope animation & spike trains)
    // -------------------------------------------------------------------------
    return {
      render(t) {
        if (!isPlaying) return;

        const dt = Math.max(0.001, Math.min(0.1, t - lastClockT));
        lastClockT = t;

        if (activeMode === 'spot') {
          // Generate spikes based on spotState.currentHz
          const spikeInterval = 1.0 / Math.max(1, spotState.currentHz);
          if (t - lastSpikeGenT >= spikeInterval) {
            spikeHistory.push(t);
            lastSpikeGenT = t;
          }

          // Clean up old spikes beyond 1.5 seconds window
          while (spikeHistory.length > 0 && spikeHistory[0] < t - 1.5) {
            spikeHistory.shift();
          }

          // Synthesize rolling oscilloscope voltage path
          const timeWindow = 1.2; // 1.2 seconds across the screen
          const oscBaselineY = oscY + oscH / 2 + 10;
          let dStr = '';
          const sampleSteps = 72;

          for (let i = 0; i <= sampleSteps; i++) {
            const frac = i / sampleSteps;
            const ptX = oscX + frac * oscW;
            const sampleTime = t - (1 - frac) * timeWindow;

            // Resting baseline noise
            let v = Math.sin(sampleTime * 35.0) * 1.2;

            // Check if near any action potential spike
            for (let sIdx = 0; sIdx < spikeHistory.length; sIdx++) {
              const st = spikeHistory[sIdx];
              const diff = sampleTime - st;
              if (diff >= -0.015 && diff <= 0.045) {
                // Sharp biphasic spike wave: fast positive surge then undershoot
                const phase = diff / 0.03;
                if (phase >= 0 && phase <= 0.5) {
                  v += Math.sin(phase * Math.PI) * 44;
                } else if (phase > 0.5 && phase <= 1.2) {
                  v -= Math.sin((phase - 0.5) * Math.PI) * 14;
                }
              }
            }

            const ptY = oscBaselineY - v;
            dStr += `${i === 0 ? 'M' : 'L'}${ptX.toFixed(1)} ${ptY.toFixed(1)} `;
          }

          oscPath.setAttribute('d', dStr);
        }
      },

      destroy() {
        svg.removeEventListener('pointerdown', handlePointerDown);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        if (svg.parentElement) {
          svg.parentElement.removeChild(svg);
        }
      },
    };
  },
};
