// Переиспользуемый виджет «Калькулятор переводов»: пользователь выбирает, ОТКУДА
// сейчас деньги (у пропфирмы / на карте в любой валюте / уже в крипте — в том
// числе на конкретной бирже) и КУДА их нужно перевести (USDT на бирже или у
// обменника, оплата челленджа пропфирме, валюта), после чего виджет строит ВСЕ
// возможные маршруты между этими точками и считает их. Модель маршрута, виды
// точности результата (диапазон / верхняя граница / точное) и правила — в
// большом комментарии «Модель маршрута» ниже, над fiatToUsdtStates.
//
// Расчёт идёт через доллар как опорную валюту (USDT ≈ 1 USD, `fixedFee`
// провайдеров заданы в долларах): сумма переводится в USD-эквивалент, с неё
// вычитаются комиссии по шагам, результат переводится в валюту назначения.
// Язык берётся из <html lang="ru|en">.
//
// Usage: initCalculator('root-id', { amount, presetSource: 'cash:USD' |
//   'firm:<slug>' | 'crypto' | 'crypto:<exchangeId>', presetDestination:
//   'fiat:RUB' | 'crypto:all' | 'crypto:<exchangeId>' | 'firm:<slug>' })

// ±0,4% — допуск на колебания курса вокруг оценочного спреда: середина
// диапазона «±0,3-0,5%», который calculator-full-rebuild-spec.md указывает для
// P2P-курса у Whitebird; применяется ко всем оценочным шагам (обменники, биржи,
// банковская строка) для единообразия.
const OFFRAMP_TOLERANCE_PERCENT = 0.4;

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
    noOfframpRoute: (currency, supported) => `Из USDT в ${currency} у нас нет подтверждённых маршрутов: обменники в нашей базе выводят USDT только в ${supported}.`,
    p2pStep: "P2P",
    p2pSuffix: " (P2P)",
    firmCryptoStep: "USDT (выплата фирмы)",
    depositStep: (name) => `${name} (крипто-депозит)`,
    feeP2P: "цена P2P задаётся продавцом — наценку к среднему курсу мы не знаем",
    feeChannel: (mode, dir, p) => (mode === "account" ? (dir === "buy" ? `пополнение ${p} + конвертация 0%` : `конвертация 0% + вывод ${p}`) : `комиссия ${p}`),
    feeDepositUnchecked: "(комиссию за ввод рублей не проверяли)",
    viaOfframp: (mode, methods) => (mode === "pair" ? "" : ` (${mode === "account" ? "через счёт" : "мгновенный обмен"}${methods.length ? ": " + methods.join(" / ") : ""})`),
    methodName: (m) => ({ "Карты банков Российской Федерации": "карты РФ", "Карты банков Республики Беларусь": "карты банков РБ", "Карты Альфа Банка Беларусь": "Альфа-Банк (РБ)", "Карта Crypto Статус": "Crypto Статус", "Карта Crypto Альфа Банк Беларусь": "Crypto Альфа" })[m] || m.replace(/\s*\(РФ\)/, ""),
    errorTariffs: "Не удалось загрузить актуальные тарифы обменников — показаны сохранённые значения без подтверждения.",
    feeNetwork: (amount) => `${amount} сетевая комиссия`,
    usdtNote: "Здесь «доллары» — это USDT: стейблкоин, 1 USDT ≈ 1 USD. Показаны все способы получить их за ваши деньги; вывод USDT дальше (в рубли, на карту) — отдельный шаг, в этот расчёт он не входит.",
    usdtOtherNote: (currency) => `Маршруты доводят деньги до USDT. Последний шаг — вывод USDT в ${currency} — в нашей базе не покрыт (обменники выводят только в RUB/BYN), поэтому в расчёт он не входит.`,
    fromRubNote: "Рубли можно обменять на USDT двумя способами: у обменника напрямую или через P2P на бирже (вы платите на карту продавца, цену задаёт он). Комиссии обменников (Whitebird, Cifra) взяты с их официальных страниц тарифов, а курс обмена они задают сами — поэтому итог показан диапазоном. У P2P цену продавца мы заранее не знаем — такие строки показывают только верхнюю границу.",
    excludedExchangesNote: (names, currency) => `Не показаны биржи: ${names} — в наших данных у них нет пополнения в ${currency} картой или банком. P2P за рубли мы учитываем, а P2P в других валютах не проверяли.`,
    ceilingDisclaimer: "<strong>P2P:</strong> цену задаёт продавец, поэтому показан максимум — при курсе ровно по рынку. Реально вы получите меньше, сколько именно — зависит от объявлений на момент сделки. Такие маршруты стоят в конце списка.",
    usdcNote: "Эта фирма платит только в USDC (сеть ERC-20). Чтобы работать с USDT, USDC нужно обменять, а сетевая комиссия ERC-20 заметно выше, чем у TRC20 — ни то, ни другое в расчёт не входит.",
    noRoutes: "Для этой пары у нас нет маршрутов. Попробуйте другую валюту или направление.",
    thMethod: "Маршрут",
    thRate: "Курс",
    thFee: "Комиссия",
    thSpeed: "Скорость",
    thReceive: "Получите на руки",
    thArrives: "Дойдёт до фирмы",
    bestBadge: "Выгоднее всего",
    detailsToggle: "Подробнее",
    howSummary: "Как мы считаем",
    lossLabel: (r) => `потеря ≈ ${r}`,
    priceBySeller: "цену задаёт продавец",
    unverifiedNote: "Данные по одному из шагов не подтверждены — сверьте на сайте сервиса.",
    feeNetworkUnknown: "сетевая комиссия зависит от сети (не учтена)",
    feeMarkup: (percent) => `~${percent}% спред`,
    feeFlat: (amount) => `${amount} фикс.`,
    feeNone: "Не раскрывается",
    firmFeeUnknown: "комиссия фирмы за приём крипты не раскрыта",
    firmFeeKnown: (percent) => `+ ${percent}% комиссия фирмы за приём крипты`,
    rangeFrom: (min) => `от ${min}`,
    rangeTo: (max) => `до ${max}`,
    challengeAcceptsLabel: "Принимает:",
    challengeFeeLabel: "Комиссия за оплату криптой:",
    challengePayLink: (name) => `Оплатить челлендж на сайте ${name} →`,
    whyCryptoNote: "Почему через биржу, а не напрямую? Прямой банковский перевод или карта из большинства стран сейчас не доходят до российского банка — Visa/Mastercard и SWIFT не проводят такие платежи в Россию. Обменники вроде Whitebird и Cifra Markets тоже работают только с криптой на входе — они меняют USDT на рубли, а не доллары на рубли напрямую. Поэтому рабочий маршрут — сначала купить USDT на бирже, затем обменять его на рубли. Банковский перевод в таблице ниже показан только для сравнения, насколько хуже был бы курс, если бы прямой перевод вообще работал.",
    baselineBadge: "гипотетически",
    disclaimer: (date) => `Оценка по тарифам сервисов на ${date} и текущему курсу — реальные цифры могут отличаться. См.`,
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
    noOfframpRoute: (currency, supported) => `We have no confirmed routes from USDT to ${currency}: the exchangers in our database only pay USDT out in ${supported}.`,
    p2pStep: "P2P",
    p2pSuffix: " (P2P)",
    firmCryptoStep: "USDT (firm payout)",
    depositStep: (name) => `${name} (crypto deposit)`,
    feeP2P: "P2P price is set by the seller — we don't know the markup over the mid-market rate",
    feeChannel: (mode, dir, p) => (mode === "account" ? (dir === "buy" ? `deposit ${p} + conversion 0%` : `conversion 0% + withdrawal ${p}`) : `fee ${p}`),
    feeDepositUnchecked: "(ruble deposit fee not checked)",
    viaOfframp: (mode, methods) => (mode === "pair" ? "" : ` (${mode === "account" ? "via account" : "instant exchange"}${methods.length ? ": " + methods.join(" / ") : ""})`),
    methodName: (m) => ({ "Карты банков Российской Федерации": "Russian bank cards", "Карты банков Республики Беларусь": "Belarusian bank cards", "Карты Альфа Банка Беларусь": "Alfa-Bank cards (BY)", "Карта Crypto Статус": "Crypto Status card", "Карта Crypto Альфа Банк Беларусь": "Crypto Alfa card", "СБП (РФ)": "SBP", "МТС Банк (РФ)": "MTS Bank", "Т-Банк (РФ)": "T-Bank", "ВТБ Pay (РФ)": "VTB Pay", "SberPay (РФ)": "SberPay" })[m] || m.replace(/\s*\(РФ\)/, ""),
    errorTariffs: "Couldn't load current exchanger tariffs — showing saved values, unverified.",
    feeNetwork: (amount) => `${amount} network fee`,
    usdtNote: "Here \"dollars\" means USDT: a stablecoin, 1 USDT ≈ 1 USD. All ways to get it for your money are shown; withdrawing USDT further (to rubles, to a card) is a separate step and isn't part of this calculation.",
    usdtOtherNote: (currency) => `These routes bring your money to USDT. The last step — withdrawing USDT to ${currency} — isn't covered in our database (exchangers only pay out RUB/BYN), so it isn't included.`,
    fromRubNote: "Rubles can be exchanged for USDT in two ways: directly at an exchanger, or via P2P on an exchange (you pay a seller's card, and the seller sets the price). Exchanger fees (Whitebird, Cifra) come from their official tariff pages, but they set the exchange rate themselves — so the result is shown as a range. We can't know a P2P seller's price in advance — those rows show only an upper bound.",
    excludedExchangesNote: (names, currency) => `Exchanges not shown: ${names} — our data shows no ${currency} deposits by card or bank for them. We count P2P for rubles, but haven't verified P2P in other currencies.`,
    ceilingDisclaimer: "<strong>P2P:</strong> the seller sets the price, so the maximum is shown — at exactly the mid-market rate. You will actually get less; how much depends on the listings at the time of the trade. Such routes are ranked last.",
    usdcNote: "This firm pays out only in USDC (ERC-20 network). To work with USDT the USDC has to be swapped, and ERC-20 network fees are much higher than TRC20 — neither is included.",
    noRoutes: "We have no routes for this pair. Try another currency or direction.",
    thMethod: "Route",
    thRate: "Rate",
    thFee: "Fee",
    thSpeed: "Speed",
    thReceive: "You receive",
    thArrives: "Arrives at the firm",
    bestBadge: "Best value",
    detailsToggle: "Details",
    howSummary: "How we calculate",
    lossLabel: (r) => `loss ≈ ${r}`,
    priceBySeller: "price set by the seller",
    unverifiedNote: "Data for one of the steps is unverified — check on the provider's site.",
    feeNetworkUnknown: "network fee depends on the network (not included)",
    feeMarkup: (percent) => `~${percent}% spread`,
    feeFlat: (amount) => `${amount} flat`,
    feeNone: "None disclosed",
    firmFeeUnknown: "the firm's crypto-processing fee isn't disclosed",
    firmFeeKnown: (percent) => `+ ${percent}% firm crypto-processing fee`,
    rangeFrom: (min) => `from ${min}`,
    rangeTo: (max) => `to ${max}`,
    challengeAcceptsLabel: "Accepts:",
    challengeFeeLabel: "Crypto payment fee:",
    challengePayLink: (name) => `Pay for the challenge on ${name}'s site →`,
    whyCryptoNote: "Why go through an exchange instead of direct? A direct bank transfer or card payment from most countries doesn't reach a Russian bank right now — Visa/Mastercard and SWIFT don't process payments into Russia. Exchangers like Whitebird and Cifra Markets also only work with crypto on the input side — they convert USDT to rubles, not dollars to rubles directly. So the route that actually works is: buy USDT on an exchange first, then convert it to rubles. The bank transfer row below is shown only for comparison, to show how much worse the rate would be if a direct transfer worked at all.",
    baselineBadge: "hypothetical",
    disclaimer: (date) => `An estimate based on providers' tariffs as of ${date} and the current rate — actual figures may differ. See our`,
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

  // Тарифы обменников — из assets/data/tariffs.json (обновляется ночной задачей).
  // До загрузки и при ошибке работаем на статичных полях OFFRAMPS (с пометкой).
  opts.tariffs = null;
  opts.channels = buildChannels(opts);
  opts.tariffsReady = fetch("/assets/data/tariffs.json", { cache: "no-cache" })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
    .then((data) => {
      if (data && data.providers) {
        opts.tariffs = data;
        opts.channels = buildChannels(opts);
        const dateEl = root.querySelector(".calc-tariff-date");
        if (dateEl && data.updatedAt) dateEl.textContent = t.tariffsVerified(formatCalcDate(data.updatedAt, t));
      }
    });

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
      ${verifiedDate ? `<span class="calc-trust-item"><span class="calc-trust-dot"></span><span class="calc-tariff-date">${t.tariffsVerified(verifiedDate)}</span></span>` : ""}
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
  // Фирма без подтверждённых условий оплаты челленджа (challengePayment: null)
  // предлагается только как «Откуда», но не как «Куда».
  const destFirmOptions = opts.firms
    .filter((f) => f.challengePayment)
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
    <div class="calc-info-note calc-firm-info" hidden></div>
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

