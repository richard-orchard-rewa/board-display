# board-display

Rotating information display for the office TV (Windows 11 PC, view-only).
A Vite + React client shows one "slide" at a time; a tiny Node server fetches
and caches data so API tokens never reach the browser.

## Slides

| Slide | Source | Status |
| --- | --- | --- |
| Product vision | `src/slides/VisionSlide.tsx` (edit the copy) | placeholder text |
| GitHub stats | `Relationships-Australia-WA/feedback` via GitHub REST | live |
| Iteration | GitHub Project `Relationships-Australia-WA` #1, current Iteration, counts by Status (no titles) | live (needs `read:project`) |
| Client feedback | `feedback-dash.azurewebsites.net` | **sample data** (see below) |

Order and dwell time are in `src/slides.tsx`.

## Run

Runtime: Node 24 LTS (minimum 22.9, needed for `--env-file-if-exists`).

```bash
cp .env.example .env     # add GITHUB_TOKEN (classic: repo + read:project)
npm install
npm run dev              # http://localhost:5173 (API on :3001)
```

Production / TV: `npm run build && npm start`, then open `http://localhost:3001`.

## Kiosk setup on the TV PC

The TV PC is a small shared desktop that different staff sign in to, and it
locks when idle. Windows screensavers don't run over the lock screen, so the
plan (status: **proposed, awaiting IT team confirmation**) is a dedicated kiosk
account with the board hosted in Azure.

### Target design

- **Azure App Service** hosts the Node server and built client. API tokens
  (`GITHUB_TOKEN`, later the feedback credentials) live in app settings / Key
  Vault, never on the PC. See issue #3.
- **Access control:** App Service access restriction to the office public IP
  (the board only shows aggregate scores). Entra sign-in is the alternative.
- **The PC is a plain kiosk:** a dedicated account (e.g. `boarddisplay`)
  configured with Intune Assigned Access to run Edge in kiosk mode, fullscreen,
  pointed at the Azure URL, with auto sign-in and no idle lock. Nothing else is
  installed on the PC.
- **Device-specific policy:** the PC sits in its own Intune device group,
  excluded from device-wide idle locking (`Interactive logon: machine
  inactivity limit`), with power settings that keep the display on.
- **Nightly restart** (e.g. 5am) so the PC returns to the board account if
  someone signs out of their own account and forgets to switch back. Staff use
  Switch user / sign out to use their own account.
- **Network:** outbound HTTPS (443) to the Azure hostname only; no inbound.
- **Offline behaviour:** keep showing the last good data if the connection
  drops. See issue #4.

Fallback if the kiosk account isn't workable: a screensaver that launches the
board after ~5 minutes idle. It only shows while someone is signed in, so the
lock timeout must be longer than the screensaver delay.

### Azure App Service settings

The Node server serves the built client and the `/api/*` routes, so one App Service runs it all.
Deploys come from GitHub Actions on every push to `main`
(`.github/workflows/main_rawa-board-display.yml`).

- **Runtime / start command:** Node 24 LTS; startup command `npm start` (runs `server/index.mjs`).
- **Port:** the server listens on the `PORT` environment variable that App Service provides
  (falls back to 3001 locally). No extra setting needed.
- **App settings** (Configuration > Application settings; use Key Vault references for secrets):

  | Setting | Notes |
  | --- | --- |
  | `GITHUB_TOKEN` | **Secret.** Classic: `repo` + `read:project` |
  | `GITHUB_REPO`, `PROJECT_ORG`, `PROJECT_NUMBER` | Optional; defaults in `.env.example` |
  | `FEEDBACK_MODE` | `mock` or `live` |
  | `FEEDBACK_BASE_URL`, `ENTRA_TENANT_ID`, `ENTRA_CLIENT_ID`, `FEEDBACK_API_SCOPE` | Needed for `live` |
  | `ENTRA_CLIENT_SECRET` | **Secret.** Needed for `live` |

- **Health check:** set Monitoring > Health check path to `/healthz`. It returns `200 ok` without
  calling any upstream API, so a GitHub or feedback outage doesn't mark the app unhealthy.
- **Access control (not applied yet):** Networking > Access restrictions > add an Allow rule for the
  office public IP; Azure then denies everyone else. Leave the SCM (deployment) site rules alone so
  GitHub Actions deploys keep working. Note the site can't be viewed from home or mobile once
  restricted. Entra sign-in (Easy Auth) is the alternative.

### Live setup (Azure)

The board is live at
`https://rawa-board-display-gebug8arewefhhfb.australiaeast-01.azurewebsites.net/`.
The TV PC (`RAWA-8CC5490R6V`) only needs a browser: no Node, token or local server.

1. IT creates the kiosk account (standard, non-admin) with auto sign-in at boot.
2. On sign-in it launches Edge full-screen at the URL above:
   `msedge --kiosk <url> --edge-kiosk-type=fullscreen --no-first-run`
   (or Assigned Access single-app kiosk mode for that account only).
3. Outbound HTTPS (443) to the App Service only. Nothing inbound.
4. The page rotates slides, polls its API every minute, reloads itself hourly, and keeps
   showing the last good data if an API call fails.

The PC is not locked to the kiosk: staff can sign out or Switch user and log in with their
own domain account (Shift at boot also bypasses auto sign-in). The nightly restart returns
it to the board account.

## Feedback data - open decisions

`feedback-dash` is behind Entra ID sign-in (Easy Auth) and only allows
`@relationshipswa.org.au` users or allow-listed app-only clients (the pattern
used for the DataDivers export, see `server/src/machineAuth.ts` in the
feedback-responses repo). Going live needs one of:

- a small read-only endpoint on feedback-dash for this display, authenticated with
  a client-credentials token (needs a change in that repo and an allow-list entry), or
- reading the data source directly.

**Privacy:** free-text comments come from clients of a counselling/relationship
service and would be visible to anyone passing the TV. Recommend showing
aggregate scores only, or comments that staff have approved for display.
