// Еженедельная проверка компаний, представленных на сайте (см.
// .github/workflows/compliance-check.yml). ТОЛЬКО ИНФОРМИРУЕТ: сайт сам не
// меняется, вывод делает человек — совпадение имён без проверки может быть
// тёзкой или клоном, и публично обвинять компанию по автоматике нельзя.
//
// Проверки:
//   1. OFAC (SDN + псевдонимы): название или домен компании в санкционном списке США;
//   2. Банк России: список компаний с признаками нелегальной деятельности
//      (в том числе «финансовые пирамиды», нелегальные участники рынка);
//   3. доступность сайта и смена домена/владельца по RDAP (регистратор, DNS-серверы,
//      срок регистрации, статусы вида «hold»/«pendingDelete»).
// Список «нежелательных организаций» Минюста РФ закрыт для автоматических
// запросов — в отчёте он указан ссылкой для ручной проверки.
import { readFile, writeFile, mkdir, appendFile } from "node:fs/promises";

const ENTITIES = JSON.parse(await readFile(new URL("./compliance-entities.json", import.meta.url), "utf8")).entities;
const BASELINE_FILE = new URL("./data/compliance-baseline.json", import.meta.url);
const UA = "Mozilla/5.0 (compatible; LossProofBot/1.0; +https://lossproof.vercel.app)";

const findings = []; // {level: "alert"|"review", check, entity, text}
const notes = []; // информационные строки отчёта
const stats = {};
let state = {}; // хранится между запусками: снимки доменов, счётчики недоступности, уже сообщённые находки

const alert = (check, entity, text) => findings.push({ level: "alert", check, entity, text });
const review = (check, entity, text) => findings.push({ level: "review", check, entity, text });

// ---------- сопоставление ----------
const norm = (s) => ` ${String(s || "").toLowerCase().replace(/ё/g, "е").replace(/[^a-z0-9а-я]+/g, " ").trim()} `;
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function nameHit(text, entity) {
  const t = norm(text);
  return entity.names.find((a) => t.includes(norm(a)));
}

function domainHit(text, entity) {
  const t = String(text || "").toLowerCase();
  // После домена не должно идти продолжение вида «.evil.net» или «-x»: иначе
  // bybit.com.evil.net сошёл бы за bybit.com.
  return entity.domains.find((d) => new RegExp(`(^|[^a-z0-9-])${escapeRe(d)}(?![a-z0-9-])(?!\\.[a-z0-9])`).test(t));
}

function hostBelongs(host, domain) {
  return host === domain || host.endsWith("." + domain);
}

