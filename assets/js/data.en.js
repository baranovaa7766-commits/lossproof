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
// are confirmed for bybit/bitget/kucoin; okx/mexc/gate were added to the
// calculator's math 2026-09-12 at the site owner's request (they were
// already in the informational EXCHANGES_COMPARE list below, just not in
// the calculator itself) — their affiliate program is NOT confirmed
// (affiliateConfirmed: false), so no "Get started" button shows for them
// (no matching entry in AFFILIATE_LINKS below). The spread/fee for all six
// is a shared estimate (0.3% / $1), not an individually verified tariff per
// exchange — verify before a large amount.
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
    affiliateConfirmed: true,
    notes: "Affiliate program confirmed (affiliates.bybit.com); no mandatory ID verification just to join the affiliate program. Russia is formally listed as an excluded jurisdiction (Service Agreement), but many users reportedly still verify with a Russian passport via P2P — details on /en/exchanges/bybit/.",
  },
  {
    id: "bitget",
    name: "Bitget",
    spreadPercent: 0.3,
    fixedFee: 1,
    speed: "minutes",
    affiliateConfirmed: true,
    notes: "Relatively low barrier to join the affiliate program. No explicit restriction found for Russian residents.",
  },
  {
    id: "kucoin",
    name: "KuCoin",
    spreadPercent: 0.3,
    fixedFee: 1,
    speed: "minutes",
    affiliateConfirmed: true,
    notes: "Open affiliate program, 30-50% of trading fees for life. Russia isn't separately listed as restricted — access is governed by sanctions screening.",
  },
  {
    id: "okx",
    name: "OKX",
    spreadPercent: 0.3,
    fixedFee: 1,
    speed: "minutes",
    affiliateConfirmed: false,
    notes: "Affiliate program not confirmed — no \"Get started\" button. Russian-resident access could change — details on /en/exchanges/okx/.",
  },
  {
    id: "mexc",
    name: "MEXC",
    spreadPercent: 0.3,
    fixedFee: 1,
    speed: "minutes",
    affiliateConfirmed: false,
    notes: "Affiliate program not confirmed — no \"Get started\" button. Details on /en/exchanges/mexc/.",
  },
  {
    id: "gate",
    name: "Gate",
    spreadPercent: 0.3,
    fixedFee: 1,
    speed: "minutes",
    affiliateConfirmed: false,
    notes: "Affiliate program not confirmed — no \"Get started\" button. Details on /en/exchanges/gate/.",
  },
];

// "Compare exchanges" section (/exchanges/). Separate from EXCHANGES above —
// EXCHANGES drives the calculator's math (only exchanges with a confirmed
// affiliate program), while EXCHANGES_COMPARE is a broader informational
// overview of vetted, licensed exchanges for a sortable/filterable table and
// per-exchange pages. This section is purely informational — affiliate
// status is deliberately not shown and doesn't drive any filter or sort.
//
// Inclusion bar: only platforms with a publicly checkable license/VASP
// registration — no fully unregulated exchanges. WhiteBIT and HTX (Huobi)
// are deliberately NOT included here — see "How we pick exchanges" on the
// /exchanges/ page itself and the WhiteBIT comment above EXCHANGES.
//
// ruAccessTier drives the "Russia access" filter:
//   "open" — Russia isn't separately listed as restricted, normal access
//   "grey" — the ToS/user agreement formally excludes Russia, but available
//            evidence suggests residents still verify and use the exchange
//            in practice (e.g. via P2P)
// See ruAccessText on each exchange's page for the details.
//
// Figures were gathered via web search as of EXCHANGES_COMPARE_RESEARCHED
// and have NOT been checked directly against official fee pages (unlike
// Whitebird/Cifra Markets in OFFRAMPS above) — dataVerified: false for all,
// with a red "verify" box shown on each exchange's page. Keep the numbers in
// sync with data.js.
const EXCHANGES_COMPARE_RESEARCHED = "2026-09-07";

