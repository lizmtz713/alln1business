#!/usr/bin/env python3
"""Builds the inquiry-form PREVIEW into dist-inquiry-form/ from the current built site.
Does not modify any existing file in alln1-studio-site. Adds /contact, /privacy, /thanks,
points 'Book an AI Audit' buttons to /contact, swaps the homepage form for a CTA,
and creates _worker.js (+ _routes.json) from functions/api/inquiry.js."""
import os, re, shutil, html
from pathlib import Path
SRC = Path(__file__).resolve().parent
OUT = SRC / "dist-inquiry-form"
SITEKEY = os.environ.get("TURNSTILE_SITEKEY", "0x4AAAAAAF2R--JxlPkRre3n")
SKIP_DIRS = {"shots", "functions", "dist-inquiry-form", "__pycache__"}
SKIP_FILES = {"build.py", "build_v2.py", "build_inquiry_form.py", "about_body.html.tpl", "about_css.txt"}

if OUT.exists(): shutil.rmtree(OUT)
OUT.mkdir()
for p in SRC.rglob("*"):
    rel = p.relative_to(SRC)
    if rel.parts[0] in SKIP_DIRS or p.is_dir() or p.name in SKIP_FILES or p.suffix in (".py", ".bak"): continue
    (OUT / rel).parent.mkdir(parents=True, exist_ok=True); shutil.copy2(p, OUT / rel)

about = (SRC / "about.html").read_text()
HEADER = about[about.find("<body>"):about.find("</header>") + 9].replace(' class="on"', "")
FOOTER = about[about.find("<footer>"):]

OFFER_MAP = {"AI Audit & Roadmap": "audit", "AI-Ready Business Launch": "launch", "Black Friday setup special": "black-friday"}
def patch_links(s):
    s = re.sub(r'href="#inquiry" onclick="var s=document\.getElementById\(\'service_interest\'\);if\(s\)s\.value=\'([^\']+)\';"',
               lambda m: f'href="/contact?interest={OFFER_MAP.get(m.group(1), "")}"' if OFFER_MAP.get(m.group(1)) else 'href="/contact"', s)
    s = re.sub(r'href="/?#audit"(\s*)>(Book an AI Audit)', r'href="/contact?interest=audit"\1>\2', s)
    s = s.replace('href="/#inquiry"', 'href="/contact"').replace('href="#inquiry"', 'href="/contact"')
    s = s.replace('<a href="/contact">Inquiry</a></p>', '<a href="/contact">Contact</a> · <a href="/privacy">Privacy</a></p>')
    return s

HOME_CTA = '''<section id="inquiry" class="section alt">
<div class="wrap narrow" style="text-align:center">
<p class="eyebrow">Start here</p>
<h2>Tell us what you want connected</h2>
<p class="lede" style="margin:0 auto 18px">A short form: your business, what you want help with, and the tools you use now. Liz replies within 1 business day.</p>
<p class="cta" style="justify-content:center"><a class="btn" href="/contact">Start your inquiry</a><a class="btn ghost" href="/contact?interest=audit">Book an AI Audit ($497)</a></p>
<p class="tiny">Prefer email or phone? <a href="mailto:liz@alln1business.com">liz@alln1business.com</a> · <a href="tel:+12818103315">(281) 810-3315</a></p>
</div></section>'''

for p in OUT.rglob("*.html"):
    s = p.read_text()
    if '<section id="inquiry"' in s:
        a = s.find('<section id="inquiry"'); b = s.find("</script>", a) + 9
        assert a > 0 and "/api/lead" in s[a:b]
        s = s[:a] + HOME_CTA + s[b:]
        assert "hook.us1.make.com" not in s and "/api/lead" not in s
    s = patch_links(s)
    p.write_text(s)
HEADER = patch_links(HEADER); FOOTER = patch_links(FOOTER)

