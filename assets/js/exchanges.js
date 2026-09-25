// Widget for the "Compare exchanges" section (/exchanges/):
//   - initExchangesTable(rootId) → sortable/filterable comparison cards
//
// All exchanges are shown the same way, in one list, with no links to their
// sites and no separate page per exchange (removed 2026-09-25): a page about a
// single foreign crypto exchange with a "check before registering" link reads
// as advertising, which is not allowed for such services in Russia.
//
// Data comes from the global EXCHANGES_COMPARE (assets/js/data.js / data.en.js).
// Language is taken from <html lang="ru|en">, same as calculator.js.

const EXCHANGES_STRINGS = {
  ru: {
    filtersTitle: "Фильтры",
    ruAccessLabel: "Доступ для РФ",
    ruAccessOpenOption: "Россия не в списке ограничений",
    ruAccessGreyOption: "есть ограничения для России в условиях биржи",
    colExchange: "Биржа",
    colLicenses: "Лицензии",
    colRuAccess: "Доступ для РФ",
    colFee: "Комиссия (тейкер)",
    colDeposit: "Способы пополнения",
    colFounded: "Год",
    tipLicenses: "Какие лицензии или регистрации VASP есть у биржи и в какой юрисдикции.",
    tipRuAccess: "Упоминает ли пользовательское соглашение биржи Россию среди ограниченных стран.",
    tipFee: "Комиссия за исполнение ордера по рынку (тейкер) на споте, базовый уровень без скидок за объём.",
    tipDeposit: "Какими способами можно завести деньги на биржу.",
    tipFounded: "В каком году биржа начала работать.",
    ruAccessOpen: "Не в списке ограничений",
    ruAccessGrey: "Есть ограничения",
    dash: "—",
    empty: "Под выбранные фильтры не подошла ни одна биржа.",
    sortByLabel: "Сортировка",
    sortDirLabel: "Сменить направление сортировки",
    researched: (d) =>
      `Данные собраны ${d} через веб-поиск и не сверялись построчно с официальными сайтами бирж. Лицензии, комиссии и условия для резидентов РФ меняются — сверяйте их по официальным документам биржи.`,
    colHq: "Штаб-квартира / регистрация",
    tipHq: "Где зарегистрирована биржа и какое право применяется к соглашению с пользователем.",
    colMaker: "Комиссия (мейкер)",
    tipMaker: "Комиссия за лимитный ордер, который постоял в стакане, на споте, базовый уровень.",
    colWithdrawal: "Вывод USDT",
    tipWithdrawal: "Комиссия за вывод USDT с биржи.",
    colRuTerms: "Условия для РФ подробно",
    tipRuTerms: "Что написано о России в пользовательском соглашении биржи.",
    locale: "ru-RU",
  },
  en: {
    filtersTitle: "Filters",
    ruAccessLabel: "Russia access",
    ruAccessOpenOption: "Russia not restricted",
    ruAccessGreyOption: "the exchange's terms restrict Russia",
    colExchange: "Exchange",
    colLicenses: "Licenses",
    colRuAccess: "Russia access",
    colFee: "Fee (taker)",
    colDeposit: "Deposit methods",
    colFounded: "Founded",
    tipLicenses: "What licenses or VASP registrations the exchange holds, and in which jurisdiction.",
    tipRuAccess: "Whether the exchange's user agreement lists Russia among restricted countries.",
    tipFee: "The base spot taker fee (market order), before any volume discount.",
    tipDeposit: "Ways to fund the exchange account.",
    tipFounded: "The year the exchange started operating.",
    ruAccessOpen: "Not restricted",
    ruAccessGrey: "Restrictions apply",
    dash: "—",
    empty: "No exchange matches the selected filters.",
    sortByLabel: "Sort by",
    sortDirLabel: "Toggle sort direction",
    researched: (d) =>
      `Data gathered ${d} via web search and not checked line by line against official exchange sites. Licenses, fees, and terms for Russian residents change — verify them in the exchange's official documents.`,
    colHq: "Headquarters / registration",
    tipHq: "Where the exchange is registered and which law governs its user agreement.",
    colMaker: "Fee (maker)",
    tipMaker: "The base spot fee for a limit order that rested in the order book.",
    colWithdrawal: "USDT withdrawal",
    tipWithdrawal: "The fee for withdrawing USDT from the exchange.",
    colRuTerms: "Terms for Russia in detail",
    tipRuTerms: "What the exchange's user agreement says about Russia.",
    locale: "en-US",
  },
};

function getExLang() {
  return document.documentElement.lang === "en" ? "en" : "ru";
}

function escapeEx(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
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

  // Card layout (not a scrollable table) on purpose (see .cmp-cards in
  // style.css): the license/deposit text is long enough that a real row
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
    cardsRoot.innerHTML = rows
      .map(
        (ex) => `
        <article class="cmp-card" id="${ex.slug}">
          <h3 class="cmp-card-name">${escapeEx(ex.name)}</h3>
          <dl class="cmp-fields">
            ${field(t.colLicenses, t.tipLicenses, escapeEx(ex.licenses))}
            ${field(t.colRuAccess, t.tipRuAccess, ruAccessBadgeHTML(ex, t))}
            ${field(t.colRuTerms, t.tipRuTerms, escapeEx(ex.ruAccessText))}
            ${field(t.colFee, t.tipFee, escapeEx(ex.takerFeeText))}
            ${field(t.colMaker, t.tipMaker, escapeEx(ex.makerFeeText))}
            ${field(t.colWithdrawal, t.tipWithdrawal, escapeEx(ex.withdrawalFeeText))}
            ${field(t.colDeposit, t.tipDeposit, ex.depositMethods.map(escapeEx).join(", "))}
            ${field(t.colHq, t.tipHq, escapeEx(ex.hq))}
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
