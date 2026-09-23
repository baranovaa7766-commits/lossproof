// «Стоимость сделок» (/costs/, /en/costs/) — логика без DOM.
//
// Человек загружает выгрузки истории сделок с биржи, а мы считаем, сколько
// ушло на комиссии, фандинг и прочие издержки, какая доля оборота пришлась
// на рыночные ордера, где порог безубыточности и сколько стоили бы те же
// сделки при других ставках. Интерфейс — assets/js/costs.js, самопроверка —
// scripts/costs-check.js (запускайте после любых правок этого файла).
//
// Всё считается в браузере: файлы не отправляются на сервер и не
// сохраняются. Строки из файлов — чужие данные: интерфейс выводит их только
// через экранирование.
//
// Форматы распознаются по заголовку CSV (COSTS_TYPES):
//   Bybit — сделки на споте и в деривативах, Closed P&L, журнал транзакций
//           единого счёта. Проверено на реальных выгрузках (сентябрь 2026).
//   OKX   — история сделок и история позиций. БЕТА: колонки взяты из
//           официальной справки OKX, на реальном файле не проверено.
//   Любой другой CSV — через ручное сопоставление колонок (тип "custom").
//
// Один и тот же факт может быть в нескольких файлах сразу: у Bybit комиссия
// сделки есть и в истории сделок, и в журнале транзакций, и в Closed P&L.
// Чтобы не посчитать дважды, для каждой биржи и категории берём самый точный
// источник (COSTS_PRIORITY), а менее точные — только за периоды, которые
// точный источник не покрывает. Период файла — из имени файла Bybit
// (…-<начало>-<конец>.csv, секунды Unix), иначе — от первой до последней
// записи.
//
// Знак сумм внутри: cost > 0 — расход, cost < 0 — доход (полученный
// фандинг, ребейт мейкера).

// --------------------------------------------------------------------------
// Опубликованные базовые ставки бирж (без VIP-уровней и скидок за токены),
// в процентах. Нужны только для сравнения «те же сделки при других
// ставках»: в интерфейсе их можно поменять на ставки из своего аккаунта.
// official: true — сверено с официальной страницей комиссий на дату
// COSTS_FEES_CHECKED; false — из обзоров, как в сравнении бирж на сайте.
// Фактические ставки зависят от страны и аккаунта: у OKX региональные
// версии берут в разы больше (OKX UAE — 0,4%/0,6% на споте), MEXC и Bybit
// прямо пишут, что действуют ставки, показанные в аккаунте.
// --------------------------------------------------------------------------
const COSTS_FEES_CHECKED = "2026-09-23";

const COSTS_FEE_TABLE = [
  // https://www.bybit.com/en/announcement-info/fee-rate/ — Non-VIP.
  { slug: "bybit", name: "Bybit", spot: { maker: 0.1, taker: 0.1 }, futures: { maker: 0.02, taker: 0.055 }, official: true },
  // https://bingx.com/en/support/costs/ — VIP 0 (спот и бессрочные фьючерсы).
  { slug: "bingx", name: "BingX", spot: { maker: 0.1, taker: 0.1 }, futures: { maker: 0.02, taker: 0.05 }, official: true },
  // https://www.mexc.com/fee — основные пары (BTC/USDT и т. п.); по
  // отдельным парам ставки другие, от 0% до 0,1%.
  { slug: "mexc", name: "MEXC", spot: { maker: 0, taker: 0.05 }, futures: { maker: 0, taker: 0.02 }, official: true, pairDependent: true },
  // Спот — страница OKX Europe (0,08%/0,1%), фьючерсы — по обзорам.
  { slug: "okx", name: "OKX", spot: { maker: 0.08, taker: 0.1 }, futures: { maker: 0.02, taker: 0.05 }, official: false },
  { slug: "kucoin", name: "KuCoin", spot: { maker: 0.1, taker: 0.1 }, futures: { maker: 0.02, taker: 0.06 }, official: false },
  { slug: "gate", name: "Gate", spot: { maker: 0.2, taker: 0.2 }, futures: { maker: 0.02, taker: 0.05 }, official: false },
];

// --------------------------------------------------------------------------
// Форматы файлов.
//   signature — колонки (без учёта регистра), по которым узнаём формат;
//   covers    — категории, которые файл такого типа описывает полностью за
//               свой период (нужно для правила «не считать дважды»).
// --------------------------------------------------------------------------
const COSTS_TYPES = {
  "bybit-perp": { exchange: "Bybit", covers: ["futures", "funding"], signature: ["market", "filled type", "filled price", "trading fee"] },
  "bybit-spot": { exchange: "Bybit", covers: ["spot"], signature: ["spot pairs", "filled value", "execfeev2"] },
  "bybit-pnl": { exchange: "Bybit", covers: ["futures", "funding"], signature: ["market", "opening fee", "closing fee", "realized p&l"] },
  "bybit-log": {
    exchange: "Bybit",
    covers: ["spot", "futures", "funding", "options", "conversion", "interest"],
    signature: ["currency", "contract", "type", "fee paid", "cash flow", "wallet balance"],
  },
  "okx-trades": { exchange: "OKX", beta: true, covers: ["spot", "futures", "funding", "options"], signature: ["trade type", "symbol", "action", "filled price", "fee", "fee unit"] },
  "okx-positions": { exchange: "OKX", beta: true, covers: ["futures", "funding"], signature: ["instrument name", "average open price", "average close price", "funding fee"] },
};

const COSTS_CATEGORIES = ["spot", "futures", "funding", "options", "conversion", "interest"];

// Какой источник точнее для каждой категории (раньше — точнее).
const COSTS_PRIORITY = {
  spot: ["bybit-spot", "okx-trades", "bybit-log", "custom"],
  futures: ["bybit-perp", "okx-trades", "bybit-log", "bybit-pnl", "okx-positions", "custom"],
  funding: ["bybit-perp", "bybit-log", "okx-trades", "bybit-pnl", "okx-positions"],
  options: ["bybit-log", "okx-trades"],
  conversion: ["bybit-log"],
  interest: ["bybit-log"],
};

