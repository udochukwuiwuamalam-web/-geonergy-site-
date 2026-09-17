# Working on this repository

Plain HTML, CSS and JavaScript. No build step, no framework, no chart or UI
libraries — the pages have to stay light on Nigerian mobile data.

## Adding a product to the store

Products live in `assets/products.json`. One entry per product, sorted by `kva`.

- **Installation note.** Every product Geonergy sends in from now on uses exactly:
  `"For installation please contact us on WhatsApp."` Installation is quoted per
  site, so the detail view points at a conversation rather than describing a
  setup. Products added before this rule keep the notes they already have.
- **No prices. Ever.** This file is served to every visitor and has no price
  field in it at all. Prices live only in `admin.html` on Geonergy's own device.
  `.github/workflows/pages.yml` fails the deploy if a price field appears here.
- **`kva`** drives the filter chips and the sort order. A 500 W unit is `0.5`,
  a 1 kWh portable is `0.2`.
- **`powers`** is what a customer recognises — "a standing fan", "TV and
  decoder" — not load calculations. The card shows the first four.
- **`specs`** keeps the manufacturer's figures, worded for a person: "1,000 Wh
  (1 kWh)", not "1000WH". Convert obvious unit slips rather than copying them,
  and say so.

## Product photos

`assets/products/<id>.webp`, composed as a 1280×960 tile on the site's off-white
`#F5F6F8` so every photo card reads as part of one set. Supplied photos usually
arrive on a studio backdrop: fit a quadratic background model from a border
frame, lift the product off it, keep the contact shadow but fade it out by
contrast rather than on a cut line, and drop floor reflections and any
generated-image sparkle in the corner. A product with no photo falls back to the
navy kVA placeholder tile on its own.

## The weather and safety watch

Lives on `calculator.html` (the "Watts" page) with its logic in
`assets/safety.js`. Forecasts come from Open-Meteo - no key, no account,
CORS-enabled - the same source the production calculator uses.

- **It watches the installation, not the reader.** The site is saved to
  `localStorage` once; geolocation only ever drops that pin. An owner checking
  a roof three states away is the normal case. Don't wire it to the
  calculator's own location picker, which follows whoever is reading.
- **Thresholds are in one object**, `T` at the top of `assets/safety.js`, and
  `assess()` is a pure function of the API response so it can be tested
  against invented forecasts with no browser and no network.
- **Early warning only.** Nothing in the copy may promise protection, and
  nothing may imply the page switches anything off or watches while closed.
  Push alerts only fire while the page is open; WhatsApp and email prefill a
  message for a person to send. Say so where a customer will read it.

## Before going live

`WHATSAPP_NUMBER` in `store.html`, `inverter.html` and `calculator.html` is still the placeholder
`2348000000000`. `PASSCODE` in `admin.html` is still the default.
