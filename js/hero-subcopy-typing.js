function prefersReducedMotion() {
  return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitUntilDocumentVisible() {
  if (document.visibilityState === 'visible') {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        document.removeEventListener('visibilitychange', onVis);
        resolve();
      }
    };
    document.addEventListener('visibilitychange', onVis);
  });
}

async function typeRow(row, text, { charDelayMs }) {
  row.classList.add('hero__subcopy-row--typing');
  row.textContent = '';

  for (let i = 0; i <= text.length; i++) {
    row.textContent = text.slice(0, i);
    await sleep(charDelayMs);
  }

  row.classList.remove('hero__subcopy-row--typing');
}

export function initHeroSubcopyTyping() {
  const layer = document.querySelector('.hero__subcopy--layer');
  if (!layer) {
    return;
  }

  const rows = Array.from(layer.querySelectorAll('.hero__subcopy-row'));
  if (rows.length === 0) {
    return;
  }

  if (prefersReducedMotion()) {
    return;
  }

  if (layer.dataset.heroSubcopyTyped === 'true') {
    return;
  }
  layer.dataset.heroSubcopyTyped = 'true';

  const texts = rows.map((r) => (r.textContent || '').replace(/\s+/g, ' ').trim());
  if (texts.every((t) => t.length === 0)) {
    return;
  }

  const backup = texts.slice();

  rows.forEach((r) => {
    r.textContent = '';
  });

  const restoreAll = () => {
    rows.forEach((r, i) => {
      r.textContent = backup[i] ?? '';
    });
    rows.forEach((r) => r.classList.remove('hero__subcopy-row--typing'));
  };

  (async () => {
    let failSafeTimer = 0;
    try {
      await waitUntilDocumentVisible();
      await sleep(250);

      const expectedLen = backup.reduce((n, t) => n + (t ? t.length : 0), 0);
      if (expectedLen > 0) {
        failSafeTimer = window.setTimeout(() => {
          const got = rows.reduce((n, r) => n + (r.textContent || '').length, 0);
          if (got === 0) {
            restoreAll();
          }
        }, 12000);
      }

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const text = texts[i];
        if (!text) {
          continue;
        }

        await typeRow(row, text, { charDelayMs: 22 });
        await sleep(i === rows.length - 1 ? 0 : 180);
      }
      if (failSafeTimer) {
        window.clearTimeout(failSafeTimer);
      }
    } catch {
      restoreAll();
      if (failSafeTimer) {
        window.clearTimeout(failSafeTimer);
      }
    }
  })();
}
