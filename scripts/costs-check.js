// Самопроверка «Стоимости сделок». Запуск: открыть /costs/ (или /en/costs/),
// вставить содержимое файла в консоль браузера. Возвращает список проблем
// (пустой массив — всё хорошо).
//
// Главное — точность денег: на маленьких файлах с заранее посчитанными
// суммами проверяем разбор каждого формата, пересчёт комиссий в доллары
// (в том числе комиссии в третьей монете), мейкер/тейкер, закрытые позиции
// и правило «не считать дважды» (дубли, пересечение файлов, дозаполнение
// периода). Плюс сквозной проход по интерфейсу на демо-файлах и проверка,
// что строки из файла не попадают в страницу как разметка.
(async () => {
  const problems = [];
  const add = (msg) => {
    if (problems.length < 60) problems.push(msg);
  };
  const near = (a, b, eps = 1e-6) => Number.isFinite(a) && Math.abs(a - b) <= eps;
  const expect = (label, got, want, eps) => {
    if (!near(got, want, eps)) add(`${label}: получили ${got}, ждали ${want}`);
  };
  const read = (name, text) => costsReadFile(name, text.replace(/^\n/, ""));
  const analyze = (...files) => costsAnalyze(files);

  // 1) Числа, даты, инструменты.
  expect("число 1,234.56", costsNum("1,234.56"), 1234.56);
  expect("число 1 234,56 (десятичная запятая)", costsNum("1 234,56", true), 1234.56);
  expect("число 1.234,5 (десятичная запятая)", costsNum("1.234,5", true), 1234.5);
  expect("число 1.0E-4", costsNum("1.0E-4"), 0.0001);
  if (!Number.isNaN(costsNum("--"))) add("«--» должно быть пустым значением");
  expect("время Bybit «19:34 2026-02-28»", costsTime("19:34 2026-02-28"), Date.UTC(2026, 1, 28, 19, 34));
  expect("время журнала", costsTime("2026-01-03 10:56:42.243"), Date.UTC(2026, 0, 3, 10, 56, 42, 243));
  expect("время 28.02.2026 19:34", costsTime("28.02.2026 19:34"), Date.UTC(2026, 1, 28, 19, 34));
  expect("время Unix", costsTime("1767225600"), 1767225600000);
  const sym = (s) => costsSymbol(s);
  if (sym("BTCUSDT").base !== "BTC" || sym("BTCUSDT").quote !== "USDT") add("BTCUSDT разобран неверно");
  if (sym("1000PEPEUSDT").base !== "1000PEPE") add("1000PEPEUSDT разобран неверно");
  if (!sym("BTC-USDT-SWAP").derivative) add("BTC-USDT-SWAP не распознан как дериватив");
  if (!sym("ETH-20FEB26-2800-C-USDT").option) add("опцион не распознан");
  if (sym("BTCPERP").quote !== "USDC") add("BTCPERP — это USDC-контракт");
  if (!sym("BTCUSD").inverse) add("BTCUSD — инверсный контракт");
  const range = costsRangeFromName("Bybit-Spot-TradeHistory-1756674000-1772312399.csv");
  if (!range || range[0] !== 1756674000000 || range[1] !== 1772312399999) add("период из имени файла Bybit не прочитан");

  // 2) Файлы-образцы. Суммы в комментариях посчитаны вручную.
  const P1 = read("perp.csv", `
Market,Filled Type,Filled Quantity,Filled Price,Order Price,Fee Rate,Trading Fee,feeCoin,ExecFeeV2,Direction,Order Type,Trasaction ID,Order No.,Transaction Time(UTC+0)
AAAUSDT,Trade,2,100,100,0.00055,0.11,USDT,0.11,Long,Market, a1, o1,10:00 2026-01-10
AAAUSDT,Trade,2,110,110,0.0002,0.044,USDT,0.044,Short,Limit, a2, o2,12:00 2026-01-10
AAAUSDT,Trade,1,105,105,0.00055,0.05775,USDT,0.05775,Short,Limit, a3, o3,13:00 2026-01-10
AAAUSDT,Funding,2,108,0,0.0001,0.0216,USDT,0.0216,Long,--, f1, g1,08:00 2026-01-11
AAAUSDT,Funding,2,108,0,-0.0001,-0.05,,0,Long,--, f2, g2,16:00 2026-01-11
BBBUSDT,Liquidation,10,5,5,0.00055,0.0275,USDT,0.0275,Short,Market, a4, o4,09:00 2026-01-12
`);
  const S1 = read("spot.csv", `
Spot Pairs,Order Type,Direction,feeCoin,ExecFeeV2,Filled Value,Filled Price,Filled Quantity,Fees,Transaction ID,Order No.,Timestamp (UTC)
CCCUSDT,MARKET,BUY,CCC,0.01,20,2,10,--,t1, o1,10:00 2026-01-10
CCCUSDT,MARKET,SELL,USDT,0.03,30,3,10,--,t2, o2,11:00 2026-01-11
DDDUSDT,LIMIT,BUY,CCC,0.5,100,50,2,--,t3, o3,11:30 2026-01-11
EEEUSDT,MARKET,BUY,ZZZ,1,10,1,10,--,t4, o4,12:00 2026-01-11
`);
  const C1 = read("pnl.csv", `
Market,Order Quantity,Entry Price,Exit Price,Opening Fee,Closing Fee,Funding Fee,cumClosedPzOpenFeeInfo,cumClosedPzTradeFeeInfo,Trade Type,Realized P&L,Trade time
AAAUSDT,2.0000,100,110,0.11,0.121,0.02,"{""USDT"":""0.11""}","{""USDT"":""0.121""}",Trade,19.749,12:00 2026-01-10
AAAUSDT,1.0000,100,100.05,0.055,0.0550275,0,"{""USDT"":""0.055""}","{""USDT"":""0.0550275""}",Trade,-0.0600275,15:00 2026-01-11
BBBUSDT,10.0000,5,4.5,0.0275,0.02475,0,"{""USDT"":""0.0275""}","{""USDT"":""0.02475""}",Liquidation,-5.05225,09:00 2026-01-12
`);
  const L1text = `
Currency,Contract,Type,Direction,Quantity,Position,Filled Price,Funding,Fee Paid,Cash Flow,Change,Wallet Balance,Action,OrderId,TradeId,Time
USDT,AAAUSDT,TRADE,BUY,2,2,100,0,-0.11,0,-0.11,1000,OPEN,o1,x1,2026-01-10 10:00:00.000
USDT,AAAUSDT,SETTLEMENT,BUY,0,2,108,-0.0216,0,0,-0.0216,1000,SETTLEMENT,o2,x2,2026-01-11 08:00:00.000
USDT,AAA-27MAR26-120-C-USDT,TRADE,BUY,1,1,5,0,-0.03,-5,-5.03,1000,OPEN,o3,x3,2026-01-11 09:00:00.000
CCC,,CURRENCY_SELL,--,10,0,0.5,0,-0.2,-9.8,-10,0,--,o4,o4,2026-01-11 10:00:00.000
USDT,,INTEREST,--,0,0,0,0,0,-0.004,-0.004,-40,--,,,2026-01-11 11:00:00.000
CCC,CCCUSDT,TRADE,BUY,10,0,2,0,0,10,10,10,--,o5,x5,2026-01-10 10:00:00.000
USDT,CCCUSDT,TRADE,BUY,-20,0,2,0,-0.02,-20,-20.02,980,--,o5,x5,2026-01-10 10:00:00.000
USDT,AAAUSDT,TRADE,SELL,1,0,120,0,-0.066,0,-0.066,1000,CLOSE,o6,x6,2026-01-20 10:00:00.000
`;
  const L1 = read("log.csv", L1text);

  const types = { P1: "bybit-perp", S1: "bybit-spot", C1: "bybit-pnl", L1: "bybit-log" };
  Object.entries({ P1, S1, C1, L1 }).forEach(([k, f]) => {
    if (f.type !== types[k]) add(`${k}: формат ${f.type}, ждали ${types[k]}`);
    if (!f.ok) add(`${k}: файл не разобран (${f.reason})`);
  });

  // 3) Сделки в деривативах: суммы, мейкер/тейкер, фандинг, ликвидации.
  let r = analyze(P1);
  const fu = r.seg.futures;
  expect("P1 сделок", fu.fills, 4);
  expect("P1 оборот", fu.notional, 575);
  expect("P1 комиссии", fu.fees, 0.23925);
  expect("P1 тейкер: оборот", fu.taker.notional, 355);
  expect("P1 тейкер: комиссии", fu.taker.fees, 0.19525);
  expect("P1 мейкер: оборот", fu.maker.notional, 220);
  expect("P1 ликвидации: комиссии", fu.liq.fees, 0.0275);
  expect("P1 лимитные по ставке тейкера", fu.limitAsTaker, 1);
  expect("P1 фандинг заплачен", r.funding.paid, 0.0216);
  expect("P1 фандинг получен", r.funding.received, 0.05);
  expect("P1 фандинг итог", r.funding.net, -0.0284);
  expect("P1 итог", r.total, 0.23925 - 0.0284);

  // 4) Спот: комиссия в купленной монете и в третьей монете, монета без цены.
  r = analyze(S1);
  const sp = r.seg.spot;
  expect("S1 сделок", sp.fills, 4);
  expect("S1 комиссии (0,02 + 0,03 + 1,5)", sp.fees, 1.55);
  expect("S1 оборот без сделки с неизвестной комиссией", sp.notional, 150);
  expect("S1 сделок без суммы", sp.noNotional, 0);
  if (!r.unpriced.some((u) => u.coin === "ZZZ")) add("S1: комиссия в ZZZ не отмечена как без цены");

  // 5) Закрытые позиции.
  r = analyze(C1);
  const p = r.positions;
  if (!p) add("C1: нет итогов по позициям");
  else {
    expect("C1 позиций", p.count, 3);
    expect("C1 ликвидаций", p.liq, 1);
    expect("C1 результат по цене", p.gross, 15.05);
    expect("C1 комиссии", p.fees, 0.3932775);
    expect("C1 фандинг", p.funding, 0.02);
    expect("C1 итог", p.net, 14.6367225);
    expect("C1 в плюс по цене", p.winGross, 2);
    expect("C1 в плюс после издержек", p.winNet, 1);
    expect("C1 издержки перевели в минус", p.flipped, 1);
    expect("C1 порог", p.breakEven, 2.55613875 / (19.749 + 2.55613875));
  }
  expect("C1 без истории сделок: комиссии из ног позиций", r.seg.futures.fees, 0.3932775);
  expect("C1 без истории сделок: фандинг", r.funding.net, 0.02);

  // 6) Только журнал: фьючерсы, спот, фандинг, опционы, обмен, проценты.
  r = analyze(L1);
  expect("L1 фьючерсы: комиссии", r.seg.futures.fees, 0.176);
  expect("L1 фьючерсы: оборот", r.seg.futures.notional, 320);
  expect("L1 спот: комиссии", r.seg.spot.fees, 0.02);
  expect("L1 спот: оборот", r.seg.spot.notional, 20);
  expect("L1 фандинг", r.funding.net, 0.0216);
  expect("L1 опционы", r.extra.options.cost, 0.03);
  expect("L1 обмен монет (0,2 CCC × 2 $)", r.extra.conversion.cost, 0.4);
  expect("L1 проценты", r.extra.interest.cost, 0.004);
  expect("L1 итог", r.total, 0.6516);

  // 7) Не считать дважды: история сделок + журнал + Closed P&L.
  r = analyze(P1, L1, C1);
  expect("P1+L1+C1 фьючерсы: из истории сделок + сделка журнала вне её периода", r.seg.futures.fees, 0.23925 + 0.066);
  expect("P1+L1+C1 фандинг только из истории сделок", r.funding.net, -0.0284);
  expect("P1+L1+C1 спот из журнала", r.seg.spot.fees, 0.02);
  expect("P1+L1+C1 итог", r.total, 0.23925 + 0.066 - 0.0284 + 0.02 + 0.03 + 0.4 + 0.004);
  if (!r.positions || r.positions.count !== 3) add("P1+L1+C1: позиции из Closed P&L потерялись");
  if (!L1.shadowed) add("журнал: не отмечено, что часть записей взята из истории сделок");

  // 8) Тот же файл дважды и пересекающиеся выгрузки.
  const P1copy = read("perp (1).csv", P1.body.map((x) => x.join(",")).join("\n").replace(/^/, `${P1.header.join(",")}\n`));
  r = analyze(P1, P1copy);
  expect("дубль файла: комиссии не удвоились", r.seg.futures.fees, 0.23925);
  expect("дубль файла: отмечено строк-повторов", P1copy.dupes, 6);
  r = analyze(S1, P1copy, P1);
  expect("порядок файлов не влияет на итог", r.seg.futures.fees, 0.23925);

  // 9) OKX (бета): строка над заголовком, комиссия в монете, контракты, фандинг.
  const O1 = read("okx-trades.csv", `
UID: 123
id,Order id,Time,Trade Type,Symbol,Action,Amount,Trading Unit,Filled Price,PnL,Fee,Fee Unit,Position Change,Position Balance,Balance Change,Balance,Balance Unit
1,11,2026-01-10 10:00:00,Spot,AAA-USDT,Buy,2,AAA,100,0,-0.002,AAA,0,0,2,2,AAA
2,12,2026-01-10 11:00:00,Perpetual,AAA-USDT-SWAP,Open long,3,cont,100,0,-0.15,USDT,3,3,0,0,USDT
3,13,2026-01-10 12:00:00,Perpetual,AAA-USDT-SWAP,Close long,1,AAA,110,10,-0.055,USDT,-1,0,10,0,USDT
4,14,2026-01-10 16:00:00,Perpetual,AAA-USDT-SWAP,Funding fee,0,USDT,0,0,0,USDT,0,0,-0.03,0,USDT
`);
  if (O1.type !== "okx-trades" || !O1.beta) add("OKX: история сделок не распознана как бета-формат");
  r = analyze(O1);
  expect("OKX спот: комиссия 0,002 AAA × 100 $", r.seg.spot.fees, 0.2);
  expect("OKX фьючерсы: комиссии", r.seg.futures.fees, 0.205);
  expect("OKX фьючерсы: оборот (контракты без размера не входят)", r.seg.futures.notional, 110);
  expect("OKX фьючерсы: без суммы сделки", r.seg.futures.noNotional, 1);
  expect("OKX фандинг", r.funding.net, 0.03);
  if (!r.beta) add("OKX: результат не помечен как бета");

  const O2 = read("okx-positions.csv", `
Position Create Time,Position Update Time,Business Line,Index,Instrument Name,Margin Mode,Direction,Leverage,Max Position Quantity,Total Close Quantity,Average Open Price,Average Close Price,Margin Currency,Pnl,Pnl Ratio,Fee,Funding Fee,Liquidation Clearance Fee,Type,Contract Face Value,Contract Multiplier
2026-01-10 09:00:00,2026-01-10 18:00:00,Perpetual,AAA-USDT,AAA-USDT-SWAP,Cross,Long,10,5,5,100,110,USDT,5,0.1,-0.5,-0.02,0,Close position,0.1,1
`);
  if (O2.type !== "okx-positions") add("OKX: история позиций не распознана");
  r = analyze(O2);
  if (!r.positions) add("OKX позиции: нет итогов");
  else {
    expect("OKX позиции: результат по цене", r.positions.gross, 5);
    expect("OKX позиции: комиссии", r.positions.fees, 0.5);
    expect("OKX позиции: фандинг", r.positions.funding, 0.02);
    expect("OKX позиции: итог", r.positions.net, 4.48);
  }
  expect("OKX позиции: оборот ног", r.seg.futures.notional, 105);

  // 10) Свой формат: «;», десятичная запятая, пробел в тысячах, ребейт.
  const U1 = read("my-exchange.csv", `
Дата;Пара;Сумма;Комиссия;Валюта комиссии;Тип
10.01.2026 10:00;AAAUSDT;1 000,50;1,0005;USDT;Market
11.01.2026 11:00;AAAUSDT;500;-0,1;USDT;Limit
`);
  if (U1.ok || U1.reason !== "unknown") add("свой формат должен требовать ручного сопоставления");
  const guess = costsGuessMapping ? costsGuessMapping(U1.header) : null;
  if (guess && (guess.fee !== 3 || guess.feeCoin !== 4 || guess.value !== 2 || guess.time !== 0)) add(`догадка о колонках неверна: ${JSON.stringify(guess)}`);
  costsApplyMapping(U1, { time: 0, market: 1, value: 2, price: -1, qty: -1, fee: 3, feeCoin: 4, orderType: 5 }, "spot", "Моя биржа");
  r = analyze(U1);
  expect("свой формат: оборот", r.seg.spot.notional, 1500.5);
  expect("свой формат: комиссии с ребейтом", r.seg.spot.fees, 0.9005);
  if (r.exchanges[0] !== "Моя биржа") add("свой формат: не подставилось название биржи");

  // 11) Excel и пустые файлы.
  if (read("book.xlsx", "PK\u0003\u0004xl/workbook.xml").reason !== "xlsx") add("XLSX не распознан");
  if (read("empty.csv", "").ok) add("пустой файл не должен считаться");

  // 12) Сравнение ставок.
  const cmp = costsCompare(analyze(P1), [{ slug: "x", name: "X", spot: { maker: 0, taker: 0 }, futures: { maker: 0.01, taker: 0.05 } }]);
  expect("сравнение: 220 × 0,01% + 355 × 0,05%", cmp[0].total, 0.1995);
  expect("сравнение: разница с фактом", cmp[0].diff, 0.1995 - 0.23925);
  COSTS_FEE_TABLE.forEach((ex) => {
    ["spot", "futures"].forEach((seg) => {
      ["maker", "taker"].forEach((role) => {
        const v = ex[seg][role];
        if (!(v >= 0 && v < 1)) add(`ставка ${ex.name} ${seg} ${role} вне разумных пределов: ${v}`);
      });
    });
  });

  // 13) Демо-файлы: форматы, согласованность разборщиков, правило «не дважды».
  const demo = await Promise.all(COSTS_DEMO_FILES.map((n) => fetch(COSTS_DEMO_PATH + n).then((x) => x.text()).then((text) => costsReadFile(n, text))));
  demo.forEach((f) => {
    if (!f.ok) add(`демо: ${f.name} не разобран`);
  });
  const perpOnly = analyze(demo.find((f) => f.type === "bybit-perp"));
  const pnlOnly = analyze(demo.find((f) => f.type === "bybit-pnl"));
  const logOnly = analyze(demo.find((f) => f.type === "bybit-log"));
  expect("демо: комиссии фьючерсов — история сделок = Closed P&L", perpOnly.seg.futures.fees, pnlOnly.seg.futures.fees, 1e-4);
  expect("демо: комиссии фьючерсов — история сделок = журнал", perpOnly.seg.futures.fees, logOnly.seg.futures.fees, 1e-4);
  expect("демо: фандинг — история сделок = журнал", perpOnly.funding.net, logOnly.funding.net, 1e-4);
  const all = analyze(...demo);
  expect("демо: все файлы вместе не удваивают фьючерсы", all.seg.futures.fees, perpOnly.seg.futures.fees, 1e-6);
  const parts = all.seg.spot.fees + all.seg.futures.fees + all.funding.net + all.extra.options.cost + all.extra.conversion.cost + all.extra.interest.cost;
  expect("демо: итог = сумма статей", all.total, parts, 1e-9);
  if (all.unpriced.length) add(`демо: комиссии без цены: ${JSON.stringify(all.unpriced)}`);
  if (!all.positions || all.positions.count !== pnlOnly.positions.count) add("демо: позиции из Closed P&L потерялись при загрузке всех файлов");

  // 14) Интерфейс: пример, свой файл, удаление, экранирование.
  const root = document.getElementById("costs-tool");
  const wait = async (cond, ms = 8000) => {
    const t0 = Date.now();
    while (!cond()) {
      if (Date.now() - t0 > ms) return false;
      await new Promise((res) => setTimeout(res, 50));
    }
    return true;
  };
  try {
    root.querySelector('[data-action="clear"]').click();
    root.querySelector('[data-action="demo"]').click();
    if (!(await wait(() => root.querySelector(".cs-tiles")))) add("UI: пример не показал результат");
    ["cs-demo-banner", "cs-tiles", "cs-compare", "cs-dl"].forEach((c) => {
      if (!root.querySelector(`.${c}`)) add(`UI: нет блока .${c}`);
    });
    if (root.querySelectorAll(".cs-file").length !== COSTS_DEMO_FILES.length) add("UI: в списке не все демо-файлы");
    if (/NaN|undefined|Infinity|null/.test(root.innerText)) add("UI: мусор в тексте результата");
    const firstDiff = root.querySelector('[data-diff="0"]');
    if (!firstDiff || !firstDiff.textContent) add("UI: сравнение ставок не заполнилось");
    const rate = root.querySelector('.cs-rate[data-rate="0"][data-seg="futures"][data-role="taker"]');
    if (rate) {
      const before = root.querySelector('[data-total="0"]').textContent;
      rate.value = "0,5";
      rate.dispatchEvent(new Event("input", { bubbles: true }));
      if (root.querySelector('[data-total="0"]').textContent === before) add("UI: изменение ставки не пересчитало сравнение");
      if (document.activeElement !== rate && document.activeElement !== document.body) add("UI: пересчёт сбросил фокус");
      root.querySelector('[data-action="reset-rates"]').click();
    } else add("UI: нет поля ставки");

    // Свой файл с опасным именем и «разметкой» в ячейках.
    const input = root.querySelector("#cs-file");
    const dt = new DataTransfer();
    dt.items.add(new File([`Дата;Пара;Сумма;Комиссия\n10.01.2026;<img src=x onerror=alert(1)>;100;0,1\n`], "<img src=x onerror=alert(2)>.csv", { type: "text/csv" }));
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    if (!(await wait(() => root.querySelector(".cs-map")))) add("UI: для незнакомого файла не появилось сопоставление колонок");
    if (root.querySelector("img")) add("UI: строка из файла вставлена как разметка");
    if (root.querySelector(".cs-demo-banner")) add("UI: пример не исчез после загрузки своего файла");
    const form = root.querySelector(".cs-map");
    if (form) {
      form.querySelector('select[data-map="fee"]').value = "3";
      form.querySelector('select[data-map="value"]').value = "2";
      form.querySelector('select[data-map="market"]').value = "1";
      form.requestSubmit();
      if (!(await wait(() => root.querySelector(".cs-tiles")))) add("UI: после сопоставления нет результата");
      if (root.querySelector("img")) add("UI: инструмент из файла вставлен как разметка");
    }
    root.querySelector('[data-action="remove"]').click();
    if (root.querySelector(".cs-tiles")) add("UI: после удаления файла результат не исчез");
  } catch (e) {
    add(`UI: ${e.message}`);
  }

  console.log(problems.length ? problems : "Стоимость сделок: все проверки пройдены");
  return problems;
})();
