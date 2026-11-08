#!/usr/bin/env python3
"""Generate Alln1 AI Studio preview site (noindex)."""
from pathlib import Path
ROOT = Path(__file__).resolve().parent

# Pages Function functions/api/lead.js reads MAKE_WEBHOOK_URL. Do not embed the webhook.
WEBHOOK = "/api/lead"
PHONE = "(281) 810-3315"
PHONE_TEL = "+12818103315"
EMAIL = "liz@alln1business.com"
YEAR = "2026"

SYSTEMS = [
  dict(id="front-desk", name="Studio Front Desk", agent="Aria · AI Receptionist",
       price=1497, care=197, blurb="Every call and after-hours inquiry answered, logged, and booked or texted back — so the phone stops costing you jobs.",
       includes=["Call-flow design from how you answer today","AI voice receptionist or smart missed-call text-back","Booking into Google / Outlook / your calendar","Lead + call summaries to email/SMS/CRM","Warm handoff rules to a human","Shadow mode before full auto","Testing + short handover guide"],
       timeline="2–3 weeks (text-back); 3–5 weeks with voice", who="Home services, clinics, salons, contractors — anyone who loses work when the phone rings."),
  dict(id="pipeline", name="Studio Pipeline", agent="Rex · AI Sales Agent",
       price=1297, care=149, blurb="New leads get a fast, on-brand answer, stay in a tracked pipeline, and get followed until they reply.",
       includes=["Primary intake into a clean lead sheet or CRM","Instant acknowledgment in your voice","Owner/team alert with summary","Qualification + tagging","Follow-up that stops when they reply","Quote/proposal drafts for your approval","Optional post-job review requests"],
       timeline="2–3 weeks", who="Service businesses and consultants who lose inquiries to slow replies."),
  dict(id="ops", name="Studio Ops", agent="Orbit · AI Ops Agent",
       price=1197, care=149, blurb="Invoices, receipts, meeting notes, and weekly numbers — sorted, drafted, and summarized for your approval.",
       includes=["Inbox / document triage rules","Invoice & receipt reader into a sheet or bookkeeping handoff","Meeting notes → tasks","Dashboard of metrics you already track","Weekly summary draft for review","Testing + handover"],
       timeline="2–3 weeks", who="Solo owners and small teams drowning in email attachments and PDFs."),
  dict(id="private-agent", name="Studio Private Agent", agent="Custom · trained on your business",
       price=2497, care=297, blurb="An AI trained on your services, prices, FAQs, and tone — drafting answers for your team, with you approving what leaves.",
       includes=["Knowledge pack from your documents","One primary channel (team chat, private page, or draft queue)","Source citation when feasible","Hard handoff on refunds, complaints, legal/medical/tax","Two-week shadow mode","Answer logging + handover"],
       timeline="3–5 weeks incl. shadow mode", who="Owners who repeat the same explanations all day."),
  dict(id="local-authority", name="Studio Local Authority", agent="Sage · AI SEO & Content",
       price=1397, care=149, blurb="Show up and look credible where customers already search — without fake rank promises.",
       includes=["Google Business Profile optimization","Categories, services, Q&A, photo guidance","Review-request engine","NAP / citation checklist","AI local content drafts for your approval","Visibility notes (no rank guarantees)"],
       timeline="2–3 weeks", who="Local service businesses that need GBP, reviews, and honest local content."),
  dict(id="demand-engine", name="Studio Demand Engine", agent="Pulse · AI Marketing",
       price=1597, care=197, blurb="A marketing system that briefs, drafts, and attributes — you approve every public send.",
       includes=["Offer / angle research","Campaign briefs","AI content batches (email/SMS/social/web)","UTM + lead-sheet attribution","Monthly marketing tune","Liz reviews every public draft"],
       timeline="2–4 weeks", who="Owners ready for a marketing system, not random posts."),
]

QUICK = [
  ("Missed-call text-back", 349, "Front Desk"),
  ("Booking confirmations & reminders", 279, "Front Desk"),
  ("Website chat that books or captures leads", 349, "Front Desk"),
  ("Lead capture & follow-up", 399, "Pipeline"),
  ("AI email drafts for sales replies", 249, "Pipeline"),
  ("Quote / proposal drafts", 279, "Pipeline"),
  ("Post-job review requests", 229, "Pipeline"),
  ("Inbox & document triage", 279, "Ops"),
  ("Invoice & receipt reader", 299, "Ops"),
  ("Meeting notes to tasks", 249, "Ops"),
  ("Spreadsheet dashboard", 229, "Ops"),
  ("Content batch", 249, "Ops / Marketing"),
  ("Starter plan & brand kit", 249, "Private Agent"),
  ("Website chat grounded on FAQ", 399, "Private Agent"),
]

