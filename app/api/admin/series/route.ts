import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { currentAdmin } from "@/lib/admin-auth";
import { readStored, saveStored } from "@/lib/sermons";
import { getSettings, updateSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** Create a series, or rename one when an id is given. */
export async function POST(req: Request) {
  if (!(await currentAdmin())) return Response.json({ error: "login" }, { status: 401 });
  const { id, name } = (await req.json().catch(() => ({}))) as { id?: unknown; name?: unknown };
  const clean = typeof name === "string" ? name.trim().slice(0, 100) : "";
  if (!clean) return Response.json({ error: "missing" }, { status: 400 });

  const { series } = await getSettings();
  if (series.some((s) => s.id !== id && s.name.toLowerCase() === clean.toLowerCase())) return Response.json({ error: "exists" }, { status: 409 });
  const next = series.some((s) => s.id === id) ? series.map((s) => (s.id === id ? { ...s, name: clean } : s)) : [...series, { id: randomUUID().slice(0, 8), name: clean }];
  await updateSettings({ series: next });
  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}

/** Deleting a series keeps its sermons; they just stop belonging to a series. */
export async function DELETE(req: Request) {
  if (!(await currentAdmin())) return Response.json({ error: "login" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  const { series } = await getSettings();
  await updateSettings({ series: series.filter((s) => s.id !== id) });
  await saveStored((await readStored()).map((s) => (s.seriesId === id ? { ...s, seriesId: undefined } : s)));
  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
