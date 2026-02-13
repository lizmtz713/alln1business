# API routes

Optional serverless endpoints. Set `OPENAI_API_KEY` on the server for both.

---

## Voice-to-Data — `POST /api/voice-to-data`

For universal voice input. Request: `{ "text": "..." }` or `{ "audio": "<base64>" }`.  
Response: `{ "category": "bill", "fields": { ... } }`.

App env: `EXPO_PUBLIC_VOICE_API_URL=https://your-deployment.vercel.app/api/voice-to-data`

---

## Voice Onboarding — `POST /api/voice-onboarding`

For conversational voice-guided setup (household → pets → bills → review).

- **Request:** `{ "step": "household"|"pets"|"bills"|"review", "collected": { "members": [], "pets": [], "bills": [] }, "userMessage": "transcript of what the user said" }`
- **Response:** `{ "aiReply": "...", "extracted": { "members": [], "pets": [], "bills": [] }, "nextStep": "household"|"pets"|"bills"|"review" }`

If this URL is not set, the app uses `EXPO_PUBLIC_OPENAI_API_KEY` and calls the same logic from the client.

---

## Scan Bill — `POST /api/scan-bill`

Dedicated extraction for bills and receipts (provider, amount, due date, account, service period, line items).

- **Request:** `{ "image": "<base64 string>" }`
- **Response:** `{ "documentType": "bill" | "receipt", "fields": { "provider_name", "amount", "due_date", "account_number", "service_period_start", "service_period_end", "line_items": [...], ... } }`

App can use `EXPO_PUBLIC_SCAN_API_URL` (same host, path `/api/scan-bill`) or `EXPO_PUBLIC_SCAN_BILL_API_URL`; if unset, uses `EXPO_PUBLIC_OPENAI_API_KEY` client-side.

---

## Scan Document — `POST /api/scan-document`

For photo scanning (bills, ID, insurance card, receipt, vet record, report card). Uses GPT-4o Vision.

- **Request:** `{ "image": "<base64-encoded image>" }`
- **Response:** `{ "documentType": "bill" | "id_document" | "insurance_card" | "receipt" | "vet_record" | "report_card" | "other", "fields": { ... } }`

App env: `EXPO_PUBLIC_SCAN_API_URL=https://your-deployment.vercel.app/api/scan-document`

If not set, the app uses `EXPO_PUBLIC_OPENAI_API_KEY` and calls the Vision API from the client.
