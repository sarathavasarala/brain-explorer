# Prompt: write the explainer text for Brain Explorer

Paste everything below the line into the model that will write the content. Run it one file at a time (for example, `src/content/structures/deep.js` first), so each answer stays short enough to check.

---

You are filling in the explanation text for a 3D "Brain Explorer" web app. The reader is a curious adult with **beginner-level neuroscience**: they know a neuron is a brain cell and not much more. Your job is to add text fields to existing JavaScript data files. Do not change anything else.

## Voice

- Plain, warm, specific. Write like a good science teacher talking to a friend, not a textbook.
- Short sentences. Explain any technical word the first time, or link it to the glossary (see markup below).
- Prefer concrete everyday examples ("catching your keys", "recognising a friend's face") over abstractions.
- Say "about" or "roughly" for numbers instead of false precision. Only state facts that are well established. If something is debated, say so briefly ("researchers think...").
- No em dashes (—). Use commas, full stops or brackets instead.
- Avoid hype and filler: no "fascinating", "incredible", "remarkable", "plays a crucial role", "delve", "intricate", "vital", "complex interplay", "In summary".
- Don't start every paragraph the same way. Vary sentence length.

## Fields to write, per structure

Each structure object already has `id`, `name`, `group`, `color`, `shape`, `view`, `tagline`, `levels.connects.connections` and `levels.cells.diagram`/`synapse`. **Do not touch those** (you may edit `tagline` only if it is wrong). Add or fill:

```js
analogy: 'One sentence comparing it to something familiar.',
levels: {
  where: {
    text: '2 to 4 sentences: where it sits, how big it is, what it looks like. Mention neighbours with {{id}} links.',
    bullets: ['2 to 3 short facts about its shape or parts'],
  },
  does: {
    text: '3 to 5 sentences: what it does, in everyday terms, with one concrete example.',
    bullets: ['3 to 4 jobs, each starting with a short name then a colon'],
  },
  connects: {
    text: '2 to 4 sentences: where its information comes from and where it sends it, told as a flow.',
    connections: [
      // KEEP every existing { id, dir } exactly as it is. Only add a `label` to each:
      { id: 'thalamus', dir: 'in', label: 'Short phrase, under 10 words' },
    ],
  },
  cells: {
    // KEEP diagram and synapse as they are.
    text: '2 to 4 sentences: what kinds of cells are here and how they are wired, in simple terms. Relate it to the diagram named in `diagram`.',
    bullets: ['1 to 2 surprising but true cell-level facts'],
  },
},
tryIt: '1 to 3 sentences: something the reader can do right now to feel this part working. Omit this field if nothing honest fits.',
breaks: {
  text: '1 to 2 sentences: what happens when it is damaged or not working well.',
  bullets: ['2 to 3 examples of conditions or symptoms, explained plainly'],
},
```

`dir` means: `in` = this part receives from that one, `out` = sends to it, `both` = two-way. Your labels must agree with the direction.

Some structures have a `parent` (for example `motor-cortex` has parent `frontal-lobe`). For a parent, keep the text broad and point to its children with `{{id}}` links. For a child, don't repeat what the parent already says.

## Fields to write, per pathway (`src/content/pathways/index.js`)

```js
summary: '2 to 3 sentences introducing the journey.',
steps: [
  // KEEP title, focus, route, view, slice. Add only:
  { title: '...', text: '2 to 4 sentences for this step. Link the parts involved with {{id}}.', /* existing fields */ },
],
```

Each step's text should follow on from the previous one, like a story.

## Markup you can use inside any text

- `**bold**` for a key phrase (use rarely, at most once per paragraph).
- `[[term]]` or `[[term|shown text]]` underlines a word and shows its glossary definition on hover. The **term must exist in the glossary** (see list below). Example: `[[neuron|neurons]]`.
- `{{id}}` or `{{id|shown text}}` links to another structure. The **id must be from the list below**. Example: `{{motor-cortex|motor cortex}}`.
- Separate paragraphs in `text` with a blank line (`\n\n`).
- Use JavaScript single-quoted strings and escape apostrophes (`\'`).

### Valid structure ids

frontal-lobe, prefrontal-cortex, motor-cortex, brocas-area, parietal-lobe, somatosensory-cortex, posterior-parietal, temporal-lobe, auditory-cortex, wernickes-area, occipital-lobe, visual-cortex, cingulate-cortex, insula, thalamus, hypothalamus, striatum, globus-pallidus, substantia-nigra, hippocampus, amygdala, corpus-callosum, cerebellum, midbrain, pons, medulla, spinal-cord

(`eye`, `ear` and `hand` are body anchors used in pathway routes. Don't use them in `{{ }}` links.)

### Glossary terms that exist

neuron, axon, dendrite, synapse, neurotransmitter, receptor, action potential, excitatory, inhibitory, cortex, grey matter, white matter, hemisphere, lobe, gyrus, sulcus, nucleus, pyramidal cell, granule cell, Purkinje cell, interneuron, dopamine, glutamate, GABA, neuromodulator, ataxia, myelin

To add a new term, also add it to `src/content/glossary/index.js` as `term: 'One or two plain sentences.'`. Keep definitions beginner-friendly.

## Example

The `cerebellum` entry in `src/content/structures/hindbrain.js` is fully written. Match its length, tone and structure.

## When you finish a file

1. Run `node tools/validate.mjs`. It lists any missing text and any broken `{{id}}` references. Fix what it reports for the file you edited.
2. Check that you didn't change any `shape`, `color`, `view`, `connections[].id`/`dir`, `diagram`, `synapse`, `focus` or `route` values.
3. Search your output for "—" and remove any em dashes.
