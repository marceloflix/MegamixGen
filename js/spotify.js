// ── SoundHunt: Spotify Playlist Creator ──
// Uses Spotify Web API (PKCE Authorization) to directly create playlists in the user's Spotify account.

const SPOTIFY_CLIENT_ID_KEY = 'soundhunt_spotify_client_id';
const SPOTIFY_TOKEN_KEY = 'soundhunt_spotify_token';
const SPOTIFY_EXPIRES_KEY = 'soundhunt_spotify_expires';
const SPOTIFY_PENDING_MIX_KEY = 'soundhunt_pending_spotify_ts';

function getSpotifyClientId() {
    return (localStorage.getItem(SPOTIFY_CLIENT_ID_KEY) || '').trim();
}

function setSpotifyClientId(clientId) {
    if (clientId) {
        localStorage.setItem(SPOTIFY_CLIENT_ID_KEY, clientId.trim());
    } else {
        localStorage.removeItem(SPOTIFY_CLIENT_ID_KEY);
    }
}

function getSpotifyToken() {
    const token = localStorage.getItem(SPOTIFY_TOKEN_KEY);
    const expires = parseInt(localStorage.getItem(SPOTIFY_EXPIRES_KEY) || '0', 10);
    if (token && Date.now() < expires) {
        return token;
    }
    return null;
}

// ── PKCE Code Challenge Generator (Native Web Crypto) ──
async function generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let text = '';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

// ── Initiate Spotify PKCE Authorization ──
async function startSpotifyAuth(pendingTs = null) {
    const clientId = getSpotifyClientId();
    if (!clientId) {
        if (typeof openSettings === 'function') {
            openSettings();
            alert('Please enter your Spotify Client ID in Settings to enable 1-click playlist creation.');
        }
        return;
    }

    if (pendingTs) {
        localStorage.setItem(SPOTIFY_PENDING_MIX_KEY, pendingTs);
    }

    const verifier = generateRandomString(64);
    localStorage.setItem('spotify_code_verifier', verifier);
    const challenge = await generateCodeChallenge(verifier);

    const redirectUri = window.location.origin + window.location.pathname;
    const scope = 'playlist-modify-public playlist-modify-private';
    const params = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        code_challenge_method: 'S256',
        code_challenge: challenge,
        scope: scope
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

// ── Handle OAuth Callback on Page Load ──
async function handleSpotifyCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) return;

    const verifier = localStorage.getItem('spotify_code_verifier');
    const clientId = getSpotifyClientId();
    const redirectUri = window.location.origin + window.location.pathname;

    if (!verifier || !clientId) {
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }

    try {
        const body = new URLSearchParams({
            client_id: clientId,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri,
            code_verifier: verifier
        });

        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString()
        });

        const data = await response.json();
        if (data.access_token) {
            localStorage.setItem(SPOTIFY_TOKEN_KEY, data.access_token);
            const expiresInMs = (data.expires_in || 3600) * 1000;
            localStorage.setItem(SPOTIFY_EXPIRES_KEY, (Date.now() + expiresInMs).toString());
            localStorage.removeItem('spotify_code_verifier');

            // Clean URL bar
            window.history.replaceState({}, document.title, window.location.pathname);

            if (typeof showStashToast === 'function') {
                showStashToast('Connected to Spotify!');
            }

            // Check if there was a pending playlist creation
            const pendingTs = localStorage.getItem(SPOTIFY_PENDING_MIX_KEY);
            if (pendingTs) {
                localStorage.removeItem(SPOTIFY_PENDING_MIX_KEY);
                setTimeout(() => {
                    const card = document.querySelector(`[data-ts="${pendingTs}"]`);
                    const btn = card ? card.querySelector('.spotify-create-btn') : null;
                    createSpotifyPlaylist(pendingTs, btn);
                }, 500);
            }
        }
    } catch (err) {
        console.error('Spotify token exchange failed:', err);
    }
}

