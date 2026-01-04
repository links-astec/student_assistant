// Test Script for Diagnosing "Response Always the Same" Issue
// Paste this into Browser DevTools Console

console.log('%c=== Chat System Diagnostic Tests ===', 'color: blue; font-size: 14px; font-weight: bold;');

// Test 1: Check localStorage
console.log('\n%c📦 Test 1: localStorage state', 'color: green; font-weight: bold;');
const sessionId = localStorage.getItem('chatSessionId');
console.log('Stored sessionId:', sessionId || 'NOT FOUND');
console.log('All localStorage keys:', Object.keys(localStorage));

// Test 2: Check if we can access sessionId from page
console.log('\n%c📦 Test 2: Current page state', 'color: green; font-weight: bold;');
console.log('Current URL:', window.location.href);
const urlParams = new URLSearchParams(window.location.search);
console.log('URL sessionId param:', urlParams.get('session') || 'NOT FOUND');

// Test 3: Simulate sending a message and inspect the request
console.log('\n%c📦 Test 3: Testing message send (requires user interaction)', 'color: green; font-weight: bold;');
console.log('Open DevTools Network tab, then type a message in the chat');
console.log('Look for POST /api/chat request with body like:');
console.log(JSON.stringify({
  actionType: "message",
  sessionId: "{{should-be-a-uuid}}",
  userMessage: "your message here"
}, null, 2));

// Test 4: Manual test of the proxy
console.log('\n%c📦 Test 4: Manual test of proxy endpoint', 'color: green; font-weight: bold;');
async function testProxy() {
  try {
    // Test 1: Start action
    console.log('Testing /api/chat with actionType=start...');
    const startResponse = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionType: 'start' })
    });
    const startData = await startResponse.json();
    console.log('Start response:', startData);
    
    if (startData.sessionId) {
      // Test 2: Send message with the new sessionId
      console.log('\nTesting /api/chat with message...');
      const msgResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'message',
          sessionId: startData.sessionId,
          userMessage: 'What is 2+2?'
        })
      });
      const msgData = await msgResponse.json();
      console.log('Message response:', msgData);
      
      // Check if response is different from greeting
      const greetingText = "Hi there! I'm the Coventry Student Assistant. How can I help you today?";
      if (msgData.botMessages?.[0]?.content === greetingText) {
        console.warn('⚠️ WARNING: Got greeting instead of answer!');
        console.warn('This means the message was not properly forwarded to the backend');
      } else {
        console.log('✓ Got different response (good!)');
      }
    }
  } catch (err) {
    console.error('Error during proxy test:', err);
  }
}

console.log('To run manual proxy test, execute: testProxy()');

// Test 5: Check API response formats
console.log('\n%c📦 Test 5: Expected Response Formats', 'color: green; font-weight: bold;');
console.log('Greeting response (when actionType=start, no message):');
console.log(JSON.stringify({
  sessionId: "uuid-here",
  botMessages: [
    {
      role: "assistant",
      content: "Hi there! I'm the Coventry Student Assistant. How can I help you today?"
    }
  ]
}, null, 2));

console.log('\nMessage response (should be DIFFERENT from greeting):');
console.log(JSON.stringify({
  sessionId: "uuid-here",
  botMessages: [
    {
      role: "assistant",
      content: "The answer is 4. 2+2 equals 4."
    }
  ]
}, null, 2));

// Test 6: Check for console errors
console.log('\n%c📦 Test 6: Checking for errors', 'color: green; font-weight: bold;');
console.log('Look for any red errors in the console above');
console.log('Common errors to look for:');
console.log('- CORS errors (check backend CORS settings)');
console.log('- Fetch failed (check backend is running)');
console.log('- JSON parse error (check response format)');

// Test 7: Network request inspection helper
console.log('\n%c📦 Test 7: Help identifying the issue', 'color: green; font-weight: bold;');
console.log(`
If you're getting the greeting response for every message:

Step 1: Check Network tab
  - Look for /api/chat POST requests
  - Click on each one
  - Look at "Request" body - should show your message
  - Look at "Response" - should show different responses

Step 2: Check [Chat] logs in console
  - You should see: "[Chat] Forwarding message to backend"
  - If not, the message isn't being sent to backend

Step 3: Check Backend logs
  - Backend should show it received the message
  - If not, network request isn't reaching it

Step 4: Most likely cause
  - sessionId is being lost between messages
  - Each message creates a new session
  - New sessions return the greeting

To verify: In Network tab, look at sessionId in request body:
  - If it changes on each message → sessionId not being preserved
  - If it stays same → something else is wrong
`);

console.log('%c=== End of Diagnostic Tests ===', 'color: blue; font-size: 14px; font-weight: bold;');
