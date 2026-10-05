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

The display is hosted on Azure App Service, so the TV PC (`RAWA-8CC5490R6V`) only
needs a browser. No Node, token or local server is required on it.

1. IT creates a dedicated standard (non-admin) kiosk account that auto-logs on at boot.
2. On sign-in, that account launches Edge full-screen at the hosted URL:
   `msedge --kiosk https://rawa-board-display-gebug8arewefhhfb.australiaeast-01.azurewebsites.net/ --edge-kiosk-type=fullscreen --no-first-run`
   (or Windows Assigned Access single-app kiosk mode for that account only).
3. Network: outbound HTTPS (443) from the PC to the App Service. Nothing inbound.
4. Power: no sleep or lock; power on after an outage; update restarts outside business hours.
5. The page reloads itself hourly, polls its API every minute, and keeps showing the last
   good data if an API call fails.

### Using the PC for something else

The PC is not locked to the kiosk. Staff can sign out of the kiosk account (Ctrl+Alt+Del >
Sign out, or Switch user) and log in with their own domain account as normal. Holding Shift
during boot also bypasses auto-logon. Signing out of the kiosk account ends the display, so
restart the PC (or sign the kiosk account back in) afterwards to resume it.

For local development / running the server on a PC yourself: `npm run build && npm start`,
then open `http://localhost:3001`.

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
