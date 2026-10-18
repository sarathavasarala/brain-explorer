// Chemical UI: Overview, Pathways (tracts), The Chain (axis), Synapse (stepper), and Medicine (drugs & disorders).
import { chemicals, chemicalGroups } from '../content/index.js';
import { getChemTabs } from '../content/chem-tabs.js';
import { fmt, paragraphs, esc } from './format.js';
import { renderSegmentedTabs } from './tabs.js';
import { renderBullets, renderPartChips, renderPager } from './components.js';
import { renderSpeedWidget } from './speed.js';
import { STAGES, RECEPTOR_MODES, describeReceptorMechanism, getHighlightedReceptor, stageForDrug } from './synapse-stepper.js';
import { icon } from './icons.js';

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
  let levelTitle = 'Overview';
  let levelScale = group.label;

  if (activeTab === 'overview') {
    levelTitle = 'Overview';
    levelScale = group.label;
    body = `
      ${paragraphs(chem.overview?.text || '')}
      ${renderBullets(chem.overview?.bullets || [])}

      <div class="chem-meta">
        <div class="meta-row">
          <h3 class="meta-label">Made in</h3>
          ${renderPartChips(chem.madeIn)}
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
    `;
  } else if (activeTab === 'tracts') {
    levelTitle = 'Neural Pathways';
    levelScale = 'Projections';
    const tracts = chem.tracts || [];
    let list = tracts.slice();
    if (sub) {
      list.sort((a, b) => (a.id === sub ? -1 : b.id === sub ? 1 : 0));
    }
    body = `
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
              ${renderPartChips([t.from])}
              <span class="tract-arrow">&rarr;</span>
              ${renderPartChips(t.to)}
            </div>
            <p class="tract-job">
              ${fmt(t.job)}
            </p>
            ${paragraphs(t.text)}
            ${t.whenItFails ? `
              <div class="tract-note tract-note-fails">
                <strong>When it fails:</strong> ${fmt(t.whenItFails)}
              </div>` : ''}
            ${t.whenBlocked ? `
              <div class="tract-note tract-note-blocked">
                <strong>When blocked:</strong> ${fmt(t.whenBlocked)}
              </div>` : ''}
          </div>`;
        }).join('')}
      </div>
    `;
  } else if (activeTab === 'axis') {
    levelTitle = 'The Hormone Chain';
    levelScale = 'Endocrine Axis';
    const axis = chem.axis || [];
    const feedback = chem.feedback || [];
    const subIdx = (sub != null && sub !== '') ? parseInt(sub, 10) : null;
    body = `
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
                  ${renderPartChips([step.from])}
                  <span class="tract-arrow">&rarr;</span>
                  ${renderPartChips([step.to])}
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
                ${renderPartChips([fb.from])}
                <span class="tract-arrow">&rarr;</span>
                ${renderPartChips(fb.to)}
                <span class="feedback-badge">Negative Feedback</span>
              </div>
              <p class="feedback-text">${fmt(fb.text)}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
  } else if (activeTab === 'synapse') {
    levelTitle = 'At the Synapse';
    levelScale = '20 nm Cleft';
    const receptors = chem.receptors || [];
    const hiRec = getHighlightedReceptor();
    const hiRecObj = hiRec ? receptors.find((r) => r.id === hiRec) : null;
    const presentEffects = new Set(receptors.map((r) => r.effect));

    body = `
      <p class="syn-intro">Follow one signal through the theater, from the moment the cell builds it to the moment the cleft is cleared. A chemical does not have a single fixed effect on its own: what happens next depends on which receptor it docks onto.</p>

      <div class="receptor-modes-key" aria-label="How receptors respond">
        <div class="receptor-modes-title">Three ways a receptor can respond</div>
        <div class="receptor-modes-list">
          ${RECEPTOR_MODES.map((m) => {
            const isSelectedMode = hiRecObj?.effect === m.id;
            const isPresent = presentEffects.has(m.id);
            return `<div class="receptor-mode-item ${isSelectedMode ? 'is-active' : ''} ${!isPresent ? 'is-muted' : ''}" data-effect-mode="${esc(m.id)}">
              <div class="receptor-mode-head">
                <span class="badge badge-${esc(m.id)}">${esc(m.word)}</span>
                <span class="receptor-mode-meta">${esc(m.analogy)} &middot; ${esc(m.timescale)}</span>
              </div>
              <p class="receptor-mode-desc">${esc(m.summary)}</p>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="receptors-section">
        <h3 class="fig-title">Receptors for ${esc(chem.name)}</h3>
        <div class="receptors-list">
          ${receptors.map((r) => {
            const isHi = hiRec === r.id;
            const effectWord = { excite: 'Excites', inhibit: 'Quiets', modulate: 'Tunes' }[r.effect] || r.effect;
            const badgeText = r.flux ? `${effectWord} · ${r.flux}` : effectWord;
            const mech = describeReceptorMechanism(r);
            return `
              <button type="button" class="fig receptor-card ${isHi ? 'is-on' : ''}" data-receptor-card="${esc(r.id)}" data-receptor-effect="${esc(r.effect)}" aria-pressed="${isHi ? 'true' : 'false'}">
                <div class="receptor-head">
                  <span class="receptor-name">${esc(r.id)} <span class="receptor-family">(${esc(r.family)})</span></span>
                  <span class="badge badge-${r.effect}">
                    ${esc(badgeText)}
                  </span>
                </div>
                ${mech ? `<p class="receptor-mech">${esc(mech)}</p>` : ''}
                <div class="receptor-where">${renderPartChips(r.where)}</div>
                <p class="receptor-desc">${fmt(r.text)}</p>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
  } else if (activeTab === 'medicine') {
    levelTitle = 'Medicine and Clinical Agents';
    levelScale = 'Drug Targets';
    const drugs = chem.drugs || [];
    const activeDrugId = sub;
    body = `
      <div class="drugs-section">
        <h3 class="fig-title">Key Drugs and Clinical Agents</h3>
        <div class="drugs-list">
        ${drugs.map((d) => {
          const isOn = d.id === activeDrugId;
          const stageNum = stageForDrug(d);
          const stageObj = STAGES[stageNum] || STAGES[0];
          return `
            <div class="fig drug-card ${isOn ? 'is-on' : ''}" data-drug-card="${esc(d.id)}">
              <div class="drug-head">
                <span class="drug-name">${esc(d.name)}</span>
                <div class="drug-meta">
                  <span class="drug-stage-pill" title="Acts on Step ${stageNum + 1}: ${esc(stageObj.title)}">
                    <span class="step-n-mini">${stageNum + 1}</span> ${esc(stageObj.label)}
                  </span>
                  <span class="drug-target">Target: ${esc(d.target)}</span>
                </div>
              </div>
              <p class="drug-desc">${fmt(d.text)}</p>
              <div class="drug-card-actions">
                ${isOn ? `
                  <span class="chip drug-link is-active"><i class="dot" style="--c:#ffcf6b"></i> Simulating on step ${stageNum + 1}: ${esc(stageObj.title)}</span>
                  <a class="drug-reset-link" href="#/chem/${esc(chem.id)}/medicine">Clear simulation</a>
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
      </div>

      <div class="breaks-section">
        <h3 class="fig-title">When It Breaks Down</h3>
        <p class="breaks-desc">${fmt(chem.breaks?.text || '')}</p>
        ${renderBullets(chem.breaks?.bullets || [])}
      </div>

      ${chem.tryIt ? `
        <div class="extra try-box">
          <p>
            <strong class="try-label">Try this:</strong> ${fmt(chem.tryIt)}
          </p>
        </div>` : ''}
    `;
  }

  const hasActiveDrug = (activeTab === 'synapse' || activeTab === 'medicine') && sub && (chem.drugs || []).some((d) => d.id === sub);
  const segmentedTabs = tabs.map((t) => {
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

    ${renderSegmentedTabs(segmentedTabs, activeTab, { hrefPrefix: `#/chem/${chem.id}`, attr: 'data-tab', ariaLabel: `${chem.name} sections` })}

    <section class="level" data-level="${activeTab}">
      <h2 class="level-title">${esc(levelTitle)} <span>${esc(levelScale)}</span></h2>
      ${body}
    </section>

    ${renderPager(prev, next, activeTab, '#/chem')}
  </article>`;
}
