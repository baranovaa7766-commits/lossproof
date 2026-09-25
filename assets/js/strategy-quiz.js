// Квиз «Подбор стратегии» (/strategy/ и /en/strategy/).
//
// Человек отвечает на 12 вопросов по одному, квиз подбирает 1–3 стратегии
// работы с криптовалютой и показывает, какие инструменты для них нужны от
// площадки. Всё считается в браузере: ответы никуда не отправляются и не
// сохраняются.
//
// Здесь — логика и правила: один источник для RU и EN. Тексты стратегий — в
// STRATEGIES (assets/js/data.js / data.en.js).
//
// Безопасность (утверждено владельцем сайта 2026-09-23, «максимально
// обезопасить» при прямой формулировке результата):
// 1) Стоп-экраны: младше 18 лет; кредитные средства или финансовая подушка.
// 2) Жёсткие фильтры до подсчёта баллов: стратегии с фьючерсами — только при
//    опыте, согласии на плечо, спокойной реакции на просадку и если это не
//    большая часть сбережений (см. isEligible). Баллы не могут их обойти.
// 3) Никаких названий монет, прогнозов и цифр доходности — этого требуют и
//    правила рекламы криптовалют, и здравый смысл.
// 4) Квиз не называет и не подбирает конкретные биржи (с 2026-09-25): это
//    выглядело бы как реклама иностранных криптобирж, которую в РФ размещать
//    нельзя. Вместо этого — список нужных инструментов и ссылка на общее
//    нейтральное сравнение бирж.
// Инварианты проверяет scripts/strategy-quiz-check.js (перебор всех
// сочетаний ответов) — запускайте его после любых правок правил.

// --------------------------------------------------------------------------
// Вопросы. Значения порядковых вопросов — числа (уровни), остальных — строки.
// Подписи вариантов — в QUIZ_STRINGS[lang].questions[id].options, в том же
// порядке, что и options здесь.
// --------------------------------------------------------------------------
const QUIZ_QUESTIONS = [
  { id: "age", options: ["adult", "minor"] },
  { id: "country", options: ["ru", "by", "kz", "cis", "other"] },
  { id: "money", options: ["spare", "notable", "major", "credit"] },
  { id: "experience", options: [0, 1, 2, 3] },
  { id: "goal", options: ["grow", "income", "career", "learn", "passive"] },
  { id: "time", options: [0, 1, 2, 3] },
  { id: "horizon", options: [0, 1, 2, 3] },
  { id: "drawdown", options: ["sell", "wait", "buy", "plan"] },
  { id: "leverage", options: ["never", "small", "high"] },
  { id: "style", options: ["self", "rules", "delegate", "passive"] },
  { id: "analysis", options: ["charts", "news", "rules", "none"] },
  { id: "capital", options: [0, 1, 2, 3] },
];

// Какой ответ сразу останавливает квиз.
function quizStopReason(answers) {
  if (answers.age === "minor") return "minor";
  if (answers.money === "credit") return "credit";
  return null;
}

