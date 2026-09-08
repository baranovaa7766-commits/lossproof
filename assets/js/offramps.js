// Widget for the "Compare cash-out services" section (/offramps/):
//   - renderOfframpsCompare(rootId) → cards for OFFRAMPS (assets/js/data.js / data.en.js)
//
// Reuses the same .cmp-card / .cmp-fields markup and CSS as prop-firms.js
// and exchanges.js. Only 2 providers exist today, so there's no
// filter/sort UI here — just plain cards, same as everywhere else on the
// site. Language is taken from <html lang="ru|en">.

const OFFRAMPS_STRINGS = {
  ru: {
    fieldLicense: "Лицензия / регистрация",
    tipLicense: "Есть ли у сервиса публично проверяемая лицензия и в какой стране.",
    fieldCrypto: "Какую крипту принимает",
    tipCrypto: "Какие монеты можно отправить на конвертацию.",
    fieldCurrencies: "Куда выводит",
    tipCurrencies: "В какие валюты и на карты каких стран можно вывести деньги.",
    fieldFee: "Комиссия",
    tipFee: "Спред за конвертацию плюс отдельная фиксированная комиссия за вывод, если она есть.",
    fieldSpeed: "Скорость",
    tipSpeed: "Сколько обычно занимает вывод после отправки крипты.",
    feeText: (spread, fixed) => (fixed > 0 ? `~${spread}% спред + $${fixed} фикс.` : `~${spread}% спред`),
    getStarted: "Перейти на сайт",
    researched: (d) => `Тарифы проверены напрямую на сайте сервиса: ${d}. Тарифы обменников меняются без предупреждения и без публичного API — сверяйте перед крупным выводом.`,
  },
  en: {
    fieldLicense: "License / registration",
    tipLicense: "Whether the service has a publicly checkable license, and in which country.",
    fieldCrypto: "Accepted crypto",
    tipCrypto: "Which coins you can send in for conversion.",
    fieldCurrencies: "Pays out in",
    tipCurrencies: "Which currencies and which countries' bank cards it can pay out to.",
    fieldFee: "Fee",
    tipFee: "The conversion spread plus a separate flat withdrawal fee, if there is one.",
    fieldSpeed: "Speed",
    tipSpeed: "How long a withdrawal usually takes after sending the crypto.",
    feeText: (spread, fixed) => (fixed > 0 ? `~${spread}% spread + $${fixed} flat` : `~${spread}% spread`),
    getStarted: "Visit site",
    researched: (d) => `Rates checked directly on the provider's own site: ${d}. Off-ramp rates change without notice and there's no public API — verify before a large withdrawal.`,
  },
};

function getOfframpLang() {
  return document.documentElement.lang === "en" ? "en" : "ru";
}

function escapeOfframp(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

function renderOfframpsCompare(rootId) {
  const root = document.getElementById(rootId);
  if (!root || typeof OFFRAMPS === "undefined") return;
  const t = OFFRAMPS_STRINGS[getOfframpLang()];

  function field(label, tip, valueHtml) {
    return `<div class="cmp-field"><dt title="${tip}">${label}</dt><dd>${valueHtml}</dd></div>`;
  }

  root.innerHTML = `
    <div class="cmp-cards">
      ${OFFRAMPS.map((o) => {
        return `
        <article class="cmp-card">
          <h3 class="cmp-card-name">${escapeOfframp(o.name)}</h3>
          <dl class="cmp-fields">
            ${field(t.fieldLicense, t.tipLicense, escapeOfframp(o.license))}
            ${field(t.fieldCrypto, t.tipCrypto, (o.crypto || []).map(escapeOfframp).join(", "))}
            ${field(t.fieldCurrencies, t.tipCurrencies, (o.currencies || []).map(escapeOfframp).join(", "))}
            ${field(t.fieldFee, t.tipFee, escapeOfframp(t.feeText(o.spreadPercent, o.fixedFee)))}
            ${field(t.fieldSpeed, t.tipSpeed, escapeOfframp(o.speed))}
          </dl>
          ${o.officialUrl ? `<p class="cmp-card-cross"><a class="pf-cross" href="${o.officialUrl}" target="_blank" rel="noopener">${t.getStarted} →</a></p>` : ""}
        </article>`;
      }).join("")}
    </div>
    <p class="calc-disclaimer">${t.researched(DATA_LAST_VERIFIED)}</p>
  `;
}
