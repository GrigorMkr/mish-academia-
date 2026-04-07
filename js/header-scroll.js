function setHeaderOffsetPx(header) {
  const rect = header.getBoundingClientRect();
  const bottom = Math.max(0, Math.round(rect.bottom));
  document.documentElement.style.setProperty('--header-offset', `${bottom}px`);
}

export function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) {
    return;
  }

  function update() {
    setHeaderOffsetPx(header);
  }

  let rafScheduled = false;
  function onScroll() {
    if (rafScheduled) {
      return;
    }
    rafScheduled = true;
    requestAnimationFrame(() => {
      rafScheduled = false;
      update();
    });
  }

  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', update, { passive: true });

  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => update());
    ro.observe(header);
  }
}
