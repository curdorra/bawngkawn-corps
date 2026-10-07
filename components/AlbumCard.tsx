import Link from "next/link";
import { type Album, formatDate, photoCount } from "@/lib/albums";

export function AlbumCard({ album }: { album: Album }) {
  return (
    <Link href={`/photos/${album.slug}`} className="album-card">
      <div className="cover">
        <img src={album.photos[0].thumb} alt="" loading="lazy" />
        <span className="count">{photoCount(album.photos.length)}</span>
      </div>
      <h3>
        <span>{album.title}</span>
      </h3>
      <p>{formatDate(album.date)}</p>
    </Link>
  );
}
