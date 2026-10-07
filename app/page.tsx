import Image from "next/image";
import Link from "next/link";
import { after } from "next/server";
import { getContent } from "@/lib/content";
import { formatDate, getAlbums } from "@/lib/albums";
import { getVideos } from "@/lib/videos";
import { excerpt, listSermons } from "@/lib/sermons";
import { syncIfStale } from "@/lib/sync";
import { Footer, Header } from "@/components/Nav";
import { AlbumCard } from "@/components/AlbumCard";
import { MissionCards } from "@/components/Missions";
import { ArrowUpRight, Pin } from "@/components/icons";

// Refresh every few minutes so Sheet edits and new albums show up on their own.
export const revalidate = 120;

export default async function Home() {
  const { site, meetings, missions } = await getContent();
  after(syncIfStale);
  const allAlbums = await getAlbums();
  const albums = allAlbums.slice(0, 6);
  const videos = await getVideos(site.social.youtube);
  const sermons = (await listSermons().catch(() => [])).slice(0, 3);
  const sunday = meetings[0];

  return (
    <>
      <Header social={site.social} />

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-media">
          <Image src="/images/site/hero.jpg" alt="" fill priority sizes="100vw" />
        </div>
        <div className="hero-copy">
          <h1>
            {site.hero.titleLine1} <em>{site.hero.titleLine2}</em>
          </h1>
          <p className="lead">{site.hero.subtitle}</p>
          <div className="btn-row">
            <Link href="/photos" className="btn btn-light">
              See recent photos <ArrowUpRight />
            </Link>
            <a href="#worship" className="btn btn-ghost">
              Meeting times
            </a>
          </div>
        </div>
      </section>

      {/* ── Four doors in ── */}
      <div className="wrap">
        <nav className="doors" aria-label="Start here">
          <a href="#worship" className="door navy">
            <span className="k">Join us</span>
            <b>{sunday ? `${sunday.day} ${sunday.time}` : "Every Sunday"}</b>
            <span>{sunday?.name ?? "Worship"}</span>
          </a>
          <Link href="/sermons" className="door">
            <span className="k">Read</span>
            <b>Sermons</b>
            <span>Messages from our meetings</span>
          </Link>
          <Link href="/give" className="door">
            <span className="k">Give</span>
            <b>Support the work</b>
            <span>Offerings by UPI or bank</span>
          </Link>
          <Link href="/counselling" className="door red">
            <span className="k">Care</span>
            <b>Talk to someone</b>
            <span>Private, and always welcome</span>
          </Link>
        </nav>
      </div>

      {/* ── Photos (the main feature) ── */}
      {albums.length > 0 && (
        <section id="photos" className="section">
          <div className="wrap">
            <div className="section-head">
              <h2 className="h2">
                Recent <em>photos</em>
              </h2>
              <p className="sub">Open an album to save your photos in full quality, or download the whole album.</p>
            </div>
            <div className="albums">
              {albums.map((a) => (
                <AlbumCard key={a.slug} album={a} />
              ))}
            </div>
            <div className="more">
              <Link href="/photos" className="btn btn-red">
                See all albums <ArrowUpRight />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Missions ── */}
      <section className="section mist">
        <div className="wrap">
          <div className="section-head">
            <h2 className="h2">
              Faith in <em>action</em>
            </h2>
            <Link href="/missions" className="u-link">
              All our missions
            </Link>
          </div>
          <MissionCards missions={missions.slice(0, 3)} albums={allAlbums} />
        </div>
      </section>

      {/* ── Worship times ── */}
      <section id="worship" className="worship">
        <div className="wrap">
          <p className="kicker">Join us for worship</p>
          <h2>
            Every Sunday at {meetings[0]?.time}
            <em>everyone is welcome.</em>
          </h2>
          <a className="where" href={site.contact.mapLink} target="_blank" rel="noreferrer">
            <Pin /> {site.contact.address}
          </a>
          <ul className="meetings">
            {meetings.map((m) => (
              <li key={m.day + m.name}>
                <div className="day">{m.day}</div>
                <p className="name">{m.name}</p>
                <div className="time">{m.time}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Sermons (written) ── */}
      {sermons.length > 0 && (
        <section id="sermons" className="section">
          <div className="wrap">
            <div className="section-head">
              <h2 className="h2">
                From the <em>pulpit</em>
              </h2>
              <Link href="/sermons" className="u-link">
                All sermons
              </Link>
            </div>
            <ul className="sermon-list cols">
              {sermons.map((s) => (
                <li key={s.slug}>
                  <Link href={`/sermons/${s.slug}`}>
                    <span className="d">{formatDate(s.date)}</span>
                    <h3>{s.title}</h3>
                    <p>{excerpt(s)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Videos (YouTube) ── */}
      {videos.length > 0 && (
        <section id="watch" className="section mist">
          <div className="wrap">
            <div className="section-head">
              <h2 className="h2">
                Watch <em>with us</em>
              </h2>
              <a href={site.social.youtube} target="_blank" rel="noreferrer" className="u-link">
                More on YouTube
              </a>
            </div>
            <ul className="videos">
              {videos.map((v) => (
                <li key={v.id}>
                  <a href={v.url} target="_blank" rel="noreferrer">
                    <span className="thumb">
                      <img src={v.thumb} alt="" loading="lazy" />
                      <i className="play" />
                    </span>
                    <h3>{v.title}</h3>
                    <p>{formatDate(v.date)}</p>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Care ── */}
      <section className="band navy">
        <div className="wrap">
          <h2>
            You don&apos;t have to carry it <em>alone.</em>
          </h2>
          <p>If you are feeling low, anxious or lonely, we would be glad to listen and pray with you.</p>
          <Link href="/counselling" className="btn btn-red">
            Talk to someone
          </Link>
        </div>
      </section>

      {/* ── Give ── */}
      <section className="band">
        <div className="wrap">
          <h2>
            Help us keep <em>serving.</em>
          </h2>
          <p>Every offering supports our worship, our sections and our care for the community.</p>
          <Link href="/give" className="btn btn-red">
            Give
          </Link>
        </div>
      </section>

      {/* ── Visit ── */}
      <section id="visit" className="statement">
        <Image src="/images/site/about.jpg" alt="" fill sizes="100vw" />
        <div className="wrap">
          <h2>
            A place to <em>belong</em>,
            <br />
            grow, <em>&amp; serve.</em>
          </h2>
          <div className="btn-row">
            <a href={site.contact.mapLink} target="_blank" rel="noreferrer" className="btn btn-light">
              Get directions <ArrowUpRight />
            </a>
            {site.contact.whatsapp && (
              <a href={site.contact.whatsapp} target="_blank" rel="noreferrer" className="btn btn-ghost">
                WhatsApp us
              </a>
            )}
          </div>
          <ul className="contact-row">
            <li>
              <span>Address</span>
              {site.contact.address}
            </li>
            <li>
              <span>Email</span>
              <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
            </li>
          </ul>
        </div>
      </section>

      <Footer social={site.social} />
    </>
  );
}
