import { pathwayEvidence, sources, byId, anchorById } from '../content/index.js';
import { esc, fmt, paragraphs } from './format.js';

const nameOf = (id) => byId.get(id)?.name || anchorById.get(id)?.name || id;

const BASIS_LABELS = {
  'established-anatomy': 'Established anatomy',
  'human': 'Human evidence',
  'animal': 'Animal model',
  'mixed': 'Mixed human/animal evidence',
};

const SEMANTICS_LABELS = {
  'direct': 'Direct tract',
  'multi-hop': 'Multi-hop route',
  'functional': 'Functional correlation',
  'blood': 'Endocrine (bloodstream)',
};

const KIND_LABELS = {
  'textbook': 'Textbook',
  'review': 'Review',
  'primary': 'Primary study',
};

function isValidUrl(url) {
  if (typeof url !== 'string') return false;
  return url.startsWith('https://') || url.startsWith('http://');
}

export function renderEvidence(p, stepIndex) {
  if (!p) return '';
  const record = pathwayEvidence[p.id];
  if (!record) return '';

  const st = p.steps?.[stepIndex];
  if (!st) return '';

  const stepClaims = (record.claims || []).filter((c) => c.stepId === st.id);
  const pathwayClaims = stepIndex === 0 ? (record.claims || []).filter((c) => !c.stepId) : [];
  const allClaims = [...stepClaims, ...pathwayClaims];

  const stepRoutes = (record.routeNotes || []).filter((r) => r.stepId === st.id);
  const detail = record.detailByStep?.[st.id];

  const sourceIdSet = new Set();
  for (const c of allClaims) {
    for (const sid of c.sourceIds || []) {
      sourceIdSet.add(sid);
    }
  }
  for (const r of stepRoutes) {
    for (const sid of r.sourceIds || []) {
      sourceIdSet.add(sid);
    }
  }

  const stepSources = Array.from(sourceIdSet)
    .map((sid) => sources[sid])
    .filter(Boolean);

  if (!allClaims.length && !stepRoutes.length && !detail && !stepSources.length) {
    return '';
  }

  let html = `<details class="evidence-details">
    <summary class="evidence-summary">Sources and limits</summary>
    <div class="evidence-body">`;

  if (detail) {
    html += `<div class="evidence-section evidence-detail-section">
      <div class="evidence-detail-text">${paragraphs(detail)}</div>
    </div>`;
  }

  if (allClaims.length) {
    html += `<div class="evidence-section">
      <h4 class="evidence-subhead">Key claims and evidence</h4>
      <ul class="evidence-claims-list">`;
    for (const c of allClaims) {
      const basisLabel = BASIS_LABELS[c.basis] || c.basis;
      html += `<li class="evidence-claim-item">
        <div class="evidence-claim-text">${esc(c.claim)}</div>
        <div class="evidence-claim-meta">
          ${c.basis ? `<span class="evidence-basis-badge evidence-basis-${esc(c.basis)}">${esc(basisLabel)}</span>` : ''}
          ${c.limits ? `<span class="evidence-limits-text">${fmt(c.limits)}</span>` : ''}
        </div>
      </li>`;
    }
    html += `</ul></div>`;
  }

  if (stepRoutes.length) {
    html += `<div class="evidence-section">
      <h4 class="evidence-subhead">Route notes and connections</h4>
      <ul class="evidence-routes-list">`;
    for (const r of stepRoutes) {
      const semLabel = SEMANTICS_LABELS[r.semantics] || r.semantics;
      const fromName = nameOf(r.from);
      const toName = nameOf(r.to);
      html += `<li class="evidence-route-item">
        <div class="evidence-route-header">
          <span class="evidence-route-path">${esc(fromName)} &rarr; ${esc(toName)}</span>
          <span class="evidence-semantics-badge evidence-sem-${esc(r.semantics)}">${esc(semLabel)}</span>
        </div>
        ${r.note ? `<div class="evidence-route-note">${fmt(r.note)}</div>` : ''}
      </li>`;
    }
    html += `</ul></div>`;
  }

  if (stepSources.length) {
    html += `<div class="evidence-section">
      <h4 class="evidence-subhead">Sources</h4>
      <ul class="evidence-sources-list">`;
    for (const s of stepSources) {
      const kindLabel = KIND_LABELS[s.kind] || s.kind;
      const hasUrl = isValidUrl(s.url);
      html += `<li class="evidence-source-item">
        ${hasUrl
          ? `<a class="evidence-source-link" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>`
          : `<span class="evidence-source-title">${esc(s.title)}</span>`}
        <div class="evidence-source-meta">
          <span>${esc(s.authors || '')} (${esc(String(s.year || ''))})</span>
          <span class="evidence-sep">&middot;</span>
          <span class="evidence-kind">${esc(kindLabel)}</span>
        </div>
      </li>`;
    }
    html += `</ul></div>`;
  }

  html += `</div></details>`;
  return html;
}
