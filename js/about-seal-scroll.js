const MAX_SPEED = 0.038;
const SMOOTH_K = 5.5;

export function initAboutSealScroll() {
  const rotor = document.querySelector('.about-card__seal-rotor');
  if (!rotor) {
    return;
  }

  rotor.style.animation = 'none';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    rotor.style.transform = 'rotate(-30deg)';
    return;
  }

  let angle = -30;
  let velocity = MAX_SPEED;
  let targetSpeed = MAX_SPEED;
  let lastY = window.scrollY;
  let lastTs = performance.now();

  const step = (ts) => {
    const dt = Math.min(Math.max(ts - lastTs, 0), 48);
    lastTs = ts;

    const t = dt / 1000;
    const alpha = 1 - Math.exp(-SMOOTH_K * t);
    velocity += (targetSpeed - velocity) * alpha;

    angle += velocity * dt;
    rotor.style.transform = `rotate(${angle}deg)`;

    requestAnimationFrame(step);
  };

  requestAnimationFrame(step);

  let scrollGate = false;
  window.addEventListener(
    'scroll',
    () => {
      if (!scrollGate) {
        scrollGate = true;
        requestAnimationFrame(() => {
          const y = window.scrollY;
          const dy = y - lastY;
          lastY = y;
          if (dy > 0.5) {
            targetSpeed = MAX_SPEED;
          } else if (dy < -0.5) {
            targetSpeed = -MAX_SPEED;
          }
          scrollGate = false;
        });
      }
    },
    { passive: true }
  );
}
