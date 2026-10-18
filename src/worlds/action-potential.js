// Action Potential biophysics world. Pure, deterministic math for ionic gradients,
// Hodgkin-Huxley voltage-gated channel kinetics, all-or-none avalanche,
// refractory periods, axon conduction velocity, and pharmacological blockade.
// No DOM and no Three.js, so every function can be tested in isolation.

export const WINDOW = [-1.0, 6.0]; // milliseconds (stimulus arrives at t = 0)

// ---------------------------------------------------------------- constants
export const V_REST = -70.0; // mV
export const V_THRESH = -55.0; // mV
export const V_PEAK = 35.0; // mV
export const E_NA = 55.0; // mV (Nernst equilibrium for Na+)
export const E_K = -82.0; // mV (Nernst equilibrium for K+)
export const E_L = -59.75; // mV (calibrated leak potential for dV/dt = 0 at rest)

export const G_NA_BAR = 120.0; // mS/cm^2
export const G_K_BAR = 36.0; // mS/cm^2
export const G_L = 0.3; // mS/cm^2
export const C_M = 1.0; // uF/cm^2

// Physiological ion concentrations across the mammalian neuronal membrane
export const CONCENTRATIONS = {
  na: { ion: 'Na+', name: 'Sodium', out: 145, in: 12, unit: 'mM', gradient: '12:1 outside' },
  k: { ion: 'K+', name: 'Potassium', out: 4, in: 140, unit: 'mM', gradient: '35:1 inside' },
  cl: { ion: 'Cl-', name: 'Chloride', out: 110, in: 10, unit: 'mM', gradient: '11:1 outside' },
  ca: { ion: 'Ca2+', name: 'Calcium', out: 2, in: 0.0001, unit: 'mM', gradient: '20,000:1 outside' },
};

// ---------------------------------------------------------------- rate equations
// Hodgkin-Huxley rate functions shifted so that V_REST is -70 mV.
export function alphaM(V) {
  const x = V + 45.0;
  return Math.abs(x) < 1e-4 ? 1.0 : (0.1 * x) / (1.0 - Math.exp(-x / 10.0));
}

export function betaM(V) {
  return 4.0 * Math.exp(-(V + 70.0) / 18.0);
}

export function alphaH(V) {
  return 0.07 * Math.exp(-(V + 70.0) / 20.0);
}

export function betaH(V) {
  return 1.0 / (1.0 + Math.exp(-(V + 40.0) / 10.0));
}

export function alphaN(V) {
  const x = V + 60.0;
  return Math.abs(x) < 1e-4 ? 0.1 : (0.01 * x) / (1.0 - Math.exp(-x / 10.0));
}

export function betaN(V) {
  return 0.125 * Math.exp(-(V + 70.0) / 80.0);
}

// Steady-state gate open probabilities and time constants
export function mInf(V) {
  const a = alphaM(V);
  return a / (a + betaM(V));
}

export function tauM(V) {
  return 1.0 / (alphaM(V) + betaM(V));
}

export function hInf(V) {
  const a = alphaH(V);
  return a / (a + betaH(V));
}

export function tauH(V) {
  return 1.0 / (alphaH(V) + betaH(V));
}

export function nInf(V) {
  const a = alphaN(V);
  return a / (a + betaN(V));
}

export function tauN(V) {
  return 1.0 / (alphaN(V) + betaN(V));
}

// ---------------------------------------------------------------- resting state
export function getRestingState() {
  const V = V_REST;
  const m = mInf(V);
  const h = hInf(V);
  const n = nInf(V);
  return {
    V,
    m,
    h,
    n,
    m3h: Math.pow(m, 3) * h,
    n4: Math.pow(n, 4),
    gNa: G_NA_BAR * Math.pow(m, 3) * h,
    gK: G_K_BAR * Math.pow(n, 4),
    gL: G_L,
  };
}

