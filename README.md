# Pomodoro Timer & Website Blocker

A productivity-focused Chrome extension that combines the Pomodoro Technique with intelligent website blocking to help you stay focused and build better work habits.

## ✨ Features

### 🍅 Pomodoro Timer
- **Customizable Sessions**: Set focus time (1-60 minutes) and break time (1-30 minutes)
- **Visual Progress**: Beautiful circular progress indicator with real-time updates
- **Session Counter**: Track your completed Pomodoro sessions
- **Smart Notifications**: Get notified when sessions complete with motivational messages

### 🚫 Intelligent Website Blocking
- **Focus-Only Blocking**: Websites are only blocked during focus sessions, not breaks
- **Custom Block Lists**: Add your own distracting websites
- **Pre-configured Sites**: Includes popular social media and entertainment sites
- **SPA Detection**: Advanced blocking that works with modern single-page applications

### 🎨 User Experience
- **Dark/Light Themes**: Switch between themes to match your preference
- **Multi-language Support**: Available in English and Bahasa Indonesia
- **Persistent State**: Timer continues correctly across browser restarts
- **Responsive Design**: Clean, modern interface optimized for productivity

### 🔧 Technical Features
- **Manifest V3**: Built with the latest Chrome extension standards
- **Sync Storage**: Settings sync across your Chrome browsers
- **Performance Optimized**: Efficient background processing with minimal resource usage
- **Error Handling**: Robust error handling ensures reliability

## 📥 Installation

### Option 1: Chrome Web Store (Coming Soon)
*This extension will be available on the Chrome Web Store after final testing.*

### Option 2: Developer Mode Installation

1. **Download the Extension**
   ```bash
   git clone https://github.com/ravfriza/pomodoro-website-blocker.git
   cd pomodoro-website-blocker
   ```

2. **Open Chrome Extensions Page**
   - Open Google Chrome
   - Navigate to `chrome://extensions/`
   - Or go to Menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top right corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Select the project folder you downloaded
   - The extension should now appear in your extensions list

5. **Pin the Extension** (Recommended)
   - Click the extensions icon (puzzle piece) in Chrome toolbar
   - Find "Pomodoro Timer & Website Blocker"
   - Click the pin icon to keep it visible

## 🚀 Quick Start

1. **Set Your Preferences**
   - Click the extension icon to open the popup
   - Go to the "Settings" tab
   - Adjust focus time (default: 25 minutes) and break time (default: 5 minutes)
   - Add websites you want to block during focus sessions

2. **Start Your First Session**
   - Switch to the "Timer" tab
   - Click "Start" to begin your focus session
   - The timer will count down and block access to distracting websites

3. **Take Breaks**
   - When the focus session ends, you'll get a notification
   - The timer automatically switches to break mode
   - Blocked websites become accessible during breaks

## 🎯 Usage Guide

### Timer Controls
- **Start**: Begin a new focus or break session
- **Pause**: Temporarily pause the timer (can be resumed later)
- **Resume**: Continue from where you paused (time is preserved)
- **Reset**: Stop and reset the timer to the beginning

### Managing Blocked Sites
- Add one domain per line (e.g., `youtube.com`, `facebook.com`)
- Don't include `www.` or `https://` - just the domain name
- Changes are saved automatically
- Sites are only blocked during focus sessions

### Pomodoro Counter
- Tracks completed focus sessions
- Increments when you complete a full focus period
- Can be reset using the "Reset" button next to the counter

## 🧪 Testing Your Installation

To verify everything works correctly, you can run our built-in test suite:

1. Open the extension popup
2. Press F12 to open Developer Tools
3. Go to the Console tab
4. Run the test command:
   ```javascript
   pomodoroTests.runAllTests()
   ```

This will test:
- Timer start/pause/resume functionality
- State persistence across sessions
- Input validation and error handling

## 🛠️ Recent Improvements

### Version 2.0 (Latest)
- **🐛 Fixed Critical Bug**: Resume button now properly continues from paused time instead of resetting
- **⚡ Enhanced Performance**: Optimized timer accuracy and reduced resource usage
- **🔒 Improved Blocking**: Better detection of single-page applications and modern websites
- **📱 Better UX**: Improved error handling and user feedback
- **🔧 State Management**: More reliable state persistence across browser restarts
- **✅ Input Validation**: Better validation and sanitization of user inputs

## 🎨 Customization

### Themes
- Switch between dark and light themes using the theme toggle
- Theme preference is saved and synced across devices

### Languages
- Currently supports English and Bahasa Indonesia
- Language can be changed in the Settings tab

### Timer Settings
- Focus time: 1-60 minutes (default: 25)
- Break time: 1-30 minutes (default: 5)
- Settings are automatically validated and saved

## 🔧 Technical Details

### Architecture
- **Background Script**: Handles timer logic and website blocking
- **Popup Interface**: User interface for timer controls and settings
- **Content Script**: Monitors and blocks websites during focus sessions
- **Chrome APIs**: Uses notifications, storage, and web navigation APIs

### Privacy
- All data is stored locally on your device
- Uses Chrome's sync storage for settings backup
- No data is sent to external servers
- No tracking or analytics

## 🤝 Contributing

We welcome contributions! Please feel free to:
- Report bugs in the Issues section
- Suggest new features
- Submit pull requests
- Help with translations

## 📞 Support

If you encounter any issues:
1. Try reloading the extension in `chrome://extensions/`
2. Check the browser console for error messages
3. Run the test suite to diagnose problems
4. Create an issue on GitHub with details about the problem

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Stay focused, stay productive! 🍅✨**

*Made with ❤️ for developers and productivity enthusiasts*
