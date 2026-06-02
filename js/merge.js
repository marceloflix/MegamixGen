// ── Merge State ──
let mergeMode      = false;
let mergeSelection = [];

function toggleMergeMode() {
    mergeMode = !mergeMode;
    if (!mergeMode) mergeSelection = [];
    const mergeBtn = document.getElementById('btn-merge');
    if (mergeMode) {
        mergeBtn.className = 'px-4 py-2 text-[12px] uppercase font-bold tracking-wider border transition-all bg-[#2a2000] border-[#ffcc00] text-[#ffcc00]';
        mergeBtn.innerHTML = '<i class="fas fa-times mr-1"></i>Cancel';
        document.getElementById('merge-go').classList.remove('hidden');
    } else {
        mergeBtn.className = 'px-4 py-2 text-[12px] uppercase font-bold tracking-wider border transition-all bg-[#0a0a0a] border-[#333] text-[#888]';
        mergeBtn.innerHTML = '<i class="fas fa-layer-group mr-1"></i>Merge';
        document.getElementById('merge-go').classList.add('hidden');
    }
    applyMergeHighlights();
}

function toggleMergeSelect(ts) {
    if (mergeSelection.includes(ts)) mergeSelection = mergeSelection.filter(t => t !== ts);
    else mergeSelection.push(ts);
    applyMergeHighlights();
}

function applyMergeHighlights() {
    document.querySelectorAll('[data-ts]').forEach(card => {
        const ts         = card.getAttribute('data-ts');
        const isSelected = mergeSelection.includes(ts);
        if (mergeMode) {
            card.style.cursor = 'pointer';
            if (isSelected) {
                card.style.borderColor = '#ffcc00';
                card.style.boxShadow   = '0 0 12px rgba(255,204,0,0.3)';
            } else {
                card.style.borderColor = '#39ff14';
                card.style.boxShadow   = '0 0 10px rgba(57,255,20,0.2)';
            }
        } else {
            card.style.cursor      = '';
            card.style.borderColor = '#39ff14';
            card.style.boxShadow   = '0 0 10px rgba(57,255,20,0.2)';
        }
    });
}

function executeMerge() {
    if (mergeSelection.length < 2) { alert('Select at least 2 playlists to merge.'); return; }
    let history    = getHistory();
    const selected = mergeSelection.map(ts => history.find(m => m._timestamp === ts)).filter(Boolean);
    const allTracks = [];
    const seen     = new Set();
    selected.forEach(m => m.tracks.forEach(t => { if (!seen.has(t)) { seen.add(t); allTracks.push(t); } }));
    const merged = {
        title:       selected.map(m => m.title).join(' + '),
        description: `Merged playlist from ${selected.length} playlists (${allTracks.length} unique tracks).`,
        tracks:      allTracks,
        bpm:         selected[0].bpm,
        energy:      Math.round(selected.reduce((s, m) => s + (parseInt(m.energy) || 3), 0) / selected.length),
        genre:       [...new Set(selected.map(m => m.genre).filter(Boolean))].join(', '),
        _prompt:     'Merged: ' + selected.map(m => m._prompt || m.title).join(' + ')
    };
    // Remove source playlists
    history = history.filter(m => !mergeSelection.includes(m._timestamp));
    saveHistory(history);
    renderNewMix(merged, true);
    toggleMergeMode();
}
