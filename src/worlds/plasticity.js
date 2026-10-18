// Synaptic Plasticity world: pure, deterministic mathematics for synaptic transmission,
// voltage-dependent magnesium unblock, calcium influx through NMDA channels,
// BCM / Shouval calcium threshold plasticity rules, AMPA receptor trafficking,
// and dendritic spine structural remodeling.
// Zero DOM and zero Three.js dependencies: fully testable in isolation.

export const WINDOW = [-0.2, 2.8];

// Physiological baseline constants
export const V_REST = -65; // mV, resting membrane potential of dendritic spine
export const V_THRESH = -50; // mV, baseline EPSP peak threshold
export const V_DEP = -15; // mV, strongly depolarized potential during synchronous burst/tetanus
export const MG_DEFAULT = 1.2; // mM, extracellular magnesium concentration
export const CA_REST = 0.08; // micromolar, resting intracellular calcium
export const CA_TAU = 0.08; // seconds, spine calcium extrusion time constant (PMCA/NCX)
export const GLU_TAU = 0.003; // seconds, glutamate clearance from synaptic cleft
export const AMPA_BASE_COUNT = 50; // baseline number of functional AMPA receptors in PSD
export const EPSP_BASE_PEAK = 15.0; // mV, amplitude of baseline test EPSP

// ---------------------------------------------------------------- magnesium block
// Unblocking probability B(V) from Jahr & Stevens (1990) / Mayer et al. (1984).
// B(V) = 1 / (1 + ([Mg2+] / 3.57) * exp(-0.062 * V))
export function mgBlock(voltage, mgConc = MG_DEFAULT) {
  const mg = Math.max(0, mgConc);
  const factor = (mg / 3.57) * Math.exp(-0.062 * voltage);
  return 1 / (1 + factor);
}

// Blocked fraction in [0, 1]
export function mgBlockedFraction(voltage, mgConc = MG_DEFAULT) {
  return 1 - mgBlock(voltage, mgConc);
}

// Generates points along the B(V) curve across voltages
export function mgBlockCurve({ vMin = -90, vMax = 40, mgConc = MG_DEFAULT, steps = 100 } = {}) {
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const v = vMin + ((vMax - vMin) * i) / steps;
    const unblocked = mgBlock(v, mgConc);
    out.push({
      v,
      unblocked,
      blocked: 1 - unblocked,
      unblockedPercent: Math.round(unblocked * 100),
    });
  }
  return out;
}

// ---------------------------------------------------------------- calcium influx
// NMDA channel conductance as a product of glutamate binding and magnesium unblock
export function nmdaConductance(voltage, gluFraction, mgConc = MG_DEFAULT, gMax = 1.0) {
  const g = Math.max(0, Math.min(1, gluFraction));
  return gMax * g * mgBlock(voltage, mgConc);
}

// Calcium current through NMDA receptors (inward, positive magnitude)
export function calciumCurrent(voltage, gluFraction, mgConc = MG_DEFAULT, { gCa = 1.0, vRevCa = 130 } = {}) {
  const g = nmdaConductance(voltage, gluFraction, mgConc, gCa);
  const drivingForce = Math.max(0, vRevCa - voltage);
  return g * drivingForce;
}

// ---------------------------------------------------------------- enzyme kinetics
// CaMKII activation (cooperative, Hill n=4, Kd=1.4 micromolar)
// Requires high calcium surge (>1.2 uM) to autophosphorylate at Thr286
export function camkiiActivation(caConc) {
  const c = Math.max(0, caConc);
  const c4 = Math.pow(c, 4);
  const kd4 = Math.pow(1.4, 4);
  return c4 / (c4 + kd4);
}

// Calcineurin (PP2B) activation (high affinity, Hill n=2, Kd=0.4 micromolar)
// Activated by modest calcium trickles (0.3 to 0.8 uM)
export function calcineurinActivation(caConc) {
  const c = Math.max(0, caConc);
  const c2 = Math.pow(c, 2);
  const kd2 = Math.pow(0.4, 2);
  return c2 / (c2 + kd2);
}

