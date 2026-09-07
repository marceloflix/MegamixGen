# MegamixGen — Roadmap & Future Phases

## Phase 3.2 (Completed): Hybrid Verified BPM & Harmonic Camelot Key Engine

### Objective
Provide **100% accurate BPM and Camelot Keys** (e.g., `11B`, `1A`, `8A`) through a smart **Hybrid Architecture**: querying verified online music databases (MusicBrainz / GetSongBPM) when configured, and seamlessly falling back to an in-browser local audio analyzer (similar to DJ software like Serato) when no API key is provided or when offline.

---

### Core Architecture: Hybrid 2-Tier Strategy

```
                      Track Generated
                            │
                            ▼
              Is Music Data API Key configured?
                        /        \
                    YES /          \ NO / Unset
                      /              \
                     ▼                ▼
     [Tier 1: Online Music API]    [Tier 2: In-Browser Local Audio Analysis]
       • MusicBrainz / GetSongBPM    • Serato-style in-browser beat & key detection
       • Accurate global database    • Decodes 30s audio snippet via Web Audio API
       • Returns root key & BPM      • Peak energy detection & autocorrelation
                     │                │
                     │ (If API fails  │
                     └── or no match)─┘
                            │
                            ▼
              [Camelot Wheel Conversion Engine]
          Standard Musical Key (e.g., F# minor) ──► Camelot (11A)
                            │
                            ▼
              [Asynchronous UI Badge Update]
         Badges update smoothly: e.g. [128 BPM ✓] [11A ✓]
```

---

### Tier 1: Online Music Data API (Primary for Highest Accuracy)
* **How it works**:
  * Users can optionally input a free API key (e.g., MusicBrainz / GetSongBPM) in the Settings modal alongside their Gemini API key.
  * When playlists are generated, the app queries the API asynchronously for the verified BPM, musical Key, and scale mode (Major/Minor).
  * **Pros**: Authoritative album-release data directly from professional audio databases.

---

### Tier 2: In-Browser Web Audio Local Beat & Key Analyzer (Serato-Style Fallback)
* **How it works**:
  * If the user **does not** provide a music database API key (or if the online API has no match for an obscure track), MegamixGen switches automatically to **Local Audio Analysis**.
  * Leveraging the browser's native `AudioContext.decodeAudioData()`, the app analyzes the 30-second audio preview buffer in memory (similar to how Serato / Traktor analyzes waveforms in seconds).
  * Measures rhythmic transients (energy peaks, autocorrelation) to compute exact tempo (BPM) and analyzes frequency spectrum bins (chromagram) to estimate root harmonic key.
  * **Pros**: 100% free, zero configuration, works instantly without any extra API keys.

---

### Key Conversion Engine (Camelot Notation)
* Built-in conversion utility translating standard musical keys to Camelot Wheel codes used by DJs:
  * Minor keys: *A minor* (`8A`), *E minor* (`9A`), *B minor* (`10A`), *F# minor* (`11A`), etc.
  * Major keys: *C major* (`8B`), *G major* (`9B`), *D major* (`10B`), *A major* (`11B`), etc.

---

### UI & Settings Integration
1. **Settings Modal**:
   * Add an optional field: `Music Data API Key (Optional — MusicBrainz / GetSongBPM)`.
   * Clear helper label: *"Leave empty to use automatic Serato-style in-browser local audio analysis."*
2. **Non-Blocking Performance**:
   * Initial playlist generation remains lightning fast (< 8s) using Gemini.
   * BPM and Key analysis runs asynchronously in the background and updates badges with a subtle `✓` verification indicator once confirmed.
