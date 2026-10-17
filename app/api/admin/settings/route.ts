import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { currentAdmin } from "@/lib/admin-auth";
import { listAlbumFolders } from "@/lib/drive";
import { googleConfigured } from "@/lib/google";
import { readStored } from "@/lib/sermons";
import { getSettings, updateSettings } from "@/lib/settings";
import { syncPhotos } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Pin or unpin the featured sermon, hide or show albums, or choose the Drive photo folder. */
export async function POST(req: Request) {
  if (!(await currentAdmin())) return Response.json({ error: "login" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const settings = await getSettings();

  if ("pinnedId" in body) {
    const id = typeof body.pinnedId === "string" ? body.pinnedId : "";
    if (id && !(await readStored()).some((s) => s.id === id)) return Response.json({ error: "missing" }, { status: 404 });
    await updateSettings({ pinnedId: id });
  }

  if (typeof body.album === "string" && typeof body.hidden === "boolean") {
    const rest = settings.hiddenAlbums.filter((k) => k !== body.album);
    await updateSettings({ hiddenAlbums: body.hidden ? [...rest, body.album] : rest });
  }

  if ("driveFolder" in body) {
    // Accepts the folder's link or just its id; empty goes back to the site's default folder.
    const raw = typeof body.driveFolder === "string" ? body.driveFolder.trim() : "";
    const id = raw.match(/folders\/([\w-]+)/)?.[1] ?? raw.match(/^[\w-]{10,}$/)?.[0] ?? "";
    if (raw && !id) return Response.json({ error: "folder" }, { status: 400 });
    if (id && googleConfigured()) {
      // Make sure the robot account can actually see it before switching.
      try {
        await listAlbumFolders(id);
      } catch {
        return Response.json({ error: "access" }, { status: 400 });
      }
    }
    await updateSettings({ driveFolderId: id });
    after(() => syncPhotos({ budgetMs: 45_000 }).then(() => revalidatePath("/", "layout")));
  }

  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