// ---------------------------------------------------------------- simulation
// Forward integration of Hodgkin-Huxley equations given injected current pulse
// and pharmacological channel block.
export function simulateAP({
  I = 25.0, // injected current amplitude (uA/cm^2)
  duration = 0.5, // stimulus duration (ms), starts at t = 0
  lidocaine = 0.0, // fraction of Na+ channels blocked by lidocaine (0..1)
  ttx = 0.0, // fraction of Na+ channels blocked by tetrodotoxin (0..1)
  dt = 0.005, // numerical step size in ms
  tStart = WINDOW[0],
  tEnd = WINDOW[1],
} = {}) {
  const block = Math.max(0.0, Math.min(1.0, 1.0 - (1.0 - lidocaine) * (1.0 - ttx)));
  const gNaEffective = G_NA_BAR * (1.0 - block);

  let V = V_REST;
  let m = mInf(V);
  let h = hInf(V);
  let n = nInf(V);

  const points = [];
  const totalSteps = Math.ceil((tEnd - tStart) / dt);

  for (let step = 0; step <= totalSteps; step++) {
    const t = tStart + step * dt;
    const stim = (t >= 0.0 && t <= duration) ? I : 0.0;

    const m3h = Math.pow(m, 3) * h;
    const n4 = Math.pow(n, 4);

    const gNa = gNaEffective * m3h;
    const gK = G_K_BAR * n4;
    const gL = G_L;

    const INa = gNa * (V - E_NA);
    const IK = gK * (V - E_K);
    const IL = gL * (V - E_L);

    // Qualitative state tagging
    let state = 'resting';
    if (block >= 0.6 && stim > 0) {
      state = 'blocked';
    } else if (t >= 0.0 && t <= duration && V < V_THRESH && stim < 12.0) {
      state = 'subthreshold';
    } else if (V >= V_THRESH && V < 20.0 && (t < 2.0)) {
      state = 'rising';
    } else if (V >= 20.0) {
      state = 'peak';
    } else if (V < 20.0 && V > V_REST && t >= 1.5 && t <= 3.5) {
      state = 'falling';
    } else if (V <= V_REST && t >= 2.5 && t <= 5.5) {
      state = 'hyperpolarized';
    }

    points.push({
      t,
      V,
      m,
      h,
      n,
      m3h,
      n4,
      gNa,
      gK,
      INa,
      IK,
      IL,
      IStim: stim,
      block,
      state,
    });

    // Numerical update (Euler step)
    const dV = (stim - INa - IK - IL) / C_M;
    const dm = alphaM(V) * (1.0 - m) - betaM(V) * m;
    const dh = alphaH(V) * (1.0 - h) - betaH(V) * h;
    const dn = alphaN(V) * (1.0 - n) - betaN(V) * n;

    V += dV * dt;
    m += dm * dt;
    h += dh * dt;
    n += dn * dt;

    // Bounds safety
    m = Math.max(0.0, Math.min(1.0, m));
    h = Math.max(0.0, Math.min(1.0, h));
    n = Math.max(0.0, Math.min(1.0, n));
  }

  return points;
}

// ---------------------------------------------------------------- interpolation
// Fast lookup of continuous state at any time t from a simulated dense points list.
export function stateAt(t, points) {
  if (!points || points.length === 0) return getRestingState();
  if (t <= points[0].t) return points[0];
  if (t >= points[points.length - 1].t) return points[points.length - 1];

  const dt = points[1].t - points[0].t;
  const idx = Math.floor((t - points[0].t) / dt);
  const i0 = Math.max(0, Math.min(points.length - 2, idx));
  const i1 = i0 + 1;
  const frac = (t - points[i0].t) / dt;

  const p0 = points[i0];
  const p1 = points[i1];

  return {
    t,
    V: p0.V + frac * (p1.V - p0.V),
    m: p0.m + frac * (p1.m - p0.m),
    h: p0.h + frac * (p1.h - p0.h),
    n: p0.n + frac * (p1.n - p0.n),
    m3h: p0.m3h + frac * (p1.m3h - p0.m3h),
    n4: p0.n4 + frac * (p1.n4 - p0.n4),
    gNa: p0.gNa + frac * (p1.gNa - p0.gNa),
    gK: p0.gK + frac * (p1.gK - p0.gK),
    INa: p0.INa + frac * (p1.INa - p0.INa),
    IK: p0.IK + frac * (p1.IK - p0.IK),
    IL: p0.IL + frac * (p1.IL - p0.IL),
    IStim: frac < 0.5 ? p0.IStim : p1.IStim,
    block: p0.block,
    state: frac < 0.5 ? p0.state : p1.state,
  };
}

