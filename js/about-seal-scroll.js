const SEAL_BASE_SPEED_DEG_PER_MS = 0.038;
const SEAL_SPEED_SMOOTHING_K = 5.5;
const SEAL_INITIAL_ANGLE_DEG = -30;
const FRAME_DT_CAP_MS = 48;
const MS_PER_SECOND = 1000;
const SCROLL_DIRECTION_THRESHOLD_PX = 0.5;

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

  let angleDeg = SEAL_INITIAL_ANGLE_DEG;
  let angularVelocityDegPerMs = SEAL_BASE_SPEED_DEG_PER_MS;
  let targetSpeedDegPerMs = SEAL_BASE_SPEED_DEG_PER_MS;
  let lastScrollY = window.scrollY;
  let lastTimestampMs = performance.now();

  const tick = (timestampMs) => {
    const deltaMs = Math.min(Math.max(timestampMs - lastTimestampMs, 0), FRAME_DT_CAP_MS);
    lastTimestampMs = timestampMs;

    const elapsedSeconds = deltaMs / MS_PER_SECOND;
    const smoothingAlpha = 1 - Math.exp(-SEAL_SPEED_SMOOTHING_K * elapsedSeconds);
    angularVelocityDegPerMs += (targetSpeedDegPerMs - angularVelocityDegPerMs) * smoothingAlpha;

    angleDeg += angularVelocityDegPerMs * deltaMs;
    rotor.style.transform = `rotate(${angleDeg}deg)`;

    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);

  let scrollHandlerCoalescing = false;
  window.addEventListener(
    'scroll',
    () => {
      if (!scrollHandlerCoalescing) {
        scrollHandlerCoalescing = true;
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const deltaScrollY = scrollY - lastScrollY;
          lastScrollY = scrollY;
          if (deltaScrollY > SCROLL_DIRECTION_THRESHOLD_PX) {
            targetSpeedDegPerMs = SEAL_BASE_SPEED_DEG_PER_MS;
          } else if (deltaScrollY < -SCROLL_DIRECTION_THRESHOLD_PX) {
            targetSpeedDegPerMs = -SEAL_BASE_SPEED_DEG_PER_MS;
          }
          scrollHandlerCoalescing = false;
        });
      }
    },
    { passive: true },
  );
}
