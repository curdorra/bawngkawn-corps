import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { COOKIE, validToken } from "@/lib/sermon-auth";
import { readStored, saveStored } from "@/lib/sermons";

export const dynamic = "force-dynamic";

async function allowed() {
  return validToken((await cookies()).get(COOKIE)?.value);
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\r\n/g, "\n").trim().slice(0, max) : "");

/** Add a sermon, or change one when an id is given. */
export async function POST(req: Request) {
  if (!(await allowed())) return Response.json({ error: "login" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const date = text(body.date, 10);
  const title = text(body.title, 150);
  const sermonText = text(body.text, 60_000);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !title || !sermonText) return Response.json({ error: "missing" }, { status: 400 });

  const all = await readStored();
  const id = typeof body.id === "string" && all.some((s) => s.id === body.id) ? body.id : randomUUID().slice(0, 8);
  await saveStored([...all.filter((s) => s.id !== id), { id, date, title, text: sermonText }]);
  revalidatePath("/", "layout");
  return Response.json({ ok: true, id });
}

export async function DELETE(req: Request) {
  if (!(await allowed())) return Response.json({ error: "login" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  await saveStored((await readStored()).filter((s) => s.id !== id));
  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
