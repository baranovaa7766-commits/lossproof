// Переиспользуемый виджет «Калькулятор переводов»: пользователь свободно
// выбирает, ОТКУДА сейчас деньги (у пропфирмы / на карте в любой валюте /
// уже в крипте — в том числе на конкретной бирже) и КУДА их нужно перевести
// (на конкретную биржу, "все варианты" — сравнить сразу все биржи и
// обменники, в конкретную валюту через off-ramp, или на оплату челленджа у
// пропфирмы), после чего виджет считает только применимые этапы маршрута
// между этими двумя точками. При сравнении "всех вариантов" (покупка крипты
// или оплата фирме) в список провайдеров попадают не только биржи (EXCHANGES
// в data.js), но и обменники (OFFRAMPS с `onRampSupported: true`) — они тоже
// умеют продавать крипту за фиат, просто их тариф на покупку отдельно не
// подтверждён, поэтому такие строки помечаются «не подтверждено».
//
// Комиссии `fixedFee` у всех провайдеров (EXCHANGES/OFFRAMPS/BANK_BASELINE в
// data.js) заданы в долларах — поэтому расчёт всегда идёт через доллар как
// опорную валюту: сумма сначала переводится в USD-эквивалент (если исходная
// валюта не USD и не крипта), с неё вычитаются комиссии и применяется
// спред, а результат переводится в валюту назначения (если это не USD и не
// крипта/пропфирма). Язык берётся из <html lang="ru|en">.
//
// Диапазон вместо точного числа: у off-ramp сервисов (Whitebird, Cifra
// Markets) нет публичного API тарифов — курс USDT↔fiat привязан к P2P-рынку
// и колеблется, поэтому показывать одно точное число было бы ложной
// точностью. Любой этап, где участвует обменник (OFFRAMPS) — как off-ramp,
// так и как альтернатива бирже для покупки — считается ДИАПАЗОНОМ:
// ±OFFRAMP_TOLERANCE_PERCENT вокруг подтверждённого spreadPercent (см.
// calculator-full-rebuild-spec.md, раздел «Диапазон»). Банковский перевод
// (контрастный вариант) считается тем же способом для единообразия. Этап
// биржи (EXCHANGES) остаётся точным числом — колебания там минимальны.
//
// Usage: initCalculator('root-id', { amount, presetSource: 'cash:USD' |
//   'firm:<slug>' | 'crypto' | 'crypto:<exchangeId>', presetDestination:
//   'fiat:RUB' | 'crypto:all' | 'crypto:<exchangeId>' | 'firm:<slug>' })

// ±0,4% — середина диапазона "±0,3-0,5%", который calculator-full-rebuild-spec.md
// указывает как допуск на рыночные колебания P2P-курса у Whitebird; тот же
// допуск применяется к Cifra Markets и к банковской строке для единообразия
// (спецификация не даёт отдельных чисел для них).
const OFFRAMP_TOLERANCE_PERCENT = 0.4;

function spreadRange(spreadPercent) {
  return {
    min: Math.max(spreadPercent - OFFRAMP_TOLERANCE_PERCENT, 0),
    max: spreadPercent + OFFRAMP_TOLERANCE_PERCENT,
  };
}

