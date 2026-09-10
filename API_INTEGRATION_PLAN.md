# API Integration Plan: Single Free Key for 100% Authoritative BPM & Camelot Key

> **Target Session**: Tomorrow's Optimization & Cleanup  
> **Goal**: Stop scraping inconsistencies once and for all. Require a single free API key in Settings to show BPM & Camelot Key. If no API key is entered, cleanly hide BPM and Key badges (zero guessing, zero hallucinations).

---

## 1. Provider Research: The Best Free API for Both BPM & Key

We conducted a thorough evaluation of free music metadata providers to find one that supplies **both BPM and Musical Key** in **a single request** with **a single free API key**:

| Provider | BPM Included? | Musical Key Included? | Free Tier / Cost | Why Selected / Rejected |
| :--- | :---: | :---: | :---: | :--- |
| **GetSongBPM API** 🏆 | **YES** (`tempo`) | **YES** (`key_of` & `open_key`) | **100% Free** (3,000 req/hr) | **WINNER**: Single request gives exact BPM and musical key + Open Key harmonic code (`4m` = `12A`). Instant free key. |
| **Spotify Web API** | Yes | Yes | Requires **Paid Spotify Premium** | **Rejected**: Spotify now blocks free accounts from creating developer apps. |
| **MusicBrainz** | Partial | No | Free (Open Source) | **Rejected**: Standard recording endpoints do not store BPM/Key (AcousticBrainz was archived in 2022). |
| **Last.fm API** | No | No | Free | **Rejected**: Last.fm only stores play counts, scrobbles, and tags; zero tempo or key data. |
| **Tunebat** | Yes | Yes | No Public API (Cloudflare 403) | **Rejected**: No official API; aggressively blocks server-side scraping with Cloudflare anti-bot. |
| **Discogs API** | Rare | Rare | Free | **Rejected**: Only catalog release numbers and tracklists; audio features are missing for 95%+ of tracks. |

---

## 2. Recommended Provider: GetSongBPM API

### A. How to Get the Free API Key (Takes 1 Minute)
1. Go to: **[https://getsongbpm.com/api](https://getsongbpm.com/api)**
2. Fill out the simple registration form:
   - **Name**: Your name or username
   - **Email**: Your email address
   - **Website / App URL**: `http://localhost:8080` (or your GitHub repo URL)
3. Your free API key is generated and emailed immediately.
4. **Limits**: **3,000 requests per hour** (more than enough to generate and verify hundreds of playlists).

### B. Endpoint Specification
- **Base URL**: `https://api.getsongbpm.com/search/`
- **Method**: `GET`
- **Query Format**:
  ```http
  GET https://api.getsongbpm.com/search/?api_key=YOUR_API_KEY&type=both&lookup=song:TITLE+artist:ARTIST
  ```
- **Example Response JSON**:
  ```json
  {
    "search": [
      {
        "id": "7v9eK",
        "title": "Be My Lover",
        "artist": {
          "id": "1m0L",
          "name": "La Bouche"
        },
        "tempo": "135",
        "time_sig": "4/4",
        "key_of": "C#m",
        "open_key": "4m"
      }
    ]
  }
  ```

### C. Harmonic Key Translation (Open Key to Camelot)
GetSongBPM uniquely returns `open_key` (the Open Key notation used in DJ software):
- `4m` = **`12A`** (C# Minor)
- `8m` = **`3A`** (Bb Minor)
- `11m` = **`6A`** (G Minor)
- `1d` = **`8B`** (C Major)

Our existing normalizer in [`js/harmonic.js`](file:///home/flix/Desktop/MusicGen/js/harmonic.js) already supports Open Key mapping automatically!

---

## 3. The New Architecture: Zero Guessing Mode

### Scenario 1: User Has NOT Entered a GetSongBPM API Key
- Playlist generation works normally (song titles, artist, cover art, YouTube/Spotify links).
- **BPM and Key badges are hidden** or displayed as an unobtrusive badge: `[+ Add Key in Settings]`.
- No scraping errors, no guesswork, no conflicting values, and no hallucinations.

### Scenario 2: User Enters GetSongBPM API Key in Settings
- The user pastes their key into **Settings $\rightarrow$ Music Database API Key (GetSongBPM)**.
- Every track in the generated playlist queries GetSongBPM:
  - Exact `tempo` is fetched (e.g. `135 BPM`).
  - Exact `key_of` / `open_key` is fetched and mapped to Camelot (e.g. `12A`).
- The verified values are permanently saved in browser `localStorage['megamix_song_ground_truth']` so repeat songs use 0 requests.
- BPM and Camelot sorting buttons unlock.

---

## 4. Step-by-Step Implementation Roadmap for Tomorrow

### Step 1: Settings Modal Simplification ([`index.html`](file:///home/flix/Desktop/MusicGen/index.html) & [`js/settings.js`](file:///home/flix/Desktop/MusicGen/js/settings.js))
- Keep the clean single-field input:
  - **Label**: `GetSongBPM API Key (Free)`
  - **Helper link**: `[Get a free key at getsongbpm.com/api]`
  - Stored in `localStorage['megamix_music_api_key']`.

### Step 2: Conditional UI Display ([`js/feed.js`](file:///home/flix/Desktop/MusicGen/js/feed.js))
- In `buildTrackHTML()`:
  ```javascript
  const musicApiKey = getMusicApiKey();
  if (!musicApiKey) {
      // Do NOT show BPM or Key badges at all
      badgesHTML = '';
  } else if (track.verified) {
      // Show authoritative BPM & Camelot badges
      badgesHTML = `<span class="track-badges">...</span>`;
  } else {
      // Show analyzing spinner until GetSongBPM returns
      badgesHTML = `<span class="track-badges">...</span>`;
  }
  ```

### Step 3: Server Proxy Endpoint ([`server.py`](file:///home/flix/Desktop/MusicGen/server.py))
- To avoid browser CORS restrictions when calling GetSongBPM from JavaScript, keep the lightweight proxy in `server.py`:
  ```python
  def fetch_getsongbpm(artist, title, api_key):
      clean_title = re.sub(r'[\(\[\{].*?[\)\]\}]', '', title).strip()
      q = urllib.parse.quote(f"song:{clean_title} artist:{artist}")
      url = f"https://api.getsongbpm.com/search/?api_key={api_key}&type=both&lookup={q}"
      # Returns {"bpm": 135, "key": "12A", "musicalKey": "C#m"}
  ```
- If no API key is provided, `/api/lookup` returns `{ "status": "no_api_key" }`.

### Step 4: Local Database Persistence
- Retain `localStorage['megamix_song_ground_truth']`.
- Once a track is fetched via GetSongBPM, it stays saved locally forever.
- Re-verifying a mix is instant (0 network calls).

---

## 5. Summary of Benefits
1. **100% Reliable**: Values come directly from an established music database via an official API.
2. **No Rate Limits / Cloudflare Blocks**: Official API key grants 3,000 requests/hour with no scraping blocks.
3. **No Paid Accounts**: Unlike Spotify which now requires paid Spotify Premium, GetSongBPM keys are 100% free.
4. **Clean UI**: When no key is entered, users see a clean tracklist without cluttered or inaccurate badges.
