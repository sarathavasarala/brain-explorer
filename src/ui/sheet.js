// src/ui/sheet.js
// Mobile bottom sheet with interactive drag handle and momentum snapping.
// Allows users to expand the reading area or collapse to maximize the 3D stage.

const PEEK_HEIGHT_PX = 74;
const VELOCITY_THRESHOLD = 0.38; // px/ms
const TAP_MAX_DISTANCE = 6; // px
const TAP_MAX_TIME = 320; // ms

export function initBottomSheet({
  sheetEl,
  handleEl,
  contentEl,
  onStateChange,
}) {
  if (!sheetEl || !handleEl) return null;

  let currentState = 'half'; // 'peek' | 'half' | 'expanded'
  let isDragging = false;
  let startY = 0;
  let startHeight = 0;
  let pts = [];

  function getSnapHeights() {
    const vh = window.innerHeight;
    const topbar = document.querySelector('.topbar');
    const topbarH = topbar ? topbar.offsetHeight : 52;
    return {
      peek: PEEK_HEIGHT_PX,
      half: Math.round(vh * 0.5),
      expanded: Math.max(vh - topbarH, 320),
    };
  }

  function applyHeight(heightPx, animate = true) {
    if (window.innerWidth > 860) {
      sheetEl.style.removeProperty('--sheet-height');
      sheetEl.classList.remove('is-dragging');
      return;
    }
    if (!animate) {
      sheetEl.classList.add('is-dragging');
    } else {
      sheetEl.classList.remove('is-dragging');
    }
    sheetEl.style.setProperty('--sheet-height', `${Math.round(heightPx)}px`);
  }

  function snapTo(targetState, animate = true) {
    currentState = targetState;
    sheetEl.dataset.sheetState = targetState;
    const heights = getSnapHeights();
    const targetHeight = heights[targetState] || heights.half;

    applyHeight(targetHeight, animate);
    handleEl.setAttribute('aria-expanded', targetState === 'expanded' ? 'true' : 'false');
    handleEl.setAttribute('aria-label', targetState === 'expanded'
      ? 'Collapse reading sheet'
      : 'Expand reading sheet');

    if (onStateChange) onStateChange(targetState);
  }

  function toggle() {
    if (currentState === 'expanded') {
      snapTo('half');
    } else if (currentState === 'half') {
      snapTo('expanded');
    } else {
      snapTo('half');
    }
  }

  // Pointer event listeners for fluid dragging
  handleEl.addEventListener('pointerdown', (e) => {
    if (window.innerWidth > 860) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    isDragging = true;
    startY = e.clientY;
    startHeight = sheetEl.getBoundingClientRect().height;
    pts = [{ y: e.clientY, t: performance.now() }];

    sheetEl.classList.add('is-dragging');
    try {
      handleEl.setPointerCapture(e.pointerId);
    } catch (_) {}
  });

  handleEl.addEventListener('pointermove', (e) => {
    if (!isDragging) return;

    const deltaY = startY - e.clientY; // drag up is positive height change
    let targetH = startHeight + deltaY;
    const heights = getSnapHeights();

    // Rubber-band resistance at boundaries
    if (targetH > heights.expanded) {
      targetH = heights.expanded + (targetH - heights.expanded) * 0.22;
    } else if (targetH < heights.peek) {
      targetH = heights.peek - (heights.peek - targetH) * 0.22;
    }

    applyHeight(targetH, false);

    const now = performance.now();
    pts.push({ y: e.clientY, t: now });
    if (pts.length > 5) pts.shift();
  });

  function finishDrag(e) {
    if (!isDragging) return;
    isDragging = false;
    sheetEl.classList.remove('is-dragging');

    try {
      handleEl.releasePointerCapture(e.pointerId);
    } catch (_) {}

    const totalDist = Math.abs(e.clientY - startY);
    const duration = performance.now() - pts[0].t;

    // Tap detected
    if (totalDist < TAP_MAX_DISTANCE && duration < TAP_MAX_TIME) {
      toggle();
      return;
    }

    // Velocity detection (dy / dt)
    let velocity = 0;
    if (pts.length >= 2) {
      const last = pts[pts.length - 1];
      const first = pts[0];
      const dt = last.t - first.t;
      if (dt > 10) {
        velocity = (last.y - first.y) / dt; // negative is upwards
      }
    }

    if (velocity < -VELOCITY_THRESHOLD) {
      // Flicked upwards
      if (currentState === 'peek') snapTo('half');
      else snapTo('expanded');
    } else if (velocity > VELOCITY_THRESHOLD) {
      // Flicked downwards
      if (currentState === 'expanded') snapTo('half');
      else snapTo('peek');
    } else {
      // Position-based snapping
      const currentH = sheetEl.getBoundingClientRect().height;
      const vh = window.innerHeight;
      const ratio = currentH / vh;

      if (ratio < 0.26) {
        snapTo('peek');
      } else if (ratio > 0.70) {
        snapTo('expanded');
      } else {
        snapTo('half');
      }
    }
  }

  handleEl.addEventListener('pointerup', finishDrag);
  handleEl.addEventListener('pointercancel', finishDrag);

  // Keyboard navigation
  handleEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentState === 'peek') snapTo('half');
      else snapTo('expanded');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentState === 'expanded') snapTo('half');
      else snapTo('peek');
    }
  });

  // Handle window resizing
  window.addEventListener('resize', () => {
    if (window.innerWidth > 860) {
      sheetEl.style.removeProperty('--sheet-height');
      sheetEl.classList.remove('is-dragging');
    } else {
      snapTo(currentState, false);
    }
  }, { passive: true });

  // Initial snap
  if (window.innerWidth <= 860) {
    snapTo(currentState, false);
  }

  return {
    getState: () => currentState,
    snapTo,
    toggle,
  };
}
