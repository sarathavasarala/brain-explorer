import { esc, fmt } from './format.js';
import { icon } from './icons.js';

const CELL = 'rgba(190, 200, 255, 0.5)';
const PLAY_MS = 2600;
const REDUCED_MOTION = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const STAGES = [
  { id: 0, key: 'made', label: 'Synthesis', title: 'Cells build the messenger' },
  { id: 1, key: 'packed', label: 'Vesicle Loading', title: 'Packed into protective vesicles' },
  { id: 2, key: 'released', label: 'Vesicle Fusion', title: 'Released into the cleft' },
  { id: 3, key: 'binds', label: 'Receptor Binding', title: 'Docking onto receptors' },
  { id: 4, key: 'cleared', label: 'Signal Clearance', title: 'Cleared for the next signal' },
];

export function stageForDrug(drug) {
  if (!drug || !drug.acts) return 0;
  switch (drug.acts) {
    case 'precursor': return 0;      // Cells build the messenger
    case 'release':
    case 'release-block': return 2;  // Released into the cleft
    case 'receptor-block':
    case 'receptor-mimic':
    case 'boost-receptor': return 3; // Docking onto receptors
    case 'reuptake-block':
    case 'enzyme-block': return 4;   // Cleared for the next signal
    default: return 3;
  }
}

export function getDrugStageNote(drug) {
  if (!drug || !drug.acts) return '';
  switch (drug.acts) {
    case 'precursor':
      return `${drug.name} supplies extra precursor, driving rapid transmitter synthesis.`;
    case 'release':
      return `${drug.name} drives massive, calcium-independent release into the cleft.`;
    case 'release-block':
      return `${drug.name} halts vesicle fusion, preventing chemical release into the gap.`;
    case 'receptor-block':
      return `${drug.name} caps the receptor binding pocket, blocking activation by natural transmitters.`;
    case 'receptor-mimic':
      return `${drug.name} acts as a direct receptor agonist, triggering an artificial signal cascade.`;
    case 'boost-receptor':
      return `${drug.name} binds to a regulatory allosteric site, multiplying ion flow through the channel.`;
    case 'reuptake-block':
      return `${drug.name} plugs the transporter, trapping molecules in the cleft and producing prolonged firing.`;
    case 'enzyme-block':
      return `${drug.name} disables the breakdown enzyme, leaving transmitter molecules trapped in the cleft.`;
    default:
      return `${drug.name} targets this stage: ${drug.text}`;
  }
}

// What a receptor lets through once the messenger docks on it.
const ION_COLORS = { 'Na⁺': '#6be4ff', 'Ca²⁺': '#ffcf6b', 'Cl⁻': '#7dffb2', 'K⁺': '#b98cff' };

export const RECEPTOR_MODES = [
  {
    id: 'excite',
    word: 'Excites',
    analogy: 'Gas pedal',
    timescale: 'Milliseconds',
    summary: 'Lets positive ions rush in, pushing membrane voltage up toward the firing threshold.',
  },
  {
    id: 'inhibit',
    word: 'Quiets',
    analogy: 'Brake pedal',
    timescale: 'Milliseconds to seconds',
    summary: 'Lets negative ions in (or positive ions out), pulling voltage down so the cell resists firing.',
  },
  {
    id: 'modulate',
    word: 'Tunes',
    analogy: 'Volume knob',
    timescale: 'Seconds to hours',
    summary: 'Doesn\'t trigger a spike on its own. Launches internal messengers that shift how strongly the cell reacts to future signals.',
  },
];

export function parseFlux(flux) {
  if (!flux) return null;
  if (/g-protein/i.test(flux)) return { kind: 'gprotein', label: flux };
  if (/gene/i.test(flux)) return { kind: 'gene', label: flux };
  const m = /^(.*?)\s+(in|out)$/.exec(flux);
  if (!m) return null;
  const ions = m[1].split(/\s+and\s+|\s*,\s*/).map((s) => s.trim()).filter((s) => ION_COLORS[s]);
  if (!ions.length) return null;
  return { kind: 'ion', dir: m[2], ions, label: flux };
}

export function describeReceptorMechanism(r) {
  if (!r) return '';
  const fluxInfo = parseFlux(r.flux);
  if (fluxInfo?.kind === 'ion') {
    if (r.flux === 'Na⁺ in') {
      return 'Fast ion gate (milliseconds): opens a direct pore for positive sodium (Na⁺), driving a sharp upward voltage spike toward threshold.';
    }
    if (r.flux === 'Ca²⁺ in') {
      return 'Calcium gate (milliseconds): lets Ca²⁺ flow in to depolarize the cell and activate intracellular memory-building enzymes.';
    }
    if (r.flux === 'Cl⁻ in') {
      return 'Fast chloride gate (milliseconds): lets negative chloride (Cl⁻) rush in, clamping voltage down away from the firing point.';
    }
    if (r.flux === 'K⁺ out') {
      return 'Slow potassium channel (hundreds of ms): lets positive potassium (K⁺) leak out, holding the membrane below resting voltage.';
    }
  }
  if (fluxInfo?.kind === 'gprotein') {
    if (r.effect === 'excite') {
      return 'G-protein cascade (seconds): triggers internal chemical messengers that raise baseline voltage and prime the cell to fire.';
    }
    if (r.effect === 'inhibit') {
      return 'G-protein brake (seconds): quiets internal messengers and opens potassium channels to hold firing back.';
    }
    return 'G-protein tuner (seconds to minutes): adjusts internal second messengers, turning the volume knob up or down on future inputs.';
  }
  if (fluxInfo?.kind === 'gene') {
    return 'Gene-level signal (minutes to hours): acts through nuclear receptors or transcription cascades to reshape how the cell is built and wired.';
  }
  return '';
}

let activeStage = 0;
let playTimer = null;
let drugModeEnabled = true;
let highlightedReceptor = null;

export function getStepperStage() {
  return activeStage;
}

export function setStepperStage(s) {
  activeStage = Math.min(Math.max(Number(s) || 0, 0), 4);
}

export function getDrugMode() {
  return drugModeEnabled;
}

export function setDrugMode(enabled) {
  drugModeEnabled = !!enabled;
}

export function getHighlightedReceptor() {
  return highlightedReceptor;
}

export function setHighlightedReceptor(recId) {
  highlightedReceptor = recId || null;
}

export function isStepperPlaying() {
  return playTimer !== null;
}

export function stopStepperPlay() {
  if (playTimer) {
    clearInterval(playTimer);
    playTimer = null;
  }
}

export function toggleStepperPlay(onStep) {
  if (playTimer) {
    stopStepperPlay();
    if (onStep) onStep(activeStage, false);
    return false;
  }
  playTimer = setInterval(() => {
    activeStage = (activeStage + 1) % 5;
    if (onStep) onStep(activeStage, true);
  }, PLAY_MS);
  if (onStep) onStep(activeStage, true);
  return true;
}

