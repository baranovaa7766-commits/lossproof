// Статические данные о крипто-маршрутах вывода, пропфирмах и партнёрских
// ссылках. Цифры по комиссиям/спредам — оценочные, для целей сравнения.
// Перед выводом средств всегда уточняйте актуальные условия у самого сервиса.
//
// v2: сайт сравнивает не Wise/Revolut/банк, а связки "биржа (покупка USDT) +
// off-ramp (USDT → рубли/локальная валюта)", потому что Wise и Revolut не
// работают с пользователями из России. Банк оставлен как контрастный худший
// вариант. См. payout-comparison-site-spec-v2-crypto-pivot.md.

const CURRENCIES = ["USD", "EUR", "GBP", "AUD", "CAD", "CHF", "JPY", "PLN", "CZK", "HUF", "RON", "BGN", "TRY", "INR", "ZAR", "MXN", "BRL", "NGN", "SEK", "NOK", "DKK", "RUB", "KZT", "UAH", "BYN"];

// Дата последней ручной сверки спредов/комиссий ниже (EXCHANGES, OFFRAMPS,
// BANK_BASELINE) с публичными тарифами провайдеров. Показывается на сайте
// как «Тарифы проверены: …» — обновляйте вместе с цифрами.
const DATA_LAST_VERIFIED = "2026-09-03";

// Криптобиржи — этап 1 (покупка/получение USDT). Партнёрские программы
// подтверждены для всех четырёх.
const EXCHANGES = [
  {
    id: "bybit",
    name: "Bybit",
    spreadPercent: 0.3,
    fixedFee: 1,
    speed: "минуты",
    affiliateConfirmed: true,
    notes: "Партнёрка подтверждена (affiliates.bybit.com); обязательной ID-верификации для самой партнёрки нет.",
  },
  {
    id: "bitget",
    name: "Bitget",
    spreadPercent: 0.3,
    fixedFee: 1,
    speed: "минуты",
    affiliateConfirmed: true,
    notes: "Относительно мягкий порог входа в партнёрскую программу.",
  },
  {
    id: "kucoin",
    name: "KuCoin",
    spreadPercent: 0.3,
    fixedFee: 1,
    speed: "минуты",
    affiliateConfirmed: true,
    notes: "Открытая партнёрская программа, 30-50% от комиссий пожизненно.",
  },
  {
    id: "whitebit",
    name: "WhiteBIT",
    spreadPercent: 0.4,
    fixedFee: 1,
    speed: "минуты",
    affiliateConfirmed: true,
    notes: "Партнёрская программа подтверждена (whitebit.com/referral).",
  },
];

// Off-ramp сервисы — этап 2 (USDT → рубли/локальная валюта).
//
// Партнёрские программы (регистрация через ссылку) НЕ ПОДТВЕРЖДЕНЫ — этим
// полем `dataVerified` не описывается. `dataVerified: true` означает только
// то, что spread/fixedFee ниже взяты с официальной страницы тарифов
// провайдера (а не придуманы для примера) на дату проверки. Тарифы меняются
// без предупреждения и без публичного API — живого автообновления для них
// нет (в отличие от курса валют в rates.js, который обновляется каждый
// расчёт). Раз в несколько месяцев стоит вручную сверять цифры по ссылкам
// ниже и подставлять актуальные.
//
// A7A5 намеренно исключён: это не отдельный off-ramp, а рублёвый стейблкоин
// от A7/Old Vector LLC, торгуемый в основном на бирже Grinex — а Grinex и
// связанные с A7A5 структуры попали под санкции OFAC Минфина США в августе
// 2025 как преемник санкционного Garantex. Не добавлять обратно без
// повторной проверки санкционного статуса.
const OFFRAMPS = [
  {
    id: "whitebird",
    // Источник: https://whitebird.io/commission (проверено 2026-09-03).
    // Раздел "Другие способы оплаты" → "Карты банков Российской Федерации",
    // колонка "Клиент продаёт" — 2,0%. Это самый универсальный вариант вывода
    // на карту РФ; ВТБ Pay дешевле (1,7%), но подходит только держателям ВТБ.
    // Отдельной сетевой/фиксированной комиссии сверх процента не указано.
    name: "Whitebird",
    spreadPercent: 2.0,
    fixedFee: 0,
    speed: "10-30 минут",
    dataVerified: true,
    notes: "Лицензированная площадка (Беларусь): USDT/BTC/ETH → RUB/BYN на карту МИР. 2,0% — тариф для вывода на карту банка РФ, whitebird.io/commission.",
  },
  {
    id: "cifra",
    // Источник: https://cifra.by/rates (проверено 2026-09-03).
    // 1,5% — комиссия за конвертацию крипто-фиатной пары USDT/RUB на
    // стартовом тарифе "Консультационный". Плюс отдельная фиксированная
    // комиссия за вывод рублей для нерезидентов Беларуси — 500 RUB (0, если
    // выводить в Цифра банк). 500 RUB переведены в доллары по курсу ~85
    // RUB/USD ≈ $6 для единообразия с остальными fixedFee (в оригинале это
    // рублёвая, а не долларовая комиссия).
    name: "Cifra Markets",
    spreadPercent: 1.5,
    fixedFee: 6,
    speed: "1 рабочий день (вывод только в рабочие дни банков)",
    dataVerified: true,
    notes: "Брокерская платформа для трейдеров СНГ. 1,5% конвертация + 500 ₽ вывод (0, если выводить в Цифра банк), cifra.by/rates.",
  },
];

