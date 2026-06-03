// ── Storage Keys ──
const STORAGE_KEYS = {
    apiKey:     'megamix_api_key',
    model:      'megamix_model',
    history:    'megamix_history',
    prompts:    'megamix_prompts',
    textSize:   'megamix_text_size',
    autoScroll: 'megamix_auto_scroll',
    systemPrompt: 'megamix_system_prompt'
};

const DEFAULT_SYSTEM_PROMPT = `You are a knowledgeable music curator. Create a {{TRACK_COUNT}} track playlist based on this vibe or genre: "{{VIBE}}".
Choose tracks that genuinely fit the request — consider era, tempo, mood, and sonic cohesion.
Respond ONLY with a valid JSON object matching this schema.
{
    "title": "A concise, descriptive playlist title",
    "description": "2 sentences max. Describe the mood and sonic character of this playlist, what connects these tracks, and the best context to listen to it (e.g. driving, working, late night). Be informative and direct, no hype.",
    "tracks": ["Artist - Song Title", "Artist - Song Title"],
    "bpm": "e.g., 120-135",
    "energy": 4,
    "genre": "Short genre name"
}
For energy: use an integer 1-5 (1=chill/ambient, 2=relaxed, 3=moderate, 4=energetic, 5=intense/peak).`;

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

function getSystemPrompt() {
    return localStorage.getItem(STORAGE_KEYS.systemPrompt) || DEFAULT_SYSTEM_PROMPT;
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
