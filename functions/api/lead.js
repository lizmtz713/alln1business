// Homepage inquiry forwarder (Cloudflare Pages Function: POST /api/lead).
// The page sends the same JSON it used to post from the browser. This function
// forwards that body to env.MAKE_WEBHOOK_URL so the webhook stays off the page.
export async function handleLead(request, env) {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== url.host) return new Response("Bad origin.", { status: 403, headers: { "Cache-Control": "no-store" } });
  if (!env.MAKE_WEBHOOK_URL) return new Response("The form isn't connected yet.", { status: 503, headers: { "Cache-Control": "no-store" } });

  const body = await request.text();
  if (body.length > 20000) return new Response("That message is too long.", { status: 413, headers: { "Cache-Control": "no-store" } });

  try {
    const r = await fetch(env.MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (r.body) await r.body.cancel();
    if (!r.ok) return new Response("Sorry, that didn't go through.", { status: 502, headers: { "Cache-Control": "no-store" } });
    return new Response("ok", { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return new Response("Sorry, that didn't go through.", { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}

export async function onRequest(context) { return handleLead(context.request, context.env); }
