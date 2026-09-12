// Виджет «Подбор пропфирмы» (/match/): пользователь отвечает на несколько
// вопросов о своих предпочтениях, виджет считает совпадение с каждой фирмой
// из PROP_FIRMS (assets/js/data.js / data.en.js) и показывает 1-3 лучших
// варианта с честной раскладкой, что именно совпало, а что нет.
//
// Никаких внешних курсов/API — вся логика статична и детерминирована,
// в отличие от калькулятора переводов. Рынок (форекс/фьючерсы) — единственный
// жёсткий фильтр (Topstep — единственная фьючерсная фирма в PROP_FIRMS, и
// нет смысла предлагать форекс-трейдеру фьючерсную фирму или наоборот); всё
// остальное — взвешенное совпадение, чтобы квиз всегда показывал результат,
// даже если ни одна фирма не подходит идеально.

const MATCH_STRINGS = {
  ru: {
    heading: "Ответьте на несколько вопросов",
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
    heading: "Answer a few questions",
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

function initFirmMatch(rootId) {
  const root = document.getElementById(rootId);
  if (!root || typeof PROP_FIRMS === "undefined") return;
  const t = MATCH_STRINGS[getMatchLang()];

  root.innerHTML = `
    <form class="calc-form match-form">
      <h2 class="match-heading">${t.heading}</h2>
      <div class="calc-field">
        <label for="match-market">${t.qMarket}</label>
        <select id="match-market" name="market">
          <option value="forex">${t.marketForex}</option>
          <option value="futures">${t.marketFutures}</option>
        </select>
      </div>
      <div class="calc-field">
        <label for="match-crypto">${t.qCrypto}</label>
        <select id="match-crypto" name="crypto">
          <option value="any">${t.cryptoAny}</option>
          <option value="required">${t.cryptoRequired}</option>
        </select>
      </div>
      <div class="calc-field">
        <label for="match-eval">${t.qEval}</label>
        <select id="match-eval" name="evalType">
          <option value="any">${t.evalAny}</option>
          <option value="1-step">${t.eval1}</option>
          <option value="2-step">${t.eval2}</option>
        </select>
      </div>
      <div class="calc-field">
        <label for="match-trust">${t.qTrust}</label>
        <select id="match-trust" name="trust">
          <option value="open">${t.trustOpen}</option>
          <option value="proven">${t.trustProven}</option>
        </select>
      </div>
      <div class="calc-field">
        <label for="match-budget">${t.qBudget}</label>
        <select id="match-budget" name="budget">
          <option value="999999">${t.budgetAny}</option>
          <option value="50">${t.budget50}</option>
          <option value="100">${t.budget100}</option>
        </select>
      </div>
      <button type="submit" class="calc-submit">${t.submitButton}</button>
    </form>
    <div class="calc-result match-result" aria-live="polite"></div>
  `;

  const form = root.querySelector("form");
  const resultEl = root.querySelector(".match-result");

  function readAnswers() {
    const data = new FormData(form);
    return {
      market: data.get("market"),
      crypto: data.get("crypto"),
      evalType: data.get("evalType"),
      trust: data.get("trust"),
      budget: Number(data.get("budget")),
    };
  }

  function scoreFirm(firm, answers) {
    let score = 0;
    let matched = 0;
    let total = 0;
    const rows = [];

    const hasCrypto = firmHasCrypto(firm);
    if (answers.crypto === "required") {
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

    if (answers.evalType !== "any") {
      total += 1;
      if (firm.evaluationTypes.includes(answers.evalType)) {
        score += 2;
        matched += 1;
        rows.push({ ok: true, text: t.reasonEvalYes(answers.evalType) });
      } else {
        score -= 3;
        rows.push({ ok: false, text: t.reasonEvalNo(answers.evalType) });
      }
    } else {
      rows.push({ ok: null, text: t.reasonEvalNeutral(evalTypesLabel(firm, t)) });
    }

    const proven = firmIsProven(firm);
    if (answers.trust === "proven") {
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
      if (firm.entryFrom <= answers.budget) {
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

  function render(answers) {
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
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    render(readAnswers());
  });

  // Считаем сразу при загрузке с настройками по умолчанию, чтобы виджет не
  // был пустым (тот же принцип, что у calculator.js).
  render(readAnswers());
}
