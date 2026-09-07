// ── Gemini API Configuration & Engine ──
async function fetchWithRetry(url, options, retries = 2) {
    const delays = [1200, 2500];
    for (let i = 0; i < retries; i++) {
        const response = await fetch(url, options);
        if (response.ok) return await response.json();
        const body = await response.text();
        if (response.status === 400 || response.status === 403) throw new Error(`API_KEY_ERROR: ${body}`);
        if (response.status === 429 || response.status === 503) {
            if (i < retries - 1) {
                await new Promise(r => setTimeout(r, delays[i]));
                continue;
            }
            throw new Error(`RATE_LIMIT: ${body}`);
        }
        throw new Error(`HTTP ${response.status}: ${body}`);
    }
    throw new Error('MAX_RETRIES');
}

function showError(msg) {
    const errorDiv = document.getElementById('ai-error');
    errorDiv.innerHTML = msg;
    errorDiv.classList.remove('hidden');
}

function showNotice(msg, autoDismissMs = 8000) {
    const noticeDiv = document.getElementById('ai-notice');
    if (!noticeDiv) return;
    noticeDiv.innerHTML = msg;
    noticeDiv.classList.remove('hidden');
    if (autoDismissMs > 0) {
        setTimeout(() => {
            if (noticeDiv.innerHTML === msg) {
                noticeDiv.classList.add('hidden');
            }
        }, autoDismissMs);
    }
}

function hideNotice() {
    const noticeDiv = document.getElementById('ai-notice');
    if (noticeDiv) noticeDiv.classList.add('hidden');
}

// ── Rate-Limit Countdown ──
function showRateLimitCountdown(seconds = 20) {
    let remaining = seconds;
    const errorDiv = document.getElementById('ai-error');
    errorDiv.classList.remove('hidden');
    const update = () => {
        errorDiv.innerHTML = `RATE LIMITED. Retry in <span style="color:#ffcc00;font-size:14px">${remaining}s</span> — temporary request limit reached. Please wait a moment.`;
    };
    update();
    const timer = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
            clearInterval(timer);
            errorDiv.classList.add('hidden');
            return;
        }
        update();
    }, 1000);
}

// ── Loading Messages ──
const LOADING_MSGS = [
    'CONNECTING TO DJ MAINFRAME...',
    'SCANNING FREQUENCY BANKS...',
    'CALIBRATING BPM MATRIX...',
    'SYNCING AUDIO WAVELENGTHS...',
    'ANALYZING SONIC PATTERNS...',
    'QUERYING TRACK DATABASE...',
    'DECODING RHYTHM ALGORITHMS...',
    'ASSEMBLING TRACKLIST SEQUENCE...'
];
let loadingInterval = null;

function startLoadingMessages() {
    let idx = 0;
    const el = document.getElementById('loading-msg');
    if (el) el.textContent = LOADING_MSGS[0];
    loadingInterval = setInterval(() => {
        idx = (idx + 1) % LOADING_MSGS.length;
        if (el) el.textContent = LOADING_MSGS[idx];
    }, 1800);
}

function stopLoadingMessages() {
    if (loadingInterval) { clearInterval(loadingInterval); loadingInterval = null; }
}

// ── Shared API schema ──
const GEMINI_RESPONSE_SCHEMA = {
    type: 'OBJECT',
    properties: {
        title: { type: 'STRING' },
        description: { type: 'STRING' },
        tracks: { 
            type: 'ARRAY', 
            items: { 
                type: 'OBJECT',
                properties: {
                    title: { type: 'STRING' },
                    artist: { type: 'STRING' },
                    bpm: { type: 'INTEGER' },
                    key: { type: 'STRING' }
                },
                required: ['title', 'artist', 'bpm', 'key']
            } 
        },
        bpm: { type: 'STRING' },
        energy: { type: 'INTEGER' },
        genre: { type: 'STRING' }
    },
    required: ['title', 'description', 'tracks', 'bpm', 'energy', 'genre']
};

