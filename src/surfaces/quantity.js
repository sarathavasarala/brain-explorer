import { NS, C, el, glowFilter, lin } from './svg.js';

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

    const glowUrl = glowFilter(svg);

    const padLeft = 48;
    const padRight = kind === 'window' ? 200 : 80;
    const padTop = 22;
    const padBottom = 30;

    let cleanup = () => {};
    let tickRender = null;

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
    } else if (kind === 'throttle') {
      // ------------------------------------------------ THROTTLE / OPPORTUNITY COST (Step 5)
      let richnessVal = 0.5;
      let sliderEl = null;
      let sliderLabelEl = null;
      let spikeTrainGroup = null;
      let oscBounds = { x: 51, y: 88, w: 323 };

      const plotGroup = el('g', { class: 'throttle-plot' }, svg);

      function setRichness(val) {
        richnessVal = Math.max(0, Math.min(1, val));
        if (sliderEl) sliderEl.value = String(richnessVal);
        if (sliderLabelEl) {
          const desc = richnessVal < 0.3 ? 'Dead of Winter' : richnessVal > 0.7 ? 'High Summer' : 'Moderate';
          sliderLabelEl.textContent = `Environment: ${Math.round(richnessVal * 100)}% (${desc})`;
        }
        renderThrottle();
      }

      function renderThrottle() {
        while (plotGroup.firstChild) plotGroup.removeChild(plotGroup.firstChild);

        const tonicHz = 1.5 + richnessVal * 6.0; // 1.5 Hz (winter) to 7.5 Hz (summer)
        const daConcentration = 3.0 + richnessVal * 24.0; // 3 nM to 27 nM
        const kd = 10.0; // D2 dissociation constant: 10 nM
        const brakeRelease = (daConcentration / (daConcentration + kd)) * 100; // Michaelis-Menten %

        // Card 1: Left - Live Tonic Pacemaker Spikes & Striatal Brake Caliper
        const c1X = 32;
        const c1W = 356;
        const cardTop = 12;
        const cardH = height - 24;

        el('rect', {
          x: c1X,
          y: cardTop,
          width: c1W,
          height: cardH,
          rx: '10',
          fill: 'rgba(185, 140, 255, 0.04)',
          stroke: 'rgba(185, 140, 255, 0.2)',
          'stroke-width': '1',
        }, plotGroup);

        el('text', {
          x: c1X + 16,
          y: cardTop + 20,
          fill: C.muted,
          'font-family': 'var(--display)',
          'font-size': '10',
          'letter-spacing': '0.08em',
          'text-transform': 'uppercase',
        }, plotGroup).textContent = '1. Tonic VTA Pacemaker Hum';

        // Frequency big readout
        el('text', {
          x: c1X + 16,
          y: cardTop + 48,
          fill: '#b98cff',
          'font-family': 'var(--display)',
          'font-size': '23',
          'font-weight': '700',
        }, plotGroup).textContent = `${tonicHz.toFixed(1)} Hz`;

        el('text', {
          x: c1X + 106,
          y: cardTop + 46,
          fill: C.ink,
          'font-family': 'var(--display)',
          'font-size': '11',
          'font-weight': '500',
        }, plotGroup).textContent = `(~${Math.round(daConcentration)} nM ambient dopamine)`;

        // Oscilloscope spike train raster
        const oscY = cardTop + 76;
        const oscW = c1W - 32;
        oscBounds = { x: c1X + 16, y: oscY, w: oscW };

        el('rect', {
          x: c1X + 16,
          y: oscY - 18,
          width: oscW,
          height: 36,
          rx: '5',
          fill: 'rgba(0, 0, 0, 0.45)',
          stroke: 'rgba(185, 140, 255, 0.16)',
          'stroke-width': '1',
        }, plotGroup);

        // Horizontal baseline
        el('line', {
          x1: c1X + 22,
          y1: oscY + 6,
          x2: c1X + 16 + oscW - 6,
          y2: oscY + 6,
          stroke: 'rgba(185, 140, 255, 0.25)',
          'stroke-dasharray': '2 2',
        }, plotGroup);

        spikeTrainGroup = el('g', { class: 'osc-spikes' }, plotGroup);
        drawOscSpikes(ctx.clock ? ctx.clock.t : 0);

        // Striatal Brake Caliper Visual
        const brakeY = cardTop + 126;
        el('text', {
          x: c1X + 16,
          y: brakeY,
          fill: C.muted,
          'font-family': 'var(--display)',
          'font-size': '10',
          'letter-spacing': '0.06em',
          'text-transform': 'uppercase',
        }, plotGroup).textContent = '2. Striatal Effort Brake Status';

        const wheelCx = c1X + 54;
        const wheelCy = brakeY + 30;
        el('circle', {
          cx: wheelCx,
          cy: wheelCy,
          r: '14',
          fill: 'none',
          stroke: 'rgba(190, 200, 255, 0.35)',
          'stroke-width': '2.5',
          'stroke-dasharray': '4 2',
        }, plotGroup);

        const padGap = 2 + (brakeRelease / 100) * 16;
        const padColor = brakeRelease >= 50 ? '#6be4ff' : '#ff6b7d';

        el('rect', {
          x: wheelCx - padGap - 20,
          y: wheelCy - 9,
          width: 6,
          height: 18,
          rx: '2',
          fill: padColor,
        }, plotGroup);

        el('rect', {
          x: wheelCx + padGap + 14,
          y: wheelCy - 9,
          width: 6,
          height: 18,
          rx: '2',
          fill: padColor,
        }, plotGroup);

        el('text', {
          x: c1X + 108,
          y: wheelCy - 3,
          fill: padColor,
          'font-family': 'var(--display)',
          'font-size': '12',
          'font-weight': '700',
        }, plotGroup).textContent = brakeRelease >= 50
          ? `Brakes ${Math.round(brakeRelease)}% Released`
          : `Brakes Clamped (${Math.round(100 - brakeRelease)}% Lock)`;

        el('text', {
          x: c1X + 108,
          y: wheelCy + 14,
          fill: C.muted,
          'font-family': 'var(--display)',
          'font-size': '9.5',
        }, plotGroup).textContent = brakeRelease >= 50
          ? 'High vigor: Hill climb feels energizing'
          : 'Conserving calories: Movement feels heavy';

        // Card 2: Right - Interactive Sigmoidal D2 Brake-Release Curve
        const c2X = 408;
        const c2W = 360;

        el('rect', {
          x: c2X,
          y: cardTop,
          width: c2W,
          height: cardH,
          rx: '10',
          fill: 'rgba(107, 228, 255, 0.04)',
          stroke: 'rgba(107, 228, 255, 0.2)',
          'stroke-width': '1',
        }, plotGroup);

        el('text', {
          x: c2X + 16,
          y: cardTop + 20,
          fill: C.muted,
          'font-family': 'var(--display)',
          'font-size': '10',
          'letter-spacing': '0.08em',
          'text-transform': 'uppercase',
        }, plotGroup).textContent = '3. D2 Brake-Release Curve (Drag dot)';

        const gLeft = c2X + 44;
        const gRight = c2X + c2W - 22;
        const gTop = cardTop + 38;
        const gBottom = cardTop + cardH - 36;
        const gW = gRight - gLeft;
        const gH = gBottom - gTop;

        el('line', { x1: gLeft, y1: gBottom, x2: gRight, y2: gBottom, stroke: 'rgba(190, 200, 255, 0.2)' }, plotGroup);
        el('line', { x1: gLeft, y1: gTop, x2: gLeft, y2: gBottom, stroke: 'rgba(190, 200, 255, 0.2)' }, plotGroup);

        const threshY = gBottom - gH * 0.5;
        el('line', {
          x1: gLeft,
          y1: threshY,
          x2: gRight,
          y2: threshY,
          stroke: 'rgba(255, 211, 107, 0.45)',
          'stroke-width': '1',
          'stroke-dasharray': '3 3',
        }, plotGroup);

        el('text', {
          x: gRight - 2,
          y: threshY - 5,
          'text-anchor': 'end',
          fill: '#ffd36b',
          'font-family': 'var(--display)',
          'font-size': '8.5',
          'font-weight': '600',
        }, plotGroup).textContent = '50% Brake-Release Threshold';

        el('text', {
          x: gLeft - 6,
          y: gTop + 8,
          'text-anchor': 'end',
          fill: C.muted,
          'font-family': 'var(--display)',
          'font-size': '8.5',
        }, plotGroup).textContent = '100%';

        el('text', {
          x: gLeft - 6,
          y: gBottom,
          'text-anchor': 'end',
          fill: C.muted,
          'font-family': 'var(--display)',
          'font-size': '8.5',
        }, plotGroup).textContent = '0%';

        el('text', {
          x: gLeft,
          y: gBottom + 13,
          'text-anchor': 'start',
          fill: C.muted,
          'font-family': 'var(--display)',
          'font-size': '8.5',
        }, plotGroup).textContent = 'Winter (3 nM)';

        el('text', {
          x: gRight,
          y: gBottom + 13,
          'text-anchor': 'end',
          fill: C.muted,
          'font-family': 'var(--display)',
          'font-size': '8.5',
        }, plotGroup).textContent = 'Summer (27 nM)';

        let curveD = '';
        const steps = 30;
        for (let s = 0; s <= steps; s++) {
          const conc = 3.0 + (s / steps) * 24.0;
          const yPct = conc / (conc + kd);
          const px = gLeft + (s / steps) * gW;
          const py = gBottom - yPct * gH;
          curveD += (s === 0 ? `M ${px.toFixed(1)} ${py.toFixed(1)}` : ` L ${px.toFixed(1)} ${py.toFixed(1)}`);
        }
        el('path', {
          d: curveD,
          fill: 'none',
          stroke: '#6be4ff',
          'stroke-width': '2.2',
        }, plotGroup);

        const opX = gLeft + richnessVal * gW;
        const opY = gBottom - (brakeRelease / 100) * gH;

        el('line', {
          x1: opX,
          y1: opY,
          x2: opX,
          y2: gBottom,
          stroke: 'rgba(107, 228, 255, 0.4)',
          'stroke-dasharray': '2 2',
        }, plotGroup);

        el('circle', {
          cx: opX,
          cy: opY,
          r: '7',
          fill: '#6be4ff',
          stroke: '#fff',
          'stroke-width': '2',
          filter: glowUrl !== 'none' ? glowUrl : '',
          style: 'cursor: ew-resize;',
        }, plotGroup);

        el('text', {
          x: Math.min(gRight - 36, Math.max(gLeft + 36, opX)),
          y: Math.max(gTop + 10, opY - 11),
          'text-anchor': 'middle',
          fill: '#fff',
          'font-family': 'var(--display)',
          'font-size': '9.5',
          'font-weight': '700',
        }, plotGroup).textContent = `${Math.round(brakeRelease)}% Vigor`;

        el('text', {
          x: c2X + c2W / 2,
          y: cardTop + cardH - 8,
          'text-anchor': 'middle',
          fill: richnessVal >= 0.45 ? '#6be4ff' : '#ff6b7d',
          'font-family': 'var(--display)',
          'font-size': '9',
          'font-weight': '600',
        }, plotGroup).textContent = richnessVal >= 0.45
          ? 'Summer abundance: High tonic hum holds D2 brakes OFF'
          : 'Winter scarcity: Low tonic hum lets brakes ENGAGE';

        // Interactive drag zone over Card 2
        const dragOverlay = el('rect', {
          x: gLeft - 12,
          y: gTop - 12,
          width: gW + 24,
          height: gH + 24,
          fill: 'transparent',
          style: 'cursor: ew-resize;',
        }, plotGroup);

        dragOverlay.addEventListener('pointerdown', (e) => {
          isDraggingCurve = true;
          updateFromPointer(e.clientX);
        });

        if (ctx.scene) {
          ctx.scene.setDrive('vta', (richnessVal - 0.5) * 1.5);
        }
      }

      function drawOscSpikes(t = 0) {
        if (!spikeTrainGroup) return;
        while (spikeTrainGroup.firstChild) spikeTrainGroup.removeChild(spikeTrainGroup.firstChild);
        const tonicHz = 1.5 + richnessVal * 6.0;
        const numSpikes = Math.max(3, Math.round(tonicHz * 1.8));
        const innerW = oscBounds.w - 24;
        const spacing = innerW / numSpikes;
        const scroll = ((t * tonicHz * 12) % spacing);

        for (let i = 0; i < numSpikes; i++) {
          const sx = oscBounds.x + 12 + ((i * spacing + scroll) % innerW);
          const sy = oscBounds.y + 6;
          const pathD = `M ${(sx - 4).toFixed(1)} ${sy} L ${(sx - 1).toFixed(1)} ${sy} L ${sx.toFixed(1)} ${sy - 20} L ${(sx + 1).toFixed(1)} ${sy} L ${(sx + 4).toFixed(1)} ${sy}`;
          el('path', {
            d: pathD,
            fill: 'none',
            stroke: '#b98cff',
            'stroke-width': '1.6',
            filter: glowUrl !== 'none' ? glowUrl : '',
          }, spikeTrainGroup);
        }
      }

      let isDraggingCurve = false;
      function updateFromPointer(clientX) {
        const rect = svg.getBoundingClientRect();
        const scaleX = width / rect.width;
        const px = (clientX - rect.left) * scaleX;
        const gLeft = 408 + 44;
        const gW = 360 - 66;
        setRichness((px - gLeft) / gW);
      }

      const onMove = (e) => {
        if (!isDraggingCurve) return;
        updateFromPointer(e.clientX);
      };
      const onUp = () => { isDraggingCurve = false; };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);

      if (setControls) {
        const ctrls = document.createElement('div');
        ctrls.className = 'dock-ctrl-group';
        ctrls.style.display = 'flex';
        ctrls.style.alignItems = 'center';
        ctrls.style.gap = '10px';

        const winterBtn = document.createElement('button');
        winterBtn.type = 'button';
        winterBtn.className = 'dock-btn';
        winterBtn.textContent = 'Winter (Scarce)';
        winterBtn.addEventListener('click', () => setRichness(0.12));

        sliderLabelEl = document.createElement('span');
        sliderLabelEl.className = 'dock-label';
        sliderLabelEl.textContent = 'Environment: 50% (Moderate)';

        sliderEl = document.createElement('input');
        sliderEl.type = 'range';
        sliderEl.className = 'dock-range';
        sliderEl.min = '0';
        sliderEl.max = '1';
        sliderEl.step = '0.02';
        sliderEl.value = '0.5';
        sliderEl.setAttribute('aria-label', 'Environment Richness');
        sliderEl.addEventListener('input', (e) => setRichness(parseFloat(e.target.value)));

        const summerBtn = document.createElement('button');
        summerBtn.type = 'button';
        summerBtn.className = 'dock-btn';
        summerBtn.textContent = 'Summer (Rich)';
        summerBtn.addEventListener('click', () => setRichness(0.9));

        ctrls.appendChild(winterBtn);
        ctrls.appendChild(sliderLabelEl);
        ctrls.appendChild(sliderEl);
        ctrls.appendChild(summerBtn);
        setControls(ctrls);
      }

      renderThrottle();
      tickRender = (t) => drawOscSpikes(t);

      cleanup = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        if (ctx.scene) ctx.scene.setDrive('vta', 0);
      };
    } else if (kind === 'crash') {
      // ------------------------------------------------ CRASH / RECOVERY TIMELINE (Step 8)
      let activeStage = 2; // Default to Stage 3: Screen Dark (The Crash) so the user immediately sees the crash!

      const stagesData = [
        {
          title: 'Stage 1: Week 1 (Novelty)',
          tonicHz: 4.5,
          d2Density: 1.0,
          brakesReleased: true,
          badge: 'BRAKES RELEASED',
          desc: 'Healthy baseline tone (4.5 Hz) and 100% surface D2 receptors. Everyday effort feels light and rewarding.',
          drive: 0.1,
        },
        {
          title: 'Stage 2: Month 3 (Feed Binge)',
          tonicHz: 3.2,
          d2Density: 0.45,
          brakesReleased: true,
          badge: 'OVERLOAD TOLERANCE',
          desc: 'Constant variable-ratio spikes force D2 receptor internalization (earplugs in) and autoreceptor braking.',
          drive: 0.7,
        },
        {
          title: 'Stage 3: Screen Dark (The Crash)',
          tonicHz: 1.8,
          d2Density: 0.40,
          brakesReleased: false,
          badge: 'BRAKES SLAMMED SHUT',
          desc: 'Phone locked. With zero-friction bursts gone and D2 hidden inside the cell, tone drops into the anhedonia ditch.',
          drive: -0.7,
        },
        {
          title: 'Stage 4: Days 1 to 14 (Reset)',
          tonicHz: 4.3,
          d2Density: 0.95,
          brakesReleased: true,
          badge: 'CONTRAST RESTORED',
          desc: 'Stepping away from rapid-fire cues lets D2 receptors float back to the membrane and lifts the striatal brake.',
          drive: 0.0,
        },
      ];

      const plotGroup = el('g', { class: 'crash-plot' }, svg);

      function renderCrash() {
        while (plotGroup.firstChild) plotGroup.removeChild(plotGroup.firstChild);

        const cur = stagesData[activeStage];

        const gLeft = 48;
        const gRight = width - 40;
        const gW = gRight - gLeft;
        const gTop = 18;
        const gBottom = 130;
        const gH = gBottom - gTop;

        const bandW = gW / 4;
        for (let i = 0; i < 4; i++) {
          const bx = gLeft + i * bandW;
          const isCurrent = i === activeStage;
          el('rect', {
            x: bx + 3,
            y: gTop - 6,
            width: bandW - 6,
            height: gH + 14,
            rx: '6',
            fill: isCurrent ? 'rgba(185, 140, 255, 0.12)' : 'rgba(190, 200, 255, 0.02)',
            stroke: isCurrent ? 'rgba(185, 140, 255, 0.45)' : 'rgba(190, 200, 255, 0.08)',
            'stroke-width': isCurrent ? '1.5' : '1',
            style: 'cursor: pointer;',
          }, plotGroup).addEventListener('click', () => setStage(i));

          const stageNames = ['1. Week 1 (Fresh)', '2. Month 3 (Feed)', '3. Screen Dark (Crash)', '4. 14-Day Reset'];
          el('text', {
            x: bx + bandW / 2,
            y: gTop + 8,
            'text-anchor': 'middle',
            fill: isCurrent ? '#fff' : C.muted,
            'font-family': 'var(--display)',
            'font-size': '10',
            'font-weight': isCurrent ? '700' : '500',
            style: 'cursor: pointer;',
          }, plotGroup).textContent = stageNames[i];
        }

        const threshY = gBottom - gH * 0.46;
        el('line', {
          x1: gLeft,
          y1: threshY,
          x2: gRight,
          y2: threshY,
          stroke: '#ffd36b',
          'stroke-width': '1.5',
          'stroke-dasharray': '4 3',
        }, plotGroup);

        el('text', {
          x: gLeft + 10,
          y: threshY + 13,
          'text-anchor': 'start',
          fill: '#ffd36b',
          'font-family': 'var(--display)',
          'font-size': '8.5',
          'font-weight': '600',
        }, plotGroup).textContent = 'Brake-Release Threshold (Natural Drive)';

        const pts = [
          { x: gLeft + bandW * 0.1, y: gBottom - gH * 0.54 },
          { x: gLeft + bandW * 0.4, y: gBottom - gH * 0.68 },
          { x: gLeft + bandW * 0.6, y: gBottom - gH * 0.54 },
          { x: gLeft + bandW * 0.9, y: gBottom - gH * 0.52 },
          { x: gLeft + bandW * 1.15, y: gBottom - gH * 0.88 },
          { x: gLeft + bandW * 1.30, y: gBottom - gH * 0.42 },
          { x: gLeft + bandW * 1.45, y: gBottom - gH * 0.90 },
          { x: gLeft + bandW * 1.60, y: gBottom - gH * 0.38 },
          { x: gLeft + bandW * 1.75, y: gBottom - gH * 0.86 },
          { x: gLeft + bandW * 1.95, y: gBottom - gH * 0.35 },
          { x: gLeft + bandW * 2.1, y: gBottom - gH * 0.16 },
          { x: gLeft + bandW * 2.5, y: gBottom - gH * 0.12 },
          { x: gLeft + bandW * 2.9, y: gBottom - gH * 0.15 },
          { x: gLeft + bandW * 3.1, y: gBottom - gH * 0.22 },
          { x: gLeft + bandW * 3.4, y: gBottom - gH * 0.36 },
          { x: gLeft + bandW * 3.7, y: gBottom - gH * 0.49 },
          { x: gLeft + bandW * 3.95, y: gBottom - gH * 0.54 },
        ];

        let pathD = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
        for (let i = 1; i < pts.length; i++) {
          pathD += ` L ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
        }

        el('path', {
          d: pathD,
          fill: 'none',
          stroke: '#b98cff',
          'stroke-width': '2.2',
        }, plotGroup);

        const markerX = gLeft + activeStage * bandW + bandW / 2;
        el('line', {
          x1: markerX,
          y1: gTop + 16,
          x2: markerX,
          y2: gBottom,
          stroke: '#fff',
          'stroke-width': '1.5',
          'stroke-dasharray': '2 2',
        }, plotGroup);

        const cardY = gBottom + 16;
        const cardW = width - 88;
        el('rect', {
          x: 48,
          y: cardY,
          width: cardW,
          height: 58,
          rx: '8',
          fill: cur.brakesReleased ? 'rgba(107, 228, 255, 0.05)' : 'rgba(255, 107, 125, 0.08)',
          stroke: cur.brakesReleased ? 'rgba(107, 228, 255, 0.25)' : 'rgba(255, 107, 125, 0.4)',
          'stroke-width': '1',
        }, plotGroup);

        el('text', {
          x: 64,
          y: cardY + 21,
          fill: '#fff',
          'font-family': 'var(--display)',
          'font-size': '12',
          'font-weight': '700',
        }, plotGroup).textContent = cur.title;

        el('rect', {
          x: 286,
          y: cardY + 9,
          width: 148,
          height: 17,
          rx: '4',
          fill: cur.brakesReleased ? 'rgba(107, 228, 255, 0.15)' : 'rgba(255, 107, 125, 0.22)',
        }, plotGroup);

        el('text', {
          x: 360,
          y: cardY + 21,
          'text-anchor': 'middle',
          fill: cur.brakesReleased ? '#6be4ff' : '#ff6b7d',
          'font-family': 'var(--display)',
          'font-size': '9',
          'font-weight': '700',
          'letter-spacing': '0.04em',
        }, plotGroup).textContent = cur.badge;

        el('text', {
          x: 450,
          y: cardY + 21,
          fill: C.muted,
          'font-family': 'var(--display)',
          'font-size': '10.5',
        }, plotGroup).textContent = `Tonic floor: ${cur.tonicHz} Hz  ·  Surface D2: ${Math.round(cur.d2Density * 100)}%`;

        el('text', {
          x: 64,
          y: cardY + 43,
          fill: '#d8deee',
          'font-family': 'var(--read)',
          'font-size': '11.5',
        }, plotGroup).textContent = cur.desc;

        if (ctx.scene) {
          ctx.scene.setDrive('vta', cur.drive);
        }
      }

      function setStage(idx) {
        activeStage = idx;
        if (buttons[idx]) {
          buttons.forEach((b, i) => b.setAttribute('aria-pressed', i === activeStage ? 'true' : 'false'));
        }
        renderCrash();
      }

      let buttons = [];
      if (setControls) {
        const ctrls = document.createElement('div');
        ctrls.className = 'dock-ctrl-group';
        ctrls.style.display = 'flex';
        ctrls.style.alignItems = 'center';
        ctrls.style.gap = '8px';

        const stageLabels = ['1. Week 1', '2. Month 3', '3. Screen Dark', '4. 14-Day Reset'];
        buttons = stageLabels.map((lbl, i) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'dock-btn';
          btn.setAttribute('aria-pressed', i === activeStage ? 'true' : 'false');
          btn.textContent = lbl;
          btn.addEventListener('click', () => setStage(i));
          ctrls.appendChild(btn);
          return btn;
        });

        setControls(ctrls);
      }

      renderCrash();

      cleanup = () => {
        if (ctx.scene) ctx.scene.setDrive('vta', 0);
      };
    }
    return {
      render(t) {
        if (tickRender) tickRender(t);
      },
      destroy() {
        cleanup();
        if (svg.parentElement) svg.parentElement.removeChild(svg);
      },
    };
  },
};