// Каждый вызов ставит новый HTML и заново запускает CSS-анимацию появления
// (calc-result-enter), даже если предыдущий результат уже был виден — иначе
// без явного reflow браузер не перезапускает анимацию на том же элементе.
function renderResult(resultEl, html) {
  resultEl.classList.remove("calc-result-enter");
  void resultEl.offsetWidth;
  resultEl.innerHTML = html;
  resultEl.classList.add("calc-result-enter");
}

// ---------------------------------------------------------------------------
// Модель маршрута.
//
// Любой маршрут — цепочка шагов над «состоянием денег»:
//   1) ПОЛУЧИТЬ USDT (доллары в крипте) из того, что у пользователя есть:
//        · крипто-выплата пропфирмы / уже USDT      — шаг не нужен;
//        · фиат → обменник напрямую (Whitebird, Cifra) — если он принимает валюту;
//        · рубли → P2P на бирже                        — цена продавца неизвестна;
//        · другой фиат → биржа картой/банком           — только где биржа это умеет.
//   2) (если нужно) ПЕРЕВЕСТИ USDT с биржи на обменник — сетевая комиссия ≈ 1 USDT
//      (`fixedFee` биржи в EXCHANGES — это именно она, а не плата за покупку).
//   3) (если нужно) ПРОДАТЬ USDT за рубли/BYN — через обменник, поддерживающий
//      эту валюту (`currencies` в OFFRAMPS), либо P2P на бирже (только RUB).
//
// «Доллары» как цель = USDT (шаг 1): дальнейший вывод USDT — отдельный шаг,
// в такой расчёт он не входит. Для валют, куда обменники не выводят (EUR, KZT…),
// показываем ту же часть маршрута до USDT и честно говорим, что дальше данных нет.
//
// Точность данных описывается тремя видами результата:
//   · диапазон  [lo, hi] — оценка ± допуск (обменники, биржи);
//   · верхняя граница (lo = null) — цену P2P задаёт продавец, известен лишь
//     потолок (курс ровно по рынку); такие строки ставятся ниже остальных;
//   · точное число — только если все данные шага подтверждены (например,
//     процент комиссии пропфирмы за приём крипты, указанный официально).
// Выдуманных цифр нет: чего не знаем — не показываем как точное.
// ---------------------------------------------------------------------------