const COSTS_USD_LIKE = new Set(["USDT", "USDC", "USD", "FDUSD", "USDE", "DAI", "TUSD", "BUSD", "PYUSD", "USD1"]);
const COSTS_QUOTES = ["FDUSD", "PYUSD", "USDT", "USDC", "USDE", "TUSD", "BUSD", "USD1", "DAI", "USD", "EUR", "TRY", "BRL", "BTC", "ETH"];

// Лимитная сделка считается мейкерской, если её ставка заметно ниже ставки
// рыночных сделок того же файла (ниже этой доли).
const COSTS_MAKER_SHARE = 0.85;

// --------------------------------------------------------------------------
// Разбор чисел, дат, инструментов и CSV.
// --------------------------------------------------------------------------

// decimalComma — в файле запятая означает десятичный разделитель (CSV из
// Excel с разделителем «;»). Иначе запятая внутри числа — разделитель тысяч.
function costsNum(value, decimalComma) {
  if (value == null) return NaN;
  let s = String(value).replace(/[\s  ']/g, "");
  if (!s || /^-+$/.test(s)) return NaN;
  if (decimalComma) {
    if (s.includes(",") && s.includes(".")) {
      s = s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
    } else {
      s = s.replace(",", ".");
    }
  } else {
    s = s.replace(/,/g, "");
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
}

// Дата и время в миллисекундах UTC. Биржи пишут время по-разному:
// «19:34 2026-02-28» (Bybit), «2026-02-28 19:34:15.219», «28.02.2026 19:34»,
// Unix-время в секундах или миллисекундах.
function costsTime(value) {
  const s = String(value == null ? "" : value).trim();
  if (!s) return NaN;
  let m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s+(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return Date.UTC(+m[4], +m[5] - 1, +m[6], +m[1], +m[2], +(m[3] || 0));
  m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?/);
  if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0), +(m[7] || "0").padEnd(3, "0"));
  m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:[ T,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) return Date.UTC(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
  if (/^\d{13}$/.test(s)) return +s;
  if (/^\d{10}$/.test(s)) return +s * 1000;
  const parsed = Date.parse(s);
  return Number.isFinite(parsed) ? parsed : NaN;
}

// Инструмент → базовая монета, валюта котировки и признаки.
// BTCUSDT, BTC-USDT-SWAP, BTC/USDT, BTCPERP (USDC-контракт Bybit),
// BTCUSD (инверсный), ETH-20FEB26-2800-C-USDT (опцион).
function costsSymbol(raw) {
  const s = String(raw || "").trim().toUpperCase();
  const out = { symbol: s, base: "", quote: "", option: false, inverse: false, derivative: false };
  if (!s) return out;
  let m = s.match(/^([A-Z0-9]+)-\d{1,2}[A-Z]{3}\d{2}-[\d.]+-[CP](?:-([A-Z0-9]+))?$/);
  if (m) return Object.assign(out, { base: m[1], quote: m[2] || "USD", option: true, derivative: true });
  m = s.match(/^([A-Z0-9]+)PERP$/);
  if (m) return Object.assign(out, { base: m[1], quote: "USDC", derivative: true });
  m = s.match(/^([A-Z0-9]+)[-_/]([A-Z0-9]+)(?:[-_]([A-Z0-9]+))?$/);
  if (m) {
    const derivative = !!m[3];
    return Object.assign(out, { base: m[1], quote: m[2], derivative, inverse: derivative && m[2] === "USD" });
  }
  // Без разделителя: BTCUSDT. Контракты Bybit с котировкой в USD (BTCUSD) —
  // инверсные: объём в них указан в долларах, комиссия — в монете.
  for (const q of COSTS_QUOTES) {
    if (s.length > q.length && s.endsWith(q)) return Object.assign(out, { base: s.slice(0, -q.length), quote: q, inverse: q === "USD" });
  }
  return out;
}

function costsDetectDelimiter(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim()).slice(0, 12);
  let best = ",";
  let bestScore = 0;
  [",", ";", "\t"].forEach((d) => {
    const counts = lines.map((l) => l.replace(/"[^"]*"/g, "").split(d).length - 1);
    const score = counts.filter((c) => c >= 2).length * 1000 + counts.reduce((a, b) => a + b, 0);
    if (score > bestScore) {
      best = d;
      bestScore = score;
    }
  });
  return best;
}

function costsParseCsv(text) {
  const src = String(text || "").replace(/^﻿/, "");
  const delim = costsDetectDelimiter(src);
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const push = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    push();
    if (row.length > 1 || row[0].trim() !== "") rows.push(row);
    row = [];
  };
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === delim) push();
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      endRow();
    } else field += c;
  }
  if (field !== "" || row.length) endRow();
  return { rows, delim };
}

function costsNormHeader(h) {
  return String(h || "").replace(/^﻿/, "").trim().toLowerCase().replace(/\s+/g, " ");
}

// Строка заголовка может быть не первой (у OKX бывает строка с UID сверху).
function costsFindHeader(rows) {
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const names = new Set(rows[i].map(costsNormHeader));
    for (const type of Object.keys(COSTS_TYPES)) {
      if (COSTS_TYPES[type].signature.every((c) => names.has(c))) return { type, index: i };
    }
  }
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const cells = rows[i].filter((c) => c.trim());
    if (cells.length >= 3 && cells.filter((c) => Number.isFinite(costsNum(c))).length <= cells.length / 3) return { type: null, index: i };
  }
  return { type: null, index: 0 };
}

// Период из имени файла Bybit: …-1756674000-1772312399.csv
function costsRangeFromName(name) {
  const m = String(name || "").match(/-(\d{10})-(\d{10})(?:\s*\(\d+\))?\.csv$/i);
  return m ? [+m[1] * 1000, +m[2] * 1000 + 999] : null;
}

