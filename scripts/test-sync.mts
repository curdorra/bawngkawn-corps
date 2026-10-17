// Simulated end-to-end test: fakes Google (token, Drive, Sheets) and R2 by intercepting fetch.
import crypto from "node:crypto";
import fs from "node:fs";

const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
Object.assign(process.env, {
  GOOGLE_SERVICE_ACCOUNT_EMAIL: "robot@test.iam.gserviceaccount.com",
  GOOGLE_PRIVATE_KEY: privateKey.export({ type: "pkcs8", format: "pem" }).toString().replace(/\n/g, "\\n"),
  GOOGLE_SHEET_ID: "SHEET",
  GOOGLE_DRIVE_FOLDER_ID: "ROOT",
  R2_ACCOUNT_ID: "acct", R2_ACCESS_KEY_ID: "k", R2_SECRET_ACCESS_KEY: "s", R2_BUCKET: "photos", R2_PUBLIC_URL: "https://cdn.test",
});

const img = (n: string) => fs.readFileSync(`public/photos/2026-09-20-harvest-festival/${n}`);
const drive = {
  folders: [
    { id: "F1", name: "2026-10-11 Harvest Thanksgiving", mimeType: "application/vnd.google-apps.folder", createdTime: "2026-10-11T10:00:00Z" },
    { id: "F2", name: "18.10.2026 youth rally", mimeType: "application/vnd.google-apps.folder", createdTime: "2026-10-18T10:00:00Z" },
  ],
  files: {
    F1: [{ id: "a", name: "IMG_01.jpg", mimeType: "image/jpeg" }, { id: "b", name: "IMG_02.jpg", mimeType: "image/jpeg" }, { id: "h", name: "IMG_03.HEIC", mimeType: "image/heic", thumbnailLink: "https://lh3.test/h=s220" }],
    F2: [{ id: "c", name: "DSC_1.jpg", mimeType: "image/jpeg" }],
  } as Record<string, any[]>,
  bytes: { a: img("01.jpg"), b: img("02.jpg"), c: img("03.jpg") } as Record<string, Buffer>,
};
const r2 = new Map<string, Buffer>();
const log: string[] = [];

const serial = (iso: string) => (Date.parse(iso + "T00:00:00Z") - Date.UTC(1899, 11, 30)) / 86400000;
const sheet: Record<string, unknown[][]> = {
  Contact: [["Field", "Value"], ["Phone", "+91 98620 00000"], ["WhatsApp", "+91 98620 00000"], ["Facebook", "https://facebook.com/bawngkawncorps"]],
  Officers: [["Role", "Rank", "Name"], ["Corps Officer", "Major", "Lalruata"], ["Corps Officer", "Major", "Lalhmingsangi"]],
};

globalThis.fetch = (async (input: any, init: any = {}) => {
  const url = new URL(typeof input === "string" ? input : input.url);
  const method = init.method ?? (typeof input === "object" ? input.method : "GET") ?? "GET";
  const json = (o: unknown) => new Response(JSON.stringify(o), { headers: { "content-type": "application/json" } });
  if (url.host === "oauth2.googleapis.com") return json({ access_token: "tok", expires_in: 3600 });
  if (url.host === "www.googleapis.com") {
    const id = url.pathname.split("/").pop()!;
    if (url.searchParams.get("alt") === "media") { log.push(`download ${id}`); return new Response(new Uint8Array(drive.bytes[id])); }
    const q = url.searchParams.get("q")!;
    const parent = q.match(/'(\w+)' in parents/)![1];
    return json({ files: parent === "ROOT" ? drive.folders : drive.files[parent] ?? [] });
  }
  if (url.host === "lh3.test") { log.push(`rendition ${url.pathname}`); return new Response(new Uint8Array(img("04.jpg"))); }
  if (url.host === "sheets.googleapis.com") {
    if (!url.pathname.includes("values")) return json({ sheets: Object.keys(sheet).map((title) => ({ properties: { title } })) });
    return json({ valueRanges: url.searchParams.getAll("ranges").map((r) => ({ values: sheet[r.replace(/'/g, "")] })) });
  }
  if (url.host.endsWith("r2.cloudflarestorage.com")) {
    const key = decodeURIComponent(url.pathname.replace("/photos/", ""));
    const req = typeof input === "object" ? input : null;
    const m = req?.method ?? method;
    if (m === "PUT") { r2.set(key, Buffer.from(await (req ? req.arrayBuffer() : new Response(init.body).arrayBuffer()))); return new Response(""); }
    if (m === "DELETE") { r2.delete(key); return new Response(null, { status: 204 }); }
    return r2.has(key) ? new Response(new Uint8Array(r2.get(key)!)) : new Response("", { status: 404 });
  }
  throw new Error("Unexpected fetch " + url);
}) as typeof fetch;

const { syncPhotos } = await import("../lib/sync");
const { getAlbums } = await import("../lib/albums");
const { getContent } = await import("../lib/content");
const sharp = (await import("sharp")).default;
let ok = true;
const check = (label: string, cond: boolean) => { console.log(`${cond ? "PASS" : "FAIL"}  ${label}`); ok &&= cond; };

// 1. First sync
let res = await syncPhotos();
console.log("sync 1:", res);
let albums = await getAlbums();
check("two albums, newest first", albums.map((a) => a.slug).join() === "2026-10-18-youth-rally,2026-10-11-harvest-thanksgiving");
check("dd.mm.yyyy folder date + lower-case title tidied", albums[0].date === "2026-10-18" && albums[0].title === "Youth Rally");
check("harvest has 3 photos incl. HEIC via rendition", albums[1].photos.length === 3 && log.some((l) => l.startsWith("rendition")));
const p = albums[1].photos[0];
check("public URLs point at R2", p.thumb.startsWith("https://cdn.test/albums/F1/a/thumb.jpg"));
const thumbMeta = await sharp(r2.get("albums/F1/a/thumb.jpg")!).metadata();
check(`thumb resized (${thumbMeta.width}x${thumbMeta.height})`, Math.max(thumbMeta.width!, thumbMeta.height!) <= 600);
check("original kept byte-for-byte", r2.get("albums/F1/a/original.jpg")!.equals(drive.bytes.a));

// 2. Second sync: nothing new should be downloaded
log.length = 0;
await (await import("../lib/r2")).putObject("sync-lock.json", JSON.stringify({ until: 0 }), "application/json");
res = await syncPhotos();
check("re-sync downloads nothing", res.added === 0 && !log.some((l) => l.startsWith("download")));

// 3. Delete a photo and a folder in Drive
drive.files.F1 = drive.files.F1.filter((f) => f.id !== "b");
drive.folders = drive.folders.filter((f) => f.id !== "F2");
res = await syncPhotos();
albums = await getAlbums();
check("deleted photo + folder removed", res.removed === 2 && albums.length === 1 && albums[0].photos.length === 2);
check("deleted files gone from R2", !r2.has("albums/F1/b/original.jpg") && !r2.has("albums/F2/c/thumb.jpg"));

// 4. Sheet content
const c = await getContent();
check("officers = rank + name", c.about.officers.map((o) => o.name).join() === "Major Lalruata,Major Lalhmingsangi");
check("WhatsApp number → link", c.site.contact.whatsapp === "https://wa.me/919862000000");
check("missing Meetings tab keeps defaults", c.meetings.length > 0 && c.meetings[0].name === "Holiness Meeting");

console.log(ok ? "\nALL PASSED" : "\nSOME FAILED");
process.exit(ok ? 0 : 1);
