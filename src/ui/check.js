import { esc } from './format.js';

export function renderCheck(check, stepIndex, pathwayId = '', isLastStep = false) {
  if (!check || !check.ask || !Array.isArray(check.choices)) return '';

  const feedbackJson = esc(JSON.stringify(check.feedback || []));
  const nextHash = isLastStep ? '#/pathways' : `#/p/${pathwayId}/${stepIndex + 1}`;

  return `
    <div class="check-card" data-check-answer="${check.answer}" data-feedback="${feedbackJson}">
      <p class="check-ask">${esc(check.ask)}</p>
      <div class="check-choices">
        ${check.choices.map((choice, i) => `
          <button type="button" class="check-choice" data-choice="${i}">
            ${esc(choice)}
          </button>
        `).join('')}
      </div>
      <div class="check-feedback" hidden></div>
      <div class="check-footer">
        <a href="${nextHash}" class="check-next" data-act="next" hidden>Next step</a>
        <button type="button" class="check-skip" data-act="next">Skip</button>
      </div>
    </div>
  `;
}
