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
  view: { stroke: null }
};

// Each pair: [the box id in index.html, the chart file]
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

// Week 7 pattern: vegaEmbed(box, file).catch(console.error), once per chart
charts.forEach(function (c) {
  var embed = vegaEmbed(c[0], c[1], { actions: false, renderer: "svg", config: sharedConfig });
  if (c[0] === "#chart_2_2") embed = embed.then(function (res) { modeCheckboxes(res.view); });
  embed.catch(console.error);
});

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

