
// Configuration
const BACKEND_URL = "https://youtube-watchlist-server.vercel.app";
// const BACKEND_URL = "http://localhost:5000";
const API_URL = `${BACKEND_URL}/api/items`;

// SVG Icons
const PLUS_ICON = `
<svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g><path d="M20 12h-8v8h-1v-8H3v-1h8V3h1v8h8v1z"></path></g></svg>
`;

const CHECK_ICON = `
<svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"></path></g></svg>
`;

// Bookmark icon for "already in watchlist" state
const BOOKMARK_ICON = `
<svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"></path></g></svg>
`;

// Eye icon for "already watched" state
const EYE_ICON = `
<svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"></path></g></svg>
`;

// State
let currentVideoId = null;
let isChecking = false;

function getVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
}

function setButtonState(button, iconSpan, textSpan, state) {
    // state: 'add' | 'in-watchlist' | 'watched' | 'checking'
    button.classList.remove('yt-watchlist-added', 'yt-watchlist-in-list', 'yt-watchlist-watched');
    button.disabled = false;

    switch (state) {
        case 'checking':
            iconSpan.innerHTML = '';
            textSpan.innerText = 'Checking...';
            button.disabled = true;
            break;
        case 'in-watchlist':
            iconSpan.innerHTML = BOOKMARK_ICON;
            textSpan.innerText = 'In Watchlist';
            button.classList.add('yt-watchlist-in-list');
            button.disabled = true;
            break;
        case 'watched':
            iconSpan.innerHTML = EYE_ICON;
            textSpan.innerText = 'Already Watched';
            button.classList.add('yt-watchlist-watched');
            button.disabled = true;
            break;
        case 'add':
        default:
            iconSpan.innerHTML = PLUS_ICON;
            textSpan.innerText = 'Add to Watchlist';
            break;
    }
}

async function checkVideoStatus(videoId) {
    try {
        const response = await fetch(`${API_URL}/check/${encodeURIComponent(videoId)}`);
        if (!response.ok) return { inWatchlist: false };
        return await response.json();
    } catch (error) {
        console.error('Error checking watchlist status:', error);
        return { inWatchlist: false };
    }
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
        // Only actionable in the default "add" state (button is disabled otherwise)
        const videoUrl = window.location.href;

        setButtonState(button, iconSpan, textSpan, 'checking');
        textSpan.innerText = 'Adding...';
        button.disabled = true;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: videoUrl }),
            });

            if (response.ok) {
                setButtonState(button, iconSpan, textSpan, 'in-watchlist');
            } else {
                throw new Error('Failed to add');
            }
        } catch (error) {
            console.error('Error adding to watchlist:', error);
            textSpan.innerText = 'Error';
            setTimeout(() => {
                setButtonState(button, iconSpan, textSpan, 'add');
            }, 3000);
        }
    });

    return { button, iconSpan, textSpan };
}

async function injectButton() {
    const videoId = getVideoId();
    if (!videoId) return;

    // Check if button already exists
    if (document.getElementById('yt-watchlist-add-btn')) return;

    // Target injection point: Actions row (near like/dislike/share)
    const actionsRow = document.querySelector('#above-the-fold #title');

    if (actionsRow) {
        const { button, iconSpan, textSpan } = createButton();
        actionsRow.appendChild(button);
        currentVideoId = videoId;

        // Show a neutral "checking" state immediately, then resolve real state
        setButtonState(button, iconSpan, textSpan, 'checking');
        isChecking = true;

        const result = await checkVideoStatus(videoId);

        // Bail out if the video changed while the request was in flight,
        // or the button was removed from the DOM in the meantime.
        if (getVideoId() !== videoId || !document.body.contains(button)) {
            isChecking = false;
            return;
        }

        if (result.inWatchlist && result.status === 'watched') {
            setButtonState(button, iconSpan, textSpan, 'watched');
        } else if (result.inWatchlist) {
            setButtonState(button, iconSpan, textSpan, 'in-watchlist');
        } else {
            setButtonState(button, iconSpan, textSpan, 'add');
        }
        isChecking = false;
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

    if (!document.getElementById('yt-watchlist-add-btn')) {
        injectButton();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Initial injection
injectButton();
