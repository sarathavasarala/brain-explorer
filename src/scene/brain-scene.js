import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { cortex, cortexPoint, buildShape, ellipsoid } from './shapes.js';

// Base tint of each cortical lobe when nothing is selected (index matches LOBES in shapes.js).
const LOBE_TINT = ['#c14ef0', '#5f78ff', '#9868ff', '#b15ae8'];
const BRAIN_CENTER = new THREE.Vector3(0, 0.02, -0.06);

const VIEWS = {
  left: [1, 0.16, 0.1],
  right: [-1, 0.16, 0.1],
  top: [0.3, 1, 0.12],
  front: [0.25, 0.12, 1],
  back: [0.25, 0.2, -1],
  below: [0.35, -1, 0.15],
  medial: [1, 0.08, 0.02],
  'left-front': [1, 0.2, 0.6],
  'left-back': [1, 0.2, -0.6],
};

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aRand;
  attribute float aHi;
  attribute float aHiPrev;
  attribute vec3 aColor;
  attribute vec3 aHiColor;
  attribute vec3 aHiColorPrev;
  uniform float uTime, uPixel, uScale, uBase, uHi, uMix, uHiSize, uClip, uActivity, uHover;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vec4 mv = viewMatrix * world;
    float hNew = aHi * uMix;
    float hOld = aHiPrev * (1.0 - uMix);
    float hi = (hNew + hOld) * uHi;
    vec3 col = mix(aColor, aHiColorPrev, clamp(hOld * uHi, 0.0, 1.0));
    col = mix(col, aHiColor, clamp(hNew * uHi, 0.0, 1.0));
    float twinkle = 0.78 + 0.22 * sin(uTime * 1.6 + aRand * 43.0);
    float wave = 0.0;
    if (uActivity > 0.001) {
      float w = sin(dot(position, vec3(10.0, 14.0, 8.0)) - uTime * 3.2 + aRand * 0.9);
      wave = pow(max(w, 0.0), 10.0) * uActivity * clamp(hi, 0.0, 1.0);
    }
    float b = (uBase + hi + uHover) * twinkle + wave * 1.6;
    vColor = col;
    vAlpha = b * mix(0.5, 1.0, aSize);
    if (uClip > 0.5 && world.x > 0.004) vAlpha = 0.0;
    vAlpha *= smoothstep(0.35, 1.1, -mv.z);
    gl_PointSize = min(uScale * aSize * (1.0 + clamp(hi, 0.0, 1.0) * uHiSize + wave * 0.8) * uPixel / -mv.z, 26.0 * uPixel);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    if (vAlpha < 0.004) discard;
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    gl_FragColor = vec4(vColor * a * vAlpha, 1.0);
  }
