// Макет экрана «Сегодня» на главной: даты в нём — от сегодняшнего дня, как в
// приложении («воскресенье, 25 октября»), чтобы макет не устаревал.
// Элемент с data-mock-day="N" получает дату через N дней от сегодня,
// с data-weekday — ещё и день недели. Без JavaScript остаются даты из разметки.

(function () {
  "use strict";

  var WEEKDAYS = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];
  var MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

  var now = new Date();
  var items = document.querySelectorAll("[data-mock-day]");
  for (var i = 0; i < items.length; i++) {
    var el = items[i];
    var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + Number(el.getAttribute("data-mock-day")));
    var text = d.getDate() + " " + MONTHS[d.getMonth()];
    el.textContent = el.hasAttribute("data-weekday") ? WEEKDAYS[d.getDay()] + ", " + text : text;
  }
})();
