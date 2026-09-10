// ── Export Playlist ──
function exportPlaylist(btn) {
    const title      = btn.getAttribute('data-title') || 'playlist';
    const tracksText = decodeURIComponent(btn.getAttribute('data-tracks'));
    const blob = new Blob([`${title}\n${'='.repeat(title.length)}\n\n${tracksText}\n`], { type: 'text/plain' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `${title.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check mr-1"></i> Saved!';
    setTimeout(() => { btn.innerHTML = orig; }, 2000);
}



// ── Copy Full Tracklist ──
async function copyTracks(btn) {
    const tracksText = decodeURIComponent(btn.getAttribute('data-tracks'));
    try { await navigator.clipboard.writeText(tracksText); }
    catch {
        const el = document.createElement('textarea');
        el.value = tracksText;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    }
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check mr-1"></i> Copied!';
    setTimeout(() => { btn.innerHTML = originalHTML; }, 2000);
}

// ── Copy Single Track ──
async function copyTrackName(span) {
    const track = span.getAttribute('data-track');
    try { await navigator.clipboard.writeText(track); }
    catch {
        const el = document.createElement('textarea');
        el.value = track;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    }
    const nameEl = span.querySelector ? span.querySelector('.track-name') : null;
    if (nameEl) {
        const orig = nameEl.innerHTML;
        nameEl.innerHTML = '<i class="fas fa-check text-[#39ff14] mr-1"></i><span class="text-[#39ff14]">Copied!</span>';
        setTimeout(() => { nameEl.innerHTML = orig; }, 1200);
    } else {
        const orig = span.innerHTML;
        span.innerHTML = '<i class="fas fa-check text-[#39ff14] mr-1"></i><span class="text-[#39ff14]">Copied!</span>';
        setTimeout(() => { span.innerHTML = orig; }, 1200);
    }
}

// ── Delete Individual Mix ──
function deleteMix(btn, ts) {
    // If called with a button element, use inline confirmation to prevent popup-blocker issues
    if (btn && !btn.dataset.confirming) {
        btn.dataset.confirming = 'true';
        const originalHTML = btn.innerHTML;
        const originalTitle = btn.title;
        btn.innerHTML = '<span class="text-[9px] font-extrabold uppercase text-[#ff3333] bg-[#220000] border border-[#ff3333] px-1.5 py-[2px] rounded shadow-[0_0_6px_rgba(255,51,51,0.6)] cursor-pointer select-none pointer-events-none">Delete?</span>';
        btn.title = 'Click again to confirm delete';

        btn._resetTimer = setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.title = originalTitle;
            delete btn.dataset.confirming;
        }, 4000);
        return;
    }

    if (btn && btn._resetTimer) clearTimeout(btn._resetTimer);
    if (btn) delete btn.dataset.confirming;

    const card = (btn && btn.closest('[data-ts]')) || document.querySelector(`[data-ts="${ts}"]`);
    if (!card) return;

    card.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    card.style.opacity = '0';
    card.style.transform = 'scale(0.95)';

    setTimeout(() => {
        card.remove();
        if (ts) {
            const history = getHistory().filter(m => m._timestamp !== ts);
            saveHistory(history);
        }
        updateHistoryControls();

        const container = document.getElementById('mixes-container');
        if (container && (!container.children || container.children.length === 0)) {
            container.innerHTML = '<div class="text-center text-[#555] text-[11px] py-8 uppercase tracking-widest"><i class="fas fa-compact-disc mr-2"></i>No playlists yet — enter a prompt above to generate one.</div>';
        }
    }, 200);
}

// ── Export M3U ──
function exportM3U(btn) {
    const title      = btn.getAttribute('data-title') || 'playlist';
    const tracksText = decodeURIComponent(btn.getAttribute('data-tracks'));
    const tracksArray = tracksText.split('\n').filter(Boolean);
    
    let m3uContent = '#EXTM3U\n';
    tracksArray.forEach(track => {
        m3uContent += `#EXTINF:-1,${track}\n${track}.mp3\n`;
    });
    
    const blob = new Blob([m3uContent], { type: 'audio/x-mpegurl' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `${title.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_')}.m3u`;
    a.click();
    URL.revokeObjectURL(a.href);
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check mr-1"></i> Saved!';
    setTimeout(() => { btn.innerHTML = orig; }, 2000);
}

// ── Sort Mix by BPM ──
function sortMixByBpm(ts) {
    const history = getHistory();
    const mix = history.find(m => m._timestamp === ts);
    if (!mix) return;
    
    mix.tracks.sort((a, b) => {
        const bpmA = (typeof a === 'object' && a.bpm) ? parseInt(a.bpm) : 9999;
        const bpmB = (typeof b === 'object' && b.bpm) ? parseInt(b.bpm) : 9999;
        return bpmA - bpmB;
    });
    
    mix._flowType = 'bpm';
    saveHistory(history);
    rebuildFeed();
    
    setTimeout(() => {
        const el = document.querySelector(`[data-ts="${ts}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

// ── Sort Mix by Camelot Wheel (Harmonic Progression) ──
function sortMixByCamelot(ts) {
    const history = getHistory();
    const mix = history.find(m => m._timestamp === ts);
    if (!mix || !Array.isArray(mix.tracks)) return;

    if (typeof sortTracksByCamelotOrder === 'function') {
        mix.tracks = sortTracksByCamelotOrder(mix.tracks);
    }

    mix._flowType = 'camelot';
    saveHistory(history);
    rebuildFeed();

    setTimeout(() => {
        const el = document.querySelector(`[data-ts="${ts}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

// ── Manually Re-verify / Harmonic Sync Mix Tracks ──
async function reverifyMixTracks(ts, btn) {
    const musicApiKey = typeof getMusicApiKey === 'function' ? getMusicApiKey() : '';
    if (!musicApiKey) {
        if (typeof openSettings === 'function') openSettings();
        return;
    }

    const history = getHistory();
    let mix = history.find(m => m._timestamp === ts);
    if (!mix) {
        // Support demo mix or DOM cards not yet in history
        const card = document.querySelector(`[data-ts="${ts}"]`);
        if (card) {
            const trackRows = card.querySelectorAll('.track-row');
            if (trackRows.length > 0) {
                const tracks = [];
                trackRows.forEach(row => {
                    const textEl = row.querySelector('.track-name');
                    const text = textEl ? textEl.textContent.trim() : '';
                    const parts = text.split(' - ');
                    const artist = (parts[0] || '').trim();
                    const title = (parts.slice(1).join(' - ') || parts[0] || '').trim();
                    tracks.push({ artist, title, bpm: null, key: null });
                });
                mix = { _timestamp: ts, title: 'System Initialization Mix', tracks };
            }
        }
    }
    if (!mix || !Array.isArray(mix.tracks)) return;

    // Reset verified and notFound flags to re-run GetSongBPM verification pass
    mix.tracks.forEach((t, i) => {
        if (typeof t === 'object' && t !== null) {
            t.verified = false;
            delete t.notFound;
            if (typeof updateTrackVerificationUI === 'function') {
                updateTrackVerificationUI(ts, i, t);
            }
        }
    });

    // Temporarily lock sort buttons while re-verifying
    const card = document.querySelector(`[data-ts="${ts}"]`);
    if (card) {
        const sortBpmBtn = document.getElementById(`sort-bpm-btn-${ts}`) || card.querySelector('.sort-bpm-btn');
        const sortCamelotBtn = document.getElementById(`sort-camelot-btn-${ts}`) || card.querySelector('.sort-camelot-btn');
        if (sortBpmBtn) {
            sortBpmBtn.disabled = true;
            sortBpmBtn.classList.add('opacity-40', 'cursor-not-allowed');
            sortBpmBtn.title = 'Sorting unlocks after verification completes';
        }
        if (sortCamelotBtn) {
            sortCamelotBtn.disabled = true;
            sortCamelotBtn.classList.add('opacity-40', 'cursor-not-allowed');
            sortCamelotBtn.title = 'Sorting unlocks after verification completes';
        }
    }

    if (btn) {
        btn.innerHTML = `<i class="fas fa-spinner fa-spin text-[8px] text-[#ffcc00] mr-1"></i><span class="text-[#ffcc00]">RE-VERIFYING (0/${mix.tracks.length})</span>`;
        btn.disabled = true;
    }

    if (typeof verifyPlaylistTracks === 'function') {
        await verifyPlaylistTracks(mix, (current, total) => {
            if (btn) btn.innerHTML = `<i class="fas fa-spinner fa-spin text-[8px] text-[#ffcc00] mr-1"></i><span class="text-[#ffcc00]">RE-VERIFYING (${current + 1}/${total})</span>`;
        });
    }

    saveHistory(history);

    if (btn) {
        btn.disabled = false;
        if (typeof updateMixDiagnosticsUI === 'function') {
            updateMixDiagnosticsUI(ts, mix, true);
        }
    }
}

