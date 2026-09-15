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
  - Lightweight Python backend (`server.py`) serving static files and proxying `/api/lookup` to GetSongBPM
  - Gemini AI (`gemini-3.5-flash-lite`) via Google AI Studio API for sonic track hunting
  - GetSongBPM API for verified BPM & musical key analysis
  - Spotify Web API (PKCE OAuth) for 1-click playlist creation
  - Monochrome ([monochrome.tf](https://monochrome.tf)) integration for 1-click track downloading

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
- **Prune Tracks (`✕`):** Clicking the prune button removes unwanted songs with smooth fade-out and immediately recalculates the playlist's track count, BPM range, and duration.
- **Dig Deeper (`🔍`):**
  - Clicking the magnifying glass on any track opens the **Dig Deeper Modal**.
  - Users choose how many similar tracks to add (`+3`, `+5`, `+10`, or custom quantity).
  - Queries Gemini to unearth songs sharing the seed track's exact sonic DNA, groove, era, and tempo.
  - Appends the discovered tracks directly into the existing playlist.
  - Calls `verifyNewTracksOnly()` to selectively verify *only the newly added tracks* against GetSongBPM without re-verifying existing songs.
- **Download Stash Drawer (`★`):**
  - Clicking `★` on any track adds it to the persistent slide-out Download Stash drawer (`#stash-drawer`).
  - Stash drawer features live track counter badge in the header (`#stash-count-badge`).
  - Offers 1-click direct search links to [Monochrome.tf](https://monochrome.tf) and Spotify.
- **1-Click Spotify Playlist Creation:**
  - Card footer includes **"CREATE SPOTIFY PLAYLIST"** button (`js/spotify.js`).
  - Uses client-side PKCE OAuth directly from the user's browser to build the playlist in their Spotify account.
- **Camelot Harmonic Flow & BPM Sorting:**
  - Integrates Serato/Traktor-style Camelot Wheel harmonic sorting (`1A` - `12B`).
  - BPM & Camelot sorting cleanly reorders the tracks *without* re-triggering API verification.

### C. Anti-Hallucination & Robust Catalog Matching
- **Zero-Hallucination Directives:** Prompts explicitly enforce real, verifiable tracks and accurate primary artist attribution (e.g., George Michael for *Careless Whisper*, Phil Collins instead of Genesis, Sting instead of The Police).
- **Multi-Pass GetSongBPM Resolution:** `server.py` implements intelligent multi-stage queries (`song:TITLE artist:ARTIST` $\rightarrow$ `song:TITLE artist:FIRST` $\rightarrow$ `type=song&lookup=TITLE` fallback with title fuzzy matching), eliminating false-negative 404s caused by catalog alias differences.

---

## 3. Key Architecture & File Manifest

| File | Purpose |
| :--- | :--- |
| [`index.html`](file:///home/flix/Desktop/MusicGen/index.html) | Main UI markup, Discovery Console, Stash Drawer, Modals (Settings, Stats, Dig Deeper). |
| [`css/styles.css`](file:///home/flix/Desktop/MusicGen/css/styles.css) | Dark cyberpunk neon theme, animations, high-contrast white text styles. |
| [`js/api.js`](file:///home/flix/Desktop/MusicGen/js/api.js) | Gemini prompt engine, Dig Deeper modal controller, Discovery Chips management. |
| [`js/analyzer.js`](file:///home/flix/Desktop/MusicGen/js/analyzer.js) | GetSongBPM lookup, `verifyPlaylistTracks`, and selective `verifyNewTracksOnly`. |
| [`js/feed.js`](file:///home/flix/Desktop/MusicGen/js/feed.js) | Playlist card rendering, track rows, pruning, favorite toggles, BPM visualizer. |
| [`js/playlist.js`](file:///home/flix/Desktop/MusicGen/js/playlist.js) | `removeTrackFromMix`, `sortMixByBpm`, `sortMixByCamelot`. |
| [`js/stash.js`](file:///home/flix/Desktop/MusicGen/js/stash.js) | Download Stash drawer state, localStorage persistence, Monochrome links. |
| [`js/spotify.js`](file:///home/flix/Desktop/MusicGen/js/spotify.js) | Spotify Web API PKCE auth flow and playlist export. |
| [`js/settings.js`](file:///home/flix/Desktop/MusicGen/js/settings.js) | Gemini key, GetSongBPM key, and Spotify Client ID modal management. |
| [`js/storage.js`](file:///home/flix/Desktop/MusicGen/js/storage.js) | localStorage keys, history management, local verified song database. |
| [`server.py`](file:///home/flix/Desktop/MusicGen/server.py) | Local HTTP server on `http://localhost:8080/` with GetSongBPM API proxy. |
| [`README.md`](file:///home/flix/Desktop/MusicGen/README.md) | User-facing GitHub documentation written in a natural, crate-digger tone. |

---

## 4. Verification & Testing Environment
- **Local Server:** Running on `http://localhost:8080/`.
- **Browser Automation:** Tested with Antigravity IDE's official `browser_subagent` and Google Chrome (`/usr/bin/google-chrome`) via CDP.
- **Playwright Driver Cache:** Cached at `~/.cache/ms-playwright-go/1.57.0/`.
