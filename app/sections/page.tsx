import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";
import { isSoon } from "@/content/nav";
import Image from "next/image";
import { getContent } from "@/lib/content";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = { title: "Sections" };
export const revalidate = 120;

export default async function SectionsPage() {
  if (isSoon("/sections")) return <ComingSoon title="Sections" />;
  const { groups } = await getContent();
  return (
    <PageShell kicker="Sections" title={<>Find your <em>place</em></>} lead="There is a section for every age. Speak to any of our leaders after the meeting.">
      <div className="groups">
        {groups.map((g) => (
          <article className="group" key={g.name}>
            <div className="img">
              <Image src={g.image} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 33vw" />
            </div>
            <div className="body">
              <h3>{g.name}</h3>
              <p>{g.text}</p>
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
