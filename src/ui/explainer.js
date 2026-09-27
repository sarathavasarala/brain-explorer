import { structures, byId, groups, levels, diagrams, synapses, pathways, anchorById } from '../content/index.js';
import { fmt, paragraphs, esc } from './format.js';
import { renderCircuit, renderSynapse, LINK_COLORS } from './diagrams.js';
import { icon } from './icons.js';

const groupOf = (s) => groups.find((g) => g.id === s.group);
const childrenOf = (id) => structures.filter((s) => s.parent === id);
const nameOf = (id) => byId.get(id)?.name || anchorById.get(id)?.name || id;
const colorOf = (id) => byId.get(id)?.color || anchorById.get(id)?.color || '#fff';

function todo(path) {
  return `<p class="todo">Not written yet. Fill in <code>${esc(path)}</code>.</p>`;
}

function bullets(list) {
  if (!list?.length) return '';
  return `<ul class="bullets">${list.map((b) => `<li>${fmt(b)}</li>`).join('')}</ul>`;
}

function ladder(active, { interactive = true } = {}) {
  return `<div class="ladder" role="tablist" aria-label="Level of detail">
    ${levels.map((l, i) => `
      <button class="rung ${l.id === active ? 'is-on' : ''}" role="tab" aria-selected="${l.id === active}" data-level="${l.id}" ${interactive ? '' : 'tabindex="-1"'}>
        <span class="rung-icon">${icon(l.icon, 18)}</span>
        <span class="rung-label">${esc(l.label)}</span>
        <span class="rung-scale">${esc(l.scale)}</span>
        ${i < levels.length - 1 ? '<span class="rung-line"></span>' : ''}
      </button>`).join('')}
  </div>`;
}

function connectionRows(s) {
  const list = s.levels?.connects?.connections || [];
  if (!list.length) return '';
  const fallback = { in: 'Sends signals here', out: 'Receives signals from here', both: 'Signals flow both ways' };
  return `<ul class="links">${list.map((c) => `
    <li>
      <span class="dir dir-${c.dir}" title="${c.dir === 'in' ? 'Incoming' : c.dir === 'out' ? 'Outgoing' : 'Two-way'}">${icon(c.dir, 16)}</span>
      <a class="xref" href="#/s/${c.id}" style="--c:${colorOf(c.id)}">${esc(nameOf(c.id))}</a>
      <span class="link-note ${c.label ? '' : 'dim'}">${fmt(c.label || fallback[c.dir])}</span>
    </li>`).join('')}</ul>`;
}

function cellsFigure(cells) {
  const d = diagrams[cells?.diagram];
  const syn = synapses[cells?.synapse];
  let html = '';
  if (d) {
    html += `<figure class="fig">
      <figcaption class="fig-title">${esc(d.title)}</figcaption>
      ${renderCircuit(d, cells.diagram)}
      <div class="legend">${Object.entries(LINK_COLORS).map(([k, c]) => `<span><i style="--c:${c}" class="lg-${k}"></i>${{ excite: 'Excites', inhibit: 'Inhibits', modulate: 'Modulates' }[k]}</span>`).join('')}</div>
      <p class="fig-caption">${fmt(d.caption)}</p>
    </figure>`;
  }
  if (syn) {
    html += `<figure class="fig">
      <figcaption class="fig-title">Main chemical messenger: <span style="color:${syn.color}">${esc(syn.name)}</span></figcaption>
      ${renderSynapse(syn)}
      <p class="fig-caption">${fmt(syn.blurb)}</p>
    </figure>`;
  }
  return html;
}

