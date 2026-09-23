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
// подтверждены для bybit/bingx/kucoin; okx/mexc/gate добавлены в расчёт
// калькулятора 2026-09-12 по просьбе владельца сайта (они уже были в
// информационном сравнении EXCHANGES_COMPARE ниже, но не в самом
// калькуляторе) — партнёрская программа для них НЕ подтверждена
// (affiliateConfirmed: false), поэтому кнопка «Оформить» для них не
// показывается (в AFFILIATE_LINKS ниже для них нет записи). Спред/комиссия
// у всех шести — общая оценочная цифра (0,3% / $1), а не индивидуально
// подтверждённый тариф под каждую биржу — сверяйте перед крупной суммой.
//
// WhiteBIT намеренно исключён (был здесь до 2026-09-07): биржа блокирует
// всех пользователей из России и Беларуси с начала 2022 года, а в январе
// 2026 российская Генпрокуратура признала WhiteBIT и материнскую W Group
// «нежелательной организацией» — использование, продвижение или содействие
// сервису грозит гражданам РФ уголовной ответственностью. Рекомендовать её
// целевой аудитории сайта нельзя. Не возвращать без повторной проверки.
const EXCHANGES = [
  {
    id: "bybit",
    name: "Bybit",
    spreadPercent: 0.3,
    fixedFee: 1,
    speed: "минуты",
    affiliateConfirmed: true,
    notes: "Партнёрка подтверждена (affiliates.bybit.com); обязательной ID-верификации для самой партнёрки нет. Россия формально в списке исключённых юрисдикций (Service Agreement), но по факту многие проходят верификацию российским паспортом через P2P — подробности на /exchanges/bybit/.",
  },
  {
    id: "bingx",
    name: "BingX",
    spreadPercent: 0.3,
    fixedFee: 1,
    speed: "минуты",
    affiliateConfirmed: true,
    notes: "Партнёрская программа — по заявке (нужен верифицированный аккаунт и реальный канал продвижения). России нет ни в списке Restricted Jurisdictions, ни где-либо ещё в дисклеймере — из крупных бирж сайта это единственная, кто явно не называет РФ в ограничениях (только оккупированные территории Украины).",
  },
  {
    id: "kucoin",
    name: "KuCoin",
    spreadPercent: 0.3,
    fixedFee: 1,
    speed: "минуты",
    affiliateConfirmed: true,
    notes: "Открытая партнёрская программа, 30-50% от комиссий пожизненно. Россия отдельно не входит в список ограничений — доступ по санкционному скринингу.",
  },
  {
    id: "okx",
    name: "OKX",
    spreadPercent: 0.3,
    fixedFee: 1,
    speed: "минуты",
    affiliateConfirmed: false,
    notes: "Партнёрская программа не подтверждена — кнопки «Оформить» не будет. Доступ для резидентов РФ может измениться — подробности на /exchanges/okx/.",
  },
  {
    id: "mexc",
    name: "MEXC",
    spreadPercent: 0.3,
    fixedFee: 1,
    speed: "минуты",
    affiliateConfirmed: false,
    notes: "Партнёрская программа не подтверждена — кнопки «Оформить» не будет. Подробности на /exchanges/mexc/.",
  },
  {
    id: "gate",
    name: "Gate",
    spreadPercent: 0.3,
    fixedFee: 1,
    speed: "минуты",
    affiliateConfirmed: false,
    notes: "Партнёрская программа не подтверждена — кнопки «Оформить» не будет. Подробности на /exchanges/gate/.",
  },
];

