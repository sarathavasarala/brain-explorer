import { NS, C, el, lin } from './svg.js';

export default {
  type: 'quantity',

  mount(container, props = {}, ctx = {}) {
    const { world, setControls } = ctx;
    const kind = props.kind || 'weights';

    let width = container.clientWidth || 800;
    let height = container.clientHeight || 240;

    const svg = el('svg', {
      viewBox: `0 0 ${width} ${height}`,
      preserveAspectRatio: 'xMidYMid meet',
    }, container);

    const padLeft = 44;
    const padRight = kind === 'window' ? 190 : 80;
    const padTop = 24;
    const padBottom = 28;

    let cleanup = () => {};

    if (kind === 'weights') {
      // ------------------------------------------------ WEIGHTS PLOT
      let insectAloneVal = 0.25;
      let insectAlways = false;
      let drawnTrials = 30;
      let animInterval = null;

      let scheduleList = [];
      let historyList = [];

      function recompute() {
        const insectRate = insectAlways ? 1 : 0.3;
        const insectAloneEvery = insectAlways
          ? 0
          : (insectAloneVal <= 0 ? 0 : Math.max(1, Math.round(1 / insectAloneVal)));
        scheduleList = world.schedule({ n: 30, insectRate, insectAloneEvery, seed: 11 });
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
        sliderLabel.textContent = `Insect without juice ${Math.round(insectAloneVal * 100)}%`;

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'dock-range';
        slider.min = '0';
        slider.max = '0.5';
        slider.step = '0.05';
        slider.value = String(insectAloneVal);
        slider.addEventListener('input', (e) => {
          insectAloneVal = parseFloat(e.target.value);
          sliderLabel.textContent = `Insect without juice ${Math.round(insectAloneVal * 100)}%`;
          recompute();
          drawnTrials = 30;
          renderPlot();
        });

        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'dock-btn';
        toggleBtn.setAttribute('aria-pressed', 'false');
        toggleBtn.textContent = 'Always with chime';
        toggleBtn.addEventListener('click', () => {
          insectAlways = !insectAlways;
          toggleBtn.setAttribute('aria-pressed', insectAlways ? 'true' : 'false');
          slider.disabled = insectAlways;
          slider.style.opacity = insectAlways ? '0.4' : '1';
          recompute();
          drawnTrials = 30;
          renderPlot();
        });

        const runBtn = document.createElement('button');
        runBtn.type = 'button';
        runBtn.className = 'dock-btn';
        runBtn.textContent = 'Run trials';
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
          }, 120);
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

        // Y-axis grid & labels
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
          x: width - padRight + 12,
          y: height - padBottom + 14,
          'text-anchor': 'start',
          fill: C.muted,
          'font-family': 'var(--display)',
          'font-size': '10',
          'letter-spacing': '0.08em',
          'text-transform': 'uppercase',
        }, axesGroup);
        xTitle.textContent = 'trial';

        // Lines for chime and insect
        const count = Math.min(drawnTrials, historyList.length);
        if (count < 1) return;

        let dChime = `M ${xToPx(1).toFixed(1)} ${yToPx(historyList[0].wChime).toFixed(1)}`;
        let dInsect = `M ${xToPx(1).toFixed(1)} ${yToPx(historyList[0].wInsect).toFixed(1)}`;

        for (let i = 1; i < count; i++) {
          const x = xToPx(i + 1).toFixed(1);
          dChime += ` L ${x} ${yToPx(historyList[i].wChime).toFixed(1)}`;
          dInsect += ` L ${x} ${yToPx(historyList[i].wInsect).toFixed(1)}`;
        }

        el('path', {
          d: dChime,
          fill: 'none',
          stroke: C.excite,
          'stroke-width': '1.75',
          'stroke-linecap': 'round',
        }, plotGroup);

        el('path', {
          d: dInsect,
          fill: 'none',
          stroke: C.cell,
          'stroke-width': '1.75',
          'stroke-linecap': 'round',
        }, plotGroup);

        // End labels
        const lastIdx = count - 1;
        const lastX = xToPx(count) + 8;
        const chimeY = yToPx(historyList[lastIdx].wChime);
        const insectY = yToPx(historyList[lastIdx].wInsect);

        const cLbl = el('text', {
          x: lastX,
          y: chimeY + 4,
          fill: C.excite,
          'font-family': 'var(--display)',
          'font-size': '11',
          'font-weight': '600',
        }, plotGroup);
        cLbl.textContent = 'chime';

        const iLbl = el('text', {
          x: lastX,
          y: Math.abs(insectY - chimeY) < 14 ? insectY + 16 : insectY + 4,
          fill: C.cell,
          'font-family': 'var(--display)',
          'font-size': '11',
          'font-weight': '600',
        }, plotGroup);
        iLbl.textContent = 'insect';
      }

      renderPlot();
      cleanup = () => { if (animInterval) clearInterval(animInterval); };

    } else if (kind === 'window') {
      // ------------------------------------------------ WINDOW PLOT (step 8)
      let tDA = props.tDA ?? 1.0;

      const xToPx = lin(0, 3.0, padLeft, width - padRight);
      const yToPx = lin(0, 1.05, height - padBottom, padTop);

      // Axes & grid
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
      xTitle.textContent = 's after chime';

      // Untagged curve (flat 0)
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
        x: xToPx(2.4),
        y: yToPx(0) - 6,
        fill: C.muted,
        'font-family': 'var(--display)',
        'font-size': '10',
      }, axesGroup);
      untaggedLbl.textContent = 'untagged synapse';

      // Tag curve
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
        'stroke-width': '1.75',
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
      const roX = width - padRight + 16;

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

      // Drag interaction
      let dragging = false;
      const onPointerMove = (e) => {
        if (!dragging) return;
        const rect = svg.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const targetT = ((px - padLeft) / (width - padRight - padLeft)) * 3.0;
        updateMarker(targetT);
      };
      const onPointerUp = () => { dragging = false; };

      svg.addEventListener('pointerdown', (e) => {
        const rect = svg.getBoundingClientRect();
        const px = e.clientX - rect.left;
        if (px >= padLeft - 10 && px <= width - padRight + 10) {
          dragging = true;
          const targetT = ((px - padLeft) / (width - padRight - padLeft)) * 3.0;
          updateMarker(targetT);
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

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        width = Math.max(300, entry.contentRect.width);
        height = Math.max(160, entry.contentRect.height);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      }
    });
    ro.observe(container);

    return {
      render(_t) {},
      destroy() {
        ro.disconnect();
        cleanup();
        if (svg.parentElement) svg.parentElement.removeChild(svg);
      },
    };
  },
};
