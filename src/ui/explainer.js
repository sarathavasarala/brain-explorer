import { structures, byId, groups, levels, diagrams, synapses, pathways, anchorById, chemicals, cells } from '../content/index.js';
import { STATE_METADATA } from '../content/states.js';
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

import { renderLadder } from './ladder.js';

function ladder(active, { interactive = true } = {}) {
  return renderLadder(levels, active, { interactive });
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
      <figcaption class="fig-title">Main chemical messenger: <span class="chem-messenger-name" style="--c:${syn.color}">${esc(syn.name)}</span></figcaption>
      ${renderSynapse(syn)}
      <p class="fig-caption">${fmt(syn.blurb)}</p>
    </figure>`;
  }
  return html;
}

export function renderStateSwitcher(s, levelId, activeStateKind, file) {
  const states = s.breaks?.states || [];
  if (!states.length) {
    return s.breaks?.text
      ? paragraphs(s.breaks.text) + bullets(s.breaks.bullets)
      : todo(`${file} → ${s.id}.breaks`);
  }

  const activeState = states.find((st) => st.kind === activeStateKind);

  const pillsHtml = `
    <div class="state-pills" role="tablist" aria-label="What if perturbation states">
      ${states.map((st) => {
        const meta = STATE_METADATA[st.kind] || { label: st.kind, symbol: '•', color: '#8b9bb4' };
        const isActive = st.kind === activeStateKind;
        const targetHref = isActive ? `#/s/${s.id}/${levelId}` : `#/s/${s.id}/${levelId}/${st.kind}`;
        return `
          <a class="state-pill ${isActive ? 'is-active' : ''} state-pill-${st.kind}"
             href="${targetHref}"
             role="tab"
             aria-selected="${isActive}"
             title="${esc(meta.question || meta.label)}"
             style="--state-color:${meta.color}">
            <span class="state-pill-dot" aria-hidden="true"></span>
            <span class="state-pill-label">${esc(st.title || meta.label)}</span>
            ${isActive ? `<span class="state-pill-close" title="Reset to baseline view" aria-hidden="true">&times;</span>` : ''}
          </a>
        `;
      }).join('')}
    </div>
  `;

  let detailsHtml = '';
  if (activeState) {
    const meta = STATE_METADATA[activeState.kind] || { label: activeState.kind, color: '#8b9bb4' };
    const rippleList = activeState.ripple || [];
    const roleLabels = {
      cut_off: 'Cut off',
      more_active: 'Hyperactive',
      less_active: 'Hypoactive',
      losing_cells: 'Losing cells',
      involved: 'Involved',
      typical: 'Baseline',
    };

    detailsHtml = `
      <div class="state-card" style="--state-color:${meta.color}">
        <div class="state-card-header">
          <span class="state-badge"><i class="state-badge-dot"></i>${esc(meta.tag || meta.label)} in 3D</span>
          <a class="state-reset-link" href="#/s/${s.id}/${levelId}">Reset view</a>
        </div>
        <div class="state-body">
          ${paragraphs(activeState.text)}
        </div>
        ${activeState.signs?.length ? `
          <div class="state-signs">
            <h4 class="state-subhead">Observable signs</h4>
            <ul class="bullets">${activeState.signs.map((b) => `<li>${fmt(b)}</li>`).join('')}</ul>
          </div>
        ` : ''}
        ${activeState.case ? `
          <div class="case-card">
            <div class="case-badge">Case Record</div>
            <h4 class="case-title">${esc(activeState.case.name)}</h4>
            <p class="case-text">${fmt(activeState.case.text)}</p>
          </div>
        ` : ''}
        ${rippleList.length ? `
          <div class="ripple-section">
            <h4 class="state-subhead">Circuit ripple</h4>
            <div class="chips">${rippleList.map((r) => {
              const rName = nameOf(r.id);
              const rColor = colorOf(r.id);
              const rRole = roleLabels[r.role] || r.role;
              return `<a class="chip chip-ripple role-${r.role}" href="#/s/${r.id}/${levelId}" style="--c:${rColor}">
                <i class="dot"></i>
                <span class="ripple-name">${esc(rName)}</span>
                <span class="ripple-role">${esc(rRole)}</span>
              </a>`;
            }).join('')}</div>
          </div>
        ` : ''}
      </div>
    `;
  } else {
    detailsHtml = `
      <div class="state-idle">
        <p class="state-idle-hint">Choose a condition above to observe how this region and its partners change in 3D:</p>
        ${bullets(s.breaks?.bullets)}
      </div>
    `;
  }

  return `
    ${s.breaks?.text ? `<p class="breaks-lead">${fmt(s.breaks.text)}</p>` : ''}
    ${pillsHtml}
    ${detailsHtml}
  `;
}

export function renderStructure(s, levelId, source, activeStateKind = null) {
  const level = levels.find((l) => l.id === levelId) || levels[0];
  const L = s.levels?.[level.id] || {};
  const g = groupOf(s);
  const parent = s.parent && byId.get(s.parent);
  const kids = childrenOf(s.id);
  const idx = structures.indexOf(s);
  const prev = structures[idx - 1], next = structures[idx + 1];
  const file = source || 'src/content/structures/…';
  const makes = chemicals.filter((c) => c.madeIn?.includes(s.id));

  let body = L.text ? paragraphs(L.text) : todo(`${file} → ${s.id}.levels.${level.id}.text`);
  body += bullets(L.bullets);
  if (level.id === 'connects') body += connectionRows(s);
  if (level.id === 'cells') {
    const actingChems = chemicals.filter((c) => c.density && c.density[s.id]);
    if (actingChems.length) {
      body += `<div class="cell-zoom-row">
        <h3 class="cell-zoom-h">Chemicals that act here</h3>
        <div class="chips">${actingChems.map((c) => {
          const recs = (c.receptors || []).filter((r) => r.where?.includes(s.id)).map((r) => r.id);
          const recText = recs.length ? ` (${recs.join(', ')})` : '';
          return `<a class="chip" href="#/chem/${c.id}" style="--c:${c.color}"><i class="dot"></i>${esc(c.name)}${recText ? `<span class="chip-sub">${esc(recText)}</span>` : ''}</a>`;
        }).join('')}</div>
      </div>`;
    }
    const residentCells = cells.filter((c) => c.where?.includes(s.id));
    if (residentCells.length) {
      body += `<div class="cell-zoom-row">
        <h3 class="cell-zoom-h">Cells found here</h3>
        <div class="chips">${residentCells.map((c) => `<a class="chip" href="#/cell/${c.id}/shape" style="--c:${c.color}"><i class="dot"></i>${esc(c.name)}</a>`).join('')}</div>
      </div>`;
    }
    body += cellsFigure(L);
  }
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
    ${makes.length ? `<div class="part-makes-row"><span class="part-makes-lead">Makes:</span> <span class="chips">${makes.map((c) => `<a class="chip chip-sm" href="#/chem/${c.id}" style="--c:${c.color}"><i class="dot"></i>${esc(c.name)}</a>`).join('')}</span></div>` : ''}
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
    <section class="extra breaks-section">
      <h3>${icon('alert', 18)} When it goes wrong</h3>
      ${renderStateSwitcher(s, level.id, activeStateKind, file)}
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

export function renderPathwayMobile(p, step, playing) {
  const st = p.steps[step];
  const accent = colorOf(st.focus?.[0]);
  const last = step === p.steps.length - 1;
  const up = last ? nextPathway(p) : null;
  return `<article class="ex ex-path-mobile" style="--accent:${accent}">
    <div class="mobile-tour-progress" aria-hidden="true">
      ${p.steps.map((_, i) => `<span class="${i < step ? 'is-done' : i === step ? 'is-on' : ''}"></span>`).join('')}
    </div>
    <div class="mobile-tour-header">
      <a class="mobile-tour-back" href="#/pathways">${icon('prev', 14)}<span>Pathways</span></a>
      <span class="mobile-tour-step-tag">Step ${step + 1} of ${p.steps.length}</span>
    </div>
    <div class="mobile-tour-path-name">${esc(p.name)}</div>
    <h2 class="mobile-story-title">${esc(st.title)}</h2>
    <div class="mobile-story-body">
      ${st.text ? paragraphs(st.text) : ''}
    </div>
    <div class="chips">
      ${(st.focus || []).map((id) => byId.has(id)
        ? `<a class="chip" href="#/s/${id}" style="--c:${colorOf(id)}"><i></i>${esc(nameOf(id))}</a>`
        : `<span class="chip" style="--c:${colorOf(id)}"><i></i>${esc(nameOf(id))}</span>`
      ).join('')}
    </div>
    <div class="mobile-tour-controls">
      <button class="mobile-tour-btn" data-act="prev" ${step === 0 ? 'disabled' : ''} aria-label="Previous step">
        ${icon('prev', 16)}<span>Prev</span>
      </button>
      <button class="mobile-tour-btn is-play" data-act="play" aria-label="${playing ? 'Pause tour' : 'Play tour'}">
        ${icon(playing ? 'pause' : 'play', 16)}<span>${playing ? 'Pause' : 'Play'}</span>
      </button>
      <button class="mobile-tour-btn" data-act="next" ${last ? 'disabled' : ''} aria-label="Next step">
        <span>Next</span>${icon('next', 16)}
      </button>
    </div>
    ${up ? `<a class="upnext" href="#/p/${up.id}" style="--c:${colorOf(up.steps[0]?.focus?.[0])}; margin-top: 14px;">
      <span class="upnext-lead"><span>Up next</span>${icon('next', 15)}</span>
      <span class="upnext-name">${esc(up.name)}</span>
      <span class="upnext-tag">${fmt(up.tagline || '')}</span>
      ${routeStrip(up)}
    </a>` : ''}
  </article>`;
}

export function renderPathway(p, step, playing, { isMobile = false } = {}) {
  if (isMobile) {
    return renderPathwayMobile(p, step, playing);
  }
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

export function renderHome({ canAsk = true } = {}) {
  const starts = ['cerebellum', 'hippocampus', 'prefrontal-cortex', 'amygdala', 'motor-cortex', 'visual-cortex'].filter((id) => byId.has(id));
  const featuredPathways = ['seeing', 'moving', 'pain', 'fear', 'hearing-speech']
    .map((id) => pathways.find((p) => p.id === id))
    .filter(Boolean);
  return `<article class="ex ex-home" style="--accent:#c77dff">
    <h1 class="ex-title">A map of the brain</h1>
    <p class="tagline">Pick a part to explore, or select something glowing in the model.</p>
    <p class="lede">The brain is roughly 86 billion neurons wired into regions that each do a few jobs well.
      Every part in this explorer can be seen at four levels, from the region you could point to on a scan,
      down to the cells and chemicals doing the work.</p>
    ${ladder(null, { interactive: false })}
    <dl class="ladder-key">
      ${levels.map((l) => `<div><dt>${esc(l.label)}</dt><dd>${esc({ where: 'Its location, shape and landmarks.', does: 'The jobs it handles and what you would notice without it.', connects: 'Who it talks to. The model animates the traffic.', cells: 'The cell types, wiring and chemical messengers inside.' }[l.id] || l.size)}</dd></div>`).join('')}
    </dl>
    <h3 class="home-h">Explore key brain regions</h3>
    <div class="chips">${starts.map((id) => { const s = byId.get(id); return `<a class="chip" href="#/s/${id}" style="--c:${s.color}"><i></i>${esc(s.name)}</a>`; }).join('')}</div>
    <h3 class="home-h">Follow a guided pathway</h3>
    <div class="chips">${featuredPathways.map((p) => `<a class="chip chip-path" href="#/p/${p.id}">${icon('pathway', 14)}${esc(p.name)}</a>`).join('')}<a class="chip chip-path" href="#/pathways">See all ${pathways.length} pathways</a></div>
    ${canAsk ? `<h3 class="home-h">Or ask a question</h3>
    <div class="chips"><a class="chip chip-path" href="#/ask">What happens in the brain when…</a></div>` : ''}
    <p class="controls-hint">Drag to rotate · scroll to zoom · right-drag to pan · <kbd>↑</kbd><kbd>↓</kbd> move through parts · <kbd>←</kbd><kbd>→</kbd> change level</p>
  </article>`;
}
