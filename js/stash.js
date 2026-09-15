// ── SoundHunt: Download Stash System ──
// Stores keeper tracks for batch downloading via Monochrome and streaming on Spotify.

const STASH_KEY = 'soundhunt_download_stash';

function getStash() {
    try {
        const raw = localStorage.getItem(STASH_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveStash(items) {
    try {
        localStorage.setItem(STASH_KEY, JSON.stringify(items));
    } catch (e) {
        console.error('Error saving stash to localStorage:', e);
    }
    updateStashBadge();
}

function cleanQuery(str) {
    return (str || '').replace(/\s*[\(\[\{].*?[\)\]\}]/g, '').trim() || (str || '').trim();
}

function isStashed(artist, title) {
    const cleanA = (artist || '').trim().toLowerCase();
    const cleanT = (title || '').trim().toLowerCase();
    const stash = getStash();
    return stash.some(item => 
        (item.artist || '').trim().toLowerCase() === cleanA &&
        (item.title || '').trim().toLowerCase() === cleanT
    );
}

function toggleStashTrack(track, btn) {
    if (!track) return;
    const artist = typeof track === 'object' ? (track.artist || '') : '';
    const title = typeof track === 'object' ? (track.title || '') : (track || '');
    if (!title && !artist) return;

    let stash = getStash();
    const alreadyStashed = isStashed(artist, title);

    if (alreadyStashed) {
        stash = stash.filter(item => !(
            (item.artist || '').trim().toLowerCase() === artist.trim().toLowerCase() &&
            (item.title || '').trim().toLowerCase() === title.trim().toLowerCase()
        ));
        saveStash(stash);
        if (btn) updateStarButtonUI(btn, false);
        showStashToast(`Removed from Stash: ${artist ? artist + ' - ' : ''}${title}`);
    } else {
        const newItem = {
            artist: artist.trim(),
            title: title.trim(),
            addedAt: Date.now()
        };
        stash.unshift(newItem);
        saveStash(stash);
        if (btn) updateStarButtonUI(btn, true);
        showStashToast(`★ Added to Stash! Grab on Monochrome anytime.`);
    }

    // Update all matching star buttons currently rendered on screen
    updateAllMatchingStarButtons(artist, title, !alreadyStashed);

    // If drawer is open, re-render immediately
    const drawer = document.getElementById('stash-drawer');
    if (drawer && !drawer.classList.contains('translate-x-full')) {
        renderStash();
    }
}

function updateStarButtonUI(btn, active) {
    if (!btn) return;
    if (active) {
        btn.classList.add('text-[#ffcc00]', 'border-[#ffcc00]', 'bg-[#2a2200]', 'shadow-[0_0_8px_rgba(255,204,0,0.5)]');
        btn.classList.remove('text-[#555]', 'border-[#2a2a2a]', 'bg-[#111]');
        btn.title = 'In Download Stash (Click to remove)';
    } else {
        btn.classList.remove('text-[#ffcc00]', 'border-[#ffcc00]', 'bg-[#2a2200]', 'shadow-[0_0_8px_rgba(255,204,0,0.5)]');
        btn.classList.add('text-[#555]', 'border-[#2a2a2a]', 'bg-[#111]');
        btn.title = 'Save to Download Stash';
    }
}

function updateAllMatchingStarButtons(artist, title, active) {
    const cleanA = (artist || '').trim().toLowerCase();
    const cleanT = (title || '').trim().toLowerCase();
    document.querySelectorAll('.stash-star-btn').forEach(btn => {
        const bArtist = (btn.dataset.artist || '').trim().toLowerCase();
        const bTitle = (btn.dataset.title || '').trim().toLowerCase();
        if (bArtist === cleanA && bTitle === cleanT) {
            updateStarButtonUI(btn, active);
        }
    });
}

function updateStashBadge() {
    const stash = getStash();
    const badge = document.getElementById('stash-count-badge');
    if (badge) {
        badge.textContent = stash.length;
        if (stash.length > 0) {
            badge.classList.remove('bg-[#333]', 'text-[#888]');
            badge.classList.add('bg-[#ffcc00]', 'text-black', 'font-black');
        } else {
            badge.classList.remove('bg-[#ffcc00]', 'text-black', 'font-black');
            badge.classList.add('bg-[#333]', 'text-[#888]');
        }
    }
}

function openStashDrawer() {
    const drawer = document.getElementById('stash-drawer');
    const overlay = document.getElementById('stash-overlay');
    if (!drawer) return;
    renderStash();
    drawer.classList.remove('translate-x-full');
    if (overlay) overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeStashDrawer() {
    const drawer = document.getElementById('stash-drawer');
    const overlay = document.getElementById('stash-overlay');
    if (!drawer) return;
    drawer.classList.add('translate-x-full');
    if (overlay) overlay.classList.add('hidden');
    document.body.style.overflow = '';
}

function renderStash() {
    const container = document.getElementById('stash-content');
    if (!container) return;

    const stash = getStash();
    if (stash.length === 0) {
        container.innerHTML = `
            <div class="py-12 px-4 text-center text-[#666]">
                <i class="fas fa-box-open text-3xl text-[#444] mb-3"></i>
                <h4 class="text-white font-bold text-sm uppercase tracking-wider mb-1">Your Stash is Empty</h4>
                <p class="text-[11px] max-w-xs mx-auto leading-relaxed">
                    While exploring songs, click the <span class="text-[#ffcc00] font-bold">★ star</span> on any track to save it here. You can then download it in one click via <span class="text-[#bb86fc] font-bold">Monochrome</span>.
                </p>
            </div>`;
        return;
    }

    let html = `
        <div class="flex justify-between items-center pb-2 border-b border-[#222] mb-3">
            <span class="text-[10px] text-[#888] uppercase font-bold tracking-wider">${stash.length} Keeper${stash.length > 1 ? 's' : ''} Stashed</span>
            <button onclick="clearStash(this)" class="text-[#ff4444] hover:text-[#ff6666] text-[9.5px] uppercase font-bold transition-colors cursor-pointer">
                <i class="fas fa-trash-alt mr-1"></i> Clear Stash
            </button>
        </div>
        <div class="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
    `;

    stash.forEach((item, idx) => {
        const fullTitle = item.artist ? `${item.artist} - ${item.title}` : item.title;
        const searchQ = encodeURIComponent(`${cleanQuery(item.artist)} ${cleanQuery(item.title)}`.trim());
        const artistEscaped = (item.artist || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const titleEscaped = (item.title || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');

        html += `
            <div class="bg-[#0a0a0a] border border-[#1f3a1f] p-2.5 flex items-center justify-between gap-2 hover:border-[#39ff14] transition-all group">
                <div class="min-w-0 flex-1">
                    <div class="text-white text-[12px] font-bold truncate leading-tight group-hover:text-[#39ff14] transition-colors" title="${fullTitle}">${fullTitle}</div>
                    <div class="flex items-center gap-1 mt-0.5">
                        <span class="text-[#3399ff] text-[9px] font-mono uppercase tracking-wider">SoundHunt Crate</span>
                        <span class="text-[#555] text-[9px] ml-auto">#${idx + 1}</span>
                    </div>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                    <!-- Monochrome Download -->
                    <a href="https://monochrome.tf/search/${searchQ}" target="_blank" rel="noopener noreferrer"
                       title="Download on Monochrome" aria-label="Download on Monochrome"
                       class="flex items-center justify-center w-7 h-7 bg-[#1a0033] border border-[#5500aa] text-[#bb86fc] hover:border-[#bb86fc] hover:bg-[#2a0055] hover:shadow-[0_0_8px_rgba(187,134,252,0.5)] transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="14.75 14.75 70.5 70.5" aria-hidden="true">
                            <g fill="currentColor"><path d="M38.25 14.75H85.25V61.75H61.75V38.25H38.25ZM14.75 38.25H38.25V61.75H61.75V85.25H14.75Z"/></g>
                        </svg>
                    </a>
                    <!-- Remove from Stash -->
                    <button onclick="toggleStashTrack({ artist: '${artistEscaped}', title: '${titleEscaped}' })"
                            title="Remove from Stash" aria-label="Remove from Stash"
                            class="flex items-center justify-center w-7 h-7 bg-[#1a1a1a] border border-[#333] text-[#777] hover:border-[#ff4444] hover:text-[#ff4444] hover:bg-[#2a0000] transition-all cursor-pointer">
                        <i class="fas fa-times text-xs"></i>
                    </button>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
}

function clearStash(btn) {
    if (btn) {
        const badge = '<span class="text-[9.5px] font-extrabold uppercase text-[#ff3333] bg-[#220000] border border-[#ff3333] px-1.5 py-[1px] rounded shadow-[0_0_6px_rgba(255,51,51,0.6)] pointer-events-none">Clear all?</span>';
        if (typeof armConfirmButton === 'function') {
            if (armConfirmButton(btn, badge, 'Click again to clear stash', typeof DEFAULT_CONFIRM_TIMEOUT_MS !== 'undefined' ? DEFAULT_CONFIRM_TIMEOUT_MS : 8000)) {
                return;
            }
        }
    } else if (typeof confirm === 'function') {
        if (!confirm('Clear all stashed tracks?')) return;
    }

    saveStash([]);
    renderStash();
    // Reset star icons in DOM
    document.querySelectorAll('.stash-star-btn').forEach(btn => {
        updateStarButtonUI(btn, false);
    });
    showStashToast('Stash cleared');
}

function showStashToast(msg) {
    let toast = document.getElementById('soundhunt-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'soundhunt-toast';
        toast.className = 'fixed bottom-4 right-4 z-50 bg-[#0a0a0a] border border-[#39ff14] text-[#39ff14] px-4 py-2 text-[11px] font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(57,255,20,0.3)] transition-opacity duration-300 opacity-0 pointer-events-none flex items-center gap-2';
        document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="fas fa-sparkles text-xs"></i> ${msg}`;
    toast.classList.remove('opacity-0', 'pointer-events-none');
    toast.classList.add('opacity-100');

    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.classList.remove('opacity-100');
        toast.classList.add('opacity-0', 'pointer-events-none');
    }, 2500);
}

// Initial badge update on load
document.addEventListener('DOMContentLoaded', () => {
    updateStashBadge();
});
