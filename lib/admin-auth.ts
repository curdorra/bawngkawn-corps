import crypto from "node:crypto";
import { cookies } from "next/headers";
import { readJson, writeJson } from "./store";

// Admin login for two or three people.
// ADMIN_USERS holds the accounts as "name:password" pairs separated by commas, e.g.
//   ADMIN_USERS=Lalthan:first-password,Mary:second-password
// Logging in gives a cookie that lasts 12 hours and can't be made without knowing a password.

export const COOKIE = "admin_session";
const TWELVE_HOURS = 12 * 60 * 60 * 1000;

type User = { name: string; password: string };

function users(): User[] {
  return (process.env.ADMIN_USERS ?? "")
    .split(",")
    .map((pair) => {
      const i = pair.indexOf(":");
      return i > 0 ? { name: pair.slice(0, i).trim(), password: pair.slice(i + 1).trim() } : null;
    })
    .filter((u): u is User => Boolean(u?.name && u.password));
}

export const adminEnabled = () => users().length > 0;

const sha = (s: string) => crypto.createHash("sha256").update(s).digest();
const secret = () => process.env.AUTH_SECRET || `admin:${process.env.ADMIN_USERS ?? ""}`;
const sign = (value: string) => crypto.createHmac("sha256", secret()).update(value).digest("base64url");
const same = (a: string, b: string) => crypto.timingSafeEqual(sha(a), sha(b));

/** The matching user's name, or null. Names are not case sensitive; passwords are. */
export function checkLogin(name: string, password: string) {
  const user = users().find((u) => u.name.toLowerCase() === name.trim().toLowerCase());
  // Compare against something even when the name is unknown, so timing doesn't reveal who has an account.
  const ok = same(password, user?.password ?? crypto.randomBytes(16).toString("hex"));
  return user && ok ? user.name : null;
}

export function makeToken(name: string) {
  const body = `${Buffer.from(name).toString("base64url")}.${Date.now() + TWELVE_HOURS}`;
  return `${body}.${sign(body)}`;
}

function nameFromToken(token?: string) {
  if (!token || !adminEnabled()) return null;
  const [who, expires, sig] = token.split(".");
  if (!who || !expires || !sig || Number(expires) < Date.now() || !same(sig, sign(`${who}.${expires}`))) return null;
  const name = Buffer.from(who, "base64url").toString();
  return users().some((u) => u.name === name) ? name : null; // removing someone from ADMIN_USERS logs them out
}

/** Who is logged in (from the cookie), or null. */
export async function currentAdmin() {
  return nameFromToken((await cookies()).get(COOKIE)?.value);
}

export const cookieHeader = (token: string, maxAgeSeconds = TWELVE_HOURS / 1000) =>
  `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;

// Passwords can be guessed, so wrong guesses are counted across ALL visitors:
// after 10 wrong guesses in 15 minutes, nobody can try again until the 15 minutes are up.
const WINDOW_MS = 15 * 60_000;
const MAX_FAILS = 10;
const ATTEMPTS_KEY = "admin-attempts.json";

export async function isLockedOut() {
  const { fails } = await readJson<{ fails: number[] }>(ATTEMPTS_KEY, { fails: [] });
  return fails.filter((t) => Date.now() - t < WINDOW_MS).length >= MAX_FAILS;
}

export async function recordFailure() {
  const { fails } = await readJson<{ fails: number[] }>(ATTEMPTS_KEY, { fails: [] });
  await writeJson(ATTEMPTS_KEY, { fails: [...fails.filter((t) => Date.now() - t < WINDOW_MS), Date.now()] });
}
