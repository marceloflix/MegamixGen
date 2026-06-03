// ── View & Filter State ──
let currentFilter = 'all';
let currentView   = 'normal';

// ── Expand compact card and scroll to it ──
function expandAndScrollTo(ts) {
    setView('normal');
    requestAnimationFrame(() => {
        const el = document.querySelector(`[data-ts="${ts}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// ── Filter ──
function setFilter(mode) {
    currentFilter = mode;
    document.getElementById('btn-filter-all').className = mode === 'all'
        ? 'px-4 py-2 text-[12px] uppercase font-bold tracking-wider border transition-all bg-[#0a2a0a] border-[#1a7b1a] text-[#39ff14]'
        : 'px-4 py-2 text-[12px] uppercase font-bold tracking-wider border transition-all bg-[#0a0a0a] border-[#333] text-[#888]';
    document.getElementById('btn-filter-fav').className = mode === 'favorites'
        ? 'px-4 py-2 text-[12px] uppercase font-bold tracking-wider border transition-all bg-[#2a2000] border-[#ffcc00] text-[#ffcc00]'
        : 'px-4 py-2 text-[12px] uppercase font-bold tracking-wider border transition-all bg-[#0a0a0a] border-[#333] text-[#888]';
    rebuildFeed();
}

// ── View ──
function setView(mode) {
    currentView = mode;
    document.getElementById('btn-view-normal').className = mode === 'normal'
        ? 'px-4 py-2 text-[12px] uppercase font-bold tracking-wider border transition-all bg-[#0a1a2a] border-[#3399ff] text-[#3399ff]'
        : 'px-4 py-2 text-[12px] uppercase font-bold tracking-wider border transition-all bg-[#0a0a0a] border-[#333] text-[#888]';
    document.getElementById('btn-view-compact').className = mode === 'compact'
        ? 'px-4 py-2 text-[12px] uppercase font-bold tracking-wider border transition-all bg-[#0a1a2a] border-[#3399ff] text-[#3399ff]'
        : 'px-4 py-2 text-[12px] uppercase font-bold tracking-wider border transition-all bg-[#0a0a0a] border-[#333] text-[#888]';
    rebuildFeed();
}

// ── Rebuild Feed ──
function rebuildFeed() {
    const container = document.getElementById('mixes-container');
    container.innerHTML = '';
    let history = getHistory();
    if (currentFilter === 'favorites') history = history.filter(m => m._favorite);

    const searchInput = document.getElementById('history-search');
    const searchTerm  = searchInput ? searchInput.value.trim().toLowerCase() : '';
    if (searchTerm) {
        history = history.filter(m => {
            const haystack = [m.title, m.genre, m._prompt, ...(m.tracks || [])].filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(searchTerm);
        });
    }

    history.slice().reverse().forEach(mix => renderNewMix(mix, false));

    if (container.children.length === 0 && currentFilter === 'favorites') {
        container.innerHTML = '<div class="text-center text-[#555] text-[11px] py-8 uppercase tracking-widest"><i class="fas fa-star mr-2"></i>No favorites yet — star a mix to save it here.</div>';
    } else if (container.children.length === 0 && searchTerm) {
        container.innerHTML = '<div class="text-center text-[#555] text-[11px] py-8 uppercase tracking-widest"><i class="fas fa-search mr-2"></i>No playlists match that search.</div>';
    }

    if (mergeMode) applyMergeHighlights();
}

function filterHistory() { rebuildFeed(); }

// ── Favorite Toggle ──
function toggleFavorite(btn, ts) {
    const history = getHistory();
    const mix     = history.find(m => m._timestamp === ts);
    if (!mix) return;
    mix._favorite = !mix._favorite;
    saveHistory(history);
    const isFav  = mix._favorite;
    btn.innerHTML = isFav ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
    btn.title     = isFav ? 'Remove from favorites' : 'Add to favorites';
    btn.className = isFav
        ? 'text-[#ffcc00] hover:text-white text-[16px] transition-all px-2'
        : 'text-white hover:text-[#ffcc00] text-[16px] transition-all px-2 opacity-70 hover:opacity-100';
    if (currentFilter === 'favorites' && !isFav) rebuildFeed();
}

// ── Build single track row HTML ──
function buildTrackHTML(track, index) {
    const searchQ      = encodeURIComponent(track.replace(' - ', ' '));
    const q            = encodeURIComponent(track);
    const num          = index + 1;
    const trackEscaped = track.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    return `<li class="track-row flex items-center gap-2 py-[5px] border-b border-[#0f1f0f] last:border-0 group" style="box-shadow:inset 0 -1px 0 rgba(57,255,20,0.06)">
        <span class="shrink-0 w-6 h-6 flex items-center justify-center bg-[#111] border border-[#2a2a2a] text-[#555] text-[10px] font-bold group-hover:border-[#39ff14] group-hover:text-[#39ff14] transition-colors">${num}</span>
        <span onclick="copyTrackName(this)" data-track="${trackEscaped}" title="Click to copy" class="text-white text-[15px] leading-tight cursor-pointer select-none flex items-center gap-1 group/track min-w-0">
            <span class="track-name group-hover/track:text-[#ccc] transition-colors">${track}</span>
            <i class="fas fa-clipboard text-[#333] text-[10px] opacity-0 group-hover/track:opacity-100 transition-opacity shrink-0" aria-hidden="true"></i>
        </span>
        <div class="track-actions flex gap-1 shrink-0 ml-auto">
            <button onclick="event.stopPropagation();previewTrack('${trackEscaped}',this)" title="Preview 30s" aria-label="Preview ${track}" class="flex items-center justify-center w-6 h-6 bg-[#001a00] border border-[#005500] text-[#39ff14] text-[13px] opacity-30 group-hover:opacity-100 group-hover:border-[#39ff14] group-hover:bg-[#0a2a0a] group-hover:shadow-[0_0_5px_rgba(57,255,20,0.4)] transition-all"><i class="fas fa-play" aria-hidden="true" style="font-size:9px"></i></button>
            <a href="https://www.youtube.com/results?search_query=${q}" target="_blank" rel="noopener" title="Search YouTube" aria-label="Search ${track} on YouTube" class="flex items-center justify-center w-6 h-6 bg-[#1a0000] border border-[#550000] text-[#ff4444] text-[13px] opacity-30 group-hover:opacity-100 group-hover:border-[#ff4444] group-hover:bg-[#330000] group-hover:shadow-[0_0_5px_rgba(255,68,68,0.4)] transition-all"><i class="fab fa-youtube" aria-hidden="true"></i></a>
            <a href="https://open.spotify.com/search/${searchQ}" target="_blank" rel="noopener" title="Search Spotify" aria-label="Search ${track} on Spotify" class="flex items-center justify-center w-6 h-6 bg-[#001a00] border border-[#005500] text-[#1db954] text-[13px] opacity-30 group-hover:opacity-100 group-hover:border-[#1db954] group-hover:bg-[#003300] group-hover:shadow-[0_0_5px_rgba(29,185,84,0.4)] transition-all"><i class="fab fa-spotify" aria-hidden="true"></i></a>
            <a href="https://monochrome.tf/search/${searchQ}" target="_blank" rel="noopener" title="Search on Monochrome" aria-label="Search ${track} on Monochrome" class="flex items-center justify-center w-6 h-6 bg-[#0d001a] border border-[#2a0055] text-[#bb86fc] opacity-30 group-hover:opacity-100 group-hover:border-[#bb86fc] group-hover:bg-[#1a0033] group-hover:shadow-[0_0_5px_rgba(187,134,252,0.4)] transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="14.75 14.75 70.5 70.5" aria-hidden="true"><g fill="currentColor"><path d="M38.25 14.75H85.25V61.75H61.75V38.25H38.25ZM14.75 38.25H38.25V61.75H61.75V85.25H14.75Z"/></g></svg></a>
        </div>
    </li>`;
}

// ── Render a Mix Card ──
function renderNewMix(data, persist = false) {
    const container  = document.getElementById('mixes-container');
    const ts         = data._timestamp || new Date().toISOString();
    const d          = new Date(ts);
    const currentDate = d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
    const currentTime = d.toLocaleTimeString('en-US', { hour12: false });
    const isFav      = !!data._favorite;
    const isCompact  = currentView === 'compact';
    const starIcon   = isFav ? 'fas fa-star'  : 'far fa-star';
    const starColor  = isFav ? 'text-[#ffcc00] hover:text-white text-[16px] transition-all px-2' : 'text-white hover:text-[#ffcc00] text-[16px] transition-all px-2 opacity-70 hover:opacity-100';
    const starTitle  = isFav ? 'Remove from favorites' : 'Add to favorites';

    // Energy dots (1–5)
    const energyLevel = Math.min(5, Math.max(1, parseInt(data.energy) || 3));
    const dotColors   = ['#39ff14', '#39ff14', '#ffcc00', '#ff9900', '#ff3333'];
    const energyDots  = Array.from({ length: 5 }, (_, i) => {
        const color = i < energyLevel ? dotColors[Math.min(i, energyLevel - 1)] : '#2a2a2a';
        return `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${color};margin-right:2px;vertical-align:middle"></span>`;
    }).join('');

    const bodyHTML = isCompact ? '' : `
        <div class="mix-datebar bg-[#050f05] text-right px-2 py-[2px] mix-title-date border-b border-[#1a4a1a] text-[#39ff14] uppercase tracking-wider">
            ${currentDate} @ ${currentTime}
        </div>
        <div class="mix-body panel-content flex flex-col gap-4">
            <div class="details-box">
                <div class="flex items-center justify-between flex-wrap gap-x-4 gap-y-1">
                    <span class="text-[#39ff14] font-bold text-[10px] uppercase tracking-wider">Diagnostics</span>
                    <span class="flex items-center gap-3 flex-wrap">
                        <span><span class="text-[#39ff14] text-[10px] font-semibold mr-1">Tracks</span><span class="text-white font-bold text-[11px]">${data.tracks.length}</span></span>
                        <span><span class="text-[#39ff14] text-[10px] font-semibold mr-1">BPM</span><span class="text-white text-[11px]">${data.bpm}</span></span>
                        <span><span class="text-[#39ff14] text-[10px] font-semibold mr-1">Energy</span><span>${energyDots}</span></span>
                        <span><span class="text-[#39ff14] text-[10px] font-semibold mr-1">Est.</span><span class="text-white text-[11px]">~${data.tracks.length * 4}m</span></span>
                        <span><span class="text-[#39ff14] text-[10px] font-semibold mr-1">Genre</span><span class="text-white text-[11px]">${data.genre}</span></span>
                    </span>
                </div>
            </div>
            <div class="flex flex-col gap-4">
            <div class="flex-1 flex flex-col justify-between">
                <div class="text-[#b0b0b0] text-[12px]">
                    ${data._prompt ? `<p class="mb-2 flex items-start gap-2 text-[11px]"><span class="shrink-0 text-[#39ff14] uppercase font-bold tracking-wider mt-[1px]">Prompt</span><span class="text-white">${data._prompt}</span></p>` : ''}
                    ${data.description ? `<p class="mb-3 text-[11px] text-white italic border-l-2 border-[#1a4a1a] pl-2">${data.description}</p>` : ''}
                    <div class="bg-[#050505] border border-[#1a4a1a] p-2">
                        <div class="text-[#1a7b1a] text-[9px] uppercase font-bold border-b border-[#111] mb-2 pb-1 flex items-center justify-between">
                            <span>Tracklist Sequence</span>
                            <span class="text-[#3399ff]"><i class="fas fa-list-ul"></i></span>
                        </div>
                        <ul class="tracklist-grid mt-1 list-none !pl-0 gap-x-2" style="display:grid;grid-template-columns:repeat(${data.tracks.length <= 10 ? 1 : 2},1fr)">
                            ${data.tracks.map((t, i) => buildTrackHTML(t, i)).join('')}
                        </ul>
                        <div class="mt-3 pt-2 border-t border-[#111] flex flex-wrap justify-end gap-2">
                            <button onclick="openAllMonochrome(this)" data-tracks="${encodeURIComponent(data.tracks.join('\n'))}"
                                    class="bg-[#111] hover:bg-[#1a0033] text-[#bb86fc] border border-[#2a0055] px-3 py-1 rounded text-[10px] uppercase font-bold transition-colors shadow-[0_0_5px_rgba(187,134,252,0.2)]" aria-label="Open all tracks in Monochrome">
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="14.75 14.75 70.5 70.5" class="inline mr-1" style="vertical-align:-1px" aria-hidden="true"><g fill="currentColor"><path d="M38.25 14.75H85.25V61.75H61.75V38.25H38.25ZM14.75 38.25H38.25V61.75H61.75V85.25H14.75Z"/></g></svg>Open All
                            </button>
                            <button onclick="exportPlaylist(this)" data-title="${data.title.replace(/"/g, '&quot;')}" data-tracks="${encodeURIComponent(data.tracks.join('\n'))}"
                                    class="bg-[#111] hover:bg-[#222] text-[#39ff14] border border-[#1a7b1a] px-3 py-1 rounded text-[10px] uppercase font-bold transition-colors shadow-[0_0_5px_rgba(57,255,20,0.2)]">
                                <i class="fas fa-download mr-1" aria-hidden="true"></i> Export .txt
                            </button>
                            <button onclick="copyTracks(this)" data-tracks="${encodeURIComponent(data.tracks.join('\n'))}"
                                    class="bg-[#111] hover:bg-[#222] text-[#3399ff] border border-[#3399ff] px-3 py-1 rounded text-[10px] uppercase font-bold transition-colors shadow-[0_0_5px_rgba(51,153,255,0.2)]">
                                <i class="fas fa-copy mr-1" aria-hidden="true"></i> Copy Tracks
                            </button>
                            <button onclick="refineMix('${ts}')" title="Refine this playlist with AI"
                                    class="bg-[#111] hover:bg-[#1a1a00] text-[#ffcc00] border border-[#554400] px-3 py-1 rounded text-[10px] uppercase font-bold transition-colors shadow-[0_0_5px_rgba(255,204,0,0.15)]">
                                <i class="fas fa-magic mr-1" aria-hidden="true"></i> Refine
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>`;

    const mixHTML = `
        <div class="panel group/card border border-[#39ff14] shadow-[0_0_10px_rgba(57,255,20,0.2)] transition-all duration-300 animate-fade-in-down${isCompact ? ' mix-card-compact' : ''}" data-ts="${ts}" onclick="if(mergeMode){event.stopPropagation();toggleMergeSelect('${ts}')}">
            <div class="panel-header bg-gradient-to-b from-[#1a4a1a] to-[#0a2a0a] border-[#1a7b1a] flex items-center justify-between${isCompact ? ' cursor-pointer' : ''}" ${isCompact && !mergeMode ? `onclick="expandAndScrollTo('${ts}')" title="Click to expand"` : ''}>
                <div class="text-sm flex items-center gap-2 min-w-0">
                    <i class="fas fa-magic text-[#39ff14] shrink-0"></i>
                    <span class="truncate">${data.title}</span>
                    ${isCompact ? `<span class="text-white text-[10px] shrink-0">${data.tracks.length} tracks &bull; ${currentDate}</span>` : ''}
                </div>
                <div class="flex items-center gap-1 shrink-0">
                    <button onclick="event.stopPropagation();toggleFavorite(this, '${ts}')" title="${starTitle}"
                            class="${starColor} text-[13px] transition-colors px-1 shrink-0">
                        <i class="${starIcon}"></i>
                    </button>
                    <button onclick="event.stopPropagation();deleteMix(this, '${ts}')" title="Delete this mix"
                            class="text-white hover:text-[#ff3333] text-[11px] transition-all px-1 shrink-0 hover:drop-shadow-[0_0_4px_rgba(255,51,51,0.5)]">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            ${bodyHTML}
        </div>
    `;

    const template = document.createElement('template');
    template.innerHTML = mixHTML.trim();
    container.insertBefore(template.content.firstChild, container.firstChild);

    if (persist) {
        const history    = getHistory();
        data._timestamp  = ts;
        history.unshift(data);
        if (history.length > 50) history.length = 50;
        saveHistory(history);
    }
}
