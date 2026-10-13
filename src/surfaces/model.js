export default {
  type: 'model',

  mount(container, props = {}, _ctx = {}) {
    const sketch = props.sketch || {
      formula: 'prediction error = what you got − what you expected',
      text: 'Learning nudges the expectation a little toward what actually happened, every time.',
    };
    const brain = props.brain || [];
    const limits = props.limits || [];

    const wrapper = document.createElement('div');
    wrapper.className = 'model-surface';
    wrapper.innerHTML = `
      <div class="model-grid">
        <div class="model-col model-sketch">
          <h3 class="model-col-title">The sketch</h3>
          <div class="model-formula">${sketch.formula}</div>
          <p class="model-text">${sketch.text}</p>
        </div>
        <div class="model-divider" aria-hidden="true"></div>
        <div class="model-col model-brain">
          <h3 class="model-col-title">What the brain actually does</h3>
          <ul class="model-bullets">
            ${brain.map((b) => `<li>${b}</li>`).join('')}
          </ul>
        </div>
      </div>
      <div class="model-limits">
        <h3 class="model-col-title">Where the sketch stops working</h3>
        <ul class="model-bullets">
          ${limits.map((l) => `<li>${l}</li>`).join('')}
        </ul>
      </div>
    `;

    container.appendChild(wrapper);

    return {
      render(_t) {},
      destroy() {
        if (wrapper.parentElement) {
          wrapper.parentElement.removeChild(wrapper);
        }
      },
    };
  },
};
