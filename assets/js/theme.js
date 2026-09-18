// Переключатель светлой/тёмной темы. Сама тема хранится в localStorage и
// применяется как атрибут data-theme на <html>. Раннее применение (до
// отрисовки) делает отдельный инлайн-скрипт в <head> каждой страницы —
// здесь только сам переключатель и синхронизация иконки кнопки.
(function () {
  var STORAGE_KEY = "lp-theme";

  function current() {
    try {
      return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
    } catch (e) {
      return "light";
    }
  }

  function apply(theme) {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  function updateButton(theme) {
    var btn = document.querySelector(".theme-toggle");
    if (btn) btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
  }

  function toggle() {
    var next = current() === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (e) {}
    apply(next);
    updateButton(next);
  }

  updateButton(current());
  var btn = document.querySelector(".theme-toggle");
  if (btn) btn.addEventListener("click", toggle);
})();
