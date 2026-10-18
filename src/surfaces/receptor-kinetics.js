import { C, el, glowFilter, lin } from './svg.js';

let clipCounter = 0;

export function mountReceptorKinetics(container, props = {}, ctx = {}) {
  const { world, clock, setControls } = ctx;
  const W0 = world && world.WINDOW ? world.WINDOW[0] : -0.3;
  const W1 = world && world.WINDOW ? world.WINDOW[1] : 3.0;

  const width = 800;
  const height = 300;
  const left = 112;
  const right = 768;
  const top = 46;
  const bottom = 208;

  const svg = el('svg', {
    viewBox: `0 0 ${width} ${height}`,
    preserveAspectRatio: 'xMidYMid meet',
  }, container);

  const glowUrl = glowFilter(svg);
  const glow = (n) => { if (glowUrl !== 'none') n.setAttribute('filter', glowUrl); return n; };

  const txt = (parent, attrs, str) => {
    const t = el('text', { 'font-family': 'var(--display)', ...attrs }, parent);
    t.textContent = str;
    return t;
  };

  let pulseCount = props.pulses || 1;

  const clipId = `rec-kin-clip-${++clipCounter}`;
  const defs = el('defs', {}, svg);
  const clip = el('clipPath', { id: clipId }, defs);
  const clipRect = el('rect', { x: left, y: 0, width: 0, height }, clip);

  const plot = el('g', {}, svg);
  const traces = el('g', { 'clip-path': `url(#${clipId})` }, plot);
  const markers = el('g', {}, plot);
  const axis = el('g', {}, svg);
  const overlay = el('g', {}, svg);

  el('line', { x1: left, y1: bottom, x2: right, y2: bottom, stroke: 'rgba(190,200,255,0.25)', 'stroke-width': 1 }, axis);
  el('line', { x1: left, y1: top, x2: left, y2: bottom, stroke: 'rgba(190,200,255,0.25)', 'stroke-width': 1 }, axis);
  txt(axis, { x: left - 10, y: top + 4, 'text-anchor': 'end', fill: C.muted, 'font-size': 10 }, 'high');
  txt(axis, { x: left - 10, y: bottom + 4, 'text-anchor': 'end', fill: C.muted, 'font-size': 10 }, 'rest');
  txt(axis, { x: (left + right) / 2, y: bottom + 34, 'text-anchor': 'middle', fill: C.muted, 'font-size': 10 }, 'time after the signal (seconds)');

  const fastPath = el('path', { fill: 'none', stroke: C.excite, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, traces);
  glow(fastPath);
  const slowPath = el('path', { fill: 'none', stroke: C.dopamine, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, traces);

  const fastDot = el('circle', { r: 4.5, fill: C.excite, opacity: 0 }, overlay);
  glow(fastDot);
  const slowDot = el('circle', { r: 4.5, fill: C.dopamine, opacity: 0 }, overlay);
  glow(slowDot);
  const playhead = el('line', { x1: left, y1: top - 6, x2: left, y2: bottom, stroke: 'rgba(233,235,245,0.28)', 'stroke-width': 1 }, overlay);

  txt(svg, { x: left, y: 26, fill: C.excite, 'font-size': 11, 'font-weight': 700 }, 'Ionotropic: sharp, brief, precise');
  txt(svg, { x: right, y: 26, 'text-anchor': 'end', fill: C.dopamine, 'font-size': 11, 'font-weight': 700 }, 'Metabotropic: slow, broad, sums up');
  txt(svg, { x: left, y: bottom + 18, fill: 'rgba(233,235,245,0.4)', 'font-size': 10 }, 'each tick = one pulse of transmitter');
  const stat = txt(svg, { x: right, y: bottom + 18, 'text-anchor': 'end', fill: 'rgba(233,235,245,0.62)', 'font-size': 10.5 }, '');

  let xToPx = lin(W0, W1, left, right);
  let yToPx = lin(0, 1.2, bottom, top);
  let data = null;

  function rebuild() {
    const pulses = world.pulseTrain({ n: pulseCount, start: 0, interval: 0.32 });
    while (markers.firstChild) markers.removeChild(markers.firstChild);
    for (const tp of pulses) {
      const x = xToPx(tp);
      el('line', { x1: x, y1: top - 4, x2: x, y2: bottom, stroke: 'rgba(233,235,245,0.18)', 'stroke-width': 1, 'stroke-dasharray': '3 4' }, markers);
    }

    const steps = 360;
    const pts = [];
    let maxV = 0;
    let fastArea = 0;
    let slowArea = 0;
    for (let i = 0; i <= steps; i++) {
      const t = W0 + ((W1 - W0) * i) / steps;
      const f = world.ionotropicTrace(t, { pulses, tau: 0.07, gain: 1 });
      const s = world.metabotropicTrace(t, { pulses, delay: 0.18, tau: 0.5, gain: 1 });
      pts.push({ t, f, s });
      maxV = Math.max(maxV, f, s);
      fastArea += f;
      slowArea += s;
    }
    const yMax = Math.max(1.3, maxV * 1.08);
    yToPx = lin(0, yMax, bottom, top);

    let dF = '';
    let dS = '';
    for (let i = 0; i < pts.length; i++) {
      const x = xToPx(pts[i].t).toFixed(1);
      dF += `${i === 0 ? 'M' : 'L'}${x} ${yToPx(pts[i].f).toFixed(1)} `;
      dS += `${i === 0 ? 'M' : 'L'}${x} ${yToPx(pts[i].s).toFixed(1)} `;
    }
    fastPath.setAttribute('d', dF.trim());
    slowPath.setAttribute('d', dS.trim());
    data = { pts, pulses, xToPx, yToPx };
    stat.textContent = `area under curve: slow is about ${(slowArea / Math.max(1e-6, fastArea)).toFixed(1)}x the fast one`;
  }

  let unsubClock = null;
  if (setControls) {
    const ctrls = document.createElement('div');
    ctrls.className = 'dock-ctrl-group';
    ctrls.style.display = 'flex';
    ctrls.style.alignItems = 'center';
    ctrls.style.gap = '12px';

    const lbl = document.createElement('span');
    lbl.className = 'dock-label';
    lbl.textContent = `Transmitter pulses: ${pulseCount}`;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'dock-range';
    slider.min = '1';
    slider.max = '5';
    slider.step = '1';
    slider.value = String(pulseCount);
    slider.addEventListener('input', (e) => {
      pulseCount = parseInt(e.target.value, 10);
      lbl.textContent = `Transmitter pulses: ${pulseCount}`;
      rebuild();
      if (clock) clock.seek(W0);
    });

    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'dock-btn';
    playBtn.textContent = clock && clock.playing ? 'Pause' : 'Play';
    playBtn.setAttribute('aria-pressed', clock && clock.playing ? 'true' : 'false');
    playBtn.addEventListener('click', () => { if (!clock) return; if (clock.playing) clock.pause(); else clock.play(); });
    if (clock) {
      unsubClock = clock.subscribe((_t, clk) => {
        playBtn.textContent = clk.playing ? 'Pause' : 'Play';
        playBtn.setAttribute('aria-pressed', clk.playing ? 'true' : 'false');
      });
    }

    ctrls.appendChild(lbl);
    ctrls.appendChild(slider);
    ctrls.appendChild(playBtn);
    setControls(ctrls);
  }

  rebuild();

  return {
    render(t) {
      if (!data) return;
      const prog = Math.max(0, Math.min(1, (t - W0) / (W1 - W0)));
      clipRect.setAttribute('width', ((right - left) * prog).toFixed(1));
      const x = xToPx(t);
      playhead.setAttribute('x1', x.toFixed(1));
      playhead.setAttribute('x2', x.toFixed(1));

      const f = world.ionotropicTrace(t, { pulses: data.pulses, tau: 0.07, gain: 1 });
      const s = world.metabotropicTrace(t, { pulses: data.pulses, delay: 0.18, tau: 0.5, gain: 1 });
      fastDot.setAttribute('cx', x.toFixed(1));
      fastDot.setAttribute('cy', yToPx(f).toFixed(1));
      fastDot.setAttribute('opacity', (t >= W0 && prog < 1 ? 0.95 : 0.4).toFixed(2));
      slowDot.setAttribute('cx', x.toFixed(1));
      slowDot.setAttribute('cy', yToPx(s).toFixed(1));
      slowDot.setAttribute('opacity', (t >= W0 && prog < 1 ? 0.95 : 0.4).toFixed(2));
    },
    destroy() {
      if (unsubClock) unsubClock();
      if (svg.parentElement) svg.parentElement.removeChild(svg);
    },
  };
}
