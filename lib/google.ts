import crypto from "node:crypto";

// Signs in to Google as the website's "service account" (a robot Google user).
// The Sheet and the photos folder are shared with that account's email, read-only.
// The one write it does is adding counselling requests to a separate private Sheet (see app/api/counselling).

const SCOPES = ["https://www.googleapis.com/auth/drive.readonly", "https://www.googleapis.com/auth/spreadsheets"];

export const googleConfigured = () => Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY);

let cached: { token: string; expires: number } | null = null;

const b64url = (input: string | Buffer) => Buffer.from(input).toString("base64url");

export async function googleToken(): Promise<string> {
  if (cached && cached.expires > Date.now() + 60_000) return cached.token;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
  const key = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({ iss: email, scope: SCOPES.join(" "), aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const signature = crypto.sign("RSA-SHA256", Buffer.from(`${header}.${claims}`), key).toString("base64url");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${header}.${claims}.${signature}` }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Google sign-in failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: data.access_token, expires: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

export async function googleFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, headers: { ...init?.headers, Authorization: `Bearer ${await googleToken()}` }, cache: "no-store" });
  if (!res.ok) throw new Error(`Google request failed: ${res.status} ${url}\n${await res.text()}`);
  return res;
}
