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
    promptPopularity: 'megamix_prompt_popularity'
};

const DEFAULT_PROMPT = {
    persona: "an elite music curator and musicologist with encyclopedic knowledge of genres, eras, and discographies",
    constraints: "Prioritize sonic synergy, smooth transitions, and tracklist flow. Ensure diversity by picking at most one track per artist. Every song must authentically embody the mood, tempo, and era.",
    explicit: "allow" // 'allow' or 'clean'
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

// Backward-compatibility safe stubs
function getMusicApiKey() { return ''; }
function saveMusicApiKey() {}
function lookupSongInDatabase() { return null; }
function lookupVerifiedCatalog() { return null; }

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
    const val = localStorage.getItem(STORAGE_KEYS.promptPersona);
    if (!val || val === 'an elite music curator and sonic crate digger for SoundHunt') {
        return DEFAULT_PROMPT.persona;
    }
    return val;
}
function getPromptConstraints() {
    const val = localStorage.getItem(STORAGE_KEYS.promptConstraints);
    if (!val || val.startsWith("ZERO HALLUCINATIONS:")) {
        return DEFAULT_PROMPT.constraints;
    }
    return val;
}
function getPromptExplicit() {
    return localStorage.getItem(STORAGE_KEYS.promptExplicit) || DEFAULT_PROMPT.explicit;
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
            console.warn('SoundHunt: localStorage usage high (' + Math.round(used / 1024) + 'KB). Consider clearing old playlists.');
        }
    } catch (e) {}
}

// ── Universal Confirmation Button System (Long Timeout & Click-Outside Dismissal) ──
const _armedConfirmButtons = new Set();
const DEFAULT_CONFIRM_TIMEOUT_MS = 8000; // 8 seconds allows comfortable decision time

function disarmConfirmButton(btn) {
    if (!btn || !btn._confirmData) return;
    if (btn._resetTimer) {
        clearTimeout(btn._resetTimer);
        btn._resetTimer = null;
    }
    const data = btn._confirmData;
    if (btn.isConnected) {
        btn.innerHTML = data.html;
        btn.title = data.title;
        if (data.width !== undefined) btn.style.width = data.width;
        if (data.padding !== undefined) btn.style.padding = data.padding;
    }
    delete btn.dataset.confirming;
    delete btn._confirmData;
    _armedConfirmButtons.delete(btn);
}

function disarmAllConfirmButtons(exceptBtn = null) {
    _armedConfirmButtons.forEach(b => {
        if (b !== exceptBtn) {
            disarmConfirmButton(b);
        }
    });
}

function armConfirmButton(btn, confirmHtml, confirmTitle = 'Click again to confirm', duration = DEFAULT_CONFIRM_TIMEOUT_MS, extraStyles = null) {
    if (!btn) return false;

    // Second click: already confirming -> disarm and return false to let caller execute destructive action
    if (btn.dataset.confirming) {
        disarmConfirmButton(btn);
        return false;
    }

    // First click: disarm any other active confirmation buttons across the app
    disarmAllConfirmButtons();

    btn._confirmData = {
        html: btn.innerHTML,
        title: btn.title || '',
        width: btn.style.width,
        padding: btn.style.padding
    };
    btn.dataset.confirming = 'true';

    if (extraStyles) {
        if (extraStyles.width !== undefined) btn.style.width = extraStyles.width;
        if (extraStyles.padding !== undefined) btn.style.padding = extraStyles.padding;
    }

    btn.innerHTML = confirmHtml;
    if (confirmTitle) btn.title = confirmTitle;

    btn._resetTimer = setTimeout(() => {
        disarmConfirmButton(btn);
    }, duration);

    _armedConfirmButtons.add(btn);
    return true; // Return true to tell caller to wait for confirmation
}

// Global dismiss listeners: click outside or press Escape immediately reverts confirmation
if (typeof document !== 'undefined') {
    document.addEventListener('click', (e) => {
        if (_armedConfirmButtons.size === 0) return;
        _armedConfirmButtons.forEach(btn => {
            if (!btn.contains(e.target)) {
                disarmConfirmButton(btn);
            }
        });
    }, true);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && _armedConfirmButtons.size > 0) {
            disarmAllConfirmButtons();
        }
    });
}

function clearHistory(btn) {
    if (btn) {
        const badge = '<span class="text-[10px] text-[#ff3333] font-bold uppercase px-1 pointer-events-none">Clear all?</span>';
        if (armConfirmButton(btn, badge, 'Click again to confirm clearing all playlists', DEFAULT_CONFIRM_TIMEOUT_MS)) {
            return;
        }
    } else if (typeof confirm === 'function') {
        if (!confirm('Clear all saved playlists?')) return;
    }

    localStorage.removeItem(STORAGE_KEYS.history);
    const container = document.getElementById('mixes-container');
    if (container) {
        container.innerHTML = '<div class="text-center text-[#555] text-[11px] py-8 uppercase tracking-widest"><i class="fas fa-compact-disc mr-2"></i>No playlists yet — enter a prompt above to hunt tracks.</div>';
    }
    updateHistoryControls();
}

// ── Global Visual Toast Feedback ──
function showAppToast(msg, type = 'success', duration = 3500) {
    let toast = document.getElementById('soundhunt-global-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'soundhunt-global-toast';
        toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[10000] px-4 py-2 bg-[#051505] border border-[#1a7b1a] text-[#39ff14] text-[11px] font-bold uppercase tracking-wider rounded shadow-[0_0_15px_rgba(0,0,0,0.8)] flex items-center gap-2 transition-all duration-300 opacity-0 pointer-events-none translate-y-[-10px] select-none';
        document.body.appendChild(toast);
    }
    const icon = type === 'success' ? 'fa-check' : (type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle');
    const borderCol = type === 'error' ? '#ff3333' : '#1a7b1a';
    const textCol = type === 'error' ? '#ff4444' : '#39ff14';
    const bgCol = type === 'error' ? '#1f0505' : '#051505';

    toast.style.borderColor = borderCol;
    toast.style.color = textCol;
    toast.style.backgroundColor = bgCol;
    toast.innerHTML = `<i class="fas ${icon} text-[11px]"></i><span>${msg}</span>`;

    toast.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-[-10px]');
    toast.classList.add('opacity-100', 'translate-y-0');

    if (toast._timer) clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', 'pointer-events-none', 'translate-y-[-10px]');
    }, duration);
}

