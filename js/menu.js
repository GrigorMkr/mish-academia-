const MOBILE_NAV_BREAKPOINT_MAX_PX = 480;

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
  document.body.style.overflow = '';
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
    document.body.style.overflow = isOpen ? 'hidden' : '';
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
