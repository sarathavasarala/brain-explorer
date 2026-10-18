// Sensory Contrast and Receptive Fields world.
// Pure, deterministic math for Difference of Gaussians (DoG) receptive fields,
// 1D lateral inhibition arrays, Mach band edge sharpening, and two-point discrimination.
// No DOM and no Three.js, so every function can be tested in isolation.

import { mulberry32 } from '../scene/noise.js';

// Default baseline firing rates and gains (in Hz)
export const BASELINE_HZ = 15;
export const MAX_HZ = 90;

// -----------------------------------------------------------------------------
// 1. Difference of Gaussians (DoG) Receptive Field Model
// Center-Surround antagonism: D(x, y) = Ac * exp(-r^2 / (2*sigmaC^2)) - As * exp(-r^2 / (2*sigmaS^2))
// -----------------------------------------------------------------------------

/**
 * Difference of Gaussians kernel weight at offset (dx, dy).
 * Positive values indicate center excitation; negative values indicate surround inhibition.
 */
export function dogWeight(dx, dy, {
  Ac = 1.0,
  As = 0.11,
  sigmaC = 1.0,
  sigmaS = 3.0,
} = {}) {
  const r2 = dx * dx + dy * dy;
  const cVar = 2 * Math.max(1e-6, sigmaC * sigmaC);
  const sVar = 2 * Math.max(1e-6, sigmaS * sigmaS);
  const center = Ac * Math.exp(-r2 / cVar);
  const surround = As * Math.exp(-r2 / sVar);
  return center - surround;
}

/**
 * 1D slice of the Difference of Gaussians receptive field.
 */
export function dogProfile1D(x, {
  Ac = 1.0,
  As = 0.33,
  sigmaC = 1.0,
  sigmaS = 3.0,
} = {}) {
  const x2 = x * x;
  const cVar = 2 * Math.max(1e-6, sigmaC * sigmaC);
  const sVar = 2 * Math.max(1e-6, sigmaS * sigmaS);
  return Ac * Math.exp(-x2 / cVar) - As * Math.exp(-x2 / sVar);
}

/**
 * Integrated response of an On-center / Off-surround receptive field to a circular spot
 * of radius R centered directly on the receptive field.
 * Analytical integral: 2 * pi * [ Ac * sigmaC^2 * (1 - exp(-R^2 / (2*sigmaC^2))) - As * sigmaS^2 * (1 - exp(-R^2 / (2*sigmaS^2))) ]
 */
export function spotTuningIntegral(radius, {
  Ac = 1.0,
  As = 0.111,
  sigmaC = 1.0,
  sigmaS = 3.0,
} = {}) {
  const R = Math.max(0, radius);
  if (R === 0) return 0;
  const R2 = R * R;
  const cVar = 2 * Math.max(1e-6, sigmaC * sigmaC);
  const sVar = 2 * Math.max(1e-6, sigmaS * sigmaS);

  const centerVol = 2 * Math.PI * Ac * (sigmaC * sigmaC) * (1 - Math.exp(-R2 / cVar));
  const surroundVol = 2 * Math.PI * As * (sigmaS * sigmaS) * (1 - Math.exp(-R2 / sVar));
  return centerVol - surroundVol;
}

/**
 * Samples the spot tuning curve across a range of spot radii.
 * Demonstrates that firing peaks at the optimal spot size matching the center,
 * then plunges toward zero as the spot expands into the inhibitory surround.
 */
export function spotTuningCurve({
  maxRadius = 6.0,
  steps = 60,
  Ac = 1.0,
  As = 0.111,
  sigmaC = 1.0,
  sigmaS = 3.0,
  baselineHz = BASELINE_HZ,
  gainHz = 11.0,
} = {}) {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const r = (maxRadius * i) / steps;
    const raw = spotTuningIntegral(r, { Ac, As, sigmaC, sigmaS });
    const hz = Math.max(0, Math.min(MAX_HZ, baselineHz + raw * gainHz));
    points.push({ radius: r, raw, hz });
  }
  return points;
}

/**
 * Computes the response of an On-center / Off-surround cell to a circular spot
 * located at an arbitrary position (spotX, spotY) with given radius and intensity.
 * Uses numerical integration over a polar/radial grid.
 */