// --------------------------------------------------------------------------
// Правила стратегий.
//   risk            — 1..5, риск внутри крипторынка;
//   futures         — работает через фьючерсы (нужно согласие на плечо);
//   minExperience   — минимальный уровень вопроса experience (0..3);
//   minTime/minHorizon/minCapital — минимальные уровни одноимённых вопросов;
//   allowPanic      — доступна тому, кто на просадке 30% «продаст всё»;
//   allowMajorShare — доступна, если это «большая часть сбережений»;
//   score           — баллы 0..3 за ответы (массив — по уровню, объект — по
//                     значению; нет ключа — 0). Цель и стиль весят вдвое.
// --------------------------------------------------------------------------
const STRATEGY_RULES = {
  hodl: {
    risk: 3, futures: false, minExperience: 0, minTime: 0, minHorizon: 2, minCapital: 0, allowPanic: false, allowMajorShare: true,
    score: {
      goal: { grow: 3, passive: 2 }, time: [3, 1, 0, 0], horizon: [0, 0, 1, 3],
      style: { self: 1, passive: 3 }, analysis: { news: 3, none: 2 },
      drawdown: { wait: 2, buy: 2, plan: 1 }, capital: [1, 1, 1, 1],
    },
  },
  dca: {
    risk: 3, futures: false, minExperience: 0, minTime: 0, minHorizon: 1, minCapital: 0, allowPanic: true, allowMajorShare: true,
    score: {
      goal: { grow: 3, learn: 1, passive: 2 }, time: [3, 1, 0, 0], horizon: [0, 1, 2, 3],
      style: { rules: 2, passive: 3 }, analysis: { news: 1, rules: 2, none: 3 },
      drawdown: { sell: 1, wait: 2, buy: 3, plan: 1 }, capital: [2, 1, 1, 1],
    },
  },
  spotSwing: {
    risk: 3, futures: false, minExperience: 0, minTime: 1, minHorizon: 0, minCapital: 0, allowPanic: false, allowMajorShare: true,
    score: {
      goal: { grow: 1, income: 1, career: 2, learn: 3 }, time: [0, 3, 2, 1], horizon: [1, 3, 1, 0],
      style: { self: 3, rules: 1 }, analysis: { charts: 3, news: 2, rules: 1 },
      drawdown: { wait: 1, buy: 1, plan: 3 }, capital: [1, 1, 1, 1],
    },
  },
  futuresSwing: {
    risk: 4, futures: true, minExperience: 2, minTime: 1, minHorizon: 0, minCapital: 1, allowPanic: false, allowMajorShare: false,
    score: {
      goal: { income: 1, career: 3, learn: 1 }, time: [0, 3, 2, 1], horizon: [1, 3, 1, 0],
      style: { self: 3 }, analysis: { charts: 3, news: 1, rules: 1 },
      drawdown: { wait: 1, buy: 1, plan: 3 }, capital: [0, 1, 2, 2],
    },
  },
  dayTrading: {
    risk: 5, futures: true, minExperience: 3, minTime: 2, minHorizon: 0, minCapital: 1, allowPanic: false, allowMajorShare: false,
    score: {
      goal: { income: 1, career: 3, learn: 1 }, time: [0, 0, 3, 2], horizon: [3, 2, 0, 0],
      style: { self: 3 }, analysis: { charts: 3, rules: 1 },
      drawdown: { plan: 3 }, capital: [0, 1, 2, 2],
    },
  },
  scalping: {
    risk: 5, futures: true, minExperience: 3, minTime: 3, minHorizon: 0, minCapital: 1, allowPanic: false, allowMajorShare: false,
    score: {
      goal: { income: 1, career: 3 }, time: [0, 0, 1, 3], horizon: [3, 1, 0, 0],
      style: { self: 3 }, analysis: { charts: 3, rules: 1 },
      drawdown: { plan: 3 }, capital: [0, 1, 2, 2],
    },
  },
  gridBot: {
    risk: 3, futures: false, minExperience: 1, minTime: 1, minHorizon: 1, minCapital: 1, allowPanic: false, allowMajorShare: true,
    score: {
      goal: { grow: 1, income: 3, learn: 1, passive: 1 }, time: [0, 3, 1, 0], horizon: [0, 3, 2, 1],
      style: { rules: 3, delegate: 1, passive: 1 }, analysis: { charts: 1, rules: 3, none: 1 },
      drawdown: { wait: 1, buy: 2, plan: 2 }, capital: [0, 1, 2, 3],
    },
  },
  dcaBot: {
    risk: 4, futures: false, minExperience: 1, minTime: 1, minHorizon: 1, minCapital: 1, allowPanic: false, allowMajorShare: false,
    score: {
      goal: { grow: 1, income: 2, learn: 1, passive: 1 }, time: [0, 3, 1, 0], horizon: [1, 3, 1, 0],
      style: { rules: 3, passive: 1 }, analysis: { charts: 1, rules: 3, none: 1 },
      drawdown: { wait: 1, buy: 3, plan: 2 }, capital: [0, 1, 2, 2],
    },
  },
  rebalanceBot: {
    risk: 3, futures: false, minExperience: 1, minTime: 0, minHorizon: 2, minCapital: 1, allowPanic: false, allowMajorShare: true,
    score: {
      goal: { grow: 2, passive: 3 }, time: [3, 2, 0, 0], horizon: [0, 0, 2, 3],
      style: { rules: 2, delegate: 1, passive: 2 }, analysis: { news: 1, rules: 2, none: 2 },
      drawdown: { wait: 2, buy: 2, plan: 1 }, capital: [0, 1, 2, 3],
    },
  },
  copyTrading: {
    risk: 4, futures: false, minExperience: 1, minTime: 1, minHorizon: 0, minCapital: 1, allowPanic: false, allowMajorShare: false,
    score: {
      goal: { grow: 1, income: 2, learn: 1, passive: 2 }, time: [0, 3, 1, 0], horizon: [1, 3, 1, 0],
      style: { delegate: 3, passive: 1 }, analysis: { none: 3 },
      drawdown: { wait: 1, buy: 1, plan: 2 }, capital: [0, 1, 2, 2],
    },
  },
  earn: {
    risk: 2, futures: false, minExperience: 0, minTime: 0, minHorizon: 0, minCapital: 0, allowPanic: true, allowMajorShare: true,
    score: {
      goal: { grow: 1, income: 2, passive: 3 }, time: [3, 1, 0, 0], horizon: [2, 2, 1, 1],
      style: { rules: 1, delegate: 1, passive: 3 }, analysis: { rules: 1, none: 3 },
      drawdown: { sell: 2, wait: 2, buy: 1, plan: 1 }, capital: [1, 1, 1, 1],
    },
  },
  fundingArb: {
    risk: 3, futures: true, minExperience: 2, minTime: 1, minHorizon: 1, minCapital: 2, allowPanic: false, allowMajorShare: false,
    score: {
      goal: { career: 1, income: 3, passive: 1 }, time: [0, 3, 2, 1], horizon: [0, 2, 3, 1],
      style: { self: 1, rules: 3 }, analysis: { rules: 3 },
      drawdown: { wait: 1, buy: 1, plan: 3 }, capital: [0, 0, 2, 3],
    },
  },
};

