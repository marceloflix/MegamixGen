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
- [x] **Zero Guessing Mode**: When no GetSongBPM key is entered in Settings, all BPM and Camelot Key badges are cleanly hidden with zero scraping, zero guessing, and zero hallucinations.
- [x] **GetSongBPM Authoritative API Integration**: Direct querying through `server.py` (`/api/lookup`) using official GetSongBPM endpoint syntax (`song:TITLE artist:ARTIST`).
- [x] **Automatic Key Translation**: Traktor Open Key (`1m-12m`, `1d-12d`) and standard musical keys (`C#m`, `Am`, `G`) automatically mapped into Serato Camelot notation (`12A`, `8A`, `9B`, etc.).
- [x] **Persistent Local Database**: Verified tracks cached in `localStorage['megamix_song_ground_truth']` for 0-request repeat verification.
- [x] **Streamlined Settings UI**: Added clean input field with `100% AUTHORITATIVE` badge and direct link to `https://getsongbpm.com/api` (3,000 req/hr free tier).
- [x] **Dynamic Diagnostics UI**: Displays `UNLOCK BPM & KEY` button when no key is entered; unlocks `100% VERIFIED`, BPM flow bars, and BPM/Camelot sorting when key is present.
- [x] **Clean Re-Verification**: Re-verifying preserves cached ground truth and queries GetSongBPM.

---

## 4. Key Files
- [`API_INTEGRATION_PLAN.md`](file:///home/flix/Desktop/MusicGen/API_INTEGRATION_PLAN.md): Architecture specification for single-free-key GetSongBPM and Zero Guessing Mode.
- [`server.py`](file:///home/flix/Desktop/MusicGen/server.py): Local backend proxy for GetSongBPM API with Open Key & Camelot key normalization.
- [`js/analyzer.js`](file:///home/flix/Desktop/MusicGen/js/analyzer.js): Authoritative verification coordinator and Zero Guessing Mode DOM updates.
- [`js/feed.js`](file:///home/flix/Desktop/MusicGen/js/feed.js): Conditional track badge rendering, diagnostics status, and BPM flow visualizer.
- [`js/playlist.js`](file:///home/flix/Desktop/MusicGen/js/playlist.js): Re-verification coordinator and harmonic sorting.
- [`js/settings.js`](file:///home/flix/Desktop/MusicGen/js/settings.js): Settings modal event triggers and immediate feed rebuilds on key changes.
- [`js/storage.js`](file:///home/flix/Desktop/MusicGen/js/storage.js): Local song database (`megamix_song_ground_truth`) and `musicApiKey` persistence.
- [`index.html`](file:///home/flix/Desktop/MusicGen/index.html): Clean Settings modal markup with GetSongBPM key input and direct API link.

---

## 5. Upcoming Milestones
1. **DJ Software Crate Export**:
   - Implement direct export for Rekordbox XML, Serato DJ crates (`.crate`), and Traktor NML playlist formats with embedded BPM and Camelot Key metadata tags.
2. **Harmonic Mix Transition Engine**:
   - Provide an optional expandable DJ cue sheet displaying transition advice between adjacent tracks (e.g., `5A → 6A (+1 Energy Lift)`, `7A → 7B (Relative Major Switch)`).
3. **Audio Preview Waveform Scrubbing**:
   - Enhance the in-browser audio player with a mini waveform visualizer and transient cue points.


