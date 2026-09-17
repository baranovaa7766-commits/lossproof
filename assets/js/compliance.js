// Виджет «Проверка условий» (/compliance-check/): бесплатный калькулятор,
// который проверяет текущие цифры трейдера (баланс, эквити, дни) против
// точных правил конкретной пропфирмы — не нарушен ли дневной/общий лимит
// просадки, набран ли профит-таргет, пройден ли минимум торговых дней.
//
// Это MVP для проверки спроса на будущий платный трекер соответствия
// правилам (см. обсуждение в сессии) — сознательно бесплатный, без
// сохранения истории и без импорта сделок. Логика расчёта общая для всех
// фирм (COMPLIANCE_RULES ниже), но параметры (проценты, статическая или
// трейлинг-просадка, профит-таргет по фазам, минимум дней) заданы вручную
// под каждую фирму — исходные числа взяты из PROP_FIRMS.rules в data.js/
// data.en.js, актуальны на дату оттуда же.
//
// Topstep сознательно не включён: у него лимиты в фиксированных долларах
// по каждому размеру счёта, а не в процентах — это другая по структуре
// модель расчёта, которую стоит добавлять отдельно, а не подгонять под
// общую процентную логику.

const COMPLIANCE_RULES = {
  ftmo: {
    "1-step": {
      daily: { pct: 3, basis: "trailing-eod" },
      total: { pct: 10, basis: "trailing-eod" },
      minDays: 0,
      phases: [{ target: 10 }],
    },
    "2-step": {
      daily: { pct: 5, basis: "static" },
      total: { pct: 10, basis: "static" },
      minDays: 0,
      phases: [{ target: 10 }, { target: 5 }],
    },
  },
  fundednext: {
    "1-step": {
      daily: { pct: 3, basis: "static" },
      total: { pct: 6, basis: "static" },
      minDays: 2,
      phases: [{ target: 8 }],
    },
    "2-step": {
      daily: { pct: 5, basis: "static" },
      total: { pct: 10, basis: "static" },
      minDays: 0,
      phases: [{ target: 8 }, { target: 5 }],
    },
  },
  the5ers: {
    "1-step": {
      daily: null,
      total: { pct: 3, basis: "trailing-eod" },
      minDays: 3,
      phases: [{ target: 10 }],
    },
    "2-step": {
      daily: { pct: 5, basis: "static" },
      total: { pct: 10, basis: "static" },
      minDays: 0,
      phases: [{ target: 6 }, { target: 6 }],
    },
  },
  brightfunded: {
    "2-step": {
      daily: { pct: 5, basis: "static" },
      total: { pct: 10, basis: "static" },
      minDays: 5,
      phases: [{ target: 10 }, { target: 5 }],
    },
  },
  "blueberry-funded": {
    "1-step": {
      daily: { pct: 4, basis: "static" },
      total: { pct: 10, basis: "static" },
      minDays: 0,
      phases: [{ target: 10 }],
    },
    "2-step": {
      daily: { pct: 4, basis: "static" },
      total: { pct: 10, basis: "static" },
      minDays: 0,
      phases: [{ target: 8 }, { target: 5 }],
    },
  },
  fundingpips: {
    "2-step": {
      daily: { pct: 4, basis: "static" },
      total: { pct: 12, basis: "static" },
      minDays: 1,
      phases: [{ target: 10 }, { target: 6 }],
    },
  },
};