// Доступ к ячейкам по названию колонки.
function costsColumns(header) {
  const idx = new Map();
  header.forEach((h, i) => {
    const k = costsNormHeader(h);
    if (!idx.has(k)) idx.set(k, i);
  });
  const find = (names) => {
    for (const n of names) {
      if (idx.has(n)) return idx.get(n);
      if (n.endsWith("*")) {
        const p = n.slice(0, -1);
        for (const [k, i] of idx) if (k.startsWith(p)) return i;
      }
    }
    return -1;
  };
  return {
    has: (names) => find(names) >= 0,
    get: (row, ...names) => {
      const i = find(names);
      return i >= 0 && row[i] != null ? String(row[i]).trim() : "";
    },
  };
}

// --------------------------------------------------------------------------
// Разбор файлов. Каждый разборщик возвращает записи:
//   fill     { cat: "spot"|"futures", market, base, quote, t, side, orderType,
//              liq, price, notional: { amt, coin }, fees: [{ amt, coin }] }
//   funding  { cat: "funding", market, t, cost: { amt, coin } }
//   options / conversion / interest { cat, market, t, cost: { amt, coin } }
//   position { cat: "position", market, t, gross, fees, funding, net, liq,
//              coin } — закрытая позиция (Closed P&L, история позиций OKX)
// cost и fees: плюс — расход, минус — доход.
// --------------------------------------------------------------------------
function costsOrderType(v) {
  const s = String(v || "").toLowerCase();
  if (/market|рыноч/.test(s)) return "market";
  if (/limit|лимит/.test(s)) return "limit";
  if (/taker|тейкер/.test(s)) return "market";
  if (/maker|мейкер/.test(s)) return "limit";
  return "";
}

function costsParseBybitPerp(rows, col, add) {
  rows.forEach((r, i) => {
    const kind = col.get(r, "filled type").toLowerCase();
    const sym = costsSymbol(col.get(r, "market"));
    const qty = costsNum(col.get(r, "filled quantity"));
    const price = costsNum(col.get(r, "filled price"));
    const fee = costsNum(col.get(r, "trading fee"));
    const feeCoin = (col.get(r, "feecoin") || (sym.inverse ? sym.base : sym.quote) || "USDT").toUpperCase();
    const t = costsTime(col.get(r, "transaction time*", "trade time*", "time"));
    if (/fund/.test(kind)) {
      if (Number.isFinite(fee)) add(i, { cat: "funding", market: sym.symbol, t, cost: { amt: fee, coin: feeCoin } });
      return;
    }
    if (!Number.isFinite(qty) || !Number.isFinite(price)) return;
    add(i, {
      cat: "futures",
      market: sym.symbol,
      base: sym.base,
      quote: sym.quote,
      t,
      side: col.get(r, "direction"),
      orderType: costsOrderType(col.get(r, "order type")),
      liq: /liq|bust|adl/.test(kind),
      price,
      notional: sym.inverse ? { amt: Math.abs(qty), coin: "USD" } : { amt: Math.abs(qty) * price, coin: sym.quote || "USDT" },
      fees: Number.isFinite(fee) ? [{ amt: fee, coin: feeCoin }] : [],
    });
  });
}

function costsParseBybitSpot(rows, col, add) {
  rows.forEach((r, i) => {
    const sym = costsSymbol(col.get(r, "spot pairs"));
    const side = col.get(r, "direction").toUpperCase();
    const price = costsNum(col.get(r, "filled price"));
    const qty = costsNum(col.get(r, "filled quantity"));
    let value = costsNum(col.get(r, "filled value"));
    if (!Number.isFinite(value)) value = qty * price;
    if (!Number.isFinite(value)) return;
    let fee = costsNum(col.get(r, "execfeev2"));
    if (!Number.isFinite(fee)) fee = costsNum(col.get(r, "fees"));
    // Bybit берёт комиссию покупки в купленной монете, продажи — в валюте
    // котировки (или в третьей монете, если в колонке feeCoin указана она).
    const feeCoin = (col.get(r, "feecoin") || (side === "BUY" ? sym.base : sym.quote)).toUpperCase();
    add(i, {
      cat: "spot",
      market: sym.symbol,
      base: sym.base,
      quote: sym.quote,
      t: costsTime(col.get(r, "timestamp*", "time*")),
      side,
      orderType: costsOrderType(col.get(r, "order type")),
      liq: false,
      price,
      notional: { amt: Math.abs(value), coin: sym.quote || "USDT" },
      fees: Number.isFinite(fee) ? [{ amt: fee, coin: feeCoin }] : [],
    });
  });
}

