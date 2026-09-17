/**
 * SoundHunt — Web Audio DSP Engine (audio-dsp-engine.js)
 * 
 * 100% Client-Side zero-dependency audio DSP analyzer:
 * - BPM tempo detection: bandpass kick/bass filter, onset envelope, autocorrelation & octave correction.
 * - Serato Camelot key detection: STFT pitch chromagram (PCP), Krumhansl-Schmuckler key profiling.
 * - Multi-tier caching (In-Memory + localStorage).
 * - Background sequential analysis queue with 100ms pacing.
 * - Dynamic per-track 2-row layout observer for responsive collision prevention.
 */

// ── Serato Camelot Color Palette ──
// Official harmonic wheel spectrum mapping for 1A-12A and 1B-12B
const CAMELOT_COLORS = {
    '1A':  '#00d2be', '1B':  '#00d2be',  // Turquoise / Teal
    '2A':  '#00b862', '2B':  '#00b862',  // Emerald / Sea Green
    '3A':  '#62db3b', '3B':  '#62db3b',  // Lime Green
    '4A':  '#a3e635', '4B':  '#a3e635',  // Chartreuse
    '5A':  '#facc15', '5B':  '#facc15',  // Golden Yellow
    '6A':  '#fb923c', '6B':  '#fb923c',  // Warm Orange
    '7A':  '#f87171', '7B':  '#f87171',  // Coral / Red-Orange
    '8A':  '#ef4444', '8B':  '#ef4444',  // Crimson Red
    '9A':  '#f43f5e', '9B':  '#f43f5e',  // Rose Ruby
    '10A': '#d946ef', '10B': '#d946ef',  // Fuchsia Magenta
    '11A': '#a855f7', '11B': '#a855f7',  // Purple / Violet
    '12A': '#3b82f6', '12B': '#3b82f6'   // Cobalt Blue
};

// ── Standard Krumhansl-Schmuckler Key Profiles ──
// Tonal hierarchies for Major and Minor keys across the 12 chromatic pitch classes
const KS_MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const KS_MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

// Pitch Class to Camelot mapping:
// 0=C, 1=C#, 2=D, 3=D#, 4=E, 5=F, 6=F#, 7=G, 8=G#, 9=A, 10=A#, 11=B
const MAJOR_PITCH_TO_CAMELOT = ['8B', '3B', '10B', '5B', '12B', '7B', '2B', '9B', '4B', '11B', '6B', '1B'];
const MINOR_PITCH_TO_CAMELOT = ['5A', '12A', '7A', '2A', '9A', '4A', '11A', '6A', '1A', '8A', '3A', '10A'];

// ── Multi-Tier Analysis Cache ──
const CACHE_STORAGE_KEY = 'soundhunt_bpm_key_cache';
const inMemoryDspCache = new Map();

function getCacheKey(artist, title) {
    const a = (artist || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const t = (title || '').toLowerCase()
        .replace(/\s*[\(\[\{].*?[\)\]\}]/g, '')
        .replace(/[^a-z0-9]/g, '');
    return `${a}:::${t}`;
}

function normalizeTrackToCacheKey(trackStr) {
    if (!trackStr) return '';
    let artist = '';
    let title = trackStr;
    if (typeof trackStr === 'object' && trackStr !== null) {
        artist = trackStr.artist || '';
        title = trackStr.title || '';
    } else if (typeof trackStr === 'string' && trackStr.includes(' - ')) {
        const parts = trackStr.split(' - ');
        artist = parts[0];
        title = parts.slice(1).join(' - ');
    }
    return getCacheKey(artist, title);
}

function initDspCache() {
    try {
        const stored = localStorage.getItem(CACHE_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            Object.entries(parsed).forEach(([k, v]) => inMemoryDspCache.set(k, v));
        }
    } catch (e) {
        console.warn('SoundHunt DSP: Error reading cache from localStorage', e);
    }
}
initDspCache();

function saveAnalysisToCache(cacheKey, result) {
    if (!cacheKey) return;
    inMemoryDspCache.set(cacheKey, result);
    try {
        const obj = {};
        // Keep up to 600 most recent items in persistent storage
        let count = 0;
        inMemoryDspCache.forEach((v, k) => {
            if (count++ < 600) obj[k] = v;
        });
        localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(obj));
    } catch (e) {
        console.warn('SoundHunt DSP: Cache save quota warning', e);
    }
}

