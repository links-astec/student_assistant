#!/usr/bin/env node
/**
 * Test script to verify frontend API endpoints are working
 * Run: node test-endpoints.js
 */

const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : { raw: body };
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
            raw: body
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: null,
            raw: body
          });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing frontend API endpoints...\n');

  try {
    // Test 1: Health check
    console.log('Test 1: Health Check');
    const healthRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`  Status: ${healthRes.status}`);
    console.log(`  Response: ${JSON.stringify(healthRes.body)}`);
    console.log();

    // Test 2: Get chats
    console.log('Test 2: Get Chats');
    const chatsRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/chats',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`  Status: ${chatsRes.status}`);
    console.log(`  Chats found: ${chatsRes.body?.chats?.length || 0}`);
    if (chatsRes.body?.chats?.length > 0) {
      console.log(`  First chat: ${chatsRes.body.chats[0].sessionId}`);
    }
    console.log();

    // Test 3: Create a new chat session
    console.log('Test 3: Create New Chat Session');
    const createRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/chat',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': 'unknown' }
    }, {
      actionType: 'start'
    });
    console.log(`  Status: ${createRes.status}`);
    console.log(`  Session ID: ${createRes.body?.sessionId}`);
    console.log(`  Greeting: ${createRes.body?.botMessages?.[0]?.content}`);
    
    if (createRes.body?.sessionId) {
      const testSessionId = createRes.body.sessionId;
      console.log();

      // Test 4: Send a message
      console.log('Test 4: Send Chat Message');
      const msgRes = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/chat',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': 'unknown' }
      }, {
        sessionId: testSessionId,
        userMessage: 'Hello, I need help',
        actionType: 'message'
      });
      console.log(`  Status: ${msgRes.status}`);
      console.log(`  Has response: ${!!msgRes.body?.botMessages}`);
      console.log();

      // Test 5: Get chats again
      console.log('Test 5: Get Chats After Creating One');
      const chatsRes2 = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/chats',
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': 'unknown' }
      });
      console.log(`  Status: ${chatsRes2.status}`);
      console.log(`  Chats found: ${chatsRes2.body?.chats?.length || 0}`);
      if (chatsRes2.body?.chats?.some(c => c.sessionId === testSessionId)) {
        console.log(`  ✅ New chat appears in list!`);
      } else {
        console.log(`  ❌ New chat NOT in list (session: ${testSessionId})`);
      }
      console.log();

      // Test 6: Delete the chat
      console.log('Test 6: Delete Chat');
      const delRes = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: `/api/chats?sessionId=${testSessionId}`,
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': 'unknown' }
      });
      console.log(`  Status: ${delRes.status}`);
      console.log(`  Success: ${delRes.body?.success}`);
      console.log(`  Message: ${delRes.body?.message}`);
      console.log();

      // Test 7: Verify deletion
      console.log('Test 7: Verify Chat Deleted');
      const chatsRes3 = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/chats',
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': 'unknown' }
      });
      if (!chatsRes3.body?.chats?.some(c => c.sessionId === testSessionId)) {
        console.log(`  ✅ Chat successfully deleted!`);
      } else {
        console.log(`  ❌ Chat still exists after deletion!`);
      }
    }

    console.log('\n✅ All tests completed!');

  } catch (err) {
    console.error('❌ Test failed:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('   Frontend dev server not running on localhost:3000');
      console.error('   Run: npm run dev');
    }
  }
}

runTests();
