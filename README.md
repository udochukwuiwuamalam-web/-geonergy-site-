# Geonergy

Marketing site for Geonergy, solar and battery systems paired with AI monitoring, built for Nigeria's power realities.

## Structure

The site is a single self-contained page. All CSS and JavaScript are inlined in `index.html`, with fonts pulled from Google Fonts. There is no build step and no dependencies to install.

| File | Purpose |
| --- | --- |
| `index.html` | The entire site |

Sections: hero, solution, error codes reference, how it works, why Nigeria, contact.

## Running it locally

Open `index.html` directly in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Deploying

Any static host works, since the output is one file. GitHub Pages, Netlify, Vercel, and Cloudflare Pages all serve this repository as-is with no build command.

## Contact

hello@geonergy.ng
