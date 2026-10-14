import { mulberry32 } from '../scene/noise.js';

export const WINDOW = [-0.5, 2.0];
export const BUZZ_T = 0;
export const MSG_T = 1.0;
export const CHIME_T = BUZZ_T;
export const JUICE_T = MSG_T;
const BASE_HZ = 5;
const GAIN_HZ = 26;
const ALPHA = 0.15;
export const TAG_TAU = 1.0; // seconds, illustrative

const bump = (t, t0, w = 0.07) => {
  const x = (t - t0) / w;
  return Math.exp(-x * x);
};

// Prediction error at reward time and dopamine rate over a trial.
// trial: { buzz: bool, msg: bool, want: 0..1, V: learned buzz value 0..1, baseHz: number }
export function trialSignals(trial = {}) {
  const buzz = (trial.buzz ?? trial.chime ?? trial.cue) !== false;
  const V = buzz ? (trial.V ?? 0) : 0;
  const R = (trial.msg ?? trial.juice ?? trial.reward) ? (trial.want ?? 1) : 0;
  const deltaReward = R - V;
  const deltaBuzz = buzz ? V : 0; // the buzz itself arrives unpredicted
  return { V, R, deltaReward, deltaBuzz, deltaJuice: deltaReward, deltaChime: deltaBuzz };
}

export function daRate(t, trial = {}) {
  const s = trialSignals(trial);
  const base = trial.baseHz !== undefined ? trial.baseHz : BASE_HZ;
  let r = base;
  r += GAIN_HZ * s.deltaBuzz * bump(t, BUZZ_T + 0.1);
  const w = s.deltaReward < 0 ? 0.16 : 0.07; // pauses are a bit wider than bursts
  r += GAIN_HZ * s.deltaReward * bump(t, MSG_T + 0.1, w);
  return Math.max(0, r);
}

// Inputs to the dopamine neuron (for the "why flat" step). Arbitrary units 0..1.
export function daInputs(t, trial = {}) {
  const s = trialSignals(trial);
  const hasReward = (trial.msg ?? trial.juice ?? trial.reward) ? (trial.want ?? 1) : 0;
  const excite = hasReward * bump(t, MSG_T + 0.1);
  const inhibit = s.V * bump(t, MSG_T + 0.1, 0.12);
  return { excite, inhibit };
}

// ------------------------------------------------ Receptor & Effort Dynamics
// D2 is high affinity (activated by quiet tonic hum ~4.5 Hz, releases striatal No-Go brake)
// D1 is low affinity (activated by intense phasic bursts ~25 Hz, drives striatal Go pathway)
export function d2Occupancy(hz, d2Density = 1.0) {
  const kd = 2.0; // Hz
  const raw = hz / (hz + kd);
  return Math.max(0, Math.min(1.0, raw * d2Density));
}

export function d1Occupancy(hz) {
  const kd = 16.0; // Hz threshold
  const raw = Math.pow(hz, 2) / (Math.pow(hz, 2) + Math.pow(kd, 2));
  return Math.max(0, Math.min(1.0, raw));
}

export function brakeRelease(d2Occ) {
  // 0% = brakes clamped (movement/effort feels heavy); 100% = brakes fully off
  return Math.max(0, Math.min(100, Math.round(d2Occ * 130)));
}

export function dopamineSynapseState({ hz = 5, d2Density = 1.0 } = {}) {
  const d2Occ = d2Occupancy(hz, d2Density);
  const d1Occ = d1Occupancy(hz);
  const brakeRel = brakeRelease(d2Occ);
  const goSignal = Math.max(0, Math.min(100, Math.round(d1Occ * 100)));
  return {
    hz,
    d2Density,
    d2Occupancy: d2Occ,
    d1Occupancy: d1Occ,
    brakeReleasePercent: brakeRel,
    goSignalPercent: goSignal,
    brakesOn: brakeRel < 50,
  };
}

