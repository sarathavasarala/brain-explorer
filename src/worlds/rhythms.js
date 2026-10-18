// Neural rhythms and E/I balance simulation world.
// Pure, deterministic mathematical logic for Pyramidal-Interneuron Network Gamma (PING)
// and Wilson-Cowan population rate models.
// Models oscillations across delta, theta, alpha, beta, and gamma bands,
// as well as E/I balance perturbations (sedation vs seizure).
// Zero DOM, zero Three.js, pure native ES module.

export const WINDOW = [0, 4.0];

// Standard clinical EEG frequency bands
export const BANDS = {
  delta: {
    key: 'delta',
    name: 'Delta',
    range: [0.5, 4],
    typicalHz: 2,
    role: 'Deep slow-wave sleep and unconsciousness',
    color: '#6888ff',
  },
  theta: {
    key: 'theta',
    name: 'Theta',
    range: [4, 8],
    typicalHz: 6,
    role: 'Hippocampal memory encoding and spatial navigation',
    color: '#2ed9aa',
  },
  alpha: {
    key: 'alpha',
    name: 'Alpha',
    range: [8, 12],
    typicalHz: 10,
    role: 'Posterior resting state and sensory gating (eyes closed)',
    color: '#ffcf6b',
  },
  beta: {
    key: 'beta',
    name: 'Beta',
    range: [13, 30],
    typicalHz: 20,
    role: 'Active sensorimotor focus and motor engagement',
    color: '#ff9f68',
  },
  gamma: {
    key: 'gamma',
    name: 'Gamma',
    range: [30, 80],
    typicalHz: 40,
    role: 'Local feature binding and conscious perception',
    color: '#e26dff',
  },
};

// Preset configurations for canonical neural states
export const PRESETS = {
  gamma: {
    key: 'gamma',
    label: 'Gamma (40 Hz)',
    tagline: 'Fast local feature binding and cognitive processing',
    band: 'gamma',
    scale: 0.32,
    wee: 3.6,
    wie: 3.0,
    wei: 3.2,
    wii: 0.5,
    Pe: 0.6,
    Pi: -0.5,
    tauA: 0.080,
    betaA: 1.2,
    description: 'Fast Pyramidal-Interneuron Gamma loop driven by parvalbumin basket cells.',
  },
  beta: {
    key: 'beta',
    label: 'Beta (20 Hz)',
    tagline: 'Motor preparation and active sensorimotor engagement',
    band: 'beta',
    scale: 0.70,
    wee: 3.5,
    wie: 3.0,
    wei: 3.0,
    wii: 0.5,
    Pe: 0.5,
    Pi: -0.5,
    tauA: 0.090,
    betaA: 1.5,
    description: 'Rhythmic sensorimotor idling and active cortical focus.',
  },
  alpha: {
    key: 'alpha',
    label: 'Alpha (10 Hz)',
    tagline: 'Resting wakefulness and sensory gating with eyes closed',
    band: 'alpha',
    scale: 1.35,
    wee: 3.5,
    wie: 3.0,
    wei: 3.0,
    wii: 0.5,
    Pe: 0.5,
    Pi: -0.5,
    tauA: 0.100,
    betaA: 1.8,
    description: 'Thalamocortical pacemaker rhythm quieting visual cortex at rest.',
  },
  theta: {
    key: 'theta',
    label: 'Theta (6 Hz)',
    tagline: 'Hippocampal navigation and episodic memory encoding',
    band: 'theta',
    scale: 2.20,
    wee: 3.5,
    wie: 3.0,
    wei: 3.0,
    wii: 0.5,
    Pe: 0.5,
    Pi: -0.5,
    tauA: 0.120,
    betaA: 2.0,
    description: 'Slower rhythm coordinating place cells in the hippocampus and medial entorhinal cortex.',
  },
  delta: {
    key: 'delta',
    label: 'Delta (2 Hz)',
    tagline: 'Deep slow-wave sleep and widespread cortical synchrony',
    band: 'delta',
    scale: 7.00,
    wee: 3.4,
    wie: 3.0,
    wei: 3.0,
    wii: 0.5,
    Pe: 0.4,
    Pi: -0.5,
    tauA: 0.200,
    betaA: 2.5,
    description: 'Alternating up and down states across widespread cortical columns during deep non-REM sleep.',
  },
  sedated: {
    key: 'sedated',
    label: 'Sedated (Anesthesia)',
    tagline: 'Excessive GABA-A inhibition slowing and suppressing network activity',
    band: 'delta',
    scale: 1.00,
    wee: 1.5,
    wie: 7.0,
    wei: 2.5,
    wii: 0.8,
    Pe: 0.05,
    Pi: 0.0,
    tauA: 0.150,
    betaA: 0.5,
    description: 'Anesthetics like propofol prolong GABA-A currents, silencing pyramidal firing and flattening the rhythm.',
  },
  seizure: {
    key: 'seizure',
    label: 'Seizure (Hypersynchrony)',
    tagline: 'Loss of GABA inhibition triggering explosive runaway paroxysms',
    band: 'delta',
    scale: 0.50,
    wee: 4.8,
    wie: 1.0,
    wei: 2.5,
    wii: 0.2,
    Pe: 0.5,
    Pi: -0.6,
    tauA: 0.160,
    betaA: 4.5,
    description: 'Without inhibitory braking, recurrent excitation causes massive synchronized spike-and-wave bursts.',
  },
};

