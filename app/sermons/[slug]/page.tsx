import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/albums";
import { getSermon, languageLabel, listSermons } from "@/lib/sermons";
import { PageShell } from "@/components/PageShell";
import { ShareButtons } from "@/components/ShareButtons";
import { ArrowLeft } from "@/components/icons";

type Params = { params: Promise<{ slug: string }> };

export const revalidate = 120;
export const dynamicParams = true; // new sermons work without a rebuild

export async function generateStaticParams() {
  return (await listSermons()).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const s = await getSermon((await params).slug);
  if (!s) return {};
  const description = s.summary || s.noteLines[0]?.slice(0, 160) || [s.preacher, s.scripture].filter(Boolean).join(" · ");
  return { title: s.title, description };
}

export default async function SermonPage({ params }: Params) {
  const { slug } = await params;
  const all = await listSermons();
  const i = all.findIndex((s) => s.slug === slug);
  if (i < 0) notFound();
  const s = all[i];
  const newer = all[i - 1];
  const older = all[i + 1];
  const facts = [
    ["Preacher", s.preacher],
    ["Scripture", s.scripture],
    ["Series", s.series],
    ["Language", languageLabel(s.language)],
  ].filter(([, v]) => v);

  return (
    <PageShell
      kicker={formatDate(s.date)}
      title={s.title}
      top={
        <Link href="/sermons" className="back">
          <ArrowLeft /> All sermons
        </Link>
      }
    >
      <div className="sermon-layout">
        <article className="prose">
          {s.summary && (
            <>
              <h2>Summary</h2>
              <p className="summary">{s.summary}</p>
            </>
          )}
          {s.noteLines.length > 0 && (
            <>
              <h2>Notes</h2>
              {s.noteLines.map((p, n) => (
                <p key={n}>{p}</p>
              ))}
            </>
          )}
          {!s.summary && s.noteLines.length === 0 && <p className="tip">Notes for this message will be added soon.</p>}
        </article>

        <aside className="sermon-side">
          {facts.length > 0 && (
            <dl>
              {facts.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          )}
          <ShareButtons title={s.title} path={`/sermons/${s.slug}`} />
        </aside>
      </div>

      {(newer || older) && (
        <nav className="sermon-nav" aria-label="More sermons">
          {older ? (
            <Link href={`/sermons/${older.slug}`}>
              <small>Earlier</small>
              <b>{older.title}</b>
            </Link>
          ) : <span />}
          {newer && (
            <Link href={`/sermons/${newer.slug}`} className="next">
              <small>Later</small>
              <b>{newer.title}</b>
            </Link>
          )}
        </nav>
      )}
    </PageShell>
  );
}
