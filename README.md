# board-display

Rotating information display for the office TV (Windows 11 PC, view-only).
A Vite + React client shows one "slide" at a time; a tiny Node server fetches
and caches data so API tokens never reach the browser.

## Slides

| Slide | Source | Status |
| --- | --- | --- |
| Product vision | `src/slides/VisionSlide.tsx` (edit the copy) | placeholder text |
| GitHub stats | `Relationships-Australia-WA/feedback` via GitHub REST | live |
| Client feedback | `feedback-dash.azurewebsites.net` | **sample data** (see below) |

Order and dwell time are in `src/slides.tsx`.

## Run

```bash
cp .env.example .env     # add GITHUB_TOKEN (read access to the repo)
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

### Interim setup (local, until the Azure version is live)

1. Create a Task Scheduler task "At log on" running `npm start` in this folder.
2. Add a second startup item:
   `msedge --kiosk http://localhost:3001 --edge-kiosk-type=fullscreen --no-first-run`
3. The page reloads itself hourly and keeps showing the last good data if an API call fails.

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
