/**
 * Test script for video download functionality
 * This script tests the download IPC handler in the main process
 */

import axios from 'axios';

// Test video URL from your example
const testVideoUrl = 'https://cn-lndl-ct-01-03.bilivideo.com/upgcxcode/55/70/31336827055/31336827055-1-192.mp4?e=ig8euxZM2rNcNbRVhwdVhwdlhWdVhwdVhoNvNC8BqJIzNbfq9rVEuxTEnE8L5F6VnEsSTx0vkX8fqJeYTj_lta53NCM=&uipk=5&mid=0&trid=0000e3f2aab066c0448f8f36c4e45256ed3h&os=bcache&og=hw&oi=2672555743&deadline=1767349014&nbs=1&platform=html5&gen=playurlv3&upsig=4b98320e1483bb2bd4951fb1c56a8a3e&uparams=e,uipk,mid,trid,os,og,oi,deadline,nbs,platform,gen&cdnid=88003&bvc=vod&nettype=0&bw=593596&buvid=&build=0&dl=0&f=h_0_0&agrr=1&orderid=0,1';

async function testDownload() {
  console.log('Testing video download with proper headers...\n');
  
  try {
    console.log('Downloading from:', testVideoUrl.substring(0, 100) + '...');
    
    const response = await axios.get(testVideoUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.bilibili.com/',
        'Accept': '*/*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Origin': 'https://www.bilibili.com',
      },
      onDownloadProgress: (progressEvent) => {
        const total = progressEvent.total || 0;
        const loaded = progressEvent.loaded || 0;
        const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;
        
        if (percentage % 10 === 0) {
          console.log(`Progress: ${percentage}% (${loaded}/${total} bytes)`);
        }
      },
    });
    
    const size = response.data.byteLength;
    console.log('\n✓ Download successful!');
    console.log(`  Size: ${(size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Content-Type: ${response.headers['content-type']}`);
    
  } catch (error: any) {
    console.error('\n✗ Download failed!');
    console.error(`  Error: ${error.message}`);
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Status Text: ${error.response.statusText}`);
    }
  }
}

testDownload();
