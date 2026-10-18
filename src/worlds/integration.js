// Synaptic integration and dendritic cable theory world.
// Pure, deterministic math for excitatory postsynaptic potentials (EPSPs),
// inhibitory postsynaptic potentials (IPSPs), passive cable attenuation,
// shunting inhibition, temporal summation, and the spike threshold decision
// at the axon initial segment (AIS).
// No DOM, no Three.js, so every function can be tested in isolation.

export const WINDOW = [-0.2, 2.2];

export const CONSTANTS = {
  V_REST: -70.0,       // Resting membrane potential in mV
  V_THRESH: -55.0,     // Action potential threshold at axon initial segment in mV
  V_PEAK: 30.0,        // Peak of action potential in mV
  V_RESET: -72.0,      // Afterhyperpolarization reset potential in mV
  E_AMPA: 0.0,         // Reversal potential for glutamate / AMPA in mV
  E_GABA: -70.0,       // Reversal potential for GABA-A (chloride) in mV
  TAU_M: 0.028,        // Membrane time constant in seconds (28 ms)
  LAMBDA: 0.60,        // Dendritic electrotonic space constant (normalized 0..1)
  PROP_SPEED: 18.0,    // Propagation velocity along dendrite (normalized lengths per second)
  G_LEAK: 1.0,         // Baseline resting membrane conductance (normalized)
};

// ---------------------------------------------------------------- Cable Theory
// Passive voltage decay along a cylindrical cable: V(x) = V0 * exp(-x / lambda).
// x is the normalized electrotonic distance from the synapse to the soma (0 = soma, 1 = distal tip).
export function cableDecay(v0, distance, lambda = CONSTANTS.LAMBDA) {
  const d = Math.max(0, distance);
  const l = Math.max(1e-4, lambda);
  return v0 * Math.exp(-d / l);
}

// Propagation delay for a voltage transient traveling down a dendrite of length distance.
export function dendriticDelay(distance, speed = CONSTANTS.PROP_SPEED) {
  const d = Math.max(0, distance);
  const s = Math.max(1e-4, speed);
  return d / s;
}

// ---------------------------------------------------------------- Synaptic Waveforms
// Dual-exponential alpha-like waveform for synaptic conductance or local voltage transient.
export function alphaWave(dt, tauRise, tauDecay) {
  if (dt <= 0) return 0;
  const tr = Math.max(1e-5, tauRise);
  const td = Math.max(tr + 1e-5, tauDecay);
  // Time to peak
  const tPeak = (tr * td) / (td - tr) * Math.log(td / tr);
  const maxVal = Math.exp(-tPeak / td) - Math.exp(-tPeak / tr);
  const norm = maxVal > 0 ? 1 / maxVal : 1;
  return norm * (Math.exp(-dt / td) - Math.exp(-dt / tr));
}

// Voltage waveform of a single EPSP at a given distance from the soma.
// As the EPSP travels down the dendrite to the soma, high-frequency filtering
// broadens the rise and decay times while cable resistance attenuates the amplitude.
export function epspWaveform(t, onset, {
  amplitude = 6.0,
  distance = 0.0,
  lambda = CONSTANTS.LAMBDA,
  tauRise = 0.003,
  tauDecay = 0.022,
} = {}) {
  const delay = dendriticDelay(distance);
  const dt = t - (onset + delay);
  if (dt <= 0) return 0;

  // Electrotonic low-pass filtering: rise and decay broaden with distance
  const effTauRise = tauRise * (1.0 + 1.2 * distance);
  const effTauDecay = tauDecay * (1.0 + 0.8 * distance);

  const localWave = alphaWave(dt, effTauRise, effTauDecay);
  const attenuatedAmp = cableDecay(amplitude, distance, lambda);
  return attenuatedAmp * localWave;
}

// Voltage waveform of an IPSP (hyperpolarizing component if V_mem > E_GABA).
export function ipspWaveform(t, onset, {
  amplitude = -2.5,
  distance = 0.0,
  lambda = CONSTANTS.LAMBDA,
  tauRise = 0.004,
  tauDecay = 0.035,
} = {}) {
  const delay = dendriticDelay(distance);
  const dt = t - (onset + delay);
  if (dt <= 0) return 0;

  const effTauRise = tauRise * (1.0 + 0.8 * distance);
  const effTauDecay = tauDecay * (1.0 + 0.6 * distance);

  const localWave = alphaWave(dt, effTauRise, effTauDecay);
  const attenuatedAmp = cableDecay(amplitude, distance, lambda);
  return attenuatedAmp * localWave;
}

