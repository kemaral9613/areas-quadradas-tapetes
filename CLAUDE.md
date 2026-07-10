# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

A single static (HTML/CSS/JS, no backend, no framework) landing page for **Áreas Quadradas**, a Colombian company, selling personalized PVC dirt-trapping mats ("tapetes atrapamugre"). It is built for Google Ads / Facebook Ads campaigns and is meant to be uploaded as-is via Hostinger's File Manager into a subfolder of an existing WordPress site — it does **not** run on Node/WordPress in production; Node is only used locally to compile assets.

- `build/` — local-only build tooling (Tailwind CLI, Terser). Never deployed.
- `dist/tapetes-atrapamugres-pvc/` — the actual deployable site. Everything here is uploaded verbatim to `public_html/tapetes-atrapamugres-pvc/` on the live host.
- `dist/PARA-RAIZ-DEL-DOMINIO/` — files that must instead be placed at the *domain root* (`public_html/`), not in the subfolder, because `llms.txt`/`robots.txt` only work at origin root. Read `dist/INSTRUCCIONES-DESPLIEGUE.txt` (Spanish) for the full deployment checklist.
- `Logo-areas-cuadradas.webp`, `banner-tapete-atrapamugre.webp` — source brand/product images (banner is AI-generated, not real customer photos).
- `design-tokens.json` — reference-only palette/typography/component-naming spec from a prior sibling project; the values are what `build/src/input.css`'s `@theme` block is based on.

## Build commands

There are no npm scripts; everything is invoked directly via `npx` from inside `build/`.

**Compile CSS (Tailwind v4, CSS-first config via `@theme`/`@source` in `input.css`, no `tailwind.config.js`):**
```bash
cd build
npx @tailwindcss/cli -i src/input.css -o ../dist/tapetes-atrapamugres-pvc/assets/css/style.min.css --minify
```

**Minify JS (run once per source file after editing):**
```bash
cd build
npx terser src/js/main.js -o ../dist/tapetes-atrapamugres-pvc/assets/js/main.min.js --compress --mangle
npx terser src/js/consent.js -o ../dist/tapetes-atrapamugres-pvc/assets/js/consent.min.js --compress --mangle
```

**Serve locally for testing** (never open `index.html` via `file://` — relative asset paths need a real server):
```bash
cd dist/tapetes-atrapamugres-pvc
python -m http.server 8099
```
Then open `http://localhost:8099/index.html`. To view from a phone on the same Wi-Fi, use the machine's LAN IP (`Get-NetIPAddress` in PowerShell) instead of `localhost`.

**Regenerate images from source assets** (Python + Pillow, run from repo root):
```bash
python build/process_images.py   # hero srcset (400/700/1024w), og-image.jpg, product crops, favicons
python build/crop_colores.py     # crops the 20 color-swatch textures from a reference photo into scratch PNGs
python build/process_colores.py  # resizes/converts those crops into dist/.../assets/img/colores/*.webp
```
There is no test suite and no linter configured in this repo.

## Architecture

**Source of truth vs. compiled output**: Never hand-edit `dist/tapetes-atrapamugres-pvc/assets/css/style.min.css` or `assets/js/*.min.js` — edit `build/src/input.css` / `build/src/js/*.js` and recompile. `dist/tapetes-atrapamugres-pvc/index.html` (and the 3 legal pages) *are* hand-edited directly; there's no templating layer.

**Tailwind v4 setup**: `build/src/input.css` has no separate config file — theming lives in an `@theme` block (colors: `brand`/`accent`/`secondary` scales, fonts, shadows) and content scanning is pointed at the deployed HTML via `@source "../../dist/tapetes-atrapamugres-pvc/**/*.html";` (the site lives outside the npm project root, which is why this directive is required — do not add `--cwd` to the CLI invocation, it breaks relative path resolution). All custom component classes (buttons, header/nav, hero, selector card, FAQ accordion, cookie banner, etc.) live in one `@layer components` block; a few global resets live in `@layer base`, including `body { overflow-x: hidden }` and `html { overflow-x: hidden }` — both are required together because `html`, not `body`, is the actual scrolling root, and removing either re-introduces a horizontal-overflow bug from the off-canvas mobile menu (see below).

**Hero section pattern** (`.hero-section`/`.hero-media`/`.hero-actions` in `input.css`, markup in `index.html`): a full-bleed background image with text overlaid via a sibling `position:relative` container, using the *same* `.container-max` (max-width 80rem, centered, padding-inline 1.25rem) as `.hero-actions` below it so the headline and the CTA buttons stay left-aligned with each other. `.hero-actions` is pulled up over the image via `margin-top: -160px` on desktop only (`min-width: 1024px`); on mobile it flows normally beneath the image. When adjusting hero spacing/alignment, always change both the text container and `.hero-actions` together or they'll drift apart.

**Cascade-layer gotcha**: Tailwind's `@layer base` has lower precedence than `@layer components` regardless of selector specificity. A global `h1,h2,h3,h4 { color: ... }` base rule can silently override a color you set on a nested `<span>`, because the base rule sets color directly on the element while the "correct" color is only inherited from a further-up components-layer container. Fix by setting the wanted color directly on the components-layer class closest to the element, not by fighting specificity.

