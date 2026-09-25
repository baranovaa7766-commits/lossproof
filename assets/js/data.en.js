// Static data for crypto payout routes, exchanges, cash-out services and
// prop firms (English). The site has no affiliate links (decision
// 2026-09-23). Fee/spread figures are estimates for comparison purposes —
// always verify live rates directly with each provider before withdrawing.
// Keep this in sync with assets/js/data.js (the Russian version) whenever
// the underlying numbers (spreadPercent, fixedFee, ids, slugs) change.
//
// The site compares exchange + off-ramp combos (buy USDT, then convert
// USDT to local currency) instead of Wise/Revolut/bank, because Wise and
// Revolut don't work for users in Russia. Bank transfer is kept as a
// contrasting worst-case baseline.

const CURRENCIES = ["USD", "EUR", "GBP", "AUD", "CAD", "CHF", "JPY", "PLN", "CZK", "HUF", "RON", "BGN", "TRY", "INR", "ZAR", "MXN", "BRL", "NGN", "SEK", "NOK", "DKK", "RUB", "KZT", "UAH", "BYN"];

// Date the spreads/fees below (EXCHANGES, OFFRAMPS, BANK_BASELINE) were last
// manually checked against providers' public tariffs. Shown on the site as
// "Fees verified: …" — update alongside the numbers.
const DATA_LAST_VERIFIED = "2026-09-03";

// Crypto exchanges — stage 1 (buying/receiving USDT) in the calculator. The
// same six exchanges as the informational EXCHANGES_COMPARE list below. The
// spread/fee for all six is a shared estimate (0.3% / $1), not an
// individually verified tariff per exchange — verify before a large amount.
//
// WhiteBIT is deliberately excluded (was here until 2026-09-07): it has
// blocked all users from Russia and Belarus since early 2022, and in
// January 2026 Russia's Prosecutor General designated WhiteBIT and parent
// company W Group an "undesirable organization" — using, promoting, or
// assisting the service now carries criminal liability for Russian
// citizens. Not something to recommend to this site's audience. Don't
// re-add without re-checking.
const EXCHANGES = [
  {
    id: "bybit",
    name: "Bybit",
    spreadPercent: 0.3,
    fixedFee: 1,
    speed: "minutes",
    notes: "Russia isn't on Bybit's list of excluded jurisdictions — details in the exchange comparison.",
  },
  {
    id: "bingx",
    name: "BingX",
    spreadPercent: 0.3,
    fixedFee: 1,
    speed: "minutes",
    notes: "Russia isn't named in BingX's restricted jurisdictions — details in the exchange comparison.",
  },
  {
    id: "kucoin",
    name: "KuCoin",
    spreadPercent: 0.3,
    fixedFee: 1,
    speed: "minutes",
    notes: "Russia isn't on KuCoin's restricted list; Kazakhstan and Uzbekistan are.",
  },
  {
    id: "okx",
    name: "OKX",
    spreadPercent: 0.3,
    fixedFee: 1,
    speed: "minutes",
    notes: "For Russia OKX restricts fiat payment services — details in the exchange comparison.",
  },
  {
    id: "mexc",
    name: "MEXC",
    spreadPercent: 0.3,
    fixedFee: 1,
    speed: "minutes",
    notes: "Russia isn't among MEXC's prohibited jurisdictions; Kazakhstan is.",
  },
  {
    id: "gate",
    name: "Gate",
    spreadPercent: 0.3,
    fixedFee: 1,
    speed: "minutes",
    notes: "Russia is listed as a restricted jurisdiction in the user agreement — details in the exchange comparison.",
  },
];

// "Compare exchanges" section (/exchanges/). Separate from EXCHANGES above —
// EXCHANGES drives the calculator's math, while EXCHANGES_COMPARE is an
// informational overview of the same exchanges for a sortable/filterable
// table. There are no per-exchange pages (removed 2026-09-25): all exchanges
// are shown the same way, in one list, with no links to their sites, so the
// comparison doesn't read as advertising of foreign crypto exchanges, which
// isn't allowed in Russia. officialUrl is used only by the company check in
// scripts/ and isn't shown on the site.
//
// Inclusion bar: only platforms with a publicly checkable license/VASP
// registration — no fully unregulated exchanges. WhiteBIT and HTX (Huobi)
// are deliberately NOT included here — see "How we pick exchanges" on the
// /exchanges/ page itself and the WhiteBIT comment above EXCHANGES.
//
// ruAccessTier drives the "Russia access" filter:
//   "open" — Russia isn't separately listed as restricted, normal access
//   "grey" — the ToS/user agreement has restrictions for Russia.
// The site doesn't describe how restrictions are worked around in practice.
// Details are in ruAccessText (shown on the exchange's card).
//
// Figures were gathered via web search as of EXCHANGES_COMPARE_RESEARCHED
// and have NOT been checked directly against official fee pages (unlike
// Whitebird/Cifra Markets in OFFRAMPS above) — dataVerified: false for all,
// with a "verify" note shown under the comparison. Keep the numbers in
// sync with data.js.
const EXCHANGES_COMPARE_RESEARCHED = "2026-09-07";