// ---------------------------------------------------------------- Shunting Inhibition
// Shunting inhibition occurs when GABA-A channels open with a reversal potential
// near resting potential (E_GABA = -70 mV). Even though little voltage deflection occurs,
// the massive increase in chloride conductance (g_shunt) drops the local input resistance
// (R_in = 1 / (g_leak + g_shunt)), short-circuiting passing excitatory currents.
// The attenuation factor for an EPSP passing through a shunted compartment is:
// factor = g_leak / (g_leak + g_shunt).
export function shuntingAttenuation(gLeak = CONSTANTS.G_LEAK, gShunt = 0) {
  const gl = Math.max(1e-4, gLeak);
  const gs = Math.max(0, gShunt);
  return gl / (gl + gs);
}

// Conductance transient of a GABAergic shunting synapse.
export function gabaConductance(t, onset, {
  gPeak = 4.5,
  tauRise = 0.003,
  tauDecay = 0.030,
} = {}) {
  const dt = t - onset;
  if (dt <= 0) return 0;
  return gPeak * alphaWave(dt, tauRise, tauDecay);
}

// ---------------------------------------------------------------- Leaky Integrate-and-Fire
// Numerical step for membrane potential under leaky integrate-and-fire dynamics:
// tau_m * dV/dt = -(V - V_rest) + R_m * I_syn(t).
export function lifStep(v, iSyn, dt, {
  tauM = CONSTANTS.TAU_M,
  vRest = CONSTANTS.V_REST,
  rM = 1.0,
} = {}) {
  const dV = (-(v - vRest) + rM * iSyn) * (dt / Math.max(1e-5, tauM));
  return v + dV;
}

// ---------------------------------------------------------------- Synapse Definitions
// Standard layout of interactive synaptic inputs on a stylized pyramidal neuron.
export const DEFAULT_SYNAPSES = [
  {
    id: 'e1',
    label: 'E1: Distal Apical',
    type: 'excite',
    branch: 'apical-distal',
    distance: 0.85,
    pos: { x: 195, y: 38 },
    color: '#ffcf6b',
    amplitude: 30.0,
  },
  {
    id: 'e2',
    label: 'E2: Mid Apical',
    type: 'excite',
    branch: 'apical-trunk',
    distance: 0.45,
    pos: { x: 195, y: 115 },
    color: '#ffcf6b',
    amplitude: 18.0,
  },
  {
    id: 'e3',
    label: 'E3: Proximal Basal',
    type: 'excite',
    branch: 'basal-left',
    distance: 0.15,
    pos: { x: 135, y: 224 },
    color: '#ffcf6b',
    amplitude: 11.0,
  },
  {
    id: 'i_distal',
    label: 'I-Distal: Apical Tip',
    type: 'inhibit',
    branch: 'apical-distal',
    distance: 0.80,
    pos: { x: 235, y: 45 },
    color: '#ff6b7d',
    gPeak: 3.5,
  },
  {
    id: 'i_soma',
    label: 'I-Soma: Axon Hillock Veto',
    type: 'inhibit',
    branch: 'soma-ais',
    distance: 0.02,
    pos: { x: 212, y: 228 },
    color: '#ff6b7d',
    gPeak: 6.0,
  },
];

