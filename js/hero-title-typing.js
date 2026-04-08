function prefersReducedMotion() {
  return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function typeLine(el, text, { charDelayMs }) {
  el.classList.add('hero-glass__title-line--typing');
  el.textContent = '';

  for (let i = 0; i <= text.length; i++) {
    el.textContent = text.slice(0, i);
    await sleep(charDelayMs);
  }

  el.classList.remove('hero-glass__title-line--typing');
}

export function initHeroTitleTyping() {
  const title = document.querySelector('.hero-glass__title');
  if (!title) {
    return;
  }
  if (prefersReducedMotion()) {
    return;
  }
  if (title.dataset.heroTitleTyped === 'true') {
    return;
  }
  title.dataset.heroTitleTyped = 'true';

  const lines = Array.from(title.querySelectorAll('.hero-glass__title-line'));
  if (lines.length === 0) {
    return;
  }

  const texts = lines.map((l) => (l.textContent || '').replace(/\s+/g, ' ').trim());
  if (texts.every((t) => t.length === 0)) {
    return;
  }

  lines.forEach((l) => {
    l.textContent = '';
  });

  (async () => {
    await sleep(250);

    for (let i = 0; i < lines.length; i++) {
      const el = lines[i];
      const text = texts[i];
      if (!text) {
        continue;
      }
      await typeLine(el, text, { charDelayMs: 26 });
      await sleep(i === lines.length - 1 ? 0 : 120);
    }
  })();
}
