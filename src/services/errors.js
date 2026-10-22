// Client error reporting. Redacts secrets and buffers noisy failures before
// forwarding to telemetry, which remains best effort.

import { telemetry } from './telemetry.js';

const MAX_MESSAGE = 500;
const MAX_STACK = 1500;
const DEDUPE_MS = 10000;
const MAX_REPORTS_PER_MINUTE = 20;

const recent = new Map();
const reportTimes = [];
let installed = false;

const SECRET_KEYS = /^(api[-_]?key|authorization|token|access[-_]?token|refresh[-_]?token|password|secret|key|body|messages|prompt|headers|request|requestBody)$/i;

function truncate(value, limit) {
  const text = String(value == null ? '' : value);
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

function redact(value) {
  let text = String(value == null ? '' : value);
  text = text.replace(/(authorization\s*[:=]\s*bearer\s+)[^\s,;"'\\]+/gi, '$1[redacted]');
  text = text.replace(/(authorization\s*[:=]\s*)(?!bearer\s)[^\s,;"'\\]+/gi, '$1[redacted]');
  text = text.replace(/(api[-_]?key\s*[:=]\s*)[^\s,;"'\\]+/gi, '$1[redacted]');
  text = text.replace(/("(?:api[-_]?key|token|authorization)"\s*:\s*")[^"]*"/gi, '$1[redacted]"');
  text = text.replace(/sk-[a-zA-Z0-9_-]{6,}/g, 'sk-[redacted]');
  text = text.replace(/(^|[\s?&])((?:api[-_]?key|api_key|key|token|access_token)=)[^&\s#]+/gi, '$1$2[redacted]');
  return text;
}

function describe(error) {
  if (error instanceof Error) {
    return {
      message: error.message || error.name || 'Error',
      stack: error.stack || '',
    };
  }
  if (typeof error === 'string') return { message: error, stack: '' };
  if (error == null) return { message: 'Unknown error', stack: '' };
  try {
    return { message: JSON.stringify(error), stack: '' };
  } catch {
    return { message: String(error), stack: '' };
  }
}

function sanitize(value, depth = 0, seen = new WeakSet()) {
  if (value == null || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'string') return truncate(redact(value), MAX_MESSAGE);
  if (typeof value !== 'object') return String(value);
  if (depth >= 3) return '[truncated]';
  if (seen.has(value)) return '[circular]';
  seen.add(value);
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitize(item, depth + 1, seen));
  }
  const out = {};
  for (const [key, item] of Object.entries(value)) {
    if (SECRET_KEYS.test(key)) continue;
    out[key] = sanitize(item, depth + 1, seen);
  }
  return out;
}

function currentRoute() {
  return typeof location !== 'undefined' ? truncate(redact(location.hash || '#/'), 300) : '';
}

export function reportError(context, error, extra = {}) {
  try {
    const now = Date.now();
    const safeContext = truncate(redact(context || 'unknown'), 120);
    const parts = describe(error);
    const message = truncate(redact(parts.message || 'Unknown error'), MAX_MESSAGE);
    const stack = truncate(redact(parts.stack || ''), MAX_STACK);
    const dedupeKey = `${safeContext}\u0000${message}`;
    const last = recent.get(dedupeKey);
    if (last && now - last < DEDUPE_MS) return;

    while (reportTimes.length && now - reportTimes[0] > 60000) reportTimes.shift();
    if (reportTimes.length >= MAX_REPORTS_PER_MINUTE) return;

    if (recent.size > 80) {
      for (const [key, at] of recent) {
        if (now - at > DEDUPE_MS) recent.delete(key);
      }
      if (recent.size > 80) recent.delete(recent.keys().next().value);
    }
    recent.set(dedupeKey, now);
    reportTimes.push(now);

    const env = typeof telemetry.getEnvironmentContext === 'function'
      ? telemetry.getEnvironmentContext()
      : null;

    telemetry.event('client_error', {
      context: safeContext,
      message,
      stack: stack || undefined,
      route: currentRoute(),
      user_agent: env?.user_agent || '',
      extra: sanitize(extra),
    });
  } catch {
    // Reporting must never throw or recurse.
  }
}

export function installGlobalErrorHandlers() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  window.addEventListener('error', (event) => {
    reportError('window.error', event.error || event.message || 'Unknown error', {
      source: event.filename || '',
      line: event.lineno || 0,
      column: event.colno || 0,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    reportError('window.unhandledrejection', event.reason);
  });
}
