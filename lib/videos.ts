// Latest videos from the corps' YouTube channel, read from YouTube's public RSS feed.
// No account or key needed: the YouTube link in the Sheet's Contact tab is all it takes.
// If anything goes wrong we just return nothing and the home page simply leaves the videos section out.

export type Video = { id: string; title: string; date: string; thumb: string; url: string };

const HOUR = 3600;

export async function getVideos(youtubeUrl: string, limit = 3): Promise<Video[]> {
  try {
    const channelId = await findChannelId(youtubeUrl);
    if (!channelId) return [];
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, { next: { revalidate: HOUR } });
    if (!res.ok) return [];
    const xml = await res.text();
    return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, limit).map(([, e]) => {
      const id = tag(e, "yt:videoId");
      return { id, title: decode(tag(e, "title")), date: tag(e, "published").slice(0, 10), thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, url: `https://www.youtube.com/watch?v=${id}` };
    });
  } catch {
    return [];
  }
}

async function findChannelId(url: string) {
  if (!/youtube\.com|youtu\.be/i.test(url)) return null;
  const direct = url.match(/\/channel\/(UC[\w-]{22})/);
  if (direct) return direct[1];
  if (!/\/(@|c\/|user\/)/.test(url)) return null; // e.g. the bare placeholder https://youtube.com/
  const res = await fetch(url, { next: { revalidate: 24 * HOUR }, headers: { "Accept-Language": "en" } });
  if (!res.ok) return null;
  const html = await res.text();
  return html.match(/feeds\/videos\.xml\?channel_id=(UC[\w-]{22})/)?.[1] ?? html.match(/"channelId":"(UC[\w-]{22})"/)?.[1] ?? null;
}

const tag = (xml: string, name: string) => xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1].trim() ?? "";
const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
