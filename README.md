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
