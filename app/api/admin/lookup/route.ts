import { currentAdmin } from "@/lib/admin-auth";
import { lookupVideo, parseYouTubeId } from "@/lib/youtube";

export const dynamic = "force-dynamic";

/** Fills in a sermon's title, thumbnail and date from a pasted YouTube link. */
export async function GET(req: Request) {
  if (!(await currentAdmin())) return Response.json({ error: "login" }, { status: 401 });
  const id = parseYouTubeId(new URL(req.url).searchParams.get("url") ?? "");
  if (!id) return Response.json({ error: "link" }, { status: 400 });
  const info = await lookupVideo(id).catch(() => null);
  if (!info) return Response.json({ error: "video" }, { status: 404 });
  return Response.json(info);
}