const EXCHANGES_COMPARE = [
  {
    slug: "bybit",
    name: "Bybit",
    founded: 2018,
    hq: "Dubai, UAE (incorporated in the British Virgin Islands)",
    licenses: "MiCA CASP (EU, Bybit EU GmbH, May 2025) · Virtual Asset Platform Operator License from the SCA (UAE, October 2025) · VASP FSA (Seychelles)",
    ruAccessTier: "grey",
    ruAccessText: "Russia is formally listed as an excluded jurisdiction in the Service Agreement (updated May 2026), alongside Sevastopol and Russian-controlled regions of Ukraine. That said, numerous accounts report Russian residents still registering and verifying with a Russian passport via the P2P section. A separate technical wrinkle: bybit.com isn't on Russia's Ministry of Digital Development whitelist, so access to the site and app can be restricted on mobile networks with \"safe internet\" mode enabled.",
    takerFeeValue: 0.1,
    takerFeeText: "0.1% (base tier, no volume discount)",
    makerFeeText: "0.1%",
    depositMethods: ["P2P (including rubles)", "crypto deposit", "bank card (not in every region)"],
    withdrawalFeeText: "~1 USDT on the TRC20 network (ERC20 is notably pricier)",
    officialUrl: "https://www.bybit.com",
    dataVerified: false,
  },
  {
    slug: "bitget",
    name: "Bitget",
    founded: 2018,
    hq: "Registered in Seychelles, Singapore office, Vienna compliance hub",
    licenses: "VASP FSA (Seychelles, under the 2024 Act) · a financial services license in New Zealand",
    ruAccessTier: "open",
    ruAccessText: "No explicit restriction for Russian residents found in public sources — registration, verification, and the ruble P2P section work normally.",
    takerFeeValue: 0.1,
    takerFeeText: "0.1%",
    makerFeeText: "0.1%",
    depositMethods: ["P2P (including rubles)", "crypto deposit", "bank card"],
    withdrawalFeeText: "~1 USDT on the TRC20 network",
    officialUrl: "https://www.bitget.com",
    dataVerified: false,
  },
  {
    slug: "kucoin",
    name: "KuCoin",
    founded: 2017,
    hq: "Seychelles",
    licenses: "VASP FSA (Seychelles) — among the first exchanges approved under the 2024 law",
    ruAccessTier: "open",
    ruAccessText: "Russia isn't separately listed among KuCoin's restrictions — access is governed by sanctions screening rather than citizenship or country. Available evidence suggests it retains broad access for CIS-region users. (UAE regulator VARA ordered a halt to Dubai operations in March 2026, and KuCoin is permanently barred in the US per a CFTC order — neither is related to access for Russian residents.)",
    takerFeeValue: 0.1,
    takerFeeText: "0.1%",
    makerFeeText: "0.1%",
    depositMethods: ["P2P (including rubles)", "crypto deposit"],
    withdrawalFeeText: "~1 USDT on the TRC20 network",
    officialUrl: "https://www.kucoin.com",
    dataVerified: false,
  },
  {
    slug: "okx",
    name: "OKX",
    founded: 2017,
    hq: "Historically Seychelles-based; licenses obtained per region",
    licenses: "VASP FSA (Seychelles) · local authorizations in several EU countries",
    ruAccessTier: "grey",
    ruAccessText: "Russian residents currently retain trading access, though some fiat services are restricted. Pending Russian legislation (not expected before summer 2026) could block access to platforms without a Russian license, including OKX and Bybit — the status may change, so re-check before relying on it.",
    takerFeeValue: 0.1,
    takerFeeText: "0.1%",
    makerFeeText: "0.08%",
    depositMethods: ["P2P (including rubles)", "crypto deposit"],
    withdrawalFeeText: "~1 USDT on the TRC20 network",
    officialUrl: "https://www.okx.com",
    dataVerified: false,
  },
  {
    slug: "mexc",
    name: "MEXC",
    founded: 2018,
    hq: "Seychelles",
    licenses: "VASP registration (Seychelles) — less publicly documented additional regional licensing than the other exchanges on this list",
    ruAccessTier: "open",
    ruAccessText: "Russia isn't on MEXC's list of restricted jurisdictions — registration, deposits, and trading work normally for Russian residents (only Russian-controlled regions of Ukraine are restricted).",
    takerFeeValue: 0.075,
    takerFeeText: "~0.05-0.1% (often lower via promotions on specific pairs)",
    makerFeeText: "0%",
    depositMethods: ["P2P (including rubles)", "crypto deposit", "bank card"],
    withdrawalFeeText: "~1 USDT on the TRC20 network",
    officialUrl: "https://www.mexc.com",
    dataVerified: false,
  },
  {
    slug: "gate",
    name: "Gate",
    founded: 2013,
    hq: "Cayman Islands",
    licenses: "MiCA CASP from Malta's MFSA (October 2025), passported across the EEA · a PSD2 payment institution license (February 2026)",
    ruAccessTier: "grey",
    ruAccessText: "Russia is named as a restricted jurisdiction in the user agreement (clause 2.5), but available evidence suggests Russian residents still trade and fund accounts in rubles via P2P.",
    takerFeeValue: 0.2,
    takerFeeText: "0.2% (base tier, reduced with the GT token)",
    makerFeeText: "0.2%",
    depositMethods: ["P2P (including rubles)", "crypto deposit", "bank transfer (in select regions)"],
    withdrawalFeeText: "~1 USDT on the TRC20 network",
    officialUrl: "https://www.gate.io",
    dataVerified: false,
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
    license: "Licensed platform in Belarus",
    crypto: ["USDT", "BTC", "ETH"],
    currencies: ["RUB", "BYN"],
    officialUrl: "https://whitebird.io",
    notes: "Licensed platform (Belarus): converts USDT/BTC/ETH to RUB/BYN onto a Mir card, and the other way too — buying crypto with rubles/BYN. 2.0% is the rate for withdrawing to a Russian bank card, whitebird.io/commission (the buy-side rate hasn't been separately checked).",
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
};

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
];

