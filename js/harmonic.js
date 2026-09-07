// ── Camelot Wheel & Harmonic Mixing Engine ──
// Standard DJ harmonic mixing rules based on the Camelot Wheel

const CAMELOT_WHEEL = {
    // Minor Keys (A codes)
    '1A':  { root: 'G#', altRoot: 'Ab', mode: 'minor', name: 'G# Minor', altName: 'Ab Minor', number: 1, letter: 'A' },
    '2A':  { root: 'D#', altRoot: 'Eb', mode: 'minor', name: 'D# Minor', altName: 'Eb Minor', number: 2, letter: 'A' },
    '3A':  { root: 'A#', altRoot: 'Bb', mode: 'minor', name: 'A# Minor', altName: 'Bb Minor', number: 3, letter: 'A' },
    '4A':  { root: 'F',  altRoot: 'E#', mode: 'minor', name: 'F Minor',  altName: 'F Minor',  number: 4, letter: 'A' },
    '5A':  { root: 'C',  altRoot: 'B#', mode: 'minor', name: 'C Minor',  altName: 'C Minor',  number: 5, letter: 'A' },
    '6A':  { root: 'G',  altRoot: 'G',  mode: 'minor', name: 'G Minor',  altName: 'G Minor',  number: 6, letter: 'A' },
    '7A':  { root: 'D',  altRoot: 'D',  mode: 'minor', name: 'D Minor',  altName: 'D Minor',  number: 7, letter: 'A' },
    '8A':  { root: 'A',  altRoot: 'A',  mode: 'minor', name: 'A Minor',  altName: 'A Minor',  number: 8, letter: 'A' },
    '9A':  { root: 'E',  altRoot: 'E',  mode: 'minor', name: 'E Minor',  altName: 'E Minor',  number: 9, letter: 'A' },
    '10A': { root: 'B',  altRoot: 'Cb', mode: 'minor', name: 'B Minor',  altName: 'B Minor',  number: 10, letter: 'A' },
    '11A': { root: 'F#', altRoot: 'Gb', mode: 'minor', name: 'F# Minor', altName: 'Gb Minor', number: 11, letter: 'A' },
    '12A': { root: 'C#', altRoot: 'Db', mode: 'minor', name: 'C# Minor', altName: 'Db Minor', number: 12, letter: 'A' },

    // Major Keys (B codes)
    '1B':  { root: 'B',  altRoot: 'Cb', mode: 'major', name: 'B Major',  altName: 'B Major',  number: 1, letter: 'B' },
    '2B':  { root: 'F#', altRoot: 'Gb', mode: 'major', name: 'F# Major', altName: 'Gb Major', number: 2, letter: 'B' },
    '3B':  { root: 'C#', altRoot: 'Db', mode: 'major', name: 'C# Major', altName: 'Db Major', number: 3, letter: 'B' },
    '4B':  { root: 'G#', altRoot: 'Ab', mode: 'major', name: 'Ab Major', altName: 'G# Major', number: 4, letter: 'B' },
    '5B':  { root: 'D#', altRoot: 'Eb', mode: 'major', name: 'Eb Major', altName: 'D# Major', number: 5, letter: 'B' },
    '6B':  { root: 'A#', altRoot: 'Bb', mode: 'major', name: 'Bb Major', altName: 'A# Major', number: 6, letter: 'B' },
    '7B':  { root: 'F',  altRoot: 'E#', mode: 'major', name: 'F Major',  altName: 'F Major',  number: 7, letter: 'B' },
    '8B':  { root: 'C',  altRoot: 'B#', mode: 'major', name: 'C Major',  altName: 'C Major',  number: 8, letter: 'B' },
    '9B':  { root: 'G',  altRoot: 'G',  mode: 'major', name: 'G Major',  altName: 'G Major',  number: 9, letter: 'B' },
    '10B': { root: 'D',  altRoot: 'D',  mode: 'major', name: 'D Major',  altName: 'D Major',  number: 10, letter: 'B' },
    '11B': { root: 'A',  altRoot: 'A',  mode: 'major', name: 'A Major',  altName: 'A Major',  number: 11, letter: 'B' },
    '12B': { root: 'E',  altRoot: 'E',  mode: 'major', name: 'E Major',  altName: 'E Major',  number: 12, letter: 'B' }
};

