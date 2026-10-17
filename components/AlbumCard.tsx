import Link from "next/link";
import { type Album, formatDate, photoCount } from "@/lib/albums";
import { ArrowUpRight } from "./icons";

export function AlbumCard({ album }: { album: Album }) {
  return (
    <Link href={`/photos/${album.slug}`} className="album-card">
      <div className="cover">
        <img src={album.photos[0].thumb} alt="" loading="lazy" />
        <span className="count">{photoCount(album.photos.length)}</span>
      </div>
      <div className="card-foot">
        <div>
          <h3>{album.title}</h3>
          <p>{formatDate(album.date)}</p>
        </div>
        <span className="circle-arrow"><ArrowUpRight /></span>
      </div>
    </Link>
  );
}
