import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { COOKIE, editingEnabled, validToken } from "@/lib/sermon-auth";
import { listSermons } from "@/lib/sermons";
import { PageShell } from "@/components/PageShell";
import { SermonManager } from "@/components/SermonManager";
import { ArrowLeft } from "@/components/icons";

export const metadata: Metadata = { title: "Edit sermons", robots: { index: false, follow: false } };

export default async function ManageSermonsPage() {
  const authed = validToken((await cookies()).get(COOKIE)?.value);
  const sermons = authed ? (await listSermons()).map(({ id, date, title, text }) => ({ id, date, title, text })) : [];
  return (
    <PageShell
      kicker="Sermons"
      title={<>Edit <em>sermons</em></>}
      top={
        <Link href="/sermons" className="back">
          <ArrowLeft /> All sermons
        </Link>
      }
    >
      <SermonManager enabled={editingEnabled()} authed={authed} sermons={sermons} />
    </PageShell>
  );
}
