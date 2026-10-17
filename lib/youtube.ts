// Turns a pasted YouTube link into a title, thumbnail and date.
// Title and thumbnail come from YouTube's public oEmbed endpoint (no key needed);
// the upload date is read from the watch page. Anything that fails is just left blank.

export type VideoInfo = { id: string; title: string; channel: string; date: string; thumb: string };

/** Accepts watch, youtu.be, shorts, live and embed links, or a bare 11-character id. */
export function parseYouTubeId(input: string): string | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    const host = u.hostname.replace(/^(www|m)\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = u.pathname.split("/")[1] ?? null;
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      id = u.searchParams.get("v") ?? u.pathname.match(/^\/(?:shorts|live|embed|v)\/([\w-]{11})/)?.[1] ?? null;
    }
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export const thumbUrl = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

export async function lookupVideo(id: string): Promise<VideoInfo | null> {
  const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl(id))}&format=json`, { cache: "no-store" });
  if (!res.ok) return null; // private, deleted or not a real video
  const data = (await res.json()) as { title?: string; author_name?: string };
  return { id, title: data.title ?? "", channel: data.author_name ?? "", date: await uploadDate(id), thumb: thumbUrl(id) };
}

async function uploadDate(id: string) {
  try {
    const res = await fetch(watchUrl(id), { cache: "no-store", headers: { "Accept-Language": "en" }, signal: AbortSignal.timeout(6000) });
    const html = await res.text();
    return html.match(/"uploadDate":"(\d{4}-\d{2}-\d{2})/)?.[1] ?? html.match(/itemprop="uploadDate" content="(\d{4}-\d{2}-\d{2})/)?.[1] ?? "";
  } catch {
    return "";
  }
}
