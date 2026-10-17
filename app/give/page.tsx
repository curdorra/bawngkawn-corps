import type { Metadata } from "next";
import QRCode from "qrcode";
import { getContent } from "@/lib/content";
import { PageShell } from "@/components/PageShell";
import { ComingSoon } from "@/components/ComingSoon";
import { isSoon } from "@/content/nav";

export const metadata: Metadata = { title: "Give" };
export const revalidate = 120;

export default async function GivePage() {
  if (isSoon("/give")) return <ComingSoon title="Give" />;
  const { site, give } = await getContent();
  const upiLink = give.upi ? `upi://pay?pa=${encodeURIComponent(give.upi)}&pn=${encodeURIComponent(give.accountName || site.name)}&cu=INR` : "";
  const qr = upiLink ? await QRCode.toDataURL(upiLink, { margin: 1, width: 320, color: { dark: "#00265a", light: "#ffffff" } }) : "";
  const bank = [
    ["Account name", give.accountName],
    ["Bank", give.bank],
    ["Account number", give.accountNumber],
    ["IFSC", give.ifsc],
  ].filter(([, v]) => v);

  return (
    <PageShell kicker="Give" title={<>Support the <em>work</em></>} lead={give.intro}>
      {!upiLink && bank.length === 0 && (
        <p className="tip">
          To give, please speak to one of our leaders on Sunday, or call us on <a href={`tel:${site.contact.phone.replace(/\s/g, "")}`}>{site.contact.phone}</a>.
        </p>
      )}
      <div className="give-grid">
        {upiLink && (
          <section className="give-card">
            <h2>Give by UPI</h2>
            <img className="qr" src={qr} alt={`UPI QR code for ${give.upi}`} width={220} height={220} />
            <p className="upi-id">{give.upi}</p>
            <a href={upiLink} className="btn btn-red">
              Open my UPI app
            </a>
            <p className="tip">On a phone, tap the button. On a computer, scan the code with any UPI app.</p>
          </section>
        )}
        {bank.length > 0 && (
          <section className="give-card">
            <h2>Bank transfer</h2>
            <dl className="facts one">
              {bank.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>
      {give.note && <p className="give-note">{give.note}</p>}
    </PageShell>
  );
}
