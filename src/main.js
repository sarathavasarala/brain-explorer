import { structures, byId, groups, levels, pathways, anchors, validate, sourceOf, chemicals, chemicalGroups, cells, cellGroups, chemById, cellById } from './content/index.js';
import { createBrainScene } from './scene/brain-scene.js';
import { renderSidebar } from './ui/sidebar.js';
import { renderStructure, renderPathway, renderHome } from './ui/explainer.js';
import { renderAsk } from './ui/ask.js';
import { renderLibraryShell, renderLibraryBody } from './ui/library.js';
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

const problems = validate();
if (problems.length) console.warn(`[brain] ${problems.length} content problem(s):\n` + problems.join('\n'));

const state = { query: '', libQuery: '', dict: 'parts', route: { type: 'home' }, playing: false, flown: '' };
let timer = null;

// ---------------------------------------------------------------- scene
const scene = createBrainScene($('#brain'), {
  structures,
  anchors,
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
    searchInput.placeholder = dict === 'chem' ? 'Search chemicals'
      : dict === 'cell' ? 'Search cell types'
      : 'Search parts of the brain';
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

function fly(ids, view, key) {
  if (state.flown === key) return;
  state.flown = key;
  scene.flyTo(ids, view);
}

function clearScene(key) {
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
  setMode(r.type);

  if (r.type === 'home') {
    clearScene('home');
    explainerEl.innerHTML = renderHome();
  } else if (r.type === 'chemhome') {
    clearScene('chemhome');
    explainerEl.innerHTML = renderChemHomePlaceholder();
  } else if (r.type === 'chem') {
    clearScene(r.id);
    explainerEl.innerHTML = renderChemPlaceholder(r);
  } else if (r.type === 'cellhome') {
    clearScene('cellhome');
    explainerEl.innerHTML = renderCellHomePlaceholder();
  } else if (r.type === 'cell') {
    clearScene(r.id);
    explainerEl.innerHTML = renderCellPlaceholder(r);
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

function renderChemHomePlaceholder() {
  return `<article class="ex">
    <header class="ex-head">
      <span class="crumbs">Atlas / Chemicals</span>
      <h1 class="ex-title">Brain Chemicals</h1>
      <p class="tagline">The molecules that carry signals across synapses and shape circuit activity.</p>
    </header>
    <div class="level">
      <p>Chemical directory coming soon. You will be able to explore fast signals, neuromodulators, and hormones across the brain.</p>
    </div>
  </article>`;
}

function renderChemPlaceholder(r) {
  const c = chemById.get(r.id);
  return `<article class="ex">
    <header class="ex-head">
      <span class="crumbs">Atlas / Chemicals</span>
      <h1 class="ex-title">${esc(c?.name || r.id)}</h1>
      <p class="tagline">${esc(c?.tagline || 'Chemical details coming soon.')}</p>
    </header>
    <div class="level">
      <p>Detailed chemical pathways, synapse interactions, and receptor maps coming in Phase 2.</p>
    </div>
  </article>`;
}

function renderCellHomePlaceholder() {
  return `<article class="ex">
    <header class="ex-head">
      <span class="crumbs">Atlas / Cells</span>
      <h1 class="ex-title">Brain Cells</h1>
      <p class="tagline">The individual neurons and glia that build brain circuits.</p>
    </header>
    <div class="level">
      <p>Cell directory coming soon. You will be able to explore 3D neuron morphologies, glia, and cell firing mechanisms.</p>
    </div>
  </article>`;
}

function renderCellPlaceholder(r) {
  const cell = cellById.get(r.id);
  return `<article class="ex">
    <header class="ex-head">
      <span class="crumbs">Atlas / Cells</span>
      <h1 class="ex-title">${esc(cell?.name || r.id)}</h1>
      <p class="tagline">${esc(cell?.tagline || 'Cell details coming soon.')}</p>
    </header>
    <div class="level">
      <p>Interactive 3D cell morphologies and firing animations coming in Phase 4.</p>
    </div>
  </article>`;
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
});

// Glossary tooltips
function showTip(el) {
  const g = findTerm(el.dataset.term);
  if (!g) return;
  tipEl.innerHTML = `<strong>${esc(g.term)}</strong>${esc(g.def)}`;
  const r = el.getBoundingClientRect();
  tipEl.classList.add('is-on');
  const w = tipEl.offsetWidth;
  const left = Math.min(window.innerWidth - w - 12, Math.max(12, r.left + r.width / 2 - w / 2));
  const above = r.top - tipEl.offsetHeight - 10;
  tipEl.style.transform = `translate(${left}px, ${above > 8 ? above : r.bottom + 10}px)`;
}
explainerEl.addEventListener('mouseover', (e) => { const t = e.target.closest('.term'); if (t) showTip(t); });
explainerEl.addEventListener('mouseout', (e) => { if (e.target.closest('.term')) tipEl.classList.remove('is-on'); });
explainerEl.addEventListener('focusin', (e) => { const t = e.target.closest('.term'); if (t) showTip(t); });
explainerEl.addEventListener('focusout', () => tipEl.classList.remove('is-on'));
explainerEl.addEventListener('scroll', () => tipEl.classList.remove('is-on'));

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
    if (type === 'chem') location.hash = '#/chem';
    else if (type === 'cell') location.hash = '#/cell';
    else if ((type === 'home' || type === 's') && location.hash && location.hash !== '#/') location.hash = '#/';
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