export function renderStructure(s, levelId, source) {
  const level = levels.find((l) => l.id === levelId) || levels[0];
  const L = s.levels?.[level.id] || {};
  const g = groupOf(s);
  const parent = s.parent && byId.get(s.parent);
  const kids = childrenOf(s.id);
  const idx = structures.indexOf(s);
  const prev = structures[idx - 1], next = structures[idx + 1];
  const file = source || 'src/content/structures/…';

  let body = L.text ? paragraphs(L.text) : todo(`${file} → ${s.id}.levels.${level.id}.text`);
  body += bullets(L.bullets);
  if (level.id === 'connects') body += connectionRows(s);
  if (level.id === 'cells') body += cellsFigure(L);
  if (level.id === 'where' && kids.length) {
    body += `<div class="kids"><h3>Areas inside</h3><div class="chips">${kids.map((k) => `<a class="chip" href="#/s/${k.id}/${level.id}" style="--c:${k.color}"><i></i>${esc(k.name)}</a>`).join('')}</div></div>`;
  }

  return `<article class="ex" style="--accent:${s.color}">
    <nav class="crumbs">
      <span>${esc(g?.label || '')}</span>
      ${parent ? `<span class="sep">/</span><a href="#/s/${parent.id}/${level.id}">${esc(parent.name)}</a>` : ''}
    </nav>
    <h1 class="ex-title">${esc(s.name)}</h1>
    <p class="tagline">${fmt(s.tagline || '')}</p>
    ${s.analogy ? `<p class="analogy"><span class="analogy-lead">Think of it as</span> ${fmt(s.analogy)}</p>` : ''}
    ${ladder(level.id)}
    <section class="level" data-level="${level.id}">
      <h2 class="level-title">${esc(level.label)} <span>${esc(level.size)}</span></h2>
      ${body}
    </section>
    <section class="extra">
      <h3>${icon('hand', 18)} Try it yourself</h3>
      ${s.tryIt ? `<p>${fmt(s.tryIt)}</p>` : todo(`${file} → ${s.id}.tryIt`)}
    </section>
    <section class="extra">
      <h3>${icon('alert', 18)} When it goes wrong</h3>
      ${s.breaks?.text ? paragraphs(s.breaks.text) + bullets(s.breaks.bullets) : todo(`${file} → ${s.id}.breaks`)}
    </section>
    <footer class="pager">
      ${prev ? `<a href="#/s/${prev.id}/${level.id}" class="pg">${icon('prev', 16)}<span>${esc(prev.name)}</span></a>` : '<span></span>'}
      ${next ? `<a href="#/s/${next.id}/${level.id}" class="pg pg-next"><span>${esc(next.name)}</span>${icon('next', 16)}</a>` : '<span></span>'}
    </footer>
  </article>`;
}

export function routeStrip(p) {
  let prev = null;
  return `<span class="route" aria-hidden="true">${p.steps.map((st) => {
    const c = colorOf(st.focus?.[0]);
    const dot = `<i style="--c:${c};--p:${prev || c}"></i>`;
    prev = c;
    return dot;
  }).join('')}</span>`;
}

export function nextPathway(p) {
  const same = pathways.filter((q) => q.category === p.category);
  const i = same.indexOf(p);
  if (i < same.length - 1) return same[i + 1];
  const j = pathways.indexOf(p);
  return pathways[(j + 1) % pathways.length];
}