`;

const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

export function createBrainScene(canvas, { structures, anchors = [], labelsEl, onHover, onPick }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  const pixel = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(pixel);
  renderer.setClearColor(0x04050a, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.01, 60);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.65;
  controls.zoomSpeed = 0.8;
  controls.minDistance = 0.45;
  controls.maxDistance = 6;
  controls.autoRotateSpeed = 0.45;

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.72, 0.20, 0.26);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const materials = [];
  function makeMaterial(scale = 7) {
    const m = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uPixel: { value: pixel }, uScale: { value: scale },
        uBase: { value: 0 }, uHi: { value: 0 }, uMix: { value: 1 }, uHiSize: { value: 0.55 },
        uClip: { value: 0 }, uActivity: { value: 0 }, uHover: { value: 0 },
      },
      vertexShader, fragmentShader,
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    });
    materials.push(m);
    return m;
  }

  function makeGeometry(positions, sizes, baseColors, hiColors) {
    const n = sizes.length;
    const g = new THREE.BufferGeometry();
    const rand = new Float32Array(n);
    for (let i = 0; i < n; i++) rand[i] = Math.random();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    g.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
    g.setAttribute('aColor', new THREE.BufferAttribute(baseColors, 3));
    g.setAttribute('aHiColor', new THREE.BufferAttribute(hiColors, 3));
    g.setAttribute('aHiColorPrev', new THREE.BufferAttribute(hiColors.slice(), 3));
    g.setAttribute('aHi', new THREE.BufferAttribute(new Float32Array(n).fill(1), 1));
    g.setAttribute('aHiPrev', new THREE.BufferAttribute(new Float32Array(n).fill(1), 1));
    g.computeBoundingSphere();
    return g;
  }

  function tintArray(n, hex, jitter = 0.12) {
    const c = new THREE.Color(hex), hsl = {};
    c.getHSL(hsl);
    const arr = new Float32Array(n * 3), tmp = new THREE.Color();
    for (let i = 0; i < n; i++) {
      tmp.setHSL(hsl.h + (Math.random() - 0.5) * 0.03, hsl.s, Math.min(0.9, hsl.l * (1 + (Math.random() - 0.5) * jitter * 2)));
      arr[i * 3] = tmp.r; arr[i * 3 + 1] = tmp.g; arr[i * 3 + 2] = tmp.b;
    }
    return arr;
  }

  function anchorOf(positions, filter) {
    const pts = [];
    for (let i = 0; i < positions.length; i += 3) {
      if (!filter || filter(i / 3)) pts.push(positions[i], positions[i + 1], positions[i + 2]);
    }
    const left = [];
    for (let i = 0; i < pts.length; i += 3) if (pts[i] >= 0.02) left.push(pts[i], pts[i + 1], pts[i + 2]);
    const use = left.length > pts.length * 0.25 ? left : pts;
    const c = new THREE.Vector3();
    const n = use.length / 3 || 1;
    for (let i = 0; i < use.length; i += 3) c.x += use[i], c.y += use[i + 1], c.z += use[i + 2];
    c.divideScalar(n);
    const d = [];
    for (let i = 0; i < use.length; i += 3) d.push(Math.hypot(use[i] - c.x, use[i + 1] - c.y, use[i + 2] - c.z));
    d.sort((a, b) => a - b);
    return { center: c, radius: d[Math.floor(d.length * 0.92)] || 0.05 };
  }

  // ------------------------------------------------------------ build the brain
  const recs = new Map(); // id -> record for every selectable thing
  const deepRecs = [];

  const cx = cortex({ count: 30000 });
  const nC = cx.sizes.length;
  const cBase = new Float32Array(nC * 3);
  {
    const tints = LOBE_TINT.map((h) => new THREE.Color(h));
    for (let i = 0; i < nC; i++) {
      const t = tints[cx.lobe[i]];
      const j = 0.85 + Math.random() * 0.3;
      cBase[i * 3] = t.r * j; cBase[i * 3 + 1] = t.g * j; cBase[i * 3 + 2] = t.b * j;
    }
  }
  const cortexGeo = makeGeometry(cx.positions, cx.sizes, cBase, cBase.slice());
  const cortexMat = makeMaterial(7);
  const cortexPoints = new THREE.Points(cortexGeo, cortexMat);
  cortexPoints.frustumCulled = false;
  scene.add(cortexPoints);
  const cortexRec = { id: '__cortex', kind: 'cortex', mat: cortexMat, base: 0.42, hi: 0, activity: 0 };

  const regions = structures.filter((s) => s.shape?.type === 'cortex');
  const depthOf = (s) => { let d = 0, p = s; while (p?.parent) { d++; p = structures.find((q) => q.id === p.parent); } return d; };
  const regionIndex = new Int16Array(nC).fill(-1);
  const regionList = [];
  const pts = new Array(nC);
  for (let i = 0; i < nC; i++) pts[i] = cortexPoint(cx.positions, cx.lobe, cx.medial, i);
  for (const s of [...regions].sort((a, b) => depthOf(b) - depthOf(a))) {
    const mask = new Uint8Array(nC);
    let count = 0;
    for (let i = 0; i < nC; i++) if (s.shape.test(pts[i])) { mask[i] = 1; count++; }
    const { center, radius } = anchorOf(cx.positions, (i) => mask[i]);
    const rec = { id: s.id, kind: 'region', mask, color: new THREE.Color(s.color), center, radius, structure: s, count };
    const idx = regionList.push(rec) - 1;
    for (let i = 0; i < nC; i++) if (mask[i] && regionIndex[i] < 0) regionIndex[i] = idx;
    recs.set(s.id, rec);
    if (!count) console.warn(`[brain] cortical region "${s.id}" matched no points`);
  }

  for (const s of structures) {
    if (!s.shape || s.shape.type === 'cortex') continue;
    const shape = buildShape(s.shape);
    const n = shape.sizes.length;
    const cols = tintArray(n, s.color);
    const geo = makeGeometry(shape.positions, shape.sizes, cols, cols.slice());
    const mat = makeMaterial(s.shape.pointScale || 6.5);
    const obj = new THREE.Points(geo, mat);
    obj.frustumCulled = false;
    scene.add(obj);
    const { center, radius } = anchorOf(shape.positions);
    const rec = { id: s.id, kind: 'deep', obj, mat, color: new THREE.Color(s.color), center, radius, structure: s, base: 0.4, hi: 0, activity: 0, hover: 0 };
    recs.set(s.id, rec);
    deepRecs.push(rec);
  }

  const anchorRecs = [];
  for (const a of anchors) {
    const shape = ellipsoid({ center: a.position, radii: [a.size || 0.03, a.size || 0.03, a.size || 0.03], count: 260, mirror: !!a.mirror });
    const cols = tintArray(shape.sizes.length, a.color || '#ffffff', 0.05);
    const geo = makeGeometry(shape.positions, shape.sizes, cols, cols.slice());
    const mat = makeMaterial(9);
    const obj = new THREE.Points(geo, mat);
    obj.frustumCulled = false;
    obj.visible = false;
    scene.add(obj);
    const rec = { id: a.id, kind: 'anchor', obj, mat, color: new THREE.Color(a.color || '#ffffff'), center: new THREE.Vector3(...a.position), radius: 0.05, anchor: a, base: 0, hi: 0, activity: 0, hover: 0 };
    recs.set(a.id, rec);
    anchorRecs.push(rec);
  }

  // Background dust for depth
  {
    const n = 900, p = new Float32Array(n * 3), s = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const r = 2.2 + Math.random() * 5;
      const u = Math.random() * 2 - 1, t = Math.random() * Math.PI * 2, q = Math.sqrt(1 - u * u);
      p[i * 3] = r * q * Math.cos(t); p[i * 3 + 1] = r * u; p[i * 3 + 2] = r * q * Math.sin(t);
      s[i] = Math.random() * 0.6 + 0.2;
    }
    const cols = tintArray(n, '#7a86c8', 0.3);
    const mat = makeMaterial(6);
    mat.uniforms.uBase.value = 0.18;
    const dust = new THREE.Points(makeGeometry(p, s, cols, cols.slice()), mat);
    dust.userData.dust = true;
    scene.add(dust);
    dust.onBeforeRender = () => { dust.rotation.y += 0.00015; };
  }

  // ------------------------------------------------------------ arcs (connections / pathway routes)
  const arcGroup = new THREE.Group();
  scene.add(arcGroup);
  let arcs = [];
  const arcDotMat = makeMaterial(10);
  arcDotMat.uniforms.uBase.value = 1.25;
  let arcDots = null;

  function centerOf(id) {
    const r = recs.get(id);
    return r ? r.center.clone() : null;
  }

  function buildArc(a, b, lift = 1) {
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const out = mid.clone().sub(BRAIN_CENTER);
    if (out.length() < 0.05) out.set(0, 1, 0);
    out.normalize();
    const ctrl = mid.add(out.multiplyScalar((0.12 + a.distanceTo(b) * 0.35) * lift));
    return new THREE.QuadraticBezierCurve3(a, ctrl, b);
  }

  function setArcs(list) {
    arcGroup.clear();
    arcs = [];
    if (arcDots) { scene.remove(arcDots); arcDots.geometry.dispose(); arcDots = null; }
    const dotPos = [], dotCol = [], dotSize = [];
    for (const item of list) {
      const a = centerOf(item.from), b = centerOf(item.to);
      if (!a || !b) continue;
      const curve = buildArc(a, b, item.lift ?? 1);
      const ca = recs.get(item.from).color, cb = recs.get(item.to).color;
      const N = 80;
      const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
      const isAmbient = item.active === 'ambient';
      const isOff = item.active === false;
      const k = isOff ? 0.14 : (isAmbient ? 0.26 : 0.48);
      for (let i = 0; i < N; i++) {
        const t = i / (N - 1), p = curve.getPoint(t);
        pos.set([p.x, p.y, p.z], i * 3);
        const c = ca.clone().lerp(cb, t);
        col.set([c.r * k, c.g * k, c.b * k], i * 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const line = new THREE.Line(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false }));
      arcGroup.add(line);
      const flow = item.flow || 'forward';
      const dots = isOff || flow === 'none' ? 0 : (isAmbient ? 3 : 9);
      const defaultSpeed = isAmbient ? 0.16 : 0.32;
      const arc = { curve, flow, start: dotPos.length / 3, dots, ca, cb, speed: item.speed || defaultSpeed, isAmbient };
      for (let i = 0; i < dots; i++) {
        dotPos.push(0, 0, 0);
        const dim = isAmbient ? 0.65 : 1.0;
        dotCol.push(ca.r * dim, ca.g * dim, ca.b * dim);
        dotSize.push(isAmbient ? 0.75 : (i === 0 ? 1.3 : 0.9));
      }
      arcs.push(arc);
    }
    if (dotPos.length) {
      const cols = new Float32Array(dotCol);
      arcDots = new THREE.Points(makeGeometry(new Float32Array(dotPos), new Float32Array(dotSize), cols, cols.slice()), arcDotMat);
      arcDots.frustumCulled = false;
      arcDots.geometry.getAttribute('position').setUsage(THREE.DynamicDrawUsage);
      scene.add(arcDots);
      arcDotMat.uniforms.uHi.value = 0;
    }
  }

  function updateArcDots(time) {
    if (!arcDots) return;
    const pos = arcDots.geometry.getAttribute('position');
    const col = arcDots.geometry.getAttribute('aColor');
    const tmp = new THREE.Color();
    for (const arc of arcs) {
      for (let i = 0; i < arc.dots; i++) {
        let t = (time * arc.speed + i / arc.dots) % 1;
        const back = arc.flow === 'back' || (arc.flow === 'both' && i % 2 === 1);
        if (back) t = 1 - t;
        const p = arc.curve.getPoint(t);
        pos.setXYZ(arc.start + i, p.x, p.y, p.z);
        tmp.copy(arc.ca).lerp(arc.cb, t);
        const dim = arc.isAmbient ? 0.65 : 1.0;
        col.setXYZ(arc.start + i, tmp.r * dim, tmp.g * dim, tmp.b * dim);
      }
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
  }

  // ------------------------------------------------------------ focus / highlight
  const aHi = cortexGeo.getAttribute('aHi');
  const aHiPrev = cortexGeo.getAttribute('aHiPrev');
  const aHiColor = cortexGeo.getAttribute('aHiColor');
  const aHiColorPrev = cortexGeo.getAttribute('aHiColorPrev');
  aHi.array.fill(0); aHiPrev.array.fill(0);
  aHi.needsUpdate = aHiPrev.needsUpdate = true;
  let focusIds = [];
  let hoverId = null;

  function focus(ids = [], { context = [], activity = false, ambient = true } = {}) {
    focusIds = ids.filter((id) => recs.has(id));
    const ctx = context.filter((id) => recs.has(id) && !focusIds.includes(id));
    const any = focusIds.length > 0;

    // Cross-fade the cortex highlight mask.
    aHiPrev.array.set(aHi.array);
    aHiColorPrev.array.set(aHiColor.array);
    aHi.array.fill(0);
    aHiColor.array.set(cBase);
    let cortexFocus = false;
    const paint = (id, value) => {
      const r = recs.get(id);
      if (r?.kind !== 'region') return;
      for (let i = 0; i < nC; i++) {
        if (!r.mask[i] || aHi.array[i] >= value) continue;
        aHi.array[i] = value;
        aHiColor.array[i * 3] = r.color.r; aHiColor.array[i * 3 + 1] = r.color.g; aHiColor.array[i * 3 + 2] = r.color.b;
      }
    };
    for (const id of ctx) paint(id, 0.35);
    for (const id of focusIds) { if (recs.get(id).kind === 'region') cortexFocus = true; paint(id, 1); }
    aHi.needsUpdate = aHiPrev.needsUpdate = aHiColor.needsUpdate = aHiColorPrev.needsUpdate = true;
    cortexMat.uniforms.uMix.value = 0;
    cortexRec.base = !any ? 0.42 : cortexFocus ? 0.13 : 0.12;
    cortexRec.hi = 1;
    const hasCortexCtx = ctx.some((id) => recs.get(id)?.kind === 'region');
    cortexRec.activity = activity && (cortexFocus || (ambient && hasCortexCtx)) ? 1 : 0;

    for (const r of deepRecs) {
      const f = focusIds.includes(r.id), c = ctx.includes(r.id);
      r.base = !any ? 0.4 : 0.1;
      r.hi = f ? 0.72 : c ? 0.35 : 0;
      r.activity = f && activity ? 1 : (c && activity && ambient ? 0.35 : 0);
    }
    for (const r of anchorRecs) {
      const f = focusIds.includes(r.id), c = ctx.includes(r.id);
      r.base = 0;
      r.hi = f ? 1.1 : c ? 0.5 : 0;
      r.activity = f && activity ? 1 : (c && activity && ambient ? 0.35 : 0);
      if (r.hi > 0) r.obj.visible = true;
    }
  }

  // Ask sketches: light each part by how it is involved.
  // Busier parts glow and fire, quieter ones glow faintly, parts losing cells barely show.
  const ROLE_LOOK = {
    more_active: { cortex: 1, deep: 0.9, activity: 1 },
    typical: { cortex: 0.8, deep: 0.72, activity: 0.5 },
    involved: { cortex: 0.8, deep: 0.72, activity: 0.5 },
    cut_off: { cortex: 0.7, deep: 0.62, activity: 0.3 },
    less_active: { cortex: 0.42, deep: 0.34, activity: 0 },
    losing_cells: { cortex: 0.26, deep: 0.2, activity: 0 },
  };
  function paintSketch(parts = []) {
    const looks = new Map(parts.filter((p) => recs.has(p.id)).map((p) => [p.id, ROLE_LOOK[p.role] || ROLE_LOOK.involved]));
    focusIds = [...looks.keys()];
    const any = focusIds.length > 0;

    aHiPrev.array.set(aHi.array);
    aHiColorPrev.array.set(aHiColor.array);
    aHi.array.fill(0);
    aHiColor.array.set(cBase);
    let cortexActivity = 0, cortexFocus = false;
    for (const [id, look] of looks) {
      const r = recs.get(id);
      if (r.kind !== 'region') continue;
      cortexFocus = true;
      cortexActivity = Math.max(cortexActivity, look.activity);
      for (let i = 0; i < nC; i++) {
        if (!r.mask[i] || aHi.array[i] >= look.cortex) continue;
        aHi.array[i] = look.cortex;
        aHiColor.array[i * 3] = r.color.r; aHiColor.array[i * 3 + 1] = r.color.g; aHiColor.array[i * 3 + 2] = r.color.b;
      }
    }
    aHi.needsUpdate = aHiPrev.needsUpdate = aHiColor.needsUpdate = aHiColorPrev.needsUpdate = true;
    cortexMat.uniforms.uMix.value = 0;
    cortexRec.base = !any ? 0.42 : cortexFocus ? 0.13 : 0.12;
    cortexRec.hi = 1;
    cortexRec.activity = cortexActivity;

    for (const r of deepRecs) {
      const look = looks.get(r.id);
      r.base = !any ? 0.4 : 0.1;
      r.hi = look ? look.deep : 0;
      r.activity = look ? look.activity : 0;
    }
    for (const r of anchorRecs) {
      const look = looks.get(r.id);
      r.base = 0;
      r.hi = look ? Math.min(1.1, look.deep * 1.4) : 0;
      if (r.hi > 0) r.obj.visible = true;
    }
  }

  // ------------------------------------------------------------ camera
  let flight = null;
  function flyTo(ids = [], view) {
    const rs = ids.map((id) => recs.get(id)).filter(Boolean);
    let center, dist;
    if (!rs.length) {
      center = BRAIN_CENTER.clone();
      dist = 3.85;
    } else {
      center = new THREE.Vector3();
      rs.forEach((r) => center.add(r.center));
      center.divideScalar(rs.length);
      let rad = 0;
      rs.forEach((r) => { rad = Math.max(rad, r.center.distanceTo(center) + r.radius); });
      dist = THREE.MathUtils.clamp(rad * 3.2 + 1.05, 1.75, 3.85);
    }
    const v = Array.isArray(view) ? view : VIEWS[view] || VIEWS.left;
    const dir = new THREE.Vector3(...v).normalize();
    flight = {
      t: 0, dur: 1.25,
      fromPos: camera.position.clone(), fromTarget: controls.target.clone(),
      toPos: center.clone().add(dir.multiplyScalar(dist)), toTarget: center,
    };
  }

  // ------------------------------------------------------------ slicing
  let userSlice = false, forcedSlice = false;
  function applySlice() {
    const v = userSlice || forcedSlice ? 1 : 0;
    materials.forEach((m) => { m.uniforms.uClip.value = v; });
  }

  // ------------------------------------------------------------ picking
  const raycaster = new THREE.Raycaster();
  raycaster.params.Points.threshold = 0.014;
  const mouse = new THREE.Vector2();
  let pendingPick = null;
  let lastHover = null;

  function pick(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    mouse.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(mouse, camera);
    const clip = userSlice || forcedSlice;
    const targets = [cortexPoints, ...deepRecs.map((r) => r.obj), ...anchorRecs.filter((r) => r.obj.visible && r.hi > 0).map((r) => r.obj)];
    const hits = raycaster.intersectObjects(targets, false);
    let best = null, ghost = null;
    for (const h of hits) {
      if (clip && h.point.x > 0.004) continue;
      let id, weight;
      if (h.object === cortexPoints) {
        const idx = regionIndex[h.index];
        if (idx < 0) continue;
        id = regionList[idx].id;
        weight = cortexRec.base + aHi.array[h.index] * cortexRec.hi;
      } else {
        const r = [...deepRecs, ...anchorRecs].find((q) => q.obj === h.object);
        id = r.id;
        weight = r.base + r.hi;
      }
      if (weight > 0.1) { best = id; break; }
      if (!ghost) ghost = id;
    }
    return best || ghost;
  }

  let down = null;
  canvas.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY };
    controls.autoRotate = false;
  });
  canvas.addEventListener('pointerup', (e) => {
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 5) {
      const id = pick(e.clientX, e.clientY);
      onPick?.(id);
    }
    down = null;
  });
  canvas.addEventListener('pointermove', (e) => { pendingPick = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointerleave', () => { pendingPick = null; setHover(null, 0, 0); });
  controls.addEventListener('start', () => { flight = null; });

  function setHover(id, x, y) {
    if (id !== lastHover) {
      lastHover = id;
      hoverId = id;
      canvas.style.cursor = id ? 'pointer' : '';
    }
    onHover?.(id, x, y);
  }

  // ------------------------------------------------------------ labels
  const orient = [
    { text: 'Front', pos: new THREE.Vector3(0, 0.12, 1.0) },
    { text: 'Back', pos: new THREE.Vector3(0, 0.12, -1.05) },
  ].map((o) => {
    const el = document.createElement('div');
    el.className = 'orient-label';
    el.textContent = o.text;
    labelsEl?.appendChild(el);
    return { ...o, el };
  });
  const anchorLabels = anchorRecs.map((r) => {
    const el = document.createElement('div');
    el.className = 'anchor-label';
    el.style.setProperty('--c', r.anchor.color || '#fff');
    el.innerHTML = `<i></i><span>${r.anchor.name}</span>`;
    labelsEl?.appendChild(el);
    return { r, el };
  });
  const tmpV = new THREE.Vector3();
  function updateLabels(w, h) {
    for (const o of orient) {
      tmpV.copy(o.pos).project(camera);
      const vis = tmpV.z < 1;
      const lx = THREE.MathUtils.clamp(((tmpV.x + 1) / 2) * w, 44, w - 44);
      const ly = THREE.MathUtils.clamp(((1 - tmpV.y) / 2) * h, 24, h - 24);
      o.el.style.transform = `translate(${lx}px, ${ly}px) translate(-50%, -50%)`;
      o.el.style.opacity = vis ? '' : '0';
    }
    for (const { r, el } of anchorLabels) {
      tmpV.copy(r.center).project(camera);
      const vis = tmpV.z < 1;
      el.style.transform = `translate(${((tmpV.x + 1) / 2) * w}px, ${((1 - tmpV.y) / 2) * h + 30}px) translate(-50%, 0)`;
      el.style.opacity = vis && r.hi > 0.05 ? String(Math.min(1, r.hi)) : '0';
    }
  }

  // ------------------------------------------------------------ loop
  let width = 1, height = 1;
  function resize() {
    const box = canvas.parentElement.getBoundingClientRect();
    width = Math.max(1, box.width); height = Math.max(1, box.height);
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
    bloom.setSize(width * pixel, height * pixel);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas.parentElement);
  resize();

  camera.position.copy(BRAIN_CENTER).add(new THREE.Vector3(...VIEWS.left).normalize().multiplyScalar(3.85));
  controls.target.copy(BRAIN_CENTER);
  controls.autoRotate = true;
  focus([]);

  const clock = new THREE.Clock();
  function approach(u, target, k) { u.value += (target - u.value) * k; }
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;
    const k = 1 - Math.exp(-dt * 5);

    if (flight) {
      flight.t += dt / flight.dur;
      const e = easeOutExpo(Math.min(flight.t, 1));
      camera.position.lerpVectors(flight.fromPos, flight.toPos, e);
      controls.target.lerpVectors(flight.fromTarget, flight.toTarget, e);
      if (flight.t >= 1) flight = null;
    }
    controls.update();

    if (pendingPick) {
      const id = pick(pendingPick.x, pendingPick.y);
      const rect = canvas.getBoundingClientRect();
      setHover(id, pendingPick.x - rect.left, pendingPick.y - rect.top);
      pendingPick = null;
    }

    materials.forEach((m) => { m.uniforms.uTime.value = time; });
    approach(cortexMat.uniforms.uBase, cortexRec.base, k);
    approach(cortexMat.uniforms.uHi, cortexRec.hi, k);
    approach(cortexMat.uniforms.uMix, 1, 1 - Math.exp(-dt * 4));
    approach(cortexMat.uniforms.uActivity, cortexRec.activity, k);
    for (const r of [...deepRecs, ...anchorRecs]) {
      approach(r.mat.uniforms.uBase, r.base, k);
      approach(r.mat.uniforms.uHi, r.hi, k);
      approach(r.mat.uniforms.uActivity, r.activity, k);
      approach(r.mat.uniforms.uHover, hoverId === r.id && !focusIds.includes(r.id) ? 0.35 : 0, 1 - Math.exp(-dt * 10));
      if (r.kind === 'anchor' && r.hi === 0 && r.mat.uniforms.uHi.value < 0.01) r.obj.visible = false;
    }
    approach(arcDotMat.uniforms.uHi, 1, k);
    updateArcDots(time);
    updateLabels(width, height);
    composer.render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    focus,
    paintSketch,
    flyTo,
    setArcs,
    has: (id) => recs.has(id),
    reset() { focus([]); setArcs([]); flyTo([]); forcedSlice = false; applySlice(); },
    setSlice(on) { userSlice = on; applySlice(); },
    forceSlice(on) { forcedSlice = on; applySlice(); },
    get slice() { return userSlice; },
    setSpin(on) { controls.autoRotate = on; },
    get spin() { return controls.autoRotate; },
  };
}
