export function createDock(dockEl) {
  const titleEl = dockEl.querySelector('.dock-title');
  const controlsEl = dockEl.querySelector('.dock-controls');
  const bodyEl = dockEl.querySelector('.dock-body');

  return {
    el: dockEl,
    setTitle(text) {
      if (titleEl) titleEl.textContent = text || '';
    },
    setControls(content) {
      if (!controlsEl) return;
      controlsEl.innerHTML = '';
      if (typeof content === 'string') {
        controlsEl.innerHTML = content;
      } else if (content instanceof Node) {
        controlsEl.appendChild(content);
      }
    },
    clearControls() {
      if (controlsEl) controlsEl.innerHTML = '';
    },
    getBody() {
      return bodyEl;
    },
    clearBody() {
      if (bodyEl) bodyEl.innerHTML = '';
    },
    show() {
      dockEl.removeAttribute('hidden');
    },
    hide() {
      dockEl.setAttribute('hidden', '');
    },
    getHeight() {
      return dockEl.offsetHeight || 260;
    },
  };
}
