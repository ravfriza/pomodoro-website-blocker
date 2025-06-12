// DOM Elements
const minutesElement = document.querySelector('.timer-digit.minutes');
const secondsElement = document.querySelector('.timer-digit.seconds');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resumeBtn = document.getElementById('resumeBtn');
const resetBtn = document.getElementById('resetBtn');
const pomodoroCountElement = document.getElementById('pomodoroCount');
const resetCountBtn = document.getElementById('resetCountBtn');
const focusTimeInput = document.getElementById('focusTime');
const breakTimeInput = document.getElementById('breakTime');
const blockedSitesInput = document.getElementById('blockedSites');
const sitesCountSpan = document.querySelector('.sites-count');
const themeToggle = document.getElementById('themeToggle');
const htmlElement = document.documentElement;
const settingsWarning = document.querySelector('.settings-warning');
const timerCircle = document.querySelector('.timer-circle');
const timerCircleProgress = document.querySelector('.timer-circle-progress');
const timerLabel = document.querySelector('.timer-label');

// Default blocked sites
const defaultBlockedSites = [
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
];

// Timer state
let timeLeft = 25 * 60; // Initialize to 25 minutes (1500 seconds)
let isRunning = false;
let isBreak = false;
let isPaused = false;
let saveTimeout; // Single declaration for save timeout
let lastTimeLeft = null;

// Calculate circle circumference
const circleRadius = 45;
const circleCircumference = 2 * Math.PI * circleRadius;
timerCircleProgress.style.strokeDasharray = circleCircumference;
timerCircleProgress.style.strokeDashoffset = circleCircumference;

// Hide timer digits initially
minutesElement.style.visibility = 'hidden';
secondsElement.style.visibility = 'hidden';
document.querySelector('.timer-separator').style.visibility = 'hidden';

// Load settings and initialize timer
function loadSettings() {
  chrome.storage.sync.get({
    focusTime: 25,
    breakTime: 5,
    blockedSites: defaultBlockedSites,
    theme: 'dark',
    pomodoroCount: 0
  }, (settings) => {
    // Update settings inputs
    focusTimeInput.value = settings.focusTime;
    breakTimeInput.value = settings.breakTime;
    
    // Update pomodoro count
    pomodoroCountElement.textContent = settings.pomodoroCount;
    
    // Initialize timer with focus time as default
    timeLeft = settings.focusTime * 60;
    isRunning = false;
    isBreak = false;
    isPaused = false;
    
    // Check if timer is already running in background
    chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
      if (response && typeof response.timeLeft === 'number' && !isNaN(response.timeLeft)) {
        timeLeft = response.timeLeft;
        isRunning = response.isRunning || false;
        isBreak = response.isBreak || false;
        isPaused = response.isPaused || false;
        
        // Update pomodoro count from background
        if (response.pomodoroCount !== undefined) {
          pomodoroCountElement.textContent = response.pomodoroCount;
        }
      }
      
      // Show timer digits and update display
      minutesElement.style.visibility = 'visible';
      secondsElement.style.visibility = 'visible';
      document.querySelector('.timer-separator').style.visibility = 'visible';
      updateDisplay(timeLeft);
      updateButtonVisibility(isRunning, isPaused);
    });
    
    // Update blocked sites
    const uniqueSites = [...new Set(settings.blockedSites)];
    blockedSitesInput.value = uniqueSites.join('\n');
    updateSitesCount(uniqueSites.length);

    // Set theme
    htmlElement.setAttribute('data-theme', settings.theme);
    updateThemeIcon(settings.theme);
  });
}

// Initial load
loadSettings();

