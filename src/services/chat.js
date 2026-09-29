// Client service for free-form Ask chat backed by Azure OpenAI or OpenAI.
// Supports both client-side Bring-Your-Own-Key (BYOK) for 100% serverless
// execution on GitHub Pages, and local fallback to server.py.
// Always runs responses through sanitizeScript to ensure safe 3D execution.

import { structures, anchors, chemicals, glossary, sanitizeScript } from '../content/index.js';
import { ROLES, VIEWS } from '../content/script.js';

const STORAGE_KEY = 'brain_explorer_ai_config';

export function getAiConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.apiKey) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAiConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save config to localStorage', e);
  }
}

export function clearAiConfig() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear config from localStorage', e);
  }
}

export function hasAiKey() {
  return Boolean(getAiConfig()?.apiKey);
}

let cachedPrompt = null;
let cachedSchema = null;

function getSystemPrompt() {
  if (cachedPrompt) return cachedPrompt;
  const lines = [
    'You are the narrator of Brain Explorer, an interactive 3D atlas of the human brain.',
    'The user is viewing a 3D holographic point-cloud model of the brain. Each step in your script dynamically lights up brain regions, animates signals along neural pathways, and changes camera views.',
    '',
    'Available brain structures (use these ids in parts, focus, route, or {{id}} links):',
  ];
  for (const s of structures) {
    lines.push(`- ${s.id}: ${s.name} (${s.tagline || ''})`);
  }
  lines.push('\nAvailable body anchors (use for sensory inputs, motor outputs, or endocrine organs):');
  for (const a of anchors) {
    lines.push(`- ${a.id}: ${a.name}`);
  }
  lines.push('\nAvailable chemical messengers (use for the chemical field):');
  for (const c of chemicals) {
    lines.push(`- ${c.id}: ${c.name} [${c.group || ''}] (${c.tagline || ''})`);
  }
  lines.push('\nAvailable glossary terms (ONLY use [[term]] or [[term|shown text]] for these terms):');
  lines.push(Object.keys(glossary).join(', '));
  lines.push(
    '',
    'Step structure and fields:',
    '- title: Short descriptive step title.',
    '- text: 2 to 4 sentences explaining this step like an unfolding story. Plain, warm, concrete.',
    '- parts: Array of { id, role } when activity goes up or down. Roles: more_active, less_active, typical, involved, cut_off, losing_cells.',
    '- route: Array of { from, to } connecting regions when a signal travels from one part to another.',
    '- chemical: Chemical id when a messenger (e.g. dopamine, melatonin, noradrenaline) is central to this step.',
    "- view: Camera angle. Options: 'left', 'left-front', 'left-back', 'medial', 'back', 'below', 'body'. Use 'medial' + slice: true for deep midline structures (hippocampus, hypothalamus, etc.). Use 'body' + body: true for hormone steps that reach organs (thyroid, heart, adrenal, etc.).",
    '- slice: true to slice the brain open to view inner structures.',
    '- body: true to show the body silhouette when endocrine signals travel to visceral organs.',
    '',
    'Storytelling and Narrative Rules:',
    '1. Build a coherent story in order: 2 to 6 steps. Each step handles one clear idea.',
    '2. In each step, light only a few relevant parts. Do not light the whole brain at once.',
    '3. Plain, warm, and concrete tone. Use familiar physical analogies (e.g. catching keys, reaching for a mug).',
    '4. Use "about" or "roughly" for figures. Never use false precision.',
    '5. STRICT PROHIBITION: NO EM DASHES. Never use em dashes. Use commas, periods, or parentheses.',
    "6. STRICT PROHIBITION: NO HYPE OR FILLER WORDS. Avoid 'fascinating', 'incredible', 'remarkable', 'delve', 'intricate', 'vital', 'complex interplay'.",
    '7. Mention a part with {{id}} at least once in the step text where it lights up.',
    '8. Be honest when science is debated (e.g. "researchers still debate...").',
    '9. Followups: Provide exactly 3 short, intriguing follow-up questions.',
    '10. Out of scope / Greetings / Conversational:',
    '    If the query is a greeting (such as "hey", "hello", "hi"), conversational chit-chat, unrelated to the brain, mind, or body, or asks for personal medical advice:',
    '    Set status: "out_of_scope", steps: [], title: "Ask about how the brain works", and write a warm, friendly summary welcoming them, explaining that Brain Explorer shows what the brain is doing in 3D (like sleep, caffeine, panic, music chills, or memory), and inviting them to ask a brain question.'
  );
  cachedPrompt = lines.join('\n');
  return cachedPrompt;
}

