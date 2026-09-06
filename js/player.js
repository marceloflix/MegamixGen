// ── Audio Preview (iTunes Search API via JSONP & Fetch) ──
let currentAudio      = null;
let currentPreviewBtn = null;

// JSONP search for iTunes (bypasses CORS restrictions on file:/// origin)
function searchItunesJSONP(term) {
    return new Promise((resolve, reject) => {
        const callbackName = 'itunes_cb_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
        const script = document.createElement('script');
        let done = false;

        const timeout = setTimeout(() => {
            if (done) return;
            done = true;
            cleanup();
            reject(new Error('iTunes search timed out'));
        }, 7000);

        function cleanup() {
            clearTimeout(timeout);
            delete window[callbackName];
            if (script.parentNode) script.parentNode.removeChild(script);
        }

        window[callbackName] = function(data) {
            if (done) return;
            done = true;
            cleanup();
            resolve(data);
        };

        script.onerror = function() {
            if (done) return;
            done = true;
            cleanup();
            reject(new Error('iTunes JSONP load error'));
        };

        script.src = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&limit=1&media=music&callback=${callbackName}`;
        document.head.appendChild(script);
    });
}

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
        currentAudio.play().catch(e => console.warn('Audio play error:', e));
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
        let data;
        try {
            data = await searchItunesJSONP(trackName);
        } catch (jsonpErr) {
            console.warn('JSONP search failed, trying direct fetch:', jsonpErr);
            const resp = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(trackName)}&limit=1&media=music`);
            data = await resp.json();
        }

        if (!data || !data.results || data.results.length === 0 || !data.results[0].previewUrl) {
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
            if (!currentAudio || !currentAudio.duration) return;
            const pct = (currentAudio.currentTime / currentAudio.duration) * 100;
            document.getElementById('audio-progress-fill').style.width = pct + '%';
        });
        currentAudio.addEventListener('ended', () => {
            playPauseEl.innerHTML = '<i class="fas fa-play"></i>';
            document.getElementById('audio-progress-fill').style.width = '0%';
        });
        currentAudio.addEventListener('error', () => {
            titleEl.textContent   = 'Playback error';
            playPauseEl.innerHTML = '<i class="fas fa-times"></i>';
            setTimeout(() => closeAudioPlayer(), 2000);
        });

        await currentAudio.play().catch(err => {
            console.warn('Autoplay audio notice:', err);
        });
    } catch (e) {
        console.error('Audio preview failed:', e);
        titleEl.textContent   = 'Preview failed';
        playPauseEl.innerHTML = '<i class="fas fa-times"></i>';
        setTimeout(() => closeAudioPlayer(), 2000);
    }
}

function toggleAudioPlayback() {
    if (!currentAudio) return;
    const playPauseEl = document.getElementById('audio-play-pause');
    if (currentAudio.paused) {
        currentAudio.play().catch(e => console.warn('Play error:', e));
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
