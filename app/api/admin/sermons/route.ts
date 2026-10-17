import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { currentAdmin } from "@/lib/admin-auth";
import { type Language, type StoredSermon, readStored, saveStored } from "@/lib/sermons";
import { getSettings, updateSettings } from "@/lib/settings";
import { parseYouTubeId } from "@/lib/youtube";

export const dynamic = "force-dynamic";

const text = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\r\n/g, "\n").trim().slice(0, max) : "");

/** Add a sermon, or change one when an id is given. Only the fields sent are changed. */
export async function POST(req: Request) {
  if (!(await currentAdmin())) return Response.json({ error: "login" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const all = await readStored();
  const existing = all.find((s) => s.id === body.id);
  const has = (k: string) => k in body;

  const merged: StoredSermon = {
    ...(existing ?? { id: randomUUID().slice(0, 8), date: "", title: "" }),
    ...(has("date") && { date: text(body.date, 10) }),
    ...(has("title") && { title: text(body.title, 150) }),
    ...(has("preacher") && { preacher: text(body.preacher, 100) }),
    ...(has("scripture") && { scripture: text(body.scripture, 100) }),
    ...(has("summary") && { summary: text(body.summary, 2_000) }),
    ...(has("notes") && { notes: text(body.notes, 60_000) }),
    ...(has("hidden") && { hidden: body.hidden === true }),
    ...(has("language") && { language: (body.language === "mizo" || body.language === "english" ? body.language : undefined) as Language | undefined }),
  };

  if (has("youtube")) {
    const raw = text(body.youtube, 300);
    const id = raw ? parseYouTubeId(raw) : null;
    if (raw && !id) return Response.json({ error: "link" }, { status: 400 });
    merged.youtubeId = id ?? undefined;
  }
  if (has("seriesId")) {
    const wanted = text(body.seriesId, 40);
    merged.seriesId = (await getSettings()).series.some((s) => s.id === wanted) ? wanted : undefined;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(merged.date) || !merged.title) return Response.json({ error: "missing" }, { status: 400 });
  if (!merged.youtubeId && !merged.notes && !merged.text) return Response.json({ error: "empty" }, { status: 400 });

  await saveStored([...all.filter((s) => s.id !== merged.id), merged]);
  revalidatePath("/", "layout");
  return Response.json({ ok: true, id: merged.id });
}

export async function DELETE(req: Request) {
  if (!(await currentAdmin())) return Response.json({ error: "login" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  await saveStored((await readStored()).filter((s) => s.id !== id));
  if ((await getSettings()).pinnedId === id) await updateSettings({ pinnedId: "" });
  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