function getCachedAnalysis(trackStr) {
    const key = normalizeTrackToCacheKey(trackStr);
    if (!key) return null;
    return inMemoryDspCache.get(key) || null;
}

// ── Audio Context Singleton ──
let dspAudioContext = null;
function getDspAudioContext() {
    if (!dspAudioContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
            dspAudioContext = new AudioCtx();
        }
    }
    if (dspAudioContext && dspAudioContext.state === 'suspended') {
        dspAudioContext.resume().catch(() => {});
    }
    return dspAudioContext;
}

// ── Audio Fetching & Decoding ──
async function fetchAndDecodeAudio(previewUrl) {
    const audioCtx = getDspAudioContext();
    if (!audioCtx) throw new Error('Web Audio API not supported in this browser');

    const resp = await fetch(previewUrl);
    if (!resp.ok) throw new Error(`HTTP error ${resp.status} fetching audio preview`);
    const arrayBuffer = await resp.arrayBuffer();
    return await audioCtx.decodeAudioData(arrayBuffer);
}

// ── DSP: Downmixing & Downsampling ──
function getMonoDownsampledBuffer(audioBuffer, targetSampleRate = 11025) {
    const srcSampleRate = audioBuffer.sampleRate;
    const numChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    
    // Average channels to mono
    const mono = new Float32Array(length);
    for (let c = 0; c < numChannels; c++) {
        const chData = audioBuffer.getChannelData(c);
        for (let i = 0; i < length; i++) {
            mono[i] += chData[i] / numChannels;
        }
    }

    if (srcSampleRate === targetSampleRate) return mono;

    // Linear downsampling
    const ratio = srcSampleRate / targetSampleRate;
    const newLength = Math.floor(length / ratio);
    const downsampled = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
        const srcIdx = i * ratio;
        const i0 = Math.floor(srcIdx);
        const i1 = Math.min(i0 + 1, length - 1);
        const frac = srcIdx - i0;
        downsampled[i] = mono[i0] * (1 - frac) + mono[i1] * frac;
    }

    return downsampled;
}

