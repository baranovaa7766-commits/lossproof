// Кнопка «Распечатать или сохранить в PDF» на странице налогового календаря.
(function () {
  "use strict";
  var btn = document.getElementById("print-btn");
  if (btn) btn.addEventListener("click", function () {
    window.print();
  });
})();