**CSS Grid overflow gotcha**: any hand-written `grid-template-columns: repeat(N, 1fr)` in this codebase must be `repeat(N, minmax(0, 1fr))` instead (see `.color-grid`). Plain `1fr` lets a grid item's intrinsic content (e.g. an `<img>` with real pixel dimensions) force the track wider than its share, overflowing the whole page horizontally on narrow viewports. Tailwind's own `grid-cols-N` utilities already do this correctly — the gotcha only applies to custom grid rules added in `input.css`.

**Interactive mat selector** (`#elige-tu-tapete` in `index.html`, `.selector-card`/`.traffic-option`/`.color-grid`/`.color-option` in `input.css`, wired up in `main.js`): two independent button groups (traffic type: medio/pesado; color: 20 swatches cropped from `assets/img/colores/`) that build a `wa.me` deep link with a pre-filled message once both are selected; the WhatsApp CTA stays `.is-disabled` (inert, `aria-disabled`) until both selections are made. Selection state is plain JS in a closure, no framework/store.

**Consent Mode v2, *advanced* (not basic)** (`build/src/js/consent.js`, `<head>` of all 4 HTML pages): two different mechanisms, do not conflate them.

- **Google tag (`gtag.js`) loads unconditionally**, immediately after `<meta charset>`. It is preceded by an inline `gtag('consent','default', …)` block setting `ad_storage`/`ad_user_data`/`ad_personalization`/`analytics_storage` to `denied`. Before consent it therefore writes **no cookies** and sends anonymous cookieless pings (`gcs=G100`, `npa=1`, `pscdl=denied`) to `pagead2.googlesyndication.com` / `www.google-analytics.com`. `consent.js` calls `gtag('consent','update', …)` on accept, flipping traffic to `gcs=G111` and the cookie-bearing endpoints. **This is intentional and Habeas Data-compliant** — do not "fix" it by making the tag inert.
- **Meta Pixel stays fully gated** (`type="text/plain" data-consent="marketing"`), swapped for a real executing `<script>` by `consent.js` only after accept. Meta has no Consent Mode equivalent, so blocking is the only option.

One loader, two destinations: `gtag/js?id=G-C7568M44RJ` (GA4) then `gtag('config', …)` for both GA4 and `AW-11548598729` (Ads). **The loader must use the `G-` ID**: gtag.js only fetches container config for the ID in the URL, so loading with `?id=AW-…` silently makes the GA4 `config` a no-op (verified — GA4 sent zero requests).

**Google Ads conversion tracking** (event snippets in `<head>` of `index.html`, wiring in `build/src/js/main.js`): Google hands out both event snippets with the *same* function name `gtag_report_conversion`, and only the last one defined survives. They are renamed here to `gtag_report_conversion_whatsapp` / `gtag_report_conversion_llamada`. `main.js` has one delegated `click` listener on `document` (delegated because `#selector-whatsapp-btn` rewrites its `href` at runtime, and because a `.is-disabled` guard must skip the inert selector button):

- `tel:` links → `gtag_report_conversion_llamada(href)` + `preventDefault()`; the `event_callback` performs the navigation, as Google intends.
- `wa.me` links → `gtag_report_conversion_whatsapp()` **with no argument** and no `preventDefault`. Passing the url would make `window.location = url` hijack the current tab, destroying the `target="_blank"` behaviour of all 7 WhatsApp links.

Conversions send only `send_to` — no `value`/`currency`, deliberately (actions are configured "no value" in the Ads UI). Event snippets live **only in `index.html`**; the lone `wa.me` link in `politica-de-tratamiento-de-datos.html` is for exercising Habeas Data rights and must never count as a lead.

**Content still pending real data** (grep for `TODO`/`PLACEHOLDER` in `dist/`): Meta Pixel ID (`000000000000000`), 5 of 6 gallery photos, and legal-page business details (razón social, NIT, contact email) are intentionally left as placeholders/TODOs rather than invented — do not fabricate values for these. Google Ads (`AW-11548598729`), its two conversion labels, and GA4 (`G-C7568M44RJ`) are real and live.

**Deployment model**: this is a subfolder bolted onto an existing WordPress install, not a standalone site. `dist/tapetes-atrapamugres-pvc/robots.txt` and the in-folder `sitemap.xml` are functional for that subpath, but the domain-root `robots.txt`/`llms.txt` (which WordPress/Yoast owns) must be edited separately using the content in `dist/PARA-RAIZ-DEL-DOMINIO/` — see `dist/INSTRUCCIONES-DESPLIEGUE.txt` for the exact steps (Hostinger File Manager upload, WordPress menu link, Search Console). CSP in `.htaccess` is intentionally permissive on `'unsafe-inline'` because this static site has no backend to generate per-request nonces, but it is a strict **host allowlist** everywhere else, and Google's tags need a surprising number of hosts. Two gotchas learned the hard way:

- `frame-src` is required (Ads' conversion linker injects iframes); without it `default-src 'self'` blocks them silently.
- Google Ads routes pings to the country domain (`www.google.com.co/ads/ga-audiences`, observed live). CSP forbids wildcards to the right of a host, so each `google.<TLD>` must be listed explicitly.

The CSP cannot be tested with `python -m http.server` — only Apache applies `.htaccess`. To exercise it locally, serve `dist/` from a script that reads the header out of `.htaccess` and injects it, then in the browser attach a `securitypolicyviolation` listener. **Always run a positive control** (e.g. `fetch('https://example.com')`, which must be blocked) before concluding "no violations" — otherwise you are only proving the header never applied.
