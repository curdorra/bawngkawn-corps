import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

// Tiny storage for things the website itself writes (sermons, settings, the photo list, login attempts).
// On the live site they live in one Neon table (DATABASE_URL); on your own computer, in the .data folder.

const LOCAL_DIR = path.join(process.cwd(), ".data");
const dbUrl = () => process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

export const storageConfigured = () => Boolean(dbUrl()) || !process.env.VERCEL;

export class StorageNotSetUp extends Error {}

let sql: ReturnType<typeof neon> | null = null;
let ready: Promise<unknown> | null = null;
async function db() {
  sql ??= neon(dbUrl());
  ready ??= sql`create table if not exists kv (key text primary key, value jsonb not null, updated_at timestamptz not null default now())`;
  await ready;
  return sql;
}

export async function readJson<T>(key: string, fallback: T): Promise<T> {
  if (dbUrl()) {
    const rows = (await (await db())`select value from kv where key = ${key}`) as { value: T }[];
    return rows.length ? rows[0].value : fallback;
  }
  if (process.env.VERCEL) return fallback; // nothing to read yet
  const file = path.join(LOCAL_DIR, key);
  return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")) as T) : fallback;
}

export async function writeJson(key: string, value: unknown) {
  if (dbUrl()) {
    const body = JSON.stringify(value);
    await (await db())`insert into kv (key, value) values (${key}, ${body}::jsonb) on conflict (key) do update set value = excluded.value, updated_at = now()`;
    return;
  }
  // Vercel's disk is read-only, so without a database nothing could be saved. Say so clearly.
  if (process.env.VERCEL) throw new StorageNotSetUp("No database is set up");
  fs.mkdirSync(LOCAL_DIR, { recursive: true });
  fs.writeFileSync(path.join(LOCAL_DIR, key), JSON.stringify(value));
}