function getPostsynapticLabel(effect, stage, acts, recId = null) {
  const via = recId ? ` (${recId})` : '';
  if (stage === 0 || stage === 1) return 'Receiving cell: Baseline resting';
  if (stage === 2) {
    if (acts === 'release-block') return 'Receiving cell: Silent (release blocked)';
    if (acts === 'release') return 'Receiving cell: Flooded with transmitter';
    return 'Receiving cell: Signal arriving';
  }
  if (stage === 3) {
    if (acts === 'receptor-block') return `Receiving cell${via}: Blocked (quiet)`;
    if (acts === 'boost-receptor') return `Receiving cell${via}: Amplified response`;
    if (acts === 'receptor-mimic') {
      return effect === 'inhibit' ? `Receiving cell${via}: Deep inhibition` : `Receiving cell${via}: Strong activation`;
    }
    if (effect === 'excite') return `Receiving cell${via}: Pushed toward firing`;
    if (effect === 'inhibit') return `Receiving cell${via}: Pulled away from firing`;
    return `Receiving cell${via}: Sensitivity retuned`;
  }
  if (stage === 4) {
    if (acts === 'reuptake-block') return 'Receiving cell: Extended firing (prolonged signal)';
    if (acts === 'enzyme-block') return 'Receiving cell: Trapped signal (sustained excitation)';
    return 'Receiving cell: Resetting to baseline';
  }
  return 'Receiving cell: Baseline resting';
}

function stripAnimation(svg) {
  return svg.replace(/<animate(?:Transform|Motion)?\b[^>]*?\/>/g, '');
}

