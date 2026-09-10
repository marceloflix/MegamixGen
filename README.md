# MegamixGen

MegamixGen is a browser-based DJ setlist curator and harmonic transition planner. It generates cohesive track sequences based on specific genres, eras, or vibes, then analyzes and organizes them for seamless mixing using standard Camelot Wheel notation and tempo progressions.

## Why MegamixGen?
Building crates and planning megamixes often involves constantly jumping between streaming services, music databases, and DJ software just to figure out which tracks transition smoothly. MegamixGen brings curation and harmonic verification together into a single workflow, helping DJs quickly draft sets that flow naturally in tempo and key.

## Features
- Harmonic Key Matching: Maps musical keys to standard Serato Camelot notation (1A through 12B) and Open Key to identify compatible harmonic transitions.
- BPM Transition Sorting: Reorder playlists by tempo curves, Camelot energy ramps, or custom arrangements.
- Metadata Verification: Confirms real-world track tempos and musical keys against an authoritative catalog.
- Local Caching: Caches verified song data in the browser to reduce redundant API calls and speed up repeat queries.
- Preview & Export: Direct track preview links and formatted tracklist exports ready for DJ library preparation.

## Getting Started

### Running Locally
1. Clone the repository:
   ```bash
   git clone https://github.com/marceloflix/MegamixGen.git
   cd MegamixGen
   ```
2. Start the local server:
   ```bash
   python3 server.py
   ```
3. Open `http://localhost:8080` in your browser.
4. Open Settings (gear icon) to configure your keys:
   - Gemini API Key: For playlist prompt generation and curation.
   - GetSongBPM API Key: For live BPM and harmonic key lookup.

> **Roadmap Note**: A standalone, double-click desktop application packaging is planned for future releases to make launching the app seamless without requiring terminal commands.

## Data Attribution
BPM and musical key database queries are provided by [GetSongBPM](https://getsongbpm.com).

## License
MIT
