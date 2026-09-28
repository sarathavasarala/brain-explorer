import { structures, byId, groups, levels, pathways, anchors, validate, sourceOf, chemicals, chemicalGroups, cells, cellGroups, chemById, cellById } from './content/index.js';
import { createBrainScene } from './scene/brain-scene.js';
import { renderSidebar } from './ui/sidebar.js';
import { renderStructure, renderPathway, renderHome } from './ui/explainer.js';
import { renderAsk } from './ui/ask.js';
import { renderLibraryShell, renderLibraryBody } from './ui/library.js';
import { renderChemHome, renderChem } from './ui/chem.js';
import { renderCellHome, renderCell } from './ui/cell.js';
import { setStepperStage, getStepperStage, setDrugMode, toggleStepperPlay, stopStepperPlay, renderSynapseStepper } from './ui/synapse-stepper.js';
import { ask, cached, normalise } from './services/ask.js';
import { findTerm, esc } from './ui/format.js';
import { icon } from './ui/icons.js';

const $ = (sel) => document.querySelector(sel);
const appEl = $('.app');
const listEl = $('#list');
const explainerEl = $('#explainer');
const libraryEl = $('#library');
const hoverEl = $('#hover-label');
const tipEl = $('#tip');
const lensLegendEl = $('#lens-legend');
const cellInsetEl = $('#cell-inset');

const INSET_PART_POS = {
  'prefrontal-cortex': [36, 42],
  'motor-cortex': [65, 30],
  'somatosensory-cortex': [75, 32],
  'parietal-lobe': [95, 36],
  'visual-cortex': [130, 56],
  'occipital-lobe': [126, 54],
  'temporal-lobe': [60, 68],
  'hippocampus': [70, 64],
  'striatum': [65, 52],
  'nucleus-accumbens': [54, 58],
  'substantia-nigra': [80, 72],
  'vta': [78, 70],
  'thalamus': [82, 52],
  'cerebellum': [118, 82],
  'spinal-cord': [90, 102],
  'medulla': [90, 92],
  'pons': [86, 82],
  'corpus-callosum': [76, 44],
  'amygdala': [58, 64],
  'hypothalamus': [72, 60],
  'auditory-cortex': [74, 54],
  'brocas-area': [44, 48],
  'wernickes-area': [96, 52],
};

function renderCellInset(cell) {
  if (!cellInsetEl) return;
  const where = cell?.where || [];
  const dots = where.map((id) => {
    const pos = INSET_PART_POS[id] || [75, 55];
    return `
      <circle cx="${pos[0]}" cy="${pos[1]}" r="8" fill="${cell.color || '#ffd36b'}" opacity="0.35"/>
      <circle cx="${pos[0]}" cy="${pos[1]}" r="3.5" fill="${cell.color || '#ffd36b'}"/>
    `;
  }).join('');

  cellInsetEl.href = `#/cell/${cell.id}/lives`;
  cellInsetEl.hidden = false;
  cellInsetEl.innerHTML = `
    <div class="cell-inset-head">
      <span>Where it lives</span>
      <span class="arrow">&rarr;</span>
    </div>
    <svg viewBox="0 0 150 110" aria-hidden="true">
      <path d="M 24 46 C 22 36, 34 22, 58 18 C 82 14, 114 18, 132 40 C 138 48, 136 58, 124 64 C 132 70, 132 82, 120 88 C 110 92, 100 90, 96 85 L 95 100 L 85 100 L 86 85 C 80 82, 65 80, 52 74 C 44 70, 42 60, 48 54 C 36 54, 25 52, 24 46 Z"
            fill="rgba(190, 200, 255, 0.06)" stroke="rgba(190, 200, 255, 0.28)" stroke-width="1.2"/>
      <path d="M 48 54 C 65 52, 85 55, 100 48" fill="none" stroke="rgba(190, 200, 255, 0.16)" stroke-width="1"/>
      <path d="M 72 18 C 70 32, 73 45, 78 52" fill="none" stroke="rgba(190, 200, 255, 0.16)" stroke-width="1"/>
      <path d="M 98 75 C 105 70, 120 70, 124 64" fill="none" stroke="rgba(190, 200, 255, 0.16)" stroke-width="1"/>
      ${dots}
    </svg>
  `;
}

