// Reusable widgets for the "Compare exchanges" section (/exchanges/):
//   - initExchangesTable(rootId)        → sortable/filterable comparison table
//   - renderExchangeSummary(slug, rootId) → key-facts table on an exchange page
//   - renderOtherExchanges(slug, rootId)  → grid linking the other exchanges
//
// Data comes from the global EXCHANGES_COMPARE (assets/js/data.js / data.en.js).
// Language is taken from <html lang="ru|en">, same as calculator.js / prop-firms.js.

const EXCHANGES_STRINGS = {
  ru: {
    filtersTitle: "Фильтры",
    ruAccessLabel: "Доступ для РФ",
    ruAccessOpenOption: "без ограничений",
    ruAccessGreyOption: "серая зона (ToS ограничивает, но работает)",
    colExchange: "Биржа",
    colLicenses: "Лицензии",
    colRuAccess: "Доступ для РФ",
    colFee: "Комиссия (тейкер)",
    colDeposit: "Способы пополнения",
    colFounded: "Год",
    tipExchange: "Название биржи — нажмите, чтобы открыть подробный обзор.",
    tipLicenses: "Какие лицензии или регистрации VASP есть у биржи и в какой юрисдикции.",
    tipRuAccess: "Насколько свободно резиденты России могут пользоваться биржей — формально и на практике.",
    tipFee: "Комиссия за исполнение ордера по рынку (тейкер) на споте, базовый уровень без скидок за объём.",
    tipDeposit: "Какими способами можно завести деньги на биржу.",
    tipFounded: "В каком году биржа начала работать.",
    ruAccessOpen: "Без ограничений",
    ruAccessGrey: "Серая зона",
    dash: "—",
    empty: "Под выбранные фильтры не подошла ни одна биржа.",
    sortByLabel: "Сортировка",
    sortDirLabel: "Сменить направление сортировки",
    researched: (d) =>
      `Данные собраны ${d} через веб-поиск и не сверялись построчно с официальными сайтами бирж. Лицензии, комиссии и доступ для резидентов РФ меняются — проверяйте ключевые пункты на сайте биржи перед регистрацией.`,
    summaryFounded: "Год основания",
    summaryHq: "Штаб-квартира / регистрация",
    summaryLicenses: "Лицензии / регулирование",
    summaryRuAccess: "Доступ для резидентов РФ",
    summaryTakerFee: "Комиссия тейкера (спот)",
    summaryMakerFee: "Комиссия мейкера (спот)",
    summaryDeposit: "Способы пополнения",
    summaryWithdrawal: "Комиссия за вывод USDT",
    otherHeading: "Другие биржи",
    locale: "ru-RU",
  },
  en: {
    filtersTitle: "Filters",
    ruAccessLabel: "Russia access",
    ruAccessOpenOption: "no restrictions",
    ruAccessGreyOption: "grey zone (ToS excludes it, works in practice)",
    colExchange: "Exchange",
    colLicenses: "Licenses",
    colRuAccess: "Russia access",
    colFee: "Fee (taker)",
    colDeposit: "Deposit methods",
    colFounded: "Founded",
    tipExchange: "The exchange's name — click to open the full review.",
    tipLicenses: "What licenses or VASP registrations the exchange holds, and in which jurisdiction.",
    tipRuAccess: "How freely Russian residents can use the exchange — formally and in practice.",
    tipFee: "The base spot taker fee (market order), before any volume discount.",
    tipDeposit: "Ways to fund the exchange account.",
    tipFounded: "The year the exchange started operating.",
    ruAccessOpen: "No restrictions",
    ruAccessGrey: "Grey zone",
    dash: "—",
    empty: "No exchange matches the selected filters.",
    sortByLabel: "Sort by",
    sortDirLabel: "Toggle sort direction",
    researched: (d) =>
      `Data gathered ${d} via web search and not checked line by line against official exchange sites. Licenses, fees, and Russia-access status change — verify the key points on the exchange's own site before registering.`,
    summaryFounded: "Founded",
    summaryHq: "Headquarters / registration",
    summaryLicenses: "Licenses / regulation",
    summaryRuAccess: "Access for Russian residents",
    summaryTakerFee: "Taker fee (spot)",
    summaryMakerFee: "Maker fee (spot)",
    summaryDeposit: "Deposit methods",
    summaryWithdrawal: "USDT withdrawal fee",
    otherHeading: "Other exchanges",
    locale: "en-US",
  },
};

function getExLang() {
  return document.documentElement.lang === "en" ? "en" : "ru";
}

function exchangesBase() {
  return getExLang() === "en" ? "/en/exchanges/" : "/exchanges/";
}

