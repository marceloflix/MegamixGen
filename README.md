# SoundHunt

> **Hunt down songs you didn't know you needed.**

Ever have a craving for a super specific vibe—like *underground 90s acid trance with hypnotic female vocals*, or *obscure Japanese city pop from 1983*—and streaming algorithms just feed you the same 20 songs you've heard a thousand times?

**SoundHunt** lets you dig through musical history using natural, conversational language. Type what you're feeling, unearth buried gems and deep cuts, audition tracks on the fly, prune out whatever misses the mark, and grab your favorites for keeps.

---

## Interface Preview

| [**Main View**](assets/screenshots/main_view.png) | [**Settings & API Configuration**](assets/screenshots/settings_view.png) |
| :---: | :---: |
| <a href="assets/screenshots/main_view.png"><img src="assets/screenshots/main_view.png" width="600" alt="SoundHunt Main View"></a> | <a href="assets/screenshots/settings_view.png"><img src="assets/screenshots/settings_view.png" width="285" alt="SoundHunt Settings Modal"></a> |

---

## What Can SoundHunt Do?

- 🎯 **Vibe-Based Discovery**: Describe any era, subgenre, or mood in plain English. No rigid genre dropdowns or algorithmic echo chambers.
- ⚡ **Deep Cuts or Hit Anthems**: Flip between **Deep Cuts & Obscure** (for rare vinyl B-sides and forgotten treasures), **Balanced**, or **Mainstream Hits**.
- 🎧 **Instant 30s Audition**: Hit play to preview 30-second audio clips directly in your browser without leaving the page.
- ✕ **Ruthless Pruning**: The AI suggested 10 tracks and only 4 hit the spot? Click `✕` to trash the rest and keep your list sharp.
- 🔍 **Dig Deeper**: Found a track you love? Click the magnifying glass (`🔍`) and choose how many similar tracks (5, 10, or 15) to hunt down with that exact same groove.
- 📥 **One-Click Download via Monochrome**: Star tracks to your **Download Stash** drawer and jump straight to [Monochrome](https://monochrome.tf) to download them in high quality.
- 🟢 **Drop into Spotify**: Curated a lineup you love? One click creates a brand new private playlist in your Spotify account.
- 🎛️ **Harmonic Keys & BPM**: Every track is stamped with real BPM and Camelot harmonic keys so you can sort the flow from slow burn to peak energy.

---

## Quick Start

### 1. Clone & Run Locally
```bash
git clone https://github.com/marceloflix/MegamixGen.git soundhunt
cd soundhunt
python3 server.py
```
Open **`http://localhost:8080`** in your browser.

---

### 2. Grab Your Free Gemini Key (1 Minute)
SoundHunt uses Google's free Gemini API to understand your musical prompts:
1. Head over to [Google AI Studio](https://aistudio.google.com/apikey).
2. Sign in and click **Create API Key**.
3. Paste it into SoundHunt under **⚙ Settings** & you're ready to hunt!

*(Keys are saved strictly in your local browser storage—never sent anywhere else).*

---

### 3. Optional Goodies
- **GetSongBPM Key**: Add a free key from [getsongbpm.com/api](https://getsongbpm.com/api) for authoritative tempo & Camelot key verification.
- **Spotify Connect**: Paste your free Spotify Client ID in Settings to unlock 1-click playlist creation.

---

## Data Attribution

BPM and musical key queries are powered by [GetSongBPM](https://getsongbpm.com).

---

## License

Distributed under the **MIT License** — Made for music lovers, crate diggers, and track hunters everywhere.
