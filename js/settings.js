// ── Settings Modal ──
function openSettings() {
    document.getElementById('api-key-input').value = getApiKey();
    document.getElementById('api-key-status').classList.add('hidden');
    const model  = getModel(); // also clears any stale saved model
    const select = document.getElementById('model-select');
    if ([...select.options].some(o => o.value === model)) select.value = model;
    document.getElementById('settings-modal').classList.remove('hidden');
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

        const model = document.getElementById('model-select').value;
        fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}?key=${key}`)
            .then(r => {
                if (r.ok) {
                    statusEl.className = 'text-[10px] mt-1 font-bold uppercase tracking-wider text-[#39ff14]';
                    statusEl.textContent = '✓ KEY VALID';
                    localStorage.setItem(STORAGE_KEYS.apiKey, key);
                    localStorage.setItem(STORAGE_KEYS.model, model);
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
                localStorage.setItem(STORAGE_KEYS.model, model);
                setTimeout(() => closeSettings(), 1200);
            });
    } else {
        localStorage.setItem(STORAGE_KEYS.apiKey, '');
        localStorage.setItem(STORAGE_KEYS.model, document.getElementById('model-select').value);
        closeSettings();
    }
}
