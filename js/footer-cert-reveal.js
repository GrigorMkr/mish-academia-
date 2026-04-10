const IN_VIEW_HEIGHT_RATIO = 0.9;
const INTERSECTION_ROOT_MARGIN = '0px 0px -10% 0px';
const INTERSECTION_THRESHOLD = 0.18;

export function initFooterCertReveal() {
  const card = document.querySelector('.footer-cert__card');
  if (!card) {
    return;
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  card.classList.add('footer-cert__card--anim', 'footer-cert__card--instant');

  const settleInstant = () => {
    card.classList.remove('footer-cert__card--instant');
  };

  const isInitiallyInView = () => {
    const rect = card.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    return rect.bottom > 0 && rect.top < viewportHeight * IN_VIEW_HEIGHT_RATIO;
  };

  if (isInitiallyInView()) {
    card.classList.add('footer-cert__card--revealed');
  } else {
    card.classList.remove('footer-cert__card--revealed');
  }

  const img = card.querySelector('.footer-cert__right img.footer-cert__layer');
  const settleAssetsReady = () => card.classList.add('footer-cert__card--assets-ready');

  if (!img) {
    settleAssetsReady();
  } else if (typeof img.decode === 'function') {
    img.decode().catch(() => {}).then(settleAssetsReady);
  } else if (img.complete) {
    settleAssetsReady();
  } else {
    img.addEventListener('load', settleAssetsReady, { once: true });
    img.addEventListener('error', settleAssetsReady, { once: true });
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(settleInstant);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          card.classList.remove('footer-cert__card--instant');
          card.classList.add('footer-cert__card--revealed');
        } else {
          card.classList.add('footer-cert__card--instant');
          card.classList.remove('footer-cert__card--revealed');
          requestAnimationFrame(() => {
            requestAnimationFrame(settleInstant);
          });
        }
      }
    },
    {
      root: null,
      rootMargin: INTERSECTION_ROOT_MARGIN,
      threshold: INTERSECTION_THRESHOLD,
    },
  );

  observer.observe(card);
}
