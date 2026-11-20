/* Why hot stars have fewer close-in small planets (/research/demographics/).
   Two synced top-down panels: a Sun-like star and a hot A-type star, each with
   a dusty disk whose inner edge sits at the dust sublimation radius. A planet
   forms, migrates inward, stalls at the inner edge, the disk disperses, and
   then tides either pull it closer (Sun-like star) or leave it stranded
   (A-type star, whose inner edge is much farther out). Qualitative and not to
   scale. With prefers-reduced-motion the final state is drawn once. */
(function () {
  var cvs = [document.getElementById("sub-sun"), document.getElementById("sub-a")];
  if (!cvs[0] || !cvs[1] || !cvs[0].getContext) return;
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var css = getComputedStyle(document.documentElement);
  var INK = css.getPropertyValue("--ink").trim() || "#ecebe8";
  var FAINT = css.getPropertyValue("--ink-faint").trim() || "#85847f";
  var SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  // Radii in units of the panel half-width.
  var SYSTEMS = [
    { star: 0.045, core: [255, 236, 190], halo: [255, 196, 92],
      rsub: 0.24, rout: 0.95, r0: 0.82, rend: 0.105, rtess: 0.19,
      tideText: "Tides pull it closer to the star", endText: "It ends up on a close-in orbit",
      tessText: "Planets end up where TESS can detect them", seed: 7 },
    { star: 0.075, core: [240, 246, 255], halo: [150, 190, 255],
      rsub: 0.58, rout: 0.95, r0: 0.82, rend: 0.575, rtess: 0.48,
      tideText: "Too far away for tides to act", endText: "It is stranded on a wider orbit",
      tessText: "No planets end up where TESS can detect them", seed: 11 }
  ];

  // Timeline (ms)
  var SLOW = 2;   // overall playback slowdown
  var T_FORM = 800 * SLOW, T_MIG = 4800 * SLOW, T_PARK = 5800 * SLOW, T_DISP = 7200 * SLOW,
      T_TIDE = 10000 * SLOW, T_HOLD = 11400 * SLOW, T_GONE = 12200 * SLOW, T_HL = 13000 * SLOW,
      T_END = 16000 * SLOW;

  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function ease(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function clamp01(x) { return Math.max(0, Math.min(1, x)); }

  // Dust particles per system (fixed, rotated over time).
  SYSTEMS.forEach(function (s) {
    var r = rng(s.seed), n = 1700;
    s.dust = [];
    for (var i = 0; i < n; i++) {
      var u = r();
      var rad = s.rsub + (s.rout - s.rsub) * Math.pow(u, 1.35);
      var hot = 1 - (rad - s.rsub) / (s.rout - s.rsub);      // 1 at inner rim
      s.dust.push({ r: rad, a: r() * Math.PI * 2, sz: 0.5 + r() * 1.3,
                    hot: hot, al: 0.35 + 0.65 * r() * (0.45 + 0.55 * hot) });
    }
    s.trail = [];
  });

  function fit(cv) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return null;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    }
    var c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { c: c, w: w, h: h };
  }
  function rgba(rgb, a) { return "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + a + ")"; }

  // Planet orbital radius at time t for system s.
  function radiusAt(s, t) {
    if (t < T_MIG) return s.r0 + (s.rsub - s.r0) * ease((t - T_FORM) / (T_MIG - T_FORM));
    if (t < T_DISP) return s.rsub;
    return s.rsub + (s.rend - s.rsub) * ease((t - T_DISP) / (T_TIDE - T_DISP));
  }
  function phaseText(s, t) {
    if (t < T_FORM) return "A planet forms in the dusty disk";
    if (t < T_MIG) return "It migrates inward through the disk";
    if (t < T_PARK) return "It stalls where the dust ends";
    if (t < T_DISP) return "The disk disperses";
    if (t < T_TIDE) return s.tideText;
    if (t < T_GONE) return s.endText;
    return s.tessText;
  }

  // Integrate planet angle so its speed follows Kepler's law as it migrates.
  function advance(s, t, dt) {
    var r = radiusAt(s, t);
    var omega = Math.min(2 * Math.PI / (0.55 * SLOW), (2 * Math.PI / (3.2 * SLOW)) * Math.pow(s.r0 / r, 1.5)); // rad/s
    s.theta = (s.theta || 0) + omega * dt / 1000;
    s.rNow = r;
  }

  function draw(i, t, keepPlanet) {
    var s = SYSTEMS[i], g = fit(cvs[i]); if (!g) return;
    var c = g.c, w = g.w, h = g.h, cx = w / 2, cy = h / 2 - 8, R = Math.min(w, h) / 2 * 0.9;
    c.clearRect(0, 0, w, h);

    var diskA = 1 - ease((t - T_PARK) / (T_DISP - T_PARK));
    var hl = keepPlanet ? 1 : ease((t - T_GONE) / (T_HL - T_GONE));   // TESS region fade-in

    // Gas/dust glow of the disk
    if (diskA > 0.01) {
      var gr = c.createRadialGradient(cx, cy, s.rsub * R * 0.95, cx, cy, s.rout * R);
      gr.addColorStop(0, rgba([255, 175, 115], 0.42 * diskA));
      gr.addColorStop(0.15, rgba([210, 115, 72], 0.24 * diskA));
      gr.addColorStop(1, rgba([120, 60, 40], 0));
      c.fillStyle = gr;
      c.beginPath(); c.arc(cx, cy, s.rout * R, 0, Math.PI * 2); c.arc(cx, cy, s.rsub * R, 0, Math.PI * 2, true); c.fill("evenodd");
      // Dust grains, rotating with Keplerian speed (slowly)
      var rot = t / 1000 / SLOW;
      for (var k = 0; k < s.dust.length; k++) {
        var d = s.dust[k];
        var om = 0.35 * Math.pow(s.r0 / d.r, 1.5);
        var a = d.a + om * rot;
        var x = cx + Math.cos(a) * d.r * R, y = cy + Math.sin(a) * d.r * R;
        var col = d.hot > 0.85 ? [255, 214, 160] : d.hot > 0.5 ? [236, 160, 104] : [196, 118, 82];
        c.fillStyle = rgba(col, d.al * diskA);
        c.fillRect(x, y, d.sz, d.sz);
      }
    }

    // Dust sublimation radius: a reference after the disk is gone, then fades
    // out as the TESS-sensitive region appears.
    var subA = 1 - hl;
    if (subA > 0.01) {
      c.strokeStyle = rgba([255, 200, 150], (0.35 + 0.35 * diskA) * subA); c.lineWidth = 1.1; c.setLineDash([4, 4]);
      c.beginPath(); c.arc(cx, cy, s.rsub * R, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
      c.font = "11px " + SANS; c.textAlign = "center";
      c.lineWidth = 3; c.strokeStyle = rgba([13, 14, 17], 0.85 * subA);
      var ly = cy - s.rsub * R - 7;
      c.strokeText("dust sublimation radius", cx, ly);
      c.fillStyle = rgba([255, 214, 176], 0.95 * subA); c.fillText("dust sublimation radius", cx, ly);
    }

    // TESS-sensitive region (end of the sequence)
    if (hl > 0.01) {
      var TZ = [110, 225, 200];
      var zg = c.createRadialGradient(cx, cy, 0, cx, cy, s.rtess * R);
      zg.addColorStop(0, rgba(TZ, 0.10 * hl)); zg.addColorStop(1, rgba(TZ, 0.30 * hl));
      c.fillStyle = zg; c.beginPath(); c.arc(cx, cy, s.rtess * R, 0, Math.PI * 2); c.fill();
      c.strokeStyle = rgba(TZ, 0.85 * hl); c.lineWidth = 1.5;
      c.beginPath(); c.arc(cx, cy, s.rtess * R, 0, Math.PI * 2); c.stroke();
      c.font = "11px " + SANS; c.textAlign = "center";
      var ty = cy - s.rtess * R - 7;                 // just above the region, like the ring label
      c.lineWidth = 3; c.strokeStyle = rgba([13, 14, 17], 0.85 * hl); c.strokeText("TESS-sensitive region", cx, ty);
      c.fillStyle = rgba([170, 240, 222], hl); c.fillText("TESS-sensitive region", cx, ty);
    }

    // Star
    c.fillStyle = rgba(s.halo.map(function (v, k) { return Math.round((v + s.core[k]) / 2); }), 1);
    c.beginPath(); c.arc(cx, cy, s.star * R, 0, Math.PI * 2); c.fill();

    // Planet and its trail
    var appear = keepPlanet ? 1 : clamp01(t / (500 * SLOW)) * (1 - ease((t - T_HOLD) / (T_GONE - T_HOLD)));
    var px = cx + Math.cos(s.theta) * s.rNow * R, py = cy + Math.sin(s.theta) * s.rNow * R;
    s.trail.push([px, py]); if (s.trail.length > 46 * SLOW) s.trail.shift();
    if (appear > 0.01) {
    for (var j = 1; j < s.trail.length; j++) {
      c.strokeStyle = rgba([190, 222, 255], 0.5 * j / s.trail.length * appear); c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(s.trail[j - 1][0], s.trail[j - 1][1]); c.lineTo(s.trail[j][0], s.trail[j][1]); c.stroke();
    }
    c.beginPath(); c.arc(px, py, 4.2, 0, Math.PI * 2);
    c.fillStyle = rgba([200, 230, 255], appear); c.fill();
    c.lineWidth = 1.5; c.strokeStyle = rgba([13, 14, 17], appear); c.stroke();
    }

    // Stage caption
    c.font = "13px " + SANS; c.textAlign = "center"; c.fillStyle = INK;
    c.fillText(phaseText(s, t), w / 2, h - 12);
  }

  var start = 0, last = 0, raf = 0, playing = !still;
  function frame(now) {
    if (!start) { start = now; last = now; }
    var t = (now - start) % T_END, dt = Math.min(50, now - last); last = now;
    if (t < dt) { SYSTEMS.forEach(function (s) { s.theta = 0; s.trail = []; }); }
    for (var i = 0; i < 2; i++) { advance(SYSTEMS[i], t, dt); draw(i, t); }
    raf = requestAnimationFrame(frame);
  }
  function play() { if (raf) return; start = 0; SYSTEMS.forEach(function (s) { s.theta = 0; s.trail = []; }); raf = requestAnimationFrame(frame); }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  function drawStatic() {
    // Final state: planets at their end orbits, disk shown faintly for context.
    for (var i = 0; i < 2; i++) {
      var s = SYSTEMS[i]; s.trail = []; s.theta = -Math.PI / 4; s.rNow = s.rend;
      draw(i, T_END - 1, true);
    }
  }

  var pp = document.getElementById("sub-play");
  if (pp) {
    pp.textContent = playing ? "Pause" : "Play";
    pp.addEventListener("click", function () {
      playing = !playing; pp.textContent = playing ? "Pause" : "Play";
      if (playing) play(); else stop();
    });
  }
  if (playing) play(); else drawStatic();

  var pending;
  function onResize() { clearTimeout(pending); pending = setTimeout(function () { if (!playing) drawStatic(); }, 80); }
  if (window.ResizeObserver) new ResizeObserver(onResize).observe(cvs[0].parentNode.parentNode);
  else window.addEventListener("resize", onResize);
  document.addEventListener("visibilitychange", function () {
    if (!playing) return;
    if (document.hidden) stop(); else play();
  });
})();
