import type { Metadata } from "next";
import { listSermons, toCard } from "@/lib/sermons";
import { PageShell } from "@/components/PageShell";
import { SermonBrowser } from "@/components/SermonBrowser";

export const metadata: Metadata = { title: "Sermons" };
export const revalidate = 120;

export default async function SermonsPage() {
  const sermons = (await listSermons()).map(toCard);
  return (
    <PageShell kicker="Sermons" title={<>Hear the <em>word</em></>} lead="Messages from our meetings. Search by preacher, scripture or series, and share any message with a friend.">
      <SermonBrowser sermons={sermons} />
    </PageShell>
  );
}
