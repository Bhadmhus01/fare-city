# Put Fare City on the internet (so your iPhone can install it)

> **Getting "Page not found" (404) from Netlify?** That means the upload landed
> empty — every file including `index.html` was missing. Use
> **`fare-city-site.zip`** (rebuilt so the files sit at the *root* of the zip, not
> inside a wrapper folder — dragging a wrapper zip puts the game one level down, so
> the site root has no `index.html`). After uploading, open the site and check
> Netlify's **Deploys** tab says *Published*. If the phone makes drag-and-drop
> awkward, the **GitHub Pages** route below works entirely from Safari on iOS.

`index.html` is the whole game. The other files are the icon, the manifest and the
service worker (offline play). Upload this folder to any static host and you get an
https URL you can **Share → Add to Home Screen** from Safari.

## Route A — GitHub Pages (best from an iPhone; everything below is doable in Safari)

1. github.com → sign in → **New repository** (public), name it `fare-city`, Create.
2. On the empty repo page: **"uploading an existing file"** → tap *choose your
   files* → pick **all 9 files** (Files app allows multi-select) → **Commit changes**.
3. **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main`, folder `/ (root)` → **Save**.
4. Wait ~1 minute, then open `https://YOURNAME.github.io/fare-city/` in Safari.
5. **Share → Add to Home Screen.**

## Route B — Netlify Drop (fastest from a computer)

1. Unzip `fare-city-site.zip` first (iOS Files: tap the zip to extract).
2. Open https://app.netlify.com/drop
3. Drag the **extracted files/folder** onto the page (not the zip, if you can avoid it).
4. You get a URL like `https://silly-name-123.netlify.app` — open it in Safari.
   If it 404s, the upload was empty: try again, or use Route A.
5. Share → **Add to Home Screen**.

## Also fine: Cloudflare Pages or Vercel
Create a project, choose "upload assets", drop this folder in, deploy. Same result.

## GitHub Pages (free, versioned)
1. Create a repo, upload these files to the root (or to `/docs`).
2. Settings → Pages → deploy from the branch/folder you used.
3. URL: `https://USER.github.io/REPO/`. Open in Safari → Add to Home Screen.
   (No `.nojekyll` needed here — there is no underscore-prefixed file.)

## Any host you already pay for
Upload the folder to your web root (or a subfolder — every path in the game is
relative, so `https://example.com/farecity/` works too).

## Two things to know

* **It must be https.** Service worker, offline play and a proper install all need
  it. Opening the file from the Files app on iOS does not work — Safari on iOS
  cannot open local `file://` pages.
* **Static hosting = single-player boards.** The game detects that no `/api`
  answers and quietly switches to "offline, this phone only": local leaderboard,
  everything else identical. If you want the world board, daily run and cloud
  saves, deploy `server/server.js` instead (see the main README) — it serves this
  same game *and* the API from one Node process, and works on Render, Railway,
  Fly.io or any small VPS.
