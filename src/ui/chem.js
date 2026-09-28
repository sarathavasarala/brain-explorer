// Chemical UI: Overview, Pathways (tracts), Synapse (stepper), and Medicine (drugs & disorders).
import { chemicals, chemicalGroups, byId } from '../content/index.js';
import { getChemTabs } from '../content/chem-tabs.js';
import { fmt, paragraphs, esc } from './format.js';
import { renderLadder } from './ladder.js';
import { renderSpeedWidget } from './speed.js';
import { renderSynapseStepper, getStepperStage } from './synapse-stepper.js';
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

export function renderChemHome() {
  return `<article class="ex" style="--accent:#b98cff">
    <header class="ex-head">
      <span class="crumbs">Atlas / Chemicals</span>
      <h1 class="ex-title">Brain Chemicals</h1>
      <p class="tagline">The molecules that carry signals across synapses, modulate circuits, and coordinate the body.</p>
    </header>

    <div class="level">
      <p>Chemical messengers bridge the microscopic gaps between neurons. Fast neurotransmitters pass point-to-point electrical commands within milliseconds, neuromodulators tune whole networks over seconds and minutes, and hormones circulate through the bloodstream over hours.</p>

      ${renderSpeedWidget()}

      <div class="chem-groups-list">
        ${chemicalGroups.map((g) => {
          const list = chemicals.filter((c) => c.group === g.id);
          return `<section class="group" style="margin-top:20px;">
            <h2 class="group-h" style="font-size:13px; font-weight:600; padding:0 0 4px;">
              ${esc(g.label)}
              <span style="font-weight:400; color:var(--ink-3); font-size:12px; display:block; margin-top:2px;">${esc(g.blurb || '')}</span>
            </h2>
            <div class="chips" style="margin-top:8px;">
              ${list.length ? list.map((c) => `
                <a class="chip" href="#/chem/${c.id}" style="--c:${c.color}; font-size:13px; padding:6px 12px;">
                  <i class="dot"></i>${esc(c.name)}
                </a>
              `).join('') : '<span class="empty" style="padding:4px 0; font-size:12px;">Hormone directory coming in Phase 5.</span>'}
            </div>
          </section>`;
        }).join('')}
      </div>
    </div>
  </article>`;
}

