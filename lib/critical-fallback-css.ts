/**
 * Inlined in `app/layout.tsx` so layout/spacing survives when `/_next/static/css/*`
 * fails (e.g. embedded preview browsers, stale chunk URLs).
 * Keep rules small and class-scoped; Tailwind still owns the full design when it loads.
 */
export const CRITICAL_FALLBACK_CSS = `
html { scroll-behavior: smooth; }
body.bd-root {
  margin: 0;
  min-height: 100vh;
  background: #faf7f2;
  color: #2c3e3f;
  font-family: var(--font-inter), system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.bd-crit-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  max-width: 72rem;
  margin-left: auto;
  margin-right: auto;
  padding: 1rem 1.25rem;
  box-sizing: border-box;
  width: 100%;
}
.bd-crit-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}
.bd-crit-cta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
  align-items: center;
  margin-top: 2.5rem;
}
.bd-nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}
.bd-nav-pills {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 9999px;
  border: 1px solid rgba(44, 62, 63, 0.12);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.bd-nav-pills a {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  color: rgba(44, 62, 63, 0.78);
}
.bd-nav-pills a[aria-current="page"] {
  background: #5b9eaa;
  color: #fff;
  box-shadow: 0 2px 6px rgba(91, 158, 170, 0.35);
}
.bd-nav-pills a:hover {
  background: rgba(91, 158, 170, 0.12);
  color: #2c3e3f;
}
`;
