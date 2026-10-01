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
- **It can reach the internet, within limits.** A page with no backend cannot
  run a search engine - that needs a key - but it can read public APIs that
  allow cross-origin requests and need none. `WEB_SOURCES` is the registry:
  Wikipedia's REST API for prose, DuckDuckGo's instant answers (which draw on
  whatever site it judged authoritative, and name it), and Electrical
  Engineering Stack Exchange for titles and links only - never a forum answer's
  text, because that is somebody's opinion and this site will not hand one to a
  customer as guidance. They run in parallel; prose comes from the first that
  returns any, everything else contributes links. Any source that is blocked,
  offline or rate-limited drops out without taking the others with it, which
  matters because whether a given site allows browser requests is not something
  this file can promise on anyone else's behalf. `searchLinks()` needs no API at
  all and is the floor: if every source is unreachable the customer still gets
  handed the search.
  Two gates keep it honest. `WEB_NEVER` blocks anything about somebody's own
  wiring, settings, codes or safety - a general article does not know your
  battery class or your cable runs, and a confident generic answer about live
  DC is how people get hurt; those go to WhatsApp instead. `WEB_TOPIC` keeps it
  inside this site's subject, so an off-topic question gets an honest "I do not
  know" rather than a solar article about Ghana. The answer is always labelled
  as background rather than Geonergy's advice, and always carries its links.
  Set `WEB_LOOKUP = false` to switch the whole thing off. Where the network is
  blocked - the artifact preview's CSP does block it - every source fails
  quietly and the panel falls back to WhatsApp. `REFERENCES` is still there for
  the primary sources worth linking by hand.
- **Comparisons.** "X vs Y" is routed before everything else, because "deye vs
  growatt" is full of brand words and no fault code. Four hand-written tables
  (`BATTERIES`, `INV_TYPES`, `CONTROLLERS`, `VOLTAGES`) compare like with like
  on identical rows; products are compared from their own `specs` in
  `products.json`; brands are compared on *facts this site holds* - what is in
  the store, which manuals are on file, how many code and program tables -
  and then say plainly that Geonergy will not rank one badge over another,
  because sizing and installation decide the outcome, not the label. Add a
  comparison by adding an option to one of those tables with the same row keys
  as its siblings.
- **The code tables load on demand.** `assets/inverter.js` is ~96KB and is only
  fetched when somebody actually asks about a code. The catalogue is shared with
  `store.html` through `window.__GEONERGY_PRODUCTS__` so it is fetched once.
- **Adding house guidance**: add an entry to `KB` with `k` (the words that
  should pull it up) and `a` (the answer in simple HTML). Keep `k` specific -
  the matcher needs either two words of the question to land or a short
  question where all of it lands, which is what stops an unrelated question
  being answered with whatever came closest.

## Motion

`assets/motion.css` and `assets/motion.js` are the motion layer. The home page
uses all of it; the other pages have not been wired up yet.

- **What motion is for here.** It guides attention, shows state, or keeps a
  thing continuous between two places. Anything that does none of those is
  decoration and comes out. Only `transform` and `opacity` are animated, so the
  compositor can do the work without repainting; stagger is capped at 0.08s a
  step, because past about 0.1s a list feels like waiting rather than sequence.
- **Nothing is required to read the page.** Every animation starts from its
  finished state until a class is added, so a blocked or failed script leaves
  the site complete and still. The hero's entrance is pure CSS for the same
  reason - it must never be possible for a script to leave the headline hidden.
- **Ambient motion is a privilege, not a default.** The slow drift on the hero
  photograph and the looping energy diagram only run once `motion.js` has
  decided the device can afford them: not on 2GB of RAM, not on four cores
  where the memory API is missing, not with data saver on, and not on 2G.
  Everything else gets the still version, which says the same thing. The
  diagram also stops whenever it scrolls out of view - a loop ticking away in a
  section nobody is looking at is pure battery cost.
- **The energy diagram** (`.flow` in `index.html`) is an inline SVG: sun to
  panels, panels to inverter, inverter to the house, surplus to the battery,
  grid connected but idle above. The movement is the content - a still version
  would be a diagram of parts rather than a picture of power moving - so under
  `prefers-reduced-motion` the current stays drawn but stops travelling.
- Reveal variants are `reveal-left`, `reveal-right`, `reveal-scale` and
  `reveal-stagger`, alongside the plain `reveal` the pages already had. They
  use their own observer with the same contract: add `visible` once, never take
  it away.

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
