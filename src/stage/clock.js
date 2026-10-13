// Shared stage clock. t is world time in seconds inside the current window.
export function createClock() {
  const subs = new Set();
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const defaultRate = reducedMotion ? 0.35 : 0.5;

  const c = {
    t: 0,
    window: [-0.5, 2.0],
    playing: false,
    rate: defaultRate,
    loop: true,
    hold: 0.8,
    _last: 0,
    _holdLeft: 0,
    _raf: 0,
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    seek(t) {
      c.t = Math.max(c.window[0], Math.min(c.window[1], t));
      emit();
    },
    play() {
      if (c.playing) return;
      c.playing = true;
      c._last = performance.now();
      loop();
      emit();
    },
    pause() {
      c.playing = false;
      cancelAnimationFrame(c._raf);
      emit();
    },
    reset(window) {
      if (window) c.window = window;
      c.t = c.window[0];
      c._holdLeft = 0;
      emit();
    },
  };

  function emit() {
    for (const fn of subs) fn(c.t, c);
  }

  function loop() {
    if (!c.playing) return;
    const now = performance.now();
    const dt = Math.min((now - c._last) / 1000, 0.05);
    c._last = now;
    if (c._holdLeft > 0) {
      c._holdLeft -= dt;
      if (c._holdLeft <= 0) {
        c.t = c.window[0];
        c.onLoop?.();
      }
    } else {
      c.t += dt * c.rate;
      if (c.t >= c.window[1]) {
        c.t = c.window[1];
        if (c.loop) {
          c._holdLeft = c.hold;
        } else {
          c.pause();
        }
      }
    }
    emit();
    c._raf = requestAnimationFrame(loop);
  }

  return c;
}
