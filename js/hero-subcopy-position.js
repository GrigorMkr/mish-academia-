const HIDDEN_CLASS = 'hero__subcopy--layer--hidden';
const DESKTOP_HIDE_BUFFER_PX = 80;

export function initHeroSubcopyPosition() {
  const layer = document.querySelector('.hero__subcopy--layer');
  const circle = document.querySelector('.hero-glass--circle');
  const grid = document.querySelector('.hero__grid-sticky-wrap');
  const cta = document.querySelector('.hero-glass__cta');
  const bar = document.querySelector('.site-header__bar');
  const headerInner = document.querySelector('.site-header__inner');

  if (!layer || !circle || !grid) {
    return;
  }

  function isCompact() {
    return window.innerWidth <= 900;
  }

  function heroVisualRoot() {
    return layer.closest('.site-header__hero-visual');
  }

  function isBarVisuallyExpanded() {
    if (!bar || !headerInner) {
      return true;
    }
    const bh = bar.getBoundingClientRect().height;
    const ih = headerInner.getBoundingClientRect().height;
    return bh > ih + 20;
  }

  function rowGapPx() {
    const raw = getComputedStyle(grid).rowGap;
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : 40;
  }

  function heroSection() {
    return (
      document.querySelector('.section--hero.section--hero-promo') ||
      document.querySelector('.section--hero')
    );
  }

  function syncPosition() {
    if (isCompact()) {
      layer.style.left = '';
      layer.style.top = '';
      layer.style.maxWidth = '';
      return;
    }

    const cr = circle.getBoundingClientRect();
    const visualRoot = heroVisualRoot();
    const wr = visualRoot ? visualRoot.getBoundingClientRect() : null;

    const leftX = wr ? Math.round(cr.left - wr.left) : Math.round(cr.left);
    layer.style.left = `${leftX}px`;
    const nudgeRaw = getComputedStyle(layer)
      .getPropertyValue('--hero-subcopy-nudge-x')
      .trim();
    const shiftX = parseFloat(nudgeRaw) || 0;
    const widthCap = wr ? wr.right - wr.left : window.innerWidth;
    const maxW = Math.min(520, Math.max(160, widthCap - leftX - 16 - shiftX));
    layer.style.maxWidth = `${maxW}px`;

    if (cta) {
      const tr = cta.getBoundingClientRect();
      void layer.offsetHeight;
      const lh = layer.getBoundingClientRect().height;
      const topVh = tr.top + tr.height / 2 - lh / 2;
      layer.style.top = `${Math.round(wr ? topVh - wr.top : topVh)}px`;
    } else {
      const gap = rowGapPx();
      const topVh = cr.bottom + gap;
      layer.style.top = `${Math.round(wr ? topVh - wr.top : topVh)}px`;
    }
  }

  function syncVisibility() {
    const hero = heroSection();
    if (!hero) {
      layer.classList.add(HIDDEN_CLASS);
      layer.setAttribute('aria-hidden', 'true');
      return;
    }

    if (heroVisualRoot() && !isBarVisuallyExpanded()) {
      layer.classList.add(HIDDEN_CLASS);
      layer.setAttribute('aria-hidden', 'true');
      return;
    }

    if (isCompact()) {
      const heroRect = hero.getBoundingClientRect();
      const layerRect = layer.getBoundingClientRect();
      const mobileBufferPx = 12;
      const shouldShow = heroRect.bottom > layerRect.top + mobileBufferPx;
      layer.classList.toggle(HIDDEN_CLASS, !shouldShow);
      layer.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
      return;
    }

    const hr = hero.getBoundingClientRect();
    const cr = circle.getBoundingClientRect();
    const contentBottom = Math.max(hr.bottom, cr.bottom);
    const lr = layer.getBoundingClientRect();
    const buffer = DESKTOP_HIDE_BUFFER_PX;
    const show = contentBottom > lr.top + buffer;
    layer.classList.toggle(HIDDEN_CLASS, !show);
    layer.setAttribute('aria-hidden', show ? 'false' : 'true');
  }

  function tick() {
    syncPosition();
    syncVisibility();
  }

  tick();
  window.addEventListener('resize', tick, { passive: true });
  window.addEventListener('scroll', tick, { passive: true });

  if (document.fonts?.ready) {
    document.fonts.ready.then(tick);
  }

  if (bar && typeof ResizeObserver !== 'undefined') {
    const roBar = new ResizeObserver(() => tick());
    roBar.observe(bar);
  }

  requestAnimationFrame(tick);
}
