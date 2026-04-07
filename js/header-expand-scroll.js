const COMPACT_MAX_WIDTH_PX = 900;
const SHRINK_SCROLL_RANGE_PX = 320;

function isPastHeroVideoZone() {
  const hero =
    document.querySelector('.section--hero.section--hero-promo') ||
    document.querySelector('.section--hero');
  const bar = document.querySelector('.site-header__bar');
  if (!hero) {
    return false;
  }
  const hr = hero.getBoundingClientRect();
  const barH = bar ? bar.getBoundingClientRect().height : 72;
  return hr.bottom < barH + 2;
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function initHeaderExpandOnScroll() {
  const root = document.documentElement;
  document.querySelector('.site-header')?.classList.remove('site-header--collapse-from-top');

  function isMobileLayout() {
    return window.innerWidth <= COMPACT_MAX_WIDTH_PX;
  }

  function sync() {
    const y = window.scrollY || document.documentElement.scrollTop;
    const surface = isPastHeroVideoZone() ? 'document' : 'hero';
    root.dataset.headerSurface = surface;

    if (isMobileLayout()) {
      root.style.removeProperty('--header-shrink-t');
      return;
    }

    const scrollT = Math.min(1, Math.max(0, y / SHRINK_SCROLL_RANGE_PX));
    let t;
    if (prefersReducedMotion()) {
      t = y > 48 ? 1 : 0;
    } else {
      t = scrollT;
    }
    root.style.setProperty('--header-shrink-t', String(t));
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
