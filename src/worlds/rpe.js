import { mulberry32 } from '../scene/noise.js';

export const WINDOW = [-0.5, 2.0];
export const CHIME_T = 0;
export const JUICE_T = 1.0;
const BASE_HZ = 5;
const GAIN_HZ = 26;
const ALPHA = 0.15;
export const TAG_TAU = 1.0; // seconds, illustrative

const bump = (t, t0, w = 0.07) => {
  const x = (t - t0) / w;
  return Math.exp(-x * x);
};

// Prediction error at juice time and dopamine rate over a trial.
// trial: { chime: bool, juice: bool, want: 0..1, V: learned chime value 0..1 }
export function trialSignals(trial = {}) {
  const chime = trial.chime !== false;
  const V = chime ? (trial.V ?? 0) : 0;
  const R = trial.juice ? (trial.want ?? 1) : 0;
  const deltaJuice = R - V;
  const deltaChime = chime ? V : 0; // the chime itself arrives unpredicted
  return { V, R, deltaJuice, deltaChime };
}

export function daRate(t, trial = {}) {
  const s = trialSignals(trial);
  let r = BASE_HZ;
  r += GAIN_HZ * s.deltaChime * bump(t, CHIME_T + 0.1);
  const w = s.deltaJuice < 0 ? 0.16 : 0.07; // pauses are a bit wider than bursts
  r += GAIN_HZ * s.deltaJuice * bump(t, JUICE_T + 0.1, w);
  return Math.max(0, r);
}

// Inputs to the dopamine neuron (for the "why flat" step). Arbitrary units 0..1.
export function daInputs(t, trial = {}) {
  const s = trialSignals(trial);
  const excite = (trial.juice ? (trial.want ?? 1) : 0) * bump(t, JUICE_T + 0.1);
  const inhibit = s.V * bump(t, JUICE_T + 0.1, 0.12);
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
// cues: { chime: bool, insect: bool }, juice: bool
export function schedule({ n = 30, insectRate = 0.3, insectAloneEvery = 4, seed = 11 } = {}) {
  const rnd = mulberry32(seed);
  const list = [];
  for (let i = 0; i < n; i++) {
    const insectAlone = insectAloneEvery > 0 && i % insectAloneEvery === insectAloneEvery - 1;
    if (insectAlone) list.push({ chime: false, insect: true, juice: false });
    else list.push({ chime: true, insect: rnd() < insectRate, juice: true });
  }
  return list;
}

export function learn(list, { want = 1 } = {}) {
  const w = { chime: 0, insect: 0 };
  const history = [];
  for (const tr of list) {
    const V = (tr.chime ? w.chime : 0) + (tr.insect ? w.insect : 0);
    const R = tr.juice ? want : 0;
    const delta = R - V;
    history.push({ ...tr, V, delta, wChime: w.chime, wInsect: w.insect });
    if (tr.chime) w.chime += ALPHA * delta;
    if (tr.insect) w.insect += ALPHA * delta;
  }
  return history;
}

// Eligibility tag after the chime, and how much the synapse changes if dopamine arrives at tDA.
export const tag = (t) => (t < CHIME_T ? 0 : Math.exp(-(t - CHIME_T) / TAG_TAU));
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
