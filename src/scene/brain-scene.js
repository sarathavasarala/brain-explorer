import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { cortex, cortexPoint, buildShape, ellipsoid } from './shapes.js';
import { mulberry32 } from './noise.js';
import { buildCell } from './neuron.js';

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

const LANDMARK_NAMES = {
  soma: 'Cell body',
  dendrites: 'Dendrites',
  spines: 'Spines',
  axon: 'Axon',
  terminals: 'Terminals',
  myelin: 'Myelin sheath',
  node: 'Node of Ranvier',
  vessel: 'Blood vessel',
  processes: 'Processes',
};

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aRand;
  attribute float aHi;
  attribute float aHiPrev;
  attribute vec3 aColor;
  attribute vec3 aHiColor;
  attribute vec3 aHiColorPrev;
  uniform float uTime, uPixel, uScale, uBase, uHi, uMix, uHiSize, uClip, uActivity, uHover, uGlobal;
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
    vAlpha = b * mix(0.5, 1.0, aSize) * uGlobal;
    if (uClip > 0.5 && world.x > 0.004) vAlpha = 0.0;
    vAlpha *= smoothstep(0.35, 1.1, -mv.z);
    gl_PointSize = min(uScale * aSize * (1.0 + clamp(hi, 0.0, 1.0) * uHiSize + wave * 0.8) * uPixel / -mv.z, 26.0 * uPixel);
    gl_Position = projectionMatrix * mv;
  }
`;

const cellVertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aRand;
  attribute float aPart;
  attribute float aDist;
  uniform float uTime, uPixel, uScale, uPhase, uFire, uNodes, uGlobal, uIsMicroglia;
  uniform vec3 uBaseColor;
  uniform vec3 uTx;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 pos = position;
    if (uIsMicroglia > 0.5 && aPart > 0.5 && aPart < 1.5) {
      pos.x += sin(uTime * 2.0 + aRand * 6.0) * 0.004;
      pos.y += cos(uTime * 1.8 + aRand * 6.0) * 0.004;
    }
    vec4 world = modelMatrix * vec4(pos, 1.0);
    vec4 mv = viewMatrix * world;

    vec3 axonCol = mix(uBaseColor, vec3(0.4, 0.7, 1.0), 0.45);
    vec3 termCol = uTx;
    vec3 myelinCol = vec3(0.85, 0.9, 0.95);
    vec3 contextCol = vec3(0.35, 0.4, 0.5);

    vec3 col = uBaseColor;
    float baseBrightness = 0.55;

    if (aPart < 0.5) {
      col = uBaseColor;
      baseBrightness = 0.75;
    } else if (aPart < 1.5) {
      col = uBaseColor;
      baseBrightness = 0.58;
    } else if (aPart < 2.5) {
      col = axonCol;
      baseBrightness = 0.52;
    } else if (aPart < 3.5) {
      col = termCol;
      baseBrightness = 0.68;
    } else if (aPart < 4.5) {
      col = mix(uBaseColor, vec3(1.0, 1.0, 0.8), 0.25);
      baseBrightness = 0.62;
    } else if (aPart < 5.5) {
      col = myelinCol;
      baseBrightness = 0.42;
    } else {
      col = contextCol;
      baseBrightness = 0.18;
    }

    float glow = 0.0;
    vec3 glowCol = vec3(1.0);

    if (uFire > 0.5) {
      if (uPhase < 0.40) {
        if (abs(aPart - 1.0) < 0.2 || abs(aPart - 4.0) < 0.2) {
          float blink = step(0.982, fract(sin(aRand * 91.0 + floor(uTime * 6.0)) * 43758.5453));
          float inwardFront = uPhase / 0.40;
          float waveDist = abs((1.0 - aDist) - inwardFront);
          float wave = smoothstep(0.08, 0.0, waveDist);
          glow = max(blink * 1.5, wave * 1.4);
          glowCol = mix(vec3(1.0, 0.95, 0.7), uBaseColor, 0.3);
        }
      } else if (uPhase < 0.50) {
        if (aPart < 0.5) {
          float p = (uPhase - 0.40) / 0.10;
          float pulse = sin(p * 3.14159);
          glow = pulse * 1.8;
          glowCol = vec3(1.0, 1.0, 0.9);
        }
      } else if (uPhase < 0.92) {
        if (abs(aPart - 2.0) < 0.2 || abs(aPart - 5.0) < 0.2) {
          float front = (uPhase - 0.50) / 0.42;
          if (uNodes > 0.0) {
            front = floor(front * uNodes) / uNodes;
          }
          float spikeDist = abs(aDist - front);
          float spike = smoothstep(0.06, 0.0, spikeDist);
          glow = spike * 2.2;
          glowCol = vec3(0.9, 1.0, 1.0);
        }
      } else {
        if (abs(aPart - 3.0) < 0.2) {
          float p = (uPhase - 0.92) / 0.08;
          float pulse = sin(p * 3.14159);
          glow = pulse * 2.5;
          glowCol = uTx;
        }
      }
    }

    col = mix(col, glowCol, clamp(glow, 0.0, 1.0));
    float brightness = (baseBrightness + glow * 1.5) * (0.85 + 0.15 * sin(uTime * 1.8 + aRand * 30.0));
    if (aPart > 5.5) {
      brightness = 0.18;
    }

    vColor = col;
    vAlpha = 1.35 * brightness * mix(0.6, 1.0, aSize) * uGlobal;
    vAlpha *= smoothstep(0.2, 0.8, -mv.z);

    float pointSize = uScale * aSize * (1.0 + glow * 0.8) * uPixel / -mv.z;
    gl_PointSize = clamp(pointSize, 1.0, 32.0 * uPixel);
    gl_Position = projectionMatrix * mv;
  }
`;