const COMPLIANCE_STRINGS = {
  ru: {
    firmLabel: "Пропфирма",
    evalLabel: "Формат оценки",
    phaseLabel: "Текущая фаза",
    phaseN: (n) => `Фаза ${n}`,
    initialBalanceLabel: "Стартовый размер счёта, $",
    highestEodLabel: "Максимальная эквити на конец торгового дня за всё время, $",
    highestEodHint: "Просадка у этой фирмы считается «трейлингом» — от вашего лучшего результата, а не от старта. Если ещё не было прибыльных дней — впишите стартовый баланс.",
    todayStartLabel: "Баланс на начало сегодняшнего торгового дня, $",
    currentEquityLabel: "Текущая эквити прямо сейчас, $",
    daysLabel: "Сколько торговых дней уже проведено",
    calcButton: "Проверить",
    noDailyLimit: "Дневного лимита просадки нет",
    resultHeading: "Результат проверки",
    statusOk: "В норме",
    statusBreach: "Нарушено",
    statusPending: "Ещё нет",
    statusReached: "Достигнуто",
    dailyRow: "Дневной лимит просадки",
    totalRow: "Общий лимит просадки",
    targetRow: (n) => `Профит-таргет — Фаза ${n}`,
    daysRow: "Минимум торговых дней",
    marginOk: (n) => `Запас: ${n}`,
    marginBreach: (n) => `Превышение: ${n}`,
    targetRemaining: (n) => `Осталось набрать: ${n}`,
    targetDone: (n) => `Прибыль сверх таргета: ${n}`,
    daysRemaining: (n) => `Осталось дней: ${n}`,
    daysDone: "Минимум пройден",
    floorLabel: (n) => `Граница: ${n}`,
    notApplicable: "Не применяется для этой фирмы",
    disclaimer: "Это ориентировочная проверка по общедоступным правилам на момент сбора данных — правила пропфирм меняются, и точный расчёт (особенно тип просадки — статическая или трейлинг, и момент фиксации дня) может отличаться. Перед принятием решений сверяйтесь с личным кабинетом и актуальными условиями на сайте фирмы.",
    topstepNote: "Topstep пока не поддерживается — у него лимиты в фиксированных долларах по каждому размеру счёта, а не в процентах, и это отдельная модель расчёта.",
    seeAllLink: "Смотреть все пропфирмы в сравнении →",
    locale: "ru-RU",
    currency: "$",
  },
  en: {
    firmLabel: "Prop firm",
    evalLabel: "Evaluation format",
    phaseLabel: "Current phase",
    phaseN: (n) => `Phase ${n}`,
    initialBalanceLabel: "Starting account size, $",
    highestEodLabel: "Highest end-of-day equity ever reached, $",
    highestEodHint: "This firm's drawdown trails your best result, not your starting balance. If you haven't had a profitable day yet, enter your starting balance.",
    todayStartLabel: "Balance at the start of today's trading day, $",
    currentEquityLabel: "Current equity right now, $",
    daysLabel: "Trading days completed so far",
    calcButton: "Check",
    noDailyLimit: "No daily drawdown limit",
    resultHeading: "Check results",
    statusOk: "OK",
    statusBreach: "Breached",
    statusPending: "Not yet",
    statusReached: "Reached",
    dailyRow: "Daily drawdown limit",
    totalRow: "Overall drawdown limit",
    targetRow: (n) => `Profit target — Phase ${n}`,
    daysRow: "Minimum trading days",
    marginOk: (n) => `Buffer: ${n}`,
    marginBreach: (n) => `Over by: ${n}`,
    targetRemaining: (n) => `Still needed: ${n}`,
    targetDone: (n) => `Profit above target: ${n}`,
    daysRemaining: (n) => `Days remaining: ${n}`,
    daysDone: "Minimum met",
    floorLabel: (n) => `Floor: ${n}`,
    notApplicable: "Not applicable for this firm",
    disclaimer: "This is an approximate check against publicly available rules as of when the data was collected — prop firm rules change, and the exact mechanics (especially static vs. trailing drawdown, and when the trading day resets) can differ. Confirm against your dashboard and the firm's current terms before making decisions.",
    topstepNote: "Topstep isn't supported yet — its limits are fixed dollar amounts per account size rather than percentages, which needs a different calculation model.",
    seeAllLink: "See all prop firms compared →",
    locale: "en-US",
    currency: "$",
  },
};

function getComplianceLang() {
  return document.documentElement.lang === "en" ? "en" : "ru";
}

function ccFormatMoney(n, t) {
  const sign = n < 0 ? "-" : "";
  return sign + t.currency + Math.abs(n).toLocaleString(t.locale, { maximumFractionDigits: 0 });
}

