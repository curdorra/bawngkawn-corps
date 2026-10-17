"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type AdminSermon = {
  id: string; date: string; title: string; youtubeId: string; preacher: string; scripture: string; seriesId: string;
  language: "mizo" | "english" | ""; summary: string; notes: string; hidden: boolean; pinned: boolean; thumb: string;
};
export type AdminAlbum = { key: string; title: string; date: string; count: number; cover: string; hidden: boolean };
type Series = { id: string; name: string };
type Data = { sermons: AdminSermon[]; series: Series[]; albums: AdminAlbum[]; driveFolderId: string; envFolder: boolean };

type Result = { ok: boolean; status: number; json: Record<string, any> };

async function call(url: string, method: string, body?: unknown): Promise<Result> {
  try {
    const res = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    return { ok: res.ok, status: res.status, json: await res.json().catch(() => ({})) };
  } catch {
    return { ok: false, status: 0, json: {} };
  }
}

const SORRY = "Sorry, that didn't work. Please try again.";
const failText = (r: Result, special: Record<string, string> = {}) =>
  r.status === 401 && r.json.error === "login" ? "Your login has expired. Please refresh the page and sign in again." : special[r.json.error] ?? (r.json.error === "storage" ? "Saving isn't set up on the live site yet: it needs a database. Add the Neon integration in Vercel (see setup/SETUP.md)." : r.status === 0 ? "Please check your internet and try again." : SORRY);

export function Admin({ enabled, who, data }: { enabled: boolean; who: string | null; data: Data | null }) {
  const router = useRouter();
  const [tab, setTab] = useState<"sermons" | "series" | "photos">("sermons");

  if (!enabled) return <p className="tip">Admin is not switched on yet. The person who looks after the website needs to add the ADMIN_USERS setting (see setup/SETUP.md).</p>;
  if (!who || !data) return <Login />;

  return (
    <div className="admin">
      <div className="admin-bar">
        <div className="tabs" role="group" aria-label="Admin sections">
          {(["sermons", "series", "photos"] as const).map((t) => (
            <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
        <span className="who">
          Signed in as <b>{who}</b> ·{" "}
          <button className="linkbtn" onClick={async () => (await call("/api/admin/session", "DELETE"), router.refresh())}>
            Sign out
          </button>
        </span>
      </div>
      {tab === "sermons" && <SermonsTab sermons={data.sermons} series={data.series} />}
      {tab === "series" && <SeriesTab series={data.series} sermons={data.sermons} />}
      {tab === "photos" && <PhotosTab albums={data.albums} driveFolderId={data.driveFolderId} envFolder={data.envFolder} />}
    </div>
  );
}

// ── Login ───────────────────────────────────────────────

function Login() {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="care-form narrow"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setBusy(true);
        setMsg("");
        const r = await call("/api/admin/session", "POST", { name: f.get("name"), password: f.get("password") });
        setBusy(false);
        if (r.ok) router.refresh();
        else setMsg(r.status === 401 ? "That name or password isn't right." : r.status === 429 ? "Too many wrong tries. Please wait 15 minutes and try again." : SORRY);
      }}
    >
      <label>
        Name
        <input name="name" autoComplete="username" required autoFocus />
      </label>
      <label>
        Password
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      <button className="btn btn-dark" disabled={busy}>
        {busy ? "Checking…" : "Sign in"}
      </button>
      {msg && <p className="form-err">{msg}</p>}
    </form>
  );
}

// ── Sermons ─────────────────────────────────────────────

const today = () => new Date().toISOString().slice(0, 10);
const blank = (): AdminSermon => ({ id: "", date: today(), title: "", youtubeId: "", preacher: "", scripture: "", seriesId: "", language: "", summary: "", notes: "", hidden: false, pinned: false, thumb: "" });

