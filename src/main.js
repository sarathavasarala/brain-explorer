import { structures, byId, groups, levels, pathways, anchors, validate, sourceOf } from './content/index.js';
import { createBrainScene } from './scene/brain-scene.js';
import { renderSidebar } from './ui/sidebar.js';
import { renderStructure, renderPathway, renderHome } from './ui/explainer.js';
import { findTerm, esc } from './ui/format.js';
import { icon } from './ui/icons.js';

const $ = (sel) => document.querySelector(sel);
const listEl = $('#list');
const explainerEl = $('#explainer');
const hoverEl = $('#hover-label');
const tipEl = $('#tip');

const problems = validate();
if (problems.length) console.warn(`[brain] ${problems.length} content problem(s):\n` + problems.join('\n'));

const state = { tab: 'structures', query: '', route: { type: 'home' }, playing: false, flown: '' };
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
function parseHash() {
  const [type, id, extra] = location.hash.replace(/^#\/?/, '').split('/');
  if (type === 's' && byId.has(id)) {
    return { type: 's', id, level: levels.some((l) => l.id === extra) ? extra : levels[0].id };
  }
  if (type === 'p' && pathways.some((p) => p.id === id)) {
    const p = pathways.find((q) => q.id === id);
    return { type: 'p', id, step: Math.min(Math.max(parseInt(extra, 10) || 0, 0), p.steps.length - 1) };
  }
  return { type: 'home' };
}

function arcFor(from, c) {
  const incoming = c.dir === 'in';
  return { from: incoming ? c.id : from, to: incoming ? from : c.id, flow: c.dir === 'both' ? 'both' : 'forward' };
}

function fly(ids, view, key) {
  if (state.flown === key) return;
  state.flown = key;
  scene.flyTo(ids, view);
}

function apply() {
  const prev = state.route;
  const r = (state.route = parseHash());
  if (r.type !== 'p') stopPlay();

  if (r.type === 'home') {
    scene.focus([]);
    scene.setArcs([]);
    scene.forceSlice(false);
    fly([], 'left', 'home');
    explainerEl.innerHTML = renderHome();
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
  } else {
    const p = pathways.find((q) => q.id === r.id);
    const st = p.steps[r.step];
    const past = p.steps.slice(0, r.step);
    const context = [...new Set([...past.flatMap((x) => [...(x.focus || []), ...(x.route || []).flat()]), ...(st.route || []).flat()])];
    scene.focus(st.focus || [], { context, activity: true });
    scene.setArcs([
      ...past.flatMap((x) => (x.route || []).map(([a, b]) => ({ from: a, to: b, active: false }))),
      ...(st.route || []).map(([a, b]) => ({ from: a, to: b })),
    ]);
    scene.forceSlice(!!st.slice);
    const frame = [...new Set([...(st.focus || []), ...(st.route || []).flat()])];
    fly(frame, st.view || 'left', `${p.id}:${r.step}`);
    explainerEl.innerHTML = renderPathway(p, r.step, state.playing);
    if (prev.type !== 'p' || prev.id !== r.id) explainerEl.scrollTop = 0;
    if (r.type === 'p' && state.tab !== 'pathways') setTab('pathways', false);
  }
  if (r.type === 's' && state.tab !== 'structures') setTab('structures', false);
  drawSidebar();
}

function drawSidebar() {
  const sel = state.route.type === 'home' ? null : state.route.id;
  renderSidebar(listEl, { tab: state.tab, selected: sel, query: state.query });
  listEl.querySelector('.is-on')?.scrollIntoView({ block: 'nearest' });
}

function setTab(tab, redraw = true) {
  state.tab = tab;
  document.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('is-on', b.dataset.tab === tab));
  $('#search').placeholder = tab === 'pathways' ? 'Search pathways' : 'Search parts of the brain';
  if (redraw) drawSidebar();
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

document.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab)));
$('#search').addEventListener('input', (e) => { state.query = e.target.value; drawSidebar(); });

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
  if (t === 'reset') { state.flown = ''; if (location.hash && location.hash !== '#/') location.hash = '#/'; else apply(); }
  if (t === 'slice') scene.setSlice(!scene.slice);
  if (t === 'spin') scene.setSpin(!scene.spin);
  syncToolbar();
});
$('#brain').addEventListener('pointerdown', () => setTimeout(syncToolbar, 0));
$('#search-icon').innerHTML = icon('search', 16);

// Keyboard: ↑/↓ move through parts (or steps), ←/→ change level
function orderedIds() {
  const out = [];
  for (const g of groups) {
    const inGroup = structures.filter((s) => s.group === g.id);
    const walk = (s) => { out.push(s.id); inGroup.filter((c) => c.parent === s.id).forEach(walk); };
    inGroup.filter((s) => !s.parent || !inGroup.some((p) => p.id === s.parent)).forEach(walk);
  }
  return out;
}
window.addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
  const r = state.route;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    const d = e.key === 'ArrowDown' ? 1 : -1;
    if (r.type === 'p') { stopPlay(); stepTo(r.step + d); return; }
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
  if (e.key === 'Escape') location.hash = '#/';
  if (e.key === ' ' && r.type === 'p') { e.preventDefault(); togglePlay(); }
});

setTab('structures', false);
apply();
syncToolbar();
