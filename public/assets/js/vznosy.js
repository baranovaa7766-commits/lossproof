// Калькулятор взносов ИП за себя на 2026 и 2027 год: фиксированная часть и 1 %
// с дохода свыше 300 000 ₽, сроки уплаты и как взносы уменьшают налог.
// Это оценка для планирования, а не расчёт для отчётности.
//
// Размеры — статья 430 НК РФ: 2026 — 57 390 ₽ и 1 % не больше 321 818 ₽,
// 2027 — 61 154 ₽ и 1 % не больше 342 923 ₽. Если ИП зарегистрирован не с начала
// года, фиксированная часть считается пропорционально: полные месяцы + дни
// месяца регистрации (п. 3 ст. 430 НК РФ). Порог 300 000 ₽ не уменьшается.

(function () {
  "use strict";

  var form = document.getElementById("vz-form");
  if (!form || !window.LP) return;
  var LP = window.LP;

  var YEARS = {
    2026: { fixed: 57390, extraMax: 321818 },
    2027: { fixed: 61154, extraMax: 342923 },
  };
  var THRESHOLD = 300000;
  var MONTHS_GEN = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

  var yearValue = LP.segmented(document.getElementById("vz-year"), update);
  var regimeValue = LP.segmented(document.getElementById("vz-regime"), update);
  var partial = document.getElementById("vz-partial");
  var dateInput = document.getElementById("vz-date");

  /** Срок уплаты с переносом с субботы и воскресенья на понедельник. */
  function due(y, m, d) {
    var dt = new Date(y, m, d);
    while (dt.getDay() === 0 || dt.getDay() === 6) dt.setDate(dt.getDate() + 1);
    return dt.getDate() + LP.NBSP + MONTHS_GEN[dt.getMonth()] + " " + dt.getFullYear();
  }

  /** Доля года для фиксированной части: полные месяцы после месяца регистрации + дни в месяце регистрации. */
  function yearShare(year) {
    if (!partial.checked || !dateInput.value) return { share: 1, from: null };
    var p = dateInput.value.split("-").map(Number);
    if (p[0] !== year) return { share: 1, from: null, wrongYear: true };
    var month = p[1] - 1;
    var day = p[2];
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var fullMonths = 11 - month;
    var daysPart = (daysInMonth - day + 1) / daysInMonth;
    return { share: (fullMonths + daysPart) / 12, from: day + LP.NBSP + MONTHS_GEN[month] };
  }

  function update() {
    var year = Number(yearValue());
    var Y = YEARS[year];
    var regime = regimeValue();
    document.getElementById("vz-expenses-field").hidden = regime !== "usn15";
    document.getElementById("vz-patent-field").hidden = regime !== "patent";
    document.getElementById("vz-income-label").textContent = regime === "patent" ? "Реальный доход за " + year + " год, ₽" : "Доход за " + year + " год, ₽";
    document.getElementById("vz-date-field").hidden = !partial.checked;
    dateInput.min = year + "-01-01";
    dateInput.max = year + "-12-31";

    var income = Math.max(0, LP.num("vz-income"));
    var expenses = Math.max(0, LP.num("vz-expenses"));
    var patent = Math.max(0, LP.num("vz-patent"));

    var ys = yearShare(year);
    var fixed = Math.round(Y.fixed * ys.share * 100) / 100;
    // База для 1 %: УСН «Доходы» — доход; «Доходы минус расходы» — разница; патент — потенциальный доход по патенту.
    var base = regime === "usn15" ? income - expenses : regime === "patent" ? patent : income;
    var extra = Math.min(Y.extraMax, Math.max(0, (base - THRESHOLD) * 0.01));
    var total = fixed + extra;

    LP.set("vz-title", "Взносы за " + year + " год");
    LP.set("vz-total", LP.rub(total));
    LP.set("vz-month", "≈ " + LP.rub(total / 12) + " в месяц, если откладывать понемногу");

    var rows = [];
    rows.push(["до " + due(year, 11, 28), "Фиксированные взносы: " + LP.rub(fixed) + (ys.share < 1 ? " (с " + ys.from + ", пропорционально)" : "")]);
    if (extra > 0) rows.push(["до " + due(year + 1, 6, 1), "1 % с " + (regime === "usn15" ? "разницы доходов и расходов" : regime === "patent" ? "потенциального дохода по патенту" : "дохода") + " свыше 300 000 ₽: " + LP.rub(extra) + (extra >= Y.extraMax ? " — это максимум" : "")]);
    else rows.push(["1 % с дохода", "Не нужен: " + (regime === "usn15" ? "разница доходов и расходов" : regime === "patent" ? "потенциальный доход по патенту" : "доход") + " не больше 300 000 ₽"]);
    var list = document.getElementById("vz-schedule");
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

    var verdict;
    if (regime === "usn6") {
      var tax = income * 0.06;
      verdict = "На УСН «Доходы» ИП без работников уменьшает налог на все взносы: " + LP.rub(tax) + " − " + LP.rub(total) + " = " + LP.rub(Math.max(0, tax - total)) + " налога за год.";
    } else if (regime === "usn15") {
      verdict = "На УСН «Доходы минус расходы» взносы входят в расходы и уменьшают базу для налога 15 %.";
    } else {
      verdict = "ИП на патенте без работников уменьшает стоимость патента на всю сумму взносов.";
    }
    LP.set("vz-verdict", verdict);

    var notes = [];
    if (ys.wrongYear) notes.push("Дата регистрации не из " + year + " года — считаем взносы за весь год.");
    if (regime === "usn15" && expenses > income && income > 0) notes.push("Расходы больше дохода — 1 % не нужен, проверьте суммы.");
    if (regime === "patent" && patent === 0) notes.push("Укажите потенциальный доход из патента — 1 % считают с него, а не с реального дохода.");
    var box = document.getElementById("vz-notes");
    box.textContent = "";
    notes.forEach(function (t) {
      var p = document.createElement("p");
      p.className = "tool-note";
      p.textContent = t;
      box.appendChild(p);
    });
  }

  partial.addEventListener("change", update);
  dateInput.addEventListener("change", update);
  LP.bind(form, update);
})();