def page(path, title, desc, body, extra_head="", index=True):
    robots = "" if index else '<meta name="robots" content="noindex">\n'
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
{robots}<link rel="canonical" href="https://alln1business.com{path}">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:site_name" content="Alln1 Business | Grow Your Business with AI">
<meta property="og:type" content="website">
<meta property="og:url" content="https://alln1business.com{path}">
<meta property="og:image" content="https://alln1business.com/assets/logo.png">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/styles.css">
<style>
.lead-form fieldset{{border:1px solid var(--line);border-radius:12px;padding:12px 14px 4px;margin:0 0 14px}}
.lead-form legend{{font-weight:600;padding:0 6px}}
.lead-form .checks{{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:4px 14px}}
.lead-form .checks label{{display:flex;align-items:center;gap:10px;font-weight:500;margin:0 0 10px;cursor:pointer}}
.lead-form .checks input{{width:20px;height:20px;margin:0;flex:0 0 auto;accent-color:var(--orange)}}
.lead-form .opt{{font-weight:400;color:var(--muted);font-size:14px}}
.lead-form .row2{{display:grid;grid-template-columns:1fr 1fr;gap:0 16px}}
@media(max-width:640px){{.lead-form .row2{{grid-template-columns:1fr}}}}
.lead-form .consent{{font-size:14px;color:var(--muted);margin:4px 0 14px}}
.offer-chip{{display:inline-block;background:rgba(32,168,224,.15);color:var(--blue);font-weight:700;font-size:14px;padding:6px 12px;border-radius:999px;margin:0 0 16px}}
.form-panel{{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:26px}}
.cf-turnstile{{margin:4px 0 14px;min-height:65px}}
.form-status.err a,.form-status.ok a{{font-weight:700}}
.prose h2{{margin-top:32px}}.prose p,.prose li{{color:var(--muted)}}
</style>
{extra_head}</head>
{HEADER}
<main>
{body}
</main>
{FOOTER}'''

FORM_BODY = f'''<section class="section">
<div class="wrap narrow">
<p class="eyebrow">Contact Alln1 Business</p>
<h1 style="margin-top:0">Tell us what you want connected</h1>
<p class="lede">Share a little about your business and what you want help with. Liz reads every inquiry and replies within 1 business day. AI may help draft the reply, and she reviews it before it's sent.</p>
<div class="form-panel" id="form-panel">
<p id="offer-chip" class="offer-chip" hidden></p>
<form id="lead-form" class="lead-form" action="/api/inquiry" method="post" novalidate>
<input type="hidden" name="offer" id="offer" value="">
<input type="hidden" name="t" id="t" value="">
<input type="hidden" name="page" id="page" value="">
<div class="row2">
<label>Your name<input name="name" required autocomplete="name" maxlength="100"></label>
<label>Business name<input name="business" required autocomplete="organization" maxlength="150"></label>
</div>
<div class="row2">
<label>Email<input name="email" type="email" required autocomplete="email" maxlength="150" inputmode="email"></label>
<label>Phone <span class="opt">(optional)</span><input name="phone" type="tel" autocomplete="tel" maxlength="40"></label>
</div>
<label>Website <span class="opt">(optional)</span><input name="website" type="text" inputmode="url" autocomplete="url" maxlength="200" placeholder="yourbusiness.com"></label>
<fieldset>
<legend>What do you want help with?</legend>
<div class="checks">
<label><input type="checkbox" name="interests" value="Sales">Sales</label>
<label><input type="checkbox" name="interests" value="Marketing">Marketing</label>
<label><input type="checkbox" name="interests" value="Social Media">Social Media</label>
<label><input type="checkbox" name="interests" value="Systems/Integrations">Systems / Integrations</label>
<label><input type="checkbox" name="interests" value="Business Launch" id="i-launch">Business Launch</label>
<label><input type="checkbox" name="interests" value="Not sure">Not sure yet</label>
</div>
</fieldset>
<label>Tools you use now <span class="opt">(optional)</span><input name="tools" maxlength="600" placeholder="e.g. QuickBooks, Square, Google Calendar, a CRM, Instagram"></label>
<label>Budget range <span class="opt">(optional)</span><select name="budget">
<option value="">Choose one</option>
<option>Not sure yet</option>
<option>Under $1,000</option>
<option>$1,000 to $2,500</option>
<option>$2,500 to $5,000</option>
<option>$5,000+</option>
<option>Monthly care plan only</option>
</select></label>
<label>Message<textarea name="message" required rows="5" maxlength="3000" placeholder="What's taking too much time, or what do you want to grow?"></textarea></label>
<div class="hp" aria-hidden="true"><label>Company URL<input name="company_url" tabindex="-1" autocomplete="off"></label></div>
<div class="cf-turnstile" data-sitekey="{SITEKEY}" data-theme="dark" data-size="flexible"></div>
<p class="consent">By sending, you agree we can contact you about your request. See our <a href="/privacy">privacy note</a>.</p>
<button class="btn" type="submit">Send inquiry</button>
<p id="form-status" class="form-status" role="status" aria-live="polite"></p>
<noscript><p class="form-status err">This form needs JavaScript for its security check. Please email <a href="mailto:liz@alln1business.com">liz@alln1business.com</a> or call <a href="tel:+12818103315">(281) 810-3315</a>.</p></noscript>
</form>
</div>
<p class="tiny" style="margin-top:16px">Prefer email or phone? <a href="mailto:liz@alln1business.com">liz@alln1business.com</a> · <a href="tel:+12818103315">(281) 810-3315</a>. Based in Houston, delivered online nationwide.</p>
</div></section>
<script>
(function(){{
var f=document.getElementById('lead-form'),st=document.getElementById('form-status'),b=f.querySelector('button[type=submit]');
document.getElementById('t').value=Date.now();document.getElementById('page').value=location.origin+location.pathname;
var OFFERS={{audit:'AI Audit & Roadmap ($497)',launch:'AI-Ready Business Launch','black-friday':'Black Friday setup special'}};
var q=new URLSearchParams(location.search),it=q.get('interest');
if(it&&OFFERS[it]){{document.getElementById('offer').value=it;var c=document.getElementById('offer-chip');c.textContent='You\\'re asking about: '+OFFERS[it];c.hidden=false;
 if(it==='launch')document.getElementById('i-launch').checked=true;}}
var FALL='Please email <a href="mailto:liz@alln1business.com">liz@alln1business.com</a> or call <a href="tel:+12818103315">(281) 810-3315</a>.';
if(q.get('error'))st.innerHTML='Sorry, that didn\\'t go through. '+FALL,st.className='form-status err';
function err(m,fb){{st.innerHTML=m+(fb?' '+FALL:'');st.className='form-status err';}}
f.addEventListener('submit',async function(e){{e.preventDefault();
 var fd=new FormData(f),miss=[];
 if(!String(fd.get('name')||'').trim())miss.push('your name');
 if(!String(fd.get('business')||'').trim())miss.push('your business name');
 if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{{2,}}$/.test(String(fd.get('email')||'').trim()))miss.push('a valid email');
 if(!fd.getAll('interests').length)miss.push('at least one thing you want help with');
 if(String(fd.get('message')||'').trim().length<5)miss.push('a short message');
 if(miss.length)return err('Please add '+miss.join(', ')+'.');
 if(window.turnstile&&!fd.get('cf-turnstile-response'))return err('Please complete the quick security check above the button.');
 b.disabled=true;st.textContent='Sending...';st.className='form-status';
 try{{var r=await fetch('/api/inquiry',{{method:'POST',headers:{{'Accept':'application/json'}},body:new URLSearchParams(fd)}});
  var j={{}};try{{j=await r.json();}}catch(x){{}}
  if(r.ok&&j.ok){{document.getElementById('form-panel').innerHTML='<h2 style="margin-top:0">Thanks, your inquiry was sent.</h2><p class="lede">Liz will reply within 1 business day. If it\\'s urgent, call or text <a href="tel:+12818103315">(281) 810-3315</a>.</p><p><a class="btn ghost" href="/services">See systems &amp; pricing</a></p>';window.scrollTo({{top:0,behavior:'smooth'}});return;}}
  err((j.error||'Sorry, that didn\\'t go through.'),r.status>=500||!j.error||j.code==='rate');
  if(window.turnstile)try{{turnstile.reset();}}catch(x){{}}
 }}catch(x){{err('Sorry, that didn\\'t go through.',true);}}
 finally{{b.disabled=false;}}
}});
}})();
</script>'''

(OUT / "contact.html").write_text(page("/contact", "Contact Alln1 Business | Start an Inquiry or Book an AI Audit",
  "Tell Alln1 Business what you want connected: sales, marketing, social media, systems and integrations, or a business launch. Liz replies within 1 business day.",
  FORM_BODY, '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>\n'))

PRIVACY = '''<section class="section"><div class="wrap narrow prose">
<p class="eyebrow">Privacy note</p>
<h1 style="margin-top:0">How we use what you send us</h1>
<p>This is a short, plain-language note about the contact form on alln1business.com.</p>
<h2>What we collect</h2>
<p>What you type into the form: your name, business name, email, and, if you choose, your phone, website, the tools you use, a budget range and your message. We also record the date and time you sent it.</p>
<h2>How we use it</h2>
<ul><li>To reply to your request and talk with you about it.</li><li>To keep a simple record of inquiries so nothing gets lost.</li></ul>
<p>We don't sell your information, and we don't add you to a mailing list without asking.</p>
<h2>Who handles it</h2>
<p>The form runs on Cloudflare, which also provides the spam check (Turnstile). Your inquiry is passed through Make.com to a private Google Sheet and to Liz's business email (Microsoft 365). AI tools may help Liz draft a reply, and she reviews every reply before it's sent.</p>
<h2>Your choices</h2>
<p>To see, correct or delete what you sent, email <a href="mailto:liz@alln1business.com">liz@alln1business.com</a> or call <a href="tel:+12818103315">(281) 810-3315</a>.</p>
<p class="tiny">Last updated November 2026.</p>
</div></section>'''
(OUT / "privacy.html").write_text(page("/privacy", "Privacy Note | Alln1 Business", "How Alln1 Business uses the information you send through the contact form.", PRIVACY))

THANKS = '''<section class="section"><div class="wrap narrow" style="text-align:center">
<p class="eyebrow">Inquiry sent</p>
<h1 style="margin-top:0">Thanks, we got it.</h1>
<p class="lede" style="margin:0 auto 18px">Liz will reply within 1 business day. If it's urgent, call or text <a href="tel:+12818103315">(281) 810-3315</a>.</p>
<p class="cta" style="justify-content:center"><a class="btn" href="/services">See systems &amp; pricing</a><a class="btn ghost" href="/">Back to home</a></p>
</div></section>'''
(OUT / "thanks.html").write_text(page("/thanks", "Thanks | Alln1 Business", "Your inquiry was sent to Alln1 Business.", THANKS, index=False))

red = (OUT / "_redirects").read_text()
red = red.replace("/contact-us /#inquiry 301", "/contact-us /contact 301").replace("/thank-you /#inquiry 301", "/thank-you /thanks 301").replace("/thank-you.html /#inquiry 302", "/thank-you.html /thanks 301")
red += "/contact.html /contact 301\n/privacy.html /privacy 301\n"
(OUT / "_redirects").write_text(red)

sm = (OUT / "sitemap.xml").read_text()
if "/contact<" not in sm:
    add = "".join(f"<url><loc>https://alln1business.com{u}</loc></url>\n" for u in ("/contact", "/privacy"))
    sm = sm.replace("</urlset>", add + "</urlset>")
(OUT / "sitemap.xml").write_text(sm)

fn = (SRC / "functions/api/inquiry.js").read_text()
worker = fn.replace("export async function onRequest(context) { return handleInquiry(context.request, context.env); }", "") + '''
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/inquiry" || url.pathname === "/api/inquiry/") return handleInquiry(request, env);
    return env.ASSETS.fetch(request);
  },
};
'''
(OUT / "_worker.js").write_text(worker)
(OUT / "_routes.json").write_text('{"version":1,"include":["/api/*"],"exclude":[]}\n')
print("built", OUT, sum(1 for _ in OUT.rglob("*") if _.is_file()), "files")
