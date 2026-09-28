// Cell UI: Shape, Firing (animation), Location (where it lives), and Chemistry.
import { cells, cellGroups, byId, chemicals, diagrams } from '../content/index.js';
import { getCellTabs } from '../content/cell-tabs.js';
import { fmt, paragraphs, esc } from './format.js';
import { renderLadder } from './ladder.js';
import { renderCircuit, LINK_COLORS } from './diagrams.js';
import { icon } from './icons.js';

function bullets(list) {
  if (!list?.length) return '';
  return `<ul class="bullets">${list.map((b) => `<li>${fmt(b)}</li>`).join('')}</ul>`;
}

function partChips(ids = []) {
  if (!ids.length) return '';
  return `<span class="chips">${ids.map((id) => {
    const s = byId.get(id);
    if (!s) return `<span class="chip">${esc(id)}</span>`;
    return `<a class="chip" href="#/s/${s.id}" style="--c:${s.color}"><i class="dot"></i>${esc(s.name)}</a>`;
  }).join('')}</span>`;
}

function chemicalChip(chemId) {
  if (!chemId) return `<span class="chip">None (glial support cell)</span>`;
  const ch = chemicals.find((c) => c.id === chemId);
  if (!ch) return `<span class="chip">${esc(chemId)}</span>`;
  return `<a class="chip" href="#/chem/${ch.id}" style="--c:${ch.color}"><i class="dot"></i>${esc(ch.name)}</a>`;
}

export function renderCellHome() {
  return `<article class="ex" style="--accent:#ffd36b">
    <header class="ex-head">
      <span class="crumbs">Atlas / Cells</span>
      <h1 class="ex-title">Brain Cells</h1>
      <p class="tagline">The individual neurons and glia that generate thoughts, store memories, and coordinate the body.</p>
    </header>
    <div class="level">
      <p>The human brain contains about 86 billion neurons and roughly the same number of non-neuronal glial cells. Each specialized cell type brings its own distinctive morphology, firing pattern, and chemical vocabulary.</p>

      <div class="cell-groups-list" style="margin-top:20px;">
        ${cellGroups.map((g) => {
          const list = cells.filter((c) => c.group === g.id);
          return `<section class="group" style="margin-top:20px;">
            <h2 class="group-h" style="font-size:13px; font-weight:600; padding:0 0 4px;">
              ${esc(g.label)}
              <span style="font-weight:400; color:var(--ink-3); font-size:12px; display:block; margin-top:2px;">${esc(g.blurb || '')}</span>
            </h2>
            <div class="chips" style="margin-top:8px;">
              ${list.map((c) => `
                <a class="chip" href="#/cell/${c.id}" style="--c:${c.color}; font-size:13px; padding:6px 12px;">
                  <i class="dot"></i>${esc(c.name)}
                </a>
              `).join('')}
            </div>
          </section>`;
        }).join('')}
      </div>
    </div>
  </article>`;
}

