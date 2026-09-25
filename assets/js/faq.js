// Вопросы на телефоне: открыт только первый ответ, остальные раскрываются
// по нажатию — так страница короче. На компьютере открыты все.
// Без JavaScript все ответы просто открыты.

(function () {
  "use strict";

  if (!window.matchMedia("(max-width: 600px)").matches) return;
  var items = document.querySelectorAll(".faq-item");
  for (var i = 1; i < items.length; i++) items[i].open = false;
})();
