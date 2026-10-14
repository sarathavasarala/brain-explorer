// Chemical UI: Overview, Pathways (tracts), The Chain (axis), Synapse (stepper), and Medicine (drugs & disorders).
import { chemicals, chemicalGroups, byId, anchorById } from '../content/index.js';
import { getChemTabs } from '../content/chem-tabs.js';
import { fmt, paragraphs, esc } from './format.js';
import { renderLadder } from './ladder.js';
import { renderSpeedWidget } from './speed.js';
import { STAGES, getStepperStage, getHighlightedReceptor, getDrugMode, stageForDrug, getDrugStageNote } from './synapse-stepper.js';
import { icon } from './icons.js';

function bullets(list) {
  if (!list?.length) return '';
  return `<ul class="bullets">${list.map((b) => `<li>${fmt(b)}</li>`).join('')}</ul>`;
}

function partChips(ids = []) {
  if (!ids.length) return '';
  return `<span class="chips">${ids.map((id) => {
    const s = byId.get(id) || anchorById.get(id);
    if (!s) return `<span class="chip">${esc(id)}</span>`;
    const isStructure = byId.has(id);
    if (isStructure) {
      return `<a class="chip" href="#/s/${s.id}" style="--c:${s.color}"><i class="dot"></i>${esc(s.name)}</a>`;
    }
    return `<span class="chip" style="--c:${s.color || '#fff'}"><i class="dot"></i>${esc(s.name)}</span>`;
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
              ${list.map((c) => `
                <a class="chip" href="#/chem/${c.id}" style="--c:${c.color}">
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
          ${chem.group === 'hormone' ? `
            <div class="meta-row">
              <a class="chip chip-path" href="#/chem/${chem.id}/axis">
                ${icon('pathway', 14)} Explore the hormone chain &rarr;
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
  } else if (activeTab === 'axis') {
    const axis = chem.axis || [];
    const feedback = chem.feedback || [];
    const subIdx = (sub != null && sub !== '') ? parseInt(sub, 10) : null;
    body = `
      <div class="level">
        <p class="section-lead">
          The hormonal chain of command connecting the brain to distant body glands through the bloodstream.
        </p>
        ${chem.timescale ? `
          <div class="axis-timescale">
            <span class="meta-label">Timescale:</span> <span class="axis-time-val">${esc(chem.timescale)}</span>
          </div>` : ''}
        ${subIdx != null ? `<div class="tract-all-link"><a class="xref" href="#/chem/${chem.id}/axis">&larr; Show complete chain</a></div>` : ''}
        <div class="axis-chain">
          <ol class="axis-steps">
            ${axis.map((step, sIdx) => {
              const on = subIdx === sIdx;
              return `
                <li class="axis-card fig ${on ? 'is-on' : ''}" data-step="${sIdx}">
                  <div class="axis-card-head">
                    <span class="axis-step-num">Step ${sIdx + 1}</span>
                    <a href="#/chem/${chem.id}/axis/${sIdx}" class="fig-title axis-title">
                      ${esc(step.carries || 'Signal')}
                    </a>
                    ${!on ? `<a href="#/chem/${chem.id}/axis/${sIdx}" class="xref axis-act">Highlight</a>` : ''}
                  </div>
                  <div class="tract-route">
                    ${partChips([step.from])}
                    <span class="tract-arrow">&rarr;</span>
                    ${partChips([step.to])}
                    <span class="axis-via">via ${esc(step.via || 'blood')}</span>
                  </div>
                  <p class="axis-text">${fmt(step.text)}</p>
                </li>
              `;
            }).join('')}
          </ol>
        </div>
        ${feedback.length ? `
          <div class="feedback-section">
            <h3 class="fig-title">Feedback Control</h3>
            ${feedback.map((fb) => `
              <div class="fig feedback-card">
                <div class="tract-route">
                  ${partChips([fb.from])}
                  <span class="tract-arrow">&rarr;</span>
                  ${partChips(fb.to)}
                  <span class="feedback-badge">Negative Feedback</span>
                </div>
                <p class="feedback-text">${fmt(fb.text)}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  } else if (activeTab === 'synapse') {
    const receptors = chem.receptors || [];
    const currentStage = getStepperStage();
    const drug = sub ? (chem.drugs || []).find((d) => d.id === sub) : null;
    const isDrugActive = !!(drug && getDrugMode());
    const drugTargetStage = isDrugActive ? stageForDrug(drug) : -1;
    const hiRec = getHighlightedReceptor();
    body = `
      <div class="level">
        <div class="syn-life-section">
          <h3 class="fig-title">Synapse Lifecycle</h3>
          <ol class="steps syn-steps">
            ${STAGES.map((st) => {
              const isCurrent = st.id === currentStage;
              const text = chem.life?.[st.key] || '';
              const drugNote = (isDrugActive && st.id === drugTargetStage) ? getDrugStageNote(drug) : '';
              const cleanLabel = st.label.replace(/^\d+\.\s*/, '');
              const cleanShort = st.short.replace(/^\d+\.\s*/, '');
              return `
                <li class="step ${isCurrent ? 'is-on' : ''}" data-stage="${st.id}">
                  <button class="step-head" type="button" data-stage="${st.id}">
                    <span class="step-n">${st.id + 1}</span>
                    <span class="step-title">${esc(cleanLabel)} (${esc(cleanShort)})</span>
                  </button>
                  <div class="step-body" ${isCurrent ? '' : 'hidden'}>
                    <p class="step-text">${esc(text)}</p>
                    ${drugNote ? `<div class="syn-life-drug-note"><i class="drug-stage-dot"></i> <strong>${esc(drug.name)}:</strong> ${esc(drugNote)}</div>` : ''}
                  </div>
                </li>
              `;
            }).join('')}
          </ol>
        </div>

        <div class="receptors-section">
          <h3 class="fig-title">Receptors</h3>
          <div class="receptors-list">
            ${receptors.map((r) => {
              const isHi = hiRec === r.id;
              return `
                <div class="fig receptor-card ${isHi ? 'is-on' : ''}" data-receptor-card="${esc(r.id)}">
                  <div class="receptor-head">
                    <span class="receptor-name">${esc(r.id)} <span class="receptor-family">(${esc(r.family)})</span></span>
                    <span class="badge badge-${r.effect}">
                      ${{ excite: 'Excites', inhibit: 'Quiets', modulate: 'Tunes' }[r.effect] || r.effect}
                    </span>
                  </div>
                  <div class="receptor-where">${partChips(r.where)}</div>
                  <p class="receptor-desc">${esc(r.text)}</p>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  } else if (activeTab === 'medicine') {
    const drugs = chem.drugs || [];
    const activeDrugId = sub;
    body = `
      <div class="level">
        <h3 class="fig-title">Key Drugs and Clinical Agents</h3>
        <div class="drugs-list">
          ${drugs.map((d) => {
            const isOn = d.id === activeDrugId;
            const stageNum = stageForDrug(d);
            const stageObj = STAGES[stageNum];
            const cleanShort = stageObj.short.replace(/^\d+\.\s*/, '');
            return `
              <div class="fig drug-card ${isOn ? 'is-on' : ''}" data-drug-card="${esc(d.id)}">
                <div class="drug-head">
                  <span class="drug-name">${esc(d.name)}</span>
                  <div class="drug-meta">
                    <span class="drug-stage-pill" title="Acts on Stage ${stageNum + 1}: ${esc(stageObj.label)}">
                      <span class="step-n-mini">${stageNum + 1}</span> ${esc(cleanShort)}
                    </span>
                    <span class="drug-target">Target: ${esc(d.target)}</span>
                  </div>
                </div>
                <p class="drug-desc">${esc(d.text)}</p>
                <div class="drug-card-actions">
                  ${isOn ? `
                    <span class="chip drug-link is-active"><i class="dot" style="--c:${chem.color}"></i> Simulating on stage</span>
                    <a class="drug-reset-link" href="#/chem/${esc(chem.id)}/medicine">Clear</a>
                  ` : `
                    <a class="chip drug-link" href="#/chem/${esc(chem.id)}/medicine/${esc(d.id)}">
                      Simulate on synapse &rarr;
                    </a>
                  `}
                </div>
              </div>
            `;
          }).join('')}
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

  const hasActiveDrug = (activeTab === 'synapse' || activeTab === 'medicine') && sub && (chem.drugs || []).some((d) => d.id === sub);
  const ladderTabs = tabs.map((t) => {
    if (hasActiveDrug && (t.id === 'synapse' || t.id === 'medicine')) {
      return { ...t, href: `#/chem/${chem.id}/${t.id}/${sub}` };
    }
    return t;
  });

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

    ${renderLadder(ladderTabs, activeTab, { hrefPrefix: `#/chem/${chem.id}`, attr: 'data-tab' })}

    ${body}

    <footer class="pager">
      ${prev ? `<a href="#/chem/${prev.id}/${activeTab}" class="pg">${icon('prev', 16)}<span>${esc(prev.name)}</span></a>` : '<span></span>'}
      ${next ? `<a href="#/chem/${next.id}/${activeTab}" class="pg pg-next"><span>${esc(next.name)}</span>${icon('next', 16)}</a>` : '<span></span>'}
    </footer>
  </article>`;
}
