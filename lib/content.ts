import * as defaults from "@/content/site";
import { googleConfigured, googleFetch } from "./google";

// Reads the "Website" Google Sheet. Each tab replaces one part of content/site.ts.
// A missing tab (or no sheet at all) just means the defaults in content/site.ts are used.
//
//   Contact   Field | Value              (Phone, Email, WhatsApp, Address, Map link, YouTube, Instagram)
//   Officers  Role | Rank | Name
//   Meetings  Day | Meeting | Time
//   Sections  Name | Description   (an older tab called Groups works too)
//   Missions  Title | Description | Album   (Album is optional)
//   Give      Field | Value   (UPI ID, Account name, Bank, Account number, IFSC, Note)

type Row = Record<string, string>;

export async function getContent() {
  const content = {
    site: structuredClone(defaults.site),
    meetings: defaults.meetings,
    groups: defaults.groups,
    missions: defaults.missions,
    give: { ...defaults.give },
    about: structuredClone(defaults.about),
  };
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId || !googleConfigured()) return content;

  // If the sheet can't be read this throws, and the site keeps showing the last good version.
  const tabs = await readSheet(sheetId);

  if (tabs.contact) {
    const get = (field: string) => tabs.contact!.find((r) => norm(r.field) === norm(field))?.value?.trim();
    const c = content.site.contact;
    c.phone = get("Phone") ?? c.phone;
    c.email = get("Email") ?? c.email;
    c.address = get("Address") ?? c.address;
    c.mapLink = get("Map link") ?? get("Google Maps") ?? c.mapLink;
    const wa = get("WhatsApp");
    if (wa !== undefined) c.whatsapp = /^\+?[\d\s-]+$/.test(wa) ? `https://wa.me/${wa.replace(/\D/g, "")}` : wa;
    const s = content.site.social;
    s.youtube = get("YouTube") ?? s.youtube;
    s.instagram = get("Instagram") ?? s.instagram;
  }

  if (tabs.officers?.length) {
    content.about.officers = tabs.officers.filter((r) => r.name).map((r) => ({ role: r.role || "Corps Officer", name: [r.rank, r.name].filter(Boolean).join(" ") }));
  }

  if (tabs.meetings?.length) {
    content.meetings = tabs.meetings.filter((r) => r.meeting).map((r) => ({ day: r.day, name: r.meeting, time: r.time }));
  }

  if (tabs.missions?.length) {
    content.missions = tabs.missions.filter((r) => r.title).map((r) => ({ title: r.title, text: r.description, album: r.album ?? "" }));
  }

  if (tabs.give) {
    const get = (field: string) => tabs.give!.find((r) => norm(r.field) === norm(field))?.value?.trim();
    const g = content.give;
    g.upi = get("UPI ID") ?? g.upi;
    g.accountName = get("Account name") ?? g.accountName;
    g.bank = get("Bank") ?? g.bank;
    g.accountNumber = get("Account number") ?? g.accountNumber;
    g.ifsc = get("IFSC") ?? g.ifsc;
    g.note = get("Note") ?? g.note;
  }

  if (tabs.groups?.length) {
    content.groups = tabs.groups.filter((r) => r.name).map((r) => {
      const known = defaults.groups.find((g) => norm(g.name) === norm(r.name));
      return { name: r.name, text: r.description, image: known?.image ?? `/images/site/group-${slug(r.name)}.jpg` };
    });
  }

  return content;
}

const norm = (s = "") => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function readSheet(id: string) {
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${id}`;
  const meta = (await (await googleFetch(`${base}?fields=sheets.properties.title`)).json()) as { sheets: { properties: { title: string } }[] };
  const titles = meta.sheets.map((s) => s.properties.title);
  const find = (name: string) => titles.find((t) => norm(t) === name);

  const wanted = ["contact", "officers", "meetings", "groups", "missions", "give"]
    .map((k) => [k, k === "groups" ? find("sections") ?? find("groups") : find(k)] as const)
    .filter(([, t]) => t);
  if (!wanted.length) return {} as Partial<Record<string, Row[]>>;

  // Unformatted values so dates and times come back as numbers we can read reliably,
  // however the cell happens to be formatted.
  const params = new URLSearchParams({ valueRenderOption: "UNFORMATTED_VALUE", dateTimeRenderOption: "SERIAL_NUMBER" });
  wanted.forEach(([, t]) => params.append("ranges", `'${t}'`));
  const data = (await (await googleFetch(`${base}/values:batchGet?${params}`)).json()) as { valueRanges: { values?: unknown[][] }[] };

  const out: Partial<Record<string, Row[]>> = {};
  wanted.forEach(([key], i) => {
    const [header = [], ...rows] = data.valueRanges[i].values ?? [];
    const cols = header.map((h) => norm(String(h)));
    out[key] = rows
      .filter((r) => r.some((v) => v !== ""))
      .map((r) => Object.fromEntries(cols.map((c, j) => [c, cell(c, r[j])])));
  });
  return out;
}

// Google Sheets stores dates as days since 30 Dec 1899, and times as a fraction of a day.
function cell(column: string, v: unknown): string {
  if (v === undefined || v === null) return "";
  if (typeof v !== "number") return String(v).trim();
  if (column === "date") {
    const d = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86_400_000);
    return d.toISOString().slice(0, 10);
  }
  if (column === "time") {
    const mins = Math.round((v % 1) * 24 * 60);
    const h = Math.floor(mins / 60), m = mins % 60;
    return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  }
  return String(v);
}
