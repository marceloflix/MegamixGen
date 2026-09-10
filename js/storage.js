// ── Dedicated AI Engine ──
const GEMINI_MODEL = 'gemini-3.5-flash-lite';

// ── Storage Keys ──
const STORAGE_KEYS = {
    apiKey:     'megamix_api_key',
    model:      'megamix_model',
    history:    'megamix_history',
    prompts:    'megamix_prompts',
    textSize:   'megamix_text_size',
    autoScroll: 'megamix_auto_scroll',
    promptPersona: 'megamix_prompt_persona',
    promptConstraints: 'megamix_prompt_constraints',
    promptExplicit: 'megamix_prompt_explicit',
    promptPopularity: 'megamix_prompt_popularity',
    songDatabase: 'megamix_song_ground_truth',
    musicApiKey:  'megamix_music_api_key'
};

const DEFAULT_PROMPT = {
    persona: "a knowledgeable music curator",
    constraints: "Strictly adhere to any specified era, decade, or release timeframe. Choose tracks that genuinely fit the request — matching era, tempo, mood, and sonic character.",
    explicit: "allow", // 'allow' or 'clean'
    popularity: "any" // 'any', 'mainstream', 'obscure'
};

// ── Prompt History ──
function getPromptHistory() {
    try {
        let prompts = JSON.parse(localStorage.getItem(STORAGE_KEYS.prompts)) || [];
        if (prompts.length > 10) {
            prompts = prompts.slice(0, 10);
            localStorage.setItem(STORAGE_KEYS.prompts, JSON.stringify(prompts));
        }
        return prompts;
    }
    catch { return []; }
}

function savePrompt(prompt) {
    if (!prompt) return;
    let prompts = getPromptHistory().filter(p => p !== prompt);
    prompts.unshift(prompt);
    if (prompts.length > 10) prompts.length = 10;
    localStorage.setItem(STORAGE_KEYS.prompts, JSON.stringify(prompts));
    populatePromptDatalist();
}

function populatePromptDatalist() {
    // kept as no-op for backward compat
}

function togglePromptHistory() {
    const dropdown = document.getElementById('prompt-history-dropdown');
    if (!dropdown.classList.contains('hidden')) {
        dropdown.classList.add('hidden');
        return;
    }
    const history = getPromptHistory();
    if (history.length === 0) {
        dropdown.innerHTML = '<div class="px-3 py-2 text-[#555] text-[11px] italic">No prompt history yet.</div>';
    } else {
        dropdown.innerHTML = history.map(p =>
            `<div class="prompt-history-item px-3 py-2 text-[#ccc] text-[12px] cursor-pointer hover:bg-[#1a4a1a] hover:text-[#39ff14] transition-colors border-b border-[#111] last:border-0" onclick="selectPromptHistory(this)" data-prompt="${p.replace(/"/g, '&quot;')}">${p}</div>`
        ).join('');
    }
    dropdown.classList.remove('hidden');
}

function selectPromptHistory(el) {
    document.getElementById('ai-vibe').value = el.dataset.prompt;
    document.getElementById('prompt-history-dropdown').classList.add('hidden');
    document.getElementById('ai-vibe').focus();
}

function updatePromptSuggestions() {
    // no-op, replaced by manual dropdown
}

// Close history dropdown when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('prompt-history-dropdown');
    const btn = document.getElementById('prompt-history-btn');
    if (!dropdown || !btn) return;
    if (!dropdown.classList.contains('hidden') && !dropdown.contains(e.target) && !btn.contains(e.target)) {
        dropdown.classList.add('hidden');
    }
});

// ── API Key & Model ──
function getApiKey() {
    return localStorage.getItem(STORAGE_KEYS.apiKey) || '';
}

function getMusicApiKey() {
    return localStorage.getItem(STORAGE_KEYS.musicApiKey) || '';
}

function saveMusicApiKey(key) {
    if (key) localStorage.setItem(STORAGE_KEYS.musicApiKey, key.trim());
    else localStorage.removeItem(STORAGE_KEYS.musicApiKey);
}

