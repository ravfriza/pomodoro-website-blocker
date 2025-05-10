// Initialize translations if available
if (typeof applyTranslations === 'function') {
  applyTranslations();
}

// Update timer display
function updateTimer() {
  chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
    if (response) {
      const minutes = Math.floor(response.timeLeft / 60);
      const seconds = response.timeLeft % 60;
      const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      // Update the timer display
      document.getElementById('timeLeft').textContent = timeString;
      
      // Update the page title
      document.title = `Stay Focused! | ${timeString}`;
    }
  });
}

// Update timer every second
updateTimer();
setInterval(updateTimer, 1000); 