/* How TRICERATOPS works, very simply (/research/tess/).
   Two candidate explanations for the same dip: a transiting planet and a
   hierarchical eclipsing binary (a bound pair of stars whose eclipse is diluted by the target's
   light because all three share one TESS pixel). Each transit adds data to a
   phase-folded light curve, shown static. As each system goes through one
   transit, its best-fit model line is drawn across the data; then both
   models' probabilities (from the fit, equal prior odds) are revealed. The
   planet's flat-bottomed U-shaped dip fits; the binary's V-shaped dip does not.
   The data are fixed and pre-generated (a noisy planet transit), so every
   visitor sees the same result. With prefers-reduced-motion the end state is shown. */
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

  // Observed data: 4 transits x 36 points, depth 1, noise 0.3 (relative units).
  var DATA = [[0.014,-0.521,-0.268,-0.076,0.526,0.105,0.154,-0.142,-0.298,0.357,-0.393,-0.878,-0.672,-1.331,-1.025,-0.572,-1.332,-0.692,-0.85,-1.012,-0.82,-0.838,-1.108,-1.052,-0.822,-0.657,-0.489,0.169,-0.237,-0.178,0.278,0.249,-0.246,-0.395,0.512,0.166],[-0.112,-0.004,-0.044,-0.248,-0.059,-0.2,-0.634,0.43,-0.052,-0.025,-0.877,-1.184,-1.258,-0.695,-2.117,-1.085,-0.956,-1.12,-1.414,-1.251,-1.017,-1.313,-0.687,-0.756,-0.766,-1.034,-0.123,0.032,-0.117,-0.107,-0.234,0.154,0.065,-0.73,0.324,-0.367],[0.098,-0.592,0.188,0.912,-0.172,-0.122,-0.448,0.116,0.097,-0.13,-0.885,-0.532,-1.562,-1.308,-0.404,-0.205,-0.656,-1.12,-1.02,-1.155,-0.306,-1.052,-0.099,-0.902,-1.192,-0.13,-0.029,0.042,0.247,0.05,-0.175,0.092,-0.126,0.283,-0.454,-0.144],[0.211,-0.222,-0.142,0.14,0.261,-0.126,-0.452,-0.271,0.082,-0.771,-1.16,-0.929,-1.136,-0.836,-1.093,-1.236,-0.994,-1.009,-0.842,-1.156,-0.859,-0.735,-1.062,-1.019,-0.625,-0.614,0.098,-0.127,0.07,0.578,0.218,-0.2,0.172,-0.232,0.581,-0.446]];
  var NT = DATA.length, NP = DATA[0].length, SIG = 0.3;
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
  // Eclipse of a limb-darkened star by a slightly smaller companion (radius
  // ratio 0.9, impact parameter 0.25): blocked light vs. position, computed
  // numerically and normalized to 1 at mid-eclipse. Index 0 = mid-eclipse,
  // last = first/last contact. Rounded bottom, curved sides.
  var EB_HALF = [1,0.9966,0.9873,0.9721,0.953,0.9297,0.9038,0.8753,0.8454,0.8133,0.7808,0.7477,0.7139,0.6796,0.6443,0.6101,0.5757,0.5417,0.5076,0.4739,0.44,0.4073,0.3753,0.3439,0.3131,0.2829,0.254,0.226,0.1994,0.1734,0.1491,0.1256,0.1042,0.0841,0.0658,0.0491,0.0342,0.0215,0.0113,0.0039,0];
  function shapeEB(x) {
    var a = Math.abs(x); if (a >= 1) return 0;
    var f = a * (EB_HALF.length - 1), k = Math.floor(f), r = f - k;
    return EB_HALF[k] * (1 - r) + EB_HALF[Math.min(k + 1, EB_HALF.length - 1)] * r;
  }

  // Timeline
  var CYCLE = 7000, VERDICT = 5500, T_END = CYCLE + VERDICT;
  var A_ORB = 3.0, K = 0.1;                       // planet orbit (star radii), radius ratio
  var DP = Math.asin((1 + K) / A_ORB) / (2 * Math.PI);   // half-duration in orbital phase
  // Each loop covers just the stretch of orbit around the transit, at constant
  // speed: it starts shortly before first contact and ends after last contact.
  var P0 = 0.5 - 2 * DP, P1 = 0.5 + 2 * DP;
  function orbitalPhase(u) { return P0 + (P1 - P0) * u; }

  // State at time t: which points are visible, and the cursor position.
  function state(t) {
    if (t >= CYCLE) return { cursor: Infinity, p: P1, verdict: true };
    var u = t / CYCLE;
    return { cursor: -2 + 4 * u, p: orbitalPhase(u), verdict: false };
  }
  var PTS = [];
  for (var jj = 0; jj < NT; jj++) for (var ii = 0; ii < NP; ii++) PTS.push({ x: xOf(jj, ii), y: DATA[jj][ii] });
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
    disk(c, tx, cy, Rs, rgba(STAR, 1));
    label(c, "target star", tx, cy - Rs - 8);
    [s1, s2].sort(function (a, b) { return a.z - b.z; }).forEach(function (s) { disk(c, s.x, s.y, s.r, s.col); });
    label(c, "eclipsing pair", bx, cy - Rs - 8, "center", "#ffb27f");
  }

  // --- light curve --------------------------------------------------------
  function drawLC(k, pts, shape, model, st, dim) {
    var g = fit(cv[k]); if (!g) return; var c = g.c, w = g.w, h = g.h;
    c.clearRect(0, 0, w, h);
    var x0 = 26, x1 = w - 8, y0 = 8, y1 = h - 28, YMAX = 1.3, YMIN = -2.5;
    function X(x) { return x0 + (x1 - x0) * (x + 2) / 4; }
    function Y(y) { return y0 + (y1 - y0) * (YMAX - Math.max(YMIN, Math.min(YMAX, y))) / (YMAX - YMIN); }
    c.strokeStyle = RULE; c.lineWidth = 1; c.strokeRect(x0 + 0.5, y0 + 0.5, x1 - x0, y1 - y0);
    // data points with 1-sigma error bars
    c.strokeStyle = "rgba(170,170,170,0.22)"; c.lineWidth = 1;
    c.beginPath();
    pts.forEach(function (p) { var xp = X(p.x); c.moveTo(xp, Y(p.y + SIG)); c.lineTo(xp, Y(p.y - SIG)); });
    c.stroke();
    c.fillStyle = "rgba(205,205,205,0.75)";
    pts.forEach(function (p) { c.beginPath(); c.arc(X(p.x), Y(p.y), 1.9, 0, Math.PI * 2); c.fill(); });
    // best-fit model
    c.strokeStyle = dim ? "rgba(242,154,107,0.55)" : ACCENT; c.lineWidth = 2.2; c.beginPath();
    var xEnd = Math.min(2, st.cursor);
    if (xEnd > -2) {
      for (var i = 0; i <= 200; i++) {
        var xx = -2 + 4 * i / 200; if (xx > xEnd) xx = xEnd;
        var yy = -model.a * shape(xx);
        if (i === 0) c.moveTo(X(xx), Y(yy)); else c.lineTo(X(xx), Y(yy));
        if (xx === xEnd) break;
      }
      c.stroke();
    }
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

  var M_PL = fitModel(PTS, shapePlanet), M_EB = fitModel(PTS, shapeEB);
  var P_PL = 1 / (1 + Math.exp(-(M_EB.chi - M_PL.chi) / 2));
  function render(t) {
    var st = state(t);
    drawPlanet(st.p); drawEB(st.p);
    drawLC(1, PTS, shapePlanet, M_PL, st, false);
    drawLC(3, PTS, shapeEB, M_EB, st, st.verdict);
    var show = st.verdict;
    if (el.barPl) el.barPl.style.width = show ? (P_PL * 100).toFixed(1) + "%" : "0%";
    if (el.barEb) el.barEb.style.width = show ? ((1 - P_PL) * 100).toFixed(1) + "%" : "0%";
    if (el.pPl) el.pPl.textContent = show ? fmt(P_PL) : "–";
    if (el.pEb) el.pEb.textContent = show ? fmt(1 - P_PL) : "–";
    if (el.rowPl) el.rowPl.classList.toggle("win", st.verdict);
    if (el.rowEb) el.rowEb.classList.toggle("lose", st.verdict);
    if (el.vPl) el.vPl.hidden = !st.verdict;
    if (el.vEb) el.vEb.hidden = !st.verdict;
    if (el.status) el.status.textContent = st.verdict ? "Result" : "Fitting each model to the data…";
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
