import { createRoot } from "react-dom/client"
import { App } from "./App"
import "./styles.css"

createRoot(document.getElementById("root")!).render(<App />)

// Offline cache (see public/sw.js). Needs https or localhost; skipped in dev so
// Vite's HMR isn't served stale.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register("/sw.js").catch(() => {})
}
