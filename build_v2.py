#!/usr/bin/env python3
"""Alln1 AI Studio v2 — Connected AI positioning. Production build (indexable).
Keeps the live inquiry form markup except the <option> list, and points its submit script at /api/lead."""
import re, json, glob, html
from pathlib import Path
ROOT = Path(__file__).resolve().parent
PHONE = "(281) 810-3315"; PHONE_TEL = "+12818103315"; EMAIL = "liz@alln1business.com"

# ---------- capture live form block verbatim ----------
SRC = Path("/workspace/alln1-deploy-backup-20261105-190045-before-v2")
_live = (SRC/"index.html").read_text()
_a = _live.find('<section id="inquiry"'); _b = _live.find('</script>', _a) + 9
FORM_LIVE = _live[_a:_b]
FORM_LIVE = re.sub(r"https://hook\.[a-z0-9]+\.make\.com/[A-Za-z0-9_-]+", "/api/lead", FORM_LIVE)
assert "/api/lead" in FORM_LIVE
assert "make.com/" not in FORM_LIVE
OFFERS = [
 dict(id="agents", name="AI Agent Systems", price=3500, care=297, tag="Multi-agent · Aria + Rex + Orbit",
      promise="A team of AI agents (front desk, sales and operations) that work together, share memory, and hand off to each other and to you.",
      connects="Phone/SMS + AI voice, website chat, email, calendar, CRM, your knowledge base (Drive, Docs, FAQs, price lists), Slack or text alerts.",
      flow=["After-hours call","Aria (AI receptionist) answers from your own price list & FAQs","Hot lead handed to Rex (AI sales agent)","Rex checks your calendar and books the estimate","Confirmation + intake form texted","Orbit (AI ops agent) creates the job in your CRM with call summary","You get a morning text summary — refunds, complaints and big quotes wait for your approval"],
      timeline="4–8 weeks incl. Lab shadow mode", prefix="from "),
 dict(id="revenue", name="AI Revenue Systems", price=2497, care=197, tag="Lead → booked → paid",
      promise="Lead to booked to paid, end to end, without anyone copying and pasting.",
      connects="Website forms, Facebook/Instagram/Google lead sources, missed-call text-back, CRM, calendar, SMS/email follow-up, quotes, e-signature, QuickBooks/Stripe/Square, Google reviews.",
      flow=["Website lead","AI qualifies it (service, budget, location, timing)","Books on your calendar","Texts confirmation + reminder","CRM updated with lead score & notes","AI drafts the quote for your approval","E-signature","Invoice sent in QuickBooks","Payment logged","Review request after the job"],
      timeline="3–5 weeks", prefix="from "),
 dict(id="integrations", name="Integrations & Automation", price=1197, care=149, tag="The connective tissue",
      promise="Connect your apps so data moves itself. Enter it once, and it shows up everywhere it should.",
      connects="Any two-plus of your apps via Make, Zapier, n8n, native integrations, APIs and webhooks — with AI steps in the middle to classify, summarize, extract and route.",
      flow=["New Shopify order","AI tags it (new vs. repeat, gift, rush)","Customer added/updated in CRM + Mailchimp","Row added to your Google Sheets dashboard","Low stock triggers a reorder alert to you","Personalized thank-you email","Order synced to QuickBooks"],
      timeline="1–3 weeks", prefix="from "),
 dict(id="ops", name="AI Ops Infrastructure", price=1497, care=149, tag="Back office on autopilot",
      promise="Inbox, documents, bookkeeping prep, tasks and live reporting — handled by connected AI, approved by you.",
      connects="Gmail/Outlook, Google Drive/OneDrive, QuickBooks/Xero, Sheets/Airtable/databases, task tools, Looker Studio dashboards, meeting recorders.",
      flow=["Vendor emails an invoice PDF","AI extracts vendor, amount, due date & category","Filed in the right Drive folder","Draft bill created in QuickBooks for your approval","Task added with the due date","Weekly AI report: cash in/out, overdue invoices, open jobs, leads by source"],
      timeline="2–4 weeks", prefix="from "),
 dict(id="growth", name="AI Growth Systems", price=1297, care=149, tag="SEO + reviews + content, wired to CRM",
      promise="Local SEO, reviews and content wired into your CRM, so marketing turns into booked work — not just likes.",
      connects="Google Business Profile, Google/Yelp/Facebook reviews, website & SEO pages, Facebook/Instagram/LinkedIn/YouTube, email marketing, CRM, Google Analytics & Search Console.",
      flow=["Job marked complete in CRM","Review request sent by text","New review arrives","AI drafts a reply for your approval","AI drafts Google Business Profile posts & SEO pages from real jobs","You approve → published","Leads tracked back to the channel in your CRM"],
      timeline="2–4 weeks", prefix="from "),
]
AUDIT = dict(id="audit", name="AI Audit & Roadmap", price=497)
CARE = [("Care", 149, "Monitoring and error alerts, fixes when an app changes, monthly health check."),
        ("Growth", 197, "Care + monthly tuning of prompts and follow-ups, one small new automation per month, monthly report."),
        ("Command", 297, "Growth + multi-agent systems, priority response, quarterly roadmap review with Liz.")]
LAUNCH = [
 dict(id="launch-essentials", name="Launch Essentials", price=997, weeks="1–2 weeks", best="A side hustle or solo service going official",
      items=["DBA / assumed name filing — guided &amp; prepared (you sign; county/state fee paid by you)","EIN application walkthrough (free from the IRS)","LLC state filing help if you choose an LLC — professional referral where needed","Business bank account prep: document checklist + appointment-ready packet","Domain + professional email (Google Workspace or Microsoft 365)","Google Business Profile set up &amp; submitted for verification","One-page website with a working contact form","Launch checklist: licenses/permits to ask about, accounts list, logins handed to you"]),
 dict(id="launch-brand", name="Launch + Brand", price=2497, weeks="3–4 weeks", best="A new business that needs to look established",
      items=["Everything in Essentials, plus:","Lean business plan: offer, customer, pricing, 12-month money outline","Brand kit: name check, logo, colors, fonts, tagline, templates","Up to 5-page SEO-ready website","Social profiles (Facebook, Instagram, LinkedIn, YouTube or TikTok) with banners &amp; bios"]),
 dict(id="launch-ai", name="Launch + AI Systems", price=3997, weeks="5–7 weeks", best="A new business that wants to run on autopilot from day one",
      items=["Everything in Launch + Brand, plus:","Connected starter system: website form → CRM → AI reply → calendar booking → confirmation texts","Quotes/invoicing &amp; payments connected (QuickBooks, Stripe or Square)","Review requests + Google Business Profile wired to your CRM","AI assistant trained on your services, prices &amp; FAQs (drafts replies for your approval)","First 30 days of Managed AI Ops Care included"]),
]
LAUNCH_FLOW = ["Kickoff call","Name check + DBA/assumed name filing prepared","You sign &amp; pay the county fee","EIN walkthrough","Bank-ready packet","You open the business account at your bank","Domain + professional email live","Brand kit approved","Website live with contact form","Google Business Profile submitted for verification","Social profiles live","Website form → CRM → AI drafts the reply","Books your calendar + texts confirmation","Quote/invoice from QuickBooks","Review request after the job","30-day check-in → optional Managed AI Ops"]
LAUNCH_NOTE = """<ul class="honest">
<li><strong>Liz guides you and prepares the filing;</strong> you review and sign. <strong>Government filing fees are paid by you</strong> directly to the county or state (they vary by location).</li>
<li><strong>For an LLC,</strong> we help with the state filing and <strong>recommend a licensed professional</strong> (attorney or CPA) where your situation needs one.</li>
<li><strong>Your bank account is opened by you, at the bank you choose.</strong> We prepare the documents and checklist so the appointment goes smoothly. We never hold your money or accounts.</li>
<li><strong>Not legal, tax or CPA advice.</strong> We don’t file taxes, choose your entity for you, or guarantee approvals. No grants or funding applications.</li>
<li>Third-party software (domain, email, hosting, CRM, phone) is billed by those vendors to you, on accounts in your name.</li>
</ul>"""
BF = {o['id']: int(o['price']*0.7) for o in OFFERS}  # 30% off setups, floor

