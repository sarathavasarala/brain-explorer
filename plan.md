# Brain Explorer: Visual Dictionary plan

Hand this whole file to the implementing model. Work one phase at a time. Each phase ends in a working app and its own commit.

## 0. Read first, rules that apply to every phase

1. Read `AGENTS.md`, `README.md` and `CONTENT_PROMPT.md` before touching code. They are the source of truth for style, schemas and tone.
2. No build step. Plain ES modules, Three.js 0.160 from the importmap, one `styles.css`. Do not add npm dependencies, TypeScript, frameworks or bundlers.
3. Do not touch `server.py`, `src/services/ask.js`, `src/ui/ask.js` or `src/content/ask-presets.js`.
4. No em dashes anywhere (user text, comments, docs). Follow the banned-word list in `CONTENT_PROMPT.md`.
5. Content accuracy beats content volume. Only use the facts in the fact sheets in section 9 of this file, or facts you are certain are textbook standard. If unsure, leave it out. Never invent numbers.
6. After every phase:
   - `npm run validate` must print OK.
   - `npm start`, open http://localhost:5173, click through every new route, and check the browser console has zero errors and zero `[brain]` warnings.
   - Existing routes must still work exactly as before: `#/`, `#/s/thalamus/where`, `#/s/cerebellum/cells`, `#/pathways`, `#/p/moving/3`, `#/ask`.
   - Keep the frame rate smooth. Budget: no more than 15,000 extra points on screen from any new feature.
7. Coordinates: +x is the person's left, +y up, +z front. The camera looks at the left side by default, so draw one-sided things on x > 0.
8. Commit message per phase: `Phase N: <short summary>`.

## 1. What we are building

Today "Parts" is a dictionary of places. We turn it into a visual dictionary with three kinds of entries, all cross-linked:

| Kind | Examples | Route | What the 3D stage shows |
|---|---|---|---|
| Part (exists) | thalamus, striatum | `#/s/<id>/<level>` | the part lit up in the brain (unchanged) |
| Chemical (new) | dopamine, GABA, cortisol | `#/chem/<id>/<tab>[/<sub>]` | the "chemical lens": the whole brain recoloured by where it is made, where its fibres go, and where its receptors are |
| Cell (new) | Purkinje cell, astrocyte | `#/cell/<id>/<tab>` | a single 3D neuron or glial cell in the same glowing point style, firing |

Hormones are chemicals with `kind: 'hormone'`. They use the same page, plus a simple body view (Phase 5).

### Visual grammar (use it everywhere, and show it in a small legend)

| Signal type | Look | Speed |
|---|---|---|
| Fast point to point wiring (glutamate, GABA) | thin line, sharp small dots | fast (existing arcs) |
| Neuromodulator (dopamine, serotonin, noradrenaline, acetylcholine) | a branching tree of fibres from a small source that fans out and "rains" into targets | slow, soft pulses |
| Hormone | large soft blobs drifting through a faint body outline | slowest |
| Receptor density | the target itself glows in the chemical's colour, brighter where there are more receptors | static glow |

## 2. Phase overview

| Phase | Goal | Size |
|---|---|---|
| 1 | Plumbing: entry registry, routes, sidebar tabs, typed links, validation | small |
| 2 | Chemical pages (content + explainer + synapse stepper with drugs) | medium |
| 3 | Chemical lens in 3D (density glow + branching fibre trees + tract toggles) | medium-large |
| 4 | Cells (content + 3D neuron generator + firing shader) | large |
| 5 | Hormones and the body view | medium |
| 6 | Cross-links on part pages, global search, docs | small |

Do them in order. Phase 2 can ship without Phase 3 (pages first, then visuals).

## 3. Phase 1: Plumbing

### 3.1 New content files (empty but valid)

- `src/content/chemicals/index.js` exports `[]` for now (schema in 4.1).
- `src/content/cells/index.js` exports `[]` (schema in 6.1).
- `src/content/chemicals/groups.js`:
  ```js
  export default [
    { id: 'fast', label: 'Fast signals', blurb: 'The go and stop signals used at most synapses.' },
    { id: 'modulator', label: 'Neuromodulators', blurb: 'Sent from small clusters to large areas. They change how circuits behave.' },
    { id: 'hormone', label: 'Hormones', blurb: 'Carried in the blood. Slow, body wide messages.' },
  ];
  ```
- `src/content/cells/groups.js`:
  ```js
  export default [
    { id: 'excitatory', label: 'Excitatory neurons', blurb: 'Cells that push the next cell to fire.' },
    { id: 'inhibitory', label: 'Inhibitory neurons', blurb: 'Cells that hold other cells back.' },
    { id: 'modulatory', label: 'Modulatory and output neurons', blurb: 'Cells that broadcast or drive the body.' },
    { id: 'glia', label: 'Glia', blurb: 'The support cells. About as many as neurons.' },
  ];
  ```

### 3.2 `src/content/index.js`

