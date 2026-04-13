let lastWrittenHeaderOffset = '';

function applyHeaderBottomOffsetPx(header) {
  const rect = header.getBoundingClientRect();
  const bottomPx = Math.max(0, Math.round(rect.bottom));
  const value = `${bottomPx}px`;
  if (value === lastWrittenHeaderOffset) {
    return;
  }
  lastWrittenHeaderOffset = value;
  document.documentElement.style.setProperty('--header-offset', value);
}

export function syncHeaderOffsetNow() {
  const header = document.querySelector('.site-header');
  if (!header) {
    return;
  }
  lastWrittenHeaderOffset = '';
  applyHeaderBottomOffsetPx(header);
}

export function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) {
    return;
  }

  function measureAndApply() {
    applyHeaderBottomOffsetPx(header);
  }

  let scrollCoalescePending = false;
  function onWindowScroll() {
    if (document.body.style.overflow === 'hidden') {
      return;
    }
    if (scrollCoalescePending) {
      return;
    }
    scrollCoalescePending = true;
    requestAnimationFrame(() => {
      scrollCoalescePending = false;
      measureAndApply();
    });
  }

  measureAndApply();
  window.addEventListener('scroll', onWindowScroll, { passive: true });
  window.addEventListener('resize', measureAndApply, { passive: true });

  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(measureAndApply);
    observer.observe(header);
  }
}
