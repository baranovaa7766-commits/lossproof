// Reusable widgets for the "Compare prop firms" section (/prop-firms/):
//   - initPropFirmsTable(rootId)         → sortable/filterable comparison table
//   - renderPropFirmSummary(slug, rootId)→ key-facts table on a firm page
//   - renderPropFirmRules(slug, rootId)  → per-evaluation rules block
//   - renderPropFirmPrices(slug, rootId) → full per-account-size price table
//   - renderOtherPropFirms(slug, rootId) → grid linking the other firms
//
// Data comes from the global PROP_FIRMS (assets/js/data.js / data.en.js).
// Language is taken from <html lang="ru|en">, same as calculator.js.

const PROPFIRMS_STRINGS = {
  ru: {
    filtersTitle: "Фильтры",
    evalTypeLabel: "Тип оценки",
    maxEntryLabel: "Стоимость входа",
    minSplitLabel: "Профит-сплит",
    anyOption: "любая",
    entryUnder: (v) => `до $${v}`,
    splitFrom: (v) => `от ${v}%`,
    eval1: "1-step",
    eval2: "2-step",
    evalInstant: "instant funding",
    colFirm: "Фирма",
    colEval: "Тип оценки",
    colEntry: "Стоимость входа",
    colSplit: "Профит-сплит",
    colDrawdown: "Макс. просадка (дн. / общая)",
    colMinDays: "Мин. дней",
    colMaxAccount: "Макс. аккаунт / скейлинг",
    colPayout: "Метод выплат",
    colTrustpilot: "Trustpilot",
    colBroker: "Broker-backing",
    colFounded: "Год",
    payoutLink: "вывод денег →",
    trustpilotHidden: "рейтинг скрыт",
    reviews: (n) => `${n} отзывов`,
    asOf: (d) => `на ${d}`,
    dash: "—",
    empty: "Под выбранные фильтры не подошла ни одна фирма.",
    researched: (d) =>
      `Данные собраны ${d} через веб-поиск и не сверялись построчно с официальными сайтами. Профит-сплит, просадки, цены и число отзывов Trustpilot меняются — проверяйте ключевые цифры на сайте фирмы перед решением.`,
    sortHint: "Нажмите на подчёркнутый заголовок, чтобы отсортировать.",
    noteLabel: "Почему в списке:",
    summaryFounded: "Год основания",
    summaryEval: "Тип оценки",
    summaryEntry: "Стоимость входа",
    summarySplit: "Профит-сплит",
    summaryDaily: "Макс. дневная просадка",
    summaryTotal: "Макс. общая просадка",
    summaryMinDays: "Мин. дней торговли",
    summaryMaxAccount: "Макс. размер аккаунта / скейлинг",
    summaryPayout: "Методы выплат",
    summaryTrustpilot: "Trustpilot",
    summaryBroker: "Broker-backing",
    summaryHistory: "История выплат",
    rulesTarget: "Цель по профиту",
    rulesDaily: "Дневная просадка",
    rulesTotal: "Общая просадка",
    rulesMinDays: "Мин. дней",
    rulesTimeLimit: "Ограничение по времени",
    rulesSplit: "Профит-сплит",
    rulesHeading: (t) => `Правила оценки: ${t}`,
    cadenceHeading: "График выплат",
    priceSize: "Размер аккаунта",
    priceOneStep: "1-step",
    priceTwoStep: "2-step",
    pricePrice: "Цена",
    priceMonthly: "Подписка",
    priceSummary: "Показать цены по всем размерам аккаунта",
    priceNote: "Цены ориентировочные и не сверялись с официальным сайтом — уточняйте актуальный прайс у фирмы.",
    otherHeading: "Другие пропфирмы",
    locale: "ru-RU",
  },
  en: {
    filtersTitle: "Filters",
    evalTypeLabel: "Evaluation type",
    maxEntryLabel: "Entry cost",
    minSplitLabel: "Profit split",
    anyOption: "any",
    entryUnder: (v) => `under $${v}`,
    splitFrom: (v) => `${v}%+`,
    eval1: "1-step",
    eval2: "2-step",
    evalInstant: "instant funding",
    colFirm: "Firm",
    colEval: "Evaluation",
    colEntry: "Entry cost",
    colSplit: "Profit split",
    colDrawdown: "Max drawdown (daily / total)",
    colMinDays: "Min days",
    colMaxAccount: "Max account / scaling",
    colPayout: "Payout method",
    colTrustpilot: "Trustpilot",
    colBroker: "Broker-backing",
    colFounded: "Founded",
    payoutLink: "how to withdraw →",
    trustpilotHidden: "rating hidden",
    reviews: (n) => `${n} reviews`,
    asOf: (d) => `as of ${d}`,
    dash: "—",
    empty: "No firm matches the selected filters.",
    researched: (d) =>
      `Data gathered ${d} via web search and not checked line by line against official sites. Profit splits, drawdowns, prices and Trustpilot review counts change — verify the key figures on the firm's own site before deciding.`,
    sortHint: "Click an underlined column heading to sort.",
    noteLabel: "Why it's listed:",
    summaryFounded: "Founded",
    summaryEval: "Evaluation type",
    summaryEntry: "Entry cost",
    summarySplit: "Profit split",
    summaryDaily: "Max daily drawdown",
    summaryTotal: "Max total drawdown",
    summaryMinDays: "Min trading days",
    summaryMaxAccount: "Max account size / scaling",
    summaryPayout: "Payout methods",
    summaryTrustpilot: "Trustpilot",
    summaryBroker: "Broker-backing",
    summaryHistory: "Payout history",
    rulesTarget: "Profit target",
    rulesDaily: "Daily drawdown",
    rulesTotal: "Total drawdown",
    rulesMinDays: "Min days",
    rulesTimeLimit: "Time limit",
    rulesSplit: "Profit split",
    rulesHeading: (t) => `Evaluation rules: ${t}`,
    cadenceHeading: "Payout schedule",
    priceSize: "Account size",
    priceOneStep: "1-step",
    priceTwoStep: "2-step",
    pricePrice: "Price",
    priceMonthly: "Subscription",
    priceSummary: "Show prices for every account size",
    priceNote: "Prices are indicative and not checked against the official site — confirm current pricing with the firm.",
    otherHeading: "Other prop firms",
    locale: "en-US",
  },
};

