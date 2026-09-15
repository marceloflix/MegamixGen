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
    'HUNTING DOWN RARE TRACKS...',
    'DIGGING THROUGH VINYL ARCHIVES...',
    'ANALYZING SONIC FREQUENCIES...',
    'MATCHING TEMPO & HARMONIC KEYS...',
    'UNEARTHING BURIED GEMS...',
    'CURATING YOUR SOUNDHUNT LIST...'
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

    const persona = getPromptPersona() || 'an elite music curator and sonic crate digger for SoundHunt';
    const constraints = getPromptConstraints();
    const explicit = getPromptExplicit() === 'clean' ? 'Only choose CLEAN, non-explicit tracks.' : 'Explicit tracks are allowed.';
    const chip = typeof getActiveDiscoveryChip === 'function' ? getActiveDiscoveryChip() : 'balanced';
    let popString = '';
    if (chip === 'deep-cuts') {
        popString = 'CRITICAL DISCOVERY FOCUS: Prioritize underground, rare vinyl B-sides, obscure hidden gems, and lesser-known authentic tracks. Avoid predictable, overplayed commercial radio hits.';
    } else if (chip === 'mainstream') {
        popString = 'DISCOVERY FOCUS: Prioritize celebrated mainstream hits, iconic classics, and timeless crowd-pleasers.';
    } else {
        popString = 'DISCOVERY FOCUS: Provide a balanced blend of famous essentials and exciting, lesser-known hidden gems.';
    }

    const prompt = `You are ${persona}. Discover a cohesive, high-quality, highly authentic ${trackCount}-track selection for vibe or genre: "${vibe}".
${constraints}
${popString}
${explicit}

ERA & RELEASE DATE ACCURACY (CRITICAL):
- If the vibe/prompt mentions or implies a specific decade, era, or year range (e.g., "80s", "90s", "70s", "2000s", "80's 90's", etc.):
  * EVERY selected track MUST have been genuinely originally released or recorded during that exact era.
  * NEVER include modern retro-revival songs or tracks released outside that timeframe. (For example, if the prompt says "80's 90's synthwave" or "80s synth music", pick authentic 1980s and 1990s synth-pop, new wave, and electronic music like Depeche Mode, New Order, Giorgio Moroder, Gary Numan, Kraftwerk, Jan Hammer, Pet Shop Boys, A-ha, Tears for Fears, etc. Do NOT include 2010s/2020s songs like The Weeknd, Kavinsky, or The Midnight).
- Only select real, existing songs by actual artists that strictly honor the era and sonic vibe.

CRITICAL ARTIST & SONG ATTRIBUTION (ZERO HALLUCINATIONS):
- ABSOLUTE FACTUAL INTEGRITY: NEVER invent or hallucinate songs or mix up artist attributions. Every track MUST be a real, verified song that genuinely exists in official discographies (Spotify, Apple Music, Discogs, GetSongBPM).
- EXACT PRIMARY RECORDING ARTIST: Always credit the official primary artist on the original single/album release. Do NOT confuse solo artists with their former bands or side projects:
  * "Careless Whisper", "Faith", "Father Figure", "Freedom! '90" -> Artist MUST be "George Michael" (NOT Wham!).
  * "In the Air Tonight", "Against All Odds", "Another Day in Paradise" -> Artist MUST be "Phil Collins" (NOT Genesis).
  * "Englishman in New York", "Fields of Gold" -> Artist MUST be "Sting" (NOT The Police).
  * "Billie Jean", "Thriller", "Rock with You" -> Artist MUST be "Michael Jackson" (NOT The Jackson 5).
  * "Sledgehammer", "In Your Eyes" -> Artist MUST be "Peter Gabriel" (NOT Genesis).
  * "Live and Let Die", "Band on the Run" -> Artist MUST be "Paul McCartney" or "Wings" (NOT The Beatles).
  * "Hello", "All Night Long" -> Artist MUST be "Lionel Richie" (NOT The Commodores).
  * "I'm Coming Out", "Upside Down" -> Artist MUST be "Diana Ross" (NOT The Supremes).
- NEVER MASH UP ARTISTS: If you are not 100% sure that an artist recorded a specific track, DO NOT guess — choose a different verified song that authentically matches the vibe.

Output specifications:
- ACCURATE STUDIO TEMPO (BPM) & HARMONIC KEY: Provide the exact real-world original studio recording tempo (BPM as integer, e.g. Gary Numan - Cars is 128 BPM, 10B; New Order - Blue Monday is 130 BPM, 7A) and true Camelot Wheel key (e.g. 10B, 7A, 8B, 11A) for each track.
- Energy: integer 1-5 (1=chill/ambient, 2=relaxed, 3=moderate, 4=energetic, 5=intense/peak).
- Description: 2 sentences max. Informative and direct on mood, sonic character, era authenticity, and ideal context.`;

    try {
        const mixData = await executeGeminiGenerate(apiKey, prompt);
        mixData._prompt = vibe;
        if (Array.isArray(mixData.tracks)) {
            mixData.tracks.forEach(track => {
                if (typeof track === 'object' && track !== null) {
                    if (typeof lookupVerifiedCatalog === 'function') {
                        const verified = lookupVerifiedCatalog(track.artist, track.title);
                        if (verified) {
                            track.bpm = verified.bpm;
                            track.key = verified.key;
                            track.musicalKey = verified.musicalKey;
                            track.verified = true;
                            track.source = verified.source;
                            track.databaseName = verified.databaseName;
                        }
                    }
                    if (!track.verified && typeof parseHarmonicKey === 'function') {
                        const parsed = parseHarmonicKey(track.key);
                        if (parsed) {
                            track.key = parsed.camelot;
                            track.musicalKey = parsed.name;
                        }
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
        if (Array.isArray(newMix.tracks)) {
            newMix.tracks.forEach(track => {
                if (typeof track === 'object' && track !== null) {
                    if (typeof lookupVerifiedCatalog === 'function') {
                        const verified = lookupVerifiedCatalog(track.artist, track.title);
                        if (verified) {
                            track.bpm = verified.bpm;
                            track.key = verified.key;
                            track.musicalKey = verified.musicalKey;
                            track.verified = true;
                            track.source = verified.source;
                            track.databaseName = verified.databaseName;
                        }
                    }
                    if (!track.verified && typeof parseHarmonicKey === 'function') {
                        const parsed = parseHarmonicKey(track.key);
                        if (parsed) {
                            track.key = parsed.camelot;
                            track.musicalKey = parsed.name;
                        }
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

// ── Discovery Popularity Chips (Main Interface) ──
function getActiveDiscoveryChip() {
    const activeBtn = document.querySelector('.discovery-chip.active');
    if (activeBtn) return activeBtn.dataset.mode;
    return localStorage.getItem('soundhunt_discovery_chip') || 'balanced';
}

function setDiscoveryChip(mode) {
    document.querySelectorAll('.discovery-chip').forEach(btn => {
        if (btn.dataset.mode === mode) {
            btn.classList.add('active', 'border-[#39ff14]', 'text-[#39ff14]', 'bg-[#0a2a0a]', 'shadow-[0_0_8px_rgba(57,255,20,0.3)]');
            btn.classList.remove('border-[#444]', 'border-[#333]', 'text-white', 'text-[#888]', 'bg-[#0a0a0a]');
        } else {
            btn.classList.remove('active', 'border-[#39ff14]', 'text-[#39ff14]', 'bg-[#0a2a0a]', 'shadow-[0_0_8px_rgba(57,255,20,0.3)]');
            btn.classList.add('border-[#444]', 'text-white', 'bg-[#0a0a0a]');
            btn.classList.remove('text-[#888]');
        }
    });
    localStorage.setItem('soundhunt_discovery_chip', mode);
}

// ── Dig Deeper Modal Controller (Magnifying Glass) ──
let _digDeeperTarget = {
    ts: null,
    index: null,
    artist: '',
    title: '',
    count: 5
};

function openDigDeeperModal(ts, index, artist, title) {
    _digDeeperTarget = {
        ts,
        index,
        artist: (artist || '').trim(),
        title: (title || '').trim(),
        count: 5
    };

    const label = _digDeeperTarget.artist
        ? `${_digDeeperTarget.artist} - ${_digDeeperTarget.title}`
        : _digDeeperTarget.title;

    const seedEl = document.getElementById('dig-deeper-seed');
    if (seedEl) seedEl.textContent = label;

    setDigDeeperCount(5);

    const modal = document.getElementById('dig-deeper-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeDigDeeperModal() {
    const modal = document.getElementById('dig-deeper-modal');
    if (modal) modal.classList.add('hidden');
}

function setDigDeeperCount(cnt) {
    const count = Math.max(1, Math.min(25, parseInt(cnt, 10) || 5));
    _digDeeperTarget.count = count;

    document.querySelectorAll('.dig-count-btn').forEach(btn => {
        const btnCount = parseInt(btn.dataset.count, 10);
        if (btnCount === count) {
            btn.classList.add('active', 'border-[#3399ff]', 'bg-[#002244]', 'text-[#3399ff]', 'shadow-[0_0_8px_rgba(51,153,255,0.3)]');
            btn.classList.remove('border-[#444]', 'bg-[#111]', 'text-white');
        } else {
            btn.classList.remove('active', 'border-[#3399ff]', 'bg-[#002244]', 'text-[#3399ff]', 'shadow-[0_0_8px_rgba(51,153,255,0.3)]');
            btn.classList.add('border-[#444]', 'bg-[#111]', 'text-white');
        }
    });

    const customInput = document.getElementById('dig-deeper-custom-count');
    if (customInput) customInput.value = count;
}

function onDigCustomCountChange(val) {
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 25) {
        _digDeeperTarget.count = parsed;
        document.querySelectorAll('.dig-count-btn').forEach(btn => {
            const btnCount = parseInt(btn.dataset.count, 10);
            if (btnCount === parsed) {
                btn.classList.add('active', 'border-[#3399ff]', 'bg-[#002244]', 'text-[#3399ff]', 'shadow-[0_0_8px_rgba(51,153,255,0.3)]');
                btn.classList.remove('border-[#444]', 'bg-[#111]', 'text-white');
            } else {
                btn.classList.remove('active', 'border-[#3399ff]', 'bg-[#002244]', 'text-[#3399ff]', 'shadow-[0_0_8px_rgba(51,153,255,0.3)]');
                btn.classList.add('border-[#444]', 'bg-[#111]', 'text-white');
            }
        });
    }
}

// Backwards compatibility alias
function promptSimilarTrackCount(artist, title, btn) {
    openDigDeeperModal(null, null, artist, title);
}

// ── Execute Dig Deeper: Append Similar Tracks to Existing Playlist ──
async function executeDigDeeper() {
    const { ts, artist, title, count } = _digDeeperTarget;
    const apiKey = getApiKey();
    if (!apiKey) {
        closeDigDeeperModal();
        if (typeof openSettings === 'function') openSettings();
        showError('API KEY REQUIRED. Click ⚙ to configure your Gemini key.');
        return;
    }

    const submitBtn = document.getElementById('dig-deeper-submit-btn');
    const originalHtml = submitBtn ? submitBtn.innerHTML : 'Hunt & Add Tracks';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Hunting Tracks...';
    }

    const songLabel = artist ? `${artist} - ${title}` : title;
    closeDigDeeperModal();

    showNotice(`🔍 Hunting ${count} similar tracks matching "${songLabel}"...`, 15000);

    const explicit = getPromptExplicit() === 'clean' ? 'Only choose CLEAN, non-explicit tracks.' : 'Explicit tracks are allowed.';
    const chip = getActiveDiscoveryChip();
    let depthGuidance = '';
    if (chip === 'deep-cuts') {
        depthGuidance = 'CRITICAL: Prioritize obscure gems, rare b-sides, and underground cuts that sound astonishingly close to this groove. Avoid commercial radio tracks.';
    } else if (chip === 'mainstream') {
        depthGuidance = 'Prioritize well-known essentials, iconic anthems, and popular songs that share this energy.';
    } else {
        depthGuidance = 'Provide a balanced blend of authentic gems, compatible classics, and exciting discoveries.';
    }

    const prompt = `You are an elite crate digger, sonic curator, and record specialist for SoundHunt.
Discover exactly ${count} tracks that share the authentic sonic DNA, groove, production era, and mood of:
Song: "${title}"
Artist: "${artist}"

${explicit}
${depthGuidance}

STRICT SELECTION CRITERIA:
- Unearth real, existing songs by genuine artists that sound like they belong in the exact same DJ crate or listening session.
- ZERO HALLUCINATIONS & FACTUAL ARTIST INTEGRITY: NEVER invent or guess songs or attribute tracks to the wrong artist. Every track MUST be a real, verified song that exists in official discographies (Spotify, GetSongBPM).
- PRIMARY ARTIST ATTRIBUTION: Always credit the official primary artist (e.g. "George Michael", NOT "Wham!"; "Phil Collins", NOT "Genesis"; "Sting", NOT "The Police").
- STRICT ERA AUTHENTICITY: If the seed song is from a specific decade (e.g. 80s, 90s, 70s, 2000s), every discovered track MUST be an authentic release from that era. Do NOT suggest modern retro revival tracks.
- Accurate real-world original studio BPM (integer) and Camelot Wheel key (e.g., 10B, 7A) for each track.
- Title: "Hunted from: ${artist ? artist + ' - ' : ''}${title}"
- Description: 2 short sentences explaining why these songs match this track's groove and vibe.`;

    try {
        const geminiResult = await executeGeminiGenerate(apiKey, prompt);
        const newTracks = Array.isArray(geminiResult.tracks) ? geminiResult.tracks : [];

        if (newTracks.length === 0) {
            showError('No similar tracks could be unearthed for this song.');
            return;
        }

        // Process keys and verify catalog for new tracks
        newTracks.forEach(track => {
            if (typeof track === 'object' && track !== null) {
                if (typeof lookupVerifiedCatalog === 'function') {
                    const verified = lookupVerifiedCatalog(track.artist, track.title);
                    if (verified) {
                        track.bpm = verified.bpm;
                        track.key = verified.key;
                        track.musicalKey = verified.musicalKey;
                        track.verified = true;
                        track.source = verified.source;
                        track.databaseName = verified.databaseName;
                        track.getsongUrl = verified.getsongUrl;
                    }
                }
                if (!track.verified && typeof parseHarmonicKey === 'function') {
                    const parsed = parseHarmonicKey(track.key);
                    if (parsed) {
                        track.key = parsed.camelot;
                        track.musicalKey = parsed.name;
                    }
                }
            }
        });

        // Find target mix in history
        const history = getHistory();
        let mix = history.find(m => m._timestamp === ts);

        if (mix && Array.isArray(mix.tracks)) {
            const startIndex = mix.tracks.length;
            mix.tracks.push(...newTracks);

            // Recalculate stats
            const bpms = mix.tracks.map(t => parseInt(t.bpm)).filter(b => !isNaN(b));
            if (bpms.length > 0) {
                mix.bpm = `${Math.min(...bpms)}-${Math.max(...bpms)}`;
            }

            saveHistory(history);
            rebuildFeed();

            // Trigger verification ONLY for newly appended tracks!
            if (typeof verifyNewTracksOnly === 'function') {
                verifyNewTracksOnly(mix, startIndex);
            }

            showNotice(`✓ Added ${newTracks.length} tracks similar to "${songLabel}" directly into playlist!`, 5000);

            // Scroll to the updated playlist
            setTimeout(() => {
                const card = document.querySelector(`[data-ts="${ts}"]`);
                if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        } else {
            // Fallback if mix not in history (e.g. demo card): create as standalone mix
            geminiResult._prompt = `Hunted from: ${artist ? artist + ' - ' : ''}${title}`;
            renderNewMix(geminiResult, true);
            showNotice(`✓ Created new playlist with ${newTracks.length} tracks similar to "${songLabel}"!`, 5000);
        }
    } catch (err) {
        showError(`Failed to unearth similar tracks: ${err.message}`);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalHtml;
        }
    }
}