function getScriptSchema() {
  if (cachedSchema) return cachedSchema;
  const regionIds = [...structures.map((s) => s.id), ...anchors.map((a) => a.id)];
  const chemicalIds = chemicals.map((c) => c.id);
  const stepSchema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      text: { type: 'string' },
      focus: {
        type: ['array', 'null'],
        items: { type: 'string', enum: regionIds },
      },
      parts: {
        type: ['array', 'null'],
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', enum: regionIds },
            role: { type: 'string', enum: ROLES },
          },
          required: ['id', 'role'],
          additionalProperties: false,
        },
      },
      route: {
        type: ['array', 'null'],
        items: {
          type: 'object',
          properties: {
            from: { type: 'string', enum: regionIds },
            to: { type: 'string', enum: regionIds },
          },
          required: ['from', 'to'],
          additionalProperties: false,
        },
      },
      view: {
        type: ['string', 'null'],
        enum: [...VIEWS, null],
      },
      slice: { type: ['boolean', 'null'] },
      chemical: {
        type: ['string', 'null'],
        enum: [...chemicalIds, null],
      },
      body: { type: ['boolean', 'null'] },
    },
    required: ['title', 'text', 'focus', 'parts', 'route', 'view', 'slice', 'chemical', 'body'],
    additionalProperties: false,
  };

  cachedSchema = {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['ok', 'out_of_scope'] },
      title: { type: 'string' },
      summary: { type: 'string' },
      steps: { type: 'array', items: stepSchema },
      followups: { type: 'array', items: { type: 'string' } },
    },
    required: ['status', 'title', 'summary', 'steps', 'followups'],
    additionalProperties: false,
  };
  return cachedSchema;
}

async function sendChatDirect(config, messages) {
  const provider = config.provider || 'azure';
  let url = '';
  const headers = { 'Content-Type': 'application/json' };
  let payload = {};

  if (provider === 'azure') {
    const endpoint = (config.endpoint || '').replace(/\/+$/, '');
    const deployment = config.deployment || 'gpt-5.6-luna';
    const version = config.apiVersion || '2025-04-01-preview';
    url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${version}`;
    headers['api-key'] = config.apiKey;
    payload = {
      messages: [{ role: 'system', content: getSystemPrompt() }, ...messages],
      temperature: 1.0,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'brain_script',
          strict: true,
          schema: getScriptSchema(),
        },
      },
    };
  } else {
    url = 'https://api.openai.com/v1/chat/completions';
    headers.Authorization = `Bearer ${config.apiKey}`;
    payload = {
      model: config.model || 'gpt-4o-mini',
      messages: [{ role: 'system', content: getSystemPrompt() }, ...messages],
      temperature: 1.0,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'brain_script',
          strict: true,
          schema: getScriptSchema(),
        },
      },
    };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const respData = await res.json();
  if (!res.ok) {
    const msg = respData?.error?.message || `Request failed (${res.status})`;
    return { status: 'error', error: msg };
  }

  const content = respData?.choices?.[0]?.message?.content;
  if (!content) return { status: 'error' };

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    return { status: 'error' };
  }

  if (parsed.status === 'out_of_scope') {
    return {
      status: 'out_of_scope',
      title: parsed.title || 'Out of scope',
      summary: parsed.summary || 'Brain Explorer explores how the brain and body work. Try asking about a feeling, memory, or action.',
      steps: [],
    };
  }

  const sanitized = sanitizeScript(parsed);
  return {
    status: 'ok',
    title: sanitized.title || 'Brain Explorer',
    summary: sanitized.summary || '',
    steps: sanitized.steps || [],
  };
}

export async function sendChat(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { status: 'error' };
  }

  const userConfig = getAiConfig();
  if (!userConfig?.apiKey) {
    return { status: 'no_key' };
  }

  try {
    return await sendChatDirect(userConfig, messages);
  } catch (e) {
    console.error('[brain-explorer] direct chat failed:', e);
    return { status: 'error', error: e.message || 'Direct API call failed' };
  }
}