LOCATIONS = [
  dict(slug="houston-tx", name="Houston, TX", title="AI Automation & AI Receptionist in Houston, TX",
       intro="Houston is home base for Alln1 AI Studio. Liz Martinez builds Front Desk, Pipeline, Ops, Local Authority, and Demand Engine systems for Houston-area small businesses — delivered online, with in-person by appointment in Greater Houston when you want it.",
       angle="Energy corridor contractors, clinics, salons, home services, and consultants who need systems that answer and follow up while they’re on the job.",
       meet="Optional in-person scoping in Greater Houston by appointment. No street address published — we meet by arrangement."),
  dict(slug="pearland-tx", name="Pearland, TX", title="AI Automation for Pearland Small Businesses",
       intro="Alln1 AI Studio helps Pearland owners install the same AI systems used nationwide — online delivery from Houston, with nearby meetups when useful.",
       angle="South-Houston service businesses, medical/dental offices, and local shops that miss calls during peak hours.",
       meet="Online by default. Greater Houston appointments available; Pearland is a short drive from base."),
  dict(slug="katy-tx", name="Katy, TX", title="AI Automation & Lead Systems for Katy, TX",
       intro="Katy and west-Houston owners get Studio Front Desk, Pipeline, and Local Authority systems delivered online, with Houston-area appointments if you prefer face-to-face.",
       angle="Growing Katy home-service and professional practices that need fast lead reply and a credible Google Business Profile.",
       meet="Online nationwide process; in-person available across Greater Houston including Katy corridor."),
  dict(slug="sugar-land-tx", name="Sugar Land, TX", title="AI Systems for Sugar Land & Fort Bend Businesses",
       intro="Sugar Land and Fort Bend small businesses work with Alln1 online — same Lab-tested systems, founder-reviewed deliverables.",
       angle="Professional services, clinics, and local brands that want Ops and Pipeline without hiring a full ops stack.",
       meet="Delivered online. In-person by appointment in Greater Houston when scheduled."),
  dict(slug="dallas-tx", name="Dallas, TX", title="AI Automation for Dallas Small Businesses (Online)",
       intro="Alln1 serves Dallas and North Texas fully online. There is no Dallas storefront — you get the same Studio systems, Lab pressure-testing, and Liz’s review from Houston.",
       angle="Dallas service firms and consultants who want AI receptionist, sales follow-up, and local SEO without another SaaS rabbit hole.",
       meet="100% online delivery for Dallas. Video consults on your schedule."),
  dict(slug="florida", name="Florida", title="AI Automation for Florida Small Businesses (Online)",
       intro="Friends and clients across Florida get Alln1 AI Studio systems delivered online statewide. Based in Houston; no Florida office — honest about that.",
       angle="Florida home services, clinics, and local brands that need Front Desk, Pipeline, and Local Authority without waiting on an in-state agency.",
       meet="Online only for Florida. Optional city pages for Miami, Orlando, and Tampa when content is ready."),
]

FORM_OPTIONS = [
  ("Studio Front Desk (from $1,497)", "Studio Front Desk"),
  ("Studio Pipeline (from $1,297)", "Studio Pipeline"),
  ("Studio Ops (from $1,197)", "Studio Ops"),
  ("Studio Private Agent (from $2,497)", "Studio Private Agent"),
  ("Studio Local Authority — SEO (from $1,397)", "Studio Local Authority"),
  ("Studio Demand Engine — Marketing (from $1,597)", "Studio Demand Engine"),
  ("Automation Roadmap (from $397)", "Automation Roadmap"),
  ("Quick Start automation", "Quick Start"),
  ("Black Friday setup special", "Black Friday setup special"),
]

def money(n):
  return f"${n:,}"

def nav(active=""):
  links = [
    ("/", "Home", "home"),
    ("/services.html", "Systems", "services"),
    ("/about.html", "Studio", "about"),
    ("/locations/", "Locations", "locations"),
    ("/faq.html", "FAQ", "faq"),
  ]
  bits = []
  for href, label, key in links:
    cls = ' class="on"' if active == key else ""
    bits.append(f'<a href="{href}"{cls}>{label}</a>')
  bits.append(f'<a class="btn sm" href="/#inquiry">Book a consult</a>')
  return "\n".join(bits)

def footer():
  return f'''<footer>
<div class="wrap foot">
  <div class="foot-brand"><img src="/assets/logo.png" alt="Alln1 Business" class="foot-logo" width="120" height="48">
  <p>Alln1 AI Studio · Founded {YEAR}<br>Built by AI. Directed by Liz. Delivered online.</p></div>
  <div>
    <p><strong>Contact</strong><br>
    <a href="mailto:{EMAIL}">{EMAIL}</a><br>
    <a href="tel:{PHONE_TEL}">{PHONE}</a></p>
    <p class="tiny">Based in Houston · Delivered online nationwide<br>In-person by appointment in Greater Houston<br>No street address published.</p>
  </div>
  <div>
    <p><strong>Explore</strong><br>
    <a href="/services.html">Systems</a> · <a href="/about.html">Meet the team</a><br>
    <a href="/locations/">Locations</a> · <a href="/faq.html">FAQ</a><br>
    <a href="/#lab">Alln1 Lab</a> · <a href="/#inquiry">Inquiry</a></p>
  </div>
</div>
<p class="legal">© {YEAR} Alln1 Business. AI specialists are AI — Liz Martinez reviews every deliverable. No fake clients, stats, or guarantees. Preview build — not production.</p>
</footer>'''

