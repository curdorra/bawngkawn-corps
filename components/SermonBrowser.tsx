"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { SermonCardData } from "@/lib/sermons";
import { Book, PlayFill, Search } from "./icons";

export function SermonCard({ s, showSeries = true }: { s: SermonCardData; showSeries?: boolean }) {
  return (
    <Link href={`/sermons/${s.slug}`} className="sermon-card">
      <span className={s.thumb ? "thumb" : "thumb text"}>
        {s.thumb ? (
          <>
            <img src={s.thumb} alt="" loading="lazy" />
            <i className="play"><PlayFill /></i>
          </>
        ) : (
          <Book />
        )}
      </span>
      <div className="meta">
        <span>{s.dateLabel}</span>
        {s.language && <span className="chip">{s.language === "mizo" ? "Mizo" : "English"}</span>}
        {showSeries && s.series && <span className="chip dark">{s.series}</span>}
      </div>
      <h3>{s.title}</h3>
      {s.preacher && <p className="by">{s.preacher}</p>}
      {s.scripture && <p>{s.scripture}</p>}
      {!s.preacher && !s.scripture && s.blurb && <p>{s.blurb}</p>}
    </Link>
  );
}

const unique = (xs: string[]) => [...new Set(xs.filter(Boolean))].sort((a, b) => a.localeCompare(b));

export function SermonBrowser({ sermons }: { sermons: SermonCardData[] }) {
  const [q, setQ] = useState("");
  const [preacher, setPreacher] = useState("");
  const [series, setSeries] = useState("");
  const [year, setYear] = useState("");
  const [language, setLanguage] = useState("");
  const [view, setView] = useState<"all" | "series">("all");

  const preachers = useMemo(() => unique(sermons.map((s) => s.preacher)), [sermons]);
  const seriesNames = useMemo(() => unique(sermons.map((s) => s.series)), [sermons]);
  const years = useMemo(() => unique(sermons.map((s) => s.date.slice(0, 4))).reverse(), [sermons]);
  const showLanguage = new Set(sermons.map((s) => s.language).filter(Boolean)).size > 1;

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return sermons.filter(
      (s) =>
        (!preacher || s.preacher === preacher) &&
        (!series || s.series === series) &&
        (!year || s.date.startsWith(year)) &&
        (!language || s.language === language) &&
        (!needle || [s.title, s.preacher, s.scripture, s.series, s.blurb].some((f) => f.toLowerCase().includes(needle)))
    );
  }, [sermons, q, preacher, series, year, language]);

  const groups = useMemo(() => {
    const map = new Map<string, SermonCardData[]>();
    for (const s of shown) map.set(s.series || "Single messages", [...(map.get(s.series || "Single messages") ?? []), s]);
    // Real series first (by newest message), single messages last.
    return [...map.entries()].sort(([a], [b]) => Number(a === "Single messages") - Number(b === "Single messages"));
  }, [shown]);

  const filtered = Boolean(q || preacher || series || year || language);
  const clear = () => (setQ(""), setPreacher(""), setSeries(""), setYear(""), setLanguage(""));

  return (
    <>
      <div className="filters" role="search">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, preacher or scripture" aria-label="Search sermons" />
        <select value={preacher} onChange={(e) => setPreacher(e.target.value)} aria-label="Preacher">
          <option value="">All preachers</option>
          {preachers.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select value={series} onChange={(e) => setSeries(e.target.value)} aria-label="Series">
          <option value="">All series</option>
          {seriesNames.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select value={year} onChange={(e) => setYear(e.target.value)} aria-label="Year">
          <option value="">Any year</option>
          {years.map((p) => <option key={p}>{p}</option>)}
        </select>
        {showLanguage ? (
          <select value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Language">
            <option value="">Mizo &amp; English</option>
            <option value="mizo">Mizo</option>
            <option value="english">English</option>
          </select>
        ) : (
          <span />
        )}
      </div>

      <div className="filter-bar">
        <span aria-live="polite">
          <Search />
          {shown.length} {shown.length === 1 ? "sermon" : "sermons"}
          {filtered && (
            <>
              {" · "}
              <button className="linkbtn" onClick={clear}>Clear filters</button>
            </>
          )}
        </span>
        <div className="seg" role="group" aria-label="Layout">
          <button aria-pressed={view === "all"} onClick={() => setView("all")}>Newest</button>
          <button aria-pressed={view === "series"} onClick={() => setView("series")}>By series</button>
        </div>
      </div>

      {shown.length === 0 && <p className="tip">{sermons.length === 0 ? "Sermons will appear here soon." : "No sermons match. Try clearing a filter."}</p>}

      {view === "all" ? (
        <ul className="sermon-grid">
          {shown.map((s) => (
            <li key={s.slug}><SermonCard s={s} /></li>
          ))}
        </ul>
      ) : (
        groups.map(([name, items]) => (
          <section className="series-block" key={name}>
            <h2>
              {name}
              <small>{items.length} {items.length === 1 ? "message" : "messages"}</small>
            </h2>
            <ul className="sermon-grid">
              {items.map((s) => (
                <li key={s.slug}><SermonCard s={s} showSeries={false} /></li>
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}
