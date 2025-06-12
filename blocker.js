// blocker.js - Enhanced website blocking with better SPA detection

// Helper to get the hostname from the current location
function getHostname() {
  return window.location.hostname.replace(/^www\./, '').toLowerCase();
}

// Helper to normalize and validate blocked sites
function normalizeUrl(site) {
  if (!site || typeof site !== 'string') return '';
  return site.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
}

// Store last checked URL to detect SPA navigation
let lastUrl = location.href;
let isBlocking = false;

async function checkAndBlock() {
  // Don't run on the extension's own pages or special Chrome pages
  if (window.location.href.startsWith('chrome-extension://') || 
      window.location.href.startsWith('chrome://') ||
      window.location.href.startsWith('chrome-search://') ||
      window.location.href.startsWith('edge://') ||
      isBlocking) {
    return;
  }

  try {
    chrome.storage.sync.get(['focusTime', 'breakTime', 'blockedSites', 'pomodoroCount'], (settings) => {
      if (chrome.runtime.lastError) {
        console.error('Storage error:', chrome.runtime.lastError);
        return;
      }

      chrome.runtime.sendMessage({ action: 'getState' }, (state) => {
        if (chrome.runtime.lastError) {
          // No background script available, just return
          return;
        }
        
        const isFocus = state && state.isRunning && !state.isBreak && !state.isPaused;
        const blockedSites = (settings.blockedSites || []).map(normalizeUrl).filter(Boolean);
        const currentHost = getHostname();
        
        if (isFocus && blockedSites.length > 0) {
          const isBlocked = blockedSites.some(site => {
            if (!site) return false;
            return currentHost === site || 
                   currentHost.endsWith('.' + site) ||
                   site.includes(currentHost);
          });
          
          if (isBlocked && !window.location.href.includes('block.html')) {
            isBlocking = true;
            window.location.href = chrome.runtime.getURL('block.html');
          }
        }
      });
    });
  } catch (error) {
    console.error('Error in checkAndBlock:', error);
  }
}

// Initial check
checkAndBlock();

// Enhanced SPA navigation detection
let observer;

// Use MutationObserver for better SPA detection
if (typeof MutationObserver !== 'undefined') {
  observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      isBlocking = false; // Reset blocking flag
      setTimeout(checkAndBlock, 100); // Small delay to let page settle
    }
  });
  
  observer.observe(document, {
    childList: true,
    subtree: true
  });
}

// Fallback interval-based checking
setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    isBlocking = false; // Reset blocking flag
    checkAndBlock();
  }
}, 500);

// Listen for popstate events (back/forward navigation)
window.addEventListener('popstate', () => {
  setTimeout(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      isBlocking = false;
      checkAndBlock();
    }
  }, 100);
});

// Clean up observer when page unloads
window.addEventListener('beforeunload', () => {
  if (observer) {
    observer.disconnect();
  }
}); 