BF_BANNER = '''<div id="bf-banner" class="bf-banner" role="region" aria-label="Black Friday preview offer">
  <div class="wrap bf-inner">
    <p><strong>Preview:</strong> Black Friday / Cyber Monday draft — 30% off system setups booked <time datetime="2026-11-27">Nov 27</time>–<time datetime="2026-11-30">Nov 30, 2026</time>. Not live until Liz approves.</p>
    <a class="bf-link" href="/#black-friday">Details</a>
    <button type="button" class="bf-x" aria-label="Dismiss banner" onclick="this.closest('#bf-banner').remove();try{localStorage.setItem('alln1-bf-dismiss','1')}catch(e){}">×</button>
  </div>
</div>
<script>try{if(localStorage.getItem('alln1-bf-dismiss')){var b=document.getElementById('bf-banner');if(b)b.remove();}}catch(e){}</script>'''

def head(title, desc, path="/", extra=""):
  canon = f"https://alln1business.com{path}"
  return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="robots" content="noindex, nofollow">
<link rel="canonical" href="{canon}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:type" content="website">
<meta property="og:url" content="{canon}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/styles.css">
{extra}
</head>
<body>
{BF_BANNER}
<header class="nav"><div class="wrap nav-inner">
<a class="logo" href="/"><img src="/assets/logo.png" alt="Alln1" width="44" height="44"><span>Alln1<span class="accent">AI Studio</span></span></a>
<nav>{nav()}</nav>
</div></header>
'''

def form_block():
  opts = '\n'.join(f'<option value="{v}">{lab}</option>' for lab,v in FORM_OPTIONS)
  return f'''<section id="inquiry" class="section alt">