function getPropLang() {
  return document.documentElement.lang === "en" ? "en" : "ru";
}

function propFirmsBase() {
  return getPropLang() === "en" ? "/en/prop-firms/" : "/prop-firms/";
}

function payoutBase() {
  return getPropLang() === "en" ? "/en/payout/" : "/payout/";
}

function escapePF(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

function formatIntPF(n, t) {
  try {
    return new Intl.NumberFormat(t.locale).format(n);
  } catch (e) {
    return String(n);
  }
}

function getPropFirm(slug) {
  return typeof PROP_FIRMS !== "undefined" ? PROP_FIRMS.find((f) => f.slug === slug) : null;
}

function evalLabel(type, t) {
  if (type === "1-step") return t.eval1;
  if (type === "2-step") return t.eval2;
  if (type === "instant") return t.evalInstant;
  return type;
}

function trustpilotCellHTML(firm, t) {
  const parts = [];
  if (firm.trustpilotScore == null) {
    parts.push(`<strong>${t.trustpilotHidden}</strong>`);
  } else {
    parts.push(`<strong>${firm.trustpilotScore.toFixed(1)}</strong> / 5`);
  }
  if (firm.trustpilotReviews) {
    parts.push(`<span class="pf-muted">${t.reviews(formatIntPF(firm.trustpilotReviews, t))}</span>`);
  }
  if (firm.trustpilotAsOf) {
    parts.push(`<span class="pf-muted">${t.asOf(firm.trustpilotAsOf)}</span>`);
  }
  return parts.join("<br>");
}

// --------------------------------------------------------------------------
// Comparison table
// --------------------------------------------------------------------------

function initPropFirmsTable(rootId) {
  const root = document.getElementById(rootId);
  if (!root || typeof PROP_FIRMS === "undefined") return;
  const t = PROPFIRMS_STRINGS[getPropLang()];

  const state = { evalTypes: [], maxEntry: "any", minSplit: "any", sortKey: null, sortDir: 1 };

  const entryBuckets = [50, 100, 200];
  const splitBuckets = [80, 90, 100];

  root.innerHTML = `
    <form class="pf-filters" aria-label="${t.filtersTitle}">
      <fieldset class="pf-field pf-field--checks">
        <legend>${t.evalTypeLabel}</legend>
        <label><input type="checkbox" name="evalType" value="1-step" /> ${t.eval1}</label>
        <label><input type="checkbox" name="evalType" value="2-step" /> ${t.eval2}</label>
        <label><input type="checkbox" name="evalType" value="instant" /> ${t.evalInstant}</label>
      </fieldset>
      <div class="pf-field">
        <label for="pf-max-entry">${t.maxEntryLabel}</label>
        <select id="pf-max-entry" name="maxEntry">
          <option value="any">${t.anyOption}</option>
          ${entryBuckets.map((v) => `<option value="${v}">${t.entryUnder(v)}</option>`).join("")}
        </select>
      </div>
      <div class="pf-field">
        <label for="pf-min-split">${t.minSplitLabel}</label>
        <select id="pf-min-split" name="minSplit">
          <option value="any">${t.anyOption}</option>
          ${splitBuckets.map((v) => `<option value="${v}">${t.splitFrom(v)}</option>`).join("")}
        </select>
      </div>
    </form>
    <p class="pf-sort-hint">${t.sortHint}</p>
    <div class="calc-table-wrap">
      <table class="calc-table compare-table">
        <thead>
          <tr>
            <th data-sort="name" class="sortable">${t.colFirm}</th>
            <th>${t.colEval}</th>
            <th data-sort="entry" class="sortable">${t.colEntry}</th>
            <th data-sort="split" class="sortable">${t.colSplit}</th>
            <th>${t.colDrawdown}</th>
            <th>${t.colMinDays}</th>
            <th data-sort="account" class="sortable">${t.colMaxAccount}</th>
            <th>${t.colPayout}</th>
            <th data-sort="trustpilot" class="sortable">${t.colTrustpilot}</th>
            <th>${t.colBroker}</th>
            <th data-sort="founded" class="sortable">${t.colFounded}</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
    <p class="calc-disclaimer">${t.researched(PROP_FIRMS_RESEARCHED)}</p>
  `;

  const tbody = root.querySelector("tbody");
  const form = root.querySelector(".pf-filters");
  const headers = root.querySelectorAll("th.sortable");

  function sortValue(firm, key) {
    switch (key) {
      case "name": return firm.name.toLowerCase();
      case "entry": return firm.entryFrom ?? Infinity;
      case "split": return firm.profitSplitMax ?? -Infinity;
      case "account": return firm.maxAccountValue ?? -Infinity;
      case "trustpilot": return firm.trustpilotScore ?? -Infinity;
      case "founded": return firm.founded ?? Infinity;
      default: return 0;
    }
  }

  function currentRows() {
    let rows = PROP_FIRMS.slice();
    if (state.evalTypes.length) {
      rows = rows.filter((f) => f.evaluationTypes.some((e) => state.evalTypes.includes(e)));
    }
    if (state.maxEntry !== "any") {
      rows = rows.filter((f) => typeof f.entryFrom === "number" && f.entryFrom <= Number(state.maxEntry));
    }
    if (state.minSplit !== "any") {
      rows = rows.filter((f) => typeof f.profitSplitMax === "number" && f.profitSplitMax >= Number(state.minSplit));
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
      tbody.innerHTML = `<tr><td colspan="11" class="pf-empty">${t.empty}</td></tr>`;
      return;
    }
    const base = propFirmsBase();
    tbody.innerHTML = rows
      .map((f) => {
        const payoutHref = f.payoutSlug
          ? `<br><a class="pf-cross" href="${payoutBase()}${f.payoutSlug}/">${t.payoutLink}</a>`
          : "";
        return `
        <tr>
          <td data-label="${t.colFirm}">
            <a class="pf-name" href="${base}${f.slug}/">${escapePF(f.name)}</a>${payoutHref}
          </td>
          <td data-label="${t.colEval}">${f.evaluationTypes.map((e) => evalLabel(e, t)).join(", ")}</td>
          <td data-label="${t.colEntry}">${escapePF(f.entryText)}</td>
          <td data-label="${t.colSplit}">${escapePF(f.profitSplitText)}</td>
          <td data-label="${t.colDrawdown}">${escapePF(f.drawdownDaily)}<br><span class="pf-muted">${escapePF(f.drawdownTotal)}</span></td>
          <td data-label="${t.colMinDays}">${escapePF(f.minTradingDays)}</td>
          <td data-label="${t.colMaxAccount}">${escapePF(f.maxAccountText)}</td>
          <td data-label="${t.colPayout}">${f.payoutMethods.map(escapePF).join(", ")}</td>
          <td data-label="${t.colTrustpilot}">${trustpilotCellHTML(f, t)}</td>
          <td data-label="${t.colBroker}">${f.brokerBacking ? escapePF(f.brokerBacking) : t.dash}</td>
          <td data-label="${t.colFounded}">${f.founded ?? t.dash}</td>
        </tr>`;
      })
      .join("");
  }

  form.addEventListener("change", () => {
    state.evalTypes = Array.from(form.querySelectorAll('input[name="evalType"]:checked')).map((c) => c.value);
    state.maxEntry = form.querySelector('[name="maxEntry"]').value;
    state.minSplit = form.querySelector('[name="minSplit"]').value;
    render();
  });

  headers.forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.sort;
      if (state.sortKey === key) {
        state.sortDir *= -1;
      } else {
        state.sortKey = key;
        state.sortDir = key === "name" ? 1 : -1; // numbers: high → low first
      }
      headers.forEach((h) => h.removeAttribute("aria-sort"));
      th.setAttribute("aria-sort", state.sortDir === 1 ? "ascending" : "descending");
      render();
    });
  });

  render();
}

