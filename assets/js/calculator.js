// Переиспользуемый виджет маршрута вывода: пользователь свободно выбирает,
// ГДЕ сейчас находятся деньги (у пропфирмы / на карте в любой валюте / уже
// в крипте) и КУДА их нужно перевести (на конкретную биржу, "любая биржа" —
// сравнить все, или в конкретную валюту через off-ramp), после чего виджет
// считает только применимые этапы маршрута между этими двумя точками.
//
// Комиссии `fixedFee` у всех провайдеров (EXCHANGES/OFFRAMPS/BANK_BASELINE в
// data.js) заданы в долларах — поэтому расчёт всегда идёт через доллар как
// опорную валюту: сумма сначала переводится в USD-эквивалент (если исходная
// валюта не USD и не крипта), с неё вычитаются комиссии и применяется
// спред, а результат переводится в валюту назначения (если это не USD и не
// крипта). Язык берётся из <html lang="ru|en">.
//
// Usage: initCalculator('root-id', { amount, presetSource: 'cash:USD' |
//   'firm:<slug>' | 'crypto', presetDestination: 'fiat:RUB' | 'crypto:all' |
//   'crypto:<exchangeId>' })

const CALC_STRINGS = {
  ru: {
    sourceLabel: "Где сейчас находятся деньги",
    sourceGroupFirm: "У пропфирмы — ещё не выплачено",
    sourceGroupCash: "На карте / счету",
    sourceGroupCrypto: "Уже в крипте",
    sourceCryptoOption: "USDT / USDC",
    firmInfoMethods: "Способы вывода:",
    firmInfoFee: "Комиссия фирмы:",
    firmInfoMin: "Мин. сумма вывода:",
    firmInfoSpeed: "Скорость:",
    firmInfoMore: "Подробнее о выводе →",
    amountLabel: "Сумма",
    destLabel: "Куда нужно перевести",
    destGroupCrypto: "Купить крипту (USDT)",
    destAllExchanges: "Сравнить все биржи",
    destGroupFiat: "Вывести в валюту",
    liveRate: "Курс — в реальном времени",
    tariffsVerified: (date) => `Тарифы сервисов проверены: ${date}`,
    countryLabel: "Страна проживания",
    countryOptional: "(необязательно)",
    countryPlaceholder: "например, Казахстан",
    submitButton: "Найти маршрут",
    errorAmount: "Введите сумму больше 0.",
    loading: "Загружаем актуальный курс обмена…",
    errorRates: "Не удалось загрузить актуальный курс. Попробуйте ещё раз через минуту.",
    countryNote: (country) => `Здесь показано общее сравнение маршрутов. Доступность конкретных сервисов может отличаться для резидентов страны «<strong>${country}</strong>» — уточните это у сервиса перед выбором.`,
    alreadyThereMessage: "Деньги уже в крипте, а перевести нужно тоже в крипту — переводить дальше некуда. Чтобы посчитать вывод в валюту, выберите её в поле «Куда нужно перевести».",
    alreadySameMessage: "Деньги уже в той валюте, куда вы хотите их перевести, — конвертация не нужна.",
    thMethod: "Маршрут",
    thRate: "Курс",
    thFee: "Комиссия",
    thSpeed: "Скорость",
    thReceive: "Получите на руки",
    bestBadge: "Выгоднее всего",
    unverifiedBadge: "не подтверждено",
    feeMarkup: (percent) => `~${percent}% спред`,
    feeFlat: (amount) => `${amount} фикс.`,
    feeNone: "Не раскрывается",
    disclaimer: 'Курс обновляется при каждом расчёте, спред и комиссии — по официально опубликованным тарифам провайдеров на момент проверки (могут измениться без предупреждения). Сверяйте перед крупным выводом. См.',
    disclaimerLinkText: "раскрытие информации о партнёрских ссылках",
    disclosureHref: "/disclosure/",
    getStarted: "Оформить",
    locale: "ru-RU",
  },
  en: {
    sourceLabel: "Where is the money right now",
    sourceGroupFirm: "With a prop firm — not paid out yet",
    sourceGroupCash: "On a card / account",
    sourceGroupCrypto: "Already in crypto",
    sourceCryptoOption: "USDT / USDC",
    firmInfoMethods: "Payout methods:",
    firmInfoFee: "Firm-side fee:",
    firmInfoMin: "Minimum withdrawal:",
    firmInfoSpeed: "Speed:",
    firmInfoMore: "More on this firm's payout →",
    amountLabel: "Amount",
    destLabel: "Where does it need to go",
    destGroupCrypto: "Buy crypto (USDT)",
    destAllExchanges: "Compare all exchanges",
    destGroupFiat: "Convert to a currency",
    liveRate: "Live exchange rate",
    tariffsVerified: (date) => `Provider fees verified: ${date}`,
    countryLabel: "Country of residence",
    countryOptional: "(optional)",
    countryPlaceholder: "e.g. Kazakhstan",
    submitButton: "Find a route",
    errorAmount: "Enter an amount greater than 0.",
    loading: "Fetching live exchange rates…",
    errorRates: "Couldn't fetch live rates right now. Please try again in a moment.",
    countryNote: (country) => `Showing a generic comparison of routes. Availability of specific services can vary for residents of <strong>${country}</strong> — confirm with the provider before choosing.`,
    alreadyThereMessage: "The money is already in crypto, and the destination is crypto too — there's nothing to convert. To price a currency conversion, pick one in the \"Where does it need to go\" field.",
    alreadySameMessage: "The money is already in the currency you want to convert it to — no conversion needed.",
    thMethod: "Route",
    thRate: "Rate",
    thFee: "Fee",
    thSpeed: "Speed",
    thReceive: "You receive",
    bestBadge: "Best value",
    unverifiedBadge: "unconfirmed",
    feeMarkup: (percent) => `~${percent}% spread`,
    feeFlat: (amount) => `${amount} flat`,
    feeNone: "None disclosed",
    disclaimer: "The rate refreshes on every calculation; spreads and fees come from providers' officially published tariffs as of the last check (subject to change without notice). Verify before a large withdrawal. See our",
    disclaimerLinkText: "disclosure",
    disclosureHref: "/en/disclosure/",
    getStarted: "Get started",
    locale: "en-US",
  },
};