- Import and export `chemicals`, `chemicalGroups`, `cells`, `cellGroups`, plus `chemById` and `cellById` Maps.
- Add a resolver used by the formatter and validator:
  ```js
  // "thalamus" -> part, "chem:dopamine" -> chemical, "cell:purkinje" -> cell
  export function resolveRef(ref) {
    const [a, b] = ref.includes(':') ? ref.split(':') : ['part', ref];
    const id = (b || '').trim();
    if (a === 'part' && byId.has(id)) { const s = byId.get(id); return { kind: 'part', id, name: s.name, color: s.color, href: `#/s/${id}` }; }
    if (a === 'chem' && chemById.has(id)) { const c = chemById.get(id); return { kind: 'chem', id, name: c.name, color: c.color, href: `#/chem/${id}` }; }
    if (a === 'cell' && cellById.has(id)) { const c = cellById.get(id); return { kind: 'cell', id, name: c.name, color: c.color, href: `#/cell/${id}` }; }
    return null;
  }
  ```
- In `validate()`, change the `{{...}}` check to use `resolveRef` so `{{chem:dopamine}}` and `{{cell:purkinje}}` are valid. Keep the existing behaviour for plain ids.

### 3.3 `src/ui/format.js`

- In `fmt`, the `{{id|shown}}` branch should call `resolveRef(id)` and render `<a class="xref xref-${kind}" href="${href}" style="--c:${color}">${shown || name}</a>`.
- In the `[[term]]` branch: if the term also resolves as a chemical (`resolveRef('chem:' + slug(term))`, slug = lowercase, spaces to hyphens), render it as a link that still carries the tooltip: `<a class="term xref" data-term=".." href="#/chem/..">`. This makes every existing `[[dopamine]]` in content clickable for free.

### 3.4 Routing in `src/main.js`

Extend `parseHash()`:
```
#/chem                     -> { type: 'chemhome' }
#/chem/<id>/<tab>/<sub>    -> { type: 'chem', id, tab, sub }   tab defaults to 'overview'
#/cell                     -> { type: 'cellhome' }
#/cell/<id>/<tab>          -> { type: 'cell', id, tab }         tab defaults to 'shape'
```
- `MODE`: `chemhome`, `chem`, `cellhome`, `cell` all map to `'parts'` so the sidebar and explainer layout stay as they are. The topbar "Parts" link stays highlighted. Rename its visible label to "Atlas" in `index.html` (keep `data-mode="parts"`).
- In `apply()`, add branches that call new renderers (Phase 2 and 4). For Phase 1 they can render a simple placeholder article.
- Escape key: from `chem`/`cell` go to `#/chem` / `#/cell`; from those homes go to `#/`.
- Up/down arrows: when on a chem or cell route, move through that list (same logic as `orderedIds`, but over chemicals or cells in group order).
- Left/right arrows: move between tabs of the current entry.

### 3.5 Sidebar tabs

- In `index.html`, above the search box, add a segmented control:
  ```html
  <div class="dict-tabs" role="tablist">
    <a data-dict="parts" href="#/">Parts</a>
    <a data-dict="chem" href="#/chem">Chemicals</a>
    <a data-dict="cell" href="#/cell">Cells</a>
  </div>
  ```
- `state.dict` is derived from the route: `s`/`home` -> parts, `chem*` -> chem, `cell*` -> cell. Toggle `.is-on` on the tabs in `setMode`.
- `renderSidebar(el, { dict, selected, query })`: when `dict === 'parts'` do exactly what it does today. For `chem` and `cell`, render the same markup (group headers, `.item` rows with a coloured dot, name, tagline) from the chemical or cell list, grouped by their groups. Item hrefs: `#/chem/<id>` or `#/cell/<id>`.
- The search placeholder changes per tab: "Search parts of the brain" / "Search chemicals" / "Search cell types".
- Style `.dict-tabs` like the existing `.modes` pill control in `styles.css` (reuse its variables, do not invent new colours).

### 3.6 Validation

`tools/validate.mjs`: print counts for chemicals and cells in the OK line. Missing-text report should include chemicals and cells once they have content.

### Phase 1 done when
- All old routes behave the same.
- `#/chem` and `#/cell` show the tabs switched and an empty list with a friendly "Coming soon" placeholder in the explainer.
- `{{chem:x}}` for an unknown x is reported by `npm run validate`.

## 4. Phase 2: Chemical pages

### 4.1 Chemical schema (`src/content/chemicals/index.js`)

Split into `fast.js`, `modulators.js`, `hormones.js` in the same folder and merge them in `index.js`, like the structures folder does.