const CALC_STRINGS = {
  ru: {
    sourceLabel: "Откуда",
    sourceGroupFirm: "У пропфирмы — ещё не выплачено",
    sourceGroupCash: "На карте / счету",
    sourceGroupCrypto: "Уже в крипте",
    sourceCryptoOption: "Без привязки к бирже (USDT/USDC)",
    firmInfoMethods: "Способы вывода:",
    firmInfoFee: "Комиссия фирмы:",
    firmInfoMin: "Мин. сумма вывода:",
    firmInfoSpeed: "Скорость:",
    firmInfoMore: "Подробнее о выводе →",
    amountLabel: "Сумма",
    destLabel: "Куда",
    destGroupCrypto: "Купить крипту (USDT)",
    destAllExchanges: "Сравнить все варианты (биржи и обменники)",
    destGroupFirm: "Пропфирма — оплатить челлендж",
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
    alreadyThereMessage: "Деньги уже в крипте, а перевести нужно тоже в крипту — переводить дальше некуда. Чтобы посчитать вывод в валюту или оплату челленджа, выберите нужный вариант в поле «Куда».",
    alreadySameExchangeMessage: (exchange) => `Деньги уже на ${exchange} — переводить никуда не нужно.`,
    alreadySameMessage: "Деньги уже в той валюте, куда вы хотите их перевести, — конвертация не нужна.",
    firmPaymentBlocked: (firm, notes) => `${firm} не принимает оплату криптовалютой. ${notes}`,
    thMethod: "Маршрут",
    thRate: "Курс",
    thFee: "Комиссия",
    thSpeed: "Скорость",
    thReceive: "Получите на руки",
    thArrives: "Дойдёт до фирмы",
    bestBadge: "Выгоднее всего",
    unverifiedBadge: "не подтверждено",
    feeMarkup: (percent) => `~${percent}% спред`,
    feeFlat: (amount) => `${amount} фикс.`,
    feeNone: "Не раскрывается",
    firmFeeUnknown: "комиссия фирмы за приём крипты не раскрыта",
    firmFeeKnown: (percent) => `+ ${percent}% комиссия фирмы за приём крипты`,
    viaOfframpSuffix: " (обменник)",
    rangeFrom: (min) => `от ${min}`,
    rangeTo: (max) => `до ${max}`,
    rangeDisclaimer: (date) => `<strong>Это оценка, а не гарантированная сумма.</strong> У off-ramp сервисов (обменников) нет публичного API тарифов — реальный курс на момент вашего вывода может отличаться от диапазона выше, потому что он зависит от текущей ситуации на P2P-рынке. Диапазон рассчитан на основе комиссий, зафиксированных на ${date}, плюс запас на типичные колебания курса. Точный курс перед выводом крупной суммы уточняйте напрямую на сайте сервиса.`,
    challengeAcceptsLabel: "Принимает:",
    challengeFeeLabel: "Комиссия за оплату криптой:",
    challengePayLink: (name) => `Оплатить челлендж на сайте ${name} →`,
    disclaimer: 'Курс обновляется при каждом расчёте, спред и комиссии — по официально опубликованным тарифам провайдеров на момент проверки (могут измениться без предупреждения). Сверяйте перед крупным выводом. См.',
    disclaimerLinkText: "раскрытие информации о партнёрских ссылках",
    disclosureHref: "/disclosure/",
    getStarted: "Оформить",
    locale: "ru-RU",
  },
  en: {
    sourceLabel: "From",
    sourceGroupFirm: "With a prop firm — not paid out yet",
    sourceGroupCash: "On a card / account",
    sourceGroupCrypto: "Already in crypto",
    sourceCryptoOption: "Not tied to an exchange (USDT/USDC)",
    firmInfoMethods: "Payout methods:",
    firmInfoFee: "Firm-side fee:",
    firmInfoMin: "Minimum withdrawal:",
    firmInfoSpeed: "Speed:",
    firmInfoMore: "More on this firm's payout →",
    amountLabel: "Amount",
    destLabel: "To",
    destGroupCrypto: "Buy crypto (USDT)",
    destAllExchanges: "Compare everything (exchanges and exchangers)",
    destGroupFirm: "Prop firm — pay for a challenge",
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
    alreadyThereMessage: "The money is already in crypto, and the destination is crypto too — there's nothing to convert. To price a currency conversion or a challenge payment, pick one in the \"To\" field.",
    alreadySameExchangeMessage: (exchange) => `The money is already on ${exchange} — nothing to transfer.`,
    alreadySameMessage: "The money is already in the currency you want to convert it to — no conversion needed.",
    firmPaymentBlocked: (firm, notes) => `${firm} doesn't accept crypto payment. ${notes}`,
    thMethod: "Route",
    thRate: "Rate",
    thFee: "Fee",
    thSpeed: "Speed",
    thReceive: "You receive",
    thArrives: "Arrives at the firm",
    bestBadge: "Best value",
    unverifiedBadge: "unconfirmed",
    feeMarkup: (percent) => `~${percent}% spread`,
    feeFlat: (amount) => `${amount} flat`,
    feeNone: "None disclosed",
    firmFeeUnknown: "the firm's crypto-processing fee isn't disclosed",
    firmFeeKnown: (percent) => `+ ${percent}% firm crypto-processing fee`,
    viaOfframpSuffix: " (exchanger)",
    rangeFrom: (min) => `from ${min}`,
    rangeTo: (max) => `to ${max}`,
    rangeDisclaimer: (date) => `<strong>This is an estimate, not a guaranteed amount.</strong> Off-ramp services (exchangers) don't publish a fee API — the actual rate at the time you cash out can differ from the range above, since it tracks the current P2P market. The range is based on fees confirmed as of ${date}, plus a margin for typical rate swings. Check the exact rate directly on the provider's site before a large withdrawal.`,
    challengeAcceptsLabel: "Accepts:",
    challengeFeeLabel: "Crypto payment fee:",
    challengePayLink: (name) => `Pay for the challenge on ${name}'s site →`,
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
  const amountCurrencyEl = root.querySelector(".calc-amount-currency");

  function updateSourceUI() {
    const value = sourceSelect.value;
    const firm = value.startsWith("firm:") ? opts.firms.find((f) => f.slug === value.slice(5)) : null;
    if (firm) {
      firmInfo.innerHTML = renderFirmInfo(firm, t);
      firmInfo.hidden = false;
    } else {
      firmInfo.innerHTML = "";
      firmInfo.hidden = true;
    }
    amountCurrencyEl.textContent = sourceCurrencyLabel(value, opts);
  }

  sourceSelect.addEventListener("change", updateSourceUI);
  updateSourceUI();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    runCalculation(form, resultEl, opts, t);
  });

  // Считаем сразу при загрузке, чтобы виджет не был пустым.
  runCalculation(form, resultEl, opts, t);
}

