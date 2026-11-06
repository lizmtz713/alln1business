# Alln1 inquiry form — PREVIEW (Nov 6, 2026)
Preview: https://inquiry-form.alln1business.pages.dev/contact  (deployment 67708b7d, branch inquiry-form, env preview)
Production untouched: canonical deployment f3183803; alln1business.com/contact = 404.
Build: python3 build_inquiry_form.py -> dist-inquiry-form/ (includes _worker.js + _routes.json from functions/api/inquiry.js)
Deploy scripts: /workspace/alln1-inquiry-form-preview-deploy3.js.txt (manifest-only deploy), /workspace/alln1-inquiry-upload.py (asset upload from box using upload-token JWT; the execute sandbox's fetch gets 8000013 on /pages/assets/*)
Make: scenario 5026642 "Alln1 Inquiry Form (preview)" — webhook (MAKE_WEBHOOK_URL, not stored in this repo) -> demo Sheet row -> alert to liz@alln1business.com only. OFF.
Preview env vars on the Pages project (preview only): MAKE_WEBHOOK_URL (secret), TURNSTILE_SECRET (secret), TURNSTILE_SITEKEY, SOURCE_LABEL. Production env: none.
Turnstile widget "Alln1 inquiry form", sitekey 0x4AAAAAAF2R--JxlPkRre3n, domains alln1business.com + alln1business.pages.dev, free/managed.
