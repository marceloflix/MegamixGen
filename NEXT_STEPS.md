# Handoff Guide: BPM & Harmonic Key Consistency Engine (Live Web Scraper & Local DB)

## Objective
Make dynamic BPM and Serato Camelot Key verification 100% free, consistent, authoritative, and reproducible across playlist generations and re-verifications without requiring paid Spotify Premium subscriptions, complex soloist developer setups, or hardcoded lookup dictionaries.

---

## 1. Root Cause & Solution for Track Verification Discrepancies
1. **Unicode Accidental Misalignment (`C♯/D♭`)**:
   - In SongBPM and search snippet scrapers, regex previously only matched ASCII `[#b]`.
   - On `La Bouche - Be My Lover`, SongBPM returned `<dd> C♯/D♭ </dd>`. The parser matched only `C`, ignoring `♯`, causing `C Minor` (`5A`) to be selected instead of `C# Minor` / `Db Minor` (`12A`).
   - Fixed by normalizing unicode accidentals (`♯` $\rightarrow$ `#`, `♭` $\rightarrow$ `b`) and parsing compound accidental keys prior to mapping.
2. **Beatport Remix Prioritization**:
   - Beatport's top result for some 90s classics is a modern club remix (e.g. *2023 Extended Mix* at 126 BPM).
   - Fixed `scrape_beatport` to strictly prioritize tracks labeled `Original Mix`, `Radio Edit`, or `is_classic: true` while filtering out modern remixes.
   - Result: Both SongBPM and Beatport now independently resolve *La Bouche - Be My Lover* to **135 BPM** and **12A** (C# Minor / Db Minor).
3. **Restored GetSongBPM API Key Support & Cleaned Settings Menu**:
   - Restored optional **GetSongBPM API Key** input in the Settings modal (`megamix_music_api_key`). If provided, queries GetSongBPM directly; otherwise, falls back to automatic live web scraping.
   - Removed verbose marketing text from the Settings modal, replacing it with a clean AI Model indicator (`gemini-3.5-flash-lite`) and a streamlined optional API key field.

---

## 2. Verification Architecture Order
1. **Local Persistent Database** (`lookupSongInDatabase` / `saveSongToDatabase`): Instant local hit, 0 network requests.
2. **Live Web Scraper** (`/api/lookup`): Live extraction from Beatport, DDG/Tunebat, SongBPM.
3. **Google Search AI Mode** (`temperature: 0.0`): Deterministic Gemini fallback if an API key is configured.
4. **In-Browser Web Audio Serato-Style Engine**: Fast Fourier transform and harmonic pitch chromagram on 30s preview audio.

---

## 3. Completed Action Checklist
- [x] Implemented `server.py` daemon providing static asset delivery and `/api/lookup` live scraper.
- [x] Zero hardcoding: Completely eliminated hardcoded track tables; verified tracks dynamically (*Snap! - Rhythm Is A Dancer* resolves live to 124 BPM, 8A).
- [x] Completely removed deprecated MusicBrainz, GetSongBPM, and Spotify API configuration forms.
- [x] Implemented `localStorage['megamix_song_ground_truth']` persistent storage.
- [x] Fixed `reverifyMixTracks` in [`js/playlist.js`](file:///home/flix/Desktop/MusicGen/js/playlist.js) to preserve cached database entries, eliminating redundant lookups and value discrepancies.
- [x] Reworked Settings modal: Center-aligned, scrollable viewport, pinned footer with Save/Cancel buttons, no clipping on any screen size.
- [x] Reworked UI text sizing: Normal (default), Small (compact Serato scale), and Large.

---

## 4. Key Files Touched
- [`server.py`](file:///home/flix/Desktop/MusicGen/server.py): Local server with `/api/lookup` live scraper for Beatport, DuckDuckGo Lite, and SongBPM.
- [`js/storage.js`](file:///home/flix/Desktop/MusicGen/js/storage.js): Persistent local song database (`megamix_song_ground_truth`).
- [`js/analyzer.js`](file:///home/flix/Desktop/MusicGen/js/analyzer.js): Multi-tier verification coordinator (Local DB -> Live Scraper -> AI Mode -> Web Audio).
- [`js/playlist.js`](file:///home/flix/Desktop/MusicGen/js/playlist.js): Re-verify coordinator with database preservation.
- [`js/settings.js`](file:///home/flix/Desktop/MusicGen/js/settings.js): Cleaned settings handlers with live scraper status.
- [`index.html`](file:///home/flix/Desktop/MusicGen/index.html): Live Web Scraper & Local DB status card, removed deprecated API forms.