// Closed P&L: «Realized P&L = результат по цене − комиссия открытия −
// комиссия закрытия − фандинг» (Funding Fee > 0 — заплачен). Проверено на
// реальной выгрузке: сумма комиссий совпала с историей сделок до цента.
function costsParseBybitPnl(rows, col, add) {
  rows.forEach((r, i) => {
    const sym = costsSymbol(col.get(r, "market"));
    const qty = Math.abs(costsNum(col.get(r, "order quantity", "qty", "closed qty")));
    const entry = costsNum(col.get(r, "entry price"));
    const exit = costsNum(col.get(r, "exit price"));
    const openFee = costsNum(col.get(r, "opening fee")) || 0;
    const closeFee = costsNum(col.get(r, "closing fee")) || 0;
    const funding = costsNum(col.get(r, "funding fee")) || 0;
    const net = costsNum(col.get(r, "realized p&l"));
    if (!Number.isFinite(net)) return;
    let coin = sym.inverse ? sym.base : sym.quote || "USDT";
    try {
      const info = JSON.parse(col.get(r, "cumclosedpzopenfeeinfo") || "{}");
      const keys = Object.keys(info);
      if (keys.length === 1) coin = keys[0].toUpperCase();
    } catch (e) {
      // В старых выгрузках колонки может не быть — остаётся валюта котировки.
    }
    const t = costsTime(col.get(r, "trade time*", "time*"));
    const liq = /liq|bust|adl/i.test(col.get(r, "trade type"));
    add(i, { cat: "position", market: sym.symbol, base: sym.base, quote: sym.quote, price: exit, t, gross: net + openFee + closeFee + funding, fees: openFee + closeFee, funding, net, liq, coin });
    // Ноги позиции — запасной источник комиссий и фандинга, если нет
    // истории сделок и журнала за этот период.
    if (Number.isFinite(qty) && Number.isFinite(entry) && Number.isFinite(exit)) {
      const notional = (p) => (sym.inverse ? { amt: qty, coin: "USD" } : { amt: qty * p, coin: sym.quote || "USDT" });
      add(i, { cat: "futures", market: sym.symbol, base: sym.base, quote: sym.quote, t, side: "", orderType: "", liq: false, price: entry, notional: notional(entry), fees: [{ amt: openFee, coin }] }, "open");
      add(i, { cat: "futures", market: sym.symbol, base: sym.base, quote: sym.quote, t, side: "", orderType: "", liq, price: exit, notional: notional(exit), fees: [{ amt: closeFee, coin }] }, "close");
    }
    if (funding) add(i, { cat: "funding", market: sym.symbol, t, cost: { amt: funding, coin } }, "funding");
  });
}

// Журнал транзакций единого счёта Bybit. Спотовая сделка в нём — несколько
// строк с одним TradeId (купленная монета, валюта котировки и иногда
// отдельная строка комиссии в третьей монете), сделка в деривативах — одна
// строка с Action OPEN/CLOSE. Fee Paid < 0 — комиссия списана, Funding > 0 —
// фандинг получен.
function costsParseBybitLog(rows, col, add) {
  const spot = new Map();
  rows.forEach((r, i) => {
    const type = col.get(r, "type").toUpperCase();
    const contract = col.get(r, "contract");
    const sym = costsSymbol(contract);
    const currency = col.get(r, "currency").toUpperCase();
    const action = col.get(r, "action").toUpperCase();
    const qty = costsNum(col.get(r, "quantity"));
    const price = costsNum(col.get(r, "filled price"));
    const feePaid = costsNum(col.get(r, "fee paid")) || 0;
    const t = costsTime(col.get(r, "time"));
    if (type === "SETTLEMENT") {
      const funding = costsNum(col.get(r, "funding"));
      if (Number.isFinite(funding) && funding !== 0) add(i, { cat: "funding", market: sym.symbol, t, cost: { amt: -funding, coin: currency } });
      return;
    }
    if (type === "INTEREST") {
      const cash = costsNum(col.get(r, "cash flow"));
      if (Number.isFinite(cash) && cash !== 0) add(i, { cat: "interest", market: "", t, cost: { amt: -cash, coin: currency } });
      return;
    }
    if (type === "CURRENCY_BUY" || type === "CURRENCY_SELL") {
      if (feePaid) add(i, { cat: "conversion", market: "", t, cost: { amt: -feePaid, coin: currency } });
      return;
    }
    if (type !== "TRADE" && type !== "LIQUIDATION" && type !== "DELIVERY") return;
    if (sym.option) {
      if (feePaid) add(i, { cat: "options", market: sym.symbol, t, cost: { amt: -feePaid, coin: currency } });
      return;
    }
    if (action === "OPEN" || action === "CLOSE" || type !== "TRADE") {
      if (!Number.isFinite(qty) || !Number.isFinite(price)) return;
      add(i, {
        cat: "futures",
        market: sym.symbol,
        base: sym.base,
        quote: sym.quote,
        t,
        side: col.get(r, "direction"),
        orderType: "",
        liq: type === "LIQUIDATION",
        price,
        notional: sym.inverse ? { amt: Math.abs(qty), coin: "USD" } : { amt: Math.abs(qty) * price, coin: sym.quote || "USDT" },
        fees: feePaid ? [{ amt: -feePaid, coin: currency }] : [],
      });
      return;
    }
    const id = col.get(r, "tradeid") || `${col.get(r, "orderid")}|${t}`;
    if (!spot.has(id)) spot.set(id, { rows: [], first: i });
    spot.get(id).rows.push({ currency, qty, price, feePaid, t, sym, dir: col.get(r, "direction").toUpperCase() });
  });
  spot.forEach((g) => {
    const sym = g.rows[0].sym;
    const baseRow = g.rows.find((x) => x.currency === sym.base && x.qty);
    const quoteRow = g.rows.find((x) => x.currency === sym.quote && x.qty);
    const price = (baseRow || quoteRow || g.rows[0]).price;
    let amt = quoteRow ? Math.abs(quoteRow.qty) : baseRow && Number.isFinite(price) ? Math.abs(baseRow.qty) * price : NaN;
    if (!Number.isFinite(amt)) return;
    const side = baseRow ? (baseRow.qty < 0 ? "SELL" : "BUY") : g.rows[0].dir;
    add(g.first, {
      cat: "spot",
      market: sym.symbol,
      base: sym.base,
      quote: sym.quote,
      t: g.rows[0].t,
      side,
      orderType: "",
      liq: false,
      price,
      notional: { amt, coin: sym.quote || "USDT" },
      fees: g.rows.filter((x) => x.feePaid).map((x) => ({ amt: -x.feePaid, coin: x.currency })),
    }, "spot");
  });
}

// Знак комиссии в файлах OKX и «своих» CSV заранее не известен: бывает
// «-0.5» (списано), бывает «0.5». Смотрим, каких значений в файле больше:
// ребейты мейкера редки, поэтому большинство показывает, как записан расход.
function costsFeeSign(values) {
  let pos = 0;
  let neg = 0;
  values.forEach((v) => {
    if (v > 0) pos++;
    else if (v < 0) neg++;
  });
  return neg > pos ? -1 : 1;
}

