// Interactive Neural Rhythms & E/I Balance Surface.
// Visualizes the PING microcircuit (Pyramidal cells + PV+ basket interneurons),
// live scrolling scalp EEG / local field potential waveform,
// and real-time frequency power spectrum (Delta, Theta, Alpha, Beta, Gamma).
// Native ES module, zero external dependencies.

import { C, el, glowFilter, lin } from './svg.js';
import * as rhythmsWorld from '../worlds/rhythms.js';

export default {
  type: 'rhythms',

  mount(container, props = {}, ctx = {}) {
    const world = ctx.world || rhythmsWorld;
    const { clock, setControls } = ctx;

    const width = 800;
    const height = 320;

    const svg = el('svg', {
      viewBox: `0 0 ${width} ${height}`,
      preserveAspectRatio: 'xMidYMid meet',
    }, container);

    const glowUrl = glowFilter(svg);
    const glow = (node) => {
      if (glowUrl && glowUrl !== 'none') node.setAttribute('filter', glowUrl);
      return node;
    };

    function txt(parent, attrs, str) {
      const t = el('text', {
        'font-family': 'var(--display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
        ...attrs,
      }, parent);
      t.textContent = str;
      return t;
    }

    // ---------------------------------------------------------------- State
    const state = {
      preset: props.preset || 'gamma',
      eiRatio: props.eiRatio !== undefined ? Number(props.eiRatio) : 1.0,
      playing: true,
      lastT: 0,
      sim: null,
      spectrum: null,
      smoothE: 0.5,
      smoothI: 0.5,
    };

    // Recompute simulation and power spectrum whenever preset or E/I ratio changes
    function recompute() {
      state.sim = world.simulate({
        preset: state.preset,
        eiRatio: state.eiRatio,
        duration: 4.0,
        dt: 0.001,
      });

      state.smoothE = 0.5;
      state.smoothI = 0.5;

      // Compute power spectrum from steady-state segment (last 1.5 seconds)
      const eegSlice = state.sim.eeg.slice(-1500);
      state.spectrum = world.calculatePowerSpectrum(eegSlice, 1000);
      updateStaticVisuals();
    }

    // ------------------------------------------------ Left Panel: PING Microcircuit
    const leftCard = el('g', { class: 'rhythms-microcircuit' }, svg);
    el('rect', {
      x: 14,
      y: 14,
      width: 272,
      height: 292,
      rx: 10,
      fill: 'rgba(190,200,255,0.03)',
      stroke: 'rgba(190,200,255,0.12)',
      'stroke-width': 1,
    }, leftCard);

    txt(leftCard, {
      x: 26,
      y: 33,
      fill: C.muted,
      'font-size': 9.5,
      'font-weight': 600,
      'letter-spacing': '0.08em',
    }, 'PING MICROCIRCUIT');

    const badgePill = txt(leftCard, {
      x: 274,
      y: 33,
      'text-anchor': 'end',
      fill: '#7df0c0',
      'font-size': 9.5,
      'font-weight': 700,
      'letter-spacing': '0.04em',
    }, 'BALANCED');

    // Faint cortical layer horizontal lines
    el('line', {
      x1: 26, y1: 52, x2: 274, y2: 52,
      stroke: 'rgba(190,200,255,0.08)', 'stroke-width': 1, 'stroke-dasharray': '3 3',
    }, leftCard);
    txt(leftCard, { x: 28, y: 48, fill: 'rgba(233,235,245,0.3)', 'font-size': 7.5 }, 'Layer 1 (Apical tufts)');

    el('line', {
      x1: 26, y1: 220, x2: 274, y2: 220,
      stroke: 'rgba(190,200,255,0.08)', 'stroke-width': 1, 'stroke-dasharray': '3 3',
    }, leftCard);
    txt(leftCard, { x: 28, y: 232, fill: 'rgba(233,235,245,0.3)', 'font-size': 7.5 }, 'Layer 2/3 & 5 (Soma)');

    // Forward excitation pathway (Pyramidal -> Interneuron)
    const forwardPath = el('path', {
      d: 'M 98 126 C 130 96, 175 96, 206 132',
      fill: 'none',
      stroke: C.excite,
      'stroke-width': 1.6,
      'stroke-dasharray': '4 3',
      opacity: 0.8,
    }, leftCard);

    // Forward drive arrow head
    el('polygon', {
      points: '206,132 201,123 210,126',
      fill: C.excite,
    }, leftCard);

    txt(leftCard, {
      x: 152,
      y: 104,
      'text-anchor': 'middle',
      fill: C.excite,
      'font-size': 8.5,
      'font-weight': 600,
    }, '+ AMPA drive');

    // Feedback inhibition pathway (Interneuron -> Pyramidal soma)
    const feedbackPath = el('path', {
      d: 'M 204 176 C 172 206, 126 206, 96 168',
      fill: 'none',
      stroke: C.inhibit,
      'stroke-width': 1.6,
      'stroke-dasharray': '4 3',
      opacity: 0.8,
    }, leftCard);

    // Inhibitory claw / flat clamp at pyramidal soma
    el('line', {
      x1: 91, y1: 164, x2: 101, y2: 172,
      stroke: C.inhibit,
      'stroke-width': 3,
      'stroke-linecap': 'round',
    }, leftCard);

    txt(leftCard, {
      x: 152,
      y: 213,
      'text-anchor': 'middle',
      fill: C.inhibit,
      'font-size': 8.5,
      'font-weight': 600,
    }, '− GABA feedback');

    // Moving synaptic vesicles (Forward and Feedback)
    const fwdVesicles = [
      el('circle', { cx: 0, cy: 0, r: 3, fill: C.excite, opacity: 0 }, leftCard),
      el('circle', { cx: 0, cy: 0, r: 3, fill: C.excite, opacity: 0 }, leftCard),
    ];
    glow(fwdVesicles[0]);
    glow(fwdVesicles[1]);

    const fbVesicles = [
      el('circle', { cx: 0, cy: 0, r: 3, fill: C.inhibit, opacity: 0 }, leftCard),
      el('circle', { cx: 0, cy: 0, r: 3, fill: C.inhibit, opacity: 0 }, leftCard),
    ];
    glow(fbVesicles[0]);
    glow(fbVesicles[1]);

    // Pyramidal Cell Body & Dendrites (Excitatory)
    const pyrGroup = el('g', { class: 'pyr-cell' }, leftCard);
    const pyrAura = el('circle', {
      cx: 86,
      cy: 150,
      r: 22,
      fill: C.excite,
      opacity: 0.15,
    }, pyrGroup);
    glow(pyrAura);

    // Apical dendrite climbing to layer 1
    el('line', {
      x1: 86, y1: 135, x2: 86, y2: 60,
      stroke: C.excite, 'stroke-width': 2.2, 'stroke-linecap': 'round',
    }, pyrGroup);
    // Apical tuft branches
    el('path', {
      d: 'M 86 76 L 68 56 M 86 76 L 104 56 M 86 64 L 78 52 M 86 64 L 94 52',
      stroke: C.excite, 'stroke-width': 1.4, fill: 'none', 'stroke-linecap': 'round',
    }, pyrGroup);

    // Triangular soma
    const pyrSoma = el('polygon', {
      points: '86,134 72,162 100,162',
      fill: C.excite,
      stroke: '#fff',
      'stroke-width': 1,
      opacity: 0.85,
    }, pyrGroup);

    // Basal dendrites
    el('path', {
      d: 'M 74 162 L 60 178 M 98 162 L 112 178 M 80 162 L 72 182 M 92 162 L 100 182',
      stroke: C.excite, 'stroke-width': 1.4, fill: 'none', 'stroke-linecap': 'round',
    }, pyrGroup);

    // Descending axon and recurrent collateral
    el('path', {
      d: 'M 86 162 L 86 215 M 86 182 Q 92 178 98 126',
      stroke: 'rgba(255,207,107,0.7)', 'stroke-width': 1.3, fill: 'none',
    }, pyrGroup);

    txt(leftCard, {
      x: 86,
      y: 198,
      'text-anchor': 'middle',
      fill: C.excite,
      'font-size': 9.5,
      'font-weight': 700,
    }, 'Pyramidal (E)');
    txt(leftCard, {
      x: 86,
      y: 209,
      'text-anchor': 'middle',
      fill: 'rgba(233,235,245,0.45)',
      'font-size': 8,
    }, 'Glutamate');

    // Live firing gauge for Pyramidal cell
    el('rect', {
      x: 58, y: 242, width: 56, height: 4, rx: 2,
      fill: 'rgba(190,200,255,0.1)',
    }, leftCard);
    const pyrGauge = el('rect', {
      x: 58, y: 242, width: 28, height: 4, rx: 2,
      fill: C.excite,
    }, leftCard);
    const pyrPctTxt = txt(leftCard, {
      x: 86, y: 257, 'text-anchor': 'middle', fill: C.excite, 'font-size': 8,
    }, 'E: 50%');

    // PV+ Basket Interneuron (Inhibitory)
    const intGroup = el('g', { class: 'int-cell' }, leftCard);
    const intAura = el('circle', {
      cx: 216,
      cy: 150,
      r: 20,
      fill: C.inhibit,
      opacity: 0.15,
    }, intGroup);
    glow(intAura);

    // Radiating dendrites
    el('path', {
      d: 'M 216 138 L 216 124 M 226 142 L 238 132 M 226 158 L 240 166 M 206 142 L 194 132 M 206 158 L 194 166 M 216 162 L 216 174',
      stroke: C.inhibit, 'stroke-width': 1.4, fill: 'none', 'stroke-linecap': 'round',
    }, intGroup);

    // Multipolar rounded soma
    const intSoma = el('circle', {
      cx: 216,
      cy: 150,
      r: 11,
      fill: C.inhibit,
      stroke: '#fff',
      'stroke-width': 1,
      opacity: 0.85,
    }, intGroup);

    // Basket axon reaching out to surround pyramidal soma
    el('path', {
      d: 'M 216 161 C 216 182 170 195 106 172',
      stroke: 'rgba(255,107,125,0.7)', 'stroke-width': 1.3, fill: 'none',
    }, intGroup);

    txt(leftCard, {
      x: 216,
      y: 198,
      'text-anchor': 'middle',
      fill: C.inhibit,
      'font-size': 9.5,
      'font-weight': 700,
    }, 'PV+ Basket (I)');
    txt(leftCard, {
      x: 216,
      y: 209,
      'text-anchor': 'middle',
      fill: 'rgba(233,235,245,0.45)',
      'font-size': 8,
    }, 'GABA');

    // Live firing gauge for Interneuron
    el('rect', {
      x: 188, y: 242, width: 56, height: 4, rx: 2,
      fill: 'rgba(190,200,255,0.1)',
    }, leftCard);
    const intGauge = el('rect', {
      x: 188, y: 242, width: 28, height: 4, rx: 2,
      fill: C.inhibit,
    }, leftCard);
    const intPctTxt = txt(leftCard, {
      x: 216, y: 257, 'text-anchor': 'middle', fill: C.inhibit, 'font-size': 8,
    }, 'I: 50%');

    // Bottom explanation note in left card
    txt(leftCard, {
      x: 150,
      y: 284,
      'text-anchor': 'middle',
      fill: 'rgba(233,235,245,0.65)',
      'font-size': 8.5,
    }, 'E excites I via AMPA. I clamps E with GABA.');
    txt(leftCard, {
      x: 150,
      y: 296,
      'text-anchor': 'middle',
      fill: 'rgba(233,235,245,0.45)',
      'font-size': 8,
    }, 'As GABA decays, E escapes and fires again.');

    // ------------------------------------------------ Right Upper Panel: Live Scrolling EEG
    const eegCard = el('g', { class: 'rhythms-eeg' }, svg);
    el('rect', {
      x: 298,
      y: 14,
      width: 488,
      height: 184,
      rx: 10,
      fill: 'rgba(190,200,255,0.03)',
      stroke: 'rgba(190,200,255,0.12)',
      'stroke-width': 1,
    }, eegCard);

    txt(eegCard, {
      x: 312,
      y: 33,
      fill: C.muted,
      'font-size': 9.5,
      'font-weight': 600,
      'letter-spacing': '0.08em',
    }, 'CORTICAL EEG / LOCAL FIELD POTENTIAL');

    const eegHzReadout = txt(eegCard, {
      x: 774,
      y: 33,
      'text-anchor': 'end',
      fill: '#e26dff',
      'font-size': 10,
      'font-weight': 700,
      'letter-spacing': '0.04em',
    }, '40.0 Hz · GAMMA RHYTHM');

    // Oscilloscope grid area: left=340, right=774, top=44, bottom=172
    const oscL = 344;
    const oscR = 774;
    const oscT = 46;
    const oscB = 168;
    const oscY0 = (oscT + oscB) / 2; // 107 px (zero line)
    const oscHeight = oscB - oscT;

    // Zero-voltage baseline
    el('line', {
      x1: oscL, y1: oscY0, x2: oscR, y2: oscY0,
      stroke: 'rgba(190,200,255,0.22)', 'stroke-width': 1,
    }, eegCard);

    // Subtle grid lines (+100uV, +50uV, -50uV, -100uV)
    el('line', {
      x1: oscL, y1: oscT, x2: oscR, y2: oscT,
      stroke: 'rgba(190,200,255,0.06)', 'stroke-width': 1, 'stroke-dasharray': '2 4',
    }, eegCard);
    el('line', {
      x1: oscL, y1: oscB, x2: oscR, y2: oscB,
      stroke: 'rgba(190,200,255,0.06)', 'stroke-width': 1, 'stroke-dasharray': '2 4',
    }, eegCard);

    // Vertical time grid lines (every 0.25s across 1.5s window = 6 segments)
    for (let g = 1; g < 6; g++) {
      const gx = oscL + ((oscR - oscL) * g) / 6;
      el('line', {
        x1: gx, y1: oscT, x2: gx, y2: oscB,
        stroke: 'rgba(190,200,255,0.06)', 'stroke-width': 1, 'stroke-dasharray': '2 4',
      }, eegCard);
    }

    // Voltage scale indicators
    txt(eegCard, { x: oscL - 6, y: oscT + 3, 'text-anchor': 'end', fill: 'rgba(233,235,245,0.35)', 'font-size': 7.5 }, '+100 µV');
    txt(eegCard, { x: oscL - 6, y: oscY0 + 3, 'text-anchor': 'end', fill: 'rgba(233,235,245,0.35)', 'font-size': 7.5 }, '0 µV');
    txt(eegCard, { x: oscL - 6, y: oscB + 3, 'text-anchor': 'end', fill: 'rgba(233,235,245,0.35)', 'font-size': 7.5 }, '-100 µV');

    // Time window footer
    txt(eegCard, { x: oscR, y: 184, 'text-anchor': 'end', fill: 'rgba(233,235,245,0.35)', 'font-size': 8 }, '1.5 s sweep window');
    const ampReadout = txt(eegCard, {
      x: oscL,
      y: 184,
      fill: 'rgba(233,235,245,0.5)',
      'font-size': 8.5,
    }, 'Amplitude: 48 µV (Normal)');

    // Live EEG waveform path with phosphor glow
    const eegWavePath = el('path', {
      d: `M ${oscL} ${oscY0} L ${oscR} ${oscY0}`,
      fill: 'none',
      stroke: '#e26dff',
      'stroke-width': 1.8,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    }, eegCard);
    glow(eegWavePath);

    // Leading edge sweep dot
    const sweepDot = el('circle', {
      cx: oscR,
      cy: oscY0,
      r: 3.5,
      fill: '#fff',
      opacity: 0.9,
    }, eegCard);
    glow(sweepDot);

    // ------------------------------------------------ Right Lower Panel: Frequency Power Spectrum
    const specCard = el('g', { class: 'rhythms-spectrum' }, svg);
    el('rect', {
      x: 298,
      y: 206,
      width: 488,
      height: 100,
      rx: 10,
      fill: 'rgba(190,200,255,0.03)',
      stroke: 'rgba(190,200,255,0.12)',
      'stroke-width': 1,
    }, specCard);

    txt(specCard, {
      x: 312,
      y: 222,
      fill: C.muted,
      'font-size': 9.5,
      'font-weight': 600,
      'letter-spacing': '0.08em',
    }, 'FREQUENCY POWER SPECTRUM (FFT)');

    const dominantSummary = txt(specCard, {
      x: 774,
      y: 222,
      'text-anchor': 'end',
      fill: '#e26dff',
      'font-size': 9.5,
      'font-weight': 700,
    }, 'Dominant: Gamma (30-80 Hz)');

    // 5 Frequency Band Bar Columns
    const bandKeys = ['delta', 'theta', 'alpha', 'beta', 'gamma'];
    const colCenters = [350, 435, 520, 605, 690];
    const barWidth = 36;
    const barBaseY = 278;
    const barMaxH = 38;

    const bandUIs = {};

    bandKeys.forEach((key, idx) => {
      const cx = colCenters[idx];
      const bandMeta = rhythmsWorld.BANDS[key];

      const g = el('g', { class: `band-col-${key}` }, specCard);

      // Highlight pill behind dominant band
      const hiPill = el('rect', {
        x: cx - 28,
        y: 228,
        width: 56,
        height: 72,
        rx: 6,
        fill: 'rgba(190,200,255,0.0)',
        stroke: 'rgba(190,200,255,0.0)',
        'stroke-width': 1,
      }, g);

      // Track background
      el('rect', {
        x: cx - barWidth / 2,
        y: barBaseY - barMaxH,
        width: barWidth,
        height: barMaxH,
        rx: 3,
        fill: 'rgba(190,200,255,0.06)',
      }, g);

      // Filled power bar
      const bar = el('rect', {
        x: cx - barWidth / 2,
        y: barBaseY,
        width: barWidth,
        height: 0,
        rx: 3,
        fill: bandMeta.color,
        opacity: 0.85,
      }, g);

      // Percentage label above bar
      const pctTxt = txt(g, {
        x: cx,
        y: barBaseY - 4,
        'text-anchor': 'middle',
        fill: '#fff',
        'font-size': 8.5,
        'font-weight': 700,
      }, '0%');

      // Band name below bar
      txt(g, {
        x: cx,
        y: 291,
        'text-anchor': 'middle',
        fill: bandMeta.color,
        'font-size': 8.5,
        'font-weight': 700,
        'letter-spacing': '0.04em',
      }, bandMeta.name.toUpperCase());

      // Frequency range below name
      txt(g, {
        x: cx,
        y: 301,
        'text-anchor': 'middle',
        fill: 'rgba(233,235,245,0.4)',
        'font-size': 7.5,
      }, `${bandMeta.range[0]}-${bandMeta.range[1]} Hz`);

      bandUIs[key] = {
        hiPill,
        bar,
        pctTxt,
        color: bandMeta.color,
      };
    });

    // ------------------------------------------------ Update static visuals
    function updateStaticVisuals() {
      const cls = rhythmsWorld.classifyDynamics(state.eiRatio, state.preset);
      badgePill.textContent = cls.badge.toUpperCase();
      badgePill.setAttribute('fill', cls.color);

      const domKey = state.spectrum.dominantBand || 'gamma';
      const domMeta = rhythmsWorld.BANDS[domKey] || rhythmsWorld.BANDS.gamma;

      // Update EEG header text and color
      const peakHzStr = state.spectrum.peakHz ? `${state.spectrum.peakHz.toFixed(1)} Hz` : `${domMeta.typicalHz} Hz`;
      if (cls.status === 'seizure') {
        eegHzReadout.textContent = `${peakHzStr} · EPILEPTIC SEIZURE`;
        eegHzReadout.setAttribute('fill', C.inhibit);
        eegWavePath.setAttribute('stroke', C.inhibit);
        ampReadout.textContent = 'Amplitude: 380 µV (Paroxysmal hypersynchrony)';
        ampReadout.setAttribute('fill', C.inhibit);
      } else if (cls.status === 'sedated') {
        eegHzReadout.textContent = '0.5 Hz · SEDATION (SUPPRESSED)';
        eegHzReadout.setAttribute('fill', '#6888ff');
        eegWavePath.setAttribute('stroke', '#6888ff');
        ampReadout.textContent = 'Amplitude: 12 µV (Silenced by GABA)';
        ampReadout.setAttribute('fill', 'rgba(233,235,245,0.5)');
      } else {
        eegHzReadout.textContent = `${peakHzStr} · ${domMeta.name.toUpperCase()} RHYTHM`;
        eegHzReadout.setAttribute('fill', domMeta.color);
        eegWavePath.setAttribute('stroke', domMeta.color);
        ampReadout.textContent = 'Amplitude: 48 µV (Synchronized rhythm)';
        ampReadout.setAttribute('fill', 'rgba(233,235,245,0.5)');
      }

      dominantSummary.textContent = `Dominant: ${domMeta.name} (${domMeta.range[0]}-${domMeta.range[1]} Hz)`;
      dominantSummary.setAttribute('fill', domMeta.color);

      // Update Power Spectrum Bars
      for (const key of bandKeys) {
        const ui = bandUIs[key];
        const bandData = state.spectrum.bands[key];
        const pct = bandData ? bandData.percentage : 0;
        const barH = Math.max(1, (pct / 100) * barMaxH);
        const barY = barBaseY - barH;

        ui.bar.setAttribute('y', barY.toFixed(1));
        ui.bar.setAttribute('height', barH.toFixed(1));
        ui.pctTxt.setAttribute('y', (barY - 3).toFixed(1));
        ui.pctTxt.textContent = `${pct}%`;

        if (key === domKey) {
          ui.hiPill.setAttribute('fill', 'rgba(190,200,255,0.06)');
          ui.hiPill.setAttribute('stroke', domMeta.color);
          ui.bar.setAttribute('fill', domMeta.color);
          ui.bar.setAttribute('opacity', '1.0');
          glow(ui.bar);
        } else {
          ui.hiPill.setAttribute('fill', 'transparent');
          ui.hiPill.setAttribute('stroke', 'transparent');
          ui.bar.setAttribute('fill', ui.color);
          ui.bar.setAttribute('opacity', '0.45');
          ui.bar.removeAttribute('filter');
        }
      }
    }

    // ------------------------------------------------ Set Controls in Dock
    let setControlsNodes = null;
    if (setControls) {
      const ctrls = document.createElement('div');
      ctrls.className = 'dock-ctrl-group';
      ctrls.style.display = 'flex';
      ctrls.style.alignItems = 'center';
      ctrls.style.gap = '8px';
      ctrls.style.flexWrap = 'wrap';
      ctrls.style.justifyContent = 'flex-end';

      // Preset buttons: Gamma, Theta, Alpha, Beta, Delta, Sedated, Seizure
      const presets = [
        { key: 'gamma', label: 'Gamma (40 Hz)' },
        { key: 'theta', label: 'Theta (6 Hz)' },
        { key: 'alpha', label: 'Alpha (10 Hz)' },
        { key: 'beta', label: 'Beta (20 Hz)' },
        { key: 'sedated', label: 'Sedated' },
        { key: 'seizure', label: 'Seizure' },
      ];

      const btns = [];
      const setPreset = (key) => {
        state.preset = key;
        // Default E/I ratio for preset
        if (key === 'sedated') state.eiRatio = 0.35;
        else if (key === 'seizure') state.eiRatio = 2.2;
        else state.eiRatio = 1.0;

        for (const b of btns) {
          b.setAttribute('aria-pressed', b.dataset.key === key ? 'true' : 'false');
        }
        if (eiSlider) {
          eiSlider.value = String(state.eiRatio);
          updateSliderLabel();
        }
        recompute();
      };

      for (const p of presets) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'dock-btn';
        b.dataset.key = p.key;
        b.textContent = p.label;
        b.setAttribute('aria-pressed', p.key === state.preset ? 'true' : 'false');
        b.addEventListener('click', () => setPreset(p.key));
        btns.push(b);
        ctrls.appendChild(b);
      }

      // E/I Balance Slider
      const eiLabel = document.createElement('span');
      eiLabel.className = 'dock-label';

      function updateSliderLabel() {
        const r = state.eiRatio;
        let suffix = 'Balanced';
        if (r < 0.6) suffix = 'Sedated';
        else if (r < 0.85) suffix = 'Slowing';
        else if (r > 1.8) suffix = 'Seizure';
        else if (r > 1.3) suffix = 'Hyperexcited';
        eiLabel.textContent = `E/I Balance: ${r.toFixed(2)}x (${suffix})`;
      }

      const eiSlider = document.createElement('input');
      eiSlider.type = 'range';
      eiSlider.className = 'dock-range';
      eiSlider.min = '0.2';
      eiSlider.max = '2.5';
      eiSlider.step = '0.05';
      eiSlider.value = String(state.eiRatio);
      updateSliderLabel();

      eiSlider.addEventListener('input', (e) => {
        state.eiRatio = parseFloat(e.target.value);
        updateSliderLabel();
        for (const b of btns) {
          b.setAttribute('aria-pressed', 'false');
        }
        recompute();
      });

      ctrls.appendChild(eiLabel);
      ctrls.appendChild(eiSlider);

      // Play / Pause Toggle Button
      const playBtn = document.createElement('button');
      playBtn.type = 'button';
      playBtn.className = 'dock-btn';
      playBtn.textContent = 'Pause';
      playBtn.addEventListener('click', () => {
        state.playing = !state.playing;
        playBtn.textContent = state.playing ? 'Pause' : 'Play';
        if (clock) {
          if (state.playing) clock.play();
          else clock.pause();
        }
      });
      ctrls.appendChild(playBtn);

      setControls(ctrls);
      setControlsNodes = ctrls;
    }

    // Initial calculation
    recompute();

    // ------------------------------------------------ Render loop
    return {
      render(t) {
        if (!state.playing) return;
        state.lastT = t;

        // Sample live state (E, I, EEG) at current timestamp
        const live = rhythmsWorld.sampleAt(state.sim, t);

        // Low-pass filter to prevent fast 40 Hz strobing; aura breathes gently
        const targetE = Math.max(0, Math.min(1, live.E));
        const targetI = Math.max(0, Math.min(1, live.I));
        state.smoothE += (targetE - state.smoothE) * 0.06;
        state.smoothI += (targetI - state.smoothI) * 0.06;
        const eLevel = state.smoothE;
        const iLevel = state.smoothI;

        // 1. Update Pyramidal Cell Activity (calm, steady, non-strobing)
        pyrAura.setAttribute('r', (16 + eLevel * 14).toFixed(1));
        pyrAura.setAttribute('opacity', (0.12 + eLevel * 0.28).toFixed(2));
        pyrSoma.setAttribute('opacity', (0.82 + eLevel * 0.12).toFixed(2));
        pyrGauge.setAttribute('width', (eLevel * 56).toFixed(1));
        pyrPctTxt.textContent = `E: ${Math.round(eLevel * 100)}%`;

        // 2. Update Interneuron Activity (calm, steady, non-strobing)
        intAura.setAttribute('r', (14 + iLevel * 12).toFixed(1));
        intAura.setAttribute('opacity', (0.12 + iLevel * 0.28).toFixed(2));
        intSoma.setAttribute('opacity', (0.82 + iLevel * 0.12).toFixed(2));
        intGauge.setAttribute('width', (iLevel * 56).toFixed(1));
        intPctTxt.textContent = `I: ${Math.round(iLevel * 100)}%`;

        // 3. Animate Traveling Synaptic Vesicles (calm, graceful drift ~1.5s per transit)
        // Forward AMPA vesicles (E -> I)
        const fwdPhase1 = (t * 0.65) % 1.0;
        const fwdPhase2 = (t * 0.65 + 0.5) % 1.0;
        const xFwd1 = 98 + fwdPhase1 * (206 - 98);
        const yFwd1 = 126 - Math.sin(fwdPhase1 * Math.PI) * 32;
        fwdVesicles[0].setAttribute('cx', xFwd1.toFixed(1));
        fwdVesicles[0].setAttribute('cy', yFwd1.toFixed(1));
        fwdVesicles[0].setAttribute('opacity', (eLevel * Math.sin(fwdPhase1 * Math.PI) * 0.9).toFixed(2));

        const xFwd2 = 98 + fwdPhase2 * (206 - 98);
        const yFwd2 = 126 - Math.sin(fwdPhase2 * Math.PI) * 32;
        fwdVesicles[1].setAttribute('cx', xFwd2.toFixed(1));
        fwdVesicles[1].setAttribute('cy', yFwd2.toFixed(1));
        fwdVesicles[1].setAttribute('opacity', (eLevel * Math.sin(fwdPhase2 * Math.PI) * 0.9).toFixed(2));

        // Feedback GABA vesicles (I -> E)
        const fbPhase1 = (t * 0.65 + 0.25) % 1.0;
        const fbPhase2 = (t * 0.65 + 0.75) % 1.0;
        const xFb1 = 204 - fbPhase1 * (204 - 96);
        const yFb1 = 176 + Math.sin(fbPhase1 * Math.PI) * 30;
        fbVesicles[0].setAttribute('cx', xFb1.toFixed(1));
        fbVesicles[0].setAttribute('cy', yFb1.toFixed(1));
        fbVesicles[0].setAttribute('opacity', (iLevel * Math.sin(fbPhase1 * Math.PI) * 0.9).toFixed(2));

        const xFb2 = 204 - fbPhase2 * (204 - 96);
        const yFb2 = 176 + Math.sin(fbPhase2 * Math.PI) * 30;
        fbVesicles[1].setAttribute('cx', xFb2.toFixed(1));
        fbVesicles[1].setAttribute('cy', yFb2.toFixed(1));
        fbVesicles[1].setAttribute('opacity', (iLevel * Math.sin(fbPhase2 * Math.PI) * 0.9).toFixed(2));

        // 4. Update Rolling EEG Waveform Path
        const windowDuration = 1.5; // seconds
        const numPoints = 140;
        const points = rhythmsWorld.sampleWindow(state.sim, t, windowDuration, numPoints);

        // Amplitude scale factor: clamp voltage to oscilloscope range
        const vScale = state.preset === 'seizure' || state.eiRatio > 1.8 ? 0.35 : 0.85;

        let pathStr = '';
        let lastY = oscY0;

        for (let i = 0; i < points.length; i++) {
          const pt = points[i];
          const px = oscL + pt.xFrac * (oscR - oscL);
          // Zero line is at oscY0. Positive voltage goes up (-y in SVG)
          const py = Math.max(oscT + 2, Math.min(oscB - 2, oscY0 - pt.eeg * (oscHeight * 0.42 * vScale)));
          pathStr += `${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)} `;
          if (i === points.length - 1) lastY = py;
        }

        eegWavePath.setAttribute('d', pathStr);
        sweepDot.setAttribute('cy', lastY.toFixed(1));
      },

      destroy() {
        if (svg && svg.parentElement) {
          svg.parentElement.removeChild(svg);
        }
        if (setControlsNodes && setControlsNodes.parentElement) {
          setControlsNodes.parentElement.removeChild(setControlsNodes);
        }
      },
    };
  },
};
