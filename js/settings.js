// ── Settings Modal ──
function openSettings() {
    document.getElementById('api-key-input').value = getApiKey();
    document.getElementById('api-key-status').classList.add('hidden');
    const musicKeyInput = document.getElementById('music-api-key-input');
    if (musicKeyInput) musicKeyInput.value = getMusicApiKey();
    
    document.getElementById('text-size-select').value = getTextSize();
    document.getElementById('auto-scroll-toggle').checked = getAutoScroll();
    document.getElementById('prompt-persona-input').value = getPromptPersona();
    document.getElementById('prompt-constraints-input').value = getPromptConstraints();
    document.getElementById('prompt-explicit-input').value = getPromptExplicit();
    document.getElementById('prompt-popularity-input').value = getPromptPopularity();
    
    document.getElementById('settings-modal').classList.remove('hidden');
}

function resetStructuredPrompt() {
    document.getElementById('prompt-persona-input').value = DEFAULT_PROMPT.persona;
    document.getElementById('prompt-constraints-input').value = DEFAULT_PROMPT.constraints;
    document.getElementById('prompt-explicit-input').value = DEFAULT_PROMPT.explicit;
    document.getElementById('prompt-popularity-input').value = DEFAULT_PROMPT.popularity;
}

function applyTextSize(sizeClass) {
    document.body.classList.remove('text-size-small', 'text-size-normal', 'text-size-large');
    if (sizeClass) document.body.classList.add(sizeClass);
}

function closeSettings() {
    document.getElementById('settings-modal').classList.add('hidden');
}

function saveSettings() {
    const key      = document.getElementById('api-key-input').value.trim();
    const statusEl = document.getElementById('api-key-status');

    if (key) {
        statusEl.className = 'text-[10px] mt-1 font-bold uppercase tracking-wider text-[#ffcc00]';
        statusEl.textContent = 'VALIDATING KEY...';
        statusEl.classList.remove('hidden');

        const textSize = document.getElementById('text-size-select').value;
        const autoScroll = document.getElementById('auto-scroll-toggle').checked;
        const persona = document.getElementById('prompt-persona-input').value;
        const constraints = document.getElementById('prompt-constraints-input').value;
        const explicit = document.getElementById('prompt-explicit-input').value;
        const popularity = document.getElementById('prompt-popularity-input').value;
        const musicKeyInput = document.getElementById('music-api-key-input');
        const musicKey = musicKeyInput ? musicKeyInput.value.trim() : '';
        
        fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}?key=${key}`)
            .then(r => {
                if (r.ok) {
                    statusEl.className = 'text-[10px] mt-1 font-bold uppercase tracking-wider text-[#39ff14]';
                    statusEl.textContent = '✓ KEY VALID';
                    localStorage.setItem(STORAGE_KEYS.apiKey, key);
                    localStorage.setItem(STORAGE_KEYS.model, GEMINI_MODEL);
                    localStorage.setItem(STORAGE_KEYS.textSize, textSize);
                    localStorage.setItem(STORAGE_KEYS.autoScroll, autoScroll);
                    localStorage.setItem(STORAGE_KEYS.promptPersona, persona);
                    localStorage.setItem(STORAGE_KEYS.promptConstraints, constraints);
                    localStorage.setItem(STORAGE_KEYS.promptExplicit, explicit);
                    localStorage.setItem(STORAGE_KEYS.promptPopularity, popularity);
                    localStorage.setItem(STORAGE_KEYS.musicApiKey, musicKey);
                    applyTextSize(textSize);
                    setTimeout(() => closeSettings(), 800);
                } else {
                    statusEl.className = 'text-[10px] mt-1 font-bold uppercase tracking-wider text-[#ff3333]';
                    statusEl.textContent = '✗ INVALID KEY — check and try again';
                }
            })
            .catch(() => {
                statusEl.className = 'text-[10px] mt-1 font-bold uppercase tracking-wider text-[#ff9900]';
                statusEl.textContent = '⚠ NETWORK ERROR — saved anyway';
                localStorage.setItem(STORAGE_KEYS.apiKey, key);
                localStorage.setItem(STORAGE_KEYS.model, GEMINI_MODEL);
                localStorage.setItem(STORAGE_KEYS.textSize, textSize);
                localStorage.setItem(STORAGE_KEYS.autoScroll, autoScroll);
                localStorage.setItem(STORAGE_KEYS.promptPersona, persona);
                localStorage.setItem(STORAGE_KEYS.promptConstraints, constraints);
                localStorage.setItem(STORAGE_KEYS.promptExplicit, explicit);
                localStorage.setItem(STORAGE_KEYS.promptPopularity, popularity);
                localStorage.setItem(STORAGE_KEYS.musicApiKey, musicKey);
                applyTextSize(textSize);
                setTimeout(() => closeSettings(), 1200);
            });
    } else {
        const musicKeyInput = document.getElementById('music-api-key-input');
        const musicKey = musicKeyInput ? musicKeyInput.value.trim() : '';
        localStorage.setItem(STORAGE_KEYS.apiKey, '');
        localStorage.setItem(STORAGE_KEYS.model, GEMINI_MODEL);
        localStorage.setItem(STORAGE_KEYS.textSize, document.getElementById('text-size-select').value);
        localStorage.setItem(STORAGE_KEYS.autoScroll, document.getElementById('auto-scroll-toggle').checked);
        localStorage.setItem(STORAGE_KEYS.promptPersona, document.getElementById('prompt-persona-input').value);
        localStorage.setItem(STORAGE_KEYS.promptConstraints, document.getElementById('prompt-constraints-input').value);
        localStorage.setItem(STORAGE_KEYS.promptExplicit, document.getElementById('prompt-explicit-input').value);
        localStorage.setItem(STORAGE_KEYS.promptPopularity, document.getElementById('prompt-popularity-input').value);
        localStorage.setItem(STORAGE_KEYS.musicApiKey, musicKey);
        applyTextSize(document.getElementById('text-size-select').value);
        closeSettings();
    }
}