// ---------------------------------------------------------------- Trajectory Simulator
// Simulates the complete time course of synaptic integration across the dendritic tree,
// soma, and axon initial segment (AIS), returning time-series curves and spike events.
export function simulateIntegration({
  synapses = DEFAULT_SYNAPSES,
  activeIds = ['e1', 'e2', 'e3'],
  pulseTimes = { e1: [0.10], e2: [0.12], e3: [0.14], i_distal: [0.08], i_soma: [0.10] },
  vetoLocation = 'none', // 'none' | 'distal' | 'soma'
  tMin = WINDOW[0],
  tMax = WINDOW[1],
  dt = 0.003,
} = {}) {
  const steps = Math.ceil((tMax - tMin) / dt);
  const times = [];
  const vDendriteE1 = [];
  const vDendriteE2 = [];
  const vDendriteE3 = [];
  const vSoma = [];
  const vHillock = [];
  const spikeEvents = [];

  const activeSet = new Set(activeIds);

  // Determine active inhibitory conductances
  const hasDistalInhibition = activeSet.has('i_distal') || vetoLocation === 'distal';
  const hasSomaInhibition = activeSet.has('i_soma') || vetoLocation === 'soma';

  let inSpike = false;
  let spikeTimer = 0;
  let currentHillockV = CONSTANTS.V_REST;

  for (let step = 0; step <= steps; step++) {
    const t = tMin + step * dt;
    times.push(t);

    // 1. Calculate local dendritic responses at each electrode site
    let e1Local = 0;
    if (activeSet.has('e1')) {
      const timesE1 = pulseTimes.e1 || [0.10];
      for (const t0 of timesE1) {
        e1Local += epspWaveform(t, t0, { amplitude: 30.0, distance: 0.0 });
      }
    }

    let e2Local = 0;
    if (activeSet.has('e2')) {
      const timesE2 = pulseTimes.e2 || [0.12];
      for (const t0 of timesE2) {
        e2Local += epspWaveform(t, t0, { amplitude: 18.0, distance: 0.0 });
      }
    }

    let e3Local = 0;
    if (activeSet.has('e3')) {
      const timesE3 = pulseTimes.e3 || [0.14];
      for (const t0 of timesE3) {
        e3Local += epspWaveform(t, t0, { amplitude: 11.0, distance: 0.0 });
      }
    }

    vDendriteE1.push(CONSTANTS.V_REST + e1Local);
    vDendriteE2.push(CONSTANTS.V_REST + e2Local);
    vDendriteE3.push(CONSTANTS.V_REST + e3Local);

    // 2. Conductances for shunting inhibition
    let gShuntDistal = 0;
    if (hasDistalInhibition) {
      const timesIDist = pulseTimes.i_distal || [0.08];
      for (const t0 of timesIDist) {
        gShuntDistal += gabaConductance(t, t0, { gPeak: 5.0 });
      }
    }

    let gShuntSoma = 0;
    if (hasSomaInhibition) {
      const timesISoma = pulseTimes.i_soma || [0.10];
      for (const t0 of timesISoma) {
        gShuntSoma += gabaConductance(t, t0, { gPeak: 6.5 });
      }
    }

    // Shunting factors (reduction in incoming EPSP amplitude)
    const factorDistal = shuntingAttenuation(CONSTANTS.G_LEAK, gShuntDistal);
    const factorSoma = shuntingAttenuation(CONSTANTS.G_LEAK, gShuntSoma);

    // 3. Propagate EPSPs toward soma with cable decay and branch-specific shunting
    let somaEPSP = 0;

    // E1 is on distal apical branch: affected by distal shunt on apical tuft
    if (activeSet.has('e1')) {
      const timesE1 = pulseTimes.e1 || [0.10];
      for (const t0 of timesE1) {
        const rawArrival = epspWaveform(t, t0, { amplitude: 30.0, distance: 0.85 });
        somaEPSP += rawArrival * factorDistal;
      }
    }

    // E2 is on mid apical trunk: below distal tuft, so bypasses distal shunt
    if (activeSet.has('e2')) {
      const timesE2 = pulseTimes.e2 || [0.12];
      for (const t0 of timesE2) {
        const rawArrival = epspWaveform(t, t0, { amplitude: 18.0, distance: 0.45 });
        somaEPSP += rawArrival;
      }
    }

    // E3 is on proximal basal branch: completely separate branch from apical arbor
    if (activeSet.has('e3')) {
      const timesE3 = pulseTimes.e3 || [0.14];
      for (const t0 of timesE3) {
        const rawArrival = epspWaveform(t, t0, { amplitude: 11.0, distance: 0.15 });
        somaEPSP += rawArrival;
      }
    }

    // 4. Somatic shunting veto: intercepts all combined inputs converging at the soma/AIS
    const netSomaDepolarization = somaEPSP * factorSoma;
    const vSomaSub = CONSTANTS.V_REST + netSomaDepolarization;
    vSoma.push(vSomaSub);

    // 5. Axon Initial Segment (AIS) trigger decision
    if (inSpike) {
      spikeTimer += dt;
      if (spikeTimer < 0.003) {
        // Fast depolarizing upstroke to peak
        currentHillockV = CONSTANTS.V_PEAK;
      } else if (spikeTimer < 0.010) {
        // Repolarization down to afterhyperpolarization
        const frac = (spikeTimer - 0.003) / 0.007;
        currentHillockV = CONSTANTS.V_PEAK - frac * (CONSTANTS.V_PEAK - CONSTANTS.V_RESET);
      } else if (spikeTimer < 0.028) {
        // Recovery from refractory period back toward subthreshold
        const frac = (spikeTimer - 0.010) / 0.018;
        currentHillockV = CONSTANTS.V_RESET + frac * (vSomaSub - CONSTANTS.V_RESET);
      } else {
        inSpike = false;
        currentHillockV = vSomaSub;
      }
    } else {
      currentHillockV = vSomaSub;
      if (currentHillockV >= CONSTANTS.V_THRESH && t > 0.02) {
        inSpike = true;
        spikeTimer = 0;
        spikeEvents.push({ t, v: CONSTANTS.V_PEAK });
      }
    }

    vHillock.push(currentHillockV);
  }

  const reachedThreshold = spikeEvents.length > 0;
  const maxHillockV = Math.max(...vHillock);

  return {
    times,
    vDendriteE1,
    vDendriteE2,
    vDendriteE3,
    vSoma,
    vHillock,
    spikeEvents,
    reachedThreshold,
    maxHillockV,
    vetoActive: hasSomaInhibition && maxHillockV < CONSTANTS.V_THRESH,
  };
}

