# One-time setup: Drive photos, Neon database, Vercel (and optionally the Google Sheet)

About 45 minutes. Do it all while signed in with the **church's** Google account, not a personal one,
so the site keeps working after you hand it over.

---

## 1. Google: the "robot" account that reads the Sheet and Drive

1. Go to <https://console.cloud.google.com> → create a project called `bawngkawn-website`.
2. **APIs & Services → Library** → enable **Google Drive API** and **Google Sheets API**.
3. **IAM & Admin → Service Accounts → Create service account**, named `website-reader`. Skip the optional steps.
4. Open it → **Keys → Add key → Create new key → JSON**. A file downloads. From it you need:
   - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → `GOOGLE_PRIVATE_KEY` (the whole thing, including `-----BEGIN…` and `…END PRIVATE KEY-----\n`)

   Keep this file private. Anyone with it can read whatever you share with the robot.

> If Google says key creation is disabled, a Workspace admin needs to turn off the
> `iam.disableServiceAccountKeyCreation` policy for this project.

## 2. The Sheet

1. Upload `setup/Website-Sheet-Template.xlsx` to Drive → open it → **File → Save as Google Sheets**.
2. Rename it **Website**. Fill in what you know; blank tabs just use the site's built-in text.
3. **Share** → paste the robot's email → **Viewer**. Untick "Notify".
4. Copy the ID from the URL: `docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit` → `GOOGLE_SHEET_ID`.

## 3. The photos folder

1. Create a Drive folder **Website Photos**.
2. **Share** it with each photographer as **Editor**, and set **General access** to **Anyone with the link → Viewer**.
   The site shows photos straight from Drive, so they must be viewable by link. (Only share photos you are happy to be public. Avoid children's photos unless parents agreed.)
3. Let the site read the folder list: either create a Google API key (Google Cloud → APIs & Services → enable **Google Drive API** → Credentials → **API key**) → `GOOGLE_API_KEY`, or share the folder with the robot's email as Viewer if you set the robot up in step 1.
4. Copy the ID from the URL: `drive.google.com/drive/folders/`**`THIS_PART`** → `GOOGLE_DRIVE_FOLDER_ID`.

### 3b. The counselling requests Sheet

1. Create a **new, separate** Google Sheet called **Counselling Requests**. Rename its first tab to **Requests**. Nothing else is needed.
2. Share it with the robot's email as **Editor** (the form adds rows to it), and with the counsellors only. **Not** with the people who edit the website text.
3. Copy the ID from its URL → `GOOGLE_COUNSELLING_SHEET_ID`. Until you do, the form politely asks people to call instead.
4. Agree who checks this Sheet every day *before* you switch the form on.
5. **Email alerts (recommended).** Vercel can't send email by itself, so use Resend (free):
   sign up at <https://resend.com> as the responsible person, create an API key → `RESEND_API_KEY`, and put the
   same person's email in `COUNSELLING_NOTIFY_EMAIL` (several, separated by commas, once you verify a domain).
   Without a verified domain Resend only lets you email the account owner, which is fine for one person.
   The email never contains what the person wrote. It links to the Sheet.
   (No-code alternative: in the Sheet, **Tools → Notification settings → Email right away**. Test it first, since changes made by the website's robot account may not trigger it.)

### 3c. Admin logins

Put the two or three people who may edit in `ADMIN_USERS` (Vercel → Settings → Environment Variables), as `name:password` pairs separated by commas:
`Lalthan:a-long-password,Mary:another-long-password`. Passwords can't contain a comma. Leave it empty to turn the admin area off.
They sign in at `/admin`. After 10 wrong guesses in 15 minutes, nobody can try for 15 minutes. Removing someone from `ADMIN_USERS` signs them out.
Optionally set `AUTH_SECRET` to any long random text (it signs the login cookie).

## 4. Neon database: where sermons, series and settings are saved

In Vercel, open the project → **Storage** → **Create Database** → **Neon** (free plan is plenty).
Connect it to the project. This adds `DATABASE_URL` for you. The site creates its one small table by itself.

## 5. Vercel

1. Put this folder on GitHub (private repo), then in Vercel **Add New → Project** → import it.
2. **Settings → Environment Variables**: add what you need from `.env.example` (`ADMIN_USERS`, `GOOGLE_API_KEY`, `CRON_SECRET`, ...).
   For `CRON_SECRET`, make up a long random password.
3. Deploy.

## 6. First photo sync

Put a test folder in **Website Photos**, e.g. `2026-10-11 Harvest Thanksgiving`, with a few photos. Then either:
- just open the website and wait ~5 minutes, or
- sign in at `/admin` → Photos → **Check Drive now**, or visit `https://YOUR-SITE.vercel.app/api/sync?key=YOUR_CRON_SECRET`.

## How it works (for whoever maintains the code)

- `lib/sermons.ts` keeps the sermons (a YouTube id plus preacher, scripture, series, summary, notes, language, hidden) in `sermons.json`, and `lib/settings.ts` keeps the series list, the pinned sermon, the Drive folder and the hidden albums in `settings.json` (in the Neon table, or `.data/` on your computer). `/admin` edits them (`lib/admin-auth.ts`: named logins from `ADMIN_USERS`, signed 12-hour cookie, shared lockout; API under `app/api/admin`).
- `lib/youtube.ts` fills in a pasted link's title, thumbnail and date (YouTube oEmbed plus the watch page, no key).
- `app/api/counselling` adds form submissions to the private Sheet. It checks a hidden spam field, limits each visitor to 5 an hour, and never logs the message.
- `lib/content.ts` reads the Sheet. Pages refresh every 2 minutes (`revalidate = 120`).
  If Google can't be reached, the last good version of the page stays up.
- `lib/sync.ts` reads the Drive folder (`lib/drive.ts`, with `GOOGLE_API_KEY` or the robot account) and saves the list of albums and photo ids in the database (`manifest`). Nothing is copied: images load from Google (`lh3.googleusercontent.com/d/<id>=w600`) so the folder must be shared as "anyone with the link". It runs in the background after page renders (at most every ~4 min), plus a daily Vercel cron, plus `/api/sync` and the admin's "Check Drive now".
- `lib/store.ts` is the only place that touches the database: one Neon table `kv(key, value jsonb)`. On your computer without `DATABASE_URL` it uses the `.data/` folder.
- With no environment variables set, the site uses `content/site.ts` and `public/photos/`.
