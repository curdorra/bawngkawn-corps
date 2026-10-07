import crypto from "node:crypto";
import { readJson, writeJson } from "./store";

// The passcode that unlocks sermon editing. It lives in the SERMON_EDIT_CODE setting, never in the code.
// Logging in gives a cookie that lasts 12 hours and can't be made without knowing the passcode.

export const COOKIE = "sermon_edit";
const TWELVE_HOURS = 12 * 60 * 60 * 1000;

const code = () => process.env.SERMON_EDIT_CODE ?? "";
export const editingEnabled = () => code().length > 0;

const sign = (value: string) => crypto.createHmac("sha256", `sermon-edit:${code()}`).update(value).digest("base64url");
const sha = (s: string) => crypto.createHash("sha256").update(s).digest();

export const codeMatches = (input: string) => editingEnabled() && crypto.timingSafeEqual(sha(input), sha(code()));

export function makeToken() {
  const expires = String(Date.now() + TWELVE_HOURS);
  return `${expires}.${sign(expires)}`;
}

export function validToken(token?: string) {
  if (!token || !editingEnabled()) return false;
  const [expires, sig] = token.split(".");
  if (!expires || !sig || Number(expires) < Date.now()) return false;
  const a = Buffer.from(sig), b = Buffer.from(sign(expires));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export const cookieHeader = (token: string, maxAgeSeconds = TWELVE_HOURS / 1000) =>
  `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;

// A 4-digit passcode can be guessed, so wrong guesses are counted across ALL visitors:
// after 10 wrong guesses in 15 minutes, nobody can try again until the 15 minutes are up.
const WINDOW_MS = 15 * 60_000;
const MAX_FAILS = 10;
const ATTEMPTS_KEY = "edit-attempts.json";

export async function isLockedOut() {
  const { fails } = await readJson<{ fails: number[] }>(ATTEMPTS_KEY, { fails: [] });
  return fails.filter((t) => Date.now() - t < WINDOW_MS).length >= MAX_FAILS;
}

export async function recordFailure() {
  const { fails } = await readJson<{ fails: number[] }>(ATTEMPTS_KEY, { fails: [] });
  await writeJson(ATTEMPTS_KEY, { fails: [...fails.filter((t) => Date.now() - t < WINDOW_MS), Date.now()] });
}
