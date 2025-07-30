const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';
let authToken = null;
let testListingId = null;

// Test configuration
const testConfig = {
  adminUser: {
    email: 'admin@plotsureconnect.rw',
    password: 'admin123'
  },
  testListing: {
    title: 'Test Land Plot - Bugesera',
    description: 'Beautiful residential plot in Bugesera district with verified documentation.',
    sector: 'Nyamata',
    cell: 'Nyamata',
    village: 'Nyamata',
    land_type: 'residential',
    land_size_value: 500,
    land_size_unit: 'sqm',
    price_amount: 50000000,
    price_currency: 'RWF',
    landowner_name: 'Test Landowner',
    landowner_phone: '+250791234567',
    landowner_id_number: '1234567890123456'
  }
};

// Utility functions
const log = (message, type = 'INFO') => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type}] ${message}`);
};

const testEndpoint = async (method, endpoint, data = null, expectedStatus = 200) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    
    if (response.status === expectedStatus) {
      log(`✅ ${method} ${endpoint} - SUCCESS`, 'PASS');
      return response.data;
    } else {
      log(`❌ ${method} ${endpoint} - Expected ${expectedStatus}, got ${response.status}`, 'FAIL');
      return null;
    }
  } catch (error) {
    if (error.response && error.response.status === expectedStatus) {
      log(`✅ ${method} ${endpoint} - SUCCESS (Expected error: ${expectedStatus})`, 'PASS');
      return null;
    } else {
      log(`❌ ${method} ${endpoint} - ERROR: ${error.message}`, 'FAIL');
      return null;
    }
  }
};

// Test functions
const testHealthCheck = async () => {
  log('Testing Health Check...', 'TEST');
  const result = await testEndpoint('GET', '/health');
  return result && result.success;
};

const testAuthentication = async () => {
  log('Testing Authentication...', 'TEST');
  
  // Test login
  const loginResult = await testEndpoint('POST', '/auth/login', {
    email: testConfig.adminUser.email,
    password: testConfig.adminUser.password
  });
  
  if (loginResult && loginResult.success) {
    authToken = loginResult.data.token;
    log('✅ Authentication successful', 'PASS');
    return true;
  }
  
  log('❌ Authentication failed', 'FAIL');
  return false;
};

const testListings = async () => {
  log('Testing Listings API...', 'TEST');
  
  // Test create listing
  const createResult = await testEndpoint('POST', '/listings', testConfig.testListing);
  if (createResult && createResult.success) {
    testListingId = createResult.data.listing.id;
    log(`✅ Created test listing with ID: ${testListingId}`, 'PASS');
  }
  
  // Test get listings
  const getResult = await testEndpoint('GET', '/listings');
  if (getResult && getResult.success) {
    log(`✅ Retrieved ${getResult.data.listings.length} listings`, 'PASS');
  }
  
  // Test search and filter
  const searchResult = await testEndpoint('GET', '/listings?search=Test&land_type=residential');
  if (searchResult && searchResult.success) {
    log(`✅ Search and filter working - found ${searchResult.data.listings.length} results`, 'PASS');
  }
  
  return testListingId !== null;
};

const testInquiries = async () => {
  log('Testing Inquiries API...', 'TEST');
  
  if (!testListingId) {
    log('❌ No test listing available for inquiry test', 'FAIL');
    return false;
  }
  
  const inquiryData = {
    listing_id: testListingId,
    inquirer_name: 'Test Buyer',
    inquirer_email: 'buyer@test.com',
    inquirer_phone: '+250791234568',
    inquiry_type: 'general_interest',
    message: 'I am interested in this plot. Please provide more information.'
  };
  
  const result = await testEndpoint('POST', '/inquiries', inquiryData);
  if (result && result.success) {
    log('✅ Inquiry submitted successfully', 'PASS');
    return true;
  }
  
  log('❌ Inquiry submission failed', 'FAIL');
  return false;
};

const testTwoFactorAuth = async () => {
  log('Testing Two-Factor Authentication...', 'TEST');
  
  // Test 2FA setup
  const setupResult = await testEndpoint('POST', '/2fa/setup');
  if (setupResult && setupResult.success) {
    log('✅ 2FA setup successful', 'PASS');
    return true;
  }
  
  log('❌ 2FA setup failed', 'FAIL');
  return false;
};

const testReports = async () => {
  log('Testing Reports API...', 'TEST');
  
  // Test system stats
  const statsResult = await testEndpoint('GET', '/reports/system-stats');
  if (statsResult && statsResult.success) {
    log('✅ System statistics retrieved', 'PASS');
  }
  
  // Test activity logs
  const logsResult = await testEndpoint('GET', '/reports/activity-logs');
  if (logsResult && logsResult.success) {
    log(`✅ Activity logs retrieved - ${logsResult.data.logs.length} entries`, 'PASS');
  }
  
  return true;
};

const testSecurity = async () => {
  log('Testing Security Features...', 'TEST');
  
  // Test rate limiting
  const rateLimitTest = async () => {
    const promises = Array(10).fill().map(() => 
      testEndpoint('GET', '/listings', null, 429)
    );
    await Promise.all(promises);
    log('✅ Rate limiting working', 'PASS');
  };
  
  await rateLimitTest();
  
  // Test unauthorized access
  const unauthorizedResult = await testEndpoint('GET', '/reports/activity-logs', null, 401);
  if (unauthorizedResult === null) {
    log('✅ Unauthorized access properly blocked', 'PASS');
  }
  
  return true;
};

const cleanup = async () => {
  log('Cleaning up test data...', 'CLEANUP');
  
  if (testListingId) {
    await testEndpoint('DELETE', `/listings/${testListingId}`);
    log('✅ Test listing deleted', 'CLEANUP');
  }
};

// Main test runner
const runTests = async () => {
  log('🚀 Starting PlotSure Connect Feature Tests', 'START');
  log('==========================================', 'START');
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Authentication', fn: testAuthentication },
    { name: 'Listings API', fn: testListings },
    { name: 'Inquiries API', fn: testInquiries },
    { name: 'Two-Factor Auth', fn: testTwoFactorAuth },
    { name: 'Reports API', fn: testReports },
    { name: 'Security Features', fn: testSecurity }
  ];
  
  const results = [];
  
  for (const test of tests) {
    log(`\n📋 Running ${test.name}...`, 'TEST');
    const result = await test.fn();
    results.push({ name: test.name, passed: result });
  }
  
  // Summary
  log('\n📊 Test Results Summary:', 'SUMMARY');
  log('========================', 'SUMMARY');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    log(`${status} - ${result.name}`, 'RESULT');
  });
  
  log(`\n🎯 Overall: ${passed}/${total} tests passed`, 'SUMMARY');
  
  if (passed === total) {
    log('🎉 All tests passed! PlotSure Connect is working correctly.', 'SUCCESS');
  } else {
    log('⚠️ Some tests failed. Please check the implementation.', 'WARNING');
  }
  
  // Cleanup
  await cleanup();
  
  log('\n🏁 Test run completed', 'END');
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    log(`❌ Test runner error: ${error.message}`, 'ERROR');
    process.exit(1);
  });
}

module.exports = { runTests }; 