// ---------------------------------------------------------------- BCM / Shouval rule
// Smooth calcium threshold function Omega([Ca])
// Returns:
// 0 at basal calcium (<0.25 uM, resting stability)
// negative during modest calcium (0.25 to 1.1 uM, LTD / calcineurin dominant)
// positive during intense calcium (>1.1 uM, LTP / CaMKII dominant)
export function calciumThresholdOmega(caConc) {
  const c = Math.max(0, caConc);
  if (c < 0.22) return 0;
  const ltpComponent = 1 / (1 + Math.exp(-(c - 1.25) / 0.22));
  const ltdGate = 1 / (1 + Math.exp(-(c - 0.45) / 0.12));
  const ltdSuppression = 1 - 0.88 / (1 + Math.exp(-(c - 1.15) / 0.18));
  const ltdComponent = 0.46 * ltdGate * ltdSuppression;
  return ltpComponent - ltdComponent;
}

// Generates points along the Omega([Ca]) BCM curve
export function bcmCurve({ caMax = 3.0, steps = 100 } = {}) {
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const ca = (caMax * i) / steps;
    const omega = calciumThresholdOmega(ca);
    const camkii = camkiiActivation(ca);
    const calcineurin = calcineurinActivation(ca);
    let regime = 'none';
    if (ca >= 0.25 && ca < 1.1) regime = 'ltd';
    else if (ca >= 1.1) regime = 'ltp';
    out.push({ ca, omega, camkii, calcineurin, regime });
  }
  return out;
}

// ---------------------------------------------------------------- structural remodeling
// Dendritic spine head volume as a function of synaptic weight
// Spine volume scales with weight with a slight sub-linear power law
export function spineVolume(weight) {
  const w = Math.max(0.2, weight);
  return Math.pow(w, 0.85);
}

// Number of surface AMPA receptors in PSD
export function ampaReceptorCount(weight) {
  const w = Math.max(0.2, weight);
  return Math.round(AMPA_BASE_COUNT * w);
}

// EPSP waveform for a single test pulse at a given synaptic weight
export function epspWaveform({ weight = 1.0, duration = 0.05, dt = 0.0005, vRest = V_REST, basePeak = EPSP_BASE_PEAK } = {}) {
  const points = [];
  const tau = 0.006; // 6 ms EPSP rise time constant
  const steps = Math.round(duration / dt);
  const peak = basePeak * Math.max(0.1, weight);

  for (let i = 0; i <= steps; i++) {
    const t = i * dt;
    const normT = t / tau;
    const shape = normT * Math.exp(1 - normT);
    const v = vRest + peak * shape;
    points.push({ t, v, deltaV: v - vRest });
  }
  return points;
}

// ---------------------------------------------------------------- stimulation protocols
export const PROTOCOLS = {
  baseline: {
    key: 'baseline',
    label: '1 Hz Test Pulse',
    subLabel: 'Single baseline pulse, AMPA only, NMDA blocked',
    color: '#ffcf6b',
    pulses: [0.1],
    targetWeight: 1.0,
    expectedEpsp: 15.0,
  },
  ltp: {
    key: 'ltp',
    label: '100 Hz Tetanus (LTP)',
    subLabel: 'High-frequency burst, calcium surge, CaMKII activation',
    color: '#7df0c0',
    pulses: Array.from({ length: 30 }, (_, i) => 0.1 + i * 0.01), // 30 pulses at 100 Hz over 300 ms
    targetWeight: 2.0,
    expectedEpsp: 30.0,
  },
  ltd: {
    key: 'ltd',
    label: '1 Hz Low Frequency (LTD)',
    subLabel: 'Prolonged 1 Hz trickle, calcineurin activation',
    color: '#ff6b7d',
    pulses: [0.1, 0.9, 1.7], // 3 representative 1 Hz pulses
    targetWeight: 0.55,
    expectedEpsp: 8.25,
  },
};

