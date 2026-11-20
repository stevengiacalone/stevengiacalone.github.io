/* Rossiter–McLaughlin and Doppler shadow explainer for /research/obliquities/.
   Three linked canvases: the sky view of a companion crossing a rotating star,
   the radial-velocity anomaly it causes, and the "Doppler shadow" it leaves in
   the star's line profile. Buttons set the sky-projected obliquity (lambda).

   Model (deliberately simple, qualitatively right):
   - Star of unit radius, linear limb darkening (u = 0.6).
   - Companion of radius RP moves left to right along y = B.
   - Surface velocity under the companion: v = x cos(lambda) - y sin(lambda),
     in units of v sin i; negative = toward us (blueshift).
   - Blocking light at velocity v shifts the measured velocity by -f * I * v.
   - The Doppler shadow is the local line removed at v from the
     disk-integrated, rotationally broadened absorption line.
   With prefers-reduced-motion the transit is drawn complete and never animates. */
(function () {
  var sky = document.getElementById("rm-sky");
  var rv = document.getElementById("rm-rv");
  var sh = document.getElementById("rm-shadow");
  if (!sky || !rv || !sh || !sky.getContext) return;

  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var css = getComputedStyle(document.documentElement);
  var C = {
    ink: css.getPropertyValue("--ink").trim() || "#ecebe8",
    soft: css.getPropertyValue("--ink-soft").trim() || "#b3b1ad",
    faint: css.getPropertyValue("--ink-faint").trim() || "#85847f",
    rule: css.getPropertyValue("--rule").trim() || "#2c2d31",
    card: css.getPropertyValue("--card").trim() || "#17181c",
    accent: css.getPropertyValue("--accent").trim() || "#f29a6b",
    blue: [86, 140, 255],
    red: [255, 92, 72]
  };
  var SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  var RP = 0.13, B = 0.3, U = 0.6, X0 = -1.45, X1 = 1.45;
  var N = 220;                       // time steps across the transit
  var DURATION = 6500, HOLD = 1400;  // ms
  var lam = 0;                       // degrees
  var steps = [];                    // per-time-step model values
  var maxA = 1;

  function intensity(d) {
    var mu = Math.sqrt(Math.max(0, 1 - d * d));
    return 1 - U * (1 - mu);
  }
  // Fraction of the companion's disk that overlaps the star (smooth ingress/egress).
  function overlap(d) {
    if (d >= 1 + RP) return 0;
    if (d <= 1 - RP) return 1;
    var s = (1 + RP - d) / (2 * RP);
    return s * s * (3 - 2 * s);
  }

  function compute() {
    var L = lam * Math.PI / 180, cl = Math.cos(L), sl = Math.sin(L);
    steps = []; maxA = 0;
    for (var i = 0; i < N; i++) {
      var x = X0 + (X1 - X0) * i / (N - 1);
      var d = Math.sqrt(x * x + B * B);
      var f = overlap(d);
      var I = f > 0 ? intensity(Math.min(d, 0.999)) : 0;
      var v = x * cl - B * sl;
      var depth = f * I;
      var A = -depth * v;
      steps.push({ x: x, f: f, v: v, depth: depth, A: A });
    }
    // Fixed scale so the four orientations compare fairly.
    maxA = 0.95;
  }

  // --- canvas sizing ----------------------------------------------------
  var ctxs = {};
  function fit(cv) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return null;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    }
    var c = cv.getContext("2d");
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { c: c, w: w, h: h };
  }

  function rgba(rgb, a) { return "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + a + ")"; }

  // --- sky view ---------------------------------------------------------
  function drawSky(k) {
    var g = fit(sky); if (!g) return;
    var c = g.c, w = g.w, h = g.h;
    c.clearRect(0, 0, w, h);
    var R = Math.min(w, h) * 0.30, cx = w / 2, cy = h / 2 + 4;
    var L = lam * Math.PI / 180;

    // Rotation-shaded stellar disk, computed pixel by pixel so the colour
    // follows the projected velocity field exactly. Cached per size and angle.
    var dpr = sky.width / w, key = lam + ":" + Math.round(R * dpr);
    if (diskKey !== key) { diskImg = shadeDisk(R * dpr, L); diskKey = key; }
    c.save(); c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.clip();
    c.drawImage(diskImg, cx - R, cy - R, 2 * R, 2 * R);
    c.restore();
    drawSkyOverlay(c, w, h, R, cx, cy, L, k);
  }
  var diskImg = null, diskKey = "";
  function shadeDisk(R, L) {
    var img = new ImageData(Math.ceil(2 * R), Math.ceil(2 * R));
    var cl = Math.cos(L), sl = Math.sin(L), W = img.width;
    for (var py = 0; py < W; py++) {
      for (var px = 0; px < W; px++) {
        var x = (px + 0.5 - R) / R, y = -(py + 0.5 - R) / R;
        var r2 = x * x + y * y;
        if (r2 > 1) continue;
        var I = intensity(Math.sqrt(r2));
        var v = x * cl - y * sl;                    // -1 (toward us) .. +1 (away)
        var col = v < 0 ? C.blue : C.red;
        var m = Math.min(1, 1.15 * Math.pow(Math.abs(v), 0.6));   // colour strength
        var base = 240 * I;
        var o = (py * W + px) * 4;
        img.data[o]     = base * (1 - m) + col[0] * m * I;
        img.data[o + 1] = base * (1 - m) + col[1] * m * I;
        img.data[o + 2] = base * (1 - m) + col[2] * m * I;
        img.data[o + 3] = 255;
      }
    }
    var tmp = document.createElement("canvas"); tmp.width = W; tmp.height = W;
    tmp.getContext("2d").putImageData(img, 0, 0);
    return tmp;
  }
  function drawSkyOverlay(c, w, h, R, cx, cy, L, k) {

    // Spin axis: perpendicular to the velocity gradient, through the centre.
    var ax = Math.sin(L), ay = Math.cos(L);         // math coords (y up)
    var a1x = cx - ax * R * 1.28, a1y = cy + ay * R * 1.28;
    var a2x = cx + ax * R * 1.28, a2y = cy - ay * R * 1.28;
    c.strokeStyle = C.ink; c.lineWidth = 1.4; c.setLineDash([4, 4]);
    c.beginPath(); c.moveTo(a1x, a1y); c.lineTo(a2x, a2y); c.stroke();
    c.setLineDash([]);
    arrowHead(c, a1x, a1y, a2x, a2y, C.ink);
    c.font = "11px " + SANS; c.fillStyle = C.soft;
    var lw = c.measureText("spin axis").width;
    var lx = Math.min(Math.max(a2x + 6, 4), w - lw - 4), ly = Math.min(Math.max(a2y + 4, 12), h - 4);
    if (Math.abs(ax) > 0.7) {                    // near-horizontal axis: label just below its tip
      lx = w - lw - 4; ly = Math.min(a2y + 18, h - 30);
    }
    c.textAlign = "left"; c.fillText("spin axis", lx, ly);

    // Orbit path
    var oy = cy - B * R;
    c.strokeStyle = rgba([255, 255, 255], 0.35); c.lineWidth = 1;
    c.beginPath(); c.moveTo(cx + X0 * R, oy); c.lineTo(cx + X1 * R, oy); c.stroke();
    arrowHead(c, cx + (X1 - 0.25) * R, oy, cx + X1 * R, oy, rgba([255, 255, 255], 0.5));
    c.fillStyle = C.faint; c.textAlign = "right";
    c.fillText("orbit", Math.min(cx + X1 * R, w - 4), oy - 8);

    // Companion
    var s = steps[k], px2 = cx + s.x * R;
    c.beginPath(); c.arc(px2, oy, RP * R, 0, Math.PI * 2);
    c.fillStyle = "#0b0c0f"; c.fill();
    c.strokeStyle = C.accent; c.lineWidth = 1.5; c.stroke();

    // Legend
    c.textAlign = "left"; c.font = "11px " + SANS;
    dot(c, 10, h - 26, C.blue); c.fillStyle = C.soft; c.fillText("toward us", 20, h - 22);
    dot(c, 10, h - 10, C.red); c.fillStyle = C.soft; c.fillText("away from us", 20, h - 6);
  }
  function dot(c, x, y, rgb) { c.beginPath(); c.arc(x, y - 4, 4, 0, Math.PI * 2); c.fillStyle = rgba(rgb, 0.9); c.fill(); }
  function arrowHead(c, x1, y1, x2, y2, col) {
    var a = Math.atan2(y2 - y1, x2 - x1), s = 7;
    c.fillStyle = col; c.beginPath();
    c.moveTo(x2, y2);
    c.lineTo(x2 - s * Math.cos(a - 0.45), y2 - s * Math.sin(a - 0.45));
    c.lineTo(x2 - s * Math.cos(a + 0.45), y2 - s * Math.sin(a + 0.45));
    c.closePath(); c.fill();
  }

  // --- RM curve ---------------------------------------------------------
  function frame(c, w, h, padL, padB) {
    c.strokeStyle = C.rule; c.lineWidth = 1;
    c.strokeRect(padL + 0.5, 6.5, w - padL - 8, h - padB - 6);
  }
  function drawRV(k) {
    var g = fit(rv); if (!g) return;
    var c = g.c, w = g.w, h = g.h;
    c.clearRect(0, 0, w, h);
    var padL = 26, padB = 30, x0 = padL, x1 = w - 8, y0 = 6, y1 = h - padB;
    frame(c, w, h, padL, padB);
    var ym = (y0 + y1) / 2, ys = (y1 - y0) / 2 / maxA;
    // zero line
    c.strokeStyle = C.rule; c.setLineDash([3, 4]);
    c.beginPath(); c.moveTo(x0, ym); c.lineTo(x1, ym); c.stroke(); c.setLineDash([]);
    // shading: above zero = redshift, below = blueshift
    c.font = "10px " + SANS; c.textAlign = "left";
    c.fillStyle = rgba(C.red, 0.85); c.fillText("redshift", x0 + 6, y0 + 14);
    c.fillStyle = rgba(C.blue, 0.95); c.fillText("blueshift", x0 + 6, y1 - 6);
    // curve so far
    c.strokeStyle = C.accent; c.lineWidth = 2; c.beginPath();
    for (var i = 0; i <= k; i++) {
      var X = x0 + (x1 - x0) * i / (N - 1), Y = ym - steps[i].A * ys;
      if (i === 0) c.moveTo(X, Y); else c.lineTo(X, Y);
    }
    c.stroke();
    var Xk = x0 + (x1 - x0) * k / (N - 1), Yk = ym - steps[k].A * ys;
    c.beginPath(); c.arc(Xk, Yk, 3.5, 0, Math.PI * 2); c.fillStyle = C.accent; c.fill();
    // axis labels
    c.fillStyle = C.faint; c.textAlign = "center"; c.font = "11px " + SANS;
    c.fillText("time →", (x0 + x1) / 2, h - 10);
    c.save(); c.translate(12, (y0 + y1) / 2); c.rotate(-Math.PI / 2);
    c.fillText("velocity shift", 0, 0); c.restore();
  }

  // --- Doppler shadow in the absorption line ---------------------------
  // Disk-integrated line = rotational broadening kernel (limb-darkened)
  // convolved with a narrow local line. The companion removes the local line
  // at the velocity it covers, leaving a bump that slides across the profile.
  var NVL = 241, VMAX = 1.45, SIG = 0.07, DEPTH = 0.62, BUMP = 0.42, BSIG = 0.1;
  var vGrid = [], prof = [];
  (function buildProfile() {
    var ker = [], ksum = 0;
    for (var i = 0; i < NVL; i++) {
      var v = -VMAX + 2 * VMAX * i / (NVL - 1); vGrid.push(v);
      var q = 1 - v * v;
      var kv = q > 0 ? 2 * (1 - U) * Math.sqrt(q) + 0.5 * Math.PI * U * q : 0;
      ker.push(kv); ksum += kv;
    }
    var peak = 0;
    for (var j = 0; j < NVL; j++) {
      var acc = 0;
      for (var m = 0; m < NVL; m++) acc += ker[m] * Math.exp(-0.5 * Math.pow((vGrid[j] - vGrid[m]) / SIG, 2));
      prof.push(acc); if (acc > peak) peak = acc;
    }
    for (var n = 0; n < NVL; n++) prof[n] /= peak;   // absorption depth, peak = 1
  })();

  function drawLine(k) {
    var g = fit(sh); if (!g) return;
    var c = g.c, w = g.w, h = g.h;
    c.clearRect(0, 0, w, h);
    var padL = 26, padB = 30, x0 = padL, x1 = w - 8, y0 = 6, y1 = h - padB;
    frame(c, w, h, padL, padB);
    var top = y0 + (y1 - y0) * 0.14, bot = y1 - (y1 - y0) * 0.08;
    function X(v) { return x0 + (x1 - x0) * (v + VMAX) / (2 * VMAX); }
    function Y(f) { return top + (1 - f) / DEPTH * (bot - top); }   // f = normalized flux

    var st = steps[k], bump = st.depth * BUMP;           // greatly exaggerated for visibility
    var cur = [], ref = [];
    for (var i = 0; i < NVL; i++) {
      var a = DEPTH * prof[i];
      var b = bump > 0 ? DEPTH * bump * Math.exp(-0.5 * Math.pow((vGrid[i] - st.v) / BSIG, 2)) : 0;
      ref.push(1 - a); cur.push(1 - Math.max(0, a - b));
    }
    // centre line
    c.strokeStyle = C.rule; c.setLineDash([3, 4]);
    c.beginPath(); c.moveTo(X(0), y0); c.lineTo(X(0), y1); c.stroke(); c.setLineDash([]);
    // shadow fill between the normal line and the transit line
    if (bump > 0) {
      c.beginPath();
      for (var i2 = 0; i2 < NVL; i2++) { var xx = X(vGrid[i2]); if (i2 === 0) c.moveTo(xx, Y(ref[i2])); else c.lineTo(xx, Y(ref[i2])); }
      for (var i3 = NVL - 1; i3 >= 0; i3--) c.lineTo(X(vGrid[i3]), Y(cur[i3]));
      c.closePath();
      var base = st.v < 0 ? C.blue : C.red, mix = Math.min(1, 0.3 + 1.6 * Math.abs(st.v));
      c.fillStyle = rgba([Math.round(240 + (base[0] - 240) * mix), Math.round(240 + (base[1] - 240) * mix),
                          Math.round(240 + (base[2] - 240) * mix)], 0.88);
      c.fill();
    }
    // normal (out-of-transit) line, faint
    c.strokeStyle = rgba([255, 255, 255], 0.28); c.lineWidth = 1.2; c.setLineDash([4, 3]);
    c.beginPath();
    for (var i4 = 0; i4 < NVL; i4++) { var x4 = X(vGrid[i4]); if (i4 === 0) c.moveTo(x4, Y(ref[i4])); else c.lineTo(x4, Y(ref[i4])); }
    c.stroke(); c.setLineDash([]);
    // line during transit
    c.strokeStyle = C.ink; c.lineWidth = 1.8; c.beginPath();
    for (var i5 = 0; i5 < NVL; i5++) { var x5 = X(vGrid[i5]); if (i5 === 0) c.moveTo(x5, Y(cur[i5])); else c.lineTo(x5, Y(cur[i5])); }
    c.stroke();
    c.fillStyle = C.faint; c.font = "11px " + SANS; c.textAlign = "center";
    c.fillText("← toward us   velocity   away →", (x0 + x1) / 2, h - 10);
    c.save(); c.translate(12, (y0 + y1) / 2); c.rotate(-Math.PI / 2);
    c.fillText("brightness", 0, 0); c.restore();
  }

  // --- animation loop ---------------------------------------------------
  var start = 0, playing = !still, raf = 0, k = still ? N - 1 : 0;
  function render() {
    // Sky view shows mid-transit when everything is drawn at once.
    var kSky = still && k === N - 1 ? Math.round(N / 2) : k;
    drawSky(kSky); drawRV(k); drawLine(kSky);
  }
  function tick(t) {
    if (!start) start = t;
    var e = (t - start) % (DURATION + HOLD);
    k = Math.min(N - 1, Math.floor(e / DURATION * (N - 1)));
    render();
    raf = requestAnimationFrame(tick);
  }
  function play() { if (raf) return; start = 0; raf = requestAnimationFrame(tick); }
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  var buttons = document.querySelectorAll(".rm-controls [data-lambda]");
  function select(btn) {
    for (var i = 0; i < buttons.length; i++) buttons[i].setAttribute("aria-pressed", buttons[i] === btn ? "true" : "false");
    lam = parseFloat(btn.getAttribute("data-lambda"));
    compute();
    if (playing) { stop(); play(); } else { k = N - 1; render(); }
  }
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", function () { select(this); });
  }
  var pp = document.getElementById("rm-play");
  if (pp) {
    pp.textContent = playing ? "Pause" : "Play";
    pp.addEventListener("click", function () {
      playing = !playing;
      pp.textContent = playing ? "Pause" : "Play";
      if (playing) play(); else stop();
    });
  }

  compute();
  render();
  if (playing) play();

  var pending;
  function onResize() { clearTimeout(pending); pending = setTimeout(render, 80); }
  if (window.ResizeObserver) new ResizeObserver(onResize).observe(sky.parentNode.parentNode);
  else window.addEventListener("resize", onResize);
  document.addEventListener("visibilitychange", function () {
    if (!playing) return;
    if (document.hidden) stop(); else play();
  });
})();
