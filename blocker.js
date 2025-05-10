// blocker.js

// Helper to get the hostname from the current location
function getHostname() {
  return window.location.hostname.replace(/^www\./, '').toLowerCase();
}

// Store last checked URL to detect SPA navigation
let lastUrl = location.href;

async function checkAndBlock() {
  // Don't run on the extension's own pages
  if (window.location.href.startsWith('chrome-extension://')) return;

  chrome.storage.sync.get(['focusTime', 'breakTime', 'blockedSites', 'pomodoroCount'], (settings) => {
    chrome.runtime.sendMessage({ action: 'getState' }, (state) => {
      if (chrome.runtime.lastError) {
        // No background script available, just return
        return;
      }
      const isFocus = state && state.isRunning && !state.isBreak && !state.isPaused;
      const blockedSites = settings.blockedSites || [];
      const currentHost = getHostname();
      if (isFocus && blockedSites.some(site => currentHost === site || currentHost.endsWith('.' + site))) {
        // Redirect to block page if not already there
        if (!window.location.href.includes('block.html')) {
          window.location.href = chrome.runtime.getURL('block.html');
        }
      }
    });
  });
}

// Initial check
checkAndBlock();

// Observe SPA navigation (URL changes without reload)
setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    checkAndBlock();
  }
}, 500); 