function firmCryptoMethods(firm) {
  return (firm.methods || []).filter((m) => /крипт|crypto|usdt|usdc/i.test(m));
}

function firmPaysCrypto(firm) {
  return firmCryptoMethods(firm).length > 0;
}

function firmCryptoIsUsdcOnly(firm) {
  const methods = firmCryptoMethods(firm);
  return methods.length > 0 && methods.every((m) => /usdc/i.test(m) && !/usdt/i.test(m));
}

function newState(over) {
  return Object.assign(
    { steps: [], lo: 0, hi: 0, feeParts: [], speeds: [], location: { type: "free" }, unverified: false },
    over
  );
}

// lo === null — нижняя граница неизвестна (только потолок).
// Комиссия может быть диапазоном (например, «3,5-4,9 %» у карт банков РБ):
// лучший случай — нижний край минус допуск, худший — верхний край плюс допуск.
function afterPercentRange(state, minPercent, maxPercent, tolerance) {
  const best = Math.max(minPercent - tolerance, 0);
  const worst = maxPercent + tolerance;
  return Object.assign({}, state, {
    hi: state.hi * (1 - best / 100),
    lo: state.lo == null ? null : state.lo * (1 - worst / 100),
  });
}

function afterPercent(state, percent, tolerance) {
  return afterPercentRange(state, percent, percent, tolerance);
}

