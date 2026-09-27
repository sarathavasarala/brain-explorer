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
4. **Standard Library Python Server**: `server.py` uses only Python's standard library (`http.server`, `urllib.request`, `json`, `os`). It serves static assets locally and proxies `/api/ask` to TypeSafe Jev AI to keep the API key safe.
5. **No Em Dashes (—)**: In all user-facing content, documentation, and prompt strings, do not use em dashes. Use commas, periods, or parentheses.

---

## 2. Quick Operations

| Command | Action |
|---|---|
| `npm start` | Runs `python3 server.py`. Serves app at `http://localhost:5173` (falls back to 5174 if busy). |
| `PORT=5199 npm start` | Runs server on a custom port. |
| `npm run validate` | Runs `node tools/validate.mjs`. Validates all content, references, glossary terms, diagrams, and pathways. |

### Environment Variables
- `TYPESAFE_API_KEY`: Placed in `.env` (gitignored) at workspace root. Required for typed dynamic queries in Ask mode. (Preset questions work without a key).

---

## 3. System Architecture & File Map

```
brain-explorer/
├── index.html                  # Main layout shell, importmap, font imports, design-direction comment
├── styles.css                  # Single stylesheet (dark theme, CSS variables, micro-animations)
├── server.py                   # Local static server & secure /api/ask proxy
├── package.json                # npm start & npm run validate scripts (type: module)
├── tools/
│   └── validate.mjs            # Integrity and content completeness checker
└── src/
    ├── main.js                 # Hash router, top-level state, keyboard navigation, wiring
    ├── scene/                  # 3D holographic point-cloud engine
    │   ├── brain-scene.js      # Three.js scene, point shaders, bloom, camera flights, slice plane, picking
    │   ├── shapes.js           # Point-cloud math, procedural generators (cortex, ellipsoid, tube, etc.)
    │   └── noise.js            # Seeded random and 3D Perlin noise
    ├── content/                # Declarative neuroscience data & text
    │   ├── index.js            # Unified export & validation engine (validate())
    │   ├── groups.js           # Structural groupings (Cortex, Deep, Hindbrain)
    │   ├── levels.js           # 4 zoom levels (where, does, connects, cells)
    │   ├── anchors.js          # Sensory/motor body endpoints (eye, ear, hand) for pathways
    │   ├── synapses.js         # Synapse types (glutamate, gaba, dopamine, etc.)
    │   ├── ask-presets.js      # Hand-verified fallback answers for Ask mode
    │   ├── structures/
    │   │   ├── cortex.js       # Cortical lobes and areas (views into shared cortex cloud)
    │   │   ├── deep.js         # Subcortical structures (limbic, basal ganglia, thalamus, etc.)
    │   │   └── hindbrain.js    # Cerebellum, brainstem, spinal cord
    │   ├── pathways/
    │   │   ├── groups.js       # Pathway categories (actions, chemicals, networks)
    │   │   └── index.js        # Step-by-step guided tours and neural routes
    │   ├── diagrams/
    │   │   └── index.js        # Neural circuit nodes & connections for "Down to cells"
    │   └── glossary/
    │       └── index.js        # Neuroscience definitions for [[term]] markup
    ├── services/
    │   └── ask.js              # Client-side Ask query service (presets -> /api/ask)
    └── ui/
        ├── explainer.js        # Right-side card: 4 zoom levels, try-it, breaks, synapse/circuit
        ├── sidebar.js          # Left-side Parts navigation accordion
        ├── library.js          # Full-width Pathways tour browser
        ├── ask.js              # Ask query bar, preset chips, multi-part spotlight cards
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
| **Parts** | `#/s/<structure-id>` | Selects structure, opens default zoom level (`where`). |
| **Parts** | `#/s/<structure-id>/<level>` | Opens specific level (`where`, `does`, `connects`, `cells`). |
| **Pathways** | `#/pathways` | Opens the full-width library grid of guided tours. |
| **Pathways** | `#/p/<pathway-id>/<step>` | Enters guided tour at 0-indexed step number (hides sidebar). |
| **Ask** | `#/ask` | Opens the search / question interface with preset chips. |
| **Ask** | `#/ask/<query>` | Executes query, highlights involved brain parts in 3D. |

