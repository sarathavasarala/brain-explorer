// Procedural 3D Neuron Morphology Generator for Brain Explorer.
// Pure JS (no direct DOM/Three.js dependency so it can run headless or in web worker).
//
// Parts encoding:
//   0: soma (cell body)
//   1: dendrites / processes
//   2: axon
//   3: terminals / boutons
//   4: dendritic spines
//   5: myelin sheaths
//   6: context (ghost target somas, capillaries, muscle strip)
//
// dist encoding:
//   0.0 at the soma, rising to 1.0 at distal ends of dendrites or axons.

import { noise3, mulberry32 } from './noise.js';

export function buildCell({ style = 'pyramidal', seed = 7 } = {}) {
  const rnd = mulberry32(seed);

  const pos = [];
  const sizes = [];
  const parts = [];
  const dists = [];
  const landmarks = {};
  let nodesCount = 0;

  function addPt(x, y, z, size, part, dist) {
    pos.push(x, y, z);
    sizes.push(size);
    parts.push(part);
    dists.push(Math.max(0, Math.min(1, dist)));
  }

  // Generate a spherical or ellipsoidal body (soma, ghost cells, etc.)
  // taper > 0 narrows the top of the body, giving the triangular soma of a pyramidal cell.
  function addSoma({ center = [0, 0, 0], radii = [0.05, 0.05, 0.05], count = 500, part = 0, dist = 0, size = 0.55, taper = 0 }) {
    for (let i = 0; i < count; i++) {
      const u = rnd() * 2 - 1;
      const theta = rnd() * Math.PI * 2;
      const q = Math.sqrt(Math.max(0, 1 - u * u));
      // Two thirds on the surface, the rest filling the inside, so the body reads as solid.
      const rJitter = i % 3 === 2 ? Math.cbrt(rnd()) * 0.9 : 0.9 + rnd() * 0.2;
      const narrow = 1 - taper * ((u + 1) / 2);
      const x = center[0] + radii[0] * q * Math.cos(theta) * rJitter * narrow;
      const y = center[1] + radii[1] * u * rJitter;
      const z = center[2] + radii[2] * q * Math.sin(theta) * rJitter * narrow;
      addPt(x, y, z, size * (0.8 + rnd() * 0.4), part, dist);
    }
  }

  // Perpendicular vector helper
  function getPerp(dir) {
    const d = norm(dir);
    const up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const u = cross(d, up);
    const v = cross(d, u);
    return [norm(u), norm(v)];
  }

  function norm(v) {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  }

  function cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  // Recursive branch generator
  function growBranch({
    start,
    dir,
    length,
    radius,
    depth,
    rule,
    part = 1,
    dist0 = 0,
    totalDist = 1,
    stepLen = 0.009,
    squashZ = 1.0,
  }) {
    let cur = [...start];
    let d = norm(dir);
    const aim = norm(dir);
    const steps = Math.max(4, Math.floor(length / stepLen));
    const effectiveStep = length / steps;

    for (let s = 1; s <= steps; s++) {
      // Noise bend
      const nScale = 14;
      const nx = noise3(cur[0] * nScale + seed, cur[1] * nScale, cur[2] * nScale);
      const ny = noise3(cur[0] * nScale, cur[1] * nScale + seed, cur[2] * nScale);
      const nz = noise3(cur[0] * nScale, cur[1] * nScale, cur[2] * nScale + seed);
      // noise3 is centred on 0. Wander a little, but keep being pulled back toward the
      // branch's own direction so trees grow the way each style intends.
      d = norm([
        d[0] + nx * 0.14 + (aim[0] - d[0]) * 0.18,
        d[1] + ny * 0.14 + (aim[1] - d[1]) * 0.18,
        d[2] + nz * 0.14 + (aim[2] - d[2]) * 0.18,
      ]);

      cur = [
        cur[0] + d[0] * effectiveStep,
        cur[1] + d[1] * effectiveStep,
        cur[2] + d[2] * effectiveStep * squashZ,
      ];

      const segT = s / steps;
      const curDist = dist0 + (segT * (length / totalDist));
      const curRad = Math.max(0.003, radius * (1 - segT * 0.25));

      // Ring points around centerline
      const [u, v] = getPerp(d);
      // Thick branches get fuller rings so they read as continuous glowing tubes.
      const ptsOnRing = Math.min(12, Math.max(5, Math.round(curRad / 0.0016)));
      for (let p = 0; p < ptsOnRing; p++) {
        const angle = (p / ptsOnRing) * Math.PI * 2 + rnd() * 0.4;
        const rx = Math.cos(angle) * curRad;
        const ry = Math.sin(angle) * curRad;
        const along = (rnd() - 0.5) * effectiveStep;
        const px = cur[0] + (u[0] * rx + v[0] * ry) - d[0] * along;
        const py = cur[1] + (u[1] * rx + v[1] * ry) - d[1] * along;
        const pz = (cur[2] + (u[2] * rx + v[2] * ry) - d[2] * along) * squashZ;
        addPt(px, py, pz, 0.5 + Math.min(0.35, curRad * 14), part, curDist);
      }

      // Spines along dendrite
      if (rule.spines && part === 1 && depth >= 1 && rnd() < (rule.spineProb || 0.4)) {
        const spineAngle = rnd() * Math.PI * 2;
        const [su, sv] = getPerp(d);
        const spineLen = 0.016 + rnd() * 0.014;
        const sx = cur[0] + (su[0] * Math.cos(spineAngle) + sv[0] * Math.sin(spineAngle)) * (curRad + spineLen);
        const sy = cur[1] + (su[1] * Math.cos(spineAngle) + sv[1] * Math.sin(spineAngle)) * (curRad + spineLen);
        const sz = (cur[2] + (su[2] * Math.cos(spineAngle) + sv[2] * Math.sin(spineAngle)) * (curRad + spineLen)) * squashZ;
        // Neck and mushroom head
        addPt(sx * 0.5 + cur[0] * 0.5, sy * 0.5 + cur[1] * 0.5, sz * 0.5 + cur[2] * 0.5, 0.35, 4, curDist);
        addPt(sx, sy, sz, 0.7, 4, curDist);
      }
    }

    // Branching at distal end
    if (depth > 0 && rule.children) {
      const children = rule.children(depth, d, cur);
      for (const ch of children) {
        growBranch({
          start: cur,
          dir: ch.dir,
          length: ch.length || length * 0.72,
          radius: Math.max(0.003, radius * 0.68),
          depth: depth - 1,
          rule,
          part,
          dist0: dist0 + (length / totalDist),
          totalDist,
          stepLen,
          squashZ,
        });
      }
    } else {
      // Terminal boutons at branch tip
      const termCount = rule.terminalCount || 3;
      for (let t = 0; t < termCount; t++) {
        const tx = cur[0] + (rnd() - 0.5) * 0.018;
        const ty = cur[1] + (rnd() - 0.5) * 0.018;
        const tz = (cur[2] + (rnd() - 0.5) * 0.018) * squashZ;
        addPt(tx, ty, tz, 0.8, part === 2 ? 3 : part, 1.0);
      }
    }
    return cur;
  }

  // --- Specific style builders ---

  if (style === 'pyramidal') {
    // Triangular soma
    addSoma({ center: [0, 0, 0], radii: [0.07, 0.07, 0.06], count: 1400, part: 0, dist: 0, taper: 0.85 });
    landmarks.soma = [0, 0, 0];

    // Apical dendrite
    const apicalRule = {
      spines: true,
      spineProb: 0.45,
      children: (depth, curDir) => {
        if (depth === 3) {
          // Tuft at the top
          return [
            { dir: norm([curDir[0] - 0.95, curDir[1] + 0.3, curDir[2] + 0.3]), length: 0.18 },
            { dir: norm([curDir[0] + 0.9, curDir[1] + 0.35, curDir[2] - 0.3]), length: 0.2 },
            { dir: norm([curDir[0] + 0.1, curDir[1] + 0.5, curDir[2] + 0.6]), length: 0.2 },
            { dir: norm([curDir[0] - 0.2, curDir[1] + 0.4, curDir[2] - 0.8]), length: 0.18 },
          ];
        }
        return [
          { dir: norm([curDir[0] + (rnd() - 0.5) * 0.6, curDir[1] + 0.3, curDir[2] + (rnd() - 0.5) * 0.6]), length: 0.12 },
          { dir: norm([curDir[0] + (rnd() - 0.5) * 0.6, curDir[1] + 0.3, curDir[2] + (rnd() - 0.5) * 0.6]), length: 0.12 },
        ];
      },
    };
    // Trunk
    growBranch({
      start: [0, 0.05, 0],
      dir: [0, 1, 0],
      length: 0.32,
      radius: 0.016,
      depth: 3,
      rule: apicalRule,
      part: 1,
      totalDist: 0.55,
    });
    // Oblique collaterals along apical trunk
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + 0.3;
      const oy = 0.12 + i * 0.06;
      growBranch({
        start: [0, oy, 0],
        dir: norm([Math.cos(angle) * 0.8, 0.3, Math.sin(angle) * 0.8]),
        length: 0.14,
        radius: 0.009,
        depth: 1,
        rule: { spines: true, spineProb: 0.5, children: () => [] },
        part: 1,
        dist0: oy / 0.55,
        totalDist: 0.55,
      });
    }
    landmarks.dendrites = [0.06, 0.28, 0];
    landmarks.spines = [0.12, 0.42, 0];

    // Basal dendrites (5 radiating downward)
    const basalRule = {
      spines: true,
      spineProb: 0.4,
      children: () => [
        { dir: norm([(rnd() - 0.5) * 0.8, -0.4 - rnd() * 0.4, (rnd() - 0.5) * 0.8]), length: 0.14 },
        { dir: norm([(rnd() - 0.5) * 0.8, -0.4 - rnd() * 0.4, (rnd() - 0.5) * 0.8]), length: 0.14 },
      ],
    };
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      growBranch({
        start: [Math.cos(angle) * 0.035, -0.04, Math.sin(angle) * 0.035],
        dir: norm([Math.cos(angle) * 0.85, -0.45, Math.sin(angle) * 0.85]),
        length: 0.18,
        radius: 0.011,
        depth: 2,
        rule: basalRule,
        part: 1,
        totalDist: 0.45,
      });
    }

    // Axon descending
    growBranch({
      start: [0, -0.05, 0],
      dir: [0, -1, 0],
      length: 0.48,
      radius: 0.008,
      depth: 2,
      rule: {
        spines: false,
        terminalCount: 4,
        children: () => [
          { dir: norm([(rnd() - 0.5) * 0.6, -0.8, (rnd() - 0.5) * 0.6]), length: 0.15 },
          { dir: norm([(rnd() - 0.5) * 0.6, -0.8, (rnd() - 0.5) * 0.6]), length: 0.15 },
        ],
      },
      part: 2,
      totalDist: 0.5,
    });
    landmarks.axon = [0, -0.32, 0];
    landmarks.terminals = [0.04, -0.55, 0];

  } else if (style === 'stellate') {
    // Round soma with radiating spiny dendrites in all directions
    addSoma({ center: [0, 0, 0], radii: [0.045, 0.045, 0.045], count: 600, part: 0, dist: 0 });
    landmarks.soma = [0, 0, 0];

    const starRule = {
      spines: true,
      spineProb: 0.4,
      children: () => [
        { dir: norm([(rnd() - 0.5) * 2, (rnd() - 0.5) * 2, (rnd() - 0.5) * 2]), length: 0.13 },
      ],
    };
    for (let i = 0; i < 9; i++) {
      const u = (i / 9) * 2 - 1;
      const th = i * 2.4;
      const q = Math.sqrt(Math.max(0, 1 - u * u));
      growBranch({
        start: [q * Math.cos(th) * 0.04, u * 0.04, q * Math.sin(th) * 0.04],
        dir: norm([q * Math.cos(th), u, q * Math.sin(th)]),
        length: 0.22,
        radius: 0.01,
        depth: 2,
        rule: starRule,
        part: 1,
        totalDist: 0.35,
      });
    }
    landmarks.dendrites = [0.22, 0.18, 0];

    // Local branched axon
    growBranch({
      start: [0.02, -0.04, 0],
      dir: [0.3, -0.8, 0.2],
      length: 0.28,
      radius: 0.007,
      depth: 2,
      rule: {
        spines: false,
        terminalCount: 4,
        children: () => [
          { dir: norm([rnd() - 0.5, -0.7, rnd() - 0.5]), length: 0.1 },
          { dir: norm([rnd() - 0.5, -0.7, rnd() - 0.5]), length: 0.1 },
        ],
      },
      part: 2,
      totalDist: 0.35,
    });
    landmarks.axon = [-0.12, -0.2, 0];
    landmarks.terminals = [-0.18, -0.28, 0];

  } else if (style === 'purkinje') {
    // Pear soma at lower center
    addSoma({ center: [0, -0.18, 0], radii: [0.055, 0.07, 0.035], count: 800, part: 0, dist: 0 });
    landmarks.soma = [0, -0.18, 0];

    // Massive flat fan of dendrites squashed in Z (z * 0.06)
    const purkRule = {
      spines: true,
      spineProb: 0.65,
      terminalCount: 4,
      children: (depth, curDir) => {
        const spread = 0.55 + (6 - depth) * 0.08;
        return [
          { dir: norm([curDir[0] - spread, curDir[1] + 0.45, 0]), length: 0.13 },
          { dir: norm([curDir[0] + spread, curDir[1] + 0.45, 0]), length: 0.13 },
        ];
      },
    };
    // Primary trunk
    growBranch({
      start: [0, -0.11, 0],
      dir: [0, 1, 0],
      length: 0.16,
      radius: 0.024,
      depth: 5,
      rule: purkRule,
      part: 1,
      totalDist: 0.65,
      squashZ: 0.06,
    });
    landmarks.dendrites = [0, 0.2, 0];
    landmarks.spines = [0.22, 0.36, 0];

    // Descending axon
    growBranch({
      start: [0, -0.25, 0],
      dir: [0, -1, 0],
      length: 0.36,
      radius: 0.009,
      depth: 1,
      rule: { spines: false, terminalCount: 5, children: () => [] },
      part: 2,
      totalDist: 0.4,
    });
    landmarks.axon = [0, -0.38, 0];
    landmarks.terminals = [0, -0.58, 0];

  } else if (style === 'granule') {
    // Tiny soma
    addSoma({ center: [0, -0.22, 0], radii: [0.03, 0.03, 0.03], count: 420, part: 0, dist: 0 });
    landmarks.soma = [0, -0.22, 0];

    // 4 claw-like short dendrites
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + 0.4;
      growBranch({
        start: [Math.cos(angle) * 0.025, -0.22, Math.sin(angle) * 0.025],
        dir: norm([Math.cos(angle), -0.6, Math.sin(angle)]),
        length: 0.12,
        radius: 0.008,
        depth: 1,
        rule: {
          spines: false,
          children: () => [
            { dir: norm([Math.cos(angle + 0.5), -0.2, Math.sin(angle + 0.5)]), length: 0.05 },
            { dir: norm([Math.cos(angle - 0.5), -0.2, Math.sin(angle - 0.5)]), length: 0.05 },
          ],
        },
        part: 1,
        totalDist: 0.2,
      });
    }
    landmarks.dendrites = [0.07, -0.28, 0];

    // Ascending axon into T-junction (parallel fibres)
    growBranch({
      start: [0, -0.19, 0],
      dir: [0, 1, 0],
      length: 0.42,
      radius: 0.006,
      depth: 0,
      rule: { spines: false },
      part: 2,
      totalDist: 0.8,
    });
    landmarks.axon = [0, 0.02, 0];

    // T-junction horizontal fibres along X
    const tCenter = [0, 0.23, 0];
    growBranch({
      start: tCenter,
      dir: [1, 0.05, 0],
      length: 0.52,
      radius: 0.005,
      depth: 1,
      rule: {
        spines: false,
        terminalCount: 6,
        children: () => [{ dir: [1, 0, 0], length: 0.1 }],
      },
      part: 2,
      dist0: 0.45,
      totalDist: 0.8,
    });
    growBranch({
      start: tCenter,
      dir: [-1, 0.05, 0],
      length: 0.52,
      radius: 0.005,
      depth: 1,
      rule: {
        spines: false,
        terminalCount: 6,
        children: () => [{ dir: [-1, 0, 0], length: 0.1 }],
      },
      part: 2,
      dist0: 0.45,
      totalDist: 0.8,
    });
    landmarks.terminals = [0.48, 0.26, 0];

  } else if (style === 'basket') {
    // Interneuron soma
    addSoma({ center: [0, 0.08, 0], radii: [0.045, 0.045, 0.045], count: 580, part: 0, dist: 0 });
    landmarks.soma = [0, 0.08, 0];

    // Smooth radiating dendrites
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      growBranch({
        start: [Math.cos(angle) * 0.035, 0.08 + Math.sin(angle) * 0.035, 0],
        dir: norm([Math.cos(angle), 0.6 + Math.sin(angle) * 0.5, (rnd() - 0.5) * 0.4]),
        length: 0.26,
        radius: 0.01,
        depth: 2,
        rule: { spines: false, children: (d) => [{ dir: norm([rnd() - 0.5, 0.8, rnd() - 0.5]), length: 0.12 }] },
        part: 1,
        totalDist: 0.4,
      });
    }
    landmarks.dendrites = [0, 0.32, 0];

    // Ghost target cell bodies
    const targets = [
      [0.26, -0.16, 0.02],
      [-0.24, -0.2, -0.02],
      [0.02, -0.38, 0.04],
    ];
    for (const tgt of targets) {
      addSoma({ center: tgt, radii: [0.045, 0.055, 0.04], count: 280, part: 6, dist: 0, size: 0.35 });
    }

    // Axon branches weaving dense terminal baskets around targets
    for (const tgt of targets) {
      growBranch({
        start: [0, 0.04, 0],
        dir: norm([tgt[0], tgt[1] - 0.08, tgt[2]]),
        length: Math.hypot(tgt[0], tgt[1] - 0.08, tgt[2]),
        radius: 0.007,
        depth: 0,
        rule: { spines: false },
        part: 2,
        totalDist: 0.5,
      });
      // Basket ring of terminals around target
      for (let b = 0; b < 45; b++) {
        const theta = (b / 45) * Math.PI * 2;
        const bx = tgt[0] + Math.cos(theta) * 0.052 + (rnd() - 0.5) * 0.01;
        const by = tgt[1] + (rnd() - 0.5) * 0.04;
        const bz = tgt[2] + Math.sin(theta) * 0.052 + (rnd() - 0.5) * 0.01;
        addPt(bx, by, bz, 0.75, 3, 1.0);
      }
    }
    landmarks.axon = [0.12, -0.05, 0];
    landmarks.terminals = [0.26, -0.16, 0];

  } else if (style === 'chandelier') {
    // Interneuron soma
    addSoma({ center: [0, 0.16, 0], radii: [0.045, 0.045, 0.045], count: 600, part: 0, dist: 0 });
    landmarks.soma = [0, 0.16, 0];

    // Multipolar dendrites
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      growBranch({
        start: [Math.cos(angle) * 0.035, 0.16 + Math.sin(angle) * 0.035, 0],
        dir: norm([Math.cos(angle) * 0.8, 0.7, Math.sin(angle) * 0.8]),
        length: 0.24,
        radius: 0.01,
        depth: 2,
        rule: { spines: false, children: () => [{ dir: norm([rnd() - 0.5, 0.6, rnd() - 0.5]), length: 0.1 }] },
        part: 1,
        totalDist: 0.4,
      });
    }
    landmarks.dendrites = [0.15, 0.38, 0];

    // Axon collaterals with vertical "candles" (terminal cartridges)
    growBranch({
      start: [0, 0.11, 0],
      dir: [0, -1, 0],
      length: 0.18,
      radius: 0.008,
      depth: 0,
      rule: { spines: false },
      part: 2,
      totalDist: 0.5,
    });

    const candleXs = [-0.22, -0.1, 0.08, 0.24];
    for (const cx of candleXs) {
      // Horizontal connecting fiber
      const hy = -0.05 - rnd() * 0.04;
      growBranch({
        start: [0, -0.05, 0],
        dir: norm([cx, hy + 0.05, 0]),
        length: Math.abs(cx),
        radius: 0.006,
        depth: 0,
        rule: { spines: false },
        part: 2,
        dist0: 0.35,
        totalDist: 0.5,
      });
      // Ghost axon initial segment
      for (let g = 0; g < 14; g++) {
        addPt(cx, hy - g * 0.014, 0, 0.28, 6, 0);
      }
      // Vertical candle string of boutons
      for (let c = 0; c < 12; c++) {
        const cy = hy - c * 0.014;
        addPt(cx + (rnd() - 0.5) * 0.008, cy, (rnd() - 0.5) * 0.008, 0.8, 3, 1.0);
      }
    }
    landmarks.axon = [0, -0.02, 0];
    landmarks.terminals = [0.08, -0.14, 0];

  } else if (style === 'msn') {
    // Medium spiny neuron (Striatum)
    addSoma({ center: [0, 0, 0], radii: [0.05, 0.05, 0.045], count: 680, part: 0, dist: 0 });
    landmarks.soma = [0, 0, 0];

    // 7 densely spined radiating dendrites
    const msnRule = {
      spines: true,
      spineProb: 0.72,
      children: () => [
        { dir: norm([rnd() - 0.5, rnd() - 0.5, rnd() - 0.5]), length: 0.18 },
        { dir: norm([rnd() - 0.5, rnd() - 0.5, rnd() - 0.5]), length: 0.18 },
      ],
    };
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      growBranch({
        start: [Math.cos(angle) * 0.04, Math.sin(angle) * 0.04, 0],
        dir: norm([Math.cos(angle), Math.sin(angle) + 0.2, (rnd() - 0.5) * 0.5]),
        length: 0.24,
        radius: 0.012,
        depth: 2,
        rule: msnRule,
        part: 1,
        totalDist: 0.5,
      });
    }
    landmarks.dendrites = [0.22, 0.18, 0];
    landmarks.spines = [0.28, 0.25, 0];

    // Axon projecting to one side
    growBranch({
      start: [-0.03, -0.03, 0],
      dir: [-0.4, -0.85, 0.2],
      length: 0.44,
      radius: 0.007,
      depth: 2,
      rule: {
        spines: false,
        terminalCount: 4,
        children: () => [
          { dir: norm([rnd() - 0.5, -0.8, rnd() - 0.5]), length: 0.14 },
          { dir: norm([rnd() - 0.5, -0.8, rnd() - 0.5]), length: 0.14 },
        ],
      },
      part: 2,
      totalDist: 0.55,
    });
    landmarks.axon = [-0.15, -0.28, 0];
    landmarks.terminals = [-0.24, -0.55, 0];

  } else if (style === 'dopamine') {
    // Midbrain dopamine neuron: compact soma with vast sprawling axon arbor
    addSoma({ center: [0, 0.25, 0], radii: [0.048, 0.055, 0.04], count: 620, part: 0, dist: 0 });
    landmarks.soma = [0, 0.25, 0];

    // 4 smooth undulating dendrites
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + 0.5;
      growBranch({
        start: [Math.cos(angle) * 0.04, 0.25 + Math.sin(angle) * 0.04, 0],
        dir: norm([Math.cos(angle) * 1.2, 0.4, Math.sin(angle) * 1.2]),
        length: 0.32,
        radius: 0.012,
        depth: 2,
        rule: { spines: false, children: () => [{ dir: norm([rnd() - 0.5, 0.5, rnd() - 0.5]), length: 0.15 }] },
        part: 1,
        totalDist: 0.45,
      });
    }
    landmarks.dendrites = [0.22, 0.42, 0];

    // Vast axon arbor branching repeatedly (depth 5, many terminal dots)
    const arborRule = {
      spines: false,
      terminalCount: 3,
      children: (depth, curDir) => [
        { dir: norm([curDir[0] - 0.4 - rnd() * 0.3, curDir[1] - 0.4, (rnd() - 0.5) * 0.6]), length: 0.15 },
        { dir: norm([curDir[0] + 0.4 + rnd() * 0.3, curDir[1] - 0.4, (rnd() - 0.5) * 0.6]), length: 0.15 },
      ],
    };
    growBranch({
      start: [0, 0.2, 0],
      dir: [0, -1, 0],
      length: 0.24,
      radius: 0.01,
      depth: 5,
      rule: arborRule,
      part: 2,
      totalDist: 0.7,
    });
    landmarks.axon = [0, 0.08, 0];
    landmarks.terminals = [0.28, -0.42, 0];

  } else if (style === 'motor') {
    // Large multipolar motor neuron
    addSoma({ center: [0, 0.36, 0], radii: [0.065, 0.065, 0.055], count: 900, part: 0, dist: 0 });
    landmarks.soma = [0, 0.36, 0];

    // Multipolar thick dendrites
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      growBranch({
        start: [Math.cos(angle) * 0.05, 0.36 + Math.sin(angle) * 0.05, 0],
        dir: norm([Math.cos(angle) * 1.1, 0.6, Math.sin(angle) * 1.1]),
        length: 0.24,
        radius: 0.015,
        depth: 2,
        rule: { spines: false, children: () => [{ dir: norm([rnd() - 0.5, 0.6, rnd() - 0.5]), length: 0.14 }] },
        part: 1,
        totalDist: 0.4,
      });
    }
    landmarks.dendrites = [0.22, 0.52, 0];

    // Long straight axon with 5 myelin sheaths and nodes
    nodesCount = 5;
    const axonStart = [0, 0.3, 0];
    const sheathLen = 0.12;
    const gapLen = 0.02;

    for (let seg = 0; seg < 5; seg++) {
      const sy = axonStart[1] - seg * (sheathLen + gapLen);
      // Cylindrical myelin sheath (part 5)
      for (let step = 0; step < 18; step++) {
        const my = sy - (step / 18) * sheathLen;
        const curDist = 0.1 + (0.9 - 0.1) * ((axonStart[1] - my) / 0.75);
        for (let a = 0; a < 6; a++) {
          const theta = (a / 6) * Math.PI * 2;
          const mx = Math.cos(theta) * 0.018 + (rnd() - 0.5) * 0.003;
          const mz = Math.sin(theta) * 0.018 + (rnd() - 0.5) * 0.003;
          addPt(mx, my, mz, 0.65, 5, curDist);
        }
      }
      // Node of Ranvier gap (thin bare axon, part 2)
      if (seg < 4) {
        const nodeTop = sy - sheathLen;
        for (let g = 0; g < 4; g++) {
          const gy = nodeTop - (g / 4) * gapLen;
          const curDist = 0.1 + (0.9 - 0.1) * ((axonStart[1] - gy) / 0.75);
          for (let a = 0; a < 3; a++) {
            const theta = (a / 3) * Math.PI * 2;
            addPt(Math.cos(theta) * 0.007, gy, Math.sin(theta) * 0.007, 0.45, 2, curDist);
          }
        }
      }
    }
    landmarks.axon = [0, 0.15, 0];
    landmarks.myelin = [0, 0.02, 0];
    landmarks.node = [0, -0.06, 0];

    // Terminal arbor on muscle fiber strip
    const endY = -0.42;
    growBranch({
      start: [0, endY, 0],
      dir: [0, -1, 0],
      length: 0.12,
      radius: 0.008,
      depth: 2,
      rule: {
        spines: false,
        terminalCount: 4,
        children: () => [
          { dir: norm([0.6, -0.4, rnd() - 0.5]), length: 0.1 },
          { dir: norm([-0.6, -0.4, rnd() - 0.5]), length: 0.1 },
        ],
      },
      part: 2,
      dist0: 0.85,
      totalDist: 1.0,
    });
    landmarks.terminals = [0.08, -0.52, 0];

    // Muscle fiber strip (part 6, context)
    for (let i = 0; i < 280; i++) {
      const mx = (rnd() - 0.5) * 0.65;
      const my = -0.54 + (rnd() - 0.5) * 0.04;
      const mz = (rnd() - 0.5) * 0.18;
      addPt(mx, my, mz, 0.45, 6, 0);
    }

  } else if (style === 'relay') {
    // Thalamic sensory relay neuron: bushy dense dendrites, thick ascending axon
    addSoma({ center: [0, -0.15, 0], radii: [0.05, 0.05, 0.045], count: 650, part: 0, dist: 0 });
    landmarks.soma = [0, -0.15, 0];

    // Dense bushy dendritic tree
    const bushRule = {
      spines: true,
      spineProb: 0.35,
      children: () => [
        { dir: norm([rnd() - 0.5, rnd() - 0.5, rnd() - 0.5]), length: 0.14 },
        { dir: norm([rnd() - 0.5, rnd() - 0.5, rnd() - 0.5]), length: 0.14 },
      ],
    };
    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2;
      growBranch({
        start: [Math.cos(angle) * 0.04, -0.15 + Math.sin(angle) * 0.04, 0],
        dir: norm([Math.cos(angle), -0.2 + Math.sin(angle) * 0.7, (rnd() - 0.5) * 0.8]),
        length: 0.22,
        radius: 0.012,
        depth: 2,
        rule: bushRule,
        part: 1,
        totalDist: 0.4,
      });
    }
    landmarks.dendrites = [0.18, -0.1, 0];

    // Ascending axon toward cortex
    growBranch({
      start: [0, -0.1, 0],
      dir: [0, 1, 0],
      length: 0.55,
      radius: 0.009,
      depth: 2,
      rule: {
        spines: false,
        terminalCount: 4,
        children: () => [
          { dir: norm([rnd() - 0.5, 0.8, rnd() - 0.5]), length: 0.14 },
          { dir: norm([rnd() - 0.5, 0.8, rnd() - 0.5]), length: 0.14 },
        ],
      },
      part: 2,
      totalDist: 0.6,
    });
    landmarks.axon = [0, 0.22, 0];
    landmarks.terminals = [0.12, 0.52, 0];

  } else if (style === 'astrocyte') {
    // Astrocyte: central small soma with 24 fine bushy processes, 3 ending on blood vessel
    addSoma({ center: [0, 0, 0], radii: [0.035, 0.035, 0.035], count: 500, part: 0, dist: 0 });
    landmarks.soma = [0, 0, 0];

    const astroRule = {
      spines: false,
      children: () => [
        { dir: norm([rnd() - 0.5, rnd() - 0.5, rnd() - 0.5]), length: 0.12 },
        { dir: norm([rnd() - 0.5, rnd() - 0.5, rnd() - 0.5]), length: 0.12 },
      ],
    };
    for (let i = 0; i < 22; i++) {
      const u = (i / 22) * 2 - 1;
      const th = i * 2.399;
      const q = Math.sqrt(Math.max(0, 1 - u * u));
      growBranch({
        start: [q * Math.cos(th) * 0.03, u * 0.03, q * Math.sin(th) * 0.03],
        dir: norm([q * Math.cos(th), u, q * Math.sin(th)]),
        length: 0.24,
        radius: 0.008,
        depth: 2,
        rule: astroRule,
        part: 1,
        totalDist: 0.35,
      });
    }
    landmarks.processes = [-0.18, 0.2, 0];

    // Capillary tube on the right side (part 6, context)
    const vesselX = 0.32;
    for (let step = 0; step < 70; step++) {
      const vy = -0.55 + (step / 70) * 1.1;
      for (let a = 0; a < 6; a++) {
        const theta = (a / 6) * Math.PI * 2;
        const vx = vesselX + Math.cos(theta) * 0.035;
        const vz = Math.sin(theta) * 0.035;
        addPt(vx, vy, vz, 0.45, 6, 0);
      }
    }
    landmarks.vessel = [vesselX, 0.05, 0];

    // 3 vascular end-feet touching capillary
    const feetYs = [-0.18, 0.04, 0.22];
    for (const fy of feetYs) {
      growBranch({
        start: [0.03, 0, 0],
        dir: norm([vesselX, fy, 0]),
        length: Math.hypot(vesselX, fy, 0),
        radius: 0.009,
        depth: 0,
        rule: { spines: false },
        part: 1,
        totalDist: 0.35,
      });
      // Flattened end-foot contact plate
      for (let p = 0; p < 35; p++) {
        const theta = (p / 35) * Math.PI * 2;
        const px = vesselX - 0.02 + Math.cos(theta) * 0.02;
        const py = fy + Math.sin(theta) * 0.03;
        const pz = (rnd() - 0.5) * 0.02;
        addPt(px, py, pz, 0.65, 1, 1.0);
      }
    }

  } else if (style === 'oligodendrocyte') {
    // Oligodendrocyte: small soma sending processes to wrap multiple axon sheaths
    addSoma({ center: [0, 0, 0], radii: [0.035, 0.035, 0.035], count: 500, part: 0, dist: 0 });
    landmarks.soma = [0, 0, 0];

    // 6 myelin sheaths around ghost axons
    const sheaths = [
      { center: [0.26, 0.22, 0], dir: [0, 1, 0] },
      { center: [-0.28, 0.18, 0.05], dir: [0.2, 0.95, 0] },
      { center: [0.28, -0.22, -0.05], dir: [-0.1, 0.98, 0] },
      { center: [-0.24, -0.25, 0], dir: [0, 1, 0] },
    ];

    for (const sh of sheaths) {
      // Slender process from soma to sheath
      growBranch({
        start: [0, 0, 0],
        dir: norm(sh.center),
        length: Math.hypot(sh.center[0], sh.center[1], sh.center[2]),
        radius: 0.006,
        depth: 0,
        rule: { spines: false },
        part: 1,
        totalDist: 0.35,
      });
      // Ghost axon running through
      for (let step = 0; step < 35; step++) {
        const ay = sh.center[1] - 0.18 + (step / 35) * 0.36;
        addPt(sh.center[0], ay, sh.center[2], 0.35, 6, 0);
      }
      // Cylindrical myelin sheath (part 5)
      for (let step = 0; step < 16; step++) {
        const my = sh.center[1] - 0.08 + (step / 16) * 0.16;
        for (let a = 0; a < 6; a++) {
          const theta = (a / 6) * Math.PI * 2;
          const mx = sh.center[0] + Math.cos(theta) * 0.016;
          const mz = sh.center[2] + Math.sin(theta) * 0.016;
          addPt(mx, my, mz, 0.65, 5, 0.85);
        }
      }
    }
    landmarks.processes = [0.12, 0.1, 0];
    landmarks.myelin = [0.26, 0.22, 0];

  } else if (style === 'microglia') {
    // Microglia: small soma, tortuous delicate ramified branches
    addSoma({ center: [0, 0, 0], radii: [0.03, 0.03, 0.026], count: 480, part: 0, dist: 0 });
    landmarks.soma = [0, 0, 0];

    const microRule = {
      spines: false,
      children: () => [
        { dir: norm([rnd() - 0.5, rnd() - 0.5, rnd() - 0.5]), length: 0.14 },
        { dir: norm([rnd() - 0.5, rnd() - 0.5, rnd() - 0.5]), length: 0.14 },
      ],
    };
    for (let i = 0; i < 10; i++) {
      const u = (i / 10) * 2 - 1;
      const th = i * 2.399;
      const q = Math.sqrt(Math.max(0, 1 - u * u));
      growBranch({
        start: [q * Math.cos(th) * 0.025, u * 0.025, q * Math.sin(th) * 0.025],
        dir: norm([q * Math.cos(th), u, q * Math.sin(th)]),
        length: 0.24,
        radius: 0.007,
        depth: 2,
        rule: microRule,
        part: 1,
        totalDist: 0.38,
      });
    }
    landmarks.processes = [0.18, 0.22, 0];
  }

  // Centre the cell on the origin and scale it to a fixed height, so every style frames the same way.
  let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i += 3) {
    for (let a = 0; a < 3; a++) { min[a] = Math.min(min[a], pos[i + a]); max[a] = Math.max(max[a], pos[i + a]); }
  }
  const mid = [0, 1, 2].map((a) => (min[a] + max[a]) / 2);
  const extent = Math.max(max[0] - min[0], max[1] - min[1], 1e-6);
  const k = CELL_SIZE / extent;
  for (let i = 0; i < pos.length; i += 3) for (let a = 0; a < 3; a++) pos[i + a] = (pos[i + a] - mid[a]) * k;
  const moved = (p) => p.map((v, a) => (v - mid[a]) * k);

  // Labels sit on real points: for each landmark, the point of that part closest to the part's centre.
  const PART_OF = { soma: [0], dendrites: [1], processes: [1], spines: [4], axon: [2], terminals: [3], myelin: [5], node: [5], vessel: [6] };
  const onGeometry = (key) => {
    const want = PART_OF[key];
    if (!want) return null;
    const idx = [];
    for (let i = 0; i < parts.length; i++) {
      if (!want.includes(parts[i])) continue;
      if ((key === 'dendrites' || key === 'processes') && dists[i] < 0.45) continue;
      if (key === 'axon' && (dists[i] < 0.25 || dists[i] > 0.7)) continue;
      idx.push(i);
    }
    if (!idx.length) return null;
    const c = [0, 0, 0];
    for (const i of idx) for (let a = 0; a < 3; a++) c[a] += pos[i * 3 + a] / idx.length;
    // Radial cells average out to the middle. Aim for the upper right of the tree instead,
    // so the label points at branches and not at the cell body.
    if (key !== 'soma' && Math.hypot(c[0] - somaC[0], c[1] - somaC[1]) < CELL_SIZE * 0.15) {
      const lean = key === 'spines' ? [-0.25, 0.3] : [0.3, 0.25];
      c[0] = somaC[0] + lean[0] * CELL_SIZE; c[1] = somaC[1] + lean[1] * CELL_SIZE; c[2] = 0;
    }
    let best = idx[0], bd = Infinity;
    for (const i of idx) {
      const d = (pos[i * 3] - c[0]) ** 2 + (pos[i * 3 + 1] - c[1]) ** 2 + (pos[i * 3 + 2] - c[2]) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
    return [pos[best * 3], pos[best * 3 + 1], pos[best * 3 + 2]];
  };
  const somaC = [0, 0, 0];
  { let n = 0; for (let i = 0; i < parts.length; i++) if (parts[i] === 0) { for (let a = 0; a < 3; a++) somaC[a] += pos[i * 3 + a]; n++; } if (n) for (let a = 0; a < 3; a++) somaC[a] /= n; }
  const placed = {};
  for (const key of Object.keys(landmarks)) {
    const g = key === 'node' ? null : onGeometry(key);
    placed[key] = g || moved(landmarks[key]);
  }

  return {
    positions: new Float32Array(pos),
    sizes: new Float32Array(sizes),
    part: new Float32Array(parts),
    dist: new Float32Array(dists),
    landmarks: placed,
    nodes: nodesCount,
  };
}

// Height (or width, whichever is larger) of every cell after normalising, in scene units.
export const CELL_SIZE = 1.5;
