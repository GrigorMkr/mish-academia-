const BLEND_RANGE_PX = 168;
const HERO_SCROLL_GATE_PX = 28;
const SCROLL_RELEASE_PX = 280;
const UNPIN_AT_T = 0.98;
/** Время сглаживания (мс): больше — плавнее движение навбара, дольше догон цели. */
const SMOOTH_TAU_MS = 145;
/** Колесо даёт крупные шаги — слегка приглушаем, чтобы цель менялась мягче. */
const WHEEL_DELTA_SCALE = 0.88;
const DONE_EPS_PX = 0.35;
const IDLE_EPS_PX = 0.012;

function clamp(n, a, b) {
  return Math.min(b, Math.max(a, n));
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isDesktopBarCollapse() {
  return window.matchMedia('(min-width: 901px)').matches;
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
  const y = window.scrollY || document.documentElement.scrollTop;
  if (y < HERO_SCROLL_GATE_PX) {
    return 0;
  }

  const about = document.querySelector('#about');
  const inner = document.querySelector('.site-header__inner');
  if (!inner) {
    return 0;
  }

  let t;
  if (about) {
    const barBottom = inner.getBoundingClientRect().bottom;
    const aboutTop = about.getBoundingClientRect().top;
    const d = aboutTop - barBottom;
    t = 1 - Math.min(1, Math.max(0, d / BLEND_RANGE_PX));
  } else {
    t = Math.min(1, Math.max(0, (y - HERO_SCROLL_GATE_PX) / 240));
  }

  if (prefersReducedMotion()) {
    return t >= 0.5 ? 1 : 0;
  }
  return t;
}

export function initHeaderExpandOnScroll() {
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  header?.classList.remove('site-header--collapse-from-top');

  /** Цель схлопывания в пикселях [0 … +∞), после SCROLL_RELEASE_PX — «лишнее» уйдёт в скролл main. */
  let targetCollapsePx = 0;
  /** Сглаженное значение для CSS (без ступеней). */
  let smoothCollapsePx = 0;
  let lastBarExpandKey = '';
  let rafCollapseId = 0;
  let lastCollapseStepTs = 0;

  function resetCollapseSessionIfNeeded() {
    const key = header?.dataset.barExpandScrollY ?? '';
    if (key !== lastBarExpandKey) {
      targetCollapsePx = 0;
      smoothCollapsePx = 0;
      lastBarExpandKey = key;
      lastCollapseStepTs = 0;
    }
  }

  function cancelCollapseRaf() {
    if (rafCollapseId) {
      cancelAnimationFrame(rafCollapseId);
      rafCollapseId = 0;
    }
  }

  function finishCollapseAndScrollMain(y0, overflowPx) {
    header.classList.remove('site-header--bar-pinned-expanded');
    clearBarExpandSession(header, root);
    lastBarExpandKey = '';
    targetCollapsePx = 0;
    smoothCollapsePx = 0;
    cancelCollapseRaf();
    lastCollapseStepTs = 0;
    root.style.setProperty('--header-bar-release-t', '0');
    setBarVideoOpen(header, root);
    if (overflowPx > 0) {
      window.scrollTo({ top: y0 + overflowPx, left: 0, behavior: 'auto' });
    }
  }

  function stepCollapseSmooth(now) {
    rafCollapseId = 0;
    if (!header?.classList.contains('site-header--bar-pinned-expanded')) {
      return;
    }

    resetCollapseSessionIfNeeded();

    const y0 = Number(header.dataset.barExpandScrollY);
    if (!Number.isFinite(y0)) {
      return;
    }

    const cap = Math.min(targetCollapsePx, SCROLL_RELEASE_PX);

    if (prefersReducedMotion()) {
      smoothCollapsePx = cap;
    } else {
      const t = typeof now === 'number' ? now : performance.now();
      const dtMs = lastCollapseStepTs ? Math.min(t - lastCollapseStepTs, 80) : 16.67;
      lastCollapseStepTs = t;
      const alpha = 1 - Math.exp(-dtMs / SMOOTH_TAU_MS);
      smoothCollapsePx += (cap - smoothCollapsePx) * alpha;
      if (Math.abs(cap - smoothCollapsePx) < IDLE_EPS_PX) {
        smoothCollapsePx = cap;
      }
    }

    const releaseT = clamp(smoothCollapsePx / SCROLL_RELEASE_PX, 0, 1);
    root.style.setProperty('--header-bar-release-t', releaseT.toFixed(5));

    const overflowPx = Math.max(0, targetCollapsePx - SCROLL_RELEASE_PX);
    const collapseDone =
      targetCollapsePx >= SCROLL_RELEASE_PX &&
      (prefersReducedMotion() || smoothCollapsePx >= SCROLL_RELEASE_PX - DONE_EPS_PX);

    if (collapseDone) {
      finishCollapseAndScrollMain(y0, overflowPx);
      return;
    }

    const err = Math.abs(cap - smoothCollapsePx);
    if (err > 0.003 || targetCollapsePx > smoothCollapsePx + 0.35) {
      rafCollapseId = requestAnimationFrame(stepCollapseSmooth);
    }
  }

  function scheduleCollapseStep() {
    if (!header?.classList.contains('site-header--bar-pinned-expanded')) {
      cancelCollapseRaf();
      return;
    }
    if (!rafCollapseId) {
      rafCollapseId = requestAnimationFrame(stepCollapseSmooth);
    }
  }

  /**
   * Скролл страницы копится в target; позиция окна фиксируется на y0, пока не закрыли нав.
   */
  function consumeScrollForBarCollapse() {
    if (!header?.classList.contains('site-header--bar-pinned-expanded')) {
      return;
    }

    resetCollapseSessionIfNeeded();

    const y0 = Number(header.dataset.barExpandScrollY);
    if (!Number.isFinite(y0)) {
      return;
    }

    const y = window.scrollY || root.scrollTop;
    if (y < y0) {
      window.scrollTo({ top: y0, left: 0, behavior: 'auto' });
      scheduleCollapseStep();
      return;
    }

    const deltaDown = y - y0;
    if (deltaDown <= 0) {
      scheduleCollapseStep();
      return;
    }

    if (prefersReducedMotion()) {
      targetCollapsePx = SCROLL_RELEASE_PX + Math.max(0, deltaDown - SCROLL_RELEASE_PX);
    } else {
      targetCollapsePx += deltaDown;
    }

    window.scrollTo({ top: y0, left: 0, behavior: 'auto' });
    scheduleCollapseStep();
  }

  function onWheelWhileExpanded(e) {
    if (!header?.classList.contains('site-header--bar-pinned-expanded')) {
      return;
    }
    if (!isDesktopBarCollapse()) {
      return;
    }

    resetCollapseSessionIfNeeded();

    const y0 = Number(header.dataset.barExpandScrollY);
    if (!Number.isFinite(y0)) {
      return;
    }

    if (e.deltaY <= 0) {
      return;
    }

    e.preventDefault();

    if (prefersReducedMotion()) {
      targetCollapsePx = SCROLL_RELEASE_PX + Math.max(0, e.deltaY - SCROLL_RELEASE_PX);
    } else {
      targetCollapsePx += e.deltaY;
    }

    scheduleCollapseStep();
  }

  function sync() {
    consumeScrollForBarCollapse();

    const t = computeSurfaceT();
    root.style.setProperty('--header-surface-t', t.toFixed(4));
    root.dataset.headerSurface = t >= 0.5 ? 'document' : 'hero';
    root.style.removeProperty('--header-shrink-t');

    if (header?.classList.contains('site-header--bar-pinned-expanded')) {
      if (t >= UNPIN_AT_T) {
        header.classList.remove('site-header--bar-pinned-expanded');
        clearBarExpandSession(header, root);
        lastBarExpandKey = '';
        targetCollapsePx = 0;
        smoothCollapsePx = 0;
        lastCollapseStepTs = 0;
        cancelCollapseRaf();
      }
    } else {
      cancelCollapseRaf();
      root.style.setProperty('--header-bar-release-t', '0');
    }

    setBarVideoOpen(header, root);
  }

  let raf = false;
  function onScrollOrResize() {
    if (raf) {
      return;
    }
    raf = true;
    requestAnimationFrame(() => {
      raf = false;
      sync();
    });
  }

  sync();
  window.addEventListener('scroll', onScrollOrResize, { passive: true });
  window.addEventListener('resize', onScrollOrResize, { passive: true });
  window.addEventListener('wheel', onWheelWhileExpanded, { passive: false, capture: true });
}