// ── Core API Generator with Minimal Thinking for Maximum Speed ──
async function executeGeminiGenerate(apiKey, prompt) {
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: GEMINI_RESPONSE_SCHEMA,
            maxOutputTokens: 2500,
            thinkingConfig: {
                thinkingLevel: 'MINIMAL'
            }
        }
    };
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    
    try {
        const data = await fetchWithRetry(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!responseText) throw new Error('NO_CONTENT');
        return JSON.parse(responseText);
    } catch (err) {
        // If thinkingConfig is rejected for any reason, safely retry once without it
        if (err.message && (err.message.includes('thinkingConfig') || err.message.includes('thinkingLevel') || err.message.includes('thinking_config') || err.message.includes('INVALID_ARGUMENT'))) {
            delete payload.generationConfig.thinkingConfig;
            const retryData = await fetchWithRetry(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const fallbackText = retryData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!fallbackText) throw new Error('NO_CONTENT');
            return JSON.parse(fallbackText);
        }
        throw err;
    }
}

// ── Generate Mix ──
async function generateMix() {
    const apiKey = getApiKey();
    if (!apiKey) { openSettings(); showError('API KEY REQUIRED. Click the ⚙ gear to configure.'); return; }

    const vibeInput = document.getElementById('ai-vibe');
    const vibe = vibeInput.value.trim() || 'Retro 2000s Pop';
    const trackCount = getTrackCount();

    const btn = document.getElementById('generate-btn');
    const loading = document.getElementById('ai-loading');
    const errorDiv = document.getElementById('ai-error');

    btn.disabled = true;
    btn.classList.add('opacity-50', 'cursor-not-allowed');
    loading.classList.remove('hidden');
    startLoadingMessages();
    errorDiv.classList.add('hidden');
    hideNotice();

    const persona = getPromptPersona();
    const constraints = getPromptConstraints();
    const explicit = getPromptExplicit() === 'clean' ? 'Only choose CLEAN, non-explicit tracks.' : 'Explicit tracks are allowed.';
    const popularity = getPromptPopularity();
    let popString = '';
    if (popularity === 'mainstream') popString = 'Prioritize mainstream, well-known, and popular tracks.';
    if (popularity === 'obscure') popString = 'Prioritize underground, obscure, and lesser-known tracks.';

    const prompt = `You are ${persona}. Create a cohesive, highly authentic, high-quality ${trackCount}-track playlist for vibe or genre: "${vibe}".
${constraints}
${popString}
${explicit}

ERA & RELEASE DATE ACCURACY (CRITICAL):
- If the vibe/prompt mentions or implies a specific decade, era, or year range (e.g., "80s", "90s", "70s", "2000s", "80's 90's", etc.):
  * EVERY selected track MUST have been genuinely originally released or recorded during that exact era.
  * NEVER include modern retro-revival songs or tracks released outside that timeframe. (For example, if the prompt says "80's 90's synthwave" or "80s synth music", pick authentic 1980s and 1990s synth-pop, new wave, and electronic music like Depeche Mode, New Order, Giorgio Moroder, Gary Numan, Kraftwerk, Jan Hammer, Pet Shop Boys, A-ha, Tears for Fears, etc. Do NOT include 2010s/2020s songs like The Weeknd, Kavinsky, or The Midnight).
- Only select real, existing songs by actual artists that strictly honor the era and sonic vibe.

Output specifications:
- ACCURATE STUDIO TEMPO (BPM) & HARMONIC KEY: Provide the exact real-world original studio recording tempo (BPM as integer, e.g. Gary Numan - Cars is 128 BPM, 10B; New Order - Blue Monday is 130 BPM, 7A) and true Camelot Wheel key (e.g. 10B, 7A, 8B, 11A) for each track.
- Energy: integer 1-5 (1=chill/ambient, 2=relaxed, 3=moderate, 4=energetic, 5=intense/peak).
- Description: 2 sentences max. Informative and direct on mood, sonic character, era authenticity, and ideal context.`;

    try {
        const mixData = await executeGeminiGenerate(apiKey, prompt);
        mixData._prompt = vibe;
        if (Array.isArray(mixData.tracks) && typeof parseHarmonicKey === 'function') {
            mixData.tracks.forEach(track => {
                if (typeof track === 'object' && track !== null) {
                    const parsed = parseHarmonicKey(track.key);
                    if (parsed) {
                        track.key = parsed.camelot;
                        track.musicalKey = parsed.name;
                    }
                }
            });
        }
        renderNewMix(mixData, true);
        savePrompt(vibe);
        vibeInput.value = '';

        if (getAutoScroll()) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Gemini API Error:', error);
        const msg = error.message || '';
        if (msg.includes('API_KEY_ERROR')) {
            showError('INVALID API KEY. Check your key in ⚙ Settings.');
        } else if (msg.includes('RATE_LIMIT') || msg.includes('QUOTA_EXHAUSTED') || msg.includes('MAX_RETRIES') || msg.includes('429')) {
            showRateLimitCountdown(20);
        } else if (msg.includes('NO_CONTENT')) {
            showError('AI RETURNED EMPTY RESPONSE. Try a different prompt.');
        } else {
            showError(`CONNECTION ERROR: ${msg || 'Unknown network error'}. Check console for details.`);
        }
    } finally {
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
        loading.classList.add('hidden');
        stopLoadingMessages();
    }
}