const EXCHANGES_COMPARE = [
  {
    slug: "bybit",
    name: "Bybit",
    founded: 2018,
    hq: "Dubai, UAE (headquarters since 2023)",
    licenses: "MiCA — held by the European arm Bybit EU GmbH (Austria, since 28.05.2025, ESMA register) · SCA Virtual Asset Platform Operator licence (UAE, October 2025) — for UAE clients · Seychelles VASP licence application under assessment (FSA register)",
    ruAccessTier: "open",
    ruAccessText: "Russia is not on Bybit's list of excluded jurisdictions (help article \"Service Restricted Countries\", updated 01.09.2026). Excluded are, among others, the US, Canada, Uzbekistan and Russian-controlled regions of Ukraine — in Bybit's wording Crimea, Donetsk, Rostov and Luhansk regions, plus Sevastopol.",
    takerFeeValue: 0.1,
    takerFeeText: "0.1% (Non-VIP base tier)",
    makerFeeText: "0.1%",
    depositMethods: ["P2P", "crypto deposit", "bank card — depends on the country"],
    withdrawalFeeText: "Depends on the network and changes — the withdrawal form shows the exact amount",
    officialUrl: "https://www.bybit.com",
    dataVerified: false,
  },
  {
    // Source: bingx.com/en/support/articles/360034028153-disclaimer (Restricted
    // Jurisdictions list, checked 2026-09-23) and bingx.com/en/support/articles/
    // 12803820985231 (Customer Agreement).
    slug: "bingx",
    name: "BingX",
    founded: 2018,
    hq: "Singapore, with offices in Canada, Europe (Lithuania) and Australia",
    licenses: "The European arm BingX EU has applied for a MiCA licence in Austria (FMA); as of 16.06.2026 it has not been granted (per BingX). BingX isn't in the ESMA or Seychelles FSA registers",
    ruAccessTier: "open",
    ruAccessText: "Russia isn't named in the Restricted Jurisdictions list of BingX's disclaimer. The list includes, among others, the US, UK, Canada, the Netherlands, Singapore, mainland China and Hong Kong, plus Crimea, Donetsk and Luhansk.",
    takerFeeValue: 0.1,
    takerFeeText: "0.1%",
    makerFeeText: "0.1%",
    depositMethods: ["P2P", "crypto deposit", "bank card — depends on the country"],
    withdrawalFeeText: "Depends on the network and changes — the withdrawal form shows the exact amount",
    officialUrl: "https://bingx.com",
    dataVerified: false,
  },
  {
    slug: "kucoin",
    name: "KuCoin",
    founded: 2017,
    hq: "The user agreement names no legal entity or country of registration",
    licenses: "MiCA — held by the European arm KuCoin EU Exchange GmbH (Austria, since 27.11.2025, ESMA register). No licence for the main platform in the ESMA or Seychelles FSA registers",
    ruAccessTier: "open",
    ruAccessText: "Russia isn't on KuCoin's list of restricted jurisdictions (terms of use, updated 29.07.2026). The list includes Kazakhstan and Uzbekistan, plus the US, Singapore, mainland China and Hong Kong, Malaysia, France, the Netherlands, Ontario and British Columbia, Crimea, Donetsk, Luhansk, Zaporizhzhia and Kherson.",
    takerFeeValue: 0.1,
    takerFeeText: "0.1% for major coins (class A); 0.2% and 0.3% for classes B and C",
    makerFeeText: "0.1% (class A); 0.2% and 0.3% for classes B and C",
    depositMethods: ["P2P", "crypto deposit"],
    withdrawalFeeText: "Depends on the network and changes — the withdrawal form shows the exact amount",
    officialUrl: "https://www.kucoin.com",
    dataVerified: false,
  },
  {
    slug: "okx",
    name: "OKX",
    founded: 2017,
    hq: "Seychelles (Aux Cayes FinTech Co. Ltd.); separate entities for the EU, UAE, US and several other countries",
    licenses: "MiCA — held by OKX Europe Limited (Malta, since 27.01.2025, ESMA register) · Seychelles VASP licence application under assessment (FSA register)",
    ruAccessTier: "grey",
    ruAccessText: "OKX's risk and compliance disclosure (updated 08.07.2026) mentions Russia only regarding fiat payment services. Fully restricted are, among others, Uzbekistan and Crimea, Donetsk and Luhansk.",
    takerFeeValue: 0.1,
    takerFeeText: "0.1%",
    makerFeeText: "0.08%",
    depositMethods: ["crypto deposit", "P2P — depends on the country"],
    withdrawalFeeText: "Depends on the network and changes — the withdrawal form shows the exact amount",
    officialUrl: "https://www.okx.com",
    dataVerified: false,
  },
  {
    slug: "mexc",
    name: "MEXC",
    founded: 2018,
    hq: "The user agreement names no legal entity or country of registration",
    licenses: "No licence in the ESMA (MiCA) or Seychelles FSA registers; MEXC doesn't publish a licence list",
    ruAccessTier: "open",
    ruAccessText: "Russia isn't named among MEXC's prohibited jurisdictions (user agreement, updated 29.05.2025). The list includes Kazakhstan, plus the US, UK, Canada, Singapore, Malaysia, mainland China and Hong Kong and Russian-controlled regions of Ukraine.",
    takerFeeValue: 0.05,
    takerFeeText: "0.05% on major pairs (e.g. BTC/USDT), 0% on some pairs",
    makerFeeText: "0%",
    depositMethods: ["P2P", "crypto deposit", "bank card — depends on the country"],
    withdrawalFeeText: "Depends on the network and changes — the withdrawal form shows the exact amount",
    officialUrl: "https://www.mexc.com",
    dataVerified: false,
  },
  {
    slug: "gate",
    name: "Gate",
    founded: 2013,
    hq: "The user agreement is governed by the laws of Panama",
    licenses: "MiCA — held by Gate Technology Ltd (Malta, since 29.09.2025, ESMA register) · MFSA PSD2 payment institution licence (February 2026) — both for the European arm",
    ruAccessTier: "grey",
    ruAccessText: "Russia is explicitly named among restricted locations (clause 2.5 of Gate's user agreement), as is Uzbekistan. Under Gate's terms the service may not be used from such locations, and the exchange reserves the right to freeze funds.",
    takerFeeValue: 0.1,
    takerFeeText: "0.1% (base tier; 0.09% when paying fees with the GT token)",
    makerFeeText: "0.1%",
    depositMethods: ["crypto deposit", "P2P — depends on the country", "bank transfer — in select regions"],
    withdrawalFeeText: "Depends on the network and changes — the withdrawal form shows the exact amount",
    officialUrl: "https://www.gate.com",
    dataVerified: false,
  },
];