// Sigmoid activation function converting synaptic input to firing rate (0 to 1)
export function sigmoid(u, a = 5, theta = 0.8) {
  return 1 / (1 + Math.exp(-a * (u - theta)));
}

// Compute coupled derivatives for excitatory population E, inhibitory population I,
// and slow adaptation / hyperpolarization variable A.
export function wilsonCowanDerivatives(state, params) {
  const { E, I, A } = state;
  const {
    tauE,
    tauI,
    tauA,
    wee,
    wie,
    wei,
    wii,
    betaA,
    Pe,
    Pi,
  } = params;

  const inputE = wee * E - wie * I - betaA * A + Pe;
  const inputI = wei * E - wii * I + Pi;

  const dE = (-E + sigmoid(inputE)) / Math.max(1e-5, tauE);
  const dI = (-I + sigmoid(inputI)) / Math.max(1e-5, tauI);
  const dA = (-A + E) / Math.max(1e-5, tauA);

  return { dE, dI, dA };
}

// Single numerical integration step using fourth-order Runge-Kutta
export function wilsonCowanStep(state, params, dt = 0.001) {
  const { E, I, A } = state;

  const k1 = wilsonCowanDerivatives(state, params);

  const s2 = {
    E: Math.max(0, Math.min(1, E + 0.5 * dt * k1.dE)),
    I: Math.max(0, Math.min(1, I + 0.5 * dt * k1.dI)),
    A: Math.max(0, Math.min(1, A + 0.5 * dt * k1.dA)),
  };
  const k2 = wilsonCowanDerivatives(s2, params);

  const s3 = {
    E: Math.max(0, Math.min(1, E + 0.5 * dt * k2.dE)),
    I: Math.max(0, Math.min(1, I + 0.5 * dt * k2.dI)),
    A: Math.max(0, Math.min(1, A + 0.5 * dt * k2.dA)),
  };
  const k3 = wilsonCowanDerivatives(s3, params);

  const s4 = {
    E: Math.max(0, Math.min(1, E + dt * k3.dE)),
    I: Math.max(0, Math.min(1, I + dt * k3.dI)),
    A: Math.max(0, Math.min(1, A + dt * k3.dA)),
  };
  const k4 = wilsonCowanDerivatives(s4, params);

  const nextE = Math.max(0, Math.min(1, E + (dt / 6) * (k1.dE + 2 * k2.dE + 2 * k3.dE + k4.dE)));
  const nextI = Math.max(0, Math.min(1, I + (dt / 6) * (k1.dI + 2 * k2.dI + 2 * k3.dI + k4.dI)));
  const nextA = Math.max(0, Math.min(1, A + (dt / 6) * (k1.dA + 2 * k2.dA + 2 * k3.dA + k4.dA)));

  return { E: nextE, I: nextI, A: nextA };
}

