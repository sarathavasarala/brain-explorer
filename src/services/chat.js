// Client service for free-form Ask chat backed by Azure OpenAI.
// Communicates with /api/chat via server.py and always runs the response
// through sanitizeScript to ensure safe execution in the 3D scene.
import { sanitizeScript } from '../content/index.js';

export async function sendChat(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { status: 'error' };
  }

  let res;
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Brain-Explorer': '1',
      },
      body: JSON.stringify({ messages }),
    });
  } catch {
    return { status: 'offline' };
  }

  if (res.status === 404) return { status: 'offline' };
  if (res.status === 501) return { status: 'no_key' };

  let data;
  try {
    data = await res.json();
  } catch {
    return { status: 'offline' };
  }

  if (!res.ok) {
    return { status: data?.status || 'error' };
  }

  if (data.status === 'out_of_scope') {
    return {
      status: 'out_of_scope',
      title: data.title || 'Out of scope',
      summary: data.summary || 'Brain Explorer explores how the brain and body work. Try asking about a feeling, memory, or action.',
      steps: [],
      followups: (data.followups || []).slice(0, 3),
    };
  }

  if (data.status === 'ok') {
    const sanitized = sanitizeScript(data);
    return {
      status: 'ok',
      title: sanitized.title || 'Brain Explorer',
      summary: sanitized.summary || '',
      steps: sanitized.steps || [],
      followups: (data.followups || []).slice(0, 3),
    };
  }

  return { status: data.status || 'error' };
}
