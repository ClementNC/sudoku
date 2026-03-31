// ── INLINE SVG ICONS ─────────────────────────────────────────────────────
// All icons are self-contained SVG strings injected via innerHTML.
// Keeping them in one place makes visual consistency easy to maintain.

export const SVG_MOON = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/>
</svg>`;

export const SVG_SUN = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="5"/>
  <line x1="12" y1="1"  x2="12" y2="3"/>
  <line x1="12" y1="21" x2="12" y2="23"/>
  <line x1="4.22"  y1="4.22"  x2="5.64"  y2="5.64"/>
  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
  <line x1="1"  y1="12" x2="3"  y2="12"/>
  <line x1="21" y1="12" x2="23" y2="12"/>
  <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36"/>
  <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
</svg>`;

export const SVG_PAUSE = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
  <rect x="5"  y="3" width="4" height="18" rx="1"/>
  <rect x="15" y="3" width="4" height="18" rx="1"/>
</svg>`;

export const SVG_PLAY = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
  <polygon points="5,3 19,12 5,21"/>
</svg>`;

export const SVG_PAUSE_LARGE = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.45">
  <rect x="5"  y="3" width="4" height="18" rx="1"/>
  <rect x="15" y="3" width="4" height="18" rx="1"/>
</svg>`;
