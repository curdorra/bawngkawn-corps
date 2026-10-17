"use client";

import { useEffect, useState } from "react";
import { Copy, WhatsApp } from "./icons";

export function ShareButtons({ title, path }: { title: string; path: string }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => setOrigin(window.location.origin), []);
  const url = `${origin}${path}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this link:", url); // older browsers
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="share">
      <a className="btn btn-wa" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`}>
        <WhatsApp /> Share on WhatsApp
      </a>
      <button className="btn btn-light" onClick={copy}>
        <Copy /> {copied ? "Link copied!" : "Copy link"}
      </button>
    </div>
  );
}
