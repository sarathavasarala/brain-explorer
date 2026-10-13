import { NS, C, el, glowFilter, lin } from './svg.js';

export default {
  type: 'machinery',

  mount(container, props = {}, ctx = {}) {
    const { world, clock, setControls } = ctx;

    let width = container.clientWidth || 800;
    let height = container.clientHeight || 240;

    const svg = el('svg', {
      viewBox: `0 0 ${width} ${height}`,
      preserveAspectRatio: 'xMidYMid meet',
    }, container);

    const glowUrl = glowFilter(svg);

    // Toggles state
    let glutamateOn = false;
    let depolarizedOn = false;
    let lastToggleTime = 0;

    // Header controls
    if (setControls) {
      const ctrls = document.createElement('div');
      ctrls.className = 'dock-ctrl-group';
      ctrls.style.display = 'flex';
      ctrls.style.alignItems = 'center';
      ctrls.style.gap = '10px';

      const gluBtn = document.createElement('button');
      gluBtn.type = 'button';
      gluBtn.className = 'dock-btn';
      gluBtn.setAttribute('aria-pressed', 'false');
      gluBtn.textContent = 'Glutamate';
      gluBtn.addEventListener('click', () => {
        glutamateOn = !glutamateOn;
        gluBtn.setAttribute('aria-pressed', glutamateOn ? 'true' : 'false');
        lastToggleTime = clock.t;
      });

      const depBtn = document.createElement('button');
      depBtn.type = 'button';
      depBtn.className = 'dock-btn';
      depBtn.setAttribute('aria-pressed', 'false');
      depBtn.textContent = 'Depolarized';
      depBtn.addEventListener('click', () => {
        depolarizedOn = !depolarizedOn;
        depBtn.setAttribute('aria-pressed', depolarizedOn ? 'true' : 'false');
        lastToggleTime = clock.t;
      });

      const playBtn = document.createElement('button');
      playBtn.type = 'button';
      playBtn.className = 'dock-btn';
      playBtn.setAttribute('aria-pressed', clock.playing ? 'true' : 'false');
      playBtn.textContent = clock.playing ? 'Pause' : 'Play';
      playBtn.addEventListener('click', () => {
        if (clock.playing) clock.pause(); else clock.play();
      });

      clock.subscribe((_t, clk) => {
        playBtn.setAttribute('aria-pressed', clk.playing ? 'true' : 'false');
        playBtn.textContent = clk.playing ? 'Pause' : 'Play';
      });

      ctrls.appendChild(gluBtn);
      ctrls.appendChild(depBtn);
      ctrls.appendChild(playBtn);
      setControls(ctrls);
    }

    // Drawing the schematic synapse
    const mainGroup = el('g', { class: 'synapse-machinery' }, svg);

    // Layout positions
    const midX = width / 2;
    const preY = 32;
    const postMembraneY = 110;

    // 1. Presynaptic terminal
    const preTerminal = el('rect', {
      x: midX - 220,
      y: preY - 18,
      width: 440,
      height: 38,
      rx: '14',
      fill: 'rgba(205,213,255,0.06)',
      stroke: C.cell,
      'stroke-width': '1.25',
    }, mainGroup);

    const preTitle = el('text', {
      x: midX - 200,
      y: preY - 24,
      fill: C.muted,
      'font-family': 'var(--display)',
      'font-size': '10',
      'letter-spacing': '0.08em',
      'text-transform': 'uppercase',
    }, mainGroup);
    preTitle.textContent = 'presynaptic terminal (chime input)';

    // Vesicles inside presynaptic terminal
    const vesiclePositions = [
      { x: midX - 140, y: preY + 2 },
      { x: midX - 110, y: preY + 6 },
      { x: midX - 80, y: preY - 2 },
      { x: midX + 30, y: preY + 4 },
      { x: midX + 70, y: preY - 3 },
      { x: midX + 110, y: preY + 5 },
      { x: midX + 140, y: preY + 1 },
    ];
    for (const vp of vesiclePositions) {
      el('circle', {
        cx: vp.x,
        cy: vp.y,
        r: '4',
        fill: C.faint,
        stroke: C.excite,
        'stroke-width': '1',
      }, mainGroup);
    }

    // 2. Postsynaptic membrane (two 1.25px cell lines, 10px apart)
    el('line', {
      x1: midX - 240,
      y1: postMembraneY,
      x2: midX + 240,
      y2: postMembraneY,
      stroke: C.cell,
      'stroke-width': '1.25',
    }, mainGroup);

    el('line', {
      x1: midX - 240,
      y1: postMembraneY + 10,
      x2: midX + 240,
      y2: postMembraneY + 10,
      stroke: C.cell,
      'stroke-width': '1.25',
    }, mainGroup);

    // Channel 1: AMPA (left)
    const ampaX = midX - 60;
    // Channel walls
    el('rect', { x: ampaX - 10, y: postMembraneY - 6, width: 6, height: 22, rx: '3', fill: C.cell }, mainGroup);
    el('rect', { x: ampaX + 4, y: postMembraneY - 6, width: 6, height: 22, rx: '3', fill: C.cell }, mainGroup);

    const ampaLbl = el('text', {
      x: ampaX,
      y: postMembraneY + 28,
      'text-anchor': 'middle',
      fill: C.ink,
      'font-family': 'var(--display)',
      'font-size': '11',
      'font-weight': '600',
    }, mainGroup);
    ampaLbl.textContent = 'AMPA';

    // Channel 2: NMDA (right)
    const nmdaX = midX + 60;
    el('rect', { x: nmdaX - 10, y: postMembraneY - 6, width: 6, height: 22, rx: '3', fill: C.cell }, mainGroup);
    el('rect', { x: nmdaX + 4, y: postMembraneY - 6, width: 6, height: 22, rx: '3', fill: C.cell }, mainGroup);

    const nmdaLbl = el('text', {
      x: nmdaX,
      y: postMembraneY + 28,
      'text-anchor': 'middle',
      fill: C.ink,
      'font-family': 'var(--display)',
      'font-size': '11',
      'font-weight': '600',
    }, mainGroup);
    nmdaLbl.textContent = 'NMDA';

    // Magnesium plug (cell circle r=6) sitting in channel
    const mgGroup = el('g', { class: 'mg-plug' }, mainGroup);
    const mgCircle = el('circle', {
      cx: nmdaX,
      cy: postMembraneY + 5,
      r: '6',
      fill: C.ink,
      stroke: C.cell,
      'stroke-width': '1.5',
    }, mgGroup);

    const mgText = el('text', {
      x: nmdaX,
      y: postMembraneY + 8,
      'text-anchor': 'middle',
      fill: '#06070b',
      'font-family': 'var(--display)',
      'font-size': '8',
      'font-weight': '700',
    }, mgGroup);
    mgText.textContent = 'Mg';

    // Glutamate release dots
    const glutamateGroup = el('g', { class: 'glu-dots' }, mainGroup);
    const gluDots = [];
    for (let i = 0; i < 16; i++) {
      const dot = el('circle', {
        cx: midX - 90 + (i % 8) * 24 + ((i > 7) ? 8 : 0),
        cy: preY + 16 + Math.floor(i / 8) * 12,
        r: '2.5',
        fill: C.excite,
        opacity: '0',
      }, glutamateGroup);
      gluDots.push(dot);
    }

    // Sodium Na+ dots through AMPA
    const naGroup = el('g', { class: 'na-dots' }, mainGroup);
    const naDots = [];
    for (let i = 0; i < 4; i++) {
      const dot = el('circle', {
        cx: ampaX,
        cy: postMembraneY + 5 + i * 8,
        r: '2',
        fill: C.ink,
        opacity: '0',
      }, naGroup);
      naDots.push(dot);
    }

    const naLbl = el('text', {
      x: ampaX + 16,
      y: postMembraneY + 16,
      fill: C.muted,
      'font-family': 'var(--display)',
      'font-size': '9',
      opacity: '0',
    }, naGroup);
    naLbl.textContent = 'Na+';

    // Calcium Ca2+ dots through NMDA
    const caGroup = el('g', { class: 'ca-dots' }, mainGroup);
    const caDots = [];
    for (let i = 0; i < 10; i++) {
      const dot = el('circle', {
        cx: nmdaX + ((i % 3) - 1) * 7,
        cy: postMembraneY + 18 + Math.floor(i / 3) * 6,
        r: '2.5',
        fill: C.calcium,
        opacity: '0',
        filter: glowUrl !== 'none' ? glowUrl : '',
      }, caGroup);
      caDots.push(dot);
    }

    // Inside receiving cell readouts (bottom)
    const insideGroup = el('g', { class: 'inside-cell' }, mainGroup);
    const inY = postMembraneY + 48;

    const inTitle = el('text', {
      x: midX - 200,
      y: inY,
      fill: C.muted,
      'font-family': 'var(--display)',
      'font-size': '10',
      'letter-spacing': '0.08em',
      'text-transform': 'uppercase',
    }, insideGroup);
    inTitle.textContent = 'inside the receiving cell';

    // Voltage indicator bar
    el('text', {
      x: midX - 100,
      y: inY + 22,
      fill: C.muted,
      'font-family': 'var(--display)',
      'font-size': '10',
    }, insideGroup).textContent = 'voltage';

    const voltBarBg = el('rect', {
      x: midX - 50,
      y: inY + 14,
      width: 70,
      height: 8,
      rx: '4',
      fill: C.faint,
    }, insideGroup);

    const voltBar = el('rect', {
      x: midX - 50,
      y: inY + 14,
      width: 14,
      height: 8,
      rx: '4',
      fill: C.excite,
    }, insideGroup);

    // Tag sparkline
    el('text', {
      x: midX + 44,
      y: inY + 22,
      fill: C.muted,
      'font-family': 'var(--display)',
      'font-size': '10',
    }, insideGroup).textContent = 'tag';

    const tagSparkline = el('path', {
      fill: 'none',
      stroke: C.calcium,
      'stroke-width': '1.5',
    }, insideGroup);

    const tagSparklineArea = el('path', {
      fill: C.calcium,
      opacity: '0.12',
    }, insideGroup);

    function updateTagSparkline(val) {
      const spX = midX + 70;
      const spY = inY + 22;
      const spW = 80;
      const spH = 18;

      let d = `M ${spX} ${spY}`;
      for (let s = 0; s <= 20; s++) {
        const u = s / 20;
        const decay = Math.exp(-u * 2.5) * val;
        const x = (spX + u * spW).toFixed(1);
        const y = (spY - decay * spH).toFixed(1);
        d += ` L ${x} ${y}`;
      }
      tagSparkline.setAttribute('d', d);
      tagSparklineArea.setAttribute('d', `${d} L ${spX + spW} ${spY} L ${spX} ${spY} Z`);
    }

    updateTagSparkline(0);

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        width = Math.max(300, entry.contentRect.width);
        height = Math.max(160, entry.contentRect.height);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      }
    });
    ro.observe(container);

    return {
      render(t) {
        const state = world.nmda({ glutamate: glutamateOn, depolarized: depolarizedOn });

        // 1. Glutamate dots animation
        if (glutamateOn) {
          const cycle = ((t * 1.8) % 1.0);
          for (let i = 0; i < gluDots.length; i++) {
            const dot = gluDots[i];
            const phase = (cycle + i * 0.06) % 1.0;
            dot.setAttribute('cy', preY + 16 + phase * 44);
            dot.setAttribute('opacity', String(Math.sin(phase * Math.PI) * 0.85));
          }
        } else {
          for (const dot of gluDots) dot.setAttribute('opacity', '0');
        }

        // 2. AMPA current (Na+ dots)
        if (glutamateOn) {
          const naCycle = ((t * 2.2) % 1.0);
          for (let i = 0; i < naDots.length; i++) {
            const dot = naDots[i];
            const phase = (naCycle + i * 0.25) % 1.0;
            dot.setAttribute('cy', postMembraneY - 2 + phase * 26);
            dot.setAttribute('opacity', '0.9');
          }
          naLbl.setAttribute('opacity', '1');
          voltBar.setAttribute('width', depolarizedOn ? '68' : '44');
        } else {
          for (const dot of naDots) dot.setAttribute('opacity', '0');
          naLbl.setAttribute('opacity', '0');
          voltBar.setAttribute('width', depolarizedOn ? '48' : '12');
        }

        // 3. Magnesium plug behavior
        if (!state.mgBlocked) {
          // Open! Slides up and out
          mgGroup.setAttribute('transform', `translate(0, -32)`);
          mgGroup.setAttribute('opacity', '0.4');
        } else if (depolarizedOn && !glutamateOn) {
          // Depolarized alone: wobbles 2px shake, stays plugged
          const wobble = Math.sin(t * 28) * 2;
          mgGroup.setAttribute('transform', `translate(${wobble}, 0)`);
          mgGroup.setAttribute('opacity', '1');
        } else {
          mgGroup.setAttribute('transform', 'translate(0, 0)');
          mgGroup.setAttribute('opacity', '1');
        }

        // 4. Calcium flow
        if (state.calcium > 0) {
          const caCycle = ((t * 2.0) % 1.0);
          for (let i = 0; i < caDots.length; i++) {
            const dot = caDots[i];
            const phase = (caCycle + i * 0.1) % 1.0;
            dot.setAttribute('cy', postMembraneY + 6 + phase * 28);
            dot.setAttribute('opacity', String(Math.sin(phase * Math.PI) * 0.95));
          }
          updateTagSparkline(0.85);
        } else {
          for (const dot of caDots) dot.setAttribute('opacity', '0');
          updateTagSparkline(0);
        }
      },

      destroy() {
        ro.disconnect();
        if (svg.parentElement) svg.parentElement.removeChild(svg);
      },
    };
  },
};
