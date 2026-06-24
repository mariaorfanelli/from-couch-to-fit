# From Couch to Fit — landing page

This directory is served as the public website by **GitHub Pages**. It contains
one page (`index.html`) that shows the brand, the screens, and a single
**Download the app** button that points at the latest Android APK.

## Publish it on GitHub Pages

1. Push this repo to GitHub.
2. In the repo: **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: `main` · Folder: `/docs`
3. Wait ~30 seconds. Pages prints the live URL at the top of the same screen,
   e.g. `https://<user>.github.io/<repo>/`.

(Custom domain? Add it under the same Pages screen and create a `docs/CNAME`
file containing only the bare hostname, then point a CNAME / ALIAS DNS record
at `<user>.github.io`.)

## Ship a new APK

The download button reads from one constant in `index.html`:

```js
const REPO = "YOUR-USER/YOUR-REPO";
const APK_FILENAME = "from-couch-to-fit.apk";
const APK_URL = `https://github.com/${REPO}/releases/latest/download/${APK_FILENAME}`;
```

Edit `REPO` once (replace with your actual GitHub `user/repo`). After that you
never touch this file again — releases are how new APKs go out:

1. Build the APK:
   ```
   cd artifacts/mobile
   npm i -g eas-cli && eas login
   eas build -p android --profile preview
   ```
   EAS prints a download URL when the build finishes.
2. Download that `.apk` and **rename it to `from-couch-to-fit.apk`** (the name
   must match `APK_FILENAME` above).
3. On GitHub: **Releases → Draft a new release** → tag e.g. `v0.1.0` → attach
   the `.apk` as a binary asset → **Publish release**.

`/releases/latest/download/<name>` always resolves to the most recent release's
asset by filename, so the live page automatically points at your latest build —
no redeploy needed.

## Note on Android install

The APK is unsigned for the Play Store and side-loaded, so the first time a
visitor installs it Android will ask them to enable "Install unknown apps" for
their browser. That's a one-time per-source toggle and is standard for any
APK direct download.

## Local preview

Open `docs/index.html` in any browser, or:

```
cd docs && python -m http.server 5500
```

Then visit `http://localhost:5500`.
