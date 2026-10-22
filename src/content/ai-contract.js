import { structures, anchors, chemicals, glossary, ROLES, VIEWS } from './index.js';

export const REGION_IDS = [...structures.map((s) => s.id), ...anchors.map((a) => a.id)];
export const CHEMICAL_IDS = chemicals.map((c) => c.id);

export function buildSystemPrompt() {
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
    `- parts: Array of { id, role } when activity goes up or down. Roles: ${ROLES.join(', ')}.`,
    '- route: Array of { from, to } connecting regions when a signal travels from one part to another.',
    '- chemical: Chemical id when a messenger (e.g. dopamine, melatonin, noradrenaline) is central to this step.',
    `- view: Camera angle. Options: ${VIEWS.map((v) => `'${v}'`).join(', ')}. Use 'medial' + slice: true for deep midline structures (hippocampus, hypothalamus, etc.). Use 'body' + body: true for hormone steps that reach organs (thyroid, heart, adrenal, etc.).`,
    '- slice: true to slice the brain open to view inner structures. Do not slice when routing to or focusing outer cortical areas (auditory-cortex, visual-cortex, motor-cortex) because slicing cuts away the outer cortex. Use slice: false with lateral views (left, left-front) when showing cortical destinations.',
    '- body: true to show the body silhouette when endocrine signals travel to visceral organs (thyroid, heart, stomach, adrenal, fat, gonads). Always set body: true when routing to or focusing these organs.',
    '',
    'Storytelling and Narrative Rules:',
    '1. Build a coherent story in order: 2 to 6 steps. Each step handles one clear idea.',
    '2. In each step, light only a few relevant parts. Do not light the whole brain at once.',
    '3. Plain, warm, and concrete tone. Use familiar physical analogies (e.g. catching keys, reaching for a mug).',
    "4. Use 'about' or 'roughly' for figures. Never use false precision.",
    '5. STRICT PROHIBITION: NO EM DASHES. Never use em dashes. Use commas, periods, or parentheses.',
    "6. STRICT PROHIBITION: NO HYPE OR FILLER WORDS. Avoid 'fascinating', 'incredible', 'remarkable', 'delve', 'intricate', 'vital', 'complex interplay'.",
    '7. Mention a part with {{id}} at least once in the step text where it lights up.',
    "8. Be honest when science is debated (e.g. 'researchers still debate...').",
    '9. Followups: Provide exactly 3 short, intriguing follow-up questions.',
    '10. Out of scope / Greetings / Conversational:',
    "    If the query is a greeting (such as 'hey', 'hello', 'hi'), conversational chit-chat, unrelated to the brain, mind, or body, or asks for personal medical advice:",
    "    Set status: 'out_of_scope', steps: [], title: 'Ask about how the brain works', and write a warm, friendly summary welcoming them, explaining that Brain Explorer shows what the brain is doing in 3D (like sleep, caffeine, panic, music chills, or memory), and inviting them to ask a brain question.",
    '11. DO NOT INVENT SOURCES: Never fabricate citations, paper titles, author names, or external URLs. Brain Explorer presents clear educational explanations based on consensus neuroscience, not invented literature citations.',
    '12. DISTINGUISH DIRECT VS INDIRECT PATHWAYS: Distinguish direct axonal projections from multi-step or indirect circuits. If two regions communicate via relays (such as through the thalamus or brainstem), explain the relay rather than claiming an imaginary direct connection.',
    '13. QUALIFY SPECIES DIFFERENCES: Clearly distinguish findings established in animal models (such as rodents) from established human brain circuitry. Never present rodent-specific circuit mechanisms as absolute human facts.',
    '14. QUALIFY RECEPTOR AND CONTEXT DEPENDENCE: Modulators (such as dopamine, serotonin, noradrenaline, and acetylcholine) do not have a single universal effect. Clarify that their action depends on receptor types and target circuits.',
    '15. NO DETERMINISTIC DISEASE OR TREATMENT CLAIMS: Avoid deterministic or absolute claims about neurological or psychiatric conditions, or clinical treatments. Explain brain mechanisms, risk factors, or correlations, but do not provide medical diagnostic guarantees or absolute causal statements.',
  );
  return lines.join('\n');
}

export function buildScriptSchema() {
  const stepSchema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      text: { type: 'string' },
      focus: {
        type: ['array', 'null'],
        items: { type: 'string', enum: REGION_IDS },
      },
      parts: {
        type: ['array', 'null'],
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', enum: REGION_IDS },
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
            from: { type: 'string', enum: REGION_IDS },
            to: { type: 'string', enum: REGION_IDS },
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
        enum: [...CHEMICAL_IDS, null],
      },
      body: { type: ['boolean', 'null'] },
    },
    required: ['title', 'text', 'focus', 'parts', 'route', 'view', 'slice', 'chemical', 'body'],
    additionalProperties: false,
  };

  return {
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
}

export function buildAiContract() {
  return {
    systemPrompt: buildSystemPrompt(),
    scriptSchema: buildScriptSchema(),
  };
}

export const systemPrompt = buildSystemPrompt();
export const scriptSchema = buildScriptSchema();
