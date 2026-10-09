// Калькулятор кредитной карты: вернуть без процентов (сколько откладывать в
// день до конца льготного периода) или гасить частями (срок и переплата).
//
// Дату конца льготного периода и сумму платежа без процентов человек берёт из
// приложения банка: правила у банков разные, и сами мы их не вычисляем. Проценты считаем помесячно:
// остаток × ставка / 12. Банк считает по дням, его цифры могут немного отличаться.

(function () {
  "use strict";

  var form = document.getElementById("card-form");
  if (!form || !window.LP) return;
  var LP = window.LP;

  var MONTHS_GEN = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  var DAY_MS = 24 * 60 * 60 * 1000;

  var mode = LP.segmented(document.getElementById("card-mode"), update);
  var dateInput = document.getElementById("card-date");

  function today() {
    var d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function iso(d) {
    function pad(n) {
      return n < 10 ? "0" + n : String(n);
    }
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  /** Значение поля даты → полночь по местному времени; пусто или мусор → null. */
  function parseDate(value) {
    var p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    return p ? new Date(Number(p[1]), Number(p[2]) - 1, Number(p[3])) : null;
  }

  /** «3 ноября»; год добавляем, только если он не текущий. */
  function human(d) {
    var text = d.getDate() + LP.NBSP + MONTHS_GEN[d.getMonth()];
    return d.getFullYear() === today().getFullYear() ? text : text + " " + d.getFullYear();
  }

  function annuity(balance, r, months) {
    if (r === 0) return balance / months;
    return (balance * r) / (1 - Math.pow(1 + r, -months));
  }

  /** Погашение одинаковым платежом. null — долг не закрывается и за 100 лет. */
  function simulate(balance, r, payment) {
    var months = 0;
    var interest = 0;
    while (balance > 0.005 && months < 1200) {
      var i = balance * r;
      if (payment <= i) return null;
      interest += i;
      balance -= Math.min(balance, payment - i);
      months++;
    }
    return balance > 0.005 ? null : { months: months, interest: interest };
  }

  /** Прибавка к платежу для сравнения: доля платежа, кратно 500 ₽. */
  function step(payment, share) {
    return Math.max(500, Math.round((payment * share) / 500) * 500);
  }

  // По умолчанию — через 25 дней: столько банки обычно дают на оплату после выписки.
  var start = today();
  dateInput.min = iso(start);
  if (!dateInput.value) dateInput.value = iso(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 25));

  var box = {
    empty: document.getElementById("card-empty"),
    full: document.getElementById("card-full-result"),
    parts: document.getElementById("card-parts-result"),
    fullVerdict: document.getElementById("card-full-verdict"),
    termBlock: document.getElementById("card-term-block"),
    stuck: document.getElementById("card-stuck"),
    compare: document.getElementById("card-compare"),
    partsVerdict: document.getElementById("card-parts-verdict"),
  };

  function showFull(debt, monthInterest) {
    var due = parseDate(dateInput.value);
    var days = due ? Math.round((due - today()) / DAY_MS) : null;
    var title = "Откладывайте в день";
    var value = "—";
    var note;

    if (days === null) {
      note = "Укажите, когда заканчивается льготный период.";
    } else if (days < 0) {
      title = "Срок уже прошёл";
      note = "Посмотрите в приложении банка новую дату и сумму платежа.";
    } else if (days === 0) {
      title = "Внесите сегодня";
      value = LP.rub(debt);
      note = "Льготный период заканчивается сегодня.";
    } else {
      value = LP.rub(Math.ceil(debt / days));
      note = "До " + human(due) + " — " + days + LP.NBSP + LP.plural(days, "день", "дня", "дней") + ". К сроку наберётся вся сумма: " + LP.rub(debt) + ".";
    }
    LP.set("card-day-title", title);
    LP.set("card-day", value);
    LP.set("card-day-note", note);

    box.fullVerdict.hidden = days === null || days < 0;
    if (!box.fullVerdict.hidden) {
      box.fullVerdict.textContent =
        "Вернёте эту сумму " +
        (days === 0 ? "сегодня" : "до " + human(due)) +
        " — банк не начислит проценты." +
        (monthInterest >= 1 ? " Иначе это около " + LP.rub(monthInterest) + " за каждый месяц." : "");
    }
  }

  function showOption(key, debt, r, payment, extra, base) {
    var opt = simulate(debt, r, payment + extra);
    var faster = base.months - opt.months;
    LP.set("card-" + key + "-title", "Добавить " + LP.rub(extra));
    LP.set("card-" + key + "-term", LP.duration(opt.months));
    LP.set("card-" + key + "-faster", faster > 0 ? "на " + LP.duration(faster) + " быстрее" : "срок тот же");
    LP.set("card-" + key + "-pay", LP.rub(payment + extra));
    LP.set("card-" + key + "-interest", LP.rub(opt.interest));
    // Из округлённых сумм: на экране переплата и экономия должны сходиться до рубля.
    LP.set("card-" + key + "-save", LP.rub(Math.round(base.interest) - Math.round(opt.interest)));
  }

  function showParts(debt, r, monthInterest) {
    var payment = Math.max(0, LP.num("card-pay"));
    var base = payment > 0 ? simulate(debt, r, payment) : null;
    var yearPay = Math.ceil(annuity(debt, r, 12));
    var year = simulate(debt, r, yearPay);
    var inYear = "Чтобы закрыть карту за год, вносите " + LP.rub(yearPay) + " в месяц" + (year.interest >= 1 ? " — переплата будет " + LP.rub(year.interest) + "." : ".");

    box.termBlock.hidden = payment > 0 && !base;
    box.stuck.hidden = !(payment > 0 && !base);
    box.compare.hidden = !base || base.months <= 1;
    box.partsVerdict.hidden = false;

    if (payment <= 0) {
      LP.set("card-term", "—");
      LP.set("card-term-note", "Укажите, сколько вносите в месяц.");
      box.partsVerdict.textContent = inYear;
      return;
    }
    if (!base) {
      box.stuck.textContent =
        payment <= monthInterest
          ? "Платёж " + LP.rub(payment) + " не покрывает проценты: за месяц банк начисляет " + LP.rub(monthInterest) + ". Долг не уменьшается."
          : "Платёж " + LP.rub(payment) + " почти целиком уходит на проценты: за месяц банк начисляет " + LP.rub(monthInterest) + ".";
      box.partsVerdict.textContent = inYear;
      return;
    }

    LP.set("card-term", LP.duration(base.months));
    LP.set("card-term-note", base.interest >= 1 ? "Переплата по процентам — " + LP.rub(base.interest) + ". Всего вернёте " + LP.rub(debt + Math.round(base.interest)) + "." : "Без переплаты.");

    if (!box.compare.hidden) {
      var a = step(payment, 0.2);
      var b = Math.max(a + 500, step(payment, 0.5));
      showOption("a", debt, r, payment, a, base);
      showOption("b", debt, r, payment, b, base);
    }

    if (base.months > 12) {
      box.partsVerdict.textContent = inYear;
    } else if (monthInterest >= 1) {
      box.partsVerdict.textContent = "За первый месяц банк начислит " + LP.rub(monthInterest) + " процентов — остальное из платежа уменьшает долг.";
    } else {
      box.partsVerdict.hidden = true;
    }
  }

  function update() {
    var full = mode() === "full";
    document.getElementById("card-date-field").hidden = !full;
    document.getElementById("card-pay-field").hidden = full;
    // Без процентов возвращают сумму, которую назвал банк: у карт с выпиской она меньше всего долга.
    LP.set("card-debt-label", full ? "Сколько вернуть, ₽" : "Долг по карте, ₽");
    LP.set("card-debt-hint", full ? "Сумма платежа без процентов — в приложении банка" : "Весь долг по карте — видно в приложении банка");

    var debt = Math.max(0, LP.num("card-debt"));
    var r = Math.max(0, LP.num("card-rate")) / 12 / 100;
    var ready = debt > 0;
    box.empty.hidden = ready;
    box.full.hidden = !ready || !full;
    box.parts.hidden = !ready || full;
    if (!ready) return;

    if (full) showFull(debt, debt * r);
    else showParts(debt, r, debt * r);
  }

  LP.bind(form, update);
})();