// --------------------------------------------------------------------------
// Firm-page helpers
// --------------------------------------------------------------------------

function renderPropFirmSummary(slug, rootId) {
  const root = document.getElementById(rootId);
  const f = getPropFirm(slug);
  if (!root || !f) return;
  const t = PROPFIRMS_STRINGS[getPropLang()];

  const rows = [
    [t.summaryFounded, f.founded],
    [t.summaryEval, f.evaluationTypes.map((e) => evalLabel(e, t)).join(", ")],
    [t.summaryEntry, escapePF(f.entryText)],
    [t.summarySplit, escapePF(f.profitSplitText)],
    [t.summaryDaily, escapePF(f.drawdownDaily)],
    [t.summaryTotal, escapePF(f.drawdownTotal)],
    [t.summaryMinDays, escapePF(f.minTradingDays)],
    [t.summaryMaxAccount, escapePF(f.maxAccountText)],
    [t.summaryPayout, f.payoutMethods.map(escapePF).join(", ")],
    [t.summaryTrustpilot, trustpilotCellHTML(f, t)],
    [t.summaryBroker, f.brokerBacking ? escapePF(f.brokerBacking) : t.dash],
    [t.summaryHistory, escapePF(f.payoutHistory || t.dash)],
  ];

  root.innerHTML = `
    <table class="data-table">
      <tbody>
        ${rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join("")}
      </tbody>
    </table>
    ${f.includeNote ? `<div class="notes-box"><strong>${t.noteLabel}</strong> ${escapePF(f.includeNote)}</div>` : ""}
  `;
}

