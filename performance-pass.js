/* MED-ROUTE — unified visual performance pass
 * Presentation-only. Does not alter routing, dispatch, hospital, or Leaflet state.
 */
(function () {
  'use strict';
  if (window.__MEDROUTE_PERF_PASS__) return;
  window.__MEDROUTE_PERF_PASS__ = true;

  const root = document.documentElement;
  const active = new Set();
  let raf = 0;
  let pointerX = window.innerWidth * 0.5;
  let pointerY = window.innerHeight * 0.5;
  let targetX = pointerX;
  let targetY = pointerY;
  let last = performance.now();

  function schedule() {
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function pointerMove(event) {
    targetX = event.clientX;
    targetY = event.clientY;
    schedule();
  }

  function tick(now) {
    raf = 0;
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    const ease = 1 - Math.pow(0.001, dt);
    pointerX += (targetX - pointerX) * ease;
    pointerY += (targetY - pointerY) * ease;
    root.style.setProperty('--mouse-x', `${pointerX}px`);
    root.style.setProperty('--mouse-y', `${pointerY}px`);

    active.forEach((el) => {
      if (!el.isConnected) active.delete(el);
      else if (el.dataset.tilt === 'true') {
        const rect = el._mrRect;
        if (!rect) return;
        const nx = (pointerX - rect.left) / Math.max(1, rect.width) - 0.5;
        const ny = (pointerY - rect.top) / Math.max(1, rect.height) - 0.5;
        el.style.setProperty('--tilt-x', `${(-ny * 4).toFixed(2)}deg`);
        el.style.setProperty('--tilt-y', `${(nx * 4).toFixed(2)}deg`);
      }
    });

    if (Math.abs(targetX - pointerX) > 0.1 || Math.abs(targetY - pointerY) > 0.1 || active.size) schedule();
  }

  function refreshTiltRects() {
    active.forEach((el) => {
      if (el.dataset.tilt === 'true' && el.isConnected) el._mrRect = el.getBoundingClientRect();
    });
  }

  function addTilt(el) {
    if (el.dataset.mrPerfBound) return;
    el.dataset.mrPerfBound = '1';
    el.dataset.tilt = 'true';
    el.style.setProperty('--tilt-x', '0deg');
    el.style.setProperty('--tilt-y', '0deg');
    el.classList.add('mr-perf-tilt');
    active.add(el);
  }

  function cleanup() {
    cancelAnimationFrame(raf);
    raf = 0;
    window.removeEventListener('pointermove', pointerMove);
    window.removeEventListener('resize', refreshTiltRects);
    active.clear();
  }

  function init() {
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --mouse-x: 50vw;
        --mouse-y: 50vh;
        --mr-ambient-a: radial-gradient(520px circle at 18% 25%, rgba(20,184,166,.10), transparent 70%);
        --mr-ambient-b: radial-gradient(620px circle at 82% 70%, rgba(79,70,229,.09), transparent 72%);
      }
      /* One cheap spotlight layer; no per-frame React state or layout writes. */
      body::before {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 28;
        background: radial-gradient(360px circle at var(--mouse-x) var(--mouse-y), rgba(20,184,166,.09), transparent 78%);
      }
      body::after {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 27;
        background: var(--mr-ambient-a), var(--mr-ambient-b);
      }
      .mr-perf-tilt {
        transform: perspective(1000px) rotateX(var(--tilt-x)) rotateY(var(--tilt-y));
        transform-style: preserve-3d;
        transition: transform 180ms cubic-bezier(.2,.75,.25,1);
        will-change: transform;
        isolation: isolate;
        contain: layout paint;
      }
      .mr-perf-static-glass {
        isolation: isolate;
        contain: layout paint;
      }
      .mr-perf-map-overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 500;
        background: rgba(3,4,7,.10);
      }
      /* Avoid expensive full-screen backdrop blur on structural surfaces. */
      .heroHUD, .hud-card, .maphud, .panel, .shell, .benchbox {
        background: rgba(8,9,13,.90) !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }
      /* Static nodes should not receive permanent compositor promotion. */
      .mr-static {
        will-change: auto !important;
      }
      @media (max-width: 900px) {
        body::before { background: radial-gradient(260px circle at var(--mouse-x) var(--mouse-y), rgba(20,184,166,.06), transparent 80%); }
      }
    `;
    document.head.appendChild(style);

    document.querySelectorAll('.heroHUD, .card, .hospital, .benchmetric, .tool').forEach(addTilt);
    document.querySelectorAll('.heroHUD, .card, .hospital, .benchmetric, .tool, .maphud, .panel, .shell, .benchbox').forEach((el) => el.classList.add('mr-perf-static-glass'));

    window.addEventListener('pointermove', pointerMove, { passive: true });
    window.addEventListener('resize', refreshTiltRects, { passive: true });
    refreshTiltRects();
    schedule();
  }

  function boot() {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
  }

  boot();
  window.addEventListener('pagehide', cleanup, { once: true });
})();