export function renderChem(chem, tabId = 'overview', sub = null) {
  const tabs = getChemTabs(chem);
  const activeTab = tabs.some((t) => t.id === tabId) ? tabId : tabs[0].id;
  const group = chemicalGroups.find((g) => g.id === chem.group) || chemicalGroups[0];
  const idx = chemicals.indexOf(chem);
  const prev = chemicals[idx - 1], next = chemicals[idx + 1];

  let body = '';

  if (activeTab === 'overview') {
    body = `
      <div class="level">
        ${paragraphs(chem.overview?.text || '')}
        ${bullets(chem.overview?.bullets || [])}

        <div class="chem-meta" style="margin:20px 0; display:grid; gap:12px;">
          <div class="meta-row">
            <span class="meta-label" style="font-weight:600; font-size:12.5px; color:var(--ink-2); display:block; margin-bottom:4px;">Cell bodies located in:</span>
            ${partChips(chem.madeIn)}
          </div>
          ${chem.madeFrom ? `
            <div class="meta-row">
              <span class="meta-label" style="font-weight:600; font-size:12.5px; color:var(--ink-2);">Synthesized from:</span>
              <span style="color:var(--ink); font-size:13px; margin-left:6px;">${esc(chem.madeFrom)}</span>
            </div>` : ''}
          ${chem.pathwayId ? `
            <div class="meta-row" style="margin-top:4px;">
              <a class="chip" href="#/p/${chem.pathwayId}/0" style="--c:${chem.color}; font-weight:500;">
                Take the guided tour: ${esc(chem.name)} pathways →
              </a>
            </div>` : ''}
        </div>

        ${renderSpeedWidget()}
      </div>
    `;
  } else if (activeTab === 'tracts') {
    const tracts = chem.tracts || [];
    body = `
      <div class="level">
        <p style="margin-bottom:16px; color:var(--ink-2); font-size:14px;">
          Primary projection routes where ${esc(chem.name)} is synthesized and delivered across target regions.
        </p>
        ${sub ? `<div style="margin-bottom:12px;"><a class="xref" href="#/chem/${chem.id}/tracts">← Show all pathways</a></div>` : ''}
        <div class="tract-cards">
          ${tracts.map((t) => {
            const on = sub === t.id;
            return `<div class="fig tract-card ${on ? 'is-on' : ''}" style="margin:12px 0; padding:14px; border-radius:12px; ${on ? 'border-color:var(--accent); background:rgba(190,200,255,0.06);' : ''}">
              <div style="display:flex; justify-content:space-between; align-items:baseline; gap:10px; margin-bottom:6px;">
                <a href="#/chem/${chem.id}/tracts/${t.id}" class="fig-title" style="font-size:14px; font-weight:600; color:${on ? 'var(--accent)' : 'inherit'};">
                  ${esc(t.name)}
                </a>
                <a href="#/chem/${chem.id}/tracts/${t.id}" class="xref" style="font-size:11.5px;">${on ? 'Active' : 'Highlight'}</a>
              </div>
              <div style="display:flex; align-items:center; gap:8px; margin:6px 0 10px; font-size:12px;">
                ${partChips([t.from])}
                <span style="color:var(--ink-3);">→</span>
                ${partChips(t.to)}
              </div>
              <p style="font-size:13px; font-weight:500; color:var(--ink); margin:0 0 6px;">
                ${esc(t.job)}
              </p>
              ${paragraphs(t.text)}
              ${t.whenItFails ? `
                <div class="tract-note" style="margin-top:8px; font-size:12px; color:#ffcf6b; line-height:1.4;">
                  <strong>When it fails:</strong> ${esc(t.whenItFails)}
                </div>` : ''}
              ${t.whenBlocked ? `
                <div class="tract-note" style="margin-top:4px; font-size:12px; color:var(--ink-3); line-height:1.4;">
                  <strong>When blocked:</strong> ${esc(t.whenBlocked)}
                </div>` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
  } else if (activeTab === 'synapse') {
    const receptors = chem.receptors || [];
    body = `
      <div class="level">
        ${renderSynapseStepper(chem, { stage: getStepperStage(), drugId: sub })}

        <div class="receptors-section" style="margin-top:24px;">
          <h3 class="fig-title" style="font-size:14px; font-weight:600; margin-bottom:10px;">Receptors</h3>
          <div class="receptors-list" style="display:grid; gap:10px;">
            ${receptors.map((r) => `
              <div class="fig" style="margin:0; padding:12px 14px; border-radius:10px;">
                <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:4px;">
                  <span style="font-weight:600; font-size:13.5px; color:var(--ink);">${esc(r.id)} <span style="font-weight:400; font-size:12px; color:var(--ink-3);">(${esc(r.family)})</span></span>
                  <span class="badge" style="font-size:11px; padding:2px 7px; border-radius:6px; font-weight:500; background:rgba(190,200,255,0.08); color:${r.effect === 'excite' ? '#ffcf6b' : r.effect === 'inhibit' ? '#ff6b7d' : '#b98cff'};">
                    ${r.effect === 'excite' ? 'Excitatory' : r.effect === 'inhibit' ? 'Inhibitory' : 'Modulatory'}
                  </span>
                </div>
                <div style="margin:4px 0 6px;">${partChips(r.where)}</div>
                <p style="font-size:12.5px; color:var(--ink-2); margin:0; line-height:1.45;">${esc(r.text)}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  } else if (activeTab === 'medicine') {
    const drugs = chem.drugs || [];
    body = `
      <div class="level">
        <h3 class="fig-title" style="font-size:14px; font-weight:600; margin-bottom:10px;">Key Drugs & Clinical Agents</h3>
        <div class="drugs-list" style="display:grid; gap:10px; margin-bottom:24px;">
          ${drugs.map((d) => `
            <div class="fig" style="margin:0; padding:12px 14px; border-radius:10px;">
              <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:4px;">
                <span style="font-weight:600; font-size:13.5px; color:var(--ink);">${esc(d.name)}</span>
                <span style="font-size:11.5px; color:var(--ink-3);">Target: ${esc(d.target)}</span>
              </div>
              <p style="font-size:12.5px; color:var(--ink-2); margin:0 0 8px; line-height:1.45;">${esc(d.text)}</p>
              <a class="chip" href="#/chem/${chem.id}/synapse/${d.id}" style="font-size:11.5px; padding:3px 9px;">
                See action in synapse stepper →
              </a>
            </div>
          `).join('')}
        </div>

        <div class="breaks-section" style="margin-top:20px;">
          <h3 class="fig-title" style="font-size:14px; font-weight:600; margin-bottom:6px;">When It Breaks Down</h3>
          <p style="color:var(--ink-2); font-size:14px; margin-bottom:10px;">${fmt(chem.breaks?.text || '')}</p>
          ${bullets(chem.breaks?.bullets || [])}
        </div>

        ${chem.tryIt ? `
          <div class="extra" style="margin-top:20px;">
            <p style="margin:0; font-size:13px; line-height:1.5;">
              <strong style="color:var(--accent);">Try this:</strong> ${fmt(chem.tryIt)}
            </p>
          </div>` : ''}
      </div>
    `;
  }

  return `<article class="ex" style="--accent:${chem.color}">
    <header class="ex-head">
      <span class="crumbs">Atlas / Chemicals / ${esc(group.label)}</span>
      <h1 class="ex-title">${esc(chem.name)}</h1>
      <p class="tagline">${esc(chem.tagline || '')}</p>
    </header>

    ${chem.analogy ? `
      <div class="analogy">
        <span class="analogy-lead">Analogy:</span>${fmt(chem.analogy)}
      </div>` : ''}

    ${renderLadder(tabs, activeTab, { hrefPrefix: `#/chem/${chem.id}`, attr: 'data-tab' })}

    ${body}

    <nav class="pager" aria-label="Adjacent chemicals">
      ${prev ? `<a class="pg" href="#/chem/${prev.id}" style="--c:${prev.color}"><i class="dot"></i>${esc(prev.name)}</a>` : '<span></span>'}
      ${next ? `<a class="pg" href="#/chem/${next.id}" style="--c:${next.color}">${esc(next.name)}<i class="dot"></i></a>` : '<span></span>'}
    </nav>
  </article>`;
}
