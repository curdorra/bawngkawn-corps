import { codeMatches, cookieHeader, editingEnabled, isLockedOut, makeToken, recordFailure } from "@/lib/sermon-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!editingEnabled()) return Response.json({ error: "off" }, { status: 503 });
  if (await isLockedOut()) return Response.json({ error: "locked" }, { status: 429 });

  const { code } = (await req.json().catch(() => ({}))) as { code?: unknown };
  if (typeof code !== "string" || !codeMatches(code.trim())) {
    await recordFailure();
    return Response.json({ error: "wrong" }, { status: 401 });
  }
  return Response.json({ ok: true }, { headers: { "Set-Cookie": cookieHeader(makeToken()) } });
}

/** Log out. */
export async function DELETE() {
  return Response.json({ ok: true }, { headers: { "Set-Cookie": cookieHeader("", 0) } });
}
