// Лёгкая scroll-reveal анимация без сторонних библиотек: карточки и блоки
// плавно проявляются (fade + сдвиг вверх), когда попадают в область
// просмотра, вместо того чтобы просто мгновенно быть видны сразу при
// загрузке страницы. Работает через IntersectionObserver.
//
// Уважает prefers-reduced-motion — если пользователь просил не показывать
// анимации, класс .reveal вообще не добавляется, и элементы остаются в
// обычном, сразу видимом состоянии.
//
// Классы .reveal/.reveal-in снимаются сразу после завершения перехода —
// иначе они бы конфликтовали с transition, который уже задан у некоторых
// целевых элементов на hover (например .hub-card), см. style.css.
(function () {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;

  var els = document.querySelectorAll(".card, .hub-card, .cmp-card, .firm-card, .advantage-item, .calculator-card");
  if (!els.length) return;

  function clear(el) {
    el.classList.remove("reveal", "reveal-in");
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add("reveal-in");
        observer.unobserve(el);
        el.addEventListener("transitionend", function () {
          clear(el);
        }, { once: true });
        // На случай, если transitionend не придёт (элемент скрылся и т.п.)
        setTimeout(function () {
          clear(el);
        }, 900);
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
  );

  els.forEach(function (el) {
    el.classList.add("reveal");
    observer.observe(el);
  });
})();
