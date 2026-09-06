// Static data for crypto payout routes, prop firms, and affiliate links
// (English). Fee/spread figures are estimates for comparison purposes —
// always verify live rates directly with each provider before withdrawing.
// Keep this in sync with assets/js/data.js (the Russian version) whenever
// the underlying numbers (spreadPercent, fixedFee, ids, slugs) change.
//
// v2: the site compares exchange + off-ramp combos (buy USDT, then convert
// USDT to local currency) instead of Wise/Revolut/bank, because Wise and
// Revolut don't work for users in Russia. Bank transfer is kept as a
// contrasting worst-case baseline. See
// payout-comparison-site-spec-v2-crypto-pivot.md.

const CURRENCIES = ["USD", "EUR", "GBP", "AUD", "CAD", "CHF", "JPY", "PLN", "CZK", "HUF", "RON", "BGN", "TRY", "INR", "ZAR", "MXN", "BRL", "NGN", "SEK", "NOK", "DKK", "RUB", "KZT", "UAH", "BYN"];

// Date the spreads/fees below (EXCHANGES, OFFRAMPS, BANK_BASELINE) were last
// manually checked against providers' public tariffs. Shown on the site as
// "Fees verified: …" — update alongside the numbers.
const DATA_LAST_VERIFIED = "2026-09-03";

// Crypto exchanges — stage 1 (buying/receiving USDT). Affiliate programs
// are confirmed for all four.
const EXCHANGES = [
  {
    id: "bybit",
    name: "Bybit",
    spreadPercent: 0.3,
    fixedFee: 1,
    speed: "minutes",
    affiliateConfirmed: true,
    notes: "Affiliate program confirmed (affiliates.bybit.com); no mandatory ID verification just to join the affiliate program.",
  },
  {
    id: "bitget",
    name: "Bitget",
    spreadPercent: 0.3,
    fixedFee: 1,
    speed: "minutes",
    affiliateConfirmed: true,
    notes: "Relatively low barrier to join the affiliate program.",
  },
  {
    id: "kucoin",
    name: "KuCoin",
    spreadPercent: 0.3,
    fixedFee: 1,
    speed: "minutes",
    affiliateConfirmed: true,
    notes: "Open affiliate program, 30-50% of trading fees for life.",
  },
  {
    id: "whitebit",
    name: "WhiteBIT",
    spreadPercent: 0.4,
    fixedFee: 1,
    speed: "minutes",
    affiliateConfirmed: true,
    notes: "Affiliate program confirmed (whitebit.com/referral).",
  },
];

// Off-ramp services — stage 2 (USDT to local currency).
//
// Affiliate/referral programs (sign-up-via-link) are NOT what `dataVerified`
// tracks. `dataVerified: true` only means the spread/fixedFee below came
// from the provider's own published fee page (not a guess) as of the date
// noted. Fees change without notice and neither provider exposes a public
// API for them — there's no live auto-refresh for these the way there is
// for the exchange rate in rates.js (which refetches on every calculation).
// Re-check the linked pages every few months and update the numbers.
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
    notes: "Licensed platform (Belarus): converts USDT/BTC/ETH to RUB/BYN onto a Mir card. 2.0% is the rate for withdrawing to a Russian bank card, whitebird.io/commission.",
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
    notes: "Brokerage platform for CIS-based traders. 1.5% conversion + a 500 RUB withdrawal fee (0 if withdrawing into a Cifra Bank account), cifra.by/rates.",
    notes: "A brokerage platform for CIS-based traders.",
  },
];

// Bank transfer — kept only as a contrasting worst-case baseline, with no
// affiliate link.
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
    notes: "An e-wallet used as an intermediate step between an exchange and an off-ramp. Check whether it has an affiliate program.",
  },
  {
    id: "advcash",
    name: "AdvCash / Volet",
    notes: "Direct transfers to Russian bank cards no longer work directly, but it's still useful as an intermediate step with off-ramps. Check for an affiliate program.",
  },
];

// A reference resource — not an affiliate partner, more of a competing
// aggregator in this niche.
const REFERENCE_RESOURCES = [
  {
    id: "bestchange",
    name: "BestChange",
    url: "https://www.bestchange.ru/",
    notes: "An exchanger aggregator — useful to cross-check current rates against, but not an affiliate service.",
  },
];

