import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";
import { isSoon } from "@/content/nav";
import { getContent } from "@/lib/content";
import { CounsellingForm } from "@/components/CounsellingForm";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = { title: "Talk to someone" };
export const revalidate = 120;

export default async function CounsellingPage() {
  if (isSoon("/counselling")) return <ComingSoon title="Counselling" />;
  const { site } = await getContent();
  return (
    <PageShell
      kicker="Counselling and prayer"
      title={<>You don&apos;t have to carry it <em>alone</em></>}
      lead="If you are feeling low, anxious, lonely or just worn out, we would be glad to listen and pray with you. Tell us a little below and someone from the corps will reach out to you privately."
    >
      <div className="care-grid">
        <CounsellingForm phone={site.contact.phone} />
        <aside className="help-box">
          <h2>Need help right now?</h2>
          <p>This form is not an emergency service, and we may not see it straight away. If you are thinking of harming yourself, or someone is in danger:</p>
          <ul>
            <li>
              <b>Call 112</b> for emergency help anywhere in India.
            </li>
            <li>
              <b>Tele-MANAS: 14416</b> (or 1-800-891-4416). Free, confidential mental health support, any time of day or night.
            </li>
          </ul>
          <p>You can also call or visit us. You are always welcome.</p>
          <p>
            <a href={`tel:${site.contact.phone.replace(/\s/g, "")}`}>{site.contact.phone}</a>
          </p>
        </aside>
      </div>
    </PageShell>
  );
}
