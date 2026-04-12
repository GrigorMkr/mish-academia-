const BLEND_RANGE_PX = 168;
const HERO_SCROLL_GATE_PX = 28;
const SCROLL_RELEASE_PX = 280;
const UNPIN_AT_SURFACE_T = 0.98;
const SMOOTH_TAU_MS = 220;
const WHEEL_DELTA_SCALE = 0.72;
const COLLAPSE_DONE_EPSILON_PX = 0.35;
const IDLE_CONVERGENCE_EPSILON_PX = 0.012;
const SURFACE_T_FALLBACK_SCROLL_DIVISOR_PX = 240;
const DOCUMENT_SURFACE_THRESHOLD_T = 0.5;
const SCRUB_STEP_DT_CAP_MS = 80;
const FRAME_STEP_MS = 1000 / 60;
const COLLAPSE_RESCHEDULE_ERROR_EPSILON = 0.003;
const COLLAPSE_RESCHEDULE_TARGET_LEAD_PX = 0.35;
const SCROLL_PIN_SLIPPAGE_EPSILON_PX = 2;
const SCROLL_PIN_DEBOUNCE_MS = 28;
const MOBILE_NAV_BREAKPOINT_MAX_PX = 480;
const DESKTOP_BAR_BREAKPOINT_MIN_PX = 481;

