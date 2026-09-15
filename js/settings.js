// ── Settings Modal ──
function openSettings() {
    document.getElementById('api-key-input').value = getApiKey();
    const statusEl = document.getElementById('api-key-status');
    if (statusEl) statusEl.classList.add('hidden');
    
    document.getElementById('text-size-select').value = getTextSize();
    document.getElementById('auto-scroll-toggle').checked = getAutoScroll();
    document.getElementById('prompt-persona-input').value = getPromptPersona();
    document.getElementById('prompt-constraints-input').value = getPromptConstraints();
    document.getElementById('prompt-explicit-input').value = getPromptExplicit();
    document.getElementById('prompt-popularity-input').value = getPromptPopularity();

    const spotifyInput = document.getElementById('spotify-client-id-input');
    if (spotifyInput && typeof getSpotifyClientId === 'function') {
        spotifyInput.value = getSpotifyClientId();
    }
    
    document.getElementById('settings-modal').classList.remove('hidden');
}

function resetStructuredPrompt(btn) {
    if (btn) {
        const badge = '<span class="text-[9px] font-extrabold uppercase text-[#ff3333] bg-[#220000] border border-[#ff3333] px-1.5 py-[2px] rounded shadow-[0_0_6px_rgba(255,51,51,0.6)] cursor-pointer select-none pointer-events-none">Reset?</span>';
        if (typeof armConfirmButton === 'function') {
            if (armConfirmButton(btn, badge, 'Click again to confirm reset', typeof DEFAULT_CONFIRM_TIMEOUT_MS !== 'undefined' ? DEFAULT_CONFIRM_TIMEOUT_MS : 8000)) {
                return;
            }
        }
    }

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
    const mainErrorDiv = document.getElementById('ai-error');
    if (mainErrorDiv && mainErrorDiv.textContent.includes('API KEY REQUIRED') && getApiKey()) {
        mainErrorDiv.classList.add('hidden');
    }
}

async function saveSettings() {
    const saveBtn = document.getElementById('settings-save-btn');
    const originalBtnHtml = saveBtn ? saveBtn.innerHTML : '<i class="fas fa-save mr-1"></i> Save';
    
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Validating...';
        saveBtn.style.opacity = '0.7';
        saveBtn.style.cursor = 'wait';
    }

    const key      = document.getElementById('api-key-input').value.trim();
    const statusEl = document.getElementById('api-key-status');
    const textSize = document.getElementById('text-size-select').value;
    const autoScroll = document.getElementById('auto-scroll-toggle').checked;
    const persona = document.getElementById('prompt-persona-input').value;
    const constraints = document.getElementById('prompt-constraints-input').value;
    const explicit = document.getElementById('prompt-explicit-input').value;
    const popularity = document.getElementById('prompt-popularity-input').value;

    let geminiValid = true;

    // Show validating state immediately
    if (key && statusEl) {
        statusEl.className = 'text-[10px] mt-1 font-bold uppercase tracking-wider text-[#ffcc00]';
        statusEl.textContent = 'VALIDATING KEY...';
        statusEl.classList.remove('hidden');
    } else if (statusEl) {
        statusEl.classList.add('hidden');
    }

    if (key) {
        try {
            const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}?key=${key}`);
            if (r.ok) {
                if (statusEl) {
                    statusEl.className = 'text-[10px] mt-1 font-bold uppercase tracking-wider text-[#39ff14]';
                    statusEl.textContent = '✓ KEY VALID';
                }
            } else {
                if (statusEl) {
                    statusEl.className = 'text-[10px] mt-1 font-bold uppercase tracking-wider text-[#ff3333]';
                    statusEl.textContent = '✗ INVALID KEY — check and try again';
                }
                geminiValid = false;
            }
        } catch {
            if (statusEl) {
                statusEl.className = 'text-[10px] mt-1 font-bold uppercase tracking-wider text-[#ff9900]';
                statusEl.textContent = '⚠ NETWORK ERROR — saved anyway';
            }
        }
    }

    // If key was invalid: clear the input field and remove from storage immediately
    if (!geminiValid) {
        const geminiInput = document.getElementById('api-key-input');
        if (geminiInput) geminiInput.value = '';
        localStorage.removeItem(STORAGE_KEYS.apiKey);

        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalBtnHtml;
            saveBtn.style.opacity = '1';
            saveBtn.style.cursor = 'pointer';
        }
        return;
    }

    // Success indicator on button
    if (saveBtn) {
        saveBtn.innerHTML = '<i class="fas fa-check mr-1"></i> Saved!';
    }

    // Clear any previous "API KEY REQUIRED" error on main screen
    const mainErrorDiv = document.getElementById('ai-error');
    if (mainErrorDiv && (mainErrorDiv.textContent.includes('API KEY REQUIRED') || mainErrorDiv.textContent.includes('API_KEY_ERROR'))) {
        mainErrorDiv.classList.add('hidden');
    }

    // Save preferences
    localStorage.setItem(STORAGE_KEYS.apiKey, key);
    localStorage.setItem(STORAGE_KEYS.model, GEMINI_MODEL);
    localStorage.setItem(STORAGE_KEYS.textSize, textSize);
    localStorage.setItem(STORAGE_KEYS.autoScroll, autoScroll);
    localStorage.setItem(STORAGE_KEYS.promptPersona, persona);
    localStorage.setItem(STORAGE_KEYS.promptConstraints, constraints);
    localStorage.setItem(STORAGE_KEYS.promptExplicit, explicit);
    localStorage.setItem(STORAGE_KEYS.promptPopularity, popularity);
    applyTextSize(textSize);

    const spotifyInput = document.getElementById('spotify-client-id-input');
    if (spotifyInput && typeof setSpotifyClientId === 'function') {
        setSpotifyClientId(spotifyInput.value.trim());
    }

    setTimeout(() => {
        closeSettings();
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalBtnHtml;
            saveBtn.style.opacity = '1';
            saveBtn.style.cursor = 'pointer';
        }
    }, 600);
}