// Банковский перевод — оставлен только как контрастный "худший" вариант,
// без партнёрской ссылки.
const BANK_BASELINE = {
  id: "bank",
  name: "Банковский перевод (для сравнения)",
  markupPercent: 3,
  fixedFee: 25,
  speed: "3-7 дней",
  notes: "Показан для контраста — курс банка обычно заметно хуже крипто-маршрутов.",
};

// Электронные кошельки — справочно, не участвуют в расчёте калькулятора.
// Используются как промежуточное звено между биржей и обменником.
const E_WALLETS = [
  {
    id: "payeer",
    name: "Payeer",
    notes: "Электронный кошелёк, используется как промежуточное звено между биржей и обменником. Наличие партнёрской программы нужно проверить на сайте.",
  },
  {
    id: "advcash",
    name: "AdvCash / Volet",
    notes: "Прямые переводы на карты РФ напрямую больше не работают, но кошелёк полезен как промежуточное звено с обменниками. Партнёрку нужно проверить на сайте.",
  },
];

// Справочный ресурс — не партнёр, а агрегатор-конкурент в узкой нише.
const REFERENCE_RESOURCES = [
  {
    id: "bestchange",
    name: "BestChange",
    url: "https://www.bestchange.ru/",
    notes: "Агрегатор обменников — можно свериться с ним по актуальным курсам, но это не партнёрский сервис.",
  },
];

// Конфигурация партнёрских ссылок. После одобрения в партнёрской программе
// подставьте реальную ссылку в поле `url`. Пока `url: null` — ссылка не
// монетизирована и не отображается.
const AFFILIATE_LINKS = {
  bybit: { url: null, label: "Зарегистрироваться в Bybit" },
  bitget: { url: null, label: "Зарегистрироваться в Bitget" },
  kucoin: { url: null, label: "Зарегистрироваться в KuCoin" },
  whitebit: { url: null, label: "Зарегистрироваться в WhiteBIT" },
};

