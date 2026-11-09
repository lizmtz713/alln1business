# Batch 9 preview: insurance agencies and accounting

Preview only. Not deployed. Not merged.

Base: the attached live zip for deploy `4713ba8f` (195 files). Compared with that zip, the only existing files that changed are `services.html`, `sitemap.xml`, and `llms.txt`. Footer, Terms, Privacy, the chat widget, and `assets/chat-quiet.js` match that zip byte for byte.

Upload file: `alln1business-batch9-preview.zip` (211 files, flat layout, no `functions/`).

## New files and target keywords

| File | Catalog | Target keyword |
| --- | --- | --- |
| `insurance-renewal-remarketing.html` | 122 Renewal remarketing | insurance renewal remarketing Houston |
| `insurance-cross-sell.html` | 123 Cross-sell (account rounding) | insurance cross-sell account rounding Texas |
| `certificate-request-desk.html` | 111 Certificate request desk | insurance certificate requests Houston agencies |
| `cash-application.html` | 73 Cash Application | cash application for Houston distributors |
| `budget-vs-actual.html` | 75 Budget vs actual in plain English | budget vs actual plain English Houston |
| `expense-receipt-checker.html` | 77 Expense policy and receipt checker | expense policy and receipt checker Houston |
| `duplicate-invoice-audit.html` | 78 Duplicate invoice and vendor list audit | duplicate invoice and vendor audit Houston |
| `w9-1099-readiness.html` | 79 W-9 collection and 1099 readiness | W-9 collection and 1099 readiness Texas |
| `sales-tax-watch.html` | 80 Sales tax watch | Texas sales tax watch for small business |
| `business-credit-applications.html` | 90 Business credit application processor | business credit applications Houston distributors |
| `chargeback-evidence.html` | 91 Chargeback evidence packet builder | chargeback evidence packets Houston |
| `text-to-pay.html` | 136 Text-to-pay links | text to pay links Houston service business |
| `failed-payment-recovery.html` | 137 Failed-payment recovery | failed payment recovery Houston |
| `supplier-price-alerts.html` | 141 Supplier price-change alerts | supplier price change alerts Houston |
| `retainage-tracker.html` | 142 Retainage tracker | retainage tracker Houston contractors |
| `ai-for-insurance-agencies.html` | New industry page | AI for Houston insurance agencies |

There was no insurance-agency industry page. `ai-for-insurance-agencies.html` follows the salon industry page: who it is for, problems, a labeled fictional example, related systems, FAQ, and the $497 audit. It links the three insurance pages plus lead follow-up, inbox triage, customer reactivation, the owner daily briefing, and review requests. It is listed with the other industry pages on `services.html`, in `sitemap.xml`, and in `llms.txt`.

Accounting and payment pages link to accounting firms, bookkeeping firms, QuickBooks, and Xero where those fit, plus a related workflow page such as AR, the tax organizer, or the invoice reader.

## Rules held

- No catalog setup or monthly prices. The $497 AI Audit line is the price on the new pages. The insurance industry card says “Start with the $497 AI Audit.”
- No client stats or testimonials. The catalog’s “18%” supplier example is called out there as made up, so it is not used. Day-in-the-life sections are labeled as examples.
- No “coming soon” lines.
- Text-to-pay and failed-payment recovery say texting needs carrier approval and is not sending from the site today. Email is the path that does not need that step.
- Money and tax pages say a person reviews and approves before anything is paid, filed, or sent. They say this is not tax advice or legal advice. Sales tax watch does not file a return. W-9 readiness does not file 1099s. Cash application does not apply a payment until a person approves. Credit applications are business credit only, and a person decides the terms. Chargeback pages do not promise a win. Payments go through the business’s own processor.
- The automation catalog intro no longer says “Fifteen systems,” because later batches added more.
- Brand orange on the main button is `rgb(240, 88, 40)`.

## Checks

- Internal links: 4,073 `href`s on the preview site resolve to a file in the zip. None missing.
- Each new page has one H1, a canonical URL, Open Graph tags, Service JSON-LD, and FAQPage JSON-LD.
- Chat widget `6af0b754e90adeca202e170c` appears once on each new page.
- Footer line remains “Alln1 Business, a DBA of Elizabeth Martinez, 8236 Dover St, Houston, TX 77061”.
- Served locally. No horizontal overflow at 390px or 1280px on the two sample pages.

## Sample screenshots

- Texas sales tax watch: `batch9_salestax_mobile.png`, `batch9_salestax_desktop.png`
- Insurance renewal remarketing: `batch9_renewal_mobile.png`, `batch9_renewal_desktop.png`
