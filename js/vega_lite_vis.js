// Shared look for every chart (fonts, title style, no gridlines)
// Font names ending in a digit must be quoted, or the SVG falls back to a default font
var sharedConfig = {
  font: "'Source Sans 3', Arial, sans-serif",
  title: { font: "'Source Sans 3', Arial, sans-serif", fontSize: 20, fontWeight: 700, lineHeight: 25, anchor: "start", offset: 12,
           subtitleFont: "'Source Sans 3', Arial, sans-serif", subtitleFontSize: 13, subtitleFontWeight: "normal",
           subtitleColor: "#666", subtitleLineHeight: 17, subtitlePadding: 6 },
  header: { labelFont: "'Source Sans 3', Arial, sans-serif", labelFontSize: 13, labelFontWeight: 600, title: null },
  axis: { labelFontSize: 12, titleFontSize: 13, titleFontWeight: "normal", grid: false },
  // One legend format for every chart: plain 12px title, 11px labels, same symbol and gradient sizes
  legend: { titleFontSize: 12, titleFontWeight: "normal", titleColor: "#333", titlePadding: 6, titleLimit: 300,
            labelFontSize: 11, labelColor: "#444", labelLimit: 220, symbolSize: 110, symbolStrokeWidth: 0,
            gradientLength: 200, gradientThickness: 12, rowPadding: 4, columnPadding: 14 },
  view: { stroke: null } // remove the border of the chart outline
};

// All charts to be rendered: [the box id in index.html, the chart file]
var charts = [
  ["#chart_1_1", "js/1_1_tilegrid.vg.json"],
  ["#chart_1_2", "js/1_2_statemap.vg.json"],
  ["#chart_1_3", "js/1_3_slope.vg.json"],
  ["#chart_1_4", "js/1_4_modes.vg.json"],
  ["#chart_1_5", "js/1_5_waterfall.vg.json"],
  ["#chart_1_6", "js/1_6_choropleth.vg.json"],
  ["#chart_2_1", "js/2_1_heatmap.vg.json"],
  ["#chart_2_2", "js/2_2_stream.vg.json"],
  ["#chart_2_3", "js/2_3_symbolmap.vg.json"],
  ["#chart_2_4", "js/2_4_changemap.vg.json"],
  ["#chart_2_5", "js/2_5_bump.vg.json"],
  ["#chart_3_1", "js/3_1_ampmmap.vg.json"],
  ["#chart_3_1b", "js/3_1b_distance.vg.json"],
  ["#chart_3_2", "js/3_2_timebands.vg.json"],
  ["#chart_3_3", "js/3_3_vicmodes.vg.json"],
  ["#chart_4_1", "js/4_1_seq.vg.json"],
  ["#chart_4_2", "js/4_2_arrows.vg.json"],
  ["#chart_4_3", "js/4_3_compare.vg.json"]
];

// Load fonts before rendering
var fontsReady = document.fonts
  ? Promise.all(["400 12px 'Source Sans 3'", "600 12px 'Source Sans 3'", "700 12px 'Source Sans 3'"].map(function (f) {
      return document.fonts.load(f);
    })).catch(function () {})
  : Promise.resolve();

// Week 7 pattern: vegaEmbed(box, file).catch(console.error), once per chart
fontsReady.then(function () { charts.forEach(function (c) {
  if (!document.querySelector(c[0])) return;   // box commented out in index.html
  vegaEmbed(c[0], c[1], { actions: { export: true, source: true, editor: true, compiled: true }, renderer: "svg", config: sharedConfig }).then(function (res) {
    cardMenu(c[0]); // Run custom functions after rendering
    if (c[0] === "#chart_2_2") modeCheckboxes(res.view);
    if (c[0] === "#chart_2_3") { panZoom(res.view, c[0], 34000, 1, 6.5); }
    if (c[0] === "#chart_3_1") { panZoom(res.view, c[0], 17300, 1, 6); }
    if (c[0] === "#chart_2_4") { panZoom(res.view, c[0], 32600, 1, 6.5); }
    if (c[0] === "#chart_1_2") centreYearSlider(res.view);
    if (c[0] === "#chart_3_1" || c[0] === "#chart_3_1b") linkMelbourne(c[0], res.view);
    if (["#chart_1_2", "#chart_2_5", "#chart_3_3"].indexOf(c[0]) < 0) balanceInCard(res.view, c[0]);   // 1.2 lines up with the cards below; 2.5 shares its row with a key; 3.3 is centred in CSS
  }).catch(console.error);
}); });

// Move the chart's "⋯" menu to the top-right corner of its card.
// The wrapper keeps the vega-embed class so the menu keeps Vega-Embed's own styling; the links keep their handlers.
function cardMenu(box) {
  var card = document.querySelector(box).closest(".chart");
  var menu = document.querySelector(box + " details");
  if (!card || !menu) return;
  var holder = document.createElement("div");
  holder.className = "vega-embed card-menu";
  holder.appendChild(menu);
  card.appendChild(holder);
  card.classList.add("has-card-menu");
}

