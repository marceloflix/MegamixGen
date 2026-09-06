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
    const orig = span.innerHTML;
    span.innerHTML = '<i class="fas fa-check text-[#39ff14] mr-1"></i><span class="text-[#39ff14]">Copied!</span>';
    setTimeout(() => { span.innerHTML = orig; }, 1200);
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
    
    saveHistory(history);
    rebuildFeed();
    
    setTimeout(() => {
        const el = document.querySelector(`[data-ts="${ts}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}
