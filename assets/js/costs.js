// «Стоимость сделок» — интерфейс (/costs/, /en/costs/). Разбор файлов и
// расчёт — assets/js/costs-core.js.
//
// Файлы читаются прямо в браузере и никуда не отправляются. Всё, что пришло
// из файла (имя, инструменты, заголовки колонок), выводим только через
// costsEsc: это чужие данные.

const COSTS_DEMO_PATH = "/assets/data/costs-demo/";
const COSTS_DEMO_FILES = [
  "Bybit-UTA-Perp-TradeHistory-1767225600-1774915199.csv",
  "Bybit-AllPerp-ClosedPNL-1767225600-1774915199.csv",
  "Bybit-Spot-TradeHistory-1767225600-1774915199.csv",
  "Bybit-UM-TransactionLog-1767225600-1774915199.csv",
];
const COSTS_MAX_BYTES = 50 * 1024 * 1024;
// Показываем расхождение фактической ставки с опубликованной, если оно
// больше этой доли.
const COSTS_RATE_GAP = 0.15;

const COSTS_STRINGS = {
  ru: {
    locale: "ru-RU",
    privacy: "<strong>Файлы не покидают ваш компьютер.</strong> Расчёт идёт прямо в браузере: мы ничего не отправляем на сервер и не сохраняем. Закроете вкладку — данные исчезнут.",
    dropTitle: "Перетащите сюда CSV-файлы с биржи или нажмите, чтобы выбрать",
    dropSub: "Выгрузки Bybit и OKX распознаются сами, файлы других бирж — по колонкам, которые вы укажете. Можно сразу несколько файлов.",
    demo: "Посмотреть на примере",
    howto: "Как выгрузить файлы",
    clear: "Очистить всё",
    reading: "Читаем файлы…",
    demoBanner: "Это пример на вымышленных данных. Загрузите свои файлы — пример исчезнет.",
    demoError: "Не удалось загрузить пример. Обновите страницу и попробуйте ещё раз.",
    types: {
      "bybit-perp": "Bybit · сделки в деривативах",
      "bybit-spot": "Bybit · сделки на споте",
      "bybit-pnl": "Bybit · закрытые позиции (Closed P&L)",
      "bybit-log": "Bybit · журнал счёта",
      "okx-trades": "OKX · история сделок",
      "okx-positions": "OKX · история позиций",
      custom: "Свой формат",
    },
    rows: (n, s) => `${s} ${costsPlural(n, ["строка", "строки", "строк"])}`,
    beta: "бета",
    betaNote: "Формат OKX собран по официальной справке и ещё не проверен на реальной выгрузке. Сверьте итоги с личным кабинетом.",
    dupes: (n, s) => `${s} ${costsPlural(n, ["строка уже есть", "строки уже есть", "строк уже есть"])} в другом файле — повторно не учтены.`,
    shadowed: {
      "bybit-pnl": "Комиссии и фандинг за этот период уже есть в истории сделок — отсюда берём только результаты позиций.",
      "bybit-log": "Сделки и фандинг за этот период уже есть в истории сделок — отсюда берём опционы, обмен монет и проценты за заём.",
      other: "Часть записей уже есть в более подробном файле за тот же период — повторно не учтены.",
    },
    reasons: {
      xlsx: "Это файл Excel (XLSX). Откройте его в Excel или Google Таблицах и сохраните как CSV — тогда получится посчитать.",
      empty: "Файл пустой.",
      unknown: "Формат не распознан. Укажите, какие колонки что означают, — расчёт пойдёт по ним.",
      norecords: "В файле не нашлось сделок с комиссией. Возможно, это другой отчёт — например, история ордеров, а не сделок.",
      nomatch: "В выбранной колонке комиссии нет чисел — проверьте, какая колонка что означает.",
      read: "Не удалось прочитать файл.",
      big: "Файл больше 50 МБ — выгрузите период покороче.",
    },
    remove: "Убрать",
    removeLabel: (name) => `Убрать файл ${name}`,
    map: {
      intro: "Обязательна только колонка с комиссией. Чтобы посчитать долю от оборота и сравнить ставки, нужна ещё сумма сделки — или цена и количество.",
      exchange: "Биржа",
      exchangePh: "например, BingX",
      seg: "Рынок",
      spot: "Спот",
      futures: "Фьючерсы",
      time: "Дата и время",
      market: "Инструмент",
      value: "Сумма сделки",
      price: "Цена",
      qty: "Количество",
      fee: "Комиссия",
      feeCoin: "Валюта комиссии",
      orderType: "Тип ордера (рыночный / лимитный)",
      none: "—",
      apply: "Посчитать",
      feeRequired: "Выберите колонку с комиссией.",
      preview: "Первые строки файла",
    },
    title: "Ваши издержки",
    period: (ex, a, b) => `${ex} · ${a} — ${b}`,
    disclaimer: "Это расчёт по вашим же файлам, а не оценка торговли и не инвестиционная рекомендация.",
    tiles: {
      total: "Издержки всего",
      totalSub: "комиссии, фандинг и прочее",
      trading: "Комиссии за сделки",
      tradingSub: (n, s) => `${s} ${costsPlural(n, ["сделка", "сделки", "сделок"])}`,
      funding: "Фандинг",
      fundingIn: "в вашу пользу",
      fundingOut: "вы заплатили больше, чем получили",
      fundingNone: "начислений нет",
      share: "Доля от оборота",
      shareSub: (v) => `оборот ${v}`,
    },
    breakdown: {
      title: "Из чего сложились издержки",
      th: ["Статья", "Сумма", "Подробности"],
      spot: "Комиссии на споте",
      futures: "Комиссии во фьючерсах",
      liq: "из них при ликвидациях",
      fundingPaid: "Фандинг заплачен",
      fundingReceived: "Фандинг получен",
      options: "Комиссии по опционам",
      conversion: "Обмен монет внутри счёта",
      interest: "Проценты за заём",
      total: "Итого",
      fills: (n, s, turnover) => `${s} ${costsPlural(n, ["сделка", "сделки", "сделок"])}, оборот ${turnover}`,
      count: (n, s) => `${s} ${costsPlural(n, ["запись", "записи", "записей"])}`,
    },
    orders: {
      title: "Рыночные и лимитные ордера",
      intro: "Тейкер — сделка, которая исполнилась сразу: рыночный ордер или лимитный по цене из стакана. Мейкер — лимитный ордер, который постоял в стакане. Мейкер почти всегда платит меньше.",
      th: ["", "Сделки", "Оборот", "Комиссии", "Ставка"],
      seg: { spot: "Спот", futures: "Фьючерсы" },
      segIn: { spot: "на споте", futures: "во фьючерсах" },
      role: { taker: "тейкер", maker: "мейкер" },
      takerShare: (segIn, pct) => `${costsCap(segIn)} ${pct} оборота пришлось на тейкерские сделки.`,
      limitAsTaker: (segIn, n, s) => `${s} ${costsPlural(n, ["лимитная сделка", "лимитные сделки", "лимитных сделок"])} ${segIn} прошли по той же ставке, что и рыночные, — по файлу не понять, стояли ли они в стакане, поэтому считаем их тейкерскими.`,
      gap: (segIn, taker, maker, per) => `Ваша ставка тейкера ${segIn} — ${taker}, мейкера — ${maker}: каждые 10 000 $ оборота по рыночным ордерам обходятся на ${per} дороже, чем по лимитным из стакана.`,
      published: (ex, segIn, parts) => `Ваши фактические ставки ${segIn} на ${ex}: ${parts}. Биржа берёт ставку, которая действует для вашего аккаунта, — её видно в личном кабинете в разделе комиссий.`,
      publishedPart: (role, actual, published, first) => `${role} ${actual} (${first ? "опубликованная базовая" : "базовая"} — ${published})`,
    },
    be: {
      title: "Порог безубыточности",
      roundTrip: (segIn, pct) => `Сделка туда и обратно по вашей ставке тейкера ${segIn} стоит ≈ ${pct} от размера позиции: чтобы только окупить комиссию, цена должна пройти в вашу сторону хотя бы на столько.`,
      leverage: (pct) => `С плечом 10× это ≈ ${pct} от залога.`,
      positions: "Закрытые позиции",
      count: "Позиций закрыто",
      liq: (n, s) => ` (из них ${s} ${costsPlural(n, ["ликвидация", "ликвидации", "ликвидаций"])})`,
      gross: "Результат по цене, до издержек",
      costs: "Комиссии и фандинг",
      net: "Итог после издержек",
      winGross: "В плюс по цене",
      winNet: "В плюс после издержек",
      of: (a, b, pct) => `${a} из ${b} (${pct})`,
      flipped: "Издержки перевели из плюса в минус",
      positionsN: (n, s) => `${s} ${costsPlural(n, ["позиция", "позиции", "позиций"])}`,
      avgWin: "Средняя прибыльная позиция",
      avgLoss: "Средняя убыточная позиция",
      avgCost: "Издержки на позицию в среднем",
      avgCostShare: (v, pct) => `${v} — ${pct} средней прибыльной`,
      breakEven: "Доля прибыльных позиций, чтобы выйти в ноль",
      breakEvenValue: (need, now) => `≈ ${need} (сейчас ${now})`,
      explain: "Порог считается по вашим же средним прибыли и убытку после издержек: средний убыток ÷ (средняя прибыль + средний убыток). Чем больше издержки на позицию, тем выше порог.",
      pnlHint: "Добавьте файл закрытых позиций (Bybit: Orders → Derivatives → Closed P&L → Export) — появятся доля прибыльных позиций и порог безубыточности.",
    },
    cmp: {
      title: "Те же сделки при других ставках",
      intro: "Пересчитали ваши сделки на споте и во фьючерсах по опубликованным базовым ставкам бирж — без VIP-уровней и скидок. Сделки мейкера — по ставке мейкера, остальные и ликвидации — по ставке тейкера. Ставки можно поменять, например на ставки из вашего аккаунта.",
      warn: "Фактические ставки зависят от страны и аккаунта: региональные версии одной биржи берут по-разному, а ваша ставка может отличаться от опубликованной. Фандинг, спред и комиссии за ввод и вывод в сравнение не входят. Это арифметика по вашим сделкам, а не рекомендация биржи.",
      th: ["Биржа", "Спот, %: мейкер / тейкер", "Фьючерсы, %: мейкер / тейкер", "Комиссии", "Разница с фактом"],
      actual: "Фактически по вашим файлам",
      unverified: "не сверено",
      unverifiedTitle: "Ставка из обзоров, с официальным сайтом не сверена",
      pairs: "осн. пары",
      pairsTitle: "Ставка для основных пар; для отдельных пар — другая",
      reset: "Вернуть опубликованные ставки",
      checked: (d) => `Опубликованные ставки проверены ${d}`,
      rateLabel: (ex, seg, role) => `${ex}: ${seg}, ставка ${role}, %`,
      noSeg: "нет сделок",
    },
    markets: {
      title: "По инструментам",
      intro: "Инструменты с наибольшими издержками — комиссии плюс фандинг.",
      th: ["Инструмент", "Рынок", "Сделки", "Оборот", "Комиссии", "Фандинг"],
    },
    hints: {
      title: "Что ещё можно добавить",
      bybitPnl: "Closed P&L (Orders → Derivatives → Closed P&L → Export) — доля прибыльных позиций и порог безубыточности.",
      bybitLog: "Журнал счёта (Assets → Unified Trading Account → History Records → Transaction Log → Export) — комиссии по опционам, обмен монет и проценты за заём.",
      bybitPerp: "Историю сделок в деривативах (Orders → Derivatives → Trade History → Export) — доля рыночных и лимитных ордеров.",
    },
    nf: {
      title: "Что не учтено",
      spread: "Спред и проскальзывание: цена исполнения в файле их уже включает, отдельной суммой биржа их не показывает.",
      transfers: 'Комиссии за ввод и вывод, P2P и обмен на рубли — их считает <a href="/calculator/">калькулятор переводов</a>.',
      unpriced: (list) => `Комиссии в монетах, для которых в ваших файлах нет цены: ${list}. В суммы они не вошли.`,
      noNotional: (n, s) => `${s} ${costsPlural(n, ["сделка", "сделки", "сделок"])} без суммы сделки (например, объём в контрактах): их комиссия учтена, а в долю от оборота и сравнение ставок они не вошли.`,
      beta: "Файлы OKX разобраны в бета-режиме: формат собран по официальной справке и ещё не проверен на реальной выгрузке.",
    },
  },
  en: {
    locale: "en-US",
    privacy: "<strong>Your files never leave your computer.</strong> Everything is calculated right in the browser: we send nothing to a server and store nothing. Close the tab and the data is gone.",
    dropTitle: "Drop CSV files from your exchange here, or click to choose",
    dropSub: "Bybit and OKX exports are recognised automatically; files from other exchanges work through the columns you point to. You can add several files at once.",
    demo: "See an example",
    howto: "How to export the files",
    clear: "Clear all",
    reading: "Reading files…",
    demoBanner: "This is an example with made-up data. Upload your own files and the example disappears.",
    demoError: "Couldn't load the example. Refresh the page and try again.",
    types: {
      "bybit-perp": "Bybit · derivatives trades",
      "bybit-spot": "Bybit · spot trades",
      "bybit-pnl": "Bybit · closed positions (Closed P&L)",
      "bybit-log": "Bybit · account transaction log",
      "okx-trades": "OKX · trading history",
      "okx-positions": "OKX · position history",
      custom: "Custom format",
    },
    rows: (n, s) => `${s} ${costsPlural(n, ["row", "rows"])}`,
    beta: "beta",
    betaNote: "The OKX format is built from OKX's official help pages and hasn't been checked against a real export yet. Compare the totals with your account.",
    dupes: (n, s) => `${s} ${costsPlural(n, ["row is", "rows are"])} already in another file — not counted twice.`,
    shadowed: {
      "bybit-pnl": "Fees and funding for this period are already in the trade history, so this file only adds position results.",
      "bybit-log": "Trades and funding for this period are already in the trade history, so this file adds options, coin conversions and borrowing interest.",
      other: "Some records are already in a more detailed file for the same period — not counted twice.",
    },
    reasons: {
      xlsx: "This is an Excel file (XLSX). Open it in Excel or Google Sheets and save it as CSV, then add it again.",
      empty: "The file is empty.",
      unknown: "Format not recognised. Tell us what each column means and the calculation will use them.",
      norecords: "No trades with fees found. This may be a different report — for example, order history rather than trade history.",
      nomatch: "The chosen fee column has no numbers — check which column is which.",
      read: "Couldn't read the file.",
      big: "The file is larger than 50 MB — export a shorter period.",
    },
    remove: "Remove",
    removeLabel: (name) => `Remove file ${name}`,
    map: {
      intro: "Only the fee column is required. To see the share of turnover and compare rates, also pick the trade value — or the price and quantity.",
      exchange: "Exchange",
      exchangePh: "e.g. BingX",
      seg: "Market",
      spot: "Spot",
      futures: "Futures",
      time: "Date and time",
      market: "Instrument",
      value: "Trade value",
      price: "Price",
      qty: "Quantity",
      fee: "Fee",
      feeCoin: "Fee currency",
      orderType: "Order type (market / limit)",
      none: "—",
      apply: "Calculate",
      feeRequired: "Choose the fee column.",
      preview: "First rows of the file",
    },
    title: "Your trading costs",
    period: (ex, a, b) => `${ex} · ${a} — ${b}`,
    disclaimer: "This is arithmetic on your own files, not an assessment of your trading and not investment advice.",
    tiles: {
      total: "Total costs",
      totalSub: "fees, funding and the rest",
      trading: "Trading fees",
      tradingSub: (n, s) => `${s} ${costsPlural(n, ["trade", "trades"])}`,
      funding: "Funding",
      fundingIn: "in your favour",
      fundingOut: "you paid more than you received",
      fundingNone: "no funding payments",
      share: "Share of turnover",
      shareSub: (v) => `turnover ${v}`,
    },
    breakdown: {
      title: "What the costs are made of",
      th: ["Item", "Amount", "Details"],
      spot: "Spot fees",
      futures: "Futures fees",
      liq: "of which on liquidations",
      fundingPaid: "Funding paid",
      fundingReceived: "Funding received",
      options: "Options fees",
      conversion: "Coin conversion inside the account",
      interest: "Borrowing interest",
      total: "Total",
      fills: (n, s, turnover) => `${s} ${costsPlural(n, ["trade", "trades"])}, turnover ${turnover}`,
      count: (n, s) => `${s} ${costsPlural(n, ["record", "records"])}`,
    },
    orders: {
      title: "Market and limit orders",
      intro: "A taker trade fills immediately: a market order, or a limit order priced into the order book. A maker order is a limit order that rested in the book first. Makers almost always pay less.",
      th: ["", "Trades", "Turnover", "Fees", "Rate"],
      seg: { spot: "Spot", futures: "Futures" },
      segIn: { spot: "on spot", futures: "in futures" },
      role: { taker: "taker", maker: "maker" },
      takerShare: (segIn, pct) => `${costsCap(segIn)}, ${pct} of turnover came from taker trades.`,
      limitAsTaker: (segIn, n, s) => `${s} limit ${costsPlural(n, ["trade", "trades"])} ${segIn} filled at the same rate as market orders — the file doesn't show whether they rested in the book, so we count them as taker trades.`,
      gap: (segIn, taker, maker, per) => `Your taker rate ${segIn} is ${taker} and your maker rate is ${maker}: every $10,000 of turnover through market orders costs ${per} more than through resting limit orders.`,
      published: (ex, segIn, parts) => `Your actual rates ${segIn} on ${ex}: ${parts}. The exchange charges the rate set for your account — you can see it in your account's fee section.`,
      publishedPart: (role, actual, published, first) => `${role} ${actual} (${first ? "published base" : "base"} ${published})`,
    },
    be: {
      title: "Break-even",
      roundTrip: (segIn, pct) => `A round trip at your taker rate ${segIn} costs ≈ ${pct} of the position size: the price has to move at least that far in your favour just to cover the fee.`,
      leverage: (pct) => `With 10× leverage that is ≈ ${pct} of your margin.`,
      positions: "Closed positions",
      count: "Positions closed",
      liq: (n, s) => ` (${s} ${costsPlural(n, ["liquidation", "liquidations"])})`,
      gross: "Result from price moves, before costs",
      costs: "Fees and funding",
      net: "Result after costs",
      winGross: "Profitable on price",
      winNet: "Profitable after costs",
      of: (a, b, pct) => `${a} of ${b} (${pct})`,
      flipped: "Costs turned a gain into a loss",
      positionsN: (n, s) => `${s} ${costsPlural(n, ["position", "positions"])}`,
      avgWin: "Average winning position",
      avgLoss: "Average losing position",
      avgCost: "Average costs per position",
      avgCostShare: (v, pct) => `${v} — ${pct} of an average win`,
      breakEven: "Win rate needed to break even",
      breakEvenValue: (need, now) => `≈ ${need} (now ${now})`,
      explain: "The threshold uses your own average win and loss after costs: average loss ÷ (average win + average loss). The higher the cost per position, the higher the threshold.",
      pnlHint: "Add your closed positions file (Bybit: Orders → Derivatives → Closed P&L → Export) to see your win rate and break-even threshold.",
    },
    cmp: {
      title: "The same trades at other rates",
      intro: "We recalculated your spot and futures trades at the exchanges' published base rates — no VIP tiers or discounts. Maker trades use the maker rate; everything else, liquidations included, uses the taker rate. You can change the rates, for example to the ones in your account.",
      warn: "Actual rates depend on your country and account: regional versions of the same exchange charge differently, and your rate may differ from the published one. Funding, spread and deposit or withdrawal fees aren't part of the comparison. This is arithmetic on your trades, not an exchange recommendation.",
      th: ["Exchange", "Spot, %: maker / taker", "Futures, %: maker / taker", "Fees", "Difference from actual"],
      actual: "Actual, from your files",
      unverified: "unverified",
      unverifiedTitle: "Rate from reviews, not checked against the official site",
      pairs: "main pairs",
      pairsTitle: "Rate for the main pairs; other pairs differ",
      reset: "Restore published rates",
      checked: (d) => `Published rates checked on ${d}.`,
      rateLabel: (ex, seg, role) => `${ex}: ${seg}, ${role} rate, %`,
      noSeg: "no trades",
    },
    markets: {
      title: "By instrument",
      intro: "Instruments with the highest costs — fees plus funding.",
      th: ["Instrument", "Market", "Trades", "Turnover", "Fees", "Funding"],
    },
    hints: {
      title: "You can also add",
      bybitPnl: "Closed P&L (Orders → Derivatives → Closed P&L → Export) — win rate and break-even threshold.",
      bybitLog: "The transaction log (Assets → Unified Trading Account → History Records → Transaction Log → Export) — options fees, coin conversions and borrowing interest.",
      bybitPerp: "Derivatives trade history (Orders → Derivatives → Trade History → Export) — the split between market and limit orders.",
    },
    nf: {
      title: "What isn't included",
      spread: "Spread and slippage: the fill price in the file already includes them, and exchanges don't show them as a separate amount.",
      transfers: 'Deposit and withdrawal fees, P2P and conversion to fiat — the <a href="/en/calculator/">transfer calculator</a> covers those.',
      unpriced: (list) => `Fees in coins with no price in your files: ${list}. They aren't included in the totals.`,
      noNotional: (n, s) => `${s} ${costsPlural(n, ["trade has", "trades have"])} no trade value (for example, size in contracts): the fee is counted, but they're left out of the turnover share and the rate comparison.`,
      beta: "OKX files are read in beta mode: the format is built from OKX's official help pages and hasn't been checked against a real export yet.",
    },
  },
};