### Keyboard Shortcuts
- `ArrowRight` / `ArrowLeft`: Navigate between zoom levels (Parts) or tour steps (Pathways).
- `Escape`: Step up / go back (cells -> connects -> does -> where -> home).
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

### Point-Cloud Shaders & Rendering
- Points are rendered with custom GLSL shaders (`brain-scene.js`).
- Dynamic uniform controls: `uFocus`, `uDim`, `uTime`, `uSlice`, `uSliceDir`.
- Points have an attribute `aSize` and `color`.
- Bloom is handled by `UnrealBloomPass` with tuned parameters to keep background black without haze.
- Arcs between regions are animated quadratic / cubic Bezier curves in 3D space with particle pulses.

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
    where: {
      text: '2 to 4 sentences explaining location, size, and neighbors. Use {{id}} links.',
      bullets: ['2 to 3 concise bullet points about physical features.'],
    },
    does: {
      text: '3 to 5 sentences on everyday function with a concrete example.',
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
6. Run `npm run validate` and resolve any warnings.

### Adding a New Pathway
1. Open [src/content/pathways/index.js](file:///Users/sarathavasarala/Desktop/Projects/brain-explorer/src/content/pathways/index.js).
2. Choose a valid `category` from `src/content/pathways/groups.js` (`actions`, `chemicals`, `networks`).
3. Write steps sequentially, forming a cohesive narrative.
4. For each step, supply `focus` (structures to highlight) and `route` (pairs of IDs or body anchors for 3D arcs).
5. Run `npm run validate`.

### Adding a New Neural Circuit Diagram
1. Open [src/content/diagrams/index.js](file:///Users/sarathavasarala/Desktop/Projects/brain-explorer/src/content/diagrams/index.js).
2. Create an exported entry with `title`, `nodes` (with coordinates in SVG space ~500x320), and `links` (`excite`, `inhibit`, or `modulate`).
3. Reference the diagram ID in a structure's `levels.cells.diagram`.
4. Verify rendering in the browser by opening `#/s/<structure-id>/cells`.

### Adding a Glossary Term
1. Open [src/content/glossary/index.js](file:///Users/sarathavasarala/Desktop/Projects/brain-explorer/src/content/glossary/index.js).
2. Add the term in lowercase: `'my-term': 'One or two plain, beginner-level sentences.'`.
3. Use it anywhere in content as `[[my-term]]` or `[[my-term|display word]]`.

---

## 9. Verification & Quality Checklist

Before submitting any code or content changes, execute this verification sequence:

1. **Run Static Validation**:
   ```sh
   npm run validate
   ```
   Must output: `OK: ... structures, ... pathways, no broken references.` with 0 problems.

2. **No Em Dashes Check**:
   Confirm no em dashes were introduced in content or UI:
   ```sh
   git diff | grep "—"
   ```

3. **Browser Smoke Test**:
   Run `npm start` and test key user journeys in the browser:
   - `#/`: Home point cloud renders cleanly with glowing points and no background haze.
   - `#/s/hippocampus/where`: Structure highlights in its accent color, camera flies smoothly.
   - `#/s/hippocampus/connects`: 3D connection arcs animate between structures.
   - `#/s/cerebellum/cells`: Circuit diagram renders SVG nodes, links, and animated pulse dots.
   - `#/pathways`: Library cards load correctly.
   - `#/p/visual-stream/0`: Pathway tour steps through 3D routes cleanly.
   - `#/ask`: Preset chips load; clicking a preset spotlights involved parts.
   - Browser developer console has zero errors or 404s.