function clamp(value, minValue, maxValue) {
  return Math.min(maxValue, Math.max(minValue, value));
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isDesktopBarCollapse() {
  return window.matchMedia(`(min-width: ${DESKTOP_BAR_BREAKPOINT_MIN_PX}px)`).matches;
}

function shouldPinScrollForBarCollapse() {
  if (typeof window.matchMedia !== 'function') {
    return true;
  }
  return !window.matchMedia('(pointer: coarse)').matches;
}

function setBarVideoOpen(_header, root) {
  root.style.setProperty('--header-bar-video-open', '1');
}

let collapseFinishCallback = null;

let collapseBarForAnchorImpl = (onDone) => {
  if (typeof onDone === 'function') {
    queueMicrotask(onDone);
  }
};

export function collapseHeaderBarForAnchorThen(onDone) {
  collapseBarForAnchorImpl(onDone);
}

function clearBarExpandSession(header, root) {
  delete header.dataset.barExpandScrollY;
  root.style.setProperty('--header-bar-release-t', '0');
}

function computeSurfaceT() {
  const scrollY = window.scrollY || document.documentElement.scrollTop;
  if (scrollY < HERO_SCROLL_GATE_PX) {
    return 0;
  }

  const surfaceSection =
    document.querySelector('.section--hero-main') || document.querySelector('#about');
  const inner = document.querySelector('.site-header__inner');
  if (!inner) {
    return 0;
  }

  let surfaceBlendT;
  if (surfaceSection) {
    const barBottomPx = inner.getBoundingClientRect().bottom;
    const sectionTopPx = surfaceSection.getBoundingClientRect().top;
    const gapPx = sectionTopPx - barBottomPx;
    surfaceBlendT = 1 - Math.min(1, Math.max(0, gapPx / BLEND_RANGE_PX));
  } else {
    surfaceBlendT = Math.min(1, Math.max(0, (scrollY - HERO_SCROLL_GATE_PX) / SURFACE_T_FALLBACK_SCROLL_DIVISOR_PX));
  }

  if (prefersReducedMotion()) {
    return surfaceBlendT >= DOCUMENT_SURFACE_THRESHOLD_T ? 1 : 0;
  }
  return surfaceBlendT;
}

export function initHeaderExpandOnScroll() {
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  header?.classList.remove('site-header--collapse-from-top');

  if (header) {
    if (isDesktopBarCollapse()) {
      header.classList.add('site-header--bar-pinned-expanded');
      header.dataset.barExpandScrollY = String(window.scrollY || document.documentElement.scrollTop || 0);
    } else {
      header.classList.remove('site-header--bar-pinned-expanded');
      clearBarExpandSession(header, root);
    }
  }

  let targetCollapsePx = 0;
  let smoothCollapsePx = 0;
  let lastBarExpandKey = '';
  let collapseAnimationFrameId = 0;
  let lastCollapseStepTimestampMs = 0;
  let collapseSmoothTauMs = SMOOTH_TAU_MS;
  let lastProgrammaticPinMs = 0;

  function resetCollapseSessionIfNeeded() {
    const key = header?.dataset.barExpandScrollY ?? '';
    if (key !== lastBarExpandKey) {
      targetCollapsePx = 0;
      smoothCollapsePx = 0;
      lastBarExpandKey = key;
      lastCollapseStepTimestampMs = 0;
    }
  }

  function cancelCollapseAnimationFrame() {
    if (collapseAnimationFrameId) {
      cancelAnimationFrame(collapseAnimationFrameId);
      collapseAnimationFrameId = 0;
    }
  }

  function finishCollapseAndScrollMain(pinnedScrollY, overflowPx) {
    header.classList.remove('site-header--bar-pinned-expanded');
    clearBarExpandSession(header, root);
    lastBarExpandKey = '';
    targetCollapsePx = 0;
    smoothCollapsePx = 0;
    cancelCollapseAnimationFrame();
    lastCollapseStepTimestampMs = 0;
    root.style.setProperty('--header-bar-release-t', '0');
    collapseSmoothTauMs = SMOOTH_TAU_MS;
    setBarVideoOpen(header, root);
    if (overflowPx > 0) {
      lastProgrammaticPinMs = performance.now();
      window.scrollTo({ top: pinnedScrollY + overflowPx, left: 0, behavior: 'auto' });
    } else {
      lastProgrammaticPinMs = performance.now();
    }
    const done = collapseFinishCallback;
    collapseFinishCallback = null;
    done?.();
  }

  function stepCollapseSmooth(nowMs) {
    collapseAnimationFrameId = 0;
    if (!header?.classList.contains('site-header--bar-pinned-expanded')) {
      return;
    }

    resetCollapseSessionIfNeeded();

    const pinnedScrollY = Number(header.dataset.barExpandScrollY);
    if (!Number.isFinite(pinnedScrollY)) {
      return;
    }

    const capPx = Math.min(targetCollapsePx, SCROLL_RELEASE_PX);

    if (prefersReducedMotion()) {
      smoothCollapsePx = capPx;
    } else {
      const timestampMs = typeof nowMs === 'number' ? nowMs : performance.now();
      const deltaMs = lastCollapseStepTimestampMs
        ? Math.min(timestampMs - lastCollapseStepTimestampMs, SCRUB_STEP_DT_CAP_MS)
        : FRAME_STEP_MS;
      lastCollapseStepTimestampMs = timestampMs;
      const alpha = 1 - Math.exp(-deltaMs / collapseSmoothTauMs);
      smoothCollapsePx += (capPx - smoothCollapsePx) * alpha;
      if (Math.abs(capPx - smoothCollapsePx) < IDLE_CONVERGENCE_EPSILON_PX) {
        smoothCollapsePx = capPx;
      }
    }

    const releaseT = clamp(smoothCollapsePx / SCROLL_RELEASE_PX, 0, 1);
    root.style.setProperty('--header-bar-release-t', releaseT.toFixed(5));

    const overflowPx = Math.max(0, targetCollapsePx - SCROLL_RELEASE_PX);
    const collapseDone =
      targetCollapsePx >= SCROLL_RELEASE_PX &&
      (prefersReducedMotion() || smoothCollapsePx >= SCROLL_RELEASE_PX - COLLAPSE_DONE_EPSILON_PX);

    if (collapseDone) {
      finishCollapseAndScrollMain(pinnedScrollY, overflowPx);
      return;
    }

    const convergenceErrorPx = Math.abs(capPx - smoothCollapsePx);
    if (
      convergenceErrorPx > COLLAPSE_RESCHEDULE_ERROR_EPSILON ||
      targetCollapsePx > smoothCollapsePx + COLLAPSE_RESCHEDULE_TARGET_LEAD_PX
    ) {
      collapseAnimationFrameId = requestAnimationFrame(stepCollapseSmooth);
    }
  }

  function scheduleCollapseStep() {
    if (!header?.classList.contains('site-header--bar-pinned-expanded')) {
      cancelCollapseAnimationFrame();
      return;
    }
    if (!collapseAnimationFrameId) {
      collapseAnimationFrameId = requestAnimationFrame(stepCollapseSmooth);
    }
  }

  function consumeScrollForBarCollapse() {
    if (!header?.classList.contains('site-header--bar-pinned-expanded')) {
      return;
    }

    if (!shouldPinScrollForBarCollapse()) {
      return;
    }

    resetCollapseSessionIfNeeded();

    const pinnedScrollY = Number(header.dataset.barExpandScrollY);
    if (!Number.isFinite(pinnedScrollY)) {
      return;
    }

    const pinnedRounded = Math.round(pinnedScrollY);
    const scrollYRaw = window.scrollY || root.scrollTop;
    const scrollRounded = Math.round(scrollYRaw);

    if (isDesktopBarCollapse() && !prefersReducedMotion()) {
      const driftPx = Math.abs(scrollRounded - pinnedRounded);
      if (driftPx > SCROLL_PIN_SLIPPAGE_EPSILON_PX) {
        const t = performance.now();
        if (t - lastProgrammaticPinMs >= SCROLL_PIN_DEBOUNCE_MS) {
          lastProgrammaticPinMs = t;
          window.scrollTo({ top: pinnedRounded, left: 0, behavior: 'auto' });
        }
      }
      scheduleCollapseStep();
      return;
    }

    const scrollY = scrollRounded;
    if (scrollY < pinnedRounded) {
      lastProgrammaticPinMs = performance.now();
      window.scrollTo({ top: pinnedRounded, left: 0, behavior: 'auto' });
      scheduleCollapseStep();
      return;
    }

    const deltaDownPx = scrollY - pinnedRounded;
    if (deltaDownPx <= 0) {
      scheduleCollapseStep();
      return;
    }

    if (prefersReducedMotion()) {
      targetCollapsePx = SCROLL_RELEASE_PX + Math.max(0, deltaDownPx - SCROLL_RELEASE_PX);
    } else {
      targetCollapsePx += deltaDownPx;
    }

    lastProgrammaticPinMs = performance.now();
    window.scrollTo({ top: pinnedRounded, left: 0, behavior: 'auto' });
    scheduleCollapseStep();
  }

  function onWheelWhileExpanded(wheelEvent) {
    if (!header?.classList.contains('site-header--bar-pinned-expanded')) {
      return;
    }
    if (!isDesktopBarCollapse()) {
      return;
    }

    resetCollapseSessionIfNeeded();

    const pinnedScrollY = Number(header.dataset.barExpandScrollY);
    if (!Number.isFinite(pinnedScrollY)) {
      return;
    }

    if (wheelEvent.deltaY <= 0) {
      return;
    }

    wheelEvent.preventDefault();

    if (prefersReducedMotion()) {
      targetCollapsePx = SCROLL_RELEASE_PX + Math.max(0, wheelEvent.deltaY - SCROLL_RELEASE_PX);
    } else {
      targetCollapsePx += wheelEvent.deltaY * WHEEL_DELTA_SCALE;
    }

    scheduleCollapseStep();
  }

  function sync() {
    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia(`(max-width: ${MOBILE_NAV_BREAKPOINT_MAX_PX}px)`).matches &&
      header?.classList.contains('site-header--menu-open')
    ) {
      return;
    }

    consumeScrollForBarCollapse();

    const surfaceT = computeSurfaceT();
    root.style.setProperty('--header-surface-t', surfaceT.toFixed(4));
    root.dataset.headerSurface = surfaceT >= DOCUMENT_SURFACE_THRESHOLD_T ? 'document' : 'hero';
    root.style.removeProperty('--header-shrink-t');

    if (header?.classList.contains('site-header--bar-pinned-expanded')) {
      if (surfaceT >= UNPIN_AT_SURFACE_T) {
        const pendingDone = collapseFinishCallback;
        collapseFinishCallback = null;
        header.classList.remove('site-header--bar-pinned-expanded');
        clearBarExpandSession(header, root);
        lastBarExpandKey = '';
        targetCollapsePx = 0;
        smoothCollapsePx = 0;
        lastCollapseStepTimestampMs = 0;
        cancelCollapseAnimationFrame();
        collapseSmoothTauMs = SMOOTH_TAU_MS;
        pendingDone?.();
      }
    } else {
      cancelCollapseAnimationFrame();
      root.style.setProperty('--header-bar-release-t', '0');
      collapseSmoothTauMs = SMOOTH_TAU_MS;
    }

    setBarVideoOpen(header, root);
  }

  let syncRafScheduled = false;
  function onScrollOrResize() {
    if (syncRafScheduled) {
      return;
    }
    syncRafScheduled = true;
    requestAnimationFrame(() => {
      syncRafScheduled = false;
      sync();
    });
  }

  collapseBarForAnchorImpl = (onDone) => {
    if (typeof onDone !== 'function') {
      return;
    }
    if (!header?.classList.contains('site-header--bar-pinned-expanded')) {
      onDone();
      return;
    }

    const pinnedScrollY = Number(header.dataset.barExpandScrollY);
    if (!Number.isFinite(pinnedScrollY)) {
      onDone();
      return;
    }

    cancelCollapseAnimationFrame();
    collapseFinishCallback = () => {
      requestAnimationFrame(onDone);
    };
    finishCollapseAndScrollMain(pinnedScrollY, 0);
  };

  sync();
  window.addEventListener('scroll', onScrollOrResize, { passive: true });
  window.addEventListener('resize', onScrollOrResize, { passive: true });
  window.addEventListener('wheel', onWheelWhileExpanded, { passive: false, capture: true });
}