function SermonsTab({ sermons, series }: { sermons: AdminSermon[]; series: Series[] }) {
  const router = useRouter();
  const [form, setForm] = useState<AdminSermon>(blank);
  const [link, setLink] = useState("");
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [looking, setLooking] = useState(false);
  const set = <K extends keyof AdminSermon>(k: K, v: AdminSermon[K]) => setForm((f) => ({ ...f, [k]: v }));
  const editing = Boolean(form.id);

  async function fill(url: string) {
    if (!url.trim()) return;
    setLooking(true);
    setNote(null);
    const r = await call(`/api/admin/lookup?url=${encodeURIComponent(url.trim())}`, "GET");
    setLooking(false);
    if (!r.ok) return setNote({ ok: false, text: failText(r, { link: "That doesn't look like a YouTube link.", video: "YouTube couldn't find that video. Is it private or deleted?" }) });
    setForm((f) => ({ ...f, youtubeId: r.json.id, thumb: r.json.thumb, title: f.title || r.json.title, date: r.json.date && !editing ? r.json.date : f.date }));
    setNote({ ok: true, text: "Title and thumbnail filled in. Check them, then add the preacher and scripture." });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNote(null);
    const { id, date, title, preacher, scripture, seriesId, language, summary, notes, youtubeId } = form;
    const r = await call("/api/admin/sermons", "POST", { id, date, title, preacher, scripture, seriesId, language, summary, notes, youtube: youtubeId });
    setBusy(false);
    if (!r.ok) return setNote({ ok: false, text: failText(r, { missing: "Please fill in the title and date.", empty: "Add a YouTube link or some notes.", link: "That doesn't look like a YouTube link." }) });
    setForm(blank());
    setLink("");
    setNote({ ok: true, text: "Saved. It is on the website now." });
    router.refresh();
  }

  async function act(run: () => Promise<Result>) {
    setBusy(true);
    const r = await run();
    setBusy(false);
    if (r.ok) router.refresh();
    else setNote({ ok: false, text: failText(r) });
  }

  function edit(s: AdminSermon) {
    setForm(s);
    setLink(s.youtubeId ? `https://youtu.be/${s.youtubeId}` : "");
    setNote(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <form className="panel" onSubmit={save} key={form.id || "new"}>
        <h2>{editing ? "Edit sermon" : "Add a sermon"}</h2>

        <div className="field">
          YouTube link
          <div className="lookup">
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              onPaste={(e) => {
                const text = e.clipboardData.getData("text");
                setLink(text);
                e.preventDefault();
                fill(text);
              }}
              placeholder="Paste a link, e.g. https://youtu.be/…"
              inputMode="url"
              aria-label="YouTube link"
            />
            <button type="button" className="btn btn-light" onClick={() => fill(link)} disabled={looking || !link.trim()}>
              {looking ? "Looking…" : "Fill in"}
            </button>
          </div>
          <span className="hint">The title, thumbnail and date fill in by themselves.</span>
        </div>

        {form.youtubeId && (
          <div className="preview">
            <img src={form.thumb || `https://i.ytimg.com/vi/${form.youtubeId}/hqdefault.jpg`} alt="" />
            <div>
              <b>{form.title || "Untitled"}</b>
              <br />
              <button type="button" className="linkbtn" onClick={() => (set("youtubeId", ""), set("thumb", ""), setLink(""))}>
                Remove video
              </button>
            </div>
          </div>
        )}

        <div className="form-grid">
          <label className="field wide">
            Title
            <input value={form.title} onChange={(e) => set("title", e.target.value)} required maxLength={150} />
          </label>
          <label className="field">
            Preacher
            <input value={form.preacher} onChange={(e) => set("preacher", e.target.value)} maxLength={100} list="preachers" />
            <datalist id="preachers">{[...new Set(sermons.map((s) => s.preacher).filter(Boolean))].map((p) => <option key={p} value={p} />)}</datalist>
          </label>
          <label className="field">
            Scripture
            <input value={form.scripture} onChange={(e) => set("scripture", e.target.value)} placeholder="e.g. John 3:16–21" maxLength={100} />
          </label>
          <label className="field">
            Date
            <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} required />
          </label>
          <label className="field">
            Language
            <select value={form.language} onChange={(e) => set("language", e.target.value as AdminSermon["language"])}>
              <option value="">Not set</option>
              <option value="mizo">Mizo</option>
              <option value="english">English</option>
            </select>
          </label>
          <label className="field wide">
            Series
            <select value={form.seriesId} onChange={(e) => set("seriesId", e.target.value)}>
              <option value="">No series</option>
              {series.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {series.length === 0 && <span className="hint">Create a series in the Series tab first.</span>}
          </label>
          <label className="field wide">
            Summary <span className="hint">(a few lines, shown at the top of the sermon page)</span>
            <textarea rows={3} value={form.summary} onChange={(e) => set("summary", e.target.value)} maxLength={2000} />
          </label>
          <label className="field wide">
            Notes <span className="hint">(each new line becomes a paragraph)</span>
            <textarea rows={8} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </label>
        </div>

        <div className="btn-row">
          <button className="btn btn-dark" disabled={busy}>
            {busy ? "Saving…" : editing ? "Save changes" : "Publish"}
          </button>
          {(editing || link || form.title) && (
            <button type="button" className="btn btn-ghost" onClick={() => (setForm(blank()), setLink(""), setNote(null))}>
              {editing ? "Cancel" : "Clear"}
            </button>
          )}
        </div>
        {note && <p className={note.ok ? "form-ok" : "form-err"} role="status">{note.text}</p>}
      </form>

      <div className="panel">
        <h2>All sermons</h2>
        {sermons.length === 0 && <p className="tip">No sermons yet.</p>}
        <ul className="manage-list">
          {sermons.map((s) => (
            <li key={s.id} className={s.hidden ? "is-hidden" : undefined}>
              {s.thumb ? <img className="thumb" src={s.thumb} alt="" /> : <span className="thumb" />}
              <span className="info">
                <b>
                  {s.title} {s.pinned && <span className="chip dark">Pinned</span>} {s.hidden && <span className="chip">Hidden</span>}
                </b>
                <small>{[s.date, s.preacher, s.scripture].filter(Boolean).join(" · ")}</small>
              </span>
              <span className="row-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => edit(s)}>Edit</button>
                <button className="btn btn-ghost btn-sm" disabled={busy || s.hidden} onClick={() => act(() => call("/api/admin/settings", "POST", { pinnedId: s.pinned ? "" : s.id }))}>
                  {s.pinned ? "Unpin" : "Pin"}
                </button>
                <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => act(() => call("/api/admin/sermons", "POST", { id: s.id, hidden: !s.hidden }))}>
                  {s.hidden ? "Show" : "Hide"}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={busy}
                  onClick={() => confirm(`Delete "${s.title}"? This can't be undone. (Use Hide if you might want it back.)`) && act(() => call(`/api/admin/sermons?id=${s.id}`, "DELETE"))}
                >
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

// ── Series ──────────────────────────────────────────────

function SeriesTab({ series, sermons }: { series: Series[]; sermons: AdminSermon[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(r: () => Promise<Result>, after?: () => void) {
    setBusy(true);
    setMsg("");
    const res = await r();
    setBusy(false);
    if (res.ok) (after?.(), router.refresh());
    else setMsg(failText(res, { exists: "There is already a series with that name.", missing: "Please type a name." }));
  }

  return (
    <div className="panel">
      <h2>Series</h2>
      <p className="tip" style={{ margin: 0 }}>A series groups messages that belong together. Deleting one keeps its sermons.</p>
      <form className="inline-form" onSubmit={(e) => (e.preventDefault(), run(() => call("/api/admin/series", "POST", { name }), () => setName("")))}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New series name" aria-label="New series name" maxLength={100} />
        <button className="btn btn-dark" disabled={busy || !name.trim()}>Create</button>
      </form>
      {msg && <p className="form-err">{msg}</p>}
      {series.length === 0 && <p className="tip">No series yet.</p>}
      <ul className="manage-list">
        {series.map((s) => (
          <li key={s.id}>
            {renaming?.id === s.id ? (
              <form className="inline-form" style={{ flex: 1 }} onSubmit={(e) => (e.preventDefault(), run(() => call("/api/admin/series", "POST", { id: s.id, name: renaming.name }), () => setRenaming(null)))}>
                <input value={renaming.name} onChange={(e) => setRenaming({ id: s.id, name: e.target.value })} autoFocus aria-label="Series name" maxLength={100} />
                <button className="btn btn-dark btn-sm" disabled={busy}>Save</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRenaming(null)}>Cancel</button>
              </form>
            ) : (
              <>
                <span className="info">
                  <b>{s.name}</b>
                  <small>{sermons.filter((x) => x.seriesId === s.id).length} sermons</small>
                </span>
                <span className="row-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => setRenaming({ id: s.id, name: s.name })}>Rename</button>
                  <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => confirm(`Delete the series "${s.name}"? Its sermons are kept.`) && run(() => call(`/api/admin/series?id=${s.id}`, "DELETE"))}>
                    Delete
                  </button>
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Photos ──────────────────────────────────────────────

function PhotosTab({ albums, driveFolderId, envFolder }: { albums: AdminAlbum[]; driveFolderId: string; envFolder: boolean }) {
  const router = useRouter();
  const [folder, setFolder] = useState(driveFolderId);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(r: () => Promise<Result>, ok: string, special: Record<string, string> = {}) {
    setBusy(true);
    setMsg(null);
    const res = await r();
    setBusy(false);
    if (res.ok) {
      setMsg({ ok: true, text: ok });
      router.refresh();
    } else setMsg({ ok: false, text: failText(res, special) });
  }

  return (
    <>
      <form
        className="panel"
        onSubmit={(e) => {
          e.preventDefault();
          if (folder.trim() !== driveFolderId && !confirm("Switch to this folder? Albums from the old folder will be removed from the website and the new ones copied in. This can take a few minutes.")) return;
          run(() => call("/api/admin/settings", "POST", { driveFolder: folder }), "Saved. The new folder is being copied in; refresh in a minute or two.", {
            folder: "That doesn't look like a Drive folder link.",
            access: "The website can't open that folder. Share it with the website's service account email first.",
          });
        }}
      >
        <h2>Photo folder</h2>
        <label className="field">
          Google Drive folder
          <input value={folder} onChange={(e) => setFolder(e.target.value)} placeholder={envFolder ? "Using the site's default folder" : "Paste the folder's link"} />
          <span className="hint">Each folder inside it becomes an album. Share the folder with the website's service account (as Viewer), then paste its link here. Leave empty to use the default.</span>
        </label>
        <div className="btn-row">
          <button className="btn btn-dark" disabled={busy}>Save folder</button>
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => run(() => call("/api/admin/albums", "POST"), "Checked Drive. Anything new is on the site now.", { drive: "Drive isn't set up yet: add the Google service account and R2 settings, and choose a folder." })}>
            {busy ? "Working…" : "Check Drive now"}
          </button>
        </div>
        {msg && <p className={msg.ok ? "form-ok" : "form-err"} role="status">{msg.text}</p>}
      </form>

      <div className="panel">
        <h2>Albums on the website</h2>
        <p className="tip" style={{ margin: 0 }}>Hidden albums stay in Drive but are not shown on the site.</p>
        {albums.length === 0 && <p className="tip">No albums yet.</p>}
        <ul className="manage-list">
          {albums.map((a) => (
            <li key={a.key} className={a.hidden ? "is-hidden" : undefined}>
              <img className="thumb sq" src={a.cover} alt="" />
              <span className="info">
                <b>{a.title} {a.hidden && <span className="chip">Hidden</span>}</b>
                <small>{a.date} · {a.count} photos</small>
              </span>
              <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => run(() => call("/api/admin/settings", "POST", { album: a.key, hidden: !a.hidden }), a.hidden ? "Album is showing again." : "Album hidden.")}>
                {a.hidden ? "Show" : "Hide"}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
