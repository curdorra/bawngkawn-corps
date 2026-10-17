import fs from "node:fs";
import path from "node:path";
import { getObject, r2Configured } from "./r2";
import { getSettings } from "./settings";

export type Photo = {
  id: string;
  thumb: string; // small, for grids
  preview: string; // large, for the full-screen viewer
  original: string; // full quality, for downloads
  width?: number;
  height?: number;
};

export type Album = {
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  folderId?: string;
  photos: Photo[];
};

export type Manifest = { checkedAt: string; albums: Album[] };

export const MANIFEST_KEY = "manifest.json";

// Photos come from Google Drive (copied to R2 by lib/sync.ts) when R2 is set up.
// Without it, e.g. on your own computer, they come from the folders in public/photos.
// Albums hidden in the admin area are left out unless asked for.
export async function getAlbums({ includeHidden = false } = {}): Promise<Album[]> {
  const [albums, { hiddenAlbums }] = await Promise.all([r2Configured() ? readManifestAlbums() : readLocalAlbums(), getSettings()]);
  const hidden = new Set(hiddenAlbums);
  return albums
    .filter((a) => a.photos.length > 0 && (includeHidden || !hidden.has(albumKey(a))))
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}

/** Stable id for hiding an album: its Drive folder (survives renames), or its slug for local albums. */
export const albumKey = (a: Pick<Album, "folderId" | "slug">) => a.folderId ?? a.slug;

/** The newest photos across all albums, newest album first. */
export function latestPhotos(albums: Album[], limit = 12) {
  return albums
    .flatMap((album) => album.photos.map((photo, index) => ({ photo, index, albumTitle: album.title, albumSlug: album.slug })))
    .slice(0, limit);
}

export async function getAlbum(slug: string) {
  return (await getAlbums()).find((a) => a.slug === slug);
}

async function readManifestAlbums(): Promise<Album[]> {
  const raw = await getObject(MANIFEST_KEY);
  return raw ? (JSON.parse(raw) as Manifest).albums : [];
}

// ── Folder names → title + date ─────────────────────────────

const pad = (n: string) => n.padStart(2, "0");

/** "2026-10-11 Harvest Thanksgiving", "11-10-2026 Harvest…", "11.10.2026 Harvest…" all work. */
export function parseFolderName(name: string, fallbackDate: string) {
  const clean = name.trim();
  let m = clean.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})[\s\-–_:]*(.*)$/);
  if (m) return { date: `${m[1]}-${pad(m[2])}-${pad(m[3])}`, title: tidyTitle(m[4]) || clean };
  m = clean.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{4})[\s\-–_:]*(.*)$/);
  if (m) return { date: `${m[3]}-${pad(m[2])}-${pad(m[1])}`, title: tidyTitle(m[4]) || clean };
  return { date: fallbackDate.slice(0, 10), title: tidyTitle(clean) };
}

function tidyTitle(s: string) {
  const t = s.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  // Only capitalise if someone typed it all lower-case; otherwise keep their spelling.
  return t === t.toLowerCase() ? t.replace(/(^|\s)\S/g, (c) => c.toUpperCase()) : t;
}

export function slugify(date: string, title: string) {
  const words = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${date}-${words || "album"}`;
}

// ── Local fallback ──────────────────────────────────────────

const PHOTOS_DIR = path.join(process.cwd(), "public", "photos");
const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

function readLocalAlbums(): Album[] {
  if (!fs.existsSync(PHOTOS_DIR)) return [];
  return fs
    .readdirSync(PHOTOS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const { date, title } = parseFolderName(d.name, "");
      const photos = fs
        .readdirSync(path.join(PHOTOS_DIR, d.name))
        .filter((f) => IMAGE_EXT.test(f))
        .sort()
        .map((f) => {
          const url = `/photos/${encodeURIComponent(d.name)}/${encodeURIComponent(f)}`;
          return { id: f, thumb: url, preview: url, original: url };
        });
      return { slug: slugify(date, title), title, date, photos };
    });
}

export function formatDate(date: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) {
  if (!date) return "";
  return new Date(date + "T00:00:00").toLocaleDateString("en-GB", opts);
}

export const photoCount = (n: number) => `${n} ${n === 1 ? "photo" : "photos"}`;