const AFFILIATE_LINKS = {
  bybit: { url: null, label: "Sign up with Bybit" },
  bitget: { url: null, label: "Sign up with Bitget" },
  kucoin: { url: null, label: "Sign up with KuCoin" },
  whitebit: { url: null, label: "Sign up with WhiteBIT" },
};

// Prop-firm specific payout data, collected via web research.
// IMPORTANT: verify every figure directly on the firm's own site before
// publishing that firm's page — these can be out of date or inaccurate.
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
  },
];

// ---------------------------------------------------------------------------
// "Compare prop firms" section (/prop-firms/). Structured data for the
// sortable/filterable table and the per-firm pages. See
// prop-firms-comparison-spec.md.
//
// IMPORTANT: the prop-firm industry is not government-regulated. Only firms
// with a publicly confirmed payout history and a trust rating are included —
// this is not a financial licence or government accreditation.
//
// The figures below were gathered via web search as of PROP_FIRMS_RESEARCHED
// and have NOT been checked line by line against each firm's official site.
// Profit splits, drawdowns, per-account-size prices and Trustpilot review
// counts change — before removing the red "verify" box from a firm page,
// confirm its numbers directly on officialUrl. Keep the NUMBERS in this
// array in sync with assets/js/data.js (prose is translated independently).
//
// Numeric fields (entryFrom in USD, profitSplitMax, maxAccountValue,
// trustpilotScore, trustpilotReviews, founded) drive sorting/filtering;
// the *Text fields are for display.
const PROP_FIRMS_RESEARCHED = "2026-09-06";

