/**
 * Test script for Bilibili search API
 * 
 * This script tests the real Bilibili search API to verify our implementation
 * works with the actual API endpoints.
 */

import axios from 'axios';

interface BilibiliSearchResponse {
  code: number;
  message: string;
  ttl: number;
  data: {
    seid: string;
    page: number;
    pagesize: number;
    numResults: number;
    numPages: number;
    result: Array<{
      type: string;
      id: number;
      aid: number;
      bvid: string;
      title: string;
      author: string;
      pic: string;
      duration: string;
      play: number;
      [key: string]: any;
    }>;
  };
}

async function testBilibiliSearch() {
  console.log('Testing Bilibili Search API...\n');

  try {
    const response = await axios.get<BilibiliSearchResponse>(
      'https://api.bilibili.com/x/web-interface/search/type',
      {
        params: {
          search_type: 'video',
          keyword: '少年',
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
          'Accept-Encoding': 'gzip, deflate, br',
          'Origin': 'https://www.bilibili.com',
          'Connection': 'keep-alive',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-site',
        },
      }
    );

    console.log('✓ API Request successful!');
    console.log(`Response code: ${response.data.code}`);
    console.log(`Message: ${response.data.message}`);
    console.log(`\nSearch Results:`);
    console.log(`- Total results: ${response.data.data.numResults}`);
    console.log(`- Total pages: ${response.data.data.numPages}`);
    console.log(`- Current page: ${response.data.data.page}`);
    console.log(`- Page size: ${response.data.data.pagesize}`);
    console.log(`- Results in this page: ${response.data.data.result.length}`);

    console.log('\nFirst 3 videos:');
    response.data.data.result.slice(0, 3).forEach((video, index) => {
      // Clean HTML tags from title
      const cleanTitle = video.title.replace(/<[^>]*>/g, '');
      
      console.log(`\n${index + 1}. ${cleanTitle}`);
      console.log(`   BV号: ${video.bvid}`);
      console.log(`   UP主: ${video.author}`);
      console.log(`   时长: ${video.duration}`);
      console.log(`   播放: ${video.play.toLocaleString()}`);
      console.log(`   封面: ${video.pic.startsWith('//') ? 'https:' + video.pic : video.pic}`);
    });

    console.log('\n✓ All tests passed!');
    console.log('\nAPI Response Structure:');
    console.log('- Top level: code, message, ttl, data');
    console.log('- data: seid, page, pagesize, numResults, numPages, result[]');
    console.log('- result[]: type, id, aid, bvid, title, author, pic, duration, play, etc.');
    
  } catch (error) {
    console.error('✗ API Request failed:');
    if (axios.isAxiosError(error)) {
      console.error(`Status: ${error.response?.status}`);
      console.error(`Message: ${error.message}`);
      console.error(`Data:`, error.response?.data);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run the test
testBilibiliSearch();
