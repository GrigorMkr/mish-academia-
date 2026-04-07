export function initButtonBlur() {
  document.querySelectorAll('.btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      btn.blur();
    });
  });
}
