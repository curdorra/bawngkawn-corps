"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { site } from "@/content/site";
import { links } from "@/content/nav";
import { Close, Instagram, Menu, YouTube } from "./icons";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label={`${site.name} home`}>
      <Image src="/logo.png" alt="" width={42} height={48} priority />
      <span>
        <b>Bawngkawn Corps</b>
        <small>The Salvation Army · Aizawl</small>
      </span>
    </Link>
  );
}

type Social = typeof site.social;

export function Socials({ social }: { social: Social }) {
  const items = [
    { href: social.youtube, label: "YouTube", icon: <YouTube /> },
    { href: social.instagram, label: "Instagram", icon: <Instagram /> },
  ].filter((i) => i.href);
  return (
    <div className="socials">
      {items.map((i) => (
        <a key={i.label} href={i.href} target="_blank" rel="noreferrer" aria-label={i.label}>
          {i.icon}
        </a>
      ))}
    </div>
  );
}

function MobileMenu({ social }: { social: Social }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <button className="icon-btn menu-btn" aria-label="Open menu" onClick={() => setOpen(true)}>
        <Menu />
      </button>
      {open && (
        <div className="mobile-menu" role="dialog" aria-modal="true">
          <div className="top">
            <Brand />
            <button className="icon-btn" aria-label="Close menu" onClick={() => setOpen(false)}>
              <Close />
            </button>
          </div>
          <nav>
            {links.map((l) =>
              l.soon ? (
                <span key={l.href} className="soon">{l.label} <small>soon</small></span>
              ) : (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
                  {l.label}
                </Link>
              )
            )}
          </nav>
          <Socials social={social} />
        </div>
      )}
    </>
  );
}

export function Header({ social }: { social: Social }) {
  const pathname = usePathname();
  return (
    <header className="header">
      <div className="wrap">
        <Brand />
        <nav aria-label="Main">
          {links.filter((l) => l.href !== "/").map((l) => l.soon ? (
            <span key={l.href} className="soon" title="Coming soon">{l.label}</span>
          ) : (
            <Link
              key={l.href}
              href={l.href}
              className={l.href === "/photos" ? "pill" : undefined}
              aria-current={l.href === pathname || (l.href !== "/" && pathname.startsWith(l.href)) ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <MobileMenu social={social} />
      </div>
    </header>
  );
}

export function Footer({ social }: { social: Social }) {
  return (
    <footer className="footer">
      <div className="wrap">
        <span>
          © {new Date().getFullYear()} {site.name} · {site.tagline}
        </span>
        <nav>
          {links.slice(1).filter((l) => !l.soon).map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>
        <Socials social={social} />
        <Link href="/admin" className="admin-link">Admin</Link>
      </div>
    </footer>
  );
}