// Update timer display
function updateDisplay(seconds) {
  // Ensure we have a valid number
  const timeInSeconds = Math.max(0, Math.floor(seconds) || 0);
  
  const minutes = Math.floor(timeInSeconds / 60);
  const remainingSeconds = timeInSeconds % 60;
  
  // Format numbers with leading zeros
  const minutesStr = minutes.toString().padStart(2, '0');
  const secondsStr = remainingSeconds.toString().padStart(2, '0');

  // Update display if values have changed
  if (minutesElement.textContent !== minutesStr) {
    minutesElement.textContent = minutesStr;
  }
  
  if (secondsElement.textContent !== secondsStr) {
    secondsElement.textContent = secondsStr;
  }

  // Update progress circle
  const totalTime = isBreak ? breakTimeInput.value * 60 : focusTimeInput.value * 60;
  const progress = 1 - (timeInSeconds / totalTime);
  const offset = circleCircumference * progress;
  timerCircleProgress.style.strokeDashoffset = offset;

  // Update timer label
  if (window.i18n && typeof window.i18n.getMessage === 'function') {
    timerLabel.textContent = isBreak ? window.i18n.getMessage('breakTime') : window.i18n.getMessage('focusTime');
  } else {
    timerLabel.textContent = isBreak ? 'Break Time' : 'Focus Time';
  }
  
  // Update circle color class
  timerCircle.classList.toggle('break', isBreak);
}

// Update display periodically and check sync
function checkSync() {
  try {
    chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting state:', chrome.runtime.lastError);
        return;
      }
      
      if (response && typeof response.timeLeft === 'number') {
        // Only update if time has changed significantly
        if (Math.abs(response.timeLeft - lastTimeLeft) >= 1) {
          timeLeft = response.timeLeft;
          isRunning = response.isRunning;
          isBreak = response.isBreak;
          isPaused = response.isPaused || false;
          updateDisplay(timeLeft);
          updateButtonVisibility(isRunning, isPaused);
          lastTimeLeft = timeLeft;
        }
      }
    });
  } catch (error) {
    console.error('Error in checkSync:', error);
  }
}

// Check sync more frequently when timer is running, less when idle
let syncInterval;
function updateSyncInterval() {
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  
  const interval = isRunning ? 500 : 2000; // 500ms when running, 2s when idle
  syncInterval = setInterval(checkSync, interval);
}

// Initial sync setup
updateSyncInterval();

// Update sync interval when state changes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'stateUpdate') {
    timeLeft = message.timeLeft;
    isRunning = message.isRunning;
    isBreak = message.isBreak;
    isPaused = message.isPaused || false;
    
    // Update count if provided
    if (message.pomodoroCount !== undefined) {
      pomodoroCountElement.textContent = message.pomodoroCount;
    }
    
    updateDisplay(timeLeft);
    updateButtonVisibility(isRunning, isPaused);
    updateSyncInterval(); // Update sync frequency based on new state
  }
});

// Theme toggle
themeToggle.addEventListener('click', () => {
  const currentTheme = htmlElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  htmlElement.setAttribute('data-theme', newTheme);
  chrome.storage.sync.set({ theme: newTheme });
  updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
  const iconPath = theme === 'dark' 
    ? 'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z'
    : 'M12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3zm0-2V3c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1s-1-.45-1-1zm0 14v-4c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1s-1-.45-1-1zm7-7h4c.55 0 1 .45 1 1s-.45 1-1 1h-4c-.55 0-1-.45-1-1s.45-1 1-1zM3 12h4c.55 0 1 .45 1 1s-.45 1-1 1H3c-.55 0-1-.45-1-1s.45-1 1-1z';
  
  themeToggle.querySelector('svg path').setAttribute('d', iconPath);
}

// Tab handling
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    // Remove active class from all tabs and contents
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to clicked tab and corresponding content
    tab.classList.add('active');
    const contentId = `${tab.dataset.tab}-content`;
    document.getElementById(contentId).classList.add('active');
  });
});

