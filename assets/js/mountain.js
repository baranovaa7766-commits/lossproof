// Canvas-иллюстрация «Alpenglow» для hero на главной: закатное небо, тёплое
// свечение справа от центра, четыре слоя горных хребтов (фрактальная линия
// через midpoint displacement — детерминированная, без Math.random, чтобы
// картинка была одинаковой при каждой загрузке), звёзды, лёгкое зерно.
//
// Рисуется через Canvas, а не хранится как SVG/раст, по двум причинам:
// 1) реальный масштабируемый рисунок, а не фон, который CSS
//    background-size:cover обрезает при несовпадении пропорций (см. баг с
//    прошлой версией гор — обрезало пики на широких экранах);
// 2) сам хребет — сгенерированная, а не вручную нарисованная форма.
(function () {
  function initMountainScene(canvasId) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var wrap = canvas.parentElement;

    function mulberry32(seed) {
      return function () {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    function ridgeLine(width, baseY, amplitude, seed) {
      var rand = mulberry32(seed);
      var points = [0, 1];
      var heights = { 0: baseY - rand() * amplitude, 1: baseY - rand() * amplitude };
      var segments = 8;
      for (var iter = 0; iter < segments; iter++) {
        var newPoints = [];
        for (var i = 0; i < points.length - 1; i++) {
          var a = points[i],
            b = points[i + 1];
          var mid = (a + b) / 2;
          var avg = (heights[a] + heights[b]) / 2;
          var displaced = avg + (rand() - 0.5) * amplitude * Math.pow(0.62, iter);
          heights[mid] = Math.min(baseY, displaced);
          newPoints.push(a, mid);
        }
        newPoints.push(points[points.length - 1]);
        points = newPoints;
      }
      return points.map(function (p) {
        return { x: p * width, y: heights[p] };
      });
    }

    function draw() {
      var w = wrap.clientWidth;
      var h = wrap.clientHeight;
      if (!w || !h) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      var sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, "#0a1220");
      sky.addColorStop(0.45, "#121e33");
      sky.addColorStop(0.72, "#2a2f3f");
      sky.addColorStop(1, "#3d3226");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      var glowX = w * 0.66,
        glowY = h * 0.74;
      var glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, w * 0.42);
      glow.addColorStop(0, "rgba(232,163,91,0.55)");
      glow.addColorStop(0.4, "rgba(214,120,74,0.22)");
      glow.addColorStop(1, "rgba(214,120,74,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      var starRand = mulberry32(42);
      ctx.fillStyle = "rgba(245,240,230,0.55)";
      for (var s = 0; s < 40; s++) {
        var sx = starRand() * w;
        var sy = starRand() * h * 0.38;
        var r = starRand() * 1.1 + 0.2;
        ctx.globalAlpha = 0.25 + starRand() * 0.5;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      var layers = [
        { baseY: h * 0.56, amp: h * 0.16, seed: 11, fill: "#243349", rim: null },
        { baseY: h * 0.66, amp: h * 0.18, seed: 27, fill: "#1c2537", rim: "rgba(232,178,120,0.35)" },
        { baseY: h * 0.78, amp: h * 0.2, seed: 53, fill: "#151b28", rim: "rgba(232,163,91,0.4)" },
        { baseY: h * 0.92, amp: h * 0.22, seed: 91, fill: "#0c0f16", rim: "rgba(220,140,80,0.28)" },
      ];

      layers.forEach(function (layer) {
        var pts = ridgeLine(w, layer.baseY, layer.amp, layer.seed);
        ctx.beginPath();
        ctx.moveTo(0, h);
        pts.forEach(function (p) {
          ctx.lineTo(p.x, p.y);
        });
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = layer.fill;
        ctx.fill();
        if (layer.rim) {
          ctx.beginPath();
          pts.forEach(function (p, i) {
            i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
          });
          ctx.strokeStyle = layer.rim;
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
      });

      var grainRand = mulberry32(7);
      ctx.globalAlpha = 0.035;
      ctx.fillStyle = "#ffffff";
      for (var g = 0; g < 900; g++) {
        ctx.fillRect(grainRand() * w, grainRand() * h, 1, 1);
      }
      ctx.globalAlpha = 1;
    }

    draw();
    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(draw, 120);
    });
  }

  window.initMountainScene = initMountainScene;
})();