export function renderSynapseStepper(chem, { stage = activeStage, drugId = null, tab = 'synapse' } = {}) {
  const currentStage = Math.min(Math.max(Number(stage) || 0, 0), 4);
  activeStage = currentStage;
  const color = chem.color || '#b98cff';
  const life = chem.life || {};
  const clearedBy = life.clearedBy || 'reuptake';
  const receptors = (chem.receptors || []).slice(0, 4);
  const drug = drugId ? (chem.drugs || []).find((d) => d.id === drugId) : null;
  const isDrugActive = !!(drug && drugModeEnabled);
  const acts = isDrugActive ? drug.acts : null;
  const selectedReceptor = highlightedReceptor ? receptors.find((r) => r.id === highlightedReceptor) : null;
  const activeReceptor = selectedReceptor || receptors[0] || null;
  const primaryEffect = activeReceptor?.effect || 'modulate';
  const signalPersist = currentStage === 4 && (acts === 'reuptake-block' || acts === 'enzyme-block');

  // Live molecule counter in synaptic gap
  let gapCount = 0;
  if (currentStage === 0 || currentStage === 1) {
    gapCount = 0;
  } else if (currentStage === 2) {
    if (acts === 'release-block') gapCount = 0;
    else if (acts === 'release') gapCount = 34;
    else gapCount = 18;
  } else if (currentStage === 3) {
    if (acts === 'receptor-block') gapCount = 16;
    else if (acts === 'receptor-mimic') gapCount = 14;
    else gapCount = 10;
  } else if (currentStage === 4) {
    if (acts === 'reuptake-block') gapCount = 16;
    else if (acts === 'enzyme-block') gapCount = 14;
    else gapCount = 0;
  }

  // Caption for each stage
  const captions = [
    life.made || 'Sending neurons synthesize chemical messengers from nutrient precursors inside the axon terminal.',
    life.packed || 'Vesicular transporter pumps pack chemical messengers into protective membrane bubbles called vesicles, shielding them from enzymes in the terminal fluid.',
    life.released || 'An arriving action potential triggers calcium influx, causing docked vesicles to fuse with the cell membrane and spill molecules into the synaptic cleft.',
    life.binds || 'Molecules diffuse across the 20 nm gap and dock onto receptor proteins on the receiving cell, exciting, quieting, or tuning the membrane voltage.',
    life.cleared || 'Transporters, enzymes, or helper glia swiftly clear molecules from the synaptic gap, resetting the connection for the next signal.',
  ];
  const drugStepIdx = drug ? stageForDrug(drug) : -1;

  // ---------------------------------------------------------------- SVG Visuals (760x440)
  // Stage 0: Precursor synthesis
  const precursorCount = acts === 'precursor' ? 20 : 10;
  const precursorDots = [];
  if (currentStage === 0) {
    for (let i = 0; i < precursorCount; i++) {
      const startX = 300 + (i % 5) * 40 + ((i * 11) % 17) - 8;
      const startY = 16 + Math.floor(i / 5) * 14;
      const dur = acts === 'precursor' ? 1.2 : 2.0;
      const begin = (i * 0.12).toFixed(2);
      precursorDots.push(`<circle cx="${startX}" cy="${startY}" r="4.2" fill="#a9b3d6">
        <animate attributeName="cx" values="${startX};380;${340 + (i * 29) % 80}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite" />
        <animate attributeName="cy" values="${startY};58;${88 + (i * 17) % 36}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite" />
        <animate attributeName="fill" values="#a9b3d6;#a9b3d6;${color};${color}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.2;0.8;1" dur="${dur}s" begin="${begin}s" repeatCount="indefinite" />
      </circle>`);
    }
  }

  // Stage 1: 9 Vesicles arranged in terminal
  const vesicleCoords = [
    [310, 75], [380, 70], [450, 75],
    [280, 115], [345, 115], [415, 115], [480, 115],
    [335, 155], [425, 155]
  ];

  const vesicleElements = vesicleCoords.map(([vx, vy], i) => {
    const clusterOpacity = currentStage === 0 ? '0.25' : '0.95';
    const packingParticle = currentStage === 1 ? `
      <circle cx="${vx - 26}" cy="${vy - 18}" r="3.4" fill="${color}" opacity="0" filter="url(#syn-glow)">
        <animate attributeName="cx" values="${vx - 26};${vx}" dur="1.5s" begin="${(i * 0.16).toFixed(2)}s" repeatCount="indefinite"/>
        <animate attributeName="cy" values="${vy - 18};${vy}" dur="1.5s" begin="${(i * 0.16).toFixed(2)}s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.2;0.8;1" dur="1.5s" begin="${(i * 0.16).toFixed(2)}s" repeatCount="indefinite"/>
      </circle>` : '';

    return `<g class="syn-vesicle">
      <animateTransform attributeName="transform" type="translate" values="0 0;0 -2.5;0 0" dur="${(4 + i * 0.35).toFixed(2)}s" begin="${(i * 0.25).toFixed(2)}s" repeatCount="indefinite" />
      <circle cx="${vx}" cy="${vy}" r="15" fill="rgba(190,200,255,0.05)" stroke="${color}" stroke-width="2" opacity="0.95">
        <animate attributeName="r" values="15;16.6;15" dur="${(2.4 + i * 0.28).toFixed(2)}s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${vx - 6}" cy="${vy - 8}" r="2" fill="#ffffff" opacity="0.45" />
      <line x1="${vx - 15}" y1="${vy}" x2="${vx - 10.5}" y2="${vy}" stroke="${CELL}" stroke-width="2" />
      <circle cx="${vx - 4.5}" cy="${vy - 4.5}" r="3" fill="${color}" opacity="${clusterOpacity}"/>
      <circle cx="${vx + 4.5}" cy="${vy - 4.5}" r="3" fill="${color}" opacity="${clusterOpacity}"/>
      <circle cx="${vx - 4.5}" cy="${vy + 4.5}" r="3" fill="${color}" opacity="${clusterOpacity}"/>
      <circle cx="${vx + 4.5}" cy="${vy + 4.5}" r="3" fill="${color}" opacity="${clusterOpacity}"/>
      ${packingParticle}
    </g>`;
  }).join('');

  // Stage 2: Symmetrical depolarization wave + Calcium influx sparks + vesicle fusion
  const fastRelease = acts === 'release';
  const heroDur = fastRelease ? 1.5 : 2.4;
  let spikeElements = '';
  if (currentStage === 2) {
    const releaseBlocked = acts === 'release-block';
    const heroCy = releaseBlocked ? ['112', '112', '152', '152'] : ['112', '112', '176', '176'];
    const heroEndY = Number(heroCy[2]);
    const heroInner = (dx, dy) => `
      <circle cx="${380 + dx}" cy="${112 + dy}" r="3" fill="${color}" opacity="0.95" filter="url(#syn-glow)">
        <animate attributeName="cy" values="${112 + dy};${112 + dy};${heroEndY + dy * 0.35};${heroEndY + dy * 0.35}" keyTimes="0;0.08;0.6;1" dur="${heroDur}s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="${releaseBlocked ? '0.95;0.95;0.95;0.95' : '0.95;0.95;0.95;0;0'}" keyTimes="${releaseBlocked ? '0;0.08;0.6;1' : '0;0.08;0.6;0.68;1'}" dur="${heroDur}s" repeatCount="indefinite"/>
      </circle>`;

    const burstDots = [];
    if (!releaseBlocked) {
      for (let k = 0; k < 10; k++) {
        const ang = Math.PI * (0.15 + 0.7 * (k / 9));
        const bx = 380 + Math.cos(ang) * (40 + (k % 3) * 20);
        const by = 180 + Math.sin(ang) * (22 + (k % 2) * 14);
        burstDots.push(`<circle cx="380" cy="180" r="3.6" fill="${color}" opacity="0" filter="url(#syn-glow)">
          <animate attributeName="cx" values="380;380;${bx.toFixed(1)};${bx.toFixed(1)}" keyTimes="0;0.6;0.78;1" dur="${heroDur}s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="180;180;${by.toFixed(1)};${by.toFixed(1)}" keyTimes="0;0.6;0.78;1" dur="${heroDur}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.56;0.66;0.92;1" dur="${heroDur}s" repeatCount="indefinite"/>
        </circle>`);
      }
    }

    spikeElements = `
      <!-- Symmetrical action potential spikes down both bouton walls -->
      <circle cx="230" cy="0" r="6.5" fill="#ffffff" opacity="0" filter="url(#syn-glow)">
        <animate attributeName="cy" values="0;135" dur="1.3s" repeatCount="indefinite" calcMode="linear"/>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="1.3s" repeatCount="indefinite"/>
      </circle>
      <circle cx="530" cy="0" r="6.5" fill="#ffffff" opacity="0" filter="url(#syn-glow)">
        <animate attributeName="cy" values="0;135" dur="1.3s" repeatCount="indefinite" calcMode="linear"/>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="1.3s" repeatCount="indefinite"/>
      </circle>

      <!-- Calcium influx on left flank -->
      <g class="ca-gate left">
        <rect x="232" y="112" width="12" height="22" rx="3" fill="rgba(107,228,255,0.22)" stroke="#6be4ff" stroke-width="1.6">
          <animate attributeName="fill-opacity" values="0.18;0.5;0.18" dur="1.2s" repeatCount="indefinite"/>
        </rect>
        <text x="224" y="126" font-size="11" font-weight="700" fill="#6be4ff" text-anchor="end">Ca²⁺ in</text>
        <circle cx="238" cy="124" r="4" fill="#6be4ff" opacity="0" filter="url(#syn-glow)">
          <animate attributeName="cx" values="232;300" dur="0.9s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="124;158" dur="0.9s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.2;1" dur="0.9s" repeatCount="indefinite"/>
        </circle>
      </g>

      <!-- Calcium influx on right flank -->
      <g class="ca-gate right">
        <rect x="516" y="112" width="12" height="22" rx="3" fill="rgba(107,228,255,0.22)" stroke="#6be4ff" stroke-width="1.6">
          <animate attributeName="fill-opacity" values="0.5;0.18;0.5" dur="1.2s" repeatCount="indefinite"/>
        </rect>
        <text x="536" y="126" font-size="11" font-weight="700" fill="#6be4ff" text-anchor="start">Ca²⁺ in</text>
        <circle cx="522" cy="124" r="4" fill="#6be4ff" opacity="0" filter="url(#syn-glow)">
          <animate attributeName="cx" values="528;460" dur="0.9s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="124;158" dur="0.9s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.2;1" dur="0.9s" repeatCount="indefinite"/>
        </circle>
      </g>

      <!-- Terminal depolarization flash -->
      <ellipse cx="380" cy="130" rx="150" ry="80" fill="${color}" opacity="0">
        <animate attributeName="opacity" values="0;0;0.1;0;0" keyTimes="0;0.55;0.66;0.85;1" dur="${heroDur}s" repeatCount="indefinite"/>
      </ellipse>

      <!-- Hero vesicle: travels to the membrane and fuses -->
      <g class="fusion-hero">
        <circle cx="380" cy="112" r="16" fill="rgba(190,200,255,0.07)" stroke="${color}" stroke-width="2.2">
          <animate attributeName="cy" values="${heroCy.join(';')}" keyTimes="0;0.08;0.6;1" dur="${heroDur}s" repeatCount="indefinite"/>
          <animate attributeName="r" values="${releaseBlocked ? '16;16;15;15;15;15' : '16;16;15;15;0;0'}" keyTimes="0;0.08;0.58;0.62;0.66;1" dur="${heroDur}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${releaseBlocked ? '1;1;1;1' : '1;1;1;0;0'}" keyTimes="${releaseBlocked ? '0;0.08;0.6;1' : '0;0.08;0.6;0.66;1'}" dur="${heroDur}s" repeatCount="indefinite"/>
        </circle>
        ${heroInner(-4.5, -4.5)}
        ${heroInner(4.5, -4.5)}
        ${heroInner(-4.5, 4.5)}
        ${heroInner(4.5, 4.5)}
      </g>
      ${releaseBlocked ? `
        <g>
          <circle cx="380" cy="178" r="15" fill="none" stroke="#ff4d6d" stroke-width="1.8" stroke-dasharray="4 4">
            <animateTransform attributeName="transform" type="rotate" values="0 380 178;360 380 178" dur="9s" repeatCount="indefinite"/>
          </circle>
          <line x1="372" y1="171" x2="388" y2="185" stroke="#ff4d6d" stroke-width="2.6" stroke-linecap="round"/>
          <line x1="388" y1="171" x2="372" y2="185" stroke="#ff4d6d" stroke-width="2.6" stroke-linecap="round"/>
          <text x="380" y="206" text-anchor="middle" font-size="10.5" font-weight="700" fill="#ff4d6d">Fusion blocked</text>
        </g>` : `
        <!-- Fusion pore flash -->
        <ellipse cx="380" cy="191" rx="6" ry="4" fill="#ffffff" opacity="0" filter="url(#syn-glow)">
          <animate attributeName="rx" values="6;6;34;34" keyTimes="0;0.6;0.74;1" dur="${heroDur}s" repeatCount="indefinite"/>
          <animate attributeName="ry" values="4;4;10;10" keyTimes="0;0.6;0.74;1" dur="${heroDur}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0;0;0.85;0.12;0" keyTimes="0;0.6;0.66;0.78;1" dur="${heroDur}s" repeatCount="indefinite"/>
        </ellipse>
        ${burstDots.join('')}`}
    `;
  }

  // Cleft molecules across stages
  const moleculeElements = [];
  if (currentStage === 2) {
    const count = acts === 'release-block' ? 0 : (acts === 'release' ? 28 : 18);
    for (let i = 0; i < count; i++) {
      const x0 = 340 + (i % 9) * 10 - 5;
      const x1 = 180 + (i * 33) % 400;
      const dur = acts === 'release' ? 1.1 : 1.6;
      const begin = (i * 0.08).toFixed(2);
      moleculeElements.push(`<circle cx="${x0}" cy="195" r="4.2" fill="${color}" opacity="0" filter="url(#syn-glow)">
        <animate attributeName="cx" values="${x0};${x1}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>
        <animate attributeName="cy" values="195;275" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>
      </circle>`);
    }
  } else if (currentStage === 3) {
    const n = receptors.length || 1;
    receptors.forEach((r, i) => {
      const rx = 380 + (i - (n - 1) / 2) * 110;
      const begin = i * 0.3;
      if (acts === 'receptor-block') {
        moleculeElements.push(`
          <circle r="4.2" fill="${color}" opacity="0">
            <animateMotion dur="1.7s" begin="${begin}s" repeatCount="indefinite" path="M${rx - 30} 212 Q${rx - 12} 244 ${rx - 6} 258"/>
            <animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.15;0.7;0.88;1" dur="1.7s" begin="${begin}s" repeatCount="indefinite"/>
          </circle>
          <circle cx="${rx}" cy="264" r="4" fill="none" stroke="#ff4d6d" stroke-width="1.8" opacity="0">
            <animate attributeName="r" values="3;15" dur="1.7s" begin="${(begin + 1.45).toFixed(2)}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.9;0" dur="1.7s" begin="${(begin + 1.45).toFixed(2)}s" repeatCount="indefinite"/>
          </circle>`);
      } else if (acts === 'receptor-mimic') {
        moleculeElements.push(`
          <circle cx="${rx}" cy="273" r="4.6" fill="#ffcf6b" opacity="0" filter="url(#syn-glow)">
            <animate attributeName="opacity" values="0;1;0.6;1" keyTimes="0;0.06;0.5;1" dur="1.8s" begin="${begin}s" repeatCount="indefinite"/>
          </circle>
          <circle cx="${rx}" cy="273" r="5" fill="none" stroke="#ffcf6b" stroke-width="1.8" opacity="0">
            <animate attributeName="r" values="5;25" dur="1.8s" begin="${begin}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.85;0" dur="1.8s" begin="${begin}s" repeatCount="indefinite"/>
          </circle>`);
      } else {
        moleculeElements.push(`
          <circle r="4.4" fill="${color}" opacity="0" filter="url(#syn-glow)">
            <animateMotion dur="1.9s" begin="${begin}s" repeatCount="indefinite" path="M${rx - 36} 208 Q${rx - 12} 250 ${rx} 271"/>
            <animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.12;0.8;0.92;1" dur="1.9s" begin="${begin}s" repeatCount="indefinite"/>
          </circle>
          <circle cx="${rx}" cy="274" r="3.4" fill="${color}" filter="url(#syn-glow)">
            <animate attributeName="opacity" values="0.35;1;0.35" dur="1.9s" begin="${begin}s" repeatCount="indefinite"/>
          </circle>
          <circle cx="${rx}" cy="274" r="4" fill="none" stroke="${color}" stroke-width="1.8" opacity="0">
            <animate attributeName="r" values="4;25" dur="1.9s" begin="${(begin + 1.5).toFixed(2)}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.85;0" dur="1.9s" begin="${(begin + 1.5).toFixed(2)}s" repeatCount="indefinite"/>
          </circle>`);
      }
    });
  } else if (currentStage === 4) {
    if (clearedBy === 'reuptake') {
      const dur = acts === 'reuptake-block' ? 3.5 : 1.7;
      for (let i = 0; i < 10; i++) {
        const x0 = 245 + i * 34;
        if (acts === 'reuptake-block') {
          moleculeElements.push(`<circle cx="${x0}" cy="245" r="4.2" fill="${color}">
            <animate attributeName="cx" values="${x0};255;${x0 + 10}" dur="${dur}s" begin="${(i * 0.2).toFixed(2)}s" repeatCount="indefinite"/>
            <animate attributeName="cy" values="245;165;248" dur="${dur}s" begin="${(i * 0.2).toFixed(2)}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="1;1;0.8" dur="${dur}s" begin="${(i * 0.2).toFixed(2)}s" repeatCount="indefinite"/>
          </circle>`);
        } else {
          moleculeElements.push(`<circle cx="${x0}" cy="245" r="4.0" fill="${color}" filter="url(#syn-glow)">
            <animate attributeName="cx" values="${x0};252;252" dur="${dur}s" begin="${(i * 0.18).toFixed(2)}s" repeatCount="indefinite"/>
            <animate attributeName="cy" values="245;155;90" dur="${dur}s" begin="${(i * 0.18).toFixed(2)}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.85;1" dur="${dur}s" begin="${(i * 0.18).toFixed(2)}s" repeatCount="indefinite"/>
          </circle>`);
        }
      }
    } else if (clearedBy === 'enzyme') {
      const dur = acts === 'enzyme-block' ? 3.5 : 1.8;
      for (let i = 0; i < 9; i++) {
        const x0 = 260 + i * 28;
        if (acts === 'enzyme-block') {
          moleculeElements.push(`<circle cx="${x0}" cy="235" r="4.2" fill="${color}">
            <animate attributeName="cy" values="225;245;230" dur="${dur}s" begin="${(i * 0.15).toFixed(2)}s" repeatCount="indefinite"/>
          </circle>`);
        } else {
          moleculeElements.push(`
            <circle cx="${x0}" cy="235" r="4.0" fill="${color}" filter="url(#syn-glow)">
              <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.5;0.6" dur="${dur}s" begin="${(i * 0.18).toFixed(2)}s" repeatCount="indefinite"/>
            </circle>
            <circle cx="${x0 - 5}" cy="238" r="2.6" fill="#8087a8" opacity="0">
              <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.55;1" dur="${dur}s" begin="${(i * 0.18).toFixed(2)}s" repeatCount="indefinite"/>
              <animate attributeName="cx" values="${x0};${x0 - 16}" dur="${dur}s" begin="${(i * 0.18).toFixed(2)}s" repeatCount="indefinite"/>
            </circle>
            <circle cx="${x0 + 5}" cy="238" r="2.6" fill="#8087a8" opacity="0">
              <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.55;1" dur="${dur}s" begin="${(i * 0.18).toFixed(2)}s" repeatCount="indefinite"/>
              <animate attributeName="cx" values="${x0};${x0 + 16}" dur="${dur}s" begin="${(i * 0.18).toFixed(2)}s" repeatCount="indefinite"/>
            </circle>`);
        }
      }
    } else if (clearedBy === 'astrocyte') {
      for (let i = 0; i < 10; i++) {
        const x0 = 260 + i * 26;
        moleculeElements.push(`<circle cx="${x0}" cy="240" r="4.0" fill="${color}" filter="url(#syn-glow)">
          <animate attributeName="cx" values="${x0};120" dur="2.0s" begin="${(i * 0.2).toFixed(2)}s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="240;235" dur="2.0s" begin="${(i * 0.2).toFixed(2)}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.85;1" dur="2.0s" begin="${(i * 0.2).toFixed(2)}s" repeatCount="indefinite"/>
        </circle>`);
      }
    } else if (clearedBy === 'blood') {
      for (let i = 0; i < 10; i++) {
        const x0 = 245 + i * 26;
        moleculeElements.push(`<circle cx="${x0}" cy="240" r="4.0" fill="${color}" filter="url(#syn-glow)">
          <animate attributeName="cx" values="${x0};652" dur="2.2s" begin="${(i * 0.18).toFixed(2)}s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="240;${220 + (i * 12) % 40}" dur="2.2s" begin="${(i * 0.18).toFixed(2)}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.88;1" dur="2.2s" begin="${(i * 0.18).toFixed(2)}s" repeatCount="indefinite"/>
        </circle>`);
      }
    }
  }

  // ---------------------------------------------------------------- Clearance Elements
  // 1. Transporter on presynaptic membrane (for reuptake)
  let transporterElement = '';
  if (clearedBy === 'reuptake') {
    const isBlocked = acts === 'reuptake-block';
    const pumpFlow = isBlocked ? '' : `
      <path d="M251 150 v18" stroke="${color}" stroke-width="2" stroke-dasharray="3 4" opacity="0.8">
        <animate attributeName="stroke-dashoffset" values="0;-14" dur="0.9s" repeatCount="indefinite"/>
      </path>`;
    const blockerGraphic = isBlocked ? `
      <rect x="238" y="143" width="26" height="28" rx="5" fill="rgba(255,77,109,0.3)" stroke="#ff4d6d" stroke-width="2" filter="url(#syn-glow)"/>
      <line x1="241" y1="146" x2="261" y2="168" stroke="#ff4d6d" stroke-width="2.8" stroke-linecap="round"/>
      <line x1="261" y1="146" x2="241" y2="168" stroke="#ff4d6d" stroke-width="2.8" stroke-linecap="round"/>
      <text x="240" y="134" class="dg-label" text-anchor="middle" font-size="10.5" font-weight="700" fill="#ff4d6d">${esc(drug.target || 'Transporter')} blocked</text>` : '';

    transporterElement = `<g class="transporter">
      <rect x="240" y="146" width="22" height="26" rx="5" fill="rgba(190,200,255,0.2)" stroke="${CELL}" stroke-width="1.8"/>
      <path d="M247 150 v18 M255 150 v18" stroke="rgba(190,200,255,0.55)" stroke-width="1.6"/>
      ${pumpFlow}
      <text x="236" y="164" class="dg-label" text-anchor="end" font-size="11.5">Transporter</text>
      ${blockerGraphic}
    </g>`;
  }

  // 2. Enzyme in cleft
  let enzymeElement = '';
  if (clearedBy === 'enzyme') {
    const isBlocked = acts === 'enzyme-block';
    const positions = [330, 380, 430];
    enzymeElement = `<g class="enzymes-group">
      ${positions.map((ex, ei) => {
        const blockerX = isBlocked ? `
          <circle cx="${ex}" cy="240" r="16" fill="none" stroke="#ff4d6d" stroke-width="2" stroke-dasharray="4 3" filter="url(#syn-glow)"/>
          <line x1="${ex - 8}" y1="232" x2="${ex + 8}" y2="248" stroke="#ff4d6d" stroke-width="2.6" stroke-linecap="round"/>` : `
          <circle cx="${ex}" cy="240" r="13" fill="none" stroke="#ffa36b" stroke-width="1.6" opacity="0">
            <animate attributeName="r" values="13;20" dur="1.8s" begin="${(ei * 0.35).toFixed(2)}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.7;0" dur="1.8s" begin="${(ei * 0.35).toFixed(2)}s" repeatCount="indefinite"/>
          </circle>`;
        return `
          <circle cx="${ex}" cy="240" r="13" fill="rgba(255,180,100,0.18)" stroke="#ffa36b" stroke-width="1.8"/>
          <text x="${ex}" y="244.5" text-anchor="middle" font-size="10" fill="#ffa36b" font-weight="700">AChE</text>
          ${blockerX}
        `;
      }).join('')}
      <text x="380" y="261" text-anchor="middle" class="dg-label dim" font-size="11" fill="#ffa36b">
        ${isBlocked ? `Enzyme blocked by ${esc(drug.name)}` : 'Clearing enzymes in cleft'}
      </text>
    </g>`;
  }

  // 3. Astrocyte process on left
  let astrocyteElement = '';
  if (clearedBy === 'astrocyte') {
    astrocyteElement = `<g class="astrocyte">
      <path d="M56 194 C82 184 106 192 124 206 C144 218 158 226 168 238 C158 248 140 254 118 260 C94 270 68 272 54 260 C38 246 40 210 56 194 Z" fill="rgba(140,210,255,0.14)" stroke="rgba(140,210,255,0.55)" stroke-width="1.8"/>
      <rect x="160" y="228" width="12" height="17" rx="3" fill="rgba(140,210,255,0.35)" stroke="rgba(140,210,255,0.8)" stroke-width="1.4"/>
      <circle cx="166" cy="236" r="7" fill="none" stroke="#8cd2ff" stroke-width="1.6" opacity="0">
        <animate attributeName="r" values="7;16" dur="2.0s" begin="1.75s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;0" dur="2.0s" begin="1.75s" repeatCount="indefinite"/>
      </circle>
      <text x="108" y="288" class="dg-label" text-anchor="middle" font-size="11.5">Astrocyte glia</text>
    </g>`;
  }

  // 4. Capillary bloodstream on right (for hormones)
  let bloodElement = '';
  if (clearedBy === 'blood') {
    bloodElement = `<g class="capillary-blood">
      <rect x="628" y="193" width="52" height="89" rx="9" fill="rgba(255,107,125,0.12)" stroke="rgba(255,107,125,0.45)" stroke-width="1.8"/>
      <path d="M644 204 v67 M664 204 v67" stroke="rgba(255,107,125,0.35)" stroke-width="1.6" stroke-dasharray="6 4">
        <animate attributeName="stroke-dashoffset" values="0;20" dur="1.8s" repeatCount="indefinite"/>
      </path>
      <text x="654" y="298" class="dg-label" text-anchor="middle" font-size="11" fill="#ff6b7d">Capillary blood</text>
    </g>`;
  }

  // Postsynaptic receptors on membrane
  const n = receptors.length || 1;
  const receptorElements = receptors.map((r, i) => {
    const rx = 380 + (i - (n - 1) / 2) * 110;
    const isHi = highlightedReceptor === r.id;
    const isBoosted = currentStage === 3 && acts === 'boost-receptor';
    const isBlocked = currentStage === 3 && acts === 'receptor-block';

    const glowClass = isBoosted ? 'receptor-boosted' : '';
    const cap = isBlocked ? `
      <rect x="${rx - 16}" y="269" width="32" height="9" rx="3.5" fill="#ff4d6d" stroke="#ffffff" stroke-width="1.2" filter="url(#syn-glow)"/>
      <text x="${rx}" y="264" text-anchor="middle" font-size="10" font-weight="700" fill="#ff4d6d">Blocked</text>` : '';

    const alloBadge = isBoosted ? `
      <g>
        <rect x="${rx + 20}" y="279" width="38" height="16" rx="3.5" fill="rgba(255,207,107,0.3)" stroke="#ffcf6b" stroke-width="1.3"/>
        <text x="${rx + 39}" y="291" text-anchor="middle" font-size="9" font-weight="700" fill="#ffcf6b">+ALLO</text>
      </g>` : '';

    const fluxInfo = parseFlux(r.flux);
    const fluxOn = fluxInfo && ((currentStage === 3 && !isBlocked) || signalPersist);
    let fluxVisual = '';
    if (fluxOn && !REDUCED_MOTION) {
      if (fluxInfo.kind === 'ion') {
        const strong = acts === 'boost-receptor' || acts === 'receptor-mimic';
        const particles = strong ? 5 : 3;
        const dur = strong ? 0.9 : 1.5;
        const fromY = fluxInfo.dir === 'in' ? 248 : 306;
        const toY = fluxInfo.dir === 'in' ? 306 : 248;
        fluxVisual = Array.from({ length: particles }, (_, p) => {
          const ionColor = ION_COLORS[fluxInfo.ions[p % fluxInfo.ions.length]];
          const xOff = (p % 3) * 7 - 7;
          const begin = ((p * dur) / particles).toFixed(2);
          return `<circle cx="${rx + xOff}" cy="${fromY}" r="3.6" fill="${ionColor}" opacity="0" filter="url(#syn-glow)">
            <animate attributeName="cy" values="${fromY};${toY}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.8;1" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>
          </circle>`;
        }).join('');
      } else {
        const gene = fluxInfo.kind === 'gene';
        const dur = gene ? 3.2 : 1.6;
        fluxVisual = `<circle cx="${rx}" cy="297" r="3.2" fill="${gene ? '#9fb8ff' : color}" opacity="0" filter="url(#syn-glow)">
          <animate attributeName="cy" values="297;343" dur="${dur}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.75;1" dur="${dur}s" repeatCount="indefinite"/>
        </circle>`;
      }
    }
    const effectWord = { excite: 'Excites', inhibit: 'Quiets', modulate: 'Tunes' }[r.effect] || r.effect;
    const familyText = r.flux ? `${effectWord} · ${r.flux}` : effectWord;
    const downstreamCascade = fluxOn ? `
      <g class="downstream-cascade" opacity="0.85">
        <path d="M${rx} 297 v46" stroke="${color}" stroke-width="2.2" stroke-dasharray="5 4" filter="url(#syn-glow)">
          <animate attributeName="stroke-dashoffset" values="0;-18" dur="0.8s" repeatCount="indefinite"/>
        </path>
        ${fluxVisual}
      </g>` : '';

    return `<g class="syn-receptor ${isHi ? 'is-hi' : ''} ${glowClass}" data-receptor="${esc(r.id)}" role="button" tabindex="0" aria-label="Receptor ${esc(r.id)}" style="cursor: pointer;">
      <rect class="rec-halo" x="${rx - 27}" y="262" width="54" height="34" rx="9" fill="none" stroke="${color}" stroke-width="1.6" stroke-dasharray="5 5" opacity="0"/>
      <path d="M${rx - 19} 285 v-14 h9 v8 h20 v-8 h9 v14" stroke="${color}" stroke-width="2.4" fill="rgba(190,200,255,0.1)"/>
      ${cap}
      ${alloBadge}
      ${downstreamCascade}
      <text x="${rx}" y="322" text-anchor="middle" class="dg-label syn-rec-name" font-size="14" font-weight="600" fill="${color}">${esc(r.id)}</text>
      <text x="${rx}" y="337" text-anchor="middle" class="dg-label dim syn-rec-family" font-size="10.5" fill="var(--ink-3)">${esc(familyText)}</text>
    </g>`;
  }).join('');

  // ---------------------------------------------------------------- Postsynaptic Signal Waveform
  // All shapes share the same command structure (M + 4 Q) so the browser can morph
  // between them with SMIL, letting the trace visibly charge up and settle back.
  const REST_D = 'M220 402 Q275 402 330 402 Q355 402 380 402 Q405 402 430 402 Q485 402 540 402';
  const PRE_D = 'M220 402 Q275 402 330 402 Q355 400 380 396 Q405 400 430 402 Q485 402 540 402';
  const EXCITE_D = 'M220 402 Q275 402 330 402 Q355 402 380 368 Q405 402 430 402 Q485 402 540 402';
  const INHIBIT_D = 'M220 402 Q275 402 330 402 Q355 402 380 420 Q405 402 430 402 Q485 402 540 402';
  const MOD_D = 'M220 402 Q275 392 330 402 Q355 412 380 402 Q405 392 430 402 Q485 402 540 402';
  const BOOST_D = 'M220 402 Q275 402 330 402 Q355 402 380 344 Q405 402 430 402 Q485 402 540 402';
  const SUSTAIN_D = 'M220 390 Q275 386 330 390 Q355 394 380 390 Q405 386 430 390 Q485 390 540 390';

  let waveFrom = REST_D;
  let waveTo = REST_D;
  let waveColor = 'rgba(190, 200, 255, 0.4)';
  let waveCaption = ['Baseline', 'resting potential'];
  let waveDur = 1.1;
  const recTag = activeReceptor ? ` (${activeReceptor.id})` : '';
  if (currentStage === 2) {
    if (acts === 'release-block') {
      waveCaption = ['No release', 'receiving cell stays silent'];
    } else {
      waveTo = PRE_D;
      waveColor = color;
      waveCaption = ['Signal crossing', 'not bound yet, still at rest'];
    }
  } else if (currentStage === 3) {
    if (acts === 'receptor-block') {
      waveColor = '#ff4d6d';
      waveCaption = [`Blocked${recTag}`, 'no potential change'];
    } else if (acts === 'boost-receptor') {
      waveTo = BOOST_D;
      waveColor = '#ffcf6b';
      waveCaption = [`Amplified${recTag}`, 'much stronger response'];
    } else if (primaryEffect === 'inhibit') {
      waveTo = INHIBIT_D;
      waveColor = '#ff6b7d';
      waveCaption = acts === 'receptor-mimic'
        ? [`Direct activation${recTag}`, 'forced quieting']
        : [`Quiets${recTag}`, 'pulled away from threshold'];
    } else if (primaryEffect === 'excite') {
      waveTo = EXCITE_D;
      waveColor = '#ffcf6b';
      waveCaption = acts === 'receptor-mimic'
        ? [`Direct activation${recTag}`, 'forced firing drive']
        : [`Excites${recTag}`, 'pushed toward threshold'];
    } else {
      waveTo = MOD_D;
      waveColor = color;
      waveCaption = acts === 'receptor-mimic'
        ? [`Direct activation${recTag}`, 'sensitivity overridden']
        : [`Tunes${recTag}`, 'shifts future sensitivity'];
    }
  } else if (currentStage === 4) {
    const peakD = acts === 'boost-receptor' ? BOOST_D
      : primaryEffect === 'inhibit' ? INHIBIT_D
        : primaryEffect === 'excite' ? EXCITE_D : MOD_D;
    waveDur = 1.4;
    if (signalPersist) {
      waveFrom = peakD;
      waveTo = SUSTAIN_D;
      waveColor = color;
      waveCaption = ['Signal sustained', 'clearance blocked'];
    } else {
      waveFrom = peakD;
      waveTo = REST_D;
      waveCaption = ['Returning to rest', 'signal cleared'];
    }
  }

  const waveMorph = !REDUCED_MOTION && waveFrom !== waveTo;
  const waveAnim = waveMorph
    ? `<animate attributeName="d" values="${waveFrom};${waveTo}" dur="${waveDur}s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.35 0 0.25 1"/>`
    : '';
  let chargeDot = '';
  if (waveMorph) {
    if (currentStage === 3) {
      chargeDot = `<circle r="4" fill="#ffffff" opacity="0.9" filter="url(#syn-glow)">
        <animateMotion dur="2.4s" repeatCount="indefinite"><mpath href="#syn-wave" xlink:href="#syn-wave"/></animateMotion>
        <animate attributeName="opacity" values="0.55;1;0.55" dur="1.6s" repeatCount="indefinite"/>
      </circle>`;
    } else {
      chargeDot = `<circle r="4" fill="#ffffff" opacity="0" filter="url(#syn-glow)">
        <animateMotion dur="${waveDur}s" fill="freeze"><mpath href="#syn-wave" xlink:href="#syn-wave"/></animateMotion>
        <animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.1;0.6;1" dur="${waveDur}s" fill="freeze"/>
      </circle>`;
    }
  }

  const postLabel = getPostsynapticLabel(primaryEffect, currentStage, acts, selectedReceptor?.id || null);
  const playing = playTimer !== null;

  let svgMarkup = `
    <!-- Accent spotlight behind the cleft -->
    <ellipse cx="380" cy="210" rx="340" ry="180" fill="url(#cleft-glow)"/>

    <!-- Presynaptic sending terminal -->
    <g class="syn-in" style="animation-delay:0s">
      <path d="M230 0 V105 C230 165 285 195 380 195 C475 195 530 165 530 105 V0" fill="url(#bouton-fill)" stroke="${CELL}" stroke-width="2.2"/>
      <text x="242" y="26" class="dg-label" text-anchor="start" font-size="12">Sending terminal (Axon bouton)</text>
      ${chem.madeFrom ? `<text x="548" y="30" class="dg-label dim" text-anchor="start" font-size="11.5">Precursor: ${esc(chem.madeFrom)}</text>` : ''}
      <g class="synthesis-hub" opacity="${currentStage === 0 ? '1' : '0.4'}">
        <circle cx="380" cy="54" r="18" fill="rgba(190,200,255,0.06)" stroke="${color}" stroke-width="1.8" stroke-dasharray="3 3">
          ${currentStage === 0 ? '<animateTransform attributeName="transform" type="rotate" values="0 380 54;360 380 54" dur="14s" repeatCount="indefinite"/>' : ''}
        </circle>
        <text x="380" y="58" class="dg-label" text-anchor="middle" font-size="10" fill="${color}">Enzyme</text>
      </g>
      ${(currentStage === 0 && acts === 'precursor') ? `
        <g class="precursor-boost-badge">
          <rect x="285" y="82" width="190" height="22" rx="5.5" fill="rgba(255,207,107,0.22)" stroke="#ffcf6b" stroke-width="1.3"/>
          <text x="380" y="97" text-anchor="middle" font-size="10.5" font-weight="700" fill="#ffcf6b">BOOSTED BY ${esc(drug.name.toUpperCase())}</text>
        </g>` : ''}
    </g>

    <!-- Cleft scale callout -->
    <g class="syn-in" style="animation-delay:0.04s">
      <line x1="570" y1="202" x2="570" y2="278" stroke="rgba(190,200,255,0.4)" stroke-width="1.4" />
      <line x1="564" y1="202" x2="576" y2="202" stroke="rgba(190,200,255,0.4)" stroke-width="1.4" />
      <line x1="564" y1="278" x2="576" y2="278" stroke="rgba(190,200,255,0.4)" stroke-width="1.4" />
      <text x="584" y="244" class="dg-label" text-anchor="start" font-size="11.5">Synaptic cleft (~20 nm)</text>
    </g>

    <!-- Components -->
    <g class="syn-in" style="animation-delay:0.08s">
      ${transporterElement}
      ${enzymeElement}
      ${astrocyteElement}
      ${bloodElement}
      ${precursorDots.join('')}
    </g>
    <g class="syn-in" style="animation-delay:0.12s">
      ${vesicleElements}
    </g>
    <g class="syn-in" style="animation-delay:0.16s">
      ${spikeElements}
      ${moleculeElements.join('')}
    </g>

    <!-- Postsynaptic receiving spine -->
    <g class="syn-in" style="animation-delay:0.06s">
      <path d="M110 285 C250 280 510 280 650 285 V370 C650 420 550 440 380 440 C210 440 110 420 110 370 Z" fill="url(#spine-fill)" stroke="${CELL}" stroke-width="2.2"/>
    </g>
    <g class="syn-in" style="animation-delay:0.2s">
      ${receptorElements}
    </g>

    <!-- Postsynaptic response waveform trace -->
    <g class="post-trace syn-in" style="animation-delay:0.24s">
      <line x1="220" y1="368" x2="540" y2="368" stroke="rgba(255,207,107,0.22)" stroke-width="1.1" stroke-dasharray="4 4"/>
      <text x="212" y="371" text-anchor="end" class="dg-label dim" font-size="9.5" fill="rgba(255,207,107,0.68)">Threshold</text>
      <line x1="220" y1="402" x2="540" y2="402" stroke="rgba(190,200,255,0.14)" stroke-width="1.2" stroke-dasharray="3 3"/>
      <text x="212" y="405" text-anchor="end" class="dg-label dim" font-size="9.5">Resting</text>
      <path id="syn-wave" d="${waveTo}" pathLength="100" fill="none" stroke="${waveColor}" stroke-width="2.8" stroke-linecap="round" filter="url(#syn-glow)">${waveAnim}</path>
      ${chargeDot}
      <text x="380" y="426" text-anchor="middle" class="dg-label dim" font-size="11">Postsynaptic membrane potential${(currentStage === 3 && activeReceptor) ? ` · via ${esc(activeReceptor.id)}` : ''}</text>
      <text x="548" y="390" text-anchor="start" class="dg-label" font-size="11" font-weight="700" fill="${waveColor}">${esc(waveCaption[0])}</text>
      <text x="548" y="404" text-anchor="start" class="dg-label dim" font-size="10" fill="var(--ink-3)">${esc(waveCaption[1])}</text>
    </g>
  `;
  if (REDUCED_MOTION) svgMarkup = stripAnimation(svgMarkup);

  return `<div class="synapse-theater" data-chem="${esc(chem.id)}">
    <!-- Top HUD zone -->
    <header class="syn-hud-top">
      <div class="syn-context">
        <a class="syn-back-brain" href="#/chem/${esc(chem.id)}/overview" title="Return to 3D brain view">
          &larr; 3D Brain
        </a>
        <span class="syn-scale-pill">Synaptic Cleft &middot; ~20 nm scale</span>
      </div>
      <div class="syn-hud-meters">
        <span class="gap-meter"><i class="gap-dot"></i> In the gap: <strong class="gap-count">${gapCount}</strong> molecules</span>
        <span class="post-meter">${esc(postLabel)}</span>
      </div>
    </header>

    <div class="syn-theater-body">
      <!-- Center Widescreen SVG (760x440) -->
    <svg class="synapse-svg" viewBox="0 0 760 440" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Synapse stage: ${STAGES[currentStage].label}">
      <defs>
        <filter id="syn-glow" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="bouton-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(190, 200, 255, 0.16)" />
          <stop offset="100%" stop-color="rgba(190, 200, 255, 0.04)" />
        </linearGradient>
        <linearGradient id="spine-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(190, 200, 255, 0.06)" />
          <stop offset="100%" stop-color="rgba(190, 200, 255, 0.14)" />
        </linearGradient>
        <radialGradient id="cleft-glow">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.16" />
          <stop offset="55%" stop-color="${color}" stop-opacity="0.05" />
          <stop offset="100%" stop-color="${color}" stop-opacity="0" />
        </radialGradient>
      </defs>

      ${svgMarkup}
    </svg>

      <!-- Right Control & Narrative Panel -->
      <div class="syn-sidebar-pane">
        <!-- Stage player (prev/play/next + progress track) -->
        <div class="player syn-player" role="group" aria-label="Synapse stage player">
          <button class="pl-btn" data-act="prev-stage" ${currentStage === 0 ? 'disabled' : ''} aria-label="Previous stage">${icon('prev', 18)}</button>
          <button class="pl-btn pl-play" data-play-stepper aria-pressed="${playing ? 'true' : 'false'}">${icon(playing ? 'pause' : 'play', 16)}<span>${playing ? 'Pause' : 'Play cycle'}</span></button>
          <button class="pl-btn" data-act="next-stage" ${currentStage === 4 ? 'disabled' : ''} aria-label="Next stage">${icon('next', 18)}</button>
          <div class="pl-track">${STAGES.map((st, i) => `<button type="button" class="pl-track-dot ${i < currentStage ? 'done' : i === currentStage ? 'on' : ''}${playing && i === currentStage ? ' is-ticking' : ''}" data-stage="${i}" title="Step ${i + 1}: ${esc(st.title)}" aria-label="Step ${i + 1}: ${esc(st.title)}"${i === currentStage ? ' aria-current="step"' : ''}>${drug && i === drugStepIdx ? '<i class="drug-stage-dot" title="Drug target step"></i>' : ''}</button>`).join('')}</div>
        </div>

        <!-- Stage list (pathway tour pattern) -->
        <ol class="steps syn-steps" aria-label="Stages of one signal">
        ${STAGES.map((st, i) => {
          const isOn = i === currentStage;
          const isDrugStep = drug && i === drugStepIdx;
          const drugCard = isDrugStep ? `<div class="syn-drug-card">
            <div class="syn-drug-head">
              <span class="syn-drug-name"><i class="drug-stage-dot"></i>${esc(drug.name)} acts here</span>
              <span class="syn-drug-target">Target: ${esc(drug.target)}</span>
            </div>
            <p class="syn-drug-note">${esc(getDrugStageNote(drug))}</p>
            <div class="syn-drug-controls">
              <div class="drug-mode-toggle" role="group" aria-label="Drug condition">
                <button class="drug-toggle-btn ${!isDrugActive ? 'is-on' : ''}" data-drug-mode="normal" aria-pressed="${!isDrugActive ? 'true' : 'false'}">Normal</button>
                <button class="drug-toggle-btn ${isDrugActive ? 'is-on' : ''}" data-drug-mode="active" aria-pressed="${isDrugActive ? 'true' : 'false'}">With ${esc(drug.name)}</button>
              </div>
              <a class="drug-clear" href="#/chem/${esc(chem.id)}/${tab || 'synapse'}" title="Remove drug simulation">Clear drug</a>
            </div>
          </div>` : '';
          const recChips = (i === 3 && receptors.length) ? `<div class="chips syn-step-chips">
            ${receptors.map((r) => {
              const effWord = { excite: 'Excites', inhibit: 'Quiets', modulate: 'Tunes' }[r.effect] || r.effect;
              return `<button type="button" class="chip ${highlightedReceptor === r.id ? 'is-on' : ''}" data-receptor-chip="${esc(r.id)}" aria-pressed="${highlightedReceptor === r.id ? 'true' : 'false'}" style="--c:${color}"><i class="dot"></i>${esc(r.id)} <span class="chip-sub">${esc(effWord)}</span></button>`;
            }).join('')}
          </div>
          ${selectedReceptor ? `<div class="syn-rec-readout">
            <div class="syn-rec-readout-head">
              <span class="syn-rec-readout-name">${esc(selectedReceptor.id)} <span class="receptor-family">(${esc(selectedReceptor.family)})</span></span>
              <span class="badge badge-${selectedReceptor.effect}">${esc(({ excite: 'Excites', inhibit: 'Quiets', modulate: 'Tunes' }[selectedReceptor.effect] || selectedReceptor.effect) + (selectedReceptor.flux ? ` · ${selectedReceptor.flux}` : ''))}</span>
            </div>
            <p class="syn-rec-readout-mech">${esc(describeReceptorMechanism(selectedReceptor))}</p>
          </div>` : ''}` : '';
          return `<li class="step ${isOn ? 'is-on' : ''} ${i < currentStage ? 'is-done' : ''}">
            <button type="button" class="step-head" data-stage="${i}"${isOn ? ' aria-current="step"' : ''}>
              <span class="step-n">${i + 1}</span>
              <span class="step-title">${esc(st.title)}${isDrugStep ? '<i class="drug-stage-dot" title="Drug acts here"></i>' : ''}</span>
            </button>
            ${isOn ? `<div class="step-body syn-step-body" aria-live="polite">
              <p class="syn-step-text">${fmt(captions[i])}</p>
              ${drugCard}
              ${recChips}
            </div>` : ''}
          </li>`;
        }).join('')}
      </ol>
      </div>
    </div>
  </div>`;
}