function getCalcLang() {
  return document.documentElement.lang === "en" ? "en" : "ru";
}

function payoutBaseCalc() {
  return getCalcLang() === "en" ? "/en/payout/" : "/payout/";
}

function initCalculator(rootId, options) {
  const root = document.getElementById(rootId);
  if (!root) return;

  const opts = Object.assign(
    {
      presetSource: "cash:USD",
      presetDestination: "fiat:RUB",
      amount: 1000,
      exchanges: typeof EXCHANGES !== "undefined" ? EXCHANGES : [],
      offramps: typeof OFFRAMPS !== "undefined" ? OFFRAMPS : [],
      firms: typeof FIRMS !== "undefined" ? FIRMS : [],
      bank: typeof BANK_BASELINE !== "undefined" ? BANK_BASELINE : null,
    },
    options || {}
  );

  const t = CALC_STRINGS[getCalcLang()];

  root.innerHTML = buildFormHTML(opts, t);

  const form = root.querySelector("form");
  const resultEl = root.querySelector(".calc-result");
  const sourceSelect = form.querySelector('[name="source"]');
  const firmInfo = root.querySelector(".calc-firm-info");

  function updateFirmInfo() {
    const value = sourceSelect.value;
    const firm = value.startsWith("firm:") ? opts.firms.find((f) => f.slug === value.slice(5)) : null;
    if (firm) {
      firmInfo.innerHTML = renderFirmInfo(firm, t);
      firmInfo.hidden = false;
    } else {
      firmInfo.innerHTML = "";
      firmInfo.hidden = true;
    }
  }

  sourceSelect.addEventListener("change", updateFirmInfo);
  updateFirmInfo();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    runCalculation(form, resultEl, opts, t);
  });

  // Считаем сразу при загрузке, чтобы виджет не был пустым.
  runCalculation(form, resultEl, opts, t);
}

function renderFirmInfo(firm, t) {
  return `
    <strong>${t.firmInfoMethods}</strong> ${firm.methods.join(", ")}<br>
    <strong>${t.firmInfoFee}</strong> ${firm.fee}<br>
    <strong>${t.firmInfoMin}</strong> ${firm.minWithdrawal}<br>
    <strong>${t.firmInfoSpeed}</strong> ${firm.speed}<br>
    <a href="${payoutBaseCalc()}${firm.slug}/">${t.firmInfoMore}</a>
  `;
}

