import type { Metadata, Viewport } from "next";
import { Manrope, Newsreader } from "next/font/google";
import { site } from "@/content/site";
import "./globals.css";

const sans = Manrope({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "500", "600", "700"] });
const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif", weight: ["300", "400"], style: ["normal", "italic"] });

const domain = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const metadata: Metadata = {
  metadataBase: new URL(domain ? `https://${domain}` : "http://localhost:3001"),
  title: { default: `${site.name} · The Salvation Army, Aizawl`, template: `%s · ${site.name}` },
  description: "Photos, sermons and meeting times from The Salvation Army Bawngkawn Corps, Aizawl, Mizoram.",
};

export const viewport: Viewport = { themeColor: "#00265a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
