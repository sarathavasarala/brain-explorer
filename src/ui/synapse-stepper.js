// Synapse lifecycle stepper: Made, Packed, Released, Binds, Cleared, plus drug action overlays.
import { esc } from './format.js';

const CELL = 'rgba(205, 213, 255, 0.3)';

export const STAGES = [
  { id: 0, key: 'made', label: '1. Made' },
  { id: 1, key: 'packed', label: '2. Packed' },
  { id: 2, key: 'released', label: '3. Released' },
  { id: 3, key: 'binds', label: '4. Binds' },
  { id: 4, key: 'cleared', label: '5. Cleared' },
];

let activeStage = 0;
let playTimer = null;
let drugModeEnabled = true;

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
  }, 2500);
  if (onStep) onStep(activeStage, true);
  return true;
}

export function renderSynapseStepper(chem, { stage = activeStage, drugId = null } = {}) {
  const currentStage = Math.min(Math.max(Number(stage) || 0, 0), 4);
  activeStage = currentStage;
  const color = chem.color || '#b98cff';
  const life = chem.life || {};
  const clearedBy = life.clearedBy || 'reuptake';
  const receptors = (chem.receptors || []).slice(0, 3);
  const drug = drugId ? (chem.drugs || []).find((d) => d.id === drugId) : null;
  const isDrugActive = !!(drug && drugModeEnabled);
  const acts = isDrugActive ? drug.acts : null;

  // Live molecule counter in synaptic gap
  let gapCount = 0;
  if (currentStage === 0 || currentStage === 1) {
    gapCount = 0;
  } else if (currentStage === 2) {
    if (acts === 'release-block') gapCount = 0;
    else if (acts === 'release') gapCount = 22;
    else gapCount = 14;
  } else if (currentStage === 3) {
    if (acts === 'receptor-block') gapCount = 12;
    else if (acts === 'receptor-mimic') gapCount = 10;
    else gapCount = 8;
  } else if (currentStage === 4) {
    if (acts === 'reuptake-block') gapCount = 12;
    else if (acts === 'enzyme-block') gapCount = 10;
    else gapCount = 0;
  }

  // Caption for active stage
  let stageCaption = '';
  if (currentStage === 0) stageCaption = life.made || 'Molecules are synthesized from chemical precursors inside the terminal.';
  else if (currentStage === 1) stageCaption = life.packed || 'Transporter proteins pump molecules into protective membrane vesicles.';
  else if (currentStage === 2) stageCaption = life.released || 'An electrical spike triggers vesicle fusion, releasing molecules into the cleft.';
  else if (currentStage === 3) stageCaption = life.binds || 'Molecules diffuse across the cleft and bind to receptor targets.';
  else if (currentStage === 4) stageCaption = life.cleared || 'Molecules are cleared from the cleft by reuptake or enzyme breakdown.';

  // Drug overlay message with toggle
  let drugBanner = '';
  if (drug) {
    drugBanner = `<div class="stepper-drug-banner">
      <div class="drug-banner-main">
        <span class="drug-tag">Drug active: <strong>${esc(drug.name)}</strong></span>
        <span class="drug-note">${esc(drug.text)}</span>
      </div>
      <div class="drug-mode-row">
        <div class="drug-mode-toggle" role="group" aria-label="Drug condition">
          <button class="drug-toggle-btn ${!isDrugActive ? 'is-on' : ''}" data-drug-mode="normal">Normal</button>
          <button class="drug-toggle-btn ${isDrugActive ? 'is-on' : ''}" data-drug-mode="active">With ${esc(drug.name)}</button>
        </div>
        <a class="drug-clear" href="#/chem/${chem.id}/synapse" title="Remove drug overlay">Remove drug</a>
      </div>
    </div>`;
  }

  // Precursor dots (Stage 0)
  const precursorCount = acts === 'precursor' ? 16 : 8;
  const precursorDots = [];
  for (let i = 0; i < precursorCount; i++) {
    const px = 180 + (i % 5) * 20 + ((i * 7) % 11);
    const py = 22 + Math.floor(i / 5) * 16 + ((i * 3) % 8);
    const baseColor = currentStage === 0 ? '#7a86a8' : color;
    precursorDots.push(`<circle cx="${px}" cy="${py}" r="3" fill="${baseColor}">
      ${currentStage === 0 ? `<animate attributeName="fill" values="#7a86a8;${color};${color}" dur="2s" begin="${(i * 0.18).toFixed(2)}s" repeatCount="indefinite"/>` : ''}
    </circle>`);
  }

  // Vesicle centres in 440x270 coordinate space
  const vesicles = [
    [195, 46], [220, 36], [245, 48],
    [180, 74], [210, 78], [240, 76], [265, 72],
    [200, 102], [235, 102]
  ];

  // Vesicles rendering
  const vesicleElements = vesicles.map(([vx, vy], i) => {
    const packingParticle = currentStage === 1 ? `
      <circle cx="${vx - 16}" cy="${vy - 14}" r="2.4" fill="${color}">
        <animate attributeName="cx" values="${vx - 16};${vx}" dur="1.6s" begin="${(i * 0.18).toFixed(2)}s" repeatCount="indefinite"/>
        <animate attributeName="cy" values="${vy - 14};${vy}" dur="1.6s" begin="${(i * 0.18).toFixed(2)}s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0;1;1;0" dur="1.6s" begin="${(i * 0.18).toFixed(2)}s" repeatCount="indefinite"/>
      </circle>` : '';

    return `<g>
      <circle cx="${vx}" cy="${vy}" r="7.5" fill="none" stroke="${color}" stroke-width="1.3" opacity=".85">
        <animate attributeName="r" values="7.5;8.2;7.5" dur="${2 + i * 0.2}s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${vx}" cy="${vy}" r="2.6" fill="${color}" opacity="${currentStage === 0 ? '.25' : '.85'}"/>
      ${packingParticle}
    </g>`;
  }).join('');

  // Stage 2: Spike running down terminal
  let spikeElement = '';
  if (currentStage === 2 && acts !== 'release') {
    spikeElement = `<circle cx="220" cy="0" r="4.5" fill="#ffffff" class="stepper-spike">
      <animate attributeName="cx" values="220;220" dur="1.4s" repeatCount="indefinite"/>
      <animate attributeName="cy" values="0;105" dur="1.4s" repeatCount="indefinite" calcMode="linear"/>
      <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="1.4s" repeatCount="indefinite"/>
    </circle>`;
  }

  // Molecules in cleft / gap
  const moleculeElements = [];
  if (currentStage === 2) {
    const count = acts === 'release-block' ? 0 : (acts === 'release' ? 22 : 14);
    for (let i = 0; i < count; i++) {
      const x0 = 195 + (i % 7) * 8 - 4;
      const x1 = 120 + (i * 47) % 200;
      const dur = acts === 'release' ? 1.2 : 1.7;
      const begin = (i * 0.12).toFixed(2);
      moleculeElements.push(`<circle cx="${x0}" cy="118" r="2.8" fill="${color}">
        <animate attributeName="cx" values="${x0};${x1}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>
        <animate attributeName="cy" values="118;162" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>
      </circle>`);
    }
  } else if (currentStage === 3) {
    receptors.forEach((r, i) => {
      const n = receptors.length;
      const rx = 220 + (i - (n - 1) / 2) * 100;
      if (acts === 'receptor-block') {
        moleculeElements.push(`<circle cx="${rx}" cy="148" r="3" fill="${color}">
          <animate attributeName="cy" values="140;164;136" dur="1.8s" begin="${i * 0.3}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0;1;1;0" dur="1.8s" begin="${i * 0.3}s" repeatCount="indefinite"/>
        </circle>`);
      } else if (acts === 'receptor-mimic') {
        moleculeElements.push(`<circle cx="${rx}" cy="172" r="3" fill="#ffffff" class="stepper-mol-white">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite"/>
        </circle>`);
      } else {
        moleculeElements.push(`<circle cx="${rx}" cy="172" r="2.8" fill="${color}">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" begin="${i * 0.4}s" repeatCount="indefinite"/>
        </circle>`);
      }
    });
  } else if (currentStage === 4) {
    if (clearedBy === 'reuptake') {
      const dur = acts === 'reuptake-block' ? 4.0 : 1.8;
      for (let i = 0; i < 8; i++) {
        const x0 = 165 + i * 18;
        if (acts === 'reuptake-block') {
          moleculeElements.push(`<circle cx="${x0}" cy="158" r="2.8" fill="${color}">
            <animate attributeName="cx" values="${x0};144;${x0 + 10}" dur="${dur}s" begin="${(i * 0.25).toFixed(2)}s" repeatCount="indefinite"/>
            <animate attributeName="cy" values="158;95;152" dur="${dur}s" begin="${(i * 0.25).toFixed(2)}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="1;1;1;0.6" dur="${dur}s" begin="${(i * 0.25).toFixed(2)}s" repeatCount="indefinite"/>
          </circle>`);
        } else {
          moleculeElements.push(`<circle cx="${x0}" cy="158" r="2.6" fill="${color}">
            <animate attributeName="cx" values="${x0};144;144" dur="${dur}s" begin="${(i * 0.22).toFixed(2)}s" repeatCount="indefinite"/>
            <animate attributeName="cy" values="158;95;60" dur="${dur}s" begin="${(i * 0.22).toFixed(2)}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="1;1;0" keyTimes="0;.85;1" dur="${dur}s" begin="${(i * 0.22).toFixed(2)}s" repeatCount="indefinite"/>
          </circle>`);
        }
      }
    } else if (clearedBy === 'enzyme') {
      const dur = acts === 'enzyme-block' ? 4.0 : 1.8;
      for (let i = 0; i < 7; i++) {
        const x0 = 168 + i * 16;
        if (acts === 'enzyme-block') {
          moleculeElements.push(`<circle cx="${x0}" cy="148" r="2.8" fill="${color}">
            <animate attributeName="cy" values="140;158;148" dur="${dur}s" repeatCount="indefinite"/>
          </circle>`);
        } else {
          moleculeElements.push(`
            <circle cx="${x0}" cy="148" r="2.6" fill="${color}">
              <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.5;0.6" dur="${dur}s" begin="${(i * 0.2).toFixed(2)}s" repeatCount="indefinite"/>
            </circle>
            <circle cx="${x0 - 4}" cy="150" r="1.8" fill="#8087a8">
              <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.55;1" dur="${dur}s" begin="${(i * 0.2).toFixed(2)}s" repeatCount="indefinite"/>
              <animate attributeName="cx" values="${x0};${x0 - 10}" dur="${dur}s" begin="${(i * 0.2).toFixed(2)}s" repeatCount="indefinite"/>
            </circle>
            <circle cx="${x0 + 4}" cy="150" r="1.8" fill="#8087a8">
              <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.55;1" dur="${dur}s" begin="${(i * 0.2).toFixed(2)}s" repeatCount="indefinite"/>
              <animate attributeName="cx" values="${x0};${x0 + 10}" dur="${dur}s" begin="${(i * 0.2).toFixed(2)}s" repeatCount="indefinite"/>
            </circle>`);
        }
      }
    } else if (clearedBy === 'astrocyte') {
      for (let i = 0; i < 8; i++) {
        const x0 = 165 + i * 18;
        moleculeElements.push(`<circle cx="${x0}" cy="155" r="2.6" fill="${color}">
          <animate attributeName="cx" values="${x0};88" dur="2.2s" begin="${(i * 0.24).toFixed(2)}s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="155;142" dur="2.2s" begin="${(i * 0.24).toFixed(2)}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="1;1;0" keyTimes="0;.85;1" dur="2.2s" begin="${(i * 0.24).toFixed(2)}s" repeatCount="indefinite"/>
        </circle>`);
      }
    }
  }

  // Transporter on presynaptic membrane (for reuptake)
  let transporterElement = '';
  if (clearedBy === 'reuptake') {
    const xCross = acts === 'reuptake-block' ? `
      <line x1="133" y1="78" x2="147" y2="98" stroke="#ff4d6d" stroke-width="2.6" stroke-linecap="round"/>
      <line x1="147" y1="78" x2="133" y2="98" stroke="#ff4d6d" stroke-width="2.6" stroke-linecap="round"/>` : '';
    transporterElement = `<g class="transporter">
      <rect x="134" y="80" width="12" height="17" rx="3" fill="rgba(190,200,255,0.18)" stroke="${CELL}" stroke-width="1.3"/>
      <path d="M137 83 v11 M143 83 v11" stroke="rgba(190,200,255,0.4)" stroke-width="1"/>
      <text x="128" y="93" class="dg-label dim" text-anchor="end" font-size="9.5">Transporter</text>
      ${xCross}
    </g>`;
  }

  // Enzyme in cleft
  let enzymeElement = '';
  if (clearedBy === 'enzyme') {
    const xCross = acts === 'enzyme-block' ? `
      <line x1="212" y1="139" x2="228" y2="157" stroke="#ff4d6d" stroke-width="2.6" stroke-linecap="round"/>
      <line x1="228" y1="139" x2="212" y2="157" stroke="#ff4d6d" stroke-width="2.6" stroke-linecap="round"/>` : '';
    enzymeElement = `<g class="enzyme">
      <circle cx="220" cy="148" r="9" fill="rgba(255,180,100,0.18)" stroke="#ffa36b" stroke-width="1.3"/>
      <text x="220" y="151.5" text-anchor="middle" font-size="9" fill="#ffa36b" font-weight="600">AChE</text>
      ${xCross}
    </g>`;
  }

  // Astrocyte outline
  let astrocyteElement = '';
  if (clearedBy === 'astrocyte') {
    astrocyteElement = `<g class="astrocyte">
      <path d="M84 130 L90 140 L102 140 L93 147 L96 158 L84 152 L72 158 L75 147 L66 140 L78 140 Z" fill="rgba(140,210,255,0.14)" stroke="rgba(140,210,255,0.5)" stroke-width="1.2"/>
      <text x="84" y="172" class="dg-label dim" text-anchor="middle" font-size="9.5">Astrocyte</text>
    </g>`;
  }

  // Postsynaptic receptors
  const receptorElements = receptors.map((r, i) => {
    const n = receptors.length;
    const rx = 220 + (i - (n - 1) / 2) * 100;
    const glowClass = (currentStage === 3 && acts === 'boost-receptor') ? 'class="receptor-boosted"' : '';
    const cap = (currentStage === 3 && acts === 'receptor-block') ? `
      <rect x="${rx - 10}" y="166" width="20" height="6" rx="2" fill="#8890aa" stroke="#fff" stroke-width="1"/>` : '';

    return `<g ${glowClass} style="--c:${color}">
      <path d="M${rx - 12} 180 v-10 h6 v6 h12 v-6 h6 v10" stroke="${color}" stroke-width="1.5" fill="none"/>
      ${cap}
      <text x="${rx}" y="206" text-anchor="middle" class="dg-label" font-size="11">${esc(r.id)}</text>
    </g>`;
  }).join('');

  return `<div class="stepper" data-chem="${esc(chem.id)}">
    ${drugBanner}
    <figure class="fig stepper-fig">
      <figcaption class="fig-title stepper-head">
        <span>Synapse cycle: <strong>${STAGES[currentStage].label}</strong></span>
        <span class="gap-meter"><i class="gap-dot"></i> In the gap: <strong>${gapCount}</strong> molecules</span>
      </figcaption>
      <svg class="diagram synapse" viewBox="0 0 440 270" role="img" aria-label="Synapse stage: ${STAGES[currentStage].label}">
        <!-- Presynaptic sending terminal -->
        <path d="M140 0 V65 C140 102 172 118 220 118 C268 118 300 102 300 65 V0" fill="rgba(205,213,255,.06)" stroke="${CELL}" stroke-width="1.3"/>
        <text x="312" y="32" class="dg-label dim" text-anchor="start">Sending terminal</text>
        <text x="312" y="150" class="dg-label dim" text-anchor="start">Synaptic gap ≈ 20 nm</text>

        <!-- Components -->
        ${transporterElement}
        ${enzymeElement}
        ${astrocyteElement}
        ${precursorDots.join('')}
        ${vesicleElements}
        ${spikeElement}
        ${moleculeElements.join('')}

        <!-- Postsynaptic membrane -->
        <path d="M40 180 C130 174 310 174 400 180" stroke="${CELL}" stroke-width="1.3" fill="none"/>
        <path d="M40 186 C130 180 310 180 400 186 V270 H40 Z" fill="rgba(205,213,255,.05)"/>
        ${receptorElements}
        <text x="220" y="248" text-anchor="middle" class="dg-label dim">Receiving neuron</text>
      </svg>
      <p class="fig-caption stepper-caption">${esc(stageCaption)}</p>
    </figure>

    <!-- Stepper stage control buttons -->
    <div class="stepper-controls" role="group" aria-label="Synapse stages">
      <div class="stepper-buttons">
        ${STAGES.map((st) => `
          <button class="step-btn ${st.id === currentStage ? 'is-on' : ''}" data-stage="${st.id}" aria-current="${st.id === currentStage ? 'step' : 'false'}">
            ${st.label}
          </button>
        `).join('')}
      </div>
      <button class="stepper-play-btn ${playTimer ? 'is-playing' : ''}" data-play-stepper>
        ${playTimer ? 'Pause' : 'Play all'}
      </button>
    </div>
  </div>`;
}