<div class="wrap narrow">
<p class="eyebrow">Studio consult</p>
<h2>Tell us what you need</h2>
<p class="lede">Liz replies within 1 business day. AI may help draft the reply — she reviews before anything is sent.</p>
<form id="lead-form" class="lead-form" novalidate>
<label>Name<input name="name" required autocomplete="name" maxlength="100"></label>
<label>Email<input name="email" type="email" required autocomplete="email" maxlength="150"></label>
<label>Business name<input name="business" required maxlength="150"></label>
<label>Which system?<select name="service_interest" id="service_interest">
<option value="">Not sure yet — help me choose</option>
{opts}
</select></label>
<label>What do you need help with?<textarea name="message" id="message" required rows="4" maxlength="2000"></textarea></label>
<div class="hp" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div>
<button class="btn" type="submit">Send inquiry</button>
<p id="form-status" class="form-status" role="status" aria-live="polite"></p>
<p class="tiny">Prefer email or phone? <a href="mailto:{EMAIL}">{EMAIL}</a> · <a href="tel:{PHONE_TEL}">{PHONE}</a>. Your info is only used to reply to you.</p>
</form>
</div></section>
<script>
(function(){{var f=document.getElementById('lead-form'),st=document.getElementById('form-status');
f.addEventListener('submit',async function(e){{e.preventDefault();
var d=Object.fromEntries(new FormData(f).entries());
var interest=d.service_interest||'';delete d.service_interest;if(interest){{d.message='[Interested in: '+interest+']\\n\\n'+d.message;}}
if(!d.name||!d.business||!d.message||!/[^\\s@]+@[^\\s@]+\\.[^\\s@]+/.test(d.email||'')){{st.textContent='Please fill in your name, a valid email, your business name and what you need.';st.className='form-status err';return;}}
var b=f.querySelector('button');b.disabled=true;st.textContent='Sending...';st.className='form-status';
try{{var r=await fetch('{WEBHOOK}',{{method:'POST',headers:{{'Content-Type':'application/json'}},body:JSON.stringify(d)}});
if(!r.ok)throw 0;f.reset();st.textContent='Thanks! Your inquiry was sent. Check your email for a confirmation. Liz will reply within 1 business day.';st.className='form-status ok';}}
catch(x){{st.innerHTML='Sorry, that didn\\'t go through. Please email <a href="mailto:{EMAIL}">{EMAIL}</a> or call <a href="tel:{PHONE_TEL}">{PHONE}</a>.';st.className='form-status err';}}
finally{{b.disabled=false;}});}})();
</script>'''

# ---------- CSS ----------
CSS = r'''
:root{
  --bg:#0a0a0c; --bg2:#12151c; --bg3:#161a22; --ink:#f5f5f4; --muted:rgba(245,245,244,.72);
  --line:rgba(255,255,255,.10); --orange:#F05828; --blue:#20A8E0; --card:rgba(255,255,255,.045);
  --ok:#3dcf8e; --err:#ff6b7a;
}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;font:16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:var(--ink);background:var(--bg)}
img{max-width:100%;height:auto;display:block}
a{color:var(--blue);text-decoration:none}a:hover{text-decoration:underline}
.wrap{max-width:1120px;margin:0 auto;padding:0 20px}
.narrow{max-width:640px;margin:0 auto}
.tiny{font-size:13px;color:var(--muted)}.lede{color:var(--muted);font-size:18px;max-width:720px}
.eyebrow{text-transform:uppercase;letter-spacing:.12em;font-size:12px;color:var(--orange);font-weight:700;margin:0 0 10px}
.accent{color:var(--blue)}
.price{font-size:22px;font-weight:800;color:var(--blue)}.price small{font-size:14px;font-weight:600;color:var(--muted)}
.strike{text-decoration:line-through;opacity:.55;margin-right:8px;font-weight:600;color:var(--muted)}

.bf-banner{background:linear-gradient(90deg,var(--orange),#e04820);color:#fff;position:sticky;top:0;z-index:20}
.bf-inner{display:flex;align-items:center;gap:14px;padding:10px 0;font-size:14px}
.bf-inner p{margin:0;flex:1}.bf-link{color:#fff;font-weight:700;text-decoration:underline;white-space:nowrap}
.bf-x{background:transparent;border:0;color:#fff;font-size:22px;cursor:pointer;line-height:1;padding:0 4px}

.nav{position:sticky;top:0;z-index:15;background:rgba(10,10,12,.92);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.bf-banner ~ .nav{top:44px}
.nav-inner{display:flex;align-items:center;justify-content:space-between;height:64px;gap:16px}
.logo{display:flex;align-items:center;gap:10px;color:var(--ink);font-weight:800;font-size:18px;text-decoration:none}
.logo img{width:40px;height:40px;object-fit:contain;filter:drop-shadow(0 4px 12px rgba(0,0,0,.4))}
nav{display:flex;align-items:center;gap:4px;flex-wrap:wrap}
nav a{color:var(--muted);font-size:14px;padding:8px 10px;border-radius:8px;text-decoration:none}
nav a:hover,nav a.on{color:#fff;background:rgba(255,255,255,.06)}
@media(max-width:820px){nav a:not(.btn){display:none}}

.btn{display:inline-block;background:linear-gradient(135deg,var(--orange),#e04820);color:#fff!important;padding:13px 22px;border-radius:12px;font-weight:750;border:0;cursor:pointer;text-decoration:none!important;box-shadow:0 10px 28px rgba(240,88,40,.28)}
.btn:hover{filter:brightness(1.05);text-decoration:none!important}
.btn.ghost{background:transparent;border:2px solid rgba(255,255,255,.35);box-shadow:none;color:#fff!important}
.btn.sm{padding:8px 14px;font-size:13px;box-shadow:none}
.cta{display:flex;flex-wrap:wrap;gap:12px;margin:22px 0}

.hero{position:relative;padding:72px 0 64px;overflow:hidden;background:linear-gradient(165deg,#0a0a0c 0%,#12141a 45%,#0c1018 100%)}
.hero::before,.hero::after{content:"";position:absolute;border-radius:50%;filter:blur(40px);pointer-events:none}
.hero::before{width:320px;height:320px;background:var(--orange);opacity:.16;top:-60px;right:8%}
.hero::after{width:360px;height:360px;background:var(--blue);opacity:.12;bottom:-80px;left:-40px}
.hero .wrap{position:relative;z-index:1}
.hero h1{font-size:clamp(30px,5.2vw,52px);line-height:1.12;letter-spacing:-.03em;margin:0 0 14px;font-weight:750;max-width:920px}
.hero .lead{font-size:18px;color:var(--muted);max-width:720px;margin:0}
.trust{margin-top:18px;font-size:14px;color:var(--muted)}

.section{padding:72px 0}.section.alt{background:var(--bg2)}.section.tight{padding:48px 0}
h2{font-size:clamp(24px,3vw,34px);margin:0 0 12px;letter-spacing:-.02em}
h3{margin:0 0 8px;font-size:18px}

.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px}
.card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px;box-shadow:inset 0 1px 0 rgba(255,255,255,.05)}
.card .tag{display:inline-block;font-size:11px;font-weight:700;color:var(--orange);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px}
.card p{color:var(--muted);margin:0 0 12px;font-size:15px}
.card ul{margin:0;padding-left:18px;color:var(--muted);font-size:14px}
.card li{margin:4px 0}

.team-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px}
.person{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px}
.person .role{font-size:12px;color:var(--blue);font-weight:700;text-transform:uppercase;letter-spacing:.06em}
.person.human{border-color:rgba(240,88,40,.45);box-shadow:0 0 0 1px rgba(240,88,40,.15)}
.badge{display:inline-block;background:rgba(32,168,224,.15);color:var(--blue);font-size:11px;font-weight:700;padding:3px 8px;border-radius:999px;margin-top:8px}
.badge.human{background:rgba(240,88,40,.18);color:var(--orange)}

.steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;list-style:none;padding:0;margin:24px 0 0}
.steps li{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px}
.steps b{display:block;color:var(--blue);margin-bottom:6px}

.panel{background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:20px;padding:24px;margin-top:20px}
details{border-bottom:1px solid var(--line);padding:14px 0}summary{font-weight:700;cursor:pointer}details p{color:var(--muted)}

.lead-form label{display:block;margin:0 0 14px;font-weight:600}
.lead-form input,.lead-form textarea,.lead-form select{display:block;width:100%;margin-top:6px;padding:12px 14px;border:1px solid var(--line);border-radius:10px;font:inherit;background:#0e1016;color:var(--ink)}
.lead-form .hp{position:absolute;left:-9999px;height:0;overflow:hidden}
.form-status{margin-top:12px}.form-status.ok{color:var(--ok)}.form-status.err{color:var(--err)}

.loc-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.loc-list a{display:block;padding:16px;border-radius:14px;border:1px solid var(--line);background:var(--card);color:var(--ink);text-decoration:none}
.loc-list a:hover{border-color:var(--blue)}

footer{border-top:1px solid var(--line);padding:40px 0 24px;margin-top:20px;background:#070709}
.foot{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:24px}
.foot-logo{height:48px;width:auto;margin-bottom:10px}
.foot p{color:var(--muted);font-size:14px}.foot a{color:var(--blue)}
.legal{text-align:center;color:rgba(245,245,244,.45);font-size:12px;padding:18px 20px 8px;max-width:900px;margin:0 auto}
@media(max-width:720px){.foot{grid-template-columns:1fr}.bf-inner{flex-wrap:wrap}}
.preview-chip{display:inline-block;background:rgba(240,88,40,.2);color:var(--orange);font-size:11px;font-weight:800;padding:4px 10px;border-radius:999px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:12px}
'''

def write(path, content):
  p = ROOT / path
  p.parent.mkdir(parents=True, exist_ok=True)
  p.write_text(content)
  print("wrote", path, len(content))

# styles
write("styles.css", CSS)

# favicon keep / robots
write("robots.txt", "User-agent: *\nDisallow: /\n")
write("favicon.svg", Path("/workspace/alln1-deploy/favicon.svg").read_text() if (Path("/workspace/alln1-deploy/favicon.svg").exists()) else '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#F05828"/><text x="16" y="22" text-anchor="middle" fill="#fff" font-size="14" font-family="sans-serif" font-weight="700">A1</text></svg>')

# JSON-LD for home
JSONLD = '''<script type="application/ld+json">
{"@context":"https://schema.org","@type":"ProfessionalService","name":"Alln1 AI Studio","alternateName":"Alln1 Business","url":"https://alln1business.com/","email":"liz@alln1business.com","telephone":"+1-281-810-3315","foundingDate":"2017","description":"AI studio for small businesses nationwide. AI receptionist, sales pipeline, ops, local SEO, and marketing systems — human-reviewed by founder Liz Martinez. Based in Houston, delivered online.","areaServed":{"@type":"Country","name":"United States"},"address":{"@type":"PostalAddress","addressLocality":"Houston","addressRegion":"TX","addressCountry":"US"},"founder":{"@type":"Person","name":"Liz Martinez"},"priceRange":"$$"}
</script>'''
# Note: no street address in address schema

# HOME
cards = []
for s in SYSTEMS:
  cards.append(f'''<article class="card" id="{s['id']}">
<span class="tag">{s['agent']}</span>
<h3>{s['name']}</h3>
<p class="price">{money(s['price'])} <small>setup · care from {money(s['care'])}/mo</small></p>
<p>{s['blurb']}</p>
<ul>{''.join(f'<li>{i}</li>' for i in s['includes'][:5])}</ul>
<p class="tiny">Timeline: {s['timeline']} · Who: {s['who']}</p>
</article>''')

qrows = ''.join(f'<tr><td>{n}</td><td>{g}</td><td class="price" style="font-size:16px">{money(p)}</td></tr>' for n,p,g in QUICK)

home = head(
  "Alln1 AI Studio | AI Automation & AI Receptionist for Small Businesses (U.S.)",
  "AI studio for small businesses nationwide. AI receptionist, sales pipeline, ops, local SEO, and marketing systems — human-reviewed by founder Liz Martinez. Based in Houston, delivered online.",
  "/",
  JSONLD
) + f'''
<section class="hero">
<div class="wrap">
<span class="preview-chip">Preview · noindex · not production</span>
<p class="eyebrow">Alln1 AI Studio · Founded 2017</p>
<h1>The AI studio for small businesses that never miss a lead — <span class="accent">anywhere in the U.S.</span></h1>
<p class="lead">Liz Martinez leads AI specialists for reception, sales, ops, SEO, and marketing — then reviews every system we ship. Flat setup on the tools you already pay for. Nothing goes out without your approval.</p>
<div class="cta">
  <a class="btn" href="#inquiry">Book a studio consult</a>
  <a class="btn ghost" href="#systems">See the systems</a>
</div>
<p class="trust">Based in Houston · Delivered online nationwide · In-person by appointment in Greater Houston</p>
</div>
</section>

<section id="systems" class="section">
<div class="wrap">
<p class="eyebrow">Flagship systems · standard pricing</p>
<h2>Six systems. One studio.</h2>
<p class="lede">Outcome packages — not a gadget menu. Third-party software (Make, phone, voice AI, etc.) stays on your accounts. Every customer-facing message drafts for human approval first.</p>
<div class="grid" style="margin-top:28px">{''.join(cards)}</div>
</div>
</section>

<section class="section alt" id="quick-starts">
<div class="wrap">
<p class="eyebrow">Quick Starts</p>
<h2>Single automations under each system</h2>
<p class="lede">Start smaller if you want — still flat setup, still Lab-tested.</p>
<div class="panel" style="overflow:auto">
<table style="width:100%;border-collapse:collapse;font-size:14px">
<thead><tr style="text-align:left;color:var(--muted)"><th style="padding:8px 6px">Quick Start</th><th>Under</th><th>From</th></tr></thead>
<tbody>{qrows}</tbody>
</table>
<p class="tiny" style="margin-top:12px">Automation Roadmap: from {money(397)} (credited toward your first flagship within 60 days).</p>
</div>
</div>
</section>

<section id="team" class="section">
<div class="wrap">
<p class="eyebrow">Meet the team · honest labels</p>
<h2>Built by AI. Directed by Liz.</h2>
<p class="lede">Each specialist below is <strong>AI</strong>. Liz is the human who scopes, directs, and reviews. Clients approve what goes public. No pretend human headcount.</p>
<div class="team-grid" style="margin-top:24px">
  <div class="person human"><div class="role">Founder &amp; Strategist</div><h3>Liz Martinez</h3><p class="tiny">Scopes the work, sets standards, reviews every deliverable.</p><span class="badge human">Human</span></div>
  <div class="person"><div class="role">AI Receptionist</div><h3>Aria</h3><p class="tiny">Answers, books, texts back missed calls.</p><span class="badge">AI</span></div>
  <div class="person"><div class="role">AI Sales Agent</div><h3>Rex</h3><p class="tiny">Captures leads, qualifies, follows up, drafts quotes.</p><span class="badge">AI</span></div>
  <div class="person"><div class="role">AI Ops Agent</div><h3>Orbit</h3><p class="tiny">Inbox, invoices, meeting tasks, dashboards.</p><span class="badge">AI</span></div>
  <div class="person"><div class="role">AI SEO &amp; Content</div><h3>Sage</h3><p class="tiny">Local search, GBP, reviews, content drafts.</p><span class="badge">AI</span></div>
  <div class="person"><div class="role">AI Marketing</div><h3>Pulse</h3><p class="tiny">Campaign briefs, content batches, attribution.</p><span class="badge">AI</span></div>
</div>
</div>
</section>

<section id="lab" class="section alt">
<div class="wrap">
<p class="eyebrow">Alln1 Lab</p>
<h2>Pressure-tested before it goes live</h2>
<p class="lede">Every system runs through the Alln1 Lab — shadow mode, edge cases, and human review — before it talks to your customers.</p>
<ol class="steps">
  <li><b>1. Scope</b>Liz maps your tools and the outcome that pays back.</li>
  <li><b>2. Build</b>AI specialists assemble the system in your accounts.</li>
  <li><b>3. Lab</b>Shadow mode: drafts only. We break it on purpose, then fix it.</li>
  <li><b>4. Review</b>Liz reviews. You approve. Then it goes live.</li>
  <li><b>5. Care</b>Optional month-to-month care keeps integrations watched and tuned.</li>
</ol>
</div>
</section>

<section id="black-friday" class="section">
<div class="wrap narrow">
<p class="eyebrow">Draft offer · preview only</p>
<h2>Black Friday / Cyber Monday 2026</h2>
<p class="lede">Real window: <strong>Thursday Nov 27 through Monday Nov 30, 2026</strong> (America/Chicago).  <strong>30% off system setup</strong> fees for Studio flagships booked in that window. Care plans stay at standard rates. No fake countdown inventory — when the dates end, the offer ends.</p>
<div class="panel">
<p><span class="strike">{money(1497)}</span><strong class="price">{money(1047)}</strong> <small>Front Desk setup example (30% off)</small></p>
<p class="tiny">Exact sale prices confirmed before go-live. This section and the top banner are on the <em>preview</em> only until Liz approves.</p>
<a class="btn" href="#inquiry">Ask about the BF window</a>
</div>
</div>
</section>

<section class="section alt" id="faq">
<div class="wrap narrow">
<p class="eyebrow">FAQ</p>
<h2>Straight answers</h2>
<details open><summary>Is the “team” real people?</summary><p>Liz Martinez is the human founder. Aria, Rex, Orbit, Sage, and Pulse are AI specialists — labeled as AI on every page. Liz reviews deliverables; you approve customer-facing sends.</p></details>
<details><summary>Do you guarantee rankings or revenue?</summary><p>No. Local Authority improves your local presence setup and content drafts. We don’t sell fake #1 promises or invented case studies.</p></details>
<details><summary>Where do you work?</summary><p>Online nationwide. Based in Houston; in-person by appointment in Greater Houston. No street address on the site.</p></details>
<details><summary>What about software fees?</summary><p>Make, phone/SMS, voice AI, CRM, and similar tools are paid by you to those vendors on your own accounts. Alln1 quotes a flat setup (and optional care).</p></details>
<details><summary>Is this the live site?</summary><p>This preview is noindex and not production. alln1business.com stays unchanged until you approve a cutover.</p></details>
</div>
</section>

{form_block()}
{footer()}
</body></html>'''
# fix nav active - regenerate head for home with home active - patch by replace
home = home.replace(nav(), nav("home"), 1)
write("index.html", home)

# SERVICES
svc_cards = []
for s in SYSTEMS:
  svc_cards.append(f'''<article class="card" id="{s['id']}">
<span class="tag">{s['agent']}</span>
<h3>{s['name']}</h3>
<p class="price">{money(s['price'])} setup · care from {money(s['care'])}/mo</p>
<p>{s['blurb']}</p>
<p class="tiny"><strong>Includes:</strong></p>
<ul>{''.join(f'<li>{i}</li>' for i in s['includes'])}</ul>
<p class="tiny">Timeline: {s['timeline']}<br>Best for: {s['who']}</p>
</article>''')

services = head(
  "AI Systems & Pricing | Alln1 AI Studio",
  "Studio Front Desk, Pipeline, Ops, Private Agent, Local Authority, and Demand Engine — flat standard setup pricing for small businesses nationwide.",
  "/services.html"
).replace(nav(), nav("services"), 1) + f'''
<section class="hero" style="padding:56px 0">
<div class="wrap">
<span class="preview-chip">Preview · noindex</span>
<p class="eyebrow">Systems · standard pricing</p>
<h1>Flagships &amp; Quick Starts</h1>
<p class="lead">Flat “starting at” setup. Optional care. Third-party tools on your card.</p>
</div></section>
<section class="section"><div class="wrap"><div class="grid">{''.join(svc_cards)}</div>
<div class="panel" style="margin-top:28px">
<h3>Quick Starts</h3>
<p class="tiny">From {money(229)}–{money(399)}. Mapped under Front Desk, Pipeline, Ops, and Private Agent on the homepage.</p>
<p><a class="btn" href="/#inquiry">Book a consult</a></p>
</div></div></section>
{form_block()}
{footer()}
</body></html>'''
write("services.html", services)

# ABOUT
about = head(
  "About Alln1 AI Studio | Liz Martinez & AI Specialists",
  "Founder-led AI studio. Liz Martinez directs AI specialists Aria, Rex, Orbit, Sage, and Pulse — every deliverable human-reviewed. Based in Houston, delivered online nationwide. Founded 2017.",
  "/about.html"
).replace(nav(), nav("about"), 1) + f'''
<section class="hero" style="padding:56px 0"><div class="wrap">
<span class="preview-chip">Preview · noindex</span>
<p class="eyebrow">The studio</p>
<h1>Built by AI. Directed by Liz.</h1>
<p class="lead">Alln1 AI Studio designs Front Desk, Pipeline, Ops, Local Authority, and Demand Engine systems for small businesses anywhere in the U.S. Founded {YEAR.replace("2026","2017") if False else "2017"}.</p>
<p class="trust">Based in Houston · Delivered online nationwide · In-person by appointment in Greater Houston</p>
</div></section>
<section class="section"><div class="wrap narrow">
<p>I’m Liz Martinez. I lead a team of AI specialists that draft, research, and build. I personally review every deliverable before it reaches you — and nothing goes to your customers without your approval.</p>
<p class="lede">We don’t invent clients, testimonials, awards, or human headcount. Aria, Rex, Orbit, Sage, and Pulse are AI. I’m the human strategist.</p>
<p><a href="/#team">Meet the full team</a> · <a href="/#lab">How the Alln1 Lab works</a></p>
<p class="tiny">Contact: <a href="mailto:{EMAIL}">{EMAIL}</a> · <a href="tel:{PHONE_TEL}">{PHONE}</a></p>
</div></section>
{footer()}
</body></html>'''
write("about.html", about)

# FAQ page
faq = head(
  "FAQ | Alln1 AI Studio",
  "Honest answers about Alln1 AI Studio systems, pricing, the AI team, and where we work.",
  "/faq.html"
).replace(nav(), nav("faq"), 1) + f'''
<section class="hero" style="padding:56px 0"><div class="wrap"><span class="preview-chip">Preview · noindex</span>
<p class="eyebrow">FAQ</p><h1>Questions, answered</h1></div></section>
<section class="section"><div class="wrap narrow">
<details open><summary>What is Alln1 AI Studio?</summary><p>A founder-led AI studio for small businesses nationwide. We install Front Desk, Pipeline, Ops, Private Agent, Local Authority, and Demand Engine systems — Lab-tested, Liz-reviewed.</p></details>
<details><summary>Are Aria, Rex, Orbit, Sage, and Pulse employees?</summary><p>No. They are AI specialists, clearly labeled AI. Liz Martinez is the human founder who directs and reviews.</p></details>
<details><summary>How does pricing work?</summary><p>Flat standard setup prices per system, optional monthly care. Software vendors bill you directly.</p></details>
<details><summary>Do you work outside Houston?</summary><p>Yes — online nationwide. Houston is home base; in-person by appointment in Greater Houston only.</p></details>
<details><summary>Is AI involved in replies to me?</summary><p>Yes, AI may help draft. Liz reviews before anything is sent.</p></details>
</div></section>
{form_block()}
{footer()}
</body></html>'''
write("faq.html", faq)

# locations index
loc_links = ''.join(f'<a href="/locations/{L["slug"]}.html"><strong>{L["name"]}</strong><br><span class="tiny">{L["title"]}</span></a>' for L in LOCATIONS)
loc_index = head(
  "Locations | Alln1 AI Studio — Nationwide + Houston Base",
  "Alln1 AI Studio serves small businesses online nationwide. Location pages for Houston, Pearland, Katy, Sugar Land, Dallas, and Florida — unique content, no doorway spam.",
  "/locations/"
).replace(nav(), nav("locations"), 1) + f'''
<section class="hero" style="padding:56px 0"><div class="wrap">
<span class="preview-chip">Preview · noindex</span>
<p class="eyebrow">Locations</p>
<h1>Online nationwide. Based in Houston.</h1>
<p class="lead">Local pages help you find us for your city. Delivery is online everywhere; in-person only by appointment in Greater Houston. Google Business Profile stays a Houston service-area listing (address hidden).</p>
</div></section>
<section class="section"><div class="wrap"><div class="loc-list">{loc_links}</div>
<p class="tiny" style="margin-top:20px">Optional Florida city pages (Miami, Orlando, Tampa) can be added later with unique content — not thin duplicates.</p>
</div></section>
{footer()}
</body></html>'''
write("locations/index.html", loc_index)

for L in LOCATIONS:
  page = head(
    f"{L['title']} | Alln1 AI Studio",
    f"{L['intro'][:155]}",
    f"/locations/{L['slug']}.html"
  ).replace(nav(), nav("locations"), 1) + f'''
<section class="hero" style="padding:56px 0"><div class="wrap">
<span class="preview-chip">Preview · noindex</span>
<p class="eyebrow">{L['name']} · Alln1 AI Studio</p>
<h1>{L['title']}</h1>
<p class="lead">{L['intro']}</p>
<p class="trust">Based in Houston · Delivered online · In-person by appointment in Greater Houston (where noted)</p>
</div></section>
<section class="section"><div class="wrap" style="display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(280px,1fr))">
<div class="card"><h3>Who this page is for</h3><p>{L['angle']}</p></div>
<div class="card"><h3>How we meet</h3><p>{L['meet']}</p></div>
<div class="card"><h3>Systems that fit</h3><p>Front Desk, Pipeline, Ops, Local Authority, Demand Engine, and Private Agent — same Lab process everywhere. <a href="/services.html">See pricing</a>.</p></div>
</div>
<div class="wrap" style="margin-top:28px">
<p class="tiny">There is no Alln1 storefront at this location unless stated. GBP is Houston service-area only (address hidden). No fake local offices.</p>
<p class="cta"><a class="btn" href="/#inquiry">Book a studio consult</a><a class="btn ghost" href="/locations/">All locations</a></p>
</div></section>
{footer()}
</body></html>'''
  write(f"locations/{L['slug']}.html", page)

# 404 + redirects + sitemap (preview)
write("404.html", head("Not found | Alln1 AI Studio","Page not found.","/404.html") + '''
<section class="hero"><div class="wrap"><h1>Page not found</h1>
<p class="lead">Try the <a href="/">homepage</a> or <a href="/services.html">systems</a>.</p></div></section>
</body></html>''')

write("_redirects", """/about-us /about.html 301
/contact-us /#inquiry 301
/portfolio /services.html 301
/testimonials /about.html 301
/blog / 301
/resources /services.html 301
/how-it-works.html /#lab 301
/lead-catcher.html /services.html#pipeline 301
""")

# Lightweight stubs: redirect old service pages to services via meta refresh + link (keep files for any bookmarks on preview)
for old in ["lead-follow-up","inbox-triage","booking-reminders","review-requests","spreadsheet-dashboard","missed-call-textback","ai-email-drafts","invoice-receipt-reader","quote-proposal","website-chat","meeting-notes-tasks","starter-plan-brand","content-batch","how-it-works"]:
  write(f"{old}.html", f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=/services.html"><title>Moved | Alln1 AI Studio</title><link rel="stylesheet" href="/styles.css"></head>
<body><p class="wrap" style="padding:40px">This offer now lives under <a href="/services.html">Studio systems</a>.</p></body></html>''')

# sitemap listing preview paths (still noindex)
urls = ["/","/services.html","/about.html","/faq.html","/locations/"] + [f"/locations/{L['slug']}.html" for L in LOCATIONS]
sm = ['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for u in urls:
  sm.append(f"<url><loc>https://alln1business.com{u}</loc></url>")
sm.append("</urlset>")
write("sitemap.xml", "\n".join(sm))

print("DONE")