// Equal white space left and right of each chart inside its card.
// Measures what is actually drawn (axis titles, labels, legends) and slides the chart sideways
// by half the difference. Re-run after resizing, font loading and filter changes.
function balanceInCard(view, box) {
  var el = document.querySelector(box), card = el.closest(".chart");
  if (!card) return;
  el.style.position = "relative";
  function run() {
    el.style.left = "0px";
    el.style.width = "";
    var cr = card.getBoundingClientRect(), cs = getComputedStyle(card);
    var L = cr.left + parseFloat(cs.borderLeftWidth), R = cr.right - parseFloat(cs.borderRightWidth);
    var minX = Infinity, maxX = -Infinity;
    el.querySelectorAll("svg text, svg path, svg line, svg rect, svg circle").forEach(function (n) {
      var fill = n.getAttribute("fill"), stroke = n.getAttribute("stroke");
      if ((!fill || fill === "transparent" || fill === "none") && (!stroke || stroke === "transparent" || stroke === "none")) return;
      for (var a = n; a && a !== el; a = a.parentNode) if (a.getAttribute && a.getAttribute("opacity") === "0") return;
      var r = n.getBoundingClientRect();
      if (!r.width && !r.height) return;
      minX = Math.min(minX, r.left); maxX = Math.max(maxX, r.right);
    });
    if (minX === Infinity || maxX - minX > R - L) return;   // wider than the card: leave it scrollable from the left
    var shift = Math.round(((R - maxX) - (minX - L)) / 2);
    el.style.left = shift + "px";
    // a fixed-width chart slid right would push its full-width box past the card edge: trim the box by the same amount
    var svg = el.querySelector("svg");
    if (shift > 0 && svg && svg.getBoundingClientRect().width < el.clientWidth - shift) el.style.width = "calc(100% - " + shift + "px)";
  }
  function later() { setTimeout(run, 50); }
  run();
  view.addResizeListener(later);
  window.addEventListener("resize", later);
  card.addEventListener("change", later);
  card.addEventListener("input", later);
  if (document.fonts) document.fonts.ready.then(run);
}

// Chart 1.2: centre Vega-Lite's year slider under the line chart's plot area (its row is set in styles.css).
// Measured from the drawn x-axis, so it stays centred when the chart shrinks to fit a narrower card
function centreYearSlider(view) {
  var box = document.querySelector("#chart_1_2");
  var bind = box && box.querySelector(".vega-bindings");
  if (!bind) return;
  function run() {
    if (getComputedStyle(bind).position !== "absolute") { bind.style.left = ""; return; }   // small screens: slider sits under the chart
    var axis = box.querySelector(".concat_1_group .role-axis[aria-label^='X-axis'] .role-axis-domain")
            || box.querySelector(".concat_1_group .role-axis[aria-label^='X-axis']");
    if (!axis) return;
    var a = axis.getBoundingClientRect(), b = box.getBoundingClientRect();
    bind.style.left = Math.round(a.left + a.width / 2 - b.left) + "px";
  }
  run();
  view.addResizeListener(run);
  window.addEventListener("resize", run);
  if (document.fonts) document.fonts.ready.then(run);
}

// Charts 3.1 and 3.1b: the highlight buttons under the map also highlight the same stations in the scatter
var melbViews = {};
function linkMelbourne(box, view) {
  melbViews[box] = view;
  var map = melbViews["#chart_3_1"], scatter = melbViews["#chart_3_1b"];
  if (!map || !scatter) return;
  scatter.signal("boardPick", map.signal("boardPick")).runAsync();
  map.addSignalListener("boardPick", function (name, value) { scatter.signal("boardPick", value).runAsync(); });
}

