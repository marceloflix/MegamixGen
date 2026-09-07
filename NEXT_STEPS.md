# Handoff Guide: BPM & Harmonic Key Consistency Engine

## Objective
Make dynamic BPM and Harmonic Key verification consistent, authoritative, and reproducible across playlist generations and re-verifications without hardcoded tables.

---

## 1. Why Results Were Inconsistent (Root Cause Analysis)
1. **Gemini Temperature Default (1.0)**:
   - When calling Gemini in `js/analyzer.js` (`batchVerifyTracksViaOnlineSearch`), `generationConfig.temperature` was not explicitly set.
   - Default temperature (~1.0) introduces creative randomness, returning slightly different BPMs or keys on successive calls for the same song.
2. **Lack of Live Search Grounding**:
   - The model was relying on pure pre-trained parametric memory instead of live Google Search Grounding (`tools: [{ googleSearch: {} }]`), leading to hallucinations or variations between studio versions, live versions, and remixes.
3. **Ambiguity in Release Versions**:
   - Songs with radio edits vs. 12" club mixes vs. live bootlegs often have different tempos (e.g., 128 BPM vs 125 BPM) or half-time notations (e.g., 84 BPM vs 168 BPM).

---

## 2. Tested & Recommended Solutions for the Next Session

### Solution A: Deterministic Sampling (`temperature: 0.0`)
- In `js/analyzer.js` under `batchVerifyTracksViaOnlineSearch`:
  ```javascript
  generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature: 0.0, // Zero temperature = maximum determinism and consistency
      maxOutputTokens: 2500
  }
  ```
- **Benefit**: Calling the API multiple times for the same song produces identical, stable results.

### Solution B: Google Search Grounding (`googleSearch: {}`)
- Enable Gemini's native Google Search Tool grounding:
  ```javascript
  tools: [{ googleSearch: {} }]
  ```
- **Benefit**: The model executes live Google searches behind the scenes to fetch real-time Beatport / Tunebat / SongBPM pages before outputting the final JSON.

### Solution C: GetSongBPM / Dedicated Music Database API
- Integrate a direct lookup via GetSongBPM API (`https://api.getsongbpm.com/search/`) using the user's optional API key in Settings.
- Query order:
  1. **GetSongBPM Database** (if API key is present).
  2. **Google AI Mode with Search Grounding** (`temperature: 0.0`).
  3. **In-Browser Serato-style Audio Analysis** (fallback).

---

## 3. Immediate Action Checklist for Next Turn
- [ ] In `js/analyzer.js`, set `generationConfig.temperature: 0.0` in `batchVerifyTracksViaOnlineSearch`.
- [ ] Add explicit versioning/prompt guardrail: `"Always provide data for the ORIGINAL STUDIO ALBUM / RADIO SINGLE release (not live, not remixes, not extended dubs). Always output standard tempos (e.g. 120-175 BPM, not half-time 60-85 BPM unless hip-hop/ballad)"`.
- [ ] Test with benchmark tracks (*Gary Numan - Cars*, *New Order - Blue Monday*, *Pet Shop Boys - West End Girls*, *A-ha - Take On Me*) and verify that 3 consecutive re-verifications produce identical, matching results.
- [ ] Test Google Search Grounding tool compatibility with structured JSON schema in Gemini 2.5/Flash-Lite.

---

## 4. Key Files to Touch
- [`js/analyzer.js`](file:///home/flix/Desktop/MusicGen/js/analyzer.js): `batchVerifyTracksViaOnlineSearch` prompt and `generationConfig`.
- [`js/harmonic.js`](file:///home/flix/Desktop/MusicGen/js/harmonic.js): Key parsing and Camelot normalization (already completed and passing 100%).
- [`js/settings.js`](file:///home/flix/Desktop/MusicGen/js/settings.js): Music API key handling.
- [`task.md`](file:///home/flix/Desktop/MusicGen/task.md): Milestone progress.
