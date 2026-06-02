// ── Stats Modal ──
function openStats() {
    const history     = getHistory();
    const totalMixes  = history.length;
    const totalTracks = history.reduce((s, m) => s + (m.tracks?.length || 0), 0);
    const totalMinutes = totalTracks * 4;
    const favCount    = history.filter(m => m._favorite).length;
    const avgEnergy   = totalMixes
        ? (history.reduce((s, m) => s + (parseInt(m.energy) || 3), 0) / totalMixes).toFixed(1)
        : '0';

    // Genre frequency
    const genreCounts = {};
    history.forEach(m => { if (m.genre) genreCounts[m.genre] = (genreCounts[m.genre] || 0) + 1; });
    const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0];

    // Prompt frequency
    const promptCounts = {};
    history.forEach(m => { if (m._prompt) promptCounts[m._prompt] = (promptCounts[m._prompt] || 0) + 1; });
    const topPrompt = Object.entries(promptCounts).sort((a, b) => b[1] - a[1])[0];

    const hours = Math.floor(totalMinutes / 60);
    const mins  = totalMinutes % 60;

    document.getElementById('stats-content').innerHTML = `
        <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="bg-[#050505] border border-[#1a4a1a] p-3 text-center">
                <div class="text-[#39ff14] text-2xl font-bold">${totalMixes}</div>
                <div class="text-[#666] text-[9px] uppercase tracking-widest">Playlists</div>
            </div>
            <div class="bg-[#050505] border border-[#1a4a1a] p-3 text-center">
                <div class="text-[#3399ff] text-2xl font-bold">${totalTracks}</div>
                <div class="text-[#666] text-[9px] uppercase tracking-widest">Total Tracks</div>
            </div>
            <div class="bg-[#050505] border border-[#1a4a1a] p-3 text-center">
                <div class="text-[#ffcc00] text-2xl font-bold">${favCount}</div>
                <div class="text-[#666] text-[9px] uppercase tracking-widest">Favorites</div>
            </div>
            <div class="bg-[#050505] border border-[#1a4a1a] p-3 text-center">
                <div class="text-[#ff9900] text-2xl font-bold">${avgEnergy}</div>
                <div class="text-[#666] text-[9px] uppercase tracking-widest">Avg Energy</div>
            </div>
        </div>
        <div class="space-y-2 text-[11px]">
            <div class="flex justify-between border-b border-[#222] pb-1">
                <span class="text-[#39ff14] font-bold uppercase">Est. Listening Time</span>
                <span class="text-white">${hours > 0 ? hours + 'h ' : ''}${mins}m</span>
            </div>
            <div class="flex justify-between border-b border-[#222] pb-1">
                <span class="text-[#39ff14] font-bold uppercase">Top Genre</span>
                <span class="text-white">${topGenre ? topGenre[0] + ' (' + topGenre[1] + 'x)' : 'N/A'}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-[#39ff14] font-bold uppercase">Top Prompt</span>
                <span class="text-white truncate ml-3" title="${topPrompt ? topPrompt[0] : ''}">${topPrompt ? topPrompt[0] + ' (' + topPrompt[1] + 'x)' : 'N/A'}</span>
            </div>
        </div>
    `;
    document.getElementById('stats-modal').classList.remove('hidden');
}

function closeStats() {
    document.getElementById('stats-modal').classList.add('hidden');
}
