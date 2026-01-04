#!/usr/bin/env node
/**
 * Diagnostic script to verify category selection and chat operations
 * Run: node diagnose.js
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

async function runDiagnostics() {
  console.log('🔍 Diagnosing Korea Business Chat System...\n');

  try {
    // Test 1: Create a new session
    console.log('Test 1: Create New Session');
    const createRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/chat',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      actionType: 'start'
    });
    console.log(`  Status: ${createRes.status}`);
    const sessionId = createRes.body?.sessionId;
    console.log(`  Session ID: ${sessionId}`);
    console.log();

    if (!sessionId) {
      console.error('❌ Failed to create session');
      process.exit(1);
    }

    // Test 2: Try category selection
    console.log('Test 2: Select Category');
    const categoryRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/chat',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      actionType: 'selectCategory',
      sessionId,
      categoryKey: 'course_enrollment',
      categoryTitle: 'Course Enrollment'
    });
    console.log(`  Status: ${categoryRes.status}`);
    if (categoryRes.status === 200) {
      console.log(`  ✅ Category selection works!`);
      console.log(`  Bot says: "${categoryRes.body?.botMessages?.[0]?.content?.substring(0, 80)}..."`);
      console.log(`  Follow-up questions: ${categoryRes.body?.botMessages?.[0]?.followupQuestions?.length || 0}`);
    } else {
      console.log(`  ❌ Status: ${categoryRes.status}`);
      console.log(`  Error: ${categoryRes.body?.error || 'Unknown error'}`);
    }
    console.log();

    // Test 3: Send follow-up response
    console.log('Test 3: Send Response to Follow-up Questions');
    const responseRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/chat',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      actionType: 'message',
      sessionId,
      userMessage: 'I want to enroll in Bachelor of Computer Science'
    });
    console.log(`  Status: ${responseRes.status}`);
    if (responseRes.status === 200) {
      const msg = responseRes.body?.botMessages?.[0];
      console.log(`  ✅ AI Response received`);
      console.log(`  Has confirmation prompts: ${msg?.confirmationNeeded ? 'YES' : 'NO'}`);
      if (msg?.confirmationNeeded) {
        console.log(`  Options: ${msg?.confirmationOptions?.map((o) => o.label).join(', ')}`);
      }
    } else {
      console.log(`  ❌ Status: ${responseRes.status}`);
    }
    console.log();

    // Test 4: Chat listing
    console.log('Test 4: List Chats');
    const listRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/chats',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`  Status: ${listRes.status}`);
    console.log(`  Chats found: ${listRes.body?.chats?.length || 0}`);
    if (listRes.body?.chats?.some((c) => c.sessionId === sessionId)) {
      console.log(`  ✅ New chat appears in list!`);
    } else {
      console.log(`  ❌ New chat NOT in list`);
      console.log(`     Created session: ${sessionId}`);
      console.log(`     Available chats: ${listRes.body?.chats?.map((c) => c.sessionId).join(', ') || 'none'}`);
    }
    console.log();

    // Test 5: Try deletion
    console.log('Test 5: Delete Chat');
    const delRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/chats?sessionId=${sessionId}`,
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`  Status: ${delRes.status}`);
    if (delRes.status === 200) {
      console.log(`  ✅ Deletion successful!`);
    } else {
      console.log(`  ❌ Deletion failed: ${delRes.status}`);
      console.log(`  Response: ${delRes.raw}`);
    }
    console.log();

    console.log('✅ Diagnostics complete!');
    console.log('\n📝 Summary:');
    console.log('  ✓ Category selection: ' + (categoryRes.status === 200 ? '✅' : '❌'));
    console.log('  ✓ AI responses: ' + (responseRes.status === 200 ? '✅' : '❌'));
    console.log('  ✓ Chat listing: ' + (listRes.body?.chats?.length > 0 ? '✅' : '❌'));
    console.log('  ✓ Chat deletion: ' + (delRes.status === 200 ? '✅' : '❌'));

  } catch (err) {
    console.error('❌ Diagnostic failed:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('   Frontend not running on localhost:3000');
      console.error('   Start frontend with: npm run dev');
    }
  }
}

runDiagnostics();