// Map preset key and E/I balance ratio (0.2 to 2.5) into full simulation parameters
export function getEiParams(presetKey = 'gamma', eiRatio = 1.0) {
  const base = PRESETS[presetKey] || PRESETS.gamma;
  const ratio = Math.max(0.2, Math.min(2.5, Number(eiRatio) || 1.0));

  const scale = base.scale;
  const tauE = 0.005 * scale;
  const tauI = 0.010 * scale;

  // Scale recurrent excitation and feedback inhibition with E/I ratio
  const wee = base.wee * Math.pow(ratio, 0.5);
  const wie = base.wie / Math.pow(ratio, 0.6);
  const betaA = base.betaA * Math.max(1, ratio);

  return {
    presetKey: base.key,
    eiRatio: ratio,
    scale,
    tauE,
    tauI,
    tauA: base.tauA,
    wee,
    wie,
    wei: base.wei,
    wii: base.wii,
    betaA,
    Pe: base.Pe,
    Pi: base.Pi,
    classification: classifyDynamics(ratio, base.key),
  };
}

// Classify network state into clinical and biophysical regimes
export function classifyDynamics(eiRatio, presetKey = 'gamma') {
  if (presetKey === 'sedated' || eiRatio < 0.55) {
    return {
      status: 'sedated',
      badge: 'Deep sedation (excess GABA)',
      color: '#6888ff',
      summary: 'Inhibitory currents dominate. Pyramidal firing is silenced and rhythms slow or collapse.',
    };
  }
  if (eiRatio < 0.85) {
    return {
      status: 'drowsy',
      badge: 'Slowing rhythm (increased inhibition)',
      color: '#2ed9aa',
      summary: 'Inhibition is stronger than normal. Fast gamma and beta collapse into slower waves.',
    };
  }
  if (eiRatio <= 1.25) {
    return {
      status: 'balanced',
      badge: 'Healthy E/I balance',
      color: '#7df0c0',
      summary: 'Excitation and inhibition are tightly coupled, sustaining clean rhythmic oscillations.',
    };
  }
  if (eiRatio < 1.75) {
    return {
      status: 'hyperexcitable',
      badge: 'Hyperexcitable network',
      color: '#ff9f68',
      summary: 'Inhibition is weakening. Pyramidal cells fire prolonged, high-amplitude bursts.',
    };
  }
  return {
    status: 'seizure',
    badge: 'Epileptic seizure (hypersynchrony)',
    color: '#ff6b7d',
    summary: 'Inhibitory failure allows runaway recurrent excitation, causing massive synchronized discharges.',
  };
}

// Run a complete time-series simulation of the network
export function simulate({
  preset = 'gamma',
  eiRatio = 1.0,
  duration = 4.0,
  dt = 0.001,
} = {}) {
  const params = getEiParams(preset, eiRatio);
  const steps = Math.floor(duration / dt);

  let state = { E: 0.2, I: 0.1, A: 0.1 };
  const times = new Float32Array(steps);
  const E = new Float32Array(steps);
  const I = new Float32Array(steps);
  const A = new Float32Array(steps);
  const eeg = new Float32Array(steps);

  for (let step = 0; step < steps; step++) {
    const t = step * dt;
    state = wilsonCowanStep(state, params, dt);

    times[step] = t;
    E[step] = state.E;
    I[step] = state.I;
    A[step] = state.A;

    // Scalp EEG / local field potential is primarily driven by pyramidal dendritic currents:
    // excitatory inward currents minus inhibitory perisomatic currents, with intra-burst fast ripple
    const fastRipple = (params.presetKey === 'seizure' || params.eiRatio > 1.8) && state.E > 0.6
      ? 0.18 * Math.sin(2 * Math.PI * 55 * t)
      : 0;

    // Baseline quiet sensor noise
    const noise = 0.015 * Math.sin(17 * t + Math.cos(23 * t));
    const rawEeg = (state.E - 0.72 * state.I) * 1.4 + fastRipple + noise;

    eeg[step] = rawEeg;
  }

  return {
    preset,
    eiRatio: params.eiRatio,
    duration,
    dt,
    steps,
    params,
    times,
    E,
    I,
    A,
    eeg,
  };
}

