const HIDDEN_CLASS = 'hero__subcopy--layer--hidden';
const DESKTOP_HIDE_BUFFER_PX = 80;

export function initHeroSubcopyPosition() {
  const layer = document.querySelector('.hero__subcopy--layer');
  const circle = document.querySelector('.hero-glass--circle');
  const grid = document.querySelector('.hero__grid-sticky-wrap');
  const cta = document.querySelector('.hero-glass__cta');

  if (!layer || !circle || !grid) {
    return;
  }

  function isCompact() {
    return window.innerWidth <= 900;
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
    const leftX = Math.round(cr.left);
    layer.style.left = `${leftX}px`;
    const nudgeRaw = getComputedStyle(layer)
      .getPropertyValue('--hero-subcopy-nudge-x')
      .trim();
    const shiftX = parseFloat(nudgeRaw, 10) || 0;
    const maxW = Math.min(
      520,
      Math.max(160, window.innerWidth - leftX - 16 - shiftX),
    );
    layer.style.maxWidth = `${maxW}px`;

    if (cta) {
      const tr = cta.getBoundingClientRect();
      void layer.offsetHeight;
      const lh = layer.getBoundingClientRect().height;
      layer.style.top = `${Math.round(tr.top + tr.height / 2 - lh / 2)}px`;
    } else {
      const gap = rowGapPx();
      layer.style.top = `${Math.round(cr.bottom + gap)}px`;
    }
  }

  function syncVisibility() {
    const hero = heroSection();
    if (!hero) {
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

  requestAnimationFrame(tick);
}