export function spotResponseAt({
  spotX = 0,
  spotY = 0,
  spotRadius = 1.0,
  spotIntensity = 1.0,
  rfX = 0,
  rfY = 0,
  Ac = 1.0,
  As = 0.111,
  sigmaC = 1.0,
  sigmaS = 3.0,
  baselineHz = BASELINE_HZ,
  gainHz = 11.0,
} = {}) {
  const R = Math.max(0, spotRadius);
  if (R === 0 || spotIntensity === 0) {
    return {
      hz: baselineHz,
      raw: 0,
      centerDrive: 0,
      surroundInhibition: 0,
      state: 'baseline',
    };
  }

  // 2D numerical integration over disk
  const radialSteps = 16;
  const angularSteps = 24;
  let centerSum = 0;
  let surroundSum = 0;
  const cVar = 2 * Math.max(1e-6, sigmaC * sigmaC);
  const sVar = 2 * Math.max(1e-6, sigmaS * sigmaS);

  for (let ri = 1; ri <= radialSteps; ri++) {
    const r = (R * (ri - 0.5)) / radialSteps;
    const dr = R / radialSteps;
    const ringArea = 2 * Math.PI * r * dr;
    const dTheta = (2 * Math.PI) / angularSteps;

    for (let ai = 0; ai < angularSteps; ai++) {
      const theta = ai * dTheta;
      const px = spotX + r * Math.cos(theta);
      const py = spotY + r * Math.sin(theta);

      const dx = px - rfX;
      const dy = py - rfY;
      const d2 = dx * dx + dy * dy;

      const cVal = Ac * Math.exp(-d2 / cVar);
      const sVal = As * Math.exp(-d2 / sVar);

      const dA = ringArea / angularSteps;
      centerSum += cVal * dA;
      surroundSum += sVal * dA;
    }
  }

  const raw = (centerSum - surroundSum) * spotIntensity;
  const hz = Math.max(0, Math.min(MAX_HZ, baselineHz + raw * gainHz));

  let state = 'baseline';
  if (hz > baselineHz + 10) state = 'excited';
  else if (hz < baselineHz - 6) state = 'suppressed';
  else if (R > sigmaS * 1.5 && Math.abs(hz - baselineHz) <= 6) state = 'cancelled';

  return {
    hz: Number(hz.toFixed(1)),
    raw: Number(raw.toFixed(3)),
    centerDrive: Number((centerSum * spotIntensity).toFixed(3)),
    surroundInhibition: Number((surroundSum * spotIntensity).toFixed(3)),
    state,
  };
}

// -----------------------------------------------------------------------------
// 2. 1D Lateral Inhibition Array Model
// Hartline-Ratliff formulation: R_i = max(0, S_i - sum_j W_ij * S_j)
// -----------------------------------------------------------------------------

/**
 * Builds the lateral inhibition weight matrix for an array of N sensory units.
 * Off-diagonal elements drop off with distance based on a Gaussian kernel.
 */
export function lateralWeightMatrix(size = 32, {
  radius = 2.5,
  strength = 0.28,
} = {}) {
  const W = [];
  const sVar = 2 * Math.max(1e-6, radius * radius);

  for (let i = 0; i < size; i++) {
    const row = new Float32Array(size);
    for (let j = 0; j < size; j++) {
      if (i === j) {
        row[j] = 0; // No self-inhibition in standard lateral kernel
      } else {
        const dist = Math.abs(i - j);
        row[j] = strength * Math.exp(-(dist * dist) / sVar);
      }
    }
    W.push(row);
  }
  return W;
}

/**
 * Simulates lateral inhibition over an array of input stimulus values.
 * When boundary = 'pad' (default), replicates edge values so boundary units receive balanced neighborhood inhibition.
 * Returns both raw stimulus and sharpened neural response.
 */
export function simulateLateralInhibition(stimuli, {
  radius = 2.5,
  strength = 0.28,
  baseline = 0,
  boundary = 'pad',
} = {}) {
  const n = stimuli.length;
  const pad = boundary === 'pad' ? Math.max(4, Math.ceil(radius * 4)) : 0;
  const total = n + pad * 2;
  const sVar = 2 * Math.max(1e-6, radius * radius);

  // Extended input array
  const extended = new Float32Array(total);
  for (let i = 0; i < pad; i++) extended[i] = stimuli[0];
  for (let i = 0; i < n; i++) extended[pad + i] = stimuli[i];
  for (let i = 0; i < pad; i++) extended[pad + n + i] = stimuli[n - 1];

  const responses = new Float32Array(n);
  const inhibitions = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    const extIdx = pad + i;
    let inh = 0;
    for (let j = 0; j < total; j++) {
      if (extIdx !== j) {
        const dist = Math.abs(extIdx - j);
        const w = strength * Math.exp(-(dist * dist) / sVar);
        inh += w * extended[j];
      }
    }
    inhibitions[i] = inh;
    responses[i] = Math.max(0, baseline + stimuli[i] - inh);
  }

  return {
    stimuli: Array.from(stimuli),
    responses: Array.from(responses),
    inhibitions: Array.from(inhibitions),
  };
}

