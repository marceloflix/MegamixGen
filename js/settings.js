// ── Settings Modal ──
function openSettings() {
    document.getElementById('api-key-input').value = getApiKey();
    const statusEl = document.getElementById('api-key-status');
    if (statusEl) statusEl.classList.add('hidden');

    const musicStatusEl = document.getElementById('music-api-key-status');
    if (musicStatusEl) musicStatusEl.classList.add('hidden');
    
    document.getElementById('text-size-select').value = getTextSize();
    document.getElementById('auto-scroll-toggle').checked = getAutoScroll();
    document.getElementById('prompt-persona-input').value = getPromptPersona();
    document.getElementById('prompt-constraints-input').value = getPromptConstraints();
    document.getElementById('prompt-explicit-input').value = getPromptExplicit();
    document.getElementById('prompt-popularity-input').value = getPromptPopularity();
    
    const musicKeyInput = document.getElementById('music-api-key-input');
    if (musicKeyInput && typeof getMusicApiKey === 'function') {
        musicKeyInput.value = getMusicApiKey();
    }
    
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
    const musicKeyInput = document.getElementById('music-api-key-input');
    const musicKey = musicKeyInput ? musicKeyInput.value.trim() : '';
    const oldMusicKey = typeof getMusicApiKey === 'function' ? getMusicApiKey() : '';
    const musicStatusEl = document.getElementById('music-api-key-status');

    let geminiValid = true;
    let musicValid = true;

    // Show validating state immediately
    if (key && statusEl) {
        statusEl.className = 'text-[10px] mt-1 font-bold uppercase tracking-wider text-[#ffcc00]';
        statusEl.textContent = 'VALIDATING KEY...';
        statusEl.classList.remove('hidden');
    } else if (statusEl) {
        statusEl.classList.add('hidden');
    }

    if (musicKey && musicStatusEl) {
        musicStatusEl.className = 'text-[10px] mt-1 font-bold uppercase tracking-wider text-[#ffcc00]';
        musicStatusEl.textContent = 'VALIDATING KEY...';
        musicStatusEl.classList.remove('hidden');
    } else if (musicStatusEl) {
        musicStatusEl.classList.add('hidden');
    }

    // Run validations concurrently
    const validationPromises = [];

    if (key) {
        validationPromises.push(
            fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}?key=${key}`)
                .then(r => {
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
                })
                .catch(() => {
                    if (statusEl) {
                        statusEl.className = 'text-[10px] mt-1 font-bold uppercase tracking-wider text-[#ff9900]';
                        statusEl.textContent = '⚠ NETWORK ERROR — saved anyway';
                    }
                })
        );
    }

    if (musicKey) {
        validationPromises.push(
            fetch(`/api/validate_music_key?api_key=${encodeURIComponent(musicKey)}`)
                .then(async mr => {
                    const mdata = await mr.json();
                    if (mr.ok && mdata.valid) {
                        if (musicStatusEl) {
                            musicStatusEl.className = 'text-[10px] mt-1 font-bold uppercase tracking-wider text-[#39ff14]';
                            musicStatusEl.textContent = '✓ KEY VALID';
                        }
                    } else {
                        if (musicStatusEl) {
                            musicStatusEl.className = 'text-[10px] mt-1 font-bold uppercase tracking-wider text-[#ff3333]';
                            musicStatusEl.textContent = '✗ INVALID KEY — check and try again';
                        }
                        musicValid = false;
                    }
                })
                .catch(() => {
                    if (musicStatusEl) {
                        musicStatusEl.className = 'text-[10px] mt-1 font-bold uppercase tracking-wider text-[#ff9900]';
                        musicStatusEl.textContent = '⚠ NETWORK ERROR — saved anyway';
                    }
                })
        );
    }

    await Promise.all(validationPromises);

    // If any key was invalid: clear the input field and remove from storage immediately
    if (!geminiValid) {
        const geminiInput = document.getElementById('api-key-input');
        if (geminiInput) geminiInput.value = '';
        localStorage.removeItem(STORAGE_KEYS.apiKey);
    }
    if (!musicValid) {
        if (musicKeyInput) musicKeyInput.value = '';
        if (typeof saveMusicApiKey === 'function') saveMusicApiKey('');
        if (typeof onMusicApiKeyUpdated === 'function') onMusicApiKeyUpdated('', oldMusicKey);
    }

    // Stop if any provided key is invalid
    if (!geminiValid || !musicValid) {
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

    if (typeof saveMusicApiKey === 'function') {
        saveMusicApiKey(musicKey);
    }

    setTimeout(() => {
        if (typeof onMusicApiKeyUpdated === 'function') {
            onMusicApiKeyUpdated(musicKey, oldMusicKey);
        }
        closeSettings();
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalBtnHtml;
            saveBtn.style.opacity = '1';
            saveBtn.style.cursor = 'pointer';
        }
    }, 700);
}

function onMusicApiKeyUpdated(newKey, oldKey) {
    if (newKey !== oldKey) {
        if (typeof rebuildFeed === 'function') rebuildFeed();
        if (newKey) {
            const history = typeof getHistory === 'function' ? getHistory() : [];
            history.forEach(mix => {
                if (mix && Array.isArray(mix.tracks) && typeof verifyPlaylistTracks === 'function') {
                    verifyPlaylistTracks(mix);
                }
            });
        }
    }
}