// ── Local Song Database (Zero API Saturation) ──
function normalizeSongKey(artist, title) {
    if (!artist || !title) return '';
    const cleanStr = (s) => (s || '')
        .toLowerCase()
        .replace(/\b(the|a|an)\b/gi, '')
        .replace(/[\(\[\{].*?[\)\]\}]/g, '') // strip (feat. ...), [remastered], etc.
        .replace(/[^a-z0-9]/g, '')
        .trim();
    return `${cleanStr(artist)}:::${cleanStr(title)}`;
}

function getSongDatabase() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.songDatabase);
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

function lookupSongInDatabase(artist, title) {
    const key = normalizeSongKey(artist, title);
    if (!key) return null;
    const db = getSongDatabase();
    return db[key] || null;
}

function saveSongToDatabase(artist, title, data) {
    if (!artist || !title || !data || !data.bpm || !data.key) return;
    const key = normalizeSongKey(artist, title);
    if (!key) return;
    try {
        const db = getSongDatabase();
        db[key] = {
            bpm: parseInt(data.bpm, 10),
            key: data.key,
            musicalKey: data.musicalKey || 'Standard Scale',
            source: data.source || 'api',
            databaseName: data.databaseName || 'GetSongBPM API',
            verified: true,
            timestamp: Date.now()
        };
        localStorage.setItem(STORAGE_KEYS.songDatabase, JSON.stringify(db));
    } catch (e) {
        console.warn('Failed to save track to local database:', e);
    }
}

function getModel() {
    return GEMINI_MODEL;
}

function getTextSize() {
    return localStorage.getItem(STORAGE_KEYS.textSize) || 'text-size-small';
}

function getAutoScroll() {
    const val = localStorage.getItem(STORAGE_KEYS.autoScroll);
    return val !== null ? val === 'true' : true; // Default to true
}

function getPromptPersona() {
    return localStorage.getItem(STORAGE_KEYS.promptPersona) || DEFAULT_PROMPT.persona;
}
function getPromptConstraints() {
    return localStorage.getItem(STORAGE_KEYS.promptConstraints) || DEFAULT_PROMPT.constraints;
}
function getPromptExplicit() {
    return localStorage.getItem(STORAGE_KEYS.promptExplicit) || DEFAULT_PROMPT.explicit;
}
function getPromptPopularity() {
    return localStorage.getItem(STORAGE_KEYS.promptPopularity) || DEFAULT_PROMPT.popularity;
}

// ── Mix History ──
function getHistory() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.history)) || []; }
    catch { return []; }
}

function saveHistory(mixes) {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(mixes));
    updateHistoryControls();
}

function updateHistoryControls() {
    const ctrl   = document.getElementById('history-controls');
    const history = getHistory();
    if (history.length > 0) ctrl.classList.remove('hidden');
    else ctrl.classList.add('hidden');

    // localStorage quota warning
    try {
        const used = new Blob(Object.values(localStorage)).size;
        if (used > 4 * 1024 * 1024) {
            console.warn('MegamixGen: localStorage usage high (' + Math.round(used / 1024) + 'KB). Consider clearing old mixes.');
        }
    } catch (e) {}
}

function clearHistory(btn) {
    if (btn && !btn.dataset.confirming) {
        btn.dataset.confirming = 'true';
        const originalHTML = btn.innerHTML;
        const originalTitle = btn.title;
        btn.innerHTML = '<span class="text-[10px] text-[#ff3333] font-bold uppercase px-1">Clear all?</span>';
        btn.title = 'Click again to confirm clearing all mixes';
        btn._resetTimer = setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.title = originalTitle;
            delete btn.dataset.confirming;
        }, 3500);
        return;
    }
    if (btn && btn._resetTimer) clearTimeout(btn._resetTimer);
    if (btn) delete btn.dataset.confirming;

    if (!btn && typeof confirm === 'function') {
        if (!confirm('Clear all saved mixes?')) return;
    }

    localStorage.removeItem(STORAGE_KEYS.history);
    const container = document.getElementById('mixes-container');
    if (container) {
        container.innerHTML = '<div class="text-center text-[#555] text-[11px] py-8 uppercase tracking-widest"><i class="fas fa-compact-disc mr-2"></i>No playlists yet — enter a prompt above to generate one.</div>';
    }
    updateHistoryControls();
}
