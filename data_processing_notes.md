# Data processing notes (for the "What" write-up)

All files in `data/` were derived from the original downloads by filtering, summing and renaming columns only. No values were invented or altered.

| File | Source | Period | Processing |
| --- | --- | --- | --- |
| bitre_city_year.csv | BITRE, Australian Infrastructure and Transport Statistics Yearbook 2025, Tables 2.5a–h | FY2015–16 to FY2024–25 | Copied heavy rail, light rail, urban bus and ferry (million passenger trips) for the 8 capitals; blanks = 0 |
| opal_monthly.csv | Transport for NSW, Opal Trips – All Modes (all_modes.csv) | Jul 2016 – Aug 2026 | Summed all card types per month and mode; dropped "unallocated". TfNSW changed the counting method from Jan 2024 |
| syd_stations.csv | Transport for NSW, Train/Metro station monthly usage (to Jun 2024) and entries/exits (from Oct 2024); station entrance locations 2020 | Calendar years 2019, 2021, 2022, 2023, 2025 | Entries + exits summed per station per year ("Less than 50" counted as 0); light rail excluded; 2020 and 2024 omitted (lockdowns / 3 missing months Jul–Sep 2024); coordinates = average of each station's entrances, typos in entrance names corrected; kept stations inside Greater Sydney map frame. Coordinates for Gadigal, Victoria Cross, Crows Nest, Barangaroo and Waterloo (opened Aug 2024) were added by hand — VERIFY these against transportnsw.info before submitting |
| melb_stations.csv | DTP Victoria, Annual metropolitan train station patronage FY2024–25 | FY2024–25 | Renamed columns; time-band columns are weekday averages. "Morning share" in Chart 3.1 = (pre-AM + AM peak) ÷ (pre-AM + AM peak + PM peak + PM late) |
| vic_monthly.csv | DTP Victoria, Monthly public transport patronage by mode | Jan 2018 – Jun 2026 | Renamed columns (V/Line train = regional_train) |
| seq_monthly.csv | Translink, Patronage – South East Queensland | Dec 2023 – May 2026 | One row per month, one column per mode (Citytrain = train, Tram = light_rail) |
| syd_lines.topojson | Transport for NSW, Sydney Train Routes (GeoJSON) | Current | mapshaper: clipped to Greater Sydney, simplified 15%, converted to TopoJSON |
| aus_states.topojson | ABS, ASGS Edition 3 (2021) State and Territory boundaries | 2021 | mapshaper: removed Other Territories, clipped to mainland + Tasmania, simplified 0.6%, field renamed to `state` |
| syd_land.topojson / melb_land.topojson | ABS, ASGS Edition 3 (2021) State boundaries | 2021 | mapshaper: NSW / Victoria clipped to the Sydney / Melbourne map frames (gives coastline and bays), simplified 8% |
