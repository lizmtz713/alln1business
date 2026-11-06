# Alln1 Business website

Static site for [alln1business.com](https://alln1business.com), deployed to the Cloudflare Pages project `alln1business`.

This branch is the website only. It is separate from the app on `main`.

## Layout

- `index.html`, `about.html`, `services.html`, `faq.html`, `launch.html`, `locations/` — current pages
- Short service URLs such as `missed-call-textback.html` — noindex redirects to `/services`
- `styles.css`, `favicon.svg`, `assets/` — shared styles and images
- `_redirects`, `robots.txt`, `sitemap.xml` — Pages routing and SEO
- `build.py` — earlier page generator
- `build_v2.py` — production page generator
- `build_inquiry_form.py` — writes `dist-inquiry-form/` (contact, privacy, thanks, and a bundled worker)
- `functions/api/inquiry.js` — `POST /api/inquiry` (Turnstile check, then Make)
- `functions/api/lead.js` — `POST /api/lead` for the homepage inquiry form
- `about_body.html.tpl`, `about_css.txt` — about-page source fragments
- `INQUIRY-FORM-PREVIEW.md` — notes on the inquiry-form preview

`shots/` and `dist-inquiry-form/` are not in git. Rebuild the inquiry-form output; keep screenshots local.

## Build order

```bash
python3 build_v2.py
python3 build_inquiry_form.py
```

`build_v2.py` refreshes the marketing pages. It reads the previous homepage from a local backup at `alln1-deploy-backup-20261105-190045-before-v2` (that folder is not in this repo). It keeps that inquiry form, swaps in the current service list, and points the submit script at `/api/lead`.

`build_inquiry_form.py` copies the built pages into `dist-inquiry-form/`. It replaces the inline inquiry form with a link to `/contact`, adds `/contact`, `/privacy`, and `/thanks`, and writes `_worker.js` from `functions/api/inquiry.js`. It does not modify the source HTML.

## Environment variables

Set these on the Pages project, or in `.dev.vars` for local Wrangler. Names only — do not commit values.

| Name | Where it is read |
| --- | --- |
| `MAKE_WEBHOOK_URL` | `functions/api/inquiry.js`, `functions/api/lead.js` |
| `TURNSTILE_SECRET` | `functions/api/inquiry.js` |
| `TURNSTILE_SITEKEY` | Optional. `build_inquiry_form.py` uses it for the contact widget. If unset, the script keeps the public site key already in the file. |
| `SOURCE_LABEL` | Optional. `functions/api/inquiry.js` |

```bash
npx wrangler pages secret put MAKE_WEBHOOK_URL --project-name alln1business
npx wrangler pages secret put TURNSTILE_SECRET --project-name alln1business
```

## Deploy

Pages Functions live in `functions/` at the project root (not inside a `dist` folder). Publish them with Wrangler:

```bash
npx wrangler pages deploy . --project-name alln1business
```

For the inquiry-form output, which carries `_worker.js` (advanced mode) instead of the `functions/` directory:

```bash
npx wrangler pages deploy dist-inquiry-form --project-name alln1business
```

Dashboard drag-and-drop does not install Pages Functions. Without a Wrangler deploy (or a Git-connected Pages project), `/api/inquiry` and `/api/lead` are not there, so Turnstile verification and the Make forward do not run.
