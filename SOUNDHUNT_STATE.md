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

## 4. BPM & Key Accuracy Audit & Fixes
- **BPM Double-Tempo Fix:**
  - *Root Cause:* A legacy DJ rule `if (bpm < 85) bpm *= 2` in both `server.py` and `js/analyzer.js` was artificially doubling slow tempos (e.g. George Michael's *Careless Whisper* was converted from 66 BPM to 132 BPM).
  - *Fix:* Removed the doubling check entirely from both Python and client JS. Slow ballads, downtempo, and hip-hop now preserve their authentic studio BPMs (e.g. *Careless Whisper* returns verified 66 BPM).
- **Camelot Harmonic Key Audit:**
  - *Standard:* Adheres strictly to the Mixed In Key Camelot Wheel (`1A`-`12A` for Minor, `1B`-`12B` for Major).
  - *Careless Whisper:* In real life, it is in D Minor. GetSongBPM returns `key_of: "Dm"`, `open_key: "12m"`. SoundHunt maps D Minor to **7A** (relative major: 7B F Major), which is 100% accurate.
- **Cache Invalidation:**
  - Bumped the localStorage catalog database key to `soundhunt_song_ground_truth_v2` (in `js/storage.js` and `js/analyzer.js`) so any stale doubled-tempo cache entries from previous testing are cleanly flushed.

---

## 5. Architectural Consideration: Phasing Out GetSongBPM & Streamlining UI
- **Decision Under Review:** Consider completely dropping the GetSongBPM API service requirement and removing BPM & Camelot Key displays and sorting from the main interface.
- **Rationale & Benefits:**
  1. **Zero External Friction:** Third-party catalog APIs often suffer from rate limits, missing underground/obscure cuts, and alias mismatch issues. Eliminating the API key requirement makes SoundHunt work out of the box with zero setup hurdles.
  2. **Clean, Laser-Focused Discovery Experience:** SoundHunt shines as a high-speed crate-digging instrument. Removing the BPM/Key badges, verification spinners, and harmonic sorting controls declutters the interface, keeping the user 100% focused on discovering great music, digging deeper into tracks, stashing downloads, and building Spotify playlists.
  3. **Future Audio Analyzer Context:** If BPM or key detection is ever revisited, it will be handled as an optional standalone audio analyzer or local file scanner rather than a dependency blocking the discovery workflow.

---

## 6. Serato Analyzer Clone Roadmap (Future Option)
- **Goal:** If an offline analyzer is pursued, build an in-browser / local audio analyzer modeled after Serato DJ Pro / Mixed In Key:
  1. **Audio Decoding & Spectral Flux:** Extract onset envelope and spectral flux from local audio previews/files.
  2. **Multi-Band Autocorrelation Beat Tracking:** Estimate BPM across low-end kicks and transients without octave doubling or halving errors.
  3. **Chromagram & Krumhansl-Schmuckler Key Detection:** 12-pitch chroma profile correlated against major/minor key profiles to yield exact Camelot Key notation (`1A`-`12B`).
  4. **Beat Grid & Waveform Visualization:** Real-time visual phase/beat markers.

---

## 7. Verification & Testing Environment
- **Local Server:** Running on `http://localhost:8080/` (`python3 server.py`).
- **Browser Automation:** Tested with Antigravity IDE's official `browser_subagent` and Google Chrome (`/usr/bin/google-chrome`) via CDP.
- **Playwright Driver Cache:** Cached at `~/.cache/ms-playwright-go/1.57.0/`.

---

## 8. How to Resume Work in a New Chat
To resume in tomorrow's session, simply copy and paste the following prompt into the new chat:
```markdown
Review SOUNDHUNT_STATE.md. All recent changes (SoundHunt rebrand, Dig Deeper modal, Download Stash, Spotify playlist creator, and the 66 BPM ballad tempo fix) have been committed and pushed to main. Let's test the app and discuss whether to streamline the interface by phasing out GetSongBPM and removing BPM/Key sorting for a pure, frictionless music discovery experience.
```
