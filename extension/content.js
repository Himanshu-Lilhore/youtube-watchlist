
// Configuration
const BACKEND_URL = "https://youtube-watchlist-server.vercel.app";
const API_URL = `${BACKEND_URL}/api/items`;

// SVG Icons
const PLUS_ICON = `
<svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g><path d="M20 12h-8v8h-1v-8H3v-1h8V3h1v8h8v1z"></path></g></svg>
`;

const CHECK_ICON = `
<svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"></path></g></svg>
`;

// State
let currentVideoId = null;

function getVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
}

function createButton() {
    const button = document.createElement('button');
    button.id = 'yt-watchlist-add-btn';
    button.className = 'yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m';
    button.setAttribute('aria-label', 'Add to Watchlist');
    button.style.marginRight = '8px';
    button.style.marginTop = '8px';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';

    const iconSpan = document.createElement('span');
    iconSpan.style.width = '24px';
    iconSpan.style.height = '24px';
    iconSpan.style.marginRight = '6px';
    iconSpan.innerHTML = PLUS_ICON;

    const textSpan = document.createElement('span');
    textSpan.innerText = 'Add to Watchlist';
    textSpan.style.fontWeight = '500';
    textSpan.style.fontSize = '14px';

    button.appendChild(iconSpan);
    button.appendChild(textSpan);

    button.addEventListener('click', async () => {
        const videoUrl = window.location.href;

        // Show loading state
        button.disabled = true;
        textSpan.innerText = 'Adding...';

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: videoUrl }),
            });

            if (response.ok) {
                // Success state
                iconSpan.innerHTML = CHECK_ICON;
                textSpan.innerText = 'Added';
                button.classList.add('yt-watchlist-added');
                setTimeout(() => {
                    button.disabled = false;
                    // Reset explicitly if needed, but keeping "Added" is good feedback
                }, 2000);
            } else {
                throw new Error('Failed to add');
            }
        } catch (error) {
            console.error('Error adding to watchlist:', error);
            textSpan.innerText = 'Error';
            setTimeout(() => {
                textSpan.innerText = 'Add to Watchlist';
                button.disabled = false;
            }, 3000);
        }
    });

    return button;
}

function injectButton() {
    const videoId = getVideoId();
    if (!videoId) return;

    // Check if button already exists
    if (document.getElementById('yt-watchlist-add-btn')) return;

    // Target injection point: Actions row (near like/dislike/share)
    // Primary selector: #top-level-buttons-computed
    // Fallback: #menu-container #top-level-buttons-computed
    // Use standard querySelector which is more robust and supported by all browsers
    const actionsRow = document.querySelector('#above-the-fold #title');

    if (actionsRow) {
        const button = createButton();
        // Insert as the first item or before the "Share" button if possible
        actionsRow.appendChild(button);
        currentVideoId = videoId;
    }
}

// Observer to handle navigation and dynamic loading
const observer = new MutationObserver((mutations) => {
    const videoId = getVideoId();
    if (videoId && videoId !== currentVideoId) {
        // Remove old button if video changed
        const oldButton = document.getElementById('yt-watchlist-add-btn');
        if (oldButton) oldButton.remove();
        currentVideoId = null;
    }

    injectButton();
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Initial injection
injectButton();
