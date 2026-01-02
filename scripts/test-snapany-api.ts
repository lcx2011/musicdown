/**
 * Test script for Snapany API
 * Tests the video extraction endpoint
 */

import axios from 'axios';
import crypto from 'crypto';

const API_BASE_URL = 'https://api.snapany.com/v1';
const TEST_VIDEO_URL = 'https://www.bilibili.com/video/BV1d88EzzEsm';

/**
 * Generate g-timestamp header (Unix timestamp in milliseconds)
 */
function generateTimestamp(): string {
  return Date.now().toString();
}

/**
 * Generate g-footer header
 */
function generateFooter(data: string, timestamp: string): string {
  const hash = crypto
    .createHash('md5')
    .update(data + timestamp)
    .digest('hex');
  return hash;
}

async function testExtractAPI() {
  console.log('Testing Snapany API...\n');
  console.log('API Base URL:', API_BASE_URL);
  console.log('Test Video:', TEST_VIDEO_URL);
  console.log('');

  try {
    const requestData = { link: TEST_VIDEO_URL };
    const timestamp = generateTimestamp();
    const dataString = JSON.stringify(requestData);
    const footer = generateFooter(dataString, timestamp);

    console.log('Request Headers:');
    console.log('  Content-Type: application/json');
    console.log('  g-footer:', footer);
    console.log('  g-timestamp:', timestamp);
    console.log('');

    console.log('Sending request...');
    const response = await axios.post(
      `${API_BASE_URL}/extract`,
      requestData,
      {
        headers: {
          'accept': '*/*',
          'accept-language': 'zh',
          'content-type': 'application/json',
          'g-footer': footer,
          'g-timestamp': timestamp,
          'origin': 'https://snapany.com',
          'priority': 'u=1, i',
          'referer': 'https://snapany.com/',
          'sec-ch-ua': '"Chromium";v="135", "Not-A.Brand";v="8"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
        },
      }
    );

    console.log('\n✓ API Request Successful!');
    console.log('\nResponse:');
    console.log('  Status:', response.status);
    console.log('  Title:', response.data.text);
    console.log('  Media Count:', response.data.medias?.length || 0);
    
    if (response.data.medias && response.data.medias.length > 0) {
      const media = response.data.medias[0];
      console.log('\nFirst Media:');
      console.log('  Type:', media.media_type);
      console.log('  URL:', media.resource_url.substring(0, 100) + '...');
      console.log('  Preview:', media.preview_url);
    }

  } catch (error: any) {
    console.error('\n✗ API Request Failed!');
    
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Status Text:', error.response.statusText);
      console.error('  Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('  No response received');
      console.error('  Error:', error.message);
    } else {
      console.error('  Error:', error.message);
    }
  }
}

testExtractAPI();
