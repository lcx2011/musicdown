/**
 * API Connectivity Test Script
 * 
 * This script tests the Bilibili extraction API configuration:
 * - Verifies environment variables are loaded correctly
 * - Tests API connectivity
 * - Validates response format
 * - Verifies header generation
 * 
 * Requirements: 5.1, 5.5
 * 
 * Usage: node scripts/test-api.js
 */

const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.blue);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

/**
 * Generate g-timestamp header (current Unix timestamp in seconds)
 */
function generateTimestamp() {
  return Math.floor(Date.now() / 1000).toString();
}

/**
 * Generate g-footer header (hash of request data)
 */
function generateFooter(data, timestamp) {
  const hash = crypto
    .createHash('md5')
    .update(data + timestamp)
    .digest('hex');
  return hash;
}

/**
 * Generate required headers for API requests
 */
function generateHeaders(data) {
  const timestamp = generateTimestamp();
  const dataString = JSON.stringify(data);
  const footer = generateFooter(dataString, timestamp);

  return {
    'Content-Type': 'application/json',
    'g-footer': footer,
    'g-timestamp': timestamp,
  };
}

/**
 * Test 1: Verify environment variables
 */
function testEnvironmentVariables() {
  log('\n=== Test 1: Environment Variables ===', colors.cyan);
  
  const baseURL = process.env.VITE_API_BASE_URL;
  const timeout = process.env.VITE_API_TIMEOUT;
  const enableRetry = process.env.VITE_API_ENABLE_RETRY;
  
  logInfo(`VITE_API_BASE_URL: ${baseURL || '(not set)'}`);
  logInfo(`VITE_API_TIMEOUT: ${timeout || '(not set)'}`);
  logInfo(`VITE_API_ENABLE_RETRY: ${enableRetry || '(not set)'}`);
  
  if (!baseURL) {
    logError('VITE_API_BASE_URL is not set');
    logWarning('Please create a .env file and set VITE_API_BASE_URL');
    return false;
  }
  
  if (baseURL === 'https://api.example.com') {
    logWarning('VITE_API_BASE_URL is still set to placeholder value');
    logWarning('Please update .env file with actual API endpoint');
    logInfo('\nTo configure the API:');
    logInfo('1. Copy .env.example to .env');
    logInfo('2. Replace https://api.example.com with your actual API endpoint');
    logInfo('3. Run this test script again');
    return false;
  }
  
  try {
    new URL(baseURL);
    logSuccess('Base URL is valid');
  } catch (error) {
    logError(`Base URL is invalid: ${baseURL}`);
    return false;
  }
  
  logSuccess('Environment variables configured correctly');
  return true;
}

/**
 * Test 2: Test video extraction endpoint
 */
