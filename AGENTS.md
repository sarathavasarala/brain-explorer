# AGENTS.md

> Developer and AI Agent Guide for **Brain Explorer**.  
> This file is the primary reference for understanding the architecture, design principles, content schemas, 3D engine, and workflows for extending Brain Explorer.

---

## 1. Project Philosophy & Core Stack

Brain Explorer is an interactive 3D atlas of the human brain built for curious adults with beginner-level neuroscience knowledge.

### Non-Negotiable Architectural Rules
1. **Zero-build, Vanilla ES Modules**: No Vite, Webpack, Rollup, Babel, or TypeScript. All browser code runs directly as native ES modules.
2. **CDN Import Maps**: Three.js (0.160) and addons (`OrbitControls`, `EffectComposer`, `RenderPass`, `UnrealBloomPass`, `ShaderPass`) are loaded via `<script type="importmap">` from `esm.sh` / `unpkg`. Keep external runtime dependencies strictly to Three.js.
3. **Vanilla CSS**: All styles reside in `styles.css`. No Tailwind, Sass, or CSS-in-JS. Follow the curated dark holographic theme (`#06070b` background with glowing colored point clouds).
4. **Standard Library Python Server**: `server.py` uses only Python's standard library (`http.server`, `urllib.request`, `json`, `os`). It serves static assets locally and securely proxies `/api/ask` and `/api/chat` to keep API keys safe.
5. **No Em Dashes (—)**: In all user-facing content, documentation, and prompt strings, do not use em dashes. Use commas, periods, or parentheses.
6. **Universal Scene Scripts**: All visual journeys that paint highlights, arcs, slices, or chemical receptor lenses across the brain (guided tours, Ask answers, future feature scripts) must use the Scene Script schema and render through `playStep` in `src/scene/player.js`.

---

## 2. Quick Operations

| Command | Action |
|---|---|
| `npm start` | Runs `python3 server.py`. Serves app at `http://localhost:5173` (falls back to 5174 if busy). |
| `PORT=5199 npm start` | Runs server on a custom port. |
| `npm run catalog` | Runs `node tools/build-catalog.mjs`. Rebuilds `src/content/catalog.json`. |
| `npm run validate` | Runs `node tools/validate.mjs`. Validates content, references, glossary terms, diagrams, pathways, scripts, and catalog freshness. |

### Environment Variables
- `AZURE_OPENAI_ENDPOINT`: Azure OpenAI resource endpoint URL.
- `AZURE_OPENAI_API_KEY`: Azure OpenAI API key.
- `AZURE_OPENAI_DEPLOYMENT`: Deployment name (e.g. `gpt-4o`).
- `AZURE_OPENAI_API_VERSION`: API version (default `2024-10-21`).
- `TYPESAFE_API_KEY`: Legacy TypeSafe Jev API key for `/api/ask`. (Preset questions work without a key).

---

## 3. System Architecture & File Map

