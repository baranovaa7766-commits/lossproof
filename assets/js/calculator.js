// Переиспользуемый виджет маршрута вывода: спрашивает, где сейчас находятся
// деньги (у пропфирмы / на карте / уже в крипте) и куда их нужно перевести
// (в валюту или оставить в USDT), затем показывает все применимые маршруты
// — покупка USDT на бирже, off-ramp конвертация в локальную валюту, банк как
// контрастный baseline — пропуская этапы, которые уже пройдены. Язык
// берётся из <html lang="ru|en">.
// Usage: initCalculator('root-id', { fundingCurrency, localCurrency, amount,
//   presetLocation: 'cash'|'firm'|'crypto', presetFirm: '<slug>' })

const CALC_STRINGS = {
  ru: {
    locationLabel: "Где сейчас находятся деньги",
    locationCash: "На карте / счету (доллары, евро и т.д.)",
    locationFirm: "У пропфирмы — ещё не выплачено",
    locationCrypto: "Уже в крипте (USDT/USDC)",
    firmLabel: "Пропфирма",
    firmPlaceholder: "— выберите фирму —",
    firmInfoMethods: "Способы вывода:",
    firmInfoFee: "Комиссия фирмы:",
    firmInfoMin: "Мин. сумма вывода:",
    firmInfoSpeed: "Скорость:",
    firmInfoMore: "Подробнее о выводе →",
    amountLabel: "Сумма выплаты",
    fromLabel: "Валюта, в которой сейчас деньги",
    toLabel: "Куда вывести",
    toCryptoOption: "Оставить в USDT (без вывода в валюту)",
    exchangeLabel: "Биржа для покупки USDT",
    allExchangesOption: "Все биржи (полная картина)",
    liveRate: "Курс — в реальном времени",
    tariffsVerified: (date) => `Тарифы сервисов проверены: ${date}`,
    countryLabel: "Страна проживания",
    countryOptional: "(необязательно)",
    countryPlaceholder: "например, Казахстан",
    submitButton: "Найти маршрут",
    errorAmount: "Введите сумму выплаты больше 0.",
    errorFirm: "Выберите пропфирму из списка.",
    loading: "Загружаем актуальный курс обмена…",
    errorRates: "Не удалось загрузить актуальный курс. Попробуйте ещё раз через минуту.",
    countryNote: (country) => `Здесь показано общее сравнение маршрутов. Доступность конкретных сервисов может отличаться для резидентов страны «<strong>${country}</strong>» — уточните это у сервиса перед выбором.`,
    alreadyThereMessage: "Деньги уже в криптовалюте — переводить дальше некуда. Чтобы посчитать вывод в валюту, выберите её в поле «Куда вывести».",
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
    locationLabel: "Where is the money right now",
    locationCash: "On a card / account (USD, EUR, etc.)",
    locationFirm: "With a prop firm — not paid out yet",
    locationCrypto: "Already in crypto (USDT/USDC)",
    firmLabel: "Prop firm",
    firmPlaceholder: "— choose a firm —",
    firmInfoMethods: "Payout methods:",
    firmInfoFee: "Firm-side fee:",
    firmInfoMin: "Minimum withdrawal:",
    firmInfoSpeed: "Speed:",
    firmInfoMore: "More on this firm's payout →",
    amountLabel: "Payout amount",
    fromLabel: "Currency the money is in now",
    toLabel: "Where to convert it to",
    toCryptoOption: "Keep it in USDT (no currency conversion)",
    exchangeLabel: "Exchange to buy USDT",
    allExchangesOption: "All exchanges (full picture)",
    liveRate: "Live exchange rate",
    tariffsVerified: (date) => `Provider fees verified: ${date}`,
    countryLabel: "Country of residence",
    countryOptional: "(optional)",
    countryPlaceholder: "e.g. Kazakhstan",
    submitButton: "Find a route",
    errorAmount: "Enter a payout amount greater than 0.",
    errorFirm: "Choose a prop firm from the list.",
    loading: "Fetching live exchange rates…",
    errorRates: "Couldn't fetch live rates right now. Please try again in a moment.",
    countryNote: (country) => `Showing a generic comparison of routes. Availability of specific services can vary for residents of <strong>${country}</strong> — confirm with the provider before choosing.`,
    alreadyThereMessage: "The money is already in crypto — there's nothing further to convert. To price a currency conversion, pick one in the \"Where to convert it to\" field.",
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
      fundingCurrency: "USD",
      localCurrency: "RUB",
      amount: 1000,
      presetLocation: "cash",
      presetFirm: "",
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
  const locationSelect = form.querySelector('[name="location"]');
  const firmSelect = form.querySelector('[name="firm"]');
  const firmField = root.querySelector(".calc-firm-field");
  const firmInfo = root.querySelector(".calc-firm-info");
  const exchangeField = root.querySelector(".calc-exchange-field");
  const fromSelect = form.querySelector('[name="from"]');

  function updateFirmInfo() {
    const firm = opts.firms.find((f) => f.slug === firmSelect.value);
    if (firm) {
      firmInfo.innerHTML = renderFirmInfo(firm, t);
      firmInfo.hidden = false;
      fromSelect.value = firm.payoutCurrency;
    } else {
      firmInfo.innerHTML = "";
      firmInfo.hidden = true;
    }
  }

  function updateVisibility() {
    const location = locationSelect.value;
    firmField.hidden = location !== "firm";
    firmInfo.hidden = location !== "firm" || !firmSelect.value;
    exchangeField.hidden = location === "crypto";
    if (location === "crypto") {
      if (fromSelect.value !== "USDT" && fromSelect.value !== "USDC") {
        fromSelect.value = "USDT";
      }
    } else if (location === "firm") {
      updateFirmInfo();
    } else if (fromSelect.value === "USDT" || fromSelect.value === "USDC") {
      fromSelect.value = opts.fundingCurrency === "USDT" || opts.fundingCurrency === "USDC" ? "USD" : opts.fundingCurrency;
    }
  }

  locationSelect.addEventListener("change", updateVisibility);
  firmSelect.addEventListener("change", updateFirmInfo);
  updateVisibility();

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
  const currencyOptions = (list, selected) =>
    list
      .map((c) => `<option value="${c}" ${c === selected ? "selected" : ""}>${c}</option>`)
      .join("");

  // USDT/USDC can be a funding currency (e.g. a firm pays out in crypto
  // directly, or the money's already sitting on an exchange) but don't make
  // sense as the target "local currency", so they're only added to the
  // "from" list, right after USD.
  const fundingCurrencies = [CURRENCIES[0], "USDT", "USDC", ...CURRENCIES.slice(1)];

  const exchangeOptions =
    opts.exchanges
      .map((e, i) => `<option value="${e.id}" ${i === 0 ? "selected" : ""}>${e.name}</option>`)
      .join("") + `<option value="all">${t.allExchangesOption}</option>`;

  const firmOptions =
    `<option value="">${t.firmPlaceholder}</option>` +
    opts.firms
      .map((f) => `<option value="${f.slug}" ${f.slug === opts.presetFirm ? "selected" : ""}>${f.name}</option>`)
      .join("");

  const toOptions =
    `<option value="crypto">${t.toCryptoOption}</option>` + currencyOptions(CURRENCIES, opts.localCurrency);

  return `
    ${buildTrustBarHTML(t)}
    <form class="calc-form">
      <div class="calc-field">
        <label for="calc-location">${t.locationLabel}</label>
        <select id="calc-location" name="location">
          <option value="cash" ${opts.presetLocation === "cash" ? "selected" : ""}>${t.locationCash}</option>
          <option value="firm" ${opts.presetLocation === "firm" ? "selected" : ""}>${t.locationFirm}</option>
          <option value="crypto" ${opts.presetLocation === "crypto" ? "selected" : ""}>${t.locationCrypto}</option>
        </select>
      </div>
      <div class="calc-field calc-firm-field">
        <label for="calc-firm">${t.firmLabel}</label>
        <select id="calc-firm" name="firm">${firmOptions}</select>
      </div>
      <div class="calc-field">
        <label for="calc-amount">${t.amountLabel}</label>
        <input id="calc-amount" name="amount" type="number" min="1" step="0.01" value="${opts.amount}" required />
      </div>
      <div class="calc-field">
        <label for="calc-from">${t.fromLabel}</label>
        <select id="calc-from" name="from">${currencyOptions(fundingCurrencies, opts.fundingCurrency)}</select>
      </div>
      <div class="calc-field">
        <label for="calc-to">${t.toLabel}</label>
        <select id="calc-to" name="to">${toOptions}</select>
      </div>
      <div class="calc-field calc-exchange-field">
        <label for="calc-exchange">${t.exchangeLabel}</label>
        <select id="calc-exchange" name="exchange">${exchangeOptions}</select>
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

async function runCalculation(form, resultEl, opts, t) {
  const formData = new FormData(form);
  const amount = parseFloat(formData.get("amount"));
  const location = formData.get("location");
  const firmSlug = formData.get("firm");
  const from = formData.get("from");
  const to = formData.get("to");
  const country = (formData.get("country") || "").trim();
  const exchangeId = formData.get("exchange");
  const showAllExchanges = exchangeId === "all";
  const exchange = opts.exchanges.find((e) => e.id === exchangeId) || opts.exchanges[0];

  if (!amount || amount <= 0) {
    resultEl.innerHTML = `<p class="calc-error">${t.errorAmount}</p>`;
    return;
  }
  if (location === "firm" && !firmSlug) {
    resultEl.innerHTML = `<p class="calc-error">${t.errorFirm}</p>`;
    return;
  }

  // The two questions that actually decide which stages apply: is the money
  // already crypto (no exchange leg needed), and does it need to leave
  // crypto at all (no off-ramp leg if the answer is "keep it in USDT").
  const skipExchange = location === "crypto";
  const skipOfframp = to === "crypto";
  const displayTo = skipOfframp ? "USDT" : to;

  if (skipExchange && skipOfframp) {
    resultEl.innerHTML = `<div class="notes-box">${t.alreadyThereMessage}</div>`;
    return;
  }

  resultEl.innerHTML = `<p class="calc-loading">${t.loading}</p>`;

  // USDT/USDC aren't ISO currencies the rate API knows about — both trade
  // ~1:1 with USD, so look up USD and use that as the mid-market rate.
  // When staying in crypto there's no real fiat pair to fetch at all.
  const apiFrom = from === "USDT" || from === "USDC" ? "USD" : from;

  let rate = 1;
  if (!skipOfframp) {
    try {
      rate = await getMidMarketRate(apiFrom, displayTo);
    } catch (err) {
      resultEl.innerHTML = `<p class="calc-error">${t.errorRates}</p>`;
      return;
    }
  }

  const buildOfframpOnlyRow = (offramp) => {
    // Already holding USDT — there's no "buy USDT" leg, just the off-ramp.
    const amountAfterFees = Math.max(amount - offramp.fixedFee, 0);
    const effectiveRate = rate * (1 - offramp.spreadPercent / 100);
    const finalAmount = amountAfterFees * effectiveRate;
    return {
      name: offramp.name,
      finalAmount,
      effectiveRate,
      feeText: formatFee(offramp.spreadPercent, offramp.fixedFee, from, t),
      speed: offramp.speed,
      linkId: null,
      unverified: !offramp.dataVerified,
    };
  };

  const buildExchangeOnlyRow = (ex) => {
    // Buying USDT but keeping it there — there's no off-ramp leg.
    const amountAfterFees = Math.max(amount - ex.fixedFee, 0);
    const effectiveRate = 1 - ex.spreadPercent / 100;
    const finalAmount = amountAfterFees * effectiveRate;
    return {
      name: ex.name,
      finalAmount,
      effectiveRate,
      feeText: formatFee(ex.spreadPercent, ex.fixedFee, from, t),
      speed: ex.speed,
      linkId: ex.id,
      unverified: false,
    };
  };

  const buildRoute = (ex, offramp) => {
    // Комиссии двух этапов вычитаются последовательно (эквивалентно вычитанию
    // суммы), а спреды перемножаются: итоговый спред = 1 - (1-e)(1-o).
    const amountAfterFees = Math.max(amount - ex.fixedFee - offramp.fixedFee, 0);
    const combinedSpreadPercent =
      100 * (1 - (1 - ex.spreadPercent / 100) * (1 - offramp.spreadPercent / 100));
    const effectiveRate = rate * (1 - combinedSpreadPercent / 100);
    const finalAmount = amountAfterFees * effectiveRate;
    return {
      name: `${ex.name} → ${offramp.name}`,
      finalAmount,
      effectiveRate,
      feeText: formatFee(combinedSpreadPercent, ex.fixedFee + offramp.fixedFee, from, t),
      speed: `${ex.speed} + ${offramp.speed}`,
      linkId: ex.id,
      unverified: !offramp.dataVerified,
    };
  };

  let routeRows;
  if (skipExchange) {
    routeRows = opts.offramps.map(buildOfframpOnlyRow);
  } else if (skipOfframp) {
    routeRows = showAllExchanges ? opts.exchanges.map(buildExchangeOnlyRow) : [buildExchangeOnlyRow(exchange)];
  } else if (showAllExchanges) {
    // "Все биржи" — show every exchange × off-ramp combination so the user
    // sees the full picture instead of just one exchange's routes.
    routeRows = opts.exchanges.flatMap((ex) => opts.offramps.map((offramp) => buildRoute(ex, offramp)));
  } else {
    routeRows = opts.offramps.map((offramp) => buildRoute(exchange, offramp));
  }

  const bankRow = opts.bank && !skipExchange && !skipOfframp
    ? (() => {
        const amountAfterFee = Math.max(amount - opts.bank.fixedFee, 0);
        const effectiveRate = rate * (1 - opts.bank.markupPercent / 100);
        const finalAmount = amountAfterFee * effectiveRate;
        return {
          name: opts.bank.name,
          finalAmount,
          effectiveRate,
          feeText: formatFee(opts.bank.markupPercent, opts.bank.fixedFee, from, t),
          speed: opts.bank.speed,
          linkId: null,
          unverified: false,
        };
      })()
    : null;

  const rows = bankRow ? [...routeRows, bankRow] : routeRows;
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
              <td data-label="${t.thRate}">1 ${from} = ${row.effectiveRate.toFixed(4)} ${displayTo}</td>
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

function formatFee(percent, fixedFee, currency, t) {
  const parts = [];
  if (percent) parts.push(t.feeMarkup(round1(percent)));
  if (fixedFee) parts.push(t.feeFlat(formatMoney(fixedFee, currency, t)));
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
