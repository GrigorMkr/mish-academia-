const PLAYBACK_RATE = 1;

function tryPlay(video) {
  if (!video || video.hidden || video.error) {
    return;
  }
  video.muted = true;
  video.defaultMuted = true;
  if ('playsInline' in video) {
    video.playsInline = true;
  }
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

  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  if ('playsInline' in video) {
    video.playsInline = true;
  }
  video.muted = true;
  video.defaultMuted = true;

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

  video.loop = true;
  video.playbackRate = PLAYBACK_RATE;
  video.setAttribute('disablePictureInPicture', '');

  const onReady = () => {
    video.playbackRate = PLAYBACK_RATE;
    tryPlay(video);
  };

  video.addEventListener('loadedmetadata', onReady);
  video.addEventListener('loadeddata', onReady);
  video.addEventListener('canplay', onReady);

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