// ---------------------------------------------------------------------------
// Тарифы обменников по способам оплаты («каналы»).
//
// Данные лежат в assets/data/tariffs.json (обновляется ночной задачей GitHub
// Actions, см. .github/workflows/update-tariffs.yml). У Whitebird два режима:
//   · instant  — «Мгновенный обмен»: комиссия при покупке/продаже USDT;
//   · account  — через электронный счёт: комиссия на ввод и на вывод, а сама
//     конвертация внутри счёта бесплатна (по курсу, который задаёт компания).
// У Cifra Markets одна комиссия за пару USDT/RUB в обе стороны.
// Если файл не загрузился — падаем назад на статичные поля OFFRAMPS, помечая
// такие тарифы «не подтверждено».
// ---------------------------------------------------------------------------
function buildChannels(opts) {
  const providers = (opts.tariffs && opts.tariffs.providers) || {};
  const out = {};
  opts.offramps.forEach((o) => {
    const buy = [];
    const sell = [];
    const tw = providers[o.id];
    if (o.id === "whitebird" && tw) {
      (tw.instant || []).forEach((r) => {
        if (!r.currency) return;
        if (r.buy) buy.push({ mode: "instant", method: r.method, currency: r.currency, min: r.buy.min, max: r.buy.max, fixedUSD: 0, unchecked: false });
        if (r.sell) sell.push({ mode: "instant", method: r.method, currency: r.currency, min: r.sell.min, max: r.sell.max, fixedUSD: 0, unchecked: false });
      });
      (tw.account || []).forEach((r) => {
        if (!r.currency) return;
        if (r.deposit) buy.push({ mode: "account", method: r.method, currency: r.currency, min: r.deposit.min, max: r.deposit.max, fixedUSD: 0, unchecked: false });
        if (r.withdraw) sell.push({ mode: "account", method: r.method, currency: r.currency, min: r.withdraw.min, max: r.withdraw.max, fixedUSD: 0, unchecked: false });
      });
    } else if (o.id === "cifra" && tw) {
      // Комиссия за пару — и на покупку, и на продажу. Фикс. комиссия за вывод
      // рублей (≈$6) — только на продажу; комиссию за ввод рублей не проверяли.
      buy.push({ mode: "pair", method: null, currency: "RUB", min: tw.pairPercent, max: tw.pairPercent, fixedUSD: 0, unchecked: true });
      sell.push({ mode: "pair", method: null, currency: "RUB", min: tw.pairPercent, max: tw.pairPercent, fixedUSD: o.fixedFee || 0, unchecked: false });
    } else {
      (o.currencies || []).forEach((c) => {
        sell.push({ mode: "pair", method: null, currency: c, min: o.spreadPercent, max: o.spreadPercent, fixedUSD: o.fixedFee || 0, unchecked: !o.dataVerified });
        if (o.onRampSupported) buy.push({ mode: "pair", method: null, currency: c, min: o.spreadPercent, max: o.spreadPercent, fixedUSD: 0, unchecked: true });
      });
    }
    out[o.id] = { buy, sell };
  });
  return out;
}

// Каналы с одинаковой ценой склеиваем: «СБП / карты РФ» вместо двух строк.
function groupChannels(channels, currency, t) {
  const groups = new Map();
  channels
    .filter((c) => c.currency === currency)
    .forEach((c) => {
      const key = [c.mode, c.min, c.max, c.fixedUSD, c.unchecked].join("|");
      if (!groups.has(key)) groups.set(key, { mode: c.mode, min: c.min, max: c.max, fixedUSD: c.fixedUSD, unchecked: c.unchecked, methods: [] });
      if (c.method) groups.get(key).methods.push(t.methodName(c.method));
    });
  return Array.from(groups.values());
}

function percentText(g, t) {
  return g.min === g.max ? `${pct(g.min, t)}%` : `${pct(g.min, t)}–${pct(g.max, t)}%`;
}

function afterFixed(state, usd) {
  return Object.assign({}, state, {
    hi: Math.max(state.hi - usd, 0),
    lo: state.lo == null ? null : Math.max(state.lo - usd, 0),
  });
}

function withStep(state, extra) {
  return Object.assign({}, state, {
    steps: extra.step ? state.steps.concat([extra.step]) : state.steps,
    feeParts: extra.fee ? state.feeParts.concat([extra.fee]) : state.feeParts,
    speeds: extra.speed ? state.speeds.concat([extra.speed]) : state.speeds,
    location: extra.location || state.location,
    unverified: state.unverified || !!extra.unverified,
  });
}

function findCompare(id) {
  return typeof EXCHANGES_COMPARE !== "undefined" ? EXCHANGES_COMPARE.find((x) => x.slug === id) : null;
}

function exchangeDeposits(id) {
  const meta = findCompare(id);
  return meta && meta.depositMethods ? meta.depositMethods.join(" ") : "";
}

