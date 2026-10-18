// Receptor pharmacology world. Pure, deterministic math for binding, dose-response
// curves, antagonism, allosteric modulation, receptor kinetics and amplification.
// No DOM and no Three.js, so every function can be tested in isolation.

export const WINDOW = [-0.3, 3.0];

// ---------------------------------------------------------------- binding
// Fractional occupancy of one binding site. n = 1 is simple one-to-one binding.
export function hill(conc, ec50, n = 1) {
  const c = Math.max(0, conc);
  const e = Math.max(1e-9, ec50);
  const p = n === 1 ? c : Math.pow(c, n);
  return p / (p + Math.pow(e, n));
}

export function occupancy(conc, kd) {
  return hill(conc, Math.max(1e-9, kd), 1);
}

// ---------------------------------------------------------------- response
// Effect on a roughly -1..1 scale. efficacy: 1 full agonist, 0.4 partial agonist,
// 0 neutral antagonist, negative inverse agonist. Baseline is the effect with no ligand.
export function effect({ conc, ec50 = 1, n = 1, efficacy = 1, baseline = 0 }) {
  return baseline + efficacy * hill(conc, ec50, n);
}

// Gaddum and Schild: a competitive antagonist raises the apparent EC50.
export function apparentEc50({ ec50 = 1, antagonistConc = 0, kb = 1 }) {
  const i = Math.max(0, antagonistConc);
  return ec50 * (1 + i / Math.max(1e-9, kb));
}

// A non-competitive blocker lowers the ceiling without changing the EC50.
export function noncompetitiveFactor({ antagonistConc = 0, ic50 = 1 }) {
  const i = Math.max(0, antagonistConc);
  return 1 / (1 + i / Math.max(1e-9, ic50));
}

// ------------------------------------------------ ligand classes
export const LIGANDS = {
  full: { key: 'full', label: 'Full agonist', efficacy: 1, kind: 'agonist' },
  partial: { key: 'partial', label: 'Partial agonist', efficacy: 0.42, kind: 'agonist' },
  inverse: { key: 'inverse', label: 'Inverse agonist', efficacy: -0.55, kind: 'agonist' },
  neutral: { key: 'neutral', label: 'Neutral antagonist', efficacy: 0, kind: 'antagonist' },
  competitive: { key: 'competitive', label: 'Competitive antagonist', efficacy: 0, kind: 'antagonist' },
  noncompetitive: { key: 'noncompetitive', label: 'Non-competitive blocker', efficacy: 0, kind: 'antagonist' },
};

export function sampleCurve(effectFn, { logMin = -3, logMax = 3, points = 96 } = {}) {
  const out = [];
  for (let i = 0; i <= points; i++) {
    const logC = logMin + ((logMax - logMin) * i) / points;
    out.push({ logC, c: Math.pow(10, logC), y: effectFn(Math.pow(10, logC)) });
  }
  return out;
}

export function ligandCurve(key, { ec50 = 1, n = 1 } = {}) {
  const lig = LIGANDS[key] || LIGANDS.full;
  return sampleCurve((c) => effect({ conc: c, ec50, n, efficacy: lig.efficacy, baseline: 0 }));
}

// Curve an agonist follows when a competitive antagonist is also present.
export function shiftedAgonistCurve(agonistKey, { ec50 = 1, n = 1, antagonistConc = 0, kb = 1 } = {}) {
  const lig = LIGANDS[agonistKey] || LIGANDS.full;
  const ec50p = apparentEc50({ ec50, antagonistConc, kb });
  return sampleCurve((c) => effect({ conc: c, ec50: ec50p, n, efficacy: lig.efficacy, baseline: 0 }));
}

// Curve an agonist follows when a non-competitive blocker is present.
export function blockedAgonistCurve(agonistKey, { ec50 = 1, n = 1, antagonistConc = 0, ic50 = 1 } = {}) {
  const lig = LIGANDS[agonistKey] || LIGANDS.full;
  const factor = noncompetitiveFactor({ antagonistConc, ic50 });
  return sampleCurve((c) => {
    const base = effect({ conc: c, ec50, n, efficacy: lig.efficacy, baseline: 0 });
    return base >= 0 ? base * factor : base;
  });
}

// ------------------------------------------------ allosteric modulation
// A pure modulator has no activity alone. With an agonist present it scales the
// response: positive (PAM) up, negative (NAM) down. modulator runs -1..1.
export function modulatedEffect({ agonistEffect = 0, modulator = 0 }) {
  const gated = Math.max(0, agonistEffect);
  return Math.max(-0.15, gated * (1 + 0.9 * modulator));
}