const PROP_FIRMS = [
  {
    slug: "ftmo",
    name: "FTMO",
    founded: 2015,
    evaluationTypes: ["1-step", "2-step"],
    entryFrom: 89,
    entryModel: "one-time",
    entryText: "from €79 ($10K, 1-step)",
    profitSplitMax: 90,
    profitSplitText: "80–90% (2-step) · 90% (1-step)",
    drawdownDaily: "3% (1-step) / 5% (2-step)",
    drawdownTotal: "10%",
    minTradingDays: "none",
    maxAccountValue: 2000000,
    maxAccountText: "$200K → $400K allocation → scaling to $2M",
    payoutMethods: ["Bank", "Visa/Mastercard", "Skrill", "Crypto"],
    payoutSlug: "ftmo",
    trustpilotScore: 4.8,
    trustpilotReviews: 50700,
    trustpilotAsOf: "2026-09-06",
    brokerBacking: "Owns the regulated broker OANDA",
    officialUrl: "https://ftmo.com",
    includeNote: null,
    dataVerified: false,
    payoutHistory: "Claims $500M+ paid out since 2015",
    priceModel: "dual",
    priceTable: [
      { size: "$10K", oneStep: "€79", twoStep: "€89" },
      { size: "$25K", oneStep: "€165", twoStep: "€179" },
      { size: "$50K", oneStep: "€289", twoStep: "€299" },
      { size: "$100K", oneStep: "€539", twoStep: "€549" },
      { size: "$200K", oneStep: "€999", twoStep: "€1,080" },
    ],
    rules: {
      "1-step": {
        target: "10%",
        daily: "3% (end-of-day trailing)",
        total: "10% (end-of-day trailing)",
        minDays: "none",
        timeLimit: "no time limit",
        split: "90% from the first payout",
      },
      "2-step": {
        target: "10% (Phase 1) → 5% (Phase 2 / Verification)",
        daily: "5%",
        total: "10%",
        minDays: "none",
        timeLimit: "no time limit",
        split: "80%, up to 90% on the scaling plan",
      },
    },
    payoutCadence: "First payout 14 days after the first trade on the funded account, then every 14 days (an on-demand schedule is available on request).",
  },
  {
    slug: "fundednext",
    name: "FundedNext",
    founded: 2022,
    evaluationTypes: ["1-step", "2-step"],
    entryFrom: 59,
    entryModel: "one-time",
    entryText: "from ~$49 ($6K, Stellar 1-step)",
    profitSplitMax: 95,
    profitSplitText: "80%, up to 95% (Stellar) · up to 90% via FundedNext Pro",
    drawdownDaily: "3% (1-step) / 5% (2-step)",
    drawdownTotal: "6% (1-step) / 10% (2-step), static",
    minTradingDays: "2 (1-step)",
    maxAccountValue: 200000,
    maxAccountText: "$2K–$200K, then the Pro scaling program",
    payoutMethods: ["USDT/USDC", "RiseWorks", "Bank", "Confirmo"],
    payoutSlug: "fundednext",
    trustpilotScore: 4.5,
    trustpilotReviews: 62700,
    trustpilotAsOf: "2026-09-06",
    brokerBacking: null,
    officialUrl: "https://fundednext.com",
    includeNote: null,
    dataVerified: false,
    payoutHistory: "Claims $261M+ paid out (company data, 2026)",
    priceModel: "dual",
    priceTable: [
      { size: "$6K", oneStep: "$49", twoStep: "$59" },
      { size: "$15K", oneStep: "$99", twoStep: "$119" },
      { size: "$25K", oneStep: "$169", twoStep: "$199" },
      { size: "$50K", oneStep: "$265", twoStep: "$299" },
      { size: "$100K", oneStep: "$499", twoStep: "$549" },
      { size: "$200K", oneStep: "$939", twoStep: "$1,009" },
    ],
    rules: {
      "1-step": {
        target: "8%",
        daily: "3%",
        total: "6% (static)",
        minDays: "2",
        timeLimit: "no time limit",
        split: "80% (up to 95%)",
      },
      "2-step": {
        target: "8% (Phase 1) → 5% (Phase 2)",
        daily: "5%",
        total: "10% (static)",
        minDays: "none",
        timeLimit: "no time limit",
        split: "80% (up to 95%)",
      },
    },
    payoutCadence: "7-day payout cycle on the first stage after getting the account; crypto/RiseWorks usually within 24 hours.",
  },
  {
    slug: "the5ers",
    name: "The 5%ers",
    founded: 2016,
    evaluationTypes: ["1-step", "2-step"],
    entryFrom: 39,
    entryModel: "one-time",
    entryText: "from ~$39 ($5K, High Stakes)",
    profitSplitMax: 100,
    profitSplitText: "up to 100% (grows as you progress)",
    drawdownDaily: "5% (High Stakes) · no daily limit on some programs",
    drawdownTotal: "10% (High Stakes); 3% end-of-day trailing on Bootcamp/Hyper Growth",
    minTradingDays: "none",
    maxAccountValue: 4000000,
    maxAccountText: "from $2,500, scaling to $4M",
    payoutMethods: ["RiseWorks", "Crypto", "Bank"],
    payoutSlug: "the5ers",
    trustpilotScore: 4.7,
    trustpilotReviews: 26600,
    trustpilotAsOf: "2026-09-06",
    brokerBacking: null,
    officialUrl: "https://the5ers.com",
    includeNote: null,
    dataVerified: false,
    payoutHistory: "~336,000 funded traders (company data)",
    priceModel: "single",
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
        daily: "none",
        total: "3% end-of-day trailing",
        minDays: "3",
        timeLimit: "no time limit",
        split: "up to 100%",
      },
      "2-step": {
        target: "6% (Phase 1) → 6% (Phase 2) on High Stakes",
        daily: "5%",
        total: "10%",
        minDays: "none",
        timeLimit: "no time limit",
        split: "up to 100%",
      },
    },
    payoutCadence: "Requests every two weeks, ~72h processing. Crypto withdrawals are capped at $1,500 per request.",
  },
  {
    slug: "topstep",
    name: "Topstep",
    founded: 2012,
    evaluationTypes: ["1-step"],
    entryFrom: 49,
    entryModel: "monthly",
    entryText: "subscription from ~$49/mo ($50K Trading Combine)",
    profitSplitMax: 90,
    profitSplitText: "90/10 (100% on the first $10K for accounts opened before 2026-01-12)",
    drawdownDaily: "daily loss limit $1K / $2K / $3K",
    drawdownTotal: "trailing Max Loss Limit $2K / $3K / $4.5K",
    minTradingDays: "none (in evaluation)",
    maxAccountValue: 150000,
    maxAccountText: "$50K / $100K / $150K (futures)",
    payoutMethods: ["Bank (ACH/Wire)", "Rise (international)"],
    payoutSlug: null,
    trustpilotScore: 3.6,
    trustpilotReviews: 14500,
    trustpilotAsOf: "2026-09-06",
    brokerBacking: null,
    officialUrl: "https://www.topstep.com",
    includeNote: "Its Trustpilot score is below our benchmarks, but it is one of the oldest futures prop firms (since 2012) with a long public payout history. Assess with care and read recent reviews.",
    dataVerified: false,
    payoutHistory: "Public payout history since 2012, futures-focused",
    priceModel: "monthly",
    priceTable: [
      { size: "$50K", monthly: "$49/mo (promo) · list ~$165/mo" },
      { size: "$100K", monthly: "$99/mo (promo) · list ~$325/mo" },
      { size: "$150K", monthly: "$149/mo (promo) · list ~$375/mo" },
    ],
    rules: {
      "1-step": {
        target: "6% ($3K / $6K / $9K)",
        daily: "daily loss limit $1K / $2K / $3K",
        total: "trailing MLL $2K / $3K / $4.5K",
        minDays: "none in evaluation; 2+ winning days to withdraw",
        timeLimit: "none (while the subscription is active)",
        split: "90/10 (100% on the first $10K grandfathered before 2026-01-12)",
      },
    },
    payoutCadence: "Payouts can be requested after 5 winning days; first-payout caps apply per Topstep's rules.",
  },
  {
    slug: "brightfunded",
    name: "BrightFunded",
    founded: 2023,
    evaluationTypes: ["2-step"],
    entryFrom: 59,
    entryModel: "one-time",
    entryText: "from ~$59 ($5K)",
    profitSplitMax: 100,
    profitSplitText: "80%, up to 100% via scaling",
    drawdownDaily: "5%",
    drawdownTotal: "10% (static)",
    minTradingDays: "5 per phase",
    maxAccountValue: 400000,
    maxAccountText: "$5K–$200K, scaling to $400K",
    payoutMethods: ["Crypto", "Bank/Rise"],
    payoutSlug: null,
    trustpilotScore: null,
    trustpilotReviews: 530,
    trustpilotAsOf: "2026-09-06",
    brokerBacking: null,
    officialUrl: "https://brightfunded.com",
    includeNote: "A young firm (founded 2023). Its Trustpilot rating was hidden/unavailable when this data was gathered, and there are few reviews. Claimed payout history is ~$7M. Treat with extra caution and check its current status.",
    dataVerified: false,
    payoutHistory: "Claims ~$7M paid out (company data)",
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
        target: "10% (Phase 1) → 5% (Phase 2)",
        daily: "5%",
        total: "10% (static)",
        minDays: "5 per phase",
        timeLimit: "no time limit",
        split: "80%, up to 100% via scaling",
      },
    },
    payoutCadence: "Claims a guaranteed payout within 24 hours (averaging ~17 hours) — verify on the site.",
  },
  {
    slug: "blueberry-funded",
    name: "Blueberry Funded",
    founded: 2024,
    evaluationTypes: ["1-step", "2-step"],
    entryFrom: 40,
    entryModel: "one-time",
    entryText: "from ~$40",
    profitSplitMax: 90,
    profitSplitText: "80%, up to 90% via scaling",
    drawdownDaily: "4% (static, on balance/equity at 5 PM EST)",
    drawdownTotal: "10% (static)",
    minTradingDays: "none (check per program)",
    maxAccountValue: 2000000,
    maxAccountText: "$1,250–$200K, scaling to $2M",
    payoutMethods: ["Crypto", "Bank", "Rise"],
    payoutSlug: null,
    trustpilotScore: 4.3,
    trustpilotReviews: 1420,
    trustpilotAsOf: "2026-09-06",
    brokerBacking: "Regulated broker Blueberry Markets (ASIC)",
    officialUrl: "https://blueberryfunded.com",
    includeNote: "Fewer Trustpilot reviews than our 2,500 benchmark, but it is backed by the regulated broker Blueberry Markets and claims $7.55M+ paid to 10,900+ traders. Verify current figures.",
    dataVerified: false,
    payoutHistory: "Claims $7.55M+ paid to 10,900+ traders",
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
        daily: "4% (static)",
        total: "10% (static)",
        minDays: "none",
        timeLimit: "no time limit",
        split: "80%, up to 90%",
      },
      "2-step": {
        target: "8% (Phase 1) → 5% (Phase 2)",
        daily: "4% (static)",
        total: "10% (static)",
        minDays: "none",
        timeLimit: "no time limit",
        split: "80%, up to 90%",
      },
    },
    payoutCadence: "14-day payout cycle.",
  },
];