```js
{
  id: 'dopamine',                 // must equal the key in src/content/synapses.js when one exists
  name: 'Dopamine',
  group: 'modulator',             // 'fast' | 'modulator' | 'hormone'
  color: '#b98cff',               // must equal synapses.js colour for the same id
  tagline: 'One short sentence.',
  analogy: 'One sentence comparing it to something familiar.',
  synapse: 'dopamine',            // key in synapses.js, optional for hormones
  pathwayId: 'dopamine-pathways', // existing guided tour, optional
  madeFrom: 'tyrosine',           // plain text
  madeIn: ['substantia-nigra', 'vta', 'hypothalamus'],   // structure ids where the cell bodies are
  overview: { text: '...', bullets: ['...'] },

  // Named textbook pathways. `to` can list several targets. `local: true` = no long tract (for interneurons).
  tracts: [
    {
      id: 'nigrostriatal',
      name: 'Nigrostriatal pathway',
      from: 'substantia-nigra',
      to: ['striatum'],
      job: 'Movement and habits',
      text: '2 to 3 sentences.',
      whenItFails: 'One sentence.',            // e.g. Parkinson's
      whenBlocked: 'One sentence, optional.',  // e.g. antipsychotic side effects
    },
  ],

  // How many receptors each area has for this chemical, 0 to 1. Drives the lens glow.
  density: { striatum: 1, 'prefrontal-cortex': 0.45 },

  receptors: [
    { id: 'D1', family: 'D1-like (D1, D5)', effect: 'excite', where: ['striatum', 'prefrontal-cortex'], text: 'One or two sentences.' },
  ],

  // The synapse life cycle, one sentence each. Used by the synapse stepper.
  life: {
    made: '...', packed: '...', released: '...', binds: '...',
    cleared: '...',
    clearedBy: 'reuptake',   // 'reuptake' | 'enzyme' | 'astrocyte' | 'blood' (hormones)
  },

  drugs: [
    { id: 'cocaine', name: 'Cocaine', acts: 'reuptake-block', target: 'DAT', text: 'One sentence.' },
  ],
  // acts is one of: 'precursor' | 'release' | 'reuptake-block' | 'enzyme-block' | 'receptor-block' | 'receptor-mimic' | 'boost-receptor' | 'release-block'

  breaks: { text: '...', bullets: ['...'] },
  tryIt: 'Optional everyday observation.',

  // Hormones only (Phase 5):
  // axis: [{ from, to, carries: 'CRH', via: 'portal' | 'blood' | 'nerve', text }],
  // feedback: [{ from, to: [...], text }],
  // timescale: 'minutes to hours',
}
```

Missing structures that the content below needs. Add them in Phase 2 to `src/content/structures/deep.js`, with the full structure text like every other part:
- `nucleus-accumbens`: `parent: 'striatum'`, small ellipsoid at the front-bottom of the striatum, mirror true. It is the ventral striatum, the main target of the mesolimbic pathway.
- `pituitary`: group `deep`, small ellipsoid hanging below the hypothalamus (roughly `center: [0, -0.2, 0.09]`, radii about `[0.03, 0.025, 0.03]`, not mirrored). Check visually with Slice on that it sits under the hypothalamus. It is needed by the tuberoinfundibular tract and all hormone axes.
- `pineal-gland` can wait until Phase 5.

Validation to add in `validate()`:
- Unique ids, known group, `color` and `synapse` match `synapses.js`.
- Every id in `madeIn`, `tracts[].from`, `tracts[].to`, `density` keys, `receptors[].where` is a known structure or anchor.
- `density` values are between 0 and 1.
- `drugs[].acts` and `receptors[].effect` are in their enums.
- `pathwayId` exists.
- Scan all text fields for markup, like structures.

### 4.2 Chemical page tabs

Add `src/content/chem-tabs.js`:
```js
export default [
  { id: 'overview', label: 'Overview', scale: 'What it is' },
  { id: 'tracts', label: 'Pathways', scale: 'Where it goes' },
  { id: 'synapse', label: 'At the synapse', scale: 'Made, used, cleared' },
  { id: 'medicine', label: 'Drugs and disorders', scale: 'When it goes wrong' },
];
```
Hormones replace `tracts` with `{ id: 'axis', label: 'The chain', scale: 'Gland to gland' }`.

### 4.3 `src/ui/chem.js` (new)

Export `renderChemHome()` and `renderChem(chem, tab, sub)`. Reuse the classes from `explainer.js` (`.ex`, `.crumbs`, `.ex-title`, `.tagline`, `.analogy`, `.ladder`/`.rung`, `.level`, `.extra`, `.chips`, `.pager`) so it looks native. Do not create a second design language. Move `ladder()` from `explainer.js` into a shared helper that takes a list of tabs so both files use it.

Page content per tab:
- **Overview**: `overview.text` and bullets. A "Made in" chip row (`madeIn` links to parts). A "Made from" line. A "Take the guided tour" chip if `pathwayId` exists. Also the speed widget (4.5).
- **Pathways**: one card per tract with name, `from -> to` as part chips, job, text, and `whenItFails` / `whenBlocked` shown as small labelled notes. Each card is a link to `#/chem/<id>/tracts/<tractId>`; the selected card gets `.is-on`. A "Show all" link returns to `#/chem/<id>/tracts`.
- **At the synapse**: the synapse stepper (4.4), then the receptor list: each receptor as a row with name, family, effect badge (reuse `LINK_COLORS` from `diagrams.js`), where it is (part chips) and text.
- **Drugs and disorders**: drug rows (name, what it does, which receptor or transporter), each row links to `#/chem/<id>/synapse/<drugId>` so the stepper shows that drug. Then `breaks` text and bullets.