// ── Create Spotify Playlist from Curated Tracks ──
async function createSpotifyPlaylist(ts, btn) {
    const history = typeof getHistory === 'function' ? getHistory() : [];
    const mix = history.find(m => m._timestamp === ts);
    if (!mix || !Array.isArray(mix.tracks) || mix.tracks.length === 0) {
        alert('No tracks found to export.');
        return;
    }

    const clientId = getSpotifyClientId();
    if (!clientId) {
        const proceed = confirm(
            'Spotify Client ID required to create playlists directly in your account.\n\n' +
            'Click OK to open Settings and paste your Client ID (takes 1 minute from developer.spotify.com),\n' +
            'or Cancel to open these tracks on Spotify Search.'
        );
        if (proceed) {
            if (typeof openSettings === 'function') openSettings();
            const input = document.getElementById('spotify-client-id-input');
            if (input) input.focus();
        } else {
            // Fallback: search first track
            const first = mix.tracks[0];
            const q = typeof first === 'object' ? `${first.artist} ${first.title}` : first;
            window.open(`https://open.spotify.com/search/${encodeURIComponent(q)}`, '_blank', 'noopener');
        }
        return;
    }

    let token = getSpotifyToken();
    if (!token) {
        // Need to authenticate with Spotify
        await startSpotifyAuth(ts);
        return;
    }

    // Begin playlist creation process
    const originalHTML = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Creating Playlist...';
        btn.classList.add('opacity-75');
    }

    try {
        // 1. Get current Spotify User profile
        const meRes = await fetch('https://api.spotify.com/v1/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (meRes.status === 401) {
            // Token expired, re-auth
            localStorage.removeItem(SPOTIFY_TOKEN_KEY);
            await startSpotifyAuth(ts);
            return;
        }
        const user = await meRes.json();
        const userId = user.id;

        // 2. Create the playlist
        const playlistTitle = `SoundHunt: ${mix.title || mix._prompt || 'Curated Tracks'}`;
        const playlistDesc = `Hunted with SoundHunt (${mix.tracks.length} tracks). Vibe: ${mix._prompt || mix.genre || 'Various'}`;

        const createRes = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: playlistTitle,
                description: playlistDesc,
                public: false
            })
        });
        const playlistData = await createRes.json();
        const playlistId = playlistData.id;
        const playlistUrl = playlistData.external_urls?.spotify;

        // 3. Search and resolve Spotify Track URIs
        const trackUris = [];
        for (const t of mix.tracks) {
            const cleanA = typeof t === 'object' ? (t.artist || '').replace(/\s*[\(\[\{].*?[\)\]\}]/g, '').trim() : '';
            const cleanT = typeof t === 'object' ? (t.title || '').replace(/\s*[\(\[\{].*?[\)\]\}]/g, '').trim() : t;
            const query = cleanA ? `track:${cleanT} artist:${cleanA}` : cleanT;

            try {
                const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (searchRes.ok) {
                    const sData = await searchRes.json();
                    const item = sData.tracks?.items?.[0];
                    if (item && item.uri) {
                        trackUris.push(item.uri);
                    }
                }
            } catch (e) {
                console.warn('Track search error on Spotify:', query, e);
            }
        }

        // 4. Add found tracks to the new playlist
        if (trackUris.length > 0) {
            await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ uris: trackUris })
            });
        }

        // 5. Success UI
        if (btn) {
            btn.innerHTML = `<i class="fab fa-spotify mr-1 text-white"></i> Opened (${trackUris.length}/${mix.tracks.length})`;
            btn.classList.remove('opacity-75');
            btn.classList.add('bg-[#1db954]', 'text-white');
        }

        if (typeof showStashToast === 'function') {
            showStashToast(`Playlist created in Spotify with ${trackUris.length} tracks!`);
        }

        if (playlistUrl) {
            window.open(playlistUrl, '_blank', 'noopener,noreferrer');
        }
    } catch (err) {
        console.error('Failed to create Spotify playlist:', err);
        alert('Spotify Error: ' + (err.message || 'Could not create playlist. Check console.'));
        if (btn) btn.innerHTML = originalHTML;
    } finally {
        if (btn) btn.disabled = false;
    }
}

// Check callback on load
document.addEventListener('DOMContentLoaded', () => {
    handleSpotifyCallback();
});
