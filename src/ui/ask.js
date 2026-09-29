import { byId, structures, anchors, chemById } from '../content/index.js';
import { getAiConfig } from '../services/chat.js';
import { fmt, esc, paragraphs } from './format.js';
import { icon } from './icons.js';

const ACCENT = '#6f86ff';

const ROLE_LABEL = {
  more_active: 'Busier than usual',
  less_active: 'Quieter than usual',
  losing_cells: 'Losing cells',
  cut_off: 'Cut off',
  typical: 'Doing its usual job',
  involved: 'Involved',
};

const MESSENGER_TERM = {
  dopamine: 'dopamine',
  serotonin: 'serotonin',
  noradrenaline: 'noradrenaline',
  acetylcholine: 'acetylcholine',
  gaba: 'GABA',
  glutamate: 'glutamate',
};

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function listNames(ids) {
  const names = ids.map((id) => `{{${id}}}`);
  if (names.length < 2) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function form(value = '', { compact = false, busy = false } = {}) {
  return `<form class="ask-form ${compact ? 'is-compact' : ''}" data-ask>
    ${compact ? '<span class="ask-form-lead">When…</span>' : ''}
    <input name="q" type="text" maxlength="120" autocomplete="off" spellcheck="true"
      value="${esc(value)}" placeholder="${compact ? 'ask something else' : '…you can’t place a face'}"
      aria-label="What happens in the brain when…" ${busy ? 'disabled' : ''} />
    <button class="ask-go" type="submit" ${busy ? 'disabled' : ''}>Show me</button>
  </form>`;
}

function chatForm(value = '', { compact = false, busy = false, placeholder = '' } = {}) {
  const defaultPlaceholder = 'Why does coffee wake me up?';
  return `<form class="ask-form ${compact ? 'is-compact' : ''}" data-chat-form>
    <input name="q" type="text" maxlength="120" autocomplete="off" spellcheck="true"
      value="${esc(value)}" placeholder="${esc(placeholder || defaultPlaceholder)}"
      aria-label="Ask what your brain is doing" ${busy ? 'disabled' : ''} />
    <button class="ask-go" type="submit" ${busy ? 'disabled' : ''}>${compact ? 'Ask' : 'Show me'}</button>
  </form>`;
}

function shell(query, body, { busy = false } = {}) {
  return `<article class="ex ex-ask" style="--accent:${ACCENT}">
    <nav class="crumbs"><a class="back" href="#/ask">${icon('prev', 15)}Ask</a></nav>
    ${form('', { compact: true, busy })}
    <h1 class="ex-title">${esc(cap(query))}</h1>
    ${body}
  </article>`;
}

function sketch(r) {
  const parts = r.parts.filter((p) => byId.has(p.id));
  const cut = parts.filter((p) => p.role === 'cut_off').map((p) => p.id);
  const lead = r.kind === 'condition'
    ? 'The parts this affects most, most central first.'
    : 'The parts doing the most work here, most central first.';
  const messenger = MESSENGER_TERM[r.messenger];
  return `
    <p class="tagline">${lead}</p>
    <ol class="ask-parts">${parts.map((p, i) => {
      const s = byId.get(p.id);
      return `<li class="ask-part" style="--c:${s.color};animation-delay:${i * 70}ms">
        <i class="dot"></i>
        <div class="ask-part-head">
          <a class="ask-part-name" href="#/s/${s.id}">${esc(s.name)}</a>
          <span class="role role-${p.role}">${ROLE_LABEL[p.role] || ROLE_LABEL.involved}</span>
        </div>
        <p class="ask-part-tag">${fmt(s.tagline || '')}</p>
      </li>`;
    }).join('')}</ol>
    ${cut.length >= 2 ? `<p class="ask-note">The main problem is a broken link. ${fmt(listNames(cut))} still work, but stop working together.</p>` : ''}
    ${messenger ? `<p class="ask-note">Main chemical messenger: ${fmt(`[[${messenger}]]`)}.</p>` : ''}
    <p class="ask-foot">A rough sketch, not medical advice. Open any part to read the full story.</p>`;
}

const STATUS = {
  out_of_scope: 'That doesn’t seem to be about the brain. Try a feeling, a condition or something you do.',
  unsure: 'The model wasn’t sure which parts are involved, so nothing is lit up. Try wording it differently.',
  error: 'Couldn’t reach the model just now. Try again in a moment.',
};

function colorOfStep(st) {
  if (!st) return ACCENT;
  if (st.chemical && chemById.has(st.chemical)) {
    return chemById.get(st.chemical).color;
  }
  const id = st.focus?.[0] || st.parts?.[0]?.id;
  if (id) {
    const s = byId.get(id) || anchors.find((a) => a.id === id);
    if (s?.color) return s.color;
  }
  return ACCENT;
}

function stepChips(s) {
  const structureChips = [];
  const seen = new Set();
  for (const id of [...(s.focus || []), ...(s.parts || []).map((p) => p.id)]) {
    if (seen.has(id)) continue;
    seen.add(id);
    const struct = byId.get(id) || anchors.find((a) => a.id === id);
    if (struct) {
      const color = struct.color || '#6f86ff';
      if (byId.has(id)) {
        structureChips.push(`<a class="chip" href="#/s/${struct.id}" style="--c:${color}"><i></i>${esc(struct.name)}</a>`);
      } else {
        structureChips.push(`<span class="chip" style="--c:${color}"><i></i>${esc(struct.name)}</span>`);
      }
    }
  }

  let chemChip = '';
  if (s.chemical && chemById.has(s.chemical)) {
    const c = chemById.get(s.chemical);
    chemChip = `<a class="chip chip-sm" href="#/chem/${c.id}" style="--c:${c.color}"><i class="dot"></i>${esc(c.name)}</a>`;
  }

  const all = [...structureChips, chemChip].filter(Boolean);
  if (!all.length) return '';
  return `<div class="chips">${all.join('')}</div>`;
}

function renderFollowups(followups = []) {
  if (!followups || !followups.length) return '';
  return `
    <div class="chat-followups">
      <span class="chat-followups-label">Ask a follow-up</span>
      <div class="chips">
        ${followups.map((f) => `<button class="chip chip-followup" type="button" data-chat-followup="${esc(f)}">${esc(f)}</button>`).join('')}
      </div>
    </div>
  `;
}

export function scriptToPathwayJs(script) {
  const slug = (script.title || 'custom-pathway')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const obj = {
    id: slug || 'custom-pathway',
    category: 'function',
    name: script.title || 'Custom Pathway',
    tagline: script.summary ? script.summary.split('.')[0] + '.' : script.title,
    summary: script.summary || '',
    steps: (script.steps || []).map((st) => {
      const s = { title: st.title };
      if (st.focus?.length) s.focus = st.focus;
      if (st.parts?.length) s.parts = st.parts;
      if (st.route?.length) s.route = st.route;
      if (st.view) s.view = st.view;
      if (st.slice !== undefined) s.slice = st.slice;
      if (st.chemical) s.chemical = st.chemical;
      if (st.body !== undefined) s.body = st.body;
      s.text = st.text;
      return s;
    }),
  };
  return JSON.stringify(obj, null, 2);
}

export const STARTER_QUESTIONS = [
  'What happens when I fall asleep?',
  'Why does coffee wake me up?',
  'What happens when I get goosebumps from music?',
  'What happens in a panic attack?',
  'How does the brain form a memory?',
];

function renderNudgeCard(title, summary) {
  return `
    <div class="chat-card chat-scope-card chat-nudge-card">
      <div class="chat-card-meta">
        <span class="chat-badge">Ready to explore</span>
        <button class="chat-new-btn chat-nudge-new-btn" type="button" data-chat-act="new-chat">
          ${icon('reset', 13)}<span>New question</span>
        </button>
      </div>
      <h2 class="chat-card-title">${esc(title || 'Ask about how the brain works')}</h2>
      <div class="chat-card-summary">
        ${paragraphs(summary || 'Brain Explorer explores how the brain turns signals into thoughts, feelings, movements, and body responses in 3D. Ask what your brain is doing, and watch it happen.')}
      </div>

      <div class="chat-nudge-box">
        <h3 class="chat-nudge-heading">Try asking one of these</h3>
        <div class="chips">
          ${STARTER_QUESTIONS.map((q) => `
            <button class="chip chip-starter" type="button" data-chat-starter="${esc(q)}">
              ${esc(q)}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="chat-nudge-action">
        <button class="byok-card-btn chat-nudge-btn" type="button" data-chat-act="new-chat">
          ${icon('reset', 14)}<span>Ask a new question</span>
        </button>
      </div>
    </div>
  `;
}

function renderAnswerCard(script, step, turnIndex, followups = []) {
  if (!script || !script.steps || script.steps.length === 0) {
    return renderNudgeCard(script?.title, script?.summary);
  }
  const isLocal = typeof location !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  const st = script.steps[step] || script.steps[0] || {};
  const accent = colorOfStep(st);

  return `
    <div class="chat-card" style="--accent:${accent}">
      <div class="chat-card-meta">
        <span class="chat-badge" title="Generated by an AI model. It may contain mistakes.">Generated answer</span>
        ${isLocal && script.steps.length > 0 ? `<button class="chat-copy-btn" type="button" data-chat-act="copy-pathway" data-turn="${turnIndex}" aria-label="Copy as pathway JS literal">${icon('copy', 13)}<span>Copy as pathway</span></button>` : ''}
      </div>
      <h2 class="chat-card-title">${esc(script.title)}</h2>
      ${script.summary ? `<div class="chat-card-summary">${paragraphs(script.summary)}</div>` : ''}

      ${script.steps.length > 0 ? `
        <div class="player">
          <button class="pl-btn" type="button" data-chat-act="prev" data-turn="${turnIndex}" ${step === 0 ? 'disabled' : ''} aria-label="Previous step">${icon('prev', 18)}</button>
          <button class="pl-btn" type="button" data-chat-act="next" data-turn="${turnIndex}" ${step === script.steps.length - 1 ? 'disabled' : ''} aria-label="Next step">${icon('next', 18)}</button>
          <span class="chat-step-indicator">Step ${step + 1} of ${script.steps.length}</span>
          <div class="pl-track">${script.steps.map((_, i) => `<span class="${i < step ? 'done' : i === step ? 'on' : ''}"></span>`).join('')}</div>
        </div>
        <ol class="steps">
          ${script.steps.map((s, i) => `
            <li class="step ${i === step ? 'is-on' : ''} ${i < step ? 'is-done' : ''}" data-chat-step="${i}" data-turn="${turnIndex}">
              <button class="step-head" type="button" data-chat-step="${i}" data-turn="${turnIndex}">
                <span class="step-n">${i + 1}</span>
                <span class="step-title">${esc(s.title)}</span>
              </button>
              ${i === step ? `<div class="step-body">
                <div class="chat-step-text">${paragraphs(s.text)}</div>
                ${stepChips(s)}
              </div>` : ''}
            </li>`).join('')}
        </ol>
      ` : ''}

    </div>
  `;
}

export function renderChat({ turns = [], loading = false, currentQuery = '' } = {}) {
  const config = getAiConfig();
  const hasKey = Boolean(config?.apiKey);
  const providerLabel = config?.provider === 'openai' ? 'OpenAI' : 'Azure OpenAI';

  const keyBtnHtml = `
    <button class="chat-key-btn ${hasKey ? 'is-connected' : ''}" type="button" data-chat-act="open-key-modal" title="Manage AI API key">
      ${icon('key', 14)}<span>${hasKey ? providerLabel : 'API key'}</span>
    </button>
  `;

  if (turns.length === 0 && !loading) {
    return `
      <article class="ex ex-ask" style="--accent:${ACCENT}">
        <header class="chat-header">
          <h1 class="ex-title">Ask the brain</h1>
          ${keyBtnHtml}
        </header>
        <p class="lede">Ask what your brain is doing, and watch it happen in 3D.</p>
        ${chatForm('', { busy: false })}
        <div class="chat-starters">
          <h3 class="home-h">Try asking</h3>
          <div class="chips">
            ${STARTER_QUESTIONS.map((q) => `
              <button class="chip chip-starter" type="button" data-chat-starter="${esc(q)}">${esc(q)}</button>
            `).join('')}
          </div>
        </div>

        <div class="byok-card">
          <div class="byok-card-head">
            <span class="byok-badge">Serverless and Private</span>
            ${hasKey ? `<span class="byok-status is-connected">${icon('check', 11)} ${providerLabel} connected</span>` : '<span class="byok-status">Bring your own key</span>'}
          </div>
          <p class="byok-card-text">
            Brain Explorer runs in your browser without a backend server. Bring your own Azure OpenAI or OpenAI API key to explore any neuroscience question in 3D. Your key never leaves your browser.
          </p>
          <button class="byok-card-btn" type="button" data-chat-act="open-key-modal">
            ${hasKey ? 'Manage API key' : 'Connect your API key'}
          </button>
        </div>

        <p class="ask-disclosure">Brain Explorer provides educational explanations of neural systems. It is not medical advice.</p>
      </article>
    `;
  }

  return `
    <article class="ex ex-ask" style="--accent:${ACCENT}">
      <header class="chat-header">
        <h1 class="ex-title">Ask the brain</h1>
        <div class="chat-header-actions">
          ${keyBtnHtml}
          <button class="chat-new-btn" type="button" data-chat-act="new-chat">${icon('reset', 14)}<span>New question</span></button>
        </div>
      </header>
      <div class="chat-thread">
        ${turns.map((turn, tIdx) => {
          if (turn.role === 'user') {
            return `<div class="chat-user-msg"><span class="chat-user-text">${esc(turn.text)}</span></div>`;
          }
          if (turn.role === 'assistant') {
            if (turn.status === 'out_of_scope') {
              return renderNudgeCard(turn.title, turn.summary);
            }
            if (turn.status === 'no_key') {
              return `<div class="chat-card chat-scope-card">
                <span class="chat-badge">API Key Required</span>
                <h2 class="chat-card-title">Bring your own API key</h2>
                <p class="chat-card-summary">Brain Explorer is serverless. To ask questions and explore neural journeys in 3D, connect your Azure OpenAI or OpenAI API key. Your key is stored only in this browser.</p>
                <button class="byok-card-btn" type="button" data-chat-act="open-key-modal" style="margin-top: 14px;">Connect your API key</button>
              </div>`;
            }
            if (turn.status === 'offline') {
              return `<div class="chat-card chat-err-card">
                <p class="chat-status-msg">Cannot reach the AI endpoint. Check your internet connection or API settings.</p>
                <button class="chat-new-btn" type="button" data-chat-act="new-chat" style="margin-top: 10px;">${icon('reset', 13)}<span>Ask a new question</span></button>
              </div>`;
            }
            if (turn.status === 'error') {
              return `<div class="chat-card chat-err-card">
                <p class="chat-status-msg">${esc(turn.error || 'Something went wrong reaching the AI model. Check your API key and connection.')}</p>
                <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
                  <button class="byok-card-btn" type="button" data-chat-act="open-key-modal">Check API key settings</button>
                  <button class="chat-new-btn" type="button" data-chat-act="new-chat">${icon('reset', 13)}<span>New question</span></button>
                </div>
              </div>`;
            }
            if (turn.status === 'ok' && turn.script) {
              if (!turn.script.steps || turn.script.steps.length === 0) {
                return renderNudgeCard(turn.script.title, turn.script.summary);
              }
              return renderAnswerCard(turn.script, turn.step || 0, tIdx);
            }
          }
          return '';
        }).join('')}
        ${loading ? `
          <p class="ask-wait"><i><b></b><b></b><b></b></i>Thinking and lighting up the brain…</p>
        ` : ''}
      </div>
    </article>
  `;
}

// Renders Ask mode: supports either traditional preset / query results or interactive chat.
export function renderAsk({ query = '', loading = false, result = null, chat = null } = {}) {
  if (chat) return renderChat(chat);
  if (!query) return renderChat({ turns: [], loading: false });
  if (loading) {
    return shell(query, `<p class="ask-wait"><i><b></b><b></b><b></b></i>Looking through the parts of the brain…</p>`, { busy: true });
  }
  if (result?.status === 'ok') return shell(query, sketch(result));
  if (result?.status === 'offline' || result?.status === 'no_key') {
    return renderChat({
      turns: [
        { role: 'user', text: query },
        { role: 'assistant', status: result.status },
      ],
      loading: false,
    });
  }
  return shell(query, `<p class="ask-status">${STATUS[result?.status] || STATUS.error}</p>`);
}