`renderChemHome()`: one short intro paragraph, the speed widget, then the three groups as chip rows.

### 4.4 Synapse stepper (`src/ui/synapse-stepper.js`, new)

`renderSynapseStepper(chem, { stage, drugId })` returns HTML with an SVG built on top of the existing `renderSynapse` drawing style in `diagrams.js` (same sizes, same `CELL` colour, same vesicles). Five stages with buttons under the SVG:

| Stage | What animates | Caption from |
|---|---|---|
| 0 made | small precursor dots inside the sending terminal turn into the chemical's colour | `life.made` |
| 1 packed | coloured dots move into vesicles | `life.packed` |
| 2 released | a spike (bright dot) runs down the terminal, vesicles fuse, molecules spill into the gap (current animation) | `life.released` |
| 3 binds | molecules sit on receptor shapes; show one receptor per `receptors[]` entry (max 3) labelled with its id | `life.binds` |
| 4 cleared | if `clearedBy === 'reuptake'`: molecules travel back up into a transporter shape on the sending side. If `'enzyme'`: molecules break into two small grey dots in the gap. If `'astrocyte'`: they drift sideways into a faint star-shaped astrocyte outline. | `life.cleared` |

Drug overlay. When `drugId` is set, draw the drug as white molecules and change the scene:
- `reuptake-block`: a red X over the transporter; molecules stay in the gap longer (longer loop).
- `receptor-block`: grey caps on the named receptor; molecules bounce off.
- `receptor-mimic`: white molecules land on the receptors instead of the coloured ones.
- `enzyme-block`: a red X over the enzyme; more molecules stay.
- `precursor`: more dots at stage 0.
- `release`: vesicles leak without a spike.
- `release-block`: vesicles never fuse.
- `boost-receptor`: receptor glows brighter when the normal molecule binds.

Use SMIL `<animate>` like the existing diagrams. Show one stage at a time, plus a "Play all" button that walks the stages every 2.5 s. Stage state lives in the URL: `#/chem/<id>/synapse/<drugId?>` for the drug. Keep the stage in a module variable; clicking a stage button re-renders only the stepper element (`explainerEl.querySelector('.stepper').outerHTML = ...`). Add a click handler in `main.js` for `[data-stage]` and `[data-play-stepper]`.

A caption above the SVG shows the drug text when a drug is on, for example "Cocaine blocks the dopamine transporter, so dopamine stays in the gap longer."

### 4.5 Speed widget (`src/ui/speed.js`, new)

A small SVG with three rows, each a track with a moving dot: "Nerve signal, about a thousandth of a second", "Neuromodulator, seconds to minutes", "Hormone, minutes to hours". The dots use the same colours as the visual grammar and move at clearly different speeds (for example 0.6 s, 4 s and 14 s per loop). It is a picture of the idea, not a real timescale, so add a small note that says the speeds are not to scale.

### 4.6 Content to write in Phase 2

Write complete entries using section 9:
- fast: `glutamate`, `gaba`
- modulator: `dopamine`, `serotonin`, `noradrenaline`, `acetylcholine`
Hormones wait for Phase 5. `oxytocin` in synapses.js becomes a hormone entry in Phase 5.

### Phase 2 done when
- All six chemicals have every field filled and validate passes.
- Every tab renders, the stepper plays all five stages, and at least two drugs per chemical visibly change the stepper.
- `[[dopamine]]` in existing structure text is now a link to `#/chem/dopamine` with the tooltip still working.
- In Phase 2 the 3D stage can simply `focus(madeIn)` with `context: Object.keys(density)`. The real lens comes in Phase 3.

## 5. Phase 3: The chemical lens in 3D

All changes are in `src/scene/brain-scene.js` plus wiring in `main.js`. Read the whole file first. Key facts about it:
- The cortex is one `THREE.Points` (`cortexPoints`) with per-point `aHi` / `aHiColor` attributes. Regions are masks over it (`rec.mask`).
- Deep parts are separate `THREE.Points` with their own material (`rec.mat`) and `rec.hi` / `rec.base` / `rec.activity` targets that the frame loop eases toward.
- `makeMaterial()` gives the shared point shader, which blooms. Use it for new points so they match.
- `setArcs()` draws Bezier arcs plus animated dots. Do not break it; the lens adds a separate group.

### 5.1 New public API

```js
scene.showChemical({
  color: '#b98cff',
  sources: ['vta', 'substantia-nigra'],          // made in: bright, pulsing
  density: { striatum: 1, 'prefrontal-cortex': 0.45 },
  tracts: [{ id: 'nigrostriatal', from: 'substantia-nigra', to: ['striatum'], state: 'on' | 'ambient' | 'off', label: 'Nigrostriatal' }],
});
scene.showChemical(null);   // leave the lens, restore normal colours
```

