const SEAL_INITIAL_ANGLE_DEG = -30;
const SEAL_DEG_PER_SCROLL_PX = 0.072;
const SEAL_SMOOTH_TAU_MS = 240;
const SEAL_ANGLE_EPS_DEG = 0.03;
const FRAME_DT_CAP_MS = 48;

function readWindowScrollY() {
  return window.scrollY ?? document.documentElement.scrollTop ?? 0;
}

export function initAboutSealScroll() {
  const rotor = document.querySelector('.about-card__seal-rotor');
  if (!rotor) {
    return;
  }

  rotor.style.animation = 'none';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    rotor.style.transform = `rotate(${SEAL_INITIAL_ANGLE_DEG}deg)`;
    return;
  }

  let currentAngleDeg = SEAL_INITIAL_ANGLE_DEG;
  let targetAngleDeg = SEAL_INITIAL_ANGLE_DEG;
  let rafId = 0;
  let lastTickMs = 0;

  function syncTargetFromScroll() {
    const scrollY = Math.max(0, readWindowScrollY());
    targetAngleDeg = SEAL_INITIAL_ANGLE_DEG + scrollY * SEAL_DEG_PER_SCROLL_PX;
  }

  function tick(nowMs) {
    rafId = 0;
    const t = typeof nowMs === 'number' ? nowMs : performance.now();
    const deltaMs = lastTickMs ? Math.min(t - lastTickMs, FRAME_DT_CAP_MS) : FRAME_DT_CAP_MS;
    lastTickMs = t;

    const alpha = 1 - Math.exp(-deltaMs / SEAL_SMOOTH_TAU_MS);
    currentAngleDeg += (targetAngleDeg - currentAngleDeg) * alpha;

    if (Math.abs(targetAngleDeg - currentAngleDeg) < SEAL_ANGLE_EPS_DEG) {
      currentAngleDeg = targetAngleDeg;
    }

    rotor.style.transform = `rotate(${currentAngleDeg}deg)`;

    if (Math.abs(targetAngleDeg - currentAngleDeg) > SEAL_ANGLE_EPS_DEG) {
      rafId = requestAnimationFrame(tick);
    } else {
      lastTickMs = 0;
    }
  }

  function onScroll() {
    syncTargetFromScroll();
    if (!rafId) {
      rafId = requestAnimationFrame(tick);
    }
  }

  syncTargetFromScroll();
  currentAngleDeg = targetAngleDeg;
  rotor.style.transform = `rotate(${currentAngleDeg}deg)`;

  window.addEventListener('scroll', onScroll, { passive: true });
}
