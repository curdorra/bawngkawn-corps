import { readJson, writeJson } from "./store";

// Site-wide choices made in the admin area: the pinned sermon, the series list,
// which Drive folder the photos come from, and which albums are hidden.

export type Series = { id: string; name: string };
export type Settings = {
  pinnedId: string;
  driveFolderId: string; // empty = use GOOGLE_DRIVE_FOLDER_ID
  hiddenAlbums: string[]; // album keys (see albumKey in lib/albums.ts)
  series: Series[];
};

const KEY = "settings.json";
const defaults: Settings = { pinnedId: "", driveFolderId: "", hiddenAlbums: [], series: [] };

export async function getSettings(): Promise<Settings> {
  return { ...defaults, ...(await readJson<Partial<Settings>>(KEY, {})) };
}

export async function updateSettings(patch: Partial<Settings>) {
  const next = { ...(await getSettings()), ...patch };
  await writeJson(KEY, next);
  return next;
}

/** The Drive folder photos are read from: the admin's choice, else the environment setting. */
export async function getDriveFolderId() {
  return (await getSettings()).driveFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID || "";
}
