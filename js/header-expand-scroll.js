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
const SCROLL_PIN_SLIPPAGE_EPSILON_PX = 0.5;
const MOBILE_NAV_BREAKPOINT_MAX_PX = 900;
const DESKTOP_BAR_BREAKPOINT_MIN_PX = 901;

function clamp(value, minValue, maxValue) {
  return Math.min(maxValue, Math.max(minValue, value));
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isDesktopBarCollapse() {
  return window.matchMedia(`(min-width: ${DESKTOP_BAR_BREAKPOINT_MIN_PX}px)`).matches;
}

function setBarVideoOpen(header, root) {
  const open = header?.classList.contains('site-header--bar-pinned-expanded') ? '1' : '0';
  root.style.setProperty('--header-bar-video-open', open);
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

  const aboutSection = document.querySelector('#about');
  const inner = document.querySelector('.site-header__inner');
  if (!inner) {
    return 0;
  }

  let surfaceBlendT;
  if (aboutSection) {
    const barBottomPx = inner.getBoundingClientRect().bottom;
    const aboutTopPx = aboutSection.getBoundingClientRect().top;
    const gapPx = aboutTopPx - barBottomPx;
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

  let targetCollapsePx = 0;
  let smoothCollapsePx = 0;
  let lastBarExpandKey = '';
  let collapseAnimationFrameId = 0;
  let lastCollapseStepTimestampMs = 0;

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
    setBarVideoOpen(header, root);
    if (overflowPx > 0) {
      window.scrollTo({ top: pinnedScrollY + overflowPx, left: 0, behavior: 'auto' });
    }
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
      const alpha = 1 - Math.exp(-deltaMs / SMOOTH_TAU_MS);
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

    resetCollapseSessionIfNeeded();

    const pinnedScrollY = Number(header.dataset.barExpandScrollY);
    if (!Number.isFinite(pinnedScrollY)) {
      return;
    }

    if (isDesktopBarCollapse() && !prefersReducedMotion()) {
      const scrollYNow = window.scrollY || root.scrollTop;
      if (Math.abs(scrollYNow - pinnedScrollY) > SCROLL_PIN_SLIPPAGE_EPSILON_PX) {
        window.scrollTo({ top: pinnedScrollY, left: 0, behavior: 'auto' });
      }
      scheduleCollapseStep();
      return;
    }

    const scrollY = window.scrollY || root.scrollTop;
    if (scrollY < pinnedScrollY) {
      window.scrollTo({ top: pinnedScrollY, left: 0, behavior: 'auto' });
      scheduleCollapseStep();
      return;
    }

    const deltaDownPx = scrollY - pinnedScrollY;
    if (deltaDownPx <= 0) {
      scheduleCollapseStep();
      return;
    }

    if (prefersReducedMotion()) {
      targetCollapsePx = SCROLL_RELEASE_PX + Math.max(0, deltaDownPx - SCROLL_RELEASE_PX);
    } else {
      targetCollapsePx += deltaDownPx;
    }

    window.scrollTo({ top: pinnedScrollY, left: 0, behavior: 'auto' });
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
        header.classList.remove('site-header--bar-pinned-expanded');
        clearBarExpandSession(header, root);
        lastBarExpandKey = '';
        targetCollapsePx = 0;
        smoothCollapsePx = 0;
        lastCollapseStepTimestampMs = 0;
        cancelCollapseAnimationFrame();
      }
    } else {
      cancelCollapseAnimationFrame();
      root.style.setProperty('--header-bar-release-t', '0');
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

  sync();
  window.addEventListener('scroll', onScrollOrResize, { passive: true });
  window.addEventListener('resize', onScrollOrResize, { passive: true });
  window.addEventListener('wheel', onWheelWhileExpanded, { passive: false, capture: true });
}
