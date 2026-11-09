# Batch 11 preview: software connections, voice, and ops

Preview only. Not deployed. Not merged.

Base: the attached live zip for batch 10 (228 files). Compared with that zip, the only existing files that changed are `services.html`, `sitemap.xml`, `llms.txt`, and `integrations-automation.html`. Footer, Terms, Privacy, the chat widget, and `assets/chat-quiet.js` match that zip byte for byte.

Upload file: `alln1business-batch11-preview.zip` (243 files, flat layout, no `functions/`).

## New files and target keywords

| File | Catalog | Target keyword |
| --- | --- | --- |
| `ai-for-square-clover.html` | 3 Square and Clover | AI for Square and Clover Houston |
| `ai-for-toast.html` | 4 Toast | AI for Toast restaurants Houston |
| `ai-for-crm.html` | 7 HubSpot, Salesforce, Zoho, GoHighLevel | AI for HubSpot Salesforce Zoho GoHighLevel Houston |
| `ai-for-procore-buildertrend.html` | 10 Procore and Buildertrend | AI for Procore and Buildertrend Houston |
| `ai-for-erp.html` | 11 ERPs | AI for NetSuite and other ERPs Houston |
| `ai-for-property-software.html` | 13 Property management software | AI for AppFolio Buildium Houston |
| `ai-for-dental-medical-software.html` | 14 Dental and medical software | AI for Open Dental and Dentrix Houston |
| `ai-for-project-boards.html` | 15 Monday, Asana, ClickUp | AI for Monday Asana ClickUp Houston |
| `ai-for-payroll.html` | 16 Payroll apps | AI for Gusto ADP Paychex Houston |
| `order-status-line.html` | 32 Order status line | order status phone line Houston |
| `call-intelligence.html` | 35 Call Intelligence | call intelligence for Houston businesses |
| `receptionist-more-languages.html` | 36 More languages for the receptionist | Vietnamese Chinese Arabic AI receptionist Houston |
| `supplier-po-chaser.html` | 21 Supplier PO chaser | supplier purchase order confirmation Houston |
| `rfp-response.html` | 23 RFP response | RFP response assistant Houston |
| `data-cleanup.html` | 27 Data cleanup | data cleanup and migration Houston |

Each software page links back to `/integrations-automation`. That page now has a “Software it can connect to” section linking the nine software pages. Industry links go to salons, construction, property management, home services, or accounting where those pages exist. Restaurants do not have an industry page, so Toast links to supplier price alerts and the Google Business Profile page instead.

## Rules held

- No catalog prices. The $497 AI Audit line is the price on the new pages.
- No client stats or testimonials. Example days are labeled as examples.
- No “coming soon” lines.
- Copy says we connect to or work alongside the software. It says this is not a partnership, and that vendor access is confirmed in the audit. Toast, Procore, Buildertrend, AppFolio, Dentrix, Gusto, ADP, and Paychex are called out that way because those vendors limit connections.
- Dental and medical software says HIPAA-ready vendors and a signed BAA are required, and that this is not medical advice.
- Payroll says a person approves before anything is paid or filed, and that this is not tax advice.
- Order status, call intelligence, and more languages say the voice path is set up for you and is not live on the page. Callers must be told when calls are recorded. Texting pages say carrier approval is required.
- RFP responses are not submitted until a person signs off. A lawyer reviews contract terms. This is not legal advice.
- Data cleanup does not overwrite a live system until a person approves the import.
- Brand orange on the main button is `rgb(240, 88, 40)`.

## Checks

- Internal links: 4,953 `href`s on the preview site resolve to a file in the zip. None missing.
- Each new page has one H1, a canonical URL, Open Graph tags, Service JSON-LD, and FAQPage JSON-LD.
- Chat widget `6af0b754e90adeca202e170c` appears once on each new page, and still once on the integrations page.
- Footer line remains “Alln1 Business, a DBA of Elizabeth Martinez, 8236 Dover St, Houston, TX 77061”.
- Served locally. No horizontal overflow at 390px or 1280px on the two sample pages.

## Sample screenshots

- Open Dental and Dentrix: `batch11_dental_mobile.png`, `batch11_dental_desktop.png`
- Order status line: `batch11_order_mobile.png`, `batch11_order_desktop.png`
