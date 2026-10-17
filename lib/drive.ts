import { googleConfigured, googleFetch } from "./google";

export type DriveFile = { id: string; name: string; mimeType: string; createdTime: string };

const API = "https://www.googleapis.com/drive/v3/files";

// Reads the "Website Photos" folder. Works with the website's service account, or, for a folder shared as
// "anyone with the link", with just a GOOGLE_API_KEY. Nothing is copied: the site only reads names and ids.
export const driveConfigured = () => googleConfigured() || Boolean(process.env.GOOGLE_API_KEY);

async function get(url: string) {
  if (googleConfigured()) return googleFetch(url);
  const res = await fetch(`${url}&key=${process.env.GOOGLE_API_KEY}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Drive request failed: ${res.status} ${await res.text()}`);
  return res;
}

async function list(q: string, fields: string): Promise<DriveFile[]> {
  const out: DriveFile[] = [];
  let pageToken = "";
  do {
    const params = new URLSearchParams({
      q,
      fields: `nextPageToken, files(${fields})`,
      pageSize: "1000",
      orderBy: "name",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
    if (pageToken) params.set("pageToken", pageToken);
    const data = (await (await get(`${API}?${params}`)).json()) as { files: DriveFile[]; nextPageToken?: string };
    out.push(...data.files);
    pageToken = data.nextPageToken ?? "";
  } while (pageToken);
  return out;
}

/** Programme folders directly inside the "Website Photos" folder. */
export const listAlbumFolders = (rootId: string) =>
  list(`'${rootId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`, "id, name, mimeType, createdTime");

/** Photos inside one programme folder. */
export const listImages = (folderId: string) =>
  list(`'${folderId}' in parents and mimeType contains 'image/' and trashed = false`, "id, name, mimeType, createdTime");

// Google serves any shared image at any size from these addresses (and turns iPhone HEIC photos into JPEGs).
export const photoUrls = (id: string) => ({
  thumb: `https://lh3.googleusercontent.com/d/${id}=w600`,
  preview: `https://lh3.googleusercontent.com/d/${id}=w2000`,
  original: `https://lh3.googleusercontent.com/d/${id}=s0`,
});
