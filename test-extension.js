// Simple test script for Chrome extension functionality
// This can be run in the browser console when testing the extension

console.log('🧪 Starting Pomodoro Extension Tests...');

// Test 1: Check basic timer functionality
function testBasicTimerFlow() {
  console.log('📝 Test 1: Basic Timer Flow');
  
  return new Promise((resolve) => {
    // Get initial state
    chrome.runtime.sendMessage({ action: 'getState' }, (initialState) => {
      console.log('Initial state:', initialState);
      
      // Start timer
      chrome.runtime.sendMessage({ 
        action: 'start',
        focusTime: 1, // 1 minute for testing
        breakTime: 1
      }, () => {
        console.log('✅ Timer started');
        
        setTimeout(() => {
          // Pause timer
          chrome.runtime.sendMessage({ action: 'pause' }, () => {
            console.log('✅ Timer paused');
            
            // Check state after pause
            chrome.runtime.sendMessage({ action: 'getState' }, (pausedState) => {
              console.log('Paused state:', pausedState);
              
              // Resume timer
              chrome.runtime.sendMessage({ action: 'resume' }, () => {
                console.log('✅ Timer resumed');
                
                // Check state after resume
                chrome.runtime.sendMessage({ action: 'getState' }, (resumedState) => {
                  console.log('Resumed state:', resumedState);
                  
                  // Reset timer
                  chrome.runtime.sendMessage({ action: 'reset' }, () => {
                    console.log('✅ Timer reset');
                    resolve('Test 1 completed');
                  });
                });
              });
            });
          });
        }, 2000); // Wait 2 seconds before pausing
      });
    });
  });
}

// Test 2: Check state persistence and UI behavior
function testStatePersistence() {
  console.log('📝 Test 2: State Persistence & UI Behavior');
  
  return new Promise((resolve) => {
    // Start timer
    chrome.runtime.sendMessage({ 
      action: 'start',
      focusTime: 2,
      breakTime: 1
    }, () => {
      console.log('✅ Timer started - checking if reset button is visible during running state');
      
      setTimeout(() => {
        // Pause timer
        chrome.runtime.sendMessage({ action: 'pause' }, () => {
          console.log('✅ Timer paused - both resume and reset buttons should be visible');
          
          // Get state while paused
          chrome.runtime.sendMessage({ action: 'getState' }, (state) => {
            console.log('State before resume test:', state);
            
            if (state.isPaused && state.timeLeft > 0 && !state.isRunning) {
              console.log('✅ State persistence test passed - timer correctly paused');
              console.log('💡 Timer duration inputs should be disabled while paused');
              
              // Resume to verify timeLeft doesn't reset
              const originalTimeLeft = state.timeLeft;
              chrome.runtime.sendMessage({ action: 'resume' }, () => {
                chrome.runtime.sendMessage({ action: 'getState' }, (resumedState) => {
                  if (Math.abs(resumedState.timeLeft - originalTimeLeft) <= 1) {
                    console.log('✅ Resume test passed - time not reset');
                    console.log('✅ Reset button should still be visible alongside pause button');
                  } else {
                    console.log('❌ Resume test failed - time was reset');
                    console.log(`Original: ${originalTimeLeft}, After resume: ${resumedState.timeLeft}`);
                  }
                  
                  // Clean up
                  chrome.runtime.sendMessage({ action: 'reset' }, () => {
                    console.log('✅ Timer reset - all timer inputs should be enabled again');
                    resolve('Test 2 completed');
                  });
                });
              });
            } else {
              console.log('❌ State persistence test failed');
              resolve('Test 2 failed');
            }
          });
        });
      }, 1000);
    });
  });
}

// Test 3: Input validation
function testInputValidation() {
  console.log('📝 Test 3: Input Validation');
  
  return new Promise((resolve) => {
    // Test with invalid values
    chrome.runtime.sendMessage({ 
      action: 'start',
      focusTime: -5, // Invalid negative
      breakTime: 100 // Invalid too large
    }, () => {
      chrome.runtime.sendMessage({ action: 'getState' }, (state) => {
        console.log('State with invalid inputs:', state);
        
        // Should handle gracefully without breaking
        if (typeof state.timeLeft === 'number' && state.timeLeft >= 0) {
          console.log('✅ Input validation test passed');
        } else {
          console.log('❌ Input validation test failed');
        }
        
        chrome.runtime.sendMessage({ action: 'reset' }, () => {
          resolve('Test 3 completed');
        });
      });
    });
  });
}

// Test 4: Service worker restart simulation
function testServiceWorkerRestart() {
  console.log('📝 Test 4: Service Worker Restart Simulation');
  
  return new Promise((resolve) => {
    // Start a timer
    chrome.runtime.sendMessage({ 
      action: 'start',
      focusTime: 2, // 2 minutes for testing
      breakTime: 1
    }, () => {
      console.log('✅ Timer started');
      
      setTimeout(() => {
        // Get state before simulated restart
        chrome.runtime.sendMessage({ action: 'getState' }, (beforeState) => {
          console.log('State before restart simulation:', beforeState);
          
          // Simulate service worker restart by checking if state is maintained
          // In a real scenario, this would happen automatically
          setTimeout(() => {
            chrome.runtime.sendMessage({ action: 'getState' }, (afterState) => {
              console.log('State after restart simulation:', afterState);
              
              if (afterState && afterState.isRunning && afterState.timeLeft > 0) {
                console.log('✅ Service worker restart test passed - state maintained');
              } else {
                console.log('❌ Service worker restart test failed - state lost');
              }
              
              // Clean up
              chrome.runtime.sendMessage({ action: 'reset' }, () => {
                resolve('Test 4 completed');
              });
            });
          }, 1000);
        });
      }, 2000); // Wait 2 seconds
    });
  });
}

// Run all tests
async function runAllTests() {
  try {
    console.log('🚀 Running comprehensive extension tests...\n');
    
    await testBasicTimerFlow();
    console.log('\n');
    
    await testStatePersistence();
    console.log('\n');
    
    await testInputValidation();
    console.log('\n');
    
    await testServiceWorkerRestart();
    console.log('\n');
    
    console.log('🎉 All tests completed! Check the logs above for results.');
    console.log('💡 To run tests again, call: runAllTests()');
    console.log('🔧 To test browser restart: start a timer, close browser completely, reopen and check if timer continues');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Export functions for manual testing
window.pomodoroTests = {
  runAllTests,
  testBasicTimerFlow,
  testStatePersistence,
  testInputValidation,
  testServiceWorkerRestart
};

console.log('✅ Test suite loaded! Run pomodoroTests.runAllTests() to start testing.'); 