function buildTrustBarHTML(t) {
  const verifiedDate =
    typeof DATA_LAST_VERIFIED !== "undefined"
      ? new Intl.DateTimeFormat(t.locale, { year: "numeric", month: "long", day: "numeric" }).format(
          new Date(DATA_LAST_VERIFIED)
        )
      : null;

  return `
    <div class="calc-trust-bar">
      <span class="calc-trust-item"><span class="calc-trust-dot calc-trust-dot--live"></span>${t.liveRate}</span>
      ${verifiedDate ? `<span class="calc-trust-item"><span class="calc-trust-dot"></span>${t.tariffsVerified(verifiedDate)}</span>` : ""}
    </div>
  `;
}

function buildFormHTML(opts, t) {
  const sourceFirmOptions = opts.firms
    .map((f) => `<option value="firm:${f.slug}" ${`firm:${f.slug}` === opts.presetSource ? "selected" : ""}>${f.name}</option>`)
    .join("");
  const sourceCashOptions = CURRENCIES
    .map((c) => `<option value="cash:${c}" ${`cash:${c}` === opts.presetSource ? "selected" : ""}>${c}</option>`)
    .join("");
  const sourceCryptoSelected = opts.presetSource === "crypto" ? "selected" : "";

  const destExchangeOptions =
    `<option value="crypto:all" ${opts.presetDestination === "crypto:all" ? "selected" : ""}>${t.destAllExchanges}</option>` +
    opts.exchanges
      .map((e) => `<option value="crypto:${e.id}" ${`crypto:${e.id}` === opts.presetDestination ? "selected" : ""}>${e.name}</option>`)
      .join("");
  const destFiatOptions = CURRENCIES
    .map((c) => `<option value="fiat:${c}" ${`fiat:${c}` === opts.presetDestination ? "selected" : ""}>${c}</option>`)
    .join("");

  return `
    ${buildTrustBarHTML(t)}
    <form class="calc-form">
      <div class="calc-field">
        <label for="calc-source">${t.sourceLabel}</label>
        <select id="calc-source" name="source">
          <optgroup label="${t.sourceGroupFirm}">${sourceFirmOptions}</optgroup>
          <optgroup label="${t.sourceGroupCash}">${sourceCashOptions}</optgroup>
          <optgroup label="${t.sourceGroupCrypto}"><option value="crypto" ${sourceCryptoSelected}>${t.sourceCryptoOption}</option></optgroup>
        </select>
      </div>
      <div class="calc-field">
        <label for="calc-destination">${t.destLabel}</label>
        <select id="calc-destination" name="destination">
          <optgroup label="${t.destGroupCrypto}">${destExchangeOptions}</optgroup>
          <optgroup label="${t.destGroupFiat}">${destFiatOptions}</optgroup>
        </select>
      </div>
      <div class="calc-field">
        <label for="calc-amount">${t.amountLabel}</label>
        <input id="calc-amount" name="amount" type="number" min="1" step="0.01" value="${opts.amount}" required />
      </div>
      <div class="calc-field">
        <label for="calc-country">${t.countryLabel} <span class="optional">${t.countryOptional}</span></label>
        <input id="calc-country" name="country" type="text" placeholder="${t.countryPlaceholder}" />
      </div>
      <button type="submit" class="calc-submit">${t.submitButton}</button>
    </form>
    <div class="notes-box calc-firm-info" hidden></div>
    <div class="calc-result" aria-live="polite"></div>
  `;
}

function parseSource(value) {
  if (value.startsWith("firm:")) return { type: "firm", slug: value.slice(5) };
  if (value.startsWith("cash:")) return { type: "cash", currency: value.slice(5) };
  return { type: "crypto" };
}

function parseDestination(value) {
  if (value.startsWith("crypto:")) return { type: "crypto", exchange: value.slice(7) };
  return { type: "fiat", currency: value.slice(5) };
}

