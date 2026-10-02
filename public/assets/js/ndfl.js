// Калькулятор НДФЛ и зарплаты на руки на 2026 год по прогрессивной шкале:
// 13 % до 2,4 млн ₽ дохода за год, 15 % — до 5 млн, 18 % — до 20 млн,
// 20 % — до 50 млн, 22 % — свыше. Каждая ставка — только с превышения.
// Работодатель удерживает налог нарастающим итогом с начала года, поэтому
// после перехода порога зарплата на руки становится меньше.
// Не учитываются вычеты (на детей и другие), районные коэффициенты и северные
// надбавки (для них своя шкала), доходы нерезидентов.

(function () {
  "use strict";

  var form = document.getElementById("ndfl-form");
  if (!form || !window.LP) return;
  var LP = window.LP;

  var SCALE = [
    [2400000, 0.13],
    [5000000, 0.15],
    [20000000, 0.18],
    [50000000, 0.2],
    [Infinity, 0.22],
  ];
  var MONTHS_IN = ["январе", "феврале", "марте", "апреле", "мае", "июне", "июле", "августе", "сентябре", "октябре", "ноябре", "декабре"];
  var MONTHS_FROM = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  var MONTHS_TO = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];

  var modeValue = LP.segmented(document.getElementById("ndfl-mode"), update);

  /** Налог с дохода за год нарастающим итогом. Без промежуточного округления:
   *  бухгалтерия округляет до рубля, отсюда расхождения в 1 ₽ между месяцами — они не важны. */
  function taxOf(income) {
    var tax = 0;
    var prev = 0;
    for (var i = 0; i < SCALE.length && income > prev; i++) {
      tax += (Math.min(income, SCALE[i][0]) - prev) * SCALE[i][1];
      prev = SCALE[i][0];
    }
    return tax;
  }

  /** Помесячно при одинаковой зарплате: удержанный налог и на руки. */
  function months(gross) {
    var out = [];
    var cum = 0;
    var paid = 0;
    for (var m = 0; m < 12; m++) {
      cum += gross;
      var t = taxOf(cum) - paid;
      paid += t;
      out.push({ tax: t, net: gross - t });
    }
    return out;
  }

  /** Сколько начислить, чтобы за год на руки было 12 × net: подбор делением пополам. */
  function grossFor(net) {
    var lo = net;
    var hi = net / 0.78 + 1;
    for (var i = 0; i < 60; i++) {
      var mid = (lo + hi) / 2;
      var sum = months(mid).reduce(function (s, x) {
        return s + x.net;
      }, 0);
      if (sum < net * 12) lo = mid;
      else hi = mid;
    }
    return hi;
  }

  function pct(n) {
    return n.toLocaleString("ru-RU", { maximumFractionDigits: 1 }) + LP.NBSP + "%";
  }

  function update() {
    var mode = modeValue();
    var input = Math.max(0, LP.num("ndfl-salary"));
    LP.set("ndfl-salary-label", mode === "gross" ? "Зарплата до вычета налога в месяц, ₽" : "Хочу на руки в месяц, ₽");
    LP.set("ndfl-salary-hint", mode === "gross" ? "Сумма в трудовом договоре — «оклад» или «начислено»" : "Покажем, сколько должно быть начислено, чтобы в среднем получать столько");

    var gross = mode === "gross" ? input : input > 0 ? Math.ceil(grossFor(input)) : 0;
    var rows = months(gross);
    var yearGross = gross * 12;
    var yearTax = rows.reduce(function (s, x) {
      return s + x.tax;
    }, 0);
    var yearNet = yearGross - yearTax;
    var first = rows[0].net;
    var last = rows[11].net;
    var same = Math.abs(first - last) < 1;

    if (mode === "gross") {
      LP.set("ndfl-main-title", "На руки в месяц");
      LP.set("ndfl-main", LP.rub(first));
      LP.set("ndfl-main-note", same ? "Налог " + LP.rub(rows[0].tax) + " в месяц — 13 %" : "С января. Позже — меньше, см. ниже");
    } else {
      LP.set("ndfl-main-title", "Начислить в месяц");
      LP.set("ndfl-main", LP.rub(Math.ceil(gross)));
      LP.set("ndfl-main-note", same ? "На руки " + LP.rub(first) + ", налог " + LP.rub(rows[0].tax) : "На руки в среднем " + LP.rub(yearNet / 12) + " — в начале года больше, в конце меньше");
    }
    LP.set("ndfl-year-tax", LP.rub(yearTax));
    LP.set("ndfl-year-note", "Доход за год " + LP.rub(yearGross) + ", на руки " + LP.rub(yearNet) + ". Средняя ставка — " + pct(yearGross > 0 ? (yearTax / yearGross) * 100 : 0));

    // Месяцы, когда меняется сумма на руки (переход на следующую ступень шкалы).
    var list = document.getElementById("ndfl-schedule");
    list.textContent = "";
    var changes = [];
    for (var m = 1; m < 12; m++) if (Math.abs(rows[m].net - rows[m - 1].net) >= 1) changes.push(m);
    var verdict = document.getElementById("ndfl-verdict");
    if (yearGross <= 0) {
      verdict.textContent = "Введите зарплату — посчитаем налог и сумму на руки.";
    } else if (!changes.length) {
      verdict.textContent = "Доход за год не больше 2,4 млн ₽ — весь год налог 13 %, сумма на руки не меняется.";
    } else {
      verdict.textContent = "Доход за год больше 2,4 млн ₽ — после перехода порога налог считается по более высокой ставке, и на руки приходит меньше.";
      var start = 0;
      var spans = [];
      changes.concat([12]).forEach(function (end) {
        spans.push([start, end - 1]);
        start = end;
      });
      // Месяц перехода (сумма «смешанная») показываем отдельной строкой.
      spans.forEach(function (sp) {
        var a = sp[0];
        var b = sp[1];
        var li = document.createElement("li");
        var bb = document.createElement("b");
        bb.textContent = a === b ? "В " + MONTHS_IN[a] : "С " + MONTHS_FROM[a] + " по " + MONTHS_TO[b];
        var s = document.createElement("span");
        s.textContent = "На руки " + LP.rub(rows[a].net) + ", налог " + LP.rub(rows[a].tax);
        li.appendChild(bb);
        li.appendChild(s);
        list.appendChild(li);
      });
    }
    document.getElementById("ndfl-schedule-box").hidden = !changes.length || yearGross <= 0;
  }

  LP.bind(form, update);
})();