function initComplianceCheck(rootId) {
  const root = document.getElementById(rootId);
  if (!root || typeof PROP_FIRMS === "undefined") return;
  const t = COMPLIANCE_STRINGS[getComplianceLang()];
  const firmSlugs = Object.keys(COMPLIANCE_RULES);

  function firmName(slug) {
    const f = PROP_FIRMS.find((x) => x.slug === slug);
    return f ? f.name : slug;
  }

  root.innerHTML = `
    <div class="calc-form">
      <div class="calc-field">
        <label for="cc-firm">${t.firmLabel}</label>
        <select id="cc-firm">
          ${firmSlugs.map((s) => `<option value="${s}">${firmName(s)}</option>`).join("")}
        </select>
      </div>
      <div class="calc-field">
        <label for="cc-eval">${t.evalLabel}</label>
        <select id="cc-eval"></select>
      </div>
      <div class="calc-field" id="cc-phase-wrap" hidden>
        <label for="cc-phase">${t.phaseLabel}</label>
        <select id="cc-phase"></select>
      </div>
      <div class="calc-field">
        <label for="cc-initial">${t.initialBalanceLabel}</label>
        <input type="number" id="cc-initial" min="0" step="1" value="10000">
      </div>
      <div class="calc-field cc-hint-field" id="cc-eod-wrap" hidden>
        <label for="cc-eod">${t.highestEodLabel}</label>
        <input type="number" id="cc-eod" min="0" step="1" value="10000">
        <p class="cc-hint">${t.highestEodHint}</p>
      </div>
      <div class="calc-field" id="cc-today-wrap" hidden>
        <label for="cc-today">${t.todayStartLabel}</label>
        <input type="number" id="cc-today" min="0" step="1" value="10000">
      </div>
      <div class="calc-field">
        <label for="cc-equity">${t.currentEquityLabel}</label>
        <input type="number" id="cc-equity" min="0" step="1" value="10500">
      </div>
      <div class="calc-field" id="cc-days-wrap" hidden>
        <label for="cc-days">${t.daysLabel}</label>
        <input type="number" id="cc-days" min="0" step="1" value="0">
      </div>
      <button type="button" class="calc-submit" id="cc-calc">${t.calcButton}</button>
    </div>
    <div class="calc-result" id="cc-results"></div>
    <p class="calc-disclaimer">${t.disclaimer}</p>
  `;

  const firmSelect = document.getElementById("cc-firm");
  const evalSelect = document.getElementById("cc-eval");
  const phaseWrap = document.getElementById("cc-phase-wrap");
  const phaseSelect = document.getElementById("cc-phase");
  const eodWrap = document.getElementById("cc-eod-wrap");
  const todayWrap = document.getElementById("cc-today-wrap");
  const daysWrap = document.getElementById("cc-days-wrap");

  function currentRule() {
    const firm = firmSelect.value;
    const evalType = evalSelect.value;
    const rule = COMPLIANCE_RULES[firm] && COMPLIANCE_RULES[firm][evalType];
    return rule;
  }

  function populateEvalOptions() {
    const firm = firmSelect.value;
    const types = Object.keys(COMPLIANCE_RULES[firm]);
    evalSelect.innerHTML = types.map((tp) => `<option value="${tp}">${tp}</option>`).join("");
    populatePhaseOptions();
  }

  function populatePhaseOptions() {
    const rule = currentRule();
    if (!rule) return;
    if (rule.phases.length > 1) {
      phaseWrap.hidden = false;
      phaseSelect.innerHTML = rule.phases.map((_, i) => `<option value="${i}">${t.phaseN(i + 1)}</option>`).join("");
    } else {
      phaseWrap.hidden = true;
      phaseSelect.innerHTML = `<option value="0">${t.phaseN(1)}</option>`;
    }
    updateFieldVisibility();
  }

  function updateFieldVisibility() {
    const rule = currentRule();
    if (!rule) return;
    eodWrap.hidden = !(rule.total && rule.total.basis === "trailing-eod");
    todayWrap.hidden = !rule.daily;
    daysWrap.hidden = !(rule.minDays > 0);
  }

  firmSelect.addEventListener("change", populateEvalOptions);
  evalSelect.addEventListener("change", populatePhaseOptions);
  phaseSelect.addEventListener("change", updateFieldVisibility);

  populateEvalOptions();

  function statusPill(kind, label) {
    return `<span class="cc-status cc-status--${kind}">${label}</span>`;
  }

  function renderRow(label, pillHtml, subText) {
    return `
      <div class="cc-result-row">
        <div class="cc-result-row-top">
          <span class="cc-result-label">${label}</span>
          ${pillHtml}
        </div>
        ${subText ? `<div class="cc-result-sub">${subText}</div>` : ""}
      </div>
    `;
  }

  function calculate() {
    const rule = currentRule();
    if (!rule) return;
    const initial = parseFloat(document.getElementById("cc-initial").value) || 0;
    const eod = parseFloat(document.getElementById("cc-eod").value) || initial;
    const todayStart = parseFloat(document.getElementById("cc-today").value) || initial;
    const equity = parseFloat(document.getElementById("cc-equity").value) || 0;
    const days = parseFloat(document.getElementById("cc-days").value) || 0;
    const phaseIndex = parseInt(phaseSelect.value, 10) || 0;
    const phase = rule.phases[phaseIndex];

    const rows = [];

    // Daily drawdown
    if (rule.daily) {
      const dailyBasisValue = rule.daily.basis === "trailing-eod" ? eod : todayStart;
      const dailyFloor = dailyBasisValue * (1 - rule.daily.pct / 100);
      const ok = equity >= dailyFloor;
      rows.push(
        renderRow(
          `${t.dailyRow} (${rule.daily.pct}%)`,
          statusPill(ok ? "ok" : "bad", ok ? t.statusOk : t.statusBreach),
          `${t.floorLabel(ccFormatMoney(dailyFloor, t))} · ${ok ? t.marginOk(ccFormatMoney(equity - dailyFloor, t)) : t.marginBreach(ccFormatMoney(dailyFloor - equity, t))}`
        )
      );
    } else {
      rows.push(renderRow(t.dailyRow, statusPill("neutral", t.noDailyLimit), null));
    }

    // Total drawdown
    const totalBasisValue = rule.total.basis === "trailing-eod" ? eod : initial;
    const totalFloor = totalBasisValue * (1 - rule.total.pct / 100);
    const totalOk = equity >= totalFloor;
    rows.push(
      renderRow(
        `${t.totalRow} (${rule.total.pct}%)`,
        statusPill(totalOk ? "ok" : "bad", totalOk ? t.statusOk : t.statusBreach),
        `${t.floorLabel(ccFormatMoney(totalFloor, t))} · ${totalOk ? t.marginOk(ccFormatMoney(equity - totalFloor, t)) : t.marginBreach(ccFormatMoney(totalFloor - equity, t))}`
      )
    );

    // Profit target
    const profit = equity - initial;
    const targetAmount = initial * (phase.target / 100);
    const targetReached = profit >= targetAmount;
    rows.push(
      renderRow(
        `${t.targetRow(phaseIndex + 1)} (${phase.target}%)`,
        statusPill(targetReached ? "ok" : "warn", targetReached ? t.statusReached : t.statusPending),
        targetReached ? t.targetDone(ccFormatMoney(profit - targetAmount, t)) : t.targetRemaining(ccFormatMoney(targetAmount - profit, t))
      )
    );

    // Minimum trading days
    if (rule.minDays > 0) {
      const daysOk = days >= rule.minDays;
      rows.push(
        renderRow(
          `${t.daysRow} (${rule.minDays})`,
          statusPill(daysOk ? "ok" : "warn", daysOk ? t.statusReached : t.statusPending),
          daysOk ? t.daysDone : t.daysRemaining(rule.minDays - days)
        )
      );
    }

    document.getElementById("cc-results").innerHTML = `
      <div class="cc-result-card">
        <h3>${t.resultHeading}</h3>
        ${rows.join("")}
      </div>
    `;
  }

  document.getElementById("cc-calc").addEventListener("click", calculate);
  calculate();
}
