# SoundHunt

> **Hunt down songs you didn't know you needed.**

**SoundHunt** lets you dig through musical history using natural, conversational language. Type what you're feeling, unearth buried gems and deep cuts, audition tracks on the fly, prune out whatever misses the mark, stash keepers, and export playlists directly into Spotify.

![SoundHunt Discovery Console](assets/screenshots/main_view.png)

---

## What Can SoundHunt Do?

- 🎯 **Vibe-Based Discovery**: Describe any era, subgenre, or mood in plain English. No rigid genre dropdowns or algorithmic echo chambers.
- ⚡ **Deep Cuts or Hit Anthems**: Flip between **Deep Cuts & Obscure** (for rare vinyl B-sides and forgotten treasures), **Balanced**, or **Mainstream Hits**.
- 🎧 **Instant 30s Audition**: Hit play to preview 30-second audio clips directly in your browser without leaving the page.
- ✕ **Ruthless Pruning**: Suggested tracks that miss the mark? Click `✕` to prune them out instantly with smooth animations and dynamic count updates.
- 🔍 **Dig Deeper**: Found a track you love? Click the magnifying glass (`🔍`) and choose how many similar tracks (+3, +5, +10, or custom) to hunt down sharing that exact sonic groove and DNA.
- 📥 **One-Click Download via Monochrome**: Star tracks (`★`) to your **Download Stash** drawer and jump straight to [Monochrome](https://monochrome.tf) to download them in high quality.
- 🟢 **1-Click Spotify Export**: Curated a lineup you love? One click creates a brand new playlist directly in your Spotify account via client-side PKCE OAuth.
- 🚀 **Zero-Setup, Frictionless Experience**: No third-party metadata API keys, no verification spinners, no rate-limiting roadblocks. Just pure music discovery.

---

## Quick Start

### 1. Clone & Run Locally
```bash
git clone https://github.com/marceloflix/SoundHunt.git soundhunt
cd soundhunt
python3 server.py
```
Open **`http://localhost:8080`** in your browser.

---

### 2. Grab Your Free Gemini Key (1 Minute)
SoundHunt uses Google's Gemini API (`gemini-3.5-flash-lite`) to understand your musical prompts:
1. Head over to [Google AI Studio](https://aistudio.google.com/apikey).
2. Sign in and click **Create API Key**.
3. Paste it into SoundHunt under **⚙ Settings** & you're ready to hunt!

*(Keys are saved strictly in your local browser storage—never sent anywhere else).*

![SoundHunt Settings](assets/screenshots/settings_view.png)

---

### 3. Optional: 1-Click Spotify Playlist Creation
- Paste your free **Spotify Client ID** in **⚙ Settings** (from [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), Redirect URI: `http://localhost:8080/`).
- Instantly send any curated crate directly to your personal Spotify account with a single click.

---

## License

Distributed under the **MIT License** — Made for music lovers, crate diggers, and track hunters everywhere.
