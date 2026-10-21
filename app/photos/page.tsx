import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { formatDate, getAlbums, photoCount } from "@/lib/albums";
import { getContent } from "@/lib/content";
import { syncIfStale } from "@/lib/sync";
import { Footer, Header } from "@/components/Nav";
import { AlbumCard } from "@/components/AlbumCard";
import { PhotoGrid } from "@/components/AlbumViewer";

export const metadata: Metadata = { title: "Photos" };
export const revalidate = 120;

// The newest Drive folder is shown in full; older programmes are listed below it as albums.
export default async function PhotosPage() {
  const [albums, { site }] = await Promise.all([getAlbums(), getContent()]);
  after(syncIfStale);
  const [latest, ...earlier] = albums;
  return (
    <>
      <Header social={site.social} />
      <header className="page-head">
        <div className="wrap">
          <p className="kicker">{latest ? `${formatDate(latest.date)} · ${photoCount(latest.photos.length)}` : "Photos"}</p>
          <h1 className="h2">{latest ? latest.title : <>Our <em>programmes</em></>}</h1>
          <p className="lead">
            {latest ? (
              <>
                Our latest programme. Tap a photo to see it full screen, then swipe for more.{" "}
                <Link href={`/photos/${latest.slug}`}>Share or download this album</Link>
              </>
            ) : (
              "Photos from our programmes will appear here soon."
            )}
          </p>
        </div>
      </header>
      {latest && (
        <main className="section" style={{ paddingTop: 40 }}>
          <div className="wrap">
            <PhotoGrid slug={latest.slug} title={latest.title} photos={latest.photos} />
          </div>
        </main>
      )}
      {earlier.length > 0 && (
        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <h2 className="h2">
                Earlier <em>programmes</em>
              </h2>
            </div>
            <div className="albums">
              {earlier.map((a) => (
                <AlbumCard key={a.slug} album={a} />
              ))}
            </div>
          </div>
        </section>
      )}
      <Footer social={site.social} />
    </>
  );
}
