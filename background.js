// Timer state
let timer;
let timeLeft;
let isRunning = false;
let isBreak = false;
let isPaused = false; // Track paused state
let pomodoroCount = 0; // Counter for completed Pomodoro sessions

// Default timer settings
const defaultSettings = {
  focusTime: 25,
  breakTime: 5,
  blockedSites: [
    'youtube.com',
    'facebook.com', 
    'instagram.com',
    'tiktok.com',
    'twitter.com',
    'x.com',
    'reddit.com',
    'pinterest.com',
    'snapchat.com',
    'tumblr.com',
    'discord.com',
    'twitch.tv'
  ]
};



// Check if URL matches any blocked site
function isBlockedSite(url, blockedSites) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return blockedSites.some(site => 
      hostname === site.toLowerCase() || 
      hostname === `www.${site.toLowerCase()}`
    );
  } catch (error) {
    console.error('Error checking blocked site:', error);
    return false;
  }
}

// Handle web navigation
chrome.webNavigation.onCommitted.addListener(async (details) => {
  // Only handle main frame navigation (not iframes)
  if (details.frameId === 0 && !isBreak && isRunning) {
    try {
      const settings = await chrome.storage.sync.get(defaultSettings);
      if (isBlockedSite(details.url, settings.blockedSites)) {
        chrome.tabs.update(details.tabId, {
          url: chrome.runtime.getURL('block.html')
        });
      }
    } catch (error) {
      console.error('Error in navigation handler:', error);
    }
  }
});

// Monitor tab updates to catch all URL changes
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only proceed if the URL has changed and we're not in break mode
  if (changeInfo.url && !isBreak && isRunning) {
    try {
      const settings = await chrome.storage.sync.get(defaultSettings);
      if (isBlockedSite(changeInfo.url, settings.blockedSites)) {
        chrome.tabs.update(tabId, {
          url: chrome.runtime.getURL('block.html')
        });
      }
    } catch (error) {
      console.error('Error in tab update handler:', error);
    }
  }
});

// Broadcast state changes to all open popups
function broadcastStateUpdate() {
  chrome.runtime.sendMessage({
    action: 'stateUpdate',
    timeLeft,
    isRunning,
    isBreak,
    isPaused,
    pomodoroCount
  }, () => {
    if (chrome.runtime.lastError) {
      // No receiver, ignore the error
      return;
    }
  });
}

// Helper: Save timer state to storage
function saveTimerState() {
  const stateToSave = {
    startTimestamp: timerState.startTimestamp || null,
    duration: timerState.duration || null,
    isRunning,
    isBreak,
    isPaused,
    timeLeft: Math.max(0, timeLeft), // Ensure timeLeft is never negative
    version: 1 // State version for future migrations
  };
  
  chrome.storage.sync.set({
    timerState: stateToSave
  }).catch(error => {
    console.error('Failed to save timer state:', error);
  });
}

// Helper: Load timer state from storage
function loadTimerState(callback) {
  chrome.storage.sync.get(['timerState'], (data) => {
    const state = data.timerState || {};
    
    // Validate and sanitize state
    if (state.timeLeft !== undefined) {
      state.timeLeft = Math.max(0, parseInt(state.timeLeft) || 0);
    }
    if (state.isRunning !== undefined) {
      state.isRunning = Boolean(state.isRunning);
    }
    if (state.isBreak !== undefined) {
      state.isBreak = Boolean(state.isBreak);
    }
    if (state.isPaused !== undefined) {
      state.isPaused = Boolean(state.isPaused);
    }
    
    callback(state);
  });
}

// Timer state object for persistence
let timerState = {};
let isInitialized = false;

// Initialize service worker every time it starts (crucial for Manifest V3)
async function initializeServiceWorker() {
  if (isInitialized) return;
  
  console.log('🚀 Service worker initializing...');
  isInitialized = true;
  
  try {
    // Load pomodoroCount from storage first
    const result = await chrome.storage.sync.get(['pomodoroCount']);
    pomodoroCount = result.pomodoroCount || 0;
    
    // Then restore timer state
    restoreTimerState();
  } catch (error) {
    console.error('Error initializing service worker:', error);
    // Fallback initialization
    pomodoroCount = 0;
    restoreTimerState();
  }
}

// Call initialization immediately when service worker starts
initializeServiceWorker();

// On extension startup, restore timer state
chrome.runtime.onStartup.addListener(() => {
  console.log('🔄 Browser startup detected');
  isInitialized = false; // Reset flag
  initializeServiceWorker();
});

