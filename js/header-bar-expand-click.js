function clickTargetIsBarChromeOnly(target) {
  const element = target instanceof Element ? target : target.parentElement;
  if (!element) {
    return true;
  }
  if (element.closest('a, button, input, textarea, select, label, [role="button"]')) {
    return false;
  }
  return true;
}

export function initHeaderBarExpandClick() {
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const bar = document.querySelector('.site-header__bar');
  const nav = document.querySelector('.site-header__nav');
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
    (event) => {
      if (!clickTargetIsBarChromeOnly(event.target)) {
        return;
      }
      const isDocumentSurface = root.dataset.headerSurface === 'document';
      const isBarExpanded = header.classList.contains('site-header--bar-pinned-expanded');
      if (isDocumentSurface && !isBarExpanded) {
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

  if (nav) {
    nav.addEventListener(
      'click',
      (event) => {
        const eventTarget = event.target;
        if (!(eventTarget instanceof Element)) {
          return;
        }
        const link = eventTarget.closest('a');
        if (!link) {
          return;
        }
        if (!header.classList.contains('site-header--bar-pinned-expanded')) {
          return;
        }

        header.classList.remove('site-header--bar-pinned-expanded');
        delete header.dataset.barExpandScrollY;
        root.style.setProperty('--header-bar-release-t', '0');
        syncVideoOpen();
      },
      { passive: true, capture: true },
    );
  }
}