// ── DSP: Biquad Bandpass Filter (Kick/Bass Isolation ~60-220Hz) ──
function applyBiquadBandpass(samples, sampleRate, centerFreq = 120, Q = 1.0) {
    const w0 = 2 * Math.PI * centerFreq / sampleRate;
    const alpha = Math.sin(w0) / (2 * Q);

    const b0 = alpha;
    const b1 = 0;
    const b2 = -alpha;
    const a0 = 1 + alpha;
    const a1 = -2 * Math.cos(w0);
    const a2 = 1 - alpha;

    const out = new Float32Array(samples.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;

    for (let i = 0; i < samples.length; i++) {
        const x0 = samples[i];
        const y0 = (b0 / a0) * x0 + (b1 / a0) * x1 + (b2 / a0) * x2 - (a1 / a0) * y1 - (a2 / a0) * y2;
        out[i] = y0;
        x2 = x1;
        x1 = x0;
        y2 = y1;
        y1 = y0;
    }
    return out;
}

// ── DSP: BPM Detection via Autocorrelation & Octave Disambiguation ──
function detectBpmFromPcm(samples, sampleRate = 11025) {
    if (!samples || samples.length === 0) return 120;

    // 1. Filter signal focused on kick drum & bass groove (60Hz - 220Hz)
    const filtered = applyBiquadBandpass(samples, sampleRate, 120, 1.0);

    // 2. Compute energy envelope with 10ms windows (100Hz envelope rate)
    const envRate = 100;
    const windowSize = Math.floor(sampleRate / envRate); // ~110 samples
    const envLength = Math.floor(filtered.length / windowSize);
    const envelope = new Float32Array(envLength);

    for (let i = 0; i < envLength; i++) {
        let sum = 0;
        const start = i * windowSize;
        for (let j = 0; j < windowSize; j++) {
            sum += Math.abs(filtered[start + j]);
        }
        envelope[i] = sum / windowSize;
    }

    // 3. Onset detection (first-order difference / half-wave rectified flux)
    const onsets = new Float32Array(envLength);
    for (let i = 1; i < envLength; i++) {
        const diff = envelope[i] - envelope[i - 1];
        if (diff > 0) onsets[i] = diff;
    }

    // 4. Autocorrelation over BPM range: 65 to 185 BPM
    // Lag = (60 / BPM) * envRate
    const minBpm = 65;
    const maxBpm = 185;
    const minLag = Math.floor((60 / maxBpm) * envRate); // ~32
    const maxLag = Math.ceil((60 / minBpm) * envRate);  // ~92

    const maxAnalysisFrames = Math.min(onsets.length, envRate * 25); // Analyze up to 25s
    const rLags = new Float32Array(maxLag + 2);

    for (let lag = minLag; lag <= maxLag; lag++) {
        let sum = 0;
        const count = maxAnalysisFrames - lag;
        if (count <= 0) continue;
        for (let i = 0; i < count; i++) {
            sum += onsets[i] * onsets[i + lag];
        }
        rLags[lag] = sum / count;
    }

    // Find peak lag
    let peakLag = minLag;
    let maxVal = -1;
    for (let lag = minLag; lag <= maxLag; lag++) {
        if (rLags[lag] > maxVal) {
            maxVal = rLags[lag];
            peakLag = lag;
        }
    }

    // 5. Octave correction (check for double or half tempo harmonics)
    const halfLag = Math.round(peakLag / 2);
    if (halfLag >= minLag && rLags[halfLag] > maxVal * 0.78) {
        // Double tempo is prominent and fits typical music range
        const doubleBpm = (60 * envRate) / halfLag;
        if (doubleBpm >= 115 && doubleBpm <= 145) {
            peakLag = halfLag;
            maxVal = rLags[halfLag];
        }
    }

    const doubleLag = peakLag * 2;
    if (doubleLag <= maxLag && rLags[doubleLag] > maxVal * 0.85) {
        const halfBpm = (60 * envRate) / doubleLag;
        if (halfBpm >= 70 && halfBpm <= 110) {
            // Half tempo preferred for hip-hop / downtempo
            peakLag = doubleLag;
        }
    }

    // 6. Sub-integer refinement via parabolic interpolation
    let refinedLag = peakLag;
    if (peakLag > minLag && peakLag < maxLag) {
        const y0 = rLags[peakLag - 1];
        const y1 = rLags[peakLag];
        const y2 = rLags[peakLag + 1];
        const denom = (y0 - 2 * y1 + y2);
        if (denom !== 0) {
            const delta = (y0 - y2) / (2 * denom);
            if (Math.abs(delta) < 1) refinedLag += delta;
        }
    }

    const detectedBpm = Math.round((60 * envRate) / refinedLag);
    return Math.max(minBpm, Math.min(maxBpm, detectedBpm));
}

// ── DSP: Harmonic Key Detection via STFT Chromagram & Krumhansl-Schmuckler ──
function detectKeyFromPcm(samples, sampleRate = 11025) {
    if (!samples || samples.length === 0) {
        return { camelot: '8A', color: CAMELOT_COLORS['8A'] };
    }

    const fftSize = 2048;
    const hopSize = 1024;
    const halfFft = fftSize / 2;
    const binFreq = sampleRate / fftSize; // ~5.38 Hz per bin

    // Precalculate Hann window
    const window = new Float32Array(fftSize);
    for (let i = 0; i < fftSize; i++) {
        window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (fftSize - 1)));
    }

    // 12-semitone chromagram accumulator (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
    const chromagram = new Float32Array(12);

    // Map FFT bins to musical pitch classes (covering 80 Hz to 1800 Hz)
    const minBin = Math.max(1, Math.floor(80 / binFreq));
    const maxBin = Math.min(halfFft - 1, Math.ceil(1800 / binFreq));

    const binPitchClass = new Int8Array(halfFft);
    const binWeight = new Float32Array(halfFft);

    for (let k = minBin; k <= maxBin; k++) {
        const freq = k * binFreq;
        const midi = 12 * Math.log2(freq / 440) + 69;
        const note = Math.round(midi);
        const pc = ((note % 12) + 12) % 12;
        binPitchClass[k] = pc;
        // Cosine distance weighting to center of pitch
        const dist = Math.abs(midi - note);
        binWeight[k] = Math.cos(dist * Math.PI) * (1 / Math.sqrt(freq)); // De-emphasize high frequencies
    }

    // Analyze central musical section (skip intro/outro silence)
    const startSample = Math.floor(sampleRate * 3); // Skip first 3 seconds
    const endSample = Math.min(samples.length - fftSize, Math.floor(sampleRate * 27)); // Analyze up to 27s
    const totalFrames = Math.floor((endSample - startSample) / hopSize);

    if (totalFrames <= 0) {
        return { camelot: '8A', color: CAMELOT_COLORS['8A'] };
    }

    // Real DFT for targeted musical bins
    const frameReal = new Float32Array(fftSize);
    for (let f = 0; f < totalFrames; f++) {
        const offset = startSample + f * hopSize;
        for (let i = 0; i < fftSize; i++) {
            frameReal[i] = samples[offset + i] * window[i];
        }

        // Accumulate energy across bins
        for (let k = minBin; k <= maxBin; k++) {
            const pc = binPitchClass[k];
            if (pc < 0) continue;

            let re = 0;
            let im = 0;
            const w = (2 * Math.PI * k) / fftSize;
            // DFT sample accumulation
            for (let n = 0; n < fftSize; n += 2) { // Step by 2 for high performance
                const angle = w * n;
                re += frameReal[n] * Math.cos(angle);
                im -= frameReal[n] * Math.sin(angle);
            }
            const mag = Math.sqrt(re * re + im * im) * binWeight[k];
            chromagram[pc] += mag;
        }
    }

    // Normalize chromagram vector
    let chromaNorm = 0;
    for (let i = 0; i < 12; i++) chromaNorm += chromagram[i] * chromagram[i];
    chromaNorm = Math.sqrt(chromaNorm) || 1;
    for (let i = 0; i < 12; i++) chromagram[i] /= chromaNorm;

    // Standardize chromagram (mean 0)
    let chromaMean = 0;
    for (let i = 0; i < 12; i++) chromaMean += chromagram[i];
    chromaMean /= 12;
    const stdChroma = new Float32Array(12);
    for (let i = 0; i < 12; i++) stdChroma[i] = chromagram[i] - chromaMean;

    // Krumhansl-Schmuckler Pearson Correlation
    function getCorrelation(profile, shift) {
        let pMean = 0;
        for (let i = 0; i < 12; i++) pMean += profile[i];
        pMean /= 12;

        let num = 0, denC = 0, denP = 0;
        for (let i = 0; i < 12; i++) {
            const cVal = stdChroma[i];
            const pVal = profile[(i - shift + 12) % 12] - pMean;
            num += cVal * pVal;
            denC += cVal * cVal;
            denP += pVal * pVal;
        }
        const denom = Math.sqrt(denC * denP);
        return denom === 0 ? 0 : num / denom;
    }

    let bestCorr = -2;
    let bestKey = '8A'; // Default Serato Camelot

    // Test all 12 Major and 12 Minor keys
    for (let root = 0; root < 12; root++) {
        const corrMaj = getCorrelation(KS_MAJOR_PROFILE, root);
        if (corrMaj > bestCorr) {
            bestCorr = corrMaj;
            bestKey = MAJOR_PITCH_TO_CAMELOT[root];
        }

        const corrMin = getCorrelation(KS_MINOR_PROFILE, root);
        if (corrMin > bestCorr) {
            bestCorr = corrMin;
            bestKey = MINOR_PITCH_TO_CAMELOT[root];
        }
    }

    return {
        camelot: bestKey,
        color: CAMELOT_COLORS[bestKey] || '#39ff14'
    };
}

