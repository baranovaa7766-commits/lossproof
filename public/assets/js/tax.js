// Калькулятор налогов самозанятого и ИП на 2026 год: НПД, УСН «Доходы» 6 %
// и УСН «Доходы минус расходы» 15 % при одинаковом доходе — что выгоднее и
// когда платить. Это оценка для планирования, а не расчёт для декларации.
//
// Параметры 2026 года — те же, что в приложении LossProof (ФНС, Контур, Главбух):
// фиксированные взносы ИП 57 390 ₽, 1 % с дохода свыше 300 000 ₽ не больше
// 321 818 ₽, лимит НПД 2,4 млн ₽, НДС на УСН с дохода больше 20 млн ₽.

(function () {
  "use strict";

  var form = document.getElementById("tax-form");
  if (!form || !window.LP) return;
  var LP = window.LP;

  var P = {
    ipFixed: 57390,
    extraMax: 321818,
    extraThreshold: 300000,
    npdLimit: 2400000,
    npdDeduction: 10000,
    usnVatFree: 20000000,
  };

  var payerValue = LP.segmented(document.getElementById("tax-payer"), update);
  var scheduleValue = LP.segmented(document.getElementById("tax-schedule-switch"), renderSchedule);
  var last = null;

  function extra(base) {
    return Math.min(P.extraMax, Math.max(0, (base - P.extraThreshold) * 0.01));
  }

  function calc() {
    var income = Math.max(0, LP.num("tax-income")) * 12;
    var expenses = Math.max(0, LP.num("tax-expenses")) * 12;
    var company = payerValue() === "company";
    var useDeduction = document.getElementById("tax-deduction").checked;

    // НПД: 4 % с доходов от людей, 6 % — от компаний и ИП. Вычет 10 000 ₽
    // снижает ставку до 3 % и 4 %, пока не израсходуется. Взносов нет.
    var npdRate = company ? 6 : 4;
    var npdTax = (income * npdRate) / 100;
    if (useDeduction) npdTax -= Math.min(P.npdDeduction, (income * (company ? 2 : 1)) / 100);
    var npd = { tax: npdTax, contrib: 0, available: income <= P.npdLimit };

    // УСН 6 %: ИП без работников уменьшает налог на все взносы за себя.
    var ex6 = extra(income);
    var usn6 = { tax: Math.max(0, income * 0.06 - (P.ipFixed + ex6)), contrib: P.ipFixed + ex6, available: true };

    // УСН 15 %: взносы входят в расходы; если налог меньше 1 % дохода — платят 1 %.
    var ex15 = extra(income - expenses);
    var base15 = Math.max(0, income - expenses - P.ipFixed - ex15);
    var usn15 = { tax: Math.max(base15 * 0.15, income * 0.01), contrib: P.ipFixed + ex15, available: true, minTax: base15 * 0.15 < income * 0.01 && income > 0 };

    [npd, usn6, usn15].forEach(function (x) {
      x.total = x.tax + x.contrib;
      x.left = income - expenses - x.total;
      x.share = income > 0 ? (x.total / income) * 100 : 0;
    });

    return { income: income, expenses: expenses, npd: npd, usn6: usn6, usn15: usn15, npdRate: npdRate };
  }

  function pct(n) {
    return n.toLocaleString("ru-RU", { maximumFractionDigits: 1 }) + LP.NBSP + "%";
  }

  function update() {
    var c = calc();
    last = c;
    var keys = ["npd", "usn6", "usn15"];
    var best = null;
    keys.forEach(function (k) {
      var x = c[k];
      if (x.available && (!best || x.total < c[best].total)) best = k;
    });

    keys.forEach(function (k) {
      var x = c[k];
      var col = document.getElementById("tax-col-" + k);
      col.classList.toggle("is-best", k === best && c.income > 0);
      col.classList.toggle("is-off", !x.available);
      LP.set(k + "-total", x.available ? LP.rub(x.total) : "недоступно");
      LP.set(k + "-month", x.available ? LP.rub(x.total / 12) + " в месяц" : "доход больше 2,4 млн ₽ в год");
      LP.set(k + "-tax", LP.rub(x.tax));
      LP.set(k + "-contrib", x.contrib ? LP.rub(x.contrib) : "нет");
      LP.set(k + "-share", pct(x.share));
      LP.set(k + "-left", LP.rub(x.left));
    });
    LP.set("npd-rate", c.npdRate + LP.NBSP + "%");
    LP.set("tax-year-income", LP.rub(c.income));

    var notes = [];
    if (!c.npd.available) notes.push("Самозанятость недоступна: лимит НПД — 2,4 млн ₽ дохода в год.");
    if (c.income > P.usnVatFree) notes.push("Доход больше 20 млн ₽ в год: на УСН в 2026 году добавится НДС — здесь он не учтён.");
    if (c.usn15.minTax) notes.push("На УСН 15 % получается минимальный налог — 1 % от дохода: он больше, чем 15 % от прибыли.");
    if (c.expenses > c.income && c.income > 0) notes.push("Расходы больше дохода — проверьте суммы.");
    var box = document.getElementById("tax-notes");
    box.textContent = "";
    notes.forEach(function (t) {
      var p = document.createElement("p");
      p.className = "tool-note";
      p.textContent = t;
      box.appendChild(p);
    });

    var verdict = document.getElementById("tax-verdict");
    if (c.income <= 0) verdict.textContent = "Введите доход — сравним три режима.";
    else verdict.textContent = "Меньше всего платить на режиме «" + { npd: "НПД", usn6: "УСН 6 %", usn15: "УСН 15 %" }[best] + "»: " + LP.rub(c[best].total) + " в год.";

    renderSchedule();
  }

  /** Сроки уплаты на 2026 год с суммами из расчёта. */
  function renderSchedule() {
    if (!last) return;
    var c = last;
    var k = scheduleValue();
    var rows = [];
    if (k === "npd") {
      rows.push(["До 12-го числа", "Приложение «Мой налог» присылает сумму налога за прошлый месяц"]);
      rows.push(["До 28-го числа", "Налог за прошлый месяц: около " + LP.rub(c.npd.tax / 12) + " в месяц при ровном доходе. Налог меньше 100 ₽ переносится на следующий месяц"]);
      rows.push(["Взносы", "Не обязательны: пенсионные взносы самозанятый платит по желанию"]);
    } else {
      var six = k === "usn6";
      var fixed = P.ipFixed;
      // Срок уведомления — 25-е число, но в 2026 году оно каждый раз выпадает
      // на выходной и переносится на ближайший рабочий день.
      var quarters = [
        ["до 28 апреля 2026", "I квартал", "27 апреля"],
        ["до 28 июля 2026", "полугодие", "27 июля"],
        ["до 28 октября 2026", "9 месяцев", "26 октября"],
      ];
      var paid = 0;
      quarters.forEach(function (q, i) {
        var inc = (c.income * (i + 1)) / 4;
        var tax;
        if (six) tax = Math.max(0, inc * 0.06 - fixed);
        else tax = Math.max(0, inc - (c.expenses * (i + 1)) / 4 - (fixed * (i + 1)) / 4) * 0.15;
        var due = Math.max(0, tax - paid);
        paid += due;
        rows.push([q[0], "Аванс за " + q[1] + ": " + LP.rub(due) + (due > 0 ? ". Уведомление об авансе — до " + q[2] : "")]);
      });
      var yearTax = six ? c.usn6.tax : c.usn15.tax;
      rows.push(["до 28 декабря 2026", "Фиксированные взносы ИП за 2026 год: " + LP.rub(fixed)]);
      rows.push(["до 26 апреля 2027", "Декларация по УСН за 2026 год (срок 25 апреля выпадает на воскресенье)"]);
      rows.push(["до 28 апреля 2027", "Налог за 2026 год: " + LP.rub(Math.max(0, yearTax - paid)) + (yearTax < paid ? ". Авансов заплачено больше — переплату вернут или зачтут" : "")]);
      var ex = six ? c.usn6.contrib - fixed : c.usn15.contrib - fixed;
      if (ex > 0) rows.push(["до 1 июля 2027", "Взнос 1 % с дохода свыше 300 000 ₽: " + LP.rub(ex)]);
    }
    var list = document.getElementById("tax-schedule");
    list.textContent = "";
    rows.forEach(function (r) {
      var li = document.createElement("li");
      var b = document.createElement("b");
      b.textContent = r[0];
      var s = document.createElement("span");
      s.textContent = r[1];
      li.appendChild(b);
      li.appendChild(s);
      list.appendChild(li);
    });
  }

  document.getElementById("tax-deduction").addEventListener("change", update);
  LP.bind(form, update);
})();