function getCostsLang() {
  return document.documentElement.lang === "en" ? "en" : "ru";
}

function costsEsc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function costsCap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Русский: [одна, две–четыре, пять]; английский: [one, many].
function costsPlural(n, forms) {
  if (forms.length === 2) return Math.abs(n) === 1 ? forms[0] : forms[1];
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b === 1) return forms[0];
  if (b >= 2 && b <= 4) return forms[1];
  return forms[2];
}

function costsFormatters(locale) {
  const nf = (opts) => new Intl.NumberFormat(locale, opts);
  const money2 = nf({ style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money0 = nf({ style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const int = nf({ maximumFractionDigits: 0 });
  const date = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const dec = (v, d) => nf({ minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
  const money = (v) => (Math.abs(v) >= 10000 ? money0 : money2).format(Math.abs(v) < 0.005 ? 0 : v).replace("-", "−");
  return {
    money,
    signed: (v) => (v >= 0.005 ? "+" : v <= -0.005 ? "−" : "") + money(Math.abs(v)),
    int: (v) => int.format(v),
    pct: (fraction, d = 1) => `${dec(fraction * 100, d)}%`,
    rate: (fraction) => `${dec(fraction * 100, 3)}%`,
    num: (v, d) => dec(v, d),
    date: (ms) => date.format(new Date(ms)),
  };
}

// Файл → текст. UTF-8, а если в нём есть «битые» символы — Windows-1251
// (так сохраняет CSV русский Excel).
async function costsDecode(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return "PK";
  let text = new TextDecoder("utf-8").decode(bytes);
  if (text.includes("�")) {
    try {
      text = new TextDecoder("windows-1251").decode(bytes);
    } catch (e) {
      // Кодировка не поддерживается браузером — остаётся UTF-8.
    }
  }
  return text;
}

// Догадка, какая колонка что означает, по названию (для своего формата).
function costsGuessMapping(header) {
  const names = header.map(costsNormHeader);
  const pick = (re, skip) => names.findIndex((n) => re.test(n) && !(skip && skip.test(n)));
  return {
    time: pick(/time|date|дата|время/),
    market: pick(/symbol|pair|market|instrument|contract|пара|инструмент|тикер/),
    value: pick(/value|total|turnover|notional|сумма|стоимость|оборот/, /fee|комисс/),
    price: pick(/price|цена/, /fee|комисс|order price|trigger/),
    qty: pick(/qty|quantity|amount|size|volume|количество|объ[её]м/, /fee|комисс|value|total/),
    fee: pick(/fee|commission|комисс/, /coin|currency|unit|asset|rate|валют|ставк|type|тип/),
    feeCoin: pick(/(fee|commission|комисс).*(coin|currency|unit|asset|валют)|(coin|currency|валют).*(fee|комисс)/),
    orderType: pick(/order type|liquidity|maker|taker|тип ордера|exec type/),
  };
}

function initCostsTool(rootId) {
  const root = document.getElementById(rootId);
  if (!root || typeof costsAnalyze !== "function") return;
  const lang = getCostsLang();
  const t = COSTS_STRINGS[lang];
  const f = costsFormatters(t.locale);
  const state = { files: [], demo: false, result: null, rates: null, scrolled: false };
  const freshRates = () => COSTS_FEE_TABLE.map((ex) => ({ slug: ex.slug, name: ex.name, official: ex.official, pairDependent: !!ex.pairDependent, spot: Object.assign({}, ex.spot), futures: Object.assign({}, ex.futures) }));
  state.rates = freshRates();

  root.innerHTML = `
    <p class="cs-privacy">${t.privacy}</p>
    <label class="cs-drop" for="cs-file">
      <input type="file" id="cs-file" class="cs-file-input" accept=".csv,text/csv,text/plain" multiple />
      <span class="cs-drop-title">${t.dropTitle}</span>
      <span class="cs-drop-sub">${t.dropSub}</span>
    </label>
    <div class="cs-actions">
      <button type="button" class="sq-button sq-button--ghost" data-action="demo">${t.demo}</button>
      <a href="#cs-howto">${t.howto}</a>
      <button type="button" class="cs-link-button" data-action="clear" hidden>${t.clear}</button>
    </div>
    <p class="cs-status" role="status" aria-live="polite"></p>
    <ul class="cs-files"></ul>
    <div class="cs-results"></div>`;

  const input = root.querySelector("#cs-file");
  const drop = root.querySelector(".cs-drop");
  const list = root.querySelector(".cs-files");
  const out = root.querySelector(".cs-results");
  const status = root.querySelector(".cs-status");
  const clearBtn = root.querySelector('[data-action="clear"]');

  async function addFiles(fileList) {
    const incoming = [...fileList];
    if (!incoming.length) return;
    if (state.demo) {
      state.files = [];
      state.demo = false;
    }
    status.textContent = t.reading;
    for (const file of incoming) {
      if (file.size > COSTS_MAX_BYTES) {
        state.files.push(costsFailedFile(file.name, "big"));
        continue;
      }
      try {
        state.files.push(costsReadFile(file.name, await costsDecode(file)));
      } catch (e) {
        state.files.push(costsFailedFile(file.name, "read"));
      }
    }
    status.textContent = "";
    update(true);
  }

  async function loadDemo() {
    status.textContent = t.reading;
    try {
      const texts = await Promise.all(
        COSTS_DEMO_FILES.map((name) =>
          fetch(COSTS_DEMO_PATH + name).then((r) => {
            if (!r.ok) throw new Error(String(r.status));
            return r.text();
          })
        )
      );
      state.files = texts.map((text, i) => costsReadFile(COSTS_DEMO_FILES[i], text));
      state.demo = true;
      status.textContent = "";
      update(true);
    } catch (e) {
      status.textContent = t.demoError;
    }
  }

  function update(scroll) {
    state.result = state.files.some((x) => x.ok) ? costsAnalyze(state.files) : null;
    clearBtn.hidden = !state.files.length;
    renderFiles();
    renderResults();
    if (scroll && state.result) {
      const top = out.getBoundingClientRect().top + window.scrollY - 90;
      if (top > window.scrollY + window.innerHeight * 0.6) window.scrollTo({ top, behavior: "smooth" });
    }
  }

  // ------------------------------------------------------------------------
  // Список файлов.
  // ------------------------------------------------------------------------
  function fileNotes(file) {
    const notes = [];
    if (!file.ok && file.reason && file.reason !== "unknown") notes.push(t.reasons[file.reason] || t.reasons.read);
    if (file.ok && file.beta) notes.push(t.betaNote);
    if (file.ok && file.dupes) notes.push(t.dupes(file.dupes, f.int(file.dupes)));
    if (file.ok && file.shadowed) notes.push(t.shadowed[file.type] || t.shadowed.other);
    return notes;
  }

  function renderFiles() {
    list.innerHTML = state.files
      .map((file) => {
        const bad = !file.ok;
        const label = file.type ? (file.type === "custom" ? `${t.types.custom} · ${costsEsc(file.exchange)}` : t.types[file.type]) : "";
        const range = file.dataRange ? `${f.date(file.dataRange[0])} — ${f.date(file.dataRange[1])}` : "";
        const meta = [label, file.rows ? t.rows(file.rows, f.int(file.rows)) : "", range].filter(Boolean).join(" · ");
        const notes = fileNotes(file);
        // Форма колонок — для незнакомого файла и для своего формата, где по
        // выбранным колонкам не нашлось сделок (чтобы можно было поправить).
        const mapper = file.body && !file.ok && (file.reason === "unknown" || file.custom) ? renderMapper(file) : "";
        return `
          <li class="cs-file${bad ? " cs-file--bad" : ""}" data-file="${file.id}">
            <div class="cs-file-head">
              <span class="cs-file-name">${costsEsc(file.name)}</span>
              ${file.ok && file.beta ? `<span class="cs-tag">${t.beta}</span>` : ""}
              <button type="button" class="cs-link-button cs-file-remove" data-action="remove" data-file="${file.id}" aria-label="${costsEsc(t.removeLabel(file.name))}">${t.remove}</button>
            </div>
            ${meta ? `<div class="cs-file-meta">${meta}</div>` : ""}
            ${notes.map((n) => `<p class="cs-file-note">${n}</p>`).join("")}
            ${!file.ok && file.reason === "unknown" ? `<p class="cs-file-note">${t.reasons.unknown}</p>` : ""}
            ${mapper}
          </li>`;
      })
      .join("");
  }

  function renderMapper(file) {
    const m = file.map || costsGuessMapping(file.header);
    const opts = (key) => {
      const sel = m[key];
      return [`<option value="-1">${t.map.none}</option>`]
        .concat(file.header.map((h, i) => `<option value="${i}"${sel === i ? " selected" : ""}>${costsEsc(h || `#${i + 1}`)}</option>`))
        .join("");
    };
    const field = (key) => `
      <label class="cs-map-field">${t.map[key]}
        <select data-map="${key}">${opts(key)}</select>
      </label>`;
    const preview = file.sample.length
      ? `<details class="cs-map-preview"><summary>${t.map.preview}</summary><div class="cs-table-wrap"><table class="cs-preview">
          <thead><tr>${file.header.map((h) => `<th>${costsEsc(h)}</th>`).join("")}</tr></thead>
          <tbody>${file.sample.map((r) => `<tr>${file.header.map((_, i) => `<td>${costsEsc(r[i] || "")}</td>`).join("")}</tr>`).join("")}</tbody>
        </table></div></details>`
      : "";
    return `
      <form class="cs-map" data-file="${file.id}" novalidate>
        <p class="cs-map-intro">${t.map.intro}</p>
        <div class="cs-map-grid">
          <label class="cs-map-field">${t.map.exchange}
            <input type="text" data-map="exchange" maxlength="40" placeholder="${costsEsc(t.map.exchangePh)}" value="${costsEsc(file.custom ? file.exchange : "")}" />
          </label>
          <label class="cs-map-field">${t.map.seg}
            <select data-map="seg">
              <option value="spot"${file.seg === "spot" ? " selected" : ""}>${t.map.spot}</option>
              <option value="futures"${file.seg === "futures" ? " selected" : ""}>${t.map.futures}</option>
            </select>
          </label>
          ${["fee", "feeCoin", "value", "price", "qty", "market", "time", "orderType"].map(field).join("")}
        </div>
        <p class="cs-map-error" role="alert" hidden>${t.map.feeRequired}</p>
        <button type="submit" class="sq-button">${t.map.apply}</button>
        ${preview}
      </form>`;
  }

  function applyMapper(form) {
    const file = state.files.find((x) => String(x.id) === form.dataset.file);
    if (!file) return;
    const map = {};
    form.querySelectorAll("select[data-map]").forEach((s) => {
      if (s.dataset.map !== "seg") map[s.dataset.map] = parseInt(s.value, 10);
    });
    if (!(map.fee >= 0)) {
      form.querySelector(".cs-map-error").hidden = false;
      return;
    }
    const seg = form.querySelector('select[data-map="seg"]').value;
    const exchange = form.querySelector('input[data-map="exchange"]').value;
    costsApplyMapping(file, map, seg, exchange);
    update(true);
  }

  // ------------------------------------------------------------------------
  // Результат.
  // ------------------------------------------------------------------------
  function table(head, rows, cls) {
    return `
      <div class="cs-table-wrap"><table class="cs-table${cls ? ` ${cls}` : ""}">
        <thead><tr>${head.map((h, i) => `<th${i ? ' class="cs-num"' : ""}>${h}</th>`).join("")}</tr></thead>
        <tbody>${rows.join("")}</tbody>
      </table></div>`;
  }

  function row(cells, cls) {
    return `<tr${cls ? ` class="${cls}"` : ""}>${cells.map((c, i) => `<td${i ? ' class="cs-num"' : ""} data-label="${costsEsc(c.label || "")}">${c.html}</td>`).join("")}</tr>`;
  }

  function renderResults() {
    const r = state.result;
    if (!r) {
      out.innerHTML = "";
      return;
    }
    const blocks = [];
    if (state.demo) blocks.push(`<p class="cs-demo-banner">${t.demoBanner}</p>`);
    blocks.push(renderSummary(r));
    blocks.push(renderBreakdown(r));
    const orders = renderOrders(r);
    if (orders) blocks.push(orders);
    blocks.push(renderBreakEven(r));
    const cmp = renderCompare(r);
    if (cmp) blocks.push(cmp);
    if (r.markets.length > 1) blocks.push(renderMarkets(r));
    if (r.hints.length) blocks.push(`<div class="cs-block"><h3>${t.hints.title}</h3><ul class="cs-list">${r.hints.map((h) => `<li>${t.hints[h]}</li>`).join("")}</ul></div>`);
    blocks.push(renderNotCounted(r));
    out.innerHTML = blocks.join("");
    refreshCompare();
  }

  function renderSummary(r) {
    const turnover = r.seg.spot.notional + r.seg.futures.notional;
    const known = r.seg.spot.feesKnown + r.seg.futures.feesKnown;
    const fills = r.seg.spot.fills + r.seg.futures.fills;
    const fund = r.funding;
    const fundValue = fund.count ? f.signed(-fund.net) : f.money(0);
    const fundSub = !fund.count ? t.tiles.fundingNone : fund.net <= 0 ? t.tiles.fundingIn : t.tiles.fundingOut;
    const period = r.period ? t.period(costsEsc(r.exchanges.join(", ")), f.date(r.period[0]), f.date(r.period[1])) : costsEsc(r.exchanges.join(", "));
    const tile = (label, value, sub, main) => `
      <div class="cs-tile${main ? " cs-tile--main" : ""}">
        <div class="cs-tile-label">${label}</div>
        <div class="cs-tile-value">${value}</div>
        <div class="cs-tile-sub">${sub}</div>
      </div>`;
    return `
      <div class="cs-block cs-block--first">
        <h2 class="cs-title" tabindex="-1">${t.title}</h2>
        <p class="cs-period">${period}</p>
        <div class="cs-tiles">
          ${tile(t.tiles.total, f.money(r.total), t.tiles.totalSub, true)}
          ${tile(t.tiles.trading, f.money(r.tradingFees), t.tiles.tradingSub(fills, f.int(fills)))}
          ${tile(t.tiles.funding, fundValue, fundSub)}
          ${turnover > 0 ? tile(t.tiles.share, f.pct(known / turnover, 3), t.tiles.shareSub(f.money(turnover))) : ""}
        </div>
        <p class="cs-disclaimer">${t.disclaimer}</p>
      </div>`;
  }

  function renderBreakdown(r) {
    const b = t.breakdown;
    const rows = [];
    const add = (label, amount, note, cls) => rows.push(row([{ html: label }, { html: amount, label: b.th[1] }, { html: note, label: b.th[2] }], cls));
    ["spot", "futures"].forEach((seg) => {
      const s = r.seg[seg];
      if (!s.fills) return;
      add(b[seg], f.money(s.fees), b.fills(s.fills, f.int(s.fills), f.money(s.notional)));
      if (s.liq.fills) add(b.liq, f.money(s.liq.fees), b.fills(s.liq.fills, f.int(s.liq.fills), f.money(s.liq.notional)), "cs-sub");
    });
    if (r.funding.paid) add(b.fundingPaid, f.money(r.funding.paid), b.count(r.funding.count, f.int(r.funding.count)));
    if (r.funding.received) add(b.fundingReceived, f.signed(-r.funding.received), r.funding.paid ? "" : b.count(r.funding.count, f.int(r.funding.count)));
    ["options", "conversion", "interest"].forEach((k) => {
      const e = r.extra[k];
      if (e.count && Math.abs(e.cost) >= 0.005) add(b[k], f.money(e.cost), b.count(e.count, f.int(e.count)));
    });
    add(b.total, f.money(r.total), "", "cs-total");
    return `<div class="cs-block"><h3>${b.title}</h3>${table(b.th, rows)}</div>`;
  }

  function renderOrders(r) {
    const o = t.orders;
    const rows = [];
    const insights = [];
    // Сначала рынок с большим оборотом — о нём и главные выводы.
    const segs = ["spot", "futures"].filter((seg) => r.seg[seg].notional > 0).sort((a, b) => r.seg[b].notional - r.seg[a].notional);
    segs.forEach((seg) => {
      const s = r.seg[seg];
      ["taker", "maker"].forEach((role) => {
        const p = s[role];
        if (!p.fills) return;
        rows.push(
          row([
            { html: `${o.seg[seg]} · ${o.role[role]}` },
            { html: f.int(p.fills), label: o.th[1] },
            { html: f.money(p.notional), label: o.th[2] },
            { html: f.money(p.fees), label: o.th[3] },
            { html: p.notional ? f.rate(p.fees / p.notional) : "—", label: o.th[4] },
          ])
        );
      });
      insights.push(o.takerShare(o.segIn[seg], f.pct(s.taker.notional / s.notional, 0)));
      if (s.limitAsTaker && !s.maker.fills) insights.push(o.limitAsTaker(o.segIn[seg], s.limitAsTaker, f.int(s.limitAsTaker)));
      const taker = observedRate(r, seg, "taker");
      const maker = observedRate(r, seg, "maker");
      if (taker && maker && taker.rate > maker.rate) insights.push(o.gap(o.segIn[seg], f.rate(taker.rate), f.rate(maker.rate), f.money((taker.rate - maker.rate) * 10000)));
      // Фактические ставки против опубликованных — одной фразой на рынок.
      const differs = [];
      let exchange = "";
      ["taker", "maker"].forEach((role) => {
        const own = observedRate(r, seg, role);
        if (!own) return;
        const pub = COSTS_FEE_TABLE.find((ex) => ex.official && ex.name === own.exchange);
        if (!pub) return;
        const published = pub[seg][role] / 100;
        if (published > 0 && Math.abs(own.rate - published) / published > COSTS_RATE_GAP) {
          exchange = own.exchange;
          differs.push(o.publishedPart(o.role[role], f.rate(own.rate), f.rate(published), !differs.length));
        }
      });
      if (differs.length) insights.push(o.published(costsEsc(exchange), o.segIn[seg], differs.join(", ")));
    });
    if (!rows.length) return "";
    return `
      <div class="cs-block">
        <h3>${o.title}</h3>
        <p class="cs-muted">${o.intro}</p>
        ${table(o.th, rows)}
        ${insights.map((x) => `<p class="cs-insight">${x}</p>`).join("")}
      </div>`;
  }

  // Ставка по одной бирже (если в файлах одна биржа на этом рынке).
  function observedRate(r, seg, role) {
    const list = r.observed.filter((o) => o.seg === seg && o.role === role);
    return list.length === 1 ? list[0] : null;
  }

  function renderBreakEven(r) {
    const b = t.be;
    const parts = [];
    ["futures", "spot"].forEach((seg) => {
      const taker = observedRate(r, seg, "taker");
      if (!taker) return;
      parts.push(`<p>${b.roundTrip(t.orders.segIn[seg], f.pct(taker.rate * 2, 2))}${seg === "futures" ? ` ${b.leverage(f.pct(taker.rate * 20, 1))}` : ""}</p>`);
    });
    const p = r.positions;
    if (p) {
      const pct = (a) => f.pct(a / p.count, 0);
      const rows = [
        [b.count, f.int(p.count) + (p.liq ? b.liq(p.liq, f.int(p.liq)) : "")],
        [b.gross, f.signed(p.gross)],
        [b.costs, f.signed(-(p.fees + p.funding))],
        [b.net, f.signed(p.net)],
        [b.winGross, b.of(f.int(p.winGross), f.int(p.count), pct(p.winGross))],
        [b.winNet, b.of(f.int(p.winNet), f.int(p.count), pct(p.winNet))],
        [b.flipped, b.positionsN(p.flipped, f.int(p.flipped))],
      ];
      if (p.wins) rows.push([b.avgWin, f.signed(p.avgWin)]);
      if (p.losses) rows.push([b.avgLoss, f.signed(-p.avgLoss)]);
      rows.push([b.avgCost, p.avgWin > 0 ? b.avgCostShare(f.money(p.avgCost), f.pct(p.avgCost / p.avgWin, 0)) : f.money(p.avgCost)]);
      if (p.breakEven != null) rows.push([b.breakEven, b.breakEvenValue(f.pct(p.breakEven, 0), pct(p.winNet))]);
      parts.push(`
        <h4>${b.positions}</h4>
        <dl class="cs-dl">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>
        ${p.breakEven != null ? `<p class="cs-muted">${b.explain}</p>` : ""}`);
    } else if (r.seg.futures.fills) {
      parts.push(`<p class="cs-muted">${b.pnlHint}</p>`);
    }
    if (!parts.length) return "";
    return `<div class="cs-block"><h3>${b.title}</h3>${parts.join("")}</div>`;
  }

  function renderCompare(r) {
    const c = t.cmp;
    const segs = ["spot", "futures"].filter((seg) => r.seg[seg].notional > 0);
    if (!segs.length) return "";
    const actual = r.seg.spot.feesKnown + r.seg.futures.feesKnown;
    const rateInput = (i, seg, role, ex) => {
      if (!segs.includes(seg)) return "";
      return `<input type="text" inputmode="decimal" class="cs-rate" data-rate="${i}" data-seg="${seg}" data-role="${role}" value="${f.num(ex[seg][role], 3)}" aria-label="${costsEsc(c.rateLabel(ex.name, t.orders.seg[seg], t.orders.role[role]))}" />`;
    };
    const cell = (i, seg, ex) => (segs.includes(seg) ? `<span class="cs-rate-pair">${rateInput(i, seg, "maker", ex)}<span aria-hidden="true">/</span>${rateInput(i, seg, "taker", ex)}</span>` : `<span class="cs-muted">${c.noSeg}</span>`);
    const rows = state.rates.map((ex, i) => {
      const tags = [];
      if (!ex.official) tags.push(`<span class="cs-tag" title="${costsEsc(c.unverifiedTitle)}">${c.unverified}</span>`);
      if (ex.pairDependent) tags.push(`<span class="cs-tag cs-tag--soft" title="${costsEsc(c.pairsTitle)}">${c.pairs}</span>`);
      return row(
        [
          { html: `${costsEsc(ex.name)} ${tags.join(" ")}` },
          { html: cell(i, "spot", ex), label: c.th[1] },
          { html: cell(i, "futures", ex), label: c.th[2] },
          { html: `<span data-total="${i}"></span>`, label: c.th[3] },
          { html: `<span data-diff="${i}"></span>`, label: c.th[4] },
        ],
        "cs-cmp-row"
      );
    });
    rows.unshift(row([{ html: c.actual }, { html: "", label: "" }, { html: "", label: "" }, { html: f.money(actual), label: c.th[3] }, { html: "", label: "" }], "cs-actual"));
    return `
      <div class="cs-block cs-compare">
        <h3>${c.title}</h3>
        <p class="cs-muted">${c.intro}</p>
        ${table(c.th, rows, "cs-table--cmp")}
        <div class="cs-cmp-foot">
          <button type="button" class="cs-link-button" data-action="reset-rates">${c.reset}</button>
          <span class="cs-muted">${c.checked(f.date(Date.parse(COSTS_FEES_CHECKED)))}</span>
        </div>
        <p class="cs-muted">${c.warn}</p>
      </div>`;
  }

  // Пересчёт сравнения без перерисовки таблицы — чтобы поле ввода не
  // теряло фокус.
  function refreshCompare() {
    const r = state.result;
    if (!r) return;
    costsCompare(r, state.rates).forEach((row, i) => {
      const total = out.querySelector(`[data-total="${i}"]`);
      const diff = out.querySelector(`[data-diff="${i}"]`);
      if (total) total.textContent = f.money(row.total);
      if (diff) {
        diff.textContent = f.signed(row.diff);
        diff.className = row.diff < -0.005 ? "cs-less" : row.diff > 0.005 ? "cs-more" : "";
      }
    });
  }

  function renderMarkets(r) {
    const m = t.markets;
    const rows = r.markets.slice(0, 10).map((x) =>
      row([
        { html: costsEsc(x.market) + (r.exchanges.length > 1 ? ` <span class="cs-muted">${costsEsc(x.exchange)}</span>` : "") },
        { html: t.orders.seg[x.seg], label: m.th[1] },
        { html: f.int(x.fills), label: m.th[2] },
        { html: x.notional ? f.money(x.notional) : "—", label: m.th[3] },
        { html: f.money(x.fees), label: m.th[4] },
        { html: x.funding ? f.signed(-x.funding) : "—", label: m.th[5] },
      ])
    );
    return `<div class="cs-block"><h3>${m.title}</h3><p class="cs-muted">${m.intro}</p>${table(m.th, rows)}</div>`;
  }

  function renderNotCounted(r) {
    const n = t.nf;
    const items = [n.spread, n.transfers];
    if (r.unpriced.length) items.push(n.unpriced(r.unpriced.map((u) => costsEsc(u.coin)).join(", ")));
    const noNotional = r.seg.spot.noNotional + r.seg.futures.noNotional;
    if (noNotional) items.push(n.noNotional(noNotional, f.int(noNotional)));
    if (r.beta) items.push(n.beta);
    return `<div class="cs-block"><h3>${n.title}</h3><ul class="cs-list">${items.map((x) => `<li>${x}</li>`).join("")}</ul></div>`;
  }

  // ------------------------------------------------------------------------
  // События.
  // ------------------------------------------------------------------------
  input.addEventListener("change", () => {
    addFiles(input.files).finally(() => {
      input.value = "";
    });
  });
  ["dragenter", "dragover"].forEach((ev) =>
    drop.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.add("cs-drop--over");
    })
  );
  ["dragleave", "drop"].forEach((ev) =>
    drop.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.remove("cs-drop--over");
    })
  );
  drop.addEventListener("drop", (e) => {
    if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
  });

  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === "demo") loadDemo();
    else if (action === "clear") {
      state.files = [];
      state.demo = false;
      update(false);
    } else if (action === "remove") {
      state.files = state.files.filter((x) => String(x.id) !== btn.dataset.file);
      if (!state.files.length) state.demo = false;
      update(false);
    } else if (action === "reset-rates") {
      state.rates = freshRates();
      renderResults();
    }
  });

  root.addEventListener("submit", (e) => {
    const form = e.target.closest(".cs-map");
    if (!form) return;
    e.preventDefault();
    applyMapper(form);
  });

  root.addEventListener("input", (e) => {
    const el = e.target;
    if (!el.matches || !el.matches(".cs-rate")) return;
    const v = costsNum(el.value, true);
    const valid = Number.isFinite(v) && v >= 0 && v < 10;
    el.classList.toggle("cs-rate--bad", !valid);
    if (!valid) return;
    state.rates[+el.dataset.rate][el.dataset.seg][el.dataset.role] = v;
    refreshCompare();
  });
}