// БЕТА. История сделок OKX (Order center → Trading history → Download).
// Колонки по справке OKX: Time, Trade Type, Symbol, Action, Amount, Trading
// Unit, Filled Price, PnL, Fee, Fee Unit, Balance Change, Balance Unit…
function costsParseOkxTrades(rows, col, add, decimalComma) {
  const sign = costsFeeSign(rows.map((r) => costsNum(col.get(r, "fee"), decimalComma)));
  rows.forEach((r, i) => {
    const tradeType = col.get(r, "trade type").toLowerCase();
    const action = col.get(r, "action").toLowerCase();
    const sym = costsSymbol(col.get(r, "symbol", "instrument"));
    const t = costsTime(col.get(r, "time", "trade time", "filled time"));
    const fee = costsNum(col.get(r, "fee"), decimalComma);
    const feeCoin = (col.get(r, "fee unit", "fee currency") || sym.quote || "USDT").toUpperCase();
    if (/funding/.test(action) || /funding/.test(tradeType)) {
      let amt = costsNum(col.get(r, "balance change"), decimalComma);
      if (!Number.isFinite(amt) || amt === 0) amt = costsNum(col.get(r, "pnl"), decimalComma);
      const coin = (col.get(r, "balance unit") || feeCoin).toUpperCase();
      if (Number.isFinite(amt) && amt !== 0) add(i, { cat: "funding", market: sym.symbol, t, cost: { amt: -amt, coin } });
      return;
    }
    const cost = Number.isFinite(fee) ? fee * sign : NaN;
    if (sym.option || /option/.test(tradeType)) {
      if (Number.isFinite(cost) && cost !== 0) add(i, { cat: "options", market: sym.symbol, t, cost: { amt: cost, coin: feeCoin } });
      return;
    }
    const derivative = sym.derivative || /swap|perpetual|futures|expiry|delivery/.test(tradeType);
    const amount = Math.abs(costsNum(col.get(r, "amount", "filled amount", "size"), decimalComma));
    const price = costsNum(col.get(r, "filled price", "price"), decimalComma);
    const unit = col.get(r, "trading unit", "unit").toUpperCase();
    // Сумма сделки: в базовой монете — умножаем на цену, в валюте котировки —
    // как есть, в контрактах — неизвестна (размер контракта в файле не
    // указан), тогда считаем только комиссию.
    let notional = null;
    if (Number.isFinite(amount)) {
      if (unit && unit === sym.quote) notional = { amt: amount, coin: sym.quote };
      else if ((!unit || unit === sym.base) && Number.isFinite(price)) notional = sym.inverse ? null : { amt: amount * price, coin: sym.quote || "USDT" };
    }
    add(i, {
      cat: derivative ? "futures" : "spot",
      market: sym.symbol,
      base: sym.base,
      quote: sym.quote,
      t,
      side: /sell|short/.test(action) ? "SELL" : /buy|long/.test(action) ? "BUY" : "",
      orderType: "",
      liq: /liquidat/.test(action) || /liquidat/.test(tradeType),
      price,
      notional,
      fees: Number.isFinite(cost) ? [{ amt: cost, coin: feeCoin }] : [],
    });
  });
}

// БЕТА. История позиций OKX. По справке и API OKX: Pnl — результат по цене,
// Fee и Liquidation Clearance Fee — отрицательные при списании, Funding
// Fee < 0 — фандинг заплачен.
function costsParseOkxPositions(rows, col, add, decimalComma) {
  const sign = costsFeeSign(rows.map((r) => costsNum(col.get(r, "fee"), decimalComma)));
  rows.forEach((r, i) => {
    const sym = costsSymbol(col.get(r, "instrument name", "instrument"));
    const gross = costsNum(col.get(r, "pnl"), decimalComma);
    if (!Number.isFinite(gross)) return;
    const fee = (costsNum(col.get(r, "fee"), decimalComma) || 0) * sign;
    const liqFee = Math.abs(costsNum(col.get(r, "liquidation clearance fee", "liquidation penalty"), decimalComma) || 0);
    const funding = -(costsNum(col.get(r, "funding fee"), decimalComma) || 0);
    const coin = (col.get(r, "margin currency") || (sym.inverse ? sym.base : sym.quote) || "USDT").toUpperCase();
    const t = costsTime(col.get(r, "position update time", "position create time", "time"));
    const type = col.get(r, "type").toLowerCase();
    const liq = /liquidat/.test(type) || liqFee > 0;
    const fees = fee + liqFee;
    add(i, { cat: "position", market: sym.symbol, base: sym.base, quote: sym.quote, price: costsNum(col.get(r, "average close price"), decimalComma), t, gross, fees, funding, net: gross - fees - funding, liq, coin });
    const qty = Math.abs(costsNum(col.get(r, "total close quantity", "close quantity", "max position quantity"), decimalComma));
    const open = costsNum(col.get(r, "average open price"), decimalComma);
    const close = costsNum(col.get(r, "average close price"), decimalComma);
    const face = costsNum(col.get(r, "contract face value"), decimalComma) || 1;
    const mult = costsNum(col.get(r, "contract multiplier"), decimalComma) || 1;
    if (Number.isFinite(qty) && Number.isFinite(open) && Number.isFinite(close)) {
      const size = qty * face * mult;
      const notional = sym.inverse ? size * 2 : size * (open + close);
      add(i, { cat: "futures", market: sym.symbol, base: sym.base, quote: sym.quote, t, side: "", orderType: "", liq, price: close, notional: { amt: notional, coin: sym.inverse ? "USD" : sym.quote || "USDT" }, fees: [{ amt: fees, coin }] }, "legs");
    }
    if (funding) add(i, { cat: "funding", market: sym.symbol, t, cost: { amt: funding, coin } }, "funding");
  });
}

