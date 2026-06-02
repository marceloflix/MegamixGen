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

// ── Open All in Monochrome ──
function openAllMonochrome(btn) {
    const tracks = decodeURIComponent(btn.getAttribute('data-tracks')).split('\n').filter(Boolean);
    if (tracks.length > 10 && !confirm(`This will open ${tracks.length} tabs in Monochrome. Continue?`)) return;
    tracks.forEach((track, i) => {
        setTimeout(() => {
            window.open(`https://monochrome.samidy.com/search/${encodeURIComponent(track)}`, '_blank');
        }, i * 300);
    });
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check mr-1"></i> Opening...';
    setTimeout(() => { btn.innerHTML = orig; }, 3000);
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
    if (!confirm('Delete this playlist?')) return;
    const card = btn.closest('[data-ts]');
    if (!card) return;
    card.style.transition = 'opacity 0.3s, transform 0.3s';
    card.style.opacity    = '0';
    card.style.transform  = 'translateX(-20px)';
    setTimeout(() => {
        card.remove();
        const history = getHistory().filter(m => m._timestamp !== ts);
        saveHistory(history);
    }, 300);
}