const problems = validate();
if (problems.length) console.warn(`[brain] ${problems.length} content problem(s):\n` + problems.join('\n'));

const state = { query: '', libQuery: '', dict: 'parts', route: { type: 'home' }, playing: false, flown: '' };
let timer = null;
let cellFireActive = false;

// ---------------------------------------------------------------- scene
const scene = createBrainScene($('#brain'), {
  structures,
  anchors,
  chemicals,
  labelsEl: $('#labels'),
  onHover(id, x, y) {
    const s = byId.get(id) || anchors.find((a) => a.id === id);
    if (!s) { hoverEl.classList.remove('is-on'); return; }
    hoverEl.innerHTML = `<i style="--c:${s.color}"></i>${esc(s.name)}`;
    hoverEl.style.transform = `translate(${x + 16}px, ${y + 14}px)`;
    hoverEl.classList.add('is-on');
  },
  onPick(id) {
    if (!id || !byId.has(id)) return;
    const level = state.route.type === 's' ? state.route.level : 'where';
    location.hash = `#/s/${id}/${level}`;
  },
});

// ---------------------------------------------------------------- routing
// #/            Parts home         #/s/<id>/<level>   a part
// #/chem        Chemicals home     #/chem/<id>/<tab>  a chemical
// #/cell        Cells home         #/cell/<id>/<tab>  a cell
// #/pathways    pathway library    #/p/<id>/<step>    a pathway tour
// #/ask         Ask intro          #/ask/<question>   a sketch
function parseHash() {
  const [type, id, extra, sub] = location.hash.replace(/^#\/?/, '').split('/');
  if (type === 's' && byId.has(id)) {
    return { type: 's', id, level: levels.some((l) => l.id === extra) ? extra : levels[0].id };
  }
  if (type === 'p' && pathways.some((p) => p.id === id)) {
    const p = pathways.find((q) => q.id === id);
    return { type: 'p', id, step: Math.min(Math.max(parseInt(extra, 10) || 0, 0), p.steps.length - 1) };
  }
  if (type === 'pathways') return { type: 'library' };
  if (type === 'ask') {
    let q = '';
    try { q = normalise(decodeURIComponent(id || '')); } catch { q = ''; }
    return { type: 'ask', query: q };
  }
  if (type === 'chem') {
    if (id && chemById.has(id)) {
      return { type: 'chem', id, tab: extra || 'overview', sub: sub || null };
    }
    return { type: 'chemhome' };
  }
  if (type === 'cell') {
    if (id && cellById.has(id)) {
      return { type: 'cell', id, tab: extra || 'shape' };
    }
    return { type: 'cellhome' };
  }
  return { type: 'home' };
}

const MODE = { home: 'parts', s: 'parts', chemhome: 'parts', chem: 'parts', cellhome: 'parts', cell: 'parts', library: 'library', p: 'tour', ask: 'ask' };
const NAV = { parts: 'parts', library: 'pathways', tour: 'pathways', ask: 'ask' };

function setMode(type) {
  const mode = MODE[type] || 'parts';
  appEl.classList.remove('mode-parts', 'mode-library', 'mode-tour', 'mode-ask');
  appEl.classList.add(`mode-${mode}`);
  document.querySelectorAll('[data-mode]').forEach((a) => {
    const on = a.dataset.mode === NAV[mode];
    a.classList.toggle('is-on', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  libraryEl.hidden = mode !== 'library';

  const dict = (type === 'chemhome' || type === 'chem') ? 'chem'
             : (type === 'cellhome' || type === 'cell') ? 'cell'
             : 'parts';
  state.dict = dict;
  document.querySelectorAll('[data-dict]').forEach((a) => {
    const on = a.dataset.dict === dict;
    a.classList.toggle('is-on', on);
    if (on) a.setAttribute('aria-selected', 'true'); else a.removeAttribute('aria-selected');
  });
  const searchInput = $('#search');
  if (searchInput) {
    searchInput.placeholder = 'Search parts, chemicals, cells';
  }
}

function arcFor(from, c) {
  const incoming = c.dir === 'in';
  return { from: incoming ? c.id : from, to: incoming ? from : c.id, flow: c.dir === 'both' ? 'both' : 'forward' };
}

function routeEndpoints(route = []) {
  const ids = [];
  for (const r of route) {
    if (Array.isArray(r)) {
      if (typeof r[0] === 'string') ids.push(r[0]);
      if (typeof r[1] === 'string') ids.push(r[1]);
    } else if (r && typeof r === 'object') {
      if (r.from) ids.push(r.from);
      if (r.to) ids.push(r.to);
    }
  }
  return ids;
}

function normalizeArc(r, active) {
  if (Array.isArray(r)) {
    const [from, to, opts] = r;
    return { from, to, active, flow: opts?.flow || 'forward', speed: opts?.speed, lift: opts?.lift };
  }
  return { ...r, active };
}

function fly(ids, view, key, opts) {
  if (state.flown === key) return;
  state.flown = key;
  scene.flyTo(ids, view, opts);
}

function clearScene(key) {
  scene.setBody(false);
  scene.focus([]);
  scene.setArcs([]);
  scene.forceSlice(false);
  fly([], 'left', key);
}

function showSketch(r, key) {
  const parts = (r.parts || []).filter((p) => byId.has(p.id));
  scene.paintSketch(parts);
  const cut = parts.filter((p) => p.role === 'cut_off').map((p) => p.id);
  scene.setArcs(cut.slice(1).map((id) => ({ from: cut[0], to: id, active: false })));
  const sliced = parts.find((p) => byId.get(p.id).slice);
  scene.forceSlice(!!sliced);
  const view = byId.get((sliced || parts[0])?.id)?.view || 'left';
  fly(parts.map((p) => p.id), view, key);
}

function apply() {
  const prev = state.route;
  const r = (state.route = parseHash());
  if (r.type !== 'p') stopPlay();
  if (r.type !== 'chem') stopStepperPlay();
  setMode(r.type);

  if (r.type !== 'chem') {
    scene.setBody(false);
    scene.showChemical(null);
    if (lensLegendEl) lensLegendEl.hidden = true;
  }

  if (r.type !== 'cell' || r.tab === 'lives') {
    if (cellInsetEl) cellInsetEl.hidden = true;
    // Leaving a cell for its home in the brain (or for the part you came from): shrink back into it.
    let to = null;
    if (prev.type === 'cell' && prev.tab !== 'lives') {
      const leaving = cellById.get(prev.id);
      if (r.type === 's' && leaving?.where?.includes(r.id)) to = r.id;
      else if (r.type === 'cell' && r.id === prev.id) to = leaving?.where?.[0];
    }
    scene.showCell(null, { to });
  }
  if (r.type !== 'cell' || prev.id !== r.id) {
    cellFireActive = (r.type === 'cell' && r.tab === 'fires');
  }

  const stageNoteEl = $('.stage-note');
  if (stageNoteEl) {
    if (r.type === 'cell') {
      const cell = cellById.get(r.id);
      stageNoteEl.textContent = cell?.size ? `${cell.size}. Procedural morphology.` : 'Shapes are simplified for explanation, not an anatomical atlas.';
    } else if (r.type === 'chem' && chemById.get(r.id)?.group === 'hormone') {
      stageNoteEl.textContent = 'Body view is schematic and compressed, not to anatomical scale.';
    } else {
      stageNoteEl.textContent = 'Shapes are simplified for explanation, not an anatomical atlas.';
    }
  }

  if (r.type === 'home') {
    clearScene('home');
    explainerEl.innerHTML = renderHome();
  } else if (r.type === 'chemhome') {
    clearScene('chemhome');
    explainerEl.innerHTML = renderChemHome();
  } else if (r.type === 'chem') {
    const chem = chemById.get(r.id);
    if (!chem) { location.hash = '#/chem'; return; }

    if (chem.group === 'hormone') {
      scene.setBody(true);
      scene.forceSlice(false);
      scene.setSpin(false);
      syncToolbar();

      const subIdx = (r.sub != null && r.sub !== '') ? parseInt(r.sub, 10) : null;
      const hormoneArcs = [];
      const axis = chem.axis || [];
      const feedback = chem.feedback || [];
      const allEndpoints = [...(chem.madeIn || [])];

      axis.forEach((step, idx) => {
        allEndpoints.push(step.from, step.to);
        const isActive = (r.tab === 'axis') ? (subIdx == null || subIdx === idx ? true : 'ambient') : 'ambient';
        hormoneArcs.push({
          from: step.from,
          to: step.to,
          style: (step.via === 'blood' || step.via === 'portal') ? 'blood' : undefined,
          color: chem.color,
          active: isActive,
          flow: 'forward',
        });
      });

      feedback.forEach((fb) => {
        allEndpoints.push(fb.from, ...(fb.to || []));
        for (const toId of (fb.to || [])) {
          hormoneArcs.push({
            from: fb.from,
            to: toId,
            style: 'blood',
            color: '#ff6b7d',
            active: r.tab === 'axis' ? (subIdx == null ? true : 'ambient') : 'ambient',
            flow: 'forward',
          });
        }
      });

      scene.showChemical({
        color: chem.color,
        sources: chem.madeIn || [],
        density: chem.density || {},
        tracts: [],
        group: chem.group,
      });
      scene.setArcs(hormoneArcs);

      const uniqueEndpoints = [...new Set(allEndpoints)];
      if (r.tab === 'axis' && subIdx != null && axis[subIdx]) {
        const step = axis[subIdx];
        scene.focus([step.from, step.to], { activity: true });
        fly([step.from, step.to], 'body', `chem:${chem.id}:${r.sub}`, { maxDist: 7.2 });
      } else {
        scene.focus(uniqueEndpoints, { activity: true });
        fly(uniqueEndpoints, 'body', `chem:${chem.id}:all`, { maxDist: 7.2 });
      }

      if (lensLegendEl) lensLegendEl.hidden = true;
    } else {
      scene.setBody(false);
      const tractList = (chem.tracts || []).map((t) => {
        let state = 'ambient';
        if (r.tab === 'tracts') {
          if (r.sub) state = (t.id === r.sub ? 'on' : 'off');
          else state = 'on';
        } else if (r.tab === 'overview') {
          state = 'on';
        } else {
          state = 'ambient';
        }
        return {
          id: t.id,
          name: t.name,
          from: t.from,
          to: t.to || [],
          state,
          local: !!t.local,
        };
      });

      // Slice first: the fibre trees are built on whichever half is visible.
      scene.forceSlice(chem.group === 'modulator');
      scene.setSpin(false);
      syncToolbar();
      scene.showChemical({
        color: chem.color,
        sources: chem.madeIn || [],
        density: chem.density || {},
        tracts: tractList,
        group: chem.group,
      });
      scene.setArcs([]);
      const chemView = chem.group === 'modulator' ? 'medial' : 'left';

      if (r.tab === 'tracts' && r.sub) {
        const activeTract = (chem.tracts || []).find((t) => t.id === r.sub);
        const targets = activeTract ? [activeTract.from, ...(activeTract.to || [])] : (chem.madeIn || []);
        fly(targets, chemView, `chem:${chem.id}:${r.sub}`);
      } else if (r.tab === 'tracts' || r.tab === 'overview') {
        const allTargets = [...(chem.madeIn || [])];
        for (const t of chem.tracts || []) {
          if (t.from) allTargets.push(t.from);
          for (const tid of (t.to || [])) allTargets.push(tid);
        }
        fly([...new Set(allTargets)], chemView, `chem:${chem.id}:all`);
      } else {
        if (!state.flown.startsWith(`chem:${chem.id}`)) {
          const allTargets = [...(chem.madeIn || [])];
          for (const t of chem.tracts || []) {
            if (t.from) allTargets.push(t.from);
            for (const tid of (t.to || [])) allTargets.push(tid);
          }
          fly([...new Set(allTargets)], chemView, `chem:${chem.id}:all`);
        }
      }

      if (lensLegendEl) {
        lensLegendEl.hidden = false;
        lensLegendEl.style.setProperty('--accent', chem.color);
      }
    }

    explainerEl.innerHTML = renderChem(chem, r.tab, r.sub);
    if (prev.type !== 'chem' || prev.id !== r.id) explainerEl.scrollTop = 0;
    if (r.tab === 'tracts' && r.sub) {
      const activeCard = explainerEl.querySelector(`.tract-card[data-tract="${r.sub}"]`);
      if (activeCard) activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else if (r.tab === 'axis' && r.sub != null) {
      const activeCard = explainerEl.querySelector(`.axis-card[data-step="${r.sub}"]`);
      if (activeCard) activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  } else if (r.type === 'cellhome') {
    clearScene('cellhome');
    explainerEl.innerHTML = renderCellHome();
  } else if (r.type === 'cell') {
    const cell = cellById.get(r.id);
    if (!cell) { location.hash = '#/cell'; return; }
    if (r.tab === 'lives') {
      if (cellInsetEl) cellInsetEl.hidden = true;
      scene.showCell(null);
      scene.focus(cell.where, { activity: true });
      scene.setArcs([]);
      scene.forceSlice(false);
      fly(cell.where, 'left', `cell:${cell.id}:lives`);
    } else {
      scene.setSpin(false);
      syncToolbar();
      renderCellInset(cell);
      // Arriving from a part (or from this cell's "where it lives" view): zoom in from that part.
      let from = null;
      if (prev.type === 's' && cell.where?.includes(prev.id)) from = prev.id;
      else if (prev.type === 'cell' && prev.id === cell.id && prev.tab === 'lives') from = cell.where?.[0];
      scene.showCell(cell, { fire: r.tab === 'fires' || cellFireActive, from });
    }
    explainerEl.innerHTML = renderCell(cell, r.tab, cellFireActive);
    if (prev.type !== 'cell' || prev.id !== r.id) explainerEl.scrollTop = 0;
  } else if (r.type === 's') {
    const s = byId.get(r.id);
    const lv = levels.find((l) => l.id === r.level);
    const conns = s.levels?.connects?.connections || [];
    const wiring = lv.scene === 'wiring';
    scene.focus([s.id], { context: wiring ? conns.map((c) => c.id) : [], activity: lv.scene === 'activity' });
    scene.setArcs(wiring ? conns.map((c) => arcFor(s.id, c)) : []);
    scene.forceSlice(!!s.slice);
    if (wiring) fly([s.id, ...conns.map((c) => c.id)], s.view, `${s.id}:wiring`);
    else fly([s.id], s.view, `${s.id}`);
    explainerEl.innerHTML = renderStructure(s, r.level, sourceOf.get(s.id));
    if (prev.type !== 's' || prev.id !== r.id) explainerEl.scrollTop = 0;
  } else if (r.type === 'library') {
    clearScene('library');
    if (prev.type !== 'library') {
      libraryEl.querySelector('#lib-body').innerHTML = renderLibraryBody(state.libQuery);
      libraryEl.scrollTop = 0;
    }
  } else if (r.type === 'p') {
    const p = pathways.find((q) => q.id === r.id);
    const st = p.steps[r.step];
    const past = p.steps.slice(0, r.step);
    const pastIds = past.flatMap((x) => [...(x.focus || []), ...routeEndpoints(x.route)]);
    const currentIds = [...(st.focus || []), ...routeEndpoints(st.route)];
    const context = [...new Set([...pastIds, ...currentIds])];
    scene.focus(st.focus || [], { context, activity: true, ambient: true });
    scene.setArcs([
      ...past.flatMap((x) => (x.route || []).map((arc) => normalizeArc(arc, 'ambient'))),
      ...(st.route || []).map((arc) => normalizeArc(arc, true)),
    ]);
    scene.forceSlice(!!st.slice);
    const frame = [...new Set(currentIds)];
    fly(frame, st.view || 'left', `${p.id}:${r.step}`);
    explainerEl.innerHTML = renderPathway(p, r.step, state.playing);
    if (prev.type !== 'p' || prev.id !== r.id) explainerEl.scrollTop = 0;
  } else if (r.type === 'ask') {
    applyAsk(r);
  }
  if (['home', 's', 'chemhome', 'chem', 'cellhome', 'cell'].includes(r.type)) drawSidebar();
}

function applyAsk(r) {
  const key = `ask:${r.query.toLowerCase()}`;
  if (!r.query) {
    clearScene('ask');
    explainerEl.innerHTML = renderAsk();
    return;
  }
  const hit = cached(r.query);
  if (hit) {
    explainerEl.innerHTML = renderAsk({ query: r.query, result: hit });
    if (hit.status === 'ok') showSketch(hit, key); else clearScene(key);
    return;
  }
  clearScene(key);
  explainerEl.innerHTML = renderAsk({ query: r.query, loading: true });
  ask(r.query).then((res) => {
    if (state.route.type !== 'ask' || state.route.query !== r.query) return;
    explainerEl.innerHTML = renderAsk({ query: r.query, result: res });
    if (res.status === 'ok') { state.flown = ''; showSketch(res, key); }
  });
}


function drawSidebar() {
  const selected = state.route.type === 's' ? state.route.id
                 : state.route.type === 'chem' ? state.route.id
                 : state.route.type === 'cell' ? state.route.id
                 : null;
  renderSidebar(listEl, { dict: state.dict, selected, query: state.query });
  listEl.querySelector('.is-on')?.scrollIntoView({ block: 'nearest' });
}

// ---------------------------------------------------------------- pathway player
function stepTo(i) {
  const r = state.route;
  if (r.type !== 'p') return;
  const p = pathways.find((q) => q.id === r.id);
  const n = Math.min(Math.max(i, 0), p.steps.length - 1);
  location.hash = `#/p/${p.id}/${n}`;
}
function stopPlay() {
  if (timer) clearInterval(timer);
  timer = null;
  state.playing = false;
}
function togglePlay() {
  const r = state.route;
  if (r.type !== 'p') return;
  const p = pathways.find((q) => q.id === r.id);
  if (state.playing) { stopPlay(); apply(); return; }
  state.playing = true;
  if (r.step === p.steps.length - 1) stepTo(0); else apply();
  timer = setInterval(() => {
    const cur = state.route;
    if (cur.type !== 'p' || cur.step >= p.steps.length - 1) { stopPlay(); apply(); return; }
    stepTo(cur.step + 1);
  }, 5200);
}

// ---------------------------------------------------------------- events
window.addEventListener('hashchange', apply);

$('#search').addEventListener('input', (e) => { state.query = e.target.value; drawSidebar(); });
$('#search').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const first = listEl.querySelector('.item');
  if (first) location.hash = first.getAttribute('href');
});

libraryEl.innerHTML = renderLibraryShell();
libraryEl.querySelector('.lib-search-icon').innerHTML = icon('search', 16);
$('#lib-search').addEventListener('input', (e) => {
  state.libQuery = e.target.value;
  $('#lib-body').innerHTML = renderLibraryBody(state.libQuery);
});
$('#lib-search').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const first = libraryEl.querySelector('.lib-item');
  if (first) location.hash = first.getAttribute('href');
});

explainerEl.addEventListener('submit', (e) => {
  const f = e.target.closest('[data-ask]');
  if (!f) return;
  e.preventDefault();
  const q = normalise(f.elements.q.value);
  if (q) location.hash = `#/ask/${encodeURIComponent(q)}`;
});

explainerEl.addEventListener('click', (e) => {
  const rung = e.target.closest('.rung');
  if (rung && state.route.type === 's') {
    location.hash = `#/s/${state.route.id}/${rung.dataset.level}`;
    return;
  }
  const act = e.target.closest('[data-act]')?.dataset.act;
  if (act === 'prev') stepTo(state.route.step - 1);
  if (act === 'next') stepTo(state.route.step + 1);
  if (act === 'play') togglePlay();
  const head = e.target.closest('.step-head');
  if (head) { stopPlay(); stepTo(Number(head.dataset.step)); }
  const stageBtn = e.target.closest('[data-stage]');
  if (stageBtn && state.route.type === 'chem') {
    const stageNum = Number(stageBtn.dataset.stage);
    setStepperStage(stageNum);
    const chem = chemById.get(state.route.id);
    const stepperEl = explainerEl.querySelector('.stepper');
    if (chem && stepperEl) {
      stepperEl.outerHTML = renderSynapseStepper(chem, { stage: stageNum, drugId: state.route.sub });
    }
    return;
  }
  const drugModeBtn = e.target.closest('[data-drug-mode]');
  if (drugModeBtn && state.route.type === 'chem') {
    const isAct = drugModeBtn.dataset.drugMode === 'active';
    setDrugMode(isAct);
    const chem = chemById.get(state.route.id);
    const stepperEl = explainerEl.querySelector('.stepper');
    if (chem && stepperEl) {
      stepperEl.outerHTML = renderSynapseStepper(chem, { stage: getStepperStage(), drugId: state.route.sub });
    }
    return;
  }
  const playStepperBtn = e.target.closest('[data-play-stepper]');
  if (playStepperBtn && state.route.type === 'chem') {
    const chem = chemById.get(state.route.id);
    toggleStepperPlay((nextStage) => {
      const stepperEl = explainerEl.querySelector('.stepper');
      if (chem && stepperEl) {
        stepperEl.outerHTML = renderSynapseStepper(chem, { stage: nextStage, drugId: state.route.sub });
      }
    });
    return;
  }
  if (act === 'cell-fire' && state.route.type === 'cell') {
    cellFireActive = !cellFireActive;
    scene.setCellFire(cellFireActive);
    const cell = cellById.get(state.route.id);
    if (cell) {
      explainerEl.innerHTML = renderCell(cell, state.route.tab, cellFireActive);
    }
    return;
  }
});

// Glossary tooltips
function showTip(el) {
  if (!tipEl || !el) return;
  const g = findTerm(el.dataset.term);
  if (!g) return;
  const title = g.term.charAt(0).toUpperCase() + g.term.slice(1);
  tipEl.innerHTML = `<strong>${esc(title)}</strong>${esc(g.def)}`;
  const r = el.getBoundingClientRect();
  tipEl.classList.add('is-on');
  const w = tipEl.offsetWidth;
  const h = tipEl.offsetHeight;
  const left = Math.min(window.innerWidth - w - 12, Math.max(12, r.left + r.width / 2 - w / 2));
  const above = r.top - h - 10;
  const top = above > 8 ? above : Math.min(window.innerHeight - h - 12, r.bottom + 10);
  tipEl.style.transform = `translate(${left}px, ${top}px)`;
}
document.addEventListener('mouseover', (e) => {
  const t = e.target.closest('.term');
  if (t) showTip(t);
});
document.addEventListener('mouseout', (e) => {
  const t = e.target.closest('.term');
  if (t && !t.contains(e.relatedTarget)) {
    tipEl.classList.remove('is-on');
  }
});
document.addEventListener('focusin', (e) => {
  const t = e.target.closest('.term');
  if (t) showTip(t);
});
document.addEventListener('focusout', (e) => {
  const t = e.target.closest('.term');
  if (t && !t.contains(e.relatedTarget)) {
    tipEl.classList.remove('is-on');
  }
});
window.addEventListener('scroll', () => tipEl.classList.remove('is-on'), { passive: true });
explainerEl.addEventListener('scroll', () => tipEl.classList.remove('is-on'), { passive: true });

// Toolbar
const toolbar = $('#toolbar');
toolbar.innerHTML = `
  <button class="tb" data-tool="reset">${icon('reset')}<span>Reset</span></button>
  <button class="tb" data-tool="slice">${icon('slice')}<span>Slice</span></button>
  <button class="tb" data-tool="spin">${icon('spin')}<span>Spin</span></button>`;
function syncToolbar() {
  toolbar.querySelector('[data-tool="slice"]').classList.toggle('is-on', scene.slice);
  toolbar.querySelector('[data-tool="spin"]').classList.toggle('is-on', scene.spin);
}
toolbar.addEventListener('click', (e) => {
  const t = e.target.closest('[data-tool]')?.dataset.tool;
  if (t === 'reset') {
    state.flown = '';
    const type = state.route.type;
    if ((type === 'home' || type === 's') && location.hash && location.hash !== '#/') location.hash = '#/';
    else apply();
  }
  if (t === 'slice') scene.setSlice(!scene.slice);
  if (t === 'spin') scene.setSpin(!scene.spin);
  syncToolbar();
});
$('#brain').addEventListener('pointerdown', () => setTimeout(syncToolbar, 0));
$('#search-icon').innerHTML = icon('search', 16);

// Keyboard: ↑/↓ move through parts/chemicals/cells (or steps), ←/→ change level/tab
function orderedIds() {
  const out = [];
  for (const g of groups) {
    const inGroup = structures.filter((s) => s.group === g.id);
    const walk = (s) => { out.push(s.id); inGroup.filter((c) => c.parent === s.id).forEach(walk); };
    inGroup.filter((s) => !s.parent || !inGroup.some((p) => p.id === s.parent)).forEach(walk);
  }
  return out;
}

function orderedChemIds() {
  const out = [];
  for (const g of chemicalGroups) {
    chemicals.filter((c) => c.group === g.id).forEach((c) => out.push(c.id));
  }
  return out;
}

function orderedCellIds() {
  const out = [];
  for (const g of cellGroups) {
    cells.filter((c) => c.group === g.id).forEach((c) => out.push(c.id));
  }
  return out;
}

const CHEM_TABS = ['overview', 'tracts', 'synapse', 'medicine'];
const CELL_TABS = ['shape', 'fires', 'lives', 'chem'];

window.addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
  const r = state.route;
  if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && ['home', 's', 'p', 'chem', 'chemhome', 'cell', 'cellhome'].includes(r.type)) {
    e.preventDefault();
    const d = e.key === 'ArrowDown' ? 1 : -1;
    if (r.type === 'p') { stopPlay(); stepTo(r.step + d); return; }
    if (r.type === 'chem' || r.type === 'chemhome') {
      const ids = orderedChemIds();
      if (!ids.length) return;
      const i = r.type === 'chem' ? ids.indexOf(r.id) : -1;
      const next = ids[(i + d + ids.length) % ids.length];
      location.hash = `#/chem/${next}/${r.type === 'chem' ? r.tab : 'overview'}`;
      return;
    }
    if (r.type === 'cell' || r.type === 'cellhome') {
      const ids = orderedCellIds();
      if (!ids.length) return;
      const i = r.type === 'cell' ? ids.indexOf(r.id) : -1;
      const next = ids[(i + d + ids.length) % ids.length];
      location.hash = `#/cell/${next}/${r.type === 'cell' ? r.tab : 'shape'}`;
      return;
    }
    const ids = orderedIds();
    const i = r.type === 's' ? ids.indexOf(r.id) : -1;
    const next = ids[(i + d + ids.length) % ids.length];
    location.hash = `#/s/${next}/${r.type === 's' ? r.level : levels[0].id}`;
  }
  if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && r.type === 's') {
    e.preventDefault();
    const i = levels.findIndex((l) => l.id === r.level);
    const n = Math.min(Math.max(i + (e.key === 'ArrowRight' ? 1 : -1), 0), levels.length - 1);
    location.hash = `#/s/${r.id}/${levels[n].id}`;
  }
  if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && r.type === 'chem') {
    e.preventDefault();
    const i = CHEM_TABS.indexOf(r.tab);
    const n = Math.min(Math.max((i === -1 ? 0 : i) + (e.key === 'ArrowRight' ? 1 : -1), 0), CHEM_TABS.length - 1);
    location.hash = `#/chem/${r.id}/${CHEM_TABS[n]}`;
  }
  if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && r.type === 'cell') {
    e.preventDefault();
    const i = CELL_TABS.indexOf(r.tab);
    const n = Math.min(Math.max((i === -1 ? 0 : i) + (e.key === 'ArrowRight' ? 1 : -1), 0), CELL_TABS.length - 1);
    location.hash = `#/cell/${r.id}/${CELL_TABS[n]}`;
  }
  if (e.key === 'Escape') {
    if (r.type === 'p') location.hash = '#/pathways';
    else if (r.type === 'ask' && r.query) location.hash = '#/ask';
    else if (r.type === 'chem') location.hash = '#/chem';
    else if (r.type === 'cell') location.hash = '#/cell';
    else if (r.type === 'chemhome' || r.type === 'cellhome') location.hash = '#/';
    else if (r.type !== 'home') location.hash = '#/';
  }
  if (e.key === ' ' && r.type === 'p') { e.preventDefault(); togglePlay(); }
});

apply();
syncToolbar();