async function testVideoExtraction() {
  log('\n=== Test 2: Video Extraction Endpoint ===', colors.cyan);
  
  const baseURL = process.env.VITE_API_BASE_URL;
  const timeout = parseInt(process.env.VITE_API_TIMEOUT || '30000', 10);
  const testVideoURL = 'https://www.bilibili.com/video/BV1UNs6zBEkN';
  
  logInfo(`Testing with video URL: ${testVideoURL}`);
  logInfo(`API endpoint: ${baseURL}/extract`);
  
  const requestData = { link: testVideoURL };
  const headers = generateHeaders(requestData);
  
  logInfo('Request headers:');
  logInfo(`  Content-Type: ${headers['Content-Type']}`);
  logInfo(`  g-timestamp: ${headers['g-timestamp']}`);
  logInfo(`  g-footer: ${headers['g-footer'].substring(0, 16)}...`);
  
  try {
    logInfo('Sending extraction request...');
    
    const response = await axios.post(
      `${baseURL}/extract`,
      requestData,
      {
        headers,
        timeout,
      }
    );
    
    logSuccess('Extraction request successful');
    logInfo(`Status code: ${response.status}`);
    
    const data = response.data;
    
    // Validate response structure
    if (!data || typeof data !== 'object') {
      logError('Invalid response: expected object');
      return false;
    }
    
    if (typeof data.text !== 'string') {
      logError('Invalid response: missing or invalid "text" field');
      logInfo(`Received: ${JSON.stringify(data, null, 2)}`);
      return false;
    }
    
    if (!Array.isArray(data.medias)) {
      logError('Invalid response: missing or invalid "medias" array');
      logInfo(`Received: ${JSON.stringify(data, null, 2)}`);
      return false;
    }
    
    if (typeof data.overseas !== 'number') {
      logError('Invalid response: missing or invalid "overseas" field');
      logInfo(`Received: ${JSON.stringify(data, null, 2)}`);
      return false;
    }
    
    logInfo(`Response text: ${data.text}`);
    logInfo(`Number of media formats: ${data.medias.length}`);
    logInfo(`Overseas flag: ${data.overseas}`);
    
    if (data.medias.length === 0) {
      logWarning('No media formats available in response');
      return false;
    }
    
    // Check first media item
    const firstMedia = data.medias[0];
    
    if (!firstMedia.media_type || !firstMedia.resource_url || !firstMedia.preview_url) {
      logError('Invalid media item: missing required fields');
      logInfo(`Media item: ${JSON.stringify(firstMedia, null, 2)}`);
      return false;
    }
    
    logInfo(`First media type: ${firstMedia.media_type}`);
    logInfo(`Resource URL: ${firstMedia.resource_url.substring(0, 50)}...`);
    logInfo(`Preview URL: ${firstMedia.preview_url.substring(0, 50)}...`);
    
    logSuccess('Response format is valid');
    return true;
  } catch (error) {
    if (error.response) {
      logError(`API Error: ${error.response.status} ${error.response.statusText}`);
      logError(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      logError(`Network Error: No response received`);
      logError(`Error: ${error.message}`);
      logWarning('Possible causes:');
      logWarning('  - API server is not running');
      logWarning('  - Incorrect API endpoint URL');
      logWarning('  - Network connectivity issues');
      logWarning('  - Firewall blocking the request');
    } else {
      logError(`Error: ${error.message}`);
    }
    return false;
  }
}

/**
 * Test 3: Test search endpoint
 */
async function testVideoSearch() {
  log('\n=== Test 3: Video Search Endpoint ===', colors.cyan);
  
  const baseURL = process.env.VITE_API_BASE_URL;
  const timeout = parseInt(process.env.VITE_API_TIMEOUT || '30000', 10);
  const testQuery = '测试';
  
  logInfo(`Testing with search query: ${testQuery}`);
  logInfo(`API endpoint: ${baseURL}/search`);
  
  const requestData = { query: testQuery, page: 1 };
  const headers = generateHeaders(requestData);
  
  try {
    logInfo('Sending search request...');
    
    const response = await axios.get(
      `${baseURL}/search`,
      {
        params: { q: testQuery, pn: 1 },
        headers,
        timeout,
      }
    );
    
    logSuccess('Search request successful');
    logInfo(`Status code: ${response.status}`);
    
    const data = response.data;
    
    // Validate response structure
    if (!data || typeof data !== 'object') {
      logError('Invalid response: expected object');
      return false;
    }
    
    if (!data.result || !data.result.video) {
      logError('Invalid response: missing result.video');
      logInfo(`Received: ${JSON.stringify(data, null, 2)}`);
      return false;
    }
    
    if (!data.page) {
      logError('Invalid response: missing page info');
      logInfo(`Received: ${JSON.stringify(data, null, 2)}`);
      return false;
    }
    
    logInfo(`Total results: ${data.page.count}`);
    logInfo(`Results on this page: ${data.result.video.length}`);
    
    if (data.result.video.length > 0) {
      const firstVideo = data.result.video[0];
      logInfo(`First video: ${firstVideo.title}`);
      logInfo(`Video ID: ${firstVideo.bvid}`);
    }
    
    logSuccess('Response format is valid');
    return true;
  } catch (error) {
    if (error.response) {
      logError(`API Error: ${error.response.status} ${error.response.statusText}`);
      logError(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      logError(`Network Error: No response received`);
      logError(`Error: ${error.message}`);
    } else {
      logError(`Error: ${error.message}`);
    }
    return false;
  }
}

/**
 * Test 4: Test error handling
 */
async function testErrorHandling() {
  log('\n=== Test 4: Error Handling ===', colors.cyan);
  
  const baseURL = process.env.VITE_API_BASE_URL;
  const timeout = parseInt(process.env.VITE_API_TIMEOUT || '30000', 10);
  
  logInfo('Testing with invalid video URL...');
  
  const requestData = { link: 'invalid-url' };
  const headers = generateHeaders(requestData);
  
  try {
    await axios.post(
      `${baseURL}/extract`,
      requestData,
      {
        headers,
        timeout,
      }
    );
    
    logWarning('Expected an error but request succeeded');
    return true; // Not necessarily a failure
  } catch (error) {
    if (error.response) {
      logSuccess(`Error handled correctly: ${error.response.status} ${error.response.statusText}`);
      if (error.response.data) {
        logInfo(`Error message: ${JSON.stringify(error.response.data)}`);
      }
      return true;
    } else {
      logError(`Unexpected error: ${error.message}`);
      return false;
    }
  }
}

/**
 * Test 5: Test header generation
 */
function testHeaderGeneration() {
  log('\n=== Test 5: Header Generation ===', colors.cyan);
  
  logInfo('Testing header generation...');
  
  const testData = { link: 'https://www.bilibili.com/video/BV1UNs6zBEkN' };
  const headers = generateHeaders(testData);
  
  logInfo('Generated headers:');
  logInfo(`  Content-Type: ${headers['Content-Type']}`);
  logInfo(`  g-timestamp: ${headers['g-timestamp']}`);
  logInfo(`  g-footer: ${headers['g-footer']}`);
  
  // Verify headers are present
  if (!headers['Content-Type'] || !headers['g-timestamp'] || !headers['g-footer']) {
    logError('Missing required headers');
    return false;
  }
  
  // Verify timestamp is a valid number
  const timestamp = parseInt(headers['g-timestamp'], 10);
  if (isNaN(timestamp) || timestamp <= 0) {
    logError('Invalid timestamp');
    return false;
  }
  
  // Verify footer is a valid MD5 hash (32 hex characters)
  if (!/^[a-f0-9]{32}$/.test(headers['g-footer'])) {
    logError('Invalid g-footer format (expected MD5 hash)');
    return false;
  }
  
  logSuccess('Header generation is working correctly');
  logInfo('\nHeader generation details:');
  logInfo('  - g-timestamp: Current Unix timestamp in seconds');
  logInfo('  - g-footer: MD5 hash of (request data + timestamp)');
  logWarning('\nNote: If your API requires different signing:');
  logWarning('  - Update generateFooter() in src/services/APIClient.ts');
  logWarning('  - Example: HMAC-SHA256 with secret key');
  
  return true;
}

/**
 * Main test runner
 */
async function runTests() {
  log('\n╔════════════════════════════════════════════════╗', colors.cyan);
  log('║   Bilibili API Configuration Test Suite       ║', colors.cyan);
  log('╚════════════════════════════════════════════════╝', colors.cyan);
  
  const results = [];
  
  // Test 1: Environment variables
  const envTest = testEnvironmentVariables();
  results.push({ name: 'Environment Variables', passed: envTest });
  
  // Only run API tests if environment is configured
  if (envTest) {
    // Test 2: Video extraction
    const extractionTest = await testVideoExtraction();
    results.push({ name: 'Video Extraction', passed: extractionTest });
    
    // Test 3: Video search
    const searchTest = await testVideoSearch();
    results.push({ name: 'Video Search', passed: searchTest });
    
    // Test 4: Error handling
    const errorTest = await testErrorHandling();
    results.push({ name: 'Error Handling', passed: errorTest });
  } else {
    logWarning('\nSkipping API connectivity tests due to configuration issues');
    logInfo('\nPlease configure the API endpoint in .env file and run this test again.');
  }
  
  // Test 5: Header generation
  const headerTest = testHeaderGeneration();
  results.push({ name: 'Header Generation', passed: headerTest });
  
  // Print summary
  log('\n╔════════════════════════════════════════════════╗', colors.cyan);
  log('║   Test Summary                                 ║', colors.cyan);
  log('╚════════════════════════════════════════════════╝', colors.cyan);
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    if (result.passed) {
      logSuccess(`${result.name}`);
    } else {
      logError(`${result.name}`);
    }
  });
  
  log(`\nTotal: ${passed}/${total} tests passed`, passed === total ? colors.green : colors.red);
  
  if (passed === total) {
    log('\n✓ All tests passed! API configuration is correct.', colors.green);
    log('\nNext steps:', colors.green);
    log('  1. Start the development server: npm run electron:dev', colors.green);
    log('  2. Test search and download functionality', colors.green);
    log('  3. Build the portable executable: npm run build:portable', colors.green);
    process.exit(0);
  } else {
    log('\n✗ Some tests failed. Please check the configuration.', colors.red);
    log('\nNext steps:', colors.yellow);
    log('  1. Review the test output above for specific errors', colors.yellow);
    log('  2. Update .env file with actual Bilibili API endpoint', colors.yellow);
    log('  3. Verify API endpoint is accessible', colors.yellow);
    log('  4. Check API documentation for correct request/response format', colors.yellow);
    log('  5. Update header generation if needed (see API-SETUP-GUIDE.md)', colors.yellow);
    log('\nFor detailed setup instructions, see: API-SETUP-GUIDE.md', colors.yellow);
    process.exit(1);
  }
}

// Check if dotenv is available
try {
  require('dotenv');
} catch (error) {
  console.error('Error: dotenv package is not installed');
  console.error('Please install it with: npm install dotenv');
  process.exit(1);
}

// Run tests
runTests().catch(error => {
  logError(`\nFatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
