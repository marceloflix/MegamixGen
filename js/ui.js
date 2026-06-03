// ── Stage Stepper ──
const STAGES = [10, 20, 30, 40];
let stageIndex = 0;

function advanceStage() {
    stageIndex = (stageIndex + 1) % STAGES.length;
    const val  = STAGES[stageIndex];
    const numEl = document.getElementById('stage-num');
    numEl.classList.remove('stage-anim');
    void numEl.offsetWidth; // force reflow to restart animation
    numEl.textContent = val;
    numEl.classList.add('stage-anim');
    const dots = document.getElementById('stage-dots').children;
    for (let i = 0; i < dots.length; i++) {
        dots[i].style.background = i <= stageIndex ? '#39ff14' : '#222';
    }
}

function getTrackCount() { return STAGES[stageIndex]; }

// ── Scroll-to-Top Button ──
function initScrollToTop() {
    const btn = document.getElementById('scroll-top');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 200) { btn.style.opacity = '1'; btn.style.pointerEvents = 'auto'; }
        else                      { btn.style.opacity = '0'; btn.style.pointerEvents = 'none'; }
    });
    btn.addEventListener('mouseenter', function () { this.style.borderColor = '#39ff14'; });
    btn.addEventListener('mouseleave', function () { this.style.borderColor = '#333'; });
}

// ── App Initialisation ──
window.addEventListener('DOMContentLoaded', () => {
    initScrollToTop();
    document.body.classList.add(getTextSize());

    const history = getHistory();
    if (history.length > 0) {
        history.slice().reverse().forEach(mix => renderNewMix(mix, false));
        updateHistoryControls();
    } else {
        // Show demo mix on first launch
        setTimeout(() => {
            renderNewMix({
                title: 'System Initialization Mix',
                description: 'Welcome to the Megamix Gen AI Studio. This is a pre-calculated sequence to demonstrate system capabilities. Enter a prompt above to begin generating custom synthetic audio tracklists.',
                tracks: [
                    'Daft Punk - Technologic',
                    'The Chemical Brothers - Galvanize',
                    'Justice - D.A.N.C.E.',
                    'Fatboy Slim - Right Here, Right Now',
                    'Prodigy - Smack My Bitch Up'
                ],
                bpm:   '125-133',
                genre: 'Electronic Boot Sequence'
            });
        }, 500);
    }

    // Enter key triggers generation
    document.getElementById('ai-vibe').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') generateMix();
    });

    // Live prompt suggestions
    document.getElementById('ai-vibe').addEventListener('input', updatePromptSuggestions);
    populatePromptDatalist();

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { closeSettings(); closeStats(); }
        if (e.ctrlKey && e.key === 'k') { e.preventDefault(); document.getElementById('ai-vibe').focus(); }
    });
});
