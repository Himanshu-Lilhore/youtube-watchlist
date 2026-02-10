const WATCHLIST_URL = "https://youtube-watchlist-coral.vercel.app/";

chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.create({ url: WATCHLIST_URL });
});
