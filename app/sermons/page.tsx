import type { Metadata } from "next";
import Link from "next/link";
import { formatDate } from "@/lib/albums";
import { editingEnabled } from "@/lib/sermon-auth";
import { excerpt, listSermons } from "@/lib/sermons";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = { title: "Sermons" };
export const revalidate = 120;

export default async function SermonsPage() {
  const sermons = await listSermons();
  return (
    <PageShell kicker="Sermons" title={<>Read the <em>word</em></>} lead="Messages from our Sunday meetings, newest first.">
      {sermons.length === 0 && <p className="tip">Sermons will appear here soon.</p>}
      <ul className="sermon-list">
        {sermons.map((s) => (
          <li key={s.slug}>
            <Link href={`/sermons/${s.slug}`}>
              <span className="d">{formatDate(s.date)}</span>
              <h2>{s.title}</h2>
              <p>{excerpt(s)}</p>
            </Link>
          </li>
        ))}
      </ul>
      {editingEnabled() && (
        <p className="manage-link">
          <Link href="/sermons/manage" className="btn btn-ghost">
            Edit sermons
          </Link>
        </p>
      )}
    </PageShell>
  );
}