// Раздел «Сравнение бирж» (/exchanges/). Отдельно от EXCHANGES выше —
// EXCHANGES управляет расчётом в калькуляторе (только биржи с подтверждённой
// партнёркой), а EXCHANGES_COMPARE — это более широкий информационный обзор
// проверенных лицензированных бирж для сортируемой/фильтруемой таблицы и
// страниц по каждой бирже. Раздел чисто информационный — партнёрский статус
// намеренно не показывается и не участвует в фильтрах/сортировке.
//
// Критерий отбора: только площадки с публично проверяемой лицензией/
// регистрацией VASP — никаких полностью нерегулируемых бирж. WhiteBIT и HTX
// (Huobi) сюда намеренно НЕ включены — см. «Как мы отбираем биржи» на самой
// странице /exchanges/ и комментарий у EXCHANGES выше про WhiteBIT.
//
// ruAccessTier используется для фильтра «Доступ для РФ»:
//   "open" — Россия отдельно не значится в ограничениях, доступ в обычном режиме
//   "grey" — в пользовательском соглашении/ToS Россия формально исключена,
//            но по имеющимся данным резиденты РФ на практике проходят
//            верификацию и пользуются биржей (через P2P и т.п.)
// Подробности — в ruAccessText на странице каждой биржи.
//
// Цифры собраны веб-поиском на дату EXCHANGES_COMPARE_RESEARCHED и НЕ
// сверялись напрямую с официальными тарифными страницами (в отличие от
// Whitebird/Cifra Markets в OFFRAMPS выше) — dataVerified: false у всех,
// красный блок «сверьте данные» показывается на странице каждой биржи.
// Держите синхронно по цифрам с data.en.js.
const EXCHANGES_COMPARE_RESEARCHED = "2026-09-07";