// -----------------------------------------------------------------------------
// 3. Mach Band Response to Luminance Step and Edge Stimulus
// Demonstrates that lateral inhibition creates edge sharpening:
// a bright overshoot peak on the light side and a dark undershoot trough on the dim side.
// -----------------------------------------------------------------------------

/**
 * Generates a physical luminance stimulus profile (step or ramp).
 */
export function makeLuminanceProfile({
  length = 32,
  low = 25,
  high = 85,
  stepAt = Math.floor(length / 2),
  rampWidth = 4,
} = {}) {
  const profile = new Float32Array(length);
  const halfRamp = rampWidth / 2;

  for (let i = 0; i < length; i++) {
    if (rampWidth <= 1) {
      profile[i] = i < stepAt ? low : high;
    } else {
      const rel = i - stepAt;
      if (rel <= -halfRamp) {
        profile[i] = low;
      } else if (rel >= halfRamp) {
        profile[i] = high;
      } else {
        const frac = (rel + halfRamp) / rampWidth;
        profile[i] = low + frac * (high - low);
      }
    }
  }
  return profile;
}

/**
 * Full Mach band simulation for an edge stimulus.
 * Calculates the exact overshoot and undershoot produced by unequal inhibition across the border.
 */
export function machBandSimulation({
  length = 32,
  low = 25,
  high = 85,
  stepAt = Math.floor(length / 2),
  rampWidth = 4,
  radius = 2.5,
  strength = 0.28,
} = {}) {
  const stimulus = makeLuminanceProfile({ length, low, high, stepAt, rampWidth });
  const result = simulateLateralInhibition(stimulus, { radius, strength });

  // Locate the dark undershoot (minimum near border on low side)
  // and bright overshoot (maximum near border on high side)
  let minVal = Infinity;
  let minIdx = -1;
  let maxVal = -Infinity;
  let maxIdx = -1;

  for (let i = 0; i < length; i++) {
    const r = result.responses[i];
    if (i < stepAt && r < minVal) {
      minVal = r;
      minIdx = i;
    }
    if (i >= stepAt && r > maxVal) {
      maxVal = r;
      maxIdx = i;
    }
  }

  // Baseline flat plateau values far from the edge
  const flatLowResponse = result.responses[0];
  const flatHighResponse = result.responses[length - 1];

  const darkUndershoot = flatLowResponse - minVal;
  const brightOvershoot = maxVal - flatHighResponse;

  return {
    length,
    stepAt,
    stimulus: result.stimuli,
    response: result.responses,
    inhibition: result.inhibitions,
    minIdx,
    minVal: Number(minVal.toFixed(1)),
    maxIdx,
    maxVal: Number(maxVal.toFixed(1)),
    flatLowResponse: Number(flatLowResponse.toFixed(1)),
    flatHighResponse: Number(flatHighResponse.toFixed(1)),
    darkUndershoot: Number(Math.max(0, darkUndershoot).toFixed(1)),
    brightOvershoot: Number(Math.max(0, brightOvershoot).toFixed(1)),
    ratio: Number((maxVal / Math.max(1e-3, minVal)).toFixed(2)),
  };
}

// -----------------------------------------------------------------------------
// 4. Two-Point Discrimination Model
// Weber's caliper test: evaluates whether two spatial contact points are perceived
// as two distinct sensations or blurred into one single touch.
// -----------------------------------------------------------------------------

