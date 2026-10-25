const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
});

function escapeHtml(value = "") {
  return String(value).replace(/[&<>\"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
  }[ch]));
}

export default async (request) => {
  if (request.method !== "POST") return json(405, { error: "Use the Send postcard button on Littlepost." });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return json(500, { error: "Email sending isn't configured yet: the RESEND_API_KEY setting is missing in Netlify." });

  let body;
  try { body = await request.json(); }
  catch { return json(400, { error: "The request could not be read. Please try again." }); }

  // Simple honeypot to reduce automated abuse.
  if (body.website) return json(200, { ok: true });

  const to = typeof body.to === "string" ? body.to.trim() : "";
  if (to.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return json(400, { error: "Please enter a valid recipient email address." });
  }

  const postcard = typeof body.postcard === "string" ? body.postcard : "";
  const match = postcard.match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/);
  if (!match || match[1].length > 2_000_000) {
    return json(400, { error: "The postcard image is missing or too large. Please try a smaller photo." });
  }

  const senderName = typeof body.fromName === "string" ? body.fromName.trim().slice(0, 100) : "";
  const note = typeof body.message === "string" ? body.message.trim().slice(0, 1200) : "";
  const from = process.env.RESEND_FROM_EMAIL || "Littlepost <onboarding@resend.dev>";
  const greeting = senderName ? `with love, ${escapeHtml(senderName)}` : "with love";
  const noteHtml = note ? escapeHtml(note).replace(/\r?\n/g, "<br>") : "I made you a little postcard!";

  let response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject: "A little postcard for you",
        html: `<div style="font-family:Georgia,serif;color:#263b36;line-height:1.6"><p>Hello!</p><p>${noteHtml}</p><p>${greeting} — Littlepost</p><p style="color:#7b7b70;font-size:12px">Sent with Littlepost</p></div>`,
        attachments: [{ filename: "littlepost-postcard.jpg", content: match[1] }],
      }),
    });
  } catch {
    return json(502, { error: "Littlepost couldn't reach the email service. Please try again in a moment." });
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Give a useful but safe message for common sender/domain verification issues.
    if (response.status === 401 || response.status === 403) {
      return json(502, { error: "Resend rejected the request. Check that the API key is correct and that the sender address is verified. During testing, onboarding@resend.dev can only send to the email address associated with your Resend account." });
    }
    return json(502, { error: "Resend could not send this email. Check your Resend dashboard for the reason, then try again." });
  }

  return json(200, { ok: true, id: result.id || null });
};
