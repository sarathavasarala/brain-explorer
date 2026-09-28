// Speed widget: visual comparison of neural and hormonal transmission speeds.
import { esc } from './format.js';

export function renderSpeedWidget() {
  return `<figure class="fig speed-widget" role="group" aria-label="Signal speed comparison">
    <figcaption class="fig-title">Transmission speeds across systems</figcaption>
    <svg class="diagram speed-diagram" viewBox="0 0 420 118" role="img" aria-label="Visual timescale comparison">
      <!-- Fast nerve signal -->
      <g>
        <text x="12" y="24" class="dg-label">Nerve signal, about 1 ms</text>
        <line x1="210" y1="20" x2="400" y2="20" stroke="rgba(190,200,255,0.12)" stroke-width="2.5" stroke-linecap="round"/>
        <circle cy="20" r="4.5" fill="#ffcf6b" style="filter: drop-shadow(0 0 4px #ffcf6b);">
          <animate attributeName="cx" values="214;396" dur="0.65s" repeatCount="indefinite" calcMode="linear"/>
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.08;0.92;1" dur="0.65s" repeatCount="indefinite"/>
        </circle>
      </g>

      <!-- Neuromodulator -->
      <g>
        <text x="12" y="58" class="dg-label">Neuromodulator, seconds to minutes</text>
        <line x1="210" y1="54" x2="400" y2="54" stroke="rgba(190,200,255,0.12)" stroke-width="2.5" stroke-linecap="round"/>
        <circle cy="54" r="5" fill="#b98cff" style="filter: drop-shadow(0 0 5px #b98cff);">
          <animate attributeName="cx" values="214;396" dur="3.8s" repeatCount="indefinite" calcMode="linear"/>
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.08;0.92;1" dur="3.8s" repeatCount="indefinite"/>
        </circle>
      </g>

      <!-- Hormone -->
      <g>
        <text x="12" y="92" class="dg-label">Hormone, minutes to hours</text>
        <line x1="210" y1="88" x2="400" y2="88" stroke="rgba(190,200,255,0.12)" stroke-width="2.5" stroke-linecap="round"/>
        <circle cy="88" r="6" fill="#ff9fd1" style="filter: drop-shadow(0 0 6px #ff9fd1);">
          <animate attributeName="cx" values="214;396" dur="12s" repeatCount="indefinite" calcMode="linear"/>
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.08;0.92;1" dur="12s" repeatCount="indefinite"/>
        </circle>
      </g>
    </svg>
    <p class="fig-caption">Not to scale. A conceptual illustration of how rapidly signals take effect.</p>
  </figure>`;
}
