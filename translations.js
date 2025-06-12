// Translations for the extension

// Available translations
const translations = {
  // English (default)
  en: {
    // Timer tab
    timerTab: "Timer",
    startButton: "Start",
    pauseButton: "Pause",
    resumeButton: "Resume",
    resetButton: "Reset",
    completedPomodorosLabel: "Completed:",
    resetCount: "Reset",
    
    // Settings tab
    settingsTab: "Settings",
    timerDuration: "Timer Duration",
    focusTime: "Focus Time",
    breakTime: "Break Time",
    language: "Language",
    blockedSites: "Blocked Sites",
    enterDomains: "Enter one domain per line (e.g., youtube.com)",
    settingsWarning: "Timer duration settings are disabled while timer is active",
    
    // Block page
    blockPageTitle: "Time to Focus!",
    blockPageGreeting: "Hey there! You're in the middle of a Pomodoro focus session.",
    blockPageMotivation: "You've got this! A few minutes of focused work can accomplish amazing things.",
    breakBeginsIn: "Your break begins in:",
    stayFocused: "Stay focused. You're doing great!",
    
    // Modals
    pauseTitle: "Pause Timer?",
    pauseDesc: "Take a quick break if needed",
    keepGoing: "Keep Going",
    pause: "Pause",
    resetTitle: "Reset Timer?",
    resetDesc: "Current progress will be lost",
    cancel: "Cancel",
    reset: "Reset",
    
    // Units
    min: "min",
    sites: "sites",
    site: "site"
  },
  
  // Bahasa Indonesia
  id: {
    // Timer tab
    timerTab: "Timer",
    startButton: "Mulai",
    pauseButton: "Jeda",
    resumeButton: "Lanjutkan",
    resetButton: "Reset",
    completedPomodorosLabel: "Selesai:",
    resetCount: "Reset",
    
    // Settings tab
    settingsTab: "Pengaturan",
    timerDuration: "Durasi Timer",
    focusTime: "Waktu Fokus",
    breakTime: "Waktu Istirahat",
    language: "Bahasa",
    blockedSites: "Situs Diblokir",
    enterDomains: "Masukkan satu domain per baris (contoh: youtube.com)",
    settingsWarning: "Pengaturan durasi timer dinonaktifkan saat timer aktif",
    
    // Block page
    blockPageTitle: "Yuk, Fokus Dulu!",
    blockPageGreeting: "Hai! Lagi sesi fokus nih, semangat ya!",
    blockPageMotivation: "Kamu pasti bisa kok! Sedikit lagi, hasilnya bakal keren!",
    breakBeginsIn: "Sebentar lagi istirahat, sabar ya:",
    stayFocused: "Tetap semangat, bentar lagi selesai kok!",
    
    // Modals
    pauseTitle: "Jeda Timer?",
    pauseDesc: "Ambil istirahat sejenak jika diperlukan",
    keepGoing: "Lanjutkan",
    pause: "Jeda",
    resetTitle: "Reset Timer?",
    resetDesc: "Progres saat ini akan hilang",
    cancel: "Batal",
    reset: "Reset",
    
    // Units
    min: "menit",
    sites: "situs",
    site: "situs"
  }
};

// Get current language from storage or use browser language
let currentLanguage = 'en'; // Default to English

// Load language preference from storage
chrome.storage.sync.get('language', (data) => {
  if (data.language) {
    currentLanguage = data.language;
    applyTranslations();
  }
});

// Apply translations to the page
function applyTranslations() {
  const elements = document.querySelectorAll('[data-i18n]');
  const lang = translations[currentLanguage] || translations.en;
  
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (lang[key]) {
      // If it's an input with placeholder
      if (element.placeholder !== undefined && key.endsWith('Placeholder')) {
        element.placeholder = lang[key];
      } 
      // If it has HTML content
      else {
        element.textContent = lang[key];
      }
    }
  });
}

// Initialize language selector
function initLanguageSelector() {
  const languageSelect = document.getElementById('languageSelect');
  if (!languageSelect) return;
  
  // Set current language
  languageSelect.value = currentLanguage;
  
  // Handle language change
  languageSelect.addEventListener('change', () => {
    currentLanguage = languageSelect.value;
    chrome.storage.sync.set({ language: currentLanguage });
    applyTranslations();
  });
}

// Apply translations when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initLanguageSelector();
  applyTranslations();
});

// Export for use in other scripts
window.i18n = {
  getMessage: function(key) {
    const lang = translations[currentLanguage] || translations.en;
    return lang[key] || key;
  }
}; 