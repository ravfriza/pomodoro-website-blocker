# Testing Guide - Pomodoro Extension

## 🧪 Critical Bug Testing: Browser Restart Issue

### The Problem
Previously, when you quit the browser completely while the timer was running and reopened it, the timer would get stuck and not continue properly.

### The Fix
We've implemented proper service worker initialization that:
- Restores timer state every time the service worker starts (not just browser startup)
- Calculates elapsed time accurately when browser was closed
- Handles all timer states (running, paused, stopped) correctly

### Manual Testing Steps

#### Test 1: Timer Running During Browser Restart ⏱️

1. **Start the Extension**
   - Open Chrome and click the Pomodoro extension icon
   - Set a 2-minute focus timer for quick testing
   - Click "Start" to begin the timer

2. **Verify Timer is Running**
   - Confirm the timer is counting down
   - Note the current time (e.g., 1:45 remaining)
   - Check that the badge shows the countdown

3. **Close Browser Completely**
   - Close ALL Chrome windows (Ctrl+Shift+Q or Cmd+Q)
   - Wait 30-60 seconds to ensure everything shuts down
   - **Important**: Don't just close the window, quit Chrome entirely

4. **Reopen Browser and Test**
   - Open Chrome again
   - Click the extension icon immediately
   - **Expected Result**: Timer should show less time than when you closed it
   - Timer should continue counting down from where it left off

5. **Verify Calculations**
   - If you closed at 1:45 and waited 30 seconds, timer should show ~1:15
   - Timer should continue running and eventually complete

#### Test 2: Timer Paused During Browser Restart ⏸️

1. **Start and Pause Timer**
   - Start a 3-minute timer
   - Let it run for 30 seconds
   - Click "Pause" button
   - Note the time remaining (e.g., 2:30)

2. **Close and Reopen Browser**
   - Quit Chrome completely
   - Wait 1 minute
   - Reopen Chrome

3. **Check Paused State**
   - Open extension popup
   - **Expected Result**: Timer should show same time as when paused (2:30)
   - "Resume" button should be visible
   - Timer should NOT be running

4. **Test Resume**
   - Click "Resume"
   - Timer should continue from 2:30 and count down normally

#### Test 3: Timer Completion During Browser Restart ⏰

1. **Start Short Timer**
   - Set 1-minute focus timer
   - Start the timer
   - Let it run for 45 seconds

2. **Close Browser**
   - Quit Chrome completely
   - Wait 30 seconds (timer should complete while closed)

3. **Reopen and Check**
   - Open Chrome
   - Check extension
   - **Expected Result**: Should show break time started
   - Notification might appear about break time

## 🔧 Automated Testing

Run the built-in test suite to verify all functionality:

```javascript
// Open extension popup, press F12, then run:
pomodoroTests.runAllTests()
```

This will test:
- ✅ Basic timer flow (start/pause/resume/reset)
- ✅ State persistence 
- ✅ Input validation
- ✅ Service worker restart simulation

## 🐛 Debugging Tips

### If Timer Gets Stuck:

1. **Check Console Logs**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for service worker logs with emoji (🚀, ⏱️, ✅, ❌)

2. **Inspect Service Worker**
   - Go to `chrome://extensions/`
   - Find your extension
   - Click "Inspect views: service worker"
   - Check console for initialization logs

3. **Reset Extension**
   - Go to `chrome://extensions/`
   - Click reload button on the extension
   - This restarts the service worker

### Expected Console Messages:
```
🚀 Service worker initializing...
🔄 Restoring timer state...
📊 Loaded state: {timeLeft: 120, isRunning: true, ...}
⏱️ Timer was running. Elapsed: 30s, Remaining: 90s
▶️ Resuming timer...
✅ Timer state restored successfully
```

## ✅ Success Criteria

The browser restart fix is working correctly when:

1. **Timer Continues**: Running timer resumes with correct time after browser restart
2. **Paused State Preserved**: Paused timers stay paused with correct time
3. **Accurate Calculations**: Time elapsed during browser closure is correctly calculated
4. **No Stuck States**: Timer never gets stuck or shows incorrect values
5. **Console Logs**: Clear diagnostic messages in service worker console

## 🎯 UX Improvements Testing

### Reset Button Accessibility
- **When Running**: Both "Pause" and "Reset" buttons should be visible
- **When Paused**: Both "Resume" and "Reset" buttons should be visible
- **When Stopped**: Only "Start" button should be visible

### Timer Duration Settings
- **When Active** (running or paused): Focus Time and Break Time inputs should be disabled and grayed out
- **When Stopped**: All timer inputs should be enabled and normal appearance
- **Blocked Sites**: Should always remain enabled (users can modify during sessions)

### Visual Feedback
- Disabled timer inputs should appear grayed out with reduced opacity
- Warning message should show: "Timer duration settings are disabled while timer is active"
- Clear visual distinction between enabled and disabled states

## 🚨 When to Report Issues

Report a bug if you experience:
- Timer shows 00:00 after browser restart
- Timer resets to original time instead of continuing
- Extension becomes unresponsive after restart
- Console shows error messages (❌ symbols)

## 🎯 Browser Compatibility

Test on:
- ✅ Chrome (latest)
- ✅ Chrome Beta
- ✅ Chromium
- ⚠️ Edge (Chromium-based) - should work but not officially tested

## 📱 Platform Testing

Verify on:
- ✅ Windows 10/11
- ✅ macOS
- ✅ Linux (Ubuntu/Fedora)

---

**Remember**: The key test is completely quitting the browser (not just closing windows) and reopening it while a timer is running. This simulates the real-world scenario where users close their browser and return later expecting their productivity session to continue seamlessly. 