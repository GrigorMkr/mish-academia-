const DESKTOP_BAR_MEDIA_QUERY = '(min-width: 481px)';
const BAR_PINNED_CLASS = 'site-header--bar-pinned-expanded';
const DATASET_SCROLL_KEY = 'barExpandScrollY';
const CSS_RELEASE_T_VAR = '--header-bar-release-t';
const CSS_RELEASE_T_DEFAULT = '0';

const header = document.querySelector('.site-header');
const root = document.documentElement;

if (header && typeof window.matchMedia === 'function') {
  const isDesktop = window.matchMedia(DESKTOP_BAR_MEDIA_QUERY).matches;
  if (isDesktop) {
    header.classList.add(BAR_PINNED_CLASS);
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    header.dataset[DATASET_SCROLL_KEY] = String(scrollTop);
  } else {
    header.classList.remove(BAR_PINNED_CLASS);
    delete header.dataset[DATASET_SCROLL_KEY];
    root.style.setProperty(CSS_RELEASE_T_VAR, CSS_RELEASE_T_DEFAULT);
  }
}

