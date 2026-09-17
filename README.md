# Geonergy

Marketing site and customer tools for Geonergy: solar and battery systems built for Nigeria's power realities.

## Pages

| File | What it is |
| --- | --- |
| `index.html` | Main site, including the Your Solar Savings estimator |
| `calculator.html` | Solar production calculator, plus the weather and safety watch |
| `store.html` | Customer-facing catalogue, from a portable power station to a 215 kWh cabinet |
| `admin.html` | Private tool for managing the catalogue and prices |
| `assets/geonergy.css` | Shared design tokens, nav, buttons and footer |
| `assets/products.json` | Public catalogue. Contains no prices, by design |
| `assets/safety.js` | Weather and safety watch: forecast, risk thresholds, alerts |
| `assets/weather-api.js` | Open-Meteo endpoint and commercial key, for every weather call |

There is no build step and no dependencies. Every page is plain HTML, CSS and JavaScript,
with no charting or framework libraries, which keeps the pages light on mobile data.

## Running it locally

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000. Use a server rather than opening the files directly,
because `store.html` and `admin.html` fetch `assets/products.json`, and browsers block
that over `file://`.

## Before you go live

Two values are placeholders and must be changed.

1. **WhatsApp number.** In `store.html`, set `WHATSAPP_NUMBER` to Geonergy's real number in
   international form, digits only. `0803 123 4567` becomes `2348031234567`. Until this is
   set, the buttons open WhatsApp with no recipient.
2. **Admin passcode.** In `admin.html`, change `PASSCODE` from its default.

## How pricing stays private

This is a static site with no server, so it is worth being precise about what protects what.

The passcode on `admin.html` is a deterrent against a casual visitor. It sits in JavaScript
that anyone can read, so it is not authentication and should not be treated as such.

What actually keeps prices private is that **prices are never published**. They are held in
your browser's local storage on your own device. `assets/products.json`, the only catalogue
the website serves, has no price field in it at all. Prices are absent rather than hidden,
so there is nothing for a customer to uncover.

**Publishing a catalogue update:**

1. Open `admin.html` and make your changes.
2. Click **Publish catalogue**. It downloads a `products.json` with every price stripped,
   and refuses to download at all if a price somehow survives the strip.
3. Upload that file to `assets/products.json` and commit it.

**Back up regularly.** Click **Save private backup** to download a file that does contain
prices. Keep it off the website. Clearing your browser data wipes the prices otherwise.

## Product images

The store shows a kVA placeholder tile for any system with no photo. To add real photos,
put them in `assets/products/` and set the image path on each system in the admin tool.
Resize to roughly 1200px wide and save as JPEG or WebP before uploading, so the page stays
fast on mobile data.

## When you outgrow the static setup

A small backend is needed if you want real staff logins, more than one person editing, or
catalogue changes that appear on the site without publishing a file. Any host offering a
database and authentication would do. The change is contained: `store.html` reads its
catalogue from a single `CATALOGUE_URL`, and `admin.html` reads and writes through its
`save`, `load` and `publish` functions. Those are the only places that would need to point
at an API instead of a file.

## Where the numbers come from

The savings estimator applies a per-size offset to your electricity and generator spend,
varied across the year to reflect Nigerian solar yield, which drops through the rains and
is dulled by harmattan haze. The five-year total assumes tariffs and fuel rise 8% a year.

The production calculator uses Open-Meteo for hourly irradiance, cloud cover and
temperature. If that call fails, the page falls back to a clear-sky model computed from the
sun's position and says so on screen rather than passing an estimate off as live data.

Both weather features build their requests in `assets/weather-api.js`, which holds the
endpoint and the key for Geonergy's paid Open-Meteo plan. Leave the key blank and requests
fall back to the free, non-commercial endpoint so nothing breaks in development — which
also means shipping with it blank puts the live site on the wrong licence. On a static host
the key is readable by anyone who views source; locking it to the domain, or putting one
small serverless function in front of it, are the two real answers, and the file says so.

Both are estimates and both say so. Real output depends on roof orientation, shade, dust
and the actual load in the building.

The weather and safety watch on the same page reads the forecast over the site where a
system is installed — saved once to the browser, so it keeps watching that roof when the
owner is somewhere else — and rates the next twelve hours Normal, Weather warning or
Severe weather from thunderstorm codes, CAPE, wind gusts and hourly rainfall. Thresholds
live in one object at the top of `assets/safety.js`, and `assess()` is a pure function of
the API response, so the risk calls can be tested against invented forecasts offline.

It is an early warning and says so everywhere: it switches nothing off, it does not watch
while the page is closed, push alerts arrive only while the page is open, and the WhatsApp
and email channels prefill a message for a person to send. Anything stronger than that
needs a server-side watcher, which this site does not have.

## Deploying

`.github/workflows/pages.yml` publishes the site to GitHub Pages. It deploys `index.html`,
`calculator.html`, `store.html`, `inverter.html` and `assets/`, and **deliberately leaves out
`admin.html`**,
so the pricing tool is never served from the live site. Two guard steps fail the build
rather than publish by accident: one if the admin tool reaches the artifact, one if a price
field appears in the public catalogue.

**Enabling it, once:** go to
[Settings → Pages](https://github.com/udochukwuiwuamalam-web/-geonergy-site-/settings/pages)
and set **Source** to **GitHub Actions**. That switch cannot be flipped through the API, so
it has to be done in the browser. Then re-run the workflow from the Actions tab, or push any
commit. The site appears at
`https://udochukwuiwuamalam-web.github.io/-geonergy-site-/`.

### Using the admin tool once the site is live

Because it is not deployed, open `admin.html` from your own copy of the repository. It
tries the local catalogue first and falls back to fetching the live site's catalogue, so
opening the file directly normally works. If it cannot reach either, serve the folder and
use `http://localhost:8000/admin.html`.

### One thing to be clear about

This repository is **public**, so `admin.html` and its passcode are readable by anyone who
browses the repository, even though the page is not part of the deployed site. That is
survivable because the passcode is not what protects your prices, and no price is ever
committed here. If you want the admin tool out of public view entirely, delete it from the
repository and keep a copy on your own machine. Nothing else depends on it.

## Contact

geonergysolarafrican@gmail.com