TOOLS = [("CRM", ["HubSpot","GoHighLevel","Salesforce"]),
 ("Phone & SMS", ["Twilio","OpenPhone"]),
 ("Calendar", ["Google Calendar","Calendly"]),
 ("Email & workspace", ["Gmail","Outlook / Microsoft 365","Google Workspace","Mailchimp","Slack","DocuSign"]),
 ("Money", ["QuickBooks","Stripe","Square"]),
 ("Data", ["Google Sheets","Airtable"]),
 ("Web & e-commerce", ["Shopify","WordPress"]),
 ("Social & reviews", ["Facebook","Instagram","Google Business Profile","Yelp"]),
 ("Field service", ["Jobber","Housecall Pro"]),
 ("AI & orchestration", ["Make","Zapier","n8n","OpenAI"])]
assert sum(len(t) for _,t in TOOLS) == 30

INDUSTRIES = [
 ("home", "Home services", "HVAC, plumbing, roofing, cleaning, landscaping",
  ["Missed call at 7 PM","AI texts back in seconds / answers by voice","Collects address, issue & photos","Books the estimate in Jobber, Housecall Pro or Google Calendar","Tech gets job details by text","Invoice from QuickBooks after the job","Payment reminder if unpaid","Review request","6-month maintenance reminder scheduled"]),
 ("clinic", "Clinics & med spas", "Human approval on anything clinical",
  ["Instagram DM or website chat asks about a treatment","AI answers from your approved service menu (no medical advice)","Offers open slots from your booking system","Books + sends intake forms","Reminders 48h and 2h before","No-show triggers a rebook text","Post-visit follow-up + review request","Weekly dashboard: bookings, no-shows, revenue by service"]),
 ("realestate", "Real estate", "Agents & small brokerages",
  ["Zillow, website or Facebook lead","AI replies within a minute: buyer/seller, area, budget, timing","Scores & tags the lead in your CRM","Books a call on the agent's calendar","Matching listings sent by email","Long-term nurture for not-ready leads","Closing date triggers check-in + review request"]),
 ("retail", "Restaurants & retail", "Shops, cafés, caterers, boutiques",
  ["Phone or chat asks about hours, menu, catering or stock","AI answers from your live menu / inventory","Catering inquiry qualified → draft quote for your approval","Order logged in Toast, Square or Shopify","Customer added to email/SMS list (with consent)","Weekly AI-drafted promo + social posts for approval","Weekly sales & reviews report"]),
 ("pro", "Professional services", "Law, accounting, insurance, consultants",
  ["Website inquiry","AI runs a short intake + fit questions","Books a consult","Engagement letter via DocuSign after your approval","Client folder in Drive + CRM record created","AI turns the consult call into notes & tasks","Invoice in QuickBooks","Document reminders until the client uploads"]),
]

def money(n): return f"${n:,}"
def flow_html(steps, cls="flow"):
  return f'<ol class="{cls}">' + ''.join(f'<li>{html.escape(s)}</li>' for s in steps) + '</ol>'

SEO_TITLE = "Alln1 Business | Grow Your Business with AI"
SEO_DESC = "Grow your business with AI: sales, marketing, social and systems. AI agents connected to your CRM, phone, calendar, email and QuickBooks. Based in Houston."

def jsonld(extra_offers=True):
  catalog = {"@type":"OfferCatalog","name":"Connected AI systems","itemListElement":[]}
  items = [(AUDIT['name'], AUDIT['price'], "Map your tools and workflows and get a prioritized AI roadmap plus a fixed-price build proposal. Credited toward a build booked within 30 days.", None)]
  items += [(o['name'], o['price'], o['promise'], o['care']) for o in OFFERS]
  items += [('AI-Ready Business Launch — '+L['name'], L['price'], 'Start your business already connected: filing prepared, bank-ready paperwork, brand, website, accounts and AI from day one.', None) for L in LAUNCH]
  for n,p,d,c in items:
    off = {"@type":"Offer","name":n,"description":d,"priceCurrency":"USD",
           "priceSpecification":{"@type":"PriceSpecification","minPrice":p,"priceCurrency":"USD"},
           "itemOffered":{"@type":"Service","name":n,"provider":{"@id":"https://alln1business.com/#org"},"areaServed":{"@type":"Country","name":"United States"}}}
    catalog["itemListElement"].append(off)
  for n,p,d in CARE:
    catalog["itemListElement"].append({"@type":"Offer","name":f"Managed AI Ops — {n}","description":d,"priceCurrency":"USD",
      "priceSpecification":{"@type":"UnitPriceSpecification","price":p,"priceCurrency":"USD","unitText":"MONTH"}})
  data = {"@context":"https://schema.org","@graph":[
    {"@type":"Organization","@id":"https://alln1business.com/#organization","name":"Alln1 Business","alternateName":"Alln1","slogan":"Grow Your Business with AI: Sales, Marketing, Social & Systems. Built by AI. Directed by Liz.","url":"https://alln1business.com/","logo":"https://alln1business.com/assets/logo.png","email":EMAIL,"telephone":"+1-281-810-3315","foundingDate":"2017","founder":{"@type":"Person","name":"Liz Martinez"}},
    {"@type":"ProfessionalService","@id":"https://alln1business.com/#org","name":"Alln1 Business","alternateName":"Alln1","slogan":"Grow Your Business with AI: Sales, Marketing, Social & Systems. Built by AI. Directed by Liz.","url":"https://alln1business.com/","image":"https://alln1business.com/assets/logo.png","email":EMAIL,"telephone":"+1-281-810-3315","foundingDate":"2017",
     "description":"Alln1 AI Studio designs, connects and manages AI systems for small businesses: AI agents wired into your phone, CRM, calendar, email, accounting and website, so leads, bookings, paperwork and follow-up move on their own, with you approving what matters.",
     "areaServed":{"@type":"Country","name":"United States"},
     "address":{"@type":"PostalAddress","addressLocality":"Houston","addressRegion":"TX","addressCountry":"US"},
     "founder":{"@type":"Person","name":"Liz Martinez"},"parentOrganization":{"@id":"https://alln1business.com/#organization"},
     "knowsAbout":["AI integration","AI agents","Multi-agent workflows","Business process automation","CRM integration","QuickBooks automation","Make","Zapier","n8n","Local SEO"],
     "priceRange":"$$","hasOfferCatalog":catalog}]}
  return '<script type="application/ld+json">\n' + json.dumps(data, ensure_ascii=False) + '\n</script>'

def nav(active=""):
  links=[("/","Home","home"),("/services","Systems","services"),("/launch","Launch","launch"),("/about","About","about"),("/locations/","Locations","locations"),("/faq","FAQ","faq")]
  out=[f'<a href="{h}"{" class=\"on\"" if active==k else ""}>{l}</a>' for h,l,k in links]
  out.append('<a class="btn sm" href="/#audit">Book an AI Audit</a>')
  return "\n".join(out)

BF_BANNER = '''<div id="bf-banner" class="bf-banner" role="region" aria-label="Black Friday offer">
  <div class="wrap bf-inner">
    <p><strong>Black Friday:</strong> 30% off connected AI system setups booked <time datetime="2026-11-27">Nov 27</time>–<time datetime="2026-11-30">Nov 30, 2026</time>. Care plans at standard rates.</p>
    <a class="bf-link" href="/#black-friday">Details</a>
    <button type="button" class="bf-x" aria-label="Dismiss banner" onclick="this.closest('#bf-banner').remove();try{localStorage.setItem('alln1-bf-dismiss','1')}catch(e){}">×</button>
  </div>
</div>
<script>try{if(localStorage.getItem('alln1-bf-dismiss')){var b=document.getElementById('bf-banner');if(b)b.remove();}}catch(e){}</script>'''

def head(title, desc, path, active="", extra=""):
  canon=f"https://alln1business.com{path}"
  t=html.escape(title, quote=True); d=html.escape(desc, quote=True)
  return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{t}</title>
