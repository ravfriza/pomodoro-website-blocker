// Default settings
const defaultSettings = {
  focusTime: 25,
  breakTime: 5,
  blockedSites: ['youtube.com', 'facebook.com', 'instagram.com', 'tiktok.com', 'twitter.com', 'x.com', 'reddit.com', 'pinterest.com', 'snapchat.com', 'tumblr.com', 'discord.com', 'twitch.tv']
};

// Load saved settings
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(defaultSettings, (settings) => {
    document.getElementById('focusTime').value = settings.focusTime;
    document.getElementById('breakTime').value = settings.breakTime;
    renderBlockedSites(settings.blockedSites);
  });

  // Add event listeners
  document.getElementById('focusTime').addEventListener('change', saveSettings);
  document.getElementById('breakTime').addEventListener('change', saveSettings);
  document.getElementById('addSite').addEventListener('click', addNewSite);
});

// Render blocked sites
function renderBlockedSites(sites) {
  const container = document.getElementById('blockedSites');
  container.innerHTML = '';
  
  sites.forEach((site, index) => {
    const div = document.createElement('div');
    div.className = 'site-input';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = site;
    input.addEventListener('change', () => {
      chrome.storage.sync.get(defaultSettings, (settings) => {
        const updatedSites = [...settings.blockedSites];
        updatedSites[index] = input.value;
        chrome.storage.sync.set({ ...settings, blockedSites: updatedSites }, () => {
          showStatus('Site updated!', 'success');
        });
      });
    });
    
    const button = document.createElement('button');
    button.className = 'remove';
    button.textContent = 'Remove';
    button.addEventListener('click', () => {
      chrome.storage.sync.get(defaultSettings, (settings) => {
        const updatedSites = settings.blockedSites.filter((_, i) => i !== index);
        chrome.storage.sync.set({ ...settings, blockedSites: updatedSites }, () => {
          renderBlockedSites(updatedSites);
          showStatus('Site removed!', 'success');
        });
      });
    });
    
    div.appendChild(input);
    div.appendChild(button);
    container.appendChild(div);
  });
}

// Add new site
function addNewSite() {
  chrome.storage.sync.get(defaultSettings, (settings) => {
    const updatedSites = [...settings.blockedSites, ''];
    chrome.storage.sync.set({ ...settings, blockedSites: updatedSites }, () => {
      renderBlockedSites(updatedSites);
      showStatus('Site added. Please enter the website domain.', 'success');
    });
  });
}

// Save settings
function saveSettings() {
  chrome.storage.sync.get(defaultSettings, (settings) => {
    const updatedSettings = {
      focusTime: parseInt(document.getElementById('focusTime').value) || defaultSettings.focusTime,
      breakTime: parseInt(document.getElementById('breakTime').value) || defaultSettings.breakTime,
      blockedSites: settings.blockedSites
    };

    chrome.storage.sync.set(updatedSettings, () => {
      showStatus('Settings saved!', 'success');
    });
  });
}

// Show status message
function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = 'block';
  
  setTimeout(() => {
    status.style.display = 'none';
  }, 3000);
} 