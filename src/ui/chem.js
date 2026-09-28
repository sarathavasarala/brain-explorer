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
      <nav class="crumbs">
        <a href="#/chem">Atlas</a>
        <span class="sep">/</span>
        <span>Chemicals</span>
      </nav>
      <h1 class="ex-title">Brain Chemicals</h1>
      <p class="tagline">The molecules that carry signals across synapses, modulate circuits, and coordinate the body.</p>
    </header>

    <div class="level">
      <p>Chemical messengers bridge the microscopic gaps between neurons. Fast neurotransmitters pass point-to-point electrical commands within milliseconds, neuromodulators tune whole networks over seconds and minutes, and hormones circulate through the bloodstream over hours.</p>

      ${renderSpeedWidget()}

      <div class="chem-groups-list">
        ${chemicalGroups.map((g) => {
          const list = chemicals.filter((c) => c.group === g.id);
          return `<section class="group chem-group-item">
            <h2 class="group-h">
              ${esc(g.label)}
              <span class="group-sub">${esc(g.blurb || '')}</span>
            </h2>
            <div class="chips">
              ${list.length ? list.map((c) => `
                <a class="chip" href="#/chem/${c.id}" style="--c:${c.color}">
                  <i class="dot"></i>${esc(c.name)}
                </a>
              `).join('') : '<span class="empty">Hormone directory coming in Phase 5.</span>'}
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

        <div class="chem-meta">
          <div class="meta-row">
            <h3 class="meta-label">Made in</h3>
            ${partChips(chem.madeIn)}
          </div>
          ${chem.madeFrom ? `
            <div class="meta-row">
              <h3 class="meta-label">Made from</h3>
              <p class="meta-val">${esc(chem.madeFrom)}</p>
            </div>` : ''}
          ${chem.pathwayId ? `
            <div class="meta-row">
              <a class="chip chip-path" href="#/p/${chem.pathwayId}/0">
                ${icon('pathway', 14)} Take the guided tour: ${esc(chem.name)} pathways &rarr;
              </a>
            </div>` : ''}
        </div>

        ${renderSpeedWidget()}
      </div>
    `;
  } else if (activeTab === 'tracts') {
    const tracts = chem.tracts || [];
    let list = tracts.slice();
    if (sub) {
      list.sort((a, b) => (a.id === sub ? -1 : b.id === sub ? 1 : 0));
    }
    body = `
      <div class="level">
        <p class="section-lead">
          Primary projection routes where ${esc(chem.name)} is synthesized and delivered across target regions.
        </p>
        ${sub ? `<div class="tract-all-link"><a class="xref" href="#/chem/${chem.id}/tracts">&larr; Show all pathways</a></div>` : ''}
        <div class="tract-cards">
          ${list.map((t) => {
            const on = sub === t.id;
            return `<div class="fig tract-card ${on ? 'is-on' : ''}" data-tract="${t.id}">
              <div class="tract-card-head">
                <a href="#/chem/${chem.id}/tracts/${t.id}" class="fig-title tract-title">
                  ${esc(t.name)}
                </a>
                ${!on ? `<a href="#/chem/${chem.id}/tracts/${t.id}" class="xref tract-act">Highlight</a>` : ''}
              </div>
              <div class="tract-route">
                ${partChips([t.from])}
                <span class="tract-arrow">&rarr;</span>
                ${partChips(t.to)}
              </div>
              <p class="tract-job">
                ${esc(t.job)}
              </p>
              ${paragraphs(t.text)}
              ${t.whenItFails ? `
                <div class="tract-note tract-note-fails">
                  <strong>When it fails:</strong> ${esc(t.whenItFails)}
                </div>` : ''}
              ${t.whenBlocked ? `
                <div class="tract-note tract-note-blocked">
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

        <div class="receptors-section">
          <h3 class="fig-title">Receptors</h3>
          <div class="receptors-list">
            ${receptors.map((r) => `
              <div class="fig receptor-card">
                <div class="receptor-head">
                  <span class="receptor-name">${esc(r.id)} <span class="receptor-family">(${esc(r.family)})</span></span>
                  <span class="badge badge-${r.effect}">
                    ${{ excite: 'Excites', inhibit: 'Quiets', modulate: 'Tunes' }[r.effect] || r.effect}
                  </span>
                </div>
                <div class="receptor-where">${partChips(r.where)}</div>
                <p class="receptor-desc">${esc(r.text)}</p>
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
        <h3 class="fig-title">Key Drugs and Clinical Agents</h3>
        <div class="drugs-list">
          ${drugs.map((d) => `
            <div class="fig drug-card">
              <div class="drug-head">
                <span class="drug-name">${esc(d.name)}</span>
                <span class="drug-target">Target: ${esc(d.target)}</span>
              </div>
              <p class="drug-desc">${esc(d.text)}</p>
              <a class="chip drug-link" href="#/chem/${chem.id}/synapse/${d.id}">
                See action in synapse stepper &rarr;
              </a>
            </div>
          `).join('')}
        </div>

        <div class="breaks-section">
          <h3 class="fig-title">When It Breaks Down</h3>
          <p class="breaks-desc">${fmt(chem.breaks?.text || '')}</p>
          ${bullets(chem.breaks?.bullets || [])}
        </div>

        ${chem.tryIt ? `
          <div class="extra try-box">
            <p>
              <strong class="try-label">Try this:</strong> ${fmt(chem.tryIt)}
            </p>
          </div>` : ''}
      </div>
    `;
  }

  return `<article class="ex" style="--accent:${chem.color}">
    <header class="ex-head">
      <nav class="crumbs">
        <a href="#/chem">Chemicals</a>
        <span class="sep">/</span>
        <span>${esc(group.label)}</span>
      </nav>
      <h1 class="ex-title">${esc(chem.name)}</h1>
      <p class="tagline">${esc(chem.tagline || '')}</p>
    </header>

    ${chem.analogy ? `
      <p class="analogy"><span class="analogy-lead">Think of it as</span> ${fmt(chem.analogy)}</p>
    ` : ''}

    ${renderLadder(tabs, activeTab, { hrefPrefix: `#/chem/${chem.id}`, attr: 'data-tab' })}

    ${body}

    <footer class="pager">
      ${prev ? `<a href="#/chem/${prev.id}/${activeTab}" class="pg">${icon('prev', 16)}<span>${esc(prev.name)}</span></a>` : '<span></span>'}
      ${next ? `<a href="#/chem/${next.id}/${activeTab}" class="pg pg-next"><span>${esc(next.name)}</span>${icon('next', 16)}</a>` : '<span></span>'}
    </footer>
  </article>`;
}