<meta name="description" content="{d}">
<link rel="canonical" href="{canon}">
<meta property="og:title" content="{t}">
<meta property="og:description" content="{d}">
<meta property="og:site_name" content="Alln1 Business | Grow Your Business with AI">
<meta property="og:type" content="website">
<meta property="og:url" content="{canon}">
<meta property="og:image" content="https://alln1business.com/assets/logo.png">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/styles.css">
{extra}
</head>
<body>
{BF_BANNER}
<header class="nav"><div class="wrap nav-inner">
<a class="logo" href="/"><img src="/assets/logo.png" alt="Alln1" width="44" height="44"><span class="lockup"><span class="lockup-name">Alln1<span class="accent"> Business</span></span><small class="lockup-tag">Grow Your Business with AI: Sales, Marketing, Social &amp; Systems</small></span></a>
<nav>{nav(active)}</nav>
</div></header>
'''

def footer():
  return f'''<footer>
<div class="wrap foot">
  <div class="foot-brand"><img src="/assets/logo.png" alt="Alln1 Business" class="foot-logo" width="120" height="48">
  <p><strong>Alln1 Business</strong> · Founded 2017<br>Grow Your Business with AI: Sales, Marketing, Social &amp; Systems<br>Connected AI systems for small businesses. Built by AI. Directed by Liz.</p></div>
  <div>
    <p><strong>Contact</strong><br>
    <a href="mailto:{EMAIL}">{EMAIL}</a><br>
    <a href="tel:{PHONE_TEL}">{PHONE}</a></p>
    <p class="tiny">Based in Houston · Delivered online nationwide<br>In-person by appointment in Greater Houston<br>No street address published.</p>
  </div>
  <div>
    <p><strong>Explore</strong><br>
    <a href="/services">Systems &amp; pricing</a> · <a href="/about">About</a><br>
    <a href="/locations/">Locations</a> · <a href="/faq">FAQ</a><br>
    <a href="/#lab">Alln1 Lab</a> · <a href="/#audit">AI Audit</a> · <a href="/#inquiry">Inquiry</a></p>
  </div>
