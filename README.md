# Al-Haqqu l-Mubeen Arabic and Islamic Relations (AHM) — website

A four-page, fully responsive static website: **Home, About, Donate, Contact**.
No frameworks, no build step required to deploy — open `index.html` or upload the
folder to any static host (Netlify, Vercel, cPanel, GitHub Pages).

```
.
├── index.html  about.html  donate.html  contact.html   ← the deliverable
├── assets/
│   ├── css/styles.css        design system + all components
│   ├── js/main.js            nav, reveals, counters, carousel, accordion,
│   │                         donation form, dotted map, clipboard, forms
│   └── img/                  logo + photography (2.4 MB total)
└── build/                    optional: partials + generator (see below)
```

## Design system

| Token | Value | Use |
| --- | --- | --- |
| `--green` | `#009C3C` | brand green, sampled from the AHM logo — fills, charts, icons |
| `--green-deep` | `#00762E` | buttons and the full-bleed green band (AA contrast with white text) |
| `--green-ink` | `#055E27` | green text on light surfaces |
| `--flame` | `#22D14B` | flame accent from the logo, used sparingly |
| `--forest-1/2` | `#0F2E1C` → `#1B4D2E` | footer gradient |
| `--cream` | `#F3EFE7` | page surface |
| `--beige` | `#E9E4D9` | cards |
| `--ink` / `--muted` | `#141414` / `#626262` | headings / body copy |

Type: **Anton** (condensed display, all-caps), **Inter** (body/UI), **Amiri**
(Arabic, rendered right-to-left with `dir="rtl"` and `lang="ar"`).
Spacing runs on a single scale (`--s-1` … `--s-10`); radii on `--r-sm` … `--r-xl`.

Every colour pair used for text meets WCAG AA (verified: body copy on beige
4.81:1, white on the green band 5.78:1, headings on cream 16:1).

## Editing the pages

The four HTML files are plain static pages — edit them directly if you prefer.

They were generated from `build/` so the navbar and footer only exist in one
place. If you edit the shared parts, regenerate with:

```bash
python3 build/build.py
```

`build/partials/` holds the head + navbar (`head.html`), footer (`foot.html`),
the Qur'an quote band (`quote.html`) and the "GIVE / HELP OTHERS" banner
(`cta.html`). `build/pages/` holds each page's body. **If you edit the root HTML
files directly, do not run the build script afterwards — it will overwrite them.**

## Placeholders to replace before launch

Everything the client has not yet supplied is wrapped in square brackets, e.g.
`[500+]`, `[Partner Name]`, `[info@ahmfoundation.org]`. Search the project for
`[` to find them all. The main ones:

- **Contact details** — phone, email, street address, office hours, RC/CAC number (footer + Contact page)
- **Numbers** — supporters, core programmes, thematic areas, partner networks, people reached, community programmes, chart data, allocation percentages
- **Partners** — the four partner categories each need a real organisation name and logo
- **People** — team names, roles and photographs on About → *Organisational structure*
- **Testimonials** — all quotes, names and roles are marked as placeholders
- **Bank details** — account name, number, bank and reference on the Donate page
- **Blog posts** — two sample cards on the Home page, with placeholder dates

## Connecting the forms

**Donation form** is currently **switched off** at the client's request. The
markup is intact in `donate.html` with a `hidden` attribute on its card —
delete that attribute to bring it back, and the two-column layout restores
itself. While it is off, the bank-transfer panel fills the container and the
hero's "Give Now" button points at `#bank-transfer` (point it back at
`#donate-form` when you re-enable the form).

When it is live, the form (`assets/js/main.js`, `initDonate`) collects amount,
currency, frequency, cause and donor details, then stops at a clearly marked
`PAYMENT INTEGRATION PLACEHOLDER` block with the payload assembled. Drop in
`PaystackPop.setup({ key: '[PAYSTACK_PUBLIC_KEY]', … })` or
`FlutterwaveCheckout({ public_key: '[FLW_PUBLIC_KEY]', … })` there.

**Contact and newsletter forms** are marked `data-demo-form`: they validate and
show a success message but send nothing. Point them at your inbox or form
service (Formspree, Netlify Forms, or your own endpoint) by giving each `<form>`
an `action` and `method` and removing `data-demo-form`.

**Map** — the Contact page has a rounded map placeholder. Replace the block
inside `.map-embed` with the Google Maps or OpenStreetMap `<iframe>`.

## Notes on the build

- **Logo**: `assets/img/logo-160.jpg` and `logo-512.jpg` are downscaled from the
  supplied artwork. It sits on light surfaces with `mix-blend-mode: multiply` so
  the white background disappears; in the footer it sits on a white chip. If you
  can supply a transparent PNG/SVG, swap the files and drop the blend mode.
- **Dotted world map**: generated in `main.js` from a land grid derived from a
  public-domain equirectangular world map. Africa is highlighted in brand green
  and Nigeria pinned. Below 820px the map frames Africa so the labels stay
  readable. Move the pin by editing `data-cell="row,col"` in `index.html`.
- **Photography**: the home-page hero collage and the Ramadan distribution
  photo are AHM's own images. The rest is Unsplash placeholder imagery (free to
  use, no attribution required) — replace it with AHM's own photographs as they
  become available.
  Keep the file names and the images will drop straight in. Sizes are already
  matched to their slots; all below-the-fold images are `loading="lazy"`.
- **Motion** — fade-ups, stat count-ups, slow image zooms, animated charts and
  the accordion all respect `prefers-reduced-motion`.
- **Accessibility** — semantic landmarks, one `<h1>` per page, skip link,
  labelled form controls, `aria-expanded`/`aria-controls` on the accordion and
  mobile menu, visible focus rings, alt text on every image.

## Local preview

```bash
python3 -m http.server 8777
```

Then open <http://127.0.0.1:8777/>.
