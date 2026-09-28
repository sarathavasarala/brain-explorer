// Speed widget: visual comparison of neural and hormonal transmission speeds.
import { esc } from './format.js';

export function renderSpeedWidget() {
  return `<figure class="fig speed-widget" role="group" aria-label="Signal speed comparison">
    <figcaption class="fig-title">How fast each kind of signal works</figcaption>
    <svg class="diagram speed-diagram" viewBox="0 0 420 148" role="img" aria-label="Visual timescale comparison">
      <!-- Fast nerve signal -->
      <g>
        <text x="12" y="18" class="speed-label">Nerve signal, about a thousandth of a second</text>
        <line x1="12" y1="30" x2="408" y2="30" class="speed-track"/>
        <circle cy="30" r="4.5" class="speed-dot speed-fast">
          <animate attributeName="cx" values="16;404" dur="0.6s" repeatCount="indefinite" calcMode="linear"/>
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.08;0.92;1" dur="0.6s" repeatCount="indefinite"/>
        </circle>
      </g>

      <!-- Neuromodulator -->
      <g>
        <text x="12" y="62" class="speed-label">Neuromodulator, seconds to minutes</text>
        <line x1="12" y1="74" x2="408" y2="74" class="speed-track"/>
        <circle cy="74" r="5" class="speed-dot speed-mod">
          <animate attributeName="cx" values="16;404" dur="4s" repeatCount="indefinite" calcMode="linear"/>
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.08;0.92;1" dur="4s" repeatCount="indefinite"/>
        </circle>
      </g>

      <!-- Hormone -->
      <g>
        <text x="12" y="106" class="speed-label">Hormone, minutes to hours</text>
        <line x1="12" y1="118" x2="408" y2="118" class="speed-track"/>
        <circle cy="118" r="5.5" class="speed-dot speed-hormone">
          <animate attributeName="cx" values="16;404" dur="14s" repeatCount="indefinite" calcMode="linear"/>
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.08;0.92;1" dur="14s" repeatCount="indefinite"/>
        </circle>
      </g>
    </svg>
    <p class="fig-caption">Speeds are not to scale.</p>
  </figure>`;
}
