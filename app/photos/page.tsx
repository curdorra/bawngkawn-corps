import type { Metadata } from "next";
import { after } from "next/server";
import { getAlbums } from "@/lib/albums";
import { getContent } from "@/lib/content";
import { syncIfStale } from "@/lib/sync";
import { Footer, Header } from "@/components/Nav";
import { AlbumCard } from "@/components/AlbumCard";

export const metadata: Metadata = { title: "Photos" };
export const revalidate = 120;

export default async function PhotosPage() {
  const [albums, { site }] = await Promise.all([getAlbums(), getContent()]);
  after(syncIfStale);
  return (
    <>
      <Header social={site.social} />
      <header className="page-head">
        <div className="wrap">
          <p className="kicker">Photos</p>
          <h1 className="h2">
            Our <em>programmes</em>
          </h1>
          <p className="lead">The newest pictures from our programmes. Tap one to see it full screen, then swipe for more.</p>
        </div>
      </header>
      <main className="section">
        <div className="wrap">
          <div className="albums">
            {albums.map((a) => (
              <AlbumCard key={a.slug} album={a} />
            ))}
          </div>
        </div>
      </main>
      <Footer social={site.social} />
    </>
  );
}