```
brain-explorer/
├── index.html                  # Main layout shell, importmap, font imports, design-direction comment
├── styles.css                  # Single stylesheet (dark theme, CSS variables, micro-animations)
├── server.py                   # Local static server & secure /api/ask and /api/chat proxy
├── package.json                # npm scripts (type: module)
├── tools/
│   ├── build-catalog.mjs       # Exports catalog.json for server-side schema and system prompt
│   └── validate.mjs            # Integrity, content completeness, and catalog checker
└── src/
    ├── main.js                 # Hash router, top-level state, keyboard navigation, wiring
    ├── scene/                  # 3D holographic point-cloud engine
    │   ├── brain-scene.js      # Three.js scene, point shaders, bloom, camera flights, slice plane, picking, chemical lens, cell view, body view
    │   ├── player.js           # Universal scene script player (playStep, chemLensConfig)
    │   ├── neuron.js           # Procedural 3D cell morphologies & firing animation geometries
    │   ├── shapes.js           # Point-cloud math, procedural generators (cortex, ellipsoid, tube, etc.)
    │   └── noise.js            # Seeded random and 3D Perlin noise
    ├── content/                # Declarative neuroscience data & text
    │   ├── index.js            # Unified export & validation engine (validate())
    │   ├── catalog.json        # Compiled machine-readable catalog of structures, anchors, chemicals, and glossary
    │   ├── script.js           # Scene script validation (checkScript) and runtime sanitization (sanitizeScript)
    │   ├── groups.js           # Structural groupings (Cortex, Deep, Hindbrain)
    │   ├── levels.js           # 3 zoom levels (overview, connects, cells)
    │   ├── anchors.js          # Sensory/motor and body organ endpoints for pathways and hormones
    │   ├── synapses.js         # Synapse types (glutamate, gaba, dopamine, etc.)
    │   ├── ask-presets.js      # Hand-verified fallback answers for Ask mode
    │   ├── structures/
    │   │   ├── cortex.js       # Cortical lobes and areas (views into shared cortex cloud)
    │   │   ├── deep.js         # Subcortical structures (limbic, basal ganglia, thalamus, etc.)
    │   │   └── hindbrain.js    # Cerebellum, brainstem, spinal cord
    │   ├── chemicals/
    │   │   ├── groups.js       # Chemical groups (Fast, Modulators, Hormones)
    │   │   ├── fast.js         # Fast amino acid transmitters (Glutamate, GABA, Glycine)
    │   │   ├── modulators.js   # Monoamines and acetylcholine with projection tracts
    │   │   ├── hormones.js     # Body-wide endocrine signals with axis chains and feedback
    │   │   └── index.js        # Merged chemical registry
    │   ├── cells/
    │   │   ├── groups.js       # Cell groups (Excitatory, Inhibitory, Modulatory, Glia)
    │   │   └── index.js        # Cell definitions with morphology recipes and firing steps
    │   ├── pathways/
    │   │   ├── groups.js       # Pathway categories (actions, chemicals, networks)
    │   │   └── index.js        # Step-by-step guided tours and neural routes
    │   ├── diagrams/
    │   │   └── index.js        # Neural circuit nodes & connections for "Down to cells"
    │   └── glossary/
    │       └── index.js        # Neuroscience definitions for [[term]] markup
    ├── services/
    │   ├── ask.js              # Client-side Ask query service (presets -> /api/ask)
    │   └── chat.js             # Client-side Ask chat service (sendChat -> /api/chat)
    └── ui/
        ├── explainer.js        # Right-side card: 3 zoom levels, try-it, breaks with states, cross-links
        ├── sidebar.js          # Left-side Parts/Chemicals/Cells tabs with global search
        ├── chem.js             # Chemical explainer: overview, tracts, synapse, medicine, axis chain
        ├── cell.js             # Cell explainer: shape, firing sequencer, lives in, chemistry
        ├── synapse-stepper.js  # Interactive synapse mechanism with drug condition toggles
        ├── ladder.js           # 3-level zoom ladder widget
        ├── library.js          # Full-width Pathways tour browser
        ├── ask.js              # Ask chat thread, answer cards, preset chips, pathway exporter
        ├── diagrams.js         # Interactive SVG circuit diagrams with animated action potentials
        ├── format.js           # Tiny markup formatter ([[term|shown]], {{id|shown}}, **bold**)
        └── icons.js            # SVG icons
```

---

## 4. Hash Routing & Modes

