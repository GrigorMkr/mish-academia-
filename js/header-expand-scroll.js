const BLEND_RANGE_PX = 168;
const HERO_SCROLL_GATE_PX = 28;
const SCROLL_RELEASE_PX = 280;
const UNPIN_AT_T = 0.98;
const UNPIN_RELEASE = 0.985;

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

  function sync() {
    const t = computeSurfaceT();
    root.style.setProperty('--header-surface-t', t.toFixed(4));
    root.dataset.headerSurface = t >= 0.5 ? 'document' : 'hero';
    root.style.removeProperty('--header-shrink-t');

    if (header?.classList.contains('site-header--bar-pinned-expanded')) {
      if (t >= UNPIN_AT_T) {
        header.classList.remove('site-header--bar-pinned-expanded');
        clearBarExpandSession(header, root);
      } else {
        const y = window.scrollY || document.documentElement.scrollTop;
        const y0 = Number(header.dataset.barExpandScrollY);
        const dy = Number.isFinite(y0) ? Math.max(0, y - y0) : y;
        let releaseT = Math.min(1, Math.max(0, dy / SCROLL_RELEASE_PX));
        if (prefersReducedMotion()) {
          releaseT = dy > 56 ? 1 : 0;
        }
        root.style.setProperty('--header-bar-release-t', releaseT.toFixed(4));
        if (releaseT >= UNPIN_RELEASE) {
          header.classList.remove('site-header--bar-pinned-expanded');
          clearBarExpandSession(header, root);
        }
      }
    } else {
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
}
