# Handoff: pending work on Brain Explorer

This is written for the next model picking up the project. Read it top to bottom before editing.

## What this is

A no-build web app with three modes in a top bar: Parts, Pathways and Ask. In Parts mode the left sidebar lists brain parts. Pathways opens a full-width library; picking one starts a tour with no sidebar. Ask is a question screen that lights up the parts involved. Centre: a rotatable 3D holographic brain made of glowing points (Three.js 0.160 from a CDN via importmap). Right: an explainer with four zoom levels (Where it is / What it does / How it connects / Down to cells), plus "Try it" and "When it goes wrong".

Run it: `cd ~/Desktop/Projects/brain-explorer && npm start`, then open http://localhost:5173. Ask needs `TYPESAFE_API_KEY` in `.env` (see README). Check content with `npm run validate`.

The user is a beginner in neuroscience. Keep all text plain. The user dislikes em dashes, hype words and polished "AI" phrasing.

## File map

| File | What it does |
|---|---|
| `index.html` | Layout shell, importmap, fonts. The first child of `<body>` is a design-direction comment. Leave it in place. |
| `styles.css` | All styling. Dark theme; `--accent` is set to the selected structure's colour. |
| `server.py` | Static server (app files only, localhost only) and the `/api/ask` proxy that holds the API key. |
| `src/main.js` | Hash routing (`#/`, `#/s/<id>/<level>`, `#/pathways`, `#/p/<id>/<step>`, `#/ask/<q>`), sets the mode class on `.app`, wires the sidebar, library, explainer, scene and toolbar. Keyboard: arrows, Esc, Space. |
| `src/scene/brain-scene.js` | The 3D engine: point shader, bloom, focus/highlight, arcs, picking, camera flights, slice. |
| `src/scene/shapes.js` | Point-cloud generators (`cortex`, `ellipsoid`, `tube`, `band`, `parts`, `custom`) and brain constants. |
| `src/scene/noise.js` | Seeded random and Perlin noise. |
| `src/content/structures/*.js` | One object per brain part: shape, colour, camera view, connections, text. |
| `src/content/pathways/index.js` | Guided tours: steps with focus, route, view, category. Sections live in `pathways/groups.js`. |
| `src/content/ask-presets.js` | Saved Ask answers checked by hand. Drop wrong answers rather than editing them. |
| `src/content/diagrams/index.js` | Circuit diagrams for the "Down to cells" level. |
| `src/content/synapses.js`, `glossary/index.js`, `levels.js`, `groups.js`, `anchors.js` | Supporting data. |
| `src/content/index.js` | Merges everything and exports `validate()`. |
| `src/ui/*.js` | Explainer, sidebar, library, Ask screen, SVG diagrams, text markup, icons. |
| `tools/validate.mjs` | Lists missing text and broken references. |

Coordinates: +x is the person's LEFT, +y is up, +z is the front. The brain is about 1.7 units long front to back. The default camera looks at the left side of the head (front on screen-left).

## Current state

- Everything renders with no console errors, as of the last browser check.
- All 31 structures and 11 pathways exist with shapes, colours, connections and taglines.
- Only the **cerebellum** has full text. Everything else shows a dashed "Not written yet" box that names the file and field to fill in. Content writing is covered by `CONTENT_PROMPT.md`.

## Pending tasks, in priority order

### 1. Verify the latest tuning edits (untested)

These were changed just before handoff and have not been checked in the browser yet:

- `shapes.js` `pattern('gyri')`: higher noise frequency (9.5, plus a finer octave) and a thinner fill (0.045), so the cortex shows more folds. Check that the lobes still look like a brain and not like static.
- `brain-scene.js` `focus()`: context brightness went up (cortex 0.12 to 0.13, deep structures 0.1) and the focused deep structure's `hi` went down to 0.72 so it doesn't blow out to white.
- `brain-scene.js` `flyTo()`: distance is now `clamp(rad * 3.2 + 1.05, 1.75, 3.85)`. The home distance is 3.85. Before this, the camera flew in so close that the surrounding brain disappeared.
- Orientation labels ("Front"/"Back") are clamped inside the stage.
- `styles.css` `.group-h` now stacks the group name above its subtitle.
- `format.js`: glossary markup is now `[[term|shown]]`, matching `{{id|shown}}`. It used to be the other way round.