// Off-ramp services — stage 2 (USDT to local currency).
//
// `dataVerified: true` only means the spread/fixedFee below came
// from the provider's own published fee page (not a guess) as of the date
// noted. Fees change without notice and neither provider exposes a public
// API for them — there's no live auto-refresh for these the way there is
// for the exchange rate in rates.js (which refetches on every calculation).
// Re-check the linked pages every few months and update the numbers.
//
// onRampSupported: per publicly available reviews (checked 2026-09-12), both
// services below work in both directions — not just selling USDT for
// rubles, but buying USDT with rubles directly too. The calculator therefore
// also offers them as an alternative to an exchange for buying crypto. The
// BUY-side tariff specifically hasn't been checked for either service —
// rows reuse the confirmed sell-side spreadPercent/fixedFee (sources below),
// so those calculator rows are always flagged "unconfirmed" rather than
// treated as equivalent to a verified exchange rate.
//
// A7A5 is deliberately excluded: it isn't a standalone off-ramp but a
// ruble-backed stablecoin from A7/Old Vector LLC, traded mainly on the
// Grinex exchange — and Grinex, along with entities tied to A7A5, was
// sanctioned by the US Treasury's OFAC in August 2025 as a successor to the
// already-sanctioned Garantex exchange. Don't re-add without re-checking
// sanctions status.
const OFFRAMPS = [
  {
    id: "whitebird",
    // Source: https://whitebird.io/commission (checked 2026-09-03).
    // "Other payment methods" -> "Russian bank cards", "client sells"
    // column: 2.0%. That's the most universally applicable RUB card
    // withdrawal option; VTB Pay is cheaper (1.7%) but only for VTB
    // cardholders. No separate flat/network fee is listed on top of it.
    name: "Whitebird",
    spreadPercent: 2.0,
    fixedFee: 0,
    speed: "10-30 minutes",
    dataVerified: true,
    onRampSupported: true,
    license: "Belarus Hi-Tech Park resident; under an EU transaction ban since 23.08.2026",
    crypto: ["USDT", "BTC", "ETH"],
    currencies: ["RUB", "BYN"],
    officialUrl: "https://whitebird.io",
    notes: "Since 23.08.2026 the EU has banned EU persons and companies from any transactions with Whitebird (21st sanctions package, Council Decision 2026\/1849): transfers linked to it may be delayed or blocked in sanctions screening. Belarus Hi-Tech Park resident: converts USDT/BTC/ETH to RUB/BYN onto a Mir card, and the other way too — buying crypto with rubles/BYN. 2.0% is the rate for withdrawing to a Russian bank card, whitebird.io/commission (the buy-side rate hasn't been separately checked).",
  },
  {
    id: "cifra",
    // Source: https://cifra.by/rates (checked 2026-09-03).
    // 1.5% is the crypto-to-fiat (USDT/RUB) conversion fee on the entry-
    // level "Consulting" plan. On top of that, non-Belarus residents pay a
    // flat RUB withdrawal fee of 500 RUB (0 if withdrawing into a Cifra
    // Bank account). Converted to ~$6 at ~85 RUB/USD for consistency with
    // the other fixedFee values (the original fee is in RUB, not USD).
    name: "Cifra Markets",
    spreadPercent: 1.5,
    fixedFee: 6,
    speed: "1 business day (withdrawals only process on bank business days)",
    dataVerified: true,
    onRampSupported: true,
    license: "Brokerage platform for CIS-based traders (no public licensing info found)",
    crypto: ["USDT"],
    currencies: ["RUB"],
    officialUrl: "https://cifra.by",
    notes: "Brokerage platform for CIS-based traders, works both ways (buys and sells USDT for rubles). 1.5% conversion + a 500 RUB withdrawal fee (0 if withdrawing into a Cifra Bank account), cifra.by/rates (the buy-side rate hasn't been separately checked).",
  },
];

