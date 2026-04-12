const MOBILE_NAV_BREAKPOINT_MAX_PX = 480;

let menuScrollLockY = 0;

function applyMenuBodyScrollLock(isLocked) {
  const body = document.body;
  if (!body) {
    return;
  }
  if (isLocked) {
    menuScrollLockY = window.scrollY || document.documentElement.scrollTop || 0;
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${menuScrollLockY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    return;
  }
  body.style.overflow = '';
  body.style.position = '';
  body.style.top = '';
  body.style.left = '';
  body.style.right = '';
  body.style.width = '';
  window.scrollTo(0, menuScrollLockY);
  requestAnimationFrame(() => {
    window.dispatchEvent(new Event('scroll'));
  });
}

export function closeSiteMenu() {
  const header = document.querySelector('.site-header');
  const burger = document.querySelector('.site-header__burger');
  if (!header) {
    return;
  }
  if (!header.classList.contains('site-header--menu-open')) {
    return;
  }
  header.classList.remove('site-header--menu-open');
  if (burger) {
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
  }
  applyMenuBodyScrollLock(false);
}

export function initSiteMenu() {
  const header = document.querySelector('.site-header');
  const burger = document.querySelector('.site-header__burger');
  const nav = document.querySelector('#site-header-nav');
  const scrim = document.querySelector('.site-header__menu-scrim');

  if (!header || !burger || !nav) {
    return;
  }

  function setMenuOpen(isOpen) {
    header.classList.toggle('site-header--menu-open', isOpen);
    burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    burger.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
    applyMenuBodyScrollLock(isOpen);
  }

  function toggleMenu() {
    setMenuOpen(!header.classList.contains('site-header--menu-open'));
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  function onWindowResize() {
    if (window.innerWidth > MOBILE_NAV_BREAKPOINT_MAX_PX) {
      closeMenu();
    }
  }

  burger.addEventListener('click', toggleMenu);
  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });
  if (scrim) {
    scrim.addEventListener('click', closeMenu);
  }
  window.addEventListener('resize', onWindowResize);
}
