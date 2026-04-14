const HEADER_SELECTOR = '.site-header';
const HEADER_INNER_SELECTOR = '.site-header__inner';
const PRIMARY_SURFACE_SELECTOR = '.section--hero-main';
const FALLBACK_SURFACE_SELECTOR = '#about';

const CSS_HEADER_OFFSET_VAR = '--header-offset';
const CSS_HEADER_SURFACE_T_VAR = '--header-surface-t';
const CSS_HEADER_BAR_VIDEO_OPEN_VAR = '--header-bar-video-open';
const CSS_HEADER_BAR_RELEASE_T_VAR = '--header-bar-release-t';
const CSS_HEADER_SHRINK_T_VAR = '--header-shrink-t';

const BAR_VIDEO_OPEN = '1';
const RELEASE_T_DEFAULT = '0';

const HERO_SCROLL_GATE_PX = 28;
const BLEND_RANGE_PX = 168;
const DOCUMENT_SURFACE_THRESHOLD_T = 0.5;

const root = document.documentElement;
const header = document.querySelector(HEADER_SELECTOR);

if (header) {
  const headerBottomPx = Math.max(0, Math.round(header.getBoundingClientRect().bottom));
  root.style.setProperty(CSS_HEADER_OFFSET_VAR, `${headerBottomPx}px`);
}

const scrollY = window.scrollY || root.scrollTop;
const surfaceSection = document.querySelector(PRIMARY_SURFACE_SELECTOR) || document.querySelector(FALLBACK_SURFACE_SELECTOR);
const headerInner = document.querySelector(HEADER_INNER_SELECTOR);

let surfaceT = 0;
if (scrollY >= HERO_SCROLL_GATE_PX && headerInner && surfaceSection) {
  const barBottomPx = headerInner.getBoundingClientRect().bottom;
  const sectionTopPx = surfaceSection.getBoundingClientRect().top;
  const gapPx = sectionTopPx - barBottomPx;
  surfaceT = 1 - Math.min(1, Math.max(0, gapPx / BLEND_RANGE_PX));
}

root.style.setProperty(CSS_HEADER_SURFACE_T_VAR, surfaceT.toFixed(4));
root.style.setProperty(CSS_HEADER_BAR_VIDEO_OPEN_VAR, BAR_VIDEO_OPEN);
root.style.setProperty(CSS_HEADER_BAR_RELEASE_T_VAR, RELEASE_T_DEFAULT);
root.dataset.headerSurface = surfaceT >= DOCUMENT_SURFACE_THRESHOLD_T ? 'document' : 'hero';
root.style.removeProperty(CSS_HEADER_SHRINK_T_VAR);

