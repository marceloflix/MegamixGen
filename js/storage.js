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
    persona: "a knowledgeable music curator",
    constraints: "Choose tracks that genuinely fit the request — consider era, tempo, mood, and sonic cohesion.",
    explicit: "allow", // 'allow' or 'clean'
    popularity: "any" // 'any', 'mainstream', 'obscure'
};

// ── Prompt History ──
function getPromptHistory() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.prompts)) || []; }
    catch { return []; }
}

function savePrompt(prompt) {
    if (!prompt) return;
    let prompts = getPromptHistory().filter(p => p !== prompt);
    prompts.unshift(prompt);
    if (prompts.length > 20) prompts.length = 20;
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

function getModel() {
    const saved  = localStorage.getItem(STORAGE_KEYS.model);
    if (!saved) return 'gemini-2.5-flash';
    const select = document.getElementById('model-select');
    if (select && ![...select.options].some(o => o.value === saved)) {
        localStorage.removeItem(STORAGE_KEYS.model);
        return 'gemini-2.5-flash';
    }
    return saved;
}

function getTextSize() {
    return localStorage.getItem(STORAGE_KEYS.textSize) || 'text-size-normal';
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

function clearHistory() {
    if (!confirm('Clear all saved mixes?')) return;
    localStorage.removeItem(STORAGE_KEYS.history);
    document.getElementById('mixes-container').innerHTML = '';
    updateHistoryControls();
}
