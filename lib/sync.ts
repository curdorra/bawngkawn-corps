import sharp, { type Metadata } from "sharp";
import { type Manifest, type Photo, MANIFEST_KEY, parseFolderName, slugify } from "./albums";
import { type DriveFile, downloadFile, downloadRendition, listAlbumFolders, listImages } from "./drive";
import { googleConfigured } from "./google";
import { getDriveFolderId } from "./settings";
import { deleteObject, getObject, putObject, publicUrl, r2Configured } from "./r2";

// Copies photos from the "Website Photos" Drive folder into R2:
//   Drive folder  →  album
//   photo in it   →  original (full quality) + preview (2000px) + thumb (600px)
// Only new photos are processed; photos deleted from Drive are removed from the site.
// Big uploads are done a batch at a time. Each run carries on where the last one stopped.

const LOCK_KEY = "sync-lock.json";
const STALE_AFTER_MS = 4 * 60_000;

export const syncConfigured = async () => googleConfigured() && r2Configured() && Boolean(await getDriveFolderId());

export type SyncResult = { skipped?: string; added: number; removed: number; albums: number; pending: number };

/** Runs a sync unless one ran in the last few minutes. Safe to call on every page render. */
export async function syncIfStale() {
  if (!(await syncConfigured())) return;
  const raw = await getObject(MANIFEST_KEY);
  const checkedAt = raw ? Date.parse((JSON.parse(raw) as Manifest).checkedAt) : 0;
  if (Date.now() - checkedAt < STALE_AFTER_MS) return;
  await syncPhotos();
}

export async function syncPhotos({ budgetMs = 45_000 } = {}): Promise<SyncResult> {
  const started = Date.now();
  const outOfTime = () => Date.now() - started > budgetMs;
  const result: SyncResult = { added: 0, removed: 0, albums: 0, pending: 0 };

  if (!(await syncConfigured())) return { ...result, skipped: "not configured" };

  // Simple lock so two visitors don't start two syncs at once.
  const lock = await getObject(LOCK_KEY);
  if (lock && JSON.parse(lock).until > Date.now()) return { ...result, skipped: "already running" };
  await putObject(LOCK_KEY, JSON.stringify({ until: Date.now() + budgetMs + 30_000 }), "application/json", "no-store");

  try {
    const raw = await getObject(MANIFEST_KEY);
    const manifest: Manifest = raw ? JSON.parse(raw) : { checkedAt: "", albums: [] };
    const byFolder = new Map(manifest.albums.map((a) => [a.folderId, a]));
    const save = () => putObject(MANIFEST_KEY, JSON.stringify({ ...manifest, checkedAt: new Date().toISOString() }), "application/json", "no-store");

    const folders = await listAlbumFolders(await getDriveFolderId());
    const seenFolders = new Set(folders.map((f) => f.id));
    const usedSlugs = new Set<string>();

    // Folders deleted from Drive → remove album.
    for (const album of manifest.albums.filter((a) => !seenFolders.has(a.folderId!))) {
      await Promise.all(album.photos.map((p) => removePhotoFiles(album.folderId!, p.id)));
      result.removed += album.photos.length;
    }
    manifest.albums = manifest.albums.filter((a) => seenFolders.has(a.folderId!));

    // Newest folders first, so the latest programme appears soonest.
    const ordered = folders
      .map((f) => ({ folder: f, ...parseFolderName(f.name, f.createdTime) }))
      .sort((a, b) => b.date.localeCompare(a.date));

    for (const { folder, date, title } of ordered) {
      let slug = slugify(date, title);
      for (let n = 2; usedSlugs.has(slug); n++) slug = `${slugify(date, title)}-${n}`;
      usedSlugs.add(slug);

      let album = byFolder.get(folder.id);
      if (!album) {
        album = { folderId: folder.id, slug, title, date, photos: [] };
        manifest.albums.push(album);
      }
      Object.assign(album, { slug, title, date }); // folder may have been renamed

      const images = await listImages(folder.id);
      const current = new Set(images.map((i) => i.id));

      // Photos deleted from Drive → remove.
      const gone = album.photos.filter((p) => !current.has(p.id));
      await Promise.all(gone.map((p) => removePhotoFiles(folder.id, p.id)));
      result.removed += gone.length;

      const have = new Map(album.photos.filter((p) => current.has(p.id)).map((p) => [p.id, p]));
      const todo = images.filter((i) => !have.has(i.id));

      for (let i = 0; i < todo.length && !outOfTime(); i += 4) {
        const batch = todo.slice(i, i + 4);
        const done = await Promise.all(batch.map((file) => processPhoto(folder.id, file).catch((err) => (console.error(`Skipping ${file.name}:`, err), null))));
        done.forEach((p) => p && have.set(p.id, p));
        result.added += done.filter(Boolean).length;
      }
      result.pending += images.filter((i) => !have.has(i.id)).length;

      // Keep Drive's order (by file name).
      album.photos = images.map((i) => have.get(i.id)).filter((p): p is Photo => Boolean(p));
      await save();
      if (outOfTime()) break;
    }

    result.albums = manifest.albums.filter((a) => a.photos.length).length;
    await save();
    return result;
  } finally {
    await putObject(LOCK_KEY, JSON.stringify({ until: 0 }), "application/json", "no-store");
  }
}

const keyFor = (folderId: string, fileId: string, size: "original" | "preview" | "thumb") => `albums/${folderId}/${fileId}/${size}.jpg`;

async function removePhotoFiles(folderId: string, fileId: string) {
  await Promise.all((["original", "preview", "thumb"] as const).map((s) => deleteObject(keyFor(folderId, fileId, s))));
}

async function processPhoto(folderId: string, file: DriveFile): Promise<Photo> {
  let source = /hei[cf]/i.test(file.mimeType) ? await downloadRendition(file) : await downloadFile(file.id);
  let meta: Metadata;
  try {
    meta = await sharp(source).metadata();
  } catch {
    // Format sharp can't read → use Google's JPEG version instead.
    source = await downloadRendition(file);
    meta = await sharp(source).metadata();
  }

  const rotated = sharp(source).rotate(); // respect phone camera orientation
  const isJpeg = meta.format === "jpeg";
  const original = isJpeg ? source : await rotated.clone().jpeg({ quality: 92 }).toBuffer();
  const preview = await rotated.clone().resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82, progressive: true }).toBuffer();
  const thumb = await rotated.clone().resize({ width: 600, height: 600, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 74, progressive: true }).toBuffer();

  await Promise.all([
    putObject(keyFor(folderId, file.id, "original"), original, "image/jpeg"),
    putObject(keyFor(folderId, file.id, "preview"), preview, "image/jpeg"),
    putObject(keyFor(folderId, file.id, "thumb"), thumb, "image/jpeg"),
  ]);

  const sideways = (meta.orientation ?? 1) >= 5;
  return {
    id: file.id,
    original: publicUrl(keyFor(folderId, file.id, "original")),
    preview: publicUrl(keyFor(folderId, file.id, "preview")),
    thumb: publicUrl(keyFor(folderId, file.id, "thumb")),
    width: sideways ? meta.height : meta.width,
    height: sideways ? meta.width : meta.height,
  };
}

