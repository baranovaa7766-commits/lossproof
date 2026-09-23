// Яндекс.Метрика (счётчик 112817440), подключается на всех страницах одним файлом.
// Только базовая статистика: без Вебвизора и карты кликов. На localhost не
// работает, чтобы разработка и проверки не попадали в статистику.
//
// Цель (нужно один раз создать в Метрике: Настройки → Цели → «JavaScript-событие»):
//   calc_submit — пользователь запустил расчёт в калькуляторе.
(function () {
  var COUNTER_ID = 112817440;
  var host = location.hostname;
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return;

  (function (m, e, t, r, i, k, a) {
    m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
    m[i].l = 1 * new Date();
    for (var j = 0; j < document.scripts.length; j++) {
      if (document.scripts[j].src === r) return;
    }
    k = e.createElement(t);
    a = e.getElementsByTagName(t)[0];
    k.async = 1;
    k.src = r;
    a.parentNode.insertBefore(k, a);
  })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

  ym(COUNTER_ID, "init", { trackLinks: true, accurateTrackBounce: true });

  document.addEventListener("submit", function (e) {
    if (e.target && e.target.classList && e.target.classList.contains("calc-form")) {
      ym(COUNTER_ID, "reachGoal", "calc_submit");
    }
  });
})();
