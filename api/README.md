# API routes

Optional serverless endpoints. Set `OPENAI_API_KEY` on the server for both.

---

## Voice-to-Data — `POST /api/voice-to-data`

For universal voice input. Request: `{ "text": "..." }` or `{ "audio": "<base64>" }`.  
Response: `{ "category": "bill", "fields": { ... } }`.

App env: `EXPO_PUBLIC_VOICE_API_URL=https://your-deployment.vercel.app/api/voice-to-data`

---

## Scan Document — `POST /api/scan-document`

For photo scanning (bills, ID, insurance card, receipt, vet record, report card). Uses GPT-4o Vision.

- **Request:** `{ "image": "<base64-encoded image>" }`
- **Response:** `{ "documentType": "bill" | "id_document" | "insurance_card" | "receipt" | "vet_record" | "report_card" | "other", "fields": { ... } }`

App env: `EXPO_PUBLIC_SCAN_API_URL=https://your-deployment.vercel.app/api/scan-document`

If not set, the app uses `EXPO_PUBLIC_OPENAI_API_KEY` and calls the Vision API from the client.