const EXCHANGES_COMPARE = [
  {
    slug: "bybit",
    name: "Bybit",
    founded: 2018,
    hq: "Дубай, ОАЭ (юрлицо — Британские Виргинские острова)",
    licenses: "MiCA CASP (ЕС, Bybit EU GmbH, май 2025) · Virtual Asset Platform Operator License от SCA (ОАЭ, октябрь 2025) · VASP FSA (Сейшелы)",
    ruAccessTier: "grey",
    ruAccessText: "Россия формально входит в список исключённых юрисдикций Service Agreement (обновлено в мае 2026), наряду с Севастополем и подконтрольными России территориями Украины. При этом по многочисленным свидетельствам резиденты РФ по-прежнему регистрируются и проходят верификацию российским паспортом через P2P-раздел. Отдельная техническая сложность: bybit.com не входит в белый список Минцифры РФ, из-за чего доступ к сайту и приложению может быть ограничен на мобильных сетях с включённым режимом «безопасный интернет».",
    takerFeeValue: 0.1,
    takerFeeText: "0,1% (базовый уровень, без скидок за объём)",
    makerFeeText: "0,1%",
    depositMethods: ["P2P (включая рубли)", "крипто-депозит", "банковская карта (не во всех регионах)"],
    withdrawalFeeText: "~1 USDT в сети TRC20 (для ERC20 — заметно дороже)",
    officialUrl: "https://www.bybit.com",
    dataVerified: false,
  },
  {
    // Источник: bingx.com/en/support/articles/360034028153-disclaimer (список
    // Restricted Jurisdictions, проверено 2026-09-23) и bingx.com/en/support/
    // articles/12803820985231 (Customer Agreement).
    slug: "bingx",
    name: "BingX",
    founded: 2018,
    hq: "Сингапур, офисы в Канаде, Европе (Литва) и Австралии",
    licenses: "Регистрация MSB (AUSTRAC, Австралия; FINTRAC, Канада; FinCEN, США) · регулируется FCIS в Литве, переход на MiCA — полноценной паспортизированной MiCA CASP-лицензии на всю ЕЭЗ по состоянию на июль 2026 нет",
    ruAccessTier: "open",
    ruAccessText: "Россия не упомянута в списке Restricted Jurisdictions официального дисклеймера — туда входят только санкционные и высокорисковые юрисдикции (Иран, Северная Корея и т.п.), жёстко регулируемые рынки (США, Великобритания, ЕС-страны с местным лицензированием) и оккупированные территории Украины (Крым, ДНР, ЛНР). P2P-раздел с рублями работает, включая офферы через Сбербанк и Т-Банк; пополнение рублями возможно только через P2P, банковский депозит в рублях не поддерживается.",
    takerFeeValue: 0.1,
    takerFeeText: "0,1%",
    makerFeeText: "0,1%",
    depositMethods: ["P2P (включая рубли)", "крипто-депозит", "банковская карта"],
    withdrawalFeeText: "~1 USDT в сети TRC20",
    officialUrl: "https://bingx.com",
    dataVerified: false,
  },
  {
    slug: "kucoin",
    name: "KuCoin",
    founded: 2017,
    hq: "Сейшелы",
    licenses: "VASP FSA (Сейшелы) — в числе первых бирж, одобренных по новому закону в 2024 году",
    ruAccessTier: "open",
    ruAccessText: "Россия отдельно не значится в списке ограничений KuCoin — доступ определяется санкционным скринингом, а не гражданством или страной. По имеющимся данным сохраняет широкий доступ для пользователей из СНГ. (Регулятор ОАЭ VARA в марте 2026 потребовал приостановить операции в Дубае, а в США KuCoin бессрочно запрещён решением CFTC — оба случая не связаны с доступом для резидентов РФ.)",
    takerFeeValue: 0.1,
    takerFeeText: "0,1%",
    makerFeeText: "0,1%",
    depositMethods: ["P2P (включая рубли)", "крипто-депозит"],
    withdrawalFeeText: "~1 USDT в сети TRC20",
    officialUrl: "https://www.kucoin.com",
    dataVerified: false,
  },
  {
    slug: "okx",
    name: "OKX",
    founded: 2017,
    hq: "Сейшелы (исторически), лицензии оформлены по регионам отдельно",
    licenses: "VASP FSA (Сейшелы) · локальные разрешения на работу в ряде стран ЕС",
    ruAccessTier: "grey",
    ruAccessText: "Сегодня резиденты РФ сохраняют доступ к торговле, хотя часть фиатных сервисов ограничена. Готовящееся в России законодательство (ожидается не раньше лета 2026 года) может заблокировать доступ к площадкам без российской лицензии, включая OKX и Bybit, — статус может измениться, перепроверяйте перед тем как полагаться на биржу.",
    takerFeeValue: 0.1,
    takerFeeText: "0,1%",
    makerFeeText: "0,08%",
    depositMethods: ["P2P (включая рубли)", "крипто-депозит"],
    withdrawalFeeText: "~1 USDT в сети TRC20",
    officialUrl: "https://www.okx.com",
    dataVerified: false,
  },
  {
    slug: "mexc",
    name: "MEXC",
    founded: 2018,
    hq: "Сейшелы",
    licenses: "Регистрация VASP (Сейшелы) — публично доступной информации о дополнительных региональных лицензиях меньше, чем у других бирж в этом списке",
    ruAccessTier: "open",
    ruAccessText: "Россия не входит в список ограниченных юрисдикций MEXC — регистрация, пополнение и торговля доступны резидентам РФ в обычном режиме (ограничены только подконтрольные России территории Украины).",
    takerFeeValue: 0.075,
    takerFeeText: "~0,05-0,1% (часто ниже за счёт промо-акций по отдельным парам)",
    makerFeeText: "0%",
    depositMethods: ["P2P (включая рубли)", "крипто-депозит", "банковская карта"],
    withdrawalFeeText: "~1 USDT в сети TRC20",
    officialUrl: "https://www.mexc.com",
    dataVerified: false,
  },
  {
    slug: "gate",
    name: "Gate",
    founded: 2013,
    hq: "Каймановы острова",
    licenses: "MiCA CASP от мальтийского регулятора MFSA (октябрь 2025) с паспортизацией на весь ЕЭЗ · лицензия платёжного института по PSD2 (февраль 2026)",
    ruAccessTier: "grey",
    ruAccessText: "Россия указана как ограниченная юрисдикция в пользовательском соглашении (п. 2.5), но по имеющимся данным резиденты РФ по-прежнему торгуют и пополняют счёт в рублях через P2P.",
    takerFeeValue: 0.2,
    takerFeeText: "0,2% (базовый уровень, снижается токеном GT)",
    makerFeeText: "0,2%",
    depositMethods: ["P2P (включая рубли)", "крипто-депозит", "банковский перевод (в отдельных регионах)"],
    withdrawalFeeText: "~1 USDT в сети TRC20",
    officialUrl: "https://www.gate.io",
    dataVerified: false,
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
// onRampSupported: оба сервиса ниже, судя по общедоступным обзорам (проверено
// 2026-09-12), работают в обе стороны — не только продают USDT за рубли, но
// и продают USDT за рубли/покупают USDT на рубли напрямую (не только off-ramp).
// Калькулятор поэтому предлагает их и как альтернативу бирже для покупки
// крипты. Но именно тариф на ПОКУПКУ у каждого сервиса отдельно не проверялся
// — используется тот же spreadPercent/fixedFee, что подтверждён для продажи
// (см. источники ниже), поэтому такие строки в калькуляторе всегда помечены
// «не подтверждено», а не приравниваются к подтверждённым цифрам биржи.
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
    onRampSupported: true,
    license: "Лицензированная площадка в Беларуси",
    crypto: ["USDT", "BTC", "ETH"],
    currencies: ["RUB", "BYN"],
    officialUrl: "https://whitebird.io",
    notes: "Лицензированная площадка (Беларусь): USDT/BTC/ETH → RUB/BYN на карту МИР, и в обратную сторону — покупка крипты за рубли/BYN. 2,0% — тариф для вывода на карту банка РФ, whitebird.io/commission (тариф на покупку отдельно не проверялся).",
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
    onRampSupported: true,
    license: "Брокерская платформа для трейдеров СНГ (публичных данных о лицензии не найдено)",
    crypto: ["USDT"],
    currencies: ["RUB"],
    officialUrl: "https://cifra.by",
    notes: "Брокерская платформа для трейдеров СНГ, работает в обе стороны (покупка и продажа USDT за рубли). 1,5% конвертация + 500 ₽ вывод (0, если выводить в Цифра банк), cifra.by/rates (тариф на покупку отдельно не проверялся).",
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
  bingx: { url: null, label: "Зарегистрироваться в BingX" },
  kucoin: { url: null, label: "Зарегистрироваться в KuCoin" },
};

// Данные по выплатам пропфирм собраны через веб-поиск.
// ВАЖНО: перед публикацией каждой страницы проверяйте актуальные условия
// напрямую на сайте фирмы — эти данные могут быть неточными или устаревшими.
// challengePayment — можно ли купить у фирмы челлендж (оценку), оплатив
// криптой, и на каких условиях. Собрано веб-поиском 2026-09-12 по
// официальным FAQ/справочным центрам фирм (ссылки — в комментарии над
// каждой записью ниже); dataVerified: false и cryptoFeePercent: null там,
// где сама комиссия платёжного провайдера за приём крипты не публикуется —
// не считайте эту часть подтверждённой без сверки на сайте фирмы.
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
    // Источник: ftmo.com/en/faq/what-payment-methods-are-available/ (проверено 2026-09-12).
    challengePayment: {
      acceptsCrypto: true,
      cryptoAssets: "BTC, ETH, LTC, USDT, USDC",
      priceCurrency: "EUR",
      cryptoFeePercent: 3,
      notes: "Комиссия 3% указана официально — столько же берётся за оплату PayPal/Skrill.",
      officialUrl: "https://ftmo.com",
      dataVerified: true,
    },
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
    // Источник: help.fundednext.com/en/articles/8342202 (проверено 2026-09-12).
    challengePayment: {
      acceptsCrypto: true,
      cryptoAssets: "BTC, ETH, LTC, DOGE, SOL, USDT (TRC20/ERC20), USDC (ERC20)",
      priceCurrency: "USD",
      cryptoFeePercent: null,
      notes: "Комиссия платёжного провайдера за приём крипты не раскрыта — уточните на сайте перед оплатой. XRP, XLM, ADA и MATIC не принимаются.",
      officialUrl: "https://fundednext.com",
      dataVerified: false,
    },
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
    // Источник: help.the5ers.com/what-payment-methods-are-available (проверено 2026-09-12).
    challengePayment: {
      acceptsCrypto: true,
      cryptoAssets: "USDT, USDC, TRX, USDG, ETH — через Confirmo, несколько сетей на выбор",
      priceCurrency: "USD",
      cryptoFeePercent: null,
      notes: "Комиссия платёжного провайдера за приём крипты не раскрыта — уточните на сайте перед оплатой.",
      officialUrl: "https://the5ers.com",
      dataVerified: false,
    },
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
    // Источник: общие обзоры e8markets.com/challenges (проверено 2026-09-12) —
    // список принимаемых монет и комиссия за крипто-оплату не публикуются.
    challengePayment: {
      acceptsCrypto: true,
      cryptoAssets: "Принимается («Крипто» среди способов оплаты), список монет не публикуется",
      priceCurrency: "USD",
      cryptoFeePercent: null,
      notes: "Комиссия платёжного провайдера за приём крипты не раскрыта — уточните на сайте перед оплатой.",
      officialUrl: "https://e8markets.com",
      dataVerified: false,
    },
  },
  {
    // Источники (проверено 2026-09-08): help.topstep.com/en/articles/8284233
    // и обзоры proptradingvibes.com/tradecovex.com за 2026 год.
    slug: "topstep",
    name: "Topstep",
    methods: [
      "Prop-to-Brokerage (только США)",
      "Aeropay (только США)",
      "Wise (международный)",
      "ACH (США)",
      "Wire/SWIFT (международный)",
    ],
    fee: "Wise, Prop-to-Brokerage и Aeropay — без комиссии от фирмы; ACH и Wire — $30",
    minWithdrawal: "$125",
    speed: "Одобрение 1-3 рабочих дня; Prop-to-Brokerage/Aeropay — в тот же день, ACH/Wise — 1-3 дня, Wire — 5-10 дней",
    notes: "Prop-to-Brokerage и Aeropay доступны только трейдерам из США — для остальных реальный выбор это Wise (без комиссии) или Wire ($30).",
    payoutCurrency: "USD",
    // Источник: help.topstep.com/en/articles/14289835-topstep-pricing-and-payment-questions
    // (проверено 2026-09-12) — «Topstep accepts Visa, Mastercard, American
    // Express, and Discover. PayPal is not supported.» Крипта не упомянута
    // нигде в официальной документации по оплате Trading Combine.
    challengePayment: {
      acceptsCrypto: false,
      cryptoAssets: "",
      priceCurrency: "USD",
      cryptoFeePercent: null,
      notes: "Оплата только банковской картой (Visa, Mastercard, American Express, Discover) — криптовалюта и PayPal не принимаются.",
      officialUrl: "https://www.topstep.com",
      dataVerified: true,
    },
  },
  {
    // Источники (проверено 2026-09-08): therocktrading.com/reviews/brightfunded,
    // proptradingvibes.com/blog/brightfunded-payout-structure.
    slug: "brightfunded",
    name: "BrightFunded",
    methods: ["USDC (сеть ERC-20)", "Банковский перевод (EUR)"],
    fee: "Комиссии от фирмы нет; сторонние расходы ~$5-50 в зависимости от способа",
    minWithdrawal: "Официального минимума не заявлено (по данным обзоров — от $0,01)",
    speed: "В среднем ~17 часов, гарантированно до 24 часов — плюс время подтверждения сети или банка",
    notes: "Первая выплата доступна через 30 дней после первой сделки на финансируемом счету, далее раз в две недели (быстрее — платный апгрейд).",
    payoutCurrency: "USD",
    // Источник: help.brightfunded.com/en/articles/9286623-can-i-pay-for-my-challenge-with-crypto
    // (проверено 2026-09-12) — карты и PayPal не принимаются вообще.
    challengePayment: {
      acceptsCrypto: true,
      cryptoAssets: "BTC (сеть Bitcoin и Lightning), ETH, LTC, TRX, SOL, USDT (TRC20), USDC (ERC20)",
      priceCurrency: "USD",
      cryptoFeePercent: null,
      notes: "Банковские карты и PayPal не принимаются вообще — оплата только криптовалютой. Комиссия платёжного провайдера за приём крипты не раскрыта.",
      officialUrl: "https://brightfunded.com",
      dataVerified: false,
    },
  },
  {
    // Источники (проверено 2026-09-08): quantvps.com/blog/blueberry-funded-payout-rules,
    // propvator.com/blog/blueberry-funded-payout-methods.
    slug: "blueberry-funded",
    name: "Blueberry Funded",
    methods: ["USDC / USDT-TRC20 (до $2 000 за заявку)", "RiseWorks (для более крупных сумм)"],
    fee: "Комиссии от фирмы нет; у RiseWorks ~10% на крупные суммы, у крипто — сетевая комиссия",
    minWithdrawal: "$100",
    speed: "Обработка 1-2 рабочих дня, выплаты раз в 14 дней (быстрее — платные апгрейды: 7 дней / 3 дня / по требованию)",
    notes: "Крипто-выплата (USDC/USDT-TRC20) ограничена суммой $2 000 за заявку — более крупные суммы идут через RiseWorks.",
    payoutCurrency: "USD",
    // Источник: help.blueberryfunded.com/en/articles/10527841-how-to-make-payment-using-crypto
    // (проверено 2026-09-12).
    challengePayment: {
      acceptsCrypto: true,
      cryptoAssets: "USDT, USDC — через Boomfi/Confirmo",
      priceCurrency: "USD",
      cryptoFeePercent: null,
      notes: "Комиссия платёжного провайдера за приём крипты не раскрыта — уточните на сайте перед оплатой. Из альтернатив — карта, UPI/IMPS, GCash, GrabPay (по региону).",
      officialUrl: "https://blueberryfunded.com",
      dataVerified: false,
    },
  },
  {
    // Источники (проверено 2026-09-14): trustpilot.com/review/fundingpips.com
    // (68 367 отзывов, 4.5/5), help.fundingpips.com/hc/en-us/articles/
    // 34504564970385-Reward-Methods, forexpeacearmy.com/forex-reviews/21467.
    slug: "fundingpips",
    name: "FundingPips",
    methods: ["Крипто (USDT/USDC)", "Rise", "Банковская карта", "Банковский перевод"],
    fee: "Точный процент комиссии за вывод не публикуется — вычитается вместе с курсом и сетевой комиссией, зависит от способа",
    minWithdrawal: "Явно не указан; для Rise упоминается порог $500",
    speed: "Крипто — обычно минуты после одобрения запроса; карта/Rise/банк — 24-48 часов",
    notes: "",
    payoutCurrency: "USD",
    challengePayment: {
      acceptsCrypto: true,
      cryptoAssets: "USDT (TRC20) и другие — принимаются напрямую на этапе оплаты",
      priceCurrency: "USD",
      cryptoFeePercent: null,
      notes: "Подтверждение крипто-платежа занимает 10-30 минут; упоминается сетевая комиссия ~$1 (это комиссия сети, не самой фирмы — её процент отдельно не раскрыт).",
      officialUrl: "https://fundingpips.com",
      dataVerified: false,
    },
  },
  {
    // Источники (только официальные страницы фирмы): help.alphacapitalgroup.uk/en/articles/6933755 (способы и срок), alphacapitalgroup.uk/resources/alpha-capital-country-availability-2026 (страны) — проверено 2026-09-20.
    // challengePayment: null — условия оплаты челленджа криптой не подтверждены,
    // поэтому фирма не предлагается в калькуляторе как «Куда» (только как «Откуда»).
    slug: "alpha-capital",
    name: "Alpha Capital Group",
    methods: ["Rise", "Wise", "Банковский перевод (WIRE/ACH/SWIFT)"],
    fee: "Не указана — проверьте перед тем как полагаться на это",
    minWithdrawal: "Не указана — проверьте перед тем как полагаться на это",
    speed: "До 2 рабочих дней после запроса",
    notes: "Криптой напрямую фирма не платит — только через Rise. Россия и Беларусь в списке недоступных стран. Валюта выплат на официальных страницах не указана: расчёт в USD — проверьте.",
    payoutCurrency: "USD",
    challengePayment: null,
  },
  {
    // Источники (только официальные страницы фирмы): fxify.com/faqs/payouts/ и /faqs/all-faqs/how-do-i-withdraw-my-profits/ (способы, минимум, срок), /faqs/all-faqs/what-countries-are-accepted/ (страны) — проверено 2026-09-20.
    // challengePayment: null — условия оплаты челленджа криптой не подтверждены,
    // поэтому фирма не предлагается в калькуляторе как «Куда» (только как «Откуда»).
    slug: "fxify",
    name: "FXIFY",
    methods: ["Rise"],
    fee: "Не указана — проверьте перед тем как полагаться на это",
    minWithdrawal: "$50",
    speed: "Обычно до 3 рабочих дней после одобрения",
    notes: "Для трейдеров из Украины, где Rise недоступен, возможны выплаты криптой (USDC/USDT). Россия и Беларусь в списке недоступных стран. Валюта выплат на официальных страницах не указана: расчёт в USD — проверьте.",
    payoutCurrency: "USD",
    challengePayment: null,
  },
  {
    // Источники (только официальные страницы фирмы): help.fundedtradingplus.com/payout-methods-offered/ (способы), /prohibited-countries/ (страны) — проверено 2026-09-20.
    // challengePayment: null — условия оплаты челленджа криптой не подтверждены,
    // поэтому фирма не предлагается в калькуляторе как «Куда» (только как «Откуда»).
    slug: "funded-trading-plus",
    name: "Funded Trading Plus",
    methods: ["Крипто", "Rise"],
    fee: "Не указана — проверьте перед тем как полагаться на это",
    minWithdrawal: "Не указана — проверьте перед тем как полагаться на это",
    speed: "Не указана — проверьте перед тем как полагаться на это",
    notes: "Россия и Беларусь в списке запрещённых стран. Валюта выплат на официальных страницах не указана: расчёт в USD — проверьте.",
    payoutCurrency: "USD",
    challengePayment: null,
  },
];
