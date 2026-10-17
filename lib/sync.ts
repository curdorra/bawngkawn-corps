import { type Manifest, type Photo, MANIFEST_KEY, parseFolderName, slugify } from "./albums";
import { driveConfigured, listAlbumFolders, listImages, photoUrls } from "./drive";
import { getDriveFolderId } from "./settings";
import { readJson, writeJson } from "./store";

// Reads the "Website Photos" Drive folder and saves the list of albums and photos (just names and ids,
// no image files are copied):  Drive folder → album,  image in it → photo.
// Photos deleted from Drive disappear from the list on the next run.

const STALE_AFTER_MS = 4 * 60_000;

export const syncConfigured = async () => driveConfigured() && Boolean(await getDriveFolderId());

export type SyncResult = { skipped?: string; added: number; removed: number; albums: number; pending: number };

/** Runs a sync unless one ran in the last few minutes. Safe to call on every page render. */
export async function syncIfStale() {
  if (!(await syncConfigured())) return;
  const manifest = await readJson<Manifest | null>(MANIFEST_KEY, null);
  const checkedAt = manifest ? Date.parse(manifest.checkedAt) : 0;
  if (Date.now() - checkedAt < STALE_AFTER_MS) return;
  await syncPhotos().catch((err) => console.error("Photo sync failed:", err));
}

export async function syncPhotos(): Promise<SyncResult> {
  if (!(await syncConfigured())) return { added: 0, removed: 0, albums: 0, pending: 0, skipped: "not configured" };

  const old = await readJson<Manifest | null>(MANIFEST_KEY, null);
  const before = new Set((old?.albums ?? []).flatMap((a) => a.photos.map((p) => p.id)));

  const folders = await listAlbumFolders(await getDriveFolderId());
  const used = new Set<string>();
  const albums = [];
  for (const f of folders) {
    const { date, title } = parseFolderName(f.name, f.createdTime);
    let slug = slugify(date, title);
    for (let n = 2; used.has(slug); n++) slug = `${slugify(date, title)}-${n}`;
    used.add(slug);
    const photos: Photo[] = (await listImages(f.id)).map((i) => ({ id: i.id, ...photoUrls(i.id) }));
    albums.push({ folderId: f.id, slug, title, date, photos });
  }
  albums.sort((a, b) => b.date.localeCompare(a.date));

  await writeJson(MANIFEST_KEY, { checkedAt: new Date().toISOString(), albums } satisfies Manifest);

  const now = new Set(albums.flatMap((a) => a.photos.map((p) => p.id)));
  return {
    added: [...now].filter((id) => !before.has(id)).length,
    removed: [...before].filter((id) => !now.has(id)).length,
    albums: albums.filter((a) => a.photos.length).length,
    pending: 0,
  };
}
