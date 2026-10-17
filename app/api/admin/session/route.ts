import { adminEnabled, checkLogin, cookieHeader, isLockedOut, makeToken, recordFailure } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!adminEnabled()) return Response.json({ error: "off" }, { status: 503 });
  if (await isLockedOut()) return Response.json({ error: "locked" }, { status: 429 });

  const { name, password } = (await req.json().catch(() => ({}))) as { name?: unknown; password?: unknown };
  const who = typeof name === "string" && typeof password === "string" ? checkLogin(name, password) : null;
  if (!who) {
    await recordFailure();
    return Response.json({ error: "wrong" }, { status: 401 });
  }
  return Response.json({ ok: true }, { headers: { "Set-Cookie": cookieHeader(makeToken(who)) } });
}

/** Log out. */
export async function DELETE() {
  return Response.json({ ok: true }, { headers: { "Set-Cookie": cookieHeader("", 0) } });
}