// Agonist curve when a fixed allosteric modulator is co-applied.
export function modulatedCurve(agonistKey, { ec50 = 1, n = 1, modulator = 0, modShift = 0.6 } = {}) {
  const lig = LIGANDS[agonistKey] || LIGANDS.full;
  const ec50p = ec50 * Math.pow(10, -modShift * modulator);
  return sampleCurve((c) => modulatedEffect({
    agonistEffect: effect({ conc: c, ec50: ec50p, n, efficacy: Math.max(0, lig.efficacy), baseline: 0 }),
    modulator,
  }));
}

// ---------------------------------------------------------------- kinetics
// Sharp, direct current through a ligand-gated pore. Peaks one tau after onset.
export function alphaPulse(x, tau) {
  if (x <= 0) return 0;
  const u = x / tau;
  return u * Math.exp(1 - u);
}

// Slower wave shaped by a G-protein cascade. Sluggish onset, longer tail.
export function gammaPulse(x, tau) {
  if (x <= 0) return 0;
  const u = x / tau;
  return u * u * Math.exp(2 - 2 * u);
}

export function ionotropicTrace(t, { pulses = [0], tau = 0.07, gain = 1 } = {}) {
  let v = 0;
  for (const tp of pulses) v += alphaPulse(t - tp, tau);
  return gain * v;
}

export function metabotropicTrace(t, { pulses = [0], delay = 0.18, tau = 0.5, gain = 1 } = {}) {
  let v = 0;
  for (const tp of pulses) v += gammaPulse(t - tp - delay, tau);
  return gain * v;
}

export function pulseTrain({ n = 1, start = 0, interval = 0.32 } = {}) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(start + i * interval);
  return out;
}

// ---------------------------------------------------------------- amplification
// One ligand can switch on many G-proteins, and each makes many second messengers.
export function amplification({ ligands = 1, gPerReceptor = 20, messengerPerG = 50 } = {}) {
  const gProteins = ligands * gPerReceptor;
  return { ligands, gProteins, messengers: gProteins * messengerPerG };
}

// ---------------------------------------------------------------- slow receptors
// Step response of a chain of identical first-order stages, the shape a kinase
// cascade or a gene expression program follows: a lag, then a sigmoid rise.
export function cascadeStep(t, { tau = 0.5, stages = 3 } = {}) {
  if (t <= 0) return 0;
  const x = t / Math.max(1e-6, tau);
  let sum = 0;
  let term = 1;
  for (let k = 0; k < stages; k++) {
    if (k > 0) term *= x / k;
    sum += term;
  }
  return 1 - Math.exp(-x) * sum;
}

// Fraction of enzyme-linked receptors phosphorylated over time (minutes). The
// ligand dose sets the plateau through an occupancy-style saturation.
export function enzymePhosphorylation(t, { ligand = 1, delay = 1.5, tau = 1.6, stages = 2 } = {}) {
  const drive = ligand / (ligand + 1);
  return drive * cascadeStep(t - delay, { tau, stages });
}

// Nuclear receptor: the ligand sets the transcription drive. Messenger RNA builds
// first, then the protein it encodes lags behind by another slower stage.
export function nuclearMrna(t, { ligand = 1, delay = 0.4, tau = 0.8 } = {}) {
  const drive = ligand / (ligand + 1);
  return drive * cascadeStep(t - delay, { tau, stages: 2 });
}

export function nuclearProtein(t, { ligand = 1, delay = 1.6, tau = 1.1 } = {}) {
  const drive = ligand / (ligand + 1);
  return drive * cascadeStep(t - delay, { tau, stages: 3 });
}

// ---------------------------------------------------------------- repeated dosing
// Response to each dose under repeated dosing. desensitization below 1 means each
// dose works a little less; washout (0 to 1) lets sensitivity partly recover between
// doses, so a fast-then-refractory pattern is visible.
export function repeatedDoseResponse({ doses = 1, desensitization = 0.7, washout = 0 } = {}) {
  const out = [];
  let sens = 1;
  for (let i = 0; i < doses; i++) {
    const receptors = receptorLevel(i + 1, { washout });
    out.push({ dose: i + 1, response: Math.max(0.12, sens), sensitivity: sens, receptors });
    sens = sens * desensitization + washout * (1 - sens);
    sens = Math.max(0.12, sens);
  }
  return out;
}

// Surface receptors remaining after repeated over-stimulation (downregulation).
// A washout gap between doses allows partial recovery toward 100%.
export function receptorLevel(doses, { floor = 0.3, factor = 0.82, washout = 0 } = {}) {
  const n = Math.max(0, doses);
  const w = Math.max(0, Math.min(1, washout));
  if (w === 0) return floor + (1 - floor) * Math.pow(factor, n);
  let rec = 1;
  for (let i = 0; i < n; i++) {
    const down = floor + (rec - floor) * factor;
    rec = down + w * 0.65 * (1 - down);
  }
  return rec;
}
