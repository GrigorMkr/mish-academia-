const SCROLL_DURATION_MS_MIN = 420;
const SCROLL_DURATION_MS_MAX = 1300;
const SCROLL_DURATION_MS_PER_PX = 0.52;
const NEAR_TARGET_EPSILON_PX = 0.75;
const MOUSE_BUTTON_PRIMARY = 0;

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function easeOutQuart(progressUnit) {
  return 1 - (1 - progressUnit) ** 4;
}

function readScrollPaddingTopPx() {
  const raw = getComputedStyle(document.documentElement).scrollPaddingTop;
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clampDocumentScrollY(y) {
  const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  return Math.max(0, Math.min(y, maxY));
}

function resolveAnchorScrollTargetY(hash) {
  if (!hash || hash === '#') {
    return 0;
  }
  let fragment = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!fragment) {
    return 0;
  }
  try {
    fragment = decodeURIComponent(fragment);
  } catch {
    return null;
  }
  const target = document.getElementById(fragment);
  if (!target) {
    return null;
  }
  const paddingTop = readScrollPaddingTopPx();
  const topPx = target.getBoundingClientRect().top + window.scrollY;
  return clampDocumentScrollY(topPx - paddingTop);
}

let smoothScrollFrameId = 0;

function cancelSmoothScrollAnimation() {
  if (smoothScrollFrameId) {
    cancelAnimationFrame(smoothScrollFrameId);
    smoothScrollFrameId = 0;
  }
}

function durationMsForScrollDistance(distancePx) {
  const magnitude = Math.abs(distancePx);
  return Math.min(SCROLL_DURATION_MS_MAX, Math.max(SCROLL_DURATION_MS_MIN, magnitude * SCROLL_DURATION_MS_PER_PX));
}

function scrollWindowToYWithEasing(targetY, onComplete) {
  cancelSmoothScrollAnimation();

  const startY = window.scrollY;
  const clampedY = clampDocumentScrollY(targetY);
  const deltaY = clampedY - startY;

  if (Math.abs(deltaY) < NEAR_TARGET_EPSILON_PX) {
    onComplete?.();
    return;
  }

  if (prefersReducedMotion()) {
    window.scrollTo({ top: clampedY, left: 0, behavior: 'auto' });
    onComplete?.();
    return;
  }

  const durationMs = durationMsForScrollDistance(deltaY);
  const startedAtMs = performance.now();

  function tick(nowMs) {
    const elapsedMs = nowMs - startedAtMs;
    const progress = Math.min(1, elapsedMs / durationMs);
    const easedY = startY + deltaY * easeOutQuart(progress);
    window.scrollTo({ top: easedY, left: 0, behavior: 'auto' });
    if (progress < 1) {
      smoothScrollFrameId = requestAnimationFrame(tick);
    } else {
      smoothScrollFrameId = 0;
      window.scrollTo({ top: clampedY, left: 0, behavior: 'auto' });
      onComplete?.();
    }
  }

  smoothScrollFrameId = requestAnimationFrame(tick);
}

function replaceHistoryWithHash(hash) {
  try {
    const base = `${location.pathname}${location.search}`;
    if (hash && hash !== '#') {
      history.replaceState(null, '', `${base}${hash}`);
    } else {
      history.replaceState(null, '', base);
    }
  } catch {
    void 0;
  }
}

export function initSmoothAnchorScroll() {
  document.addEventListener(
    'click',
    (event) => {
      const anchor = event.target.closest?.('a[href^="#"]');
      if (!anchor) {
        return;
      }
      if (
        event.defaultPrevented ||
        event.button !== MOUSE_BUTTON_PRIMARY ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      let parsedUrl;
      try {
        parsedUrl = new URL(anchor.href);
      } catch {
        return;
      }

      if (parsedUrl.origin !== location.origin || parsedUrl.pathname !== location.pathname) {
        return;
      }

      if ((anchor.getAttribute('href') ?? '').trim() === '#') {
        return;
      }

      const hash = parsedUrl.hash || '#';
      const targetY = resolveAnchorScrollTargetY(hash);
      if (targetY === null) {
        return;
      }

      event.preventDefault();
      scrollWindowToYWithEasing(targetY, () => replaceHistoryWithHash(hash));
    },
    true,
  );
}
