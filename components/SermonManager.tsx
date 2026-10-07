"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Item = { id: string; date: string; title: string; text: string };

const today = () => new Date().toISOString().slice(0, 10);

export function SermonManager({ enabled, authed, sermons }: { enabled: boolean; authed: boolean; sermons: Item[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);

  if (!enabled) return <p className="tip">Sermon editing is not switched on yet. Ask the person who looks after the website.</p>;

  async function call(url: string, init: RequestInit, onOk: () => void, failures: Record<number, string> = {}) {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch(url, init);
      if (res.ok) onOk();
      else setMessage(failures[res.status] ?? "Sorry, that didn't work. Please try again.");
    } catch {
      setMessage("Sorry, that didn't work. Please check your internet and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!authed)
    return (
      <form
        className="care-form narrow"
        onSubmit={(e) => {
          e.preventDefault();
          const code = String(new FormData(e.currentTarget).get("code") ?? "");
          call("/api/sermons/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) }, () => router.refresh(), {
            401: "That passcode isn't right.",
            429: "Too many wrong tries. Please wait 15 minutes and try again.",
          });
        }}
      >
        <label>
          Passcode
          <input name="code" type="password" inputMode="numeric" autoComplete="off" required autoFocus />
        </label>
        <button className="btn btn-red" disabled={busy}>
          {busy ? "Checking…" : "Unlock"}
        </button>
        {message && <p className="form-err">{message}</p>}
      </form>
    );

  const blank: Item = { id: "", date: today(), title: "", text: "" };
  const form = editing ?? blank;

  return (
    <div className="manage">
      <form
        key={form.id || "new"}
        className="care-form"
        onSubmit={(e) => {
          e.preventDefault();
          const d = Object.fromEntries(new FormData(e.currentTarget));
          call("/api/sermons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...d, id: form.id }) }, () => {
            setEditing(null);
            setMessage("Saved. It is on the website now.");
            router.refresh();
          }, { 401: "Your login has expired. Please refresh the page and unlock again." });
        }}
      >
        <h2>{form.id ? "Edit sermon" : "New sermon"}</h2>
        <label>
          Date
          <input name="date" type="date" defaultValue={form.date} required />
        </label>
        <label>
          Title
          <input name="title" defaultValue={form.title} required maxLength={150} />
        </label>
        <label>
          Sermon <span>(each new line becomes a paragraph)</span>
          <textarea name="text" rows={14} defaultValue={form.text} required />
        </label>
        <div className="btn-row">
          <button className="btn btn-red" disabled={busy}>
            {busy ? "Saving…" : form.id ? "Save changes" : "Publish"}
          </button>
          {form.id && (
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
              Cancel
            </button>
          )}
        </div>
        {message && <p className={message.startsWith("Saved") ? "tip" : "form-err"}>{message}</p>}
      </form>

      <h2>On the website</h2>
      {sermons.length === 0 && <p className="tip">No sermons yet.</p>}
      <ul className="manage-list">
        {sermons.map((s) => (
          <li key={s.id}>
            <span>
              <b>{s.title}</b>
              <small>{s.date}</small>
            </span>
            <button className="btn btn-ghost" onClick={() => { setEditing(s); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
              Edit
            </button>
            <button
              className="btn btn-ghost"
              disabled={busy}
              onClick={() => confirm(`Delete "${s.title}"? This can't be undone.`) && call(`/api/sermons?id=${s.id}`, { method: "DELETE" }, () => router.refresh())}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      <p>
        <button className="u-link linkbtn" onClick={() => call("/api/sermons/login", { method: "DELETE" }, () => router.refresh())}>
          Lock editing
        </button>
      </p>
    </div>
  );
}
