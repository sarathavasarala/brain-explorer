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

    // Feed simulation state
    let feedIndex = 0;
    let runningV = 0.45;
    let feedSwipes = 0;
    let feedBurstCount = 0;
    let feedDipCount = 0;
    let feedAutoInterval = null;
    let isAutoScrolling = false;
    let feedReadout = null;
    let feedSlideStart = 0;

    const learnBaseHz = props.baseHz !== undefined ? props.baseHz : 5;

    // Conditions data
    let conditions = [];
    if (mode === 'single') {
      conditions = [{
        label: props.title || 'Dopamine neuron',
        trial: { ...(props.trial || { chime: true, juice: true, V: 0, want: 1 }) },
        rows: props.rows || 8,
      }];
    } else if (mode === 'learning') {
      const totalRows = props.rows || 20;
      const schedule = world.schedule({ n: totalRows, insectRate: 0, insectAloneEvery: 0, seed: 11 });
      const history = world.learn(schedule, { want: 1 }).map((tr) => ({
        ...tr,
        baseHz: learnBaseHz,
      }));
      conditions = [{
        label: `${totalRows} trials`,
        schedule,
        history,
        rows: totalRows,
      }];
    } else if (mode === 'compare') {
      conditions = (props.conditions || []).map((c) => ({
        label: c.label,
        trial: { ...c.trial, want: wantValue },
        rows: c.rows || 4,
      }));
    } else if (mode === 'baseline-contrast') {
      conditions = [
        {
          label: 'Burst-only (0 Hz base)',
          trial: { buzz: true, msg: false, V: 1, baseHz: 0 },
          badge: 'Cannot fire negative spikes · Blind to letdown',
          rows: 4,
        },
        {
          label: 'Tonic hum (4.5 Hz base)',
          trial: { buzz: true, msg: false, V: 1, baseHz: 4.5 },
          badge: 'Silent pause (4.5 Hz -> 0 Hz) encodes disappointment',
          rows: 4,
        },
      ];
    } else if (mode === 'feed') {
      const reels = world.FEED_REELS || [{ id: 1, title: 'Viral hit', reward: 1.0, type: 'viral' }];
      const reel = reels[0];
      conditions = [{
        label: reel.title,
        trial: { buzz: true, msg: true, want: reel.reward, V: runningV, baseHz: 4.5 },
        rows: 5,
      }];
    }

    let feedSlideGroup = null;
    let prevReelData = null;

    function advanceFeed() {
      const reels = world.FEED_REELS || [{ id: 1, reward: 0.5, title: 'Reel', text: '' }];
      prevReelData = reels[feedIndex];
      feedIndex = (feedIndex + 1) % reels.length;
      const reel = reels[feedIndex];
      feedSwipes++;
      const delta = reel.reward - runningV;
      const usedV = runningV;
      runningV = Math.max(0.2, Math.min(0.85, runningV + 0.22 * delta));
      if (delta > 0.25) {
        feedBurstCount++;
        if (scene) scene.firePulse('vta', 'nucleus-accumbens', { color: '#b98cff' });
      } else if (delta < -0.08) {
        feedDipCount++;
        if (scene) scene.firePulse('habenula', 'vta', { color: '#ff6b7d' });
      }
      conditions[0].label = reel.title;
      conditions[0].trial = { buzz: true, msg: true, want: reel.reward, V: usedV, baseHz: 4.5 };
      if (feedReadout) {
        feedReadout.textContent = `Reel #${feedSwipes + 1} · RPE ${delta >= 0 ? '+' : ''}${delta.toFixed(2)} (${delta > 0.25 ? 'Viral burst!' : delta < -0.08 ? 'Boring dip' : 'Mild'})`;
      }
      feedSlideStart = performance.now();
      clock.reset(world.WINDOW);
      clock.play();
      rebuildStaticSpikes();
      rebuildRateGroup();
    }

    function setupControls() {
      if (!setControls) return;
      const ctrls = document.createElement('div');
      ctrls.className = 'dock-ctrl-group';
      ctrls.style.display = 'flex';
      ctrls.style.alignItems = 'center';
      ctrls.style.gap = '10px';

      if (mode === 'learning') {
        const totalRows = props.rows || 20;
        const h0 = conditions[0].history[visibleRows - 1];
        const val = h0.wBuzz ?? h0.wChime ?? 0;
        readoutEl = document.createElement('span');
        readoutEl.className = 'dock-label';
        readoutEl.textContent = `Trip ${visibleRows} of ${totalRows} · Scent expectation: ${Math.round(val * 100)}%`;
        ctrls.appendChild(readoutEl);

        runTrialsBtn = document.createElement('button');
        runTrialsBtn.type = 'button';
        runTrialsBtn.className = 'dock-btn';
        runTrialsBtn.textContent = `Run ${totalRows} foraging trips`;
        runTrialsBtn.addEventListener('click', () => {
          if (isRunningTrials) {
            clearInterval(trialInterval);
            isRunningTrials = false;
            runTrialsBtn.textContent = `Run ${totalRows} foraging trips`;
            return;
          }
          if (visibleRows >= totalRows) {
            visibleRows = 1;
            updateLearningVisibility();
            rebuildRateGroup();
          }
          isRunningTrials = true;
          runTrialsBtn.textContent = 'Pause foraging trips';
          trialInterval = setInterval(() => {
            if (visibleRows < totalRows) {
              visibleRows++;
              updateLearningVisibility();
              rebuildRateGroup();
            } else {
              clearInterval(trialInterval);
              isRunningTrials = false;
              runTrialsBtn.textContent = `Run ${totalRows} foraging trips`;
            }
          }, 120);
        });
        ctrls.appendChild(runTrialsBtn);
      }

      if (mode === 'baseline-contrast') {
        let isMissing = true;
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'dock-btn';
        toggleBtn.setAttribute('aria-pressed', 'true');
        toggleBtn.textContent = 'Bush: Empty (Missing berries)';
        toggleBtn.addEventListener('click', () => {
          isMissing = !isMissing;
          toggleBtn.setAttribute('aria-pressed', isMissing ? 'true' : 'false');
          toggleBtn.textContent = isMissing
            ? 'Bush: Empty (Missing berries)'
            : 'Bush: Has berries';
          if (isMissing) {
            conditions[0].trial = { buzz: true, msg: false, V: 1, baseHz: 0 };
            conditions[1].trial = { buzz: true, msg: false, V: 1, baseHz: 4.5 };
          } else {
            conditions[0].trial = { buzz: true, msg: true, V: 1, baseHz: 0 };
            conditions[1].trial = { buzz: true, msg: true, V: 1, baseHz: 4.5 };
          }
          rebuildStaticSpikes();
          rebuildRateGroup();
        });
        ctrls.appendChild(toggleBtn);
      }

      if (mode === 'feed') {
        feedReadout = document.createElement('span');
        feedReadout.className = 'dock-label';
        feedReadout.textContent = 'Click ↓ on the phone reel to swipe';

        const swipeBtn = document.createElement('button');
        swipeBtn.type = 'button';
        swipeBtn.className = 'dock-btn';
        swipeBtn.textContent = '↓ Next Reel';

        const autoBtn = document.createElement('button');
        autoBtn.type = 'button';
        autoBtn.className = 'dock-btn';
        autoBtn.setAttribute('aria-pressed', 'false');
        autoBtn.textContent = 'Auto-swipe';

        swipeBtn.addEventListener('click', advanceFeed);
        autoBtn.addEventListener('click', () => {
          isAutoScrolling = !isAutoScrolling;
          autoBtn.setAttribute('aria-pressed', isAutoScrolling ? 'true' : 'false');
          if (isAutoScrolling) {
            advanceFeed();
            feedAutoInterval = setInterval(advanceFeed, 2400);
          } else {
            if (feedAutoInterval) clearInterval(feedAutoInterval);
          }
        });

        ctrls.appendChild(feedReadout);
        ctrls.appendChild(swipeBtn);
        ctrls.appendChild(autoBtn);
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

      setControls(ctrls);
    }

    setupControls();

    // Visual layout elements
    const isMulti = mode === 'compare' || mode === 'baseline-contrast';
    const leftPad = isMulti ? 152 : (mode === 'feed' ? 234 : 54);
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

    // Events
    const eventLines = [];
    const eventLabels = [];

    const cueText = props.cueLabel || (mode === 'feed' ? 'swipe' : (mode === 'learning' || mode === 'baseline-contrast' ? 'scent (cue)' : 'buzz'));
    const rewardText = props.rewardLabel || (mode === 'feed' ? 'clip' : (mode === 'learning' || mode === 'baseline-contrast' ? 'berries (reward)' : 'message'));

    const events = [
      { t: world.BUZZ_T ?? world.CHIME_T ?? 0, label: cueText },
      { t: world.MSG_T ?? world.JUICE_T ?? 1.0, label: rewardText },
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
      } else if (mode === 'compare' || mode === 'baseline-contrast') {
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
            y: bY0 + (cond.badge ? bandH * 0.42 : bandH * 0.55),
            'text-anchor': 'end',
            fill: isActive ? C.ink : C.muted,
            'font-family': 'var(--display)',
            'font-size': '11',
            'font-weight': isActive ? '600' : '500',
          }, rasterGroup);
          bandLbl.textContent = cond.label;

          if (cond.badge) {
            const bTxt = el('text', {
              x: leftPad - 12,
              y: bY0 + bandH * 0.74,
              'text-anchor': 'end',
              fill: cIdx === 0 ? '#ff6b7d' : '#6be4ff',
              'font-family': 'var(--display)',
              'font-size': '8.5',
              'letter-spacing': '0.01em',
            }, rasterGroup);
            bTxt.textContent = cond.badge;
          }

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
      } else if (mode === 'feed') {
        const totalRows = props.rows || 5;
        const rowH = rasterH / totalRows;

        const curReel = (world.FEED_REELS && world.FEED_REELS[feedIndex]) || { reward: 0.5, title: 'Reel', text: '' };
        const usedV = conditions[0].trial.V ?? runningV;
        const delta = curReel.reward - usedV;
        const isViral = delta > 0.25;
        const isDip = delta < -0.08;
        const accentCol = isViral ? '#ffcf6b' : isDip ? '#ff6b7d' : '#b98cff';

        // Ensure clipPath exists in defs
        let defs = svg.querySelector('defs');
        if (!defs) {
          defs = el('defs', {}, svg);
        }
        let clip = defs.querySelector('#reel-viewport-clip');
        if (!clip) {
          clip = el('clipPath', { id: 'reel-viewport-clip' }, defs);
          el('rect', { x: 8, y: 20, width: 138, height: 150, rx: '10' }, clip);
        }

        // Phone outer frame (x: 2 to 152, y: 6 to 218, center x = 77)
        const phoneGroup = el('g', { class: 'phone-reel-widget' }, rasterGroup);
        el('rect', {
          x: 2,
          y: 6,
          width: 150,
          height: 212,
          rx: '16',
          fill: 'rgba(10, 12, 22, 0.92)',
          stroke: isViral ? 'rgba(255, 207, 107, 0.55)' : isDip ? 'rgba(255, 107, 125, 0.45)' : 'rgba(185, 140, 255, 0.3)',
          'stroke-width': '1.5',
        }, phoneGroup);

        // Speaker notch
        el('rect', {
          x: 60,
          y: 12,
          width: 34,
          height: 3.5,
          rx: '1.75',
          fill: 'rgba(233, 235, 245, 0.22)',
        }, phoneGroup);

        // Clipped screen viewport
        const viewport = el('g', { 'clip-path': 'url(#reel-viewport-clip)', style: 'cursor: pointer;' }, phoneGroup);
        viewport.addEventListener('click', advanceFeed);

        feedSlideGroup = el('g', { class: 'reel-slide-group' }, viewport);

        function drawReelCard(parent, reelObj, swipeNum, rpeDelta, yOffset) {
          const g = el('g', { transform: `translate(0, ${yOffset})` }, parent);
          const viral = rpeDelta > 0.25;
          const dip = rpeDelta < -0.08;
          const col = viral ? '#ffcf6b' : dip ? '#ff6b7d' : '#b98cff';

          // Screen background
          el('rect', {
            x: 8,
            y: 20,
            width: 138,
            height: 150,
            rx: '10',
            fill: viral ? 'rgba(255, 207, 107, 0.08)' : dip ? 'rgba(255, 107, 125, 0.06)' : 'rgba(185, 140, 255, 0.06)',
          }, g);

          // Top reel counter & badge
          el('text', {
            x: 16,
            y: 36,
            fill: C.muted,
            'font-family': 'var(--display)',
            'font-size': '8.5',
            'font-weight': '600',
            'letter-spacing': '0.08em',
            'text-transform': 'uppercase',
          }, g).textContent = `REEL #${swipeNum}`;

          // Visual icon in center-top of reel (cx = 77)
          if (viral) {
            el('circle', { cx: 77, cy: 64, r: '16', fill: 'rgba(255, 207, 107, 0.16)', stroke: '#ffcf6b', 'stroke-width': '1.25' }, g);
            el('path', { d: 'M 77 52 L 80 60 L 88 61 L 82 66 L 84 74 L 77 69 L 70 74 L 72 66 L 66 61 L 74 60 Z', fill: '#ffcf6b' }, g);
          } else if (dip) {
            el('circle', { cx: 77, cy: 64, r: '15', fill: 'rgba(255, 107, 125, 0.12)', stroke: '#ff6b7d', 'stroke-width': '1.25' }, g);
            el('line', { x1: 69, y1: 64, x2: 85, y2: 64, stroke: '#ff6b7d', 'stroke-width': '2', 'stroke-linecap': 'round' }, g);
          } else {
            el('circle', { cx: 77, cy: 64, r: '15', fill: 'rgba(185, 140, 255, 0.12)', stroke: '#b98cff', 'stroke-width': '1.25' }, g);
            el('path', { d: 'M 73 58 L 83 64 L 73 70 Z', fill: '#b98cff' }, g);
          }

          // Reel Title
          el('text', {
            x: 77,
            y: 98,
            'text-anchor': 'middle',
            fill: C.ink,
            'font-family': 'var(--display)',
            'font-size': '11',
            'font-weight': '700',
          }, g).textContent = reelObj.title;

          // Reel short description
          el('text', {
            x: 77,
            y: 113,
            'text-anchor': 'middle',
            fill: C.muted,
            'font-family': 'var(--display)',
            'font-size': '8.5',
          }, g).textContent = reelObj.text || '';

          // RPE Pill inside reel card
          el('rect', {
            x: 15,
            y: 124,
            width: 124,
            height: 22,
            rx: '6',
            fill: viral ? 'rgba(255, 207, 107, 0.18)' : dip ? 'rgba(255, 107, 125, 0.18)' : 'rgba(185, 140, 255, 0.14)',
            stroke: col,
            'stroke-width': '1',
          }, g);

          el('text', {
            x: 77,
            y: 138,
            'text-anchor': 'middle',
            fill: col,
            'font-family': 'var(--display)',
            'font-size': '9.5',
            'font-weight': '700',
          }, g).textContent = `RPE: ${rpeDelta >= 0 ? '+' : ''}${rpeDelta.toFixed(2)} · ${viral ? 'SURGE!' : dip ? 'DIP PAUSE' : 'MILD'}`;

          // Zero-friction footnote
          el('text', {
            x: 77,
            y: 161,
            'text-anchor': 'middle',
            fill: 'rgba(233,235,245,0.45)',
            'font-family': 'var(--display)',
            'font-size': '8',
          }, g).textContent = '1 thumb flick · 0 sec wait';
        }

        if (prevReelData && feedSwipes > 0) {
          drawReelCard(feedSlideGroup, prevReelData, feedSwipes, (prevReelData.reward - 0.45), -152);
        }
        drawReelCard(feedSlideGroup, curReel, feedSwipes + 1, delta, 0);

        // Down-Arrow Swipe Button at bottom of phone (y: 178 to 208)
        const downBtnGroup = el('g', { class: 'phone-down-btn', style: 'cursor: pointer;' }, phoneGroup);
        const downBtnRect = el('rect', {
          x: 11,
          y: 178,
          width: 132,
          height: 30,
          rx: '15',
          fill: 'rgba(185, 140, 255, 0.18)',
          stroke: '#b98cff',
          'stroke-width': '1.25',
        }, downBtnGroup);

        // Down arrow icon + label
        el('path', {
          d: 'M 32 188 L 32 198 M 28 194 L 32 198 L 36 194',
          fill: 'none',
          stroke: '#fff',
          'stroke-width': '1.75',
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        }, downBtnGroup);

        el('text', {
          x: 84,
          y: 197,
          'text-anchor': 'middle',
          fill: '#fff',
          'font-family': 'var(--display)',
          'font-size': '10',
          'font-weight': '700',
        }, downBtnGroup).textContent = 'Swipe Next Reel';

        downBtnGroup.addEventListener('pointerenter', () => {
          downBtnRect.setAttribute('fill', 'rgba(185, 140, 255, 0.32)');
        });
        downBtnGroup.addEventListener('pointerleave', () => {
          downBtnRect.setAttribute('fill', 'rgba(185, 140, 255, 0.18)');
        });
        downBtnGroup.addEventListener('click', advanceFeed);

        for (let i = 0; i < totalRows; i++) {
          const seed = (feedSwipes + 1) * 10 + i;
          const yMid = rasterY0 + i * rowH + rowH * 0.5;
          const spikeH = rowH * 0.7;

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
              stroke: accentCol,
              'stroke-width': '1.5',
              'stroke-linecap': 'round',
              opacity: '0',
            }, rasterGroup);
            spikeItems.push({ t: st, el: line, row: i });
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
      const totalRows = props.rows || 20;
      if (readoutEl && conditions[0].history[visibleRows - 1]) {
        const h = conditions[0].history[visibleRows - 1];
        const val = h.wBuzz ?? h.wChime ?? 0;
        readoutEl.textContent = `Trip ${visibleRows} of ${totalRows} · Scent expectation: ${Math.round(val * 100)}%`;
      }
    }

    function rebuildRasterAndRate() {
      rebuildStaticSpikes();
      rebuildRateGroup();
    }

    function rebuildRateGroup() {
      while (rateGroup.firstChild) rateGroup.removeChild(rateGroup.firstChild);
      compareRatePaths = [];

      const rateToY = lin(0, 36, rateY0 + rateH, rateY0);
      const isZeroBaseLearning = mode === 'learning' && learnBaseHz === 0;
      const refHz = isZeroBaseLearning ? 0 : (mode === 'baseline-contrast' || mode === 'feed' ? 4.5 : 5);
      const baseRefY = rateToY(refHz);

      el('line', {
        x1: leftPad,
        y1: baseRefY,
        x2: width - rightPad,
        y2: baseRefY,
        stroke: C.faint,
        'stroke-width': '1',
        'stroke-dasharray': '2 3',
      }, rateGroup);

      const steadyLbl = el('text', {
        x: leftPad - 8,
        y: baseRefY + 3,
        'text-anchor': 'end',
        fill: C.muted,
        'font-family': 'var(--display)',
        'font-size': '10',
      }, rateGroup);
      steadyLbl.textContent = isZeroBaseLearning
        ? 'silent (0 Hz)'
        : (refHz === 4.5 ? 'tonic (4.5 Hz)' : 'steady (5 Hz)');

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

      if (mode === 'compare' || mode === 'baseline-contrast') {
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
        const isFeed = mode === 'feed';
        const curReel = isFeed && world.FEED_REELS ? world.FEED_REELS[feedIndex] : null;
        const usedV = isFeed ? (conditions[0].trial.V ?? runningV) : 0;
        const delta = curReel ? (curReel.reward - usedV) : 0;
        const strokeCol = isFeed
          ? (delta > 0.25 ? '#ffcf6b' : delta < -0.08 ? '#ff6b7d' : C.dopamine)
          : C.dopamine;

        rateAreaEl = el('path', {
          fill: strokeCol,
          opacity: '0.14',
        }, rateGroup);

        ratePathEl = el('path', {
          fill: 'none',
          stroke: strokeCol,
          'stroke-width': '2',
          'stroke-linecap': 'round',
        }, rateGroup);

        if (mode === 'learning') {
          const isEarly = visibleRows <= 3;
          const badgeX = timeToX(isEarly ? 1.1 : 0.1);
          const badgeY = rateY0 + 12;
          const callout = el('text', {
            x: badgeX,
            y: badgeY,
            'text-anchor': 'middle',
            fill: '#ffcf6b',
            'font-family': 'var(--display)',
            'font-size': '9.5',
            'font-weight': '600',
          }, rateGroup);
          callout.textContent = isEarly
            ? `Trip ${visibleRows}: Surprise burst at BERRIES (1.0s)`
            : `Trip ${visibleRows}: Burst shifted to SCENT (0.0s)!`;
        }

        if (isFeed && curReel) {
          const badgeX = timeToX(1.1);
          const badgeY = rateY0 + 10;
          const callout = el('text', {
            x: badgeX,
            y: badgeY,
            'text-anchor': 'middle',
            fill: strokeCol,
            'font-family': 'var(--display)',
            'font-size': '9.5',
            'font-weight': '700',
          }, rateGroup);
          callout.textContent = delta > 0.25
            ? `+${delta.toFixed(2)} RPE BURST! (Jackpot exceeds expectation)`
            : delta < -0.08
              ? `${delta.toFixed(2)} RPE DIP! (Pause below 4.5 Hz triggers urge to swipe)`
              : `RPE near zero (Matches expectation)`;
        }
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
      if (mode === 'compare' || mode === 'baseline-contrast') {
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
        if (mode === 'learning' && visibleRows < (props.rows || 20)) {
          visibleRows++;
          updateLearningVisibility();
          rebuildRateGroup();
        } else if (mode === 'feed') {
          advanceFeed();
        }
      },

      render(t) {
        if (t < lastT) {
          burstFired = false;
        }
        lastT = t;

        if (mode === 'feed' && feedSlideGroup && feedSlideStart > 0) {
          const elapsed = performance.now() - feedSlideStart;
          const dur = 260;
          if (elapsed < dur) {
            const p = elapsed / dur;
            const ease = 1 - Math.pow(1 - p, 3);
            const yShift = (1 - ease) * 152;
            feedSlideGroup.setAttribute('transform', `translate(0, ${yShift.toFixed(1)})`);
          } else {
            feedSlideGroup.setAttribute('transform', 'translate(0, 0)');
            feedSlideStart = 0;
          }
        }

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
        if (mode === 'compare' || mode === 'baseline-contrast') {
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
        if (feedAutoInterval) clearInterval(feedAutoInterval);
        if (scene) scene.setDrive('vta', 0);
        if (svg.parentElement) svg.parentElement.removeChild(svg);
      },
    };
  },
};
