// Procedural point-cloud generators. Pure JS (no three.js) so tools can import it.
//
// Coordinate system, in "brain units" (whole brain is about 1.7 long):
//   +x = the person's LEFT, +y = up, +z = front (nose).
// Shapes marked `mirror: true` are described on the left side (+x) and copied to the right.

import { noise3, mulberry32 } from './noise.js';

const rnd = mulberry32(42);

export const HEMI = { c: [0.2, 0.18, -0.02], r: [0.5, 0.48, 0.84] };
export const TEMPORAL = { c: [0.46, -0.17, 0.03], r: [0.21, 0.17, 0.42] };
export const LOBES = ['frontal', 'parietal', 'temporal', 'occipital'];

// The central sulcus separates frontal from parietal. It slants backwards as it rises.
export const centralZ = (y) => -0.02 - 0.32 * (y - 0.2);
export const OCCIPITAL_Z = -0.6;
// Height of the corpus callosum's arch at a given front/back position.
export const callosumY = (z) => 0.2 - 0.6 * (z - 0.02) ** 2;

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function randDir() {
  const u = rnd() * 2 - 1;
  const t = rnd() * Math.PI * 2;
  const s = Math.sqrt(1 - u * u);
  return [s * Math.cos(t), u, s * Math.sin(t)];
}

function insideEll(x, y, z, c, r) {
  const dx = (x - c[0]) / r[0], dy = (y - c[1]) / r[1], dz = (z - c[2]) / r[2];
  return dx * dx + dy * dy + dz * dz < 1;
}

const frac = (v) => v - Math.floor(v);

// Decide whether a candidate point is kept. Line points make the "wireframe" look,
// a sparse fill keeps the surface readable. Returns 0 (reject), 1 (line) or 0.5 (fill).
function pattern(kind, x, y, z, t = 0, a = 0, fill = 0.07) {
  let line = false;
  switch (kind) {
    case 'gyri': line = Math.abs(noise3(x * 9.5 + 11.3, y * 9.5 + 3.1, z * 9.5 - 5.7) + 0.25 * noise3(x * 23, y * 23, z * 23)) < 0.05; break;
    case 'fine': line = Math.abs(noise3(x * 13 + 2.1, y * 13, z * 13)) < 0.05; break;
    case 'folia': line = frac(y * 46 + noise3(x * 3, y * 3, z * 3) * 4) < 0.14; break;
    case 'rings': line = frac(t * 22) < 0.16; break;
    case 'fibers': line = frac((a / (Math.PI * 2)) * 18) < 0.14; break;
    case 'cross': line = frac(t * 55) < 0.22; break;
    default: return 1;
  }
  if (line) return 1;
  return rnd() < fill ? 0.5 : 0;
}

class Cloud {
  constructor() { this.p = []; this.s = []; }
  push(x, y, z, size, mirror) {
    this.p.push(x, y, z); this.s.push(size);
    if (mirror) { this.p.push(-x, y, z); this.s.push(size); }
  }
  out(extra = {}) {
    return { positions: new Float32Array(this.p), sizes: new Float32Array(this.s), ...extra };
  }
}

// ---------------------------------------------------------------- cortex
// The whole cerebral cortex as one cloud with per-point metadata.
// Cortical structures are "views" into it, picked by a test(point) function.
export function cortex({ count = 32000 } = {}) {
  const cloud = new Cloud();
  const lobe = [], medial = [];
  const taper = (z) => 1 - 0.22 * smooth(0.3, 0.84, z) - 0.12 * smooth(-0.45, -0.84, z);

  const emit = (x, y, z, isMedial, isTemporal, size) => {
    let l;
    if (isTemporal) l = 2;
    else if (z < OCCIPITAL_Z) l = 3;
    else if (z > centralZ(y)) l = 0;
    else l = 1;
    for (const s of [1, -1]) {
      cloud.push(x * s, y, z, size, false);
      lobe.push(l); medial.push(isMedial ? 1 : 0);
    }
  };

  let made = 0, guard = 0;
  const hemiShare = Math.floor(count * 0.8);
  while (made < hemiShare && guard++ < count * 60) {
    const d = randDir();
    let x = HEMI.c[0] + HEMI.r[0] * d[0];
    let y = HEMI.c[1] + HEMI.r[1] * d[1];
    const z = HEMI.c[2] + HEMI.r[2] * d[2];
    let isMedial = false;
    if (x < 0.012) { x = 0.012; isMedial = true; }
    x = 0.012 + (x - 0.012) * taper(z);
    if (y < -0.04) y = -0.04 + (y + 0.04) * 0.45;
    if (insideEll(x, y, z, TEMPORAL.c, TEMPORAL.r)) continue;
    const k = pattern('gyri', x, y, z, 0, 0, isMedial ? 0.04 : 0.045);
    if (!k) continue;
    emit(x, y, z, isMedial, false, k);
    made++;
  }
  guard = 0;
  while (made < count && guard++ < count * 60) {
    const d = randDir();
    const x = TEMPORAL.c[0] + TEMPORAL.r[0] * d[0];
    const y = TEMPORAL.c[1] + TEMPORAL.r[1] * d[1];
    const z = TEMPORAL.c[2] + TEMPORAL.r[2] * d[2];
    const y0 = y < -0.04 ? -0.04 + (y + 0.04) / 0.45 : y;
    if (y > -0.06 && insideEll(x, y0, z, HEMI.c, HEMI.r)) continue;
    const k = pattern('gyri', x, y, z);
    if (!k) continue;
    emit(x, y, z, false, true, k);
    made++;
  }
  return cloud.out({ lobe: new Uint8Array(lobe), medial: new Uint8Array(medial) });
}