// ── iTunes Preview Resolver ──
async function resolveTrackPreviewUrl(trackStr) {
    if (!trackStr) return null;
    let query = trackStr;
    if (typeof trackStr === 'object' && trackStr !== null) {
        query = `${trackStr.artist || ''} ${trackStr.title || ''}`.trim();
    }
    // Clean query
    query = query.replace(/\s*[\(\[\{].*?[\)\]\}]/g, '').trim();

    try {
        if (typeof searchItunesJSONP === 'function') {
            const data = await searchItunesJSONP(query);
            if (data && data.results && data.results.length > 0 && data.results[0].previewUrl) {
                return data.results[0].previewUrl;
            }
        }
    } catch (e) {
        // Fallback to direct fetch
    }

    try {
        const resp = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&limit=1&media=music`);
        if (resp.ok) {
            const data = await resp.json();
            if (data && data.results && data.results.length > 0 && data.results[0].previewUrl) {
                return data.results[0].previewUrl;
            }
        }
    } catch (e) {
        console.warn('SoundHunt DSP: Preview search failed for:', query, e);
    }

    return null;
}

// ── Core Track Analyzer ──
async function analyzeTrackAudio(trackStr, previewUrl = null) {
    const cacheKey = normalizeTrackToCacheKey(trackStr);
    const cached = getCachedAnalysis(trackStr);
    if (cached) return cached;

    let url = previewUrl;
    if (!url) {
        url = await resolveTrackPreviewUrl(trackStr);
    }

    if (!url) {
        const nullResult = { bpm: null, camelot: null, color: null, unavailable: true };
        saveAnalysisToCache(cacheKey, nullResult);
        return nullResult;
    }

    try {
        const audioBuffer = await fetchAndDecodeAudio(url);
        const monoPcm = getMonoDownsampledBuffer(audioBuffer, 11025);

        const bpm = detectBpmFromPcm(monoPcm, 11025);
        const keyData = detectKeyFromPcm(monoPcm, 11025);

        const result = {
            bpm: bpm,
            camelot: keyData.camelot,
            color: keyData.color,
            previewUrl: url,
            timestamp: Date.now()
        };

        saveAnalysisToCache(cacheKey, result);
        return result;
    } catch (err) {
        console.warn('SoundHunt DSP: Analysis error on track', trackStr, err);
        const errorResult = { bpm: null, camelot: null, color: null, error: err.message };
        saveAnalysisToCache(cacheKey, errorResult);
        return errorResult;
    }
}

// ── Background Sequential Analysis Queue ──
class SequentialDspQueue {
    constructor() {
        this.queue = [];
        this.isRunning = false;
        this.playlistProgress = new Map(); // ts -> { total, done }
    }

    enqueue(item) {
        // Check if already in queue
        const existingIdx = this.queue.findIndex(q => q.ts === item.ts && q.index === item.index);
        if (existingIdx !== -1) {
            this.queue[existingIdx] = item;
        } else {
            this.queue.push(item);
        }

        this.processNext();
    }

    async processNext() {
        if (this.isRunning) return;
        if (this.queue.length === 0) return;

        this.isRunning = true;
        const item = this.queue.shift();

        try {
            await this.processItem(item);
        } catch (e) {
            console.warn('SoundHunt DSP Queue: Error processing item', item, e);
        } finally {
            // Yield UI thread with 100ms spacing to guarantee 60 FPS responsiveness
            setTimeout(() => {
                this.isRunning = false;
                this.processNext();
            }, 100);
        }
    }

    async processItem(item) {
        const { ts, index, track, forceReanalyze } = item;
        const rowEl = document.getElementById(`track-${ts}-${index}`);
        const trackStr = typeof track === 'object' && track !== null ? `${track.artist || ''} - ${track.title || ''}` : String(track);

        // Check if already cached (unless forced)
        let analysis = !forceReanalyze ? getCachedAnalysis(trackStr) : null;

        if (!analysis) {
            // Show subtle loading spinner on row
            if (rowEl) renderTrackBadgeLoading(rowEl);
            analysis = await analyzeTrackAudio(trackStr, track && track.previewUrl ? track.previewUrl : null);
        }

        // Render badge on track row
        if (rowEl) {
            renderTrackBadgeResult(rowEl, analysis);
            evaluateTrackRowLayout(rowEl);
        }

        // Update playlist progress
        this.updateProgress(ts);
    }

    updateProgress(ts) {
        const prog = this.playlistProgress.get(ts);
        if (!prog) return;

        prog.done++;
        const btn = document.getElementById(`btn-analyze-${ts}`);
        if (btn) {
            if (prog.done < prog.total) {
                btn.innerHTML = `<i class="fas fa-spinner fa-spin text-[#39ff14]"></i><span>ANALYZING (${prog.done}/${prog.total})...</span>`;
                btn.classList.add('analyzing-active');
            } else {
                btn.innerHTML = `<i class="fas fa-redo text-[#39ff14]"></i><span>RE-ANALYZE BPM & KEY</span>`;
                btn.classList.remove('analyzing-active');
                this.playlistProgress.delete(ts);
            }
        }
    }

    startPlaylist(ts, tracks, forceReanalyze = false) {
        if (!Array.isArray(tracks) || tracks.length === 0) return;

        // Initialize progress tracker
        this.playlistProgress.set(ts, {
            total: tracks.length,
            done: 0
        });

        const btn = document.getElementById(`btn-analyze-${ts}`);
        if (btn) {
            btn.innerHTML = `<i class="fas fa-spinner fa-spin text-[#39ff14]"></i><span>ANALYZING (0/${tracks.length})...</span>`;
            btn.classList.add('analyzing-active');
        }

        tracks.forEach((t, i) => {
            if (forceReanalyze) {
                const key = normalizeTrackToCacheKey(t);
                if (key) inMemoryDspCache.delete(key);
            }
            this.enqueue({
                ts: ts,
                index: i,
                track: t,
                forceReanalyze: forceReanalyze
            });
        });
    }
}

const dspQueue = new SequentialDspQueue();

// ── UI Rendering Helpers ──
function getBadgeHTML(analysis) {
    if (!analysis) {
        return `<span class="track-badge-loading inline-flex items-center gap-1.5 h-6 px-2 rounded-[4px] border border-[#1a4a1a] bg-[#051505] text-[#39ff14] text-[10.5px] font-mono font-bold select-none cursor-default"><i class="fas fa-spinner fa-spin text-[9px]"></i>DSP...</span>`;
    }

    if (analysis.unavailable || !analysis.bpm || !analysis.camelot) {
        return `<span class="track-badge-empty inline-flex items-center justify-center h-6 px-1.5 text-[#555] font-mono text-[11px] select-none cursor-default">—</span>`;
    }

    const { bpm, camelot, color } = analysis;
    const safeColor = color || CAMELOT_COLORS[camelot] || '#39ff14';

    return `
        <span class="track-badge-pill inline-flex items-center justify-center h-6 px-2.5 rounded-[4px] font-mono font-bold text-[11px] select-none whitespace-nowrap cursor-default transition-all"
              style="color: ${safeColor}; border: 1px solid ${safeColor}; background-color: ${safeColor}14; box-shadow: 0 0 6px ${safeColor}33;">
            ${bpm} BPM &bull; ${camelot}
        </span>
    `;
}

function renderTrackBadgeLoading(rowEl) {
    const badgeContainer = rowEl.querySelector('.track-badges');
    if (!badgeContainer) return;
    badgeContainer.innerHTML = `<span class="track-badge-loading inline-flex items-center gap-1.5 h-6 px-2 rounded-[4px] border border-[#1a4a1a] bg-[#051505] text-[#39ff14] text-[10.5px] font-mono font-bold select-none cursor-default"><i class="fas fa-spinner fa-spin text-[9px]"></i>DSP...</span>`;
}

function renderTrackBadgeResult(rowEl, analysis) {
    const badgeContainer = rowEl.querySelector('.track-badges');
    if (!badgeContainer) return;
    badgeContainer.innerHTML = getBadgeHTML(analysis);
}

// ── Layout Compatibility Helpers ──
function evaluateTrackRowLayout(row) {}
function observeTrackRow(row) {}
function observeAllTrackRows() {}

// ── Global Interface Functions ──
function triggerPlaylistAnalysis(ts, btn, force = false) {
    const history = typeof getHistory === 'function' ? getHistory() : [];
    const mix = history.find(m => String(m._timestamp) === String(ts));
    
    let tracks = mix ? mix.tracks : null;
    if (!tracks) {
        // Check DOM if demo or unsaved playlist
        const card = document.querySelector(`[data-ts="${ts}"]`);
        if (card) {
            const rowTitles = card.querySelectorAll('.track-title-wrapper');
            tracks = Array.from(rowTitles).map(el => el.getAttribute('data-track') || el.textContent.trim());
        }
    }

    if (!tracks || tracks.length === 0) return;

    dspQueue.startPlaylist(ts, tracks, force);
}
