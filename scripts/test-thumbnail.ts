/**
 * Test script to check thumbnail URLs from Bilibili API
 */

import axios from 'axios';

async function testThumbnails() {
  try {
    console.log('Testing Bilibili API thumbnail URLs...\n');
    
    const response = await axios.get('https://api.bilibili.com/x/web-interface/search/type', {
      params: {
        search_type: 'video',
        keyword: '音乐',
        page: 1,
        order: 'totalrank',
        duration: 0,
        tids: 0,
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.bilibili.com',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
    });

    if (response.data.code === 0) {
      console.log('✅ API request successful\n');
      
      const results = response.data.data.result;
      console.log(`Found ${results.length} videos\n`);
      
      // Check first 3 videos
      for (let i = 0; i < Math.min(3, results.length); i++) {
        const video = results[i];
        console.log(`Video ${i + 1}:`);
        console.log(`  Title: ${video.title.replace(/<[^>]*>/g, '')}`);
        console.log(`  BV ID: ${video.bvid}`);
        console.log(`  Original pic: ${video.pic}`);
        
        // Process thumbnail URL
        let thumbnail = video.pic;
        if (thumbnail.startsWith('//')) {
          thumbnail = 'https:' + thumbnail;
        }
        console.log(`  Processed pic: ${thumbnail}`);
        
        // Test if thumbnail is accessible
        try {
          const imgResponse = await axios.head(thumbnail, {
            headers: {
              'Referer': 'https://www.bilibili.com',
            },
            timeout: 5000,
          });
          console.log(`  ✅ Thumbnail accessible (${imgResponse.status})`);
        } catch (error: any) {
          console.log(`  ❌ Thumbnail not accessible: ${error.message}`);
        }
        
        console.log('');
      }
    } else {
      console.error('❌ API error:', response.data.message);
    }
  } catch (error: any) {
    console.error('❌ Request failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testThumbnails();
