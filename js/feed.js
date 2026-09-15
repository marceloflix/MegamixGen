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
    if (!container) return;
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
        container.innerHTML = '<div class="text-center text-[#555] text-[11px] py-8 uppercase tracking-widest"><i class="fas fa-star mr-2"></i>No favorites yet — star a playlist to save it here.</div>';
    } else if (container.children.length === 0 && searchTerm) {
        container.innerHTML = '<div class="text-center text-[#555] text-[11px] py-8 uppercase tracking-widest"><i class="fas fa-search mr-2"></i>No playlists match that search.</div>';
    }

    if (typeof mergeMode !== 'undefined' && mergeMode && typeof applyMergeHighlights === 'function') {
        applyMergeHighlights();
    }
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

// ── Highlight Track ──
function highlightTrack(ts, index) {
    const el = document.getElementById(`track-${ts}-${index}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.style.backgroundColor = '#1a3a1a';
    setTimeout(() => { el.style.backgroundColor = 'transparent'; }, 1500);
}

// ── Track string helper ──
function getTrackString(t) {
    if (!t) return '';
    return typeof t === 'string' ? t : `${t.artist} - ${t.title}`;
}

// ── Build single track row HTML ──
function buildTrackHTML(track, index, ts, allTracks = []) {
    const isObj = typeof track === 'object' && track !== null;
    const trackStr = getTrackString(track);
    const cleanA = (isObj && track.artist ? track.artist : '').replace(/\s*[\(\[\{].*?[\)\]\}]/g, '').trim();
    const cleanT = (isObj && track.title ? track.title : (trackStr.includes(' - ') ? trackStr.split(' - ').slice(1).join(' - ') : trackStr)).replace(/\s*[\(\[\{].*?[\)\]\}]/g, '').trim();
    const searchQ = encodeURIComponent(`${cleanA} ${cleanT}`.trim() || trackStr);
    const q = encodeURIComponent(trackStr);
    const num = index + 1;
    const trackEscaped = trackStr.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const artistEscaped = (isObj && track.artist ? track.artist : (trackStr.includes(' - ') ? trackStr.split(' - ')[0] : '')).replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const titleEscaped = (isObj && track.title ? track.title : (trackStr.includes(' - ') ? trackStr.split(' - ').slice(1).join(' - ') : trackStr)).replace(/'/g, "\\'").replace(/"/g, '&quot;');

    const inStash = typeof isStashed === 'function' ? isStashed(artistEscaped, titleEscaped) : false;
    const starClass = inStash
        ? 'text-[#ffcc00] border-[#ffcc00] bg-[#2a2200] shadow-[0_0_8px_rgba(255,204,0,0.5)]'
        : 'text-[#aaa] border-[#333] bg-[#111] hover:text-[#ffcc00] hover:border-[#ffcc00]';
    const starTitle = inStash ? 'In Download Stash (Click to remove)' : 'Save to Download Stash';

    return `<li id="track-${ts}-${index}" class="track-row flex items-center gap-1.5 py-[3px] border-b border-[#0f1f0f] last:border-0 group transition-colors duration-500 overflow-hidden" style="box-shadow:inset 0 -1px 0 rgba(57,255,20,0.06); background-color: transparent;">
        <!-- Track Prune Button -->
        <button onclick="event.stopPropagation();removeTrackFromMix('${ts}', ${index}, this)" title="Remove track from list" aria-label="Remove track" class="shrink-0 w-6 h-6 flex items-center justify-center bg-[#111] border border-[#333] text-[#aaa] hover:border-[#ff3333] hover:text-[#ff3333] hover:bg-[#220000] text-[9px] font-bold transition-all cursor-pointer">
            <i class="fas fa-times"></i>
        </button>

        <span class="shrink-0 w-6 h-6 flex items-center justify-center bg-[#111] border border-[#333] text-white text-[10px] font-bold group-hover:border-[#39ff14] group-hover:text-[#39ff14] transition-colors">${num}</span>

        <!-- Track Title -->
        <span onclick="copyTrackName(this)" data-track="${trackEscaped}" title="Click to copy: ${trackEscaped}" class="track-title-wrapper text-white text-[15px] leading-tight cursor-pointer select-none flex items-center min-w-0 flex-1 overflow-hidden mr-1">
            <span class="track-name truncate group-hover/track:text-[#ccc] transition-colors">${trackStr}</span>
            <i class="fas fa-clipboard text-[#333] text-[9px] opacity-0 group-hover/track:opacity-100 transition-opacity shrink-0 ml-1" aria-hidden="true"></i>
        </span>

        <!-- Track Actions Line -->
        <div class="track-actions flex gap-1 shrink-0 ml-1 items-center">
            <!-- 1. Preview 30s (First) -->
            <button onclick="event.stopPropagation();previewTrack('${trackEscaped}',this)" title="Preview 30s" aria-label="Preview ${trackStr}" class="flex items-center justify-center w-6 h-6 bg-[#001a00] border border-[#005500] text-[#39ff14] text-[13px] opacity-75 group-hover:opacity-100 hover:border-[#39ff14] hover:bg-[#0a2a0a] hover:shadow-[0_0_5px_rgba(57,255,20,0.4)] transition-all cursor-pointer"><i class="fas fa-play" aria-hidden="true" style="font-size:9px"></i></button>

            <!-- 2. Streaming & Download Links -->
            <a href="https://www.youtube.com/results?search_query=${q}" target="_blank" rel="noopener noreferrer" title="Search YouTube" aria-label="Search ${trackStr} on YouTube" class="flex items-center justify-center w-6 h-6 bg-[#1a0000] border border-[#550000] text-[#ff4444] text-[13px] opacity-75 group-hover:opacity-100 hover:border-[#ff4444] hover:bg-[#330000] hover:shadow-[0_0_5px_rgba(255,68,68,0.4)] transition-all"><i class="fab fa-youtube" aria-hidden="true"></i></a>
            <a href="https://open.spotify.com/search/${searchQ}" target="_blank" rel="noopener noreferrer" title="Search Spotify" aria-label="Search ${trackStr} on Spotify" class="flex items-center justify-center w-6 h-6 bg-[#001a00] border border-[#005500] text-[#1db954] text-[13px] opacity-75 group-hover:opacity-100 hover:border-[#1db954] hover:bg-[#003300] hover:shadow-[0_0_5px_rgba(29,185,84,0.4)] transition-all"><i class="fab fa-spotify" aria-hidden="true"></i></a>
            <a href="https://monochrome.tf/search/${searchQ}" target="_blank" rel="noopener noreferrer" title="Download on Monochrome" aria-label="Search ${trackStr} on Monochrome" class="flex items-center justify-center w-6 h-6 bg-[#0d001a] border border-[#2a0055] text-[#bb86fc] opacity-75 group-hover:opacity-100 hover:border-[#bb86fc] hover:bg-[#1a0033] hover:shadow-[0_0_5px_rgba(187,134,252,0.4)] transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="14.75 14.75 70.5 70.5" aria-hidden="true"><g fill="currentColor"><path d="M38.25 14.75H85.25V61.75H61.75V38.25H38.25ZM14.75 38.25H38.25V61.75H61.75V85.25H14.75Z"/></g></svg></a>

            <!-- Spacing divider -->
            <span class="w-[1px] h-3.5 bg-[#222] mx-1 shrink-0"></span>

            <!-- 3. Dig Deeper (Magnifying Glass) -->
            <button onclick="event.stopPropagation();openDigDeeperModal('${ts}', ${index}, '${artistEscaped}','${titleEscaped}')" title="Dig Deeper: Find tracks similar to ${trackStr}" aria-label="Find tracks similar to ${trackStr}" class="shrink-0 flex items-center justify-center w-6 h-6 bg-[#001428] border border-[#003366] text-[#3399ff] hover:border-[#3399ff] hover:bg-[#002244] hover:shadow-[0_0_6px_rgba(51,153,255,0.4)] text-[10px] transition-all cursor-pointer">
                <i class="fas fa-search"></i>
            </button>

            <!-- 4. Save to Download Stash (End) -->
            <button onclick="event.stopPropagation();toggleStashTrack({ artist: '${artistEscaped}', title: '${titleEscaped}' }, this)" data-artist="${artistEscaped}" data-title="${titleEscaped}" title="${starTitle}" aria-label="${starTitle}" class="stash-star-btn shrink-0 flex items-center justify-center w-6 h-6 border ${starClass} text-[11px] transition-all cursor-pointer">
                <i class="fas fa-star"></i>
            </button>
        </div>
    </li>`;
}

// ── Render Tracklist in 10-Track Columns / Blocks ──
function renderTracklistBlocks(tracks, ts) {
    if (!Array.isArray(tracks) || tracks.length === 0) return '';

    const blockSize = 20;
    const blocks = [];

    for (let b = 0; b < tracks.length; b += blockSize) {
        const chunk = tracks.slice(b, b + blockSize);
        // For 10 or fewer tracks, split evenly
        // For more than 10 tracks, first 10 go to left column, remaining up to 10 go to right column
        const half = chunk.length <= 10 ? Math.ceil(chunk.length / 2) : 10;
        const leftTracks = chunk.slice(0, half);
        const rightTracks = chunk.slice(half);

        blocks.push({
            left: leftTracks.map((t, i) => ({ track: t, index: b + i })),
            right: rightTracks.map((t, i) => ({ track: t, index: b + half + i }))
        });
    }

    return blocks.map((block, bIdx) => `
        <div class="tracklist-block grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0 ${bIdx > 0 ? 'mt-2 pt-2 border-t border-[#111]' : ''}">
            <ul class="tracklist-col flex flex-col list-none p-0 m-0">
                ${block.left.map(item => buildTrackHTML(item.track, item.index, ts, tracks)).join('')}
            </ul>
            <ul class="tracklist-col flex flex-col list-none p-0 m-0">
                ${block.right.map(item => buildTrackHTML(item.track, item.index, ts, tracks)).join('')}
            </ul>
        </div>
    `).join('');
}

// ── Render a Mix Card ──
function renderNewMix(data, persist = false) {
    const container  = document.getElementById('mixes-container');
    if (!container) return;
    const ts         = data._timestamp || new Date().toISOString();
    data._timestamp  = ts;

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
                    <span class="flex items-center gap-3.5 flex-wrap py-1">
                        <span><span class="text-[#39ff14] text-[10px] font-semibold mr-1">Tracks</span><span class="text-white font-bold text-[11px] diag-track-count">${data.tracks.length}</span></span>
                        <span><span class="text-[#39ff14] text-[10px] font-semibold mr-1">Energy</span><span>${energyDots}</span></span>
                        <span><span class="text-[#39ff14] text-[10px] font-semibold mr-1">Est.</span><span class="text-white text-[11px]">~${data.tracks.length * 4}m</span></span>
                        <span><span class="text-[#39ff14] text-[10px] font-semibold mr-1">Genre</span><span class="text-white text-[11px]">${data.genre || 'Music Discovery'}</span></span>
                    </span>
                </div>
            </div>
            <div class="flex flex-col gap-4">
                <div class="flex-1 flex flex-col justify-between">
                    <div class="text-[#b0b0b0] text-[12px]">
                        ${data._prompt ? `<p class="mb-2 flex items-start gap-2 text-[11px]"><span class="shrink-0 text-[#39ff14] uppercase font-bold tracking-wider mt-[1px]">Prompt</span><span class="text-white">${data._prompt}</span></p>` : ''}
                        ${data.description ? `<p class="mb-3 text-[11px] text-white italic border-l-2 border-[#1a4a1a] pl-2">${data.description}</p>` : ''}
                        <div class="bg-[#050505] border border-[#1a4a1a] p-2">
                            ${renderTracklistBlocks(data.tracks, ts)}
                            <div class="mt-3 pt-2 border-t border-[#111] flex flex-wrap justify-end gap-2 items-center">
                                <button onclick="createSpotifyPlaylist('${ts}', this)"
                                        title="Send this curated list directly to Spotify"
                                        class="spotify-create-btn bg-[#002b00] hover:bg-[#004d00] text-[#1db954] hover:text-white border border-[#1db954] px-3 py-1 rounded text-[10px] uppercase font-bold transition-all shadow-[0_0_8px_rgba(29,185,84,0.25)] flex items-center cursor-pointer">
                                    <i class="fab fa-spotify mr-1.5 text-[12px]"></i> Create Spotify Playlist
                                </button>
                                <button onclick="refineMix('${ts}')" title="Refine this playlist with AI"
                                        class="bg-[#111] hover:bg-[#1a1a00] text-[#ffcc00] border border-[#554400] px-3 py-1 rounded text-[10px] uppercase font-bold transition-colors shadow-[0_0_5px_rgba(255,204,0,0.15)] flex items-center cursor-pointer">
                                    <i class="fas fa-magic mr-1"></i> Refine
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

    const mixHTML = `
        <div class="panel group/card border border-[#39ff14] shadow-[0_0_10px_rgba(57,255,20,0.2)] transition-all duration-300 animate-fade-in-down${isCompact ? ' mix-card-compact' : ''}" data-ts="${ts}" onclick="if(typeof mergeMode !== 'undefined' && mergeMode){event.stopPropagation();toggleMergeSelect('${ts}')}">
            <div class="panel-header bg-gradient-to-b from-[#1a4a1a] to-[#0a2a0a] border-[#1a7b1a] flex items-center justify-between${isCompact ? ' cursor-pointer' : ''}" ${isCompact && (typeof mergeMode === 'undefined' || !mergeMode) ? `onclick="expandAndScrollTo('${ts}')" title="Click to expand"` : ''}>
                <div class="text-sm flex items-center gap-2 min-w-0">
                    <i class="fas fa-compact-disc text-[#39ff14] shrink-0"></i>
                    <span class="truncate font-bold">${data.title}</span>
                    ${isCompact ? `<span class="text-white text-[10px] shrink-0">${data.tracks.length} tracks &bull; ${currentDate}</span>` : ''}
                </div>
                <div class="flex items-center gap-1 shrink-0">
                    <button onclick="event.stopPropagation();toggleFavorite(this, '${ts}')" title="${starTitle}"
                            class="${starColor} text-[13px] transition-colors px-1 shrink-0">
                        <i class="${starIcon}"></i>
                    </button>
                    <button onclick="event.stopPropagation();deleteMix(this, '${ts}')" title="Delete this playlist"
                            class="text-white hover:text-[#ff3333] text-[11px] transition-all px-1.5 py-0.5 shrink-0 hover:drop-shadow-[0_0_4px_rgba(255,51,51,0.5)] cursor-pointer">
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