// Discrete Fourier Transform with Hanning window to calculate power spectral density
export function calculatePowerSpectrum(signal, fs = 1000) {
  const N = signal.length;
  if (N < 10) return { freqs: [], powers: [], bands: {}, dominantBand: 'gamma', peakHz: 40 };

  let mean = 0;
  for (let i = 0; i < N; i++) mean += signal[i];
  mean /= N;

  const freqs = [];
  const powers = [];

  const bands = {
    delta: { key: 'delta', name: 'Delta', range: [0.5, 4], power: 0, color: BANDS.delta.color },
    theta: { key: 'theta', name: 'Theta', range: [4, 8], power: 0, color: BANDS.theta.color },
    alpha: { key: 'alpha', name: 'Alpha', range: [8, 12], power: 0, color: BANDS.alpha.color },
    beta: { key: 'beta', name: 'Beta', range: [13, 30], power: 0, color: BANDS.beta.color },
    gamma: { key: 'gamma', name: 'Gamma', range: [30, 80], power: 0, color: BANDS.gamma.color },
  };

  let maxPower = 0;
  let peakHz = 40;

  // Evaluate spectral power from 0.5 to 80 Hz in 0.5 Hz steps
  for (let f = 0.5; f <= 80; f += 0.5) {
    let re = 0;
    let im = 0;
    const omega = (2 * Math.PI * f) / fs;

    for (let n = 0; n < N; n++) {
      // Hanning window
      const w = 0.5 * (1 - Math.cos((2 * Math.PI * n) / (N - 1)));
      const val = (signal[n] - mean) * w;
      const angle = omega * n;
      re += val * Math.cos(angle);
      im -= val * Math.sin(angle);
    }

    const p = (re * re + im * im) / (N * N);
    freqs.push(f);
    powers.push(p);

    if (p > maxPower) {
      maxPower = p;
      peakHz = f;
    }

    for (const b of Object.values(bands)) {
      if (f >= b.range[0] && f < b.range[1]) {
        b.power += p;
      }
    }
  }

  const totalPower = Object.values(bands).reduce((sum, b) => sum + b.power, 0) || 1e-9;
  let dominantBand = 'gamma';
  let highestBandPower = -1;

  for (const [key, b] of Object.entries(bands)) {
    b.relativePower = b.power / totalPower;
    b.percentage = Math.round(b.relativePower * 100);
    if (b.power > highestBandPower) {
      highestBandPower = b.power;
      dominantBand = key;
    }
  }

  return {
    freqs,
    powers,
    bands,
    dominantBand,
    peakHz,
    totalPower,
  };
}

// Sample single interpolated value (E, I, EEG) at arbitrary timestamp t from trajectory
export function sampleAt(trajectory, t) {
  const { duration, dt, steps, E, I, eeg } = trajectory;
  const wrapped = ((t % duration) + duration) % duration;
  const indexFloat = wrapped / dt;
  const i0 = Math.floor(indexFloat) % steps;
  const i1 = (i0 + 1) % steps;
  const frac = indexFloat - Math.floor(indexFloat);

  const curE = E[i0] + frac * (E[i1] - E[i0]);
  const curI = I[i0] + frac * (I[i1] - I[i0]);
  const curEeg = eeg[i0] + frac * (eeg[i1] - eeg[i0]);

  return { t: wrapped, E: curE, I: curI, eeg: curEeg };
}

// Sample a rolling window of points [x, y] centered at or ending at t for oscilloscope rendering
export function sampleWindow(trajectory, tEnd, windowDuration = 1.5, numPoints = 180) {
  const points = [];
  const dtSample = windowDuration / (numPoints - 1);
  const tStart = tEnd - windowDuration;

  for (let i = 0; i < numPoints; i++) {
    const t = tStart + i * dtSample;
    const sampled = sampleAt(trajectory, t);
    points.push({
      xFrac: i / (numPoints - 1),
      t,
      eeg: sampled.eeg,
      E: sampled.E,
      I: sampled.I,
    });
  }

  return points;
}
