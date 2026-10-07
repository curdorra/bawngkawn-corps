import { AwsClient } from "aws4fetch";

// Cloudflare R2 photo storage (S3-compatible). Photos are served from its public URL.

export const r2Configured = () =>
  Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET && process.env.R2_PUBLIC_URL);

let client: AwsClient | null = null;
const r2 = () => (client ??= new AwsClient({ accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!, service: "s3", region: "auto" }));
const objectUrl = (key: string) => `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET}/${key.split("/").map(encodeURIComponent).join("/")}`;

export const publicUrl = (key: string) => `${process.env.R2_PUBLIC_URL!.replace(/\/$/, "")}/${key.split("/").map(encodeURIComponent).join("/")}`;

export async function putObject(key: string, body: Buffer | string, contentType: string, cacheControl = "public, max-age=31536000, immutable") {
  const res = await r2().fetch(objectUrl(key), {
    method: "PUT",
    body: typeof body === "string" ? body : new Uint8Array(body),
    headers: { "Content-Type": contentType, "Cache-Control": cacheControl },
  });
  if (!res.ok) throw new Error(`R2 upload failed for ${key}: ${res.status} ${await res.text()}`);
}

export async function getObject(key: string): Promise<string | null> {
  const res = await r2().fetch(objectUrl(key), { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`R2 read failed for ${key}: ${res.status}`);
  return res.text();
}

export async function deleteObject(key: string) {
  const res = await r2().fetch(objectUrl(key), { method: "DELETE" });
  if (!res.ok && res.status !== 404) throw new Error(`R2 delete failed for ${key}: ${res.status}`);
}
