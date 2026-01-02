/**
 * Tests for SearchService
 */

import { SearchService } from './SearchService';
import { APIClient } from './APIClient';
import { SearchResponse } from '../types';

// Mock APIClient
jest.mock('./APIClient');

describe('SearchService', () => {
  let searchService: SearchService;
  let mockApiClient: jest.Mocked<APIClient>;

  // Sample API response (Bilibili format)
  const mockSearchResponse: SearchResponse = {
    code: 0,
    message: '0',
    ttl: 1,
    data: {
      seid: '12345678901234567890',
      page: 1,
      pagesize: 20,
      numResults: 100,
      numPages: 5,
      suggest_keyword: '',
      rqt_type: 'search',
      cost_time: {},
      exp_list: {},
      egg_hit: 0,
      result: [
        {
          type: 'video',
          id: 243082173,
          aid: 243082173,
          bvid: 'BV1234567890',
          title: 'Test Video 1',
          description: 'Test description',
          author: 'Test Author 1',
          mid: 12345,
          typeid: '193',
          typename: 'MV',
          arcurl: 'http://www.bilibili.com/video/av243082173',
          pic: '//i0.hdslb.com/bfs/archive/test1.jpg',
          play: 1000,
          video_review: 100,
          favorites: 50,
          tag: 'test,video',
          review: 20,
          pubdate: 1640000000,
          senddate: 1640000000,
          duration: '2:05',
          badgepay: false,
          hit_columns: ['title'],
          view_type: '',
          is_pay: 0,
          is_union_video: 0,
          rec_tags: null,
          new_rec_tags: [],
          rank_score: 100000,
        },
        {
          type: 'video',
          id: 243082174,
          aid: 243082174,
          bvid: 'BV0987654321',
          title: 'Test Video 2',
          description: 'Test description 2',
          author: 'Test Author 2',
          mid: 12346,
          typeid: '193',
          typename: 'MV',
          arcurl: 'http://www.bilibili.com/video/av243082174',
          pic: '//i0.hdslb.com/bfs/archive/test2.jpg',
          play: 2000,
          video_review: 200,
          favorites: 100,
          tag: 'test,video',
          review: 40,
          pubdate: 1640000000,
          senddate: 1640000000,
          duration: '1:01:05',
          badgepay: false,
          hit_columns: ['title'],
          view_type: '',
          is_pay: 0,
          is_union_video: 0,
          rec_tags: null,
          new_rec_tags: [],
          rank_score: 100000,
        },
      ],
      show_column: 0,
    },
  };

  beforeEach(() => {
    // Create mock API client
    mockApiClient = new APIClient() as jest.Mocked<APIClient>;
    mockApiClient.searchVideos = jest.fn();

    // Create search service with mock
    searchService = new SearchService(mockApiClient, {
      cacheTimeout: 1000, // 1 second for testing
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sanitizeQuery', () => {
    it('should trim whitespace from query', () => {
      const result = searchService.sanitizeQuery('  test query  ');
      expect(result).toBe('test query');
    });

    it('should remove control characters', () => {
      const result = searchService.sanitizeQuery('test\x00query\x1F');
      expect(result).toBe('testquery');
    });

    it('should collapse multiple spaces into single space', () => {
      const result = searchService.sanitizeQuery('test    query   here');
      expect(result).toBe('test query here');
    });

    it('should throw error for empty query', () => {
      expect(() => searchService.sanitizeQuery('')).toThrow('Search query cannot be empty');
    });

    it('should throw error for whitespace-only query', () => {
      expect(() => searchService.sanitizeQuery('   ')).toThrow('Search query cannot be empty');
    });

    it('should preserve Chinese characters', () => {
      const result = searchService.sanitizeQuery('测试视频');
      expect(result).toBe('测试视频');
    });

    it('should handle mixed content', () => {
      const result = searchService.sanitizeQuery('  测试 test 123  ');
      expect(result).toBe('测试 test 123');
    });
  });

  describe('search', () => {
    beforeEach(() => {
      mockApiClient.searchVideos.mockResolvedValue(mockSearchResponse);
    });

    it('should sanitize query before searching', async () => {
      await searchService.search('  test query  ');
      
      expect(mockApiClient.searchVideos).toHaveBeenCalledWith('test query', 1);
    });

    it('should return transformed search results', async () => {
      const result = await searchService.search('test');

      expect(result.videos).toHaveLength(2);
      expect(result.videos[0]).toEqual({
        id: 'BV1234567890',
        title: 'Test Video 1',
        thumbnail: 'https://i0.hdslb.com/bfs/archive/test1.jpg',
        duration: '2:05',
        uploader: 'Test Author 1',
        videoUrl: 'https://www.bilibili.com/video/BV1234567890',
      });
    });

    it('should format duration correctly for videos under 1 hour', async () => {
      const result = await searchService.search('test');
      expect(result.videos[0].duration).toBe('2:05');
    });

    it('should format duration correctly for videos over 1 hour', async () => {
      const result = await searchService.search('test');
      expect(result.videos[1].duration).toBe('1:01:05');
    });

    it('should calculate hasMore correctly when more results exist', async () => {
      const result = await searchService.search('test');
      
      // 100 total, page 1, 20 per page = more results available
      expect(result.hasMore).toBe(true);
      expect(result.totalCount).toBe(100);
    });

    it('should calculate hasMore correctly when no more results', async () => {
      const lastPageResponse: SearchResponse = {
        ...mockSearchResponse,
        data: {
          ...mockSearchResponse.data,
          page: 5,
          numPages: 5,
        },
      };
      mockApiClient.searchVideos.mockResolvedValue(lastPageResponse);

      const result = await searchService.search('test');
      
      // Page 5 of 5 = no more results
      expect(result.hasMore).toBe(false);
    });

    it('should cache search results', async () => {
      // First call
      await searchService.search('test');
      expect(mockApiClient.searchVideos).toHaveBeenCalledTimes(1);

      // Second call with same query should use cache
      await searchService.search('test');
      expect(mockApiClient.searchVideos).toHaveBeenCalledTimes(1);
    });

    it('should reset page to 1 on new search', async () => {
      await searchService.search('first query');
      expect(searchService.getCurrentPage()).toBe(1);

      await searchService.search('second query');
      expect(searchService.getCurrentPage()).toBe(1);
    });

    it('should update current query', async () => {
      await searchService.search('test query');
      expect(searchService.getCurrentQuery()).toBe('test query');
    });

    it('should throw error for empty query', async () => {
      await expect(searchService.search('')).rejects.toThrow('Search query cannot be empty');
    });
  });

  describe('loadMore', () => {
    beforeEach(() => {
      mockApiClient.searchVideos.mockResolvedValue(mockSearchResponse);
    });

    it('should throw error if no active search', async () => {
      await expect(searchService.loadMore()).rejects.toThrow('No active search query');
    });

    it('should increment page number', async () => {
      await searchService.search('test');
      expect(searchService.getCurrentPage()).toBe(1);

      await searchService.loadMore();
      expect(searchService.getCurrentPage()).toBe(2);
    });

    it('should use current query for pagination', async () => {
      await searchService.search('test query');
      await searchService.loadMore();

      expect(mockApiClient.searchVideos).toHaveBeenCalledWith('test query', 2);
    });

    it('should return transformed results', async () => {
      await searchService.search('test');
      const result = await searchService.loadMore();

      expect(result.videos).toHaveLength(2);
      expect(result.videos[0].id).toBe('BV1234567890');
    });

    it('should cache paginated results', async () => {
      await searchService.search('test');
      
      // First loadMore
      await searchService.loadMore();
      expect(mockApiClient.searchVideos).toHaveBeenCalledTimes(2);

      // Reset to page 1 and search again
      await searchService.search('test');
      
      // Load page 2 again - should use cache
      await searchService.loadMore();
      expect(mockApiClient.searchVideos).toHaveBeenCalledTimes(2); // No new call
    });
  });

  describe('cache management', () => {
    beforeEach(() => {
      mockApiClient.searchVideos.mockResolvedValue(mockSearchResponse);
    });

    it('should expire cache after timeout', async () => {
      // First search
      await searchService.search('test');
      expect(mockApiClient.searchVideos).toHaveBeenCalledTimes(1);

      // Wait for cache to expire (1 second + buffer)
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Second search should call API again
      await searchService.search('test');
      expect(mockApiClient.searchVideos).toHaveBeenCalledTimes(2);
    });

    it('should clear cache manually', async () => {
      await searchService.search('test');
      expect(mockApiClient.searchVideos).toHaveBeenCalledTimes(1);

      searchService.clearCache();

      await searchService.search('test');
      expect(mockApiClient.searchVideos).toHaveBeenCalledTimes(2);
    });

    it('should cache different queries separately', async () => {
      await searchService.search('query1');
      await searchService.search('query2');

      expect(mockApiClient.searchVideos).toHaveBeenCalledTimes(2);
      expect(mockApiClient.searchVideos).toHaveBeenCalledWith('query1', 1);
      expect(mockApiClient.searchVideos).toHaveBeenCalledWith('query2', 1);
    });

    it('should cache different pages separately', async () => {
      await searchService.search('test');
      await searchService.loadMore();

      expect(mockApiClient.searchVideos).toHaveBeenCalledTimes(2);
      expect(mockApiClient.searchVideos).toHaveBeenCalledWith('test', 1);
      expect(mockApiClient.searchVideos).toHaveBeenCalledWith('test', 2);
    });
  });

  describe('edge cases', () => {
    it('should handle empty search results', async () => {
      const emptyResponse: SearchResponse = {
        code: 0,
        message: '0',
        ttl: 1,
        data: {
          seid: '12345678901234567890',
          page: 1,
          pagesize: 20,
          numResults: 0,
          numPages: 0,
          suggest_keyword: '',
          rqt_type: 'search',
          cost_time: {},
          exp_list: {},
          egg_hit: 0,
          result: [],
          show_column: 0,
        },
      };
      mockApiClient.searchVideos.mockResolvedValue(emptyResponse);

      const result = await searchService.search('nonexistent');

      expect(result.videos).toHaveLength(0);
      expect(result.hasMore).toBe(false);
      expect(result.totalCount).toBe(0);
    });

    it('should handle API errors', async () => {
      mockApiClient.searchVideos.mockRejectedValue(new Error('API Error'));

      await expect(searchService.search('test')).rejects.toThrow('API Error');
    });

    it('should handle HTML tags in title', async () => {
      const htmlResponse: SearchResponse = {
        ...mockSearchResponse,
        data: {
          ...mockSearchResponse.data,
          result: [{
            ...mockSearchResponse.data.result[0],
            title: 'Test <em class="keyword">Video</em> Title',
          }],
        },
      };
      mockApiClient.searchVideos.mockResolvedValue(htmlResponse);

      const result = await searchService.search('test');
      expect(result.videos[0].title).toBe('Test Video Title');
    });

    it('should add https prefix to thumbnail URLs', async () => {
      // Use the default mock response which already has // prefix
      mockApiClient.searchVideos.mockResolvedValue(mockSearchResponse);
      
      const result = await searchService.search('test');
      expect(result.videos[0].thumbnail).toMatch(/^https:\/\//);
      expect(result.videos[0].thumbnail).toContain('i0.hdslb.com');
    });
  });
});