// Function to toggle input fields
function toggleInputs(disable) {
  // Disable/enable timer duration inputs (most important when timer is active)
  focusTimeInput.disabled = disable;
  breakTimeInput.disabled = disable;
  
  // Keep blocked sites input always enabled for user convenience
  // Users might want to add sites during a session
  blockedSitesInput.disabled = false;
  
  // Show/hide warning message for timer duration settings only
  settingsWarning.classList.toggle('visible', disable);
  
  // Add visual feedback to disabled inputs
  focusTimeInput.classList.toggle('disabled', disable);
  breakTimeInput.classList.toggle('disabled', disable);
}

// Update button visibility and input states
function updateButtonVisibility(isRunning, isPaused) {
  if (!isRunning) {
    // Initial state or stopped state
    startBtn.classList.remove('hidden');
    pauseBtn.classList.add('hidden');
    resumeBtn.classList.add('hidden');
    resetBtn.classList.add('hidden');
    toggleInputs(false); // Enable inputs
  } else if (isPaused) {
    // Timer is paused - show resume and reset buttons, disable inputs
    startBtn.classList.add('hidden');
    pauseBtn.classList.add('hidden');
    resumeBtn.classList.remove('hidden');
    resetBtn.classList.remove('hidden');
    toggleInputs(true); // Disable timer duration inputs when paused
  } else {
    // Timer is running - show both pause and reset buttons for immediate access
    startBtn.classList.add('hidden');
    pauseBtn.classList.remove('hidden');
    resumeBtn.classList.add('hidden');
    resetBtn.classList.remove('hidden');
    toggleInputs(true); // Disable inputs while running
  }
}

// Modal functions
function showModal(modalId, overlayId) {
  const modal = document.getElementById(modalId);
  const overlay = document.getElementById(overlayId);
  
  modal.style.display = 'block';
  overlay.style.display = 'block';
  
  // Trigger reflow
  modal.offsetHeight;
  overlay.offsetHeight;
  
  // Add visible class for animation
  modal.classList.add('visible');
  overlay.classList.add('visible');
}

function hideModal(modalId, overlayId) {
  const modal = document.getElementById(modalId);
  const overlay = document.getElementById(overlayId);
  
  // Remove visible class to trigger animation
  modal.classList.remove('visible');
  overlay.classList.remove('visible');
  
  // Wait for animation to complete before hiding
  setTimeout(() => {
    modal.style.display = 'none';
    overlay.style.display = 'none';
  }, 300);
}

// Settings functions
function updateSitesCount(count) {
  // Always use the latest translation
  if (window.i18n && typeof window.i18n.getMessage === 'function') {
    sitesCountSpan.textContent = count === 1 
      ? `1 ${window.i18n.getMessage('site')}` 
      : `${count} ${window.i18n.getMessage('sites')}`;
  } else {
    sitesCountSpan.textContent = count === 1 ? '1 site' : `${count} sites`;
  }
}

function saveSettings() {
  try {
    // Validate and clamp timer values
    const focusTime = Math.max(1, Math.min(60, parseInt(focusTimeInput.value) || 25));
    const breakTime = Math.max(1, Math.min(30, parseInt(breakTimeInput.value) || 5));
    
    // Clean and validate blocked sites
    const blockedSitesText = blockedSitesInput.value || '';
    const blockedSites = blockedSitesText
      .split('\n')
      .map(site => {
        // Clean and normalize each site
        const cleaned = site.trim().toLowerCase()
          .replace(/^https?:\/\//, '')  // Remove protocol
          .replace(/^www\./, '')        // Remove www
          .replace(/\/.*$/, '');        // Remove path
        return cleaned;
      })
      .filter(site => {
        // Validate domain format
        if (!site || site.length === 0) return false;
        
        // Basic domain validation (letters, numbers, dots, hyphens)
        const domainRegex = /^[a-z0-9.-]+\.[a-z]{2,}$/;
        return domainRegex.test(site);
      })
      .filter((site, index, self) => self.indexOf(site) === index); // Remove duplicates

    chrome.storage.sync.set({
      focusTime,
      breakTime,
      blockedSites
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Failed to save settings:', chrome.runtime.lastError);
        return;
      }
      
      // Update UI with validated values
      focusTimeInput.value = focusTime;
      breakTimeInput.value = breakTime;
      blockedSitesInput.value = blockedSites.join('\n');
      updateSitesCount(blockedSites.length);
      
      // Reset timer if it's not running
      if (!isRunning) {
        timeLeft = focusTime * 60;
        updateDisplay(timeLeft);
      }
    });
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// Event listeners
[focusTimeInput, breakTimeInput].forEach(input => {
  input.addEventListener('change', saveSettings);
});

// Optimized blocked sites input handling with debouncing
let lastValue = blockedSitesInput.value;

// Debounced save function to prevent excessive saves
function debouncedSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    if (lastValue !== blockedSitesInput.value) {
      lastValue = blockedSitesInput.value;
      saveSettings();
    }
  }, 1000); // Reduced to 1 second for better UX
}