// Initialize extension when installed
chrome.runtime.onInstalled.addListener((details) => {
  console.log('🔧 Extension installed/updated:', details.reason);
  if (details.reason === 'install') {
    chrome.storage.sync.set({
      ...defaultSettings, 
      pomodoroCount: 0
    });
  }
  isInitialized = false; // Reset flag
  initializeServiceWorker();
});

// Function to restore timer state with better error handling
function restoreTimerState() {
  console.log('🔄 Restoring timer state...');
  loadTimerState((state) => {
    try {
      console.log('📊 Loaded state:', state);
      
      if (state && state.duration && state.startTimestamp && state.isRunning && !state.isPaused) {
        // Timer was running when browser closed
        const now = Date.now();
        const elapsed = Math.floor((now - state.startTimestamp) / 1000);
        const calculatedTimeLeft = Math.max(0, state.duration - elapsed);
        
        console.log(`⏱️ Timer was running. Elapsed: ${elapsed}s, Remaining: ${calculatedTimeLeft}s`);
        
        timeLeft = calculatedTimeLeft;
        isBreak = state.isBreak || false;
        isPaused = false;
        isRunning = timeLeft > 0;
        
        if (isRunning && timeLeft > 0) {
          console.log('▶️ Resuming timer...');
          startTimer();
        } else {
          console.log('⏰ Timer completed while browser was closed');
          isRunning = false;
          handleTimerComplete();
        }
      } else if (state && state.isPaused && typeof state.timeLeft === 'number') {
        // Timer was paused when browser closed
        console.log('⏸️ Timer was paused, restoring paused state');
        timeLeft = state.timeLeft;
        isBreak = state.isBreak || false;
        isPaused = true;
        isRunning = false;
      } else if (state && typeof state.timeLeft === 'number') {
        // Timer was stopped but had some state
        console.log('⏹️ Timer was stopped, restoring stopped state');
        timeLeft = state.timeLeft;
        isBreak = state.isBreak || false;
        isPaused = false;
        isRunning = false;
      } else {
        // No valid state found, use defaults
        console.log('🆕 No valid state found, using defaults');
        chrome.storage.sync.get(defaultSettings, (settings) => {
          timeLeft = (settings.focusTime || 25) * 60;
          isBreak = false;
          isPaused = false;
          isRunning = false;
          updateBadgeText();
          broadcastStateUpdate();
        });
        return; // Early return since we're using async callback
      }
      
      updateBadgeText();
      broadcastStateUpdate();
      console.log('✅ Timer state restored successfully');
    } catch (error) {
      console.error('❌ Error restoring timer state:', error);
      // Reset to default state on error
      chrome.storage.sync.get(defaultSettings, (settings) => {
        timeLeft = (settings.focusTime || 25) * 60;
        isBreak = false;
        isPaused = false;
        isRunning = false;
        updateBadgeText();
        broadcastStateUpdate();
      });
    }
  });
}

// Timer control functions
function startTimer() {
  if (!isRunning) {
    isRunning = true;
    isPaused = false;
    timerState.startTimestamp = Date.now();
    timerState.duration = timeLeft;
    saveTimerState();
    
    // Use more accurate timing mechanism
    const startTime = Date.now();
    const initialTimeLeft = timeLeft;
    
    timer = setInterval(() => {
      try {
        // Calculate elapsed time more accurately
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        timeLeft = Math.max(0, initialTimeLeft - elapsed);
        
        // Update timestamp for persistence
        timerState.startTimestamp = Date.now() - (elapsed * 1000);
        
        updateBadgeText();
        broadcastStateUpdate(); // Broadcast timer updates
        saveTimerState();
        
        if (timeLeft <= 0) {
          clearInterval(timer);
          isRunning = false;
          isPaused = false;
          saveTimerState();
          handleTimerComplete();
        }
      } catch (error) {
        console.error('Error in timer interval:', error);
        // Stop timer on error to prevent issues
        clearInterval(timer);
        isRunning = false;
        isPaused = false;
        saveTimerState();
        broadcastStateUpdate();
      }
    }, 1000);
  }
}

function pauseTimer() {
  if (isRunning) {
    clearInterval(timer);
    isRunning = false;
    isPaused = true;
    saveTimerState();
    updateBadgeText();
    broadcastStateUpdate(); // Broadcast state update
  }
}

