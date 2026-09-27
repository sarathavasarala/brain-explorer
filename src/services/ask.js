// Client for the Ask feature. The model is only reached through the local server
// (server.py), which holds the API key. Saved examples answer without any network call.
import { askPresets } from '../content/index.js';

const cache = new Map(askPresets.map((p) => [p.query.toLowerCase(), { ...p.result, query: p.query }]));

export const normalise = (q) => q.replace(/\s+/g, ' ').trim().slice(0, 120);

export function cached(query) {
  return cache.get(normalise(query).toLowerCase()) || null;
}

// Resolves to { status: 'ok' | 'out_of_scope' | 'unsure' | 'no_key' | 'offline' | 'error', ... }
export async function ask(query) {
  const q = normalise(query);
  if (!q) return { status: 'unsure', query: q };
  const hit = cached(q);
  if (hit) return hit;
  let res;
  try {
    res = await fetch(`/api/ask?q=${encodeURIComponent(q)}`, { headers: { 'X-Brain-Explorer': '1' } });
  } catch {
    return { status: 'offline', query: q };
  }
  if (res.status === 404 || res.status === 501) return { status: 'offline', query: q };
  let data;
  try { data = await res.json(); } catch { return { status: 'offline', query: q }; }
  if (!res.ok) return { status: 'error', query: q };
  if (['ok', 'out_of_scope', 'unsure'].includes(data.status)) cache.set(q.toLowerCase(), data);
  return data;
}
