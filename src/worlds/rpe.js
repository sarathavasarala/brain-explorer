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
// trial: { buzz: bool, msg: bool, want: 0..1, V: learned buzz value 0..1 }
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
  let r = BASE_HZ;
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