// Direct note-to-Camelot lookup map
const MUSICAL_KEY_TO_CAMELOT = {
    // Minor
    'ab minor': '1A', 'abm': '1A', 'g# minor': '1A', 'g#m': '1A', 'ab min': '1A', 'g# min': '1A',
    'eb minor': '2A', 'ebm': '2A', 'd# minor': '2A', 'd#m': '2A', 'eb min': '2A', 'd# min': '2A',
    'bb minor': '3A', 'bbm': '3A', 'a# minor': '3A', 'a#m': '3A', 'bb min': '3A', 'a# min': '3A',
    'f minor': '4A', 'fm': '4A', 'f min': '4A',
    'c minor': '5A', 'cm': '5A', 'c min': '5A',
    'g minor': '6A', 'gm': '6A', 'g min': '6A',
    'd minor': '7A', 'dm': '7A', 'd min': '7A',
    'a minor': '8A', 'am': '8A', 'a min': '8A',
    'e minor': '9A', 'em': '9A', 'e min': '9A',
    'b minor': '10A', 'bm': '10A', 'b min': '10A', 'cb minor': '10A',
    'f# minor': '11A', 'f#m': '11A', 'gb minor': '11A', 'gbm': '11A', 'f# min': '11A', 'gb min': '11A',
    'c# minor': '12A', 'c#m': '12A', 'db minor': '12A', 'dbm': '12A', 'c# min': '12A', 'db min': '12A',

    // Major
    'b major': '1B', 'b maj': '1B', 'b': '1B', 'cb major': '1B',
    'f# major': '2B', 'f# maj': '2B', 'f#': '2B', 'gb major': '2B', 'gb maj': '2B', 'gb': '2B',
    'c# major': '3B', 'c# maj': '3B', 'c#': '3B', 'db major': '3B', 'db maj': '3B', 'db': '3B',
    'g# major': '4B', 'g# maj': '4B', 'g#': '4B', 'ab major': '4B', 'ab maj': '4B', 'ab': '4B',
    'd# major': '5B', 'd# maj': '5B', 'd#': '5B', 'eb major': '5B', 'eb maj': '5B', 'eb': '5B',
    'a# major': '6B', 'a# maj': '6B', 'a#': '6B', 'bb major': '6B', 'bb maj': '6B', 'bb': '6B',
    'f major': '7B', 'f maj': '7B', 'f': '7B',
    'c major': '8B', 'c maj': '8B', 'c': '8B',
    'g major': '9B', 'g maj': '9B', 'g': '9B',
    'd major': '10B', 'd maj': '10B', 'd': '10B',
    'a major': '11B', 'a maj': '11B', 'a': '11B',
    'e major': '12B', 'e maj': '12B', 'e': '12B'
};

/**
 * Normalizes and converts any musical key or Camelot notation into a structured object.
 * e.g., "F# minor", "11a", "F#m", "Gb major", "8B"
 * @param {string} rawKey
 * @returns {Object|null}
 */
/**
 * Normalizes and converts any musical key or Camelot notation into a structured object.
 * e.g., "F# minor", "11a", "F#m", "Gb major", "8B", "C-sharp minor", "11m", "C♯ minor"
 * @param {string} rawKey
 * @returns {Object|null}
 */
