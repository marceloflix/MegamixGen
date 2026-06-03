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
    const dl = document.getElementById('prompt-history');
    if (!dl) return;
    dl.innerHTML = getPromptHistory()
        .map(p => `<option value="${p.replace(/"/g, '&quot;')}">`)
        .join('');
}

function updatePromptSuggestions() {
    const input = document.getElementById('ai-vibe');
    const dl    = document.getElementById('prompt-history');
    if (!dl || !input) return;
    const val = input.value.trim().toLowerCase();
    if (!val) { populatePromptDatalist(); return; }
    dl.innerHTML = getPromptHistory()
        .filter(p => p.toLowerCase().startsWith(val))
        .map(p => `<option value="${p.replace(/"/g, '&quot;')}">`)
        .join('');
}

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