export function renderPathway(p, step, playing) {
  const st = p.steps[step];
  const accent = colorOf(st.focus?.[0]);
  const last = step === p.steps.length - 1;
  const up = last ? nextPathway(p) : null;
  return `<article class="ex ex-path" style="--accent:${accent}">
    <nav class="crumbs"><a class="back" href="#/pathways">${icon('prev', 15)}All pathways</a><span class="sep">/</span><span>${p.steps.length} steps</span></nav>
    <h1 class="ex-title">${esc(p.name)}</h1>
    <p class="tagline">${fmt(p.tagline || '')}</p>
    ${p.summary ? paragraphs(p.summary) : todo(`src/content/pathways/index.js → ${p.id}.summary`)}
    <div class="player">
      <button class="pl-btn" data-act="prev" ${step === 0 ? 'disabled' : ''} aria-label="Previous step">${icon('prev', 18)}</button>
      <button class="pl-btn pl-play" data-act="play" aria-label="${playing ? 'Pause' : 'Play'}">${icon(playing ? 'pause' : 'play', 18)}<span>${playing ? 'Pause' : 'Play'}</span></button>
      <button class="pl-btn" data-act="next" ${step === p.steps.length - 1 ? 'disabled' : ''} aria-label="Next step">${icon('next', 18)}</button>
      <div class="pl-track">${p.steps.map((_, i) => `<span class="${i < step ? 'done' : i === step ? 'on' : ''}"></span>`).join('')}</div>
    </div>
    <ol class="steps">
      ${p.steps.map((s, i) => `
        <li class="step ${i === step ? 'is-on' : ''} ${i < step ? 'is-done' : ''}" data-step="${i}">
          <button class="step-head" data-step="${i}">
            <span class="step-n">${i + 1}</span>
            <span class="step-title">${esc(s.title)}</span>
          </button>
          ${i === step ? `<div class="step-body">
            ${s.text ? paragraphs(s.text) : todo(`src/content/pathways/index.js → ${p.id}.steps[${i}].text`)}
            <div class="chips">${(s.focus || []).map((id) => byId.has(id) ? `<a class="chip" href="#/s/${id}" style="--c:${colorOf(id)}"><i></i>${esc(nameOf(id))}</a>` : `<span class="chip" style="--c:${colorOf(id)}"><i></i>${esc(nameOf(id))}</span>`).join('')}</div>
          </div>` : ''}
        </li>`).join('')}
    </ol>
    ${up ? `<a class="upnext" href="#/p/${up.id}" style="--c:${colorOf(up.steps[0]?.focus?.[0])}">
      <span class="upnext-lead"><span>Up next</span>${icon('next', 16)}</span>
      <span class="upnext-name">${esc(up.name)}</span>
      <span class="upnext-tag">${fmt(up.tagline || '')}</span>
      ${routeStrip(up)}
    </a>` : ''}
  </article>`;
}

export function renderHome() {
  const starts = ['cerebellum', 'hippocampus', 'prefrontal-cortex', 'amygdala'].filter((id) => byId.has(id));
  const featuredPathways = ['seeing', 'hearing-speech', 'moving']
    .map((id) => pathways.find((p) => p.id === id))
    .filter(Boolean);
  return `<article class="ex ex-home" style="--accent:#c77dff">
    <h1 class="ex-title">A map of the brain</h1>
    <p class="tagline">Pick any part on the left, or click something glowing in the model.</p>
    <p class="lede">The brain is roughly 86 billion neurons wired into regions that each do a few jobs well.
      Every part in this explorer can be seen at four levels, from the region you could point to on a scan,
      down to the cells and chemicals doing the work.</p>
    ${ladder(null, { interactive: false })}
    <dl class="ladder-key">
      ${levels.map((l) => `<div><dt>${esc(l.label)}</dt><dd>${esc({ where: 'Its location, shape and landmarks.', does: 'The jobs it handles and what you would notice without it.', connects: 'Who it talks to. The model animates the traffic.', cells: 'The cell types, wiring and chemical messengers inside.' }[l.id] || l.size)}</dd></div>`).join('')}
    </dl>
    <h3 class="home-h">Good places to start</h3>
    <div class="chips">${starts.map((id) => { const s = byId.get(id); return `<a class="chip" href="#/s/${id}" style="--c:${s.color}"><i></i>${esc(s.name)}</a>`; }).join('')}</div>
    <h3 class="home-h">Or follow a pathway</h3>
    <div class="chips">${featuredPathways.map((p) => `<a class="chip chip-path" href="#/p/${p.id}">${icon('pathway', 14)}${esc(p.name)}</a>`).join('')}<a class="chip chip-path" href="#/pathways">See all ${pathways.length}</a></div>
    <h3 class="home-h">Or ask about something else</h3>
    <div class="chips"><a class="chip chip-path" href="#/ask">What happens in the brain when…</a></div>
    <p class="controls-hint">Drag to rotate · scroll to zoom · right-drag to pan · <kbd>↑</kbd><kbd>↓</kbd> move through parts · <kbd>←</kbd><kbd>→</kbd> change level</p>
  </article>`;
}