function renderPropFirmRules(slug, rootId) {
  const root = document.getElementById(rootId);
  const f = getPropFirm(slug);
  if (!root || !f || !f.rules) return;
  const t = PROPFIRMS_STRINGS[getPropLang()];

  const block = (type, r) => `
    <h3>${t.rulesHeading(evalLabel(type, t))}</h3>
    <table class="data-table">
      <tbody>
        <tr><th>${t.rulesTarget}</th><td>${escapePF(r.target)}</td></tr>
        <tr><th>${t.rulesDaily}</th><td>${escapePF(r.daily)}</td></tr>
        <tr><th>${t.rulesTotal}</th><td>${escapePF(r.total)}</td></tr>
        <tr><th>${t.rulesMinDays}</th><td>${escapePF(r.minDays)}</td></tr>
        <tr><th>${t.rulesTimeLimit}</th><td>${escapePF(r.timeLimit)}</td></tr>
        <tr><th>${t.rulesSplit}</th><td>${escapePF(r.split)}</td></tr>
      </tbody>
    </table>`;

  root.innerHTML =
    Object.keys(f.rules).map((type) => block(type, f.rules[type])).join("") +
    (f.payoutCadence
      ? `<h3>${t.cadenceHeading}</h3><p>${escapePF(f.payoutCadence)}</p>`
      : "");
}