// ── Refine Playlist ──
async function refineMix(ts) {
    const apiKey = getApiKey();
    if (!apiKey) {
        showNotice('ENTER API KEY IN ⚙ SETTINGS TO USE AI REFINEMENT.');
        openSettings();
        return;
    }

    const instruction = prompt('How would you like to refine this playlist?\n(e.g., "Add more 80s synth bass", "Replace pop tracks with darker electronic", "Make it faster tempo")');
    if (!instruction || !instruction.trim()) return;

    const history = getHistory();
    const mixIndex = history.findIndex(m => m._timestamp === ts);
    if (mixIndex === -1) return;
    const mix = history[mixIndex];

    const btn = document.getElementById('generate-btn');
    const loading = document.getElementById('ai-loading');
    const errorDiv = document.getElementById('ai-error');
    if (btn) { btn.disabled = true; btn.classList.add('opacity-50', 'cursor-not-allowed'); }
    loading.classList.remove('hidden');
    startLoadingMessages();
    errorDiv.classList.add('hidden');
    hideNotice();

    const trackSummary = mix.tracks.map((t, i) => `${i + 1}. ${getTrackString(t)}`).join('\n');
    const refinementPrompt = `You are a music curator. Refine this playlist titled "${mix.title}" (${mix.genre}):
${trackSummary}

User requested change: "${instruction}"
Strict rules:
- Strictly adhere to any era, decade, or release timeframe requested. If an era is specified (e.g., 80s, 90s), only include songs genuinely released in that era.
- Return the complete updated playlist with realistic BPM, harmonic Camelot Key, energy (1-5), and updated description. Preserve tracks not affected by the change.`;

    try {
        const newMix = await executeGeminiGenerate(apiKey, refinementPrompt);
        if (Array.isArray(newMix.tracks) && typeof parseHarmonicKey === 'function') {
            newMix.tracks.forEach(track => {
                if (typeof track === 'object' && track !== null) {
                    const parsed = parseHarmonicKey(track.key);
                    if (parsed) {
                        track.key = parsed.camelot;
                        track.musicalKey = parsed.name;
                    }
                }
            });
        }
        newMix._timestamp = ts;
        newMix._favorite = mix._favorite;
        newMix._prompt = `${mix._prompt || mix.title} → refined: "${instruction}"`;
        history[mixIndex] = newMix;
        saveHistory(history);
        rebuildFeed();

        requestAnimationFrame(() => {
            const el = document.querySelector(`[data-ts="${ts}"]`);
            if (el) {
                el.style.boxShadow = '0 0 20px rgba(255,204,0,0.5)';
                if (getAutoScroll()) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                setTimeout(() => { el.style.boxShadow = ''; }, 2000);
            }
        });
    } catch (e) {
        showError('REFINEMENT FAILED: ' + (e.message || 'Unknown error'));
    } finally {
        if (btn) { btn.disabled = false; btn.classList.remove('opacity-50', 'cursor-not-allowed'); }
        loading.classList.add('hidden');
        stopLoadingMessages();
    }
}
