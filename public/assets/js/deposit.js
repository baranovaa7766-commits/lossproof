// Калькулятор вклада: доход с капитализацией или без, пополнения и налог на проценты.
// Считаем помесячно с текущего месяца: проценты = остаток × ставка ÷ 12. Банки
// начисляют по дням, поэтому их цифры могут немного отличаться.
//
// Налог на проценты (ст. 214.2 НК РФ): не облагается доход за год до
// 1 000 000 ₽ × максимальная ключевая ставка ЦБ на 1-е число месяцев этого года.
// 2026 год: ставка на 1 января — 16 %, дальше снижалась → лимит 160 000 ₽
// (если до декабря ставка не поднимется выше 16 %). Для следующих лет ставка
// неизвестна — берём нынешнюю, 14 % (1 октября 2026), → 140 000 ₽: это оценка.
// С превышения — 13 % (15 % — с части доходов за год свыше 2,4 млн ₽, здесь не учтено).
// Лимит общий на все вклады и счета человека.

(function () {
  "use strict";

  var form = document.getElementById("dep-form");
  if (!form || !window.LP) return;
  var LP = window.LP;

  var LIMITS = { 2025: 210000, 2026: 160000 };
  var LIMIT_LATER = 140000; // оценка по ключевой ставке 14 %
  var capValue = LP.segmented(document.getElementById("dep-cap"), update);

  function limitFor(year) {
    return LIMITS[year] !== undefined ? LIMITS[year] : LIMIT_LATER;
  }

  function update() {
    var sum = Math.max(0, LP.num("dep-sum"));
    var rate = Math.max(0, LP.num("dep-rate")) / 100;
    var n = Math.max(1, Math.min(120, Math.round(LP.num("dep-months")) || 1));
    var topup = Math.max(0, LP.num("dep-topup"));
    var cap = capValue() === "monthly";

    var now = new Date();
    var balance = sum;
    var pending = 0; // проценты без капитализации копятся и выплачиваются в конце срока
    var interest = 0;
    var byYear = {};
    for (var i = 0; i < n; i++) {
      var inc = balance * (rate / 12);
      interest += inc;
      var paidAt = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
      if (cap) {
        balance += inc;
        byYear[paidAt.getFullYear()] = (byYear[paidAt.getFullYear()] || 0) + inc;
      } else {
        pending += inc;
      }
      if (i < n - 1) balance += topup; // пополнение в конце месяца, кроме последнего
    }
    if (!cap) {
      var endYear = new Date(now.getFullYear(), now.getMonth() + n, 1).getFullYear();
      byYear[endYear] = (byYear[endYear] || 0) + pending;
    }
    var deposited = sum + topup * (n - 1);
    var final = balance + (cap ? 0 : pending);

    var tax = 0;
    var taxRows = [];
    Object.keys(byYear)
      .sort()
      .forEach(function (y) {
        var inc = byYear[y];
        var lim = limitFor(Number(y));
        var t = Math.max(0, inc - lim) * 0.13;
        tax += t;
        taxRows.push([y + " год", "Проценты " + LP.rub(inc) + ", без налога до " + LP.rub(lim) + (Number(y) > 2026 ? " (оценка)" : "") + (t > 0 ? " → налог " + LP.rub(t) : " → налога нет")]);
      });

    LP.set("dep-final", LP.rub(final));
    LP.set("dep-final-note", "Внесёте " + LP.rub(deposited) + ", проценты — " + LP.rub(interest) + " за " + LP.duration(n));
    LP.set("dep-tax", LP.rub(tax));
    LP.set("dep-tax-note", tax > 0 ? "После налога останется " + LP.rub(final - tax) + ". Банк сам налог не удерживает — его пришлёт налоговая в следующем году" : "Проценты не больше необлагаемого лимита — если других вкладов нет");

    var list = document.getElementById("dep-schedule");
    list.textContent = "";
    taxRows.forEach(function (r) {
      var li = document.createElement("li");
      var b = document.createElement("b");
      b.textContent = r[0];
      var s = document.createElement("span");
      s.textContent = r[1];
      li.appendChild(b);
      li.appendChild(s);
      list.appendChild(li);
    });

    var verdict = document.getElementById("dep-verdict");
    if (sum <= 0 || rate <= 0) {
      verdict.textContent = "Введите сумму и ставку — посчитаем доход и налог.";
    } else if (topup === 0) {
      var eff = Math.pow(final / sum, 12 / n) - 1;
      verdict.textContent = cap
        ? "С ежемесячной капитализацией ставка " + (rate * 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 }) + LP.NBSP + "% на деле даёт " + (eff * 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 }) + LP.NBSP + "% годовых."
        : "Без капитализации проценты начисляются только на сумму вклада. С ежемесячной капитализацией доход был бы больше.";
    } else {
      verdict.textContent = "С пополнением " + LP.rub(topup) + " в месяц за срок внесёте ещё " + LP.rub(topup * (n - 1)) + ".";
    }
  }

  LP.bind(form, update);
})();