### 5.2 Recolouring (density glow)

1. At build time, for each deep rec keep a copy of its original highlight colours: `rec.hiOrig = rec.obj.geometry.getAttribute('aHiColor').array.slice()`.
2. Write `paintLens(color, sources, density)`, modelled on `paintSketch()`:
   - Cortex: for each region id in `density`, set `aHi[i] = 0.25 + 0.75 * d` for its mask points, and `aHiColor` to the lens colour, not the region colour. Cross-fade like `paintSketch` does (copy to `aHiPrev` first, set `uMix = 0`).
   - Deep recs: if the id is in `density`, fill its `aHiColor` with the lens colour (tiny random lightness jitter like `tintArray`), set `hi = 0.2 + 0.6 * d`. Sources get `hi = 1`, `activity = 1`. Everything else `base = 0.07`, `hi = 0`.
   - Add a cross-fade for deep recs too: before rewriting, copy `aHiColor` into `aHiColorPrev`, set `rec.mat.uniforms.uMix.value = 0`, and in `frame()` ease every deep rec's `uMix` to 1, like the cortex.
3. `focus()` and `paintSketch()` must call `restoreLens()` first if the lens is on. It copies `rec.hiOrig` back into `aHiColor` for every deep rec and removes the tree group.

### 5.3 Branching fibre trees

This is the core picture: a small source whose fibres fan out and spread into a big target.

```js
function samplePoints(id, n, rnd) {
  // region: random indices where rec.mask[i] === 1 and x > 0.01 (left side only)
  // deep:   random points from rec.obj.geometry position with x > 0.01 if possible
  // anchor: n copies of rec.center with small jitter
  // return array of THREE.Vector3
}

function buildTree(fromId, toId, { branches = 16, color, state, rnd }) {
  const a = centerOf(fromId);                     // use the left copy for mirrored parts (x > 0)
  const b = centerOf(toId);
  const trunk = buildArc(a, b, 0.55);             // existing helper
  const split = trunk.getPoint(0.72);             // where the trunk starts to branch
  const ends = samplePoints(toId, branches, rnd);
  const paths = ends.map((e) => {
    const mid = split.clone().lerp(e, 0.5).add(randomOffset(rnd, 0.04));
    const branch = new THREE.QuadraticBezierCurve3(split, mid, e);
    const path = new THREE.CurvePath();
    path.add(new SubCurve(trunk, 0, 0.72));       // small helper: a Curve that maps t to trunk.getPoint(t * 0.72)
    path.add(branch);
    return path;
  });
  return { trunk, paths, split };
}
```

Rendering per tree:
- Fibre points: sample 140 points along the trunk and 22 along each branch. Tiny size (`aSize` 0.25 to 0.45), colour = lens colour times 0.35 (`state: 'on'`), 0.15 (`'ambient'`) or hidden (`'off'`). One `THREE.Points` per lens (merge all trees) with `makeMaterial(5)`.
- Pulses: 1 soft dot per branch for `'on'` trees, fewer for ambient. Each dot moves along its `CurvePath` with `t = (time * 0.09 + offset) % 1`, so they are clearly slower than normal arcs (0.32). Size 1.0 to 1.4.
- Release sparkle: when a pulse passes t > 0.95, briefly lift the brightness of the end point (a second tiny Points set of branch tips whose size pulses with `sin`). This makes the fibres look like they "rain" into the target.
- Mirrored sources draw on the left only. Say so in the stage note while the lens is on: "One side shown. The same fibres exist on the right."
- Local chemicals (tracts with `local: true`, and glutamate / GABA in general): no tree. Instead set `activity = 0.6` on all density targets so they twinkle.
- Budget: keep total lens points under 12,000. Clamp `branches` so `sum(branches * 22 + 140) < 12000`.

Tract labels: for each `'on'` tract, add a label element to `labelsEl` placed at the trunk midpoint, styled like `.anchor-label`. Update positions in `updateLabels()`. Remove them in `restoreLens()`.

### 5.4 Wiring in `main.js`

For `type: 'chem'`:
- `tab === 'tracts'` with a `sub` (tract id): that tract `'on'`, the rest `'ambient'`. Fly to `[from, ...to]` of that tract.
- `tab === 'tracts'` without `sub`, or `overview`: all tracts `'on'`. Fly to all sources and targets with view `'left'`.
- `tab === 'synapse'` or `'medicine'`: all tracts `'ambient'`, density glow on. Do not fly again (use the existing `state.flown` key).
- Leaving any chem route: `scene.showChemical(null)`.
- Clicking a glowing part in the lens should still open that part (existing `onPick`).
- Force slice on (`scene.forceSlice(true)`) whenever a source is a deep midline part (raphe, vta, locus coeruleus, basal forebrain), otherwise the trees are hidden behind cortex. Simplest rule: slice on for every modulator.