function escapeEx(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

function getExchangeCompare(slug) {
  return typeof EXCHANGES_COMPARE !== "undefined" ? EXCHANGES_COMPARE.find((e) => e.slug === slug) : null;
}

function ruAccessBadgeHTML(ex, t) {
  const label = ex.ruAccessTier === "open" ? t.ruAccessOpen : t.ruAccessGrey;
  const cls = ex.ruAccessTier === "open" ? "ex-badge ex-badge--open" : "ex-badge ex-badge--grey";
  return `<span class="${cls}">${label}</span>`;
}

// --------------------------------------------------------------------------
// Comparison table
// --------------------------------------------------------------------------

function initExchangesTable(rootId) {
  const root = document.getElementById(rootId);
  if (!root || typeof EXCHANGES_COMPARE === "undefined") return;
  const t = EXCHANGES_STRINGS[getExLang()];

  // Card layout (not a scrollable table) on purpose — see the same note in
  // prop-firms.js: the license/deposit text is long enough that a real row
  // table needs more width than the ~1080px container ever gives it, on
  // any screen size. Sorting is driven by a select + direction toggle.
  const state = { ruAccess: [], sortKey: "name", sortDir: 1 };

  const sortOptions = [
    ["name", t.colExchange],
    ["fee", t.colFee],
    ["founded", t.colFounded],
  ];

  root.innerHTML = `
    <form class="pf-filters" aria-label="${t.filtersTitle}">
      <fieldset class="pf-field pf-field--checks">
        <legend>${t.ruAccessLabel}</legend>
        <label><input type="checkbox" name="ruAccess" value="open" /> ${t.ruAccessOpenOption}</label>
        <label><input type="checkbox" name="ruAccess" value="grey" /> ${t.ruAccessGreyOption}</label>
      </fieldset>
    </form>
    <div class="cmp-sort">
      <label for="ex-sort-key">${t.sortByLabel}</label>
      <select id="ex-sort-key">
        ${sortOptions.map(([key, label]) => `<option value="${key}"${key === state.sortKey ? " selected" : ""}>${label}</option>`).join("")}
      </select>
      <button type="button" class="cmp-sort-dir" id="ex-sort-dir" aria-label="${t.sortDirLabel}" title="${t.sortDirLabel}">↓</button>
    </div>
    <div class="cmp-cards" id="ex-cards"></div>
    <p class="calc-disclaimer">${t.researched(EXCHANGES_COMPARE_RESEARCHED)}</p>
  `;

  const cardsRoot = root.querySelector("#ex-cards");
  const form = root.querySelector(".pf-filters");
  const sortKeySelect = root.querySelector("#ex-sort-key");
  const sortDirBtn = root.querySelector("#ex-sort-dir");

  function sortValue(ex, key) {
    switch (key) {
      case "name": return ex.name.toLowerCase();
      case "fee": return ex.takerFeeValue ?? Infinity;
      case "founded": return ex.founded ?? Infinity;
      default: return 0;
    }
  }

  function currentRows() {
    let rows = EXCHANGES_COMPARE.slice();
    if (state.ruAccess.length) {
      rows = rows.filter((e) => state.ruAccess.includes(e.ruAccessTier));
    }
    rows.sort((a, b) => {
      const av = sortValue(a, state.sortKey);
      const bv = sortValue(b, state.sortKey);
      if (av < bv) return -1 * state.sortDir;
      if (av > bv) return 1 * state.sortDir;
      return 0;
    });
    return rows;
  }

  function field(label, tip, valueHtml) {
    return `<div class="cmp-field"><dt title="${tip}">${label}</dt><dd>${valueHtml}</dd></div>`;
  }

  function render() {
    const rows = currentRows();
    if (!rows.length) {
      cardsRoot.innerHTML = `<p class="pf-empty">${t.empty}</p>`;
      return;
    }
    const base = exchangesBase();
    cardsRoot.innerHTML = rows
      .map(
        (ex) => `
        <article class="cmp-card">
          <h3 class="cmp-card-name"><a class="pf-name" href="${base}${ex.slug}/">${escapeEx(ex.name)}</a></h3>
          <dl class="cmp-fields">
            ${field(t.colLicenses, t.tipLicenses, escapeEx(ex.licenses))}
            ${field(t.colRuAccess, t.tipRuAccess, ruAccessBadgeHTML(ex, t))}
            ${field(t.colFee, t.tipFee, escapeEx(ex.takerFeeText))}
            ${field(t.colDeposit, t.tipDeposit, ex.depositMethods.map(escapeEx).join(", "))}
            ${field(t.colFounded, t.tipFounded, ex.founded ?? t.dash)}
          </dl>
        </article>`
      )
      .join("");
  }

  form.addEventListener("change", () => {
    state.ruAccess = Array.from(form.querySelectorAll('input[name="ruAccess"]:checked')).map((c) => c.value);
    render();
  });

  sortKeySelect.addEventListener("change", () => {
    state.sortKey = sortKeySelect.value;
    render();
  });

  sortDirBtn.addEventListener("click", () => {
    state.sortDir *= -1;
    sortDirBtn.textContent = state.sortDir === 1 ? "↓" : "↑";
    render();
  });

  render();
}

// --------------------------------------------------------------------------
// Exchange-page helpers
// --------------------------------------------------------------------------

function renderExchangeSummary(slug, rootId) {
  const root = document.getElementById(rootId);
  const ex = getExchangeCompare(slug);
  if (!root || !ex) return;
  const t = EXCHANGES_STRINGS[getExLang()];

  const rows = [
    [t.summaryFounded, ex.founded],
    [t.summaryHq, escapeEx(ex.hq)],
    [t.summaryLicenses, escapeEx(ex.licenses)],
    [t.summaryRuAccess, `${ruAccessBadgeHTML(ex, t)}<br>${escapeEx(ex.ruAccessText)}`],
    [t.summaryTakerFee, escapeEx(ex.takerFeeText)],
    [t.summaryMakerFee, escapeEx(ex.makerFeeText)],
    [t.summaryDeposit, ex.depositMethods.map(escapeEx).join(", ")],
    [t.summaryWithdrawal, escapeEx(ex.withdrawalFeeText)],
  ];

  root.innerHTML = `
    <table class="data-table">
      <tbody>
        ${rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join("")}
      </tbody>
    </table>
  `;
}

function renderOtherExchanges(slug, rootId) {
  const root = document.getElementById(rootId);
  if (!root || typeof EXCHANGES_COMPARE === "undefined") return;
  const base = exchangesBase();
  root.innerHTML = EXCHANGES_COMPARE.filter((e) => e.slug !== slug)
    .map(
      (e) => `
      <a class="firm-card" href="${base}${e.slug}/">
        <h3>${escapeEx(e.name)}</h3>
        <p>${escapeEx(e.takerFeeText)} · ${e.founded ?? ""}</p>
      </a>`
    )
    .join("");
}