// Данные по выплатам пропфирм собраны через веб-поиск.
// ВАЖНО: перед публикацией каждой страницы проверяйте актуальные условия
// напрямую на сайте фирмы — эти данные могут быть неточными или устаревшими.
const FIRMS = [
  {
    slug: "ftmo",
    name: "FTMO",
    methods: [
      "Банковский перевод",
      "Visa Direct / Mastercard Send (до $20 000)",
      "Skrill (до $3 000)",
      "Крипто",
    ],
    fee: "Комиссии от фирмы нет; банк может взимать свою за входящий перевод",
    minWithdrawal: "$20 (банк) / $50 (крипто)",
    speed: "1-2 дня",
    notes: "Банковский перевод недоступен трейдерам из Венесуэлы, Кубы, Судана и Украины.",
    payoutCurrency: "USD",
  },
  {
    slug: "fundednext",
    name: "FundedNext",
    methods: ["USDT/USDC (крипто)", "RiseWorks", "Банковский перевод", "Confirmo"],
    fee: "До 3% (оплачивает трейдер)",
    minWithdrawal: "Не указана — проверьте перед тем как полагаться на это",
    speed: "24 часа (крипто/RiseWorks), до 5 дней (банк)",
    notes: "RiseWorks доступен только в отдельных регионах; трейдерам из Ирана доступен только TC Pay.",
    payoutCurrency: "USD",
  },
  {
    slug: "the5ers",
    name: "The5ers",
    methods: ["RiseWorks", "Крипто", "Банковский перевод", "Hub Credits"],
    fee: "Банк 3%, крипто/RiseWorks 2% (в некоторых источниках — фиксированные 3,5%) — уточните перед тем как полагаться на это",
    minWithdrawal: "$150",
    speed: "~72 часа, выплаты раз в две недели",
    notes: "Вывод через крипто ограничен суммой $1 500 за одну заявку.",
    payoutCurrency: "USD",
  },
  {
    slug: "e8-markets",
    name: "E8 Markets",
    methods: ["RiseWorks", "WorkMarket"],
    fee: "Комиссии от фирмы нет",
    minWithdrawal: "$100",
    speed: "Не указана — проверьте перед тем как полагаться на это",
    notes: "",
    payoutCurrency: "USD",
  },
];

// ---------------------------------------------------------------------------
// Раздел «Сравнение пропфирм» (/prop-firms/). Структурированные данные для
// сортируемой/фильтруемой таблицы и страниц по каждой фирме. См.
// prop-firms-comparison-spec.md.
//
// ВАЖНО: индустрия пропфирм не регулируется государством. В сравнение
// включаются только фирмы с публично подтверждённой историей выплат и
// рейтингом доверия — это не финансовая лицензия и не госаккредитация.
//
// Цифры ниже собраны веб-поиском по состоянию на дату PROP_FIRMS_RESEARCHED
// и НЕ сверялись построчно с официальными сайтами фирм. Профит-сплит,
// просадки, цены по размерам аккаунта и число отзывов Trustpilot меняются —
// перед тем как убирать красный блок «сверьте данные» со страницы фирмы,
// проверьте её цифры напрямую на officialUrl. Держите этот массив
// синхронным по числам с assets/js/data.en.js (тексты переводятся отдельно).
//
// Числовые поля (entryFrom в USD, profitSplitMax, maxAccountValue,
// trustpilotScore, trustpilotReviews, founded) используются для
// сортировки/фильтрации; текстовые *Text — для отображения.
const PROP_FIRMS_RESEARCHED = "2026-09-06";

