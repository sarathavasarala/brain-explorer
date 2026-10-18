import { NS, C, el, glowFilter, lin } from './svg.js';

export function mountDopamineSynapse(container, props = {}, ctx = {}) {
  const { world, clock, scene, setControls } = ctx;

  const width = 800;
  const height = 320;

  const svg = el('svg', {
    viewBox: `0 0 ${width} ${height}`,
    preserveAspectRatio: 'xMidYMid meet',
  }, container);

  const glowUrl = glowFilter(svg);

  // States
  let firingMode = props.initialMode || 'tonic'; // 'tonic' (4.5 Hz), 'burst' (28 Hz), 'pause' (0 Hz)
  let isDownregulated = props.mode === 'downregulated';

  // Header controls
  const showChronicOnly = props.controls === 'chronic' || props.mode === 'downregulated';

  if (setControls) {
    const ctrls = document.createElement('div');
    ctrls.className = 'dock-ctrl-group';
    ctrls.style.display = 'flex';
    ctrls.style.alignItems = 'center';
    ctrls.style.gap = '8px';

    if (showChronicOnly) {
      // Step 7: Two-button segmented switcher for Week 1 vs Month 1
      const freshBtn = document.createElement('button');
      freshBtn.type = 'button';
      freshBtn.className = 'dock-btn';
      freshBtn.setAttribute('aria-pressed', !isDownregulated ? 'true' : 'false');
      freshBtn.textContent = 'Week 1: Healthy Baseline';

      const overloadedBtn = document.createElement('button');
      overloadedBtn.type = 'button';
      overloadedBtn.className = 'dock-btn';
      overloadedBtn.setAttribute('aria-pressed', isDownregulated ? 'true' : 'false');
      overloadedBtn.textContent = 'Month 1: Feed Overload';

      function setChronic(overloaded) {
        isDownregulated = overloaded;
        freshBtn.setAttribute('aria-pressed', !isDownregulated ? 'true' : 'false');
        overloadedBtn.setAttribute('aria-pressed', isDownregulated ? 'true' : 'false');
        updateSynapseDisplay();
      }

      freshBtn.addEventListener('click', () => setChronic(false));
      overloadedBtn.addEventListener('click', () => setChronic(true));

      ctrls.appendChild(freshBtn);
      ctrls.appendChild(overloadedBtn);
    } else {
      // Step 4: Only show the 3 firing modes
      const tonicBtn = document.createElement('button');
      tonicBtn.type = 'button';
      tonicBtn.className = 'dock-btn';
      tonicBtn.setAttribute('aria-pressed', firingMode === 'tonic' ? 'true' : 'false');
      tonicBtn.textContent = 'Quiet Hum (4.5 Hz)';

      const burstBtn = document.createElement('button');
      burstBtn.type = 'button';
      burstBtn.className = 'dock-btn';
      burstBtn.setAttribute('aria-pressed', firingMode === 'burst' ? 'true' : 'false');
      burstBtn.textContent = 'Big Burst (28 Hz)';

      const pauseBtn = document.createElement('button');
      pauseBtn.type = 'button';
      pauseBtn.className = 'dock-btn';
      pauseBtn.setAttribute('aria-pressed', firingMode === 'pause' ? 'true' : 'false');
      pauseBtn.textContent = 'Pause (0 Hz)';

      function setFiring(mode) {
        firingMode = mode;
        tonicBtn.setAttribute('aria-pressed', firingMode === 'tonic' ? 'true' : 'false');
        burstBtn.setAttribute('aria-pressed', firingMode === 'burst' ? 'true' : 'false');
        pauseBtn.setAttribute('aria-pressed', firingMode === 'pause' ? 'true' : 'false');
        updateSynapseDisplay();
      }

      tonicBtn.addEventListener('click', () => setFiring('tonic'));
      burstBtn.addEventListener('click', () => {
        setFiring('burst');
        if (scene) scene.firePulse('vta', 'nucleus-accumbens', { color: '#b98cff' });
      });
      pauseBtn.addEventListener('click', () => setFiring('pause'));

      ctrls.appendChild(tonicBtn);
      ctrls.appendChild(burstBtn);
      ctrls.appendChild(pauseBtn);
    }

    setControls(ctrls);
  }

  // ------------------------------------------------ Layout Positions (Zero-Overlap Grid)
  const midX = 410;
  const preY = 48;
  const cleftY = 104;
  const postMembraneY = 156;

  const mainGroup = el('g', { class: 'synapse-machinery' }, svg);

  // Left-margin anatomical labels (outside the membrane width x: 160..660)
  el('text', {
    x: 142,
    y: preY - 2,
    'text-anchor': 'end',
    fill: C.muted,
    'font-family': 'var(--display)',
    'font-size': '9.5',
    'font-weight': '600',
    'letter-spacing': '0.06em',
    'text-transform': 'uppercase',
  }, mainGroup).textContent = 'Sending Axon';

  el('text', {
    x: 142,
    y: preY + 11,
    'text-anchor': 'end',
    fill: 'rgba(233,235,245,0.4)',
    'font-family': 'var(--display)',
    'font-size': '8.5',
  }, mainGroup).textContent = 'VTA dopamine cell';

  el('text', {
    x: 142,
    y: cleftY + 6,
    'text-anchor': 'end',
    fill: C.muted,
    'font-family': 'var(--display)',
    'font-size': '9.5',
    'font-weight': '600',
    'letter-spacing': '0.06em',
    'text-transform': 'uppercase',
  }, mainGroup).textContent = 'Synaptic Cleft';

  const cleftConcLbl = el('text', {
    x: 142,
    y: cleftY + 19,
    'text-anchor': 'end',
    fill: C.dopamine,
    'font-family': 'var(--display)',
    'font-size': '9',
    'font-weight': '600',
  }, mainGroup);
  cleftConcLbl.textContent = '~15 nM tonic hum';

  el('text', {
    x: 142,
    y: postMembraneY + 2,
    'text-anchor': 'end',
    fill: C.muted,
    'font-family': 'var(--display)',
    'font-size': '9.5',
    'font-weight': '600',
    'letter-spacing': '0.06em',
    'text-transform': 'uppercase',
  }, mainGroup).textContent = 'Receiving Spine';

  el('text', {
    x: 142,
    y: postMembraneY + 15,
    'text-anchor': 'end',
    fill: 'rgba(233,235,245,0.4)',
    'font-family': 'var(--display)',
    'font-size': '8.5',
  }, mainGroup).textContent = 'Striatal MSN cell';

  // 1. Presynaptic Terminal Box (x: 160..660, y: 22..70)
  el('rect', {
    x: midX - 250,
    y: preY - 26,
    width: 500,
    height: 48,
    rx: '16',
    fill: 'rgba(185, 140, 255, 0.05)',
    stroke: C.cell,
    'stroke-width': '1.25',
  }, mainGroup);

  // Presynaptic storage vesicles (left side of terminal: x = 195..335)
  const vesicles = [
    { x: midX - 210, y: preY - 4 },
    { x: midX - 175, y: preY + 4 },
    { x: midX - 140, y: preY - 6 },
    { x: midX - 105, y: preY + 3 },
    { x: midX - 70, y: preY - 3 },
  ];
  for (const v of vesicles) {
    el('circle', {
      cx: v.x,
      cy: v.y,
      r: '5',
      fill: 'rgba(185, 140, 255, 0.25)',
      stroke: C.dopamine,
      'stroke-width': '1',
    }, mainGroup);
  }

  // Presynaptic Autoreceptor (Center-right of terminal: x = midX + 35)
  const autoGroup = el('g', { class: 'autoreceptor' }, mainGroup);
  const autoX = midX + 30;
  el('rect', {
    x: autoX - 16,
    y: preY + 14,
    width: 32,
    height: 12,
    rx: '4',
    fill: 'rgba(255, 107, 125, 0.15)',
    stroke: C.inhibit,
    'stroke-width': '1',
  }, autoGroup);

  el('text', {
    x: autoX,
    y: preY + 23,
    'text-anchor': 'middle',
    fill: C.ink,
    'font-family': 'var(--display)',
    'font-size': '8',
    'font-weight': '600',
  }, autoGroup).textContent = 'AUTO';

  const autoBadge = el('text', {
    x: autoX,
    y: preY - 2,
    'text-anchor': 'middle',
    fill: C.inhibit,
    'font-family': 'var(--display)',
    'font-size': '9',
    'font-weight': '600',
    opacity: '0',
  }, autoGroup);
  autoBadge.textContent = 'Autoreceptor clamp: Throttles baseline to 1.8 Hz';

  // Presynaptic DAT Transporter (Far right of terminal: x = midX + 185)
  const datGroup = el('g', { class: 'dat' }, mainGroup);
  const datX = midX + 185;
  el('rect', {
    x: datX - 14,
    y: preY + 14,
    width: 28,
    height: 12,
    rx: '4',
    fill: 'rgba(125, 240, 192, 0.15)',
    stroke: C.calcium,
    'stroke-width': '1',
  }, datGroup);

  el('text', {
    x: datX,
    y: preY + 23,
    'text-anchor': 'middle',
    fill: C.ink,
    'font-family': 'var(--display)',
    'font-size': '8',
    'font-weight': '600',
  }, datGroup).textContent = 'DAT';

  el('text', {
    x: datX,
    y: preY + 6,
    'text-anchor': 'middle',
    fill: C.muted,
    'font-family': 'var(--display)',
    'font-size': '8',
  }, datGroup).textContent = 'reuptake pump';

  // 2. Synaptic Cleft Particles
  const cleftGroup = el('g', { class: 'cleft-particles' }, mainGroup);
  const daParticles = [];
  const nParticles = 40;
  for (let i = 0; i < nParticles; i++) {
    const p = el('circle', {
      cx: midX - 220 + ((i * 11) % 440),
      cy: cleftY + ((i * 7) % 36),
      r: '2.5',
      fill: C.dopamine,
      opacity: '0',
    }, cleftGroup);
    daParticles.push(p);
  }

  // 3. Postsynaptic Membrane (Medium Spiny Neuron: y = 156..166)
  el('line', {
    x1: midX - 255,
    y1: postMembraneY,
    x2: midX + 255,
    y2: postMembraneY,
    stroke: C.cell,
    'stroke-width': '1.25',
  }, mainGroup);

  el('line', {
    x1: midX - 255,
    y1: postMembraneY + 10,
    x2: midX + 255,
    y2: postMembraneY + 10,
    stroke: C.cell,
    'stroke-width': '1.25',
  }, mainGroup);

  // Left Postsynaptic Sector: D1 Receptors (Low-affinity Go gas pedal, x = midX - 135)
  const d1X = midX - 135;
  const d1Group = el('g', { class: 'd1-complex' }, mainGroup);

  const d1Pocket = el('path', {
    d: `M ${d1X - 20} ${postMembraneY - 12} L ${d1X - 20} ${postMembraneY + 8} L ${d1X + 20} ${postMembraneY + 8} L ${d1X + 20} ${postMembraneY - 12} L ${d1X + 8} ${postMembraneY - 4} L ${d1X - 8} ${postMembraneY - 4} Z`,
    fill: 'rgba(255, 207, 107, 0.12)',
    stroke: C.excite,
    'stroke-width': '1.5',
  }, d1Group);

  // Intracellular cascade badge for D1 (y = 190)
  const d1Cascade = el('text', {
    x: d1X,
    y: postMembraneY + 36,
    'text-anchor': 'middle',
    fill: '#ffcf6b',
    'font-family': 'var(--display)',
    'font-size': '8.5',
    'font-weight': '600',
    opacity: '0.45',
  }, d1Group);
  d1Cascade.textContent = 'Needs ~1200 nM burst to unlock';

  const d1Label = el('text', {
    x: d1X,
    y: postMembraneY + 78,
    'text-anchor': 'middle',
    fill: C.ink,
    'font-family': 'var(--display)',
    'font-size': '11.5',
    'font-weight': '700',
  }, d1Group);
  d1Label.textContent = 'D1 Receptor (Gas Pedal)';

  const d1Sub = el('text', {
    x: d1X,
    y: postMembraneY + 93,
    'text-anchor': 'middle',
    fill: C.muted,
    'font-family': 'var(--display)',
    'font-size': '8.5',
  }, d1Group);
  d1Sub.textContent = 'Low affinity · Direct Go pathway';

  const d1Status = el('text', {
    x: d1X,
    y: postMembraneY + 109,
    'text-anchor': 'middle',
    fill: C.muted,
    'font-family': 'var(--display)',
    'font-size': '9.5',
    'font-weight': '600',
  }, d1Group);

  // Right Postsynaptic Sector: D2 Receptors (High-affinity No-Go brake release, x = midX + 115)
  const d2CenterX = midX + 115;
  const d2Group = el('g', { class: 'd2-complex' }, mainGroup);

  // Intracellular Endosome (y = 188, spans 174..202, well above labels at y = 234!)
  const endosomeGroup = el('g', { class: 'endosome' }, d2Group);
  const endoY = postMembraneY + 32;
  const endoCircle = el('ellipse', {
    cx: d2CenterX + 15,
    cy: endoY,
    rx: '54',
    ry: '13',
    fill: 'rgba(255, 107, 125, 0.08)',
    stroke: 'rgba(255, 107, 125, 0.45)',
    'stroke-dasharray': '3 3',
    'stroke-width': '1',
    opacity: '0',
  }, endosomeGroup);

  const endoLbl = el('text', {
    x: d2CenterX,
    y: postMembraneY + 59,
    'text-anchor': 'middle',
    fill: C.inhibit,
    'font-family': 'var(--display)',
    'font-size': '8.5',
    'font-weight': '700',
    'letter-spacing': '0.03em',
    opacity: '0',
  }, endosomeGroup);
  endoLbl.textContent = '3 OF 4 D2 RECEPTORS PULLED INSIDE CELL (EARPLUGS IN)';

  const d2HealthyHint = el('text', {
    x: d2CenterX,
    y: postMembraneY + 36,
    'text-anchor': 'middle',
    fill: '#6be4ff',
    'font-family': 'var(--display)',
    'font-size': '8.5',
    'font-weight': '600',
    opacity: '0.85',
  }, d2Group);
  d2HealthyHint.textContent = 'Catches quiet 15 nM tonic hum on surface';

  // 4 Surface D2 Receptor slots
  const d2Slots = [
    { x: d2CenterX - 45, surface: true },
    { x: d2CenterX - 15, surface: true },
    { x: d2CenterX + 15, surface: true },
    { x: d2CenterX + 45, surface: true },
  ];
  const d2RecEls = [];
  for (const s of d2Slots) {
    const pocket = el('path', {
      d: `M ${s.x - 10} ${postMembraneY - 10} L ${s.x - 10} ${postMembraneY + 6} L ${s.x + 10} ${postMembraneY + 6} L ${s.x + 10} ${postMembraneY - 10} L ${s.x + 4} ${postMembraneY - 4} L ${s.x - 4} ${postMembraneY - 4} Z`,
      fill: 'rgba(107, 228, 255, 0.16)',
      stroke: '#6be4ff',
      'stroke-width': '1.25',
      transition: 'transform 0.4s ease, opacity 0.4s ease',
    }, d2Group);
    d2RecEls.push({ slot: s, el: pocket });
  }

  const d2Label = el('text', {
    x: d2CenterX,
    y: postMembraneY + 78,
    'text-anchor': 'middle',
    fill: C.ink,
    'font-family': 'var(--display)',
    'font-size': '11.5',
    'font-weight': '700',
  }, d2Group);
  d2Label.textContent = 'D2 Receptors (Brake Release)';

  const d2Sub = el('text', {
    x: d2CenterX,
    y: postMembraneY + 93,
    'text-anchor': 'middle',
    fill: C.muted,
    'font-family': 'var(--display)',
    'font-size': '8.5',
  }, d2Group);
  d2Sub.textContent = 'High affinity · Holds No-Go brake off';

  const d2Status = el('text', {
    x: d2CenterX,
    y: postMembraneY + 109,
    'text-anchor': 'middle',
    fill: C.muted,
    'font-family': 'var(--display)',
    'font-size': '9.5',
    'font-weight': '600',
  }, d2Group);

  // 4. Bottom Metrics Strip (y = 280..312)
  const stripY = height - 30;
  const stripGroup = el('g', { class: 'metrics-strip' }, mainGroup);

  el('rect', {
    x: 40,
    y: stripY - 8,
    width: width - 80,
    height: 30,
    rx: '8',
    fill: 'rgba(185, 140, 255, 0.04)',
    stroke: 'rgba(190, 200, 255, 0.12)',
    'stroke-width': '1',
  }, stripGroup);

  const daMetric = el('text', {
    x: 60,
    y: stripY + 11,
    fill: C.ink,
    'font-family': 'var(--display)',
    'font-size': '10',
    'font-weight': '600',
  }, stripGroup);

  const d2Metric = el('text', {
    x: midX,
    y: stripY + 11,
    'text-anchor': 'middle',
    fill: '#6be4ff',
    'font-family': 'var(--display)',
    'font-size': '10',
    'font-weight': '600',
  }, stripGroup);

  const d1Metric = el('text', {
    x: width - 60,
    y: stripY + 11,
    'text-anchor': 'end',
    fill: '#ffcf6b',
    'font-family': 'var(--display)',
    'font-size': '10',
    'font-weight': '600',
  }, stripGroup);

  function updateSynapseDisplay() {
    let effectiveHz = 4.5;
    if (firingMode === 'burst') effectiveHz = 28;
    else if (firingMode === 'pause') effectiveHz = 0;
    else if (isDownregulated) effectiveHz = 1.8;

    const density = isDownregulated ? 0.35 : 1.0;
    const state = world.dopamineSynapseState ? world.dopamineSynapseState({ hz: effectiveHz, d2Density: density }) : {
      d2Occupancy: isDownregulated ? 0.2 : 0.75,
      d1Occupancy: firingMode === 'burst' ? 0.85 : 0.06,
      brakeReleasePercent: isDownregulated ? 22 : (firingMode === 'burst' ? 95 : 78),
      goSignalPercent: firingMode === 'burst' ? 88 : 6,
    };

    // Left cleft concentration label
    if (firingMode === 'burst') {
      cleftConcLbl.textContent = '~1200 nM phasic surge';
      cleftConcLbl.setAttribute('fill', '#ffcf6b');
    } else if (firingMode === 'pause') {
      cleftConcLbl.textContent = '~0 nM silent pause';
      cleftConcLbl.setAttribute('fill', '#ff6b7d');
    } else if (isDownregulated) {
      cleftConcLbl.textContent = '~4 nM throttled floor';
      cleftConcLbl.setAttribute('fill', '#ff6b7d');
    } else {
      cleftConcLbl.textContent = '~15 nM tonic hum';
      cleftConcLbl.setAttribute('fill', C.dopamine);
    }

    // Autoreceptor braking
    if (isDownregulated || firingMode === 'burst') {
      autoBadge.setAttribute('opacity', '1');
      autoBadge.textContent = isDownregulated
        ? 'Autoreceptor clamp: Throttles baseline to 1.8 Hz'
        : 'Spillover detected: Autoreceptor brake active';
    } else {
      autoBadge.setAttribute('opacity', '0');
    }

    // D1 State
    if (firingMode === 'burst') {
      d1Pocket.setAttribute('fill', 'rgba(255, 207, 107, 0.45)');
      if (glowUrl !== 'none') d1Pocket.setAttribute('filter', glowUrl);
      d1Cascade.setAttribute('opacity', '1');
      d1Cascade.textContent = '1200 nM surge unlocks D1!';
      d1Status.setAttribute('fill', '#ffcf6b');
      d1Status.textContent = 'ACTIVE! Fires Direct Go Pathway';
    } else {
      d1Pocket.setAttribute('fill', 'rgba(255, 207, 107, 0.12)');
      d1Pocket.removeAttribute('filter');
      d1Cascade.setAttribute('opacity', '0.45');
      d1Cascade.textContent = 'Needs ~1200 nM burst to unlock';
      d1Status.setAttribute('fill', C.muted);
      d1Status.textContent = 'Quiet (Ignores tonic hum)';
    }

    // D2 Internalization & Status
    if (isDownregulated) {
      endoCircle.setAttribute('opacity', '1');
      endoLbl.setAttribute('opacity', '1');
      d2HealthyHint.setAttribute('opacity', '0');

      // Internalize 3 receptors into endosome at y = postMembraneY + 32 (translate Y = 34)
      d2RecEls[0].el.setAttribute('transform', 'translate(0, 0)');
      d2RecEls[0].el.setAttribute('opacity', '0.85');
      d2RecEls[1].el.setAttribute('transform', 'translate(0, 34)');
      d2RecEls[1].el.setAttribute('opacity', '0.5');
      d2RecEls[2].el.setAttribute('transform', 'translate(0, 34)');
      d2RecEls[2].el.setAttribute('opacity', '0.5');
      d2RecEls[3].el.setAttribute('transform', 'translate(0, 34)');
      d2RecEls[3].el.setAttribute('opacity', '0.5');

      d2Status.setAttribute('fill', '#ff6b7d');
      d2Status.textContent = 'Brakes Locked (Crushing Inertia)';
    } else {
      endoCircle.setAttribute('opacity', '0');
      endoLbl.setAttribute('opacity', '0');
      d2HealthyHint.setAttribute('opacity', '0.85');
      d2HealthyHint.textContent = firingMode === 'pause'
        ? '0 Hz pause: D2 empties, brake engages'
        : 'Catches quiet 15 nM tonic hum on surface';

      // All 4 on surface
      for (const rec of d2RecEls) {
        rec.el.setAttribute('transform', 'translate(0, 0)');
        rec.el.setAttribute('opacity', '1');
      }

      d2Status.setAttribute('fill', firingMode === 'pause' ? '#ff6b7d' : '#6be4ff');
      d2Status.textContent = firingMode === 'pause'
        ? 'Letdown: Brake re-engages'
        : 'Brakes Released (Ready for Effort)';
    }

    // Bottom metrics text
    daMetric.textContent = `Cleft Dopamine: ${effectiveHz.toFixed(1)} Hz (${firingMode.toUpperCase()})`;
    d2Metric.textContent = `D2 Occupancy: ${Math.round(state.d2Occupancy * 100)}% · Striatal Brake: ${state.brakeReleasePercent}% Released`;
    d1Metric.textContent = `D1 Activation: ${state.goSignalPercent}% (Go Signal)`;

    // Drive scene
    if (scene) {
      if (isDownregulated) {
        scene.setDrive('vta', -0.6);
      } else {
        scene.setDrive('vta', (effectiveHz - 4.5) / 20);
      }
    }
  }

  updateSynapseDisplay();

  return {
    render(t) {
      // Animate floating dopamine dots across cleft
      let activeCount = 12;
      let speed = 1.0;
      if (firingMode === 'burst') {
        activeCount = 38;
        speed = 2.4;
      } else if (firingMode === 'pause') {
        activeCount = 2;
        speed = 0.5;
      } else if (isDownregulated) {
        activeCount = 4;
        speed = 0.8;
      }

      for (let i = 0; i < daParticles.length; i++) {
        const dot = daParticles[i];
        if (i >= activeCount) {
          dot.setAttribute('opacity', '0');
          continue;
        }
        const phase = (((t * speed) + i * 0.12) % 1.0);
        const y = preY + 24 + phase * (postMembraneY - preY - 32);
        dot.setAttribute('cy', y.toFixed(1));
        const op = Math.sin(phase * Math.PI) * (firingMode === 'burst' ? 0.95 : 0.65);
        dot.setAttribute('opacity', op.toFixed(2));
      }
    },

    destroy() {
      if (scene) scene.setDrive('vta', 0);
      if (svg.parentElement) svg.parentElement.removeChild(svg);
    },
  };
}
