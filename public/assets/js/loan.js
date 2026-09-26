// Калькулятор досрочного погашения кредита: что выгоднее — сократить срок
// или уменьшить платёж, и сколько это сэкономит на процентах.
//
// Считаем аннуитетный кредит помесячно: проценты за месяц = остаток × ставка / 12.
// Банк начисляет проценты по дням, поэтому его цифры могут немного отличаться.

(function () {
  "use strict";

  var form = document.getElementById("loan-form");
  if (!form || !window.LP) return;
  var LP = window.LP;

  function annuity(balance, r, months) {
    if (months <= 0) return balance;
    if (r === 0) return balance / months;
    return (balance * r) / (1 - Math.pow(1 + r, -months));
  }

  /**
   * Погашение по месяцам. mode 'term' — платёж прежний, срок короче;
   * 'payment' — срок прежний, после каждого досрочного взноса платёж пересчитывается.
   * Возвращает null, если платёж не покрывает даже проценты.
   */
  function simulate(balance, r, payment, monthly, mode, termMonths) {
    var months = 0;
    var interest = 0;
    var pay = payment;
    while (balance > 0.01 && months < 1200) {
      var i = balance * r;
      var principal = Math.min(balance, pay - i);
      if (principal <= 0) return null;
      interest += i;
      balance -= principal;
      months++;
      if (monthly > 0 && balance > 0.01) {
        balance -= Math.min(monthly, balance);
        if (mode === "payment" && balance > 0.01) pay = annuity(balance, r, Math.max(1, termMonths - months));
      }
    }
    return { months: months, interest: interest };
  }

  var box = {
    empty: document.getElementById("loan-empty"),
    result: document.getElementById("loan-result"),
    closed: document.getElementById("loan-closed"),
    compare: document.getElementById("loan-compare"),
  };

  function update() {
    var B = Math.max(0, LP.num("loan-balance"));
    var rate = Math.max(0, LP.num("loan-rate"));
    var N = Math.round(Math.max(0, LP.num("loan-months")));
    var E = Math.max(0, LP.num("loan-extra"));
    var M = Math.max(0, LP.num("loan-monthly"));
    var r = rate / 12 / 100;

    var ready = B > 0 && N > 0;
    box.empty.hidden = ready;
    box.result.hidden = !ready;
    if (!ready) return;

    var P0 = annuity(B, r, N);
    var base = simulate(B, r, P0, 0, "term", N);
    LP.set("loan-payment", LP.rub(P0));
    LP.set("loan-overpay", LP.rub(base.interest));

    if (E >= B) {
      box.closed.hidden = false;
      box.compare.hidden = true;
      LP.set("loan-closed-save", LP.rub(base.interest));
      return;
    }
    box.closed.hidden = true;
    box.compare.hidden = false;

    var rest = B - E;
    var term = simulate(rest, r, P0, M, "term", N);
    var P2 = annuity(rest, r, N);
    var pay = simulate(rest, r, P2, M, "payment", N);

    var saveTerm = base.interest - term.interest;
    var savePay = base.interest - pay.interest;

    LP.set("loan-term-save", LP.rub(saveTerm));
    LP.set("loan-term-months", LP.duration(term.months) + (term.months < N ? " (на " + LP.duration(N - term.months) + " меньше)" : ""));
    LP.set("loan-term-pay", LP.rub(P0));
    LP.set("loan-term-interest", LP.rub(term.interest));

    LP.set("loan-pay-save", LP.rub(savePay));
    LP.set("loan-pay-months", LP.duration(pay.months));
    LP.set("loan-pay-pay", LP.rub(P2) + (P2 < P0 ? " (на " + LP.rub(P0 - P2) + " меньше)" : ""));
    LP.set("loan-pay-interest", LP.rub(pay.interest));

    var diff = saveTerm - savePay;
    var verdict;
    if (E === 0 && M === 0) {
      verdict = "Укажите сумму досрочного платежа — покажем, сколько он сэкономит.";
    } else if (diff > 1) {
      verdict = "Выгоднее сократить срок: сэкономите на " + LP.rub(diff) + " больше. Уменьшать платёж стоит, если важнее свободные деньги каждый месяц.";
    } else {
      verdict = "Оба варианта дают почти одинаковую экономию.";
    }
    LP.set("loan-verdict", verdict);

    document.getElementById("loan-opt-term").classList.toggle("is-best", diff > 1);
  }

  LP.bind(form, update);
})();
