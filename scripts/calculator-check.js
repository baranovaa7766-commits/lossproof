// Самопроверка калькулятора. Запуск: открыть /calculator/ (или /en/calculator/),
// вставить содержимое файла в консоль браузера. Возвращает список проблем
// (пустой массив — всё хорошо). Гоняет все сочетания «откуда → куда» и
// проверяет: нет ошибок/мусора в выводе, нет пустых ячеек, ни один маршрут не
// выделен как «лучший», нет P2P-маршрутов (убраны 2026-09-25), и главное —
// ПОЛНОТУ маршрутов (чтобы не терялись способы).
(async () => {
  const problems = [];
  async function run(s, d, amount = 1000) {
    document.getElementById("calc-source").value = s;
    document.getElementById("calc-destination").value = d;
    document.getElementById("calc-amount").value = amount;
    document.querySelector(".calc-form").requestSubmit();
    for (let i = 0; i < 50; i++) {
      await new Promise((r) => setTimeout(r, 80));
      if (!document.querySelector(".calc-loading")) break;
    }
    const res = document.querySelector(".calc-result");
    return { res, routes: Array.from(res.querySelectorAll(".calc-route")).map((e) => e.textContent) };
  }

  // 1) Матрица: никаких ошибок и мусора.
  const sources = ["firm:ftmo", "firm:topstep", "firm:brightfunded", "cash:USD", "cash:RUB", "cash:EUR", "cash:BYN", "crypto", "crypto:bybit"];
  const dests = ["crypto:all", "crypto:bybit", "crypto:okx", "firm:ftmo", "firm:topstep", "fiat:USD", "fiat:RUB", "fiat:BYN", "fiat:EUR"];
  for (const s of sources) {
    for (const d of dests) {
      const { res } = await run(s, d);
      const key = `${s} > ${d}`;
      if (/NaN|undefined|Infinity|\[object|null|\+ \+/.test(res.textContent)) problems.push(`${key}: мусор в тексте`);
      if (!res.querySelector(".calc-table") && !res.querySelector(".notes-box, .calc-error")) problems.push(`${key}: пустой результат`);
      res.querySelectorAll(".calc-table tbody tr").forEach((tr) => {
        if (!tr.querySelector(".calc-sub").textContent.trim() || !tr.children[1].textContent.trim()) problems.push(`${key}: пустая ячейка`);
      });
      if (res.querySelector(".calc-best, .calc-badge")) problems.push(`${key}: маршрут выделен как «лучший»`);
      if (/P2P\)|→ P2P/.test(res.querySelector(".calc-table") ? res.querySelector(".calc-table").textContent : "")) problems.push(`${key}: есть P2P-маршрут`);
    }
  }

  // 2) Полнота: рубли на любую биржу — через оба обменника.
  for (const e of ["bybit", "bingx", "kucoin", "okx", "mexc", "gate"]) {
    const { routes } = await run("cash:RUB", `crypto:${e}`, 100000);
    for (const [name, re] of [["Whitebird", /Whitebird/], ["Cifra", /Cifra/]]) {
      if (!routes.some((r) => re.test(r))) problems.push(`RUB > ${e}: нет маршрута через ${name}`);
    }
  }
  // 3) Рубли «во все варианты»: оба обменника есть.
  {
    const { routes } = await run("cash:RUB", "crypto:all", 100000);
    for (const n of ["Whitebird", "Cifra"]) if (!routes.some((r) => r.includes(n))) problems.push(`RUB > все: нет ${n}`);
  }
  // 4) Валюта на карте: биржи с вводом картой/банком присутствуют.
  for (const [id, name] of [["bybit", "Bybit"], ["bingx", "BingX"], ["mexc", "MEXC"], ["gate", "Gate"]]) {
    const { routes } = await run("cash:USD", `crypto:${id}`);
    if (!routes.some((r) => r.includes(name))) problems.push(`USD > ${id}: маршрута нет`);
  }
  // 5) USD → RUB: оба обменника.
  {
    const { routes } = await run("cash:USD", "fiat:RUB");
    for (const [name, re] of [["Whitebird", /Whitebird/], ["Cifra", /Cifra/]]) if (!routes.some((r) => re.test(r))) problems.push(`USD > RUB: нет ${name}`);
  }
  // 6) BYN → биржа: только через Whitebird (единственный, кто принимает BYN).
  {
    const { routes } = await run("cash:BYN", "crypto:bybit", 1000);
    if (!routes.some((r) => /Whitebird/.test(r))) problems.push("BYN > bybit: нет Whitebird");
  }
  console.log(problems.length ? problems : "Калькулятор: все проверки пройдены");
  return problems;
})();
