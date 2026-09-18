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

function setTrackBtnState(btn, state) {
    if (!btn) return;
    const row = btn.closest ? btn.closest('.track-row') : null;
    if (state === 'loading') {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true" style="font-size:9px"></i>';
        btn.title = 'Loading preview...';
        btn.setAttribute('aria-label', 'Loading preview');
        btn.classList.add('border-[#39ff14]', '!opacity-100');
    } else if (state === 'playing') {
        btn.innerHTML = '<i class="fas fa-pause" aria-hidden="true" style="font-size:9px"></i>';
        btn.title = 'Pause preview';
        btn.setAttribute('aria-label', 'Pause preview');
        btn.classList.add('border-[#39ff14]', 'bg-[#0a2a0a]', 'shadow-[0_0_8px_rgba(57,255,20,0.6)]', '!opacity-100');
        if (row) row.classList.add('bg-[#002200]');
    } else {
        // idle / stopped / paused
        btn.innerHTML = '<i class="fas fa-play" aria-hidden="true" style="font-size:9px"></i>';
        btn.title = 'Preview 30s';
        btn.setAttribute('aria-label', 'Preview 30s');
        btn.classList.remove('border-[#39ff14]', 'bg-[#0a2a0a]', 'shadow-[0_0_8px_rgba(57,255,20,0.6)]', '!opacity-100');
        if (row) row.classList.remove('bg-[#002200]');
    }
}

function setAudioPlayerTitle(text) {
    const titleEl = document.getElementById('audio-track-title');
    const wrapper = document.getElementById('audio-track-title-wrapper');
    if (!titleEl) return;
    titleEl.textContent = text;
    titleEl.classList.remove('marquee-anim');
    titleEl.style.removeProperty('--marquee-distance');
    titleEl.style.removeProperty('--marquee-duration');

    requestAnimationFrame(() => {
        if (!wrapper || !titleEl) return;
        const overflow = titleEl.scrollWidth - wrapper.clientWidth;
        if (overflow > 4 && window.innerWidth <= 768) {
            const distance = overflow + 10;
            const duration = Math.max(5, Math.min(12, distance / 15 + 3));
            titleEl.style.setProperty('--marquee-distance', `-${distance}px`);
            titleEl.style.setProperty('--marquee-duration', `${duration}s`);
            titleEl.classList.add('marquee-anim');
        }
    });
}

