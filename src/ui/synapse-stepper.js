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

export function getStepperStage() {
  return activeStage;
}

export function setStepperStage(s) {
  activeStage = Math.min(Math.max(Number(s) || 0, 0), 4);
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
  const acts = drug ? drug.acts : null;

  // Caption for active stage
  let stageCaption = '';
  if (currentStage === 0) stageCaption = life.made || 'Molecules are synthesized from chemical precursors inside the terminal.';
  else if (currentStage === 1) stageCaption = life.packed || 'Transporter proteins pump molecules into protective membrane vesicles.';
  else if (currentStage === 2) stageCaption = life.released || 'An electrical spike triggers vesicle fusion, releasing molecules into the cleft.';
  else if (currentStage === 3) stageCaption = life.binds || 'Molecules diffuse across the cleft and bind to receptor targets.';
  else if (currentStage === 4) stageCaption = life.cleared || 'Molecules are cleared from the cleft by reuptake or enzyme breakdown.';

  // Drug overlay message
  let drugBanner = '';
  if (drug) {
    drugBanner = `<div class="stepper-drug-banner">
      <span class="drug-tag">Drug active: <strong>${esc(drug.name)}</strong></span>
      <span class="drug-note">${esc(drug.text)}</span>
      <a class="drug-clear" href="#/chem/${chem.id}/synapse" title="Remove drug overlay">Remove drug</a>
    </div>`;
  }

  // Precursor dots (Stage 0)
  const precursorCount = acts === 'precursor' ? 14 : 7;
  const precursorDots = [];
  for (let i = 0; i < precursorCount; i++) {
    const px = 160 + (i % 5) * 18 + ((i * 7) % 11);
    const py = 16 + Math.floor(i / 5) * 14 + ((i * 3) % 8);
    const baseColor = currentStage === 0 ? '#7a86a8' : color;
    precursorDots.push(`<circle cx="${px}" cy="${py}" r="2.8" fill="${baseColor}">
      ${currentStage === 0 ? `<animate attributeName="fill" values="#7a86a8;${color};${color}" dur="2s" begin="${(i * 0.18).toFixed(2)}s" repeatCount="indefinite"/>` : ''}
    </circle>`);
  }

  // Vesicle centres
  const vesicles = [[178, 38], [200, 30], [222, 40], [188, 58], [212, 60], [236, 56], [164, 56]];

  // Vesicles rendering
  const vesicleElements = vesicles.map(([vx, vy], i) => {
    // Stage 1: packing animation
    const packingParticle = currentStage === 1 ? `
      <circle cx="${vx}" cy="${vy}" r="2.2" fill="${color}">
        <animate attributeName="cx" values="${vx - 14};${vx}" dur="1.6s" begin="${(i * 0.2).toFixed(2)}s" repeatCount="indefinite"/>
        <animate attributeName="cy" values="${vy - 12};${vy}" dur="1.6s" begin="${(i * 0.2).toFixed(2)}s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0;1;1;0" dur="1.6s" begin="${(i * 0.2).toFixed(2)}s" repeatCount="indefinite"/>
      </circle>` : '';

    return `<g>
      <circle cx="${vx}" cy="${vy}" r="7" fill="none" stroke="${color}" stroke-width="1.3" opacity=".85">
        <animate attributeName="r" values="7;7.6;7" dur="${2 + i * 0.2}s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${vx}" cy="${vy}" r="2.4" fill="${color}" opacity="${currentStage === 0 ? '.25' : '.85'}"/>
      ${packingParticle}
    </g>`;
  }).join('');

  // Stage 2: Spike running down terminal
  let spikeElement = '';
  if (currentStage === 2 && acts !== 'release') {
    spikeElement = `<circle r="4" fill="#ffffff" style="filter: drop-shadow(0 0 6px #ffffff);">
      <animate attributeName="cx" values="200;200" dur="1.4s" repeatCount="indefinite"/>
      <animate attributeName="cy" values="0;76" dur="1.4s" repeatCount="indefinite" calcMode="linear"/>
      <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="1.4s" repeatCount="indefinite"/>
    </circle>`;
  }

  // Molecules in cleft / gap
  const moleculeElements = [];
  if (currentStage === 2) {
    // Spilling into gap
    const count = acts === 'release-block' ? 0 : 14;
    for (let i = 0; i < count; i++) {
      const x0 = 180 + (i % 7) * 7 - 4, x1 = 130 + (i * 37) % 140;
      const dur = acts === 'release' ? 1.2 : 1.7;
      const begin = (i * 0.15).toFixed(2);
      moleculeElements.push(`<circle r="2.6" fill="${color}">
        <animate attributeName="cx" values="${x0};${x1}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>
        <animate attributeName="cy" values="84;122" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>
      </circle>`);
    }
  } else if (currentStage === 3) {
    // Binding to receptors
    receptors.forEach((r, i) => {
      const n = receptors.length;
      const rx = 200 + (i - (n - 1) / 2) * 88;
      if (acts === 'receptor-block') {
        // Drug white molecule bounces off
        moleculeElements.push(`<circle cx="${rx}" cy="112" r="2.8" fill="${color}">
          <animate attributeName="cy" values="96;112;92" dur="1.8s" begin="${i * 0.3}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0;1;1;0" dur="1.8s" begin="${i * 0.3}s" repeatCount="indefinite"/>
        </circle>`);
      } else if (acts === 'receptor-mimic') {
        // White drug molecules sit in the pocket
        moleculeElements.push(`<circle cx="${rx}" cy="120" r="2.8" fill="#ffffff" style="filter: drop-shadow(0 0 4px #ffffff);">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite"/>
        </circle>`);
      } else {
        // Normal transmitter binding
        moleculeElements.push(`<circle cx="${rx}" cy="120" r="2.6" fill="${color}">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" begin="${i * 0.4}s" repeatCount="indefinite"/>
        </circle>`);
      }
    });
  } else if (currentStage === 4) {
    // Clearing
    if (clearedBy === 'reuptake') {
      const dur = acts === 'reuptake-block' ? 4.0 : 1.8;
      for (let i = 0; i < 8; i++) {
        const x0 = 150 + i * 16;
        if (acts === 'reuptake-block') {
          // Bounces off transporter and lingers in gap
          moleculeElements.push(`<circle r="2.6" fill="${color}">
            <animate attributeName="cx" values="${x0};144;${x0 + 10}" dur="${dur}s" begin="${(i * 0.25).toFixed(2)}s" repeatCount="indefinite"/>
            <animate attributeName="cy" values="115;70;110" dur="${dur}s" begin="${(i * 0.25).toFixed(2)}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="1;1;1;0.6" dur="${dur}s" begin="${(i * 0.25).toFixed(2)}s" repeatCount="indefinite"/>
          </circle>`);
        } else {
          // Travels into transporter
          moleculeElements.push(`<circle r="2.5" fill="${color}">
            <animate attributeName="cx" values="${x0};144;144" dur="${dur}s" begin="${(i * 0.22).toFixed(2)}s" repeatCount="indefinite"/>
            <animate attributeName="cy" values="116;68;45" dur="${dur}s" begin="${(i * 0.22).toFixed(2)}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="1;1;0" keyTimes="0;.85;1" dur="${dur}s" begin="${(i * 0.22).toFixed(2)}s" repeatCount="indefinite"/>
          </circle>`);
        }
      }
    } else if (clearedBy === 'enzyme') {
      const dur = acts === 'enzyme-block' ? 4.0 : 1.8;
      for (let i = 0; i < 7; i++) {
        const x0 = 155 + i * 14;
        if (acts === 'enzyme-block') {
          moleculeElements.push(`<circle cx="${x0}" cy="104" r="2.6" fill="${color}">
            <animate attributeName="cy" values="98;112;104" dur="${dur}s" repeatCount="indefinite"/>
          </circle>`);
        } else {
          // Splits into grey fragments
          moleculeElements.push(`
            <circle cx="${x0}" cy="104" r="2.4" fill="${color}">
              <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.5;0.6" dur="${dur}s" begin="${(i * 0.2).toFixed(2)}s" repeatCount="indefinite"/>
            </circle>
            <circle cx="${x0 - 4}" cy="106" r="1.6" fill="#8087a8">
              <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.55;1" dur="${dur}s" begin="${(i * 0.2).toFixed(2)}s" repeatCount="indefinite"/>
              <animate attributeName="cx" values="${x0};${x0 - 9}" dur="${dur}s" begin="${(i * 0.2).toFixed(2)}s" repeatCount="indefinite"/>
            </circle>
            <circle cx="${x0 + 4}" cy="106" r="1.6" fill="#8087a8">
              <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.55;1" dur="${dur}s" begin="${(i * 0.2).toFixed(2)}s" repeatCount="indefinite"/>
              <animate attributeName="cx" values="${x0};${x0 + 9}" dur="${dur}s" begin="${(i * 0.2).toFixed(2)}s" repeatCount="indefinite"/>
            </circle>`);
        }
      }
    } else if (clearedBy === 'astrocyte') {
      for (let i = 0; i < 8; i++) {
        moleculeElements.push(`<circle r="2.5" fill="${color}">
          <animate attributeName="cx" values="${150 + i * 16};92" dur="2.2s" begin="${(i * 0.24).toFixed(2)}s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="112;98" dur="2.2s" begin="${(i * 0.24).toFixed(2)}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="1;1;0" keyTimes="0;.85;1" dur="2.2s" begin="${(i * 0.24).toFixed(2)}s" repeatCount="indefinite"/>
        </circle>`);
      }
    }
  }

  // Transporter on presynaptic membrane (for reuptake)
  let transporterElement = '';
  if (clearedBy === 'reuptake') {
    const xCross = acts === 'reuptake-block' ? `
      <line x1="137" y1="58" x2="151" y2="76" stroke="#ff4d6d" stroke-width="2.6" stroke-linecap="round"/>
      <line x1="151" y1="58" x2="137" y2="76" stroke="#ff4d6d" stroke-width="2.6" stroke-linecap="round"/>` : '';
    transporterElement = `<g class="transporter">
      <rect x="138" y="59" width="12" height="16" rx="3" fill="rgba(190,200,255,0.18)" stroke="${CELL}" stroke-width="1.3"/>
      <path d="M141 62 v10 M147 62 v10" stroke="rgba(190,200,255,0.4)" stroke-width="1"/>
      <text x="133" y="71" class="dg-label dim" text-anchor="end" font-size="9">Transporter</text>
      ${xCross}
    </g>`;
  }

  // Enzyme in cleft
  let enzymeElement = '';
  if (clearedBy === 'enzyme') {
    const xCross = acts === 'enzyme-block' ? `
      <line x1="193" y1="96" x2="207" y2="112" stroke="#ff4d6d" stroke-width="2.6" stroke-linecap="round"/>
      <line x1="207" y1="96" x2="193" y2="112" stroke="#ff4d6d" stroke-width="2.6" stroke-linecap="round"/>` : '';
    enzymeElement = `<g class="enzyme">
      <circle cx="200" cy="104" r="8" fill="rgba(255,180,100,0.18)" stroke="#ffa36b" stroke-width="1.2"/>
      <text x="200" y="107" text-anchor="middle" font-size="8.5" fill="#ffa36b" font-weight="600">AChE</text>
      ${xCross}
    </g>`;
  }

  // Astrocyte outline
  let astrocyteElement = '';
  if (clearedBy === 'astrocyte') {
    astrocyteElement = `<g class="astrocyte">
      <path d="M88 84 L93 92 L103 92 L95 98 L98 107 L88 102 L78 107 L81 98 L73 92 L83 92 Z" fill="rgba(140,210,255,0.14)" stroke="rgba(140,210,255,0.5)" stroke-width="1.2"/>
      <text x="88" y="120" class="dg-label dim" text-anchor="middle" font-size="9">Astrocyte</text>
    </g>`;
  }

  // Postsynaptic receptors
  const receptorElements = receptors.map((r, i) => {
    const n = receptors.length;
    const rx = 200 + (i - (n - 1) / 2) * 88;
    const glow = (currentStage === 3 && acts === 'boost-receptor') ? `style="filter: drop-shadow(0 0 7px ${color});"` : '';
    const cap = (currentStage === 3 && acts === 'receptor-block') ? `
      <rect x="${rx - 8}" y="114" width="16" height="5" rx="2" fill="#8890aa" stroke="#fff" stroke-width="1"/>` : '';

    return `<g ${glow}>
      <path d="M${rx - 10} 126 v-8 h5 v5 h10 v-5 h5 v8" stroke="${color}" stroke-width="1.4" fill="none"/>
      ${cap}
      <text x="${rx}" y="148" text-anchor="middle" class="dg-label" font-size="10.5">${esc(r.id)}</text>
    </g>`;
  }).join('');

  return `<div class="stepper" data-chem="${esc(chem.id)}">
    ${drugBanner}
    <figure class="fig stepper-fig">
      <figcaption class="fig-title">Synapse cycle: <strong>${STAGES[currentStage].label}</strong></figcaption>
      <svg class="diagram synapse" viewBox="0 0 400 195" role="img" aria-label="Synapse stage: ${STAGES[currentStage].label}">
        <!-- Presynaptic sending terminal -->
        <path d="M140 0 V50 C140 74 162 84 200 84 C238 84 260 74 260 50 V0" fill="rgba(205,213,255,.06)" stroke="${CELL}" stroke-width="1.3"/>
        <text x="270" y="24" class="dg-label dim" text-anchor="start">Sending terminal</text>
        <text x="270" y="104" class="dg-label dim" text-anchor="start">Synaptic gap ≈ 20 nm</text>

        <!-- Components -->
        ${transporterElement}
        ${enzymeElement}
        ${astrocyteElement}
        ${precursorDots.join('')}
        ${vesicleElements}
        ${spikeElement}
        ${moleculeElements.join('')}

        <!-- Postsynaptic membrane -->
        <path d="M70 126 C140 122 260 122 330 126" stroke="${CELL}" stroke-width="1.3" fill="none"/>
        <path d="M70 132 C140 128 260 128 330 132 V195 H70 Z" fill="rgba(205,213,255,.05)"/>
        ${receptorElements}
        <text x="200" y="180" text-anchor="middle" class="dg-label dim">Receiving neuron</text>
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
