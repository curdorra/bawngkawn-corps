import fs from "node:fs";
import path from "node:path";
import { getObject, putObject, r2Configured } from "./r2";

// Tiny storage for things the website itself writes (sermons, login attempts).
// On the live site they are kept as small files in the R2 bucket; on your own computer, in the .data folder.

const LOCAL_DIR = path.join(process.cwd(), ".data");

export async function readJson<T>(key: string, fallback: T): Promise<T> {
  if (r2Configured()) {
    const raw = await getObject(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  }
  const file = path.join(LOCAL_DIR, key);
  return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")) as T) : fallback;
}

export async function writeJson(key: string, value: unknown) {
  const body = JSON.stringify(value);
  if (r2Configured()) return putObject(key, body, "application/json", "no-store");
  fs.mkdirSync(LOCAL_DIR, { recursive: true });
  fs.writeFileSync(path.join(LOCAL_DIR, key), body);
}
