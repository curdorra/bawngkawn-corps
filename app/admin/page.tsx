import type { Metadata } from "next";
import { adminEnabled, currentAdmin } from "@/lib/admin-auth";
import { albumKey, getAlbums } from "@/lib/albums";
import { getContent } from "@/lib/content";
import { listSermons } from "@/lib/sermons";
import { getSettings } from "@/lib/settings";
import { Admin, type AdminAlbum, type AdminSermon } from "@/components/Admin";
import { Footer, Header } from "@/components/Nav";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { site } = await getContent();
  const who = await currentAdmin();

  let data: { sermons: AdminSermon[]; series: { id: string; name: string }[]; albums: AdminAlbum[]; driveFolderId: string; envFolder: boolean } | null = null;
  if (who) {
    const [sermons, albums, settings] = await Promise.all([listSermons({ includeHidden: true }), getAlbums({ includeHidden: true }), getSettings()]);
    const hidden = new Set(settings.hiddenAlbums);
    data = {
      sermons: sermons.map((s) => ({
        id: s.id, date: s.date, title: s.title, youtubeId: s.youtubeId ?? "", preacher: s.preacher ?? "", scripture: s.scripture ?? "",
        seriesId: s.seriesId ?? "", language: s.language ?? "", summary: s.summary ?? "", notes: s.notes ?? s.text ?? "",
        hidden: Boolean(s.hidden), pinned: s.featured, thumb: s.thumb,
      })),
      series: settings.series,
      albums: albums.map((a) => ({ key: albumKey(a), title: a.title, date: a.date, count: a.photos.length, cover: a.photos[0].thumb, hidden: hidden.has(albumKey(a)) })),
      driveFolderId: settings.driveFolderId,
      envFolder: Boolean(process.env.GOOGLE_DRIVE_FOLDER_ID),
    };
  }

  return (
    <>
      <Header social={site.social} />
      <header className="page-head">
        <div className="wrap">
          <p className="kicker">Admin</p>
          <h1 className="h2">
            Look after the <em>site</em>
          </h1>
        </div>
      </header>
      <main className="section">
        <div className="wrap">
          <Admin enabled={adminEnabled()} who={who} data={data} />
        </div>
      </main>
      <Footer social={site.social} />
    </>
  );
}
