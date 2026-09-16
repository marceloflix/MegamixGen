// ── Remove Individual Track from Curated Playlist (Pruning) ──
function removeTrackFromMix(ts, trackIndex, btn) {
    if (btn) {
        const badge = '<span class="text-[8.5px] font-extrabold uppercase text-[#ff3333] bg-[#220000] border border-[#ff3333] px-1 py-[1px] rounded shadow-[0_0_6px_rgba(255,51,51,0.6)] cursor-pointer select-none pointer-events-none">Delete?</span>';
        if (typeof armConfirmButton === 'function') {
            if (armConfirmButton(btn, badge, 'Click again to confirm delete', typeof DEFAULT_CONFIRM_TIMEOUT_MS !== 'undefined' ? DEFAULT_CONFIRM_TIMEOUT_MS : 8000, { width: 'auto', padding: '0 4px' })) {
                return;
            }
        }
    }

    const history = typeof getHistory === 'function' ? getHistory() : [];
    const mixIndex = history.findIndex(m => String(m._timestamp) === String(ts));

    // Animate DOM row removal
    const row = btn ? btn.closest('.track-row') : document.getElementById(`track-${ts}-${trackIndex}`);
    if (row) {
        row.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        row.style.opacity = '0';
        row.style.transform = 'translateX(-15px)';
    }

    // Close player if this playing track is being deleted
    if (typeof closeAudioPlayer === 'function' && typeof currentPreviewBtn !== 'undefined' && currentPreviewBtn && row && row.contains(currentPreviewBtn)) {
        closeAudioPlayer();
    }

    setTimeout(() => {
        if (mixIndex !== -1) {
            const mix = history[mixIndex];
            if (Array.isArray(mix.tracks) && trackIndex >= 0 && trackIndex < mix.tracks.length) {
                mix.tracks.splice(trackIndex, 1);

                if (typeof adjustSelectionAfterRemoval === 'function') {
                    adjustSelectionAfterRemoval(ts, trackIndex);
                }

                if (mix.tracks.length === 0) {
                    history.splice(mixIndex, 1);
                    saveHistory(history);
                    if (typeof rebuildFeed === 'function') rebuildFeed();
                    return;
                }

                saveHistory(history);
                if (typeof rebuildFeed === 'function') {
                    rebuildFeed();
                }
            }
        } else {
            // For demo card or transient card not yet in history
            if (row) row.remove();
            if (typeof adjustSelectionAfterRemoval === 'function') {
                adjustSelectionAfterRemoval(ts, trackIndex);
            }
            const card = document.querySelector(`[data-ts="${ts}"]`);
            if (card) {
                const remaining = card.querySelectorAll('.track-row').length;
                const countSpan = card.querySelector('.diag-track-count') || card.querySelectorAll('span.font-bold.text-\\[11px\\]')[0];
                if (countSpan) countSpan.textContent = remaining;
                if (remaining === 0) card.remove();
            }
        }
    }, 200);
}

// ── Copy Single Track ──
async function copyTrackName(span) {
    const track = span.getAttribute('data-track');
    try { await navigator.clipboard.writeText(track); }
    catch {
        const el = document.createElement('textarea');
        el.value = track;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    }
    const nameEl = span.querySelector ? span.querySelector('.track-name') : null;
    if (nameEl) {
        const orig = nameEl.innerHTML;
        nameEl.innerHTML = '<i class="fas fa-check text-[#39ff14] mr-1"></i><span class="text-[#39ff14]">Copied!</span>';
        setTimeout(() => { nameEl.innerHTML = orig; }, 1200);
    } else {
        const orig = span.innerHTML;
        span.innerHTML = '<i class="fas fa-check text-[#39ff14] mr-1"></i><span class="text-[#39ff14]">Copied!</span>';
        setTimeout(() => { span.innerHTML = orig; }, 1200);
    }
}

