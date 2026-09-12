// Виджет «Подбор пропфирмы» (/match/): пошаговый квиз — вопросы появляются
// по одному, каждый следующий открывается только после ответа на
// предыдущий. Когда отвечено на все, становится доступна кнопка «Подобрать
// пропфирму», которая считает совпадение с каждой фирмой из PROP_FIRMS
// (assets/js/data.js / data.en.js) и показывает 1-3 лучших варианта с
// честной раскладкой, что именно совпало, а что нет.
//
// Никаких внешних курсов/API — вся логика статична и детерминирована,
// в отличие от калькулятора переводов. Рынок (форекс/фьючерсы) — единственный
// жёсткий фильтр (Topstep — единственная фьючерсная фирма в PROP_FIRMS, и
// нет смысла предлагать форекс-трейдеру фьючерсную фирму или наоборот); всё
// остальное — взвешенное совпадение, чтобы квиз всегда показывал результат,
// даже если ни одна фирма не подходит идеально.

const MATCH_STRINGS = {
  ru: {
    qMarket: "Какой рынок вы торгуете?",
    marketForex: "Форекс, индексы, металлы, крипто-CFD",
    marketFutures: "Фьючерсы",
    qCrypto: "Как планируете выводить прибыль?",
    cryptoRequired: "Обязательно криптой — карта не подходит/недоступна",
    cryptoAny: "Без разницы, главное дешевле и быстрее",
    qEval: "Какой формат оценки предпочитаете?",
    evalAny: "Не важно, любой вариант",
    eval1: "1-step — быстрее, но правила жёстче",
    eval2: "2-step — дольше, но условия мягче",
    qTrust: "Насколько важна репутация фирмы?",
    trustProven: "Только проверенные лидеры с многолетней историей",
    trustOpen: "Готов рассмотреть и более молодые фирмы, если условия интереснее",
    qBudget: "Бюджет на вход в оценку (за минимальный размер счёта)?",
    budget50: "До $50",
    budget100: "$50–100",
    budgetAny: "$100 и выше, бюджет не ограничен",
    changeAnswer: "Изменить ответ",
    submitButton: "Подобрать пропфирму",
    resultsHeading: "Результат подбора",
    matchScore: (matched, total) => `${matched} из ${total} критериев совпало`,
    bestBadge: "Лучше всего подходит",
    reasonCryptoYes: "Принимает выплаты криптой",
    reasonCryptoNo: "Не принимает выплаты криптой",
    reasonCryptoNeutral: (has) => (has ? "Принимает выплаты криптой" : "Крипто-выплат нет"),
    reasonEvalYes: (type) => `Есть нужный формат оценки (${type})`,
    reasonEvalNo: (type) => `Нет формата ${type} — только ${type === "1-step" ? "2-step" : "1-step"}`,
    reasonEvalNeutral: (types) => `Формат оценки: ${types}`,
    reasonTrustYes: "Проверенный лидер с многолетней историей",
    reasonTrustNo: "Молодая фирма или небольшая история отзывов",
    reasonTrustNeutral: (founded) => `На рынке с ${founded} года`,
    reasonBudgetYes: (price) => `Вход: ${price} — в рамках бюджета`,
    reasonBudgetNo: (price) => `Вход: ${price} — дороже вашего бюджета`,
    entryLabel: "Стоимость входа:",
    splitLabel: "Профит-сплит:",
    trustpilotLabel: "Trustpilot:",
    trustpilotHidden: "рейтинг скрыт",
    payoutLabel: "Вывод денег →",
    firmPageLabel: "Подробнее о фирме →",
    disclaimer: "Это ориентир на основе открытых данных, а не финансовая рекомендация — перед оплатой оценки сверьте актуальные условия и отзывы напрямую на сайте фирмы.",
    seeAllLink: "Смотреть полное сравнение всех пропфирм →",
    locale: "ru-RU",
  },
  en: {
    qMarket: "Which market do you trade?",
    marketForex: "Forex, indices, metals, crypto CFDs",
    marketFutures: "Futures",
    qCrypto: "How do you plan to withdraw profit?",
    cryptoRequired: "It has to be crypto — cards don't work / aren't available",
    cryptoAny: "Doesn't matter, just want it cheap and fast",
    qEval: "Which evaluation format do you prefer?",
    evalAny: "Doesn't matter, either works",
    eval1: "1-step — faster, but stricter rules",
    eval2: "2-step — slower, but easier rules",
    qTrust: "How much does the firm's track record matter?",
    trustProven: "Only proven leaders with a long track record",
    trustOpen: "Open to newer firms if the terms are better",
    qBudget: "Budget for the evaluation fee (smallest account size)?",
    budget50: "Under $50",
    budget100: "$50-100",
    budgetAny: "$100+, no hard budget limit",
    changeAnswer: "Change answer",
    submitButton: "Find my prop firm",
    resultsHeading: "Your matches",
    matchScore: (matched, total) => `${matched} of ${total} criteria matched`,
    bestBadge: "Best match",
    reasonCryptoYes: "Pays out via crypto",
    reasonCryptoNo: "Doesn't pay out via crypto",
    reasonCryptoNeutral: (has) => (has ? "Pays out via crypto" : "No crypto payout"),
    reasonEvalYes: (type) => `Offers the format you want (${type})`,
    reasonEvalNo: (type) => `No ${type} — only ${type === "1-step" ? "2-step" : "1-step"}`,
    reasonEvalNeutral: (types) => `Evaluation format: ${types}`,
    reasonTrustYes: "Proven leader with a long track record",
    reasonTrustNo: "Newer firm or a smaller review history",
    reasonTrustNeutral: (founded) => `Operating since ${founded}`,
    reasonBudgetYes: (price) => `Entry: ${price} — within your budget`,
    reasonBudgetNo: (price) => `Entry: ${price} — above your budget`,
    entryLabel: "Entry cost:",
    splitLabel: "Profit split:",
    trustpilotLabel: "Trustpilot:",
    trustpilotHidden: "rating hidden",
    payoutLabel: "How to withdraw →",
    firmPageLabel: "More about this firm →",
    disclaimer: "This is a guide based on public data, not financial advice — verify current terms and reviews directly on the firm's site before paying for an evaluation.",
    seeAllLink: "See the full prop firm comparison →",
    locale: "en-US",
  },
};

