import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/albums";
import { getSermon, listSermons } from "@/lib/sermons";
import { PageShell } from "@/components/PageShell";
import { ArrowLeft } from "@/components/icons";

type Params = { params: Promise<{ slug: string }> };

export const revalidate = 120;
export const dynamicParams = true; // new sermons work without a rebuild

export async function generateStaticParams() {
  return (await listSermons()).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const s = await getSermon((await params).slug);
  return s ? { title: s.title, description: s.paragraphs[0]?.slice(0, 160) } : {};
}

export default async function SermonPage({ params }: Params) {
  const s = await getSermon((await params).slug);
  if (!s) notFound();
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
      <article className="prose sermon">
        {s.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </article>
    </PageShell>
  );
}
