// Client service for free-form Ask chat backed by Azure OpenAI or OpenAI.
// Supports both client-side Bring-Your-Own-Key (BYOK) for 100% serverless
// execution on GitHub Pages, and local fallback to server.py.
// Always runs responses through sanitizeScript to ensure safe 3D execution.

import { sanitizeScript } from '../content/index.js';
import { systemPrompt, scriptSchema } from '../content/ai-contract.js';
import { reportError } from './errors.js';

const STORAGE_KEY = 'brain_explorer_ai_config';

function readConfig(storage) {
  let raw;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch (e) {
    reportError('ai_config.read', e);
    return null;
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.apiKey) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getAiConfig() {
  const session = readConfig(sessionStorage);
  if (session) return { ...session, remember: false };
  const local = readConfig(localStorage);
  if (local) return { ...local, remember: local.remember !== false };
  return null;
}

export function saveAiConfig(config, remember = false) {
  const persistent = Boolean(remember);
  const payload = JSON.stringify({ ...config, remember: persistent });
  try {
    if (persistent) {
      localStorage.setItem(STORAGE_KEY, payload);
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, payload);
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    reportError('ai_config.save', e, { storage: persistent ? 'local' : 'session' });
  }
}

export function clearAiConfig() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    reportError('ai_config.clear', e, { storage: 'local' });
  }
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    reportError('ai_config.clear', e, { storage: 'session' });
  }
}

export function hasAiKey() {
  return Boolean(getAiConfig()?.apiKey);
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
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 1.0,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'brain_script',
          strict: true,
          schema: scriptSchema,
        },
      },
    };
  } else {
    url = 'https://api.openai.com/v1/chat/completions';
    headers.Authorization = `Bearer ${config.apiKey}`;
    payload = {
      model: config.model || 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 1.0,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'brain_script',
          strict: true,
          schema: scriptSchema,
        },
      },
    };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  let respData = {};
  try {
    respData = await res.json();
  } catch (e) {
    reportError('chat.response_parse', e, { status: res.status });
  }
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      return { status: 'error', error: 'Invalid or unauthorized API key. Please check your credentials.' };
    }
    const rawMsg = respData?.error?.message || `Request failed (${res.status})`;
    const sanitizedMsg = String(rawMsg).replace(/sk-[a-zA-Z0-9_\-]{6,}/g, 'sk-***');
    return { status: 'error', error: sanitizedMsg };
  }

  const content = respData?.choices?.[0]?.message?.content;
  if (!content) return { status: 'error' };

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    reportError('chat.script_parse', e);
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
    reportError('chat.send', e);
    const safeError = (e && typeof e.message === 'string')
      ? e.message.replace(/sk-[a-zA-Z0-9_\-]{6,}/g, 'sk-***')
      : 'Connection to the AI provider failed';
    return { status: 'error', error: safeError };
  }
}

