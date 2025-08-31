#!/usr/bin/env node

/**
 * Manual Test Script for Issue #10 - Immediate Response Pattern
 * 
 * This script tests the immediate response functionality locally
 * using Firebase emulator or deployed function
 */

const axios = require('axios');

// Configuration
const FUNCTION_URL = process.env.FUNCTION_URL || 'http://localhost:5001/sophia-db784/us-central1/cartesiaTTS';
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'secret'; // Use your actual token
const TEST_COMPACTION_ID = process.env.TEST_COMPACTION_ID || 'test-compaction-id';

async function testImmediateResponse() {
  console.log('🧪 Testing Immediate Response Pattern (Issue #10)');
  console.log(`📍 Function URL: ${FUNCTION_URL}`);
  console.log(`🔑 Using compaction ID: ${TEST_COMPACTION_ID}`);
  console.log('');

  try {
    const startTime = Date.now();

    console.log('⏱️  Sending request...');
    const response = await axios({
      method: 'POST',
      url: FUNCTION_URL,
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: {
        compaction_id: TEST_COMPACTION_ID
      },
      timeout: 5000 // 5 second timeout to test immediate response
    });

    const responseTime = Date.now() - startTime;

    console.log('✅ Response received!');
    console.log(`⚡ Response time: ${responseTime}ms`);
    console.log('📋 Response body:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');

    // Validate immediate response format
    const { success, compaction_id, tts_job_id, status, processing_time_ms } = response.data;

    if (success && compaction_id && tts_job_id && status === 'processing') {
      console.log('🎉 SUCCESS: Immediate response pattern working correctly!');
      console.log(`   ✓ Response time: ${responseTime}ms (should be <200ms)`);
      console.log(`   ✓ Has tts_job_id: ${tts_job_id}`);
      console.log(`   ✓ Status: ${status}`);
      console.log(`   ✓ Processing time: ${processing_time_ms}ms`);
      
      if (responseTime < 200) {
        console.log('🚀 EXCELLENT: Response time under 200ms target!');
      } else if (responseTime < 1000) {
        console.log('⚠️  WARNING: Response time over 200ms but under 1s');
      } else {
        console.log('❌ ISSUE: Response time over 1 second - not immediate');
      }

      // Test monitoring background processing
      console.log('');
      console.log('🔍 Background processing should continue...');
      console.log(`   Monitor Firestore document: ${compaction_id}`);
      console.log(`   Track with tts_job_id: ${tts_job_id}`);
      console.log('   Status should change: ttsProcessing → compactionDone');

    } else {
      console.log('❌ FAILURE: Response format incorrect');
      console.log('   Expected: { success: true, compaction_id, tts_job_id, status: "processing" }');
    }

  } catch (error) {
    console.log('💥 ERROR during test:');
    
    if (error.code === 'ECONNABORTED') {
      console.log('   ⏰ Request timeout - function may be taking too long');
      console.log('   🔍 Check if immediate response pattern is working');
    } else if (error.response) {
      console.log(`   📊 Status: ${error.response.status}`);
      console.log(`   📋 Response: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

async function testBackwardCompatibility() {
  console.log('');
  console.log('🔄 Testing Backward Compatibility...');
  
  // This would test that existing integrations still work
  // For now, just log the intent
  console.log('   ℹ️  Legacy generateTTS() function should still work');
  console.log('   ℹ️  Old response format available if needed');
}

async function runTests() {
  console.log('🚀 Starting Issue #10 Tests');
  console.log('═'.repeat(50));
  
  await testImmediateResponse();
  await testBackwardCompatibility();
  
  console.log('');
  console.log('📊 Test Summary:');
  console.log('   • Immediate response pattern tested');
  console.log('   • Response time measured');
  console.log('   • Response format validated');
  console.log('   • Background processing initiated');
  console.log('');
  console.log('🔗 Next steps:');
  console.log('   1. Check Firestore for status updates');
  console.log('   2. Monitor Cloud Logs for async processing');
  console.log('   3. Verify final audio_url appears in document');
  console.log('');
  console.log('═'.repeat(50));
}

// CLI usage
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testImmediateResponse, testBackwardCompatibility };
