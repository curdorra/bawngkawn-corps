import { formatDate, slugify } from "./albums";
import { getSettings } from "./settings";
import { readJson, writeJson } from "./store";

// Sermons are written messages: scripture, summary and notes. They are added in the admin area (/admin)
// and saved by lib/store.ts. They have nothing to do with the YouTube channel. Older ones only have `text` (shown as notes).

export type Language = "mizo" | "english";

export type StoredSermon = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  preacher?: string;
  scripture?: string;
  seriesId?: string;
  language?: Language;
  summary?: string;
  notes?: string;
  text?: string; // older written sermons
  hidden?: boolean;
};

export type Sermon = StoredSermon & {
  slug: string;
  series: string; // series name, "" if none
  noteLines: string[];
  featured: boolean;
};

const KEY = "sermons.json";

export const readStored = () => readJson<StoredSermon[]>(KEY, []);
export const saveStored = (items: StoredSermon[]) => writeJson(KEY, items);

const lines = (s?: string) => (s ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

/** Newest first. Hidden sermons are left out unless asked for. */
export async function listSermons({ includeHidden = false } = {}): Promise<Sermon[]> {
  const [stored, settings] = await Promise.all([readStored(), getSettings()]);
  const seriesName = new Map(settings.series.map((s) => [s.id, s.name]));
  const taken = new Set<string>();
  return stored
    .filter((s) => includeHidden || !s.hidden)
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title))
    .map((s) => {
      let slug = slugify(s.date, s.title);
      if (taken.has(slug)) slug = `${slug}-${s.id}`;
      taken.add(slug);
      return {
        ...s,
        slug,
        series: (s.seriesId && seriesName.get(s.seriesId)) || "",
        noteLines: lines(s.notes ?? s.text),
        featured: s.id === settings.pinnedId,
      };
    });
}

export async function getSermon(slug: string) {
  return (await listSermons()).find((s) => s.slug === slug);
}

/** First few words of the summary (or notes), for cards. */
export function excerpt(s: Sermon, chars = 150) {
  const text = s.summary?.trim() || s.noteLines.join(" ");
  return text.length > chars ? text.slice(0, chars).replace(/\s+\S*$/, "") + "…" : text;
}

export const languageLabel = (l?: Language) => (l === "mizo" ? "Mizo" : l === "english" ? "English" : "");

/** The small, plain version of a sermon that is sent to the browser for cards and filters. */
export type SermonCardData = {
  slug: string;
  title: string;
  preacher: string;
  date: string;
  dateLabel: string;
  scripture: string;
  series: string;
  language: Language | "";
  blurb: string;
};

export const toCard = (s: Sermon): SermonCardData => ({
  slug: s.slug,
  title: s.title,
  preacher: s.preacher ?? "",
  date: s.date,
  dateLabel: formatDate(s.date),
  scripture: s.scripture ?? "",
  series: s.series,
  language: s.language ?? "",
  blurb: excerpt(s, 110),
});
