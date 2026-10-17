import Link from "next/link";
import { PageShell } from "./PageShell";

export function ComingSoon({ title }: { title: string }) {
  return (
    <PageShell kicker="Coming soon" title={<>{title} <em>soon</em></>} lead="We are still putting this page together. In the meantime, see our photos and sermons.">
      <div className="btn-row">
        <Link href="/photos" className="btn btn-dark">Photos</Link>
        <Link href="/sermons" className="btn btn-ghost">Sermons</Link>
      </div>
    </PageShell>
  );
}