</div>
<p class="legal">© 2026 Alln1 Business. Specialist agents are AI — Liz Martinez architects and reviews every system, and clients approve what goes out. Example flows are example scenarios, not client results. Tool names are trademarks of their owners; no partnership implied. No fake clients, stats, or guarantees.</p>
</footer>'''

FORM_OPTIONS = [(f"{AUDIT['name']} ({money(AUDIT['price'])})", AUDIT['name'])] + \
  [(f"{o['name']} (from {money(o['price'])})", o['name']) for o in OFFERS] + \
  [("AI-Ready Business Launch (from $997)", "AI-Ready Business Launch"), ("Managed AI Ops (care plan)", "Managed AI Ops"), ("Black Friday setup special", "Black Friday setup special")]
_opts = '\n'.join(f'<option value="{v}">{html.escape(l)}</option>' for l,v in FORM_OPTIONS)
FORM = re.sub(r'(<option value="">Not sure yet — help me choose</option>\n)(.*?)(\n</select>)',
              lambda m: m.group(1)+_opts+m.group(3), FORM_LIVE, flags=re.S)
FORM = FORM.replace('<p class="eyebrow">Studio consult</p>','<p class="eyebrow">Start here</p>').replace('<h2>Tell us what you need</h2>','<h2>Tell us what you want connected</h2>')
FORM = FORM.replace('<label>Which system?<select','<label>Which system?<select')
def form_block(): return FORM

CSS_EXTRA = r'''
/* v2 connected-AI additions */
.hero h1 .accent{color:var(--blue)}
.compare{width:100%;border-collapse:separate;border-spacing:0;font-size:15px;margin-top:22px;border:1px solid var(--line);border-radius:16px;overflow:hidden}
.compare th,.compare td{padding:13px 16px;text-align:left;vertical-align:top;border-bottom:1px solid var(--line)}
.compare th{background:rgba(255,255,255,.05);font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
.compare th:last-child{color:var(--orange)}
.compare td:first-child{color:var(--muted)}.compare td:last-child{color:var(--ink);font-weight:600}
.compare tr:last-child td{border-bottom:0}
.tools{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px;margin-top:24px}
.tools .grp{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px}
.tools h3{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--orange);margin-bottom:10px}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin:0;padding:0;list-style:none}
.chips li{background:rgba(32,168,224,.10);border:1px solid rgba(32,168,224,.28);color:var(--ink);font-size:13px;font-weight:650;padding:5px 10px;border-radius:999px}
.flow{list-style:none;padding:0;margin:12px 0 0;display:flex;flex-wrap:wrap;gap:6px;counter-reset:f}
.flow li{position:relative;font-size:13px;line-height:1.35;background:rgba(255,255,255,.05);border:1px solid var(--line);border-radius:10px;padding:7px 10px 7px 10px;color:var(--ink)}
.flow li:not(:last-child)::after{content:"→";color:var(--orange);font-weight:800;margin-left:8px}
.offer{display:flex;flex-direction:column}
.offer .connects{font-size:13px;color:var(--muted)}
.offer .connects b{color:var(--ink)}
.offer.feature{border-color:rgba(240,88,40,.5);box-shadow:0 0 0 1px rgba(240,88,40,.18),0 20px 50px rgba(240,88,40,.08)}
.label-ex{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#0a0a0c;background:var(--blue);border-radius:999px;padding:3px 9px;margin-bottom:8px}
.audit-box{display:grid;grid-template-columns:1.4fr 1fr;gap:24px;align-items:center}
@media(max-width:820px){.audit-box{grid-template-columns:1fr}.compare{font-size:14px}.compare th,.compare td{padding:10px}}
.kicker{font-size:20px;font-weight:750;margin-top:22px}
.care-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-top:18px}
.bf-table{width:100%;border-collapse:collapse;font-size:15px;margin:10px 0 16px}.bf-table td{padding:8px 4px;border-bottom:1px solid var(--line)}
.bf-table td:last-child{text-align:right;white-space:nowrap}
.team-grid{grid-template-columns:repeat(auto-fit,minmax(160px,1fr))}
.lockup{display:flex;flex-direction:column;align-items:flex-start;gap:5px;line-height:1.2;min-width:0}
.lockup-name,.lockup>span:first-child{display:block;font-weight:800;font-size:18px;letter-spacing:-.01em}
.lockup-tag,.lockup small{display:block;font-size:11px;font-weight:600;color:var(--muted);letter-spacing:.02em;line-height:1.25;max-width:min(420px,46vw);white-space:normal}
@media(max-width:700px){.lockup-tag,.lockup small{display:none}}
@media(min-width:821px) and (max-width:1120px){.lockup-tag,.lockup small{display:none}}
/* Secondary CTA: solid brand-blue (darker for WCAG AA) — replaces faint ghost outline */
.btn.ghost{background:linear-gradient(135deg,#0d6a94,#0a5f84);border:0;box-shadow:0 10px 28px rgba(13,106,148,.30);color:#fff!important}
.btn.ghost:hover{filter:brightness(1.08)}
.nav-inner{min-height:64px;height:auto;padding:10px 0}
.honest{color:var(--muted);padding-left:20px}.honest li{margin:8px 0}.honest strong{color:var(--ink)}
.launch-sec{background:linear-gradient(160deg,#12151c,#0c1018);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
'''
base_css = (SRC/"styles.css").read_text()
if "/* v2 connected-AI additions */" in base_css: base_css = base_css.split("/* v2 connected-AI additions */")[0]
(ROOT/"styles.css").write_text(base_css.rstrip()+"\n"+CSS_EXTRA)

def write(path, content):
  p=ROOT/path; p.parent.mkdir(parents=True, exist_ok=True); p.write_text(content); print("wrote", path, len(content))

# ---------- shared sections ----------
WHY = '''<section id="why" class="section">
<div class="wrap">
<p class="eyebrow">The honest difference</p>
<h2>Why not just use ChatGPT?</h2>
<p class="lede">You can, and you should, for writing a quick email or brainstorming. But a chatbot waits for you to type. It doesn’t pick up your phone at 9 PM, it can’t see your calendar, it doesn’t update your CRM, and it can’t send the invoice. That gap is where we work.</p>
<div style="overflow:auto"><table class="compare">
<thead><tr><th>A single AI chatbot</th><th>An Alln1 connected AI system</th></tr></thead>
<tbody>
<tr><td>Answers when you ask it something</td><td>Acts on its own when a call, form, email or payment comes in, 24/7</td></tr>
<tr><td>Lives in one chat window</td><td>Works across your phone, CRM, calendar, inbox, accounting, website and social</td></tr>
<tr><td>Forgets the conversation</td><td>Keeps memory: customer history, past jobs, preferences and notes — in your systems</td></tr>
<tr><td>One generalist</td><td>Specialist AI agents (front desk, sales, ops, marketing) that hand work to each other</td></tr>
<tr><td>You copy-paste the results</td><td>Data moves itself: the lead becomes a booking, a CRM record, an invoice and a review request</td></tr>
<tr><td>No guardrails</td><td>Approval steps built in: sensitive messages, quotes and refunds wait for a human yes</td></tr>
<tr><td>Nobody watching it</td><td>Monitored, fixed and improved every month</td></tr>
<tr><td>Your time to set up</td><td>Done for you, from mapping to launch to ongoing care</td></tr>
</tbody></table></div>
<p class="kicker">ChatGPT is a brilliant employee with no hands. <span class="accent">We give AI the hands, the tools, and the rules.</span></p>
</div></section>'''

tool_groups = ''.join(f'<div class="grp"><h3>{html.escape(c)}</h3><ul class="chips">' + ''.join(f'<li>{html.escape(t)}</li>' for t in ts) + '</ul></div>' for c,ts in TOOLS)
CONNECT = f'''<section id="connect" class="section alt">
<div class="wrap">
<p class="eyebrow">What we connect</p>
<h2>If your business runs on it, we can usually wire AI into it</h2>
<p class="lede">Official integrations, Make scenarios, Zapier or n8n where they fit, and direct APIs and webhooks. We confirm every tool during your AI Audit.</p>
<div class="tools">{tool_groups}</div>
<p class="tiny" style="margin-top:16px">…plus Xero, Pipedrive, RingCentral, Outlook Calendar, Acuity, Klaviyo, WooCommerce, Toast, Notion, Supabase/Postgres and most tools with an API. Tool names are trademarks of their owners, listed to show what we integrate with — no partnership or certification is implied. Software subscriptions stay on your own accounts.</p>
</div></section>'''

def offer_card(o, full=False):
  feat = ' feature' if o['id']=='revenue' else ''
  return f'''<article class="card offer{feat}" id="{o['id']}">
<span class="tag">{html.escape(o['tag'])}</span>
<h3>{o['name']}</h3>
<p class="price">from {money(o['price'])} <small>setup · care from {money(o['care'])}/mo</small></p>
<p>{html.escape(o['promise'])}</p>
<p class="connects"><b>Connects:</b> {html.escape(o['connects'])}</p>
<p class="tiny" style="margin:6px 0 0"><span class="label-ex">Example flow</span></p>
{flow_html(o['flow'])}
<p class="tiny" style="margin-top:12px">Typical build: {o['timeline']}</p>
</article>'''

AUDIT_SEC = f'''<section id="audit" class="section">
<div class="wrap"><div class="panel audit-box">
<div>
<p class="eyebrow">Start here · entry offer</p>
<h2>AI Audit &amp; Roadmap — {money(AUDIT['price'])}</h2>
<p class="lede">Find out exactly where connected AI can save you time and capture more revenue, before you spend a dollar on a build. <strong>Credited toward any build booked within 30 days.</strong></p>
<ul style="color:var(--muted)">
<li>60–90 minute working session with Liz</li>
<li>Map of your current tools and how leads, jobs, money and messages move</li>
<li>Prioritized AI roadmap: quick wins vs. bigger systems</li>
<li>Recommended tools with estimated monthly software costs</li>
<li>Fixed-price build proposal</li>
</ul>
</div>
<div style="text-align:center">
<p class="price" style="font-size:40px;margin:0">{money(AUDIT['price'])}</p>
<p class="tiny">credited toward your build within 30 days</p>
<a class="btn" href="#inquiry" onclick="var s=document.getElementById('service_interest');if(s)s.value='AI Audit & Roadmap';">Book an AI Audit</a>
</div>
</div></div></section>'''

CARE_SEC = '<section id="care" class="section tight"><div class="wrap"><p class="eyebrow">Managed AI Ops</p><h2>Someone is always watching your systems</h2><p class="lede">Apps change, APIs update, prompts drift. Care plans keep every connection running, accurate and improving. Month to month.</p><div class="care-grid">' + \
  ''.join(f'<div class="card"><h3>{n}</h3><p class="price">{money(p)}<small>/mo</small></p><p>{d}</p></div>' for n,p,d in CARE) + \
  '</div><p class="tiny" style="margin-top:12px">Larger multi-system clients: custom retainer quoted after the audit.</p></div></section>'

def industries_html():
  return ''.join(f'''<article class="card" id="ind-{k}"><span class="label-ex">Example scenario</span><h3>{t}</h3><p class="tiny">{s}</p>{flow_html(f)}</article>''' for k,t,s,f in INDUSTRIES)

INDUSTRY_SEC = f'''<section id="industries" class="section alt">
<div class="wrap">
<p class="eyebrow">Industry snapshots</p>
<h2>What connected AI looks like in your world</h2>
<p class="lede">These are <strong>example scenarios</strong> showing how the pieces connect — not client results or case studies.</p>
<div class="grid" style="margin-top:24px">{industries_html()}</div>
</div></section>'''

TEAM_SEC = '''<section id="team" class="section">
<div class="wrap">
<p class="eyebrow">The agents · honest labels</p>
<h2>A team of AI agents. One human architect.</h2>
<p class="lede">Each specialist below is <strong>AI</strong>, and in your build they work together — handing off context, sharing memory in your systems, and escalating to a human when it matters. Liz architects every system and reviews it before launch. You approve what reaches your customers.</p>
<div class="team-grid" style="margin-top:24px">
  <div class="person human"><div class="role">Founder &amp; AI Architect</div><h3>Liz Martinez</h3><p class="tiny">Maps your business, designs the system, sets the rules, reviews every build.</p><span class="badge human">Human</span></div>
  <div class="person"><div class="role">AI Receptionist agent</div><h3>Aria</h3><p class="tiny">Answers calls, chats and texts; books; hands hot leads to Rex.</p><span class="badge">AI</span></div>
  <div class="person"><div class="role">AI Sales agent</div><h3>Rex</h3><p class="tiny">Qualifies, follows up, drafts quotes, keeps the CRM current.</p><span class="badge">AI</span></div>
  <div class="person"><div class="role">AI Ops agent</div><h3>Orbit</h3><p class="tiny">Inbox, invoices, documents, tasks, reports, dashboards.</p><span class="badge">AI</span></div>
  <div class="person"><div class="role">AI SEO &amp; Reviews agent</div><h3>Sage</h3><p class="tiny">Google Business Profile, reviews, local SEO pages.</p><span class="badge">AI</span></div>
  <div class="person"><div class="role">AI Marketing agent</div><h3>Pulse</h3><p class="tiny">Campaign drafts, content engine, attribution back to CRM.</p><span class="badge">AI</span></div>
</div>
</div></section>'''

LAB_SEC = '''<section id="lab" class="section alt">
<div class="wrap">
<p class="eyebrow">How we build · the Alln1 Lab</p>
<h2>Mapped, architected, pressure-tested — then live</h2>
<ol class="steps">
  <li><b>1. AI Audit &amp; Map</b>How leads, jobs, money and messages move through your business today — and where they get stuck.</li>
  <li><b>2. Architect</b>Which agents, which tools, which data, and exactly where a human approves.</li>
  <li><b>3. Build in the Lab</b>Every workflow is pressure-tested with test data and shadow mode before it touches a real customer.</li>
  <li><b>4. Launch with approvals on</b>You approve the messages and rules before go-live.</li>
  <li><b>5. Run &amp; improve</b>Monitoring, error alerts, monthly tuning, and new automations as you grow.</li>
</ol>
</div></section>'''

bf_rows = ''.join(f'<tr><td>{o["name"]}</td><td><span class="strike">{money(o["price"])}</span><strong class="price" style="font-size:18px">{money(BF[o["id"]])}</strong></td></tr>' for o in OFFERS)
BF_SEC = f'''<section id="black-friday" class="section">
<div class="wrap narrow">
<p class="eyebrow">Black Friday · Cyber Monday 2026</p>
<h2>30% off connected AI system setups</h2>
<p class="lede">Book between <strong>Thursday Nov 27 and Monday Nov 30, 2026</strong> (Central time) and get 30% off the setup of any system below. AI-Ready Business Launch packages aren’t included. Care plans stay at standard rates, and the AI Audit stays {money(AUDIT['price'])} (still credited toward your build). When the dates end, the offer ends.</p>
<div class="panel"><table class="bf-table">{bf_rows}</table>
<p class="tiny">“From” prices; final scope confirmed after the audit. Third-party software billed by the vendor to you.</p>
<a class="btn" href="#inquiry" onclick="var s=document.getElementById('service_interest');if(s)s.value='Black Friday setup special';">Claim the Black Friday rate</a>
</div></div></section>'''

FAQS = [
 ("Why not just use ChatGPT myself?", "Use it! It’s great for writing and ideas. But a chatbot only answers when you type. We build systems that act on their own across your phone, CRM, calendar, email, accounting and website — with memory, handoffs between agents, and approval steps — then we monitor them."),
 ("What exactly do you connect?", "The tools you already run on: CRM (HubSpot, GoHighLevel, Salesforce), phone/SMS, calendars, Gmail/Microsoft 365, QuickBooks, Stripe/Square, Google Sheets/Airtable, Shopify/WordPress, Google Business Profile, social and review platforms, and most apps with an API. We use Make, Zapier, n8n, native integrations and direct APIs."),
 ("Do I have to switch software?", "Usually no. We build around what you already use and only recommend a new tool when it clearly pays for itself. Everything is built in your own accounts, so you own it."),
 ("Who pays for the software?", "You do, directly to each vendor (CRM, phone numbers, AI usage, Make, etc.). Our setup price covers our work — flat and all-inclusive, no nickel-and-diming."),
 ("Are Aria, Rex, Orbit, Sage and Pulse real people?", "No. They are AI agents, labeled AI everywhere. Liz Martinez is the human founder who architects and reviews every system. You approve anything customer-facing."),
 ("Will AI send things without my OK?", "Only what you’ve approved it to send. Quotes, refunds, complaints, and anything sensitive are routed to a human for a yes before they go out."),
 ("What happens when an app changes or something breaks?", "That’s what Managed AI Ops is for: monitoring, error alerts, fixes and monthly tuning, from $149/mo."),
 ("Do you guarantee results or rankings?", "No. We don’t promise rankings or revenue, and we don’t publish fake case studies. Example flows on this site are example scenarios."),
 ("Where do you work?", "Online, nationwide. Based in Houston, with in-person meetings by appointment in Greater Houston. No street address is published."),
 ("Can you help me start a business from scratch?", "Yes. AI-Ready Business Launch takes you from idea to open: we prepare your DBA/assumed name (or help with an LLC state filing), walk you through the EIN, prep your bank account paperwork, and build your brand, website, email, Google Business Profile and social, connected with AI from day one. Government fees are paid by you; your bank account is opened by you at your bank; this isn’t legal, tax or CPA advice, and we refer you to a professional where needed. Starts at $997."),
 ("How do I start?", f"Book the AI Audit & Roadmap ({money(AUDIT['price'])}). You get a map of your tools, a prioritized roadmap and a fixed-price proposal, and the fee is credited toward any build booked within 30 days."),
]
def faq_html(n=None):
  items = FAQS if n is None else FAQS[:n]
  return ''.join(f'<details{" open" if i==0 else ""}><summary>{html.escape(q)}</summary><p>{html.escape(a)}</p></details>' for i,(q,a) in enumerate(items))

HERO = '''<section class="hero">
<div class="wrap">
<p class="eyebrow">Grow Your Business with AI: Sales, Marketing, Social &amp; Systems</p>
<h1>Your tools don’t talk to each other. <span class="accent">We make them work together, with&nbsp;AI.</span></h1>
<p class="lead">Alln1 Business helps small businesses nationwide win more <strong>sales</strong>, run smarter <strong>marketing</strong>, stay active on <strong>social media</strong> and run on connected <strong>systems</strong>, all powered by AI. AI agents answer and follow up with leads, book jobs, send invoices, draft your posts and report results across the apps you already use. Done for you, monitored for you, approved by you.</p>
<div class="cta">
  <a class="btn" href="#audit">Book an AI Audit</a>
  <a class="btn ghost" href="#connect">See what we connect</a>
</div>
<p class="trust">Founded 2017 · Founder-reviewed builds · You approve what goes out · Based in Houston, delivered nationwide</p>
</div></section>'''

WHAT_WE_DO = '''<section class="section tight"><div class="wrap narrow" style="text-align:center">
<p class="lede" style="margin:0 auto;font-size:20px;color:var(--ink)">We don’t sell AI tools. <strong>We connect them into one system that runs your business while you run your day.</strong></p>
<p class="tiny" style="margin-top:10px">For owners who know AI could help but don’t have the time or tech team to wire it all together. You don’t need to learn AI. You need it working.</p>
</div></section>'''

OFFERS_SEC = f'''<section id="systems" class="section">
<div class="wrap">
<p class="eyebrow">Systems · standard “starting at” pricing</p>
<h2>Five connected systems. One studio.</h2>
<p class="lede">Each system connects multiple tools and AI agents end to end. Flat, all-inclusive setup for our work; software stays on your accounts. Final scope and price confirmed after the AI Audit.</p>
<div class="grid" style="margin-top:28px">{''.join(offer_card(o) for o in OFFERS)}</div>
</div></section>'''

SPOTLIGHT = f'''<section id="flow" class="section alt"><div class="wrap">
<p class="eyebrow">One lead, start to finish</p>
<h2>Nobody touches it — unless you want to</h2>
<p class="lede">An example flow from AI Revenue Systems. Every arrow is a hand-off between connected tools and AI agents.</p>
<div class="panel">{flow_html(OFFERS[1]['flow'])}
<p class="tiny" style="margin-top:14px">Example scenario. No reply? AI follows up on day 2, 5 and 10, then stops.</p></div>
</div></section>'''

def launch_card(L, link=True):
  feat=' feature' if L['id']=='launch-ai' else ''
  return f'''<article class="card offer{feat}" id="{L['id']}"><span class="tag">AI-Ready Business Launch</span><h3>{L['name']}</h3>
<p class="price">from {money(L['price'])} <small>· typical {L['weeks']}</small></p><p>Best for: {L['best']}.</p>
<ul>{''.join(f'<li>{i}</li>' for i in L['items'])}</ul></article>'''
LAUNCH_HOME = f'''<section id="launch" class="section launch-sec"><div class="wrap">
<p class="eyebrow">Add-on · Starting from scratch?</p>
<h2>AI-Ready Business Launch: start your business already connected</h2>
<p class="lede">From idea to open-for-business: your name filed, bank-ready, branded, online, and wired with AI from day one, so you never have to rebuild later.</p>
<div class="grid" style="margin-top:24px">{''.join(f'<div class="card"><h3>{L["name"]}</h3><p class="price">from {money(L["price"])}</p><p>{L["best"]}.</p></div>' for L in LAUNCH)}</div>
<p class="tiny" style="margin-top:14px">Liz guides and prepares your filing; government fees are paid by you; your bank account is opened by you at your bank. Not legal, tax or CPA advice.</p>
<p class="cta"><a class="btn" href="/launch">See what’s included</a></p>
</div></section>'''
home = head(SEO_TITLE, SEO_DESC, "/", "home", jsonld()) + HERO + WHAT_WE_DO + WHY + CONNECT + AUDIT_SEC + OFFERS_SEC + CARE_SEC + LAUNCH_HOME + SPOTLIGHT + INDUSTRY_SEC + TEAM_SEC + LAB_SEC + BF_SEC + \
 f'''<section class="section alt" id="faq"><div class="wrap narrow"><p class="eyebrow">FAQ</p><h2>Straight answers</h2>{faq_html(6)}<p style="margin-top:16px"><a href="/faq">All questions →</a></p></div></section>''' + \
 f'''<section class="section tight"><div class="wrap narrow" style="text-align:center"><h2>Ready to connect it all?</h2><p class="lede" style="margin:0 auto">Start with the {money(AUDIT['price'])} AI Audit &amp; Roadmap, credited toward your build.</p><p class="cta" style="justify-content:center"><a class="btn" href="#audit">Book an AI Audit</a><a class="btn ghost" href="tel:{PHONE_TEL}">Call {PHONE}</a></p></div></section>''' + \
 form_block() + footer() + "\n</body></html>"
write("index.html", home)

# ---------- services ----------
svc = head("AI Integration Services & Pricing | Alln1 AI Studio",
  "AI Agent Systems, AI Revenue Systems, Integrations & Automation, AI Ops Infrastructure and AI Growth Systems. Flat setup pricing from $1,197. AI Audit $497.",
  "/services", "services", jsonld()) + f'''
<section class="hero" style="padding:56px 0"><div class="wrap">
<p class="eyebrow">Systems · standard pricing</p>
<h1>Connected AI systems &amp; pricing</h1>
<p class="lead">Grow your business with AI: systems for <strong>sales, marketing, social media and operations</strong>, connected to the tools you already use. Every system links multiple tools and AI agents end to end. Flat, all-inclusive “starting at” setup for our work, optional Managed AI Ops, and third-party software billed by those vendors to you.</p>
<div class="cta"><a class="btn" href="/#audit">Book an AI Audit ({money(AUDIT['price'])})</a></div>
</div></section>
<section class="section"><div class="wrap">
<div class="panel" id="audit" style="margin-top:0"><p class="eyebrow">Entry offer</p><h2>AI Audit &amp; Roadmap — {money(AUDIT['price'])}</h2>
<p class="lede">A 60–90 minute working session, a map of your tools and workflows, a prioritized AI roadmap, recommended tools with estimated monthly software costs, and a fixed-price build proposal. Credited toward any build booked within 30 days.</p></div>
<div class="grid" style="margin-top:28px">{''.join(offer_card(o) for o in OFFERS)}</div>
</div></section>
{CARE_SEC}
<section id="launch" class="section launch-sec"><div class="wrap"><p class="eyebrow">New businesses</p><h2>AI-Ready Business Launch</h2>
<p class="lede">Start your business already connected: filing prepared, bank-ready paperwork, brand, website, accounts and AI from day one.</p>
<div class="grid" style="margin-top:24px">{''.join(launch_card(L) for L in LAUNCH)}</div>
<div class="panel"><h3>The honest fine print</h3>{LAUNCH_NOTE}</div>
<p class="cta"><a class="btn" href="/launch">Full launch details</a></p></div></section>
{CONNECT}
<section class="section"><div class="wrap narrow"><p class="eyebrow">Black Friday 2026</p><h2>30% off setups booked Nov 27–30</h2><table class="bf-table">{bf_rows}</table><p class="tiny">Care plans at standard rates. AI Audit stays {money(AUDIT['price'])}. AI-Ready Business Launch packages aren’t included. <a href="/#black-friday">Details</a></p></div></section>
{form_block()}
{footer()}
</body></html>'''
write("services.html", svc)

# ---------- launch page ----------
launch_ld = '<script type="application/ld+json">' + json.dumps({"@context":"https://schema.org","@type":"Service","name":"AI-Ready Business Launch","serviceType":"Business launch and setup with AI automation","provider":{"@type":"ProfessionalService","name":"Alln1 AI Studio","url":"https://alln1business.com/","telephone":"+1-281-810-3315"},"areaServed":{"@type":"Country","name":"United States"},"offers":[{"@type":"Offer","name":L['name'],"priceCurrency":"USD","priceSpecification":{"@type":"PriceSpecification","minPrice":L['price'],"priceCurrency":"USD"}} for L in LAUNCH]}, ensure_ascii=False) + '</script>'
launch = head("AI-Ready Business Launch | Start a Business with AI | Alln1 AI Studio",
  "Start your business already connected: DBA/LLC filing prepared, bank-ready paperwork, brand, website, email, Google Business Profile and AI from day one. From $997.",
  "/launch", "launch", launch_ld) + f'''
<section class="hero"><div class="wrap">
<p class="eyebrow">AI-Ready Business Launch · New businesses</p>
<h1>Start your business <span class="accent">already connected.</span></h1>
<p class="lead">Your DBA or LLC filing prepared, bank-ready paperwork, brand, website, email, Google Business Profile and social, wired together with AI from day one. Done with you, approved by you.</p>
<div class="cta"><a class="btn" href="#inquiry" onclick="var s=document.getElementById('service_interest');if(s)s.value='AI-Ready Business Launch';">Plan my launch</a><a class="btn ghost" href="#tiers">See the tiers</a></div>
<p class="trust">Founded 2017 · Alln1 runs on the same setup: its own DBA, business bank account, domain, email and connected systems</p>
</div></section>
<section class="section"><div class="wrap narrow">
<p class="eyebrow">Why launch AI-ready</p><h2>Set it up once. Connected from day one.</h2>
<p class="lede">Most new businesses open a dozen accounts that never talk to each other, then pay someone later to untangle them. We set up the paperwork, brand, website and accounts and connect them from the start: form → CRM → calendar → email → invoicing. When you’re ready to grow, you upgrade into a bigger system with no rebuild.</p>
</div></section>
<section id="tiers" class="section alt"><div class="wrap">
<p class="eyebrow">Tiers · standard “starting at” pricing</p><h2>Pick your launch</h2>
<div class="grid" style="margin-top:24px">{''.join(launch_card(L) for L in LAUNCH)}</div>
<p class="tiny" style="margin-top:14px">Timelines are for our work. Government processing, bank appointments and Google verification depend on those offices and platforms. After launch: Managed AI Ops from $149/mo (optional).</p>
</div></section>
<section class="section"><div class="wrap">
<p class="eyebrow">Example launch flow</p><h2>Idea → open for business</h2>
<div class="panel"><span class="label-ex">Example scenario</span>{''.join([])}<ol class="flow">{''.join(f'<li>{x}</li>' for x in LAUNCH_FLOW)}</ol>
<p class="tiny" style="margin-top:12px">Illustrative example, not a client result.</p></div>
</div></section>
<section id="fine-print" class="section alt"><div class="wrap narrow">
<p class="eyebrow">The honest fine print</p><h2>Filings, fees &amp; banking</h2>{LAUNCH_NOTE}
</div></section>
<section class="section tight"><div class="wrap narrow"><details open><summary>{FAQS[-2][0] if False else "Can you help me start a business from scratch?"}</summary><p>{[a for q,a in FAQS if q.startswith("Can you help me start")][0]}</p></details></div></section>
{form_block()}
{footer()}
</body></html>'''
write("launch.html", launch)

# ---------- about ----------
ABOUT_CSS = (ROOT / "about_css.txt").read_text()
_ABOUT_BODY = (ROOT / "about_body.html.tpl").read_text().format(EMAIL=EMAIL, PHONE=PHONE, PHONE_TEL=PHONE_TEL)
about_ld = '<script type="application/ld+json">\n' + json.dumps({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      "@id": "https://alln1business.com/about#webpage",
      "url": "https://alln1business.com/about",
      "name": "About Alln1 Business | Liz Martinez, Founder",
      "description": "Alln1 Business (founded 2017): Grow Your Business with AI: Sales, Marketing, Social & Systems. Liz Martinez brings 14+ years of operations, accounting and people management to connected AI systems for small businesses. Houston-based, online nationwide.",
      "isPartOf": {"@id": "https://alln1business.com/#organization"},
      "about": {"@id": "https://alln1business.com/#organization"},
      "mainEntity": {"@id": "https://alln1business.com/#liz-martinez"},
      "primaryImageOfPage": {"@type": "ImageObject", "url": "https://alln1business.com/assets/liz-martinez.jpg"}
    },
    {
      "@type": "Person",
      "@id": "https://alln1business.com/#liz-martinez",
      "name": "Liz Martinez",
      "jobTitle": "Founder & AI Architect",
      "url": "https://alln1business.com/about",
      "image": "https://alln1business.com/assets/liz-martinez.jpg",
      "email": EMAIL,
      "telephone": "+1-281-810-3315",
      "worksFor": {"@id": "https://alln1business.com/#organization"},
      "knowsAbout": ["AI integration", "AI agents", "Business process automation", "Operations management", "Accounting", "QuickBooks", "CRM integration", "Local SEO"]
    }
  ]
}, ensure_ascii=False) + '\n</script>'

about = head("About Alln1 Business | Liz Martinez, Founder",
  "Alln1 Business (founded 2017): Grow Your Business with AI: Sales, Marketing, Social & Systems. Liz Martinez brings 14+ years of operations, accounting and people management to connected AI systems for small businesses. Houston-based, online nationwide.",
  "/about", "about", about_ld + "\n" + ABOUT_CSS) + _ABOUT_BODY + TEAM_SEC + footer() + "\n</body></html>"
write("about.html", about)

# ---------- faq ----------
faq_ld = '<script type="application/ld+json">' + json.dumps({"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in FAQS]}, ensure_ascii=False) + '</script>'
faq = head("FAQ | Alln1 AI Studio — Connected AI Systems",
  "Why not just use ChatGPT? What do you connect? Who pays for software? Honest answers about Alln1 AI Studio’s connected AI systems, agents and pricing.",
  "/faq", "faq", faq_ld) + f'''
<section class="hero" style="padding:56px 0"><div class="wrap"><p class="eyebrow">FAQ</p><h1>Questions, answered</h1></div></section>
<section class="section"><div class="wrap narrow">{faq_html()}</div></section>
{form_block()}
{footer()}
</body></html>'''
write("faq.html", faq)

# ---------- 404 ----------
write("404.html", head("Not found | Alln1 AI Studio","Page not found.","/404.html").replace('<link rel="stylesheet"','<meta name="robots" content="noindex">\n<link rel="stylesheet"',1) + '''
<section class="hero"><div class="wrap"><h1>Page not found</h1>
<p class="lead">Try the <a href="/">homepage</a> or <a href="/services">systems &amp; pricing</a>.</p></div></section>
''' + footer() + "\n</body></html>")

# ---------- locations ----------
FIT = {
 "houston-tx":"Home base, so every system is available: AI Revenue Systems and AI Agent Systems for calls and leads, AI Ops Infrastructure for the back office, AI Growth Systems for Google and reviews.",
 "pearland-tx":"AI Revenue Systems for peak-hour calls and bookings; AI Ops Infrastructure for front-office paperwork in medical and dental offices.",
 "katy-tx":"AI Revenue Systems for fast lead reply; AI Growth Systems to keep your Google Business Profile and reviews working; Integrations & Automation as you grow.",
 "sugar-land-tx":"AI Ops Infrastructure and Integrations & Automation give you an ops layer without hiring one; AI Revenue Systems for intake and follow-up.",
 "dallas-tx":"AI Revenue Systems and AI Agent Systems for service firms; AI Growth Systems for local search — all delivered online.",
 "florida":"Any of the five systems, delivered online statewide. AI Revenue Systems is the most common start; AI Growth Systems for local presence.",
 "arlington-tx":"AI Revenue Systems for booking and reminders; AI Growth Systems for Google presence; Integrations & Automation to tie it all together.",
 "austin-tx":"AI Agent Systems and AI Growth Systems for growth-minded owners; AI Revenue Systems for missed calls and booking; AI Ops Infrastructure for inbox and invoices.",
 "baytown-tx":"AI Revenue Systems first, so calls and leads never fall through; Integrations & Automation next.",
 "bellaire-tx":"AI Revenue Systems, AI Ops Infrastructure, and AI Agent Systems when you want answers grounded in your own documents.",
 "boca-raton-fl":"AI Growth Systems for growth work; AI Revenue Systems if the phone is your main lead source; AI Ops Infrastructure for back-office load.",
 "clear-lake-webster-tx":"AI Revenue Systems, AI Growth Systems, and Integrations & Automation when your tools need to share data.",
 "conroe-tx":"AI Revenue Systems first; AI Growth Systems for Google Business Profile and reviews.",
 "cypress-tx":"AI Revenue Systems, plus AI Growth Systems when reviews and Google presence need a system.",
 "el-paso-tx":"AI Revenue Systems for calls and leads; AI Ops Infrastructure for documents and invoices; AI Growth Systems for local search.",
 "fort-lauderdale-fl":"AI Revenue Systems first; AI Ops Infrastructure if invoices and inbox bury the week; AI Growth Systems for local search.",
 "fort-worth-tx":"AI Revenue Systems (missed-call text-back, booking, follow-up, invoicing) is the usual start; AI Growth Systems for Google and reviews.",
 "friendswood-tx":"AI Revenue Systems and AI Growth Systems, connected through your CRM.",
 "galveston-tx":"AI Agent Systems to absorb seasonal call spikes; AI Revenue Systems for inquiries; AI Growth Systems for Google and reviews.",
 "humble-tx":"AI Revenue Systems; AI Ops Infrastructure if invoices pile up.",
 "katy":"",
 "kingwood-tx":"AI Revenue Systems and AI Growth Systems, with Integrations & Automation to connect your existing apps.",
 "league-city-tx":"AI Revenue Systems; AI Ops Infrastructure for paperwork; AI Growth Systems for Google Business Profile.",
 "miami-fl":"AI Revenue Systems for speed-to-lead; AI Growth Systems for Google and content you approve; AI Agent Systems for bilingual-ready front desk flows.",
 "missouri-city-tx":"AI Revenue Systems, AI Ops Infrastructure, and AI Growth Systems.",
 "pasadena-tx":"AI Revenue Systems, AI Ops Infrastructure, and Integrations & Automation.",
 "plano-tx":"AI Ops Infrastructure and Integrations & Automation are common starts; AI Revenue Systems if calls matter; AI Growth Systems when marketing needs a system.",
 "richmond-rosenberg-tx":"AI Revenue Systems is the usual start; AI Growth Systems for local search.",
 "san-antonio-tx":"AI Revenue Systems usually comes first for service businesses; AI Growth Systems for Google Business Profile and reviews.",
 "spring-tx":"AI Revenue Systems (text-back, booking, follow-up) and AI Ops Infrastructure for paperwork.",
 "stafford-tx":"AI Revenue Systems, AI Ops Infrastructure, and Integrations & Automation.",
 "the-woodlands-tx":"AI Revenue Systems, AI Growth Systems and AI Ops Infrastructure — the same Lab process as Houston builds.",
 "tomball-tx":"AI Revenue Systems; AI Growth Systems for Google Business Profile.",
 "west-palm-beach-fl":"AI Revenue Systems and AI Growth Systems are typical fits; AI Agent Systems when you need answers grounded in your own docs.",
}
LEAD_FIX = [
 ("Liz Martinez builds Front Desk, Pipeline, Ops, Local Authority, and Demand Engine systems for Houston-area small businesses","Liz Martinez builds connected AI systems for Houston-area small businesses"),
 ("Katy and west-Houston owners get Studio Front Desk, Pipeline, and Local Authority systems delivered online","Katy and west-Houston owners get connected AI systems delivered online"),
 ("full Studio delivery online: Front Desk, Pipeline, Ops, SEO, and marketing systems.","full Studio delivery online: revenue, ops, integrations, SEO and marketing systems, all connected."),
 ("Miami businesses get Front Desk, Pipeline, Ops, Local Authority, and more — online from Houston.","Miami businesses get connected AI revenue, ops and growth systems — online from Houston."),
 ("Front Desk, Pipeline, Ops, Local Authority, Demand Engine, and Private Agent — built online from Houston.","AI Agent Systems, AI Revenue Systems, Integrations & Automation, AI Ops Infrastructure and AI Growth Systems — built online from Houston."),
 ("need Front Desk, Pipeline, and Local Authority without waiting on an in-state agency","need calls, leads, reviews and back office connected with AI, without waiting on an in-state agency"),
 ("want Ops and Pipeline without hiring a full ops stack","want connected ops and lead follow-up without hiring a full ops team"),
]
def pick_ind(angle):
  a=angle.lower()
  if re.search(r'clinic|medical|dental|med spa|wellness|health', a): return INDUSTRIES[1]
  if 'real estate' in a or 'realtor' in a: return INDUSTRIES[2]
  if re.search(r'restaurant|retail|shop|boutique|tourism', a): return INDUSTRIES[3]
  if re.search(r'professional|consult|law|account|firm|insurance', a): return INDUSTRIES[4]
  return INDUSTRIES[0]
STALE = re.compile(r'Front Desk|Pipeline|Local Authority|Demand Engine|Private Agent|Studio Ops')

loc_files = sorted(glob.glob(str(SRC/"locations/*.html")))
loc_meta = []
for fp in loc_files:
  slug = Path(fp).stem
  s = Path(fp).read_text()
  body = s[s.find('<section class="hero"'):s.find('<footer>')]
  if slug == "index":
    body = body.replace("Local pages help you find us for your city. Delivery is online everywhere.","Connected AI systems — agents and integrations across the tools you already use — delivered online everywhere. Local pages help you find us for your city.")
    page = head("Locations | Alln1 AI Studio — Connected AI Systems Nationwide",
      "Alln1 AI Studio connects AI agents to your CRM, phone, calendar and QuickBooks for small businesses nationwide. Pages for Houston, Greater Houston, Texas metros and South Florida.",
      "/locations/", "locations") + body + footer() + "\n</body></html>"
    assert not STALE.search(page), "stale in loc index"
    (ROOT/"locations/index.html").write_text(page); print("wrote locations/index.html"); continue
  name = re.search(r'<p class="eyebrow">(.*?) · Alln1 AI Studio</p>', body).group(1)
  city = name.replace(" (statewide hub)","")
  for a,b in LEAD_FIX: body = body.replace(a,b)
  lead = re.search(r'<p class="lead">(.*?)</p>', body).group(1)
  newlead = f"Alln1 AI Studio connects AI agents to the tools {city} businesses already run on — phone, CRM, calendar, email, QuickBooks and website — so leads, bookings and paperwork move on their own. {lead}"
  body = body.replace(f'<p class="lead">{lead}</p>', f'<p class="lead">{newlead}</p>', 1)
  body = re.sub(r'<h1>.*?</h1>', f'<h1>Connected AI systems for {html.escape(city)} small businesses</h1>', body, count=1)
  angle = re.search(r'Who this page is for</h3><p>(.*?)</p>', body).group(1)
  ind = pick_ind(angle)
  fit = FIT[slug]
  body = re.sub(r'<div class="card"><h3>Systems that fit</h3><p>.*?</p></div>',
    lambda m: f'<div class="card"><h3>Systems that fit</h3><p>{html.escape(fit)} <a href="/services">See systems &amp; pricing</a>.</p></div>', body, count=1, flags=re.S)
  ex = f'''<div class="wrap" style="margin-top:22px"><div class="card"><span class="label-ex">Example scenario</span><h3>What a connected system could look like for {"an" if city[0] in "AEIOU" else "a"} {html.escape(city)} {ind[1].lower().replace("restaurants & retail","shop or restaurant").replace("home services","home-service business").replace("clinics & med spas","clinic or med spa").replace("professional services","professional firm").replace("real estate","real estate team")}</h3>{flow_html(ind[3])}<p class="tiny" style="margin-top:10px">Illustrative example, not a client result. Start with the <a href="/#audit">{money(AUDIT['price'])} AI Audit</a> to map your own flow.</p></div></div>'''
  body = body.replace('<div class="wrap" style="margin-top:28px">', ex + '\n<div class="wrap" style="margin-top:28px">', 1)
  body = body.replace('<a class="btn" href="/#inquiry">Book a studio consult</a>', '<a class="btn" href="/#audit">Book an AI Audit</a>')
  if STALE.search(body): raise SystemExit(f"stale names remain in {slug}: {STALE.findall(body)}")
  title = f"AI Integration & Automation in {city} | Alln1 AI Studio"
  desc = f"Connected AI systems for {city} small businesses: AI agents wired into your CRM, phone, calendar, email and QuickBooks. Delivered online from Houston. AI Audit $497."
  ld = '<script type="application/ld+json">' + json.dumps({"@context":"https://schema.org","@type":"Service","name":f"AI integration & automation in {city}","serviceType":"AI integration and automation","provider":{"@type":"ProfessionalService","name":"Alln1 AI Studio","url":"https://alln1business.com/","telephone":"+1-281-810-3315"},"areaServed":{"@type":"Place","name":city},"url":f"https://alln1business.com/locations/{slug}"}, ensure_ascii=False) + '</script>'
  page = head(title, desc, f"/locations/{slug}", "locations", ld) + body + footer() + "\n</body></html>"
  (ROOT/"locations"/f"{slug}.html").write_text(page); loc_meta.append(slug)
print("location pages:", len(loc_meta))

# ---------- redirects, sitemap, robots ----------
red = (SRC/"_redirects").read_text().replace("/lead-catcher.html /services#pipeline 301","/lead-catcher.html /services#revenue 301")
write("_redirects", red)
urls = ["/","/services","/launch","/about","/faq","/locations/"] + [f"/locations/{s}" for s in loc_meta]
sm = ['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'] + \
     [f"<url><loc>https://alln1business.com{u}</loc><lastmod>2026-11-05</lastmod></url>" for u in urls] + ['</urlset>']
write("sitemap.xml", "\n".join(sm))
write("robots.txt", "User-agent: *\nAllow: /\n\nSitemap: https://alln1business.com/sitemap.xml\n")
for old in ["lead-follow-up","inbox-triage","booking-reminders","review-requests","spreadsheet-dashboard","missed-call-textback","ai-email-drafts","invoice-receipt-reader","quote-proposal","website-chat","meeting-notes-tasks","starter-plan-brand","content-batch","how-it-works"]:
  write(f"{old}.html", f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=/services"><link rel="canonical" href="https://alln1business.com/services"><title>Moved | Alln1 AI Studio</title><link rel="stylesheet" href="/styles.css"></head>
<body><p class="wrap" style="padding:40px">This now lives under <a href="/services">connected AI systems &amp; pricing</a>.</p></body></html>''')
print("DONE")

# ---------- brand rename post-pass (Alln1 AI Studio -> Alln1 Business) ----------
BRAND_FIX = [("Alln1 AI Studio","Alln1 Business"),("get the same Studio systems","get the same Alln1 systems"),("get Studio systems","get Alln1 systems"),("the Studio stack","the Alln1 stack"),("same Studio build quality","same Alln1 build quality"),("full Studio delivery","full Alln1 delivery"),("same Lab-tested Studio systems","same Lab-tested Alln1 systems"),("same Studio systems","same Alln1 systems")]
for fp in list(ROOT.glob("*.html")) + list(ROOT.glob("locations/*.html")):
  t = fp.read_text(); o = t
  for a,b in BRAND_FIX: t = t.replace(a,b)
  if t != o: fp.write_text(t)
print("brand post-pass done")