function stepName(step) {
  return `${step.names.join(" / ")}${step.suffix || ""}`;
}

// ШАГ 1. Из фиата получить USDT: все реальные способы.
function fiatToUsdtStates(srcFiat, amountUSD, opts, t, excluded) {
  const states = [];
  const tol = OFFRAMP_TOLERANCE_PERCENT;

  opts.exchanges.forEach((ex) => {
    const deposits = exchangeDeposits(ex.id);
    const location = { type: "exchange", id: ex.id };
    if (srcFiat === "RUB") {
      if (/P2P/i.test(deposits)) {
        // Цена P2P — у продавца: известен только потолок (курс ровно по рынку).
        states.push(
          newState({
            lo: null,
            hi: amountUSD,
            location,
            unverified: true,
            steps: [{ names: [ex.name], suffix: t.p2pSuffix, group: "exchange", linkId: ex.id }],
            feeParts: [t.feeP2P],
            speeds: [ex.speed],
          })
        );
      } else {
        excluded.push(ex.name);
      }
    } else if (/карт|card|банк|bank/i.test(deposits)) {
      const base = newState({
        lo: amountUSD,
        hi: amountUSD,
        location,
        unverified: true,
        steps: [{ names: [ex.name], suffix: "", group: "exchange", linkId: ex.id }],
        speeds: [ex.speed],
      });
      const s = afterPercent(base, ex.spreadPercent, tol);
      s.feeParts = [t.feeMarkup(pct(ex.spreadPercent, t))];
      states.push(s);
    } else {
      excluded.push(ex.name);
    }
  });

  opts.offramps.forEach((of) => {
    const channels = (opts.channels[of.id] || { buy: [] }).buy;
    groupChannels(channels, srcFiat, t).forEach((g) => {
      const base = newState({
        lo: amountUSD,
        hi: amountUSD,
        location: { type: "exchanger", id: of.id },
        unverified: g.unchecked,
        steps: [{ names: [of.name], suffix: t.viaOfframp(g.mode, g.methods), group: null, linkId: null }],
        speeds: [of.speed],
      });
      const s = afterPercentRange(base, g.min, g.max, tol);
      s.feeParts = [t.feeChannel(g.mode, "buy", percentText(g, t)) + (g.unchecked ? " " + t.feeDepositUnchecked : "")];
      states.push(s);
    });
  });

  return states;
}

// ШАГИ 2–3. USDT → рубли/BYN: обменники и P2P.
function usdtToFiatStates(states, destCurrency, opts, t) {
  const out = [];
  const tol = OFFRAMP_TOLERANCE_PERCENT;
  states.forEach((state) => {
    opts.offramps.forEach((of) => {
      if (state.location.type === "exchanger" && state.location.id !== of.id) {
        return; // с другого обменника вывод USDT не моделируем — данных о комиссии нет
      }
      const channels = (opts.channels[of.id] || { sell: [] }).sell;
      groupChannels(channels, destCurrency, t).forEach((g) => {
        let cur = state;
        if (state.location.type === "exchange") {
          const ex = opts.exchanges.find((e) => e.id === state.location.id);
          const fee = ex ? ex.fixedFee : 0;
          cur = withStep(afterFixed(cur, fee), { fee: fee ? t.feeNetwork(formatMoney(fee, "USD", t)) : null });
        }
        cur = afterFixed(cur, g.fixedUSD || 0);
        cur = afterPercentRange(cur, g.min, g.max, tol);
        out.push(
          withStep(cur, {
            step: { names: [of.name], suffix: t.viaOfframp(g.mode, g.methods), group: null, linkId: null },
            fee: t.feeChannel(g.mode, "sell", percentText(g, t)) + (g.fixedUSD ? ` + ${t.feeFlat(formatMoney(g.fixedUSD, "USD", t))}` : ""),
            speed: of.speed,
            location: { type: "fiat" },
            unverified: g.unchecked,
          })
        );
      });
    });

    if (destCurrency === "RUB") {
      // P2P-продажа USDT за рубли на бирже. Цена покупателя неизвестна — потолок.
      if (state.location.type === "exchange") {
        out.push(
          withStep(Object.assign({}, state, { lo: null }), {
            step: { names: [t.p2pStep], suffix: "", group: null, linkId: null },
            fee: t.feeP2P,
            speed: (opts.exchanges.find((e) => e.id === state.location.id) || {}).speed,
            location: { type: "fiat" },
            unverified: true,
          })
        );
      } else if (state.location.type === "free") {
        opts.exchanges.forEach((ex) => {
          if (!/P2P/i.test(exchangeDeposits(ex.id))) return;
          out.push(
            withStep(Object.assign({}, state, { lo: null }), {
              step: { names: [ex.name], suffix: t.p2pSuffix, group: "exchange", linkId: ex.id },
              fee: t.feeP2P,
              speed: ex.speed,
              location: { type: "fiat" },
              unverified: true,
            })
          );
        });
      }
    }
  });
  return out;
}