async function previewTrack(trackName, btn) {
    const bar         = document.getElementById('audio-player-bar');
    const playPauseEl = document.getElementById('audio-play-pause');

    // Toggle same track
    if (currentAudio && currentPreviewBtn === btn && !currentAudio.paused) {
        currentAudio.pause();
        return;
    }
    if (currentAudio && currentPreviewBtn === btn && currentAudio.paused) {
        currentAudio.play().catch(e => console.warn('Audio play error:', e));
        return;
    }

    // Stop current playback
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    if (currentPreviewBtn) {
        setTrackBtnState(currentPreviewBtn, 'idle');
        currentPreviewBtn = null;
    }

    // Search iTunes
    currentPreviewBtn      = btn;
    setTrackBtnState(btn, 'loading');
    setAudioPlayerTitle('Searching...');
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
            setAudioPlayerTitle('No preview available');
            playPauseEl.innerHTML = '<i class="fas fa-times"></i>';
            setTrackBtnState(btn, 'idle');
            currentPreviewBtn = null;
            setTimeout(() => {
                const cur = document.getElementById('audio-track-title');
                if (cur && cur.textContent === 'No preview available') closeAudioPlayer();
            }, 2000);
            return;
        }

        const preview         = data.results[0];
        currentAudio          = new Audio(preview.previewUrl);
        const fullTitle       = `${preview.artistName} - ${preview.trackName}`;
        setAudioPlayerTitle(fullTitle);

        const badgesContainer = document.getElementById('audio-track-badges');
        const updatePlayerBadges = (analysis) => {
            if (!badgesContainer) return;
            if (analysis && analysis.bpm && analysis.camelot) {
                const safeColor = analysis.color || (typeof CAMELOT_COLORS !== 'undefined' ? CAMELOT_COLORS[analysis.camelot] : '#39ff14');
                badgesContainer.innerHTML = `
                    <span class="inline-flex items-center justify-center h-6 px-2 rounded-[4px] font-mono font-bold text-[11px] select-none whitespace-nowrap cursor-default shadow-[0_0_6px_rgba(0,0,0,0.8)] transition-all"
                          style="color: ${safeColor}; border: 1px solid ${safeColor}; background-color: ${safeColor}14; box-shadow: 0 0 6px ${safeColor}33;"
                          title="${analysis.bpm} BPM &bull; Key ${analysis.camelot}">
                        ${analysis.bpm} &bull; ${analysis.camelot}
                    </span>
                `;
            } else {
                badgesContainer.innerHTML = '';
            }
        };

        const cachedAnalysis = typeof getCachedAnalysis === 'function' ? getCachedAnalysis(trackName) : null;
        if (cachedAnalysis && cachedAnalysis.bpm && cachedAnalysis.camelot) {
            updatePlayerBadges(cachedAnalysis);
        } else {
            badgesContainer.innerHTML = '<span class="inline-flex items-center gap-1 h-6 px-1.5 rounded-[4px] border border-[#1a4a1a] bg-[#051505] text-[#39ff14] text-[10px] font-mono font-bold"><i class="fas fa-spinner fa-spin text-[8.5px]"></i>DSP...</span>';
            if (typeof analyzeTrackAudio === 'function' && preview.previewUrl) {
                analyzeTrackAudio(trackName, preview.previewUrl).then(res => {
                    const cur = document.getElementById('audio-track-title');
                    if (currentAudio && cur && cur.textContent === fullTitle) {
                        updatePlayerBadges(res);
                    }
                    if (btn) {
                        const row = btn.closest('.track-row');
                        if (row && typeof renderTrackBadgeResult === 'function') {
                            renderTrackBadgeResult(row, res);
                            if (typeof evaluateTrackRowLayout === 'function') evaluateTrackRowLayout(row);
                        }
                    }
                }).catch(() => {
                    if (badgesContainer) badgesContainer.innerHTML = '';
                });
            }
        }

        currentAudio.addEventListener('play', () => {
            playPauseEl.innerHTML = '<i class="fas fa-pause"></i>';
            playPauseEl.title = 'Pause preview';
            setTrackBtnState(currentPreviewBtn, 'playing');
        });
        currentAudio.addEventListener('pause', () => {
            playPauseEl.innerHTML = '<i class="fas fa-play"></i>';
            playPauseEl.title = 'Play preview';
            setTrackBtnState(currentPreviewBtn, 'idle');
        });
        currentAudio.addEventListener('timeupdate', () => {
            if (!currentAudio || !currentAudio.duration) return;
            const pct = (currentAudio.currentTime / currentAudio.duration) * 100;
            document.getElementById('audio-progress-fill').style.width = pct + '%';
        });
        currentAudio.addEventListener('ended', () => {
            playPauseEl.innerHTML = '<i class="fas fa-play"></i>';
            playPauseEl.title = 'Play preview';
            setTrackBtnState(currentPreviewBtn, 'idle');
            document.getElementById('audio-progress-fill').style.width = '0%';
        });
        currentAudio.addEventListener('error', () => {
            setTrackBtnState(currentPreviewBtn, 'idle');
            setAudioPlayerTitle('Playback error');
            playPauseEl.innerHTML = '<i class="fas fa-times"></i>';
            setTimeout(() => closeAudioPlayer(), 2000);
        });

        await currentAudio.play().catch(err => {
            console.warn('Autoplay audio notice:', err);
        });
    } catch (e) {
        console.error('Audio preview failed:', e);
        setTrackBtnState(btn, 'idle');
        currentPreviewBtn = null;
        setAudioPlayerTitle('Preview failed');
        playPauseEl.innerHTML = '<i class="fas fa-times"></i>';
        setTimeout(() => closeAudioPlayer(), 2000);
    }
}

function toggleAudioPlayback() {
    if (!currentAudio) return;
    if (currentAudio.paused) {
        currentAudio.play().catch(e => console.warn('Play error:', e));
    } else {
        currentAudio.pause();
    }
}

function closeAudioPlayer() {
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    if (currentPreviewBtn) {
        setTrackBtnState(currentPreviewBtn, 'idle');
        currentPreviewBtn = null;
    }
    const playPauseEl = document.getElementById('audio-play-pause');
    if (playPauseEl) {
        playPauseEl.innerHTML = '<i class="fas fa-play"></i>';
        playPauseEl.title = 'Play preview';
    }
    document.getElementById('audio-player-bar').classList.remove('active');
    document.getElementById('audio-progress-fill').style.width = '0%';
    const badgesContainer = document.getElementById('audio-track-badges');
    if (badgesContainer) badgesContainer.innerHTML = '';
    const titleEl = document.getElementById('audio-track-title');
    if (titleEl) {
        titleEl.textContent = '—';
        titleEl.classList.remove('marquee-anim');
    }
}

window.addEventListener('resize', () => {
    const bar = document.getElementById('audio-player-bar');
    if (bar && bar.classList.contains('active')) {
        const titleEl = document.getElementById('audio-track-title');
        if (titleEl && titleEl.textContent && titleEl.textContent !== '—') {
            setAudioPlayerTitle(titleEl.textContent);
        }
    }
});

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