### 5.5 Legend

Add a small legend at the bottom left of the stage (HTML, not 3D) shown only in lens mode: "Bright = where it is made", "Fibres = where it is sent", "Glow = receptors, brighter means more". Reuse `.stage-note` styles.

### Phase 3 done when
- `#/chem/dopamine/tracts/mesocortical` shows a thin tree from VTA fanning across the prefrontal cortex, with the three other dopamine tracts faint.
- Switching `#/chem/dopamine` to `#/chem/serotonin` recolours smoothly (no flash).
- Returning to `#/s/thalamus/where` shows normal colours, no leftover fibres or labels.
- No frame drops on a laptop with all four dopamine tracts on.

## 6. Phase 4: Cells

### 6.1 Cell schema (`src/content/cells/index.js`)

```js
{
  id: 'purkinje',
  name: 'Purkinje cell',
  group: 'inhibitory',               // from cells/groups.js
  color: '#ffd36b',
  tagline: 'One short sentence.',
  analogy: 'One sentence.',
  transmitter: 'gaba',               // chemical id, or null for glia
  where: ['cerebellum'],             // structure ids where it lives
  size: 'Cell body about 0.05 mm across',   // plain text, only from the fact sheet
  morph: { style: 'purkinje', seed: 7 },   // drives the 3D generator (6.2)
  landmarks: ['soma', 'dendrites', 'axon', 'terminals'],  // which labels to show, keys from generator output
  shape: { text: '...', bullets: ['...'] },
  fires: { text: '...', steps: ['Inputs arrive on ...', 'They add up at ...', 'A spike leaves ...', 'It releases ...'] },
  chem: { text: '...', receptors: ['D1'], modulatedBy: ['dopamine'] },  // chemical ids
  breaks: { text: '...', bullets: ['...'] },
  diagram: 'cerebellar-circuit',     // optional existing diagram id
}
```
Tabs, in `src/content/cell-tabs.js`: `shape` (Its shape), `fires` (How it fires), `lives` (Where it lives), `chem` (Its chemistry).

Validation: known group, `transmitter` in chemicals (or null), `where` ids known, `morph.style` is a known generator style, `modulatedBy` known chemicals, `diagram` exists.

### 6.2 Neuron generator (`src/scene/neuron.js`, new)

```js
export function buildCell({ style, seed }) -> {
  positions: Float32Array, sizes: Float32Array,
  part: Float32Array,   // 0 soma, 1 dendrite, 2 axon, 3 terminal, 4 spine, 5 myelin, 6 context (ghost neighbours, vessels)
  dist: Float32Array,   // 0 at the soma, rising to 1 at the far end of its own tree (dendrite or axon)
  landmarks: { soma: [x,y,z], dendrites: [...], axon: [...], terminals: [...], ... },
  nodes: 0,             // number of myelin gaps, for saltatory firing (0 if unmyelinated)
}
```
Build from one recursive helper, using `mulberry32(seed)` style seeded random from `src/scene/noise.js`:
```js
function grow(out, start, dir, length, radius, depth, rule, part, dist0) {
  // walk the segment in small steps; at each step emit 3 to 6 points on a ring of `radius`
  // around the centre line, tag them with part and dist = dist0 + travelled / totalLength
  // bend dir slightly with noise each step
  // at the end, if depth > 0, spawn rule.children(depth) new branches with shorter length and thinner radius
  // if rule.spines, emit extra points just off the surface tagged part 4
}
```
Cell fits inside a box about 1.4 units tall, centred at the origin. Target 6,000 to 9,000 points per cell.

Styles (one small rule object each):

| style | recipe |
|---|---|
| `pyramidal` | triangular soma; one apical dendrite straight up (+y) with a branching tuft at the top and short side branches; 5 to 7 basal dendrites spreading down and out; spines on; axon down (-y) with a few side branches |
| `stellate` | round soma, 6 to 8 short spiny dendrites in all directions, short local axon |
| `purkinje` | pear soma; one thick trunk up, then dense branching (depth 6) squashed into a flat plane (z times 0.06), no spines on trunk, heavy spines on fine branches; single axon down |
| `granule` | tiny round soma, 4 short dendrites with small claw ends; axon rises then splits in a T into a long thin fibre running along plus and minus x (the parallel fibre) |
| `basket` | round soma, radial smooth dendrites; axon wraps around 3 faint ghost somata (part 6) as dense "basket" rings |
| `chandelier` | round soma; axon ends in rows of short vertical strings of terminals ("candles") aimed at ghost axon starts |
| `msn` | medium round soma, 6 to 8 radial dendrites, depth 2, very dense spines; axon leaves one side |
| `dopamine` | few long smooth dendrites; one axon that becomes a huge thin branching arbor far from the soma (depth 7, many terminals). The message is "one cell, a whole field of contacts" |
| `motor` | large multipolar soma; long straight axon with myelin segments (part 5) and gaps (nodes), ending in a small fan of terminals on a faint muscle strip (part 6) |
| `relay` | round soma with bushy, many-branched dendrites; axon heading up |
| `astrocyte` | small soma, 12 to 20 fine bushy processes; 3 of them end in "feet" on a faint blood vessel tube (part 6) |
| `oligodendrocyte` | small soma; 6 to 8 thin processes, each ending in a myelin sheath (part 5) wrapped around a ghost axon (part 6) |
| `microglia` | small soma, fine branching processes; in the shader these gently sway |

