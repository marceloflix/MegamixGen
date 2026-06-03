// ── Audio Preview (iTunes Search API) ──
let currentAudio      = null;
let currentPreviewBtn = null;

async function previewTrack(trackName, btn) {
    const bar         = document.getElementById('audio-player-bar');
    const titleEl     = document.getElementById('audio-track-title');
    const playPauseEl = document.getElementById('audio-play-pause');

    // Toggle same track
    if (currentAudio && currentPreviewBtn === btn && !currentAudio.paused) {
        currentAudio.pause();
        playPauseEl.innerHTML = '<i class="fas fa-play"></i>';
        return;
    }
    if (currentAudio && currentPreviewBtn === btn && currentAudio.paused) {
        currentAudio.play();
        playPauseEl.innerHTML = '<i class="fas fa-pause"></i>';
        return;
    }

    // Stop current playback
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }

    // Search iTunes
    titleEl.textContent    = 'Searching...';
    bar.classList.add('active');
    playPauseEl.innerHTML  = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        const resp = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(trackName)}&limit=1&media=music`);
        const data = await resp.json();

        if (!data.results || data.results.length === 0 || !data.results[0].previewUrl) {
            titleEl.textContent   = 'No preview available';
            playPauseEl.innerHTML = '<i class="fas fa-times"></i>';
            setTimeout(() => { if (titleEl.textContent === 'No preview available') closeAudioPlayer(); }, 2000);
            return;
        }

        const preview         = data.results[0];
        currentAudio          = new Audio(preview.previewUrl);
        currentPreviewBtn     = btn;
        titleEl.textContent   = `${preview.artistName} - ${preview.trackName}`;
        playPauseEl.innerHTML = '<i class="fas fa-pause"></i>';

        currentAudio.addEventListener('timeupdate', () => {
            const pct = (currentAudio.currentTime / currentAudio.duration) * 100;
            document.getElementById('audio-progress-fill').style.width = pct + '%';
        });
        currentAudio.addEventListener('ended', () => {
            playPauseEl.innerHTML = '<i class="fas fa-play"></i>';
            document.getElementById('audio-progress-fill').style.width = '0%';
        });

        currentAudio.play();
    } catch (e) {
        titleEl.textContent   = 'Preview failed';
        playPauseEl.innerHTML = '<i class="fas fa-times"></i>';
        setTimeout(() => closeAudioPlayer(), 2000);
    }
}

function toggleAudioPlayback() {
    if (!currentAudio) return;
    const playPauseEl = document.getElementById('audio-play-pause');
    if (currentAudio.paused) {
        currentAudio.play();
        playPauseEl.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        currentAudio.pause();
        playPauseEl.innerHTML = '<i class="fas fa-play"></i>';
    }
}

function closeAudioPlayer() {
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    currentPreviewBtn = null;
    document.getElementById('audio-player-bar').classList.remove('active');
    document.getElementById('audio-progress-fill').style.width = '0%';
}

document.addEventListener('DOMContentLoaded', () => {
    const progressContainer = document.getElementById('audio-progress');
    if (progressContainer) {
        progressContainer.addEventListener('click', (e) => {
            if (!currentAudio || !currentAudio.duration) return;
            const rect = progressContainer.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const pct = clickX / rect.width;
            currentAudio.currentTime = pct * currentAudio.duration;
            document.getElementById('audio-progress-fill').style.width = (pct * 100) + '%';
        });
    }
});
