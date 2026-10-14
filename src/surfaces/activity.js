import { NS, C, el, glowFilter, lin } from './svg.js';

export default {
  type: 'activity',

  mount(container, props = {}, ctx = {}) {
    const { world, clock, scene, setControls } = ctx;
    const mode = props.mode || 'single';

    const width = 800;
    const height = 230;

    const svg = el('svg', {
      viewBox: `0 0 ${width} ${height}`,
      preserveAspectRatio: 'xMidYMid meet',
    }, container);

    const glowUrl = glowFilter(svg);

    // Header controls
    let wantValue = 1;
    let runTrialsBtn = null;
    let readoutEl = null;

    // Mode state
    let visibleRows = mode === 'learning' ? 1 : (props.rows || 8);
    let isRunningTrials = false;
    let trialInterval = null;

    let highlightedConditionIndex = 0;
    let burstFired = false;
    let lastT = clock.t;

    // Conditions data
    let conditions = [];
    if (mode === 'single') {
      conditions = [{
        label: props.title || 'Dopamine neuron',
        trial: { ...(props.trial || { chime: true, juice: true, V: 0, want: 1 }) },
        rows: props.rows || 8,
      }];
    } else if (mode === 'learning') {
      const schedule = world.schedule({ n: props.rows || 30, insectRate: 0, insectAloneEvery: 0, seed: 11 });
      const history = world.learn(schedule, { want: 1 });
      conditions = [{
        label: 'Thirty trials',
        schedule,
        history,
        rows: props.rows || 30,
      }];
    } else if (mode === 'compare') {
      conditions = (props.conditions || []).map((c) => ({
        label: c.label,
        trial: { ...c.trial, want: wantValue },
        rows: c.rows || 4,
      }));
    }

    function setupControls() {
      if (!setControls) return;
      const ctrls = document.createElement('div');
      ctrls.className = 'dock-ctrl-group';
      ctrls.style.display = 'flex';
      ctrls.style.alignItems = 'center';
      ctrls.style.gap = '10px';

      if (mode === 'learning') {
        const h0 = conditions[0].history[visibleRows - 1];
        const val = h0.wBuzz ?? h0.wChime ?? 0;
        readoutEl = document.createElement('span');
        readoutEl.className = 'dock-label';
        readoutEl.textContent = `buzz predicts ${val.toFixed(2)}`;
        ctrls.appendChild(readoutEl);

        runTrialsBtn = document.createElement('button');
        runTrialsBtn.type = 'button';
        runTrialsBtn.className = 'dock-btn';
        runTrialsBtn.textContent = 'Run alerts';
        runTrialsBtn.addEventListener('click', () => {
          if (isRunningTrials) {
            clearInterval(trialInterval);
            isRunningTrials = false;
            runTrialsBtn.textContent = 'Run alerts';
            return;
          }
          if (visibleRows >= (props.rows || 30)) {
            visibleRows = 1;
            updateLearningVisibility();
            updateRatePaths();
          }
          isRunningTrials = true;
          runTrialsBtn.textContent = 'Pause alerts';
          trialInterval = setInterval(() => {
            if (visibleRows < (props.rows || 30)) {
              visibleRows++;
              updateLearningVisibility();
              updateRatePaths();
            } else {
              clearInterval(trialInterval);
              isRunningTrials = false;
              runTrialsBtn.textContent = 'Run alerts';
            }
          }, 120);
        });
        ctrls.appendChild(runTrialsBtn);
      }

      if (mode === 'compare') {
        const perturb = props.perturb || [{ id: 'want', label: 'How much you want it', min: 0, max: 1, value: 1 }];
        const wantDef = perturb.find((p) => p.id === 'want');
        if (wantDef) {
          const lbl = document.createElement('label');
          lbl.className = 'dock-label';
          lbl.textContent = wantDef.label;

          const range = document.createElement('input');
          range.type = 'range';
          range.className = 'dock-range';
          range.min = String(wantDef.min ?? 0);
          range.max = String(wantDef.max ?? 1);
          range.step = '0.05';
          range.value = String(wantValue);

          range.addEventListener('input', (e) => {
            wantValue = parseFloat(e.target.value);
            for (const cond of conditions) {
              cond.trial.want = wantValue;
            }
            rebuildStaticSpikes();
            updateRatePaths();
          });

          ctrls.appendChild(lbl);
          ctrls.appendChild(range);
        }
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

    setupControls();

    // Visual layout elements
    const leftPad = mode === 'compare' ? 120 : 54;
    const rightPad = 32;
    const topPad = 24;
    const bottomPad = 26;

    let timeToX = lin(world.WINDOW[0], world.WINDOW[1], leftPad, width - rightPad);

    // Static DOM groups
    const gridGroup = el('g', { class: 'grid' }, svg);
    const eventsGroup = el('g', { class: 'events' }, svg);
    const rasterGroup = el('g', { class: 'raster' }, svg);
    const rateGroup = el('g', { class: 'rate' }, svg);
    const playheadGroup = el('g', { class: 'playhead' }, svg);

    // Playhead line
    const playheadLine = el('line', {
      x1: leftPad,
      y1: topPad,
      x2: leftPad,
      y2: height - bottomPad,
      stroke: C.ink,
      'stroke-width': '1',
    }, playheadGroup);

    // Events (buzz at 0, message at 1.0)
    const eventLines = [];
    const eventLabels = [];

    const events = [
      { t: world.BUZZ_T ?? world.CHIME_T ?? 0, label: 'buzz' },
      { t: world.MSG_T ?? world.JUICE_T ?? 1.0, label: 'message' },
    ];

    for (const ev of events) {
      const evX = timeToX(ev.t);
      const l = el('line', {
        x1: evX,
        y1: topPad - 4,
        x2: evX,
        y2: height - bottomPad,
        stroke: C.muted,
        'stroke-width': '1',
        'stroke-dasharray': '3 4',
      }, eventsGroup);
      eventLines.push({ ev, el: l });

      const txt = el('text', {
        x: evX,
        y: topPad - 8,
        'text-anchor': 'middle',
        fill: C.muted,
        'font-family': 'var(--display)',
        'font-size': '10',
        'letter-spacing': '0.08em',
        'text-transform': 'uppercase',
      }, eventsGroup);
      txt.textContent = ev.label;
      eventLabels.push({ ev, el: txt });
    }

    // Time axis ticks
    const timeTicksGroup = el('g', { class: 'time-axis' }, gridGroup);
    const ticks = [-0.5, 0, 0.5, 1.0, 1.5, 2.0];
    for (const tick of ticks) {
      const tx = timeToX(tick);
      el('line', {
        x1: tx,
        y1: height - bottomPad,
        x2: tx,
        y2: height - bottomPad + 4,
        stroke: C.faint,
        'stroke-width': '1',
      }, timeTicksGroup);

      const tLbl = el('text', {
        x: tx,
        y: height - bottomPad + 14,
        'text-anchor': 'middle',
        fill: C.muted,
        'font-family': 'var(--display)',
        'font-size': '10',
        'font-variant-numeric': 'tabular-nums',
      }, timeTicksGroup);
      tLbl.textContent = `${tick < 0 ? tick : tick === 0 ? '0' : tick.toFixed(1)}s`;
    }

    // Raster & Rate Layout
    let rasterY0 = topPad;
    let rasterH = Math.max(80, (height - topPad - bottomPad) * 0.68);
    let rateY0 = rasterY0 + rasterH + 8;
    let rateH = Math.max(40, height - bottomPad - rateY0);

    let spikeItems = []; // { t, el, line, rowIdx }
    let ratePathEl = null;
    let rateAreaEl = null;
    let compareRatePaths = [];
    let compareBands = [];

    function rebuildLayout() {
      timeToX = lin(world.WINDOW[0], world.WINDOW[1], leftPad, width - rightPad);

      // Re-position events
      for (const item of eventLines) {
        const x = timeToX(item.ev.t);
        item.el.setAttribute('x1', x);
        item.el.setAttribute('x2', x);
        item.el.setAttribute('y1', topPad - 4);
        item.el.setAttribute('y2', height - bottomPad);
      }
      for (const item of eventLabels) {
        const x = timeToX(item.ev.t);
        item.el.setAttribute('x', x);
        item.el.setAttribute('y', topPad - 8);
      }

      // Rebuild raster and rate
      rasterH = Math.max(70, (height - topPad - bottomPad) * 0.66);
      rateY0 = rasterY0 + rasterH + 6;
      rateH = Math.max(38, height - bottomPad - rateY0);

      rebuildRasterAndRate();
    }

    function rebuildStaticSpikes() {
      spikeItems = [];
      while (rasterGroup.firstChild) rasterGroup.removeChild(rasterGroup.firstChild);

      if (mode === 'single') {
        const totalRows = props.rows || 8;
        const rowH = rasterH / totalRows;
        for (let i = 0; i < totalRows; i++) {
          const seed = i + 1;
          const yMid = rasterY0 + i * rowH + rowH * 0.5;
          const spikeH = rowH * 0.7;

          // Row separator
          el('line', {
            x1: leftPad,
            y1: rasterY0 + (i + 1) * rowH,
            x2: width - rightPad,
            y2: rasterY0 + (i + 1) * rowH,
            stroke: C.faint,
            'stroke-width': '1',
          }, rasterGroup);

          const spkTimes = world.spikes(conditions[0].trial, seed);
          for (const st of spkTimes) {
            const sx = timeToX(st);
            const line = el('line', {
              x1: sx,
              y1: yMid - spikeH / 2,
              x2: sx,
              y2: yMid + spikeH / 2,
              stroke: C.dopamine,
              'stroke-width': '1.5',
              'stroke-linecap': 'round',
              opacity: '0',
            }, rasterGroup);
            spikeItems.push({ t: st, el: line, row: i });
          }
        }
      } else if (mode === 'learning') {
        const totalRows = props.rows || 30;
        const rowH = rasterH / totalRows;
        for (let i = 0; i < totalRows; i++) {
          const tr = conditions[0].history[i];
          const yMid = rasterY0 + i * rowH + rowH * 0.5;
          const spikeH = Math.max(2, rowH * 0.75);

          const spkTimes = world.spikes(tr, i + 1);
          for (const st of spkTimes) {
            const sx = timeToX(st);
            const line = el('line', {
              x1: sx,
              y1: yMid - spikeH / 2,
              x2: sx,
              y2: yMid + spikeH / 2,
              stroke: C.dopamine,
              'stroke-width': '1.5',
              'stroke-linecap': 'round',
              opacity: '0',
            }, rasterGroup);
            spikeItems.push({ t: st, el: line, row: i });
          }
        }
      } else if (mode === 'compare') {
        compareBands = [];
        const nConds = conditions.length;
        const bandH = rasterH / nConds;

        for (let cIdx = 0; cIdx < nConds; cIdx++) {
          const cond = conditions[cIdx];
          const bY0 = rasterY0 + cIdx * bandH;
          const bandRows = cond.rows;
          const rowH = (bandH - 8) / bandRows;

          const isActive = cIdx === highlightedConditionIndex;

          // Band background / hit rect for hover & click
          const bandRect = el('rect', {
            x: 0,
            y: bY0,
            width: width,
            height: bandH,
            fill: isActive ? 'rgba(185, 140, 255, 0.05)' : 'transparent',
            style: 'cursor: pointer;',
          }, rasterGroup);

          // Active accent indicator bar on the left of the raster area
          const bandBar = el('rect', {
            x: leftPad - 4,
            y: bY0 + 3,
            width: 2.5,
            height: Math.max(4, bandH - 6),
            rx: '1.25',
            fill: C.dopamine,
            opacity: isActive ? '1' : '0',
          }, rasterGroup);

          // Band label
          const bandLbl = el('text', {
            x: leftPad - 12,
            y: bY0 + bandH * 0.55,
            'text-anchor': 'end',
            fill: isActive ? C.ink : C.muted,
            'font-family': 'var(--display)',
            'font-size': '11',
            'font-weight': isActive ? '600' : '500',
          }, rasterGroup);
          bandLbl.textContent = cond.label;

          const selectBand = () => {
            highlightedConditionIndex = cIdx;
            updateHighlightBand();
          };
          bandRect.addEventListener('pointerenter', selectBand);
          bandRect.addEventListener('click', selectBand);

          compareBands.push({ lbl: bandLbl, rect: bandRect, bar: bandBar, index: cIdx });

          // Separator
          el('line', {
            x1: leftPad,
            y1: bY0 + bandH,
            x2: width - rightPad,
            y2: bY0 + bandH,
            stroke: C.faint,
            'stroke-width': '1',
          }, rasterGroup);

          for (let r = 0; r < bandRows; r++) {
            const yMid = bY0 + r * rowH + rowH * 0.5 + 4;
            const spikeH = rowH * 0.7;
            const spkTimes = world.spikes(cond.trial, (cIdx + 1) * 10 + r);
            for (const st of spkTimes) {
              const sx = timeToX(st);
              const line = el('line', {
                x1: sx,
                y1: yMid - spikeH / 2,
                x2: sx,
                y2: yMid + spikeH / 2,
                stroke: C.dopamine,
                'stroke-width': '1.5',
                'stroke-linecap': 'round',
                opacity: '0',
              }, rasterGroup);
              spikeItems.push({ t: st, el: line, condIndex: cIdx, row: r });
            }
          }
        }
      }
    }

    function updateHighlightBand() {
      for (const b of compareBands) {
        const active = b.index === highlightedConditionIndex;
        b.lbl.setAttribute('fill', active ? C.ink : C.muted);
        b.lbl.setAttribute('font-weight', active ? '600' : '500');
        b.rect.setAttribute('fill', active ? 'rgba(185, 140, 255, 0.05)' : 'transparent');
        if (b.bar) b.bar.setAttribute('opacity', active ? '1' : '0');
      }
      for (let i = 0; i < compareRatePaths.length; i++) {
        const item = compareRatePaths[i];
        item.path.setAttribute('opacity', i === highlightedConditionIndex ? '1' : '0.28');
        item.area.setAttribute('opacity', i === highlightedConditionIndex ? '0.14' : '0.03');
      }
    }

    function updateLearningVisibility() {
      if (readoutEl && conditions[0].history[visibleRows - 1]) {
        const h = conditions[0].history[visibleRows - 1];
        const val = h.wBuzz ?? h.wChime ?? 0;
        readoutEl.textContent = `buzz predicts ${val.toFixed(2)}`;
      }
    }

    function rebuildRasterAndRate() {
      rebuildStaticSpikes();
      rebuildRateGroup();
    }

    function rebuildRateGroup() {
      while (rateGroup.firstChild) rateGroup.removeChild(rateGroup.firstChild);
      compareRatePaths = [];

      // Rate baseline at 5 Hz
      const rateToY = lin(0, 36, rateY0 + rateH, rateY0);
      const base5Y = rateToY(5);

      el('line', {
        x1: leftPad,
        y1: base5Y,
        x2: width - rightPad,
        y2: base5Y,
        stroke: C.faint,
        'stroke-width': '1',
        'stroke-dasharray': '2 3',
      }, rateGroup);

      const steadyLbl = el('text', {
        x: leftPad - 8,
        y: base5Y + 3,
        'text-anchor': 'end',
        fill: C.muted,
        'font-family': 'var(--display)',
        'font-size': '10',
      }, rateGroup);
      steadyLbl.textContent = 'steady (5 Hz)';

      const rateAxisLbl = el('text', {
        x: leftPad - 8,
        y: rateY0 + 10,
        'text-anchor': 'end',
        fill: C.muted,
        'font-family': 'var(--display)',
        'font-size': '10',
        'letter-spacing': '0.08em',
        'text-transform': 'uppercase',
      }, rateGroup);
      rateAxisLbl.textContent = 'spikes/s';

      if (mode === 'compare') {
        for (let i = 0; i < conditions.length; i++) {
          const area = el('path', {
            fill: C.dopamine,
            opacity: i === highlightedConditionIndex ? '0.12' : '0.04',
          }, rateGroup);

          const path = el('path', {
            fill: 'none',
            stroke: C.dopamine,
            'stroke-width': '1.75',
            'stroke-linecap': 'round',
            opacity: i === highlightedConditionIndex ? '1' : '0.35',
          }, rateGroup);

          compareRatePaths.push({ area, path, condIndex: i });
        }
      } else {
        rateAreaEl = el('path', {
          fill: C.dopamine,
          opacity: '0.12',
        }, rateGroup);

        ratePathEl = el('path', {
          fill: 'none',
          stroke: C.dopamine,
          'stroke-width': '1.75',
          'stroke-linecap': 'round',
        }, rateGroup);
      }

      updateRatePaths();
    }

    function buildRatePathD(trial) {
      const rateToY = lin(0, 36, rateY0 + rateH, rateY0);
      const baseY = rateToY(0);
      const pts = [];
      const steps = 70;
      const t0 = world.WINDOW[0];
      const t1 = world.WINDOW[1];
      for (let s = 0; s <= steps; s++) {
        const ct = t0 + (s / steps) * (t1 - t0);
        const r = world.daRate(ct, trial);
        pts.push({ x: timeToX(ct), y: rateToY(r) });
      }

      let dLine = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
      for (let i = 1; i < pts.length; i++) {
        dLine += ` L ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
      }

      const dArea = `${dLine} L ${pts[pts.length - 1].x.toFixed(1)} ${baseY.toFixed(1)} L ${pts[0].x.toFixed(1)} ${baseY.toFixed(1)} Z`;
      return { dLine, dArea };
    }

    function updateRatePaths() {
      if (mode === 'compare') {
        for (let i = 0; i < conditions.length; i++) {
          const { dLine, dArea } = buildRatePathD(conditions[i].trial);
          compareRatePaths[i].path.setAttribute('d', dLine);
          compareRatePaths[i].area.setAttribute('d', dArea);
        }
      } else if (mode === 'learning') {
        const curTrial = conditions[0].history[visibleRows - 1] || conditions[0].history[0];
        const { dLine, dArea } = buildRatePathD(curTrial);
        if (ratePathEl) ratePathEl.setAttribute('d', dLine);
        if (rateAreaEl) rateAreaEl.setAttribute('d', dArea);
      } else {
        const { dLine, dArea } = buildRatePathD(conditions[0].trial);
        if (ratePathEl) ratePathEl.setAttribute('d', dLine);
        if (rateAreaEl) rateAreaEl.setAttribute('d', dArea);
      }
    }

    rebuildLayout();

    return {
      runTrial() {
        if (mode === 'learning' && visibleRows < (props.rows || 30)) {
          visibleRows++;
          updateLearningVisibility();
          updateRatePaths();
        }
      },

      render(t) {
        if (t < lastT) {
          burstFired = false;
        }
        lastT = t;

        const curX = timeToX(t);
        playheadLine.setAttribute('x1', curX);
        playheadLine.setAttribute('x2', curX);

        // Highlight event labels when playhead passes
        for (const item of eventLabels) {
          const isNear = t >= item.ev.t && t < item.ev.t + 0.4;
          item.el.setAttribute('fill', isNear ? C.ink : C.muted);
        }

        // Spikes: reveal, don't pre-draw. Spikes after playhead: opacity 0.
        // Within 60 ms before playhead: glow.
        for (let i = 0; i < spikeItems.length; i++) {
          const item = spikeItems[i];
          if (mode === 'learning' && item.row >= visibleRows) {
            item.el.setAttribute('opacity', '0');
            continue;
          }
          if (item.t > t) {
            item.el.setAttribute('opacity', '0');
          } else {
            item.el.setAttribute('opacity', '1');
            const dt = t - item.t;
            if (dt >= 0 && dt <= 0.06 && glowUrl !== 'none') {
              item.el.setAttribute('filter', glowUrl);
            } else {
              item.el.removeAttribute('filter');
            }
          }
        }

        // Active condition for driving VTA and pulse
        let activeTrial;
        if (mode === 'compare') {
          activeTrial = conditions[highlightedConditionIndex].trial;
        } else if (mode === 'learning') {
          activeTrial = conditions[0].history[visibleRows - 1] || conditions[0].history[0];
        } else {
          activeTrial = conditions[0].trial;
        }

        const rate = world.daRate(t, activeTrial);

        if (scene) {
          const driveVal = (rate - 5) / 26;
          scene.setDrive('vta', driveVal);

          if (rate > 18 && !burstFired) {
            scene.firePulse('vta', 'nucleus-accumbens', { color: '#b98cff' });
            burstFired = true;
          } else if (rate < 15) {
            burstFired = false;
          }
        }
      },

      destroy() {
        if (trialInterval) clearInterval(trialInterval);
        if (scene) scene.setDrive('vta', 0);
        if (svg.parentElement) svg.parentElement.removeChild(svg);
      },
    };
  },
};
