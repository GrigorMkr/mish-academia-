export function initHeroCollageReady() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('hero-collage-painted');
    return;
  }

  const imgs = Array.from(document.querySelectorAll('.hero-main__photo-stack img'));
  if (imgs.length === 0) {
    return;
  }

  let pending = imgs.length;
  const reveal = () => {
    pending -= 1;
    if (pending <= 0) {
      document.documentElement.classList.add('hero-collage-painted');
    }
  };

  for (const img of imgs) {
    if (img.complete && img.naturalWidth > 0) {
      reveal();
    } else {
      img.addEventListener('load', reveal, { once: true });
      img.addEventListener('error', reveal, { once: true });
    }
  }
}