### 6.3 Cell shader

Copy the point shader into a second pair `cellVertexShader` / `cellFragmentShader` in `brain-scene.js`. Add attributes `aPart`, `aDist` and uniforms `uPhase` (0 to 1, loops every 3 s), `uFire` (0 or 1), `uTx` (transmitter colour), `uNodes`.

Firing logic, when `uFire = 1`:
- phase 0.00 to 0.40, inputs: random dendrite and spine points blink (`step(0.985, fract(sin(aRand*91.0 + floor(uTime*6.0))*43758.5))`), plus a soft wave moving inward: glow where `abs((1.0 - aDist) - uPhase / 0.4) < 0.07` for `aPart` 1 or 4.
- phase 0.40 to 0.50, the soma (part 0) brightens.
- phase 0.50 to 0.92, spike: axon points (part 2 and 5) glow where `abs(aDist - (uPhase - 0.5) / 0.42) < 0.05`. If `uNodes > 0`, quantise the front: `floor(front * uNodes) / uNodes`, so the spike jumps gap to gap (saltatory conduction).
- phase 0.92 to 1.00, terminals (part 3) flash in `uTx`.
- microglia: add a slow wobble to position for part 1 using `sin(uTime + aRand * 6.0) * 0.004`.
- context points (part 6): always dim.

When `uFire = 0` (Shape tab) nothing fires, but the parts are tinted slightly differently so dendrites and axon read as distinct: dendrites cell colour, axon a cooler tint, terminals transmitter colour.

### 6.4 Scene API

```js
scene.showCell(cellEntry | null, { fire: false })
```
- Add a `uGlobal` uniform (default 1) to `makeMaterial`, and multiply `vAlpha` by it in the main vertex shader. In `showCell`, ease `uGlobal` on every brain material (cortex, deep, anchors, arcs, dust stays) to 0; on `null`, back to 1.
- Build the cell `Points` lazily and cache by id. Only one visible at a time.
- Fly the camera to the cell (`center [0,0,0]`, distance about 2.6, view `'front'`). Stop auto spin while a cell is shown.
- While a cell is shown, `pick()` returns null so clicks do not select hidden brain parts.
- Landmark labels: for each id in `entry.landmarks`, create a label element (style `.anchor-label`) at `landmarks[id]`, with names from a small map ("Cell body", "Dendrites", "Axon", "Terminals", "Spines", "Myelin", "Node", "Blood vessel"). Position in `updateLabels()`.
- A scale note appears in the stage note: `entry.size`.

### 6.5 Wiring and UI

- `src/ui/cell.js` (new): `renderCellHome()` and `renderCell(cell, tab)` reusing the same explainer classes and the shared ladder helper.
  - Shape: text, bullets, transmitter chip (links to the chemical), "Lives in" part chips.
  - How it fires: text plus the `steps` as a numbered list; a Play / Pause button toggles `uFire` via `scene.setCellFire(on)`.
  - Where it lives: text line plus part chips.
  - Its chemistry: text, receptors, `modulatedBy` chips, existing diagram if `diagram` is set (`renderCircuit`).
- `main.js`:
  - `tab === 'lives'`: `scene.showCell(null)`, then `scene.focus(cell.where, { activity: true })` and fly to them. This is the "zoom back out" moment.
  - Other tabs: `scene.showCell(cell, { fire: tab === 'fires' })`.
  - Leaving cell routes: `scene.showCell(null)`.
- On part pages at level `cells`, add a "Zoom into a cell" chip row: every cell whose `where` includes this part id, linking to `#/cell/<id>/shape`. This connects the old "Down to cells" level to the new 3D cells.

### 6.6 Content to write in Phase 4

Neurons: `pyramidal`, `stellate`, `purkinje`, `granule`, `basket`, `chandelier`, `msn` (medium spiny neuron), `dopamine-neuron`, `motor-neuron`, `thalamic-relay`.
Glia: `astrocyte`, `oligodendrocyte`, `microglia`.

### Phase 4 done when
- Each cell's shape is recognisable next to a textbook drawing (pyramidal triangle with tall apical dendrite; Purkinje flat fan; granule T-shaped fibre).
- On How it fires you can see inputs flicker, the soma light, the spike travel, and terminals flash. On the motor neuron the spike visibly jumps between myelin gaps.
- Where it lives fades the cell out, fades the brain in and lights the right parts.
- Returning to Parts works with the brain at full brightness.

