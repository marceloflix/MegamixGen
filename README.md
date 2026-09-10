# MegamixGen

> **Browser-based DJ setlist curation, harmonic transition planning, and BPM progression sorting.**

MegamixGen helps DJs design cohesive track sequences based on eras, genres, or moods, then analyzes and organizes them for seamless mixing using standard **Camelot Wheel** notation and tempo progressions.

---

## Why MegamixGen?

Building setlists and planning megamixes often requires bouncing between streaming platforms, search engines, and DJ software:

- **The Challenge**: Relying on guesswork or unverified tags leads to clashing keys and awkward tempo jumps during live mixing.
- **The Solution**: MegamixGen unifies track curation, **harmonic key matching**, and **authoritative tempo verification** into a single, focused interface.

---

## Features

- **Harmonic Key Matching**: Automatically maps songs to standard Serato `Camelot Wheel` notation (`1A`–`12B`) and `Open Key` (`1d`–`12m`) to identify compatible harmonic transitions.
- **BPM Transition Curves**: Sort playlists by tempo progression (`Low to High` / `High to Low`), energy ramps, or harmonic flow.
- **Authoritative Verification**: Queries verified song catalogs via the `GetSongBPM API` to confirm true BPM and musical key without guessing.
- **Local Browser Cache**: Verified song data persists in `localStorage`, eliminating redundant network requests and speeding up repeat queries.
- **Quick Previews & Export**: Jump directly to search queries on `YouTube` and `Spotify`, or copy clean tracklists formatted for DJ library preparation.

---

## Getting Started

### Running Locally
1. **Clone the repository**:
   ```bash
   git clone https://github.com/marceloflix/MegamixGen.git
   cd MegamixGen
   ```

2. **Start the local server**:
   ```bash
   python3 server.py
   ```

3. **Open the application**:
   Open `http://localhost:8080` in your web browser.

4. **Configure your API keys** *(Settings icon in the top-right corner)*:
   - **Gemini API Key**: Used for playlist curation and prompt suggestions.
   - **GetSongBPM API Key**: Used for live BPM and Camelot key verification.

> [!NOTE]
> **Desktop App Roadmap**: A standalone, double-click desktop executable is planned for upcoming releases to make launching MegamixGen effortless without requiring terminal commands.

---

## Data Attribution

BPM and musical key database queries are provided by [GetSongBPM](https://getsongbpm.com).

---

## License

Distributed under the **MIT License**.
