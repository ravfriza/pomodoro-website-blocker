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

// Initialize settings
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get({
    ...defaultSettings, 
    pomodoroCount: 0
  }, (settings) => {
    timeLeft = settings.focusTime * 60;
    pomodoroCount = settings.pomodoroCount || 0;
    updateBadgeText();
  });
});

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
  chrome.storage.sync.set({
    timerState: {
      startTimestamp: timerState.startTimestamp || null,
      duration: timerState.duration || null,
      isRunning,
      isBreak,
      isPaused,
      timeLeft
    }
  });
}

// Helper: Load timer state from storage
function loadTimerState(callback) {
  chrome.storage.sync.get(['timerState'], (data) => {
    callback(data.timerState || {});
  });
}

// Timer state object for persistence
let timerState = {};

// On extension startup, restore timer state
chrome.runtime.onStartup.addListener(() => {
  loadTimerState((state) => {
    if (state && state.duration && state.startTimestamp && state.isRunning) {
      const now = Date.now();
      const elapsed = Math.floor((now - state.startTimestamp) / 1000);
      timeLeft = Math.max(0, state.duration - elapsed);
      isBreak = state.isBreak;
      isPaused = false;
      isRunning = timeLeft > 0;
      if (isRunning) {
        startTimer();
      } else {
        handleTimerComplete();
      }
    } else if (state && typeof state.timeLeft === 'number') {
      timeLeft = state.timeLeft;
      isBreak = state.isBreak;
      isPaused = state.isPaused;
      isRunning = false;
    }
    updateBadgeText();
    broadcastStateUpdate();
  });
});

// Timer control functions
function startTimer() {
  if (!isRunning) {
    isRunning = true;
    isPaused = false;
    timerState.startTimestamp = Date.now();
    timerState.duration = timeLeft;
    saveTimerState();
    timer = setInterval(() => {
      timeLeft--;
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
  if (!isBreak) {
    // If completing a focus session, increment the counter
    pomodoroCount++;
    // Save the updated count to storage
    chrome.storage.sync.set({ pomodoroCount });
    
    // Switch to break
    isBreak = true;
    
    chrome.storage.sync.get(defaultSettings, (settings) => {
      timeLeft = settings.breakTime * 60;
      updateBadgeText();
      broadcastStateUpdate(); // Broadcast state update
      
      // Show notification for break
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'Break Time!',
        message: 'Time for a short break!'
      });
    });
  } else {
    // Switching from break to focus
    isBreak = false;
    
    chrome.storage.sync.get(defaultSettings, (settings) => {
      timeLeft = settings.focusTime * 60;
      updateBadgeText();
      broadcastStateUpdate(); // Broadcast state update
      
      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'Focus Time!',
        message: `Time to focus! (Pomodoro #${pomodoroCount + 1})`
      });
    });
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
  switch (request.action) {
    case 'getState':
      sendResponse({
        timeLeft,
        isRunning,
        isBreak,
        isPaused,
        pomodoroCount
      });
      break;
    case 'start':
      // Update the timeLeft with custom values if provided
      if (!isRunning && request.focusTime && !isBreak) {
        timeLeft = request.focusTime * 60;
      } else if (!isRunning && request.breakTime && isBreak) {
        timeLeft = request.breakTime * 60;
      }
      updateBadgeText();
      startTimer();
      broadcastStateUpdate(); // Broadcast state update
      sendResponse({ success: true });
      break;
    case 'pause':
      pauseTimer();
      sendResponse({ success: true });
      break;
    case 'reset':
      resetTimer();
      sendResponse({ success: true });
      break;
    case 'resetCount':
      pomodoroCount = 0;
      chrome.storage.sync.set({ pomodoroCount: 0 });
      sendResponse({ success: true });
      break;
  }
  return true; // Required for async response
}); 