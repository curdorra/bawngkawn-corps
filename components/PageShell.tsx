import type { ReactNode } from "react";
import { getContent } from "@/lib/content";
import { Footer, Header } from "./Nav";

// The header, title block and footer shared by the inner pages.
export async function PageShell({ kicker, title, lead, top, children }: { kicker: string; title: ReactNode; lead?: string; top?: ReactNode; children: ReactNode }) {
  const { site } = await getContent();
  return (
    <>
      <Header social={site.social} />
      <header className="page-head">
        <div className="wrap">
          {top}
          <p className="kicker">{kicker}</p>
          <h1 className="h2">{title}</h1>
          {lead && <p className="lead">{lead}</p>}
        </div>
      </header>
      <main className="section">
        <div className="wrap">{children}</div>
      </main>
      <Footer social={site.social} />
    </>
  );
}
