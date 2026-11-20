/* How TRICERATOPS works, very simply (/research/tess/).
   Two candidate explanations for the same dip: a transiting planet and a
   hierarchical eclipsing binary (a bound pair of stars, diluted by the target's
   light because all three share one TESS pixel). Each transit adds data to a
   phase-folded light curve; each model's depth is refit to the data so far and
   its probability is computed from the fit (equal prior odds). The planet's
   flat-bottomed U-shaped dip fits; the binary's V-shaped dip does not.
   The data are a fixed, pre-generated noisy planet transit, so every visitor
   sees the same sequence. With prefers-reduced-motion the end state is shown. */
(function () {
  var ids = ["tri-sys-pl", "tri-lc-pl", "tri-sys-eb", "tri-lc-eb"];
  var cv = ids.map(function (id) { return document.getElementById(id); });
  if (cv.some(function (c) { return !c || !c.getContext; })) return;
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var css = getComputedStyle(document.documentElement);
  var INK = css.getPropertyValue("--ink").trim() || "#ecebe8";
  var FAINT = css.getPropertyValue("--ink-faint").trim() || "#85847f";
  var RULE = css.getPropertyValue("--rule").trim() || "#2c2d31";
  var ACCENT = css.getPropertyValue("--accent").trim() || "#f29a6b";
  var SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  // Observed data: 4 transits x 36 points, depth 1, noise 0.6 (relative units).
  var DATA = [[0.028,-1.042,-0.537,-0.153,1.053,0.21,0.308,-0.283,-0.597,0.86,-0.002,-0.825,-0.394,-1.694,-1.07,-0.155,-1.668,-0.384,-0.7,-1.027,-0.651,-0.695,-1.248,-1.153,-0.712,-0.529,-0.832,0.338,-0.474,-0.356,0.555,0.498,-0.491,-0.79,1.024,0.331],[-0.225,-0.007,-0.087,-0.495,-0.118,-0.401,-1.269,0.859,-0.105,0.246,-0.868,-1.431,-1.561,-0.42,-3.252,-1.179,-0.915,-1.24,-1.829,-1.506,-1.046,-1.648,-0.411,-0.565,-0.605,-1.431,-0.205,0.065,-0.234,-0.214,-0.468,0.309,0.13,-1.459,0.649,-0.734],[0.196,-1.183,0.375,1.825,-0.345,-0.243,-0.897,0.232,0.194,0.206,-0.85,-0.122,-2.165,-1.641,0.178,0.583,-0.314,-1.24,-1.042,-1.316,0.374,-1.13,0.762,-0.863,-1.464,0.206,-0.058,0.085,0.494,0.1,-0.35,0.184,-0.251,0.566,-0.908,-0.287],[0.422,-0.444,-0.284,0.281,0.522,-0.252,-0.903,-0.542,0.205,-0.904,-1.394,-0.912,-1.308,-0.695,-1.199,-1.477,-0.989,-1.019,-0.686,-1.32,-0.735,-0.5,-1.169,-1.101,-0.364,-0.932,0.197,-0.254,0.14,1.157,0.437,-0.401,0.343,-0.465,1.162,-0.892]];
  var NT = DATA.length, NP = DATA[0].length, SIG = 0.6;
  function xOf(j, i) { return -2 + 4 * (i + 0.5 + j / NT) / NP; }   // x = 1 at first/last contact

  // Model shapes (positive = dimming). Planet: flat, slightly limb-darkened
  // bottom with short ingress/egress. Eclipsing binary: V shape.
  var TAU = 0.22;
  function shapePlanet(x) {
    var a = Math.abs(x);
    if (a >= 1) return 0;
    if (a < 1 - TAU) { var q = x / (1 - TAU); return 0.92 + 0.08 * (1 - q * q); }
    var s = (1 - a) / TAU; return 0.92 * s * s * (3 - 2 * s);
  }
  function shapeEB(x) { return Math.max(0, 1 - Math.abs(x) / 1.05); }

  // Timeline
  var CYCLE = 5200, VERDICT = 5000, T_END = NT * CYCLE + VERDICT;
  var W0 = 0.25, W1 = 0.75;                       // share of each cycle spent on the transit window
  var A_ORB = 3.0, K = 0.1;                       // planet orbit (star radii), radius ratio
  var DP = Math.asin((1 + K) / A_ORB) / (2 * Math.PI);   // half-duration in orbital phase
  function orbitalPhase(u) {                      // u in [0,1) -> orbital phase p, slowed during transit
    var p0 = 0.5 - 2 * DP, p1 = 0.5 + 2 * DP;
    if (u < W0) return p0 * u / W0;
    if (u < W1) return p0 + (p1 - p0) * (u - W0) / (W1 - W0);
    return p1 + (1 - p1) * (u - W1) / (1 - W1);
  }

  // State at time t: which points are visible, and the cursor position.
  function state(t) {
    if (t >= NT * CYCLE) return { j: NT, cursor: null, p: 0.5, verdict: true };
    var j = Math.floor(t / CYCLE), u = (t % CYCLE) / CYCLE;
    var cursor = u < W0 ? -Infinity : u >= W1 ? Infinity : -2 + 4 * (u - W0) / (W1 - W0);
    return { j: j, cursor: cursor, p: orbitalPhase(u), verdict: false };
  }
  function visible(st) {
    var pts = [];
    for (var j = 0; j < NT; j++) {
      for (var i = 0; i < NP; i++) {
        var x = xOf(j, i);
        if (j < st.j || (j === st.j && x <= st.cursor)) pts.push({ x: x, y: DATA[j][i], cur: j === st.j });
      }
    }
    return pts;
  }
  // Best-fit depth (linear least squares) and chi-square for a model shape.
  function fitModel(pts, shape) {
    var sdm = 0, smm = 0;
    pts.forEach(function (p) { var m = -shape(p.x); sdm += p.y * m; smm += m * m; });
    var a = smm > 0 ? Math.max(0.05, sdm / smm) : 1, chi = 0;
    pts.forEach(function (p) { var r = p.y + a * shape(p.x); chi += r * r / (SIG * SIG); });
    return { a: a, chi: chi };
  }

  function fit(c) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2), w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) return null;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    var x = c.getContext("2d"); x.setTransform(dpr, 0, 0, dpr, 0, 0); return { c: x, w: w, h: h };
  }
  function rgba(rgb, a) { return "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + a + ")"; }
  function disk(c, x, y, r, col) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = col; c.fill(); }
  function label(c, text, x, y, align, col) {
    c.font = "11px " + SANS; c.textAlign = align || "center";
    c.lineWidth = 3; c.strokeStyle = "rgba(13,14,17,0.85)"; c.strokeText(text, x, y);
    c.fillStyle = col || FAINT; c.fillText(text, x, y);
  }

  var STAR = [255, 231, 176];

  // --- planet scene -------------------------------------------------------
  function drawPlanet(p) {
    var g = fit(cv[0]); if (!g) return; var c = g.c, w = g.w, h = g.h;
    c.clearRect(0, 0, w, h);
    var Rs = Math.min(w * 0.14, h * 0.26), cx = w / 2, cy = h / 2 - 6, e = 0.3 * Rs;
    var phi = 2 * Math.PI * (p - 0.5), px = cx + A_ORB * Rs * Math.sin(phi), py = cy + e * Math.cos(phi);
    var front = Math.cos(phi) > 0;
    // orbit: back half, star, front half
    c.strokeStyle = "rgba(255,255,255,0.18)"; c.lineWidth = 1;
    c.beginPath(); c.ellipse(cx, cy, A_ORB * Rs, e, 0, Math.PI, 2 * Math.PI); c.stroke();
    if (!front) disk(c, px, py, K * Rs * 1.6, "#9ec9ff");
    disk(c, cx, cy, Rs, rgba(STAR, 1));
    c.strokeStyle = "rgba(255,255,255,0.18)";
    c.beginPath(); c.ellipse(cx, cy, A_ORB * Rs, e, 0, 0, Math.PI); c.stroke();
    if (front) { disk(c, px, py, K * Rs * 1.6, "#0b0c0f"); c.strokeStyle = "#9ec9ff"; c.lineWidth = 1.4; c.beginPath(); c.arc(px, py, K * Rs * 1.6, 0, Math.PI * 2); c.stroke(); }
    label(c, "target star", cx, cy - Rs - 8);
    if (Math.abs(px - cx) > Rs + 14) label(c, "planet", px, py + K * Rs * 1.6 + 14, "center", "#9ec9ff");
  }

  // --- hierarchical eclipsing binary scene --------------------------------
  function drawEB(p) {
    var g = fit(cv[2]); if (!g) return; var c = g.c, w = g.w, h = g.h;
    c.clearRect(0, 0, w, h);
    var Rs = Math.min(w * 0.12, h * 0.24), cy = h / 2 - 6;
    var tx = w * 0.28, bx = w * 0.68;
    var r1 = 0.46 * Rs, r2 = 0.4 * Rs, ap = (r1 + r2) / Math.sin(2 * Math.PI * DP), e = 0.14 * Rs;
    var phi = 2 * Math.PI * (p - 0.5), sx = Math.sin(phi) * ap / 2, cz = Math.cos(phi);
    var s1 = { x: bx - sx, y: cy - e * cz, r: r1, col: "#ffb27f", z: -cz };
    var s2 = { x: bx + sx, y: cy + e * cz, r: r2, col: "#e8734f", z: cz };
    // "one TESS pixel" box around everything
    var pad = 14, L = tx - Rs - pad, Rr = Math.min(w - 6, bx + ap / 2 + r1 + pad), T = cy - Rs - 26, B = cy + Rs + 24;
    c.strokeStyle = "rgba(255,255,255,0.22)"; c.setLineDash([4, 4]); c.lineWidth = 1;
    c.strokeRect(L, T, Rr - L, B - T); c.setLineDash([]);
    label(c, "one TESS pixel", L + 6, T + 13, "left");
    disk(c, tx, cy, Rs, rgba(STAR, 1));
    label(c, "target star", tx, cy + Rs + 15);
    [s1, s2].sort(function (a, b) { return a.z - b.z; }).forEach(function (s) { disk(c, s.x, s.y, s.r, s.col); });
    label(c, "eclipsing pair", bx, cy + Rs + 15, "center", "#ffb27f");
  }

  // --- light curve --------------------------------------------------------
  var NB = 16;
  function drawLC(k, pts, shape, model, st, dim) {
    var g = fit(cv[k]); if (!g) return; var c = g.c, w = g.w, h = g.h;
    c.clearRect(0, 0, w, h);
    var x0 = 26, x1 = w - 8, y0 = 8, y1 = h - 28, YMAX = 1.3, YMIN = -2.5;
    function X(x) { return x0 + (x1 - x0) * (x + 2) / 4; }
    function Y(y) { return y0 + (y1 - y0) * (YMAX - Math.max(YMIN, Math.min(YMAX, y))) / (YMAX - YMIN); }
    c.strokeStyle = RULE; c.lineWidth = 1; c.strokeRect(x0 + 0.5, y0 + 0.5, x1 - x0, y1 - y0);
    // raw points
    pts.forEach(function (p) {
      c.fillStyle = p.cur && !st.verdict ? "rgba(236,235,232,0.75)" : "rgba(150,150,150,0.38)";
      c.beginPath(); c.arc(X(p.x), Y(p.y), 1.7, 0, Math.PI * 2); c.fill();
    });
    // binned averages
    var sum = new Array(NB).fill(0), n = new Array(NB).fill(0);
    pts.forEach(function (p) { var b = Math.min(NB - 1, Math.floor((p.x + 2) / 4 * NB)); sum[b] += p.y; n[b]++; });
    for (var b = 0; b < NB; b++) {
      if (n[b] < 3) continue;
      var bxp = -2 + 4 * (b + 0.5) / NB, byp = sum[b] / n[b];
      c.beginPath(); c.arc(X(bxp), Y(byp), 3.6, 0, Math.PI * 2);
      c.fillStyle = INK; c.fill(); c.lineWidth = 1.2; c.strokeStyle = "#0b0c0f"; c.stroke();
    }
    // best-fit model
    c.strokeStyle = dim ? "rgba(242,154,107,0.55)" : ACCENT; c.lineWidth = 2.2; c.beginPath();
    for (var i = 0; i <= 200; i++) {
      var xx = -2 + 4 * i / 200, yy = -model.a * shape(xx);
      if (i === 0) c.moveTo(X(xx), Y(yy)); else c.lineTo(X(xx), Y(yy));
    }
    c.stroke();
    // scanning cursor
    if (st.cursor !== null && isFinite(st.cursor)) {
      c.strokeStyle = "rgba(255,255,255,0.35)"; c.lineWidth = 1;
      c.beginPath(); c.moveTo(X(st.cursor), y0); c.lineTo(X(st.cursor), y1); c.stroke();
    }
    c.fillStyle = FAINT; c.font = "11px " + SANS; c.textAlign = "center";
    c.fillText("time from mid-transit", (x0 + x1) / 2, h - 9);
    c.save(); c.translate(12, (y0 + y1) / 2); c.rotate(-Math.PI / 2); c.fillText("brightness", 0, 0); c.restore();
  }

  // --- probabilities, verdict, status --------------------------------------
  var el = {
    barPl: document.getElementById("tri-bar-pl"), barEb: document.getElementById("tri-bar-eb"),
    pPl: document.getElementById("tri-p-pl"), pEb: document.getElementById("tri-p-eb"),
    rowPl: document.getElementById("tri-row-pl"), rowEb: document.getElementById("tri-row-eb"),
    vPl: document.getElementById("tri-v-pl"), vEb: document.getElementById("tri-v-eb"),
    status: document.getElementById("tri-status")
  };
  function fmt(p) {
    var v = p * 100;
    if (v > 99.9) return ">99.9%"; if (v < 0.1) return "<0.1%";
    if (v > 99 || v < 1) return v.toFixed(1) + "%";
    return Math.round(v) + "%";
  }

  function render(t) {
    var st = state(t), pts = visible(st);
    var mPl = fitModel(pts, shapePlanet), mEb = fitModel(pts, shapeEB);
    var dchi = mEb.chi - mPl.chi, pPl = pts.length ? 1 / (1 + Math.exp(-dchi / 2)) : 0.5;
    drawPlanet(st.p); drawEB(st.p);
    drawLC(1, pts, shapePlanet, mPl, st, false);
    drawLC(3, pts, shapeEB, mEb, st, st.verdict);
    if (el.barPl) el.barPl.style.width = (pPl * 100).toFixed(1) + "%";
    if (el.barEb) el.barEb.style.width = ((1 - pPl) * 100).toFixed(1) + "%";
    if (el.pPl) el.pPl.textContent = fmt(pPl);
    if (el.pEb) el.pEb.textContent = fmt(1 - pPl);
    if (el.rowPl) el.rowPl.classList.toggle("win", st.verdict);
    if (el.rowEb) el.rowEb.classList.toggle("lose", st.verdict);
    if (el.vPl) el.vPl.hidden = !st.verdict;
    if (el.vEb) el.vEb.hidden = !st.verdict;
    if (el.status) el.status.textContent = st.verdict ? "After four transits" : "Transit " + (st.j + 1) + " of " + NT;
  }

  var start = 0, raf = 0, playing = !still;
  function frame(now) { if (!start) start = now; render((now - start) % T_END); raf = requestAnimationFrame(frame); }
  function play() { if (raf) return; start = 0; raf = requestAnimationFrame(frame); }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  var pp = document.getElementById("tri-play");
  if (pp) {
    pp.textContent = playing ? "Pause" : "Play";
    pp.addEventListener("click", function () { playing = !playing; pp.textContent = playing ? "Pause" : "Play"; if (playing) play(); else stop(); });
  }
  if (playing) play(); else render(T_END - 1);

  var pending;
  function onResize() { clearTimeout(pending); pending = setTimeout(function () { if (!playing) render(T_END - 1); }, 80); }
  if (window.ResizeObserver) new ResizeObserver(onResize).observe(cv[0].closest(".tri-rows"));
  else window.addEventListener("resize", onResize);
  document.addEventListener("visibilitychange", function () { if (!playing) return; if (document.hidden) stop(); else play(); });
})();
