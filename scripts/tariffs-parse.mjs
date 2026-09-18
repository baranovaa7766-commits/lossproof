// Разбор видимого текста страниц тарифов Whitebird и Cifra в структуру для
// assets/data/tariffs.json. Чистые функции без браузера и сети — чтобы их
// можно было проверять на копии текста страницы.

const COLUMN_HEADERS = new Set(["Комиссия на ввод", "Комиссия на вывод", "Клиент покупает", "Клиент продает"]);
const SECTION_HEADERS = new Set(["Рекомендуем", "Банковские карты", "Другие способы оплаты", "Расчётный счет", "Криптовалюта"]);

const VALUE_RE = /^(недоступно|Комиссия сети|\d+(?:[.,]\d+)?(?:\s*-\s*\d+(?:[.,]\d+)?)?\s*%)$/;

// Валюта способа оплаты — по названию. Способы, где валюта неочевидна
// («Мой QR», расчётный счёт юрлица), не берём: лучше пропустить, чем ошибиться.
export function currencyOf(method) {
  if (/\(РФ\)|Российской Федерации/.test(method)) return "RUB";
  if (/Беларус|Crypto Статус|Crypto Альфа/.test(method)) return "BYN";
  return null;
}

function toNumber(s) {
  return Number(s.replace(",", "."));
}

// «2,5 %» → {min:2.5,max:2.5}; «3,5-4,9 %» → {min:3.5,max:4.9}; «недоступно» → null.
export function parseValue(raw) {
  const s = raw.trim();
  if (!VALUE_RE.test(s) || s === "недоступно" || s === "Комиссия сети") return null;
  const nums = s.replace("%", "").split("-").map((x) => toNumber(x.trim()));
  return { min: Math.min(...nums), max: Math.max(...nums) };
}

// Таблица «название способа → два значения». Подписи колонок («Клиент покупает»,
// «Комиссия на ввод») страница показывает то один раз в шапке раздела, то рядом
// с каждым значением — их просто пропускаем, значения берём по порядку.
function parseTable(text, keyA, keyB) {
  const rows = [];
  let name = null;
  let values = [];
  for (const raw of text.split("\n")) {
    const l = raw.trim();
    if (!l || l === "New") continue;
    if (COLUMN_HEADERS.has(l)) {
      values = [];
      continue;
    }
    if (SECTION_HEADERS.has(l)) {
      name = l === "Расчётный счет" ? l : null;
      values = [];
      continue;
    }
    if (VALUE_RE.test(l)) {
      values.push(l);
      if (values.length === 2 && name) {
        rows.push({ method: name, currency: currencyOf(name), [keyA]: parseValue(values[0]), [keyB]: parseValue(values[1]) });
        name = null;
        values = [];
      }
      continue;
    }
    name = l;
    values = [];
  }
  return rows;
}

// Вкладка «Мгновенный обмен»: клиент покупает / клиент продаёт.
export function parseInstant(text) {
  return parseTable(text, "buy", "sell");
}

// Вкладка «Ввод и вывод»: комиссия на ввод / на вывод.
export function parseAccount(text) {
  return parseTable(text, "deposit", "withdraw");
}

// Cifra: «1,50%» перед подписью «Крипто-фиатные пары (USDT/RUB)» на тарифе «Консультационный».
export function parseCifraPair(text) {
  const m = text.match(/(\d+(?:[.,]\d+)?)\s*%\s*Крипто-фиатные пары/);
  return m ? toNumber(m[1]) : null;
}

export function conversionIsFree(text) {
  return /без взимания комиссии/.test(text);
}
