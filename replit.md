# From Couch to Fit

A gentle, pressure-free fitness app for runners and walkers. Record runs/walks with live GPS
tracking, log other activities (yoga, pilates, strength) manually or pick a curated class, set goals,
and review past activities with their route and stats.

## Where things live

- **The app is in `artifacts/mobile/`.** Everything user-facing lives there.
  - `app/` — expo-router screens: `welcome`, `auth`, `onboarding`, `all-set`, then 5 tabs
    (`(tabs)/index` Home, `activities`, `log` Track, `classes`, `profile` You), plus stack screens
    `activity-summary`, `activity/[id]`, `goals`.
  - `lib/locationTracking.ts` — background-capable GPS via `expo-task-manager` + an Android
    foreground service, with an observable store and session recovery.
  - `lib/supabase.ts` — Supabase Auth (email/password + Google OAuth), session helpers, and the
    best-effort activity mirror.
  - `components/MapTracker.tsx` (live) + `components/RouteMap.tsx` (read-only), each with a `.web.tsx`
    fallback. Shared map style in `constants/mapStyle.ts`.
  - `components/ui/GradientButton.tsx` — primary CTA used everywhere.
  - `constants/colors.ts` + `constants/theme.ts` — the brand palette, neutral shadow tokens, radius
    scale, gradient, and font helpers (`font.display` = Fraunces, others = Inter).
  - `context/AppContext.tsx` — derives the user from the Supabase session, persists activities and
    goals in AsyncStorage keyed by the user id.
- The other workspace packages (`artifacts/api-server`, `artifacts/mockup-sandbox`, `lib/api-*`,
  `lib/db`) are Replit scaffolding **not used by the mobile app**.

## Run & Operate

- Dev / preview in Expo Go (foreground GPS only): `cd artifacts/mobile && pnpm exec expo start`
- Typecheck the app: `pnpm --filter @workspace/mobile run typecheck`
- Install Expo native deps with the right versions: `cd artifacts/mobile && pnpm exec expo install <pkg>`

## Distribution — standalone Android APK

Background GPS does **not** work in Expo Go, so the app ships as an installable Android APK.

1. Put a **Google Maps Android API key** in `artifacts/mobile/app.json` at
   `android.config.googleMaps.apiKey` (without it the map is blank in the APK).
2. Build: `npm i -g eas-cli` → `eas login` → `eas build -p android --profile preview`.
3. Download the resulting `.apk`, rename to `from-couch-to-fit.apk`, then attach it
   to a **GitHub Release** (tag e.g. `v0.1.0`). The landing page in `/docs/`
   reads from `/releases/latest/download/from-couch-to-fit.apk`, so future builds
   just need a new release — no site redeploy needed.

## Landing page (GitHub Pages)

The website lives in [`docs/index.html`](docs/index.html) and is served as
GitHub Pages:

- Settings → Pages → **Deploy from a branch**, branch `main`, folder `/docs`.
- Edit the `REPO = "YOUR-USER/YOUR-REPO"` line in `docs/index.html` once after
  the first push so the Download button resolves to your repo's releases.
- See [`docs/README.md`](docs/README.md) for the full launch checklist.

## AI training plans (DeepSeek)

Objectives ("run 6 km", "reach 7:10 pace") are turned into trackable plans by DeepSeek. The API key
lives ONLY in a Supabase Edge Function so it never ships in the public APK.

- Function: [`supabase/functions/deepseek-plan/index.ts`](supabase/functions/deepseek-plan/index.ts).
  Client: `lib/aiPlan.ts` (`generatePlan`) which falls back to a solid **local** generator if the
  function is missing/errors — so objectives always work, AI just makes them better.
- **Deploy (one-time):**
  ```
  npm i -g supabase
  supabase login
  supabase link --project-ref jhjhxiviapjjowxcaqoa
  supabase secrets set DEEPSEEK_API_KEY=sk-...
  supabase functions deploy deepseek-plan
  ```
  Until deployed, the app silently uses the local "Smart plan" generator.

## Interval workouts & notifications

Run/walk interval sessions (`lib/intervals.ts`) run on top of GPS tracking. Phase transitions cue via
haptics **and** pre-scheduled `expo-notifications` local notifications, so "run now" lands with the
screen off. The `expo-notifications` plugin is configured in `app.json`; permission is requested on the
first interval start.

## Auth setup (Supabase + Google)

The app uses Supabase Auth. Until configured, both email/password and Google sign-in throw a clear
"isn't configured" error.

1. **Create a Supabase project** (supabase.com → New project). Copy the project URL and `anon` key.
2. **Add env vars** to `artifacts/mobile/.env` (Expo loads `EXPO_PUBLIC_*` automatically):
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   ```
   For EAS builds, set the same vars as EAS secrets (`eas secret:create`); `eas.json` already wires
   them through.
3. **Enable Google as an auth provider** (Supabase dashboard → Authentication → Providers → Google):
   - In Google Cloud Console, create an OAuth 2.0 Client (Web application).
   - Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`.
   - Paste the Client ID + Client Secret into Supabase and enable the provider.
4. **Deep-link redirect:** the app uses scheme `mobile://auth-callback` (already set in `app.json`).
   No extra Supabase configuration is needed for the app side — `expo-auth-session` handles it.

To enable cloud-side activity storage, create the `activities` table:
```sql
create table activities (
  id text primary key,
  user_id uuid references auth.users on delete cascade,
  date text, type text,
  duration_minutes int,
  distance_km numeric, pace text, notes text,
  created_at timestamptz default now()
);
```
The local AsyncStorage cache stays the source of truth either way; cloud sync is best-effort.

## Brand & design system

- **Palette:** warm canvas `#F7F3F3`, pure-white cards, dusty-pink primary `#D98EA0` (deep `#C16E82`),
  plum-charcoal text `#322E38`, sage `#A9B7A4` for success.
- **Typography:** **Fraunces** for display headings, greeting, big metric numerals; **Inter** for
  body, labels, buttons. Tabular numerals on live metrics.
- **Shadows:** neutral plum (`rgba(50,40,60,…)`), never pink-tinted except the CTA. Three levels in
  `constants/theme.ts`.
- **Radii:** chips 8, inputs/buttons 14, cards 20, tab bar 26, pills 999.
- **Icons:** Lucide line icons at 1.5px stroke.
- **Layout:** 22px screen padding, generous whitespace, hairline (1px `#EDE8EA`) dividers.

## Gotchas

- **Background location requires the standalone build**, the foreground-service config in `app.json`,
  and `ACCESS_BACKGROUND_LOCATION`. Test it by locking the screen mid-run.
- Recorded GPS routes are stored locally on each `Activity.coords`; the Supabase mirror does not
  include the route (would need a `jsonb` column migration).
- `react-native-maps` and `expo-task-manager` are no-ops on web; guarded by `Platform.OS` checks.
