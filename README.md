# Brain Explorer

An interactive 3D atlas of the human brain. Pick a part, see it light up inside a glowing point-cloud brain, and read what it does in plain language. Guided pathways walk you through seeing, moving, remembering, and fear.

![Brain Explorer showing the cerebellum highlighted in 3D with its explainer](screenshot.png)

## Run it

No build step, no framework. Plain ES modules with Three.js 0.160 from a CDN (via importmap), so you need internet access for the 3D engine.

```sh
cd ~/Desktop/Projects/brain-explorer
npm start
```

Then open http://localhost:5173. If that port is busy, serve another one directly:

```sh
python3 -m http.server 5174
```

Check content with:

```sh
npm run validate
```

## What is inside

- 27 structures with shapes, colours, camera views, connections, and beginner-level text
- 6 guided pathways (seeing, moving, remembering, fear, hearing a sentence, catching a ball)
- 4 zoom levels per structure: where it is, what it does, how it connects, down to cells
- Cell circuit diagrams, animated synapses, and hover glossary definitions
- Hash routing (`#/s/<id>/<level>`, `#/p/<id>/<step>`, `#/`). Keyboard: arrows, Esc, Space.

Shapes are simplified for explanation, not an anatomical atlas. Coordinates: +x is the person's left, +y is up, +z is the front. The brain is about 1.7 units long front to back.

## File map

| File | What it does |
|---|---|
| `index.html` | Layout shell, importmap, fonts |
| `styles.css` | All styling (dark theme, per-structure accent colour) |
| `src/main.js` | Hash routing, wires sidebar, explainer, scene, toolbar |
| `src/scene/brain-scene.js` | 3D engine: point shader, bloom, focus/highlight, arcs, picking, camera flights, slice |
| `src/scene/shapes.js` | Point-cloud generators (`cortex`, `ellipsoid`, `tube`, `band`, `parts`, `custom`) |
| `src/scene/noise.js` | Seeded random and Perlin noise |
| `src/content/structures/*.js` | One object per brain part: shape, colour, camera view, connections, text |
| `src/content/pathways/index.js` | Guided tours: steps with focus, route, view |
| `src/content/diagrams/index.js` | Circuit diagrams for the "Down to cells" level |
| `src/content/synapses.js`, `glossary/index.js`, `levels.js`, `groups.js`, `anchors.js` | Supporting data |
| `src/content/index.js` | Merges everything, exports `validate()` |
| `src/ui/*.js` | Explainer, sidebar, SVG diagrams, text markup, icons |
| `tools/validate.mjs` | Lists missing text and broken references |

## Adding content

Keep all text beginner-level: short sentences, concrete everyday examples, no em dashes, no hype words. See `CONTENT_PROMPT.md` for the full writing guide.

**Structure:** add an object to one of `src/content/structures/*.js`. Required: `id`, `name`, `group`, `color`, `shape`, `view`, `tagline`, `levels.connects.connections`, `levels.cells.diagram`, `synapse`. Optional: `parent` (nests it in the list), `slice: true` (auto-slices the brain when selected), plus all the text fields.

- Cortical areas use `shape: { type: 'cortex', test: (p) => ... }`, where `p` has `x, y, z, ax` (abs x), `side`, `lobe`, `medial`, `central`.
- Deep parts use `ellipsoid` / `tube` / `band`, or `parts: [...]` to combine several.
- `mirror: true` duplicates the shape on both sides.
- `pattern` can be `gyri`, `fine`, `folia`, `rings`, `fibers`, or `cross`.

**Pathway:** add to `src/content/pathways/index.js`. Each step has `title`, `focus: [ids]`, `route: [[from, to], ...]`, optional `view` and `slice`. Add `summary` plus a 2 to 4 sentence `text` per step that follows the previous one like a story.

**Diagram:** add to `src/content/diagrams/index.js` (neurons with kind and position, links typed `excite`/`inhibit`/`modulate`, optional bands). Reference it from a structure's `levels.cells.diagram`.

**Glossary term:** add a key to `src/content/glossary/index.js`, then use `[[term]]` in text. Link structures with `{{id}}`.

**Zoom level:** edit `src/content/levels.js`. The explainer reads `levels[id].text` and `bullets` generically. Scene mode per level is `focus`, `activity`, or `wiring`.

Always run `npm run validate` afterwards.
