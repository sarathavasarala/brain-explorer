import { NS, C, el, glowFilter, lin } from './svg.js';

export default {
  type: 'wiring',

  mount(container, props = {}, ctx = {}) {
    const { world, clock, scene, setControls } = ctx;

    let width = container.clientWidth || 800;
    let height = container.clientHeight || 240;

    const svg = el('svg', {
      viewBox: `0 0 ${width} ${height}`,
      preserveAspectRatio: 'xMidYMid meet',
    }, container);

    const glowUrl = glowFilter(svg);

    // Header controls (e.g. "Juice arrives" toggle in step 9, and Play/Pause)
    let toggles = { juice: true, noJuice: false };

    if (setControls) {
      const ctrls = document.createElement('div');
      ctrls.className = 'dock-ctrl-group';
      ctrls.style.display = 'flex';
      ctrls.style.alignItems = 'center';
      ctrls.style.gap = '10px';

      const perturb = props.operators?.perturb || [];
      const juicePerturb = perturb.find((p) => p.id === 'juice');
      if (juicePerturb) {
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'dock-btn';
        toggleBtn.setAttribute('aria-pressed', 'true');
        toggleBtn.textContent = juicePerturb.label || 'Juice arrives';

        toggleBtn.addEventListener('click', () => {
          toggles.juice = !toggles.juice;
          toggles.noJuice = !toggles.juice;
          toggleBtn.setAttribute('aria-pressed', toggles.juice ? 'true' : 'false');
          updateSparkline();
        });

        ctrls.appendChild(toggleBtn);
      }

      const playBtn = document.createElement('button');
      playBtn.type = 'button';
      playBtn.className = 'dock-btn';
      playBtn.setAttribute('aria-pressed', clock.playing ? 'true' : 'false');
      playBtn.textContent = clock.playing ? 'Pause' : 'Play';
      playBtn.addEventListener('click', () => {
        if (clock.playing) clock.pause(); else clock.play();
      });
      ctrls.appendChild(playBtn);

      clock.subscribe((_t, clk) => {
        playBtn.setAttribute('aria-pressed', clk.playing ? 'true' : 'false');
        playBtn.textContent = clk.playing ? 'Pause' : 'Play';
      });

      setControls(ctrls);
    }

    // Nodes and edges data
    const nodes = props.nodes || [];
    const edges = props.edges || [];
    const ring = props.ring;
    const traceDef = props.trace;

    const nodeMap = new Map();
    const nodeEls = new Map();

    const defs = svg.querySelector('defs') || el('defs', {}, svg);

    // Marker heads
    // Excite arrow
    const exciteMarker = el('marker', {
      id: 'arrow-excite',
      viewBox: '0 0 10 10',
      refX: '8',
      refY: '5',
      markerWidth: '6',
      markerHeight: '6',
      orient: 'auto-start-reverse',
    }, defs);
    el('path', { d: 'M 0 1.5 L 8 5 L 0 8.5 z', fill: C.excite }, exciteMarker);

    // Inhibit flat bar
    const inhibitMarker = el('marker', {
      id: 'bar-inhibit',
      viewBox: '0 0 10 10',
      refX: '5',
      refY: '5',
      markerWidth: '6',
      markerHeight: '6',
      orient: 'auto',
    }, defs);
    el('line', { x1: '5', y1: '1', x2: '5', y2: '9', stroke: C.inhibit, 'stroke-width': '2' }, inhibitMarker);

    // Modulate open circle
    const modulateMarker = el('marker', {
      id: 'circle-modulate',
      viewBox: '0 0 10 10',
      refX: '5',
      refY: '5',
      markerWidth: '7',
      markerHeight: '7',
      orient: 'auto',
    }, defs);
    el('circle', { cx: '5', cy: '5', r: '3.5', fill: 'none', stroke: C.dopamine, 'stroke-width': '1.5' }, modulateMarker);

    const edgesGroup = el('g', { class: 'edges' }, svg);
    const nodesGroup = el('g', { class: 'nodes' }, svg);
    const pulsesGroup = el('g', { class: 'pulses' }, svg);
    const traceGroup = el('g', { class: 'trace' }, svg);

    // Edge curves & pulses
    const edgeData = [];

    function buildGraph() {
      while (edgesGroup.firstChild) edgesGroup.removeChild(edgesGroup.firstChild);
      while (nodesGroup.firstChild) nodesGroup.removeChild(nodesGroup.firstChild);
      while (pulsesGroup.firstChild) pulsesGroup.removeChild(pulsesGroup.firstChild);
      nodeMap.clear();
      nodeEls.clear();
      edgeData.length = 0;

      for (const n of nodes) {
        const px = n.x * width;
        const py = n.y * height;
        nodeMap.set(n.id, { ...n, px, py });
      }

      // Ring
      if (ring && nodeMap.has(ring.node)) {
        const targetNode = nodeMap.get(ring.node);
        el('circle', {
          cx: targetNode.px,
          cy: targetNode.py,
          r: '24',
          fill: 'none',
          stroke: C.cell,
          'stroke-width': '1.25',
          'stroke-dasharray': '3 3',
        }, nodesGroup);

        el('text', {
          x: targetNode.px,
          y: targetNode.py - 30,
          'text-anchor': 'middle',
          fill: C.cell,
          'font-family': 'var(--display)',
          'font-size': '10',
          'letter-spacing': '0.04em',
        }, nodesGroup).textContent = ring.label || 'same neuron';
      }

      // Edges
      for (const edge of edges) {
        const src = nodeMap.get(edge.from);
        const dst = nodeMap.get(edge.to);
        if (!src || !dst) continue;

        const color = edge.type === 'inhibit' ? C.inhibit
                    : edge.type === 'modulate' ? C.dopamine
                    : C.excite;
        const marker = edge.type === 'inhibit' ? 'url(#bar-inhibit)'
                     : edge.type === 'modulate' ? 'url(#circle-modulate)'
                     : 'url(#arrow-excite)';

        // Curved quadratic path
        const midX = (src.px + dst.px) / 2;
        const midY = (src.py + dst.py) / 2;
        const dx = dst.px - src.px;
        const dy = dst.py - src.py;
        const len = Math.hypot(dx, dy);

        // Small perpendicular bow
        const nx = -dy / (len || 1);
        const ny = dx / (len || 1);
        const bow = 14;
        const ctrlX = midX + nx * bow;
        const ctrlY = midY + ny * bow;

        // Path shortened slightly so marker doesn't overlap node
        const rDst = dst.kind === 'neuron' ? 10 : 16;
        const endRatio = Math.max(0, (len - rDst) / (len || 1));
        const endX = src.px + dx * endRatio;
        const endY = src.py + dy * endRatio;

        const dPath = `M ${src.px.toFixed(1)} ${src.py.toFixed(1)} Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`;

        const pathEl = el('path', {
          d: dPath,
          fill: 'none',
          stroke: color,
          'stroke-width': '1.25',
          opacity: '0.6',
          'marker-end': marker,
        }, edgesGroup);

        // Edge label
        if (edge.label) {
          const lblX = ctrlX + nx * 10;
          const lblY = ctrlY + ny * 10;
          const txt = el('text', {
            x: lblX,
            y: lblY + 3,
            'text-anchor': 'middle',
            fill: C.muted,
            'font-family': 'var(--display)',
            'font-size': '10',
          }, edgesGroup);
          txt.textContent = edge.label;
        }

        // Pulse dot
        const pulseDot = el('circle', {
          r: '4',
          fill: color,
          opacity: '0',
          filter: glowUrl !== 'none' ? glowUrl : '',
        }, pulsesGroup);

        edgeData.push({
          edge,
          src,
          dst,
          color,
          curve: { p0: { x: src.px, y: src.py }, p1: { x: ctrlX, y: ctrlY }, p2: { x: endX, y: endY } },
          dot: pulseDot,
        });
      }

      // Nodes
      for (const n of nodes) {
        const pos = nodeMap.get(n.id);
        const g = el('g', { class: `node-${n.id}` }, nodesGroup);

        let shape;
        if (n.kind === 'region') {
          // Pill
          const textW = Math.max(80, n.label.length * 6.5 + 24);
          const h = 26;
          shape = el('rect', {
            x: pos.px - textW / 2,
            y: pos.py - h / 2,
            width: textW,
            height: h,
            rx: '13',
            fill: C.faint,
            stroke: C.cell,
            'stroke-width': '1.25',
          }, g);

          const txt = el('text', {
            x: pos.px,
            y: pos.py + 4,
            'text-anchor': 'middle',
            fill: C.ink,
            'font-family': 'var(--display)',
            'font-size': '11',
            'font-weight': '500',
          }, g);
          txt.textContent = n.label;
        } else if (n.kind === 'neuron') {
          shape = el('circle', {
            cx: pos.px,
            cy: pos.py,
            r: '10',
            fill: 'rgba(205,213,255,0.12)',
            stroke: C.cell,
            'stroke-width': '1.5',
          }, g);

          const txt = el('text', {
            x: pos.px,
            y: pos.py + 22,
            'text-anchor': 'middle',
            fill: C.ink,
            'font-family': 'var(--display)',
            'font-size': '11',
            'font-weight': '500',
          }, g);
          txt.textContent = n.label;
        } else {
          // Input
          shape = el('circle', {
            cx: pos.px,
            cy: pos.py,
            r: '4',
            fill: C.cell,
          }, g);

          const txt = el('text', {
            x: pos.px,
            y: pos.py - 10,
            'text-anchor': 'middle',
            fill: C.muted,
            'font-family': 'var(--display)',
            'font-size': '10',
          }, g);
          txt.textContent = n.label;
        }

        nodeEls.set(n.id, { g, shape });
      }

      setupSparkline();
    }

    // Sparkline for target node (step 9)
    let sparklinePlayhead = null;
    let sparklinePath = null;
    let sparklineArea = null;

    function setupSparkline() {
      while (traceGroup.firstChild) traceGroup.removeChild(traceGroup.firstChild);
      if (!traceDef || !nodeMap.has(traceDef.node)) return;

      const target = nodeMap.get(traceDef.node);
      const spW = 120;
      const spH = 40;
      const spX = Math.min(width - spW - 12, target.px - spW / 2);
      const spY = target.py - 54;

      const box = el('g', { transform: `translate(${spX}, ${spY})` }, traceGroup);

      // Baseline at 5 Hz
      const spRateToY = lin(0, 32, spH, 0);
      const bY = spRateToY(5);

      el('line', {
        x1: 0,
        y1: bY,
        x2: spW,
        y2: bY,
        stroke: C.faint,
        'stroke-width': '1',
        'stroke-dasharray': '2 2',
      }, box);

      sparklineArea = el('path', { fill: C.dopamine, opacity: '0.12' }, box);
      sparklinePath = el('path', { fill: 'none', stroke: C.dopamine, 'stroke-width': '1.5' }, box);

      sparklinePlayhead = el('line', {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: spH,
        stroke: C.ink,
        'stroke-width': '1',
      }, box);

      updateSparkline();
    }

    function updateSparkline() {
      if (!sparklinePath || !world) return;
      const trial = { chime: true, juice: toggles.juice, V: 1 };
      const spW = 120;
      const spH = 40;
      const spRateToY = lin(0, 32, spH, 0);
      const spTtoX = lin(world.WINDOW[0], world.WINDOW[1], 0, spW);

      let dLine = '';
      for (let s = 0; s <= 40; s++) {
        const ct = world.WINDOW[0] + (s / 40) * (world.WINDOW[1] - world.WINDOW[0]);
        const r = world.daRate(ct, trial);
        const x = spTtoX(ct).toFixed(1);
        const y = spRateToY(r).toFixed(1);
        dLine += s === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
      }

      sparklinePath.setAttribute('d', dLine);
      sparklineArea.setAttribute('d', `${dLine} L ${spW} ${spH} L 0 ${spH} Z`);
    }

    buildGraph();

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        width = Math.max(300, entry.contentRect.width);
        height = Math.max(160, entry.contentRect.height);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        buildGraph();
      }
    });
    ro.observe(container);

    return {
      render(t) {
        // Update pulses along edges
        for (const item of edgeData) {
          let pulseActive = false;
          let pulseU = 0;

          for (const f of item.edge.fire || []) {
            if (f.when && !toggles[f.when]) continue;
            const dt = t - f.at;
            if (dt >= 0 && dt <= 0.25) {
              pulseActive = true;
              pulseU = dt / 0.25;
              break;
            }
          }

          if (pulseActive) {
            // Quadratic bezier calculation
            const u = pulseU;
            const { p0, p1, p2 } = item.curve;
            const px = (1 - u) * (1 - u) * p0.x + 2 * (1 - u) * u * p1.x + u * u * p2.x;
            const py = (1 - u) * (1 - u) * p0.y + 2 * (1 - u) * u * p1.y + u * u * p2.y;

            item.dot.setAttribute('cx', px.toFixed(1));
            item.dot.setAttribute('cy', py.toFixed(1));
            item.dot.setAttribute('opacity', '1');
          } else {
            item.dot.setAttribute('opacity', '0');
          }
        }

        // Pulse landing on nodes (glow for 200 ms after landing)
        for (const item of edgeData) {
          const dstEntry = nodeEls.get(item.edge.to);
          if (!dstEntry) continue;
          let landing = false;
          for (const f of item.edge.fire || []) {
            if (f.when && !toggles[f.when]) continue;
            const dt = t - f.at;
            if (dt >= 0.25 && dt <= 0.45) {
              landing = true;
              break;
            }
          }
          if (landing) {
            dstEntry.shape.setAttribute('stroke', C.ink);
            dstEntry.shape.setAttribute('stroke-width', '2.5');
          } else {
            dstEntry.shape.setAttribute('stroke', C.cell);
            dstEntry.shape.setAttribute('stroke-width', dstEntry.shape.tagName === 'circle' ? '1.5' : '1.25');
          }
        }

        // Sparkline playhead
        if (sparklinePlayhead) {
          const spW = 120;
          const spTtoX = lin(world.WINDOW[0], world.WINDOW[1], 0, spW);
          const px = Math.max(0, Math.min(spW, spTtoX(t)));
          sparklinePlayhead.setAttribute('x1', px.toFixed(1));
          sparklinePlayhead.setAttribute('x2', px.toFixed(1));
        }

        // Drive VTA in step 9
        if (scene && traceDef) {
          const trial = { chime: true, juice: toggles.juice, V: 1 };
          const rate = world.daRate(t, trial);
          scene.setDrive('vta', (rate - 5) / 26);
        }
      },

      destroy() {
        ro.disconnect();
        if (scene) scene.setDrive('vta', 0);
        if (svg.parentElement) svg.parentElement.removeChild(svg);
      },
    };
  },
};