async function runCalculation(form, resultEl, opts, t) {
  const formData = new FormData(form);
  const amount = parseFloat(formData.get("amount"));
  const country = (formData.get("country") || "").trim();
  const source = parseSource(formData.get("source"));
  const destination = parseDestination(formData.get("destination"));

  if (!amount || amount <= 0) {
    resultEl.innerHTML = `<p class="calc-error">${t.errorAmount}</p>`;
    return;
  }

  const firm = source.type === "firm" ? opts.firms.find((f) => f.slug === source.slug) : null;
  const isSourceCrypto = source.type === "crypto";
  const isDestCrypto = destination.type === "crypto";
  const fundingCurrency = source.type === "firm" ? (firm ? firm.payoutCurrency : "USD") : source.type === "cash" ? source.currency : null;

  // Оба конца маршрута — крипта: переводить нечего.
  if (isSourceCrypto && isDestCrypto) {
    resultEl.innerHTML = `<div class="notes-box">${t.alreadyThereMessage}</div>`;
    return;
  }
  // Валюта совпадает на обоих концах: конвертация не нужна.
  if (!isSourceCrypto && !isDestCrypto && fundingCurrency === destination.currency) {
    resultEl.innerHTML = `<div class="notes-box">${t.alreadySameMessage}</div>`;
    return;
  }

  resultEl.innerHTML = `<p class="calc-loading">${t.loading}</p>`;

  // Комиссии провайдеров заданы в долларах, поэтому считаем через доллар как
  // опорную точку: rateToUSD переводит сумму в USD-эквивалент (если нужно),
  // rateFromUSD — из USD в валюту назначения (если нужно).
  const needToUSD = !isSourceCrypto && fundingCurrency !== "USD";
  const needFromUSD = !isDestCrypto && destination.currency !== "USD";

  let rateToUSD = 1;
  let rateFromUSD = 1;
  try {
    const [a, b] = await Promise.all([
      needToUSD ? getMidMarketRate(fundingCurrency, "USD") : Promise.resolve(1),
      needFromUSD ? getMidMarketRate("USD", destination.currency) : Promise.resolve(1),
    ]);
    rateToUSD = a;
    rateFromUSD = b;
  } catch (err) {
    resultEl.innerHTML = `<p class="calc-error">${t.errorRates}</p>`;
    return;
  }

  const displayFrom = isSourceCrypto ? "USDT" : fundingCurrency;
  const displayTo = isDestCrypto ? "USDT" : destination.currency;
  const amountUSD = isSourceCrypto ? amount : amount * rateToUSD;

  const buildExchangeOnlyRow = (ex) => {
    // Покупка USDT на конкретной бирже — второго этапа (off-ramp) нет.
    const afterFeeUSD = Math.max(amountUSD - ex.fixedFee, 0);
    const finalAmount = afterFeeUSD * (1 - ex.spreadPercent / 100);
    const effectiveRate = rateToUSD * (1 - ex.spreadPercent / 100);
    return {
      name: ex.name,
      finalAmount,
      effectiveRate,
      feeText: formatFee(ex.spreadPercent, ex.fixedFee, t),
      speed: ex.speed,
      linkId: ex.id,
      unverified: false,
    };
  };

  const buildOfframpOnlyRow = (offramp) => {
    // Уже в крипте — этапа покупки нет, сразу off-ramp в валюту.
    const afterFeeUSD = Math.max(amountUSD - offramp.fixedFee, 0);
    const finalAmount = afterFeeUSD * (1 - offramp.spreadPercent / 100) * rateFromUSD;
    const effectiveRate = rateFromUSD * (1 - offramp.spreadPercent / 100);
    return {
      name: offramp.name,
      finalAmount,
      effectiveRate,
      feeText: formatFee(offramp.spreadPercent, offramp.fixedFee, t),
      speed: offramp.speed,
      linkId: null,
      unverified: !offramp.dataVerified,
    };
  };

  const buildRoute = (ex, offramp) => {
    // Полный маршрут: сначала биржа (fiat → USDT), потом off-ramp (USDT → fiat).
    const afterFeeUSD1 = Math.max(amountUSD - ex.fixedFee, 0);
    const usdtAmount = afterFeeUSD1 * (1 - ex.spreadPercent / 100);
    const afterFeeUSD2 = Math.max(usdtAmount - offramp.fixedFee, 0);
    const finalAmount = afterFeeUSD2 * (1 - offramp.spreadPercent / 100) * rateFromUSD;
    const combinedSpreadPercent = 100 * (1 - (1 - ex.spreadPercent / 100) * (1 - offramp.spreadPercent / 100));
    const effectiveRate = rateToUSD * rateFromUSD * (1 - combinedSpreadPercent / 100);
    return {
      name: `${ex.name} → ${offramp.name}`,
      finalAmount,
      effectiveRate,
      feeText: formatFee(combinedSpreadPercent, ex.fixedFee + offramp.fixedFee, t),
      speed: `${ex.speed} + ${offramp.speed}`,
      linkId: ex.id,
      unverified: !offramp.dataVerified,
    };
  };

  const buildBankRow = () => {
    const afterFeeUSD = Math.max(amountUSD - opts.bank.fixedFee, 0);
    const finalAmount = afterFeeUSD * (1 - opts.bank.markupPercent / 100) * rateFromUSD;
    const effectiveRate = rateToUSD * rateFromUSD * (1 - opts.bank.markupPercent / 100);
    return {
      name: opts.bank.name,
      finalAmount,
      effectiveRate,
      feeText: formatFee(opts.bank.markupPercent, opts.bank.fixedFee, t),
      speed: opts.bank.speed,
      linkId: null,
      unverified: false,
    };
  };

  let rows;
  if (isDestCrypto) {
    const exchangesToShow =
      destination.exchange === "all" ? opts.exchanges : opts.exchanges.filter((e) => e.id === destination.exchange);
    rows = exchangesToShow.map(buildExchangeOnlyRow);
  } else if (isSourceCrypto) {
    rows = opts.offramps.map(buildOfframpOnlyRow);
  } else {
    rows = opts.exchanges.flatMap((ex) => opts.offramps.map((offramp) => buildRoute(ex, offramp)));
    if (opts.bank) rows.push(buildBankRow());
  }

  rows.sort((a, b) => b.finalAmount - a.finalAmount);
  const best = rows[0];

  resultEl.innerHTML = `
    ${country ? `<p class="calc-country-note">${t.countryNote(escapeHTML(country))}</p>` : ""}
    <div class="calc-table-wrap">
      <table class="calc-table">
        <thead>
          <tr>
            <th>${t.thMethod}</th>
            <th>${t.thRate}</th>
            <th>${t.thFee}</th>
            <th>${t.thSpeed}</th>
            <th>${t.thReceive}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
            <tr class="${row === best ? "calc-best" : ""}">
              <td data-label="${t.thMethod}">
                ${row.name}
                ${row === best ? `<span class="calc-badge">${t.bestBadge}</span>` : ""}
                ${row.unverified ? `<span class="calc-unverified">${t.unverifiedBadge}</span>` : ""}
              </td>
              <td data-label="${t.thRate}">1 ${displayFrom} = ${row.effectiveRate.toFixed(4)} ${displayTo}</td>
              <td data-label="${t.thFee}">${row.feeText}</td>
              <td data-label="${t.thSpeed}">${row.speed}</td>
              <td data-label="${t.thReceive}"><strong>${formatMoney(row.finalAmount, displayTo, t)}</strong></td>
              <td data-label="">${linkForId(row.linkId, t)}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
    <p class="calc-disclaimer">${t.disclaimer} <a href="${t.disclosureHref}">${t.disclaimerLinkText}</a>.</p>
  `;
}

function formatFee(percent, fixedFeeUSD, t) {
  const parts = [];
  if (percent) parts.push(t.feeMarkup(round1(percent)));
  if (fixedFeeUSD) parts.push(t.feeFlat(formatMoney(fixedFeeUSD, "USD", t)));
  return parts.length ? parts.join(" + ") : t.feeNone;
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function formatMoney(value, currency, t) {
  try {
    return new Intl.NumberFormat(t.locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch (e) {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function linkForId(id, t) {
  if (!id) return "";
  const link = (typeof AFFILIATE_LINKS !== "undefined" && AFFILIATE_LINKS[id]) || {};
  if (link.url) {
    return `<a class="calc-link" href="${link.url}" target="_blank" rel="noopener sponsored">${t.getStarted}</a>`;
  }
  return "";
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
