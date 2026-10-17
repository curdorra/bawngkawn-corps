import { googleFetch } from "./google";

export type DriveFile = { id: string; name: string; mimeType: string; md5Checksum?: string; thumbnailLink?: string; createdTime: string };

const API = "https://www.googleapis.com/drive/v3/files";

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
    const data = (await (await googleFetch(`${API}?${params}`)).json()) as { files: DriveFile[]; nextPageToken?: string };
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
  list(`'${folderId}' in parents and mimeType contains 'image/' and trashed = false`, "id, name, mimeType, md5Checksum, thumbnailLink, createdTime");

export async function downloadFile(id: string): Promise<Buffer> {
  const res = await googleFetch(`${API}/${id}?alt=media&supportsAllDrives=true`);
  return Buffer.from(await res.arrayBuffer());
}

/** Google's own JPEG rendering of a file. Used for iPhone HEIC photos, which we can't convert ourselves. */
export async function downloadRendition(file: DriveFile, size = 3000): Promise<Buffer> {
  if (!file.thumbnailLink) throw new Error(`No rendition available for ${file.name}`);
  const res = await googleFetch(file.thumbnailLink.replace(/=s\d+$/, `=s${size}`));
  return Buffer.from(await res.arrayBuffer());
}
