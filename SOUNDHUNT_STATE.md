# SoundHunt — Current Architecture & Project State

> **CRITICAL RULE FOR ALL FUTURE AGENTS & SESSIONS:**
> **NEVER** execute `git commit` or `git push` on behalf of the user. The user is strictly in charge of committing and pushing changes. This is enforced globally in `~/.gemini/config/rules/git-no-commit.md`, `.agents/rules/git-no-commit.md`, and `GEMINI.md`.

---

## 1. Project Overview
- **Name:** SoundHunt (formerly *MegamixGen*)
- **Tagline:** Music Discovery & Track Hunting Engine
- **Core Concept:** An intuitive, high-speed music discovery console where DJs and music lovers type natural-language vibes, genres, or eras to unearth authentic hidden gems, B-sides, and compatible tracks.
- **Tech Stack:**
  - Vanilla HTML5 / Vanilla CSS / ES6+ JavaScript (zero build step, no Webpack/Vite)
  - Lightweight Python backend (`server.py`) serving static files with CORS support
  - Gemini AI (`gemini-3.5-flash-lite`) via Google AI Studio API for sonic track hunting
  - Spotify Web API (PKCE OAuth) for 1-click playlist export
  - Monochrome ([monochrome.tf](https://monochrome.tf)) integration for 1-click track downloading
  - Native HTML5 Audio with iTunes 30s preview search integration

---

## 2. Implemented & Verified Features

### A. Discovery Console & Natural-Language Prompting
- **Input:** `#ai-vibe` takes natural-language requests (e.g. *"90s underground progressive house"*, *"Late 90s speed garage dubs"*).
- **Discovery Focus Chips:**
  - `[✨ Balanced]` *(Default)*: Blend of authentic hidden gems and recognizable essentials.
  - `[⚡ Deep Cuts & Obscure]`: Rare vinyl B-sides, white-labels, and underground cuts.
  - `[🔥 Mainstream Hits]`: Iconic crowd-pleasers and radio classics.
- **Quantity Selector:** Stepper toggles between 10, 20, 30, and 40 tracks.

### B. Tracklist Management & Discovery Actions
- **Prune Tracks (`✕`):** Clicking the prune button removes unwanted songs with smooth fade-out and immediately recalculates the playlist's track count and estimated duration.
- **Dig Deeper (`🔍`):**
  - Clicking the magnifying glass on any track opens the **Dig Deeper Modal**.
  - Users choose how many similar tracks to add (`+3`, `+5`, `+10`, or custom quantity).
  - Queries Gemini to unearth songs sharing the seed track's exact sonic DNA, groove, era, and vibe.
  - Appends the discovered tracks directly into the existing playlist with seamless scrolling.
- **Download Stash Drawer (`★`):**
  - Clicking `★` on any track adds it to the persistent slide-out Download Stash drawer (`#stash-drawer`).
  - Stash drawer features live track counter badge in the header (`#stash-count-badge`).
  - Offers 1-click direct search links to [Monochrome.tf](https://monochrome.tf) and Spotify.
- **1-Click Spotify Playlist Creation:**
  - Card footer includes **"CREATE SPOTIFY PLAYLIST"** button (`js/spotify.js`).
  - Uses client-side PKCE OAuth directly from the user's browser to build the playlist in their Spotify account using their free Spotify Client ID.
- **Discovery Analytics:**
  - Stats modal displays Playlists Generated, Tracks Discovered, Starred Playlists, Download Stash count, Average Energy, Estimated Listening Time, Top Artist Discovered, Top Genre, and Top Search Prompt.

### C. Anti-Hallucination & Factual Integrity
- **Zero-Hallucination Directives:** Prompts explicitly enforce real, verifiable tracks and accurate primary artist attribution (e.g., George Michael for *Careless Whisper*, Phil Collins instead of Genesis, Sting instead of The Police).
- **Strict Era Authenticity:** Prompts enforce that era-specific queries (e.g. 80s, 90s) return authentic period recordings without modern retro revivals.

---

## 3. Key Architecture & File Manifest

| File | Purpose |
| :--- | :--- |
| [`index.html`](file:///home/flix/Desktop/MusicGen/index.html) | Main UI markup, Discovery Console, Stash Drawer, Modals (Settings, Stats, Dig Deeper). |
| [`css/styles.css`](file:///home/flix/Desktop/MusicGen/css/styles.css) | Dark cyberpunk neon theme, animations, high-contrast white text styles. |
| [`js/api.js`](file:///home/flix/Desktop/MusicGen/js/api.js) | Gemini prompt engine, Dig Deeper modal controller, Discovery Chips management. |
| [`js/feed.js`](file:///home/flix/Desktop/MusicGen/js/feed.js) | Playlist card rendering, track rows, pruning, favorite toggles. |
| [`js/playlist.js`](file:///home/flix/Desktop/MusicGen/js/playlist.js) | `removeTrackFromMix`, `copyTrackName`, `deleteMix`. |
| [`js/stash.js`](file:///home/flix/Desktop/MusicGen/js/stash.js) | Download Stash drawer state, localStorage persistence, Monochrome links. |
| [`js/spotify.js`](file:///home/flix/Desktop/MusicGen/js/spotify.js) | Spotify Web API PKCE auth flow and playlist export. |
| [`js/settings.js`](file:///home/flix/Desktop/MusicGen/js/settings.js) | Gemini key, Spotify Client ID, and UI preferences management. |
| [`js/storage.js`](file:///home/flix/Desktop/MusicGen/js/storage.js) | localStorage keys, history management, preference storage. |
| [`js/merge.js`](file:///home/flix/Desktop/MusicGen/js/merge.js) | Multi-playlist merger combining unique tracks into cohesive crates. |
| [`js/player.js`](file:///home/flix/Desktop/MusicGen/js/player.js) | 30-second iTunes audio preview integration and sticky player bar. |
| [`js/ui.js`](file:///home/flix/Desktop/MusicGen/js/ui.js) | Stage stepper, scroll-to-top, demo playlist initialization, keyboard shortcuts. |
| [`server.py`](file:///home/flix/Desktop/MusicGen/server.py) | Lightweight local static HTTP server on `http://localhost:8080/` with CORS support. |
| [`README.md`](file:///home/flix/Desktop/MusicGen/README.md) | User-facing GitHub documentation written in a natural, crate-digger tone. |

---

## 4. Completed Streamline Refactor

- **GetSongBPM Phased Out:**
  - Completely removed GetSongBPM third-party API requirements and configuration.
  - Eliminated `js/analyzer.js` and `js/harmonic.js` (-1,200 lines of legacy code).
  - No external catalog rate limits, 404 mismatch errors, or "0% Verified" banners.
- **BPM/Camelot & Visualizer Clutter Removed:**
  - Removed BPM visualizer bar and dual sorting buttons (`BPM` and `Camelot`) from mix cards.
  - Removed BPM & Camelot badges and verification spinners from track rows.
- **Track Row Actions Layout:**
  - Intuitive ordering: `[✕ Prune] [1] Artist — Title [▶ Preview] [YouTube] [Spotify] [Monochrome] | [🔍 Dig Deeper] [★ Stash]`.
- **Download Stash Drawer:**
  - Streamlined exclusively for downloading: features only **Monochrome** search links and individual **Remove (`✕`)** buttons (Spotify link removed from stash items).
  - Clear Stash upgraded with inline confirmation (`Clear all?`) and outside-click dismissal.
- **Universal Inline Confirmation System (`armConfirmButton`):**
  - Standardized across all destructive buttons: Track Pruning (`✕`), Playlist Delete (`✕`), Clear History, Reset Prompt Defaults, and Clear Stash.
  - Generous **8-second timeout** gives ample time to review.
  - **Outside-Click & Escape Dismissal**: Clicking anywhere outside the armed button or pressing `Escape` immediately disarms and reverts the button to its standard state without having to wait for the timeout.
- **Pure Zero-Setup Discovery:**
  - SoundHunt requires strictly:
    1. **Gemini API Key** (for sonic crate digging and track curation)
    2. **Spotify Client ID** (optional, for 1-click playlist creation)

---

## 5. Verification & Testing Environment
- **Local Server:** Running on `http://localhost:8080/` (`python3 server.py`).
- **Browser Automation:** Antigravity IDE's official `browser_subagent` and Google Chrome via CDP.