// Point object handed to cortical `test` functions.
export function cortexPoint(positions, lobe, medial, i) {
  const x = positions[i * 3], y = positions[i * 3 + 1], z = positions[i * 3 + 2];
  return {
    x, y, z,
    ax: Math.abs(x),
    side: x >= 0 ? 'left' : 'right',
    lobe: LOBES[lobe[i]],
    medial: medial[i] === 1,
    central: centralZ(y),
  };
}

// ---------------------------------------------------------------- primitives
export function ellipsoid({ center, radii, count = 3000, pattern: pat = null, mirror = false, fill, cut }) {
  const cloud = new Cloud();
  let made = 0, guard = 0;
  while (made < count && guard++ < count * 80) {
    const d = randDir();
    const x = center[0] + radii[0] * d[0];
    const y = center[1] + radii[1] * d[1];
    const z = center[2] + radii[2] * d[2];
    if (cut && cut(x, y, z)) continue;
    const k = pattern(pat, x, y, z, 0, 0, fill);
    if (!k) continue;
    cloud.push(x, y, z, k, mirror);
    made++;
  }
  return cloud.out();
}

function catmull(pts, t) {
  const n = pts.length - 1;
  const f = Math.min(Math.max(t, 0), 1) * n;
  const i = Math.min(Math.floor(f), n - 1);
  const u = f - i;
  const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, n)];
  const out = [0, 0, 0];
  for (let k = 0; k < 3; k++) {
    out[k] = 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * u
      + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u * u
      + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u * u * u);
  }
  return out;
}
export { catmull };

function valueAt(spec, t) {
  if (typeof spec === 'number') return spec;
  for (let i = 0; i < spec.length - 1; i++) {
    const [t0, v0] = spec[i], [t1, v1] = spec[i + 1];
    if (t <= t1) return v0 + (v1 - v0) * ((t - t0) / (t1 - t0 || 1));
  }
  return spec[spec.length - 1][1];
}

const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// A curved tube along a path. radius: number or [[t, r], ...]. squash: [n, b] flattens the cross-section.
export function tube({ path, radius = 0.05, count = 3000, pattern: pat = 'rings', mirror = false, squash = [1, 1], fill }) {
  const cloud = new Cloud();
  let made = 0, guard = 0;
  while (made < count && guard++ < count * 80) {
    const t = rnd();
    const a = rnd() * Math.PI * 2;
    const c = catmull(path, t);
    const c2 = catmull(path, Math.min(1, t + 0.01));
    const c1 = catmull(path, Math.max(0, t - 0.01));
    const T = norm([c2[0] - c1[0], c2[1] - c1[1], c2[2] - c1[2]]);
    const up = Math.abs(T[0]) > 0.9 ? [0, 1, 0] : [1, 0, 0];
    const N = norm(cross(T, up));
    const B = cross(T, N);
    const r = valueAt(radius, t);
    const ca = Math.cos(a) * r * squash[0], sa = Math.sin(a) * r * squash[1];
    const x = c[0] + N[0] * ca + B[0] * sa;
    const y = c[1] + N[1] * ca + B[1] * sa;
    const z = c[2] + N[2] * ca + B[2] * sa;
    const k = pattern(pat, x, y, z, t, a, fill);
    if (!k) continue;
    cloud.push(x, y, z, k, mirror);
    made++;
  }
  return cloud.out();
}

// A curved sheet spanning the midline (e.g. corpus callosum). Fibres cross left-right.
export function band({ path, width = 0.3, sag = 0.08, thickness = 0.02, count = 4000, pattern: pat = 'cross', fill }) {
  const cloud = new Cloud();
  let made = 0, guard = 0;
  while (made < count && guard++ < count * 80) {
    const t = rnd();
    const u = rnd() * 2 - 1;
    const c = catmull(path, t);
    const w = valueAt(width, t);
    const x = u * w;
    const y = c[1] - u * u * sag + (rnd() - 0.5) * thickness;
    const z = c[2];
    const k = pattern(pat, x, y, z, t, 0, fill);
    if (!k) continue;
    cloud.push(x, y, z, k, false);
    made++;
  }
  return cloud.out();
}

// Build any non-cortex shape spec. Specs can combine primitives with `parts`.
export function buildShape(spec) {
  if (spec.parts) {
    const outs = spec.parts.map((p) => buildShape({ mirror: spec.mirror, ...p }));
    const n = outs.reduce((a, o) => a + o.sizes.length, 0);
    const positions = new Float32Array(n * 3), sizes = new Float32Array(n);
    let off = 0;
    for (const o of outs) { positions.set(o.positions, off * 3); sizes.set(o.sizes, off); off += o.sizes.length; }
    return { positions, sizes };
  }
  switch (spec.type) {
    case 'ellipsoid': return ellipsoid(spec);
    case 'tube': return tube(spec);
    case 'band': return band(spec);
    case 'custom': {
      const r = spec.build({ rnd, noise3 });
      return { positions: r.positions, sizes: r.sizes || new Float32Array(r.positions.length / 3).fill(1) };
    }
    default: throw new Error(`Unknown shape type "${spec.type}"`);
  }
}
