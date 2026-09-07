// Обработка формы обратной связи (/feedback/, /en/feedback/).
//
// Отправляет данные формы через Formspree (https://formspree.io) — бесплатный
// сервис "форма → письмо на почту", без своего бэкенда. FEEDBACK_ENDPOINT уже
// подключён к реальной форме — письма с обратной связью приходят на почту,
// привязанную к ней в Formspree, и остаются в её дашборде.
//
// FEEDBACK_FALLBACK_EMAIL ниже — всё ещё заглушка (используется только как
// запасной mailto-вариант, если fetch не удался). Замените на адрес, который
// готовы публиковать на сайте.
const FEEDBACK_ENDPOINT = "https://formspree.io/f/mljeplwe";
const FEEDBACK_FALLBACK_EMAIL = "feedback@example.com";

const FEEDBACK_STRINGS = {
  ru: {
    sending: "Отправляем…",
    success: "Спасибо! Сообщение получено.",
    error: "Не удалось отправить через форму. Напишите нам напрямую:",
    notConfigured: "Форма пока не подключена к почте. Напишите нам напрямую:",
  },
  en: {
    sending: "Sending…",
    success: "Thanks! Your message was received.",
    error: "Couldn't submit the form. Email us directly instead:",
    notConfigured: "The form isn't wired up to an inbox yet. Email us directly instead:",
  },
};

function initFeedbackForm(formId, resultId) {
  const form = document.getElementById(formId);
  const resultEl = document.getElementById(resultId);
  if (!form || !resultEl) return;

  const lang = document.documentElement.lang === "en" ? "en" : "ru";
  const t = FEEDBACK_STRINGS[lang];

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Honeypot: real visitors never fill this hidden field in — if it's
    // filled, silently drop the submission instead of sending spam onward.
    const honeypot = form.elements["_gotcha"];
    if (honeypot && honeypot.value) {
      form.reset();
      return;
    }

    if (FEEDBACK_ENDPOINT.includes("YOUR_FORM_ID")) {
      resultEl.innerHTML = `<p class="feedback-error">${t.notConfigured} <a href="mailto:${FEEDBACK_FALLBACK_EMAIL}">${FEEDBACK_FALLBACK_EMAIL}</a></p>`;
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    resultEl.innerHTML = `<p class="feedback-sending">${t.sending}</p>`;

    try {
      const response = await fetch(FEEDBACK_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });
      if (!response.ok) throw new Error(`Bad response: ${response.status}`);
      form.hidden = true;
      resultEl.innerHTML = `<p class="feedback-success">✅ ${t.success}</p>`;
    } catch (err) {
      resultEl.innerHTML = `<p class="feedback-error">${t.error} <a href="mailto:${FEEDBACK_FALLBACK_EMAIL}">${FEEDBACK_FALLBACK_EMAIL}</a></p>`;
      submitBtn.disabled = false;
    }
  });
}
