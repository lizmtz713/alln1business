# Batch 8 preview: trades and salons

Preview only. Not deployed. Not merged.

Base: the attached live zip for deploy `d002b36f` (179 files). Compared with that zip, the only existing files that changed are `services.html`, `sitemap.xml`, and `llms.txt`. Footer, Terms, Privacy, the chat widget, and `assets/chat-quiet.js` are byte-for-byte the same.

Upload file: `alln1business-batch8-preview.zip` (195 files, flat layout, no `functions/`).

## New files and target keywords

| File | Catalog | Target keyword |
| --- | --- | --- |
| `marketplace-lead-responder.html` | 113 Marketplace lead auto-responder | marketplace lead response Houston home services |
| `maintenance-plan-renewals.html` | 118 Maintenance-plan renewals and seasonal tune-ups | HVAC maintenance plan renewal Houston |
| `estimate-esign-deposit.html` | 127 Estimate e-sign, deposit and unsigned follow-up | estimate e-sign and deposit Houston contractors |
| `on-my-way-texts.html` | 131 On-my-way texts with the tech’s photo | on my way texts technician photo Houston |
| `permit-inspection-tracker.html` | 100 Permit and inspection tracker | permit and inspection tracker Houston contractors |
| `change-order-capture.html` | 105 Change order capture and approval | change order approval Houston contractors |
| `insurance-supplement-tracker.html` | 106 Insurance supplement tracker | insurance supplement tracker Houston roofing |
| `hurricane-flood-mode.html` | 94 Hurricane and Flood Mode | hurricane and flood preparation Houston home services |
| `dispatch-route-planner.html` | 29 Dispatch and route planner | dispatch and route planning Houston service fleets |
| `crew-translator.html` | 95 Crew Translator | Spanish crew voice notes to English quotes Houston |
| `rebook-nudges.html` | 120 Rebook nudges by service cycle | salon rebook reminders Houston |
| `cancellation-waitlist.html` | 129 Cancellation waitlist backfill | salon cancellation waitlist Houston |
| `no-show-follow-up.html` | 130 Class and appointment no-show follow-up | salon no-show follow-up Houston |
| `salon-deposits-no-show-fees.html` | 138 Deposits and no-show fees | salon deposits and no-show fees Houston |
| `salon-loyalty-birthday-gift-cards.html` | 117 Loyalty, birthday and gift card nudges | salon loyalty birthday gift card reminders Houston |
| `ai-for-salons-barbers.html` | New industry page | AI for Houston salons and barbers |

There was no salon or beauty industry page. `ai-for-salons-barbers.html` uses the same header, footer, chat widget, and section styling as the other service pages, with the same kind of industry sections as home services (who it is for, problems, a labeled fictional example, related systems, FAQ, and the $497 audit). It does not include a “coming soon” video block. It links the five salon pages plus booking reminders, review requests, customer reactivation, and website chat.

The ten trade pages link to `ai-for-home-services.html` and to related batch 7 or existing pages. The five salon pages link to the new salon industry page.

## Also updated

- `services.html`: the 15 cards are in the automation catalog, with no catalog prices. Salons and barbers is listed with the other industry pages.
- `sitemap.xml`: the 16 new URLs, lastmod 2026-11-09.
- `llms.txt`: the salon industry line next to home services, and the 15 automation lines.

## Rules held

- No catalog setup or monthly prices. The existing $497 AI Audit line is the only price on the new pages. The salon industry card says “Start with the $497 AI Audit” instead of inventing a stage price.
- No client stats or testimonials. Day-in-the-life sections are labeled as examples.
- No “coming soon” lines.
- Texting is described as set up for you, not as live. Pages that can text say carrier approval is required. Email is named where it works without that step. WhatsApp on the crew translator notes WhatsApp’s own approval.
- Bank and deposit pages say you set the price or the policy, and that we do not hold or move the money.
- Brand orange on the main button is `rgb(240, 88, 40)`.

## Checks

- Internal links: 3,630 `href`s on the preview site resolve to a file in the zip. None missing.
- Each new page has one H1, canonical URL, Open Graph tags, Service JSON-LD, and FAQPage JSON-LD.
- Chat widget `6af0b754e90adeca202e170c` appears once on each new page.
- Footer line remains “Alln1 Business, a DBA of Elizabeth Martinez, 8236 Dover St, Houston, TX 77061”.
- Served locally. No horizontal overflow at 390px or 1280px on the two sample pages.

## Sample screenshots

- On-my-way texts: `batch8_onmyway_mobile.png`, `batch8_onmyway_desktop.png`
- Salon rebook reminders: `batch8_rebook_mobile.png`, `batch8_rebook_desktop.png`