async function fetchText(url, { retries = 2, timeoutMs = 90000 } = {}) {
  let last;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow", signal: AbortSignal.timeout(timeoutMs) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw last;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// ---------- 1. OFAC ----------
async function checkOfac() {
  const base = "https://www.treasury.gov/ofac/downloads";
  let sdn, alt;
  try {
    [sdn, alt] = await Promise.all([fetchText(`${base}/sdn.csv`), fetchText(`${base}/alt.csv`)]);
  } catch (e) {
    alert("OFAC", "—", `Не удалось загрузить санкционный список OFAC (${e.message}). Проверьте вручную: https://sanctionssearch.ofac.treas.gov/`);
    stats.ofac = "не загружен";
    return;
  }
  const sdnRows = parseCsv(sdn);
  const altRows = parseCsv(alt);
  const byEnt = new Map(sdnRows.map((r) => [r[0], r]));
  for (const e of ENTITIES) {
    for (const r of sdnRows) {
      const hitName = nameHit(r[1], e);
      const hitDomain = domainHit(r[11], e);
      if (hitName || hitDomain) {
        alert("OFAC", e.name, `SDN #${r[0]} «${r[1]}» (${r[3]}) — совпадение по ${hitDomain ? `домену ${hitDomain}` : `названию «${hitName}»`}`);
      }
    }
    for (const r of altRows) {
      const hit = nameHit(r[3], e);
      if (hit) {
        const main = byEnt.get(r[0]);
        alert("OFAC", e.name, `псевдоним SDN #${r[0]} «${r[3]}»${main ? ` (основное имя «${main[1]}»)` : ""} — совпадение по названию «${hit}»`);
      }
    }
  }
  stats.ofac = `${sdnRows.length} записей SDN, ${altRows.length} псевдонимов`;
}

// ---------- 2. Банк России ----------
async function checkCbr() {
  let data;
  try {
    data = JSON.parse(await fetchText("https://www.cbr.ru/inside/warning-list/black-list-json", { timeoutMs: 120000 }));
  } catch (e) {
    alert("Банк России", "—", `Не удалось загрузить список ЦБ о нелегальной деятельности (${e.message}). Проверьте вручную: https://www.cbr.ru/inside/warning-list/`);
    stats.cbr = "не загружен";
    return;
  }
  const records = data.RC || [];
  for (const e of ENTITIES) {
    for (const r of records) {
      const sites = String(r.Site || "").toLowerCase().split(/[\s,;]+/).map((s) => s.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/[/?#].*$/, "")).filter(Boolean);
      const domainMatch = sites.find((h) => e.domains.some((d) => hostBelongs(h, d)));
      const nameMatch = nameHit(r.Name, e);
      if (domainMatch) {
        alert("Банк России", e.name, `в списке ЦБ: «${r.Name}», сайт ${r.Site}, признак: ${r.Sign}${r.Closed ? " (помечено как закрытое)" : ""}, дата ${r.DT}`);
      } else if (nameMatch) {
        review("Банк России", e.name, `в списке ЦБ есть запись со схожим названием «${nameMatch}»: «${r.Name}»${r.Site ? `, сайт ${r.Site}` : ""}, признак: ${r.Sign} — возможен клон или тёзка, проверьте`);
      }
    }
  }
  stats.cbr = `${records.length} записей`;
}

// ---------- 3. Доступность и домен ----------
const registrable = (host) => host.split(".").slice(-2).join(".");

async function checkAvailability() {
  // Разовый таймаут с американского сервера GitHub — чаще геоблок или сбой сети,
  // а не проблема компании: тревога только если сайт не открывается две недели подряд.
  state._availability = state._availability || {};
  let ok = 0;
  for (const e of ENTITIES) {
    let res;
    let err;
    for (let i = 0; i < 2 && !res; i++) {
      try {
        res = await fetch(e.url, { headers: { "User-Agent": UA }, redirect: "follow", signal: AbortSignal.timeout(25000) });
      } catch (x) {
        err = x;
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    let problem = null;
    if (!res) {
      problem = `сайт ${e.url} не открылся (${err && err.message})`;
    } else {
      const finalHost = new URL(res.url).hostname.toLowerCase();
      if (!e.domains.some((d) => hostBelongs(finalHost, d) || registrable(finalHost) === registrable(d))) {
        alert("Доступность", e.name, `${e.url} перенаправляет на другой домен: ${res.url}`);
        continue;
      }
      if (res.status >= 500) problem = `${e.url} отвечает ошибкой сервера ${res.status}`;
      // 403/429 часто значит защиту от ботов, а не проблему компании — не считаем сбоем.
    }
    if (problem) {
      const streak = (state._availability[e.id] || 0) + 1;
      state._availability[e.id] = streak;
      if (streak >= 2) alert("Доступность", e.name, `${problem} — уже ${streak} проверки подряд`);
      else notes.push(`${e.name}: ${problem} (первый раз, в отчёт не попадает, пока не повторится)`);
    } else {
      state._availability[e.id] = 0;
      ok++;
    }
  }
  stats.availability = `${ok} из ${ENTITIES.length} открылись без замечаний`;
}

async function rdapSnapshot(domain) {
  const res = await fetch(`https://rdap.org/domain/${domain}`, { headers: { "User-Agent": UA, Accept: "application/rdap+json" }, redirect: "follow", signal: AbortSignal.timeout(25000) });
  if (!res.ok) return null;
  const j = await res.json();
  const expires = (j.events || []).find((x) => x.eventAction === "expiration");
  const registrarEntity = (j.entities || []).find((x) => (x.roles || []).includes("registrar"));
  const fn = registrarEntity && registrarEntity.vcardArray && (registrarEntity.vcardArray[1] || []).find((p) => p[0] === "fn");
  return {
    registrar: fn ? fn[3] : null,
    nameservers: (j.nameservers || []).map((n) => String(n.ldhName || "").toLowerCase()).sort(),
    expires: expires ? expires.eventDate : null,
    status: (j.status || []).slice().sort(),
  };
}

async function checkDomains() {
  const hadBaseline = Object.keys(state).some((k) => !k.startsWith("_"));
  let checked = 0;
  for (const e of ENTITIES) {
    for (const d of e.domains) {
      let snap = null;
      try {
        snap = await rdapSnapshot(d);
      } catch { /* RDAP есть не у всех зон (например, .by) — это не сбой */ }
      if (!snap) { notes.push(`RDAP недоступен для ${d} — регистрационные данные не отслеживаются`); continue; }
      checked++;
      const old = state[d];
      state[d] = snap;
      if (old) {
        if (JSON.stringify(old.nameservers) !== JSON.stringify(snap.nameservers)) alert("Домен", e.name, `${d}: изменились DNS-серверы (${(old.nameservers || []).join(", ") || "—"} → ${snap.nameservers.join(", ") || "—"})`);
        if ((old.registrar || null) !== (snap.registrar || null)) alert("Домен", e.name, `${d}: сменился регистратор (${old.registrar || "—"} → ${snap.registrar || "—"})`);
      }
      const bad = snap.status.filter((s) => /hold|pendingdelete|redemption|inactive/i.test(s.replace(/\s+/g, "")));
      if (bad.length) alert("Домен", e.name, `${d}: тревожные статусы регистрации: ${bad.join(", ")}`);
      if (snap.expires) {
        const days = Math.round((new Date(snap.expires) - Date.now()) / 86400000);
        if (days < 30) alert("Домен", e.name, `${d}: регистрация истекает через ${days} дн. (${snap.expires.slice(0, 10)})`);
      }
    }
  }
  stats.domains = `${checked} доменов проверено по RDAP${hadBaseline ? "" : " (первый запуск: сохранена базовая линия)"}`;
}

// ---------- 4. Официальные заявления регуляторов ----------
// Только первичные источники (см. compliance-feeds.json) и только подтверждённое:
// показываем сам текст заявления, ведомство, дату и ссылку. Вывод «нарушила ли
// компания наш критерий» делает человек — заявление может касаться компании как
// пострадавшей стороны, а не нарушителя.
const ENFORCEMENT_WORDS = /(charg|fraud|complaint|warn|unauthori[sz]ed|sanction|penalt|\bfine[ds]?\b|cease|suspend|\bbann?ed?\b|shut down|illegal|indict|convict|sentenc|ponzi|scheme|lawsuit|settle|мошенн|нелегальн|предупрежд|запрет|отзыв|санкци|штраф|пирамид|блокиров)/i;
const WINDOW_DAYS = 10;

function decodeXml(s) {
  return String(s)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim();
}

function parseRss(xml) {
  const items = [];
  for (const m of xml.matchAll(/<item\b[\s\S]*?<\/item>/g)) {
    const block = m[0];
    const get = (tag) => {
      const r = block.match(new RegExp("<" + tag + "(?: [^>]*)?>([^]*?)</" + tag + ">"));
      return r ? decodeXml(r[1]) : "";
    };
    items.push({ title: get("title"), link: get("link"), date: new Date(get("pubDate")), desc: get("description") });
  }
  return items;
}

async function checkOfficialStatements() {
  const feeds = JSON.parse(await readFile(new URL("./compliance-feeds.json", import.meta.url), "utf8")).feeds;
  const since = Date.now() - WINDOW_DAYS * 86400000;
  let okFeeds = 0;
  let scanned = 0;
  for (const feed of feeds) {
    let items;
    try {
      items = parseRss(await fetchText(feed.url, { timeoutMs: 60000 }));
    } catch (e) {
      notes.push(`Лента «${feed.authority}» не загрузилась (${e.message}) — за эту неделю она не проверена`);
      continue;
    }
    okFeeds++;
    for (const it of items) {
      if (!Number.isNaN(it.date.getTime()) && it.date.getTime() < since) continue;
      scanned++;
      const text = `${it.title} ${it.desc}`;
      for (const e of ENTITIES) {
        const hit = nameHit(text, e) || domainHit(text, e);
        if (!hit) continue;
        const word = (text.match(ENFORCEMENT_WORDS) || [])[0];
        const when = Number.isNaN(it.date.getTime()) ? "" : it.date.toISOString().slice(0, 10);
        const line = `${feed.authority}, ${when}: «${it.title}» — ${it.link}`;
        if (word) alert("Официальное заявление", e.name, `${line} (в тексте встречается «${word}» — прочитайте, идёт ли речь о нарушении и кем является компания)`);
        else review("Официальное заявление", e.name, `${line} (упоминание без признаков санкции — для сведения)`);
      }
    }
  }
  if (okFeeds === 0) alert("Официальные заявления", "—", "Ни одна из официальных лент не загрузилась — заявления за эту неделю не проверены");
  stats.official = `${okFeeds} из ${feeds.length} лент загрузились, просмотрено ${scanned} заявлений за ${WINDOW_DAYS} дней`;
}

// ---------- отчёт ----------
// Находка «известна», если её отпечаток уже попадал в отчёт: так постоянные записи
// (например, компания в списке ЦБ) не превращаются в новую задачу каждую неделю.
// Цифры в тексте (дни до истечения домена) в отпечаток не входят.
const fingerprint = (f) => `${f.check}|${f.entity}|${f.text}`.replace(/\d+/g, "#");

async function main() {
  try {
    state = JSON.parse(await readFile(BASELINE_FILE, "utf8"));
  } catch { /* первый запуск */ }

  for (const step of [checkOfac, checkCbr, checkOfficialStatements, checkAvailability, checkDomains]) {
    try {
      await step();
    } catch (e) {
      alert("Сбой проверки", "—", `${step.name}: ${e.message}`);
    }
  }

  // Если журнала «уже сообщённого» ещё не было (первый запуск этой версии), всё
  // найденное считаем уже показанным в предыдущей задаче — только запоминаем.
  const firstWithLog = !state._seen;
  state._seen = state._seen || {};
  const today = new Date().toISOString().slice(0, 10);
  const fresh = [];
  const known = [];
  for (const f of findings) {
    const key = fingerprint(f);
    if (state._seen[key]) known.push(f);
    else {
      if (!firstWithLog) fresh.push(f);
      else known.push(f);
      state._seen[key] = today;
    }
  }
  await mkdir(new URL("./data/", import.meta.url), { recursive: true });
  await writeFile(BASELINE_FILE, JSON.stringify(state, null, 2) + "\n");

  const freshAlerts = fresh.filter((f) => f.level === "alert");
  const freshReviews = fresh.filter((f) => f.level === "review");
  const date = new Date().toLocaleDateString("ru-RU", { timeZone: "Europe/Moscow" });
  const lines = [];
  lines.push(`# Проверка компаний сайта — ${date}`);
  lines.push("");
  lines.push(`Проверено компаний: **${ENTITIES.length}**. **Новых** замечаний: **${freshAlerts.length}**, новых требующих проверки (возможные тёзки/клоны): **${freshReviews.length}**. Известных ранее: **${known.length}**.`);
  lines.push("");
  lines.push("**Это автоматическая проверка. Сайт она не меняет** — сначала откройте источник и убедитесь, что это именно та компания, а не тёзка или клон.");
  lines.push("");
  const section = (title, list) => {
    if (!list.length) return;
    lines.push(`## ${title}`);
    lines.push("");
    for (const f of list) lines.push(`- **${f.entity}** · ${f.check}: ${f.text}`);
    lines.push("");
  };
  section("Новые замечания", freshAlerts);
  section("Новое: требует проверки", freshReviews);
  if (known.length) {
    lines.push(`<details><summary>Известные ранее (${known.length}) — уже сообщались, остаются в силе</summary>`);
    lines.push("");
    for (const f of known) lines.push(`- **${f.entity}** · ${f.check}: ${f.text}`);
    lines.push("");
    lines.push("</details>");
    lines.push("");
  }
  lines.push("## Что проверялось");
  lines.push("");
  lines.push(`- OFAC (санкции США): ${stats.ofac || "—"}`);
  lines.push(`- Банк России, список нелегальной деятельности: ${stats.cbr || "—"}`);
  lines.push(`- Официальные заявления регуляторов (SEC, CFTC, DOJ, FCA, ESMA, Банк России): ${stats.official || "—"}`);
  lines.push(`- Доступность сайтов: ${stats.availability || "—"}`);
  lines.push(`- Домены (RDAP): ${stats.domains || "—"}`);
  lines.push("- «Нежелательные организации» Минюста РФ: **автоматически не проверяется** (сайт закрыт для автоматических запросов) — проверьте вручную: https://minjust.gov.ru/ru/documents/7756/");
  if (notes.length) {
    lines.push("");
    lines.push("<details><summary>Технические заметки</summary>");
    lines.push("");
    for (const n of notes) lines.push(`- ${n}`);
    lines.push("");
    lines.push("</details>");
  }
  const report = lines.join("\n") + "\n";
  await writeFile("compliance-report.md", report);
  console.log(report);

  const hasFindings = fresh.length > 0;
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `has_findings=${hasFindings}\ncount=${fresh.length}\n`);
}

await main();
