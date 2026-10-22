// Shared look for every chart (fonts, title style, no gridlines)
// Font names ending in a digit must be quoted, or the SVG falls back to a default font
var sharedConfig = {
  font: "'Source Sans 3', Arial, sans-serif",
  title: { font: "'Source Sans 3', Arial, sans-serif", fontSize: 20, fontWeight: 700, lineHeight: 25, anchor: "start", offset: 12,
           subtitleFont: "'Source Sans 3', Arial, sans-serif", subtitleFontSize: 13, subtitleFontWeight: "normal",
           subtitleColor: "#666", subtitleLineHeight: 17, subtitlePadding: 6 },
  header: { labelFont: "'Source Sans 3', Arial, sans-serif", labelFontSize: 13, labelFontWeight: 600, title: null },
  axis: { labelFontSize: 12, titleFontSize: 13, titleFontWeight: "normal", grid: false },
  legend: { labelFontSize: 12, titleFontSize: 12, titleLimit: 300, labelLimit: 220 },
  view: { stroke: null } // remove the border of the chart outline
};

// All charts to be rendered: [the box id in index.html, the chart file]
var charts = [
  ["#chart_1_1", "js/1_1_tilegrid.vg.json"],
  ["#chart_1_2", "js/1_2_statemap.vg.json"],
  ["#chart_1_3", "js/1_3_slope.vg.json"],
  ["#chart_1_4", "js/1_4_modes.vg.json"],
  ["#chart_1_5", "js/1_5_waterfall.vg.json"],
  ["#chart_2_1", "js/2_1_heatmap.vg.json"],
  ["#chart_2_2", "js/2_2_stream.vg.json"],
  ["#chart_2_3", "js/2_3_symbolmap.vg.json"],
  ["#chart_2_4", "js/2_4_changemap.vg.json"],
  ["#chart_2_5", "js/2_5_bump.vg.json"],
  ["#chart_3_1", "js/3_1_ampmmap.vg.json"],
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
    if (c[0] === "#chart_2_3") zoomNote(res.view);
    if (c[0] === "#chart_1_2") placeYearSlider(res.view);
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

// Chart 1.2 year slider: centred under the line chart's x-axis, just below its axis title.
// Measured from the drawn chart, so it stays in place when the chart shrinks to fit a narrower card
function placeYearSlider(view) {
  var slider = document.querySelector("#slider_1_2"), stack = slider.parentNode;
  function run() {
    if (getComputedStyle(slider).position !== "absolute") return;   // small screens: slider sits under the chart
    var line = document.querySelector("#chart_1_2 .concat_1_group");
    var axis = line && line.querySelector(".role-axis[aria-label^='X-axis']");
    if (!axis) return;
    var a = axis.getBoundingClientRect(), s = stack.getBoundingClientRect();
    slider.style.left = Math.round(a.left + a.width / 2 - s.left) + "px";
    slider.style.top = Math.round(a.bottom - s.top + 22) + "px";
  }
  run();
  view.addResizeListener(run);
  window.addEventListener("resize", run);
  if (document.fonts) document.fonts.ready.then(run);
}

// Chart 2.3 zoom unit: "1.0×" of the whole-Sydney view, plus how many km the map spans.
// Mercator: 1 km = scale / (6371 × cos latitude) pixels, with scale = zoom × 34000
function zoomNote(view) {
  var note = document.querySelector("#zoom_note_2_3");
  function update() {
    var zoom = view.signal("zoom"), lat = view.signal("centre")[1];
    var km = view.width() * 6371 * Math.cos(lat * Math.PI / 180) / (zoom * 34000);
    note.innerHTML = "<strong>" + zoom.toFixed(1) + "×</strong> · map ≈ " + Math.round(km) + " km across";
  }
  view.addSignalListener("zoom", update);
  view.addSignalListener("centre", update);
  view.addResizeListener(update);
  update();
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

