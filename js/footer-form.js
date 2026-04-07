function isValidLeadEmail(value) {
  const at = value.indexOf('@');
  if (at < 1) {
    return false;
  }
  const domain = value.slice(at + 1);
  return domain.length > 0 && domain.includes('.');
}

export function initFooterForm() {
  const form = document.querySelector('.footer-form__fields');
  if (!form) {
    return;
  }

  const nameInput = form.querySelector('#lead-name');
  const phoneInput = form.querySelector('#lead-phone');
  const emailInput = form.querySelector('#lead-email');

  if (!nameInput || !phoneInput || !emailInput) {
    return;
  }

  for (const input of [nameInput, phoneInput, emailInput]) {
    input.addEventListener('input', () => input.setCustomValidity(''));
  }

  form.addEventListener('submit', (event) => {
    nameInput.setCustomValidity('');
    phoneInput.setCustomValidity('');
    emailInput.setCustomValidity('');

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const email = emailInput.value.trim();

    if (!name) {
      event.preventDefault();
      nameInput.setCustomValidity('Укажите имя');
      nameInput.reportValidity();
      return;
    }

    if (!phone) {
      event.preventDefault();
      phoneInput.setCustomValidity('Укажите телефон');
      phoneInput.reportValidity();
      return;
    }

    if (!email) {
      event.preventDefault();
      emailInput.setCustomValidity('Укажите электронную почту');
      emailInput.reportValidity();
      return;
    }

    if (!isValidLeadEmail(email)) {
      event.preventDefault();
      emailInput.setCustomValidity('Введите корректный email: нужны символ @ и точка в домене');
      emailInput.reportValidity();
      return;
    }

    nameInput.value = name;
    phoneInput.value = phone;
    emailInput.value = email;
  });
}