function renderPropFirmPrices(slug, rootId) {
  const root = document.getElementById(rootId);
  const f = getPropFirm(slug);
  if (!root || !f || !f.priceTable) return;
  const t = PROPFIRMS_STRINGS[getPropLang()];

  let head;
  let bodyRow;
  if (f.priceModel === "dual") {
    head = `<th>${t.priceSize}</th><th>${t.priceOneStep}</th><th>${t.priceTwoStep}</th>`;
    bodyRow = (r) =>
      `<tr><td data-label="${t.priceSize}">${escapePF(r.size)}</td><td data-label="${t.priceOneStep}">${escapePF(r.oneStep)}</td><td data-label="${t.priceTwoStep}">${escapePF(r.twoStep)}</td></tr>`;
  } else if (f.priceModel === "monthly") {
    head = `<th>${t.priceSize}</th><th>${t.priceMonthly}</th>`;
    bodyRow = (r) =>
      `<tr><td data-label="${t.priceSize}">${escapePF(r.size)}</td><td data-label="${t.priceMonthly}">${escapePF(r.monthly)}</td></tr>`;
  } else {
    head = `<th>${t.priceSize}</th><th>${t.pricePrice}</th>`;
    bodyRow = (r) =>
      `<tr><td data-label="${t.priceSize}">${escapePF(r.size)}</td><td data-label="${t.pricePrice}">${escapePF(r.price)}</td></tr>`;
  }

  root.innerHTML = `
    <details class="price-matrix">
      <summary>${t.priceSummary}</summary>
      <div class="calc-table-wrap">
        <table class="calc-table compare-table">
          <thead><tr>${head}</tr></thead>
          <tbody>${f.priceTable.map(bodyRow).join("")}</tbody>
        </table>
      </div>
      <p class="calc-disclaimer">${t.priceNote}</p>
    </details>
  `;
}

function renderOtherPropFirms(slug, rootId) {
  const root = document.getElementById(rootId);
  if (!root || typeof PROP_FIRMS === "undefined") return;
  const base = propFirmsBase();
  root.innerHTML = PROP_FIRMS.filter((f) => f.slug !== slug)
    .map(
      (f) => `
      <a class="firm-card" href="${base}${f.slug}/">
        <h3>${escapePF(f.name)}</h3>
        <p>${f.evaluationTypes.map((e) => evalLabel(e, PROPFIRMS_STRINGS[getPropLang()])).join(", ")} · ${escapePF(f.entryText)}</p>
      </a>`
    )
    .join("");
}
