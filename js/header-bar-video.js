const PLAYBACK_RATE = 1;

function tryPlay(video) {
  if (!video || video.hidden || video.error) {
    return;
  }
  video.muted = true;
  const p = video.play();
  if (p !== undefined && typeof p.catch === 'function') {
    p.catch(() => {});
  }
}

export function initHeaderBarVideo() {
  const video = document.querySelector('.site-stack-video__el');
  if (!video) {
    return;
  }

  video.addEventListener(
    'error',
    () => {
      video.hidden = true;
      video.pause();
    },
    { once: true },
  );

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    video.hidden = true;
    video.pause();
    return;
  }

  video.muted = true;
  video.loop = true;
  video.playbackRate = PLAYBACK_RATE;

  video.addEventListener('loadedmetadata', () => {
    video.playbackRate = PLAYBACK_RATE;
  });

  video.addEventListener('pause', () => {
    if (video.hidden || document.hidden || video.error) {
      return;
    }
    requestAnimationFrame(() => {
      if (video.paused) {
        tryPlay(video);
      }
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      tryPlay(video);
    }
  });

  tryPlay(video);
}
