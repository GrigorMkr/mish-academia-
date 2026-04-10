function isBarChromeOnlyClickTarget(target) {
  const el = target instanceof Element ? target : target.parentElement;
  if (!el) {
    return true;
  }
  if (el.closest('a, button, input, textarea, select, label, [role="button"]')) {
    return false;
  }
  return true;
}

export function initHeaderBarExpandClick() {
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const bar = document.querySelector('.site-header__bar');
  if (!header || !bar) {
    return;
  }

  function syncVideoOpen() {
    root.style.setProperty(
      '--header-bar-video-open',
      header.classList.contains('site-header--bar-pinned-expanded') ? '1' : '0',
    );
  }

  bar.addEventListener(
    'click',
    (e) => {
      if (!isBarChromeOnlyClickTarget(e.target)) {
        return;
      }
      header.classList.toggle('site-header--bar-pinned-expanded');
      if (header.classList.contains('site-header--bar-pinned-expanded')) {
        header.dataset.barExpandScrollY = String(window.scrollY || document.documentElement.scrollTop || 0);
        root.style.setProperty('--header-bar-release-t', '0');
      } else {
        delete header.dataset.barExpandScrollY;
        root.style.setProperty('--header-bar-release-t', '0');
      }
      syncVideoOpen();
    },
    { passive: true },
  );
}