export function renderCell(cell, tabId = 'shape', isFiring = false) {
  const tabs = getCellTabs(cell);
  const activeTab = tabs.some((t) => t.id === tabId) ? tabId : tabs[0].id;
  const group = cellGroups.find((g) => g.id === cell.group) || cellGroups[0];
  const idx = cells.indexOf(cell);
  const prev = cells[idx - 1], next = cells[idx + 1];

  let body = '';

  if (activeTab === 'shape') {
    body = `
      <div class="level">
        ${paragraphs(cell.shape?.text || '')}
        ${bullets(cell.shape?.bullets || [])}

        <div class="cell-meta" style="margin:20px 0; display:grid; gap:12px;">
          ${cell.size ? `
            <div class="meta-row">
              <span class="meta-label" style="font-weight:600; font-size:12.5px; color:var(--ink-2);">Estimated size:</span>
              <span style="color:var(--ink); font-size:13px; margin-left:6px;">${esc(cell.size)}</span>
            </div>` : ''}
          <div class="meta-row">
            <span class="meta-label" style="font-weight:600; font-size:12.5px; color:var(--ink-2); display:block; margin-bottom:4px;">Primary transmitter:</span>
            ${chemicalChip(cell.transmitter)}
          </div>
          <div class="meta-row">
            <span class="meta-label" style="font-weight:600; font-size:12.5px; color:var(--ink-2); display:block; margin-bottom:4px;">Lives in:</span>
            ${partChips(cell.where)}
          </div>
        </div>
      </div>
    `;
  } else if (activeTab === 'fires') {
    const isGlia = cell.group === 'glia';
    body = `
      <div class="level">
        <div class="player" style="margin: 4px 0 16px;">
          <button class="pl-btn pl-play" data-act="cell-fire" aria-label="${isFiring ? 'Pause animation' : 'Animate firing'}">
            ${icon(isFiring ? 'pause' : 'play', 18)}
            <span>${isFiring ? (isGlia ? 'Pause wave' : 'Pause firing') : (isGlia ? 'Animate wave' : 'Animate firing')}</span>
          </button>
        </div>

        ${paragraphs(cell.fires?.text || '')}

        ${cell.fires?.steps?.length ? `
          <h3 style="font-size:13px; font-weight:600; margin:18px 0 8px; color:var(--ink-2);">Sequence of activity</h3>
          <ol class="steps" style="margin-top:8px; list-style:none; padding:0;">
            ${cell.fires.steps.map((st) => `
              <li style="padding:10px 14px; margin-bottom:8px; border-radius:6px; background:rgba(255,255,255,0.03); border:1px solid var(--border);">
                <p style="margin:0; font-size:13.5px; line-height:1.5;">${fmt(st)}</p>
              </li>
            `).join('')}
          </ol>
        ` : ''}
      </div>
    `;
  } else if (activeTab === 'lives') {
    body = `
      <div class="level">
        <p style="margin-bottom:16px; color:var(--ink-2); font-size:14px;">
          Found within the circuits of the following brain regions. The 3D view zooms out to highlight where this cell type lives.
        </p>
        <div style="display:grid; gap:10px; margin-top:12px;">
          ${(cell.where || []).map((id) => {
            const s = byId.get(id);
            if (!s) return '';
            return `
              <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 14px; border-radius:8px; background:rgba(255,255,255,0.03); border:1px solid var(--border);">
                <div>
                  <div style="font-weight:600; font-size:14px; color:var(--ink);">${esc(s.name)}</div>
                  <div style="font-size:12px; color:var(--ink-3); margin-top:2px;">${fmt(s.tagline || '')}</div>
                </div>
                <a class="chip" href="#/s/${s.id}" style="--c:${s.color}; margin-left:12px; white-space:nowrap;">
                  <i class="dot"></i>Open Part
                </a>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  } else if (activeTab === 'chem') {
    const d = cell.diagram && diagrams[cell.diagram];
    body = `
      <div class="level">
        ${paragraphs(cell.chem?.text || '')}

        <div class="chem-meta" style="margin:20px 0; display:grid; gap:14px;">
          ${cell.chem?.receptors?.length ? `
            <div class="meta-row">
              <span class="meta-label" style="font-weight:600; font-size:12.5px; color:var(--ink-2); display:block; margin-bottom:4px;">Receptors expressed:</span>
              <div class="chips">
                ${cell.chem.receptors.map((r) => `<span class="chip">${esc(r)}</span>`).join('')}
              </div>
            </div>` : ''}
          ${cell.chem?.modulatedBy?.length ? `
            <div class="meta-row">
              <span class="meta-label" style="font-weight:600; font-size:12.5px; color:var(--ink-2); display:block; margin-bottom:4px;">Modulated by:</span>
              <div class="chips">
                ${cell.chem.modulatedBy.map((modId) => {
                  const ch = chemicals.find((c) => c.id === modId);
                  if (!ch) return `<span class="chip">${esc(modId)}</span>`;
                  return `<a class="chip" href="#/chem/${ch.id}" style="--c:${ch.color}"><i class="dot"></i>${esc(ch.name)}</a>`;
                }).join('')}
              </div>
            </div>` : ''}
        </div>

        ${d ? `
          <figure class="fig" style="margin-top:22px;">
            <figcaption class="fig-title">${esc(d.title)}</figcaption>
            ${renderCircuit(d, cell.diagram)}
            <div class="legend">${Object.entries(LINK_COLORS).map(([k, c]) => `<span><i style="--c:${c}" class="lg-${k}"></i>${{ excite: 'Excites', inhibit: 'Inhibits', modulate: 'Modulates' }[k]}</span>`).join('')}</div>
            <p class="fig-caption">${fmt(d.caption)}</p>
          </figure>
        ` : ''}
      </div>
    `;
  }

  return `<article class="ex" style="--accent:${cell.color}">
    <nav class="crumbs">
      <a href="#/cell">Cells</a>
      <span class="sep">/</span>
      <span>${esc(group.label)}</span>
    </nav>
    <h1 class="ex-title">${esc(cell.name)}</h1>
    <p class="tagline">${fmt(cell.tagline || '')}</p>
    ${cell.analogy ? `<p class="analogy"><span class="analogy-lead">Think of it as</span> ${fmt(cell.analogy)}</p>` : ''}
    ${renderLadder(tabs, activeTab, { hrefPrefix: `#/cell/${cell.id}` })}
    <section class="level" data-level="${activeTab}">
      <h2 class="level-title">${esc(tabs.find((t) => t.id === activeTab)?.scale || activeTab)}</h2>
      ${body}
    </section>
    ${cell.breaks?.text ? `
      <section class="extra">
        <h3>${icon('alert', 18)} When it goes wrong</h3>
        ${paragraphs(cell.breaks.text) + bullets(cell.breaks.bullets)}
      </section>
    ` : ''}
    <footer class="pager">
      ${prev ? `<a href="#/cell/${prev.id}/${activeTab}" class="pg">${icon('prev', 16)}<span>${esc(prev.name)}</span></a>` : '<span></span>'}
      ${next ? `<a href="#/cell/${next.id}/${activeTab}" class="pg pg-next"><span>${esc(next.name)}</span>${icon('next', 16)}</a>` : '<span></span>'}
    </footer>
  </article>`;
}
