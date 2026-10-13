import { NS, C, el, lin } from './svg.js';

export default {
  type: 'quantity',

  mount(container, props = {}, ctx = {}) {
    const { world, setControls } = ctx;
    const kind = props.kind || 'weights';

    const width = 800;
    const height = 220;

    const svg = el('svg', {
      viewBox: `0 0 ${width} ${height}`,
      preserveAspectRatio: 'xMidYMid meet',
    }, container);

    const padLeft = 48;
    const padRight = kind === 'window' ? 200 : 80;
    const padTop = 22;
    const padBottom = 30;

    let cleanup = () => {};

    if (kind === 'weights') {
      // ------------------------------------------------ WEIGHTS PLOT (step 4)
      let noiseAloneVal = 0.25;
      let noiseAlways = false;
      let drawnTrials = 30;
      let animInterval = null;

      let scheduleList = [];
      let historyList = [];

      function recompute() {
        const noiseRate = noiseAlways ? 1 : 0.3;
        const noiseAloneEvery = noiseAlways
          ? 0
          : (noiseAloneVal <= 0 ? 0 : Math.max(1, Math.round(1 / noiseAloneVal)));
        scheduleList = world.schedule({ n: 30, noiseRate, noiseAloneEvery, seed: 11 });
        historyList = world.learn(scheduleList, { want: 1 });
      }

      recompute();

      // Header controls
      if (setControls) {
        const ctrls = document.createElement('div');
        ctrls.className = 'dock-ctrl-group';
        ctrls.style.display = 'flex';
        ctrls.style.alignItems = 'center';
        ctrls.style.gap = '12px';

        const sliderLabel = document.createElement('span');
        sliderLabel.className = 'dock-label';
        sliderLabel.textContent = `Background noise alone: ${Math.round(noiseAloneVal * 100)}%`;

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'dock-range';
        slider.min = '0';
        slider.max = '0.5';
        slider.step = '0.05';
        slider.value = String(noiseAloneVal);
        slider.addEventListener('input', (e) => {
          noiseAloneVal = parseFloat(e.target.value);
          sliderLabel.textContent = `Background noise alone: ${Math.round(noiseAloneVal * 100)}%`;
          recompute();
          drawnTrials = 30;
          renderPlot();
        });

        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'dock-btn';
        toggleBtn.setAttribute('aria-pressed', 'false');
        toggleBtn.textContent = 'Always with buzz';
        toggleBtn.addEventListener('click', () => {
          noiseAlways = !noiseAlways;
          toggleBtn.setAttribute('aria-pressed', noiseAlways ? 'true' : 'false');
          slider.disabled = noiseAlways;
          slider.style.opacity = noiseAlways ? '0.4' : '1';
          recompute();
          drawnTrials = 30;
          renderPlot();
        });

        const runBtn = document.createElement('button');
        runBtn.type = 'button';
        runBtn.className = 'dock-btn';
        runBtn.textContent = 'Simulate 30 alerts';
        runBtn.addEventListener('click', () => {
          if (animInterval) clearInterval(animInterval);
          drawnTrials = 1;
          renderPlot();
          animInterval = setInterval(() => {
            if (drawnTrials < 30) {
              drawnTrials++;
              renderPlot();
            } else {
              clearInterval(animInterval);
              animInterval = null;
            }
          }, 100);
        });

        ctrls.appendChild(sliderLabel);
        ctrls.appendChild(slider);
        ctrls.appendChild(toggleBtn);
        ctrls.appendChild(runBtn);
        setControls(ctrls);
      }

      // Drawing weights lines
      const plotGroup = el('g', { class: 'plot' }, svg);
      const axesGroup = el('g', { class: 'axes' }, svg);

      function renderPlot() {
        while (plotGroup.firstChild) plotGroup.removeChild(plotGroup.firstChild);
        while (axesGroup.firstChild) axesGroup.removeChild(axesGroup.firstChild);

        const xToPx = lin(1, 30, padLeft, width - padRight);
        const yToPx = lin(0, 1.05, height - padBottom, padTop);

        // Y-axis grid and labels
        for (const yv of [0, 0.5, 1.0]) {
          const y = yToPx(yv);
          el('line', {
            x1: padLeft,
            y1: y,
            x2: width - padRight,
            y2: y,
            stroke: C.faint,
            'stroke-width': '1',
          }, axesGroup);

          const lbl = el('text', {
            x: padLeft - 8,
            y: y + 3,
            'text-anchor': 'end',
            fill: C.muted,
            'font-family': 'var(--display)',
            'font-size': '10',
            'font-variant-numeric': 'tabular-nums',
          }, axesGroup);
          lbl.textContent = yv.toFixed(1);
        }

        // X-axis ticks
        for (const tr of [1, 5, 10, 15, 20, 25, 30]) {
          const x = xToPx(tr);
          el('line', {
            x1: x,
            y1: height - padBottom,
            x2: x,
            y2: height - padBottom + 4,
            stroke: C.faint,
            'stroke-width': '1',
          }, axesGroup);

          const tLbl = el('text', {
            x: x,
            y: height - padBottom + 14,
            'text-anchor': 'middle',
            fill: C.muted,
            'font-family': 'var(--display)',
            'font-size': '10',
            'font-variant-numeric': 'tabular-nums',
          }, axesGroup);
          tLbl.textContent = String(tr);
        }

        const xTitle = el('text', {
          x: width - padRight + 10,
          y: height - padBottom + 14,
          'text-anchor': 'start',
          fill: C.muted,
          'font-family': 'var(--display)',
          'font-size': '10',
          'letter-spacing': '0.08em',
          'text-transform': 'uppercase',
        }, axesGroup);
        xTitle.textContent = 'alert';

        const count = Math.min(drawnTrials, historyList.length);
        if (count < 1) return;

        let dBuzz = `M ${xToPx(1).toFixed(1)} ${yToPx(historyList[0].wBuzz).toFixed(1)}`;
        let dNoise = `M ${xToPx(1).toFixed(1)} ${yToPx(historyList[0].wNoise).toFixed(1)}`;

        for (let i = 1; i < count; i++) {
          const x = xToPx(i + 1).toFixed(1);
          dBuzz += ` L ${x} ${yToPx(historyList[i].wBuzz).toFixed(1)}`;
          dNoise += ` L ${x} ${yToPx(historyList[i].wNoise).toFixed(1)}`;
        }

        el('path', {
          d: dBuzz,
          fill: 'none',
          stroke: C.excite,
          'stroke-width': '2',
          'stroke-linecap': 'round',
        }, plotGroup);

        el('path', {
          d: dNoise,
          fill: 'none',
          stroke: C.cell,
          'stroke-width': '1.75',
          'stroke-linecap': 'round',
        }, plotGroup);

        // End labels
        const lastIdx = count - 1;
        const lastX = xToPx(count) + 8;
        const buzzY = yToPx(historyList[lastIdx].wBuzz);
        const noiseY = yToPx(historyList[lastIdx].wNoise);

        const bLbl = el('text', {
          x: lastX,
          y: buzzY + 4,
          fill: C.excite,
          'font-family': 'var(--display)',
          'font-size': '11',
          'font-weight': '600',
        }, plotGroup);
        bLbl.textContent = 'phone buzz';

        const nLbl = el('text', {
          x: lastX,
          y: Math.abs(noiseY - buzzY) < 14 ? noiseY + 16 : noiseY + 4,
          fill: C.cell,
          'font-family': 'var(--display)',
          'font-size': '11',
          'font-weight': '600',
        }, plotGroup);
        nLbl.textContent = 'background noise';
      }

      renderPlot();
      cleanup = () => { if (animInterval) clearInterval(animInterval); };

    } else if (kind === 'window') {
      // ------------------------------------------------ WINDOW PLOT (step 7)
      let tDA = props.tDA ?? 1.0;

      const xToPx = lin(0, 3.0, padLeft, width - padRight);
      const yToPx = lin(0, 1.05, height - padBottom, padTop);

      // Axes and grid
      const axesGroup = el('g', { class: 'axes' }, svg);
      for (const yv of [0, 0.5, 1.0]) {
        const y = yToPx(yv);
        el('line', {
          x1: padLeft,
          y1: y,
          x2: width - padRight,
          y2: y,
          stroke: C.faint,
          'stroke-width': '1',
        }, axesGroup);

        const lbl = el('text', {
          x: padLeft - 8,
          y: y + 3,
          'text-anchor': 'end',
          fill: C.muted,
          'font-family': 'var(--display)',
          'font-size': '10',
          'font-variant-numeric': 'tabular-nums',
        }, axesGroup);
        lbl.textContent = yv.toFixed(1);
      }

      for (const tv of [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0]) {
        const x = xToPx(tv);
        el('line', {
          x1: x,
          y1: height - padBottom,
          x2: x,
          y2: height - padBottom + 4,
          stroke: C.faint,
          'stroke-width': '1',
        }, axesGroup);

        const tLbl = el('text', {
          x: x,
          y: height - padBottom + 14,
          'text-anchor': 'middle',
          fill: C.muted,
          'font-family': 'var(--display)',
          'font-size': '10',
          'font-variant-numeric': 'tabular-nums',
        }, axesGroup);
        tLbl.textContent = `${tv < 0.01 ? '0' : tv.toFixed(1)}`;
      }

      const xTitle = el('text', {
        x: (padLeft + width - padRight) / 2,
        y: height - padBottom + 22,
        'text-anchor': 'middle',
        fill: C.muted,
        'font-family': 'var(--display)',
        'font-size': '10',
        'letter-spacing': '0.08em',
        'text-transform': 'uppercase',
      }, axesGroup);
      xTitle.textContent = 'seconds after buzz';

      // Untagged synapse baseline (0)
      el('line', {
        x1: padLeft,
        y1: yToPx(0),
        x2: width - padRight,
        y2: yToPx(0),
        stroke: C.muted,
        'stroke-width': '1.25',
        'stroke-dasharray': '3 3',
      }, axesGroup);

      const untaggedLbl = el('text', {
        x: xToPx(2.3),
        y: yToPx(0) - 6,
        fill: C.muted,
        'font-family': 'var(--display)',
        'font-size': '10',
      }, axesGroup);
      untaggedLbl.textContent = 'untagged synapse';

      // Tag decay curve
      const tagSteps = 60;
      let dTag = `M ${xToPx(0).toFixed(1)} ${yToPx(world.tag(0)).toFixed(1)}`;
      for (let s = 1; s <= tagSteps; s++) {
        const ct = (s / tagSteps) * 3.0;
        dTag += ` L ${xToPx(ct).toFixed(1)} ${yToPx(world.tag(ct)).toFixed(1)}`;
      }
      const dTagArea = `${dTag} L ${xToPx(3.0).toFixed(1)} ${yToPx(0).toFixed(1)} L ${xToPx(0).toFixed(1)} ${yToPx(0).toFixed(1)} Z`;

      el('path', {
        d: dTagArea,
        fill: C.calcium,
        opacity: '0.12',
      }, svg);

      el('path', {
        d: dTag,
        fill: 'none',
        stroke: C.calcium,
        'stroke-width': '2',
        'stroke-linecap': 'round',
      }, svg);

      // Draggable marker group
      const markerGroup = el('g', { class: 'marker' }, svg);
      const markerLine = el('line', {
        stroke: C.dopamine,
        'stroke-width': '1.75',
      }, markerGroup);

      const markerHandle = el('circle', {
        r: '7',
        fill: C.dopamine,
        stroke: C.ink,
        'stroke-width': '1.5',
        tabindex: '0',
        role: 'slider',
        'aria-label': 'Dopamine arrives',
        'aria-valuemin': '0',
        'aria-valuemax': '3',
        style: 'cursor: ew-resize; outline: none;',
      }, markerGroup);

      const markerLbl = el('text', {
        'text-anchor': 'middle',
        fill: C.dopamine,
        'font-family': 'var(--display)',
        'font-size': '10',
        'font-weight': '600',
      }, markerGroup);
      markerLbl.textContent = 'dopamine arrives';

      // Readouts panel on the right
      const readoutGroup = el('g', { class: 'readouts' }, svg);
      const roX = width - padRight + 18;

      const strengthTitle = el('text', {
        x: roX,
        y: padTop + 14,
        fill: C.muted,
        'font-family': 'var(--display)',
        'font-size': '10',
        'letter-spacing': '0.08em',
        'text-transform': 'uppercase',
      }, readoutGroup);
      strengthTitle.textContent = 'change in strength';

      const barBg = el('rect', {
        x: roX,
        y: padTop + 22,
        width: 100,
        height: 8,
        rx: '4',
        fill: C.faint,
      }, readoutGroup);

      const barFill = el('rect', {
        x: roX,
        y: padTop + 22,
        width: 0,
        height: 8,
        rx: '4',
        fill: C.dopamine,
      }, readoutGroup);

      const barValLbl = el('text', {
        x: roX + 112,
        y: padTop + 30,
        fill: C.ink,
        'font-family': 'var(--display)',
        'font-size': '11',
        'font-variant-numeric': 'tabular-nums',
        'font-weight': '600',
      }, readoutGroup);

      const ampaTitle = el('text', {
        x: roX,
        y: padTop + 58,
        fill: C.muted,
        'font-family': 'var(--display)',
        'font-size': '10',
        'letter-spacing': '0.08em',
        'text-transform': 'uppercase',
      }, readoutGroup);
      ampaTitle.textContent = 'ampa at this synapse';

      const ampaDots = [];
      for (let i = 0; i < 5; i++) {
        const dot = el('circle', {
          cx: roX + 10 + i * 20,
          cy: padTop + 76,
          r: '5',
          fill: C.cell,
          stroke: C.cell,
          'stroke-width': '1.5',
        }, readoutGroup);
        ampaDots.push(dot);
      }

      function updateMarker(newT) {
        tDA = Math.max(0, Math.min(3.0, newT));
        const mx = xToPx(tDA);
        markerLine.setAttribute('x1', mx);
        markerLine.setAttribute('x2', mx);
        markerLine.setAttribute('y1', padTop);
        markerLine.setAttribute('y2', height - padBottom);

        markerHandle.setAttribute('cx', mx);
        markerHandle.setAttribute('cy', yToPx(world.tag(tDA)));
        markerHandle.setAttribute('aria-valuenow', tDA.toFixed(2));

        markerLbl.setAttribute('x', mx);
        markerLbl.setAttribute('y', padTop - 6);

        const change = world.strengthen(tDA);
        barFill.setAttribute('width', (Math.max(0, Math.min(1, change)) * 100).toFixed(1));
        barValLbl.textContent = change.toFixed(2);

        const filledCount = Math.min(5, Math.max(2, 2 + Math.round(3 * change)));
        for (let i = 0; i < 5; i++) {
          if (i < filledCount) {
            ampaDots[i].setAttribute('fill', C.excite);
            ampaDots[i].setAttribute('stroke', C.excite);
            ampaDots[i].setAttribute('opacity', '1');
          } else {
            ampaDots[i].setAttribute('fill', 'transparent');
            ampaDots[i].setAttribute('stroke', C.muted);
            ampaDots[i].setAttribute('opacity', '0.4');
          }
        }
      }

      updateMarker(tDA);

      // Drag interaction mapped to logical coordinate system
      let dragging = false;
      const getTargetT = (clientX) => {
        const rect = svg.getBoundingClientRect();
        const scaleX = width / rect.width;
        const px = (clientX - rect.left) * scaleX;
        return ((px - padLeft) / (width - padRight - padLeft)) * 3.0;
      };

      const onPointerMove = (e) => {
        if (!dragging) return;
        updateMarker(getTargetT(e.clientX));
      };
      const onPointerUp = () => { dragging = false; };

      svg.addEventListener('pointerdown', (e) => {
        const rect = svg.getBoundingClientRect();
        const scaleX = width / rect.width;
        const px = (e.clientX - rect.left) * scaleX;
        if (px >= padLeft - 10 && px <= width - padRight + 10) {
          dragging = true;
          updateMarker(getTargetT(e.clientX));
        }
      });
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);

      markerHandle.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          e.preventDefault();
          updateMarker(tDA - 0.1);
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          e.preventDefault();
          updateMarker(tDA + 0.1);
        }
      });

      cleanup = () => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      };
    }

    return {
      render(_t) {},
      destroy() {
        cleanup();
        if (svg.parentElement) svg.parentElement.removeChild(svg);
      },
    };
  },
};
