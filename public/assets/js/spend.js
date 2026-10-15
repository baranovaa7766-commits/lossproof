// Калькулятор «Сколько можно тратить в день до зарплаты» — на главной и на /skolko-mozhno-tratit/.
// Считается прямо в браузере: введённые цифры никуда не отправляются.
//
// Формула та же, что у «Можно тратить сегодня» в приложении, только без
// бюджета по категориям: (остаток − обязательные платежи) ÷ дни до зарплаты,
// с округлением вниз до рубля — лучше оставить запас, чем не дотянуть.
//
// Дни до зарплаты считаем от сегодняшней даты по числу месяца, как приложение:
// сегодня входит, день зарплаты — нет. Если день выплаты выходной или праздник,
// зарплату платят накануне, в последний рабочий день (ст. 136 ТК РФ).
// Если зарплата сегодня или уже была в этом месяце, считаем до следующей.

(function () {
  "use strict";

  var form = document.getElementById("spend-form");
  if (!form) return;

  var balance = document.getElementById("spend-balance");
  var fixed = document.getElementById("spend-fixed");
  var payday = document.getElementById("spend-payday");
  var okBox = document.getElementById("spend-ok");
  var shortBox = document.getElementById("spend-short");
  var perDay = document.getElementById("spend-per-day");
  var explain = document.getElementById("spend-explain");
  var gap = document.getElementById("spend-gap");

  var NBSP = " ";
  var MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  // Те же нерабочие праздники, что в приложении (shared/dates.ts).
  var HOLIDAYS = ["01-01", "01-02", "01-03", "01-04", "01-05", "01-06", "01-07", "01-08", "02-23", "03-08", "05-01", "05-09", "06-12", "11-04"];
  var DAY_MS = 86400000;

  /** «42 000», «42000,50», «9 500 ₽» → число; пусто или мусор → 0. */
  function parseNumber(text) {
    // \s в JavaScript ловит и неразрывные пробелы, которые ставит toLocaleString.
    var clean = String(text).replace(/[\s₽]/g, "").replace(",", ".");
    if (clean === "") return 0;
    var n = Number(clean);
    return isFinite(n) ? n : 0;
  }

  function rub(n) {
    return Math.round(n).toLocaleString("ru-RU").replace(/\s/g, NBSP) + NBSP + "₽";
  }

  function plural(n, one, few, many) {
    var mod10 = n % 10;
    var mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  }

  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function isDayOff(d) {
    var wd = d.getDay();
    return wd === 0 || wd === 6 || HOLIDAYS.indexOf(pad(d.getMonth() + 1) + "-" + pad(d.getDate())) !== -1;
  }

  /** День выплаты в месяце со сдвигом (0 — этот месяц): 31-е в ноябре — это 30-е, выходной — накануне. */
  function paydayIn(today, day, shift) {
    var y = today.getFullYear();
    var m = today.getMonth() + shift;
    var last = new Date(y, m + 1, 0).getDate();
    var d = new Date(y, m, Math.min(day, last));
    for (var i = 0; i < 20 && isDayOff(d); i++) d.setDate(d.getDate() - 1);
    return d;
  }

  /** Ближайшая зарплата позже сегодняшнего дня. */
  function nextPayday(today, day) {
    for (var shift = 0; shift < 3; shift++) {
      var d = paydayIn(today, day, shift);
      if (d > today) return d;
    }
    return paydayIn(today, day, 3);
  }

  /** Число месяца из поля: больше 31 — это 31; пусто или 0 — числа нет. */
  function payDay() {
    var n = Math.round(parseNumber(payday.value));
    return n < 1 ? 0 : Math.min(31, n);
  }

  function update() {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var b = Math.max(0, parseNumber(balance.value));
    var f = Math.max(0, parseNumber(fixed.value));
    var day = payDay();
    if (!day) {
      okBox.hidden = false;
      shortBox.hidden = true;
      perDay.textContent = "—";
      explain.textContent = "Укажите, какого числа приходит зарплата";
      return;
    }
    var pay = nextPayday(today, day);
    // Округляем: при переходе на летнее время в сутках бывает 23 или 25 часов.
    var d = Math.max(1, Math.round((pay - today) / DAY_MS));
    var free = b - f;
    var short = free < 0;

    okBox.hidden = short;
    shortBox.hidden = !short;
    perDay.textContent = rub(Math.floor(Math.max(0, free) / d));
    explain.textContent =
      "(" + rub(b) + " − " + rub(f) + ") ÷ " + d + NBSP + plural(d, "день", "дня", "дней") + " до" + NBSP + pay.getDate() + NBSP + MONTHS[pay.getMonth()];
    gap.textContent = rub(-free);
  }

  /** После ввода суммы показываем её с пробелами между разрядами: 42000 → 42 000. */
  function tidy(input) {
    if (input.value.trim() === "") return;
    var n = Math.max(0, parseNumber(input.value));
    input.value = n.toLocaleString("ru-RU", { maximumFractionDigits: 2 }).replace(/\s/g, " ");
  }

  form.addEventListener("input", update);
  form.addEventListener("submit", function (e) {
    e.preventDefault();
  });
  balance.addEventListener("change", function () {
    tidy(balance);
  });
  fixed.addEventListener("change", function () {
    tidy(fixed);
  });
  payday.addEventListener("change", function () {
    var day = payDay();
    if (day) payday.value = String(day);
    update();
  });

  update();
})();