blockedSitesInput.addEventListener('input', debouncedSave);
blockedSitesInput.addEventListener('paste', () => {
  // Handle paste events with a slight delay to get the final value
  setTimeout(debouncedSave, 50);
});

// Save immediately when user loses focus (better UX)
blockedSitesInput.addEventListener('blur', () => {
  clearTimeout(saveTimeout);
  if (lastValue !== blockedSitesInput.value) {
    lastValue = blockedSitesInput.value;
    saveSettings();
  }
});

// Timer control event listeners
document.getElementById('startBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ 
    action: 'start',
    focusTime: parseInt(focusTimeInput.value),
    breakTime: parseInt(breakTimeInput.value)
  });
  updateButtonVisibility(true, false);
});

document.getElementById('pauseBtn').addEventListener('click', () => {
  showModal('pauseModal', 'pauseOverlay');
});

document.getElementById('pauseConfirmBtn').addEventListener('click', () => {
  hideModal('pauseModal', 'pauseOverlay');
  chrome.runtime.sendMessage({ action: 'pause' });
  // The button visibility will be updated by state update from background
});

document.getElementById('resumeBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'resume' });
  // Button visibility will be updated by state update from background
});

document.getElementById('resetBtn').addEventListener('click', () => {
  showModal('resetModal', 'resetOverlay');
});

document.getElementById('resetConfirmBtn').addEventListener('click', () => {
  hideModal('resetModal', 'resetOverlay');
  chrome.runtime.sendMessage({ action: 'reset' });
  updateButtonVisibility(false, false);
});

document.getElementById('resetCancelBtn').addEventListener('click', () => {
  hideModal('resetModal', 'resetOverlay');
});

document.getElementById('pauseCancelBtn').addEventListener('click', () => {
  hideModal('pauseModal', 'pauseOverlay');
});

// Add an event listener for the reset count button
resetCountBtn.addEventListener('click', (e) => {
  e.stopPropagation(); // Prevent event bubbling
  chrome.runtime.sendMessage({ action: 'resetCount' }, (response) => {
    if (response && response.success) {
      pomodoroCountElement.textContent = '0';
    }
  });
});

// Update textarea placeholder on language change
function updateBlockedSitesPlaceholder() {
  if (window.i18n && typeof window.i18n.getMessage === 'function') {
    blockedSitesInput.placeholder = window.i18n.getMessage('enterDomains');
  }
}

// Call on load
updateBlockedSitesPlaceholder();

// If you have a language change event, call updateBlockedSitesPlaceholder there as well
const languageSelect = document.getElementById('languageSelect');
if (languageSelect) {
  languageSelect.addEventListener('change', () => {
    updateBlockedSitesPlaceholder();
    // Also update the sites count label
    const blockedSites = blockedSitesInput.value
      .split('\n')
      .map(site => site.trim().toLowerCase())
      .filter(site => site.length > 0)
      .filter((site, index, self) => self.indexOf(site) === index);
    updateSitesCount(blockedSites.length);
  });
}

// Remove themeToggle and related logic if not present in popup.html
delete window.themeToggle;

