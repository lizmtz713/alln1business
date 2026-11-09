# Preview QA: phone tap targets and done-for-you FAQ / locations

Preview only. Not deployed. Not merged.

Starting point: Cloudflare Pages production deployment `bf606312-0acd-40ee-a325-ebeb1574a4e8` (https://alln1business.com). Every file in the download matched that deployment’s asset hashes before editing.

The upload zip is the full live site plus these edits: `alln1business-preview-mobile-faq.zip` (164 files). Do not upload this repository folder by itself. Git did not contain every live file, and several pages in git were older than production, so the GitHub diff also includes bringing those pages up to the live HTML.

## Changed files

- `styles.css` — mobile-only type size and tap targets. Desktop rules are unchanged.
- `faq.html` — FAQ copy, including the matching FAQ schema.
- `index.html` — the homepage FAQ block only. Homepage sections outside that block were not rewritten.
- `launch.html` — the same “start a business” answer that appears on the FAQ page, so the two do not disagree.
- `locations/*.html` — all 34 location files (33 city pages and the index).

## What stayed the same

- Footer contact line on every page: `Alln1 Business, a DBA of Elizabeth Martinez, 8236 Dover St, Houston, TX 77061`, plus `liz@alln1business.com` and `(281) 810-3315`.
- Terms and Privacy text.
- Chat widget `6af0b754e90adeca202e170c` once per HTML page. `assets/chat-quiet.js` was not edited, so the chat still does not auto-open.
- No `name="phone"`, `type="tel"`, or `sms_consent` on any page.
- “Book an AI Audit” and “Questions first?” remain.
- Brand orange `#F05828` is unchanged. A desktop check at 1280px still shows the top navigation, 13px `.tiny` text, 14px footer text, and button color `rgb(240, 88, 40)`.
- Homepage service cards, including the Make/Zapier connects line and the Lab step, were left as they are on production.

## Mobile CSS

Inside `@media (max-width: 820px)` only:

- Body-sized text that was under 16px (`.tiny`, footer copy, legal line, card text, FAQ answers, banner text, chips) is 16px.
- Footer links, section jumps, and the banner Details link are at least 44px tall.
- The banner close control is 44×44.
- Menu button and “Book an AI Audit” stay at least 44px tall.
- “Call”, “text”, and email links keep a 44px tap area without pushing the following period onto its own gap.
- FAQ summaries stay at least 44px tall and keep their disclosure triangles.

Measured at 390px: close button 44×44, menu 44×44, audit button 178×52, “Call” tap height 46, footer links 16px with 44px minimum height, body 16px.

## FAQ wording

Existing prices were left in place. No new prices or guarantees were added.

### On `faq.html` (visible answer and FAQ schema) and the homepage FAQ

| Before | After |
| --- | --- |
| Why not just use ChatGPT myself? | Why not just use ChatGPT? |
| Alln1 provides the scoped implementation around your business: access checks, field mapping, instructions, testing and human-review rules. | We set that up around your business, test it, and support it for you, including access, connections, and human-review rules. |
| We use Make, Zapier, n8n, native integrations and direct APIs. | We set up those connections, test them, and support them for you. |
| Everything is built in your own accounts, so you own it. | We set it up in your own accounts, so you own it. |
| You do, directly to each vendor (CRM, phone numbers, AI usage, Make, etc.). | You do, directly to each vendor (CRM, phone numbers, AI usage, and the other tools we connect). |
| Liz is the human founder who architects and reviews every system. | Liz is the human founder. We set up every system, test it, and support it. |

The sentence before each of those answers is unchanged: AI assistants can already use connectors, memory and scheduled actions. Optional Managed AI Ops still covers agreed maintenance after launch. The customer still pays vendors directly, and the setup price still covers our work. The customer still approves anything customer-facing.

### On `faq.html` only (also the matching question on `launch.html` for the first item)

| Before | After |
| --- | --- |
| we prepare your DBA/assumed name (or help with an LLC state filing), walk you through the EIN, prep your bank account paperwork, and build your brand, website, email, Google Business Profile and social, connected with AI from day one. | we prepare your DBA/assumed name filing (or help with an LLC state filing), prepare the EIN paperwork for you to submit, prep your bank account paperwork, and set up your brand, website, email, Google Business Profile and social. We test those connections and support them. |
| That’s what Managed AI Ops is for: monitoring, error alerts, fixes and monthly tuning, from $149/mo. | That’s what Managed AI Ops is for: we watch it, fix what breaks, and tune it, from $149/mo. |
| You get a map of your tools, a prioritized roadmap and a fixed-price proposal, and the fee is credited toward any build booked within 30 days. | We map your tools, test the plan against how you work, and give you a prioritized roadmap and a fixed-price proposal. The fee is credited toward any build booked within 30 days. |

Still stated, unchanged: government fees are paid by the customer, the bank account is opened by the customer, this is not legal, tax, or CPA advice, and the launch still starts at $997. The audit is still the AI Audit & Roadmap ($497), and the fee is still credited toward a build booked within 30 days.

## Locations wording

### Every city page (33 files)

| Before | After |
| --- | --- |
| Start with the $497 AI Audit to map your own flow. | Start with the $497 AI Audit. We map the flow, then set it up, test it, and support it for you. |

### `locations/index.html`

| Before | After |
| --- | --- |
| These cities are in the Houston metro. Systems are still delivered online; Liz can meet by appointment across Greater Houston. | These cities are in the Houston metro. We set the systems up online and support them. Liz can meet by appointment across Greater Houston. |

### City leads and fit lines

| Page | Before | After |
| --- | --- | --- |
| Boca Raton | Boca Raton businesses can use the same scoped Lab process as Texas clients: build in your accounts, agree tests and any supported shadow mode, review with Liz, and approve what goes public. | We set up the same kind of system we set up for Texas clients, in your accounts. We test it and support it, and you approve what goes public. |
| Dallas | There is no Dallas storefront — you get the same Alln1 systems, Lab pressure-testing, and Liz’s review from Houston. | There is no Dallas storefront. We set up the same Alln1 systems, test them, and support them from Houston. |
| El Paso | The same scoped build process, agreed tests and any supported shadow mode, with human review by Liz — no El Paso storefront. | We set it up, test it, and support it, and Liz reviews the work — no El Paso storefront. |
| Fort Lauderdale | Fort Lauderdale owners work with Alln1 online: same Alln1 systems, agreed Lab checks and any supported shadow mode, Liz review — without inventing a South Florida storefront. | Fort Lauderdale owners work with Alln1 online. We set up the same systems, test them, and support them, and Liz reviews the work — without inventing a South Florida storefront. |
| Galveston | Island businesses still get mainland-grade systems: online delivery from Houston, Lab testing, Liz review. | We set up the same systems online from Houston, test them, and support them, and Liz reviews the work. |
| Clear Lake / Webster | Alln1 delivers systems online with Greater Houston appointment options — no public street address. | We set up and support the systems online, with Greater Houston appointments when you want them. |
| Pasadena | Systems ship online; appointments available across the metro by arrangement. Address stays private. | We set the systems up online and support them. Appointments are available across the metro by arrangement. There is no Pasadena storefront. |
| The Woodlands | Systems are delivered online; Liz can meet by appointment across Greater Houston. No published street address. | We set the systems up online and support them. Liz can meet by appointment across Greater Houston. |
| The Woodlands | AI Revenue Systems, AI Growth Systems and AI Ops Infrastructure — the same Lab process as Houston builds. | AI Revenue Systems, AI Growth Systems and AI Ops Infrastructure. We set them up, test them, and support them the same way we do for Houston. |
| Stafford | You get online builds and optional Greater Houston appointments — never a fake Stafford HQ. | We set up, test, and support your systems online, with optional Greater Houston appointments. There is no Stafford office. |
| Spring | You get scope-specific systems online; in-person is by appointment anywhere in Greater Houston we schedule — never a fake storefront. | We set up scope-specific systems for you online, test them, and support them. In-person is by appointment anywhere in Greater Houston we schedule. There is no Spring storefront. |

Google Business Profile “address hidden” lines were left alone. Those describe the Google listing, not the website footer.

## Checks

- Internal links: 2,771 `href`s on the preview site resolve to a file in the zip. No missing targets.
- Widget id `6af0b754e90adeca202e170c`: exactly once on each of the 96 HTML pages.
- No phone field and no SMS consent field on any page.
- Footer DBA line, email, and phone are present on every HTML page.
- FAQ schema on `faq.html` parses as JSON and matches the visible answers.
- Served locally and checked at 390px (homepage, homepage FAQ, Houston location, footer) and 1280px (homepage). Desktop navigation and type sizes stayed on the desktop rules.
