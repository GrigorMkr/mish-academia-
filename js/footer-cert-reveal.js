export function initFooterCertReveal() {
  const card = document.querySelector('.footer-cert__card');
  if (!card) {
    return;
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  // Ensure we never animate from a "visible" first paint into the hidden state.
  // The base HTML can include these classes, but we enforce them here too.
  card.classList.add('footer-cert__card--anim', 'footer-cert__card--instant');

  const settleInstant = () => {
    card.classList.remove('footer-cert__card--instant');
  };

  const isInitiallyInView = () => {
    const r = card.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    return r.bottom > 0 && r.top < vh * 0.9;
  };

  // Set a deterministic initial state before IntersectionObserver callback runs.
  if (isInitiallyInView()) {
    card.classList.add('footer-cert__card--revealed');
  } else {
    card.classList.remove('footer-cert__card--revealed');
  }

  // Avoid refresh flicker: wait until the certificate image is decoded.
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
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.18,
    }
  );

  observer.observe(card);
}
