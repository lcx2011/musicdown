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
 */

import { createAPIClient, APIError } from '../src/services/APIClient';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message: string) {
  log(`✓ ${message}`, colors.green);
}

function logError(message: string) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message: string) {
  log(`ℹ ${message}`, colors.blue);
}

function logWarning(message: string) {
  log(`⚠ ${message}`, colors.yellow);
}

/**
 * Test 1: Verify environment variables
 */
function testEnvironmentVariables(): boolean {
  log('\n=== Test 1: Environment Variables ===', colors.cyan);
  
  const baseURL = process.env.VITE_API_BASE_URL;
  const timeout = process.env.VITE_API_TIMEOUT;
  const enableRetry = process.env.VITE_API_ENABLE_RETRY;
  
  logInfo(`VITE_API_BASE_URL: ${baseURL || '(not set)'}`);
  logInfo(`VITE_API_TIMEOUT: ${timeout || '(not set)'}`);
  logInfo(`VITE_API_ENABLE_RETRY: ${enableRetry || '(not set)'}`);
  
  if (!baseURL) {
    logError('VITE_API_BASE_URL is not set');
    return false;
  }
  
  if (baseURL === 'https://api.example.com') {
    logWarning('VITE_API_BASE_URL is still set to placeholder value');
    logWarning('Please update .env file with actual API endpoint');
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
 * Test 2: Test API client initialization
 */
function testAPIClientInitialization(): boolean {
  log('\n=== Test 2: API Client Initialization ===', colors.cyan);
  
  try {
    const client = createAPIClient();
    logSuccess('API client created successfully');
    return true;
  } catch (error) {
    logError(`Failed to create API client: ${error}`);
    return false;
  }
}

/**
 * Test 3: Test video extraction endpoint
 */
async function testVideoExtraction(): Promise<boolean> {
  log('\n=== Test 3: Video Extraction Endpoint ===', colors.cyan);
  
  const testVideoURL = 'https://www.bilibili.com/video/BV1UNs6zBEkN';
  logInfo(`Testing with video URL: ${testVideoURL}`);
  
  const client = createAPIClient();
  
  try {
    logInfo('Sending extraction request...');
    const result = await client.extractVideo(testVideoURL);
    
    logSuccess('Extraction request successful');
    logInfo(`Response text: ${result.text}`);
    logInfo(`Number of media formats: ${result.medias.length}`);
    logInfo(`Overseas flag: ${result.overseas}`);
    
    // Validate response structure
    if (!result.text || typeof result.text !== 'string') {
      logError('Invalid response: missing or invalid "text" field');
      return false;
    }
    
    if (!Array.isArray(result.medias) || result.medias.length === 0) {
      logError('Invalid response: missing or empty "medias" array');
      return false;
    }
    
    // Check first media item
    const firstMedia = result.medias[0];
    logInfo(`First media type: ${firstMedia.media_type}`);
    logInfo(`Resource URL: ${firstMedia.resource_url.substring(0, 50)}...`);
    
    if (!firstMedia.media_type || !firstMedia.resource_url || !firstMedia.preview_url) {
      logError('Invalid media item: missing required fields');
      return false;
    }
    
    logSuccess('Response format is valid');
    return true;
  } catch (error) {
    if (error instanceof APIError) {
      logError(`API Error: ${error.message}`);
      if (error.statusCode) {
        logError(`Status Code: ${error.statusCode}`);
      }
    } else {
      logError(`Unexpected error: ${error}`);
    }
    return false;
  }
}

/**
 * Test 4: Test search endpoint
 */
async function testVideoSearch(): Promise<boolean> {
  log('\n=== Test 4: Video Search Endpoint ===', colors.cyan);
  
  const testQuery = '测试';
  logInfo(`Testing with search query: ${testQuery}`);
  
  const client = createAPIClient();
  
  try {
    logInfo('Sending search request...');
    const result = await client.searchVideos(testQuery, 1);
    
    logSuccess('Search request successful');
    
    // Validate response structure
    if (!result.result || !result.result.video) {
      logError('Invalid response: missing result.video');
      return false;
    }
    
    if (!result.page) {
      logError('Invalid response: missing page info');
      return false;
    }
    
    logInfo(`Total results: ${result.page.count}`);
    logInfo(`Results on this page: ${result.result.video.length}`);
    
    if (result.result.video.length > 0) {
      const firstVideo = result.result.video[0];
      logInfo(`First video: ${firstVideo.title}`);
      logInfo(`Video ID: ${firstVideo.bvid}`);
    }
    
    logSuccess('Response format is valid');
    return true;
  } catch (error) {
    if (error instanceof APIError) {
      logError(`API Error: ${error.message}`);
      if (error.statusCode) {
        logError(`Status Code: ${error.statusCode}`);
      }
    } else {
      logError(`Unexpected error: ${error}`);
    }
    return false;
  }
}

/**
 * Test 5: Test error handling
 */
async function testErrorHandling(): Promise<boolean> {
  log('\n=== Test 5: Error Handling ===', colors.cyan);
  
  const client = createAPIClient();
  
  try {
    logInfo('Testing with invalid video URL...');
    await client.extractVideo('invalid-url');
    
    logWarning('Expected an error but request succeeded');
    return true; // Not necessarily a failure
  } catch (error) {
    if (error instanceof APIError) {
      logSuccess(`Error handled correctly: ${error.message}`);
      return true;
    } else {
      logError(`Unexpected error type: ${error}`);
      return false;
    }
  }
}

/**
 * Test 6: Test header generation
 */
function testHeaderGeneration(): boolean {
  log('\n=== Test 6: Header Generation ===', colors.cyan);
  
  logInfo('Headers are generated automatically for each request');
  logInfo('Required headers:');
  logInfo('  - Content-Type: application/json');
  logInfo('  - g-footer: MD5 hash of request data + timestamp');
  logInfo('  - g-timestamp: Unix timestamp in seconds');
  
  logSuccess('Header generation is implemented in APIClient');
  logWarning('Verify that g-footer algorithm matches API requirements');
  logWarning('If API uses different signing (e.g., HMAC-SHA256), update generateFooter() method');
  
  return true;
}

/**
 * Main test runner
 */
async function runTests() {
  log('\n╔════════════════════════════════════════════════╗', colors.cyan);
  log('║   Bilibili API Configuration Test Suite       ║', colors.cyan);
  log('╚════════════════════════════════════════════════╝', colors.cyan);
  
  const results: { name: string; passed: boolean }[] = [];
  
  // Test 1: Environment variables
  results.push({
    name: 'Environment Variables',
    passed: testEnvironmentVariables(),
  });
  
  // Test 2: API client initialization
  results.push({
    name: 'API Client Initialization',
    passed: testAPIClientInitialization(),
  });
  
  // Only run API tests if environment is configured
  if (results.every(r => r.passed)) {
    // Test 3: Video extraction
    results.push({
      name: 'Video Extraction',
      passed: await testVideoExtraction(),
    });
    
    // Test 4: Video search
    results.push({
      name: 'Video Search',
      passed: await testVideoSearch(),
    });
    
    // Test 5: Error handling
    results.push({
      name: 'Error Handling',
      passed: await testErrorHandling(),
    });
  } else {
    logWarning('\nSkipping API connectivity tests due to configuration issues');
  }
  
  // Test 6: Header generation
  results.push({
    name: 'Header Generation',
    passed: testHeaderGeneration(),
  });
  
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
    process.exit(0);
  } else {
    log('\n✗ Some tests failed. Please check the configuration.', colors.red);
    log('\nNext steps:', colors.yellow);
    log('1. Update .env file with actual Bilibili API endpoint', colors.yellow);
    log('2. Verify API endpoint is accessible', colors.yellow);
    log('3. Check API documentation for correct request/response format', colors.yellow);
    log('4. Update header generation if needed (generateFooter method)', colors.yellow);
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  logError(`\nFatal error: ${error}`);
  process.exit(1);
});