const STRATEGY_ORDER = Object.keys(STRATEGY_RULES);
const SCORE_WEIGHTS = { goal: 2, time: 1, horizon: 1, style: 2, analysis: 1, drawdown: 1, capital: 1 };
// Кроме лидера показываем стратегии, набравшие не меньше этой доли его баллов
// (всего не больше трёх).
const RESULT_SHARE = 0.8;
const RESULT_MAX = 3;

// Почему стратегия недоступна при этих ответах; null — доступна. Порядок
// проверок задаёт, какую причину увидит человек, если их несколько.
function ineligibleReason(id, a) {
  const r = STRATEGY_RULES[id];
  if (a.drawdown === "sell" && !r.allowPanic) return "panic";
  if (a.money === "major" && !r.allowMajorShare) return "majorShare";
  if (r.futures && a.leverage === "never") return "leverage";
  if (a.experience < r.minExperience) return "experience";
  if (a.time < r.minTime) return "time";
  if (a.capital < r.minCapital) return "capital";
  if (a.horizon < r.minHorizon) return "horizon";
  return null;
}

function strategyPoints(id, dim, a) {
  const table = STRATEGY_RULES[id].score[dim];
  if (!table) return 0;
  const v = Array.isArray(table) ? table[a[dim]] : table[a[dim]];
  return v || 0;
}

function strategyScore(id, a) {
  return Object.keys(SCORE_WEIGHTS).reduce((sum, dim) => sum + SCORE_WEIGHTS[dim] * strategyPoints(id, dim, a), 0);
}

// Главная функция подбора. Без DOM — её же гоняет самопроверка.
// Возвращает { stop } или { results: [id…], excluded: [{ id, reason }…] }.
function recommendStrategies(a) {
  const stop = quizStopReason(a);
  if (stop) return { stop };
  const eligible = [];
  const excluded = [];
  STRATEGY_ORDER.forEach((id) => {
    const reason = ineligibleReason(id, a);
    if (reason) excluded.push({ id, reason });
    else eligible.push({ id, score: strategyScore(id, a), risk: STRATEGY_RULES[id].risk });
  });
  // При равных баллах выше — стратегия с меньшим риском.
  eligible.sort((x, y) => y.score - x.score || x.risk - y.risk);
  const top = eligible[0];
  const results = eligible.filter((e, i) => i === 0 || (i < RESULT_MAX && e.score >= top.score * RESULT_SHARE)).map((e) => e.id);
  return { results, excluded };
}

// --------------------------------------------------------------------------
// Что стратегии нужно от площадки. Элемент — ключ инструмента или массив
// ключей-альтернатив («любой из»). Подписи — в QUIZ_STRINGS[lang].needs.
// --------------------------------------------------------------------------
const STRATEGY_NEEDS = {
  hodl: ["proofOfReserves", "spotFee"],
  dca: [["autoInvest", "bots.dca"], "spotFee"],
  spotSwing: ["spotFee", "proofOfReserves"],
  futuresSwing: ["demo", "futuresFee"],
  dayTrading: ["demo", "futuresFee"],
  scalping: ["demo", "futuresFee"],
  gridBot: ["bots.grid", "spotFee"],
  dcaBot: [["bots.dca", "bots.martingale"], "spotFee"],
  rebalanceBot: ["bots.rebalance", "spotFee"],
  copyTrading: ["copyTrading", "demo", "futuresFee"],
  earn: ["earn", "proofOfReserves"],
  fundingArb: ["bots.arbitrage", "futuresFee", "spotFee"],
};