// ---------------------------------------------------------------------------
// "Compare prop firms" section (/prop-firms/). Structured data for the
// sortable/filterable table and the per-firm pages. See
// prop-firms-comparison-spec.md.
//
// IMPORTANT: the prop-firm industry is not government-regulated. Selection
// uses two tiers (full text on /en/prop-firms/ and /en/red-flags/):
// 1) A hard no, no exceptions: the firm (or an entity tied to it) is on an
//    official regulator warning list/blacklist (Bank of Russia, SEC, FCA,
//    etc.), sanctions, a confirmed systematic pattern of non-payment
//    complaints, documented retroactive rule changes against already-funded
//    traders, or no verifiable legal registration anywhere.
// 2) Reliability signals (don't all have to be fully met — `includeNote`
//    explains what falls short): Trustpilot 4.0+ with a meaningful review
//    count, a confirmed multi-year payout history (or a newer firm with
//    nothing else raising concerns on the hard criteria), ideally backing
//    by a regulated broker. This is not a financial licence or government
//    accreditation.
//
// Checked and NOT added 2026-09-14: Gerchik & Co -- the Bank of Russia
// lists the company (and the tied entity J.B. FINANCE LLP) on its warning
// list as an illegal securities-market participant (cbr.ru/eng/inside/
// warning-list/detail/?id=7372, listed 2021-02-01, updated 2024-10-01) --
// fails the hard criterion, not up for debate regardless of other metrics.
// Also: only 11 Trustpilot reviews (at 3.8/5) -- not enough data to judge
// reputation; offshore-only regulation (Vanuatu FSC, Mauritius FSC); the
// prop program only launched in 2024. Don't re-add without the CBR listing
// being lifted.
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
    markets: ["forex"],
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
    markets: ["forex"],
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
    markets: ["forex"],
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
    markets: ["futures"],
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
    payoutSlug: "topstep",
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
    markets: ["forex"],
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
    payoutSlug: "brightfunded",
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
    markets: ["forex"],
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
    payoutSlug: "blueberry-funded",
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
