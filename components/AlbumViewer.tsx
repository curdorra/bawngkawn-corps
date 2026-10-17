"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Photo } from "@/lib/albums";
import { Chevron, Close, Download, Share } from "./icons";

type Props = { slug: string; title: string; photos: Photo[] };

const fileName = (slug: string, i: number) => `${slug}-${String(i + 1).padStart(2, "0")}.jpg`;

function saveBlob(blob: Blob, name: string) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 10_000);
}

// Photos live on a separate storage domain, so we fetch them first; a plain
// download link would just open the image instead of saving it.
// On phones, the share sheet has "Save Image", which puts the photo straight
// into the gallery. Everywhere else, a normal full-quality download.
async function savePhoto(url: string, name: string) {
  const blob = await (await fetch(url)).blob();
  const file = new File([blob], name, { type: blob.type || "image/jpeg" });
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  if (isTouch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (err) {
      if ((err as Error).name === "AbortError") return; // user closed the sheet
    }
  }
  saveBlob(blob, name);
}

export function AlbumActions({ slug, title, photos }: Props) {
  const [progress, setProgress] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  async function downloadAll() {
    setProgress(0);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      let done = 0;
      // A few at a time, so slow mobile connections don't stall.
      for (let i = 0; i < photos.length; i += 4) {
        await Promise.all(
          photos.slice(i, i + 4).map(async (p, j) => {
            const blob = await (await fetch(p.original)).blob();
            zip.file(fileName(slug, i + j), blob);
            setProgress(Math.round((++done / photos.length) * 100));
          })
        );
      }
      saveBlob(await zip.generateAsync({ type: "blob", compression: "STORE" }), `${slug}.zip`);
    } catch {
      alert("Sorry, the download didn't finish. Please check your connection and try again.");
    } finally {
      setProgress(null);
    }
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {}
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="album-actions">
      <button className="btn btn-light" onClick={downloadAll} disabled={progress !== null}>
        <Download />
        {progress === null ? `Download all (${photos.length})` : `Preparing… ${progress}%`}
      </button>
      <button className="btn btn-ghost" onClick={share}>
        <Share />
        {copied ? "Link copied!" : "Share album"}
      </button>
    </div>
  );
}

type Item = { photo: Photo; title: string; file: string };

// Thumbnails that open a full-screen viewer you can swipe through. Used for an album and for the newest photos on the home page.
function Gallery({ items, className, caption }: { items: Item[]; className: string; caption?: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = items.length;

  const go = useCallback((d: number) => setOpen((i) => (i === null ? null : (i + d + count) % count)), [count]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    // Preload the neighbours so swiping feels instant.
    [open - 1, open + 1].forEach((i) => {
      const it = items[(i + count) % count];
      if (it) new Image().src = it.photo.preview;
    });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, go, items, count]);

  async function save() {
    if (open === null) return;
    setSaving(true);
    try {
      await savePhoto(items[open].photo.original, items[open].file);
    } catch {
      alert("Sorry, the photo couldn't be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const current = open === null ? null : items[open];

  return (
    <>
      <div className={className}>
        {items.map((it, i) => (
          <button key={it.photo.id} className="photo-tile" onClick={() => setOpen(i)} aria-label={`Open photo ${i + 1}: ${it.title}`}>
            <img src={it.photo.thumb} alt={it.title} loading="lazy" decoding="async" />
            {caption && <span className="cap">{it.title}</span>}
          </button>
        ))}
      </div>

      {current && open !== null && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={`${current.title}, photo ${open + 1}`}>
          <div className="lb-top">
            <span className="lb-count">
              {open + 1} / {count} · {current.title}
            </span>
            <button className="icon-btn" onClick={() => setOpen(null)} aria-label="Close">
              <Close />
            </button>
          </div>
          <div
            className="lb-stage"
            onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchX.current === null) return;
              const dx = e.changedTouches[0].clientX - touchX.current;
              if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
              touchX.current = null;
            }}
          >
            <img key={current.photo.id} src={current.photo.preview} alt={`${current.title}, photo ${open + 1}`} />
            <button className="lb-nav lb-prev" onClick={() => go(-1)} aria-label="Previous photo">
              <Chevron dir="left" />
            </button>
            <button className="lb-nav lb-next" onClick={() => go(1)} aria-label="Next photo">
              <Chevron />
            </button>
          </div>
          <div className="lb-bottom">
            <span className="lb-count">Full quality</span>
            <button className="btn btn-light" onClick={save} disabled={saving}>
              <Download /> {saving ? "Saving…" : "Save photo"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function PhotoGrid({ slug, title, photos }: Props) {
  const items = photos.map((photo, i) => ({ photo, title: `${title}, photo ${i + 1}`, file: fileName(slug, i) }));
  return (
    <>
      <p className="tip">Tap a photo to view it full size and save it.</p>
      <Gallery items={items} className="photo-grid" />
    </>
  );
}

/** The newest photos from every album, as a mosaic. Each one opens in the viewer; swipe to see the next. */
export function LatestPhotos({ items }: { items: { photo: Photo; albumTitle: string; albumSlug: string; index: number }[] }) {
  return (
    <Gallery
      className="mosaic"
      caption
      items={items.map((it) => ({ photo: it.photo, title: it.albumTitle, file: fileName(it.albumSlug, it.index) }))}
    />
  );
}