// Платёж пропфирме криптой: вывод с биржи (сеть) + комиссия платёжного провайдера фирмы.
function payFirmStates(states, destFirm, opts, t) {
  const cp = destFirm.challengePayment;
  return states.map((state) => {
    let cur = state;
    if (state.location.type === "exchange") {
      const ex = opts.exchanges.find((e) => e.id === state.location.id);
      const fee = ex ? ex.fixedFee : 0;
      cur = withStep(afterFixed(cur, fee), { fee: fee ? t.feeNetwork(formatMoney(fee, "USD", t)) : null });
    }
    const known = cp.cryptoFeePercent != null;
    if (known) cur = afterPercent(cur, cp.cryptoFeePercent, 0);
    return withStep(cur, {
      step: { names: [destFirm.name], suffix: "", group: null, linkId: null, directLinkUrl: cp.officialUrl },
      fee: known ? t.firmFeeKnown(cp.cryptoFeePercent).replace(/^\+\s*/, "") : t.firmFeeUnknown,
      location: { type: "firm" },
      unverified: !cp.dataVerified || !known,
    });
  });
}

// Одинаковые по цифрам строки (например, шесть бирж с одним и тем же оценочным
// тарифом) склеиваем в одну: «Bybit / Bitget / … → Whitebird → RUB».
function mergeRows(rows) {
  const map = new Map();
  rows.forEach((row) => {
    const key = [
      row.steps.map((s) => (s.group === "exchange" ? "*" + (s.suffix || "") : s.names.join("/") + (s.suffix || ""))).join(">"),
      row.lo == null ? "null" : row.lo.toFixed(2),
      row.hi.toFixed(2),
      row.feeText,
      row.speed,
      row.unverified,
      !!row.isBaseline,
    ].join("|");
    if (!map.has(key)) {
      map.set(key, Object.assign({}, row, { steps: row.steps.map((s) => Object.assign({}, s, { names: s.names.slice(), linkIds: s.linkId ? [s.linkId] : [] })) }));
    } else {
      const base = map.get(key);
      row.steps.forEach((s, i) => {
        if (s.group !== "exchange") return;
        s.names.forEach((n) => {
          if (!base.steps[i].names.includes(n)) base.steps[i].names.push(n);
        });
        if (s.linkId && !base.steps[i].linkIds.includes(s.linkId)) base.steps[i].linkIds.push(s.linkId);
      });
    }
  });
  return Array.from(map.values());
}

