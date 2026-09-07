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
    sortHint: "Нажмите на подчёркнутый заголовок, чтобы отсортировать.",
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
    sortHint: "Click an underlined column heading to sort.",
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

  const state = { ruAccess: [], sortKey: null, sortDir: 1 };

  root.innerHTML = `
    <form class="pf-filters" aria-label="${t.filtersTitle}">
      <fieldset class="pf-field pf-field--checks">
        <legend>${t.ruAccessLabel}</legend>
        <label><input type="checkbox" name="ruAccess" value="open" /> ${t.ruAccessOpenOption}</label>
        <label><input type="checkbox" name="ruAccess" value="grey" /> ${t.ruAccessGreyOption}</label>
      </fieldset>
    </form>
    <p class="pf-sort-hint">${t.sortHint}</p>
    <div class="calc-table-wrap">
      <table class="calc-table compare-table">
        <thead>
          <tr>
            <th data-sort="name" class="sortable" title="${t.tipExchange}">${t.colExchange}</th>
            <th title="${t.tipLicenses}">${t.colLicenses}</th>
            <th title="${t.tipRuAccess}">${t.colRuAccess}</th>
            <th data-sort="fee" class="sortable" title="${t.tipFee}">${t.colFee}</th>
            <th title="${t.tipDeposit}">${t.colDeposit}</th>
            <th data-sort="founded" class="sortable" title="${t.tipFounded}">${t.colFounded}</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
    <p class="calc-disclaimer">${t.researched(EXCHANGES_COMPARE_RESEARCHED)}</p>
  `;

  const tbody = root.querySelector("tbody");
  const form = root.querySelector(".pf-filters");
  const headers = root.querySelectorAll("th.sortable");

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
    if (state.sortKey) {
      rows.sort((a, b) => {
        const av = sortValue(a, state.sortKey);
        const bv = sortValue(b, state.sortKey);
        if (av < bv) return -1 * state.sortDir;
        if (av > bv) return 1 * state.sortDir;
        return 0;
      });
    }
    return rows;
  }

  function render() {
    const rows = currentRows();
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="pf-empty">${t.empty}</td></tr>`;
      return;
    }
    const base = exchangesBase();
    tbody.innerHTML = rows
      .map(
        (ex) => `
        <tr>
          <td data-label="${t.colExchange}"><a class="pf-name" href="${base}${ex.slug}/">${escapeEx(ex.name)}</a></td>
          <td data-label="${t.colLicenses}">${escapeEx(ex.licenses)}</td>
          <td data-label="${t.colRuAccess}">${ruAccessBadgeHTML(ex, t)}</td>
          <td data-label="${t.colFee}">${escapeEx(ex.takerFeeText)}</td>
          <td data-label="${t.colDeposit}">${ex.depositMethods.map(escapeEx).join(", ")}</td>
          <td data-label="${t.colFounded}">${ex.founded ?? t.dash}</td>
        </tr>`
      )
      .join("");
  }

  form.addEventListener("change", () => {
    state.ruAccess = Array.from(form.querySelectorAll('input[name="ruAccess"]:checked')).map((c) => c.value);
    render();
  });

  headers.forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.sort;
      if (state.sortKey === key) {
        state.sortDir *= -1;
      } else {
        state.sortKey = key;
        state.sortDir = key === "name" ? 1 : -1;
      }
      headers.forEach((h) => h.removeAttribute("aria-sort"));
      th.setAttribute("aria-sort", state.sortDir === 1 ? "ascending" : "descending");
      render();
    });
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