// --------------------------------------------------------------------------
// Тексты интерфейса и вопросов.
// --------------------------------------------------------------------------
const QUIZ_STRINGS = {
  ru: {
    progress: (n, total) => `Вопрос ${n} из ${total}`,
    back: "← Назад",
    restart: "Пройти заново",
    changeAnswers: "Изменить ответы",
    changeAnswer: "Изменить ответ",
    questions: {
      age: { title: "Вам уже исполнилось 18 лет?", options: ["Да", "Нет"] },
      country: {
        title: "В какой стране вы живёте?",
        hint: "Это нужно, чтобы учесть местные правила.",
        options: ["Россия", "Беларусь", "Казахстан", "Другая страна СНГ", "Другая страна"],
      },
      money: {
        title: "Какую часть ваших средств вы планируете направить на криптовалюту?",
        options: [
          "Небольшую часть свободных средств: их снижение не повлияет на мой уровень жизни",
          "Заметную часть сбережений",
          "Большую часть сбережений",
          "Кредитные средства или финансовую подушку безопасности",
        ],
      },
      experience: {
        title: "Какой у вас опыт работы с криптовалютой?",
        options: ["Опыта пока нет", "Покупка и хранение, без активной торговли", "Торговля на споте", "Торговля фьючерсами или с плечом"],
      },
      goal: {
        title: "Какая у вас главная цель?",
        options: [
          "Приумножить капитал на горизонте нескольких лет",
          "Получать регулярный дополнительный доход",
          "Сделать трейдинг основным занятием",
          "Научиться торговать",
          "Доход без моего постоянного участия",
        ],
      },
      time: {
        title: "Сколько времени вы готовы уделять?",
        options: ["Несколько минут в месяц", "Пару часов в неделю", "Около часа в день", "Несколько часов в день у экрана"],
      },
      horizon: {
        title: "Через какое время вы планируете забрать деньги или подвести итог?",
        hint: "Это срок, на который вы готовы оставить средства в криптовалюте, не выводя их.",
        options: ["До месяца", "От 1 до 6 месяцев", "От 6 месяцев до 2 лет", "Больше 2 лет"],
      },
      drawdown: {
        title: "Представьте: за неделю ваши вложения подешевели на 30%. Что вы сделаете?",
        options: [
          "Продам всё, чтобы не потерять больше",
          "Буду переживать, но подожду",
          "Докуплю по более низкой цене",
          "Буду действовать по заранее составленному плану: стоп-лосс и правила",
        ],
      },
      leverage: {
        title: "Как вы относитесь к торговле с плечом?",
        hint: "Плечо — это торговля на сумму больше вашего депозита. Оно увеличивает и прибыль, и убыток.",
        options: ["Не хочу использовать плечо", "Допускаю небольшое плечо, если понимаю риски", "Готовность к высокому плечу"],
      },
      style: {
        title: "Как вам комфортнее принимать решения?",
        options: [
          "Самостоятельно: анализирую и решаю сам",
          "По чётким правилам, которые исполняет автоматика",
          "Доверить решения опытному трейдеру",
          "Максимально пассивно, без регулярных решений",
        ],
      },
      analysis: {
        title: "Что вам ближе при выборе сделок?",
        options: ["Графики и технический анализ", "Новости, проекты и фундаментальные факторы", "Чёткие механические правила", "Не хочу ничего анализировать"],
      },
      capital: {
        title: "С какой суммы вы планируете начать?",
        hint: "В пересчёте на доллары.",
        options: ["До $100", "От $100 до $1 000", "От $1 000 до $10 000", "Больше $10 000"],
      },
    },
    stop: {
      minor: {
        title: "Подбор недоступен",
        text: "Криптобиржи работают только с совершеннолетними пользователями, поэтому мы не подбираем стратегии для тех, кому ещё нет 18 лет. Если тема вам интересна, начните с нашего словаря терминов — это бесплатно и без риска.",
        link: { href: "/terms/", label: "Открыть словарь терминов →" },
      },
      credit: {
        title: "Мы не подбираем стратегию для этих средств",
        text: "Мы не подбираем стратегии для кредитных средств и финансовой подушки безопасности. Криптовалюта — высоковолатильный актив, и направлять на неё стоит только ту часть капитала, снижение стоимости которой не отразится на вашем финансовом положении.",
      },
    },
    disclaimerTitle: "Это не индивидуальная инвестиционная рекомендация.",
    disclaimerText:
      "Это соответствие ваших ответов типу стратегии, а не совет купить актив или совершить сделку. Можно потерять все вложенные средства.",
    headingOne: "По вашим ответам вам подходит:",
    headingMany: "По вашим ответам вам подходят:",
    bestLabel: "Лучшее совпадение",
    alsoLabel: "Тоже подходит",
    riskLabel: "Риск",
    riskValue: (n) => `${n} из 5`,
    riskScaleNote: "по шкале внутри крипторынка",
    timeLabel: "Время",
    whyTitle: "Почему вам",
    cautionTitle: "Что учесть",
    skillsTitle: "Что нужно уметь",
    mistakesTitle: "Типичные ошибки",
    firstStepTitle: "Безопасный первый шаг",
    needsTitle: "Что нужно от площадки",
    moreTitle: "Риски, навыки и типичные ошибки",
    tabsLabel: "Подходящие стратегии",
    needsOr: " или ",
    needsNote: 'Мы не подбираем биржу за вас. Лицензии, комиссии и условия для резидентов РФ разных бирж собраны в нейтральном <a href="/exchanges/">сравнении бирж</a>.',
    dims: {
      goal: "Цель",
      time: "Время",
      horizon: "Срок вложений",
      style: "Решения",
      analysis: "Подход",
      drawdown: "Реакция на просадку",
      capital: "Стартовая сумма",
    },
    generalTitle: "Важно по вашим ответам",
    notes: {
      ru: "Вы указали Россию. По закону № 282-ФЗ с 1 июля 2027 года резиденты России смогут совершать сделки с криптовалютой только через организаторов обращения цифровой валюты. Биржи из сравнения на сайте — иностранные компании. Следите за изменениями правил.",
      notable: "Вы планируете направить заметную часть сбережений: не вкладывайте всё в одну стратегию и не храните всё на одной площадке.",
      panic: "Криптовалюта регулярно дешевеет на 30–80%. Если такие просадки вызывают желание продать всё, долю криптовалюты в сбережениях лучше держать минимальной.",
      beginner: "Опыта пока нет: начните с суммы, потерю которой вы спокойно переживёте, и включите двухфакторную защиту аккаунта на бирже.",
      highLeverage: "Вы готовы к высокому плечу. Именно высокое плечо чаще всего приводит к ликвидации: даже в подходящей стратегии начинайте с демо-счёта и минимального плеча.",
      spotCopy: "Вы не хотите использовать плечо, а многие копируемые трейдеры торгуют фьючерсами с плечом. Выбирайте спотовый копитрейдинг или трейдеров без плеча.",
    },
    excludedTitle: (n) => `Какие стратегии мы исключили и почему (${n})`,
    excludedReasons: {
      panic: () => "вы указали, что при падении на 30% продадите всё, а эта стратегия предполагает спокойно переживать просадки",
      majorShare: () => "вы планируете направить большую часть сбережений — стратегии с плечом, копитрейдинг и докупку на падении мы в этом случае не предлагаем",
      leverage: () => "вы не хотите использовать плечо, а стратегия работает через фьючерсы",
      experience: (need) => `нужен опыт не ниже уровня «${need}»`,
      time: (need) => `нужно больше времени — не меньше чем «${need}»`,
      capital: (need) => `нужна стартовая сумма не ниже «${need}»`,
      horizon: (need) => `стратегия рассчитана на срок не меньше чем «${need}»`,
    },
    needs: {
      spotFee: "Невысокая комиссия на споте — сравните ставки мейкера и тейкера",
      futuresFee: "Невысокая комиссия во фьючерсах",
      proofOfReserves: "Публикация подтверждения резервов (Proof of Reserves)",
      demo: "Демо-счёт, чтобы отработать стратегию без риска",
      copyTrading: "Раздел копитрейдинга с историей и просадками трейдеров",
      autoInvest: "Автопокупка по расписанию",
      earn: "Простые продукты Earn: гибкие и срочные сбережения",
      "bots.grid": "Сеточный бот",
      "bots.dca": "DCA-бот",
      "bots.martingale": "Мартингейл-бот",
      "bots.rebalance": "Бот ребалансировки портфеля",
      "bots.arbitrage": "Инструмент арбитража ставки финансирования",
    },
    locale: "ru-RU",
  },
  en: {
    progress: (n, total) => `Question ${n} of ${total}`,
    back: "← Back",
    restart: "Start over",
    changeAnswers: "Change answers",
    changeAnswer: "Change answer",
    questions: {
      age: { title: "Are you 18 or older?", options: ["Yes", "No"] },
      country: {
        title: "Which country do you live in?",
        hint: "This lets us account for local rules.",
        options: ["Russia", "Belarus", "Kazakhstan", "Another CIS country", "Another country"],
      },
      money: {
        title: "What part of your funds do you plan to put into crypto?",
        options: [
          "A small part of my spare funds: a drop in their value won't affect my standard of living",
          "A noticeable part of my savings",
          "Most of my savings",
          "Borrowed money or my emergency fund",
        ],
      },
      experience: {
        title: "What is your experience with crypto?",
        options: ["No experience yet", "Buying and holding, no active trading", "Spot trading", "Futures or leveraged trading"],
      },
      goal: {
        title: "What is your main goal?",
        options: [
          "Grow my capital over several years",
          "Earn a regular extra income",
          "Make trading my main occupation",
          "Learn to trade",
          "Income without my constant involvement",
        ],
      },
      time: {
        title: "How much time are you willing to spend?",
        options: ["A few minutes a month", "A couple of hours a week", "About an hour a day", "Several hours a day at the screen"],
      },
      horizon: {
        title: "When do you plan to take the money out or assess the result?",
        hint: "The period you're willing to leave your funds in crypto without withdrawing them.",
        options: ["Up to a month", "1 to 6 months", "6 months to 2 years", "More than 2 years"],
      },
      drawdown: {
        title: "Imagine your holdings lost 30% of their value in a week. What would you do?",
        options: [
          "Sell everything to avoid losing more",
          "Worry, but wait",
          "Buy more at the lower price",
          "Follow a plan made in advance: stop-loss and rules",
        ],
      },
      leverage: {
        title: "How do you feel about trading with leverage?",
        hint: "Leverage means trading a position larger than your deposit. It magnifies both profit and loss.",
        options: ["I don't want to use leverage", "Small leverage is fine if I understand the risks", "Ready for high leverage"],
      },
      style: {
        title: "How do you prefer to make decisions?",
        options: [
          "On my own: I analyse and decide",
          "By clear rules that automation executes",
          "Leave decisions to an experienced trader",
          "As passively as possible, without regular decisions",
        ],
      },
      analysis: {
        title: "What suits you better when choosing trades?",
        options: ["Charts and technical analysis", "News, projects and fundamentals", "Clear mechanical rules", "I don't want to analyse anything"],
      },
      capital: {
        title: "How much do you plan to start with?",
        hint: "In US dollar terms.",
        options: ["Under $100", "$100 to $1,000", "$1,000 to $10,000", "More than $10,000"],
      },
    },
    stop: {
      minor: {
        title: "The quiz isn't available",
        text: "Crypto exchanges only work with adults, so we don't suggest strategies to anyone under 18. If you're interested in the topic, start with our glossary — it's free and risk-free.",
        link: { href: "/en/terms/", label: "Open the glossary →" },
      },
      credit: {
        title: "We don't suggest a strategy for these funds",
        text: "We don't suggest strategies for borrowed money or an emergency fund. Crypto is a highly volatile asset, and only the part of your capital whose loss in value wouldn't affect your financial situation should go into it.",
      },
    },
    disclaimerTitle: "This is not personal investment advice.",
    disclaimerText:
      "This matches your answers to a type of strategy; it isn't advice to buy an asset or make a trade. You can lose all the money you put in.",
    headingOne: "Based on your answers, this suits you:",
    headingMany: "Based on your answers, these suit you:",
    bestLabel: "Best match",
    alsoLabel: "Also a fit",
    riskLabel: "Risk",
    riskValue: (n) => `${n} of 5`,
    riskScaleNote: "on a scale within the crypto market",
    timeLabel: "Time",
    whyTitle: "Why you",
    cautionTitle: "Keep in mind",
    skillsTitle: "What you need to know",
    mistakesTitle: "Common mistakes",
    firstStepTitle: "A safe first step",
    needsTitle: "What you need from a platform",
    moreTitle: "Risks, skills and common mistakes",
    tabsLabel: "Matching strategies",
    needsOr: " or ",
    needsNote: `We don't pick an exchange for you. Licenses, fees and terms for Russian residents of different exchanges are collected in a neutral <a href="/en/exchanges/">exchange comparison</a>.`,
    dims: {
      goal: "Goal",
      time: "Time",
      horizon: "Holding period",
      style: "Decisions",
      analysis: "Approach",
      drawdown: "Reaction to a drop",
      capital: "Starting amount",
    },
    generalTitle: "Important for your answers",
    notes: {
      ru: "You chose Russia. Under Law No. 282-FZ, from 1 July 2027 Russian residents may carry out crypto transactions only through digital currency circulation organisers. The exchanges in the site's comparison are foreign companies. Keep an eye on rule changes.",
      notable: "You plan to put in a noticeable part of your savings: don't put everything into one strategy or keep it all on one platform.",
      panic: "Crypto regularly drops 30–80%. If drops like that make you want to sell everything, keep crypto a minimal share of your savings.",
      beginner: "No experience yet: start with an amount you could lose without trouble, and turn on two-factor authentication on the exchange.",
      highLeverage: "You're ready for high leverage. High leverage is the most common cause of liquidation: even with a suitable strategy, start on a demo account with minimal leverage.",
      spotCopy: "You don't want to use leverage, and many copied traders trade futures with leverage. Choose spot copy trading or traders who don't use leverage.",
    },
    excludedTitle: (n) => `Strategies we excluded and why (${n})`,
    excludedReasons: {
      panic: () => "you said you would sell everything after a 30% drop, and this strategy requires sitting through drops calmly",
      majorShare: () => "you plan to put in most of your savings — in that case we don't suggest leverage, copy trading or buying into a fall",
      leverage: () => "you don't want to use leverage, and this strategy works through futures",
      experience: (need) => `requires experience of at least "${need}"`,
      time: (need) => `needs more time — at least "${need}"`,
      capital: (need) => `needs a starting amount of at least "${need}"`,
      horizon: (need) => `is designed for a horizon of at least "${need}"`,
    },
    needs: {
      spotFee: "Low spot fees — compare maker and taker rates",
      futuresFee: "Low futures fees",
      proofOfReserves: "Published Proof of Reserves",
      demo: "A demo account to practise the strategy without risk",
      copyTrading: "A copy-trading section showing traders' history and drawdowns",
      autoInvest: "Scheduled auto-buy",
      earn: "Simple Earn products: flexible and fixed-term savings",
      "bots.grid": "A grid bot",
      "bots.dca": "A DCA bot",
      "bots.martingale": "A martingale bot",
      "bots.rebalance": "A portfolio rebalancing bot",
      "bots.arbitrage": "A funding-rate arbitrage tool",
    },
    locale: "en-US",
  },
};