## 7. Phase 5: Hormones and the body view

### 7.1 Body anchors

Extend `src/content/anchors.js` entries with `body: true` for organs below the head. The body is schematic and compressed (not to scale); say so in the stage note in body mode. Suggested positions (tune by eye):

| id | name | position |
|---|---|---|
| `thyroid` | Thyroid | [0, -1.2, 0.25] |
| `heart` | Heart | [0.08, -1.9, 0.2] |
| `stomach` | Stomach | [0.15, -2.35, 0.25] |
| `adrenal` | Adrenal glands | [0.18, -2.6, -0.1], mirror |
| `fat` | Fat tissue | [0, -2.9, 0.35] |
| `gonads` | Ovaries or testes | [0, -3.4, 0.2] |

Add structure `pineal-gland` in `deep.js` (tiny ellipsoid on the midline behind and above the top of the midbrain, roughly [0, 0.0, -0.22]; check with Slice). `pituitary` was added in Phase 2.

### 7.2 Body silhouette

In `brain-scene.js`, build a faint outline (head shell around the brain, neck, torso) from `ellipsoid` shells with `fill: 0` and low point counts (total under 5,000), colour `#7a86c8`, hidden by default. `scene.setBody(on)` fades it and all `body: true` anchors in or out. Add a `'body'` entry to `VIEWS` (for example `[1, 0.1, 0.35]`), raise `controls.maxDistance` to 10, and let `flyTo` accept `{ maxDist }` so body views can zoom out to about 7.

### 7.3 Blood-borne arcs

Extend `setArcs` items with optional `style: 'blood'` and `color`:
- `blood`: lift 0.25 (hug the body), line brightness very low, 6 dots, dot size 2.2, speed 0.05, colour from `color`.
- `color` also overrides the gradient for any arc. Use `#ff6b7d` (the inhibit colour) for feedback arcs.

### 7.4 Hormone pages

Hormone entries use the chemical schema with `group: 'hormone'` plus `axis`, `feedback`, `timescale`. The Pathways tab becomes The chain tab:
- A numbered list, one row per `axis` link ("Hypothalamus releases CRH into tiny blood vessels to the pituitary"). Clicking a row sets `#/chem/<id>/axis/<index>` and highlights only that link in 3D (others ambient).
- The 3D scene: `setBody(true)`, focus all axis endpoints, arcs for each link (`via: 'blood'` or `'portal'` use `style: 'blood'`; `via: 'nerve'` uses a normal arc), feedback arcs in red with `flow: 'forward'` from the organ back to the brain.
- Leaving the hormone route: `setBody(false)`.

Content to write (see fact sheet 9.7): `cortisol`, `adrenaline`, `oxytocin`, `vasopressin`, `melatonin`, `thyroid-hormone`, `leptin`, `ghrelin`, `growth-hormone`, `sex-hormones`, `prolactin`. Link `prolactin` to the dopamine tuberoinfundibular tract, `melatonin` to serotonin (made from it), and `adrenaline` to noradrenaline.

### Phase 5 done when
- `#/chem/cortisol/axis` shows hypothalamus, pituitary and adrenal glands with slow blobs down the chain and a red feedback arc back up to the hypothalamus and hippocampus.
- `#/chem/oxytocin` shows it made in the hypothalamus and released from the pituitary, which is itself a brain-to-blood handoff.
- Going back to a part page hides the body.

## 8. Phase 6: Cross-links, search, docs

1. Part pages (`renderStructure`), computed, not hand written:
   - Under the tagline, a small row: "Makes: Dopamine" for chemicals whose `madeIn` includes this part.
   - In the `cells` level, above the diagram: "Chemicals that act here" (chemicals whose `density` has this id, with the receptor ids whose `where` includes it) and "Cells found here" (from 6.5).
2. Global search: when the sidebar search has text, search all three kinds and show one merged list with a small type badge ("Part", "Chemical", "Cell"). Enter opens the first result.
3. Pathways library: in the "Brain chemicals" section, each tour card gets a "Open dictionary entry" link to `#/chem/<id>`.
4. Home page (`renderHome`): add a "Start with a chemical" chip row (dopamine, serotonin, cortisol) and a "Zoom into a cell" row (pyramidal, Purkinje, astrocyte).
5. Docs: update `README.md` (what is inside, routes, file map, adding content) and `AGENTS.md` (sections 3, 4, 5, 7, 8) with the new files, routes, schemas and scene APIs. Update `CONTENT_PROMPT.md` with the field lists for chemicals and cells.
6. `tools/validate.mjs` reports unwritten text for chemicals and cells too.

## 9. Fact sheets (NOT WRITTEN YET)

Sections 4.6, 6.6 and 7.4 point here, but the fact sheets are not written yet. Until they are:
- Build the code for every phase (schemas, UI, scene, validation) using one or two short placeholder entries.
- Do not write the full chemical, cell or hormone content yet. Stop and ask for the fact sheets first.
