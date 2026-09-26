// Калькулятор «Сколько можно тратить в день до зарплаты».
// Считается прямо в браузере: введённые цифры никуда не отправляются.
//
// Формула та же, что у «Можно тратить сегодня» в приложении, только без
// бюджета по категориям: (остаток − обязательные платежи) ÷ дни до зарплаты,
// с округлением вниз до рубля — лучше оставить запас, чем не дотянуть.

(function () {
  "use strict";

  var form = document.getElementById("spend-form");
  if (!form) return;

  var balance = document.getElementById("spend-balance");
  var fixed = document.getElementById("spend-fixed");
  var days = document.getElementById("spend-days");
  var okBox = document.getElementById("spend-ok");
  var shortBox = document.getElementById("spend-short");
  var perDay = document.getElementById("spend-per-day");
  var explain = document.getElementById("spend-explain");
  var gap = document.getElementById("spend-gap");

  var NBSP = " ";

  /** «42 000», «42000,50», «9 500 ₽» → число; пусто или мусор → 0. */
  function parseNumber(text) {
    var clean = String(text).replace(/[\s  ₽]/g, "").replace(",", ".");
    if (clean === "") return 0;
    var n = Number(clean);
    return isFinite(n) ? n : 0;
  }

  function rub(n) {
    return Math.round(n).toLocaleString("ru-RU").replace(/ /g, NBSP) + NBSP + "₽";
  }

  function plural(n, one, few, many) {
    var mod10 = n % 10;
    var mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  }

  function update() {
    var b = Math.max(0, parseNumber(balance.value));
    var f = Math.max(0, parseNumber(fixed.value));
    var d = Math.max(1, Math.round(parseNumber(days.value)) || 1);
    var free = b - f;
    var short = free < 0;

    okBox.hidden = short;
    shortBox.hidden = !short;
    perDay.textContent = rub(Math.floor(Math.max(0, free) / d));
    explain.textContent = "(" + rub(b) + " − " + rub(f) + ") ÷ " + d + NBSP + plural(d, "день", "дня", "дней");
    gap.textContent = rub(-free);
  }

  /** После ввода суммы показываем её с пробелами между разрядами: 42000 → 42 000. */
  function tidy(input, integer) {
    if (input.value.trim() === "") return;
    var n = Math.max(0, parseNumber(input.value));
    input.value = n.toLocaleString("ru-RU", { maximumFractionDigits: integer ? 0 : 2 }).replace(/ /g, " ").replace(/ /g, " ");
  }

  form.addEventListener("input", update);
  form.addEventListener("submit", function (e) {
    e.preventDefault();
  });
  balance.addEventListener("change", function () {
    tidy(balance, false);
  });
  fixed.addEventListener("change", function () {
    tidy(fixed, false);
  });
  days.addEventListener("change", function () {
    tidy(days, true);
    update();
  });

  update();
})();
