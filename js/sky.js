/* Star field behind every page.
   Stars get colours from a rough O→M temperature sequence, sizes from a
   steep power law (most are faint), and a few twinkle slowly. With
   prefers-reduced-motion the field is drawn once and never animates.
   The page reads fine without this script. */
(function () {
  var canvas = document.getElementById("sky");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Hot to cool: blue-white, white, yellow-white, yellow, orange.
  var COLORS = ["#aac4ff", "#d6e2ff", "#ffffff", "#fff4e0", "#ffe2b8", "#ffc79a"];
  var WEIGHTS = [0.08, 0.18, 0.32, 0.22, 0.13, 0.07];

  // Seeded RNG so the sky looks the same on every visit and resize.
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pickColor(r) {
    var x = r(), acc = 0;
    for (var i = 0; i < WEIGHTS.length; i++) { acc += WEIGHTS[i]; if (x < acc) return COLORS[i]; }
    return COLORS[2];
  }

  var stars = [], w = 0, h = 0, dpr = 1;
  var MEASURE = 52 * 17;            // --measure in px (52rem at 17px)

  // 1 in the margins, ~0.3 under the text column, soft 80px edge between.
  function veil(x) {
    var half = Math.min(MEASURE, w) / 2;
    var d = Math.abs(x - w / 2) - half;
    if (d >= 80) return 1;
    if (d <= 0) return 0.3;
    return 0.3 + 0.7 * (d / 80);
  }

  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var r = rng(20171101);
    var n = Math.round((w * h) / 5200);
    stars = [];
    for (var i = 0; i < n; i++) {
      var m = Math.pow(r(), 6);              // most stars faint
      stars.push({
        x: r() * w, y: r() * h,
        size: 0.35 + m * 1.6,
        base: 0,
        color: pickColor(r),
        tw: r() < 0.22 ? 0.4 + r() * 1.4 : 0,  // twinkle speed, 0 = steady
        ph: r() * Math.PI * 2
      });
      var s = stars[stars.length - 1];
      s.base = (0.25 + m * 0.65 + r() * 0.15) * veil(s.x);
    }
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var a = s.base;
      if (s.tw && !still) a *= 0.7 + 0.3 * Math.sin(t * 0.001 * s.tw + s.ph);
      ctx.globalAlpha = Math.max(0, Math.min(1, a));
      ctx.fillStyle = s.color;
      if (s.size > 1.25) {
        // Bright stars get a soft halo.
        var g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 4);
        g.addColorStop(0, s.color); g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalAlpha = a * 0.25; ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.size * 4, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = a; ctx.fillStyle = s.color;
      }
      ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var last = 0, raf = 0;
  function loop(t) {
    raf = requestAnimationFrame(loop);
    if (t - last < 66) return;                // ~15 fps is plenty for a twinkle
    last = t; draw(t);
  }

  build(); draw(0);
  if (!still) raf = requestAnimationFrame(loop);

  var pending;
  window.addEventListener("resize", function () {
    clearTimeout(pending);
    pending = setTimeout(function () { build(); draw(performance.now()); }, 150);
  });
  document.addEventListener("visibilitychange", function () {
    if (still) return;
    if (document.hidden) cancelAnimationFrame(raf);
    else raf = requestAnimationFrame(loop);
  });
})();