// Какой уровень вопроса нужен стратегии — для текста причины исключения.
const EXCLUDE_REASON_QUESTION = { experience: "minExperience", time: "minTime", capital: "minCapital", horizon: "minHorizon" };

function getQuizLang() {
  return document.documentElement.lang === "en" ? "en" : "ru";
}

function quizEscape(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

function optionLabel(t, qid, value) {
  const q = QUIZ_QUESTIONS.find((x) => x.id === qid);
  return t.questions[qid].options[q.options.indexOf(value)];
}

function lcFirst(s, lang) {
  return lang === "ru" ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

// Почему стратегия подходит: ответы, за которые она получила 2+ балла, —
// самые весомые первыми, не больше трёх.
function strategyReasons(id, a, t, lang) {
  return Object.keys(SCORE_WEIGHTS)
    .map((dim, order) => ({ dim, order, pts: strategyPoints(id, dim, a) * SCORE_WEIGHTS[dim] }))
    .filter((r) => strategyPoints(id, r.dim, a) >= 2)
    .sort((x, y) => y.pts - x.pts || x.order - y.order)
    .slice(0, 3)
    .map((r) => `${t.dims[r.dim]}: ${lcFirst(optionLabel(t, r.dim, a[r.dim]), lang)}`);
}

// Общие предупреждения по ответам (один раз под карточкой).
function generalNotes(a, results, t) {
  const notes = [];
  if (a.drawdown === "sell") notes.push(t.notes.panic);
  if (a.leverage === "high" && results.some((id) => STRATEGY_RULES[id].futures)) notes.push(t.notes.highLeverage);
  if (a.leverage === "never" && results.includes("copyTrading")) notes.push(t.notes.spotCopy);
  if (a.money === "notable") notes.push(t.notes.notable);
  if (a.experience === 0) notes.push(t.notes.beginner);
  if (a.country === "ru") notes.push(t.notes.ru);
  return notes;
}

function excludedReasonText(item, a, t) {
  const fn = t.excludedReasons[item.reason];
  const ruleKey = EXCLUDE_REASON_QUESTION[item.reason];
  if (!ruleKey) return fn();
  return fn(optionLabel(t, item.reason, STRATEGY_RULES[item.id][ruleKey]));
}

function riskMeterHTML(risk, t) {
  const dots = [1, 2, 3, 4, 5].map((i) => `<span class="sq-risk-dot${i <= risk ? " sq-risk-dot--on" : ""}"></span>`).join("");
  return `<span class="sq-risk sq-risk--${risk}" role="img" aria-label="${t.riskLabel}: ${t.riskValue(risk)}">${dots}</span>`;
}

function listHTML(items, cls) {
  return `<ul class="${cls}">${items.map((s) => `<li>${quizEscape(s)}</li>`).join("")}</ul>`;
}

// Что нужно от площадки — без названий бирж.
function needsHTML(id, t) {
  const items = STRATEGY_NEEDS[id].map((need) => (Array.isArray(need) ? need.map((k) => t.needs[k]).join(t.needsOr) : t.needs[need]));
  return `${listHTML(items, "sq-list sq-needs")}<p class="sq-muted sq-exchanges-note">${t.needsNote}</p>`;
}

// Карточка выбранной стратегии: на виду только главное, подробности — под
// одной кнопкой (результат раньше был перегружен — 2026-09-23).
function strategyDetailHTML(id, a, t, lang) {
  const s = STRATEGIES[id];
  const rule = STRATEGY_RULES[id];
  const reasons = strategyReasons(id, a, t, lang);
  return `
    <article class="cmp-card sq-strategy match-best">
      <h3 class="cmp-card-name">${quizEscape(s.name)}</h3>
      <p class="sq-tagline">${quizEscape(s.tagline)}</p>
      <p class="sq-meta">
        <span title="${t.riskScaleNote}"><strong>${t.riskLabel}:</strong> ${riskMeterHTML(rule.risk, t)} ${t.riskValue(rule.risk)}</span>
        <span><strong>${t.timeLabel}:</strong> ${quizEscape(s.time)}</span>
      </p>
      <p class="sq-summary">${quizEscape(s.summary)}</p>
      ${
        reasons.length
          ? `<div class="sq-why"><span class="sq-why-label">${t.whyTitle}:</span>${listHTML(reasons.map((r) => `✓ ${r}`), "sq-chips")}</div>`
          : ""
      }
      <p class="sq-warn-line">${quizEscape(s.cautions[0])}</p>
      <div class="sq-first-step"><strong>${t.firstStepTitle}:</strong> ${quizEscape(s.firstStep)}</div>
      <details class="sq-more">
        <summary>${t.moreTitle}</summary>
        <h4>${t.cautionTitle}</h4>${listHTML(s.cautions, "sq-list")}
        <h4>${t.skillsTitle}</h4>${listHTML(s.skills, "sq-list")}
        <h4>${t.mistakesTitle}</h4>${listHTML(s.mistakes, "sq-list")}
      </details>
      <h4 class="sq-exchanges-title">${t.needsTitle}</h4>
      ${needsHTML(id, t)}
    </article>`;
}

function strategyTabsHTML(results, selected, t) {
  if (results.length < 2) return "";
  return `
    <div class="sq-tabs" role="tablist" aria-label="${t.tabsLabel}">
      ${results
        .map(
          (id, i) => `
        <button type="button" role="tab" class="sq-tab${i === selected ? " sq-tab--active" : ""}" aria-selected="${i === selected}" data-tab="${i}">
          <span class="sq-tab-name">${quizEscape(STRATEGIES[id].name)}</span>
          <span class="sq-tab-note">${i === 0 ? t.bestLabel : t.alsoLabel}</span>
        </button>`
        )
        .join("")}
    </div>`;
}

// --------------------------------------------------------------------------
// Интерфейс.
// --------------------------------------------------------------------------
function initStrategyQuiz(rootId) {
  const root = document.getElementById(rootId);
  if (!root || typeof STRATEGIES === "undefined") return;
  const lang = getQuizLang();
  const t = QUIZ_STRINGS[lang];
  let answers = {};
  let step = 0;

  function focusHeading() {
    const h = root.querySelector("[data-focus]");
    if (h) h.focus({ preventScroll: false });
  }

  function scrollToRoot() {
    const top = root.getBoundingClientRect().top + window.scrollY - 90;
    if (window.scrollY > top) window.scrollTo({ top, behavior: "smooth" });
  }

  function renderQuestion() {
    const q = QUIZ_QUESTIONS[step];
    const qs = t.questions[q.id];
    const selected = answers[q.id];
    const pct = Math.round((step / QUIZ_QUESTIONS.length) * 100);
    root.innerHTML = `
      <div class="sq-progress" aria-live="polite">
        <span>${t.progress(step + 1, QUIZ_QUESTIONS.length)}</span>
        <div class="sq-progress-bar"><div class="sq-progress-fill" style="width:${pct}%"></div></div>
      </div>
      <div class="match-step">
        <h2 class="sq-question" tabindex="-1" data-focus>${qs.title}</h2>
        ${qs.hint ? `<p class="sq-muted sq-hint">${qs.hint}</p>` : ""}
        <div class="match-options">
          ${q.options
            .map(
              (v, i) =>
                `<button type="button" class="match-option${selected === v ? " match-option--selected" : ""}" data-index="${i}">${qs.options[i]}</button>`
            )
            .join("")}
        </div>
      </div>
      ${step > 0 ? `<div class="sq-nav"><button type="button" class="sq-button sq-button--ghost" data-action="back">${t.back}</button></div>` : ""}`;
  }

  function renderStop(reason) {
    const s = t.stop[reason];
    root.innerHTML = `
      <div class="sq-stop">
        <h2 tabindex="-1" data-focus>${s.title}</h2>
        <p>${s.text}</p>
        ${s.link ? `<p><a href="${s.link.href}">${s.link.label}</a></p>` : ""}
      </div>
      <div class="sq-nav">
        <button type="button" class="sq-button sq-button--ghost" data-action="back">${t.changeAnswer}</button>
        <button type="button" class="sq-button" data-action="restart">${t.restart}</button>
      </div>`;
  }

  // Какая из подходящих стратегий открыта во вкладках (0 — лучшее совпадение).
  let selected = 0;

  function renderResults() {
    const res = recommendStrategies(answers);
    const notes = generalNotes(answers, res.results, t);
    if (selected >= res.results.length) selected = 0;
    root.innerHTML = `
      <p class="sq-disclaimer"><strong>${t.disclaimerTitle}</strong> ${t.disclaimerText}</p>
      <h2 class="match-heading" tabindex="-1" data-focus>${res.results.length > 1 ? t.headingMany : t.headingOne}</h2>
      ${strategyTabsHTML(res.results, selected, t)}
      <div class="sq-panel" role="tabpanel">${strategyDetailHTML(res.results[selected], answers, t, lang)}</div>
      ${
        notes.length
          ? `<div class="sq-notes"><strong>${t.generalTitle}</strong>${listHTML(notes, "sq-list")}</div>`
          : ""
      }
      ${
        res.excluded.length
          ? `<details class="sq-excluded"><summary>${t.excludedTitle(res.excluded.length)}</summary><ul class="sq-list">${res.excluded
              .map((e) => `<li><strong>${quizEscape(STRATEGIES[e.id].name)}</strong> — ${quizEscape(excludedReasonText(e, answers, t))}</li>`)
              .join("")}</ul></details>`
          : ""
      }
      <div class="sq-nav">
        <button type="button" class="sq-button sq-button--ghost" data-action="back">${t.changeAnswers}</button>
        <button type="button" class="sq-button" data-action="restart">${t.restart}</button>
      </div>`;
  }

  function render() {
    const stop = quizStopReason(answers);
    if (stop) renderStop(stop);
    else if (step >= QUIZ_QUESTIONS.length) renderResults();
    else renderQuestion();
    scrollToRoot();
    focusHeading();
  }

  // Ответы на вопросы после текущего сбрасываем, если вернулись назад и
  // выбрали другое: иначе можно попасть в результаты с устаревшими ответами.
  function answer(index) {
    const q = QUIZ_QUESTIONS[step];
    const value = q.options[index];
    if (answers[q.id] !== value) {
      QUIZ_QUESTIONS.slice(step + 1).forEach((later) => delete answers[later.id]);
    }
    answers[q.id] = value;
    if (!quizStopReason(answers)) step += 1;
    render();
  }

  function back() {
    const stop = quizStopReason(answers);
    if (stop) {
      // Со стоп-экрана возвращаемся к вопросу, который его вызвал.
      delete answers[stop === "minor" ? "age" : "money"];
    } else {
      step = Math.max(0, step - 1);
    }
    render();
  }

  // Переключение вкладок меняет только карточку, без прокрутки и перерисовки
  // остального результата.
  function selectTab(i) {
    selected = i;
    const res = recommendStrategies(answers);
    root.querySelectorAll(".sq-tab").forEach((b, j) => {
      b.classList.toggle("sq-tab--active", j === i);
      b.setAttribute("aria-selected", String(j === i));
    });
    root.querySelector(".sq-panel").innerHTML = strategyDetailHTML(res.results[i], answers, t, lang);
  }

  root.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-tab]");
    if (tab) return selectTab(Number(tab.dataset.tab));
    const opt = e.target.closest("[data-index]");
    if (opt) {
      selected = 0;
      return answer(Number(opt.dataset.index));
    }
    const act = e.target.closest("[data-action]");
    if (!act) return;
    if (act.dataset.action === "back") back();
    if (act.dataset.action === "restart") {
      answers = {};
      step = 0;
      selected = 0;
      render();
    }
  });

  root.innerHTML = "";
  renderQuestion();
}
