import type { Metadata } from "next";
import Link from "next/link";
import { getAlbums } from "@/lib/albums";
import { getContent } from "@/lib/content";
import { MissionCards } from "@/components/Missions";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = { title: "Missions" };
export const revalidate = 120;

export default async function MissionsPage() {
  const [{ missions }, albums] = await Promise.all([getContent(), getAlbums()]);
  return (
    <PageShell kicker="Our missions" title={<>Faith in <em>action</em></>} lead="We believe the gospel is for the whole person. Here is some of what we are doing in Jesus' name.">
      <MissionCards missions={missions} albums={albums} />
      <div className="more">
        <Link href="/photos" className="btn btn-red">
          See it in photos
        </Link>
      </div>
    </PageShell>
  );
}
