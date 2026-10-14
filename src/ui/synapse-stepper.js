import { esc, fmt } from './format.js';

const CELL = 'rgba(205, 213, 255, 0.3)';

export const STAGES = [
  { id: 0, key: 'made', short: '1. Made', label: '1. Synthesis' },
  { id: 1, key: 'packed', short: '2. Packed', label: '2. Vesicle Loading' },
  { id: 2, key: 'released', short: '3. Released', label: '3. Vesicle Fusion' },
  { id: 3, key: 'binds', short: '4. Binds', label: '4. Receptor Binding' },
  { id: 4, key: 'cleared', short: '5. Cleared', label: '5. Signal Clearance' },
];

export function stageForDrug(drug) {
  if (!drug || !drug.acts) return 0;
  switch (drug.acts) {
    case 'precursor': return 0;      // 1. Made
    case 'release':
    case 'release-block': return 2;  // 3. Released
    case 'receptor-block':
    case 'receptor-mimic':
    case 'boost-receptor': return 3; // 4. Binds
    case 'reuptake-block':
    case 'enzyme-block': return 4;   // 5. Cleared
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
  }, 2600);
  if (onStep) onStep(activeStage, true);
  return true;
}

function getPostsynapticLabel(effect, stage, acts) {
  if (stage === 0 || stage === 1) return 'Receiving cell: Baseline resting';
  if (stage === 2) {
    if (acts === 'release-block') return 'Receiving cell: Silent (release blocked)';
    if (acts === 'release') return 'Receiving cell: Flooded with transmitter';
    return 'Receiving cell: Signal arriving';
  }
  if (stage === 3) {
    if (acts === 'receptor-block') return 'Receiving cell: Blocked (quiet)';
    if (acts === 'boost-receptor') return 'Receiving cell: Amplified response';
    if (acts === 'receptor-mimic') {
      return effect === 'inhibit' ? 'Receiving cell: Deep inhibition' : 'Receiving cell: Strong activation';
    }
    if (effect === 'excite') return 'Receiving cell: Strong excitation';
    if (effect === 'inhibit') return 'Receiving cell: Quieted (inhibition)';
    return 'Receiving cell: Tuned (modulation)';
  }
  if (stage === 4) {
    if (acts === 'reuptake-block') return 'Receiving cell: Extended firing (prolonged signal)';
    if (acts === 'enzyme-block') return 'Receiving cell: Trapped signal (sustained excitation)';
    return 'Receiving cell: Resetting to baseline';
  }
  return 'Receiving cell: Baseline resting';
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
  const primaryEffect = receptors[0]?.effect || 'modulate';

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

  // Caption for active stage
  let stageCaption = '';
  if (currentStage === 0) {
    stageCaption = life.made || 'Molecules are synthesized from chemical precursors inside the sending terminal.';
  } else if (currentStage === 1) {
    stageCaption = life.packed || 'Transporter proteins pump neurotransmitter molecules into protective vesicles.';
  } else if (currentStage === 2) {
    stageCaption = life.released || 'An incoming action potential opens voltage-gated calcium channels, prompting vesicles to fuse and release molecules into the cleft.';
  } else if (currentStage === 3) {
    stageCaption = life.binds || 'Molecules diffuse across the 20 nm synaptic cleft and bind to receptor proteins on the receiving cell membrane.';
  } else if (currentStage === 4) {
    stageCaption = life.cleared || 'Molecules are cleared from the cleft by reuptake transporters, enzymes, astrocytes, or capillary blood to reset the synapse.';
  }
  if (isDrugActive && stageForDrug(drug) === currentStage) {
    stageCaption += ` ${getDrugStageNote(drug)}`;
  }

  // Drug overlay message with toggle
  let drugBanner = '';
  if (drug) {
    drugBanner = `<div class="stepper-drug-banner">
      <div class="drug-banner-main">
        <span class="drug-tag">Drug active: <strong>${esc(drug.name)}</strong> (Target: ${esc(drug.target)})</span>
        <span class="drug-note">${fmt(drug.text)}</span>
      </div>
      <div class="drug-mode-row">
        <div class="drug-mode-toggle" role="group" aria-label="Drug condition">
          <button class="drug-toggle-btn ${!isDrugActive ? 'is-on' : ''}" data-drug-mode="normal">Normal</button>
          <button class="drug-toggle-btn ${isDrugActive ? 'is-on' : ''}" data-drug-mode="active">With ${esc(drug.name)}</button>
        </div>
        <a class="drug-clear" href="#/chem/${esc(chem.id)}/${tab || 'synapse'}" title="Remove drug simulation">Clear drug</a>
      </div>
    </div>`;
  }

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
      precursorDots.push(`<circle cx="${startX}" cy="${startY}" r="3.2" fill="#8a95b5">
        <animate attributeName="cx" values="${startX};380;${340 + (i * 29) % 80}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite" />
        <animate attributeName="cy" values="${startY};58;${88 + (i * 17) % 36}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite" />
        <animate attributeName="fill" values="#8a95b5;#8a95b5;${color};${color}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite" />
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
    const packingParticle = currentStage === 1 ? `
      <circle cx="${vx - 22}" cy="${vy - 16}" r="2.8" fill="${color}">
        <animate attributeName="cx" values="${vx - 22};${vx}" dur="1.5s" begin="${(i * 0.16).toFixed(2)}s" repeatCount="indefinite"/>
        <animate attributeName="cy" values="${vy - 16};${vy}" dur="1.5s" begin="${(i * 0.16).toFixed(2)}s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.2;0.8;1" dur="1.5s" begin="${(i * 0.16).toFixed(2)}s" repeatCount="indefinite"/>
      </circle>` : '';

    return `<g class="syn-vesicle">
      <circle cx="${vx}" cy="${vy}" r="13" fill="rgba(190,200,255,0.04)" stroke="${color}" stroke-width="1.6" opacity="0.9">
        <animate attributeName="r" values="13;14.2;13" dur="${2 + i * 0.25}s" repeatCount="indefinite"/>
      </circle>
      <!-- Pump tick on vesicle edge -->
      <line x1="${vx - 13}" y1="${vy}" x2="${vx - 9}" y2="${vy}" stroke="${CELL}" stroke-width="1.4" />
      <!-- Molecule cluster inside -->
      <circle cx="${vx - 3.5}" cy="${vy - 3.5}" r="2.2" fill="${color}" opacity="${currentStage === 0 ? '0.25' : '0.9'}"/>
      <circle cx="${vx + 3.5}" cy="${vy - 3.5}" r="2.2" fill="${color}" opacity="${currentStage === 0 ? '0.25' : '0.9'}"/>
      <circle cx="${vx - 3.5}" cy="${vy + 3.5}" r="2.2" fill="${color}" opacity="${currentStage === 0 ? '0.25' : '0.9'}"/>
      <circle cx="${vx + 3.5}" cy="${vy + 3.5}" r="2.2" fill="${color}" opacity="${currentStage === 0 ? '0.25' : '0.9'}"/>
      ${packingParticle}
    </g>`;
  }).join('');

  // Stage 2: Symmetrical depolarization wave + Calcium influx sparks
  let spikeElements = '';
  if (currentStage === 2) {
    spikeElements = `
      <!-- Symmetrical action potential spikes down both bouton walls -->
      <circle cx="230" cy="0" r="5" fill="#ffffff" filter="url(#syn-glow)">
        <animate attributeName="cy" values="0;135" dur="1.3s" repeatCount="indefinite" calcMode="linear"/>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="1.3s" repeatCount="indefinite"/>
      </circle>
      <circle cx="530" cy="0" r="5" fill="#ffffff" filter="url(#syn-glow)">
        <animate attributeName="cy" values="0;135" dur="1.3s" repeatCount="indefinite" calcMode="linear"/>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="1.3s" repeatCount="indefinite"/>
      </circle>

      <!-- Calcium influx on left flank -->
      <g class="ca-gate left">
        <rect x="236" y="138" width="10" height="20" rx="3" fill="rgba(107,228,255,0.22)" stroke="#6be4ff" stroke-width="1.2"/>
        <text x="216" y="152" font-size="10" font-weight="600" fill="#6be4ff" text-anchor="end">Ca²⁺ in</text>
        <circle cx="228" cy="148" r="3.2" fill="#6be4ff" filter="url(#syn-glow)">
          <animate attributeName="cx" values="222;272" dur="0.9s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="148;162" dur="0.9s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.2;1" dur="0.9s" repeatCount="indefinite"/>
        </circle>
      </g>

      <!-- Calcium influx on right flank -->
      <g class="ca-gate right">
        <rect x="514" y="138" width="10" height="20" rx="3" fill="rgba(107,228,255,0.22)" stroke="#6be4ff" stroke-width="1.2"/>
        <text x="544" y="152" font-size="10" font-weight="600" fill="#6be4ff" text-anchor="start">Ca²⁺ in</text>
        <circle cx="532" cy="148" r="3.2" fill="#6be4ff" filter="url(#syn-glow)">
          <animate attributeName="cx" values="538;488" dur="0.9s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="148;162" dur="0.9s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.2;1" dur="0.9s" repeatCount="indefinite"/>
        </circle>
      </g>
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
      moleculeElements.push(`<circle cx="${x0}" cy="195" r="3.2" fill="${color}" filter="url(#syn-glow)">
        <animate attributeName="cx" values="${x0};${x1}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>
        <animate attributeName="cy" values="195;275" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>
      </circle>`);
    }
  } else if (currentStage === 3) {
    const n = receptors.length || 1;
    receptors.forEach((r, i) => {
      const rx = 380 + (i - (n - 1) / 2) * 110;
      if (acts === 'receptor-block') {
        moleculeElements.push(`<circle cx="${rx}" cy="250" r="3.4" fill="${color}">
          <animate attributeName="cy" values="240;268;242" dur="1.7s" begin="${i * 0.25}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0;1;0.3" dur="1.7s" begin="${i * 0.25}s" repeatCount="indefinite"/>
        </circle>`);
      } else if (acts === 'receptor-mimic') {
        moleculeElements.push(`<circle cx="${rx}" cy="276" r="3.6" fill="#ffffff" filter="url(#syn-glow)">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.8s" repeatCount="indefinite"/>
        </circle>`);
      } else {
        moleculeElements.push(`<circle cx="${rx}" cy="276" r="3.4" fill="${color}" filter="url(#syn-glow)">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="1.8s" begin="${i * 0.3}s" repeatCount="indefinite"/>
        </circle>`);
      }
    });
  } else if (currentStage === 4) {
    if (clearedBy === 'reuptake') {
      const dur = acts === 'reuptake-block' ? 3.5 : 1.7;
      for (let i = 0; i < 10; i++) {
        const x0 = 240 + i * 32;
        if (acts === 'reuptake-block') {
          moleculeElements.push(`<circle cx="${x0}" cy="245" r="3.2" fill="${color}">
            <animate attributeName="cx" values="${x0};255;${x0 + 10}" dur="${dur}s" begin="${(i * 0.2).toFixed(2)}s" repeatCount="indefinite"/>
            <animate attributeName="cy" values="245;165;248" dur="${dur}s" begin="${(i * 0.2).toFixed(2)}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="1;1;0.8" dur="${dur}s" begin="${(i * 0.2).toFixed(2)}s" repeatCount="indefinite"/>
          </circle>`);
        } else {
          moleculeElements.push(`<circle cx="${x0}" cy="245" r="3.0" fill="${color}">
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
          moleculeElements.push(`<circle cx="${x0}" cy="235" r="3.2" fill="${color}">
            <animate attributeName="cy" values="225;245;230" dur="${dur}s" begin="${(i * 0.15).toFixed(2)}s" repeatCount="indefinite"/>
          </circle>`);
        } else {
          moleculeElements.push(`
            <circle cx="${x0}" cy="235" r="3.0" fill="${color}">
              <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.5;0.6" dur="${dur}s" begin="${(i * 0.18).toFixed(2)}s" repeatCount="indefinite"/>
            </circle>
            <circle cx="${x0 - 5}" cy="238" r="2.0" fill="#8087a8">
              <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.55;1" dur="${dur}s" begin="${(i * 0.18).toFixed(2)}s" repeatCount="indefinite"/>
              <animate attributeName="cx" values="${x0};${x0 - 14}" dur="${dur}s" begin="${(i * 0.18).toFixed(2)}s" repeatCount="indefinite"/>
            </circle>
            <circle cx="${x0 + 5}" cy="238" r="2.0" fill="#8087a8">
              <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.55;1" dur="${dur}s" begin="${(i * 0.18).toFixed(2)}s" repeatCount="indefinite"/>
              <animate attributeName="cx" values="${x0};${x0 + 14}" dur="${dur}s" begin="${(i * 0.18).toFixed(2)}s" repeatCount="indefinite"/>
            </circle>`);
        }
      }
    } else if (clearedBy === 'astrocyte') {
      for (let i = 0; i < 10; i++) {
        const x0 = 260 + i * 26;
        moleculeElements.push(`<circle cx="${x0}" cy="240" r="3.0" fill="${color}">
          <animate attributeName="cx" values="${x0};120" dur="2.0s" begin="${(i * 0.2).toFixed(2)}s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="240;235" dur="2.0s" begin="${(i * 0.2).toFixed(2)}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.85;1" dur="2.0s" begin="${(i * 0.2).toFixed(2)}s" repeatCount="indefinite"/>
        </circle>`);
      }
    } else if (clearedBy === 'blood') {
      for (let i = 0; i < 10; i++) {
        const x0 = 240 + i * 26;
        moleculeElements.push(`<circle cx="${x0}" cy="240" r="3.0" fill="${color}">
          <animate attributeName="cx" values="${x0};650" dur="2.2s" begin="${(i * 0.18).toFixed(2)}s" repeatCount="indefinite"/>
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
    const blockerGraphic = isBlocked ? `
      <rect x="240" y="145" width="22" height="24" rx="4" fill="rgba(255,77,109,0.3)" stroke="#ff4d6d" stroke-width="2" filter="url(#syn-glow)"/>
      <line x1="243" y1="148" x2="259" y2="166" stroke="#ff4d6d" stroke-width="2.6" stroke-linecap="round"/>
      <line x1="259" y1="148" x2="243" y2="166" stroke="#ff4d6d" stroke-width="2.6" stroke-linecap="round"/>
      <text x="240" y="136" class="dg-label" text-anchor="middle" font-size="9.5" font-weight="700" fill="#ff4d6d">${esc(drug.target || 'Transporter')} blocked</text>` : '';

    transporterElement = `<g class="transporter">
      <rect x="242" y="148" width="18" height="22" rx="4" fill="rgba(190,200,255,0.18)" stroke="${CELL}" stroke-width="1.4"/>
      <path d="M247 152 v14 M255 152 v14" stroke="rgba(190,200,255,0.45)" stroke-width="1.2"/>
      <text x="236" y="162" class="dg-label dim" text-anchor="end" font-size="10.5">Transporter</text>
      ${blockerGraphic}
    </g>`;
  }

  // 2. Enzyme in cleft
  let enzymeElement = '';
  if (clearedBy === 'enzyme') {
    const isBlocked = acts === 'enzyme-block';
    const positions = [330, 380, 430];
    enzymeElement = `<g class="enzymes-group">
      ${positions.map((ex) => {
        const blockerX = isBlocked ? `
          <circle cx="${ex}" cy="240" r="14" fill="none" stroke="#ff4d6d" stroke-width="2" stroke-dasharray="4 3" filter="url(#syn-glow)"/>
          <line x1="${ex - 7}" y1="233" x2="${ex + 7}" y2="247" stroke="#ff4d6d" stroke-width="2.4" stroke-linecap="round"/>` : '';
        return `
          <circle cx="${ex}" cy="240" r="11" fill="rgba(255,180,100,0.18)" stroke="#ffa36b" stroke-width="1.4"/>
          <text x="${ex}" y="244" text-anchor="middle" font-size="9" fill="#ffa36b" font-weight="600">AChE</text>
          ${blockerX}
        `;
      }).join('')}
      <text x="380" y="266" text-anchor="middle" class="dg-label dim" font-size="10" fill="#ffa36b">
        ${isBlocked ? `Enzyme blocked by ${esc(drug.name)}` : 'Clearing enzymes in cleft'}
      </text>
    </g>`;
  }

  // 3. Astrocyte process on left
  let astrocyteElement = '';
  if (clearedBy === 'astrocyte') {
    astrocyteElement = `<g class="astrocyte">
      <path d="M70 205 L110 215 L145 235 L115 255 L75 265 L95 240 Z" fill="rgba(140,210,255,0.12)" stroke="rgba(140,210,255,0.45)" stroke-width="1.4"/>
      <!-- EAAT transporter slot -->
      <rect x="135" y="228" width="10" height="15" rx="2" fill="rgba(140,210,255,0.3)" stroke="rgba(140,210,255,0.7)" stroke-width="1.2"/>
      <text x="105" y="280" class="dg-label dim" text-anchor="middle" font-size="10.5">Astrocyte glia</text>
    </g>`;
  }

  // 4. Capillary bloodstream on right (for hormones)
  let bloodElement = '';
  if (clearedBy === 'blood') {
    bloodElement = `<g class="capillary-blood">
      <rect x="630" y="195" width="46" height="85" rx="8" fill="rgba(255,107,125,0.1)" stroke="rgba(255,107,125,0.35)" stroke-width="1.4"/>
      <path d="M644 205 v65 M662 205 v65" stroke="rgba(255,107,125,0.25)" stroke-width="1.2" stroke-dasharray="6 4">
        <animate attributeName="stroke-dashoffset" values="0;20" dur="1.8s" repeatCount="indefinite"/>
      </path>
      <text x="653" y="296" class="dg-label dim" text-anchor="middle" font-size="10" fill="#ff6b7d">Capillary blood</text>
    </g>`;
  }

  // Postsynaptic receptors on membrane
  const n = receptors.length || 1;
  const receptorElements = receptors.map((r, i) => {
    const rx = 380 + (i - (n - 1) / 2) * 110;
    const isHi = highlightedReceptor === r.id;
    const isBoosted = currentStage === 3 && acts === 'boost-receptor';
    const isBlocked = currentStage === 3 && acts === 'receptor-block';
    const isAgonist = currentStage === 3 && acts === 'receptor-mimic';

    const glowClass = isBoosted ? 'receptor-boosted' : '';
    const cap = isBlocked ? `
      <rect x="${rx - 14}" y="271" width="28" height="8" rx="3" fill="#ff4d6d" stroke="#ffffff" stroke-width="1.2" filter="url(#syn-glow)"/>
      <text x="${rx}" y="267" text-anchor="middle" font-size="9" font-weight="700" fill="#ff4d6d">Blocked</text>` : '';

    const alloBadge = isBoosted ? `
      <g>
        <rect x="${rx + 16}" y="278" width="34" height="14" rx="3" fill="rgba(255,207,107,0.3)" stroke="#ffcf6b" stroke-width="1.2"/>
        <text x="${rx + 33}" y="289" text-anchor="middle" font-size="8.5" font-weight="700" fill="#ffcf6b">+ALLO</text>
      </g>` : '';

    const downstreamCascade = (currentStage === 3 && !isBlocked) ? `
      <g class="downstream-cascade" opacity="0.8">
        <path d="M${rx} 295 v40" stroke="${color}" stroke-width="1.8" stroke-dasharray="4 3" filter="url(#syn-glow)">
          <animate attributeName="stroke-dashoffset" values="0;-14" dur="0.8s" repeatCount="indefinite"/>
        </path>
      </g>` : '';

    return `<g class="syn-receptor ${isHi ? 'is-hi' : ''} ${glowClass}" data-receptor="${esc(r.id)}" style="cursor: pointer;">
      <!-- Channel silhouette -->
      <path d="M${rx - 15} 285 v-12 h7 v7 h16 v-7 h7 v12" stroke="${color}" stroke-width="1.8" fill="rgba(190,200,255,0.08)"/>
      ${cap}
      ${alloBadge}
      ${downstreamCascade}
      <text x="${rx}" y="318" text-anchor="middle" class="dg-label syn-rec-name" font-size="12" font-weight="600" fill="${color}">${esc(r.id)}</text>
      <text x="${rx}" y="332" text-anchor="middle" class="dg-label dim syn-rec-family" font-size="9.5" fill="var(--ink-3)">${esc({ excite: 'Excites', inhibit: 'Quiets', modulate: 'Tunes' }[r.effect] || r.effect)}</text>
    </g>`;
  }).join('');

  // ---------------------------------------------------------------- Postsynaptic Signal Waveform
  let waveD = 'M220 402 H540';
  let waveColor = '#8890aa';
  if (currentStage === 0 || currentStage === 1) {
    waveD = 'M220 402 Q300 401 380 402 Q460 403 540 402';
    waveColor = 'rgba(190, 200, 255, 0.4)';
  } else if (currentStage === 2) {
    if (acts === 'release-block') {
      waveD = 'M220 402 H540';
      waveColor = 'rgba(190, 200, 255, 0.3)';
    } else {
      waveD = 'M220 402 Q310 402 350 398 Q380 393 410 398 Q450 402 540 402';
      waveColor = color;
    }
  } else if (currentStage === 3) {
    if (acts === 'receptor-block') {
      waveD = 'M220 402 H540';
      waveColor = '#ff4d6d';
    } else if (acts === 'boost-receptor' || (acts === 'receptor-mimic' && primaryEffect === 'excite')) {
      waveD = 'M220 402 Q310 402 345 372 Q380 342 415 372 Q450 402 540 402';
      waveColor = '#ffcf6b';
    } else if (primaryEffect === 'inhibit') {
      waveD = 'M220 402 Q310 402 345 418 Q380 424 415 418 Q450 402 540 402';
      waveColor = '#ff6b7d';
    } else if (primaryEffect === 'excite') {
      waveD = 'M220 402 Q310 402 345 380 Q380 366 415 380 Q450 402 540 402';
      waveColor = '#ffcf6b';
    } else {
      // modulate
      waveD = 'M220 402 Q270 388 320 402 Q380 416 440 402 Q490 390 540 402';
      waveColor = color;
    }
  } else if (currentStage === 4) {
    if (acts === 'reuptake-block' || acts === 'enzyme-block') {
      waveD = 'M220 388 Q300 384 380 388 Q460 386 540 388';
      waveColor = color;
    } else {
      waveD = 'M220 402 Q320 402 380 402 Q440 402 540 402';
      waveColor = 'rgba(190, 200, 255, 0.4)';
    }
  }

  const postLabel = getPostsynapticLabel(primaryEffect, currentStage, acts);

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
        <span class="gap-meter"><i class="gap-dot"></i> In the gap: <strong>${gapCount}</strong> molecules</span>
        <span class="post-meter">${esc(postLabel)}</span>
      </div>
    </header>

    ${drugBanner}

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
          <stop offset="0%" stop-color="rgba(205, 213, 255, 0.08)" />
          <stop offset="100%" stop-color="rgba(205, 213, 255, 0.02)" />
        </linearGradient>
        <linearGradient id="spine-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(205, 213, 255, 0.03)" />
          <stop offset="100%" stop-color="rgba(205, 213, 255, 0.07)" />
        </linearGradient>
      </defs>

      <!-- Presynaptic sending terminal -->
      <path d="M230 0 V105 C230 165 285 195 380 195 C475 195 530 165 530 105 V0" fill="url(#bouton-fill)" stroke="${CELL}" stroke-width="1.6"/>
      <text x="240" y="24" class="dg-label dim" text-anchor="start">Sending terminal (Axon bouton)</text>
      
      <!-- Stage 0: Catalytic synthesis ring & Precursor label -->
      ${chem.madeFrom ? `<text x="380" y="24" class="dg-label dim" text-anchor="middle">Precursor: ${esc(chem.madeFrom)}</text>` : ''}
      <g class="synthesis-hub" opacity="${currentStage === 0 ? '1' : '0.4'}">
        <circle cx="380" cy="54" r="16" fill="rgba(190,200,255,0.06)" stroke="${color}" stroke-width="1.4" stroke-dasharray="3 3"/>
        <text x="380" y="58" class="dg-label" text-anchor="middle" font-size="9" fill="${color}">Enzyme</text>
      </g>
      ${(currentStage === 0 && acts === 'precursor') ? `
        <g class="precursor-boost-badge">
          <rect x="295" y="80" width="170" height="20" rx="5" fill="rgba(255,207,107,0.22)" stroke="#ffcf6b" stroke-width="1.2"/>
          <text x="380" y="94" text-anchor="middle" font-size="9.5" font-weight="700" fill="#ffcf6b">BOOSTED BY ${esc(drug.name.toUpperCase())}</text>
        </g>` : ''}

      <!-- Cleft scale callout -->
      <line x1="565" y1="202" x2="565" y2="278" stroke="rgba(190,200,255,0.28)" stroke-width="1.2" />
      <line x1="560" y1="202" x2="570" y2="202" stroke="rgba(190,200,255,0.28)" stroke-width="1.2" />
      <line x1="560" y1="278" x2="570" y2="278" stroke="rgba(190,200,255,0.28)" stroke-width="1.2" />
      <text x="578" y="244" class="dg-label dim" text-anchor="start" font-size="10.5">Synaptic cleft (~20 nm)</text>

      <!-- Components -->
      ${transporterElement}
      ${enzymeElement}
      ${astrocyteElement}
      ${bloodElement}
      ${precursorDots.join('')}
      ${vesicleElements}
      ${spikeElements}
      ${moleculeElements.join('')}

      <!-- Postsynaptic receiving spine -->
      <path d="M110 285 C250 280 510 280 650 285 V370 C650 420 550 440 380 440 C210 440 110 420 110 370 Z" fill="url(#spine-fill)" stroke="${CELL}" stroke-width="1.6"/>
      ${receptorElements}

      <!-- Postsynaptic response waveform trace -->
      <g class="post-trace">
        <line x1="220" y1="402" x2="540" y2="402" stroke="rgba(190,200,255,0.12)" stroke-width="1" stroke-dasharray="3 3"/>
        <path d="${waveD}" fill="none" stroke="${waveColor}" stroke-width="2.2" stroke-linecap="round" filter="url(#syn-glow)"/>
        <text x="380" y="424" text-anchor="middle" class="dg-label dim" font-size="10.5">Postsynaptic membrane potential</text>
      </g>
    </svg>

    <!-- Bottom HUD zone -->
    <footer class="syn-hud-bottom">
      ${tab === 'medicine' ? `<p class="fig-caption stepper-caption">${fmt(stageCaption)}</p>` : ''}

      <div class="stepper-controls" role="group" aria-label="Synapse stages">
        <div class="stepper-buttons">
          ${STAGES.map((st) => {
            const hasDrugDot = isDrugActive && stageForDrug(drug) === st.id;
            return `
              <button class="step-btn ${st.id === currentStage ? 'is-on' : ''}" data-stage="${st.id}" aria-current="${st.id === currentStage ? 'step' : 'false'}">
                ${st.short}
                ${hasDrugDot ? '<i class="drug-stage-dot" title="Drug target stage"></i>' : ''}
              </button>
            `;
          }).join('')}
        </div>
        <button class="stepper-play-btn ${playTimer ? 'is-playing' : ''}" data-play-stepper>
          ${playTimer ? 'Pause' : 'Play cycle'}
        </button>
      </div>
    </footer>
  </div>`;
}