function sourceCurrencyLabel(value, opts) {
  if (value.startsWith("firm:")) {
    const firm = opts.firms.find((f) => f.slug === value.slice(5));
    return firm ? firm.payoutCurrency : "USD";
  }
  if (value.startsWith("cash:")) return value.slice(5);
  return "USDT";
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

function renderChallengePaymentNote(firm, t) {
  const cp = firm.challengePayment;
  const feeText = cp.cryptoFeePercent != null ? `${cp.cryptoFeePercent}%` : t.firmFeeUnknown;
  return `
    <strong>${t.challengeAcceptsLabel}</strong> ${cp.cryptoAssets}<br>
    <strong>${t.challengeFeeLabel}</strong> ${feeText}<br>
    ${cp.notes ? `${cp.notes}<br>` : ""}
    <a href="${cp.officialUrl}" target="_blank" rel="noopener">${t.challengePayLink(firm.name)}</a>
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
  const sourceExchangeOptions = opts.exchanges
    .map((e) => `<option value="crypto:${e.id}" ${`crypto:${e.id}` === opts.presetSource ? "selected" : ""}>${e.name}</option>`)
    .join("");

  const destExchangeOptions =
    `<option value="crypto:all" ${opts.presetDestination === "crypto:all" ? "selected" : ""}>${t.destAllExchanges}</option>` +
    opts.exchanges
      .map((e) => `<option value="crypto:${e.id}" ${`crypto:${e.id}` === opts.presetDestination ? "selected" : ""}>${e.name}</option>`)
      .join("");
  const destFirmOptions = opts.firms
    .map((f) => `<option value="firm:${f.slug}" ${`firm:${f.slug}` === opts.presetDestination ? "selected" : ""}>${f.name}</option>`)
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
          <optgroup label="${t.sourceGroupCrypto}">
            <option value="crypto" ${sourceCryptoSelected}>${t.sourceCryptoOption}</option>
            ${sourceExchangeOptions}
          </optgroup>
        </select>
      </div>
      <div class="calc-field">
        <label for="calc-destination">${t.destLabel}</label>
        <select id="calc-destination" name="destination">
          <optgroup label="${t.destGroupCrypto}">${destExchangeOptions}</optgroup>
          <optgroup label="${t.destGroupFirm}">${destFirmOptions}</optgroup>
          <optgroup label="${t.destGroupFiat}">${destFiatOptions}</optgroup>
        </select>
      </div>
      <div class="calc-field">
        <label for="calc-amount">${t.amountLabel} (<span class="calc-amount-currency"></span>)</label>
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
  if (value.startsWith("crypto:")) return { type: "crypto", exchange: value.slice(7) };
  return { type: "crypto", exchange: null };
}

function parseDestination(value) {
  if (value.startsWith("crypto:")) return { type: "crypto", exchange: value.slice(7) };
  if (value.startsWith("firm:")) return { type: "firm", slug: value.slice(5) };
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

  const sourceFirm = source.type === "firm" ? opts.firms.find((f) => f.slug === source.slug) : null;
  const destFirm = destination.type === "firm" ? opts.firms.find((f) => f.slug === destination.slug) : null;
  const isSourceCrypto = source.type === "crypto";
  const isDestCrypto = destination.type === "crypto";
  const isDestFirm = destination.type === "firm";
  // И "купить крипту", и "оплатить пропфирму крипто" заканчиваются тем, что
  // деньги остаются в USDT — второго (off-ramp) этапа в обоих случаях нет.
  const isDestCryptoLike = isDestCrypto || isDestFirm;
  const fundingCurrency = source.type === "firm" ? (sourceFirm ? sourceFirm.payoutCurrency : "USD") : source.type === "cash" ? source.currency : null;

  // Пропфирма не принимает оплату криптой — маршрута нет, показываем это сразу.
  if (isDestFirm && destFirm && !destFirm.challengePayment.acceptsCrypto) {
    resultEl.innerHTML = `<div class="notes-box">${t.firmPaymentBlocked(destFirm.name, destFirm.challengePayment.notes)}</div>`;
    return;
  }
  // Оба конца маршрута — крипта: переводить нечего (кроме как между биржами).
  if (isSourceCrypto && isDestCrypto) {
    if (source.exchange && destination.exchange && destination.exchange !== "all" && source.exchange === destination.exchange) {
      const ex = opts.exchanges.find((e) => e.id === source.exchange);
      resultEl.innerHTML = `<div class="notes-box">${t.alreadySameExchangeMessage(ex ? ex.name : source.exchange)}</div>`;
    } else {
      resultEl.innerHTML = `<div class="notes-box">${t.alreadyThereMessage}</div>`;
    }
    return;
  }
  // Валюта совпадает на обоих концах: конвертация не нужна.
  if (!isSourceCrypto && !isDestCryptoLike && fundingCurrency === destination.currency) {
    resultEl.innerHTML = `<div class="notes-box">${t.alreadySameMessage}</div>`;
    return;
  }

  resultEl.innerHTML = `<p class="calc-loading">${t.loading}</p>`;

  // Комиссии провайдеров заданы в долларах, поэтому считаем через доллар как
  // опорную точку: rateToUSD переводит сумму в USD-эквивалент (если нужно),
  // rateFromUSD — из USD в валюту назначения (если это вообще валюта).
  const needToUSD = !isSourceCrypto && fundingCurrency !== "USD";
  const needFromUSD = !isDestCryptoLike && destination.currency !== "USD";

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
  const displayTo = isDestCryptoLike ? "USDT" : destination.currency;
  const amountUSD = isSourceCrypto ? amount : amount * rateToUSD;

  const buildBuyRow = (provider, isOfframp) => {
    // Покупка USDT на бирже или через обменник (обменники в OFFRAMPS обычно
    // работают в обе стороны, но их тариф на ПОКУПКУ отдельно не проверялся
    // — переиспользуется подтверждённый тариф на продажу, поэтому такие
    // строки всегда помечаются unverified и считаются диапазоном).
    const afterFeeUSD = Math.max(amountUSD - provider.fixedFee, 0);
    const finalAmount = afterFeeUSD * (1 - provider.spreadPercent / 100);
    const effectiveRate = rateToUSD * (1 - provider.spreadPercent / 100);
    const row = {
      name: isOfframp ? `${provider.name}${t.viaOfframpSuffix}` : provider.name,
      finalAmount,
      effectiveRate,
      feeText: formatFee(provider.spreadPercent, provider.fixedFee, t),
      speed: provider.speed,
      linkId: provider.id,
      unverified: isOfframp,
      hasRange: isOfframp,
    };
    if (isOfframp) {
      const { min, max } = spreadRange(provider.spreadPercent);
      row.finalAmountMax = afterFeeUSD * (1 - min / 100);
      row.finalAmountMin = afterFeeUSD * (1 - max / 100);
    }
    return row;
  };

  const buildOfframpOnlyRow = (offramp) => {
    // Уже в крипте — этапа покупки нет, сразу off-ramp в валюту (диапазон).
    const afterFeeUSD = Math.max(amountUSD - offramp.fixedFee, 0);
    const { min, max } = spreadRange(offramp.spreadPercent);
    const finalAmount = afterFeeUSD * (1 - offramp.spreadPercent / 100) * rateFromUSD;
    const effectiveRate = rateFromUSD * (1 - offramp.spreadPercent / 100);
    return {
      name: offramp.name,
      finalAmount,
      finalAmountMax: afterFeeUSD * (1 - min / 100) * rateFromUSD,
      finalAmountMin: afterFeeUSD * (1 - max / 100) * rateFromUSD,
      hasRange: true,
      effectiveRate,
      feeText: formatFee(offramp.spreadPercent, offramp.fixedFee, t),
      speed: offramp.speed,
      linkId: null,
      unverified: !offramp.dataVerified,
    };
  };

  const buildRoute = (ex, offramp) => {
    // Полный маршрут: сначала биржа (fiat → USDT, точное значение), потом
    // off-ramp (USDT → fiat, диапазон — только этот этап колеблется).
    const afterFeeUSD1 = Math.max(amountUSD - ex.fixedFee, 0);
    const usdtAmount = afterFeeUSD1 * (1 - ex.spreadPercent / 100);
    const afterFeeUSD2 = Math.max(usdtAmount - offramp.fixedFee, 0);
    const { min, max } = spreadRange(offramp.spreadPercent);
    const finalAmount = afterFeeUSD2 * (1 - offramp.spreadPercent / 100) * rateFromUSD;
    const combinedSpreadPercent = 100 * (1 - (1 - ex.spreadPercent / 100) * (1 - offramp.spreadPercent / 100));
    const effectiveRate = rateToUSD * rateFromUSD * (1 - combinedSpreadPercent / 100);
    return {
      name: `${ex.name} → ${offramp.name}`,
      finalAmount,
      finalAmountMax: afterFeeUSD2 * (1 - min / 100) * rateFromUSD,
      finalAmountMin: afterFeeUSD2 * (1 - max / 100) * rateFromUSD,
      hasRange: true,
      effectiveRate,
      feeText: formatFee(combinedSpreadPercent, ex.fixedFee + offramp.fixedFee, t),
      speed: `${ex.speed} + ${offramp.speed}`,
      linkId: ex.id,
      unverified: !offramp.dataVerified,
    };
  };

  const buildBankRow = () => {
    // Контрастный вариант тоже считается диапазоном (spec: "указать примерный
    // диапазон итоговых потерь для контраста, не точное число").
    const afterFeeUSD = Math.max(amountUSD - opts.bank.fixedFee, 0);
    const { min, max } = spreadRange(opts.bank.markupPercent);
    const finalAmount = afterFeeUSD * (1 - opts.bank.markupPercent / 100) * rateFromUSD;
    const effectiveRate = rateToUSD * rateFromUSD * (1 - opts.bank.markupPercent / 100);
    return {
      name: opts.bank.name,
      finalAmount,
      finalAmountMax: afterFeeUSD * (1 - min / 100) * rateFromUSD,
      finalAmountMin: afterFeeUSD * (1 - max / 100) * rateFromUSD,
      hasRange: true,
      effectiveRate,
      feeText: formatFee(opts.bank.markupPercent, opts.bank.fixedFee, t),
      speed: opts.bank.speed,
      linkId: null,
      unverified: false,
    };
  };

  const buildFirmPaymentRow = (provider, isOfframp) => {
    // Оплата пропфирмы криптой: биржа или обменник (fiat → USDT), затем
    // комиссия платёжного провайдера фирмы за приём крипты (если известна).
    // Диапазон — только когда провайдер этапа покупки это обменник.
    const feePercent = destFirm.challengePayment.cryptoFeePercent;
    const afterFeeUSD = Math.max(amountUSD - (provider ? provider.fixedFee : 0), 0);
    const usdtAmount = provider ? afterFeeUSD * (1 - provider.spreadPercent / 100) : afterFeeUSD;
    const finalAmount = feePercent ? usdtAmount * (1 - feePercent / 100) : usdtAmount;
    const effectiveRate = rateToUSD * (provider ? 1 - provider.spreadPercent / 100 : 1) * (feePercent ? 1 - feePercent / 100 : 1);
    const feeParts = [];
    if (provider) feeParts.push(formatFee(provider.spreadPercent, provider.fixedFee, t));
    feeParts.push(feePercent ? t.firmFeeKnown(feePercent) : t.firmFeeUnknown);
    const providerName = provider ? `${provider.name}${isOfframp ? t.viaOfframpSuffix : ""}` : null;
    const row = {
      name: providerName ? `${providerName} → ${destFirm.name}` : destFirm.name,
      finalAmount,
      effectiveRate,
      feeText: feeParts.join(", "),
      speed: provider ? provider.speed : "—",
      linkId: null,
      directLinkUrl: destFirm.challengePayment.officialUrl,
      unverified: !destFirm.challengePayment.dataVerified || feePercent == null || isOfframp,
      hasRange: !!isOfframp,
    };
    if (isOfframp && provider) {
      const { min, max } = spreadRange(provider.spreadPercent);
      const usdtMax = afterFeeUSD * (1 - min / 100);
      const usdtMin = afterFeeUSD * (1 - max / 100);
      row.finalAmountMax = feePercent ? usdtMax * (1 - feePercent / 100) : usdtMax;
      row.finalAmountMin = feePercent ? usdtMin * (1 - feePercent / 100) : usdtMin;
    }
    return row;
  };

  let rows;
  let resultHeaderReceive = t.thReceive;
  let extraNote = "";
  if (isDestFirm) {
    resultHeaderReceive = t.thArrives;
    if (isSourceCrypto) {
      rows = [buildFirmPaymentRow(null, false)];
    } else {
      rows = [
        ...opts.exchanges.map((ex) => buildFirmPaymentRow(ex, false)),
        ...opts.offramps.map((of) => buildFirmPaymentRow(of, true)),
      ];
    }
    extraNote = `<div class="notes-box">${renderChallengePaymentNote(destFirm, t)}</div>`;
  } else if (isDestCrypto) {
    if (destination.exchange === "all") {
      rows = [...opts.exchanges.map((ex) => buildBuyRow(ex, false)), ...opts.offramps.map((of) => buildBuyRow(of, true))];
    } else {
      const ex = opts.exchanges.find((e) => e.id === destination.exchange);
      rows = ex ? [buildBuyRow(ex, false)] : [];
    }
  } else if (isSourceCrypto) {
    rows = opts.offramps.map(buildOfframpOnlyRow);
  } else {
    rows = opts.exchanges.flatMap((ex) => opts.offramps.map((offramp) => buildRoute(ex, offramp)));
    if (opts.bank) rows.push(buildBankRow());
  }

  // Сортировка по нижней границе диапазона (консервативная оценка сверху);
  // для точных (не-диапазонных) строк нижняя граница — это само значение.
  rows.sort((a, b) => (b.finalAmountMin ?? b.finalAmount) - (a.finalAmountMin ?? a.finalAmount));
  const best = rows[0];
  const anyRangeRow = rows.some((row) => row.hasRange);
  const verifiedDate =
    typeof DATA_LAST_VERIFIED !== "undefined"
      ? new Intl.DateTimeFormat(t.locale, { year: "numeric", month: "long", day: "numeric" }).format(new Date(DATA_LAST_VERIFIED))
      : "";

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
            <th>${resultHeaderReceive}</th>
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
              <td data-label="${resultHeaderReceive}"><strong>${
                row.hasRange
                  ? `${t.rangeFrom(formatMoney(row.finalAmountMin, displayTo, t))} ${t.rangeTo(formatMoney(row.finalAmountMax, displayTo, t))}`
                  : formatMoney(row.finalAmount, displayTo, t)
              }</strong></td>
              <td data-label="">${row.directLinkUrl ? linkForUrl(row.directLinkUrl, t) : linkForId(row.linkId, t)}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
    ${extraNote}
    ${anyRangeRow ? `<div class="notes-box calc-range-disclaimer">${t.rangeDisclaimer(verifiedDate)}</div>` : ""}
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

function linkForUrl(url, t) {
  return `<a class="calc-link" href="${url}" target="_blank" rel="noopener">${t.getStarted}</a>`;
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