// ---------------------------------------------------------------- dynamic protocol simulation
// Deterministic time-series solver for a selected protocol over WINDOW
export function protocolSimulation({
  protocol = 'baseline',
  duration = 2.8,
  dt = 0.004,
  initialWeight = 1.0,
  mgConc = MG_DEFAULT,
} = {}) {
  const proto = PROTOCOLS[protocol] || PROTOCOLS.baseline;
  const pulseTimes = proto.pulses;
  const steps = Math.round(duration / dt);

  const times = [];
  const vTrace = [];
  const gluTrace = [];
  const mgTrace = [];
  const caTrace = [];
  const camkiiTrace = [];
  const calcineurinTrace = [];
  const weightTrace = [];
  const spineVolTrace = [];
  const ampaPsdTrace = [];

  let v = V_REST;
  let glu = 0;
  let ca = CA_REST;
  let weight = initialWeight;

  for (let i = 0; i <= steps; i++) {
    const t = i * dt;

    // Check for incoming pulses
    let pulseActive = false;
    for (const pt of pulseTimes) {
      if (t >= pt && t < pt + 0.012) {
        pulseActive = true;
        break;
      }
    }

    if (pulseActive) {
      glu = Math.min(1.0, glu + 0.9);
      if (protocol === 'baseline') v = -50;
      else if (protocol === 'ltd') v = -48;
      else if (protocol === 'ltp') v = -15;
    } else {
      const tauGlu = protocol === 'ltd' ? 0.04 : 0.018;
      glu = Math.max(0, glu * Math.exp(-dt / tauGlu));
      v = v + (0.15 * (V_REST - v)) * dt * 40;
    }

    // In high-frequency tetanus LTP, sustained AMPA drive creates a steady depolarization plateau (-15 mV)
    if (protocol === 'ltp' && t >= 0.1 && t <= 0.42) {
      v = -15;
      glu = 0.92;
    }

    // Magnesium unblock factor
    const mgUnblocked = mgBlock(v, mgConc);

    // Calcium influx through NMDA
    let caDrive = 0;
    if (protocol === 'ltp') {
      caDrive = 36.0 * glu * mgUnblocked;
    } else if (protocol === 'ltd') {
      caDrive = 18.0 * glu;
    } else {
      caDrive = 4.0 * glu * mgUnblocked;
    }

    const tauCaSpine = protocol === 'ltd' ? 0.22 : 0.12;
    const caClearance = (ca - CA_REST) / tauCaSpine;
    ca = Math.max(CA_REST, ca + (caDrive - caClearance) * dt);

    // Enzyme activations
    const camkii = camkiiActivation(ca);
    const calcineurin = calcineurinActivation(ca);

    // Synaptic weight evolution
    const omega = calciumThresholdOmega(ca);
    let dw = 0;
    if (protocol === 'ltp' && camkii > 0.3) {
      dw = 4.5 * omega;
    } else if (protocol === 'ltd' && calcineurin > 0.4 && camkii < 0.25) {
      dw = 3.5 * omega;
    }
    weight = Math.max(0.55, Math.min(2.0, weight + dw * dt));

    const vol = spineVolume(weight);
    const ampaPsd = ampaReceptorCount(weight);

    times.push(t);
    vTrace.push(v);
    gluTrace.push(glu);
    mgTrace.push(mgUnblocked);
    caTrace.push(ca);
    camkiiTrace.push(camkii);
    calcineurinTrace.push(calcineurin);
    weightTrace.push(weight);
    spineVolTrace.push(vol);
    ampaPsdTrace.push(ampaPsd);
  }

  return {
    times,
    vTrace,
    gluTrace,
    mgTrace,
    caTrace,
    camkiiTrace,
    calcineurinTrace,
    weightTrace,
    spineVolTrace,
    ampaPsdTrace,
    finalWeight: weightTrace[weightTrace.length - 1],
    finalSpineVolume: spineVolTrace[spineVolTrace.length - 1],
    finalAmpaPsd: ampaPsdTrace[ampaPsdTrace.length - 1],
  };
}
