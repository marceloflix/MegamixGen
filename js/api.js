// ── Gemini API helpers ──
async function fetchWithRetry(url, options, retries = 3) {
    const delays = [2000, 4000, 8000];
    for (let i = 0; i < retries; i++) {
        const response = await fetch(url, options);
        if (response.ok) return await response.json();
        const body = await response.text();
        if (response.status === 400 || response.status === 403) throw new Error(`API_KEY_ERROR: ${body}`);
        if (response.status === 429 || response.status === 503) {
            await new Promise(r => setTimeout(r, delays[i] || 8000));
            continue;
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

// ── Rate-Limit Countdown ──
function showRateLimitCountdown(seconds = 30) {
    let remaining = seconds;
    const errorDiv = document.getElementById('ai-error');
    errorDiv.classList.remove('hidden');
    const update = () => {
        errorDiv.innerHTML = `RATE LIMITED. Retry in <span style="color:#ffcc00;font-size:14px">${remaining}s</span> — too many requests.`;
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
    }, 2200);
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

    const persona = getPromptPersona();
    const constraints = getPromptConstraints();
    const explicit = getPromptExplicit() === 'clean' ? 'Only choose CLEAN, non-explicit tracks.' : 'Explicit tracks are allowed.';
    const popularity = getPromptPopularity();
    let popString = '';
    if (popularity === 'mainstream') popString = 'Prioritize mainstream, well-known, and popular tracks.';
    if (popularity === 'obscure') popString = 'Prioritize underground, obscure, and lesser-known tracks.';

    const prompt = `You are ${persona}. Create a ${trackCount} track playlist based on this vibe or genre: "${vibe}".
    ${constraints}
    ${popString}
    ${explicit}
    Respond ONLY with a valid JSON object matching this schema.
    {
        "title": "A concise, descriptive playlist title",
        "description": "2 sentences max. Describe the mood and sonic character of this playlist, what connects these tracks, and the best context to listen to it (e.g. driving, working, late night). Be informative and direct, no hype.",
        "tracks": [
            { "title": "Song Title", "artist": "Artist", "bpm": 128, "key": "8A" }
        ],
        "bpm": "e.g., 120-135",
        "energy": 4,
        "genre": "Short genre name"
    }
    For tracks: provide realistic BPM (integer) and harmonic Key in Camelot format (e.g. 8A, 11B).
    For energy: use an integer 1-5 (1=chill/ambient, 2=relaxed, 3=moderate, 4=energetic, 5=intense/peak).`;

    const model = getModel();
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: GEMINI_RESPONSE_SCHEMA }
    };
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
        const data = await fetchWithRetry(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!responseText) throw new Error('NO_CONTENT');

        const mixData = JSON.parse(responseText);
        mixData._prompt = vibe;
        renderNewMix(mixData, true);
        savePrompt(vibe);
        vibeInput.value = '';
        if (getAutoScroll()) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Gemini API Error:', error);
        const msg = error.message || '';
        if (msg.includes('API_KEY_ERROR')) showError('INVALID API KEY. Check your key in ⚙ Settings.');
        else if (msg.includes('MAX_RETRIES') || msg.includes('429')) showRateLimitCountdown(30);
        else if (msg.includes('NO_CONTENT')) showError('AI RETURNED EMPTY RESPONSE. Try a different prompt.');
        else showError(`CONNECTION ERROR: ${msg || 'Unknown network error'}. Check console for details.`);
    } finally {
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
        loading.classList.add('hidden');
        stopLoadingMessages();
    }
}

// ── Refine Playlist ──
async function refineMix(ts) {
    const instruction = prompt('How would you like to refine this playlist?\n(e.g. "make it more chill", "replace track 3", "add 5 more tracks")');
    if (!instruction) return;
    const apiKey = getApiKey();
    if (!apiKey) { openSettings(); return; }

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

    const refinementPrompt = `You are a music curator. Here is an existing playlist called "${mix.title}" with genre "${mix.genre}":
${mix.tracks.map((t, i) => `${i + 1}. ${t}`).join('\n')}

The user wants to refine it: "${instruction}"

Apply the change and return the COMPLETE updated playlist as JSON:
{"title":"...","description":"...","tracks":["Artist - Song","..."],"bpm":"...","energy":N,"genre":"..."}
Keep the same format. Preserve tracks not affected by the change.`;

    const model = getModel();
    const payload = {
        contents: [{ parts: [{ text: refinementPrompt }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: GEMINI_RESPONSE_SCHEMA }
    };

    try {
        const data = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!responseText) throw new Error('NO_CONTENT');
        const newMix = JSON.parse(responseText);
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
