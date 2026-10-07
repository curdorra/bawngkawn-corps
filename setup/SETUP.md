# One-time setup: Google Sheet, Drive photos, Cloudflare R2, Vercel

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
2. **Share** it with the robot's email as **Viewer**, and with each photographer as **Editor**.
3. Copy the ID from the URL: `drive.google.com/drive/folders/`**`THIS_PART`** → `GOOGLE_DRIVE_FOLDER_ID`.

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

### 3c. Sermon editing passcode

Choose a passcode and put it in `SERMON_EDIT_CODE` (Vercel → Settings → Environment Variables). Leave it empty to turn editing off.
People unlock editing at `/sermons/manage`. After 10 wrong guesses in 15 minutes, nobody can try for 15 minutes.
A longer passcode is safer than 4 digits; any letters or numbers work.

## 4. Cloudflare R2: where the website's copies of the photos live

1. Sign up at <https://dash.cloudflare.com> → **R2** → enable it (asks for a card, but there's a free allowance).
2. **Create bucket** `bawngkawn-photos` → `R2_BUCKET`.
3. Bucket → **Settings → Public access** → enable the **r2.dev** URL (or connect a custom domain later).
   That URL → `R2_PUBLIC_URL`.
4. Bucket → **Settings → CORS policy** → paste (with your real site address):
   ```json
   [{ "AllowedOrigins": ["https://YOUR-SITE.vercel.app", "http://localhost:3001"],
      "AllowedMethods": ["GET"], "AllowedHeaders": ["*"], "MaxAgeSeconds": 3600 }]
   ```
   Without this, "Save photo" and "Download all" won't work.
5. **R2 → Manage API tokens → Create API token** → *Object Read & Write*, only this bucket.
   Copy **Access Key ID** → `R2_ACCESS_KEY_ID`, **Secret Access Key** → `R2_SECRET_ACCESS_KEY`.
   Your **Account ID** (shown on the R2 overview page) → `R2_ACCOUNT_ID`.

## 5. Vercel

1. Put this folder on GitHub (private repo), then in Vercel **Add New → Project** → import it.
2. **Settings → Environment Variables**: add everything from `.env.example`.
   For `CRON_SECRET`, make up a long random password.
3. Deploy.

## 6. First photo sync

Put a test folder in **Website Photos**, e.g. `2026-10-11 Harvest Thanksgiving`, with a few photos. Then either:
- just open the website and wait ~5 minutes, or
- visit `https://YOUR-SITE.vercel.app/api/sync?key=YOUR_CRON_SECRET` to sync right away.
  It reports what it did. If `pending` is above 0, open it again until it's 0.

## How it works (for whoever maintains the code)

- `lib/sermons.ts` keeps the sermons in `sermons.json` (R2 on the live site, `.data/` on your computer). `/sermons/manage` edits them behind the `SERMON_EDIT_CODE` passcode (`lib/sermon-auth.ts`: signed 12-hour cookie, shared lockout).
- `lib/videos.ts` reads the latest videos from the YouTube channel in the Contact tab (public feed, no key).
- `app/api/counselling` adds form submissions to the private Sheet. It checks a hidden spam field, limits each visitor to 5 an hour, and never logs the message.
- `lib/content.ts` reads the Sheet. Pages refresh every 2 minutes (`revalidate = 120`).
  If Google can't be reached, the last good version of the page stays up.
- `lib/sync.ts` copies new Drive photos to R2 as original + 2000px preview + 600px thumbnail,
  and keeps a list of albums in `manifest.json` in the bucket. It runs in the background after page
  renders (at most every ~4 min), plus a daily Vercel cron, plus `/api/sync` on demand.
  Each run stops after ~45 s and the next run continues, so large uploads are fine.
- iPhone HEIC photos are converted using Google's own JPEG version.
- `scripts/test-sync.mts` is a simulated end-to-end test: `npx tsx scripts/test-sync.mts`.
- With no environment variables set, the site uses `content/site.ts` and `public/photos/`.