// Свой CSV: колонки указывает человек. map: { time, market, value, price,
// qty, fee, feeCoin, orderType } — номера колонок (-1 — нет), seg — "spot"
// или "futures".
function costsParseCustom(rows, map, seg, add, decimalComma) {
  const cell = (r, k) => (map[k] >= 0 && r[map[k]] != null ? String(r[map[k]]).trim() : "");
  const sign = costsFeeSign(rows.map((r) => costsNum(cell(r, "fee"), decimalComma)));
  rows.forEach((r, i) => {
    const fee = costsNum(cell(r, "fee"), decimalComma);
    if (!Number.isFinite(fee)) return;
    const sym = costsSymbol(cell(r, "market"));
    const quote = sym.quote || "USD";
    let value = Math.abs(costsNum(cell(r, "value"), decimalComma));
    const price = costsNum(cell(r, "price"), decimalComma);
    if (!Number.isFinite(value)) value = Math.abs(costsNum(cell(r, "qty"), decimalComma) * price);
    add(i, {
      cat: seg,
      market: sym.symbol,
      base: sym.base,
      quote,
      t: costsTime(cell(r, "time")),
      side: "",
      orderType: costsOrderType(cell(r, "orderType")),
      liq: false,
      price,
      notional: Number.isFinite(value) ? { amt: value, coin: quote } : null,
      fees: [{ amt: fee * sign, coin: (cell(r, "feeCoin") || quote).toUpperCase() }],
    });
  });
}

const COSTS_PARSERS = {
  "bybit-perp": costsParseBybitPerp,
  "bybit-spot": costsParseBybitSpot,
  "bybit-pnl": costsParseBybitPnl,
  "bybit-log": costsParseBybitLog,
  "okx-trades": costsParseOkxTrades,
  "okx-positions": costsParseOkxPositions,
};

// Разбор одного файла. name — имя файла, text — содержимое.
// Возвращает { id, name, type, exchange, beta, ok, rows, records, range,
// header, sample, delim } или { ok: false, reason } — формат не распознан
// (тогда интерфейс предлагает указать колонки вручную).
let costsFileSeq = 0;

function costsReadFile(name, text) {
  costsFileSeq += 1;
  const file = { id: costsFileSeq, name: String(name || "file.csv"), ok: false, records: [], rows: 0, dupes: 0, shadowed: 0 };
  if (/^PK/.test(text)) return Object.assign(file, { reason: "xlsx" });
  const { rows, delim } = costsParseCsv(text);
  if (!rows.length) return Object.assign(file, { reason: "empty" });
  const head = costsFindHeader(rows);
  const header = rows[head.index];
  const body = rows.slice(head.index + 1).filter((r) => r.some((c) => String(c).trim()));
  Object.assign(file, { header, body, delim, decimalComma: delim !== ",", sample: body.slice(0, 3) });
  if (!head.type) return Object.assign(file, { reason: "unknown" });
  const meta = COSTS_TYPES[head.type];
  Object.assign(file, { type: head.type, exchange: meta.exchange, exKey: meta.exchange, beta: !!meta.beta, covers: meta.covers });
  COSTS_PARSERS[head.type](body, costsColumns(header), costsAdder(file), file.decimalComma);
  return costsFinishFile(file);
}

// Применить ручное сопоставление колонок к нераспознанному файлу.
function costsApplyMapping(file, map, seg, exchange) {
  const name = String(exchange || "").trim();
  Object.assign(file, {
    type: "custom",
    exchange: name || file.name,
    exKey: `custom:${file.id}`,
    beta: false,
    custom: true,
    covers: [seg],
    records: [],
    map,
    seg,
  });
  costsParseCustom(file.body, map, seg, costsAdder(file), file.decimalComma);
  costsFinishFile(file);
  if (!file.ok) file.reason = "nomatch";
  return file;
}

function costsAdder(file) {
  return (rowIndex, rec, part) => {
    rec.file = file;
    rec.row = rowIndex;
    rec.key = `${file.type}|${file.body[rowIndex].join("\u0001")}|${part || ""}`;
    file.records.push(rec);
  };
}

function costsFinishFile(file) {
  file.rows = file.body.length;
  let lo = Infinity;
  let hi = -Infinity;
  file.records.forEach((r) => {
    if (!Number.isFinite(r.t)) return;
    if (r.t < lo) lo = r.t;
    if (r.t > hi) hi = r.t;
  });
  file.dataRange = lo <= hi ? [lo, hi] : null;
  file.range = costsRangeFromName(file.name) || file.dataRange || [-Infinity, Infinity];
  file.ok = file.records.length > 0;
  file.reason = file.ok ? "" : "norecords";
  return file;
}

// Файл, который не удалось прочитать (слишком большой, ошибка чтения).
function costsFailedFile(name, reason) {
  costsFileSeq += 1;
  return { id: costsFileSeq, name: String(name || "file"), ok: false, reason, records: [], rows: 0, dupes: 0, shadowed: 0 };
}

// --------------------------------------------------------------------------
// Расчёт по всем загруженным файлам.
// --------------------------------------------------------------------------
function costsMedian(list) {
  if (!list.length) return NaN;
  const s = list.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function costsPriceBook(records) {
  const book = new Map();
  records.forEach((r) => {
    if (!r.base || !(r.price > 0) || !Number.isFinite(r.t) || !COSTS_USD_LIKE.has(r.quote)) return;
    if (!book.has(r.base)) book.set(r.base, []);
    book.get(r.base).push([r.t, r.price]);
  });
  book.forEach((list) => list.sort((a, b) => a[0] - b[0]));
  return (coin, t) => {
    const c = String(coin || "").toUpperCase();
    if (COSTS_USD_LIKE.has(c)) return 1;
    const list = book.get(c);
    if (!list) return null;
    if (!Number.isFinite(t)) return costsMedian(list.map((p) => p[1]));
    let lo = 0;
    let hi = list.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (list[mid][0] < t) lo = mid + 1;
      else hi = mid;
    }
    const a = list[Math.max(0, lo - 1)];
    const b = list[lo];
    return Math.abs(a[0] - t) <= Math.abs(b[0] - t) ? a[1] : b[1];
  };
}