// Charts 2.3 and 3.1: scroll on the map to zoom (around the pointer) and drag to move it.
// Sets the same "zoom" and "centre" signals as the slider and menu. Mercator with scale = zoom × base:
// x = w/2 + k(λ − λc), y = h/2 − k(m(φ) − m(φc)), where m(φ) = ln tan(π/4 + φ/2) and angles are in radians
function panZoom(view, box, base, zMin, zMax) {
  var el = document.querySelector(box), rad = Math.PI / 180;
  function merc(lat) { return Math.log(Math.tan(Math.PI / 4 + lat * rad / 2)); }
  function lat(m) { return (2 * Math.atan(Math.exp(m)) - Math.PI / 2) / rad; }
  function local(e) {   // pointer position inside the plot, in chart pixels (the SVG may be scaled by CSS)
    var svg = el.querySelector("svg"), r = svg.getBoundingClientRect();
    var f = (+svg.getAttribute("width") || r.width) / r.width, o = view.origin();
    return [(e.clientX - r.left) * f - o[0], (e.clientY - r.top) * f - o[1]];
  }
  function geo(p, c, k) {   // chart pixel -> [lon, lat]
    return [c[0] + (p[0] - view.width() / 2) / k / rad, lat(merc(c[1]) - (p[1] - view.height() / 2) / k)];
  }
  function zoomAt(z2, p, g) {   // set zoom z2 while the place g stays under pixel p
    var k2 = z2 * base;
    var c2 = [g[0] - (p[0] - view.width() / 2) / k2 / rad, lat(merc(g[1]) + (p[1] - view.height() / 2) / k2)];
    view.signal("zoom", z2).signal("centre", c2).runAsync();
  }
  // Smooth zoom: each scroll moves a target, and every animation frame eases the map a quarter of the way there
  var target = null, anchor = null, frame = 0;
  function step() {
    var z = view.signal("zoom"), z2 = z + (target - z) * 0.25;
    if (Math.abs(target - z2) < 0.002) z2 = target;
    zoomAt(z2, anchor.p, anchor.g);
    frame = z2 === target ? 0 : requestAnimationFrame(step);
  }
  el.addEventListener("wheel", function (e) {
    e.preventDefault();
    var z = view.signal("zoom"), p = local(e);
    var dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;   // lines -> pixels (Firefox)
    target = Math.min(zMax, Math.max(zMin, (target === null || !frame ? z : target) * Math.exp(-dy * 0.0015)));
    anchor = { p: p, g: geo(p, view.signal("centre"), z * base) };
    if (!frame) frame = requestAnimationFrame(step);
  }, { passive: false });
  // Double-click: back to the starting view
  var home = { z: view.signal("zoom"), c: view.signal("centre") };
  el.addEventListener("dblclick", function (e) {
    e.preventDefault();
    if (frame) { cancelAnimationFrame(frame); frame = 0; }
    target = null;
    view.signal("zoom", home.z).signal("centre", home.c).runAsync();
  });
  var drag = null, dragFrame = 0, lastMove = null;
  el.addEventListener("pointerdown", function (e) {
    if (e.button !== 0 || !el.querySelector("svg").contains(e.target)) return;
    if (e.target.closest(".role-legend")) return;   // legend clicks highlight a group, they don't move the map
    drag = { p: local(e), c: view.signal("centre"), id: e.pointerId, moving: false };
  });
  el.addEventListener("pointermove", function (e) {
    if (!drag) return;
    lastMove = local(e);
    if (!drag.moving) {   // a plain click stays a click; dragging starts after a 3px move
      if (Math.hypot(lastMove[0] - drag.p[0], lastMove[1] - drag.p[1]) < 3) return;
      drag.moving = true;
      if (frame) { cancelAnimationFrame(frame); frame = 0; }
      el.setPointerCapture(drag.id);
      el.classList.add("is-dragging");
    }
    if (dragFrame) return;   // redraw at most once per frame
    dragFrame = requestAnimationFrame(function () {
      dragFrame = 0;
      if (!drag) return;
      var p = lastMove, k = view.signal("zoom") * base;
      var c = [drag.c[0] - (p[0] - drag.p[0]) / k / rad, lat(merc(drag.c[1]) + (p[1] - drag.p[1]) / k)];
      view.signal("centre", c).runAsync();
    });
  });
  function end() { drag = null; el.classList.remove("is-dragging"); }
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
}

// Chart 2.2 filter: tick several modes at once, or "All modes" on its own.
// Vega-Lite radio buttons allow only one choice, so these checkboxes set the "modePicks" list instead
function modeCheckboxes(view) {
  var modes = ["All modes", "Train", "Metro", "Bus", "Light rail", "Ferry"];
  var box = document.querySelector("#legend_2_2");
  box.innerHTML = '<div class="vega-bind"><span class="vega-bind-radio"></span></div>';
  var row = box.querySelector(".vega-bind-radio");
  var inputs = modes.map(function (m, i) {
    var label = document.createElement("label");
    var input = document.createElement("input");
    input.type = "checkbox";
    input.value = m;
    input.checked = i === 0;
    label.appendChild(input);
    label.appendChild(document.createTextNode(m));
    row.appendChild(label);
    return input;
  });
  var all = inputs[0], picks = inputs.slice(1);
  inputs.forEach(function (input) {
    input.addEventListener("change", function () {
      if (input === all || !picks.some(function (p) { return p.checked; })) {
        // "All modes" clears the other ticks; unticking the last mode goes back to "All modes"
        picks.forEach(function (p) { p.checked = false; });
        all.checked = true;
      } else {
        all.checked = false;
      }
      var chosen = picks.filter(function (p) { return p.checked; }).map(function (p) { return p.value; });
      view.signal("modePicks", chosen).runAsync();
    });
  });
}

