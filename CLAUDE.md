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

**Consent-gated marketing scripts** (`build/src/js/consent.js`, referenced from `index.html`): Google Ads / Meta Pixel `<script>` tags in `<head>` are inert (`type="text/plain" data-consent="marketing"`) and only get swapped for real, executing `<script>` tags by `consent.js` after the user accepts the cookie banner. Google Consent Mode v2 defaults (`ad_storage`/`analytics_storage`/etc. all `denied`) are set inline in `<head>` before Tag Manager loads, and `consent.js` calls `gtag('consent', 'update', ...)` on accept/reject. This exists for Colombian Habeas Data (Ley 1581 de 2012) and SIC cookie-consent compliance — don't make marketing scripts fire before consent.

**Content still pending real data** (grep for `TODO`/`PLACEHOLDER` in `dist/`): Google Ads conversion ID (`AW-XXXXXXXXXX`), GA4 ID, Meta Pixel ID, 5 of 6 gallery photos, all 3 testimonials, and legal-page business details (razón social, NIT, contact email) are intentionally left as placeholders/TODOs rather than invented — do not fabricate values for these.

**Deployment model**: this is a subfolder bolted onto an existing WordPress install, not a standalone site. `dist/tapetes-atrapamugres-pvc/robots.txt` and the in-folder `sitemap.xml` are functional for that subpath, but the domain-root `robots.txt`/`llms.txt` (which WordPress/Yoast owns) must be edited separately using the content in `dist/PARA-RAIZ-DEL-DOMINIO/` — see `dist/INSTRUCCIONES-DESPLIEGUE.txt` for the exact steps (Hostinger File Manager upload, WordPress menu link, Search Console). CSP in `.htaccess` is intentionally permissive (`'unsafe-inline'`) because this static site has no backend to generate per-request nonces.