The app is a single-page application driven by hash navigation in [src/main.js](file:///Users/sarathavasarala/Desktop/Projects/brain-explorer/src/main.js):

| Mode | Route Pattern | Description |
|---|---|---|
| **Parts** | `#/` | Default view (whole brain, left lateral view). |
| **Parts** | `#/s/<structure-id>` | Selects structure, opens default zoom level (`overview`). |
| **Parts** | `#/s/<structure-id>/<level>` | Opens specific level (`overview`, `connects`, `cells`). |
| **Parts** | `#/s/<structure-id>/<level>/<state>` | Opens specific perturbation scenario (`lesion`, `under`, `over`, `size`). |
| **Chemicals** | `#/chem` | Chemical dictionary home with group overview. |
| **Chemicals** | `#/chem/<chem-id>` | Chemical overview with receptor density glow and fibre arbors. |
| **Chemicals** | `#/chem/<chem-id>/<tab>` | Opens specific chemical tab (`overview`, `tracts`, `synapse`, `medicine`, `axis`). |
| **Chemicals** | `#/chem/<chem-id>/<tab>/<sub>` | Sub-focuses a specific tract or hormone axis step. |
| **Cells** | `#/cell` | Cell dictionary home with neuron and glial catalog. |
| **Cells** | `#/cell/<cell-id>` | 3D procedural cell morphology view. |
| **Cells** | `#/cell/<cell-id>/<tab>` | Opens specific cell tab (`shape`, `fires`, `lives`, `chem`). |
| **Pathways** | `#/pathways` | Opens the full-width library grid of guided tours. |
| **Pathways** | `#/p/<pathway-id>/<step>` | Enters guided tour at 0-indexed step number (hides sidebar). |
| **Ask** | `#/ask` | Opens the search / question interface with preset chips. |
| **Ask** | `#/ask/<query>` | Executes query, highlights involved brain parts in 3D. |

### Global Search & Keyboard Shortcuts
- Unified search in the sidebar filters across all structures, chemicals, and cells simultaneously. Pressing Enter opens the top match.
- `ArrowRight` / `ArrowLeft`: Navigate between zoom levels (Parts), tabs (Chemicals, Cells), or tour steps (Pathways).
- `ArrowUp` / `ArrowDown`: Step to previous or next item in the active category.
- `Escape`: Step up or go back (state -> level; cells -> connects -> overview -> home; sub-tabs -> home).
- `Space`: Next step in active pathway tour.

---

## 5. 3D Scene Architecture (`src/scene/`)

### Coordinate System
- **`+x`**: Anatomical **Left** of the subject.
- **`+y`**: **Superior** (Up).
- **`+z`**: **Anterior** (Front of the face).
- The brain bounding volume is roughly 1.7 units front to back (`z` from approx -0.85 to +0.85).
- Default camera is at lateral left looking toward the origin (`front` on the left of the screen).

### Camera Preset Views
Defined in `brain-scene.js`:
- `'left'`: Lateral view of left hemisphere.
- `'left-front'`: Frontal-lateral angle.
- `'left-back'`: Posterior-lateral angle.
- `'medial'`: Sliced sagittal view looking at inner wall from midline.
- `'back'`: Occipital / posterior view.
- `'below'`: Ventral / inferior view.
- `'left-below'`: Low anterolateral view looking up at ventral frontal lobe.
- `'body'`: Zoomed-out view framing the torso and body organs.

### Point-Cloud Shaders & Rendering
- Points are rendered with custom GLSL shaders (`brain-scene.js`).
- Dynamic uniform controls: `uFocus`, `uDim`, `uTime`, `uSlice`, `uSliceDir`, `uGlobal`.
- Points have attributes `aSize`, `color`, `aHiColor`, `aHi`.
- Bloom is handled by `UnrealBloomPass` with tuned parameters to keep background black without haze.
- Arcs between regions are animated quadratic or cubic Bezier curves in 3D space with particle pulses.
- Blood-borne arcs (`style: 'blood'`) provide slower, larger pulse dots hugging the body for endocrine signals.

### Chemical Lens (`showChemical(entry, opts)`)
- Recolor cortex and subcortical structures by receptor density (`paintLens`).
- Branching axon arbor fibre trees with slow pulse particles and synaptic release sparkles.
- Midline structures automatically engage sagittal slice.

### Cell Morphology Engine (`showCell(cell, opts)`)
- Procedural cell geometries via `buildCell` in `neuron.js` (pyramidal, Purkinje, motor, astrocyte, microglia, etc.).
- Custom cell GLSL shader (`cellVertexShader`/`cellFragmentShader`) animating dendritic EPSPs, soma depolarization, axonal saltatory spike jumps, and terminal transmitter release.

### Body & Hormone View (`setBody(on)`)
- Faint 4,000-point body silhouette (`#7a86c8`) with visceral organ anchors (`thyroid`, `heart`, `stomach`, `adrenal`, `fat`, `gonads`).
- Endocrine arcs connect brain to body glands, and feedback loops return from organs to the brain.

### Shape Generators (`shapes.js`)
There are two ways 3D points are allocated to a structure:

#### A. Cortical Areas (`type: 'cortex'`)
The cerebral cortex is a single pre-generated point-cloud sheet (~30,000 points with gyri noise folds). Cortical structures do not generate their own points; they test coordinates on the shared cloud:
```js
shape: {
  type: 'cortex',
  test: (p) => p.lobe === 'frontal' && p.z > 0.3
}
```
Available properties on `p`:
- `p.x, p.y, p.z`: 3D coordinates.
- `p.ax`: `|x|`, absolute distance from midline.
- `p.side`: `'left' | 'right'`.
- `p.lobe`: `'frontal' | 'parietal' | 'temporal' | 'occipital'`.
- `p.medial`: `true` for points on the inner flat medial wall facing the other hemisphere.
- `p.central`: `z` position of the central sulcus at the current height `y`.

#### B. Subcortical / Hindbrain Procedural Geometries
Deep nuclei and hindbrain structures use procedural geometric generators:
- `ellipsoid({ rx, ry, rz, cx, cy, cz, ... })`
- `tube({ path, r, ... })`
- `band({ path, width, ... })`
- `parts([...])` (combines multiple sub-shapes)
- Surface patterns: `'gyri'`, `'fine'`, `'folia'`, `'rings'`, `'fibers'`, `'cross'`.
- `mirror: true`: Duplicates points across the midline (`x = -x`) for bilateral structures.

---

## 6. Content Schema & Writing Guide

All content is beginner-accessible, rigorous, and formatted with tiny markup.

### Editorial Tone & Voice
- **Audience**: Curious adult with beginner neuroscience knowledge (knows what a neuron is, but nothing more).
- **Tone**: Plain, warm, specific. Like an engaging science educator talking to a friend, never like a sterile textbook or sales pitch.
- **Concrete analogies**: Prefer familiar physical actions ("catching your keys", "reaching for a warm mug") over abstractions.
- **Estimated figures**: Use "about" or "roughly" instead of false precision.
- **STRICT PROHIBITION: NO EM DASHES**:
  - Never use the em dash character in any text or UI label.
  - Use commas, periods, or parentheses.
- **STRICT PROHIBITION: NO HYPE OR FILLER**:
  - Avoid: *"fascinating"*, *"incredible"*, *"remarkable"*, *"plays a crucial role"*, *"delve"*, *"intricate"*, *"vital"*, *"complex interplay"*, *"In summary"*.

### Text Markup Syntax
- `[[term]]` or `[[term|shown text]]`: Underlines text and displays the glossary definition on hover. The `term` must exist in [src/content/glossary/index.js](file:///Users/sarathavasarala/Desktop/Projects/brain-explorer/src/content/glossary/index.js).
- `{{id}}` or `{{id|shown text}}`: Clickable link that focuses another brain part. The `id` must be a valid structure ID.
- `**bold**`: Emphasizes a key term (use sparingly, at most once per paragraph).
- `\n\n`: Paragraph break.
- Single quotes: Escape internal apostrophes as `\'` inside JS strings.

---

## 7. Data Schemas

### 1. Structure Schema (`src/content/structures/*.js`)
```javascript
{
  id: 'hippocampus',                             // Unique kebab-case ID
  name: 'Hippocampus',                           // Display name
  group: 'deep',                                 // 'cortex' | 'deep' | 'hindbrain'
  color: '#44d7b6',                              // Hex color code (used as --accent)
  shape: { type: 'tube', ... },                  // Shape generator or cortex test
  view: 'medial',                                // Preferred camera angle
  slice: true,                                   // Optional: auto-slices brain when opened
  parent: 'temporal-lobe',                       // Optional: nests inside parent in sidebar
  tagline: 'Forms new memories and maps space.', // Short 1-line summary
  analogy: 'The bookmark system for the library of your experiences.',
  levels: {
    overview: {
      text: 'Two paragraphs: (1) physical location, boundaries, and size; (2) everyday function with concrete example.',
      bullets: [
        'Job name: description of function',
        'Another job: description',
      ],
    },
    connects: {
      text: '2 to 4 sentences describing flow of inputs and outputs.',
      connections: [
        // id must be valid structure. dir: 'in' | 'out' | 'both'. label under 10 words.
        { id: 'entorhinal-cortex', dir: 'in', label: 'Inputs from all senses' },
        { id: 'thalamus', dir: 'out', label: 'Relayed onwards to memory circuits' },
      ],
    },
    cells: {
      text: '2 to 4 sentences on micro-circuitry and cell types.',
      diagram: 'hippocampal-circuit',            // Key in src/content/diagrams/index.js (optional)
      synapse: 'glutamate',                      // Key in src/content/synapses.js (optional)
      bullets: ['1 to 2 surprising cell-level facts.'],
    },
  },
  tryIt: '1 to 3 sentences: simple physical or mental exercise the user can do right now.',
  breaks: {
    text: '1 to 2 sentences on what occurs when damaged.',
    bullets: ['2 to 3 symptoms or clinical conditions, plainly explained.'],
    states: [                                    // Optional: 'What if' perturbation scenarios
      {
        kind: 'lesion',                          // 'lesion' ('is damaged or removed') | 'under' ('goes quiet') | 'over' ('goes into overdrive') | 'size' ('is reshaped')
        teaser: 'One-line teaser under 70 chars.', // Optional summary teaser
        text: '2 to 3 sentences explaining what changes and why.',
        signs: ['2 to 3 plain bullets of what you\'d notice.'],
        case: { name: 'Patient H.M.', text: 'Factual description of landmark case or study.' }, // Optional
        ripple: [{ id: 'striatum', role: 'cut_off' }], // Optional partner structure knock-on effects
        look: 'more_active',                     // Optional for 'size': 'more_active' | 'less_active'
      },
    ],
  },
}
```

### 2. Pathway Schema (`src/content/pathways/index.js`)
```javascript
{
  id: 'visual-stream',
  title: 'How you see an object',
  tagline: 'From photons hitting the retina to naming what is in front of you.',
  category: 'actions',                           // Key from src/content/pathways/groups.js
  color: '#4da6ff',
  summary: '2 to 3 sentences introducing the neural journey.',
  steps: [
    {
      title: 'Light lands on the retina',
      text: '2 to 4 sentences describing this step. Connect to previous step like a story.',
      focus: ['visual-cortex'],                  // Structure IDs or body anchors to highlight
      route: [['eye', 'thalamus'], ['thalamus', 'visual-cortex']], // 3D arc pairs
      view: 'left-back',                         // Optional camera angle
      slice: false,                              // Optional slice toggle
    },
  ],
}
```
*Note on route endpoints*: Can include structure IDs plus body anchors (`eye`, `ear`, `hand`) defined in [src/content/anchors.js](file:///Users/sarathavasarala/Desktop/Projects/brain-explorer/src/content/anchors.js).

### 3. Diagram Schema (`src/content/diagrams/index.js`)
Neural microcircuit diagrams rendered as interactive animated SVGs:
```javascript
'cerebellar-cortex': {
  title: 'Cerebellar microcircuit',
  description: 'How mossy and climbing fibres train Purkinje cells to coordinate timing.',
  nodes: [
    { id: 'purkinje', label: 'Purkinje cell', kind: 'purkinje', x: 260, y: 150 },
    { id: 'granule', label: 'Granule cell', kind: 'granule', x: 140, y: 240 },
  ],
  links: [
    // type: 'excite' (green/arrow) | 'inhibit' (red/flat) | 'modulate' (blue/circle)
    { from: 'granule', to: 'purkinje', type: 'excite', label: 'Parallel fibres' },
  ],
  bands: [
    { label: 'Molecular layer', y: 40, height: 120 },
  ],
}
```

### 4. Glossary Schema (`src/content/glossary/index.js`)
```javascript
export default {
  neuron: 'A brain cell that sends electrical and chemical signals to other cells.',
  synapse: 'The tiny gap between two neurons where chemical messages cross.',
};
```

### 5. Ask Presets Schema (`src/content/ask-presets.js`)
Hand-verified answers displayed as instant chips and offline fallbacks:
```javascript
{
  query: 'panic attack',
  title: 'A sudden rush of intense fear',
  text: 'The amygdala sounds an alarm that triggers the fight-or-flight response...',
  result: {
    in_scope: true,
    kind: 'state',
    messenger: 'noradrenaline',
    parts: [
      { id: 'amygdala', role: 'more_active', reason: 'Fires intense false alarm' },
      { id: 'hypothalamus', role: 'more_active', reason: 'Drives rapid heart rate' },
      { id: 'prefrontal-cortex', role: 'less_active', reason: 'Struggles to calm fear' },
    ],
  },
}
```

### 6. Chemical Schema (`src/content/chemicals/*.js`)
```javascript
{
  id: 'dopamine',
  name: 'Dopamine',
  group: 'modulator',            // 'fast' | 'modulator' | 'hormone'
  color: '#b98cff',
  tagline: 'Short one-sentence summary.',
  analogy: 'Familiar physical analogy.',
  synapse: 'dopamine',           // optional synapse key
  pathwayId: 'dopamine-pathways', // optional pathway key
  madeFrom: 'tyrosine',
  madeIn: ['substantia-nigra', 'vta'],
  overview: {
    text: '2 to 4 sentences introducing the messenger.',
    bullets: ['2 to 3 bullet points with key facts.'],
  },
  tracts: [                      // for modulators
    {
      id: 'nigrostriatal',
      name: 'Nigrostriatal pathway',
      from: 'substantia-nigra',
      to: ['striatum'],
      job: 'Starting and smoothing voluntary physical movements',
      text: 'Description of the projection.',
      whenItFails: 'Clinical symptom when damaged.',
      whenBlocked: 'Side effect when blocked.',
    },
  ],
  axis: [                        // for hormones
    { from: 'hypothalamus', to: 'pituitary', label: 'CRH signal', text: 'Steps down the axis', via: 'portal' },
  ],
  feedback: [                    // for hormones
    { from: 'adrenal', to: 'hypothalamus', label: 'Cortisol feedback', text: 'Shuts down release' },
  ],
  timescale: 'Minutes to hours',  // for hormones
  density: { 'striatum': 1.0, 'prefrontal-cortex': 0.5 },
  receptors: [
    { id: 'D1', family: 'D1-like', effect: 'modulate', where: ['striatum'], text: 'Excitatory modulation.' },
  ],
  life: {
    made: 'Synthesis description.',
    packed: 'Storage description.',
    released: 'Exocytosis description.',
    binds: 'Receptor action description.',
    cleared: 'Clearance mechanism description.',
    clearedBy: 'reuptake',       // 'reuptake' | 'breakdown' | 'blood'
  },
  drugs: [
    { name: 'L-DOPA', type: 'Precursor', action: 'boost', text: 'Boosts dopamine synthesis.' },
  ],
  breaks: {
    text: 'What happens when imbalanced.',
    bullets: ['Symptoms or conditions.'],
  },
  tryIt: 'Everyday physical or mental check.',
}
```

### 7. Cell Schema (`src/content/cells/index.js`)
```javascript
{
  id: 'purkinje',
  name: 'Purkinje cell',
  group: 'inhibitory',           // 'excitatory' | 'inhibitory' | 'modulatory' | 'glia'
  color: '#ffd36b',
  tagline: 'Short one-sentence summary.',
  analogy: 'Familiar physical analogy.',
  transmitter: 'gaba',           // chemical id, or null for glia
  where: ['cerebellum'],         // structure ids where it resides
  size: 'Cell body about 0.05 mm across',
  morph: { style: 'purkinje', seed: 7 }, // procedural generator style and seed
  landmarks: ['soma', 'dendrites', 'axon', 'terminals'],
  shape: {
    text: '2 to 4 sentences describing its physical structure.',
    bullets: ['2 to 3 structural facts.'],
  },
  fires: {
    text: '2 to 4 sentences explaining its electrical firing pattern.',
    steps: ['Inputs arrive', 'Integration at soma', 'Spike along axon', 'Transmitter release'],
  },
  chem: {
    text: 'Neurotransmitters, receptors, and modulators.',
    receptors: ['GABA-A', 'AMPA'],
    modulatedBy: ['noradrenaline'],
  },
  breaks: {
    text: 'What happens when these cells fail or degenerate.',
    bullets: ['Clinical conditions or symptoms.'],
  },
}
```

### 8. Scene Script Schema (`src/content/script.js`)
Scene scripts are declarative instructions for painting the 3D brain canvas. Guided pathways, Ask chat responses, and preset spotlight answers all share this universal format:
```javascript
{
  title: 'Falling asleep',                       // Short descriptive title
  summary: 'How sleep centers take over the brain as you drift off.',
  steps: [
    {
      title: 'Drowsiness sets in',
      text: 'The [[vlpo]] begins firing [[gaba]] into wake centers...',
      view: 'medial',                            // 'left' | 'left-front' | 'left-back' | 'medial' | 'back' | 'below' | 'left-below' | 'body'
      slice: true,                               // optional boolean
      body: false,                               // optional boolean: show body silhouette
      chemical: 'gaba',                          // optional chemical id for receptor density glow
      focus: ['vlpo', 'thalamus'],               // optional array of structure ids to highlight
      parts: [                                   // optional role-colored structures
        { id: 'vlpo', role: 'more_active' },
        { id: 'thalamus', role: 'less_active' },
      ],
      route: [                                   // optional 3D Bezier curve connections
        ['vlpo', 'thalamus'],
      ],
    },
  ],
}
```

#### Roles and Visual Semantics
- `'more_active'`: Heightened firing rate or metabolic activity (warm highlight).
- `'less_active'`: Inhibited or quieted region (cool or dim highlight).
- `'typical'`: Baseline healthy activity.
- `'involved'`: Active participant in network.
- `'cut_off'`: Disconnected pathway or signal.
- `'losing_cells'`: Degenerating or damaged area.

#### Validation and Player Engine
- `checkScript(script, catalog)`: Pure validator returning an array of string error descriptions. Used by `npm run validate` to test content integrity.
- `sanitizeScript(raw, catalog)`: Runtime defense layer. Strips nonexistent structures, invalid roles/views, invalid route endpoints, unknown glossary terms, and converts any em dashes to commas. Discards steps lacking visual features and caps step count at 8.
- `playStep(scene, deps, script, index, options)`: The unified player in `src/scene/player.js`. Coordinates camera flight, slice plane, body view, chemical lens painting, structure highlighting with role-based colors, and 3D arc drawing.

---

## 8. How to Extend Brain Explorer

### Adding a New Brain Structure
1. Choose the destination file:
   - Cortical areas: `src/content/structures/cortex.js`
   - Subcortical / limbic / basal ganglia: `src/content/structures/deep.js`
   - Hindbrain / brainstem: `src/content/structures/hindbrain.js`
2. Define the structure object adhering strictly to the schema in Section 7.
3. If cortical, write a coordinate `test(p)` filtering the shared cortex points. If subcortical, construct procedural points using `shapes.js`.
4. Ensure all connections reference valid structure IDs and valid directions (`in`, `out`, `both`).
5. Ensure any referenced `diagram` or `synapse` exists.
6. Run `npm run catalog` and `npm run validate`.

### Adding a New Chemical or Hormone
1. Choose the file in `src/content/chemicals/`:
   - Fast transmitters: `fast.js`
   - Neuromodulators: `modulators.js`
   - Body hormones: `hormones.js`
2. Define the chemical object adhering to the schema in Section 7.
3. Ensure all structures in `madeIn`, `density`, `receptors[].where`, and `axis` / `feedback` are valid IDs or body anchors.
4. Run `npm run catalog` and `npm run validate`.

### Adding a New Cell Type
1. Open `src/content/cells/index.js`.
2. Define the cell object with valid `group`, `morph.style` (supported by `src/scene/neuron.js`), `where` structures, and `transmitter`.
3. Provide `fires.steps` (array of step descriptions) and `landmarks`.
4. Run `npm run catalog` and `npm run validate`.

### Adding a New Pathway
1. Open `src/content/pathways/index.js`.
2. Choose a valid `category` from `src/content/pathways/groups.js` (`actions`, `chemicals`, `networks`).
3. Write steps sequentially, forming a cohesive narrative.
4. For each step, supply `focus` (structures to highlight) and `route` (pairs of IDs or body anchors for 3D arcs).
5. Run `npm run catalog` and `npm run validate`.

### Adding a New Neural Circuit Diagram
1. Open `src/content/diagrams/index.js`.
2. Create an exported entry with `title`, `nodes` (with coordinates in SVG space ~500x320), and `links` (`excite`, `inhibit`, or `modulate`).
3. Reference the diagram ID in a structure's `levels.cells.diagram`.
4. Verify rendering in the browser by opening `#/s/<structure-id>/cells`.

### Adding a Glossary Term
1. Open `src/content/glossary/index.js`.
2. Add the term in lowercase: `'my-term': 'One or two plain, beginner-level sentences.'`.
3. Use it anywhere in content as `[[my-term]]` or `[[my-term|display word]]`.
4. Run `npm run catalog` and `npm run validate`.

### Updating the Machine-Readable Catalog
Whenever you add or update structures, anchors, chemicals, or glossary terms, rebuild the catalog:
```sh
npm run catalog
```
This updates `src/content/catalog.json`, which is consumed by `server.py` to build the Azure OpenAI system prompt and JSON schema. `npm run validate` enforces that `catalog.json` remains in sync with the source content.

---

## 9. Verification & Quality Checklist

Before submitting any code or content changes, execute this verification sequence:

1. **Rebuild Catalog**:
   ```sh
   npm run catalog
   ```

2. **Run Static Validation**:
   ```sh
   npm run validate
   ```
   Must output: `OK: ... structures, ... pathways, no broken references.` with 0 problems.

3. **No Em Dashes Check**:
   Confirm no em dashes were introduced in content or UI:
   ```sh
   git diff | grep "—"
   ```

4. **Browser Smoke Test**:
   Run `npm start` and test key user journeys in the browser:
   - `#/`: Home point cloud renders cleanly with glowing points and no background haze.
   - `#/s/hippocampus/where`: Structure highlights in its accent color, camera flies smoothly.
   - `#/s/hippocampus/connects`: 3D connection arcs animate between structures.
   - `#/s/cerebellum/cells`: Circuit diagram renders SVG nodes, links, and animated pulse dots.
   - `#/pathways`: Library cards load correctly.
   - `#/p/visual-stream/0`: Pathway tour steps through 3D routes cleanly.
   - `#/ask`: Preset chips load; clicking a preset spotlights involved parts and plays scene script.
   - Free-form Ask chat: Ask a question (e.g. "what happens when I fall asleep?"), verify streaming answer card, mini-tour step navigation, 3D camera/slice changes, and follow-up chips.
   - Browser developer console has zero errors or 404s.
