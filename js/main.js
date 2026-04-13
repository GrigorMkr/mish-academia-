import { initButtonBlur } from './button-blur.js';
import { initSmoothAnchorScroll } from './smooth-anchor-scroll.js';
import { initSiteMenu } from './menu.js';
import { initHeaderExpandOnScroll } from './header-expand-scroll.js';
import { initHeaderScroll } from './header-scroll.js';
import { initHeaderBarVideo } from './header-bar-video.js';
import { initAboutSealScroll } from './about-seal-scroll.js';
import { initFooterForm } from './footer-form.js';
import { initHeroSubcopyPosition } from './hero-subcopy-position.js';
import { initFooterCertReveal } from './footer-cert-reveal.js';
import { initHeroSubcopyTyping } from './hero-subcopy-typing.js';
import { initHeroTitleTyping } from './hero-title-typing.js';
import { initHeroCollageReady } from './hero-collage-ready.js';

function safeInit(initFn) {
  try {
    initFn();
  } catch {
    void 0;
  }
}

safeInit(initHeroCollageReady);
safeInit(initButtonBlur);
safeInit(initSiteMenu);
safeInit(initHeaderExpandOnScroll);
safeInit(initHeaderScroll);
safeInit(initSmoothAnchorScroll);
safeInit(initHeaderBarVideo);
safeInit(initAboutSealScroll);
safeInit(initFooterForm);
safeInit(initHeroSubcopyPosition);
safeInit(initFooterCertReveal);
safeInit(initHeroSubcopyTyping);
safeInit(initHeroTitleTyping);