// ── Delete Individual Playlist ──
function deleteMix(btn, ts) {
    // If called with a button element, use inline confirmation with outside-click dismissal
    if (btn) {
        const badge = '<span class="text-[9px] font-extrabold uppercase text-[#ff3333] bg-[#220000] border border-[#ff3333] px-1.5 py-[2px] rounded shadow-[0_0_6px_rgba(255,51,51,0.6)] cursor-pointer select-none pointer-events-none">Delete?</span>';
        if (typeof armConfirmButton === 'function') {
            if (armConfirmButton(btn, badge, 'Click again to confirm delete', typeof DEFAULT_CONFIRM_TIMEOUT_MS !== 'undefined' ? DEFAULT_CONFIRM_TIMEOUT_MS : 8000)) {
                return;
            }
        }
    }

    const card = (btn && btn.closest('[data-ts]')) || document.querySelector(`[data-ts="${ts}"]`);
    if (!card) return;

    card.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    card.style.opacity = '0';
    card.style.transform = 'scale(0.95)';

    // Close player if playing track is within this deleted mix
    if (typeof closeAudioPlayer === 'function' && typeof currentPreviewBtn !== 'undefined' && currentPreviewBtn && card.contains(currentPreviewBtn)) {
        closeAudioPlayer();
    }

    setTimeout(() => {
        card.remove();
        if (ts) {
            const history = getHistory().filter(m => String(m._timestamp) !== String(ts));
            saveHistory(history);
        }
        updateHistoryControls();

        const container = document.getElementById('mixes-container');
        if (container && (!container.children || container.children.length === 0)) {
            container.innerHTML = '<div class="text-center text-[#555] text-[11px] py-8 uppercase tracking-widest"><i class="fas fa-compact-disc mr-2"></i>No playlists yet — enter a prompt above to hunt tracks.</div>';
        }
    }, 200);
}

// ── Batch Delete Selected Tracks from Playlist ──
function deleteSelectedTracks(ts, btn) {
    const selectedIndices = typeof getPlaylistSelection === 'function' ? getPlaylistSelection(ts) : null;
    if (!selectedIndices || selectedIndices.size === 0) return;

    const count = selectedIndices.size;
    if (btn) {
        const confirmHtml = `<i class="fas fa-trash-alt text-[10px] mr-1"></i> Confirm Delete?`;
        if (typeof armConfirmButton === 'function') {
            if (armConfirmButton(btn, confirmHtml, `Click again to confirm deleting selected tracks`, typeof DEFAULT_CONFIRM_TIMEOUT_MS !== 'undefined' ? DEFAULT_CONFIRM_TIMEOUT_MS : 8000)) {
                return;
            }
        }
    }

    // Close audio player if any playing track is among those selected for deletion
    if (typeof closeAudioPlayer === 'function' && typeof currentPreviewBtn !== 'undefined' && currentPreviewBtn) {
        const card = document.querySelector(`[data-ts="${ts}"]`);
        if (card) {
            selectedIndices.forEach(idx => {
                const row = document.getElementById(`track-${ts}-${idx}`);
                if (row && row.contains(currentPreviewBtn)) {
                    closeAudioPlayer();
                }
            });
        }
    }

    const history = typeof getHistory === 'function' ? getHistory() : [];
    const mixIndex = history.findIndex(m => String(m._timestamp) === String(ts));

    if (mixIndex !== -1) {
        const mix = history[mixIndex];
        if (Array.isArray(mix.tracks)) {
            mix.tracks = mix.tracks.filter((_, idx) => !selectedIndices.has(idx));

            if (typeof exitSelectionMode === 'function') exitSelectionMode(ts);

            if (mix.tracks.length === 0) {
                history.splice(mixIndex, 1);
                saveHistory(history);
                if (typeof rebuildFeed === 'function') rebuildFeed();
                if (typeof showNotice === 'function') showNotice('✓ Playlist deleted as all tracks were removed.', 4000);
                return;
            }

            saveHistory(history);
            if (typeof rebuildFeed === 'function') rebuildFeed();
            if (typeof showNotice === 'function') showNotice(`✓ Successfully removed ${count} tracks from playlist.`, 4000);
        }
    } else {
        // Fallback for transient or unpersisted demo card
        const card = document.querySelector(`[data-ts="${ts}"]`);
        if (card) {
            selectedIndices.forEach(idx => {
                const row = document.getElementById(`track-${ts}-${idx}`);
                if (row) row.remove();
            });
            const remaining = card.querySelectorAll('.track-row').length;
            const countSpan = card.querySelector('.diag-track-count') || card.querySelectorAll('span.font-bold.text-\\[11px\\]')[0];
            if (countSpan) countSpan.textContent = remaining;
            if (remaining === 0) card.remove();
        }
        if (typeof exitSelectionMode === 'function') exitSelectionMode(ts);
        if (typeof showNotice === 'function') showNotice(`✓ Successfully removed ${count} tracks.`, 4000);
    }
}
