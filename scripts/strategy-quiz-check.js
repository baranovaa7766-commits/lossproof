// Самопроверка квиза «Подбор стратегии». Запуск: открыть /strategy/ (или
// /en/strategy/), вставить содержимое файла в консоль браузера. Возвращает
// список проблем (пустой массив — всё хорошо).
//
// Главное — правила безопасности на ВСЕХ сочетаниях ответов (перебор ~737
// тысяч вариантов): новичку, тому, кто вкладывает большую часть сбережений,
// кто продаст всё на просадке или не хочет плеча, никогда не выпадают
// стратегии с плечом и рискованные режимы. Плюс полнота текстов, списки бирж
// под каждую стратегию и сквозной проход по интерфейсу.
(async () => {
  const problems = [];
  const warn = [];
  const add = (msg) => { if (problems.length < 50) problems.push(msg); };
  const t = QUIZ_STRINGS[getQuizLang()];
  const FUTURES = STRATEGY_ORDER.filter((id) => STRATEGY_RULES[id].futures);

  // 1) Полнота текстов и настроек.
  STRATEGY_ORDER.forEach((id) => {
    const s = STRATEGIES[id];
    if (!s) return add(`нет текста стратегии ${id}`);
    ["name", "tagline", "summary", "time", "firstStep"].forEach((k) => { if (!s[k]) add(`${id}: пустое поле ${k}`); });
    ["skills", "mistakes", "cautions"].forEach((k) => { if (!Array.isArray(s[k]) || !s[k].length) add(`${id}: пустой список ${k}`); });
    if (!STRATEGY_EXCHANGE_NEEDS[id]) add(`${id}: нет STRATEGY_EXCHANGE_NEEDS`);
    STRATEGY_EXCHANGE_NEEDS[id].show.forEach((k) => { if (!t.features[k]) add(`${id}: нет подписи для ${k}`); });
  });
  Object.keys(STRATEGIES).forEach((id) => { if (!STRATEGY_RULES[id]) add(`лишний текст стратегии ${id}`); });
  QUIZ_QUESTIONS.forEach((q) => {
    const qs = t.questions[q.id];
    if (!qs || !qs.title) return add(`нет текста вопроса ${q.id}`);
    if (qs.options.length !== q.options.length) add(`${q.id}: подписей ${qs.options.length}, вариантов ${q.options.length}`);
  });
  Object.keys(t.excludedReasons).forEach((r) => { if (typeof t.excludedReasons[r] !== "function") add(`причина ${r} не функция`); });

  // 2) Стоп-экраны.
  if (recommendStrategies({ age: "minor" }).stop !== "minor") add("минор не останавливает квиз");
  if (recommendStrategies({ age: "adult", money: "credit" }).stop !== "credit") add("кредитные средства не останавливают квиз");

  // 3) Полный перебор.
  const opts = (id) => QUIZ_QUESTIONS.find((q) => q.id === id).options;
  const top = {};
  const seen = {};
  let combos = 0;
  const started = performance.now();
  for (const money of ["spare", "notable", "major"])
  for (const experience of opts("experience"))
  for (const goal of opts("goal"))
  for (const time of opts("time"))
  for (const horizon of opts("horizon"))
  for (const drawdown of opts("drawdown"))
  for (const leverage of opts("leverage"))
  for (const style of opts("style"))
  for (const analysis of opts("analysis"))
  for (const capital of opts("capital")) {
    combos++;
    const a = { age: "adult", country: "other", money, experience, goal, time, horizon, drawdown, leverage, style, analysis, capital };
    const r = recommendStrategies(a);
    const key = JSON.stringify(a);
    if (r.stop) { add(`стоп без причины: ${key}`); continue; }
    const res = r.results;
    if (res.length < 1 || res.length > 3) add(`результатов ${res.length}: ${key}`);
    if (new Set(res).size !== res.length) add(`повтор в результатах: ${key}`);
    // В «исключённых» — ровно те, что недоступны по правилам; подходящие, но
    // не вошедшие в тройку, законно не попадают ни туда, ни в результат.
    const mustExclude = STRATEGY_ORDER.filter((id) => ineligibleReason(id, a));
    if (mustExclude.length !== r.excluded.length || !mustExclude.every((id) => r.excluded.some((e) => e.id === id)))
      add(`список исключённых не совпадает с правилами: ${key}`);
    res.forEach((id) => {
      seen[id] = (seen[id] || 0) + 1;
      if (ineligibleReason(id, a)) add(`${id} в результатах, но недоступна: ${key}`);
    });
    top[res[0]] = (top[res[0]] || 0) + 1;

    const has = (ids) => res.some((id) => ids.includes(id));
    if (experience === 0 && has(["futuresSwing", "dayTrading", "scalping", "fundingArb", "copyTrading", "dcaBot", "gridBot", "rebalanceBot"]))
      add(`новичку выпало рискованное (${res}): ${key}`);
    if (experience < 3 && has(["dayTrading", "scalping"])) add(`дейтрейдинг/скальпинг без опыта фьючерсов (${res}): ${key}`);
    if (money === "major" && has(FUTURES.concat(["copyTrading", "dcaBot"]))) add(`большая часть сбережений, но выпало ${res}: ${key}`);
    if (drawdown === "sell" && res.some((id) => !["dca", "earn"].includes(id))) add(`«продам всё», но выпало ${res}: ${key}`);
    if (leverage === "never" && has(FUTURES)) add(`без плеча, но выпало ${res}: ${key}`);
    if (time === 0 && has(["spotSwing", "futuresSwing", "dayTrading", "scalping", "gridBot", "dcaBot", "copyTrading", "fundingArb"]))
      add(`нет времени, но выпало ${res}: ${key}`);
  }
  const ms = Math.round(performance.now() - started);
  STRATEGY_ORDER.forEach((id) => {
    if (!seen[id]) add(`стратегия ${id} не выпадает ни при каких ответах`);
    if (!top[id]) warn.push(`${id} ни разу не выходит на первое место`);
  });

  // 4) Биржи под каждую стратегию.
  for (const id of STRATEGY_ORDER) {
    for (const country of ["ru", "other"]) {
      const list = rankExchangesForStrategy(id, country);
      if (list.length === 0) add(`${id} (${country}): нет ни одной биржи`);
      else if (list.length < 2) warn.push(`${id} (${country}): только ${list.length} биржа`);
      if (country === "ru") {
        const firstGrey = list.findIndex((e) => e.ruAccessTier !== "open");
        if (firstGrey !== -1 && list.slice(firstGrey).some((e) => e.ruAccessTier === "open")) add(`${id} (ru): серая зона выше открытой биржи`);
      }
    }
  }

  // 5) Сквозной проход по интерфейсу.
  const root = document.getElementById("strategy-quiz");
  const click = (sel) => { const el = root.querySelector(sel); if (!el) throw new Error(`нет элемента ${sel}`); el.click(); };
  const pick = (i) => click(`[data-index="${i}"]`);
  try {
    click('[data-action="restart"]');
  } catch (e) { /* квиз уже в начале */ }
  try {
    // Стоп по кредитным средствам и возврат к вопросу.
    pick(0); pick(0); pick(3);
    if (!root.querySelector(".sq-stop")) add("UI: нет стоп-экрана для кредитных средств");
    click('[data-action="back"]');
    const progressIs = (n) => root.querySelector(".sq-progress").textContent.includes(t.progress(n, QUIZ_QUESTIONS.length));
    if (!root.querySelector("[data-index]") || !progressIs(3)) add("UI: «Изменить ответ» не вернул к вопросу 3");
    // Полный путь с вопроса 3: небольшая часть средств, опыт фьючерсов, цель —
    // трейдинг, пара часов в неделю, 6–24 месяца, действую по плану, небольшое
    // плечо, решаю сам, графики, $1 000–10 000.
    pick(0); pick(3); pick(2); pick(1); pick(2); pick(3); pick(1); pick(0); pick(0); pick(2);
    const cards = root.querySelectorAll(".sq-strategy");
    if (!cards.length) add("UI: нет карточек результата");
    if (!root.querySelector(".disclaimer-box")) add("UI: нет плашки «не индивидуальная рекомендация»");
    if (!root.querySelector(".sq-exchange")) add("UI: нет карточек бирж");
    if (root.querySelector('a[rel~="sponsored"]')) add("UI: в квизе есть партнёрская ссылка");
    if (/undefined|NaN|null/.test(root.innerText)) add("UI: мусор в тексте результата");
    click('[data-action="restart"]');
    if (!progressIs(1)) add("UI: «Пройти заново» не вернул к первому вопросу");
  } catch (e) {
    add(`UI: ${e.message}`);
  }

  console.log(`Перебрано сочетаний: ${combos} за ${ms} мс`);
  console.log("Первое место по стратегиям:", top);
  if (warn.length) console.log("Замечания (не ошибки):", warn);
  console.log(problems.length ? problems : "Подбор стратегии: все проверки пройдены");
  return problems;
})();