function getMatchLang() {
  return document.documentElement.lang === "en" ? "en" : "ru";
}

function matchPropFirmsBase() {
  return getMatchLang() === "en" ? "/en/prop-firms/" : "/prop-firms/";
}

function matchPayoutBase() {
  return getMatchLang() === "en" ? "/en/payout/" : "/payout/";
}

function escapeMatch(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

function firmHasCrypto(firm) {
  return firm.payoutMethods.some((m) => /крипто|crypto|usdt|usdc/i.test(m));
}

function firmIsProven(firm) {
  return (firm.founded && firm.founded <= 2018) || (firm.trustpilotScore != null && firm.trustpilotScore >= 4.5 && firm.trustpilotReviews >= 10000);
}

function evalTypesLabel(firm, t) {
  return firm.evaluationTypes.join(", ");
}

function getMatchQuestions(t) {
  return [
    { id: "market", label: t.qMarket, options: [
      { value: "forex", label: t.marketForex },
      { value: "futures", label: t.marketFutures },
    ] },
    { id: "crypto", label: t.qCrypto, options: [
      { value: "required", label: t.cryptoRequired },
      { value: "any", label: t.cryptoAny },
    ] },
    { id: "evalType", label: t.qEval, options: [
      { value: "1-step", label: t.eval1 },
      { value: "2-step", label: t.eval2 },
      { value: "any", label: t.evalAny },
    ] },
    { id: "trust", label: t.qTrust, options: [
      { value: "proven", label: t.trustProven },
      { value: "open", label: t.trustOpen },
    ] },
    { id: "budget", label: t.qBudget, options: [
      { value: "50", label: t.budget50 },
      { value: "100", label: t.budget100 },
      { value: "999999", label: t.budgetAny },
    ] },
  ];
}

function initFirmMatch(rootId) {
  const root = document.getElementById(rootId);
  if (!root || typeof PROP_FIRMS === "undefined") return;
  const t = MATCH_STRINGS[getMatchLang()];
  const questions = getMatchQuestions(t);
  const answers = {};

  root.innerHTML = `
    <div class="match-steps"></div>
    <button type="button" class="calc-submit match-submit" hidden>${t.submitButton}</button>
    <div class="calc-result match-result" aria-live="polite"></div>
  `;

  const stepsEl = root.querySelector(".match-steps");
  const submitBtn = root.querySelector(".match-submit");
  const resultEl = root.querySelector(".match-result");

  function answeredCount() {
    return questions.filter((q) => answers[q.id] !== undefined).length;
  }

  function renderSteps() {
    const visibleCount = Math.min(answeredCount() + 1, questions.length);
    stepsEl.innerHTML = questions
      .slice(0, visibleCount)
      .map((q, i) => {
        const value = answers[q.id];
        return `
        <div class="match-step">
          <p class="match-step-label">${i + 1}. ${q.label}</p>
          <div class="match-options" role="group">
            ${q.options
              .map(
                (opt) => `
              <button type="button" class="match-option ${value === opt.value ? "match-option--selected" : ""}" data-question="${q.id}" data-value="${escapeMatch(opt.value)}">${opt.label}</button>`
              )
              .join("")}
          </div>
        </div>`;
      })
      .join("");

    stepsEl.querySelectorAll(".match-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        answers[btn.dataset.question] = btn.dataset.value;
        resultEl.innerHTML = "";
        renderSteps();
      });
    });

    submitBtn.hidden = answeredCount() < questions.length;
  }

  function scoreFirm(firm, ans) {
    let score = 0;
    let matched = 0;
    let total = 0;
    const rows = [];

    const hasCrypto = firmHasCrypto(firm);
    if (ans.crypto === "required") {
      total += 1;
      if (hasCrypto) {
        score += 3;
        matched += 1;
        rows.push({ ok: true, text: t.reasonCryptoYes });
      } else {
        score -= 4;
        rows.push({ ok: false, text: t.reasonCryptoNo });
      }
    } else {
      rows.push({ ok: null, text: t.reasonCryptoNeutral(hasCrypto) });
    }

    if (ans.evalType !== "any") {
      total += 1;
      if (firm.evaluationTypes.includes(ans.evalType)) {
        score += 2;
        matched += 1;
        rows.push({ ok: true, text: t.reasonEvalYes(ans.evalType) });
      } else {
        score -= 3;
        rows.push({ ok: false, text: t.reasonEvalNo(ans.evalType) });
      }
    } else {
      rows.push({ ok: null, text: t.reasonEvalNeutral(evalTypesLabel(firm, t)) });
    }

    const proven = firmIsProven(firm);
    if (ans.trust === "proven") {
      total += 1;
      if (proven) {
        score += 2;
        matched += 1;
        rows.push({ ok: true, text: t.reasonTrustYes });
      } else {
        score -= 2;
        rows.push({ ok: false, text: t.reasonTrustNo });
      }
    } else {
      rows.push({ ok: null, text: t.reasonTrustNeutral(firm.founded) });
    }

    if (typeof firm.entryFrom === "number") {
      total += 1;
      const priceText = escapeMatch(firm.entryText);
      if (firm.entryFrom <= Number(ans.budget)) {
        score += 2;
        matched += 1;
        rows.push({ ok: true, text: t.reasonBudgetYes(priceText) });
      } else {
        score -= 3;
        rows.push({ ok: false, text: t.reasonBudgetNo(priceText) });
      }
    }

    return { firm, score, matched, total, rows };
  }

  function trustpilotText(firm) {
    if (firm.trustpilotScore == null) return t.trustpilotHidden;
    return `${firm.trustpilotScore.toFixed(1)} / 5 (${firm.trustpilotReviews} ${getMatchLang() === "en" ? "reviews" : "отзывов"})`;
  }

  function renderResults() {
    const candidates = PROP_FIRMS.filter((f) => f.markets && f.markets.includes(answers.market));
    const scored = candidates.map((f) => scoreFirm(f, answers));
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 3);
    const best = top[0];
    const base = matchPropFirmsBase();

    resultEl.innerHTML = `
      <h2 class="match-heading">${t.resultsHeading}</h2>
      <div class="cmp-cards">
        ${top
          .map(
            (item) => `
          <article class="cmp-card ${item === best ? "match-best" : ""}">
            <h3 class="cmp-card-name">
              <a class="pf-name" href="${base}${item.firm.slug}/">${escapeMatch(item.firm.name)}</a>
              ${item === best ? `<span class="calc-badge">${t.bestBadge}</span>` : ""}
            </h3>
            <p class="match-score">${item.total > 0 ? t.matchScore(item.matched, item.total) : ""}</p>
            <dl class="cmp-fields match-reasons">
              ${item.rows
                .map(
                  (row) => `
                <div class="cmp-field">
                  <dt class="match-icon match-icon--${row.ok === true ? "yes" : row.ok === false ? "no" : "neutral"}">${row.ok === true ? "✓" : row.ok === false ? "✗" : "–"}</dt>
                  <dd>${row.text}</dd>
                </div>`
                )
                .join("")}
            </dl>
            <dl class="cmp-fields">
              <div class="cmp-field"><dt>${t.entryLabel}</dt><dd>${escapeMatch(item.firm.entryText)}</dd></div>
              <div class="cmp-field"><dt>${t.splitLabel}</dt><dd>${escapeMatch(item.firm.profitSplitText)}</dd></div>
              <div class="cmp-field"><dt>${t.trustpilotLabel}</dt><dd>${trustpilotText(item.firm)}</dd></div>
            </dl>
            <p class="cmp-card-cross">
              <a class="pf-cross" href="${base}${item.firm.slug}/">${t.firmPageLabel}</a>
              ${item.firm.payoutSlug ? `<a class="pf-cross" href="${matchPayoutBase()}${item.firm.payoutSlug}/">${t.payoutLabel}</a>` : ""}
            </p>
          </article>`
          )
          .join("")}
      </div>
      <p class="calc-disclaimer">${t.disclaimer}</p>
      <p><a href="${base}">${t.seeAllLink}</a></p>
    `;
    resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  submitBtn.addEventListener("click", renderResults);

  renderSteps();
}
