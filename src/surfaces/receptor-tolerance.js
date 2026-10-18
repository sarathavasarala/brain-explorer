import { C, el, glowFilter, lin } from './svg.js';

function barColor(r) {
  if (r > 0.7) return C.excite;
  if (r > 0.45) return C.vta;
  if (r > 0.25) return '#ff9f68';
  return C.inhibit;
}

export function mountReceptorTolerance(container, props = {}, ctx = {}) {
  const { world, setControls } = ctx;
  const svg = el('svg', { viewBox: '0 0 800 320', preserveAspectRatio: 'xMidYMid meet' }, container);
  const glowUrl = glowFilter(svg);
  const glow = (n) => { if (glowUrl !== 'none') n.setAttribute('filter', glowUrl); return n; };
  const txt = (parent, attrs, str) => {
    const t = el('text', { 'font-family': 'var(--display)', ...attrs }, parent);
    t.textContent = str;
    return t;
  };

  txt(svg, { x: 24, y: 26, fill: C.ink, 'font-size': 13, 'font-weight': 700 }, 'Why a drug stops working as well');
  txt(svg, { x: 24, y: 44, fill: C.muted, 'font-size': 10.5 }, 'Keep pressing the same switch and the cell pushes back. Space the doses and it partly recovers.');

  const bx = 40;
  const bw = 444;
  const bt = 88;
  const bb = 232;
  const yToPx = lin(0, 1, bb, bt);
  el('line', { x1: bx, y1: bb, x2: bx + bw, y2: bb, stroke: 'rgba(190,200,255,0.25)', 'stroke-width': 1 }, svg);
  el('line', { x1: bx, y1: bt, x2: bx, y2: bb, stroke: 'rgba(190,200,255,0.25)', 'stroke-width': 1 }, svg);
  txt(svg, { x: bx - 8, y: bt + 2, 'text-anchor': 'end', fill: C.muted, 'font-size': 9.5 }, '100%');
  txt(svg, { x: bx - 8, y: bb + 2, 'text-anchor': 'end', fill: C.muted, 'font-size': 9.5 }, '0');
  txt(svg, { x: bx + bw, y: bb + 22, 'text-anchor': 'end', fill: C.muted, 'font-size': 10 }, 'each repeated dose');

  const chart = el('g', {}, svg);
  const bars = [];
  for (let i = 0; i < 8; i++) {
    const g = el('g', {}, chart);
    const bar = el('rect', { y: bb, width: 0, height: 0, rx: 4, fill: C.excite }, g);
    const cap = txt(g, { y: 0, 'text-anchor': 'middle', fill: 'rgba(233,235,245,0.6)', 'font-size': 9.5 }, '');
    bars.push({ group: g, bar, cap });
  }
  const recLine = el('path', { fill: 'none', stroke: C.dopamine, 'stroke-width': 2, 'stroke-dasharray': '5 4', 'stroke-linecap': 'round' }, chart);
  glow(recLine);

  const legend = el('g', {}, svg);
  el('rect', { x: bx, y: 62, width: 10, height: 10, rx: 3, fill: C.excite }, legend);
  txt(legend, { x: bx + 16, y: 71, fill: C.muted, 'font-size': 9.5 }, 'cell response to that dose');
  el('line', { x1: bx + 210, y1: 67, x2: bx + 232, y2: 67, stroke: C.dopamine, 'stroke-width': 2, 'stroke-dasharray': '5 4' }, legend);
  txt(legend, { x: bx + 238, y: 71, fill: C.muted, 'font-size': 9.5 }, 'receptors still available');

  const readout = el('g', {}, svg);
  const r1 = txt(readout, { x: 504, y: 96, fill: C.ink, 'font-size': 12, 'font-weight': 700 }, '');
  const r2 = txt(readout, { x: 504, y: 118, fill: C.muted, 'font-size': 10.5 }, '');
  const r3 = txt(readout, { x: 504, y: 136, fill: C.muted, 'font-size': 10.5 }, '');
  txt(readout, { x: 504, y: 172, fill: 'rgba(233,235,245,0.7)', 'font-size': 10 }, 'Desensitization: receptors respond less within minutes.');
  txt(readout, { x: 504, y: 190, fill: 'rgba(233,235,245,0.7)', 'font-size': 10 }, 'Downregulation: the cell removes receptors over days.');
  txt(readout, { x: 504, y: 208, fill: 'rgba(233,235,245,0.7)', 'font-size': 10 }, 'Spacing doses lets both mechanisms partly recover.');

  const state = { doses: props.doses || 6, washout: props.washout ?? 0.15 };

  function rebuild() {
    const series = world.repeatedDoseResponse({ doses: state.doses, desensitization: 0.7, washout: state.washout });
    const step = bw / 8;
    const w = Math.min(40, step * 0.6);
    let recD = '';
    for (let i = 0; i < bars.length; i++) {
      const b = bars[i];
      if (i >= state.doses) { b.group.setAttribute('opacity', '0'); continue; }
      b.group.setAttribute('opacity', '1');
      const cx = bx + step * (i + 0.5);
      const resp = series[i].response;
      const h = Math.max(2, resp * (bb - bt));
      b.bar.setAttribute('x', (cx - w / 2).toFixed(1));
      b.bar.setAttribute('y', (bb - h).toFixed(1));
      b.bar.setAttribute('width', w.toFixed(1));
      b.bar.setAttribute('height', h.toFixed(1));
      b.bar.setAttribute('fill', barColor(resp));
      b.cap.setAttribute('x', cx.toFixed(1));
      b.cap.setAttribute('y', (bb - h - 5).toFixed(1));
      b.cap.textContent = `${Math.round(resp * 100)}%`;

      const rl = world.receptorLevel(i + 1, { washout: state.washout });
      if (state.doses === 1) {
        recD = `M${(cx - w / 2).toFixed(1)} ${yToPx(rl).toFixed(1)} L${(cx + w / 2).toFixed(1)} ${yToPx(rl).toFixed(1)}`;
      } else {
        recD += `${i === 0 ? 'M' : 'L'}${cx.toFixed(1)} ${yToPx(rl).toFixed(1)} `;
      }
    }
    recLine.setAttribute('d', recD.trim());

    const last = series[series.length - 1];
    const avail = world.receptorLevel(state.doses, { washout: state.washout });
    r1.textContent = `After ${state.doses} dose${state.doses > 1 ? 's' : ''}`;
    r2.textContent = `Effect of the latest dose: ${Math.round(last.response * 100)}% of the first`;
    r3.textContent = `Receptors available: ${Math.round(avail * 100)}%`;
  }

  if (setControls) {
    const ctrls = document.createElement('div');
    ctrls.className = 'dock-ctrl-group';
    ctrls.style.display = 'flex';
    ctrls.style.alignItems = 'center';
    ctrls.style.gap = '12px';
    ctrls.style.flexWrap = 'wrap';
    ctrls.style.justifyContent = 'flex-end';

    const dLbl = document.createElement('span');
    dLbl.className = 'dock-label';
    dLbl.textContent = `Doses taken: ${state.doses}`;
    const dSlider = document.createElement('input');
    dSlider.type = 'range';
    dSlider.className = 'dock-range';
    dSlider.min = '1';
    dSlider.max = '8';
    dSlider.step = '1';
    dSlider.value = String(state.doses);
    dSlider.addEventListener('input', (e) => {
      state.doses = parseInt(e.target.value, 10);
      dLbl.textContent = `Doses taken: ${state.doses}`;
      rebuild();
    });

    const wLbl = document.createElement('span');
    wLbl.className = 'dock-label';
    wLbl.textContent = `Time between doses: ${Math.round(state.washout * 100)}% recovery`;
    const wSlider = document.createElement('input');
    wSlider.type = 'range';
    wSlider.className = 'dock-range';
    wSlider.min = '0';
    wSlider.max = '1';
    wSlider.step = '0.05';
    wSlider.value = String(state.washout);
    wSlider.addEventListener('input', (e) => {
      state.washout = parseFloat(e.target.value);
      wLbl.textContent = `Time between doses: ${Math.round(state.washout * 100)}% recovery`;
      rebuild();
    });

    ctrls.appendChild(dLbl);
    ctrls.appendChild(dSlider);
    ctrls.appendChild(wLbl);
    ctrls.appendChild(wSlider);
    setControls(ctrls);
  }

  rebuild();

  return {
    render() {},
    destroy() {
      if (svg.parentElement) svg.parentElement.removeChild(svg);
    },
  };
}