function parseHarmonicKey(rawKey) {
    if (!rawKey || typeof rawKey !== 'string') return null;
    const trimmed = rawKey.trim();

    // 1. Direct Camelot match anywhere (e.g., "11A", "8b", "Camelot: 7A", "8B - C Major", "C Major / 8B")
    const embeddedCamelot = trimmed.match(/\b([1-9]|1[0-2])([ABab])\b/);
    if (embeddedCamelot) {
        const num = parseInt(embeddedCamelot[1]);
        const letter = embeddedCamelot[2].toUpperCase();
        const code = `${num}${letter}`;
        const keyObj = CAMELOT_WHEEL[code];
        if (keyObj) {
            return {
                camelot: code,
                number: num,
                letter: letter,
                name: keyObj.name,
                altName: keyObj.altName,
                mode: keyObj.mode,
                root: keyObj.root
            };
        }
    }

    // 2. Open Key notation translation (e.g. 1m-12m for minor, 1d-12d for major)
    const openKeyMatch = trimmed.match(/\b([1-9]|1[0-2])([MDmd])\b/);
    if (openKeyMatch) {
        const openNum = parseInt(openKeyMatch[1]);
        const openLetter = openKeyMatch[2].toLowerCase();
        const camelotNum = ((openNum + 6) % 12) + 1;
        const camelotLetter = openLetter === 'm' ? 'A' : 'B';
        const code = `${camelotNum}${camelotLetter}`;
        const keyObj = CAMELOT_WHEEL[code];
        if (keyObj) {
            return {
                camelot: code,
                number: camelotNum,
                letter: camelotLetter,
                name: keyObj.name,
                altName: keyObj.altName,
                mode: keyObj.mode,
                root: keyObj.root
            };
        }
    }

    // 3. Normalize musical key string
    let lower = trimmed.toLowerCase()
        .replace(/key\s*of\s*/gi, '')
        .replace(/key\s*:\s*/gi, '')
        .replace(/scale\s*:\s*/gi, '')
        .replace(/[♯]/g, '#')
        .replace(/[♭]/g, 'b')
        .replace(/[\(\)\[\]\/,]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // Normalize spelled-out sharps and flats: "c sharp" -> "c#", "b flat" -> "bb", "c-sharp" -> "c#"
    lower = lower
        .replace(/([a-g])\s*[- ]\s*sharp/gi, '$1#')
        .replace(/([a-g])\s*[- ]\s*flat/gi, '$1b')
        .replace(/([a-g])\s*sharp/gi, '$1#')
        .replace(/([a-g])\s*flat/gi, '$1b')
        .replace(/-/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const camelotCode = MUSICAL_KEY_TO_CAMELOT[lower];
    if (camelotCode && CAMELOT_WHEEL[camelotCode]) {
        const keyObj = CAMELOT_WHEEL[camelotCode];
        return {
            camelot: camelotCode,
            number: keyObj.number,
            letter: keyObj.letter,
            name: keyObj.name,
            altName: keyObj.altName,
            mode: keyObj.mode,
            root: keyObj.root
        };
    }

    return null;
}

/**
 * Formats a key for display: e.g. "11A (F#m)" or "11A"
 * @param {string|Object} key
 * @param {boolean} includeName
 * @returns {string}
 */
function formatHarmonicKeyDisplay(key, includeName = false) {
    const parsed = typeof key === 'object' && key !== null ? key : parseHarmonicKey(key);
    if (!parsed) return typeof key === 'string' ? key : '—';
    if (includeName) {
        const shortName = parsed.mode === 'minor' ? `${parsed.root}m` : parsed.root;
        return `${parsed.camelot} (${shortName})`;
    }
    return parsed.camelot;
}

/**
 * Calculates the Camelot Wheel distance and harmonic compatibility between two keys.
 * Essential for DJ mixing transitions.
 * @param {string|Object} fromKey
 * @param {string|Object} toKey
 * @returns {Object} Compatibility analysis
 */
function getHarmonicTransition(fromKey, toKey) {
    const a = typeof fromKey === 'object' && fromKey !== null ? fromKey : parseHarmonicKey(fromKey);
    const b = typeof toKey === 'object' && toKey !== null ? toKey : parseHarmonicKey(toKey);

    if (!a || !b) {
        return {
            compatible: false,
            type: 'unknown',
            label: 'Transition',
            shortLabel: 'Mix',
            description: 'Standard track transition',
            color: '#888888',
            score: 50
        };
    }

    const sameNum = a.number === b.number;
    const sameLetter = a.letter === b.letter;

    // 1. Exact Match (Harmonic Lock) - Same number, same letter (e.g. 8A -> 8A)
    if (sameNum && sameLetter) {
        return {
            compatible: true,
            type: 'exact',
            label: 'Harmonic Lock (Same Key)',
            shortLabel: 'Lock ✓',
            description: `Flawless 100% harmonic blend in ${a.name}`,
            color: '#39ff14',
            bg: 'rgba(57,255,20,0.15)',
            border: '#1a7b1a',
            icon: 'fa-lock',
            score: 100
        };
    }

    // 2. Relative Key Switch - Same number, different letter (e.g. 8A -> 8B, A minor <-> C major)
    if (sameNum && !sameLetter) {
        return {
            compatible: true,
            type: 'relative',
            label: 'Relative Major/Minor Shift',
            shortLabel: 'Relative ⇄',
            description: `Natural emotional modulation between ${a.name} and ${b.name}`,
            color: '#ffcc00',
            bg: 'rgba(255,204,0,0.15)',
            border: '#665200',
            icon: 'fa-exchange-alt',
            score: 95
        };
    }

    // Calculate modular distance around the 12-hour Camelot wheel
    // Difference = (b - a) mod 12
    let diff = (b.number - a.number) % 12;
    if (diff < 0) diff += 12;

    // 3. Adjacent Wheel Step with same letter
    if (sameLetter) {
        // +1 Clockwise: Energy Lift (e.g. 8A -> 9A)
        if (diff === 1) {
            return {
                compatible: true,
                type: 'energy-lift',
                label: '+1 Energy Lift',
                shortLabel: '+1 Lift ▲',
                description: `Smooth harmonic energy increase from ${a.camelot} to ${b.camelot}`,
                color: '#3399ff',
                bg: 'rgba(51,153,255,0.15)',
                border: '#0055aa',
                icon: 'fa-arrow-up',
                score: 90
            };
        }
        // -1 Counter-Clockwise: Deep/Relaxed Shift (e.g. 8A -> 7A)
        if (diff === 11) {
            return {
                compatible: true,
                type: 'energy-drop',
                label: '-1 Deep Shift',
                shortLabel: '-1 Deep ▼',
                description: `Smooth warm relaxation shift from ${a.camelot} to ${b.camelot}`,
                color: '#00e5ff',
                bg: 'rgba(0,229,255,0.15)',
                border: '#007788',
                icon: 'fa-arrow-down',
                score: 90
            };
        }
        // Energy Boost: +2 Semitones (Camelot +7)
        if (diff === 7) {
            return {
                compatible: true,
                type: 'energy-boost',
                label: 'High Energy Boost (+2 Semitones)',
                shortLabel: 'Boost ⚡',
                description: 'High-octane harmonic jump (+2 semitones) for peak crowd lift',
                color: '#ff9900',
                bg: 'rgba(255,153,0,0.15)',
                border: '#884400',
                icon: 'fa-bolt',
                score: 80
            };
        }
    }

    // 4. Diagonal mix: adjacent number + mode switch (e.g., 8A -> 9B or 8A -> 7B)
    if (!sameLetter && (diff === 1 || diff === 11)) {
        return {
            compatible: true,
            type: 'diagonal',
            label: 'Diagonal Harmonic Shift',
            shortLabel: 'Diagonal ↗',
            description: `Modern diagonal harmonic transition (${a.camelot} → ${b.camelot})`,
            color: '#bb86fc',
            bg: 'rgba(187,134,252,0.15)',
            border: '#552288',
            icon: 'fa-wave-square',
            score: 75
        };
    }

    // 5. Key Modulation / Clash (>2 steps away on wheel)
    return {
        compatible: false,
        type: 'modulation',
        label: 'Key Modulation',
        shortLabel: 'Modulate',
        description: `Different harmonic space (${a.camelot} → ${b.camelot}). Ideal for drum break / filter cut`,
        color: '#777777',
        bg: 'rgba(255,255,255,0.05)',
        border: '#333333',
        icon: 'fa-circle-notch',
        score: 45
    };
}

/**
 * Calculates BPM compatibility and delta advice between two tracks.
 * @param {number} bpmA
 * @param {number} bpmB
 * @returns {Object}
 */
function getBpmTransition(bpmA, bpmB) {
    const a = parseInt(bpmA);
    const b = parseInt(bpmB);
    if (!a || !b) return { delta: 0, advice: '—', label: '—', color: '#888' };

    const delta = b - a;
    const absDelta = Math.abs(delta);
    const pct = ((absDelta / a) * 100).toFixed(1);

    if (absDelta === 0) {
        return { delta: 0, absDelta: 0, pct: '0%', advice: 'Exact tempo match', label: 'Matched', color: '#39ff14' };
    }
    if (absDelta <= 3) {
        return { delta, absDelta, pct: `${pct}%`, advice: 'Seamless beatmatch pitch-bend', label: `${delta > 0 ? '+' : ''}${delta} BPM`, color: '#39ff14' };
    }
    if (absDelta <= 8) {
        return { delta, absDelta, pct: `${pct}%`, advice: 'Smooth tempo transition with pitch fader', label: `${delta > 0 ? '+' : ''}${delta} BPM`, color: '#3399ff' };
    }
    // Half-time / Double-time detection (e.g. 70 bpm to 140 bpm or 130 bpm to 65 bpm)
    if (Math.abs(b - a * 2) <= 4 || Math.abs(b - a / 2) <= 4) {
        return { delta, absDelta, pct: `${pct}%`, advice: 'Half-time / Double-time transition', label: '½x / 2x Flip', color: '#ffcc00' };
    }
    return { delta, absDelta, pct: `${pct}%`, advice: 'Wide tempo gap — use beat drop or breakdown', label: `${delta > 0 ? '+' : ''}${delta} BPM`, color: '#ff9900' };
}

/**
 * Sorts track items according to the Camelot Wheel (harmonic circular progression: 1A..12A, 1B..12B).
 * @param {Array} tracks
 * @returns {Array} New sorted array
 */
function sortTracksByCamelotOrder(tracks) {
    if (!Array.isArray(tracks)) return [];
    return [...tracks].sort((a, b) => {
        const keyA = parseHarmonicKey(typeof a === 'object' ? a.key : '');
        const keyB = parseHarmonicKey(typeof b === 'object' ? b.key : '');
        if (!keyA && !keyB) return 0;
        if (!keyA) return 1;
        if (!keyB) return -1;

        // Group minor (A) then major (B), then by number
        if (keyA.letter !== keyB.letter) {
            return keyA.letter.localeCompare(keyB.letter);
        }
        if (keyA.number !== keyB.number) {
            return keyA.number - keyB.number;
        }
        const bpmA = (typeof a === 'object' && a.bpm) ? parseInt(a.bpm) : 0;
        const bpmB = (typeof b === 'object' && b.bpm) ? parseInt(b.bpm) : 0;
        return bpmA - bpmB;
    });
}
