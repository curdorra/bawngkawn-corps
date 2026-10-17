import Link from "next/link";
import { after } from "next/server";
import { getContent } from "@/lib/content";
import { getAlbums, latestPhotos } from "@/lib/albums";
import { listSermons, pickFeatured, toCard } from "@/lib/sermons";
import { syncIfStale } from "@/lib/sync";
import { Footer, Header } from "@/components/Nav";
import { AlbumCard } from "@/components/AlbumCard";
import { LatestPhotos } from "@/components/AlbumViewer";
import { SermonCard } from "@/components/SermonBrowser";
import { ArrowUpRight, Book, Camera, Heart, Pin } from "@/components/icons";

// Refresh every few minutes so new albums and sermons show up on their own.
export const revalidate = 120;

const features = [
  { href: "/photos", icon: <Camera />, title: "Photos", text: "Every programme in its own album. Save the ones you like in full quality.", cta: "See photos" },
  { href: "/sermons", icon: <Book />, title: "Sermons", text: "Watch or revisit a message, with the scripture, summary and notes.", cta: "Hear the word" },
  { href: "/give", icon: <Heart />, title: "Give", text: "Support our worship, our sections and our care by UPI or bank.", cta: "Give" },
];

export default async function Home() {
  const { site, meetings } = await getContent();
  after(syncIfStale);
  const allAlbums = await getAlbums();
  const albums = allAlbums.slice(0, 6);
  const latest = latestPhotos(allAlbums, 9);
  const sermons = (await listSermons().catch(() => [])).filter((s) => s.youtubeId);
  const featured = pickFeatured(sermons);
  const videos = (featured ? [featured, ...sermons.filter((s) => s !== featured)] : []).slice(0, 3).map(toCard);

  return (
    <>
      <Header social={site.social} />

      {/* ── Newest photos lead the page ── */}
      <section id="photos" className="section tight" style={{ paddingTop: "clamp(20px, 3vw, 40px)" }}>
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="kicker">The Salvation Army · Bawngkawn Corps, Aizawl</p>
              <h1 className="h2" style={{ fontSize: "clamp(42px, 6vw, 78px)" }}>
                Latest <em>photos</em>
              </h1>
            </div>
            <p className="sub">The newest pictures from our programmes. Tap one to see it full screen, then swipe for more.</p>
          </div>
          {latest.length > 0 ? <LatestPhotos items={latest} /> : <p className="tip">Photos will appear here soon.</p>}
        </div>
      </section>

      {/* ── Albums by programme ── */}
      {albums.length > 0 && (
        <section className="section soft">
          <div className="wrap">
            <div className="section-head">
              <h2 className="h2">
                By <em>programme</em>
              </h2>
              <Link href="/photos" className="u-link">
                All albums <ArrowUpRight />
              </Link>
            </div>
            <div className="albums">
              {albums.map((a) => (
                <AlbumCard key={a.slug} album={a} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Latest YouTube videos (the pinned sermon comes first) ── */}
      {videos.length > 0 && (
        <section id="sermons" className="section">
          <div className="wrap">
            <div className="section-head">
              <h2 className="h2">
                Latest <em>videos</em>
              </h2>
              <Link href="/sermons" className="u-link">
                All sermons <ArrowUpRight />
              </Link>
            </div>
            <ul className="sermon-grid">
              {videos.map((s) => (
                <li key={s.slug}>
                  <SermonCard s={s} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── What's here ── */}
      <section className="section">
        <div className="wrap features">
          <div>
            <p className="kicker">Luka 14:22</p>
            <h2>Hmun a la awm.</h2>
          </div>
          <ul className="feature-list">
            {features.map((f) => (
              <li key={f.href}>
                <Link href={f.href} className="feature">
                  <span className="icon-circle">{f.icon}</span>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                  <span className="u-link">
                    {f.cta} <ArrowUpRight />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Meetings ── */}
      <section id="worship" className="strip">
        <div className="wrap">
          <p className="label">Join us · everyone is welcome</p>
          <ul className="meetings">
            {meetings.map((m) => (
              <li key={m.day + m.name}>
                <div className="day">{m.day}</div>
                <p className="name">{m.name}</p>
                <div className="time">{m.time}</div>
              </li>
            ))}
          </ul>
          <p className="where-row">
            <a className="where" href={site.contact.mapLink} target="_blank" rel="noreferrer">
              <Pin /> {site.contact.address}
            </a>
          </p>
        </div>
      </section>

      <Footer social={site.social} />
    </>
  );
}