### 2. Background haze (not solved)

The stage still has a soft blue-grey glow in the middle instead of near-black like the reference image. Already tried: clamping point size (max 26px), fading points close to the camera, and tighter bloom (strength 0.75, radius 0.22, threshold 0.12). Next steps:

- Set bloom strength to 0 and see if the haze goes away. If it does, it's bloom picking up the thousands of dim additive points. Try threshold 0.25 to 0.35, or lower the fill point brightness (`vAlpha = b * mix(0.5, 1.0, aSize)`: try `mix(0.25, 1.0, aSize)`).
- If it stays with bloom off, it's the stacked additive fill points. Reduce the fill share in `pattern()` or the `uBase` values.
- Also try `bloom.setSize` at half resolution; the lowest mips spread light widely.

### 3. Visual tuning

- **Auditory cortex** is too small (about 128 points). In `src/content/structures/cortex.js`, loosen its `test` (for example, change `y > -0.075` to about `y > -0.1`, or widen the z range).
- Check the cerebellum and brainstem against the cortex from the `left`, `back` and `below` views. The occipital lobe should overhang the cerebellum slightly.
- Check the slice view (toolbar "Slice", or any structure with `slice: true`, such as `cingulate-cortex`). The medial wall should read clearly.
- Check arcs on the "connects" level (for example `#/s/hippocampus/connects`). They should be visible but not louder than the focused structure.
- Check the "Down to cells" diagrams (`#/s/cerebellum/cells`). The SVG labels must not overlap and the spike animations must run.

### 4. Docs

Write `README.md`: how to run, file map (copy from above), and how to add each kind of thing:

- **Structure:** add an object to one of `src/content/structures/*.js`. Required fields: `id`, `name`, `group`, `color`, `shape`, `view`, `tagline`, `levels.connects.connections`, `levels.cells.diagram` and `synapse`. Optional: `parent` (for nesting in the list), `slice: true` (auto-slice the brain when selected), plus all the text fields.
  - Cortical areas use `shape: { type: 'cortex', test: (p) => ... }`, where `p` has `x, y, z, ax (abs x), side, lobe, medial, central`.
  - Deep parts use `ellipsoid` / `tube` / `band`, or `parts: [...]` to combine several.
  - `mirror: true` duplicates the shape on both sides.
  - `pattern` can be `gyri`, `fine`, `folia`, `rings`, `fibers` or `cross`.
- **Pathway:** add to `src/content/pathways/index.js`. Each step has `title`, `focus: [ids]`, `route: [[from, to], ...]`, optional `view` and `slice`.
- **Diagram:** add to `src/content/diagrams/index.js` (neurons with kind and position, links typed `excite`/`inhibit`/`modulate`, optional bands). Reference it from a structure's `levels.cells.diagram`.
- **Glossary term:** add a key to `src/content/glossary/index.js`, then use `[[term]]` in text.
- **Zoom level:** edit `src/content/levels.js`. The explainer reads `levels[id].text` and `bullets` generically. The scene mode per level is `focus`, `activity` or `wiring`.
- Always run `npm run validate` afterwards.

### 5. Small cleanups

- Add a favicon. It's the only console error right now (a 404). An inline SVG `<link rel="icon" href="data:image/svg+xml,...">` using the three-circle brand mark from `index.html` is enough.
- Rename `package.json` scripts if you want, but keep `start` as a plain static server (no build step).

## Rules

- No build step, no framework. Plain ES modules.
- Don't restyle the overall look: black background, glowing points, per-structure colour. The user picked it from a reference image.
- Keep text beginner-level. Use no em dashes in anything user-facing.
- In `styles.css`, avoid gradient text, uppercase "eyebrow" labels above headings, cards nested inside cards, and thick coloured left borders.
- After engine changes, reload the page and check the console for errors. Look at at least home, one cortical area, one deep structure and one pathway.