// Bank transfer — kept only as a contrasting worst-case baseline.
const BANK_BASELINE = {
  id: "bank",
  name: "Bank transfer (for comparison)",
  markupPercent: 3,
  fixedFee: 25,
  speed: "3-7 days",
  notes: "Shown for contrast — a bank's rate is typically well below what crypto routes offer.",
};

// E-wallets — reference only, not part of the calculator's math. Used as an
// intermediate step between an exchange and an off-ramp.
const E_WALLETS = [
  {
    id: "payeer",
    name: "Payeer",
    notes: "Since 25.11.2025 the EU has banned transactions with Payeer (19th sanctions package) — we don't suggest it as an intermediate step.",
  },
  {
    id: "advcash",
    name: "AdvCash / Volet",
    notes: "An e-wallet; check its terms for users from Russia with the service.",
  },
];

// Prop-firm specific payout data, collected via web research.
// IMPORTANT: verify every figure directly on the firm's own site before
// publishing that firm's page — these can be out of date or inaccurate.
// challengePayment — whether a trader can buy the firm's challenge with
// crypto, and on what terms. Gathered via web search 2026-09-12 from each
// firm's official FAQ/help center (sources noted per entry below);
// dataVerified: false and cryptoFeePercent: null wherever the payment
// processor's own fee for accepting crypto isn't publicly disclosed — don't
// treat that part as confirmed without checking the firm's site directly.
const FIRMS = [
  {
    slug: "ftmo",
    name: "FTMO",
    methods: [
      "Bank transfer",
      "Visa Direct / Mastercard Send (up to $20K)",
      "Skrill (up to $3K)",
      "Crypto",
    ],
    fee: "No firm-side fee; your bank may charge its own fee",
    minWithdrawal: "$20 (bank) / $50 (crypto)",
    speed: "1-2 days",
    notes: "Bank transfer is unavailable for traders in Venezuela, Cuba, Sudan, and Ukraine.",
    payoutCurrency: "USD",
    // Source: ftmo.com/en/faq/what-payment-methods-are-available/ (checked 2026-09-12).
    challengePayment: {
      acceptsCrypto: true,
      cryptoAssets: "BTC, ETH, LTC, USDT, USDC",
      priceCurrency: "EUR",
      cryptoFeePercent: 3,
      notes: "The 3% fee is officially stated — the same rate applies to PayPal/Skrill.",
      officialUrl: "https://ftmo.com",
      dataVerified: true,
    },
  },
  {
    slug: "fundednext",
    name: "FundedNext",
    methods: ["USDT/USDC (crypto)", "RiseWorks", "Bank transfer", "Confirmo"],
    fee: "Up to 3% (paid by the trader)",
    minWithdrawal: "Not specified — verify before relying on this",
    speed: "24h (crypto/RiseWorks), up to 5 days (bank)",
    notes: "RiseWorks is only available in select regions; traders in Iran can only use TC Pay.",
    payoutCurrency: "USD",
    // Source: help.fundednext.com/en/articles/8342202 (checked 2026-09-12).
    challengePayment: {
      acceptsCrypto: true,
      cryptoAssets: "BTC, ETH, LTC, DOGE, SOL, USDT (TRC20/ERC20), USDC (ERC20)",
      priceCurrency: "USD",
      cryptoFeePercent: null,
      notes: "The payment processor's fee for accepting crypto isn't disclosed — check the site before paying. XRP, XLM, ADA, and MATIC aren't accepted.",
      officialUrl: "https://fundednext.com",
      dataVerified: false,
    },
  },
  {
    slug: "the5ers",
    name: "The5ers",
    methods: ["RiseWorks", "Crypto", "Bank transfer", "Hub Credits"],
    fee: "Bank 3%, crypto/RiseWorks 2% (some sources cite a flat 3.5%) — verify before relying on this",
    minWithdrawal: "$150",
    speed: "~72 hours, on a biweekly payout cycle",
    notes: "Crypto withdrawals are capped at $1,500 per request.",
    payoutCurrency: "USD",
    // Source: help.the5ers.com/what-payment-methods-are-available (checked 2026-09-12).
    challengePayment: {
      acceptsCrypto: true,
      cryptoAssets: "USDT, USDC, TRX, USDG, ETH — via Confirmo, pick from several networks",
      priceCurrency: "USD",
      cryptoFeePercent: null,
      notes: "The payment processor's fee for accepting crypto isn't disclosed — check the site before paying.",
      officialUrl: "https://the5ers.com",
      dataVerified: false,
    },
  },
  {
    slug: "e8-markets",
    name: "E8 Markets",
    methods: ["RiseWorks", "WorkMarket"],
    fee: "No firm-side fee",
    minWithdrawal: "$100",
    speed: "Not specified — verify before relying on this",
    notes: "",
    payoutCurrency: "USD",
    // Source: general reviews of e8markets.com/challenges (checked 2026-09-12) —
    // the accepted coin list and crypto-payment fee aren't publicly listed.
    challengePayment: {
      acceptsCrypto: true,
      cryptoAssets: "Accepted (\"Crypto\" is listed as a payment method), coin list not published",
      priceCurrency: "USD",
      cryptoFeePercent: null,
      notes: "The payment processor's fee for accepting crypto isn't disclosed — check the site before paying.",
      officialUrl: "https://e8markets.com",
      dataVerified: false,
    },
  },
  {
    // Sources (checked 2026-09-08): help.topstep.com/en/articles/8284233 and
    // 2026 reviews from proptradingvibes.com / tradecovex.com.
    slug: "topstep",
    name: "Topstep",
    methods: [
      "Prop-to-Brokerage (US only)",
      "Aeropay (US only)",
      "Wise (international)",
      "ACH (US)",
      "Wire/SWIFT (international)",
    ],
    fee: "Wise, Prop-to-Brokerage, and Aeropay carry no firm-side fee; ACH and Wire cost $30",
    minWithdrawal: "$125",
    speed: "Approval 1-3 business days; Prop-to-Brokerage/Aeropay same-day, ACH/Wise 1-3 days, Wire 5-10 days",
    notes: "Prop-to-Brokerage and Aeropay are only available to US-based traders — everyone else's real choice is Wise (no fee) or Wire ($30).",
    payoutCurrency: "USD",
    // Source: help.topstep.com/en/articles/14289835-topstep-pricing-and-payment-questions
    // (checked 2026-09-12) — "Topstep accepts Visa, Mastercard, American
    // Express, and Discover. PayPal is not supported." Crypto is never
    // mentioned anywhere in the official Trading Combine payment docs.
    challengePayment: {
      acceptsCrypto: false,
      cryptoAssets: "",
      priceCurrency: "USD",
      cryptoFeePercent: null,
      notes: "Card only (Visa, Mastercard, American Express, Discover) — crypto and PayPal aren't accepted.",
      officialUrl: "https://www.topstep.com",
      dataVerified: true,
    },
  },
  {
    // Sources (checked 2026-09-08): therocktrading.com/reviews/brightfunded,
    // proptradingvibes.com/blog/brightfunded-payout-structure.
    slug: "brightfunded",
    name: "BrightFunded",
    methods: ["USDC (ERC-20 network)", "Bank transfer (EUR)"],
    fee: "No firm-side fee; third-party costs ~$5-50 depending on method",
    minWithdrawal: "No official minimum stated (reviews report as low as $0.01)",
    speed: "~17 hours on average, guaranteed within 24 hours — plus network/bank confirmation time",
    notes: "The first payout is available 30 days after the first trade on a funded account, then every two weeks (faster with a paid upgrade).",
    payoutCurrency: "USD",
    // Source: help.brightfunded.com/en/articles/9286623-can-i-pay-for-my-challenge-with-crypto
    // (checked 2026-09-12) — cards and PayPal aren't accepted at all.
    challengePayment: {
      acceptsCrypto: true,
      cryptoAssets: "BTC (Bitcoin and Lightning networks), ETH, LTC, TRX, SOL, USDT (TRC20), USDC (ERC20)",
      priceCurrency: "USD",
      cryptoFeePercent: null,
      notes: "Cards and PayPal aren't accepted at all — crypto is the only payment method. The processor's fee for accepting crypto isn't disclosed.",
      officialUrl: "https://brightfunded.com",
      dataVerified: false,
    },
  },
  {
    // Sources (checked 2026-09-08): quantvps.com/blog/blueberry-funded-payout-rules,
    // propvator.com/blog/blueberry-funded-payout-methods.
    slug: "blueberry-funded",
    name: "Blueberry Funded",
    methods: ["USDC / USDT-TRC20 (up to $2,000 per request)", "RiseWorks (for larger amounts)"],
    fee: "No firm-side fee; RiseWorks runs ~10% on larger amounts, crypto has a network fee",
    minWithdrawal: "$100",
    speed: "1-2 business days processing, payouts every 14 days (faster with paid upgrades: 7-day / 3-day / on-demand)",
    notes: "Crypto payouts (USDC/USDT-TRC20) are capped at $2,000 per request — larger amounts route through RiseWorks.",
    payoutCurrency: "USD",
    // Source: help.blueberryfunded.com/en/articles/10527841-how-to-make-payment-using-crypto
    // (checked 2026-09-12).
    challengePayment: {
      acceptsCrypto: true,
      cryptoAssets: "USDT, USDC — via Boomfi/Confirmo",
      priceCurrency: "USD",
      cryptoFeePercent: null,
      notes: "The payment processor's fee for accepting crypto isn't disclosed — check the site before paying. Alternatives include card, UPI/IMPS, GCash, GrabPay (by region).",
      officialUrl: "https://blueberryfunded.com",
      dataVerified: false,
    },
  },
  {
    // Sources (checked 2026-09-14): trustpilot.com/review/fundingpips.com
    // (68,367 reviews, 4.5/5), help.fundingpips.com/hc/en-us/articles/
    // 34504564970385-Reward-Methods, forexpeacearmy.com/forex-reviews/21467.
    slug: "fundingpips",
    name: "FundingPips",
    methods: ["Crypto (USDT/USDC)", "Rise", "Bank card", "Bank transfer"],
    fee: "Exact withdrawal fee percentage isn't published -- deducted together with the rate and network fee, depends on the method",
    minWithdrawal: "Not explicitly stated; a $500 threshold is mentioned for Rise",
    speed: "Crypto -- usually minutes after the request is approved; card/Rise/bank -- 24-48 hours",
    notes: "",
    payoutCurrency: "USD",
    challengePayment: {
      acceptsCrypto: true,
      cryptoAssets: "USDT (TRC20) and others -- accepted directly at checkout",
      priceCurrency: "USD",
      cryptoFeePercent: null,
      notes: "Crypto payment confirmation takes 10-30 minutes; a ~$1 network fee is mentioned (that's the network's fee, not the firm's -- its own percentage isn't separately disclosed).",
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
    methods: ["Rise", "Wise", "Bank transfer (WIRE/ACH/SWIFT)"],
    fee: "Not stated — verify before relying on this",
    minWithdrawal: "Not stated — verify before relying on this",
    speed: "Up to 2 business days after the request",
    notes: "The firm does not pay crypto directly — only via Rise. Russia and Belarus are on the list of unavailable countries. The payout currency is not stated on the official pages: the calculation assumes USD — verify.",
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
    fee: "Not stated — verify before relying on this",
    minWithdrawal: "$50",
    speed: "Usually up to 3 business days after approval",
    notes: "For traders in Ukraine, where Rise is unavailable, payouts in crypto (USDC/USDT) are possible. Russia and Belarus are on the list of unavailable countries. The payout currency is not stated on the official pages: the calculation assumes USD — verify.",
    payoutCurrency: "USD",
    challengePayment: null,
  },
  {
    // Источники (только официальные страницы фирмы): help.fundedtradingplus.com/payout-methods-offered/ (способы), /prohibited-countries/ (страны) — проверено 2026-09-20.
    // challengePayment: null — условия оплаты челленджа криптой не подтверждены,
    // поэтому фирма не предлагается в калькуляторе как «Куда» (только как «Откуда»).
    slug: "funded-trading-plus",
    name: "Funded Trading Plus",
    methods: ["Crypto", "Rise"],
    fee: "Not stated — verify before relying on this",
    minWithdrawal: "Not stated — verify before relying on this",
    speed: "Not stated — verify before relying on this",
    notes: "Russia and Belarus are on the list of prohibited countries. The payout currency is not stated on the official pages: the calculation assumes USD — verify.",
    payoutCurrency: "USD",
    challengePayment: null,
  },
];

// ---------------------------------------------------------------------------
// Strategy texts for the "Strategy finder" quiz (/en/strategy/). Logic, risk
// and rules live in assets/js/strategy-quiz.js; only texts here. Keys must
// match STRATEGY_RULES and assets/js/data.js.
//
// Copy rules (Russian crypto advertising rules and common sense): never name
// specific coins, never forecast prices or quote returns, never promise
// results. State risks plainly and concretely. The first item of cautions
// is shown up front in the result card — put the strategy's main risk first.
const STRATEGIES = {
  hodl: {
    name: "Long-term holding",
    tagline: "Buy and hold for years, ignoring market swings",
    summary:
      "You buy crypto and hold it for several years with almost no trading. The result depends on how the market moves over the whole period, not on the precision of individual trades. The key requirement is being able to sit through deep drawdowns for years without panic-selling.",
    time: "A few minutes a month",
    skills: [
      "Understand what you're buying and why you're willing to hold it for years",
      "Store funds safely: two-factor authentication, and your own wallet for larger amounts",
    ],
    mistakes: [
      "Panic-selling during a drawdown and locking in the loss",
      "Putting in more than you can leave untouched for several years",
      "Keeping everything on one exchange without accounting for the platform's own risk",
    ],
    cautions: [
      "In 2021–2022 the largest cryptocurrencies lost 70–80% from their peaks — drawdowns like that are normal for this market",
      "A long horizon doesn't guarantee a result: some projects never recover",
    ],
    firstStep:
      "Decide on an amount you can leave untouched for at least two years and buy without leverage. Turn on two-factor authentication.",
  },
  dca: {
    name: "Regular purchases (DCA)",
    tagline: "Buy the same amount on a fixed schedule",
    summary:
      "You choose an amount and a frequency in advance — say, weekly or monthly — and buy regardless of the current price. This removes the question of when to get in and builds discipline. Your average purchase price is smoothed out, but the risk of the market falling remains.",
    time: "A few minutes a month once auto-buy is set up",
    skills: [
      "Choose an affordable regular amount and don't change the plan because of news",
      "Set up auto-buy or a DCA bot on the exchange",
    ],
    mistakes: [
      "Pausing purchases during a fall — which is exactly when the strategy averages the price",
      "Raising the amounts on emotion after a rally",
      "Ignoring fees on very small amounts",
    ],
    cautions: [
      "Averaging doesn't protect against a long market decline",
      "If the whole amount is already available, investing it at once has historically done better more often: about two times out of three in Vanguard's study of stock markets. The value of regular purchases lies in discipline and in money arriving gradually",
    ],
    firstStep:
      "Pick an amount you can comfortably set aside every month and set up auto-buy on the exchange.",
  },
  spotSwing: {
    name: "Spot swing trading",
    tagline: "Trades lasting days to weeks, no leverage",
    summary:
      "You look for entry and exit points using charts or news and hold a position for days or weeks. There's no leverage, so you can't lose more than you put in, but a single trade can still draw down deeply. A good school for anyone who wants to learn to trade.",
    time: "A couple of hours a week",
    skills: [
      "Technical analysis basics: trend, support and resistance",
      "Setting a stop-loss and defining the risk per trade in advance",
      "Keeping a trading journal",
    ],
    mistakes: [
      "Entering a trade without an exit plan and a stop-loss",
      "Risking too large a share of the deposit on one trade",
      "Trying to win back a loss",
    ],
    cautions: [
      "Most active retail traders underperform the market",
      "Results depend far more on discipline than on predictions",
    ],
    firstStep:
      "Start with a small amount and cap your risk in advance — for example, no more than 1–2% of the deposit per trade. Keep a journal from the first trade.",
  },
  futuresSwing: {
    name: "Low-leverage futures swing trading",
    tagline: "Trades lasting days to weeks, including shorts, with small leverage",
    summary:
      "The same as spot swing trading, but through perpetual futures: you can also profit from a falling price (shorting). Leverage magnifies losses as well as profits, and if the market moves sharply against you the exchange closes the position by force — that's liquidation. Holding for days means accounting for the funding rate.",
    time: "A couple of hours a week or more",
    skills: [
      "Spot trading experience",
      "Understanding margin, liquidation and the funding rate",
      "Sticking to your stop-loss without exception",
    ],
    mistakes: [
      "Raising leverage to win back a loss",
      "Ignoring the funding rate on long holds",
      "Trading without a stop-loss",
    ],
    cautions: [
      "Leverage can wipe out a position within minutes in a sharp move",
      "Funding is charged several times a day and can eat into longer trades",
    ],
    firstStep:
      "Practise the strategy on a demo account before trading real money. On a live account, start with minimal leverage.",
  },
  dayTrading: {
    name: "Day trading",
    tagline: "Opening and closing trades within the same day",
    summary:
      "Trades last from tens of minutes to a few hours and are closed by the end of the day. It's usually done on futures, where fees are lower and you can trade both directions. It takes screen time, a tested system and strict discipline.",
    time: "An hour a day or more",
    skills: [
      "Futures trading experience",
      "A tested trading system with clear entry and exit rules",
      "Managing risk and emotions through a losing streak",
    ],
    mistakes: [
      "Trading without a system, on gut feeling",
      "Overtrading: fees pile up faster than profit",
      "Increasing size after a losing streak",
    ],
    cautions: [
      "In a study of the Brazilian futures market, 97% of people who day traded for more than 300 days lost money (Chague, De-Losso, Giovannetti). It's not the crypto market, but the mechanics are the same",
      "Fees from frequent trading noticeably reduce results",
    ],
    firstStep:
      "Test your system on a demo account for a few weeks and judge the result after fees.",
  },
  scalping: {
    name: "Scalping",
    tagline: "Many short trades lasting minutes",
    summary:
      "A scalper makes dozens of trades a day, capturing small price moves. Profit per trade is small, so fees, liquidity and execution speed decide everything. It's the most demanding style in terms of time and experience.",
    time: "Several hours a day at the screen",
    skills: [
      "Futures trading experience and reading the order book",
      "Fast decisions and strict discipline",
      "Understanding the difference between maker and taker fees",
    ],
    mistakes: [
      "Ignoring fees: on trades worth fractions of a percent they eat all the profit",
      "Trading illiquid pairs with wide spreads",
      "Continuing to trade after hitting a daily loss limit",
    ],
    cautions: [
      "Maximum risk and maximum workload: most people who try scalping lose money",
      "Results depend heavily on the exchange's fees",
    ],
    firstStep:
      "Practise scalping on a demo account and work out how much you'd have paid in fees trading live.",
  },
  gridBot: {
    name: "Grid bot",
    tagline: "Automatically buy lower and sell higher within a price range",
    summary:
      "You set a price range and the bot places a grid of orders inside it, buying on dips and selling on rises. It works best in a market without a clear trend (sideways). Bots are built into exchanges and run around the clock at no extra charge — you pay only the normal trading fees.",
    time: "Set up, then check weekly",
    skills: [
      "Choosing a sensible range and number of grid levels",
      "Knowing what to do if the price leaves the range",
    ],
    mistakes: [
      "A range that's too narrow: the price quickly leaves it",
      "Starting during a sharp fall: the bot keeps buying an asset that's getting cheaper",
      "A grid that's too dense: fees eat the profit",
    ],
    cautions: [
      "In a strong trend the price leaves the range: in a fall you're left holding a cheaper asset, in a rally the bot sells everything and stops earning",
      "Leveraged futures grids are considerably riskier than spot grids",
    ],
    firstStep:
      "Start with a spot grid on a small amount with a wide range and watch it for a few weeks.",
  },
  dcaBot: {
    name: "DCA bot and martingale",
    tagline: "Buy more on the way down and close on the rebound",
    summary:
      "The bot opens a position and, as the price falls, buys more in preset steps, lowering the average entry price. When the price rebounds to the target, the position closes. In martingale mode each additional buy is larger — and so is the risk.",
    time: "Set up, then check weekly",
    skills: [
      "Working out whether you have enough funds for every buy step",
      "Setting a loss limit in case of a prolonged fall",
    ],
    mistakes: [
      "Unlimited martingale: in a long fall the money runs out before the price turns",
      "Running it on weak assets that may never recover",
      "Too many steps with growing size",
    ],
    cautions: [
      "In a prolonged fall the strategy builds up a large losing position",
      "Martingale is one of the riskiest bot modes",
    ],
    firstStep:
      "Run the bot on a small amount with moderate steps and a loss limit, without martingale.",
  },
  rebalanceBot: {
    name: "Portfolio rebalancing bot",
    tagline: "Automatically keep set shares of assets in a portfolio",
    summary:
      "You build a portfolio of several cryptocurrencies and set their shares. When prices move and the shares drift, the bot sells what got more expensive and buys what got cheaper, returning the portfolio to its original mix. A calm version of long-term holding with built-in discipline.",
    time: "Minimal: set up and check occasionally",
    skills: [
      "Building a portfolio of assets you're willing to hold long term",
      "Choosing a deviation threshold or a rebalancing schedule",
    ],
    mistakes: [
      "Rebalancing too often — unnecessary fees",
      "Adding random illiquid assets to the portfolio",
    ],
    cautions: [
      "The portfolio still falls with the market: rebalancing manages shares, not overall risk",
      "If one asset keeps getting cheaper, the bot keeps buying more of it",
    ],
    firstStep:
      "Build a portfolio of 2–4 large assets and turn on threshold-based rebalancing.",
  },
  copyTrading: {
    name: "Copy trading",
    tagline: "Automatically repeat the trades of a chosen trader",
    summary:
      "You choose a trader on the exchange and allocate an amount — their trades are repeated on your account automatically. Someone else makes the decisions, but the risk and the losses stay yours. The trader usually takes a share of the profit, from 5% to 50% depending on the exchange and terms.",
    time: "Choosing a trader, then checking weekly",
    skills: [
      "Judging a trader not only by returns but by drawdowns, track record length and number of trades",
      "Capping the amount and risk you allocate to copying",
    ],
    mistakes: [
      "Choosing the trader with the highest short-term return",
      "Giving your whole amount to a single trader",
      "Not checking whether the trader uses high leverage",
    ],
    cautions: [
      "A trader's past results don't guarantee future ones, and high returns often mean high risk",
      "Many copied traders trade futures with leverage",
    ],
    firstStep:
      "Allocate a small amount, split it between several traders with long track records and moderate drawdowns, and set a loss limit.",
  },
  earn: {
    name: "Earn: savings on an exchange",
    tagline: "Get rewards for placing funds on an exchange",
    summary:
      "The exchange pays a reward for placing your funds in its products: flexible savings you can withdraw at any time, or fixed-term ones locked for a period. It's the most passive option, but the exchange holds your funds, so the main risk is the platform itself.",
    time: "A few minutes a month",
    skills: [
      "Telling simple products (flexible and fixed savings) from complex structured ones",
      "Checking whether the exchange publishes Proof of Reserves",
    ],
    mistakes: [
      "Chasing the highest rate — it often hides a complex or risky product",
      "Keeping all your funds on one exchange",
      "Placing a volatile cryptocurrency expecting the reward to outweigh a price fall",
    ],
    cautions: [
      "Funds are held by the exchange: if it goes bankrupt you can lose them, as happened with FTX in 2022",
      "If you place a volatile cryptocurrency, its price can fall by more than you earn in rewards",
    ],
    firstStep:
      "Start with flexible stablecoin savings on an exchange that publishes Proof of Reserves, and don't keep all your funds on one platform.",
  },
  fundingArb: {
    name: "Funding-rate arbitrage",
    tagline: "Earn the funding rate without betting on price direction",
    summary:
      "You buy an asset on spot and at the same time open a short of the same size on perpetual futures. Price moves cancel each other out, and the income comes from the funding rate paid to shorts while it's positive. The strategy is market-neutral, but it needs capital, attention and an understanding of how futures work.",
    time: "A couple of hours a week",
    skills: [
      "Understanding how the funding rate works",
      "Watching the margin on the short position",
      "Accounting for entry and exit fees on both legs",
    ],
    mistakes: [
      "Forgetting the rate can turn negative — then you're the one paying",
      "Keeping too little margin on futures: a sharp rally can liquidate the short",
      "Not counting fees that eat a small income",
    ],
    cautions: [
      "Income is small and unstable: the funding rate changes and can go negative",
      "Liquidation risk on the short and the exchange's own risk remain",
    ],
    firstStep:
      "Learn the mechanics on a demo account and work out whether funding covers your entry and exit fees.",
  },
};