function costsEmptySeg() {
  const part = () => ({ fills: 0, notional: 0, fees: 0 });
  return { fills: 0, notional: 0, fees: 0, feesKnown: 0, noNotional: 0, limitAsTaker: 0, maker: part(), taker: part(), liq: part(), market: part(), exchanges: new Set() };
}

function costsAnalyze(files) {
  const live = files.filter((f) => f.ok);
  const result = {
    files: live.length,
    exchanges: [],
    beta: live.some((f) => f.beta),
    period: null,
    seg: { spot: costsEmptySeg(), futures: costsEmptySeg() },
    funding: { paid: 0, received: 0, net: 0, count: 0 },
    extra: { options: { cost: 0, count: 0 }, conversion: { cost: 0, count: 0 }, interest: { cost: 0, count: 0 } },
    markets: [],
    positions: null,
    unpriced: new Map(),
    observed: [],
    hints: [],
    total: 0,
    tradingFees: 0,
  };

  // 1. Одинаковые строки из разных файлов (тот же файл загрузили дважды,
  // периоды выгрузок пересекаются) считаем один раз.
  const seen = new Map();
  const records = [];
  live.forEach((f) => {
    f.dupes = 0;
    f.shadowed = 0;
    const local = new Map();
    const dupRows = new Set();
    f.records.forEach((r) => {
      const n = (local.get(r.key) || 0) + 1;
      local.set(r.key, n);
      const k = `${r.key}#${n}`;
      const owner = seen.get(k);
      if (owner !== undefined && owner !== f.id) {
        dupRows.add(r.row);
        return;
      }
      seen.set(k, f.id);
      records.push(r);
    });
    f.dupes = dupRows.size;
  });

  const priceAt = costsPriceBook(records);
  const toUsd = (amt, coin, t) => {
    if (!amt) return 0;
    const p = priceAt(coin, t);
    if (p == null) {
      const c = String(coin || "?").toUpperCase();
      result.unpriced.set(c, (result.unpriced.get(c) || 0) + 1);
      return null;
    }
    return amt * p;
  };

  // 2. Для каждой биржи и категории — самый точный источник, менее точные —
  // только вне его периода.
  const accepted = [];
  const exKeys = [...new Set(live.map((f) => f.exKey))];
  exKeys.forEach((ex) => {
    COSTS_CATEGORIES.forEach((cat) => {
      const covered = [];
      COSTS_PRIORITY[cat].forEach((type) => {
        const fs = live.filter((f) => f.exKey === ex && f.type === type && f.covers.includes(cat));
        if (!fs.length) return;
        records.forEach((r) => {
          if (r.cat !== cat || r.file.exKey !== ex || r.file.type !== type) return;
          if (covered.length && (!Number.isFinite(r.t) || covered.some(([a, b]) => r.t >= a && r.t <= b))) {
            r.file.shadowed += 1;
            return;
          }
          accepted.push(r);
        });
        fs.forEach((f) => covered.push(f.range));
      });
    });
  });

  // 3. Сделки: сумма и комиссия в долларах, мейкер или тейкер.
  const markets = new Map();
  const market = (seg, name, exchange) => {
    const k = `${seg}|${exchange}|${name}`;
    if (!markets.has(k)) markets.set(k, { seg, market: name || "—", exchange, fills: 0, notional: 0, fees: 0, funding: 0 });
    return markets.get(k);
  };
  const fills = accepted.filter((r) => r.cat === "spot" || r.cat === "futures");
  fills.forEach((r) => {
    r.notionalUsd = r.notional ? toUsd(r.notional.amt, r.notional.coin, r.t) : null;
    let fee = 0;
    let feeKnown = true;
    r.fees.forEach((x) => {
      const v = toUsd(x.amt, x.coin, r.t);
      if (v == null) feeKnown = false;
      else fee += v;
    });
    r.feeUsd = fee;
    r.feeKnown = feeKnown;
    r.rate = r.notionalUsd > 0 && feeKnown ? fee / r.notionalUsd : null;
  });
  const groups = new Map();
  fills.forEach((r) => {
    const k = `${r.file.id}|${r.cat}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  });
  groups.forEach((list) => {
    const withRate = list.filter((r) => r.rate != null && !r.liq);
    let ref = costsMedian(withRate.filter((r) => r.orderType === "market").map((r) => r.rate));
    if (!Number.isFinite(ref)) ref = costsMedian(withRate.map((r) => r.rate));
    list.forEach((r) => {
      if (r.liq || r.orderType === "market") r.role = "taker";
      else if (r.rate == null || !Number.isFinite(ref)) r.role = r.orderType === "limit" ? "maker" : "taker";
      else r.role = r.rate < ref * COSTS_MAKER_SHARE ? "maker" : "taker";
      // Лимитная сделка по той же ставке, что и рыночные: по файлу не понять,
      // стояла ли она в стакане (у Bybit на споте мейкер и тейкер платят
      // одинаково). Считаем тейкером и говорим об этом в интерфейсе.
      r.limitAsTaker = r.orderType === "limit" && r.role === "taker";
    });
  });
  const observed = new Map();
  fills.forEach((r) => {
    const s = result.seg[r.cat];
    s.fills += 1;
    s.fees += r.feeUsd;
    s.exchanges.add(r.file.exchange);
    const m = market(r.cat, r.market, r.file.exchange);
    m.fills += 1;
    m.fees += r.feeUsd;
    if (r.notionalUsd == null) {
      s.noNotional += 1;
      return;
    }
    // Комиссия (частично) в монете без цены: она уже в списке unpriced, а
    // в оборот и ставки такую сделку не берём, чтобы не занизить ставку.
    if (!r.feeKnown) return;
    s.notional += r.notionalUsd;
    s.feesKnown += r.feeUsd;
    m.notional += r.notionalUsd;
    const role = s[r.role];
    role.fills += 1;
    role.notional += r.notionalUsd;
    role.fees += r.feeUsd;
    if (r.limitAsTaker) s.limitAsTaker += 1;
    if (r.liq) {
      s.liq.fills += 1;
      s.liq.notional += r.notionalUsd;
      s.liq.fees += r.feeUsd;
    }
    if (r.orderType === "market") {
      s.market.fills += 1;
      s.market.notional += r.notionalUsd;
      s.market.fees += r.feeUsd;
    }
    if (!r.liq) {
      const k = `${r.file.exchange}|${r.cat}|${r.role}`;
      if (!observed.has(k)) observed.set(k, { exchange: r.file.exchange, seg: r.cat, role: r.role, notional: 0, fees: 0, fills: 0 });
      const o = observed.get(k);
      o.notional += r.notionalUsd;
      o.fees += r.feeUsd;
      o.fills += 1;
    }
  });
  result.observed = [...observed.values()].filter((o) => o.notional > 0).map((o) => Object.assign(o, { rate: o.fees / o.notional }));

  // 4. Фандинг и прочие издержки.
  accepted.forEach((r) => {
    if (r.cat === "funding") {
      const v = toUsd(r.cost.amt, r.cost.coin, r.t);
      if (v == null) return;
      result.funding.count += 1;
      result.funding.net += v;
      if (v > 0) result.funding.paid += v;
      else result.funding.received -= v;
      market("futures", r.market, r.file.exchange).funding += v;
    } else if (result.extra[r.cat]) {
      const v = toUsd(r.cost.amt, r.cost.coin, r.t);
      if (v == null) return;
      result.extra[r.cat].cost += v;
      result.extra[r.cat].count += 1;
    }
  });

  // 5. Закрытые позиции (Closed P&L, история позиций OKX).
  const positions = records.filter((r) => r.cat === "position");
  if (positions.length) {
    const p = { count: 0, liq: 0, gross: 0, fees: 0, funding: 0, net: 0, winGross: 0, winNet: 0, flipped: 0, winSum: 0, lossSum: 0, wins: 0, losses: 0, exchanges: new Set() };
    positions.forEach((r) => {
      const k = priceAt(r.coin, r.t);
      if (k == null) {
        result.unpriced.set(r.coin, (result.unpriced.get(r.coin) || 0) + 1);
        return;
      }
      const gross = r.gross * k;
      const net = r.net * k;
      p.count += 1;
      p.exchanges.add(r.file.exchange);
      if (r.liq) p.liq += 1;
      p.gross += gross;
      p.fees += r.fees * k;
      p.funding += r.funding * k;
      p.net += net;
      if (gross > 0) p.winGross += 1;
      if (net > 0) {
        p.winNet += 1;
        p.wins += 1;
        p.winSum += net;
      } else {
        p.losses += 1;
        p.lossSum -= net;
      }
      if (gross > 0 && net <= 0) p.flipped += 1;
    });
    if (p.count) {
      p.avgWin = p.wins ? p.winSum / p.wins : 0;
      p.avgLoss = p.losses ? p.lossSum / p.losses : 0;
      p.breakEven = p.avgWin > 0 && p.avgLoss > 0 ? p.avgLoss / (p.avgWin + p.avgLoss) : null;
      p.avgCost = (p.fees + p.funding) / p.count;
      p.exchanges = [...p.exchanges];
      result.positions = p;
    }
  }

  // 6. Итоги, период, подсказки.
  ["spot", "futures"].forEach((seg) => {
    result.seg[seg].exchanges = [...result.seg[seg].exchanges];
  });
  result.tradingFees = result.seg.spot.fees + result.seg.futures.fees;
  result.total = result.tradingFees + result.funding.net + result.extra.options.cost + result.extra.conversion.cost + result.extra.interest.cost;
  result.markets = [...markets.values()].filter((m) => m.fills || m.funding).sort((a, b) => b.fees + b.funding - (a.fees + a.funding));
  let lo = Infinity;
  let hi = -Infinity;
  accepted.concat(positions).forEach((r) => {
    if (!Number.isFinite(r.t)) return;
    if (r.t < lo) lo = r.t;
    if (r.t > hi) hi = r.t;
  });
  result.period = lo <= hi ? [lo, hi] : null;
  result.exchanges = [...new Set(live.map((f) => f.exchange))];
  result.unpriced = [...result.unpriced.entries()].map(([coin, count]) => ({ coin, count }));

  const bybit = live.filter((f) => f.exchange === "Bybit");
  const hasType = (t) => bybit.some((f) => f.type === t);
  if (bybit.length) {
    if (!hasType("bybit-pnl") && (hasType("bybit-perp") || hasType("bybit-log"))) result.hints.push("bybitPnl");
    if (!hasType("bybit-log")) result.hints.push("bybitLog");
    if (!hasType("bybit-perp") && !hasType("bybit-log")) result.hints.push("bybitPerp");
  }
  result.accepted = accepted.length;
  return result;
}

// Сколько стоили бы те же сделки при других ставках (в процентах). Лимитные
// сделки, которые прошли по ставке мейкера, считаем по ставке мейкера,
// остальные и ликвидации — по ставке тейкера. Фандинг не сравниваем: у
// каждой биржи свои ставки финансирования.
function costsCompare(result, table) {
  const actual = result.seg.spot.feesKnown + result.seg.futures.feesKnown;
  return table.map((ex) => {
    const parts = {};
    let total = 0;
    ["spot", "futures"].forEach((seg) => {
      const s = result.seg[seg];
      const rates = ex[seg];
      const v = s.maker.notional * (rates.maker / 100) + s.taker.notional * (rates.taker / 100);
      parts[seg] = v;
      total += v;
    });
    return Object.assign({}, ex, { parts, total, diff: total - actual });
  });
}
