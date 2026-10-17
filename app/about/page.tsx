import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";
import { isSoon } from "@/content/nav";
import Image from "next/image";
import { getContent } from "@/lib/content";
import { Footer, Header } from "@/components/Nav";

export const metadata: Metadata = { title: "About" };
export const revalidate = 120;

export default async function AboutPage() {
  if (isSoon("/about")) return <ComingSoon title="About" />;
  const { site, about } = await getContent();
  return (
    <>
      <Header social={site.social} />
      <header className="page-head">
        <div className="wrap">
          <p className="kicker">About us</p>
          <h1 className="h2">
            Bawngkawn <em>Corps</em>
          </h1>
          <p className="lead">{site.tagline}</p>
        </div>
      </header>

      <main>
        <section className="section">
          <div className="wrap about-grid">
            <div className="img">
              <Image src="/images/site/about.jpg" alt="" fill sizes="(max-width: 900px) 100vw, 50vw" />
            </div>
            <div className="prose">
              <p className="kicker">Our story</p>
              {about.history.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              <dl className="facts">
                {about.facts.map((f) => (
                  <div key={f.label}>
                    <dt>{f.label}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="officers">
                {about.officers.map((o, i) => (
                  <div className="officer" key={i}>
                    <p>{o.role}</p>
                    <h3>{o.name}</h3>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section mission">
          <div className="wrap">
            <p className="kicker">Our mission</p>
            <blockquote>{about.mission}</blockquote>
          </div>
        </section>
      </main>
      <Footer social={site.social} />
    </>
  );
}
