import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, getAlbum, getAlbums, photoCount } from "@/lib/albums";
import { getContent } from "@/lib/content";
import { Footer, Header } from "@/components/Nav";
import { AlbumActions, PhotoGrid } from "@/components/AlbumViewer";
import { ArrowLeft } from "@/components/icons";

type Params = { params: Promise<{ slug: string }> };

export const revalidate = 120;
export const dynamicParams = true; // new albums work without a rebuild

export async function generateStaticParams() {
  return (await getAlbums()).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const album = await getAlbum((await params).slug);
  if (!album) return {};
  return {
    title: album.title,
    description: `${photoCount(album.photos.length)} from ${album.title}, ${formatDate(album.date)}.`,
    openGraph: { images: [album.photos[0].preview] },
  };
}

export default async function AlbumPage({ params }: Params) {
  const [album, { site }] = await Promise.all([getAlbum((await params).slug), getContent()]);
  if (!album) notFound();

  return (
    <>
      <Header social={site.social} />
      <header className="page-head">
        <div className="wrap">
          <Link href="/photos" className="back">
            <ArrowLeft /> All albums
          </Link>
          <p className="kicker">
            {formatDate(album.date)} · {photoCount(album.photos.length)}
          </p>
          <h1 className="h2">{album.title}</h1>
          <AlbumActions title={album.title} />
        </div>
      </header>
      <main className="section" style={{ paddingTop: 40 }}>
        <div className="wrap">
          <PhotoGrid slug={album.slug} title={album.title} photos={album.photos} />
        </div>
      </main>
      <Footer social={site.social} />
    </>
  );
}
