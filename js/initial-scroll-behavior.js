const INITIAL_SCROLL_BEHAVIOR = 'auto';
const RESET_AFTER_FRAME = 1;

const root = document.documentElement;

function clearScrollBehavior() {
  root.style.scrollBehavior = '';
}

root.style.scrollBehavior = INITIAL_SCROLL_BEHAVIOR;

window.addEventListener(
  'load',
  () => {
    for (let frame = 0; frame < RESET_AFTER_FRAME; frame += 1) {
      requestAnimationFrame(clearScrollBehavior);
    }
  },
  { once: true },
);