// ---------------------------------------------------------------- Preset Scenarios
// Pre-configured parameter sets matching the core didactic steps of the lab.

export function scenarioSingleEpsp() {
  return simulateIntegration({
    activeIds: ['e2'],
    pulseTimes: { e2: [0.15] },
    vetoLocation: 'none',
  });
}

export function scenarioTemporalSummation(freq = 'high') {
  const isHigh = freq === 'high';
  // Rapid burst (100 Hz, 10 ms interval) vs spaced pulses (20 Hz, 50 ms interval)
  const pulses = isHigh ? [0.10, 0.12, 0.14, 0.16] : [0.10, 0.22, 0.34, 0.46];
  return simulateIntegration({
    activeIds: ['e1'],
    pulseTimes: { e1: pulses },
    vetoLocation: 'none',
  });
}

export function scenarioSpatialSummation() {
  return simulateIntegration({
    activeIds: ['e1', 'e2', 'e3'],
    pulseTimes: { e1: [0.12], e2: [0.13], e3: [0.14] },
    vetoLocation: 'none',
  });
}

export function scenarioDistalVsProximal() {
  // Compare a single distal pulse vs a single proximal pulse of identical synaptic strength
  return {
    distal: simulateIntegration({ activeIds: ['e1'], pulseTimes: { e1: [0.12] }, vetoLocation: 'none' }),
    proximal: simulateIntegration({ activeIds: ['e3'], pulseTimes: { e3: [0.12] }, vetoLocation: 'none' }),
  };
}

export function scenarioShuntingVeto(vetoLocation = 'soma') {
  // Triple excitatory input trying to fire, with GABA placed at soma vs distal tip
  return simulateIntegration({
    activeIds: ['e1', 'e2', 'e3', vetoLocation === 'soma' ? 'i_soma' : 'i_distal'],
    pulseTimes: { e1: [0.12], e2: [0.13], e3: [0.14], i_soma: [0.11], i_distal: [0.10] },
    vetoLocation,
  });
}

export default {
  WINDOW,
  CONSTANTS,
  DEFAULT_SYNAPSES,
  cableDecay,
  dendriticDelay,
  alphaWave,
  epspWaveform,
  ipspWaveform,
  shuntingAttenuation,
  gabaConductance,
  lifStep,
  simulateIntegration,
  scenarioSingleEpsp,
  scenarioTemporalSummation,
  scenarioSpatialSummation,
  scenarioDistalVsProximal,
  scenarioShuntingVeto,
};