// ---------------------------------------------------------------- conduction
// Conduction velocity comparing unmyelinated continuous propagation vs
// myelinated saltatory conduction across Nodes of Ranvier.
export function conductionVelocity({ diameter = 10, myelinated = true } = {}) {
  const d = Math.max(0.2, diameter);
  if (myelinated) {
    // Myelinated velocity scales linearly with fiber diameter: v ~ 6 * d (m/s)
    const velocity = 6.0 * d;
    return {
      diameter: d,
      myelinated: true,
      velocity,
      scaling: 'linear (v proportional to d)',
      nodeSpacingMm: 0.1 * d, // internode distance is roughly 100x fiber diameter
      latencyPerMeterMs: 1000.0 / velocity,
      mechanism: 'saltatory jumping between Nodes of Ranvier',
      description: 'Insulating myelin sheaths force current to skip swiftly between uninsulated nodes.',
    };
  }

  // Unmyelinated velocity scales with the square root of diameter: v ~ 1.0 * sqrt(d) (m/s)
  const velocity = 1.0 * Math.sqrt(d);
  return {
    diameter: d,
    myelinated: false,
    velocity,
    scaling: 'square root (v proportional to sqrt(d))',
    nodeSpacingMm: 0,
    latencyPerMeterMs: 1000.0 / velocity,
    mechanism: 'continuous uniform wave propagation',
    description: 'Every micrometer of membrane must sequentially depolarize and recharge its capacitance.',
  };
}

// Generates Node of Ranvier locations and activation times for an axon segment
export function saltatoryNodes({ nodeCount = 5, totalLengthMm = 5.0, myelinated = true } = {}) {
  const nodes = [];
  const stepMm = totalLengthMm / (nodeCount - 1);
  const vel = myelinated ? 60.0 : 1.5; // m/s (60 mm/ms vs 1.5 mm/ms)

  for (let i = 0; i < nodeCount; i++) {
    const xMm = i * stepMm;
    const tArrivalMs = xMm / vel;
    nodes.push({
      index: i,
      xMm,
      tArrivalMs,
      label: `Node ${i + 1}`,
    });
  }
  return nodes;
}

// Calculates spatial voltage profile along an axon at time t (ms)
export function axonSpatialProfile(xPositions, tMs, { myelinated = true, stimulusTime = 0.0 } = {}) {
  const vel = myelinated ? 60.0 : 1.5; // mm/ms
  const spikeWidthMm = myelinated ? 1.8 : 0.6;

  return xPositions.map((x) => {
    const waveFrontMm = (tMs - stimulusTime) * vel;
    if (tMs < stimulusTime) return { x, V: V_REST };

    if (myelinated) {
      // In myelinated axons, action potentials recharge at nodes spaced every 1 mm
      const nearestNodeMm = Math.round(x);
      const nodeDist = Math.abs(x - nearestNodeMm);
      const distFromWave = x - waveFrontMm;

      if (distFromWave > 0.5) return { x, V: V_REST };
      if (distFromWave < -spikeWidthMm) return { x, V: V_REST };

      // Spike profile at the current wave front
      const shape = Math.exp(-Math.pow(distFromWave / (spikeWidthMm * 0.5), 2));
      const nodeAttenuation = 1.0 - 0.25 * nodeDist;
      const V = V_REST + (V_PEAK - V_REST) * shape * nodeAttenuation;
      return { x, V };
    }

    // Continuous propagation
    const distFromWave = x - waveFrontMm;
    if (distFromWave > 0.4) return { x, V: V_REST };
    if (distFromWave < -spikeWidthMm) return { x, V: V_REST };

    const shape = Math.exp(-Math.pow(distFromWave / (spikeWidthMm * 0.4), 2));
    const V = V_REST + (V_PEAK - V_REST) * shape;
    return { x, V };
  });
}

// ---------------------------------------------------------------- pharmacology
// Fraction of available Na+ channels blocked by a given concentration of lidocaine
export function lidocaineBlockFraction(dosePercent) {
  const d = Math.max(0.0, Math.min(100.0, dosePercent));
  // Hill-style binding saturation curve with IC50 at 45%
  return Math.pow(d, 1.8) / (Math.pow(d, 1.8) + Math.pow(45.0, 1.8));
}

// Fraction of available Na+ channels blocked by tetrodotoxin (TTX)
export function ttxBlockFraction(nanomolar) {
  const c = Math.max(0.0, nanomolar);
  // High-affinity nanomolar pore blocker (Kd roughly 5 nM)
  return c / (c + 5.0);
}
