import { createClock } from './clock.js';
import { createDock } from './dock.js';
import { worlds } from '../worlds/index.js';
import { surfaces } from '../surfaces/index.js';

export function createRunner({ scene, stageEl, dockEl }) {
  const clock = createClock();
  const dock = createDock(dockEl);

  let currentSurface = null;
  let unsubs = [];
  let isDockVisible = false;
  let currentLayout = 'brain';

  function syncFrameOffset() {
    if (!scene) return;
    if (isDockVisible && currentLayout === 'dock') {
      const h = dock.getHeight();
      scene.setFrameOffset(Math.round(h / 2 + 12));
    } else {
      scene.setFrameOffset(0);
    }
  }

  if (typeof ResizeObserver !== 'undefined' && dockEl) {
    new ResizeObserver(syncFrameOffset).observe(dockEl);
  }

  function stop() {
    if (currentSurface) {
      currentSurface.destroy?.();
      currentSurface = null;
    }
    for (const unsub of unsubs) unsub();
    unsubs = [];

    clock.pause();
    dock.hide();
    dock.clearControls();
    dock.clearBody();
    isDockVisible = false;
    currentLayout = 'brain';

    if (stageEl) {
      stageEl.classList.remove('is-dock', 'is-focus');
    }
    if (scene) {
      scene.clearDrive();
      scene.setFrameOffset(0);
    }
  }

  function run(step, { key } = {}) {
    if (!step || (!step.surface && !step.layout)) {
      stop();
      return;
    }

    // Clean up previous step's surface
    if (currentSurface) {
      currentSurface.destroy?.();
      currentSurface = null;
    }
    for (const unsub of unsubs) unsub();
    unsubs = [];
    dock.clearControls();
    dock.clearBody();

    const layout = step.layout || (step.surface ? 'dock' : 'brain');
    currentLayout = layout;

    if (stageEl) {
      stageEl.classList.remove('is-dock', 'is-focus');
      if (layout === 'dock') stageEl.classList.add('is-dock');
      if (layout === 'focus') stageEl.classList.add('is-focus');
    }

    if (layout === 'brain' || !step.surface || (typeof window !== 'undefined' && window.innerWidth <= 900)) {
      dock.hide();
      isDockVisible = false;
      currentLayout = 'brain';
      if (scene) {
        scene.clearDrive();
        scene.setFrameOffset(0);
      }
      return;
    }

    // Surface layout: dock or focus
    dock.show();
    isDockVisible = true;

    syncFrameOffset();

    const title = step.surface.title || '';
    dock.setTitle(title);

    const world = worlds[step.world] || worlds.rpe;
    const surfaceMod = surfaces[step.surface.type];

    if (!surfaceMod) {
      console.warn(`Unknown surface type: ${step.surface.type}`);
      return;
    }

    const ctx = {
      world,
      clock,
      scene,
      step,
      setControls: (nodes) => dock.setControls(nodes),
    };

    currentSurface = surfaceMod.mount(dock.getBody(), step.surface.props || {}, ctx);

    if (currentSurface?.render) {
      const unsub = clock.subscribe((t) => {
        currentSurface.render(t);
      });
      unsubs.push(unsub);
    }

    // Initialize clock window
    const win = world?.WINDOW || [-0.5, 2.0];
    clock.reset(win);

    if (step.operators?.play !== false) {
      clock.play();
    } else {
      clock.pause();
    }

    // Initial render
    currentSurface?.render?.(clock.t);
  }

  return {
    run,
    stop,
    clock,
    isDockOpen() {
      return isDockVisible;
    },
    togglePlay() {
      if (!isDockVisible) return;
      if (clock.playing) clock.pause(); else clock.play();
    },
    runTrial() {
      if (!isDockVisible) return;
      currentSurface?.runTrial?.();
    },
  };
}
