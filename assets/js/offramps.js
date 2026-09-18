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
    fieldBuy: "Купить USDT (ввод денег)",
    tipBuy: "Сколько стоит обменять деньги на USDT: по способам оплаты, от дешёвых к дорогим.",
    fieldSell: "Продать USDT (вывод денег)",
    tipSell: "Сколько стоит обменять USDT на деньги и вывести их: по способам вывода, от дешёвых к дорогим.",
    modeAccount: "Через счёт",
    modeInstant: "Мгновенный обмен",
    modePair: "Комиссия",
    fieldFee: "Комиссия",
    tipFee: "Спред за конвертацию плюс отдельная фиксированная комиссия за вывод, если она есть.",
    fieldSpeed: "Скорость",
    tipSpeed: "Сколько обычно занимает вывод после отправки крипты.",
    feeText: (spread, fixed) => (fixed > 0 ? `~${spread}% спред + $${fixed} фикс.` : `~${spread}% спред`),
    getStarted: "Перейти на сайт",
    researched: (d) => `Тарифы сверяются с официальными страницами сервисов автоматически каждую ночь — последняя сверка: ${d}. Тарифы меняются без предупреждения — перед крупным выводом проверьте их на сайте сервиса.`,
  },
  en: {
    fieldLicense: "License / registration",
    tipLicense: "Whether the service has a publicly checkable license, and in which country.",
    fieldCrypto: "Accepted crypto",
    tipCrypto: "Which coins you can send in for conversion.",
    fieldCurrencies: "Pays out in",
    tipCurrencies: "Which currencies and which countries' bank cards it can pay out to.",
    fieldBuy: "Buy USDT (deposit)",
    tipBuy: "What it costs to exchange money for USDT, by payment method, cheapest first.",
    fieldSell: "Sell USDT (withdrawal)",
    tipSell: "What it costs to exchange USDT for money and withdraw it, by withdrawal method, cheapest first.",
    modeAccount: "Via account",
    modeInstant: "Instant exchange",
    modePair: "Fee",
    fieldFee: "Fee",
    tipFee: "The conversion spread plus a separate flat withdrawal fee, if there is one.",
    fieldSpeed: "Speed",
    tipSpeed: "How long a withdrawal usually takes after sending the crypto.",
    feeText: (spread, fixed) => (fixed > 0 ? `~${spread}% spread + $${fixed} flat` : `~${spread}% spread`),
    getStarted: "Visit site",
    researched: (d) => `Rates are checked against the providers' official pages automatically every night — last check: ${d}. Rates change without notice — verify on the provider's site before a large withdrawal.`,
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

// Комиссии по способам оплаты из assets/data/tariffs.json (ту же модель каналов
// и склейку одинаковых цен использует калькулятор — calculator.js подключён
// на этой странице). Если файл или calculator.js недоступны — старое общее поле.
function offrampFeeLines(channels, currency, kind, ct, t) {
  const groups = groupChannels(channels, currency, ct).sort((a, b) => a.min - b.min);
  const byMode = {};
  groups.forEach((g) => {
    const label = g.mode === "account" ? t.modeAccount : g.mode === "instant" ? t.modeInstant : t.modePair;
    const fixed = kind === "sell" && g.fixedUSD ? ` + ${ct.feeFlat(formatMoney(g.fixedUSD, "USD", ct))}` : "";
    (byMode[label] = byMode[label] || []).push(`${g.methods.length ? g.methods.join(" / ") + " " : ""}${percentText(g, ct)}${fixed}`);
  });
  return Object.entries(byMode).map(([label, items]) => `${escapeOfframp(label)}: ${items.map(escapeOfframp).join(", ")}`);
}

function offrampChannelFees(o, channels, kind, ct, t) {
  const list = channels[o.id][kind];
  const currencies = Array.from(new Set(list.map((c) => c.currency)));
  const sections = currencies.map((cur) => {
    const lines = offrampFeeLines(list, cur, kind, ct, t);
    return lines.length ? `<strong>${escapeOfframp(cur)}</strong> — ${lines.join("; ")}` : "";
  });
  return sections.filter(Boolean).join("<br>");
}

async function renderOfframpsCompare(rootId) {
  const root = document.getElementById(rootId);
  if (!root || typeof OFFRAMPS === "undefined") return;
  const t = OFFRAMPS_STRINGS[getOfframpLang()];

  let tariffs = null;
  if (typeof buildChannels === "function") {
    try {
      const r = await fetch("/assets/data/tariffs.json", { cache: "no-cache" });
      tariffs = r.ok ? await r.json() : null;
    } catch (e) {
      tariffs = null;
    }
  }
  const ct = typeof CALC_STRINGS !== "undefined" ? CALC_STRINGS[getOfframpLang()] : null;
  const channels = tariffs && ct ? buildChannels({ offramps: OFFRAMPS, tariffs }) : null;
  const verifiedRaw = tariffs && tariffs.updatedAt ? tariffs.updatedAt : DATA_LAST_VERIFIED;
  const verified = ct ? formatCalcDate(verifiedRaw, ct) : verifiedRaw;

  function field(label, tip, valueHtml) {
    return `<div class="cmp-field"><dt title="${tip}">${label}</dt><dd>${valueHtml}</dd></div>`;
  }

  const feeFields = (o) =>
    channels
      ? field(t.fieldBuy, t.tipBuy, offrampChannelFees(o, channels, "buy", ct, t) || "—") +
        field(t.fieldSell, t.tipSell, offrampChannelFees(o, channels, "sell", ct, t) || "—")
      : field(t.fieldFee, t.tipFee, escapeOfframp(t.feeText(o.spreadPercent, o.fixedFee)));

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
            ${feeFields(o)}
            ${field(t.fieldSpeed, t.tipSpeed, escapeOfframp(o.speed))}
          </dl>
          ${o.officialUrl ? `<p class="cmp-card-cross"><a class="pf-cross" href="${o.officialUrl}" target="_blank" rel="noopener">${t.getStarted} →</a></p>` : ""}
        </article>`;
      }).join("")}
    </div>
    <p class="calc-disclaimer">${t.researched(verified)}</p>
  `;
}