const cellFragmentShader = /* glsl */ `
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

export function createBrainScene(canvas, { structures, anchors = [], chemicals = [], labelsEl, onHover, onPick }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  const pixel = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(pixel);
  renderer.setClearColor(0x04050a, 1);

  const chemicalColors = new Map((chemicals || []).map((c) => [c.id, c.color]));

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
  const brainMaterials = [];
  function makeMaterial(scale = 7, isBrain = true) {
    const m = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uPixel: { value: pixel }, uScale: { value: scale },
        uBase: { value: 0 }, uHi: { value: 0 }, uMix: { value: 1 }, uHiSize: { value: 0.55 },
        uClip: { value: 0 }, uActivity: { value: 0 }, uHover: { value: 0 }, uGlobal: { value: 1.0 },
      },
      vertexShader, fragmentShader,
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    });
    materials.push(m);
    if (isBrain) brainMaterials.push(m);
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
    rec.hiOrig = geo.getAttribute('aHiColor').array.slice();
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
    rec.hiOrig = geo.getAttribute('aHiColor').array.slice();
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
    const mat = makeMaterial(6, false);
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
    if (isLensActive) restoreLens();
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
    if (isLensActive) restoreLens();
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

  // ------------------------------------------------------------ chemical lens in 3D
  class SubCurve extends THREE.Curve {
    constructor(curve, t0 = 0, t1 = 1) {
      super();
      this.curve = curve;
      this.t0 = t0;
      this.t1 = t1;
    }
    getPoint(t, optionalTarget = new THREE.Vector3()) {
      const actualT = this.t0 + t * (this.t1 - this.t0);
      return this.curve.getPoint(actualT, optionalTarget);
    }
  }

  // The visible half. With the slice on, the camera looks at the cut face of the right half (x < 0),
  // which is the classic textbook sagittal view of these pathways. Without it, the left half (x > 0).
  const visibleSide = () => (userSlice || forcedSlice ? -1 : 1);

  function sideCenterOf(id, s) {
    const r = recs.get(id);
    if (!r) return null;
    if (r.kind === 'anchor') return r.center.clone();
    const pts = [];
    if (r.kind === 'region') {
      for (let i = 0; i < nC; i++) if (r.mask[i]) pts.push(i * 3);
      return centroidOf(cx.positions, pts, s, r.center);
    }
    const pos = r.obj.geometry.getAttribute('position').array;
    for (let i = 0; i < pos.length; i += 3) pts.push(i);
    return centroidOf(pos, pts, s, r.center);
  }

  function centroidOf(arr, idxs, s, fallback) {
    const c = new THREE.Vector3();
    let n = 0;
    for (const i of idxs) if (arr[i] * s > 0.004) { c.x += arr[i]; c.y += arr[i + 1]; c.z += arr[i + 2]; n++; }
    if (!n) for (const i of idxs) if (Math.abs(arr[i]) < 0.03) { c.x += arr[i]; c.y += arr[i + 1]; c.z += arr[i + 2]; n++; }
    if (!n) return fallback.clone();
    c.divideScalar(n);
    return c;
  }

  // Points inside a target where fibres can end, on the visible side and close to the midline
  // when sliced (so they land on the cut face you are looking at, not the far outer surface).
  function sidePoints(id, n, rnd, s) {
    const r = recs.get(id);
    if (!r) return [];
    const sliced = s < 0;
    let arr, idxs = [];
    if (r.kind === 'region') {
      arr = cx.positions;
      for (let i = 0; i < nC; i++) if (r.mask[i]) idxs.push(i * 3);
    } else if (r.kind === 'deep') {
      arr = r.obj.geometry.getAttribute('position').array;
      for (let i = 0; i < arr.length; i += 3) idxs.push(i);
    } else {
      const out = [];
      for (let k = 0; k < n; k++) out.push(r.center.clone().add(randomOffset(rnd, 0.015)));
      return out;
    }
    const tiers = [
      (i) => arr[i] * s > 0.004 && (!sliced || r.kind !== 'region' || Math.abs(arr[i]) < 0.22),
      (i) => arr[i] * s > 0.004,
      () => true,
    ];
    let list = [];
    for (const t of tiers) { list = idxs.filter(t); if (list.length >= 8) break; }
    if (!list.length) return [r.center.clone()];
    const out = [];
    for (let k = 0; k < n; k++) {
      const i = list[Math.floor(rnd() * list.length)];
      out.push(new THREE.Vector3(arr[i], arr[i + 1], arr[i + 2]));
    }
    return out;
  }

  function randomOffset(rnd, maxDist) {
    return new THREE.Vector3((rnd() - 0.5) * 2 * maxDist, (rnd() - 0.5) * 2 * maxDist, (rnd() - 0.5) * 2 * maxDist);
  }

  // An axon arbour: one trunk leaves the source, splits into a few primary branches,
  // and each primary splits into fine twigs that end inside the target.
  const TRUNK_SPLIT = 0.6;
  function buildTree(fromId, toId, { branches, rnd, s }) {
    const a = sideCenterOf(fromId, s) || BRAIN_CENTER.clone();
    const b = sideCenterOf(toId, s) || BRAIN_CENTER.clone();
    const trunk = buildArc(a, b, 0.4);
    const split = trunk.getPoint(TRUNK_SPLIT);
    const ends = sidePoints(toId, branches, rnd, s);

    const k = Math.max(2, Math.min(4, Math.round(ends.length / 4)));
    const seeds = [ends[0]];
    while (seeds.length < k) {
      let best = null, bestD = -1;
      for (const e of ends) {
        const d = Math.min(...seeds.map((q) => q.distanceTo(e)));
        if (d > bestD) { bestD = d; best = e; }
      }
      seeds.push(best);
    }
    const groups = seeds.map(() => []);
    for (const e of ends) {
      let gi = 0, gd = Infinity;
      seeds.forEach((q, i) => { const d = q.distanceTo(e); if (d < gd) { gd = d; gi = i; } });
      groups[gi].push(e);
    }

    const trunkPart = new SubCurve(trunk, 0, TRUNK_SPLIT);
    const primaries = [], twigs = [], paths = [];
    for (const g of groups) {
      if (!g.length) continue;
      const c = g.reduce((acc, e) => acc.add(e), new THREE.Vector3()).divideScalar(g.length);
      const sub = split.clone().lerp(c, 0.5).add(randomOffset(rnd, 0.02));
      const primary = new THREE.QuadraticBezierCurve3(split, split.clone().lerp(sub, 0.5).add(randomOffset(rnd, 0.015)), sub);
      primaries.push(primary);
      for (const e of g) {
        const twig = new THREE.QuadraticBezierCurve3(sub, sub.clone().lerp(e, 0.5).add(randomOffset(rnd, 0.025)), e);
        twigs.push(twig);
        const path = new THREE.CurvePath();
        path.add(trunkPart); path.add(primary); path.add(twig);
        paths.push({ path, end: e });
      }
    }
    return { fromId, toId, trunk, trunkPart, primaries, twigs, paths, ends, source: a };
  }

  const treeGroup = new THREE.Group();
  scene.add(treeGroup);

  const treeGlowMat = makeMaterial(6);
  treeGlowMat.uniforms.uBase.value = 1.0;
  treeGlowMat.uniforms.uHi.value = 0;

  const treePulsesMat = makeMaterial(9);
  treePulsesMat.uniforms.uBase.value = 1.5;
  treePulsesMat.uniforms.uHi.value = 0;

  const treeSparklesMat = makeMaterial(10);
  treeSparklesMat.uniforms.uBase.value = 1.6;
  treeSparklesMat.uniforms.uHi.value = 0;

  const treeLineMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false });

  let treeLines = null, treeGlow = null, treePulses = null, treeSparkles = null;
  let activePulses = [];
  let tractLabels = [];
  let isLensActive = false;
  let lensSources = [];

  function clearTrees() {
    treeGroup.clear();
    for (const o of [treeLines, treeGlow, treePulses, treeSparkles]) o?.geometry.dispose();
    treeLines = treeGlow = treePulses = treeSparkles = null;
    activePulses = [];
    for (const item of tractLabels) item.el.remove();
    tractLabels = [];
  }

  const PULSE_SPEED = 0.11;
  function updateTreePulses(time) {
    if (!treePulses || !activePulses.length) return;
    const posAttr = treePulses.geometry.getAttribute('position');
    const sizeAttr = treePulses.geometry.getAttribute('aSize');
    const sparkSize = treeSparkles?.geometry.getAttribute('aSize');
    for (let i = 0; i < activePulses.length; i++) {
      const p = activePulses[i];
      const t = (time * PULSE_SPEED + p.offset) % 1;
      const pt = p.path.getPoint(t);
      posAttr.setXYZ(i, pt.x, pt.y, pt.z);
      // Fade in as it leaves the source, fade out as it releases at the tip.
      const env = Math.min(1, t / 0.08) * Math.min(1, (1 - t) / 0.06);
      sizeAttr.setX(i, 1.5 * env);
      if (sparkSize) {
        const s = t > 0.9 ? Math.sin(((t - 0.9) / 0.1) * Math.PI) : 0;
        sparkSize.setX(i, s * 1.8);
      }
    }
    posAttr.needsUpdate = sizeAttr.needsUpdate = true;
    if (sparkSize) sparkSize.needsUpdate = true;
  }

  function paintLens(colorHex, sources = [], density = {}, isLocalOrFast = false) {
    isLensActive = true;
    lensSources = sources.filter((id) => recs.has(id));
    const lensColor = new THREE.Color(colorHex);
    focusIds = [...sources];

    aHiPrev.array.set(aHi.array);
    aHiColorPrev.array.set(aHiColor.array);
    aHi.array.fill(0);
    aHiColor.array.set(cBase);

    // Receptor glow stays soft so the fibres remain the brightest thing on screen.
    const glow = (d) => (isLocalOrFast ? 0.25 + 0.6 * d : 0.1 + 0.35 * d);
    const paintRegion = (r, val) => {
      for (let i = 0; i < nC; i++) {
        if (!r.mask[i] || aHi.array[i] >= val) continue;
        aHi.array[i] = val;
        aHiColor.array[i * 3] = lensColor.r; aHiColor.array[i * 3 + 1] = lensColor.g; aHiColor.array[i * 3 + 2] = lensColor.b;
      }
    };
    for (const [id, d] of Object.entries(density)) {
      const r = recs.get(id);
      if (r?.kind === 'region') paintRegion(r, glow(Math.max(0, Math.min(1, d))));
    }
    for (const id of sources) {
      const r = recs.get(id);
      if (r?.kind === 'region') paintRegion(r, 1);
    }

    aHi.needsUpdate = aHiPrev.needsUpdate = aHiColor.needsUpdate = aHiColorPrev.needsUpdate = true;
    cortexMat.uniforms.uMix.value = 0;
    cortexRec.base = 0.1;
    cortexRec.hi = 1.0;
    cortexRec.activity = isLocalOrFast ? 0.6 : (sources.some((id) => recs.get(id)?.kind === 'region') ? 1.0 : 0.0);

    for (const r of deepRecs) {
      const curHi = r.obj.geometry.getAttribute('aHiColor');
      const prevHi = r.obj.geometry.getAttribute('aHiColorPrev');
      prevHi.array.set(curHi.array);
      prevHi.needsUpdate = true;
      r.mat.uniforms.uMix.value = 0;

      const isSource = sources.includes(r.id);
      const d = density[r.id];
      if (isSource || d !== undefined) {
        curHi.array.set(tintArray(r.obj.geometry.getAttribute('position').count, colorHex, 0.06));
        curHi.needsUpdate = true;
      }
      if (isSource) {
        r.base = 0.1; r.hi = 1.25; r.activity = 1.0;
      } else if (d !== undefined) {
        r.base = 0.05; r.hi = glow(Math.max(0, Math.min(1, d))); r.activity = isLocalOrFast ? 0.6 : 0.0;
      } else {
        r.base = 0.08; r.hi = 0; r.activity = 0;
      }
    }

    for (const r of anchorRecs) {
      r.base = 0; r.hi = 0; r.activity = 0; r.obj.visible = false;
    }
    applySlice();
  }

  function restoreLens() {
    if (!isLensActive) return;
    isLensActive = false;
    lensSources = [];
    clearTrees();

    for (const r of deepRecs) {
      if (r.hiOrig) {
        const curHi = r.obj.geometry.getAttribute('aHiColor');
        const prevHi = r.obj.geometry.getAttribute('aHiColorPrev');
        curHi.array.set(r.hiOrig);
        prevHi.array.set(r.hiOrig);
        curHi.needsUpdate = prevHi.needsUpdate = true;
      }
      r.mat.uniforms.uMix.value = 1;
      r.base = 0.4; r.hi = 0; r.activity = 0;
    }

    aHiPrev.array.set(aHi.array);
    aHiColorPrev.array.set(aHiColor.array);
    aHi.array.fill(0);
    aHiColor.array.set(cBase);
    aHi.needsUpdate = aHiPrev.needsUpdate = aHiColor.needsUpdate = aHiColorPrev.needsUpdate = true;
    cortexMat.uniforms.uMix.value = 0;
    cortexRec.base = 0.42; cortexRec.hi = 0; cortexRec.activity = 0;
    focusIds = [];
    applySlice();
  }

  // Brightness of each fibre level, per tract state. 'off' tracts are not drawn at all.
  const FIBRE = { on: { trunk: 0.95, primary: 0.75, twig: 0.5, glow: 0.55 }, ambient: { trunk: 0.16, primary: 0.12, twig: 0.08, glow: 0.08 } };

  let lastChemConfig = null, lastChemSide = 0;
  function showChemical(config) {
    lastChemConfig = config;
    lastChemSide = visibleSide();
    if (!config) { restoreLens(); return; }
    const { color, sources = [], density = {}, tracts = [], group } = config;
    const isLocalOrFast = group === 'fast' || (tracts.length > 0 && tracts.every((t) => t.local));

    paintLens(color, sources, density, isLocalOrFast);
    clearTrees();
    if (isLocalOrFast || !tracts.length) return;

    const s = lastChemSide;
    const rnd = mulberry32(42);
    const lensColor = new THREE.Color(color);
    const linePos = [], lineCol = [];
    const glowPos = [], glowCol = [], glowSize = [];
    const pulsePos = [], pulseCol = [], pulseSize = [];
    const sparkPos = [], sparkCol = [], sparkSize = [];

    const addCurve = (curve, n, k, c, jitter = 0) => {
      let prev = null;
      for (let i = 0; i <= n; i++) {
        const p = curve.getPoint(i / n);
        if (jitter) p.add(randomOffset(rnd, jitter));
        if (prev) {
          linePos.push(prev.x, prev.y, prev.z, p.x, p.y, p.z);
          lineCol.push(c.r * k, c.g * k, c.b * k, c.r * k, c.g * k, c.b * k);
        }
        prev = p;
      }
    };
    const addGlow = (curve, n, k, c, size) => {
      for (let i = 0; i <= n; i++) {
        const p = curve.getPoint(i / n);
        glowPos.push(p.x, p.y, p.z);
        glowCol.push(c.r * k, c.g * k, c.b * k);
        glowSize.push(size * (0.8 + rnd() * 0.4));
      }
    };

    for (const t of tracts) {
      if (t.local || t.state === 'off' || !recs.has(t.from)) continue;
      const look = FIBRE[t.state] || FIBRE.ambient;
      const c = t.color ? new THREE.Color(t.color) : lensColor;
      const targets = (Array.isArray(t.to) ? t.to : [t.to]).filter((id) => recs.has(id));
      const branches = Math.max(6, Math.min(12, Math.round(24 / Math.max(1, targets.length))));
      const tractEnds = [];
      for (const toId of targets) {
        const tree = buildTree(t.from, toId, { branches, rnd, s });
        // The trunk is a bundle of a few strands, so it reads as a thick nerve leaving the source.
        for (let b = 0; b < 4; b++) addCurve(tree.trunkPart, 40, look.trunk * (b ? 0.6 : 1), c, b ? 0.004 : 0);
        for (const pc of tree.primaries) addCurve(pc, 16, look.primary, c);
        for (const tw of tree.twigs) addCurve(tw, 14, look.twig, c);
        addGlow(tree.trunkPart, 48, look.glow, c, 0.9);
        for (const pc of tree.primaries) addGlow(pc, 10, look.glow * 0.8, c, 0.7);
        for (const tw of tree.twigs) addGlow(tw, 8, look.glow * 0.6, c, 0.5);
        tractEnds.push(...tree.ends);

        if (t.state === 'on') {
          for (const p of tree.paths) {
            for (let q = 0; q < 2; q++) {
              activePulses.push({ path: p.path, offset: rnd() });
              pulsePos.push(0, 0, 0); pulseCol.push(c.r, c.g, c.b); pulseSize.push(0);
              sparkPos.push(p.end.x, p.end.y, p.end.z); sparkCol.push(c.r, c.g, c.b); sparkSize.push(0);
            }
          }
        }
      }

      if (t.state === 'on' && tractEnds.length && labelsEl) {
        const pos = tractEnds.reduce((acc, e) => acc.add(e), new THREE.Vector3()).divideScalar(tractEnds.length);
        const el = document.createElement('div');
        el.className = 'anchor-label tract-label';
        el.style.setProperty('--c', color);
        el.innerHTML = `<i></i><span>${t.name || t.label || t.id}</span>`;
        labelsEl.appendChild(el);
        tractLabels.push({ el, pos });
      }
    }

    if (linePos.length) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(lineCol, 3));
      treeLines = new THREE.LineSegments(g, treeLineMat);
      treeLines.frustumCulled = false;
      treeGroup.add(treeLines);
    }
    const addPoints = (pos, size, col, mat, dynamic) => {
      if (!pos.length) return null;
      const g = makeGeometry(new Float32Array(pos), new Float32Array(size), new Float32Array(col), new Float32Array(col));
      if (dynamic) for (const a of ['position', 'aSize']) g.getAttribute(a).setUsage(THREE.DynamicDrawUsage);
      const o = new THREE.Points(g, mat);
      o.frustumCulled = false;
      treeGroup.add(o);
      return o;
    };
    treeGlow = addPoints(glowPos, glowSize, glowCol, treeGlowMat, false);
    treePulses = addPoints(pulsePos, pulseSize, pulseCol, treePulsesMat, true);
    treeSparkles = addPoints(sparkPos, sparkSize, sparkCol, treeSparklesMat, true);
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

  function flyToTarget(center, dist, view = 'front', dur = 1.25) {
    const v = Array.isArray(view) ? view : VIEWS[view] || VIEWS.front;
    const dir = new THREE.Vector3(...v).normalize();
    flight = {
      t: 0, dur,
      fromPos: camera.position.clone(), fromTarget: controls.target.clone(),
      toPos: center.clone().add(dir.multiplyScalar(dist)), toTarget: center.clone(),
    };
  }

  // ------------------------------------------------------------ 3D cells
  let brainGlobalTarget = 1.0;
  let brainGlobalCurrent = 1.0;
  let activeCellObj = null;
  let activeCellEntry = null;
  const cellCache = new Map();
  let cellLandmarkLabels = [];

  function clearCellLabels() {
    for (const { el } of cellLandmarkLabels) {
      el.remove();
    }
    cellLandmarkLabels = [];
  }

  function setupCellLabels(cellEntry, landmarks) {
    clearCellLabels();
    if (!labelsEl || !cellEntry.landmarks) return;
    for (const key of cellEntry.landmarks) {
      const p = landmarks[key];
      if (!p) continue;
      const el = document.createElement('div');
      el.className = 'anchor-label';
      el.style.setProperty('--c', cellEntry.color || '#fff');
      const name = LANDMARK_NAMES[key] || key;
      el.innerHTML = `<i></i><span>${name}</span>`;
      labelsEl.appendChild(el);
      cellLandmarkLabels.push({ pos: new THREE.Vector3(...p), el });
    }
  }

  // Zoom between a brain part and a cell. 'in': fly into the part, then the brain fades and the
  // cell grows out of that spot. 'out': the cell shrinks back into the part as the brain returns.
  let zoom = null;
  const ZOOM_IN_FLY = 0.8, ZOOM_GROW = 1.0, ZOOM_OUT = 0.8;
  const ORIGIN = new THREE.Vector3();

  function zoomPointOf(id) {
    const r = recs.get(id);
    if (!r) return null;
    return sideCenterOf(id, visibleSide()) || r.center.clone();
  }

  function stepZoom(dt) {
    if (!zoom) return;
    zoom.t += dt;
    const o = zoom.cell.obj;
    if (zoom.dir === 'in') {
      if (zoom.stage === 'fly' && zoom.t >= ZOOM_IN_FLY) {
        zoom.stage = 'grow'; zoom.t = 0;
        brainGlobalTarget = 0.0;
        o.visible = true;
        flyToTarget(ORIGIN, 2.85, 'front', ZOOM_GROW);
      }
      if (zoom.stage === 'grow') {
        const e = easeOutExpo(Math.min(zoom.t / ZOOM_GROW, 1));
        o.position.lerpVectors(zoom.at, ORIGIN, e);
        o.scale.setScalar(0.03 + 0.97 * e);
        if (zoom.t >= ZOOM_GROW) { o.position.set(0, 0, 0); o.scale.setScalar(1); zoom = null; }
      }
    } else {
      const e = Math.min(zoom.t / ZOOM_OUT, 1);
      const q = e * e;
      o.position.lerpVectors(ORIGIN, zoom.at, q);
      o.scale.setScalar(1 - 0.97 * q);
      zoom.cell.mat.uniforms.uGlobal.value = 1 - q;
      if (e >= 1) { o.visible = false; o.position.set(0, 0, 0); o.scale.setScalar(1); zoom = null; }
    }
  }

  function showCell(cellEntry, { fire = false, from = null, to = null } = {}) {
    if (!cellEntry) {
      const leaving = activeCellObj;
      const at = to && zoomPointOf(to);
      if (leaving && at) zoom = { dir: 'out', t: 0, cell: leaving, at };
      else if (zoom?.dir === 'in') { zoom.cell.obj.position.set(0, 0, 0); zoom.cell.obj.scale.setScalar(1); zoom = null; }
      activeCellEntry = null;
      activeCellObj = null;
      brainGlobalTarget = 1.0;
      clearCellLabels();
      return;
    }

    if (isLensActive) restoreLens();
    const same = activeCellObj && activeCellEntry?.id === cellEntry.id;
    const at = !same && from && zoomPointOf(from);
    brainGlobalTarget = at ? 1.0 : 0.0;
    activeCellEntry = cellEntry;

    let cached = cellCache.get(cellEntry.id);
    if (!cached) {
      const morph = buildCell({ style: cellEntry.morph.style, seed: cellEntry.morph.seed || 7 });
      const geo = new THREE.BufferGeometry();
      const n = morph.sizes.length;
      const rand = new Float32Array(n);
      for (let i = 0; i < n; i++) rand[i] = Math.random();
      geo.setAttribute('position', new THREE.BufferAttribute(morph.positions, 3));
      geo.setAttribute('aSize', new THREE.BufferAttribute(morph.sizes, 1));
      geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
      geo.setAttribute('aPart', new THREE.BufferAttribute(morph.part, 1));
      geo.setAttribute('aDist', new THREE.BufferAttribute(morph.dist, 1));
      geo.computeBoundingSphere();

      const txColor = cellEntry.transmitter ? (chemicalColors.get(cellEntry.transmitter) || '#ffcf6b') : '#ffffff';
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uPixel: { value: pixel },
          uScale: { value: 17 },
          uPhase: { value: 0 },
          uFire: { value: fire ? 1.0 : 0.0 },
          uNodes: { value: morph.nodes || 0 },
          uGlobal: { value: 0.0 },
          uIsMicroglia: { value: cellEntry.morph.style === 'microglia' ? 1.0 : 0.0 },
          uBaseColor: { value: new THREE.Color(cellEntry.color) },
          uTx: { value: new THREE.Color(txColor) },
        },
        vertexShader: cellVertexShader,
        fragmentShader: cellFragmentShader,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      });
      const obj = new THREE.Points(geo, mat);
      obj.frustumCulled = false;
      scene.add(obj);
      cached = { obj, mat, landmarks: morph.landmarks, nodes: morph.nodes };
      cellCache.set(cellEntry.id, cached);
    }

    // Switching cells: drop the previous one at once instead of letting both overlap while fading.
    for (const c of cellCache.values()) {
      if (c !== cached) { c.obj.visible = false; c.mat.uniforms.uGlobal.value = 0; }
    }
    cached.obj.visible = true;
    cached.mat.uniforms.uFire.value = fire ? 1.0 : 0.0;
    cached.mat.uniforms.uBaseColor.value.set(cellEntry.color);
    if (cellEntry.transmitter) {
      const txColor = chemicalColors.get(cellEntry.transmitter) || '#ffcf6b';
      cached.mat.uniforms.uTx.value.set(txColor);
    }
    activeCellObj = cached;
    controls.autoRotate = false;
    setupCellLabels(cellEntry, cached.landmarks);
    if (same) return;

    if (at) {
      // Light the part and fly into it first; stepZoom() takes over from there.
      focus([from], { activity: true });
      cached.obj.visible = false;
      cached.obj.position.copy(at);
      cached.obj.scale.setScalar(0.03);
      const view = recs.get(from)?.structure?.view || 'left';
      flyToTarget(at, 0.7, view, ZOOM_IN_FLY);
      zoom = { dir: 'in', stage: 'fly', t: 0, cell: cached, at };
    } else {
      zoom = null;
      cached.obj.position.set(0, 0, 0);
      cached.obj.scale.setScalar(1);
      flyToTarget(ORIGIN, 2.85, 'front');
    }
  }

  function setCellFire(on) {
    if (activeCellObj) {
      activeCellObj.mat.uniforms.uFire.value = on ? 1.0 : 0.0;
    }
  }

  // ------------------------------------------------------------ slicing
  let userSlice = false, forcedSlice = false;
  function applySlice() {
    const v = userSlice || forcedSlice ? 1 : 0;
    materials.forEach((m) => { m.uniforms.uClip.value = v; });
    // Fibre trees are built on the visible half, so rebuild them if the slice flips sides.
    if (isLensActive && lastChemConfig && lastChemSide !== visibleSide()) showChemical(lastChemConfig);
  }

  // ------------------------------------------------------------ picking
  const raycaster = new THREE.Raycaster();
  raycaster.params.Points.threshold = 0.014;
  const mouse = new THREE.Vector2();
  let pendingPick = null;
  let lastHover = null;

  function pick(clientX, clientY) {
    if (activeCellObj) return null;
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
      o.el.style.opacity = vis && !activeCellObj ? '' : '0';
    }
    for (const { r, el } of anchorLabels) {
      tmpV.copy(r.center).project(camera);
      const vis = tmpV.z < 1;
      el.style.transform = `translate(${((tmpV.x + 1) / 2) * w}px, ${((1 - tmpV.y) / 2) * h + 30}px) translate(-50%, 0)`;
      el.style.opacity = vis && !activeCellObj && r.hi > 0.05 ? String(Math.min(1, r.hi)) : '0';
    }
    // Tract labels sit just above their targets; cell labels sit on their landmark.
    spreadLabels(tractLabels, w, h, -18, !activeCellObj);
    spreadLabels(cellLandmarkLabels, w, h, 0, !!activeCellObj && !zoom);
  }

  // Project labels to the screen and push down any that would overlap an earlier one.
  function spreadLabels(list, w, h, lift, show) {
    const placed = list.map((t) => {
      tmpV.copy(t.pos).project(camera);
      return { el: t.el, vis: tmpV.z < 1, x: ((tmpV.x + 1) / 2) * w, y: ((1 - tmpV.y) / 2) * h + lift, hw: (t.el.offsetWidth || 120) / 2 };
    }).sort((a, b) => a.y - b.y);
    for (let i = 1; i < placed.length; i++) {
      for (let j = 0; j < i; j++) {
        const a = placed[j], b = placed[i];
        if (Math.abs(a.x - b.x) < a.hw + b.hw + 6 && b.y - a.y < 28) b.y = a.y + 28;
      }
    }
    for (const t of placed) {
      t.el.style.transform = `translate(${t.x}px, ${t.y}px) translate(-50%, -50%)`;
      t.el.style.opacity = t.vis && show ? '1' : '0';
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

    stepZoom(dt);
    brainGlobalCurrent += (brainGlobalTarget - brainGlobalCurrent) * (1 - Math.exp(-dt * 4));
    for (const m of brainMaterials) {
      m.uniforms.uGlobal.value = brainGlobalCurrent;
    }
    for (const [id, c] of cellCache) {
      if (c === activeCellObj) {
        c.mat.uniforms.uGlobal.value += (1.0 - c.mat.uniforms.uGlobal.value) * (1 - Math.exp(-dt * 5));
        c.mat.uniforms.uTime.value = time;
        c.mat.uniforms.uPhase.value = (time / 3.0) % 1.0;
      } else if (zoom?.dir !== 'out' || zoom.cell !== c) {
        c.mat.uniforms.uGlobal.value += (0.0 - c.mat.uniforms.uGlobal.value) * (1 - Math.exp(-dt * 5));
        if (c.mat.uniforms.uGlobal.value < 0.01) c.obj.visible = false;
      }
    }

    materials.forEach((m) => { m.uniforms.uTime.value = time; });
    approach(cortexMat.uniforms.uBase, cortexRec.base, k);
    approach(cortexMat.uniforms.uHi, cortexRec.hi, k);
    approach(cortexMat.uniforms.uMix, 1, 1 - Math.exp(-dt * 4));
    approach(cortexMat.uniforms.uActivity, cortexRec.activity, k);
    for (const r of [...deepRecs, ...anchorRecs]) {
      approach(r.mat.uniforms.uBase, r.base, k);
      const beat = isLensActive && lensSources.includes(r.id) ? 0.3 * Math.sin(time * 2.4) : 0;
      approach(r.mat.uniforms.uHi, r.hi + beat, k);
      approach(r.mat.uniforms.uActivity, r.activity, k);
      approach(r.mat.uniforms.uMix, 1, 1 - Math.exp(-dt * 4));
      approach(r.mat.uniforms.uHover, hoverId === r.id && !focusIds.includes(r.id) ? 0.35 : 0, 1 - Math.exp(-dt * 10));
      if (r.kind === 'anchor' && r.hi === 0 && r.mat.uniforms.uHi.value < 0.01) r.obj.visible = false;
    }
    approach(arcDotMat.uniforms.uHi, 1, k);
    updateArcDots(time);
    updateTreePulses(time);
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
    showChemical,
    showCell,
    setCellFire,
    has: (id) => recs.has(id),
    reset() {
      if (isLensActive) restoreLens();
      focus([]); setArcs([]); flyTo([]); forcedSlice = false; applySlice();
    },
    setSlice(on) { userSlice = on; applySlice(); },
    forceSlice(on) { forcedSlice = on; applySlice(); },
    get slice() { return userSlice; },
    setSpin(on) { controls.autoRotate = on; },
    get spin() { return controls.autoRotate; },
  };
}