export const BODY_REGIONS = {
  fingertip: {
    id: 'fingertip',
    name: 'Fingertip',
    rfMm: 2.0,
    thresholdMm: 2.5,
    densityLabel: 'Very high (~240 units / cm²)',
    cortexLabel: 'Huge cortical magnification in S1',
    desc: 'Tiny, dense receptive fields let you distinguish Braille dots and fine textures.',
  },
  palm: {
    id: 'palm',
    name: 'Palm of hand',
    rfMm: 7.5,
    thresholdMm: 10.0,
    densityLabel: 'High (~60 units / cm²)',
    cortexLabel: 'Moderate cortical representation',
    desc: 'Medium receptive fields suited for grasping and feeling object shapes.',
  },
  forearm: {
    id: 'forearm',
    name: 'Forearm',
    rfMm: 22.0,
    thresholdMm: 35.0,
    densityLabel: 'Low (~15 units / cm²)',
    cortexLabel: 'Compact representation in S1',
    desc: 'Wide receptive fields detect general contact, but cannot resolve close points.',
  },
  back: {
    id: 'back',
    name: 'Upper back',
    rfMm: 38.0,
    thresholdMm: 50.0,
    densityLabel: 'Very sparse (~5 units / cm²)',
    cortexLabel: 'Very small slice of S1',
    desc: 'Huge overlapping receptive fields: two caliper points 4 cm apart still feel like one touch.',
  },
};

/**
 * Simulates population neural activity along a skin coordinate line
 * when two caliper tips touch the skin separated by distance `separationMm`.
 */
export function twoPointSimulation(separationMm, {
  rfMm = 2.0,
  inhibitionStrength = 0.25,
  samplePoints = 61,
  spanMm = 60,
} = {}) {
  const sep = Math.max(0, separationMm);
  const p1 = -sep / 2;
  const p2 = sep / 2;

  const positions = [];
  const rawExcitation = [];

  const sVar = 2 * Math.max(1e-6, rfMm * rfMm);

  for (let i = 0; i < samplePoints; i++) {
    const x = -spanMm / 2 + (spanMm * i) / (samplePoints - 1);
    positions.push(x);

    const d1 = x - p1;
    const d2 = x - p2;
    // Sum of two Gaussian excitation bumps
    const e1 = Math.exp(-(d1 * d1) / sVar);
    const e2 = Math.exp(-(d2 * d2) / sVar);
    rawExcitation.push(e1 + e2);
  }

  // Apply lateral inhibition to sharpen the two bumps
  const sharpened = simulateLateralInhibition(rawExcitation, {
    radius: Math.max(1.5, rfMm * 0.8),
    strength: inhibitionStrength,
  }).responses;

  // Measure midpoint and peak values
  const midIndex = Math.floor(samplePoints / 2);
  const midpointActivity = sharpened[midIndex];

  // Find peak on positive side
  let peakActivity = 0;
  let peakIndex = midIndex;
  for (let i = midIndex; i < samplePoints; i++) {
    if (sharpened[i] > peakActivity) {
      peakActivity = sharpened[i];
      peakIndex = i;
    }
  }

  // Valley depth fraction (Rayleigh contrast criterion)
  // If peak and midpoint are identical, valley depth is 0
  const valleyDepth = peakActivity > 1e-4
    ? Math.max(0, (peakActivity - midpointActivity) / peakActivity)
    : 0;

  // The brain reliably resolves two points when there is at least an 11% dip in activity
  const isResolved = valleyDepth >= 0.11 && sep >= rfMm * 0.9;
  const resolutionPercent = Math.min(100, Math.round(valleyDepth * 350));

  return {
    separationMm: sep,
    rfMm,
    positions,
    rawExcitation,
    sharpened,
    midpointActivity: Number(midpointActivity.toFixed(3)),
    peakActivity: Number(peakActivity.toFixed(3)),
    valleyDepth: Number(valleyDepth.toFixed(3)),
    isResolved,
    resolutionPercent,
    statusText: isResolved ? 'Two points resolved' : 'Merged into single touch',
  };
}

// -----------------------------------------------------------------------------
// 5. Deterministic Spike Generator for Visual Oscilloscope & Audio Cues
// -----------------------------------------------------------------------------

/**
 * Generates an array of spike times over a time window [0, durationSec]
 * for a given firing rate in Hz using a seeded deterministic pseudo-random process.
 */
export function generateSpikes(rateHz, durationSec = 1.0, seed = 42) {
  const rnd = mulberry32(seed);
  const spikes = [];
  const dt = 0.001; // 1 ms resolution
  const refractoryMs = 0.002; // 2 ms absolute refractory period
  let lastSpike = -10;

  for (let t = 0; t < durationSec; t += dt) {
    if (t - lastSpike >= refractoryMs) {
      const prob = rateHz * dt;
      if (rnd() < prob) {
        spikes.push(Number(t.toFixed(3)));
        lastSpike = t;
      }
    }
  }
  return spikes;
}
