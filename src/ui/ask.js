import { byId, askPresets, structures } from '../content/index.js';
import { fmt, esc } from './format.js';
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

function examples() {
  if (!askPresets.length) return '';
  return `<h3 class="home-h">Try one of these</h3>
    <ul class="ask-examples">${askPresets.map((p) => `
      <li><a href="#/ask/${encodeURIComponent(p.query)}"><span>…${esc(p.label)}</span>${icon('out', 16)}</a></li>`).join('')}
    </ul>`;
}

function intro(note = '') {
  return `<article class="ex ex-ask" style="--accent:${ACCENT}">
    <h1 class="ex-title">What happens in the brain when…</h1>
    ${form()}
    <p class="lede">Type a feeling, a condition or something you do. You get a quick sketch of the parts most involved, lit up in the model, with a link to read more about each one.</p>
    ${note}
    ${examples()}
    <p class="ask-disclosure">Answers are picked by Jev, an AI model from TypeSafe, from the ${structures.length} parts in this atlas. They are rough, they can be wrong, and they are not medical advice.</p>
  </article>`;
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

// state: { query } for the intro, plus { loading } or { result }
export function renderAsk({ query = '', loading = false, result = null } = {}) {
  if (!query) return intro();
  if (loading) {
    return shell(query, `<p class="ask-wait"><i><b></b><b></b><b></b></i>Looking through the parts of the brain…</p>`, { busy: true });
  }
  if (result?.status === 'ok') return shell(query, sketch(result));
  if (result?.status === 'offline' || result?.status === 'no_key') {
    return intro(`<p class="ask-status">Free-text questions need the local server and an API key. Put <code>TYPESAFE_API_KEY</code> in <code>.env</code> and run <code>npm start</code>. The examples below work without it.</p>`);
  }
  return shell(query, `<p class="ask-status">${STATUS[result?.status] || STATUS.error}</p>`);
}
