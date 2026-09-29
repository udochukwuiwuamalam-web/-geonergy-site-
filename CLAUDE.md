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

## The AI assistant

`assets/assistant.js` answers from data that ships with the site: the `KB`
array in that file (house guidance, written for a customer rather than an
engineer), `assets/products.json`, and the manual-derived code tables in
`assets/inverter.js`. Every answer prints where it came from, and the panel
says it does not know rather than guessing - a wrong answer about somebody's
electrical system is worse than no answer.

- **No model key in the page.** The site is static, and a key in a page is
  readable and billable by anyone who views source. `ASSISTANT_ENDPOINT` at the
  top of the file is the seam: point it at a server that holds the key and
  anything the local engine cannot answer is forwarded there, rendered in the
  same panel with its sources. Leave it empty and the panel falls back to
  WhatsApp.
- **It cannot search the web**, for the same reason. Where a question wants an
  outside source it links to the primary one (`REFERENCES`) and says so, rather
  than claiming to have read it.
- **The code tables load on demand.** `assets/inverter.js` is ~96KB and is only
  fetched when somebody actually asks about a code. The catalogue is shared with
  `store.html` through `window.__GEONERGY_PRODUCTS__` so it is fetched once.
- **Adding house guidance**: add an entry to `KB` with `k` (the words that
  should pull it up) and `a` (the answer in simple HTML). Keep `k` specific -
  the matcher needs either two words of the question to land or a short
  question where all of it lands, which is what stops an unrelated question
  being answered with whatever came closest.

## Weather data

The production calculator on `calculator.html` reads Open-Meteo on Geonergy's
paid commercial plan. **Every weather request goes through
`assets/weather-api.js`** - the key and the endpoint are set there once; never
paste a host or a key into a page. With the key blank it falls back to the free
endpoint so the page keeps working, and that endpoint is non-commercial only,
so a blank key is a launch blocker. The key is readable by anyone who views
source, which is what a site with no backend costs; the file says so and lists
the two ways out.

## Before going live

`API_KEY` in `assets/weather-api.js` is empty, so both weather features are
still calling Open-Meteo's free, non-commercial endpoint. Paste in the key from
the commercial subscription, and check the host and `&apikey=` spelling against
the subscription email while you are there.

`WHATSAPP_NUMBER` is still the placeholder `2348000000000` in three files -
`store.html`, `inverter.html` and `assets/assistant.js`. Change all three
together; a wrong one sends a customer to a WhatsApp chat with nobody.

`PASSCODE` in `admin.html` is still the default.