const PROP_FIRMS = [
  {
    slug: "ftmo",
    name: "FTMO",
    founded: 2015,
    evaluationTypes: ["1-step", "2-step"],
    entryFrom: 89, // ≈ €79–€89 за $10K
    entryModel: "one-time",
    entryText: "от €79 ($10K, 1-step)",
    profitSplitMax: 90,
    profitSplitText: "80–90% (2-step) · 90% (1-step)",
    drawdownDaily: "3% (1-step) / 5% (2-step)",
    drawdownTotal: "10%",
    minTradingDays: "нет",
    maxAccountValue: 2000000,
    maxAccountText: "$200K → аллокация $400K → скейлинг до $2M",
    payoutMethods: ["Банк", "Visa/Mastercard", "Skrill", "Крипто"],
    payoutSlug: "ftmo",
    trustpilotScore: 4.8,
    trustpilotReviews: 50700,
    trustpilotAsOf: "2026-09-06",
    brokerBacking: "Владеет регулируемым брокером OANDA",
    officialUrl: "https://ftmo.com",
    includeNote: null,
    dataVerified: false,
    payoutHistory: "Заявлено более $500M выплат с 2015 года",
    priceModel: "dual", // колонки: размер / 1-step / 2-step
    priceTable: [
      { size: "$10K", oneStep: "€79", twoStep: "€89" },
      { size: "$25K", oneStep: "€165", twoStep: "€179" },
      { size: "$50K", oneStep: "€289", twoStep: "€299" },
      { size: "$100K", oneStep: "€539", twoStep: "€549" },
      { size: "$200K", oneStep: "€999", twoStep: "€1 080" },
    ],
    rules: {
      "1-step": {
        target: "10%",
        daily: "3% (трейлинг на конец дня)",
        total: "10% (трейлинг на конец дня)",
        minDays: "нет",
        timeLimit: "без ограничения по времени",
        split: "90% с первой выплаты",
      },
      "2-step": {
        target: "10% (Фаза 1) → 5% (Фаза 2 / Верификация)",
        daily: "5%",
        total: "10%",
        minDays: "нет",
        timeLimit: "без ограничения по времени",
        split: "80%, до 90% по программе скейлинга",
      },
    },
    payoutCadence: "Первая выплата через 14 дней после первой сделки на профит-аккаунте, далее раз в 14 дней (можно перейти на график по запросу).",
  },
  {
    slug: "fundednext",
    name: "FundedNext",
    founded: 2022,
    evaluationTypes: ["1-step", "2-step"],
    entryFrom: 59,
    entryModel: "one-time",
    entryText: "от ~$49 ($6K, Stellar 1-step)",
    profitSplitMax: 95,
    profitSplitText: "80%, до 95% (Stellar) · до 90% через FundedNext Pro",
    drawdownDaily: "3% (1-step) / 5% (2-step)",
    drawdownTotal: "6% (1-step) / 10% (2-step), статическая",
    minTradingDays: "2 (1-step)",
    maxAccountValue: 200000,
    maxAccountText: "$2K–$200K, далее программа скейлинга Pro",
    payoutMethods: ["USDT/USDC", "RiseWorks", "Банк", "Confirmo"],
    payoutSlug: "fundednext",
    trustpilotScore: 4.5,
    trustpilotReviews: 62700,
    trustpilotAsOf: "2026-09-06",
    brokerBacking: null,
    officialUrl: "https://fundednext.com",
    includeNote: null,
    dataVerified: false,
    payoutHistory: "Заявлено более $261M выплат (данные компании, 2026)",
    priceModel: "dual",
    priceTable: [
      { size: "$6K", oneStep: "$49", twoStep: "$59" },
      { size: "$15K", oneStep: "$99", twoStep: "$119" },
      { size: "$25K", oneStep: "$169", twoStep: "$199" },
      { size: "$50K", oneStep: "$265", twoStep: "$299" },
      { size: "$100K", oneStep: "$499", twoStep: "$549" },
      { size: "$200K", oneStep: "$939", twoStep: "$1 009" },
    ],
    rules: {
      "1-step": {
        target: "8%",
        daily: "3%",
        total: "6% (статическая)",
        minDays: "2",
        timeLimit: "без ограничения по времени",
        split: "80% (до 95%)",
      },
      "2-step": {
        target: "8% (Фаза 1) → 5% (Фаза 2)",
        daily: "5%",
        total: "10% (статическая)",
        minDays: "нет",
        timeLimit: "без ограничения по времени",
        split: "80% (до 95%)",
      },
    },
    payoutCadence: "Цикл выплат каждые 7 дней на первом этапе после получения аккаунта; крипто/RiseWorks обычно в течение суток.",
  },
  {
    slug: "the5ers",
    name: "The 5%ers",
    founded: 2016,
    evaluationTypes: ["1-step", "2-step"],
    entryFrom: 39,
    entryModel: "one-time",
    entryText: "от ~$39 ($5K, High Stakes)",
    profitSplitMax: 100,
    profitSplitText: "до 100% (растёт с прогрессом по программе)",
    drawdownDaily: "5% (High Stakes) · без дневного лимита на части программ",
    drawdownTotal: "10% (High Stakes); 3% трейлинг на конец дня — на Bootcamp/Hyper Growth",
    minTradingDays: "нет",
    maxAccountValue: 4000000,
    maxAccountText: "с $2 500, скейлинг до $4M",
    payoutMethods: ["RiseWorks", "Крипто", "Банк"],
    payoutSlug: "the5ers",
    trustpilotScore: 4.7,
    trustpilotReviews: 26600,
    trustpilotAsOf: "2026-09-06",
    brokerBacking: null,
    officialUrl: "https://the5ers.com",
    includeNote: null,
    dataVerified: false,
    payoutHistory: "~336 000 профинансированных трейдеров (данные компании)",
    priceModel: "single", // колонки: размер / цена
    priceTable: [
      { size: "$5K", price: "$39" },
      { size: "$10K", price: "$95" },
      { size: "$20K", price: "$185" },
      { size: "$40K", price: "$300" },
      { size: "$60K", price: "$450" },
      { size: "$100K", price: "$850" },
    ],
    rules: {
      "1-step": {
        target: "10% (Hyper Growth)",
        daily: "нет",
        total: "3% трейлинг на конец дня",
        minDays: "3",
        timeLimit: "без ограничения по времени",
        split: "до 100%",
      },
      "2-step": {
        target: "6% (Фаза 1) → 6% (Фаза 2) на High Stakes",
        daily: "5%",
        total: "10%",
        minDays: "нет",
        timeLimit: "без ограничения по времени",
        split: "до 100%",
      },
    },
    payoutCadence: "Заявки раз в две недели, обработка ~72 часа. Крипто-вывод ограничен $1 500 за одну заявку.",
  },
  {
    slug: "topstep",
    name: "Topstep",
    founded: 2012,
    evaluationTypes: ["1-step"],
    entryFrom: 49,
    entryModel: "monthly",
    entryText: "подписка от ~$49/мес ($50K Trading Combine)",
    profitSplitMax: 90,
    profitSplitText: "90/10 (100% на первые $10K для аккаунтов, открытых до 12.01.2026)",
    drawdownDaily: "дневной лимит потерь $1K / $2K / $3K",
    drawdownTotal: "трейлинг Max Loss Limit $2K / $3K / $4,5K",
    minTradingDays: "нет (в оценке)",
    maxAccountValue: 150000,
    maxAccountText: "$50K / $100K / $150K (фьючерсы)",
    payoutMethods: ["Банк (ACH/Wire)", "Rise (междунар.)"],
    payoutSlug: null,
    trustpilotScore: 3.6,
    trustpilotReviews: 14500,
    trustpilotAsOf: "2026-09-06",
    brokerBacking: null,
    officialUrl: "https://www.topstep.com",
    includeNote: "Рейтинг Trustpilot ниже наших ориентиров, но это одна из старейших фьючерсных пропфирм (с 2012) с многолетней публичной историей выплат. Оценивайте осторожно и читайте свежие отзывы.",
    dataVerified: false,
    payoutHistory: "Публичная история выплат с 2012 года, futures-focused",
    priceModel: "monthly", // колонки: размер / цена в месяц
    priceTable: [
      { size: "$50K", monthly: "$49/мес (акция) · прайс ~$165/мес" },
      { size: "$100K", monthly: "$99/мес (акция) · прайс ~$325/мес" },
      { size: "$150K", monthly: "$149/мес (акция) · прайс ~$375/мес" },
    ],
    rules: {
      "1-step": {
        target: "6% ($3K / $6K / $9K)",
        daily: "дневной лимит $1K / $2K / $3K",
        total: "трейлинг MLL $2K / $3K / $4,5K",
        minDays: "нет в оценке; 2+ прибыльных дня для выплаты",
        timeLimit: "без ограничения (пока идёт подписка)",
        split: "90/10 (грандфатеринг 100% на первые $10K до 12.01.2026)",
      },
    },
    payoutCadence: "Выплаты можно запрашивать после 5 «выигрышных дней»; лимиты на первые выплаты по правилам Topstep.",
  },
  {
    slug: "brightfunded",
    name: "BrightFunded",
    founded: 2023,
    evaluationTypes: ["2-step"],
    entryFrom: 59,
    entryModel: "one-time",
    entryText: "от ~$59 ($5K)",
    profitSplitMax: 100,
    profitSplitText: "80%, до 100% через скейлинг",
    drawdownDaily: "5%",
    drawdownTotal: "10% (статическая)",
    minTradingDays: "5 на каждую фазу",
    maxAccountValue: 400000,
    maxAccountText: "$5K–$200K, скейлинг до $400K",
    payoutMethods: ["Крипто", "Банк/Rise"],
    payoutSlug: null,
    trustpilotScore: null,
    trustpilotReviews: 530,
    trustpilotAsOf: "2026-09-06",
    brokerBacking: null,
    officialUrl: "https://brightfunded.com",
    includeNote: "Молодая фирма (основана в 2023). Рейтинг Trustpilot на момент сбора данных был скрыт/недоступен, отзывов немного. Заявленная история выплат — ~$7M. Относитесь с повышенной осторожностью и проверяйте актуальный статус.",
    dataVerified: false,
    payoutHistory: "Заявлено ~$7M выплат (данные компании)",
    priceModel: "single",
    priceTable: [
      { size: "$5K", price: "$59" },
      { size: "$10K", price: "$99" },
      { size: "$25K", price: "$199" },
      { size: "$50K", price: "$299" },
      { size: "$100K", price: "$549" },
      { size: "$200K", price: "$999" },
    ],
    rules: {
      "2-step": {
        target: "10% (Фаза 1) → 5% (Фаза 2)",
        daily: "5%",
        total: "10% (статическая)",
        minDays: "5 на фазу",
        timeLimit: "без ограничения по времени",
        split: "80%, до 100% через скейлинг",
      },
    },
    payoutCadence: "Заявлена гарантированная выплата в течение 24 часов (в среднем ~17 часов) — проверьте на сайте.",
  },
  {
    slug: "blueberry-funded",
    name: "Blueberry Funded",
    founded: 2024,
    evaluationTypes: ["1-step", "2-step"],
    entryFrom: 40,
    entryModel: "one-time",
    entryText: "от ~$40",
    profitSplitMax: 90,
    profitSplitText: "80%, до 90% через скейлинг",
    drawdownDaily: "4% (статическая, по балансу/эквити на 17:00 EST)",
    drawdownTotal: "10% (статическая)",
    minTradingDays: "нет (проверьте по программе)",
    maxAccountValue: 2000000,
    maxAccountText: "$1 250–$200K, скейлинг до $2M",
    payoutMethods: ["Крипто", "Банк", "Rise"],
    payoutSlug: null,
    trustpilotScore: 4.3,
    trustpilotReviews: 1420,
    trustpilotAsOf: "2026-09-06",
    brokerBacking: "Регулируемый брокер Blueberry Markets (ASIC)",
    officialUrl: "https://blueberryfunded.com",
    includeNote: "Отзывов на Trustpilot меньше нашего ориентира в 2 500, но фирму поддерживает регулируемый брокер Blueberry Markets, а заявленная история выплат — $7,55M+ более чем 10 900 трейдерам. Проверяйте актуальные цифры.",
    dataVerified: false,
    payoutHistory: "Заявлено $7,55M+ выплат более чем 10 900 трейдерам",
    priceModel: "single",
    priceTable: [
      { size: "$5K", price: "$49" },
      { size: "$10K", price: "$89" },
      { size: "$25K", price: "$189" },
      { size: "$50K", price: "$299" },
      { size: "$100K", price: "$549" },
      { size: "$200K", price: "$999" },
    ],
    rules: {
      "1-step": {
        target: "10%",
        daily: "4% (статическая)",
        total: "10% (статическая)",
        minDays: "нет",
        timeLimit: "без ограничения по времени",
        split: "80%, до 90%",
      },
      "2-step": {
        target: "8% (Фаза 1) → 5% (Фаза 2)",
        daily: "4% (статическая)",
        total: "10% (статическая)",
        minDays: "нет",
        timeLimit: "без ограничения по времени",
        split: "80%, до 90%",
      },
    },
    payoutCadence: "Цикл выплат раз в 14 дней.",
  },
];
