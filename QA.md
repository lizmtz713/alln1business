# Richer page preview: receptionist and trades hub

Preview only. Not deployed. Not merged.

Base: the attached live zip for batch 13 (273 files, deploy b635a8a5). Footer, Terms, Privacy, `faq.html`, the chat widget, and `assets/chat-quiet.js` match that zip from the footer downward, and Terms, Privacy, `faq.html`, and `chat-quiet.js` are byte-for-byte unchanged.

`ai-for-home-services.html` is the trades industry page. No other file was the trades hub, so that URL was rebuilt in place.

## Word counts

Visible words inside `<main>`, header and footer excluded.

| Page | Before | After |
| --- | --- | --- |
| `ai-phone-receptionist.html` | 525 | 2,496 |
| `ai-for-home-services.html` | 1,370 | 2,409 |

## Statistics used

None of these are Alln1 client results.

| Figure | Source | Where used |
| --- | --- | --- |
| 27% of calls to home services businesses were not answered | [Invoca, May 23, 2024](https://www.invoca.com/blog/how-much-missed-sales-calls-cost-home-services-businesses), its research | Receptionist and trades hub |
| Less than 3% of callers sent to voicemail left a message | Same Invoca article, its platform data | Receptionist and trades hub |
| 98% of U.S. adults own a cellphone; 91% own a smartphone | [Pew Research Center, mobile fact sheet, 2026](https://www.pewresearch.org/internet/fact-sheet/mobile/), survey January 30 to June 18, 2026 | Receptionist |
| 60% of quiz takers preferred a text over a call | [AT&T Connection Quiz, updated May 1, 2024](https://about.att.com/story/2024/phone-behavior-quiz.html). A quiz, not a random sample | Receptionist, with that caveat in the copy |
| 10,012 private plumbing, heating, and air-conditioning establishments in Texas, 2025 annual average | [BLS QCEW ENU4800020523822](https://data.bls.gov/timeseries/ENU4800020523822), NAICS 23822 | Trades hub, and the receptionist sources list |
| 121,180 employees in that same Texas industry, 2025 annual average | [BLS QCEW ENU4800010523822](https://data.bls.gov/timeseries/ENU4800010523822) | Trades hub, and the receptionist sources list |
| Of 466 home services companies shopped with forms and appointment requests, 40% never responded within five days | [Valve+Meter, The State of Speed to Lead in Home Services, 2024](https://valveandmeter.com/wp-content/uploads/2024/03/VM_Speed2Lead.pdf) | Trades hub. This is form response, not phone answer rate |

Numbers from those reports that were dollar projections, or that the PDF text did not render cleanly, were left out.

## Price removal

Every visible dollar amount other than the $497 AI Audit was removed, including `(from $X)` lines, industry-tier prices, `/mo` care prices, Black Friday strikethrough dollar amounts, meta descriptions, and JSON-LD offer prices. The shared offer catalog on each affected page no longer carries a price except the audit offer. `faq.html` still contains older prices because that file was left untouched on purpose.

Files changed:

- `about.html`
- `ad-spend-copilot.html`
- `after-hours-emergency-dispatch.html`
- `after-job-check-in.html`
- `agent-ready-store.html`
- `ai-accounts-payable.html`
- `ai-accounts-receivable.html`
- `ai-agent-systems.html`
- `ai-audit.html`
- `ai-cash-flow-forecast.html`
- `ai-email-drafts.html`
- `ai-financial-reports.html`
- `ai-for-accounting-firms.html`
- `ai-for-bookkeeping-firms.html`
- `ai-for-construction-development.html`
- `ai-for-crm.html`
- `ai-for-dental-medical-software.html`
- `ai-for-erp.html`
- `ai-for-home-services.html`
- `ai-for-insurance-agencies.html`
- `ai-for-law-firms.html`
- `ai-for-payroll.html`
- `ai-for-procore-buildertrend.html`
- `ai-for-project-boards.html`
- `ai-for-property-management.html`
- `ai-for-property-software.html`
- `ai-for-quickbooks.html`
- `ai-for-real-estate-agents.html`
- `ai-for-salons-barbers.html`
- `ai-for-square-clover.html`
- `ai-for-tax-firms.html`
- `ai-for-toast.html`
- `ai-for-xero.html`
- `ai-growth-systems.html`
- `ai-job-costing.html`
- `ai-month-end-close.html`
- `ai-ops-infrastructure.html`
- `ai-phone-receptionist.html`
- `ai-ready-business-launch.html`
- `ai-revenue-systems.html`
- `ai-safe-use-policy.html`
- `ai-search-visibility.html`
- `ai-tax-organizer.html`
- `ai-three-way-matching.html`
- `ai-training-workshops.html`
- `application-red-flag-check.html`
- `bank-reconciliation.html`
- `bilingual-ai.html`
- `bilingual-handbook.html`
- `bilingual-safety-talks.html`
- `booking-reminders.html`
- `budget-vs-actual.html`
- `business-credit-applications.html`
- `call-intelligence.html`
- `cancellation-waitlist.html`
- `cash-application.html`
- `certificate-request-desk.html`
- `change-order-capture.html`
- `chargeback-evidence.html`
- `chart-of-accounts-cleanup.html`
- `chat-with-your-numbers.html`
- `churn-warning.html`
- `coi-license-tracker.html`
- `company-brain.html`
- `competitor-watch.html`
- `connect-chatgpt-claude.html`
- `content-batch.html`
- `crew-translator.html`
- `custom-ai-assistants.html`
- `customer-reactivation.html`
- `customer-rescue.html`
- `data-cleanup.html`
- `dispatch-route-planner.html`
- `duplicate-invoice-audit.html`
- `ecommerce-ai-workflows.html`
- `equipment-maintenance-predictor.html`
- `estimate-esign-deposit.html`
- `expense-receipt-checker.html`
- `failed-payment-recovery.html`
- `field-service-ai-workflows.html`
- `fixed-asset-tracker.html`
- `google-business-profile-manager.html`
- `google-lead-rating.html`
- `google-workspace-ai-workflows.html`
- `government-bid-finder.html`
- `how-it-works.html`
- `hurricane-flood-mode.html`
- `inbound-lead-research.html`
- `inbox-triage.html`
- `index.html`
- `insurance-claim-packet.html`
- `insurance-cross-sell.html`
- `insurance-renewal-remarketing.html`
- `insurance-supplement-tracker.html`
- `integrations-automation.html`
- `inventory-costing.html`
- `inventory-forecast.html`
- `invoice-receipt-reader.html`
- `jobsite-photo-reports.html`
- `launch.html`
- `lead-follow-up.html`
- `lease-renewal-outreach.html`
- `lender-reporting.html`
- `listing-launch-kit.html`
- `llms.txt`
- `local-seo-content-engine.html`
- `maintenance-plan-renewals.html`
- `maintenance-work-orders.html`
- `managed-ai-ops.html`
- `marketplace-lead-responder.html`
- `meeting-notes-tasks.html`
- `membership-renewal.html`
- `microsoft-365-ai-workflows.html`
- `missed-call-textback.html`
- `multi-entity-consolidation.html`
- `nameplate-reader.html`
- `new-hire-onboarding.html`
- `no-show-follow-up.html`
- `on-my-way-texts.html`
- `one-inbox.html`
- `order-status-line.html`
- `owner-daily-briefing.html`
- `paper-digitizer.html`
- `permit-inspection-tracker.html`
- `photo-inspection-report.html`
- `photo-to-quote.html`
- `portal-runner.html`
- `private-ai.html`
- `product-catalog-builder.html`
- `quality-inspection.html`
- `quote-proposal.html`
- `rebook-nudges.html`
- `receptionist-more-languages.html`
- `referral-tracker.html`
- `rent-reminders.html`
- `rental-inquiry-scheduler.html`
- `restaurant-phone-ordering.html`
- `retainage-tracker.html`
- `review-requests.html`
- `rfp-response.html`
- `rfq-spec-estimator.html`
- `sales-tax-watch.html`
- `salon-deposits-no-show-fees.html`
- `salon-loyalty-birthday-gift-cards.html`
- `service-due-reminders.html`
- `services.html`
- `shelf-counter.html`
- `shift-time-off.html`
- `showing-feedback.html`
- `sop-builder.html`
- `spanish-outgoing-messages.html`
- `spreadsheet-dashboard.html`
- `starter-plan-brand.html`
- `supplier-po-chaser.html`
- `supplier-price-alerts.html`
- `text-opt-out-sync.html`
- `text-to-pay.html`
- `training-coach.html`
- `trec-contract-deadlines.html`
- `unfinished-booking-recovery.html`
- `voice-appointment-confirm.html`
- `voice-daily-logs.html`
- `w9-1099-readiness.html`
- `warranty-returns.html`
- `website-chat.html`
- `whatsapp-ai.html`
- `wheres-my-job.html`
- `win-loss.html`

## Checks

- Internal links: 5,842 `href`s on the preview resolve to a file in the zip. None missing.
- Both sample pages have one H1, a canonical URL, Open Graph tags, Service JSON-LD, BreadcrumbList, and FAQPage JSON-LD. No video block and no “coming soon”.
- Chat widget `6af0b754e90adeca202e170c` appears once. Footer line remains “Alln1 Business, a DBA of Elizabeth Martinez, 8236 Dover St, Houston, TX 77061”.
- Served locally. No horizontal overflow at 390px or 1280px on either sample page.
- Upload zip: `alln1business-richer-preview.zip` (273 files, flat, no `functions/`).

## Screenshots

- Receptionist top: `rich_ai-phone-receptionist_top_phone.png`, `rich_ai-phone-receptionist_top_desktop.png`
- Receptionist steps: `rich_ai-phone-receptionist_mid_phone.png`, `rich_ai-phone-receptionist_mid_desktop.png`
- Trades hub top: `rich_ai-for-home-services_top_phone.png`, `rich_ai-for-home-services_top_desktop.png`
- Trades starter set: `rich_ai-for-home-services_mid_phone.png`, `rich_ai-for-home-services_mid_desktop.png`