// Environmental Richness & Opportunity Cost (Niv et al. 2007)
export function throttleState(richness = 0.5) {
  const rClamped = Math.max(0, Math.min(1, richness));
  const tonicHz = 1.5 + rClamped * 6.0; // 1.5 Hz (winter) to 7.5 Hz (summer)
  const d2Occ = d2Occupancy(tonicHz, 1.0);
  const vigor = brakeRelease(d2Occ);
  const oppCost = Math.round(rClamped * 100);
  return {
    richness: rClamped,
    tonicHz: Number(tonicHz.toFixed(1)),
    vigor,
    oppCost,
    label: rClamped < 0.35 ? 'Dead of winter (scarce)' : rClamped > 0.65 ? 'High summer (abundant)' : 'Moderate environment',
  };
}

// Variable-Ratio Feed Schedule (Short-form video feeds)
export const FEED_REELS = [
  { id: 1, type: 'meh', title: 'Mediocre clip', reward: 0.15, text: 'Bland clip, slight letdown' },
  { id: 2, type: 'meh', title: 'Boring filler', reward: 0.1, text: 'No surprise, dip pause' },
  { id: 3, type: 'okay', title: 'Mildly amusing', reward: 0.35, text: 'Mild interest, low V' },
  { id: 4, type: 'viral', title: '10/10 Viral hit', reward: 1.0, text: 'Huge unexpected laugh!' },
  { id: 5, type: 'meh', title: 'Sponsored ad', reward: 0.05, text: 'Instant skip, restless' },
  { id: 6, type: 'meh', title: 'Slow monologue', reward: 0.15, text: 'Letdown, thumb flicks' },
  { id: 7, type: 'okay', title: 'Satisfying craft', reward: 0.4, text: 'Decent clip, hooked' },
  { id: 8, type: 'viral', title: 'Insane trick', reward: 0.95, text: 'Massive surprise surge!' },
];

// Deterministic spikes for one sweep (seeded, stable across frames).
export function spikes(trial, seed) {
  const rnd = mulberry32(seed);
  const out = [];
  const dt = 0.001;
  for (let t = WINDOW[0]; t < WINDOW[1]; t += dt) {
    if (rnd() < daRate(t, trial) * dt) out.push(t);
  }
  return out;
}

// Rescorla-Wagner learning over a schedule of trials.
// cues: { buzz: bool, noise: bool }, msg: bool
export function schedule({ n = 30, noiseRate = 0.3, noiseAloneEvery = 4, insectRate, insectAloneEvery, seed = 11 } = {}) {
  const nRate = insectRate ?? noiseRate;
  const nAlone = insectAloneEvery ?? noiseAloneEvery;
  const rnd = mulberry32(seed);
  const list = [];
  for (let i = 0; i < n; i++) {
    const noiseAlone = nAlone > 0 && i % nAlone === nAlone - 1;
    if (noiseAlone) list.push({ buzz: false, noise: true, msg: false, chime: false, insect: true, juice: false });
    else list.push({ buzz: true, noise: rnd() < nRate, msg: true, chime: true, insect: rnd() < nRate, juice: true });
  }
  return list;
}

export function learn(list, { want = 1 } = {}) {
  const w = { buzz: 0, noise: 0 };
  const history = [];
  for (const tr of list) {
    const hasBuzz = tr.buzz ?? tr.chime ?? false;
    const hasNoise = tr.noise ?? tr.insect ?? false;
    const hasMsg = tr.msg ?? tr.juice ?? false;

    const V = (hasBuzz ? w.buzz : 0) + (hasNoise ? w.noise : 0);
    const R = hasMsg ? want : 0;
    const delta = R - V;
    history.push({
      ...tr,
      V,
      delta,
      wBuzz: w.buzz,
      wNoise: w.noise,
      wChime: w.buzz,
      wInsect: w.noise,
    });
    if (hasBuzz) w.buzz += ALPHA * delta;
    if (hasNoise) w.noise += ALPHA * delta;
  }
  return history;
}

// Eligibility tag after the buzz, and how much the synapse changes if dopamine arrives at tDA.
export const tag = (t) => (t < BUZZ_T ? 0 : Math.exp(-(t - BUZZ_T) / TAG_TAU));
export const strengthen = (tDA, delta = 1) => tag(tDA) * delta;

// NMDA gate: calcium flows only with glutamate bound AND depolarized.
export function nmda({ glutamate, depolarized }) {
  const unblocked = depolarized;
  return {
    mgBlocked: !unblocked,
    open: glutamate && unblocked,
    calcium: glutamate && unblocked ? 1 : 0,
    ampaCurrent: glutamate ? 1 : 0,
  };
}
