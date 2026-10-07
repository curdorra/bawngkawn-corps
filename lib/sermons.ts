import { slugify } from "./albums";
import { readJson, writeJson } from "./store";

// Written sermons. They are added and edited on the site itself (/sermons/manage, behind a passcode)
// and saved by lib/store.ts. Every line of a sermon's text is shown as a paragraph.

export type StoredSermon = { id: string; date: string; title: string; text: string };
export type Sermon = StoredSermon & { slug: string; paragraphs: string[] };

const KEY = "sermons.json";

export const readStored = () => readJson<StoredSermon[]>(KEY, []);
export const saveStored = (items: StoredSermon[]) => writeJson(KEY, items);

function toSermon(s: StoredSermon): Sermon {
  return { ...s, slug: slugify(s.date, s.title), paragraphs: s.text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean) };
}

/** Newest first. */
export async function listSermons(): Promise<Sermon[]> {
  return (await readStored()).map(toSermon).sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}

export async function getSermon(slug: string) {
  return (await listSermons()).find((s) => s.slug === slug);
}

/** First few words of a sermon, for cards. */
export function excerpt(s: Sermon, chars = 150) {
  const text = s.paragraphs.join(" ");
  return text.length > chars ? text.slice(0, chars).replace(/\s+\S*$/, "") + "…" : text;
}