function resetTimer() {
  clearInterval(timer);
  isRunning = false;
  isPaused = false;
  chrome.storage.sync.get(defaultSettings, (settings) => {
    timeLeft = isBreak ? settings.breakTime * 60 : settings.focusTime * 60;
    saveTimerState();
    updateBadgeText();
    broadcastStateUpdate(); // Broadcast state update
  });
}

function handleTimerComplete() {
  timerState = {};
  saveTimerState();
  
  try {
    if (!isBreak) {
      // If completing a focus session, increment the counter
      pomodoroCount++;
      // Save the updated count to storage
      chrome.storage.sync.set({ pomodoroCount });
      
      // Switch to break
      isBreak = true;
      
      chrome.storage.sync.get(defaultSettings, (settings) => {
        if (chrome.runtime.lastError) {
          console.error('Error loading settings for break:', chrome.runtime.lastError);
          timeLeft = 5 * 60; // Fallback to 5 minutes
        } else {
          timeLeft = settings.breakTime * 60;
        }
        
        updateBadgeText();
        broadcastStateUpdate(); // Broadcast state update
        
        // Show notification for break
        chrome.notifications.create('break-notification', {
          type: 'basic',
          iconUrl: 'icon.png',
          title: 'Break Time! 🎉',
          message: `Great work! Take a ${Math.floor(timeLeft / 60)}-minute break.`,
          priority: 2
        }).catch(error => {
          console.error('Failed to show break notification:', error);
        });
      });
    } else {
      // Switching from break to focus
      isBreak = false;
      
      chrome.storage.sync.get(defaultSettings, (settings) => {
        if (chrome.runtime.lastError) {
          console.error('Error loading settings for focus:', chrome.runtime.lastError);
          timeLeft = 25 * 60; // Fallback to 25 minutes
        } else {
          timeLeft = settings.focusTime * 60;
        }
        
        updateBadgeText();
        broadcastStateUpdate(); // Broadcast state update
        
        // Show notification
        chrome.notifications.create('focus-notification', {
          type: 'basic',
          iconUrl: 'icon.png',
          title: 'Focus Time! 🎯',
          message: `Ready for Pomodoro #${pomodoroCount + 1}? Let's focus for ${Math.floor(timeLeft / 60)} minutes!`,
          priority: 2
        }).catch(error => {
          console.error('Failed to show focus notification:', error);
        });
      });
    }
  } catch (error) {
    console.error('Error in handleTimerComplete:', error);
    // Fallback behavior
    isBreak = false;
    timeLeft = 25 * 60;
    updateBadgeText();
    broadcastStateUpdate();
  }
}

// Update badge text with remaining time
function updateBadgeText() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const text = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  chrome.action.setBadgeText({ text });
  
  // Set badge color based on the current state
  const color = isBreak ? '#DAA520' : '#FE4F2D';
  chrome.action.setBadgeBackgroundColor({ color });
}

// Listen for messages from popup and blocking page
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Ensure service worker is initialized before handling requests
  if (!isInitialized) {
    console.log('⚠️ Service worker not initialized, initializing now...');
    initializeServiceWorker().then(() => {
      handleMessage(request, sender, sendResponse);
    });
    return true; // Keep message channel open for async response
  }
  
  return handleMessage(request, sender, sendResponse);
});

function handleMessage(request, sender, sendResponse) {
  switch (request.action) {
    case 'getState':
      console.log('📤 Sending state:', { timeLeft, isRunning, isBreak, isPaused, pomodoroCount });
      sendResponse({
        timeLeft,
        isRunning,
        isBreak,
        isPaused,
        pomodoroCount
      });
      return false;
    case 'start':
      // Only update timeLeft if starting fresh (not paused)
      if (!isRunning && !isPaused && request.focusTime && !isBreak) {
        timeLeft = request.focusTime * 60;
      } else if (!isRunning && !isPaused && request.breakTime && isBreak) {
        timeLeft = request.breakTime * 60;
      }
      updateBadgeText();
      startTimer();
      broadcastStateUpdate(); // Broadcast state update
      sendResponse({ success: true });
      return false;
    case 'resume':
      // Resume from paused state without resetting timeLeft
      if (isPaused) {
        startTimer();
        broadcastStateUpdate();
      }
      sendResponse({ success: true });
      return false;
    case 'pause':
      pauseTimer();
      sendResponse({ success: true });
      return false;
    case 'reset':
      resetTimer();
      sendResponse({ success: true });
      return false;
    case 'resetCount':
      pomodoroCount = 0;
      chrome.storage.sync.set({ pomodoroCount: 0 });
      sendResponse({ success: true });
      return false;
    default:
      return false;
  }
} 