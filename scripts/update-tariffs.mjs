// Ночное обновление assets/data/tariffs.json: открывает официальные страницы
// тарифов Whitebird и Cifra Markets в headless-браузере, разбирает видимый
// текст (см. tariffs-parse.mjs) и переписывает файл. Запускается GitHub Actions
// (.github/workflows/update-tariffs.yml) каждый день в 01:00 МСК.
//
// Принцип: если страница изменилась так, что данные не читаются или выглядят
// подозрительно, скрипт падает с ошибкой и НЕ трогает файл — на сайте остаются
// прежние проверенные цифры, а GitHub присылает письмо о падении задачи.
import { chromium } from "playwright";
import { readFile, writeFile } from "node:fs/promises";
import { parseInstant, parseAccount, parseCifraPair, conversionIsFree } from "./tariffs-parse.mjs";

const FILE = new URL("../assets/data/tariffs.json", import.meta.url);
const MAX_PERCENT = 15;
const MAX_JUMP = 5; // п.п. — больший скачок считаем сбоем разбора, а не новым тарифом

function fail(message) {
  console.error(`::error::${message}`);
  process.exit(1);
}

async function openPage(browser, url) {
  const page = await browser.newPage({ locale: "ru-RU" });
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  return page;
}

async function tabText(page, label) {
  await page.getByText(label, { exact: true }).first().click();
  await page.waitForTimeout(1500);
  return page.locator("body").innerText();
}

function checkRange(v, where) {
  if (!v) return;
  if (!(v.min >= 0 && v.max <= MAX_PERCENT && v.min <= v.max)) fail(`${where}: значение вне допустимого диапазона (${JSON.stringify(v)})`);
}

function compareWithOld(oldRows, newRows, keys, where) {
  for (const row of newRows) {
    const old = oldRows.find((r) => r.method === row.method);
    if (!old) continue;
    for (const k of keys) {
      if (old[k] && row[k] && Math.abs(old[k].max - row[k].max) > MAX_JUMP) {
        fail(`${where} · ${row.method} · ${k}: скачок ${old[k].max}% → ${row[k].max}% — похоже на сбой разбора`);
      }
    }
  }
}

const old = JSON.parse(await readFile(FILE, "utf8"));
const browser = await chromium.launch();
try {
  // --- Whitebird ---
  const wb = await openPage(browser, "https://whitebird.io/commission");
  const instantText = await tabText(wb, "Мгновенный обмен");
  const accountText = await tabText(wb, "Ввод и вывод");
  const convertText = await tabText(wb, "Конвертация");

  const instant = parseInstant(instantText).filter((r) => r.currency);
  const account = parseAccount(accountText).filter((r) => r.currency);
  if (!conversionIsFree(convertText)) fail("Whitebird: на вкладке «Конвертация» больше нет фразы о бесплатной конвертации — проверьте модель вручную");

  const sbp = account.find((r) => r.method === "СБП (РФ)");
  const sber = instant.find((r) => r.method === "SberPay (РФ)");
  if (!sbp || !sbp.deposit || !sbp.withdraw) fail("Whitebird: не найден «СБП (РФ)» на вкладке «Ввод и вывод»");
  if (!sber || !sber.buy) fail("Whitebird: не найден «SberPay (РФ)» на вкладке «Мгновенный обмен»");
  if (instant.filter((r) => r.currency === "RUB").length < 3 || account.filter((r) => r.currency === "RUB").length < 4) fail("Whitebird: рублёвых способов оплаты подозрительно мало");

  for (const r of instant) { checkRange(r.buy, `instant ${r.method} buy`); checkRange(r.sell, `instant ${r.method} sell`); }
  for (const r of account) { checkRange(r.deposit, `account ${r.method} deposit`); checkRange(r.withdraw, `account ${r.method} withdraw`); }
  compareWithOld(old.providers.whitebird.instant, instant, ["buy", "sell"], "instant");
  compareWithOld(old.providers.whitebird.account, account, ["deposit", "withdraw"], "account");

  // --- Cifra Markets ---
  const cf = await openPage(browser, "https://cifra.by/rates");
  const cifraText = await cf.locator("body").innerText();
  const pair = parseCifraPair(cifraText);
  if (pair == null || !(pair >= 0.1 && pair <= 10)) fail(`Cifra: не удалось прочитать комиссию за пару USDT/RUB (получено ${pair})`);
  if (Math.abs(pair - old.providers.cifra.pairPercent) > MAX_JUMP) fail(`Cifra: скачок ${old.providers.cifra.pairPercent}% → ${pair}%`);

  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Moscow" });
  const next = {
    updatedAt: today,
    providers: {
      whitebird: { ...old.providers.whitebird, convertFeePercent: 0, instant, account },
      cifra: { ...old.providers.cifra, pairPercent: pair },
    },
  };
  await writeFile(FILE, JSON.stringify(next, null, 2) + "\n");
  console.log(`tariffs.json обновлён: ${today}, Whitebird ${instant.length}+${account.length} способов, Cifra ${pair}%`);
} finally {
  await browser.close();
}
