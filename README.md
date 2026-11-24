# Fitness Foundation PWA (Android + Google Sheet Sync)

Interactive mobile-first Progressive Web App built from `fitness_foundation_workout_plan.docx`.

## Features
- **Weekly Schedule Auto-Detection**: Automatically opens today's workout (`Mon/Wed/Fri` Lower + Core, `Tue/Thu` Upper, `Sat` Recovery, `Sun` Rest).
- **Week 1 / 2 / 3 Switcher**: Displays each week's progression focus.
- **Interactive Set Logging**: Check off sets, edit actual reps/hold time and load.
- **Built-in Rest & Hold Timers**: Automatically starts exercise-specific rest countdowns (`60s` / `90s` / `120s`) and includes `15–25s` plank hold timers with vibration + chime.
- **Offline-First + Google Sheet Sync**: Saves locally immediately and syncs to a Google Sheet via Google Apps Script.

---

## Step 1: Set Up Your Brand New Google Sheet
1. Create a new Google Sheet (e.g., **Fitness Foundation Log**).
2. Click **Extensions → Apps Script**.
3. Paste the contents of `google-apps-script.gs` into the editor and click **Save**.
4. Click **Deploy → New deployment**:
   - Select type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**, authorize permissions, and copy the **Web app URL** (ending in `/exec`).

---

## Step 2: Host the App for Android (Free HTTPS)
Android Chrome requires HTTPS to install a PWA onto your home screen:

### Option A: GitHub Pages (Recommended)
1. Create a new public (or private if on Pro) GitHub repository (e.g., `fitness-foundation`).
2. Upload all files inside `fitness-foundation-app/` (`index.html`, `styles.css`, `data.js`, `app.js`, `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`).
3. Go to **Settings → Pages → Build and deployment**, select **Deploy from a branch** (`main` / `/ (root)`), and save.
4. Open your live URL (`https://<username>.github.io/fitness-foundation/`) on your Android phone.

### Option B: Netlify Drop (Fastest)
1. Visit `https://app.netlify.com/drop` on a personal browser.
2. Drag and drop the `fitness-foundation-app` folder.
3. Open the generated `https://...netlify.app` URL on your Android phone.

---

## Step 3: Install on Android & Connect Your Sheet
1. Open the hosted URL in **Chrome on Android**.
2. Tap **⋮ (Menu) → Add to Home screen / Install app**.
3. Open the installed app, tap the **⚙ Settings** icon in the top-right, paste your **Apps Script Web App URL**, tap **Test Connection**, and click **Save Settings**.
