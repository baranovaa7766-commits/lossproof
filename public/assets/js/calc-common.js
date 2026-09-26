// Общее для калькуляторов: разбор чисел, суммы в рублях, склонения, сроки.
// Всё считается в браузере: введённые цифры никуда не отправляются.

(function () {
  "use strict";

  var NBSP = " ";
  var MONTHS = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];

  /** «42 000», «42000,50», «9 500 ₽», «18,5 %» → число; пусто или мусор → 0. */
  function parseNumber(text) {
    // \s в JavaScript ловит и неразрывные пробелы, которые ставит toLocaleString.
    var clean = String(text).replace(/[\s₽%]/g, "").replace(",", ".");
    if (clean === "") return 0;
    var n = Number(clean);
    return isFinite(n) ? n : 0;
  }

  function group(n, digits) {
    return n.toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: digits || 0 }).replace(/\s/g, NBSP);
  }

  function rub(n) {
    return group(Math.round(n)) + NBSP + "₽";
  }

  function plural(n, one, few, many) {
    var mod10 = n % 10;
    var mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  }

  /** 27 → «2 года 3 месяца». */
  function duration(months) {
    var y = Math.floor(months / 12);
    var m = months % 12;
    var parts = [];
    if (y) parts.push(y + NBSP + plural(y, "год", "года", "лет"));
    if (m || !y) parts.push(m + NBSP + plural(m, "месяц", "месяца", "месяцев"));
    return parts.join(" ");
  }

  /** Месяц и год через n месяцев от текущего: «ноябрь 2027». */
  function monthFromNow(n) {
    var d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + n);
    return MONTHS[d.getMonth()] + " " + d.getFullYear();
  }

  /** После ввода показываем сумму с пробелами между разрядами: 42000 → 42 000. */
  function tidy(input) {
    if (input.value.trim() === "") return;
    var digits = input.hasAttribute("data-decimal") ? 2 : 0;
    input.value = group(Math.max(0, parseNumber(input.value)), digits);
  }

  /** Подключает форму: пересчёт при вводе, красивые числа после ввода, без отправки. */
  function bind(form, update) {
    form.addEventListener("input", update);
    form.addEventListener("change", function (e) {
      var t = e.target;
      if (t.tagName === "INPUT" && t.getAttribute("inputmode")) {
        tidy(t);
        update();
      }
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
    });
    update();
  }

  /** Переключатель из кнопок (aria-pressed): возвращает текущее значение через getter. */
  function segmented(root, onChange) {
    var buttons = root.querySelectorAll("button[data-value]");
    var value = root.querySelector('button[aria-pressed="true"]');
    value = value ? value.getAttribute("data-value") : buttons[0].getAttribute("data-value");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener("click", function () {
        for (var j = 0; j < buttons.length; j++) buttons[j].setAttribute("aria-pressed", String(buttons[j] === this));
        value = this.getAttribute("data-value");
        onChange(value);
      });
    }
    return function () {
      return value;
    };
  }

  window.LP = {
    NBSP: NBSP,
    parseNumber: parseNumber,
    group: group,
    rub: rub,
    plural: plural,
    duration: duration,
    monthFromNow: monthFromNow,
    bind: bind,
    segmented: segmented,
    num: function (id) {
      return parseNumber(document.getElementById(id).value);
    },
    set: function (id, text) {
      document.getElementById(id).textContent = text;
    },
  };
})();
