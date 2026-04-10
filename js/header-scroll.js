const CSS_VAR_HEADER_OFFSET = '--header-offset';
const BODY_STYLE_OVERFLOW_HIDDEN = 'hidden';

let lastWrittenHeaderOffset = '';

function applyHeaderBottomOffsetPx(header) {
  const rect = header.getBoundingClientRect();
  const bottomPx = Math.max(0, Math.round(rect.bottom));
  const value = `${bottomPx}px`;
  if (value === lastWrittenHeaderOffset) {
    return;
  }
  lastWrittenHeaderOffset = value;
  document.documentElement.style.setProperty(CSS_VAR_HEADER_OFFSET, value);
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
    if (document.body.style.overflow === BODY_STYLE_OVERFLOW_HIDDEN) {
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
