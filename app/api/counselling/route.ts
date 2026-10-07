import { googleConfigured, googleFetch } from "@/lib/google";

// Receives the "Talk to someone" form and adds one row to a private Google Sheet.
// The message itself is never written to the server logs.
// If email is set up (see .env.example), the responsible person also gets a short "new request" email.
// The email deliberately says nothing about what was written: they open the private Sheet to read it.

export const dynamic = "force-dynamic";

const hits = new Map<string, number[]>(); // very small per-visitor limit; resets when the server restarts
const LIMIT = 5;
const WINDOW_MS = 60 * 60_000;

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
// A leading = + - @ would be read as a formula by the spreadsheet.
const safe = (v: string) => (/^[=+\-@]/.test(v) ? `'${v}` : v);

export async function POST(req: Request) {
  const sheetId = process.env.GOOGLE_COUNSELLING_SHEET_ID;
  if (!sheetId || !googleConfigured()) return Response.json({ error: "not-configured" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (clean(body.website, 50)) return Response.json({ ok: true }); // bot: pretend it worked

  const name = clean(body.name, 80);
  const contact = clean(body.contact, 120);
  const message = clean(body.message, 2000);
  if (!contact || body.consent !== "yes") return Response.json({ error: "missing" }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const recent = (hits.get(ip) ?? []).filter((t) => Date.now() - t < WINDOW_MS);
  if (recent.length >= LIMIT) return Response.json({ error: "slow-down" }, { status: 429 });
  hits.set(ip, [...recent, Date.now()]);

  try {
    const when = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
    await googleFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent("Requests!A:D")}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ values: [[when, safe(name), safe(contact), safe(message)]] }) },
    );
    await notify(sheetId);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "failed" }, { status: 500 });
  }
}

async function notify(sheetId: string) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.COUNSELLING_NOTIFY_EMAIL;
  if (!key || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM_EMAIL || "Bawngkawn Corps website <onboarding@resend.dev>",
        to: to.split(",").map((e) => e.trim()),
        subject: "Someone has asked to talk",
        text: `A new request came in through the website's "Talk to someone" form.\n\nPlease open the private Counselling Requests sheet to read it and reach out kindly:\nhttps://docs.google.com/spreadsheets/d/${sheetId}\n`,
      }),
    });
  } catch {
    // The request is already saved in the Sheet. A failed email must not make the form look broken.
  }
}
