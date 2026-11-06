// Alln1 Business inquiry form handler (Cloudflare Pages Function: POST /api/inquiry).
// Validates the form, checks honeypot + timing + Turnstile + a basic per-IP rate limit,
// then forwards a clean JSON payload to the Make webhook in env.MAKE_WEBHOOK_URL.
// Env (set per Pages environment): MAKE_WEBHOOK_URL, TURNSTILE_SECRET (secret), SOURCE_LABEL (optional).
const MAX = { name: 100, business: 150, email: 150, phone: 40, website: 200, tools: 600, budget: 60, message: 3000, offer: 80 };
const INTERESTS = ["Sales", "Marketing", "Social Media", "Systems/Integrations", "Business Launch", "Not sure"];
const BUDGETS = ["", "Not sure yet", "Under $1,000", "$1,000 to $2,500", "$2,500 to $5,000", "$5,000+", "Monthly care plan only"];
const OFFERS = { audit: "AI Audit & Roadmap ($497)", launch: "AI-Ready Business Launch", "black-friday": "Black Friday setup special" };
const RATE = { windowMs: 10 * 60 * 1000, max: 5 };
const hits = new Map(); // per-isolate, best effort

function clean(v, n) { return String(v == null ? "" : v).replace(/\u0000/g, "").trim().slice(0, n); }
function chicagoNow() {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date()).map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day} ${p.hour === "24" ? "00" : p.hour}:${p.minute}`;
}
function rateLimited(ip) {
  const now = Date.now(); const arr = (hits.get(ip) || []).filter(t => now - t < RATE.windowMs);
  arr.push(now); hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > RATE.max;
}
function reply(req, status, body) {
  const wantsJson = (req.headers.get("accept") || "").includes("application/json");
  if (!wantsJson) {
    const to = body.ok ? "/thanks" : `/contact?error=${encodeURIComponent(body.code || "failed")}`;
    return new Response(null, { status: 303, headers: { Location: to, "Cache-Control": "no-store" } });
  }
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}

export async function handleInquiry(request, env) {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== url.host) return reply(request, 403, { ok: false, code: "origin", error: "Bad origin." });
  const len = Number(request.headers.get("content-length") || 0);
  if (len > 20000) return reply(request, 413, { ok: false, code: "too_large", error: "That message is too long." });

  let f;
  try {
    const ct = request.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const j = await request.json(); f = { get: k => j[k], getAll: k => [].concat(j[k] || []) };
    } else { f = await request.formData(); }
  } catch (e) { return reply(request, 400, { ok: false, code: "bad_request", error: "Could not read the form." }); }

  // Honeypot: bots fill it. Pretend success, forward nothing.
  if (clean(f.get("company_url"), 200)) return reply(request, 200, { ok: true });
  // Timing: humans take more than 3 seconds.
  const t = Number(f.get("t") || 0);
  if (t && Date.now() - t < 3000) return reply(request, 200, { ok: true });

  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  if (rateLimited(ip)) return reply(request, 429, { ok: false, code: "rate", error: "Too many tries. Please wait a few minutes, or email or call instead." });

  const d = {
    name: clean(f.get("name"), MAX.name), business: clean(f.get("business"), MAX.business),
    email: clean(f.get("email"), MAX.email).toLowerCase(), phone: clean(f.get("phone"), MAX.phone),
    website: clean(f.get("website"), MAX.website), tools: clean(f.get("tools"), MAX.tools),
    budget: clean(f.get("budget"), MAX.budget), message: clean(f.get("message"), MAX.message),
    offer: OFFERS[clean(f.get("offer"), MAX.offer)] || "",
  };
  const interests = [...new Set(f.getAll("interests").map(x => clean(x, 40)).filter(x => INTERESTS.includes(x)))];
  const errs = [];
  if (!d.name) errs.push("your name");
  if (!d.business) errs.push("your business name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) errs.push("a valid email");
  if (!interests.length) errs.push("at least one thing you want help with");
  if (d.message.length < 5) errs.push("a short message");
  if (d.phone && !/^[0-9+().\-\s]{7,40}$/.test(d.phone)) errs.push("a valid phone number (or leave it blank)");
  if (d.website && !/^(https?:\/\/)?[^\s]+\.[^\s]{2,}$/i.test(d.website)) errs.push("a valid website (or leave it blank)");
  if (!BUDGETS.includes(d.budget)) d.budget = "";
  if (errs.length) return reply(request, 400, { ok: false, code: "invalid", error: "Please add " + errs.join(", ") + "." });

  if (env.TURNSTILE_SECRET) {
    const token = clean(f.get("cf-turnstile-response"), 2048);
    if (!token) return reply(request, 403, { ok: false, code: "captcha", error: "Please complete the quick security check." });
    const vr = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip }),
    }).then(r => r.json()).catch(() => ({ success: false }));
    if (!vr.success) return reply(request, 403, { ok: false, code: "captcha", error: "The security check didn't pass. Please try again." });
  }

  if (!env.MAKE_WEBHOOK_URL) return reply(request, 503, { ok: false, code: "not_configured", error: "The form isn't connected yet." });
  const summary = [
    `Help with: ${interests.join(", ")}`,
    d.offer && `Offer: ${d.offer}`,
    d.budget && `Budget: ${d.budget}`,
    d.tools && `Tools: ${d.tools}`,
    d.website && `Website: ${d.website}`,
  ].filter(Boolean).join("\n") + "\n\n" + d.message;
  const payload = {
    ...d, interests: interests.join(", "), summary, checks: "passed",
    submitted_at: chicagoNow(), page: clean(f.get("page"), 200) || url.origin + "/contact",
    source: env.SOURCE_LABEL || url.host, is_test: /^TEST\b/i.test(d.name),
  };
  try {
    const r = await fetch(env.MAKE_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!r.ok) throw new Error("webhook " + r.status);
  } catch (e) {
    return reply(request, 502, { ok: false, code: "forward", error: "Sorry, that didn't go through." });
  }
  return reply(request, 200, { ok: true });
}

export async function onRequest(context) { return handleInquiry(context.request, context.env); }
