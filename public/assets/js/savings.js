// Калькулятор накоплений: подушка безопасности (за сколько накоплю) и своя
// цель (сколько откладывать в месяц, чтобы успеть к сроку).
//
// Проценты — ежемесячная капитализация: остаток × ставка / 12 раз в месяц,
// взнос в конце месяца. Реальный счёт может считать проценты чуть иначе.

(function () {
  "use strict";

  var form = document.getElementById("sav-form");
  if (!form || !window.LP) return;
  var LP = window.LP;

  var mode = LP.segmented(document.getElementById("sav-mode"), update);
  var months = LP.segmented(document.getElementById("sav-months"), update);

  var DATIVE = { январь: "январю", февраль: "февралю", март: "марту", апрель: "апрелю", май: "маю", июнь: "июню", июль: "июлю", август: "августу", сентябрь: "сентябрю", октябрь: "октябрю", ноябрь: "ноябрю", декабрь: "декабрю" };

  /** «к ноябрю 2027» — через n месяцев от текущего. */
  function byMonth(n) {
    return (
      "к " +
      LP.monthFromNow(n).replace(/^\S+/, function (m) {
        return DATIVE[m] || m;
      })
    );
  }

  /** Сколько месяцев копить до цели; null — не накопится за 100 лет. */
  function monthsToGoal(target, saved, monthly, r) {
    var s = saved;
    var n = 0;
    var interest = 0;
    while (s < target && n < 1200) {
      var i = s * r;
      interest += i;
      s += i + monthly;
      n++;
    }
    return s >= target ? { months: n, interest: interest } : null;
  }

  /** Сколько откладывать в месяц, чтобы за n месяцев набрать цель. */
  function monthlyFor(target, saved, n, r) {
    if (n <= 0) return Math.max(0, target - saved);
    var growth = Math.pow(1 + r, n);
    var need = target - saved * growth;
    if (need <= 0) return 0;
    return r === 0 ? need / n : (need * r) / (growth - 1);
  }

  function update() {
    var cushion = mode() === "cushion";
    document.getElementById("sav-cushion-fields").hidden = !cushion;
    document.getElementById("sav-goal-fields").hidden = cushion;
    document.getElementById("sav-cushion-result").hidden = !cushion;
    document.getElementById("sav-goal-result").hidden = cushion;

    var saved = Math.max(0, LP.num("sav-saved"));
    var r = Math.max(0, LP.num("sav-rate")) / 12 / 100;

    if (cushion) {
      var spend = Math.max(0, LP.num("sav-expenses"));
      var k = Number(months());
      var target = spend * k;
      var monthly = Math.max(0, LP.num("sav-monthly"));
      LP.set("sav-target", LP.rub(target));
      LP.set("sav-target-note", "расходы за " + k + LP.NBSP + LP.plural(k, "месяц", "месяца", "месяцев"));

      var res = target > 0 ? monthsToGoal(target, saved, monthly, r) : { months: 0, interest: 0 };
      var when = document.getElementById("sav-when");
      var whenNote = document.getElementById("sav-when-note");
      if (target <= 0) {
        when.textContent = "—";
        whenNote.textContent = "Укажите расходы в месяц";
      } else if (saved >= target) {
        when.textContent = "Уже накоплено";
        whenNote.textContent = "Подушка собрана — остальное можно направить на цели";
      } else if (!res) {
        when.textContent = "Не накопится";
        whenNote.textContent = "Укажите, сколько откладываете в месяц";
      } else {
        when.textContent = LP.duration(res.months);
        whenNote.textContent = byMonth(res.months) + (res.interest >= 1 ? ", из них проценты — " + LP.rub(res.interest) : "");
      }
      var year = monthlyFor(target, saved, 12, r);
      LP.set("sav-year", year > 0 ? "Чтобы собрать за год, откладывайте " + LP.rub(Math.ceil(year)) + " в месяц." : "");
    } else {
      var goal = Math.max(0, LP.num("goal-target"));
      var n = Math.round(Math.max(0, LP.num("goal-months")));
      var need = monthlyFor(goal, saved, n, r);
      LP.set("goal-monthly", LP.rub(Math.ceil(need)));
      var put = need * n;
      var interest = Math.max(0, goal - saved - put);
      LP.set(
        "goal-note",
        goal <= 0 || n <= 0
          ? "Укажите сумму и срок"
          : need <= 0
            ? "Уже накопленного хватит к сроку"
            : "За это время отложите ещё " + LP.rub(put) + (interest >= 1 ? ", проценты добавят " + LP.rub(interest) : "") + " — цель будет " + byMonth(n)
      );
    }
  }

  LP.bind(form, update);
})();
