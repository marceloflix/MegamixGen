# SoundHunt

> **Hunt down songs you didn't know you needed.**

**SoundHunt** lets you dig through musical history using natural, conversational language. Type what you're feeling, unearth buried gems and deep cuts, audition tracks on the fly, prune out whatever misses the mark, stash keepers, and search or download them instantly.

![SoundHunt Discovery Console](assets/screenshots/main_view.png)

<div align="center">

<br>

[![Launch SoundHunt on Vercel](https://img.shields.io/badge/▶_LAUNCH_LIVE_APP-SoundHunt_on_Vercel-39ff14?style=for-the-badge&logo=vercel&logoColor=white&labelColor=0a0a0a)](https://sound-hunt.vercel.app)

<br>

**[⚡ Click here to launch SoundHunt in your browser — zero installation, instant crate digging!](https://sound-hunt.vercel.app)**

*(Works on Windows, Mac, Linux & mobile • 1-click install as a standalone desktop app)*

<br>

</div>

---

## What Can SoundHunt Do?

- **Vibe-Based Discovery**: Describe any era, subgenre, or mood in plain English. No rigid genre dropdowns or algorithmic echo chambers.
- **Deep Cuts or Hit Anthems**: Flip between **Deep Cuts & Obscure** (for rare vinyl B-sides and forgotten treasures), **Balanced**, or **Mainstream Hits**.
- **Instant 30s Audition**: Hit play to preview 30-second audio clips directly in your browser without leaving the page.
- **Direct Search & Streaming Links**: Jump straight from any track to search and listen on **Spotify**, **YouTube**, or **Monochrome**.
- **Ruthless Pruning**: Suggested tracks that miss the mark? Click `✕` to prune them out instantly with smooth animations and dynamic count updates.
- **Multi-Track Selection & Bulk Pruning**: Click any track's numeration badge to activate multi-select mode, select multiple tracks at once with custom neon checkboxes, and bulk delete unwanted tracks in one go.
- **Dig Deeper**: Found a track you love? Click the magnifying glass (`🔍`) and choose how many similar tracks (+3, +5, +10, or custom) to hunt down sharing that exact sonic groove and DNA.
- **One-Click Download via Monochrome**: Star tracks (`★`) to your **Download Stash** drawer and jump straight to [Monochrome](https://monochrome.tf) to download them in high quality.

---

## Quick Start

### Option A: Launch Instantly in Browser or Desktop (Zero Install)
1. Open the live app: **[SoundHunt on Vercel](https://sound-hunt.vercel.app)**.
2. Click **Install App** in the top bar (or the ⊕ icon in your browser's address bar) to install SoundHunt as a standalone desktop app on **Windows 10/11, macOS, or Linux**.
3. No terminal, no Python, no downloads required!

---

### Option B: Run Locally with Python (Offline / Developers)
If you prefer running SoundHunt completely offline or modifying the source locally:
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

## License

Distributed under the **MIT License** — Made for music lovers, crate diggers, and track hunters everywhere.