async function runCalculation(form, resultEl, opts, t) {
  await opts.tariffsReady;
  const formData = new FormData(form);
  const amount = parseFloat(formData.get("amount"));
  const country = (formData.get("country") || "").trim();
  const source = parseSource(formData.get("source"));
  const destination = parseDestination(formData.get("destination"));

  if (!amount || amount <= 0) {
    renderResult(resultEl, `<p class="calc-error">${t.errorAmount}</p>`);
    return;
  }

  const note = (html) => renderResult(resultEl, `<div class="notes-box">${html}</div>`);

  const sourceFirm = source.type === "firm" ? opts.firms.find((f) => f.slug === source.slug) : null;
  const destFirm = destination.type === "firm" ? opts.firms.find((f) => f.slug === destination.slug) : null;
  const isSourceCrypto = source.type === "crypto";
  const isDestFirm = destination.type === "firm";
  const isDestCrypto = destination.type === "crypto";
  const destFiat = destination.type === "fiat" ? destination.currency : null;
  const srcFiat = source.type === "firm" ? (sourceFirm ? sourceFirm.payoutCurrency : "USD") : source.type === "cash" ? source.currency : null;

  // Куда именно приходят деньги: рубли/BYN (нужен шаг продажи) или USDT
  // (доллары; сюда же — валюты, куда обменники не выводят).
  const sellCurrencies = new Set(Object.values(opts.channels).flatMap((c) => c.sell.map((x) => x.currency)));
  const destViaSell = !!destFiat && sellCurrencies.has(destFiat);

  if (isDestFirm && destFirm && !destFirm.challengePayment.acceptsCrypto) {
    note(t.firmPaymentBlocked(destFirm.name, destFirm.challengePayment.notes));
    return;
  }
  if (isSourceCrypto && isDestCrypto) {
    if (source.exchange && destination.exchange && destination.exchange !== "all" && source.exchange === destination.exchange) {
      const ex = opts.exchanges.find((e) => e.id === source.exchange);
      note(t.alreadySameExchangeMessage(ex ? ex.name : source.exchange));
    } else {
      note(t.alreadyThereMessage);
    }
    return;
  }
  if (isSourceCrypto && destFiat && !destViaSell) {
    if (destFiat === "USD") note(t.alreadyThereMessage);
    else note(t.noOfframpRoute(destFiat, Array.from(sellCurrencies).join(", ")));
    return;
  }
  if (srcFiat && destFiat && srcFiat === destFiat) {
    note(t.alreadySameMessage);
    return;
  }

  renderResult(resultEl, `<p class="calc-loading">${t.loading}</p>`);

  // Расчёт идёт через доллар: USDT ≈ 1 USD, фиксированные комиссии заданы в USD.
  const needToUSD = !!srcFiat && srcFiat !== "USD";
  let rateToUSD = 1;
  let rateFromUSD = 1;
  try {
    const [a, b] = await Promise.all([
      needToUSD ? getMidMarketRate(srcFiat, "USD") : Promise.resolve(1),
      destViaSell && destFiat !== "USD" ? getMidMarketRate("USD", destFiat) : Promise.resolve(1),
    ]);
    rateToUSD = a;
    rateFromUSD = b;
  } catch (err) {
    renderResult(resultEl, `<p class="calc-error">${t.errorRates}</p>`);
    return;
  }

  const amountUSD = isSourceCrypto ? amount : amount * rateToUSD;
  const displayFrom = isSourceCrypto ? "USDT" : srcFiat;
  const displayTo = destViaSell ? destFiat : "USDT";

  const exchangeName = (id) => (opts.exchanges.find((e) => e.id === id) || {}).name || id;
  const sourceLabel = sourceFirm ? sourceFirm.name : source.type === "cash" ? source.currency : source.exchange ? exchangeName(source.exchange) : "USDT";

  // --- ШАГ 1: получить USDT ---
  const excluded = [];
  let states = [];
  if (isSourceCrypto) {
    states.push(newState({ lo: amountUSD, hi: amountUSD, location: source.exchange ? { type: "exchange", id: source.exchange } : { type: "free" }, labelOverride: sourceLabel }));
  } else {
    if (sourceFirm && firmPaysCrypto(sourceFirm)) {
      states.push(
        newState({
          lo: amountUSD,
          hi: amountUSD,
          unverified: firmCryptoIsUsdcOnly(sourceFirm),
          steps: [{ names: [t.firmCryptoStep], suffix: "", group: null, linkId: null }],
          labelOverride: sourceFirm.name,
        })
      );
    }
    const fiatLabel = sourceFirm ? `${sourceFirm.name} (${srcFiat})` : srcFiat;
    fiatToUsdtStates(srcFiat, amountUSD, opts, t, excluded).forEach((s) => {
      s.labelOverride = fiatLabel;
      states.push(s);
    });
  }

  // Цель — конкретная биржа: оставляем то, что заканчивается на ней; USDT, уже
  // лежащий «свободно» (выплата фирмы), добавляем депозитом на эту биржу.
  if (isDestCrypto && destination.exchange !== "all") {
    const target = destination.exchange;
    states = states
      .map((s) => {
        if (s.location.type === "exchange") return s.location.id === target ? s : null;
        if (s.location.type === "free") {
          return withStep(s, { step: { names: [t.depositStep(exchangeName(target))], suffix: "", group: null, linkId: target }, location: { type: "exchange", id: target } });
        }
        if (s.location.type === "exchanger") {
          // Обменник → перевод USDT на выбранную биржу; сетевую комиссию сервиса не знаем.
          return withStep(s, { step: { names: [t.depositStep(exchangeName(target))], suffix: "", group: null, linkId: target }, fee: t.feeNetworkUnknown, location: { type: "exchange", id: target }, unverified: true });
        }
        return null;
      })
      .filter(Boolean);
  }

  // --- ШАГИ 2–3 ---
  if (destViaSell) states = usdtToFiatStates(states, destFiat, opts, t);
  else if (isDestFirm) states = payFirmStates(states, destFirm, opts, t);

  // --- Строки таблицы ---
  const toFinal = (v) => (v == null ? null : v * (destViaSell && destFiat !== "USD" ? rateFromUSD : 1));
  let rows = states.map((s) => {
    const lo = toFinal(s.lo);
    const hi = toFinal(s.hi);
    return {
      steps: s.steps,
      label: s.labelOverride,
      lo,
      hi,
      unverified: s.unverified,
      feeText: s.feeParts.length ? s.feeParts.join(" + ") : t.feeNone,
      speed: Array.from(new Set(s.speeds)).join(" + ") || "—",
      effectiveRate: (lo == null ? hi : (lo + hi) / 2) / amount,
    };
  });

  // Контрастный вариант «банк напрямую» — только для «иностранная валюта → рубли».
  if (opts.bank && destFiat === "RUB" && srcFiat && srcFiat !== "RUB") {
    const after = afterPercent(afterFixed(newState({ lo: amountUSD, hi: amountUSD }), opts.bank.fixedFee), opts.bank.markupPercent, OFFRAMP_TOLERANCE_PERCENT);
    const lo = toFinal(after.lo);
    const hi = toFinal(after.hi);
    rows.push({
      steps: [{ names: [opts.bank.name], suffix: "", group: null, linkId: null }],
      label: sourceFirm ? `${sourceFirm.name} (${srcFiat})` : srcFiat,
      lo,
      hi,
      unverified: false,
      isBaseline: true,
      feeText: formatFee(opts.bank.markupPercent, opts.bank.fixedFee, t),
      speed: opts.bank.speed,
      effectiveRate: (lo + hi) / 2 / amount,
    });
  }

  if (!rows.length) {
    note(`${excluded.length ? t.excludedExchangesNote(excluded.join(", "), srcFiat) + " " : ""}${t.noRoutes}`);
    return;
  }

  rows = mergeRows(rows);
  // Сортировка по гарантированному минимуму; «только потолок» и «гипотетически» — в конец.
  rows.sort((a, b) => {
    if (!!a.isBaseline !== !!b.isBaseline) return a.isBaseline ? 1 : -1;
    const al = a.lo == null ? -1 : a.lo;
    const bl = b.lo == null ? -1 : b.lo;
    return bl - al || b.hi - a.hi;
  });
  const best = rows.find((r) => !r.isBaseline && r.lo != null && r.lo > 0);
  const verifiedDate = opts.tariffs && opts.tariffs.updatedAt ? formatCalcDate(opts.tariffs.updatedAt, t) : typeof DATA_LAST_VERIFIED !== "undefined" ? formatCalcDate(DATA_LAST_VERIFIED, t) : "";

  // «Сколько теряете» относительно среднерыночного курса — одно понятное число
  // вместо колонок курса/комиссии/скорости (они — в «Подробнее» каждой строки).
  const midFinal = destViaSell ? amountUSD * rateFromUSD : amountUSD;
  const lossText = (row) => {
    if (row.lo == null) return t.priceBySeller;
    const bestLoss = Math.max(0, (1 - row.hi / midFinal) * 100);
    const worstLoss = Math.max(0, (1 - row.lo / midFinal) * 100);
    const range = worstLoss - bestLoss < 0.05 ? `${pct1(bestLoss, t)}%` : `${pct1(bestLoss, t)}–${pct1(worstLoss, t)}%`;
    return t.lossLabel(range);
  };

  const rowName = (row) => `${row.label ? row.label + " → " : ""}${row.steps.map(stepName).filter((n, i, arr) => n !== arr[i - 1]).join(" → ")}${destViaSell ? " → " + destFiat : ""}`;
  const resultHeaderReceive = isDestFirm ? t.thArrives : t.thReceive;
  const fmt = (v) => formatAmount(v, displayTo, t);
  const receiveText = (row) =>
    row.lo == null
      ? t.rangeTo(fmt(row.hi))
      : Math.abs(row.hi - row.lo) <= 0.005
      ? fmt(row.hi)
      : `${formatAmount(row.lo, displayTo, t).replace(/\s*USDT$/, "")}–${fmt(row.hi)}`;
  const linkCell = (row) => {
    const step = row.steps.find((s) => s.directLinkUrl);
    if (step) return linkForUrl(step.directLinkUrl, t);
    return row.steps.flatMap((s) => s.linkIds || []).map((id) => linkForId(id, t)).join(" ");
  };
  const detailsHTML = (row) => `
    <details class="calc-row-more">
      <summary>${t.detailsToggle}</summary>
      <dl>
        <dt>${t.thFee}</dt><dd>${row.feeText}</dd>
        <dt>${t.thSpeed}</dt><dd>${row.speed}</dd>
        <dt>${t.thRate}</dt><dd>1 ${displayFrom} ${row.lo == null ? "≤" : "≈"} ${formatRate(row.effectiveRate, t)} ${displayTo}</dd>
        ${row.unverified ? `<dt></dt><dd>${t.unverifiedNote}</dd>` : ""}
      </dl>
    </details>`;

  // Все пояснения — в одном свёрнутом блоке, а не россыпью над таблицей.
  const how = [];
  if (country) how.push(t.countryNote(escapeHTML(country)));
  if (!opts.tariffs) how.push(t.errorTariffs);
  if (destFiat === "USD") how.push(t.usdtNote);
  else if (destFiat && !destViaSell) how.push(t.usdtOtherNote(destFiat));
  if (srcFiat === "RUB" && !destViaSell && !isDestFirm) how.push(t.fromRubNote);
  if (destFiat === "RUB" && srcFiat && srcFiat !== "RUB") how.push(t.whyCryptoNote);
  if (excluded.length) how.push(t.excludedExchangesNote(excluded.join(", "), srcFiat));
  if (sourceFirm && firmPaysCrypto(sourceFirm) && firmCryptoIsUsdcOnly(sourceFirm)) how.push(t.usdcNote);
  if (rows.some((r) => r.lo == null)) how.push(t.ceilingDisclaimer);

  renderResult(resultEl, `
    <div class="calc-table-wrap">
      <table class="calc-table">
        <thead>
          <tr>
            <th>${t.thMethod}</th>
            <th>${resultHeaderReceive}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
            <tr class="${row === best ? "calc-best" : ""}">
              <td data-label="">
                <div class="calc-cell">
                  <div class="calc-route">${rowName(row)}${row === best ? `<span class="calc-badge">${t.bestBadge}</span>` : ""}</div>
                  <div class="calc-sub">${lossText(row)}${row.isBaseline ? ` · ${t.baselineBadge}` : ""}</div>
                  ${detailsHTML(row)}
                </div>
              </td>
              <td data-label="${resultHeaderReceive}"><strong>${receiveText(row)}</strong></td>
              <td data-label="">${linkCell(row)}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
    ${isDestFirm ? `<div class="notes-box">${renderChallengePaymentNote(destFirm, t)}</div>` : ""}
    ${how.length ? `<details class="calc-how"><summary>${t.howSummary}</summary>${how.map((n) => `<p>${n}</p>`).join("")}</details>` : ""}
    <p class="calc-disclaimer">${t.disclaimer(verifiedDate)} <a href="${t.disclosureHref}">${t.disclaimerLinkText}</a>.</p>
  `);
}

function formatCalcDate(value, t) {
  return new Intl.DateTimeFormat(t.locale, { year: "numeric", month: "long", day: "numeric" }).format(new Date(value));
}

function formatAmount(value, currency, t) {
  if (currency === "USDT") {
    return `${new Intl.NumberFormat(t.locale, { maximumFractionDigits: 2 }).format(value)} USDT`;
  }
  return formatMoney(value, currency, t);
}

function formatRate(value, t) {
  if (!isFinite(value)) return "—";
  return new Intl.NumberFormat(t.locale, { maximumSignificantDigits: 4 }).format(value);
}

function formatFee(percent, fixedFeeUSD, t) {
  const parts = [];
  if (percent) parts.push(t.feeMarkup(pct(percent, t)));
  if (fixedFeeUSD) parts.push(t.feeFlat(formatMoney(fixedFeeUSD, "USD", t)));
  return parts.length ? parts.join(" + ") : t.feeNone;
}

function pct1(value, t) {
  return new Intl.NumberFormat(t.locale, { maximumFractionDigits: 1 }).format(value);
}

function pct(value, t) {
  return new Intl.NumberFormat(t.locale, { maximumFractionDigits: 2 }).format(value);
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
